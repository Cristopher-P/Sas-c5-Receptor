const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { Consumer } = require('sqs-consumer');

class SQSWorker {
    constructor(io) {
        this.io = io;
        this.queueUrl = process.env.AWS_SQS_QUEUE_URL;
        this.responseQueueUrl = process.env.AWS_SQS_RESPONSE_QUEUE_URL;
        this.queueUrl = process.env.AWS_SQS_QUEUE_URL;
        this.responseQueueUrl = process.env.AWS_SQS_RESPONSE_QUEUE_URL;
        this.pool = require('../config/database'); // Importar conexión
        this.isRunning = false;

        // Cliente SQS
        this.sqsClient = new SQSClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
    }

    start(reportesRef, saveCallback) {
        if (this.isRunning) return;
        
        console.log('Iniciando SQS Worker...');
        console.log('Escuchando cola:', this.queueUrl);
        // Ya no necesitamos referencias locales

        // Configurar Consumer de sqs-consumer
        // Nota: sqs-consumer simplifica el polling
        const app = Consumer.create({
            queueUrl: this.queueUrl,
            sqs: this.sqsClient,
            handleMessage: async (message) => {
                await this.procesarMensaje(message);
            }
        });

        app.on('error', (err) => {
            console.error('Error en SQS Worker:', err.message);
        });

        app.on('processing_error', (err) => {
            console.error('Error procesando mensaje:', err.message);
        });

        app.on('timeout_error', (err) => {
            console.error('Timeout procesando mensaje:', err.message);
        });

        app.start();
        this.isRunning = true;
        console.log('SQS Worker activo y esperando mensajes.');
    }

    async procesarMensaje(message) {
        try {
            console.log('Mensaje recibido de SQS');
            const body = JSON.parse(message.Body);
            
            // Procesar el reporte recibido
            await this.handleNewReport(body);
            
            // El mensaje se borra automáticamente si esta función termina sin error
        } catch (error) {
            console.error('Error parseando mensaje:', error);
            throw error; // Para que SQS lo reintente
        }
    }

    async handleNewReport(reporteData) {
        // Lógica similar a la que tenías en el POST /api/recepcion/c4
        
        // Generar Folio C5
        const fecha = new Date();
        const anio = fecha.getFullYear();
        // Usar la referencia de reportes en memoria
        const consecutivo = this.reportes.length + 1; 
        const folioC5 = `C5-${anio}-${consecutivo.toString().padStart(4, '0')}`;
        
        // Agregar datos de recepción
        const nuevoReporte = {
            ...reporteData,
            folio_c5: folioC5,
            recibido_at: new Date().toISOString(),
            status: 'recibido',
            origen: 'SQS'
        };

        // Guardar en MySQL
        const sql = `
            INSERT INTO reportes 
            (folio_c4, folio_c5, fecha, hora, motivo, ubicacion, descripcion, agente, operador, origen, status, recibido_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        try {
            await this.pool.execute(sql, [
                nuevoReporte.folio_c4,
                nuevoReporte.folio_c5,
                nuevoReporte.fecha,
                nuevoReporte.hora || nuevoReporte.hora_envio,
                nuevoReporte.motivo,
                nuevoReporte.ubicacion,
                nuevoReporte.descripcion,
                nuevoReporte.agente,
                nuevoReporte.operador,
                nuevoReporte.origen,
                nuevoReporte.status
            ]);
            console.log('Reporte guardado en MySQL:', nuevoReporte.folio_c4);
        } catch (error) {
            console.error('Error guardando en MySQL:', error.message);
            // Igual notificamos al dashboard aunque falle la DB (para visualización)
        }

        if (this.saveCallback) this.saveCallback();

        // Notificar al Dashboard (Socket.IO)
        console.log('Emitiendo new_report al dashboard');
        this.io.emit('new_report', nuevoReporte);

        // RESPUESTA AUTOMÁTICA DESHABILITADA (Ahora es manual desde el Dashboard)
        // if (this.responseQueueUrl && reporteData.folio_c4) {
        //     await this.enviarRespuestaC4(reporteData.folio_c4, folioC5);
        // }
    }

    async enviarRespuestaC4(folioC4, folioC5) {
        try {
            const payload = {
                tipo: 'RESPUESTA_FOLIO',
                folio_c4: folioC4,
                folio_c5: folioC5,
                timestamp: new Date().toISOString()
            };

            const params = {
                QueueUrl: this.responseQueueUrl,
                MessageBody: JSON.stringify(payload),
                MessageAttributes: {
                    "Tipo": { DataType: "String", StringValue: "RespuestaFolio" }
                }
            };
            
            const command = new SendMessageCommand(params);
            await this.sqsClient.send(command);
            console.log(`Respuesta enviada a C4: ${folioC4} -> ${folioC5}`);
            
        } catch (error) {
            console.error('Error enviando respuesta a C4:', error.message);
        }
    }
}

module.exports = SQSWorker;
