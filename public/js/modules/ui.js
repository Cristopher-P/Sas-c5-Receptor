/**
 * Módulo UI - Renderizado y manipulación del DOM
 */
import { API } from './api.js';

const feedContainer = document.getElementById('alerts-feed');

export const UI = {
    renderStats(reportes) {
        document.getElementById('count-today').textContent = reportes.length;
        const pendientes = reportes.filter(r => r.status !== 'confirmado').length;
        const atendidos = reportes.filter(r => r.status === 'confirmado').length;
        
        document.getElementById('count-pending').textContent = pendientes;
        document.getElementById('count-processed').textContent = atendidos;
    },

    clearFeed() {
        feedContainer.innerHTML = '';
    },

    showEmptyState() {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-satellite"></i>
                <br>Sistema C5 en línea.
                <br>Esperando transmisiones...
            </div>
        `;
    },

    removeEmptyState() {
        const empty = feedContainer.querySelector('.empty-state');
        if(empty) empty.remove();
    },

    renderReport(reporte, isNew = false) {
        this.removeEmptyState();

        // Verificar si ya existe para no duplicar
        if (document.getElementById(`card-${reporte.folio_c4}`)) return;

        const card = document.createElement('div');
        card.id = `card-${reporte.folio_c4}`;
        card.className = `alert-card ${isNew ? 'new' : ''} ${reporte.status === 'confirmado' ? 'confirmed' : ''}`;
        
        const isConfirmed = reporte.status === 'confirmado';
        
        card.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">
                    <span class="folio-badge">${reporte.folio_c5 || 'PENDIENTE'}</span>
                    <span>${reporte.motivo}</span>
                </div>
                <div class="alert-time">
                    <i class="far fa-clock"></i> ${reporte.hora || (reporte.hora_envio || '00:00').substring(0,5)}
                </div>
            </div>
            
            <div class="alert-meta">
                <div class="alert-field">
                    <i class="fas fa-hashtag"></i> 
                    <span>Folio C4: ${reporte.folio_c4}</span>
                </div>
                <div class="alert-field">
                    <i class="far fa-calendar-alt"></i> 
                    <span>Fecha: ${(reporte.fecha || '').split('T')[0]}</span>
                </div>
                <div class="alert-field">
                    <i class="fas fa-map-location-dot"></i> 
                    <span>Ubicación: ${reporte.ubicacion}</span>
                </div>
                <div class="alert-field">
                    <i class="fas fa-user-shield"></i> 
                    <span>Agente: ${reporte.agente || 'Sin unidad'}</span>
                </div>
                 <div class="alert-field">
                    <i class="fas fa-headset"></i> 
                    <span>Operador: ${reporte.operador || 'Sistema'}</span>
                </div>
                <div class="alert-field">
                    <i class="fas fa-server"></i> 
                    <span>Origen: ${reporte.origen || 'Desconocido'}</span>
                </div>
            </div>
            
            <div class="alert-desc">
                <strong>Descripción:</strong><br>
                ${reporte.descripcion}
            </div>

            <!-- Sección de Confirmación -->
            <div class="action-area" id="action-area-${reporte.folio_c4}">
                ${isConfirmed ? 
                    `<div class="confirmed-badge"><i class="fas fa-check-circle"></i> ENVIADO A C4</div>` : 
                    `
                    <div class="input-group">
                        <input type="text" 
                               id="input-${reporte.folio_c4}" 
                               class="folio-input" 
                               autocomplete="off"
                               value="${reporte.folio_c5 || ''}" 
                               placeholder="Folio C5">
                        <button class="btn-confirm" onclick="window.confirmarFolio('${reporte.folio_c4}')">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    `
                }
            </div>
        `;

        // Insertar al principio
        feedContainer.insertBefore(card, feedContainer.firstChild);
    },

    markAsConfirmed(folioC4) {
        const card = document.getElementById(`card-${folioC4}`);
        if(!card) return;

        card.classList.add('confirmed');
        // Remover clase 'new' si existe para que no parpadee rojo
        card.classList.remove('new');
        
        const actionArea = document.getElementById(`action-area-${folioC4}`);
        if(actionArea) {
            actionArea.innerHTML = `<div class="confirmed-badge"><i class="fas fa-check-circle"></i> ENVIADO A C4</div>`;
        }
    }
};

// Exponer función global para el onclick del HTML
window.confirmarFolio = async (folioC4) => {
    const input = document.getElementById(`input-${folioC4}`);
    const btn = input.nextElementSibling;
    const folioC5 = input.value;

    if (!folioC5) {
        Swal.fire({
            icon: 'warning',
            title: 'Folio incompleto',
            text: 'Por favor escribe un folio válido',
            confirmButtonColor: '#00fff2',
            background: '#0a192f',
            color: '#fff'
        });
        return;
    }

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btn.disabled = true;

        const result = await API.confirmarFolio(folioC4, folioC5);
        
        if (result.success) {
            UI.markAsConfirmed(folioC4);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al enviar: ' + result.message,
                background: '#0a192f',
                color: '#fff'
            });
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar a C4';
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Sin conexión',
            text: 'No se pudo conectar con el servidor',
            background: '#0a192f',
            color: '#fff'
        });
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar a C4';
        btn.disabled = false;
    }
};
