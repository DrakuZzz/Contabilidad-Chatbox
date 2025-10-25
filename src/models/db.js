import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '12345',
    database: 'contabilidad',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Probar conexión
const testConnection = async () => {
    try {
        const [rows] = await pool.query('SELECT 1');
        console.log('Connected to MySQL');
    } catch (err) {
        console.error('Error connecting to MySQL:', err);
    }
};

testConnection();
