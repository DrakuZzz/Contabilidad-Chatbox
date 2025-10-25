document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM cargado para estado de resultado - ¡Éxito!'); // Debug
    
    const btnCargar = document.getElementById('btnCargar');
    
    if (!btnCargar) {
        console.error('Error: No se encontró el botón btnCargar');
        return;
    }
    
    // Función para cargar y mostrar estados guardados
    function cargarEstadosGuardados() {
        const estados = JSON.parse(localStorage.getItem('estadosResultado') || '{}');  // Obtener todos los estados
        const contenedor = document.getElementById('listaEstados');
        contenedor.innerHTML = '<h2>Estados de Resultado Guardados</h2><ul>';
        for (const key in estados) {
            contenedor.innerHTML += `<li>Fecha: ${key} - <button onclick="verEstadoGuardado('${key}')">Ver</button></li>`;
        }
        contenedor.innerHTML += '</ul>';
    }
    
    // Función para ver un estado guardado
    window.verEstadoGuardado = (key) => {
        const estados = JSON.parse(localStorage.getItem('estadosResultado') || '{}');
        const data = estados[key];
        const contenedor = document.getElementById('estadoResultado');
        contenedor.innerHTML = `<h2>Estado para fecha: ${key}</h2>${generarTablaHTML(data)}`;
    };
    
    // Función para calcular y generar la tabla dinámicamente después de que el usuario envíe los datos
    function generarTablaDinamica() {
        const fechaEstado = document.getElementById('fechaEstado').value || 'No especificada';
        const ventasTotales = parseFloat(document.getElementById('ventasTotales').value) || 0;
        const compras = parseFloat(document.getElementById('compras').value) || 0;
        const gastosVenta = parseFloat(document.getElementById('gastosVenta').value) || 0;
        const gastosAdmin = parseFloat(document.getElementById('gastosAdmin').value) || 0;
        const inventarioInicial = 135000;  // Valor fijo
        
        const data = calcularEstado({
            ventasTotales,
            inventarioInicial,
            compras,
            gastosVenta,
            gastosAdmin
        });
        
        // Guardar en localStorage
        const estadosGuardados = JSON.parse(localStorage.getItem('estadosResultado') || '{}');
        estadosGuardados[fechaEstado] = data;  // Usar la fecha como clave
        localStorage.setItem('estadosResultado', JSON.stringify(estadosGuardados));
        
        const contenedor = document.getElementById('estadoResultado');
        contenedor.innerHTML = `
            <h2>Estado de Resultado para la fecha: ${fechaEstado}</h2>
            ${generarTablaHTML(data)}
        `;
        
        cargarEstadosGuardados();  // Actualizar la lista de estados guardados
    }
    
    // Función auxiliar para calcular el estado
    function calcularEstado(input) {
        const ventasNetas = input.ventasTotales;
        const comprasNetas = input.compras;
        const mercanciasDisponibles = comprasNetas + input.inventarioInicial;
        const inventarioFinal = mercanciasDisponibles;
        const utilidadBruta = ventasNetas;
        const gastosOperacion = input.gastosVenta + input.gastosAdmin;
        const utilidadOperacion = utilidadBruta - gastosOperacion;
        const utilidadAntesImpuestos = utilidadOperacion;
        const isr = utilidadAntesImpuestos * 0.30;
        const ptu = utilidadAntesImpuestos * 0.10;
        const utilidadNeta = utilidadAntesImpuestos - (isr + ptu);
        
        return {
            ventasTotales: input.ventasTotales,
            descuentosVentas: 0,
            devolucionesVentas: 0,
            rebajasVentas: 0,
            ventasNetas,
            inventarioInicial: input.inventarioInicial,
            compras: input.compras,
            gastosCompra: 0,
            comprasNetas,
            mercanciasDisponibles,
            inventarioFinal,
            costosVenta: 0,
            utilidadBruta,
            gastosVenta: input.gastosVenta,
            gastosAdmin: input.gastosAdmin,
            gastosOperacion,
            utilidadOperacion,
            utilidadAntesImpuestos,
            isr,
            ptu,
            utilidadNeta
        };
    }
    
    // Función auxiliar para generar el HTML de la tabla con correcciones dinámicas
    function generarTablaHTML(data) {
        const utilidadOperacionLabel = data.utilidadOperacion < 0 ? 'Pérdida por operación' : 'Utilidad por operación';
        const utilidadAntesImpuestosLabel = data.utilidadAntesImpuestos < 0 ? 'Pérdida antes de los impuestos' : 'Utilidad antes de los impuestos';
        
        let html = `
            <table>
                <tbody>
                    <tr><td>Ventas totales</td><td></td><td></td><td>${data.ventasTotales.toFixed(2)}</td><td></td></tr>
                    <tr><td>Descuentos s/ventas</td><td></td><td>0</td><td></td><td></td></tr>
                    <tr><td>Devoluciones s/ventas</td><td></td><td>0</td><td></td><td></td></tr>
                    <tr><td>Rebajas s/ventas</td><td></td><td>0</td><td>0</td><td></td></tr>
                    <tr><td>Ventas netas</td><td></td><td></td><td></td><td>${data.ventasNetas.toFixed(2)}</td></tr>
                    <tr><td>Inventario inicial</td><td></td><td></td><td>${data.inventarioInicial.toFixed(2)}</td><td></td></tr>
                    <tr><td>Compras</td><td>${data.compras.toFixed(2)}</td><td></td><td></td><td></td></tr>
                    <tr><td>Gastos de compra</td><td>0</td><td></td><td></td><td></td></tr>
                    <tr><td>Compras Totales</td><td></td><td>${data.compras.toFixed(2)}</td><td></td><td></td></tr>
                    <tr><td>Descuentos s/compras</td><td>0</td><td></td><td></td><td></td></tr>
                    <tr><td>Devoluciones s/compras</td><td>0</td><td></td><td></td><td></td></tr>
                    <tr><td>Rebajas s/compras</td><td>0</td><td>0</td><td></td><td></td></tr>
                    <tr><td>Compras Netas</td><td></td><td></td><td>${data.comprasNetas.toFixed(2)}</td><td></td></tr>
                    <tr><td>Mercancias disponibles</td><td></td><td></td><td>${data.mercanciasDisponibles.toFixed(2)}</td><td></td></tr>
                    <tr><td>Inventario final</td><td></td><td></td><td>${data.inventarioFinal.toFixed(2)}</td><td></td></tr>
                    <tr><td>Costos de venta</td><td></td><td></td><td></td><td>0</td></tr>
                    <tr><td>Utilidad bruta</td><td></td><td></td><td></td><td>${data.utilidadBruta.toFixed(2)}</td></tr>
                    <tr><td>Gastos de operacion</td><td></td><td></td><td></td><td></td></tr>
                    <tr><td>Gastos de venta</td><td></td><td></td><td>${data.gastosVenta.toFixed(2)}</td><td></td></tr>
                    <tr><td>Gastos de Admin</td><td></td><td></td><td>${data.gastosAdmin.toFixed(2)}</td><td>${data.gastosOperacion.toFixed(2)}</td></tr>
                    <tr><td>${utilidadOperacionLabel}</td><td></td><td></td><td></td><td>${data.utilidadOperacion.toFixed(2)}</td></tr>
                    <tr><td>${utilidadAntesImpuestosLabel}</td><td></td><td></td><td></td><td>${data.utilidadAntesImpuestos.toFixed(2)}</td></tr>
        `;
        
        // Agrega las filas de ISR, PTU y Utilidad neta solo si no hay pérdida
        if (data.utilidadAntesImpuestos >= 0) {
            html += `
                    <tr><td>ISR 30%</td><td></td><td></td><td></td><td>${data.isr.toFixed(2)}</td></tr>
                    <tr><td>PTU 10%</td><td></td><td></td><td></td><td>${data.ptu.toFixed(2)}</td></tr>
                    <tr><td>Utilidad neta</td><td></td><td></td><td></td><td>${data.utilidadNeta.toFixed(2)}</td></tr>
            `;
        }
        
        html += `</tbody></table>`;
        return html;
    }
    
    function crearEstadoResultado() {
        alert('Esta función no se usa sin backend.');
    }
    
    function listarEstadosResultado() {
        alert('Esta función no se usa sin backend.');
    }
    
    window.verEstadoGuardado = (key) => {
        const estados = JSON.parse(localStorage.getItem('estadosResultado') || '{}');
        const data = estados[key];
        const contenedor = document.getElementById('estadoResultado');
        contenedor.innerHTML = `<h2>Estado para fecha: ${key}</h2>${generarTablaHTML(data)}`;
    };
    
    window.verDetalle = () => {
        alert('Esta función no se usa sin backend.');
    };
    
    btnCargar.addEventListener('click', generarTablaDinamica);
    
    cargarEstadosGuardados();  // Carga los estados guardados al iniciar
});