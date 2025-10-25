import { pool } from "../models/db.js";

export const addApertura = async (req, res) => {
    try {
        const datos = req.body; // Array de { id_cuenta, Monto }

        if (!Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No se enviaron datos válidos"
            });
        }

        const values = [];
        for (const item of datos) {
            const { id_cuenta, Monto } = item;
            if (!id_cuenta || isNaN(Monto) || Monto <= 0) continue;
            values.push([id_cuenta, Monto]);
        }

        if (values.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No hay montos válidos para insertar"
            });
        }

        // Inserta o actualiza si ya existe
        const [result] = await pool.query(
            `
            INSERT INTO Apertura (id_cuenta, Monto)
            VALUES ?
            ON DUPLICATE KEY UPDATE Monto = VALUES(Monto)
            `,
            [values]
        );

        res.json({
            success: true,
            message: "Apertura registrada/actualizada con éxito",
            affectedRows: result.affectedRows
        });

    } catch (err) {
        console.error("Error al insertar/aperturar:", err);
        res.status(500).json({
            success: false,
            message: "Error al registrar la apertura"
        });
    }
};

// Obtener asiento inicial (Apertura + nombre de cuenta)
export const getDatos = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.id_cuenta, c.Cuenta, a.Monto
            FROM Apertura a
            INNER JOIN catalogo_cuentas c ON a.id_cuenta = c.id_cuenta
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error("Error al obtener asiento inicial:", err);
        res.status(500).json({
            success: false,
            message: "Error al obtener el asiento inicial"
        });
    }
};

export const deleteApertura = async (req, res) => {
    try {
        const { id_cuenta } = req.params;
        const [result] = await pool.query("DELETE FROM Apertura WHERE id_cuenta = ?", [id_cuenta]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Cuenta no encontrada en apertura" });
        }

        res.json({ success: true, message: "Cuenta eliminada correctamente" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al eliminar la apertura" });
    }
};

export const getAsiento = async (req, res) => {
    try {
        const [rows] = await pool.query(`
                SELECT c.Cuenta, a.Monto
                FROM Apertura a
                JOIN catalogo_cuentas c ON a.id_cuenta = c.id_cuenta
            `);

        const [total] = await pool.query(`
                SELECT SUM(Monto) AS total_activo FROM Apertura
            `);

        res.json({ success: true, data: rows, total: total[0].total_activo || 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error al obtener el asiento" });
    }
}