import { pool } from "../models/db.js";

export const getLibroDiario = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        let whereClause = '';
        const params = [];

        if (fechaInicio && fechaFin) {
            whereClause = 'WHERE f.fecha BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
        }

        // Agrego AND df.monto > 0 para excluir movimientos de 0 (opcional)
        const [rows] = await pool.query(`
            SELECT 
                f.id_factura,
                DATE_FORMAT(f.fecha, '%Y-%m-%d') AS fecha,  -- Formato consistente YYYY-MM-DD
                f.tipo,
                COALESCE(f.descripcion, '') AS descripcion,  -- Manejo de NULL
                df.id_cuenta,
                COALESCE(cc.Cuenta, 'Cuenta no asignada') AS cuenta,  -- Manejo de NULL
                df.monto,
                df.tipo_movimiento
            FROM Facturas f
            INNER JOIN Detalles_Factura df ON f.id_factura = df.id_factura  -- Cambio a INNER si quieres solo facturas con detalles
            LEFT JOIN catalogo_cuentas cc ON df.id_cuenta = cc.id_cuenta
            ${whereClause}
            AND df.monto > 0  -- Opcional: Excluye movimientos nulos/cero
            ORDER BY f.fecha, f.id_factura, df.id_detalle
        `, params);

        console.log(`Libro Diario: ${rows.length} transacciones encontradas para ${fechaInicio || 'todo el período'}`); // Debug opcional

        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error("Error al obtener libro diario:", err);
        res.status(500).json({
            success: false,
            message: "Error al obtener el libro diario: " + err.message  // Más detalle para debug
        });
    }
};

export const getLibroMayor = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ success: false, message: 'Faltan parámetros de fecha' });
        }

        let params = [fechaInicio, fechaFin];

        // Query para saldos iniciales: Apertura + movimientos ANTES del período
        const [rowsInicial] = await pool.query(`
            SELECT 
                cc.id_cuenta,
                cc.Cuenta AS nombre_cuenta,
                cc.id_categoria,  -- Para ordenamiento futuro
                (COALESCE(a.Monto, 0) + 
                 COALESCE(prev.saldo_previo, 0)) AS saldo_inicial_neto
            FROM catalogo_cuentas cc
            LEFT JOIN Apertura a ON cc.id_cuenta = a.id_cuenta
            LEFT JOIN (
                SELECT 
                    df2.id_cuenta,
                    (COALESCE(SUM(CASE WHEN df2.tipo_movimiento = 'debe' THEN df2.monto ELSE 0 END), 0) - 
                     COALESCE(SUM(CASE WHEN df2.tipo_movimiento = 'haber' THEN df2.monto ELSE 0 END), 0)) AS saldo_previo
                FROM Detalles_Factura df2
                INNER JOIN Facturas f2 ON df2.id_factura = f2.id_factura
                WHERE f2.fecha < ?
                GROUP BY df2.id_cuenta
            ) prev ON cc.id_cuenta = prev.id_cuenta
            ORDER BY COALESCE(cc.id_categoria, 0), cc.id_cuenta
        `, [fechaInicio]);

        // Query para movimientos del período: Detallados por cuenta, separados en Debe y Haber
        // Formatear fecha a DD/MM/YYYY para evitar ISO strings (ej. 2025-08-22T06:00:00.000Z)
        // NOTA: Ya incluye f.id_factura para rastrear el origen del movimiento
        const [rowsMovimientos] = await pool.query(`
            SELECT 
                df.id_cuenta,
                cc.Cuenta AS nombre_cuenta,
                DATE_FORMAT(f.fecha, '%d/%m/%Y') AS fecha,  -- Formato legible: DD/MM/YYYY
                f.fecha AS fecha_original,  -- Campo oculto para ordenamiento en JS (si es necesario)
                f.id_factura,  -- ID de la factura para rastreo (ya devuelto en el JSON)
                df.tipo_movimiento,
                df.monto,
                COALESCE(f.descripcion, 'Sin descripción') AS descripcion  -- Asume campo descripcion en Facturas; ajusta si es diferente
            FROM Detalles_Factura df
            INNER JOIN Facturas f ON df.id_factura = f.id_factura
            INNER JOIN catalogo_cuentas cc ON df.id_cuenta = cc.id_cuenta
            WHERE f.fecha BETWEEN ? AND ?
            ORDER BY f.fecha ASC, df.id_cuenta, df.tipo_movimiento
        `, params);

        // Log opcional para debug: Verificar que id_factura se está enviando
        console.log('Ejemplo de movimiento con id_factura:', rowsMovimientos[0] || 'Sin movimientos');

        // Procesar datos: Para cada cuenta, agrupar saldo inicial y movimientos
        const cuentasMap = new Map();
        rowsInicial.forEach(inicial => {
            const saldoNeto = parseFloat(inicial.saldo_inicial_neto);
            const tipoInicial = saldoNeto > 0 ? 'debe' : (saldoNeto < 0 ? 'haber' : null);
            const montoInicial = Math.abs(saldoNeto);

            cuentasMap.set(inicial.id_cuenta, {
                id_cuenta: inicial.id_cuenta,
                nombre_cuenta: inicial.nombre_cuenta,
                id_categoria: inicial.id_categoria,
                saldo_inicial: {
                    monto: tipoInicial ? montoInicial : 0,
                    tipo: tipoInicial
                },
                movimientos_debe: [],
                movimientos_haber: [],
                total_debe: 0,
                total_haber: 0
            });
        });

        // Agrupar movimientos por cuenta y tipo
        rowsMovimientos.forEach(mov => {
            const cuenta = cuentasMap.get(mov.id_cuenta);
            if (!cuenta) return;  // Si no tiene saldo inicial pero tiene movimientos, agrégala (opcional: inicialízala aquí)

            const movObj = {
                fecha: mov.fecha,  // Ya formateada como 'DD/MM/YYYY'
                fecha_original: mov.fecha_original,  // Para ordenamiento en JS si es necesario
                id_factura: mov.id_factura,  // Ya incluido: ID de la factura para rastreo en frontend
                descripcion: mov.descripcion,
                monto: parseFloat(mov.monto)
            };

            if (mov.tipo_movimiento === 'debe') {
                cuenta.movimientos_debe.push(movObj);
                cuenta.total_debe += movObj.monto;
            } else if (mov.tipo_movimiento === 'haber') {
                cuenta.movimientos_haber.push(movObj);
                cuenta.total_haber += movObj.monto;
            }
        });

        // Calcular saldo final para cada cuenta
        const data = Array.from(cuentasMap.values()).map(cuenta => {
            // Incluir saldo inicial en totales
            if (cuenta.saldo_inicial.tipo === 'debe') {
                cuenta.total_debe += cuenta.saldo_inicial.monto;
            } else if (cuenta.saldo_inicial.tipo === 'haber') {
                cuenta.total_haber += cuenta.saldo_inicial.monto;
            }

            const saldoFinalNeto = cuenta.total_debe - cuenta.total_haber;
            const tipoFinal = saldoFinalNeto > 0 ? 'debe' : (saldoFinalNeto < 0 ? 'haber' : null);
            const montoFinal = Math.abs(saldoFinalNeto);

            return {
                ...cuenta,
                saldo_final: {
                    monto: tipoFinal ? montoFinal : 0,
                    tipo: tipoFinal
                }
            };
        }).filter(cuenta =>
            cuenta.saldo_inicial.monto > 0 ||
            cuenta.movimientos_debe.length > 0 ||
            cuenta.movimientos_haber.length > 0 ||
            cuenta.saldo_final.monto > 0
        );

        // Ordenar por categoría y cuenta
        data.sort((a, b) => {
            const catA = a.id_categoria || 0;
            const catB = b.id_categoria || 0;
            if (catA !== catB) return catA - catB;
            return a.id_cuenta - b.id_cuenta;
        });

        res.json({
            success: true,
            data: data
        });
    } catch (err) {
        console.error("Error al obtener libro mayor:", err);
        res.status(500).json({
            success: false,
            message: "Error al obtener el libro mayor: " + err.message // Más detalle para debug
        });
    }
};

export const getBalanzaComprobacion = async (req, res) => {
    console.log('API balanza-comprobacion llamada con params:', req.query);  // Log para debug
    try {
        const { fechaFin } = req.query;
        let movimientoWhere = '';  // Cláusula WHERE para subquery de movimientos
        const params = [];

        if (fechaFin) {
            movimientoWhere = 'WHERE f.fecha <= ?';
            params.push(fechaFin);
        }

        // Subquery para calcular movimientos por cuenta (deudor/acreedor hasta fechaFin) - SOLO movimientos del período
        const movimientoSubquery = `
            SELECT 
                df.id_cuenta,
                COALESCE(SUM(CASE WHEN df.tipo_movimiento = 'debe' THEN df.monto ELSE 0 END), 0) AS mov_deudor_periodo,
                COALESCE(SUM(CASE WHEN df.tipo_movimiento = 'haber' THEN df.monto ELSE 0 END), 0) AS mov_acreedor_periodo
            FROM Detalles_Factura df
            INNER JOIN Facturas f ON df.id_factura = f.id_factura
            ${movimientoWhere}
            GROUP BY df.id_cuenta
        `;

        // Query principal: TODAS las cuentas, LEFT JOIN a Apertura y subquery de movimientos
        // (Sin modificaciones en DB: todo se hardcodea después en el procesamiento)
        const [rows] = await pool.query(`
            SELECT 
                cc.id_cuenta,
                cc.id_categoria,  -- Para ordenamiento (de tu esquema; se puede sobrescribir para Capital si es necesario)
                cc.Cuenta AS nombre_cuenta,
                -- Saldo inicial de Apertura (normal, sin hardcode aquí)
                COALESCE(a.Monto, 0) AS saldo_apertura_neto,  -- Usamos neto temporal para procesar después
                -- Movimientos del período (solo del subquery)
                COALESCE(m.mov_deudor_periodo, 0) AS mov_deudor_periodo,
                COALESCE(m.mov_acreedor_periodo, 0) AS mov_acreedor_periodo
            FROM catalogo_cuentas cc
            LEFT JOIN Apertura a ON cc.id_cuenta = a.id_cuenta
            LEFT JOIN (${movimientoSubquery}) m ON cc.id_cuenta = m.id_cuenta
            ORDER BY COALESCE(cc.id_categoria, 0), cc.id_cuenta  -- Orden por categoría y cuenta
        `, params);  // Solo un param si hay fechaFin

        // DEBUG: Loguea todos los nombres de cuentas para identificar Capital Social
        console.log('Nombres de cuentas en el catálogo (buscando "capital"):');
        rows.forEach(row => {
            const nombreLower = row.nombre_cuenta.toLowerCase();
            if (nombreLower.includes('capital')) {
                console.log(`- ID ${row.id_cuenta}: "${row.nombre_cuenta}" (categoría ${row.id_categoria})`);
            }
        });

        // NO FILTRAR: Devuelve TODAS las cuentas, pero procesa y hardcodea Capital Social DIRECTAMENTE AQUÍ (sin tocar DB)
        const data = rows.map(row => {
            // Lógica normal para cada cuenta
            const saldoAperturaNeto = parseFloat(row.saldo_apertura_neto || 0);
            const saldoAperturaDeudor = saldoAperturaNeto > 0 ? saldoAperturaNeto : 0;
            const saldoAperturaAcreedor = saldoAperturaNeto < 0 ? Math.abs(saldoAperturaNeto) : 0;
            const movDeudorPeriodo = parseFloat(row.mov_deudor_periodo || 0);
            const movAcreedorPeriodo = parseFloat(row.mov_acreedor_periodo || 0);

            // Cálculos normales
            const movDeudorTotal = saldoAperturaDeudor + movDeudorPeriodo;
            const movAcreedorTotal = saldoAperturaAcreedor + movAcreedorPeriodo;
            const saldoNeto = movDeudorTotal - movAcreedorTotal;
            const saldoDeudorFinal = saldoNeto > 0 ? saldoNeto : 0;
            const saldoAcreedorFinal = saldoNeto < 0 ? Math.abs(saldoNeto) : 0;

            // HARDCODE ESPECÍFICO PARA CAPITAL SOCIAL: Sobrescribe valores directamente en el código
            // Mejora: Detección case-insensitive y más flexible (busca 'capital' en cualquier parte)
            let idCategoria = row.id_categoria || null;
            let saldoAperturaDeudorOut = saldoAperturaDeudor.toFixed(2);
            let saldoAperturaAcreedorOut = saldoAperturaAcreedor.toFixed(2);
            let movDeudorPeriodoOut = movDeudorPeriodo.toFixed(2);
            let movAcreedorPeriodoOut = movAcreedorPeriodo.toFixed(2);
            let movDeudorTotalOut = movDeudorTotal.toFixed(2);
            let movAcreedorTotalOut = movAcreedorTotal.toFixed(2);
            let saldoDeudorFinalOut = saldoDeudorFinal.toFixed(2);
            let saldoAcreedorFinalOut = saldoAcreedorFinal.toFixed(2);

            const nombreLower = row.nombre_cuenta.toLowerCase();
            const esCapitalSocial = nombreLower.includes('capital') || nombreLower.includes('patrimonio');  // Más flexible: busca 'capital' o 'patrimonio'
            if (esCapitalSocial) {
                console.log(`HARDCODE detectado para cuenta: "${row.nombre_cuenta}" (ID ${row.id_cuenta}) - Aplicando valores fijos.`);

                // HARDCODE: Fuerza valores para Capital Social (2,950,000 en Haber/Acreedor)
                // Saldo inicial: 0 Deudor, 2,950,000 Acreedor
                saldoAperturaDeudorOut = '0.00';
                saldoAperturaAcreedorOut = '2950000.00';
                // Movimientos del período: Fuerza a 0 para simplicidad (ignora reales; ajusta si quieres sumarlos)
                // Si quieres mantener movimientos reales: usa movDeudorPeriodo.toFixed(2) en lugar de '0.00'
                movDeudorPeriodoOut = '0.00';
                movAcreedorPeriodoOut = '0.00';
                // Totales: Inicial hardcodeado + período (aquí forzado a 0)
                movDeudorTotalOut = (0 + 0).toFixed(2);  // '0.00'
                movAcreedorTotalOut = (2950000 + 0).toFixed(2);  // '2950000.00'
                // Saldos finales: Basado en totales (neto = 0 - 2950000 = -2950000 → saldo_acreedor = 2950000)
                const saldoNetoHardcoded = parseFloat(movDeudorTotalOut) - parseFloat(movAcreedorTotalOut);
                saldoDeudorFinalOut = saldoNetoHardcoded > 0 ? saldoNetoHardcoded.toFixed(2) : '0.00';
                saldoAcreedorFinalOut = saldoNetoHardcoded < 0 ? Math.abs(saldoNetoHardcoded).toFixed(2) : '0.00';

                // Opcional: Hardcodear id_categoria para clasificación (ej. 3 = Patrimonio, no activo)
                // Esto no afecta la DB, solo el output (puedes usarlo para frontend o reordenar data)
                idCategoria = 3;  // <-- AJUSTA AL ID DE PATRIMONIO EN TU ESQUEMA (ej. 3)

                console.log(`HARDCODE aplicado exitosamente a "${row.nombre_cuenta}": saldo_apertura_acreedor = ${saldoAperturaAcreedorOut}, mov_acreedor = ${movAcreedorTotalOut}, saldo_acreedor = ${saldoAcreedorFinalOut}`);
            }

            return {
                id_cuenta: row.id_cuenta,
                id_categoria: idCategoria,  // Puede ser hardcodeado para Capital
                nombre_cuenta: row.nombre_cuenta,
                saldo_apertura_deudor: saldoAperturaDeudorOut,
                saldo_apertura_acreedor: saldoAperturaAcreedorOut,
                mov_deudor_periodo: movDeudorPeriodoOut,  // Opcional
                mov_acreedor_periodo: movAcreedorPeriodoOut,  // Opcional
                mov_deudor: movDeudorTotalOut,  // Total: inicial + movimientos debe
                mov_acreedor: movAcreedorTotalOut,  // Total: inicial + movimientos haber (hardcode 2950000 base para Capital)
                saldo_deudor: saldoDeudorFinalOut,  // Saldo final deudor (lo que sobra)
                saldo_acreedor: saldoAcreedorFinalOut  // Saldo final acreedor (lo que sobra: 2950000 para Capital)
            };
        });

        // Opcional: Reordenar data por id_categoria hardcodeada (para que Capital vaya al final como Patrimonio)
        // Esto asegura orden correcto sin tocar DB
        data.sort((a, b) => (a.id_categoria || 0) - (b.id_categoria || 0));

        // Logs para verificar
        const [conteoDB] = await pool.query('SELECT COUNT(*) as total FROM catalogo_cuentas');
        const totalCuentasDB = conteoDB[0].total;
        console.log(`Catálogo total en DB: ${totalCuentasDB} cuentas`);
        console.log(`Balanza devuelta: ${data.length} cuentas hasta ${fechaFin || 'inicio'}`);

        // Log específico para Capital Social (hardcodeado) - Búsqueda flexible
        const capitalSocial = data.find(d => {
            const nombreLower = d.nombre_cuenta.toLowerCase();
            return nombreLower.includes('capital') || nombreLower.includes('patrimonio');
        });
        if (capitalSocial) {
            console.log('Capital Social (HARDCODEADO):', {
                id_cuenta: capitalSocial.id_cuenta,
                nombre: capitalSocial.nombre_cuenta,
                id_categoria: capitalSocial.id_categoria,  // Hardcodeado a Patrimonio
                saldo_apertura_acreedor: capitalSocial.saldo_apertura_acreedor,  // Debe ser 2950000.00
                mov_acreedor: capitalSocial.mov_acreedor,  // Debe ser 2950000.00
                saldo_acreedor: capitalSocial.saldo_acreedor,  // Debe ser 2950000.00
                nota: 'Valores hardcodeados directamente en código (sin inserción en DB). Clasificado como Patrimonio.'
            });
        } else {
            console.warn('Capital Social NO encontrado en la balanza después de hardcode. Verifica si existe en catalogo_cuentas (ej. SELECT * FROM catalogo_cuentas WHERE Cuenta LIKE "%capital%";).');
        }

        if (data.length > 0) {
            console.log('Ejemplo primera cuenta:', data[0]);
            const cuentaCero = data.find(d => parseFloat(d.mov_deudor) === 0 && parseFloat(d.mov_acreedor) === 0 && parseFloat(d.saldo_deudor) === 0 && parseFloat(d.saldo_acreedor) === 0);
            console.log('Ejemplo cuenta con 0s:', cuentaCero || 'Ninguna encontrada');
        }

        res.json({
            success: true,
            data: data
        });
    } catch (err) {
        console.error("Error al obtener balanza de comprobación:", err);
        res.status(500).json({
            success: false,
            message: "Error al obtener la balanza de comprobación: " + err.message
        });
    }
};

export const getBalanceGeneral = async (req, res) => {
    try {
        const [saldos] = await pool.query(`
            SELECT 
                c.id_cuenta, 
                c.Cuenta, 
                cat.nombre AS Categoria, 
                sub.nombre AS Subcategoria, 
                spf.saldo
            FROM catalogo_cuentas c
            LEFT JOIN categorias cat ON c.id_categoria = cat.id_categoria
            LEFT JOIN subcategorias sub ON c.id_subcategoria = sub.id_subcategoria
            LEFT JOIN Saldos_Por_Factura spf ON c.id_cuenta = spf.id_cuenta
            ORDER BY cat.nombre, sub.nombre
        `);

        const balanceGeneral = {
            Activo: {
                ActivoCirculante: [],
                sumaActivoCirculante: { columna3: 0 },
                ActivoNoCirculante: [],
                sumaActivoNoCirculante: { columna3: 0 },
                TotalActivo: { columna4: 0 }
            },
            Pasivos: {
                PasivosALargoPlazo: [],
                TotalPasivo: { columna4: 0 }
            },
            Capital: {
                CapitalSocial: { columna2: 2950000 },
                UtilidadNeta: { columna2: 0 },
                TotalCapital: { columna4: 0 },
                TotalPasivoCapital: { columna4: 0 }
            }
        };

        // Procesar Activo Circulante
        const activoCirculanteSaldos = saldos.filter(s => s.Subcategoria === 'Activo Circulante');
        let sumaActivoCirculante = 0;
        activoCirculanteSaldos.forEach((cuenta, index) => {
            const valor = parseFloat(cuenta.saldo) || 0;
            balanceGeneral.Activo.ActivoCirculante.push({ cuenta: cuenta.Cuenta, columna2: valor });
            sumaActivoCirculante += valor;
            if (index === activoCirculanteSaldos.length - 1) {
                balanceGeneral.Activo.ActivoCirculante[index].columna3 = sumaActivoCirculante;
            }
        });
        balanceGeneral.Activo.sumaActivoCirculante.columna3 = sumaActivoCirculante;

        // Procesar Activo No Circulante con depreciaciones
        const activoNoCirculanteSaldos = saldos.filter(s => s.Subcategoria === 'Activo No circulante');
        let sumaActivoNoCirculanteColumna2 = 0;
        const depreciaciones = ['Depreciacion de Edificio', 'Depreciacion de Mobiliario y equipo',
            'Depreciacion de Equipo de computo', 'Depreciacion de Entrega y reparto',
            'Depreciacion de Equipo de transporte', 'Depreciacion de Gastos de instalacion'];

        activoNoCirculanteSaldos.forEach(cuenta => {
            if (depreciaciones.includes(cuenta.Cuenta)) {
                const valorDepreciacion = parseFloat(cuenta.saldo) || 0;
                const indiceAnterior = balanceGeneral.Activo.ActivoNoCirculante.length - 1;
                if (indiceAnterior >= 0) {
                    const cuentaAnterior = balanceGeneral.Activo.ActivoNoCirculante[indiceAnterior];
                    const resta = (cuentaAnterior.columna1 || 0) - valorDepreciacion;
                    balanceGeneral.Activo.ActivoNoCirculante.push({
                        cuenta: cuenta.Cuenta,
                        columna1: valorDepreciacion,
                        columna2: resta
                    });
                    sumaActivoNoCirculanteColumna2 += resta;
                }
            } else {
                balanceGeneral.Activo.ActivoNoCirculante.push({
                    cuenta: cuenta.Cuenta,
                    columna1: parseFloat(cuenta.saldo) || 0
                });
            }
        });
        balanceGeneral.Activo.sumaActivoNoCirculante.columna3 = sumaActivoNoCirculanteColumna2;
        balanceGeneral.Activo.TotalActivo.columna4 = sumaActivoCirculante + sumaActivoNoCirculanteColumna2;

        // Procesar Pasivos
        const pasivosSaldos = saldos.filter(s => s.Subcategoria === 'Pasivo a largo plazo');
        let totalPasivo = 0;
        pasivosSaldos.forEach(cuenta => {
            const valor = parseFloat(cuenta.saldo) || 0;
            balanceGeneral.Pasivos.PasivosALargoPlazo.push({ cuenta: cuenta.Cuenta, columna2: valor });
            totalPasivo += valor;
        });
        balanceGeneral.Pasivos.TotalPasivo.columna4 = totalPasivo;
        balanceGeneral.Capital.UtilidadNeta.columna2 = saldos.filter(s => s.Categoria === 'Ingresos').reduce((acc, s) => acc + (parseFloat(s.saldo) || 0), 0) -
            saldos.filter(s => s.Categoria === 'Gastos').reduce((acc, s) => acc + (parseFloat(s.saldo) || 0), 0);
        balanceGeneral.Capital.TotalCapital.columna4 = balanceGeneral.Capital.CapitalSocial.columna2 + balanceGeneral.Capital.UtilidadNeta.columna2;
        balanceGeneral.Capital.TotalPasivoCapital.columna4 = totalPasivo + balanceGeneral.Capital.TotalCapital.columna4;

        res.json({ success: true, data: balanceGeneral });
    } catch (err) {
        console.error("Error al generar Balance General:", err);
        res.status(500).json({ success: false, message: "Error interno al generar Balance General" });
    }
};