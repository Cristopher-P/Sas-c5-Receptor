require('./config/database').execute(`
INSERT INTO reportes 
(folio_c4, folio_c5, fecha, hora, motivo, ubicacion, descripcion, agente, operador, origen, status, recibido_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    ['C4-001', 'C5-001', '2026-02-23', '14:00', 'Robo', 'Tehuacan', 'X', 'Agente1', 'Op1', 'SQS', 'recibido']).then(() => console.log('OK')).catch(e => console.log('ERR', e)); process.exit();
