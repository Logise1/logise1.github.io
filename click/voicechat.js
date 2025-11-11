import { getDomElements } from './ui_handlers.js';
import { getCurrentUsername, getUserId } from './game_logic.js';

// URL base del servicio de chat de voz
const VOICE_CHAT_BASE_URL = "https://logise1.github.io/voicechat";

// Estado local
let isConnected = false;
let isMuted = false;

/**
 * Función para inicializar el módulo de chat de voz.
 * Obtiene las referencias del DOM y prepara el estado inicial.
 */
export function initializeVoiceChat() {
    const { joinVoiceChatBtn, voiceChatBtn } = getDomElements();
    
    // Aseguramos que el botón de voz en la pestaña del chat existe y está visible.
    if (voiceChatBtn) {
        voiceChatBtn.style.display = 'inline-flex';
    }
    
    // El botón principal de la subpestaña está controlado en ui_handlers.js
}

/**
 * Alterna la conexión/desconexión del chat de voz.
 * @param {boolean} forceDisconnect Si es verdadero, fuerza la desconexión.
 */
export async function toggleVoiceChat(forceDisconnect = false) {
    const { voiceStatus, joinVoiceChatBtn, voiceChatIframeContainer } = getDomElements();
    const username = getCurrentUsername();
    
    // Solo permitir conectar si hay un usuario logueado
    if (!username && !forceDisconnect) {
        voiceStatus.textContent = "Error: Debes iniciar sesión para unirte.";
        return;
    }

    if (isConnected || forceDisconnect) {
        // --- Desconectar ---
        isConnected = false;
        isMuted = false;

        // Quitar el iframe (desconexión)
        voiceChatIframeContainer.innerHTML = '';
        voiceChatIframeContainer.style.display = 'none';
        
        // Actualizar UI
        voiceStatus.textContent = "Desconectado. Pulsa 'Unirse' para entrar al chat.";
        joinVoiceChatBtn.textContent = "Unirse a Voz";
        joinVoiceChatBtn.classList.remove('active');
        joinVoiceChatBtn.disabled = false; // El usuario está logueado, se puede unir
        
    } else {
        // --- Conectar ---
        
        // 1. Construir la URL del iframe con el nombre de usuario
        const url = `${VOICE_CHAT_BASE_URL}?appid=clicker&username=${encodeURIComponent(username)}`;

        // 2. Crear y añadir el iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.allow = "microphone; speaker; autoplay"; // Permisos necesarios
        
        voiceChatIframeContainer.innerHTML = '';
        voiceChatIframeContainer.appendChild(iframe);
        voiceChatIframeContainer.style.display = 'block'; // Mostrar el contenedor

        isConnected = true;
        
        // 3. Actualizar UI
        voiceStatus.textContent = "Conectado. Haz clic en el iframe para interactuar.";
        joinVoiceChatBtn.textContent = "Desconectar";
        joinVoiceChatBtn.classList.add('active');
    }
}

/**
 * Alterna el estado de silenciar el micrófono (aunque la funcionalidad es controlada por el iframe,
 * esta función se deja como un stub si fuera necesario controlarlo desde el padre).
 */
export function toggleMute() {
    // Esta función no es necesaria ya que el control del micrófono
    // se hace dentro del propio iframe de voicechat.
    console.log("Mute/Unmute no controlado desde el padre. Usa los controles del iframe.");
}