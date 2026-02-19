/**
 * Módulo Socket - Manejo de eventos en tiempo real
 */

export function initSocket(socket, callbacks) {
    socket.on('connect', () => {
        console.log('socket connected');
        if (callbacks.onConnect) callbacks.onConnect();
    });

    socket.on('load_reports', (reportes) => {
        if (callbacks.onLoadReports) callbacks.onLoadReports(reportes);
    });

    socket.on('new_report', (reporte) => {
        if (callbacks.onNewReport) callbacks.onNewReport(reporte);
    });

    socket.on('report_confirmed', (data) => {
        if (callbacks.onReportConfirmed) callbacks.onReportConfirmed(data);
    });
}
