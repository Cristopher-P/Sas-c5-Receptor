CREATE DATABASE IF NOT EXISTS sas_c5_db;
USE sas_c5_db;

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
