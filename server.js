require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Permitir conexiones desde cualquier origen (ajustar en prod)
        methods: ["GET", "POST"]
    }
});

// Almacenamiento simple en memoria (y persistencia en JSON)
const DB_FILE = path.join(__dirname, 'storage.json');
let reportes = [];

// Cargar reportes al iniciar
if (fs.existsSync(DB_FILE)) {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        reportes = JSON.parse(data);
    } catch (err) {
        console.error('Error leyendo DB:', err);
    }
} else {
    // Crear archivo si no existe
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

// Socket.io conexiones
io.on('connection', (socket) => {
    console.log('Cliente conectado al dashboard:', socket.id);
    
    // Enviar reportes existentes al conectar
    socket.emit('load_reports', reportes);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Endpoint para confirmación manual de Folio C5
app.post('/api/confirmar-folio', async (req, res) => {
    try {
        const { folio_c4, folio_c5 } = req.body;
        
        if (!folio_c4 || !folio_c5) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }

        console.log(`📝 Confirmando folio manual: ${folio_c4} -> ${folio_c5}`);

        // 1. Actualizar en memoria local
        const reporteIndex = reportes.findIndex(r => r.folio_c4 === folio_c4);
        if (reporteIndex !== -1) {
            reportes[reporteIndex].folio_c5 = folio_c5;
            reportes[reporteIndex].status = 'confirmado'; // Nuevo estado
            guardarDB();
            
            // Notificar a todos los dashboards que se confirmó
            io.emit('report_confirmed', { folio_c4, folio_c5 });
        }

        // 2. Enviar a C4 vía SQS (Usando el método del worker)
        await worker.enviarRespuestaC4(folio_c4, folio_c5);

        res.json({ success: true, message: 'Folio confirmado y enviado a C4' });

    } catch (error) {
        console.error('Error confirmando folio:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Inicializar SQS Worker
const SQSWorker = require('./services/SQSWorker');
const worker = new SQSWorker(io);

// Función auxiliar para guardar (Restaurada)
function guardarDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(reportes, null, 2));
}

// Iniciar worker cuando el servidor esté listo
// Se le pasa la referencia a 'reportes' y la función 'guardarDB'
try {
    worker.start(reportes, guardarDB);
} catch (err) {
    console.error('Error iniciando Worker SQS:', err);
    console.log('Nota: Asegúrate de configurar las credenciales AWS en .env');
}

// Iniciar servidor
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR C5 (RECEPTOR) CORRIENDO EN PUERTO ${PORT}`);
    console.log(`👉 Dashboard: http://localhost:${PORT}`);
    console.log(`⚡ Modo: AWS SQS Polling Activo\n`);
});
