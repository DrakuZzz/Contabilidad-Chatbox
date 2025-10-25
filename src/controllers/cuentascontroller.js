import { pool } from "../models/db.js";

// Obtener cuentas con categoría y subcategoría
export const getCuentas = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                cc.id_cuenta,
                cc.Cuenta,
                c.nombre AS Categoria,
                s.nombre AS Subcategoria
            FROM catalogo_cuentas cc
            LEFT JOIN categorias c ON cc.id_categoria = c.id_categoria
            LEFT JOIN subcategorias s ON cc.id_subcategoria = s.id_subcategoria
        `);

        // Devolvemos exactamente lo que necesitas
        const cuentas = rows.map(c => ({
            id_cuenta: c.id_cuenta,
            Cuenta: c.Cuenta,
            Categoria: c.Categoria,
            Subcategoria: c.Subcategoria ?? "—"
        }));

        res.json(cuentas);
    } catch (err) {
        console.error("Error al obtener cuentas:", err);
        res.status(500).json({ error: "Error al obtener cuentas" });
    }
};

export const addCuentas = async (req, res) => {
    try {
        const { Cuenta, Numero, tipo } = req.body;

        let id_categoria = null;
        if (Numero.startsWith("1.")) {
            id_categoria = 1;
        } else if (Numero.startsWith("2.")) {
            id_categoria = 2;
        } else if (Numero.startsWith("3.")) {
            id_categoria = 3;
        } else {
            id_categoria = 0;
        }

        // Verificar si ya existe la cuenta por nombre o número
        const [rows] = await pool.query(
            "SELECT * FROM catalogo_cuentas WHERE Cuenta = ? OR id_cuenta = ?",
            [Cuenta, Numero]
        );

        if (rows.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: "La cuenta ya existe en el catálogo" 
            });
        }

        // Si no existe, insertamos
        const [result] = await pool.query(
            "INSERT INTO catalogo_cuentas (Cuenta, id_cuenta, id_subcategoria, id_categoria) VALUES (?, ?, ?, ?)",
            [Cuenta, Numero, tipo, id_categoria]
        );

        // Recuperar el registro recién insertado
        const [newCuenta] = await pool.query(
            "SELECT * FROM catalogo_cuentas WHERE id_cuenta = ?",
            [result.insertId]
        );

        res.json({
            success: true,
            message: "Cuenta registrada con éxito",
            data: newCuenta[0]
        });

    } catch (err) {
        console.error("Error al insertar cuenta:", err);
        res.status(500).json({ 
            success: false,
            message: "Error al insertar cuenta" 
        });
    }
};