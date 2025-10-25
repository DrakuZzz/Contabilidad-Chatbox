import { pool } from "../models/db.js";
// Registrar factura con detalles (sin actualizar saldos automáticamente)
export const addFactura = async (req, res) => {
    try {
        const { tipo, fecha, subtotal, iva, total, descripcion, detalles } = req.body;
        if (!tipo || !fecha || !subtotal || !iva || !total || !Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({ success: false, message: "Datos incompletos o inválidos" });
        }
        const [resultFactura] = await pool.query(
            `INSERT INTO Facturas (tipo, fecha, subtotal, iva, total, descripcion) VALUES (?, ?, ?, ?, ?, ?)`,
            [tipo, fecha, subtotal, iva, total, descripcion || null]
        );
        const id_factura = resultFactura.insertId;
        const valuesDetalles = detalles.map(d => [
            id_factura,
            d.id_cuenta,
            d.monto,
            d.tipo_movimiento
        ]);
        await pool.query(
            `INSERT INTO Detalles_Factura (id_factura, id_cuenta, monto, tipo_movimiento) VALUES ?`,
            [valuesDetalles]
        );
        // NO SE EJECUTA CALL GuardarSaldosDespuesFactura AQUÍ
        // Esto evita que se genere automáticamente el balance general
        res.json({ success: true, message: "Factura registrada con éxito", id_factura });
    } catch (err) {
        console.error("Error al registrar factura:", err);
        res.status(500).json({ success: false, message: "Error interno al registrar factura" });
    }
};

// Obtener todas las facturas
export const getFacturas = async (req, res) => {
    try {
        const [facturas] = await pool.query(`SELECT * FROM Facturas ORDER BY fecha DESC`);
        res.json({ success: true, data: facturas });
    } catch (err) {
        console.error("Error al obtener facturas:", err);
        res.status(500).json({ success: false, message: "Error interno al obtener facturas" });
    }
};

// Obtener detalles de una factura
export const getDetallesFactura = async (req, res) => {
    try {
        const { id_factura } = req.params;

        const [detalles] = await pool.query(`
            SELECT df.*, cc.Cuenta, cc.id_categoria
            FROM Detalles_Factura df
            JOIN catalogo_cuentas cc ON df.id_cuenta = cc.id_cuenta
            WHERE df.id_factura = ?
        `, [id_factura]);

        res.json({ success: true, data: detalles });
    } catch (err) {
        console.error("Error al obtener detalles de factura:", err);
        res.status(500).json({ success: false, message: "Error interno al obtener detalles" });
    }
};

// Ejecutar procedimiento almacenado para guardar saldos después de una factura
export const guardarSaldosDespuesFactura = async (req, res) => {
    try {
        const { id_factura } = req.params;

        if (!id_factura) {
            return res.status(400).json({ success: false, message: "ID de factura requerido" });
        }

        await pool.query("CALL GuardarSaldosDespuesFactura(?)", [id_factura]);

        res.json({ success: true, message: "Saldos guardados correctamente para la factura " + id_factura });
    } catch (err) {
        console.error("Error al guardar saldos después de factura:", err);
        res.status(500).json({ success: false, message: "Error interno al guardar saldos" });
    }
};

// Obtener saldos por factura (unión Facturas + Saldos_Por_Factura + catalogo_cuentas)
export const getSaldosPorFactura = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                f.id_factura,
                f.tipo,
                f.fecha,
                f.subtotal,
                f.iva,
                f.total,
                f.descripcion,
                c.id_cuenta,
                c.Cuenta,
                c.id_categoria,
                spf.saldo
            FROM Facturas f
            JOIN Saldos_Por_Factura spf ON f.id_factura = spf.id_factura
            JOIN catalogo_cuentas c ON spf.id_cuenta = c.id_cuenta
            ORDER BY f.id_factura, c.id_cuenta
        `);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Error al obtener saldos por factura:", err);
        res.status(500).json({ success: false, message: "Error interno al obtener saldos" });
    }
};