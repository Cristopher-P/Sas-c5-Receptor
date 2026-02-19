/**
 * SAS C5 Receptor - Main App
 */
import { initSocket } from './modules/socket.js';
import { UI } from './modules/ui.js';

const socket = io();

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SAS C5 Receptor iniciado');
    
    // Configurar reloj
    const clockElement = document.getElementById('clock');
    setInterval(() => {
        clockElement.textContent = new Date().toLocaleTimeString();
    }, 1000);

    // Configurar Sonido
    let soundEnabled = false;
    const btnSound = document.getElementById('btn-sound');
    const audioPlayer = document.getElementById('alert-sound');

    btnSound.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        const icon = btnSound.querySelector('i');
        
        if (soundEnabled) {
            btnSound.classList.remove('btn-warning');
            btnSound.classList.add('btn-success'); // Or remain warning but active
            btnSound.style.background = 'var(--accent-green)'; // Optional inline override or just rely on class
            icon.className = 'fas fa-volume-up';
            btnSound.title = 'Sonido: ENCENDIDO';
            
            audioPlayer.play().catch(e => console.log('Audio init error', e));
        } else {
            btnSound.classList.add('btn-warning');
            btnSound.classList.remove('btn-success');
            btnSound.style.background = ''; 
            icon.className = 'fas fa-volume-mute';
            btnSound.title = 'Sonido: APAGADO';
        }
    });

    // Inicializar Socket con Callbacks de UI
    initSocket(socket, {
        onConnect: () => console.log('✅ Conectado al servidor'),
        
        onLoadReports: (reportes) => {
            UI.clearFeed();
            if(reportes.length === 0) {
                UI.showEmptyState();
            } else {
                reportes.forEach(r => UI.renderReport(r, false));
                UI.renderStats(reportes);
            }
        },

        onNewReport: (reporte) => {
            if(soundEnabled) {
                audioPlayer.currentTime = 0;
                audioPlayer.play().catch(e => console.error('Error audio:', e));
            }
            UI.renderReport(reporte, true);
            // Actualizar contadores si es necesario, o esperar al siguiente load
        },

        onReportConfirmed: (data) => {
            console.log('Reporte confirmado:', data);
            UI.markAsConfirmed(data.folio_c4);
        }
    });

    // Manejo de Navegación (Sidebar)
    const menuTehuacan = document.getElementById('menu-tehuacan');
    const menuOtros = document.getElementById('menu-otros');
    const viewTehuacan = document.getElementById('view-tehuacan');
    const viewError = document.getElementById('view-error');

    menuTehuacan.addEventListener('click', () => {
        menuTehuacan.classList.add('active');
        menuOtros.classList.remove('active');
        
        viewTehuacan.classList.remove('hidden');
        viewError.classList.add('hidden');
    });

    menuOtros.addEventListener('click', () => {
        menuOtros.classList.add('active');
        menuTehuacan.classList.remove('active');
        
        viewTehuacan.classList.add('hidden');
        viewError.classList.remove('hidden');
    });
});
