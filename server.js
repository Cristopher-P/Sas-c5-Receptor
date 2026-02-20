require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
app.disable('etag'); // Deshabilitar 304 Not Modified
const server = http.createServer(app);

// Configuración de CORS y Seguridad
app.use(helmet({
    contentSecurityPolicy: false // Desactivar CSP por ahora para evitar conflictos con scripts inline/externos en dev
}));
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Session Configuration
const session = require('express-session');
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
});
app.use(sessionMiddleware);

// Public Static Files (CSS, JS, Sounds)
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/sounds', express.static(path.join(__dirname, 'public/sounds')));

// Login Routes
app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple check against .env
    const validUser = process.env.ADMIN_USER || 'admin';
    const validPass = process.env.ADMIN_PASS || 'admin123';

    if (username === validUser && password === validPass) {
        req.session.authenticated = true;
        req.session.user = username;
        return res.json({ success: true });
    }
    
    res.json({ success: false, message: 'Credenciales incorrectas' });
});

// Endpoint para verificar estado de sesión (usado por el cliente para evitar "back button")
app.get('/api/session-status', (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Authentication Middleware
function checkAuth(req, res, next) {
    // Prevent caching of protected routes
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

// Protect all following routes (Dashboard)
app.use(checkAuth);

// Main Dashboard (Protected)
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Compartir sesión express con Socket.io
const sharedSession = (socket, next) => sessionMiddleware(socket.request, {}, next);
io.use(sharedSession);

// Middleware de autenticación para WebSockets
io.use((socket, next) => {
    const session = socket.request.session;
    if (session && session.authenticated) {
        next();
    } else {
        console.log('🚫 Conexión de socket denegada (No autenticado)');
        next(new Error("unauthorized"));
    }
});

// Base de Datos
const pool = require('./config/database');

// Socket.io conexiones
io.on('connection', async (socket) => {
    console.log('Cliente conectado al dashboard:', socket.id);
    
    try {
        // Cargar reportes desde MySQL
        const [rows] = await pool.query('SELECT * FROM reportes ORDER BY id DESC LIMIT 50');
        socket.emit('load_reports', rows);
    } catch (error) {
        console.error('Error cargando reportes iniciales:', error);
    }

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

        // 1. Actualizar en Base de Datos
        const [result] = await pool.execute(
            'UPDATE reportes SET folio_c5 = ?, status = ?, fecha_confirmacion = NOW() WHERE folio_c4 = ?',
            [folioC5, 'confirmado', folioC4]
        );

        if (result.affectedRows > 0) {
            // Notificar a todos los dashboards
            io.emit('report_confirmed', { folio_c4, folio_c5 });
             
            // 2. Enviar a C4
            await worker.enviarRespuestaC4(folio_c4, folioC5);
            
            res.json({ success: true, message: 'Folio confirmado y enviado a C4' });
        } else {
            res.status(404).json({ success: false, message: 'Reporte no encontrado' });
        }

    } catch (error) {
        console.error('Error confirmando folio:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Catch-all route for 404 (Página no encontrada)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

// Inicializar SQS Worker
const SQSWorker = require('./services/SQSWorker');
const worker = new SQSWorker(io);



// Iniciar worker cuando el servidor esté listo
// Se le pasa solo el pool implícitamente por el módulo
try {
    worker.start();
} catch (err) {
    console.error('Error iniciando Worker SQS:', err);
    console.log('Nota: Asegúrate de configurar las credenciales AWS en .env');
}

// Iniciar servidor
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`\nSERVIDOR C5 (RECEPTOR) CORRIENDO EN PUERTO ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}`);
    console.log(`Modo: AWS SQS Polling Activo\n`);
});
