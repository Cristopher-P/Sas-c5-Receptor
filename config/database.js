const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool sin especificar base de datos (para crearla si no existe)
const setupPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
});

// Pool principal de la aplicación
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función de auto-configuración
(async () => {
    try {
        console.log('⏳ Verificando Base de Datos MySQL...');

        // 1. Crear base de datos si no existe
        await setupPool.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        console.log(`✅ Base de datos "${process.env.DB_NAME}" verificada/creada.`);

        // 2. Crear tabla si no existe usando el pool principal
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reportes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                folio_c4 VARCHAR(50) NOT NULL UNIQUE,
                folio_c5 VARCHAR(50),
                fecha DATETIME,
                hora VARCHAR(10),
                motivo VARCHAR(100),
                ubicacion VARCHAR(255),
                descripcion TEXT,
                agente VARCHAR(100),
                operador VARCHAR(100),
                origen VARCHAR(50),
                status VARCHAR(20) DEFAULT 'recibido',
                recibido_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_confirmacion DATETIME
            );
        `);
        console.log('✅ Tabla "reportes" verificada/creada exitosamente.');

        // Cerrar el pool de inicialización
        await setupPool.end();
        console.log('🔌 Conectado a MySQL (Pool C5). Listo para recibir datos.');

    } catch (error) {
        console.error('❌ Error crítico de MySQL. Revisa tus credenciales en el archivo .env o asegúrate de que MySQL (XAMPP/WAMP) esté encendido.', error.message);
    }
})();

module.exports = pool;
