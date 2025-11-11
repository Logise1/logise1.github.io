import { voiceDb, ref, set, onValue, onDisconnect } from './config.js';
import { getUserId, getCurrentUsername } from './game_logic.js';
import { getDomElements } from './ui_handlers.js';

// --- CONSTANTES ---
const ROOM_ID = 'public_channel'; // Un único canal para todos los jugadores
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// --- VARIABLES DE ESTADO DE VOZ ---
let isVoiceChatActive = false;
let isMicMuted = false;
let localStream = null;
let peerConnections = {};
let listeners = {}; 
let localAudioTrack = null; // Referencia a la pista de audio local
let voiceUsers = {}; // Para almacenar la lista de usuarios conectados al chat de voz

// --- ELEMENTOS DOM ---
let voiceStatus, joinVoiceChatBtn, muteMicBtn, micOnIcon, micOffIcon, voiceUsersStatus, voiceUsersList;

function getVoiceDomElements() {
    if (!voiceStatus) {
        const elements = getDomElements();
        voiceStatus = elements.voiceStatus;
        joinVoiceChatBtn = elements.joinVoiceChatBtn;
        muteMicBtn = elements.muteMicBtn;
        micOnIcon = elements.micOnIcon;
        micOffIcon = elements.micOffIcon;
        voiceUsersStatus = elements.voiceUsersStatus;
        voiceUsersList = elements.voiceUsersList;
    }
}

// --- FUNCIÓN PRINCIPAL DE CONEXIÓN Y DESCONEXIÓN ---

export function initializeVoiceChat() {
    getVoiceDomElements(); // Asegurarse de que los elementos DOM estén cargados
    
    if (!joinVoiceChatBtn) {
        console.error("Botones de chat de voz no encontrados");
        return;
    }

    // --- INICIO: CORRECCIÓN ---
    // NO llamamos a updateVoiceUI aquí.
    // El estado inicial de la UI se gestionará mediante el listener onAuthStateChanged
    // en ui_handlers.js para evitar el race condition.
    // --- FIN: CORRECCIÓN ---
    
    // Iniciar escucha solo de presencia, incluso si no estamos conectados
    if (!listeners.users) { // Se quita el chequeo de getUserId() aquí
        startVoicePresenceListener();
    }
}

/**
 * Conecta o desconecta el chat de voz.
 * @param {boolean} forceDisconnect Si es true, desconecta sin importar el estado actual (usado al hacer logout).
 */
export async function toggleVoiceChat(forceDisconnect = false) {
    if (forceDisconnect && isVoiceChatActive) {
        disconnectVoiceChat(true);
        return;
    }
    
    // Si intentamos conectar sin estar logueados, mostramos el mensaje de error.
    if (!getUserId() && !isVoiceChatActive) {
         updateVoiceUI(false, true); // Forzar el mensaje de "Necesitas iniciar sesión"
         return;
    }
    
    if (isVoiceChatActive) {
        disconnectVoiceChat(false);
    } else {
        await connectVoiceChat();
    }
}

async function connectVoiceChat() {
    const userId = getUserId();
    if (!userId || isVoiceChatActive) return;

    try {
        voiceStatus.textContent = "Solicitando micrófono...";
        joinVoiceChatBtn.disabled = true;
        muteMicBtn.disabled = true;
        
        // 1. Obtener acceso al micrófono
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localAudioTrack = localStream.getAudioTracks()[0]; // Guardar referencia a la pista
        
        isVoiceChatActive = true;
        isMicMuted = false;
        
        // 2. Establecer presencia de voz en la base de datos de voz
        const userRef = ref(voiceDb, `${ROOM_ID}/${userId}`);
        set(userRef, { 
            username: getCurrentUsername(),
            timestamp: Date.now(),
            isMuted: isMicMuted
        });
        onDisconnect(userRef).remove();

        // 3. Iniciar el listener de señalización
        startVoiceSignaling();
        
        // 4. Actualizar UI
        updateVoiceUI(true);

        console.log("Chat de Voz activado.");

    } catch (error) {
        console.error("Error al iniciar el chat de voz:", error);
        voiceStatus.textContent = "Error: No se pudo acceder al micrófono. Asegúrate de tener permisos.";
        joinVoiceChatBtn.disabled = false;
        muteMicBtn.disabled = true;
        isVoiceChatActive = false;
    }
}

function disconnectVoiceChat(isLogout = false) {
    if (!isVoiceChatActive) return;
    
    // 1. Cerrar todas las Peer Connections
    Object.values(peerConnections).forEach(pc => {
        if (pc) pc.close();
    });
    peerConnections = {};
    
    // 2. Detener la pista local
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        localAudioTrack = null;
    }
    
    // 3. Eliminar presencia de la base de datos de voz
    const userId = getUserId();
    if (userId) {
        set(ref(voiceDb, `${ROOM_ID}/${userId}`), null);
        set(ref(voiceDb, `signals/${userId}`), null);
    }
    
    // 4. Limpiar listeners (sólo señalización)
    if (listeners.signals) {
        listeners.signals(); // Desuscribirse
        delete listeners.signals;
    }
    
    // No limpiamos listeners.users porque queremos seguir viendo quién se conecta
    // y permitir al usuario unirse de nuevo.
    
    isVoiceChatActive = false;
    isMicMuted = false;
    updateVoiceUI(false, isLogout);
    
    console.log("Chat de Voz desactivado.");
}

// --- INICIO: CORRECCIÓN ---
// Exportar la función directamente (inline)
export function toggleMute() {
// --- FIN: CORRECCIÓN ---
    if (!isVoiceChatActive || !localAudioTrack) return;
    const userId = getUserId();

    isMicMuted = !isMicMuted;
    localAudioTrack.enabled = !isMicMuted; // Mutear/Desmutear la pista de audio

    // Actualizar el estado en Firebase
    set(ref(voiceDb, `${ROOM_ID}/${userId}/isMuted`), isMicMuted);

    updateVoiceUI(true); // Refrescar UI de muteo
}


// --- LÓGICA DE SEÑALIZACIÓN (SIGNALING) ---

function startVoicePresenceListener() {
    // Escuchar la presencia de otros usuarios (usuarios que se unen/salen)
    const usersRef = ref(voiceDb, ROOM_ID);
    listeners.users = onValue(usersRef, (snapshot) => {
        const users = snapshot.val() || {};
        voiceUsers = users; // Actualizar la lista global de usuarios en el chat
        
        // Solo proceder con la lógica de conexión P2P si el usuario local está conectado
        if (isVoiceChatActive) {
            const userId = getUserId();
            const userIds = Object.keys(users).filter(uid => uid !== userId);
    
            // Conectar con nuevos usuarios (si somos el que tiene el ID más bajo, iniciamos la oferta)
            userIds.forEach(remoteId => {
                if (!peerConnections[remoteId]) {
                    // Criterio de ofrecedor: si nuestro ID es lexicográficamente menor que el remoto.
                    const isOfferer = userId < remoteId; 
                    createPeerConnection(remoteId, isOfferer);
                }
            });
    
            // Desconectar usuarios que se fueron
            Object.keys(peerConnections).forEach(remoteId => {
                if (!users[remoteId]) {
                    closePeerConnection(remoteId);
                }
            });
        }
        
        updateVoiceUserList(); // Actualizar la lista visible para todos
    });
}

function startVoiceSignaling() {
    const userId = getUserId();
    
    // Escuchar ofertas y respuestas (signals) - SÓLO cuando estamos conectados
    const signalsRef = ref(voiceDb, `signals/${userId}`);
    listeners.signals = onValue(signalsRef, (snapshot) => {
        const signals = snapshot.val();
        if (signals) {
            Object.keys(signals).forEach(async (remoteId) => {
                const signal = signals[remoteId];
                if (signal) {
                    await handleSignal(remoteId, signal);
                    // Eliminar la señal después de procesarla
                    set(ref(voiceDb, `signals/${userId}/${remoteId}`), null);
                }
            });
        }
    });
}

async function handleSignal(remoteId, signal) {
    if (!peerConnections[remoteId]) {
        // Si no tenemos PC, y recibimos una oferta, la creamos y respondemos (isOfferer=false)
        if (signal.type === 'offer' && isVoiceChatActive) {
            await createPeerConnection(remoteId, false); 
        } else {
            return;
        }
    }
    
    const pc = peerConnections[remoteId];
    
    try {
        if (signal.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            
            if (signal.type === 'offer') {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal(remoteId, { type: 'answer', sdp: pc.localDescription.toJSON() });
            }
        } else if (signal.ice) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
        }
    } catch (e) {
        console.error(`Error manejando señal de ${remoteId}:`, e);
    }
}

function sendSignal(remoteId, signal) {
    const userId = getUserId();
    const signalRef = ref(voiceDb, `signals/${remoteId}/${userId}`);
    set(signalRef, signal);
}


// --- LÓGICA DE PEER CONNECTION ---

async function createPeerConnection(remoteId, isOfferer) {
    if (!isVoiceChatActive) return; // No crear conexiones si no estamos activos

    console.log(`Creando PeerConnection con ${remoteId}, isOfferer: ${isOfferer}`);
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections[remoteId] = pc;

    // 1. Añadir pistas locales
    if (localStream) {
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
    }

    // 2. Manejar candidatos ICE
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            sendSignal(remoteId, { ice: event.candidate.toJSON() });
        }
    };
    
    // 3. Manejar pistas remotas (Reproducción de audio)
    pc.ontrack = (event) => {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.srcObject = event.streams[0];
        // Ocultamos el elemento de audio, pero mantenemos su funcionalidad
        audio.style.display = 'none'; 
        document.body.appendChild(audio); 
        
        pc.remoteAudioElement = audio; // Guardar referencia para cerrar
        console.log(`Pista de audio remota recibida de ${remoteId}.`);
    };

    // 4. Manejar cambios de estado de la conexión
    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
            console.log(`Conexión con ${remoteId} cerrada. Estado: ${pc.iceConnectionState}`);
            closePeerConnection(remoteId);
        }
    };

    // 5. Crear oferta si somos los que inician
    if (isOfferer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(remoteId, { type: 'offer', sdp: pc.localDescription.toJSON() });
    }
}

function closePeerConnection(remoteId) {
    const pc = peerConnections[remoteId];
    if (pc) {
        pc.close();
        
        // Remover elemento de audio
        if (pc.remoteAudioElement) {
            pc.remoteAudioElement.remove();
        }
        delete peerConnections[remoteId];
        console.log(`Conexión Peer cerrada y limpiada para ${remoteId}`);
    }
}


// --- LÓGICA DE ACTUALIZACIÓN DE UI ---

function updateVoiceUI(isConnected, isLogout = false) {
    getVoiceDomElements(); // Asegurar elementos DOM
    
    const userId = getUserId();
    
    if (isConnected) {
        // Estado CONECTADO
        voiceStatus.textContent = "Conectado. Hablando con otros jugadores.";
        
        // Botón principal (Salir)
        joinVoiceChatBtn.textContent = "Salir";
        joinVoiceChatBtn.style.backgroundColor = '#dc3545';
        joinVoiceChatBtn.disabled = false;
        
        // Botón de mute
        muteMicBtn.disabled = false;
        muteMicBtn.classList.toggle('active', isMicMuted);
        micOnIcon.style.display = isMicMuted ? 'none' : 'block';
        micOffIcon.style.display = isMicMuted ? 'block' : 'none';
        
    } else {
        // Estado DESCONECTADO
        if (!userId || isLogout) {
            // Usuario NO logueado o acaba de cerrar sesión (Tu mensaje recurrente)
            voiceStatus.textContent = "Desconectado. Necesitas iniciar sesión para unirte.";
            joinVoiceChatBtn.disabled = true;
            muteMicBtn.disabled = true;
            joinVoiceChatBtn.textContent = "Unirse";
            joinVoiceChatBtn.style.backgroundColor = '#28a745';
        } else {
            // Usuario SÍ logueado pero desconectado del chat de voz
            voiceStatus.textContent = "Desconectado. Pulsa 'Unirse' para entrar al chat.";
            joinVoiceChatBtn.textContent = "Unirse";
            joinVoiceChatBtn.style.backgroundColor = '#28a745';
            joinVoiceChatBtn.disabled = false;
            muteMicBtn.disabled = true;
        }
        
        // Botón de mute (desactivado)
        muteMicBtn.classList.remove('active');
        micOnIcon.style.display = 'block';
        micOffIcon.style.display = 'none';
        
        // Borrar lista de usuarios si no hay nadie conectado O si no está logueado
        if (!userId || !isConnected) {
            voiceUsersList.innerHTML = '';
            voiceUsersStatus.textContent = "Usuarios conectados: 0";
        }
    }
    
    updateVoiceUserList();
}

function updateVoiceUserList() {
    getVoiceDomElements(); // Asegurar elementos DOM
    const currentUserId = getUserId();
    
    voiceUsersList.innerHTML = '';
    const activeUsers = Object.keys(voiceUsers).length;
    voiceUsersStatus.textContent = `Usuarios conectados: ${activeUsers}`;

    Object.entries(voiceUsers).forEach(([uid, data]) => {
        if (!data || !data.username) return; // Evitar entradas nulas

        const isSelf = uid === currentUserId;
        const isMuted = data.isMuted === true;

        const li = document.createElement('li');
        
        const statusDot = document.createElement('span');
        statusDot.classList.add('voice-user-status');
        
        let statusClass = 'mic-on';
        if (isSelf && isMuted) {
            statusClass = 'self-muted';
        } else if (isMuted) {
            statusClass = 'mic-muted';
        }
        statusDot.classList.add(statusClass);

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('voice-user-name');
        nameSpan.textContent = data.username + (isSelf ? " (Tú)" : "");

        li.appendChild(statusDot);
        li.appendChild(nameSpan);
        
        voiceUsersList.appendChild(li);
    });
}


// --- EXPORTAR FUNCIONES CLAVE ---
// initializeVoiceChat() se llama desde ui_handlers.js
// startVoicePresenceListener() se llama al inicializar voicechat.js
startVoicePresenceListener();

// --- INICIO: CORRECCIÓN ---
// Eliminar el bloque 'export { ... }' redundante.
// Las funciones ya están exportadas (inline)
// --- FIN: CORRECCIÓN ---