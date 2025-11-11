import { 
    UPGRADES_CONFIG, SKINS_CONFIG, 
    auth, db, ref, set, query, onValue, onAuthStateChanged, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onDisconnect, // << CORREGIDO: Funciones de Auth importadas
    _DateNow, _MathFloor, _MathMin, 
} from './config.js';
import { 
    score, clickPower, pps, level, xp, xpToNextLevel, levelMultiplier, totalScore,
    isShiftPressed, isBanned, isGameLoaded,
    getUserId, getCurrentUsername, setAuthState, setIsShiftPressed, setIsGameLoaded, autoSaveInterval, 
    currentSkin, coins, skinsState, upgradeLevels, globalPresence, banExpiresAt, setGlobalPresence, 
    resetGameState, recalculateStats, calculateMultiBuyCost, 
    handleManualClick, gameLoop, loadGameState, saveScore, loadLeaderboard,
    formatNumber, formatTime, initializeChat, triggerBan, checkBanStatus, buyUpgrade,
    setCurrentSkin, setCoins, updateSkinsState, spendCoins, sendChatMessage
} from './game_logic.js';

// Declarar toggleVoiceChat y initializeVoiceChat aquí
// Se asegura que por defecto las funciones sean asíncronas para poder usar 'await' sin problemas.
let toggleVoiceChat = async () => console.warn("La función de chat de voz no está disponible (no cargada).");
let toggleMute = () => console.warn("toggleMute no se ha cargado.");
let initializeVoiceChat = () => console.warn("initializeVoiceChat no se ha cargado.");


// Objeto para almacenar referencias a elementos DOM, inicializado una vez.
const DOM = {
    // Stats
    scoreDisplay: document.getElementById('score'),
    ppsDisplay: document.getElementById('pps'),
    cpcDisplay: document.getElementById('cpc'),
    levelDisplay: document.getElementById('level-display'),
    xpBar: document.getElementById('xp-bar'),
    clickButton: document.getElementById('click-button'),
    clickerZone: document.getElementById('clicker-zone'),
    
    // Tienda
    storeCpcContainer: document.getElementById('store-items-cpc-container'),
    storePpsContainer: document.getElementById('store-items-pps-container'),
    storeClickMultContainer: document.getElementById('store-items-click-mult-container'),
    storeAutoMultContainer: document.getElementById('store-items-auto-mult-container'),
    storeSynergyContainer: document.getElementById('store-items-synergy-container'),
    storeBonusContainer: document.getElementById('store-items-bonus-container'),
    storeOtherContainer: document.getElementById('store-items-other-container'),
    
    // Skins
    coinsDisplay: document.getElementById('coins-amount'),
    skinsGrid: document.getElementById('skins-grid'),
    
    // Navegación
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    subTabButtons: document.querySelectorAll('.sub-tab-btn'),
    subTabContents: document.querySelectorAll('.sub-tab-content'),
    mobileTabButtons: document.querySelectorAll('.mobile-tab-btn'),

    // Leaderboard/Auth
    leaderboardList: document.getElementById('leaderboard-list'),
    leaderboardStatus: document.getElementById('leaderboard-status'),
    myLiveScoreSpan: document.getElementById('my-live-score-span'),
    myLiveScoreBox: document.getElementById('leaderboard-my-score'),
    authSection: document.getElementById('auth-section'), // Este es el <form> ahora
    scoreSection: document.getElementById('score-section'),
    usernameInput: document.getElementById('username-input'),
    passwordInput: document.getElementById('password-input'),
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    authStatus: document.getElementById('auth-status'),
    loggedInAs: document.getElementById('logged-in-as'),
    saveScoreBtn: document.getElementById('save-score-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    saveStatus: document.getElementById('save-status'),

    // Modales
    loginModalOverlay: document.getElementById('login-modal-overlay'),
    modalBtnLater: document.getElementById('modal-btn-later'),
    modalBtnGo: document.getElementById('modal-btn-go'),
    offlineModalOverlay: document.getElementById('offline-modal-overlay'),
    offlineEarningsEl: document.getElementById('offline-earnings'),
    offlineTimeEl: document.getElementById('offline-time'),
    modalBtnClose: document.getElementById('modal-btn-close'),
    
    // Chat & Toasts
    chatMessagesContainer: document.getElementById('chat-messages-container'),
    chatInput: document.getElementById('chat-input'),
    chatSendBtn: document.getElementById('chat-send-btn'),
    toastContainer: document.getElementById('toast-container'),

    // Voice Chat Elements (ACTUALIZADOS)
    voiceStatus: document.getElementById('voice-status'),
    joinVoiceChatBtn: document.getElementById('join-voice-chat-btn'), // Nuevo ID
    muteMicBtn: document.getElementById('mute-mic-btn'),              // Nuevo ID
    micOnIcon: document.getElementById('mic-on-icon'),
    micOffIcon: document.getElementById('mic-off-icon'),
    voiceUsersStatus: document.getElementById('voice-users-status'),
    voiceUsersList: document.getElementById('voice-users-list'),
    textChatSubtab: document.getElementById('text-chat-subtab'),
    
    // Audio
    sfxBuy: document.getElementById('sfx-buy'),
    sfxNextLevel: document.getElementById('sfx-nextlevel'),
    sfxSwitchTabs: document.getElementById('sfx-switchtabs'),
    bgmMusic: document.getElementById('bgm-music'),
    musicToggleBtn: document.getElementById('music-toggle-btn'),

    // Variable mutable para el intervalo de ban (para poder detenerlo desde game_logic)
    banCheckInterval: { value: null },
    
    // Bandera para música
    isMusicPlaying: { value: false }
};

export function getDomElements() {
    return DOM;
}

// --- ACTUALIZACIÓN DE UI ---

export function updateUI() {
    const { scoreDisplay, ppsDisplay, cpcDisplay, levelDisplay, xpBar } = DOM;
    
    scoreDisplay.textContent = formatNumber(score);
    ppsDisplay.textContent = `${formatNumber(pps * levelMultiplier)} Puntos por segundo`;
    cpcDisplay.textContent = `${formatNumber(clickPower * levelMultiplier)} Puntos por clic`;

    levelDisplay.textContent = `Nivel: ${level} (x${levelMultiplier.toFixed(2)})`;
    xpBar.style.width = `${(xp / xpToNextLevel) * 100}%`;

    UPGRADES_CONFIG.forEach(config => {
        const state = upgradeLevels[config.id];
        if (!state) return;

        const statsEl = document.getElementById(`stats-${config.id}`);
        const buttonEl = document.getElementById(`buy-${config.id}`);
        const itemEl = document.getElementById(`item-${config.id}`);

        if (statsEl && buttonEl && itemEl) {
            
            const currentLevel = state.level;
            const amountToBuy = isShiftPressed ? 10 : 1;
            
            let finalAmount = amountToBuy;
            let isMaxed = false;
            
            if (state.cost === null || (config.maxLevel && currentLevel >= config.maxLevel)) {
                isMaxed = true;
                finalAmount = 0;
            }
            
            if (config.maxLevel && !isMaxed) {
                 const remainingLevels = config.maxLevel - currentLevel;
                 finalAmount = _MathMin(amountToBuy, remainingLevels);
            }

            // Actualizar descripción y nivel
            let levelText = `Nivel: ${currentLevel}`;
            if (config.maxLevel) {
                levelText = `Nivel: ${currentLevel} / ${config.maxLevel}`;
            }
            if (isMaxed) {
                levelText = "¡MAX!";
            }
            statsEl.textContent = `${config.description} | ${levelText}`;

            // Actualizar coste y estado del botón
            if (isMaxed) {
                buttonEl.textContent = `Comprado`;
                buttonEl.disabled = true;
                itemEl.classList.remove('affordable');
            } else {
                const totalCost = calculateMultiBuyCost(config, currentLevel, finalAmount);
                
                if (isShiftPressed && finalAmount > 0) {
                    buttonEl.textContent = `x${finalAmount} Costo: ${formatNumber(totalCost)}`;
                } else {
                    buttonEl.textContent = `Costo: ${formatNumber(state.cost)}`;
                }
                
                const canAffordOne = score >= (state.cost || 0);
                const canAffordMulti = score >= totalCost;
                
                buttonEl.disabled = !canAffordOne;

                if (canAffordOne) {
                    itemEl.classList.add('affordable');
                } else {
                    itemEl.classList.remove('affordable');
                }
                
                if (isShiftPressed) {
                     buttonEl.disabled = !canAffordMulti;
                }
            }
        }
    });
}

export function updateCoinsDisplay() {
    DOM.coinsDisplay.textContent = formatNumber(coins);
}

// --- TIENDA Y SKINS ---

export function initializeStore() {
    // Limpiar contenedores
    const { storeCpcContainer, storePpsContainer, storeClickMultContainer, storeAutoMultContainer, storeSynergyContainer, storeBonusContainer, storeOtherContainer } = DOM;
    
    storeCpcContainer.innerHTML = '<h3>Mejoras de Clic</h3>';
    storePpsContainer.innerHTML = '<h3>Mejoras de PPS</h3>';
    storeClickMultContainer.innerHTML = '<h3>Multiplicadores de Clic</h3>';
    storeAutoMultContainer.innerHTML = '<h3>Multiplicadores de PPS</h3>';
    storeSynergyContainer.innerHTML = '<h3>Sinergias</h3>';
    storeBonusContainer.innerHTML = '<h3>Bonus de Nivel</h3>';
    storeOtherContainer.innerHTML = '<h3>Otros</h3>';

    UPGRADES_CONFIG.forEach(config => {
        const state = upgradeLevels[config.id];
        if (!state) return;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('store-item');
        itemDiv.id = `item-${config.id}`;

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('item-info');

        const nameStrong = document.createElement('strong');
        nameStrong.textContent = `${config.emoji} ${config.name}`;

        const statsSpan = document.createElement('span');
        statsSpan.id = `stats-${config.id}`;
        
        let levelText = `Nivel: ${state.level}`;
        if (config.maxLevel) {
            levelText = `Nivel: ${state.level} / ${config.maxLevel}`;
        }
        statsSpan.textContent = `${config.description} | ${levelText}`;

        infoDiv.appendChild(nameStrong);
        infoDiv.appendChild(statsSpan);

        const button = document.createElement('button');
        button.id = `buy-${config.id}`;
        button.dataset.key = config.id;
        
        if (state.cost === null) {
            button.textContent = `Comprado`;
            button.disabled = true;
        } else {
            button.textContent = `Costo: ${formatNumber(state.cost)}`;
        }

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(button);
        
        // Asignar al contenedor correcto
        switch (config.type) {
            case 'clickValue':
                storeCpcContainer.appendChild(itemDiv);
                break;
            case 'autoClickValue':
                storePpsContainer.appendChild(itemDiv);
                break;
            case 'clickMultiplier':
                storeClickMultContainer.appendChild(itemDiv);
                break;
            case 'autoMultiplier':
                storeAutoMultContainer.appendChild(itemDiv);
                break;
            case 'synergy':
                storeSynergyContainer.appendChild(itemDiv);
                break;
            case 'levelBonus':
                storeBonusContainer.appendChild(itemDiv);
                break;
            default:
                storeOtherContainer.appendChild(itemDiv);
                break;
        }
    });
}

export function initializeSkins() {
    const { skinsGrid } = DOM;
    skinsGrid.innerHTML = ''; 
    Object.keys(SKINS_CONFIG).forEach(skinId => {
        const skin = SKINS_CONFIG[skinId];

        const skinItem = document.createElement('div');
        skinItem.classList.add('skin-item');
        skinItem.dataset.skinId = skinId;

        const preview = document.createElement('div');
        preview.classList.add('skin-preview');
        preview.textContent = skin.emoji;

        const name = document.createElement('div');
        name.classList.add('skin-name');
        name.textContent = skin.name;

        const cost = document.createElement('div');
        cost.classList.add('skin-cost');
        if (skin.cost === 0) {
            cost.textContent = "Gratis";
        } else {
            cost.textContent = `${formatNumber(skin.cost)} monedas`;
        }

        skinItem.appendChild(preview);
        skinItem.appendChild(name);
        skinItem.appendChild(cost);
        skinsGrid.appendChild(skinItem);
    });
}

export function updateClickButtonSkin() {
    const { clickButton } = DOM;
    
    // Aquí no hay reasignación.
    if (!skinsState[currentSkin]) {
        // Podríamos forzar un fallback aquí si fuera necesario
    }
    const skin = skinsState[currentSkin];
    clickButton.innerHTML = '';

    if (skin) {
        const face = document.createElement('div');
        face.classList.add('click-button-face');
        face.textContent = skin.emoji;
        clickButton.appendChild(face);

        const clickText = document.createElement('span');
        clickText.id = 'click-button-text';
        clickText.textContent = "¡Clic!";
        clickButton.appendChild(clickText);
    }
}

export function updateSkinsUI() {
    const { skinsGrid } = DOM;
    
    // Asegurarse de que skinsState esté inicializado
    if (!skinsState || Object.keys(skinsState).length === 0) {
         // Re-inicialización defensiva
    }
    
    Object.keys(skinsState).forEach(skinId => {
        const skin = skinsState[skinId];
        if (!skin) {
            console.warn(`Skin ID "${skinId}" no encontrado en skinsState.`);
            return;
        }
        
        const skinElement = skinsGrid.querySelector(`.skin-item[data-skin-id="${skinId}"]`);

        if (skinElement) {
            skinElement.classList.remove('skin-locked', 'skin-owned', 'skin-equipped');
            
            const costEl = skinElement.querySelector('.skin-cost');

            if (!skin.owned && skin.cost > 0) {
                skinElement.classList.add('skin-locked');
                costEl.textContent = `${formatNumber(skin.cost)} monedas`;
                costEl.style.color = "#28a745"; 
            } else if (skin.owned) {
                skinElement.classList.add('skin-owned');
                costEl.textContent = "Comprado";
                costEl.style.color = "#28a745";
            }

            if (currentSkin === skinId) {
                skinElement.classList.add('skin-equipped');
                costEl.textContent = "Equipado";
                costEl.style.color = "#007bff";
            } else if (skin.owned) {
                 costEl.textContent = "Comprado";
                 costEl.style.color = "#28a745";
            }
        }
    });
}

// --- CHAT Y NOTIFICACIONES ---

export function displayChatMessage(username, message, skin) {
    const { chatMessagesContainer } = DOM;
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-message');
    
    const skinSpan = document.createElement('span');
    skinSpan.classList.add('player-skin');
    skinSpan.textContent = skin || '👤';
    
    const strong = document.createElement('strong');
    strong.textContent = `${username}: `;
    
    const msgText = document.createTextNode(message);
    
    msgDiv.appendChild(skinSpan);
    msgDiv.appendChild(strong);
    msgDiv.appendChild(msgText);
    
    chatMessagesContainer.appendChild(msgDiv);
    
    // Auto-scroll
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

export function showToastNotification(username, message, skin) {
    const { toastContainer } = DOM;
    const toast = document.createElement('div');
    toast.classList.add('toast-notification');
    
    const skinSpan = document.createElement('span');
    skinSpan.classList.add('player-skin');
    skinSpan.textContent = skin || '👤';
    
    const strong = document.createElement('strong');
    strong.textContent = `${username}: `;
    
    const msgText = document.createTextNode(message);
    
    toast.appendChild(skinSpan);
    toast.appendChild(strong);
    toast.appendChild(msgText);
    
    toastContainer.appendChild(toast);
    
    // Auto-destruir el toast
    setTimeout(() => {
        toast.remove();
    }, 4500);
}

// --- MODALES ---

export function showLoginModal() {
    DOM.loginModalOverlay.style.display = 'flex';
}

export function hideLoginModal() {
    DOM.loginModalOverlay.style.display = 'none';
}

export function showOfflineEarningsModal(earnings, time) {
    DOM.offlineEarningsEl.textContent = `+${formatNumber(earnings)}`;
    DOM.offlineTimeEl.textContent = `(durante ${formatTime(time)})`;
    DOM.offlineModalOverlay.style.display = 'flex';
}


// --- NAVEGACIÓN DE PESTAÑAS ---

function showTab(tabId) {
    const { tabButtons, tabContents, mobileTabButtons, myLiveScoreBox, sfxSwitchTabs } = DOM;
    const currentUserId = getUserId(); // Usar getter

    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    mobileTabButtons.forEach(btn => btn.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const activeMobileBtn = document.querySelector(`.mobile-tab-btn[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeMobileBtn) activeMobileBtn.classList.add('active');
    
    // El .tab-content.active ahora usa display: flex, lo que asegura que solo la pestaña activa se muestre
    if (activeContent) activeContent.classList.add('active');
    
    if (myLiveScoreBox) {
        myLiveScoreBox.style.display = (tabId === 'leaderboard' && currentUserId) ? 'block' : 'none';
    }
    
    sfxSwitchTabs.currentTime = 0;
    sfxSwitchTabs.play().catch(e => {});

    // Mostrar sub-pestaña por defecto (Texto) si es la pestaña de Chat
    if (tabId === 'chat') {
        showSubTab('text-chat-subtab');
    }
}

function showSubTab(subTabId) {
    const { subTabButtons, subTabContents, sfxSwitchTabs, textChatSubtab } = DOM;
    
    // Obtener los botones y contenidos específicos de la pestaña activa (Chat)
    const activeSubButtons = document.querySelectorAll('#chat .sub-tab-btn');
    const activeSubContents = document.querySelectorAll('#chat .sub-tab-content');

    activeSubButtons.forEach(btn => btn.classList.remove('active'));
    activeSubContents.forEach(content => content.classList.remove('active'));

    const activeBtn = document.querySelector(`.sub-tab-btn[data-subtab="${subTabId}"]`);
    const activeContent = document.getElementById(subTabId);

    if (activeBtn) activeBtn.classList.add('active');
    
    if (activeContent) {
        activeContent.classList.add('active');
        
        // REGLA CRÍTICA: Ocultar o mostrar el chat de texto si la subpestaña es voz.
        if (subTabId === 'voice-chat-subtab') {
            // Cuando la pestaña de Voz está activa, forzamos que la de texto esté oculta.
            if (textChatSubtab) {
                textChatSubtab.style.display = 'none';
            }
            activeContent.style.display = 'flex'; // Usar flex para la estructura de voz
        } else if (subTabId === 'text-chat-subtab') {
            activeContent.style.display = 'flex'; // Asegurar que el contenido de texto use flex para su layout
        }
    }
    
    sfxSwitchTabs.currentTime = 0;
    sfxSwitchTabs.play().catch(e => {});
}


// --- FIREBASE AUTHENTICATION Y PRESENCIA ---

async function initializeFirebase() {
    const { authSection, scoreSection, loggedInAs, chatInput, chatSendBtn, joinVoiceChatBtn, muteMicBtn, voiceStatus } = DOM;
    
    onAuthStateChanged(auth, async (user) => {
        
        // Limpiar el estado previo al cambio de usuario
        if (DOM.autoSaveInterval) clearInterval(DOM.autoSaveInterval);
        
        if (user) {
            const uid = user.uid;
            const username = user.email.split('@')[0];

            // 1. MODIFICAR EL ESTADO EN game_logic.js (CORRECCIÓN CLAVE)
            setAuthState(uid, username);

            // Actualizar UI de Autenticación
            authSection.style.display = 'none';
            scoreSection.style.display = 'flex';
            loggedInAs.textContent = `Logueado como: ${username}`;

            // Habilitar Chat
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatInput.placeholder = "Escribe un mensaje...";

            // --- INICIO: CORRECCIÓN DEL CHAT DE VOZ ---
            // El usuario está logueado. Actualizar el estado de voz a "listo para unirse".
            joinVoiceChatBtn.disabled = false; 
            muteMicBtn.disabled = true; // Sigue deshabilitado HASTA que se una
            voiceStatus.textContent = "Desconectado. Pulsa 'Unirse' para entrar al chat.";
            // --- FIN: CORRECCIÓN DEL CHAT DE VOZ ---

            // Presencia Online
            const presenceRef = ref(db, `presence/${uid}`);
            set(presenceRef, true);
            onDisconnect(presenceRef).remove();

            await loadGameState(); 
            
            console.log("Datos del jugador cargados y migrados. Guardado automático activado.");
            // Iniciar auto-guardado
            DOM.autoSaveInterval = setInterval(() => saveScore(false), 15000); 
            setIsGameLoaded(true); // Modificar isGameLoaded

        } else {
            // 1. MODIFICAR EL ESTADO EN game_logic.js (CORRECCIÓN CLAVE)
            setAuthState(null, null);

            // Actualizar UI de Autenticación
            authSection.style.display = 'flex';
            scoreSection.style.display = 'none';
            loggedInAs.textContent = '';
            
            // Deshabilitar Chat
            chatInput.disabled = true;
            chatSendBtn.disabled = true;
            chatInput.placeholder = "Inicia sesión para chatear...";

            // Deshabilitar Chat de Voz (Esta parte era correcta)
            joinVoiceChatBtn.disabled = true;
            muteMicBtn.disabled = true;
            voiceStatus.textContent = "Desconectado. Necesitas iniciar sesión para unirte.";

            resetGameState(false);
            setIsGameLoaded(true); // Modificar isGameLoaded
        }
    });

    loadLeaderboard();
    initializeChat(); 
    
    const allPresenceRef = ref(db, 'presence');
    onValue(allPresenceRef, (snapshot) => {
        // CORRECCIÓN CLAVE: Usar la función setter en lugar de reasignación directa
        setGlobalPresence(snapshot.val() || {}); 
        updateLeaderboardPresenceStatus();
    });
}

export function updateLeaderboardPresenceStatus() {
    const { leaderboardList } = DOM;
    const lis = leaderboardList.querySelectorAll('li[data-user-id]');
    const currentUserId = getUserId(); // Usar getter

    lis.forEach(li => {
        const uid = li.dataset.userId;
        const dot = li.querySelector('.status-dot');
        if (dot) {
            if (globalPresence[uid]) {
                dot.classList.add('online');
            } else {
                dot.classList.remove('online');
            }
        }
    });
}

export function updateLeaderboardVisualTicking() {
    const { leaderboardList } = DOM;
    const now = _DateNow();
    const maxOfflineTimeMs = 10 * 60 * 60 * 1000;
    
    leaderboardList.querySelectorAll('li[data-user-id]').forEach(li => {
        const dot = li.querySelector('.status-dot');
        const scoreEl = li.querySelector('.player-score');
        const baseScore = parseFloat(li.dataset.baseScore);
        
        if (dot && !dot.classList.contains('online')) {
            const pps = parseFloat(li.dataset.pps);
            const lastSeen = parseFloat(li.dataset.lastSeen);
            
            const timeOfflineMs = now - lastSeen;
            const effectiveTimeMs = _MathMin(timeOfflineMs, maxOfflineTimeMs);
            
            if (effectiveTimeMs > 0) {
                const offlineGain = (pps * 0.05) * (effectiveTimeMs / 1000);
                const currentScore = baseScore + offlineGain;
                scoreEl.textContent = formatNumber(currentScore);
            } else {
                scoreEl.textContent = formatNumber(baseScore);
            }
        } else if (dot && dot.classList.contains('online')) {
             scoreEl.textContent = formatNumber(baseScore);
        }
    });
}


// --- HANDLERS DE AUTENTICACIÓN ---

function handleRegister() {
    const { usernameInput, passwordInput, authStatus } = DOM;
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username.length < 3 || password.length < 6) {
        authStatus.textContent = "Usuario (3+) y contraseña (6+)";
        authStatus.className = 'error';
        return;
    }
    const email = username + '@click.com';

    authStatus.textContent = "Registrando...";
    authStatus.className = '';

    // Uso de la función importada directamente
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            authStatus.textContent = "¡Registrado con éxito!";
            authStatus.className = 'success';
        })
        .catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
                authStatus.textContent = "Ese nombre de usuario ya existe.";
            } else {
                authStatus.textContent = "Error al registrar.";
            }
            authStatus.className = 'error';
        });
}

function handleLogin() {
    const { usernameInput, passwordInput, authStatus } = DOM;
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        authStatus.textContent = "Rellena ambos campos.";
        authStatus.className = 'error';
        return;
    }
    const email = username + '@click.com';

    authStatus.textContent = "Iniciando sesión...";
    authStatus.className = '';

    // Uso de la función importada directamente
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            authStatus.textContent = "¡Bienvenido de vuelta!";
            authStatus.className = 'success';
        })
        .catch((error) => {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                authStatus.textContent = "Usuario o contraseña incorrectos.";
            } else {
                authStatus.textContent = "Error al iniciar sesión.";
            }
            authStatus.className = 'error';
        });
}

async function handleLogout() {
    const { bgmMusic } = DOM;
    const currentUserId = getUserId(); // Usar getter

    if (currentUserId && isGameLoaded) {
        const presenceRef = ref(db, `presence/${currentUserId}`);
        await saveScore(false); 
        await set(presenceRef, null);
    }
    
    // Desconectar chat de voz antes de salir
    if (toggleVoiceChat) {
         // Llama a la función para forzar la desconexión si está activo. Ya es una función async.
        await toggleVoiceChat(true); 
    }
    
    if (DOM.autoSaveInterval) clearInterval(DOM.autoSaveInterval);
    if (bgmMusic) bgmMusic.pause(); 
    
    setIsGameLoaded(false); // Modificar isGameLoaded
    
    // Uso de la función importada directamente
    signOut(auth).catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
}

// --- INICIALIZACIÓN DE EVENTOS ---

function initializeEventListeners() {
    const { clickButton, tabButtons, mobileTabButtons, subTabButtons, registerBtn, loginBtn, logoutBtn, saveScoreBtn, modalBtnLater, modalBtnGo, modalBtnClose, musicToggleBtn, skinsGrid, chatSendBtn, chatInput, joinVoiceChatBtn, muteMicBtn } = DOM;

    clickButton.addEventListener('mousedown', handleManualClick);
    
    // Listener de compras
    document.getElementById('store').addEventListener('click', (event) => {
        const button = event.target.closest('button[data-key]');
        if (button) buyUpgrade(button.dataset.key);
    });

    // Listeners de Shift (x10)
    window.addEventListener('keydown', (e) => {
        // CORRECCIÓN CLAVE: Usar la función setter
        if (e.key === 'Shift' && !isShiftPressed) { 
            setIsShiftPressed(true);
            updateUI();
        }
    });
    window.addEventListener('keyup', (e) => {
        // CORRECCIÓN CLAVE: Usar la función setter
        if (e.key === 'Shift') {
            setIsShiftPressed(false);
            updateUI();
        }
    });
    window.addEventListener('blur', () => {
        // CORRECCIÓN CLAVE: Usar la función setter
        if (isShiftPressed) {
            setIsShiftPressed(false);
            updateUI();
        }
    });


    // Listeners de Navegación
    tabButtons.forEach(button => {
        button.addEventListener('click', () => showTab(button.dataset.tab));
    });
    mobileTabButtons.forEach(button => {
        button.addEventListener('click', () => showTab(button.dataset.tab));
    });
    // Listeners de Sub-Navegación (Chat)
    subTabButtons.forEach(button => {
        button.addEventListener('click', () => showSubTab(button.dataset.subtab));
    });
    
    // Listeners de Auth
    registerBtn.addEventListener('click', handleRegister);
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    saveScoreBtn.addEventListener('click', () => saveScore(true));

    // Listeners de Chat
    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !chatSendBtn.disabled) {
            sendChatMessage();
        }
    });


    // Listeners de Modales
    modalBtnLater.addEventListener('click', hideLoginModal);
    modalBtnGo.addEventListener('click', () => {
        hideLoginModal();
        showTab('leaderboard');
    });
    modalBtnClose.addEventListener('click', () => {
        DOM.offlineModalOverlay.style.display = 'none';
    });

    // Listener de Skins
    if (!skinsGrid.dataset.listenerAttached) {
        skinsGrid.addEventListener('click', (event) => {
            if (isBanned) return;
            const skinItem = event.target.closest('.skin-item');
            if (!skinItem) return;

            const skinId = skinItem.dataset.skinId;
            const skin = skinsState[skinId];

            if (skin.owned) {
                // Seleccionar skin (solo se necesita setCurrentSkin)
                setCurrentSkin(skinId); 
                updateClickButtonSkin();
                updateSkinsUI();
            } else if (coins >= skin.cost) {
                // Lógica de compra (usando funciones setter)
                if (spendCoins(skin.cost)) { // Función que resta y comprueba
                    updateSkinsState(skinId, 'owned', true);
                    updateSkinsState(skinId, 'unlocked', true);
                    setCurrentSkin(skinId);
                    updateClickButtonSkin();
                    updateCoinsDisplay();
                    updateSkinsUI();
                }
            }
        });
        skinsGrid.dataset.listenerAttached = 'true';
    }


    // Listener de Música
    musicToggleBtn.addEventListener('click', () => {
        if (DOM.isMusicPlaying.value) {
            DOM.bgmMusic.pause();
            musicToggleBtn.classList.remove('playing');
            musicToggleBtn.textContent = '🔇';
        } else {
            DOM.bgmMusic.play().then(() => {
                musicToggleBtn.classList.add('playing');
                musicToggleBtn.textContent = '🎶';
            }).catch(e => console.log("Error al reproducir BGM:", e));
        }
        // Nota: isMusicPlaying es una propiedad de un objeto, por lo que es mutable.
        DOM.isMusicPlaying.value = !DOM.isMusicPlaying.value;
    });

    // Listener de Chat de Voz
    joinVoiceChatBtn.addEventListener('click', () => {
        // Llama a toggleVoiceChat sin forzar la desconexión
        toggleVoiceChat(false); 
    });
    
    // Listener de Mutear/Desmutear
    muteMicBtn.addEventListener('click', toggleMute);


    // Guardado de estado al cerrar la ventana
    window.onbeforeunload = () => {
        const currentUserId = getUserId(); // Usar getter
        if (currentUserId && isGameLoaded) {
            saveScore(false);
        }
    };
}

// --- FUNCIÓN PRINCIPAL DE ARRANQUE ---

async function loadGameConfigAndStart() {
    try {
        // --- INICIO DE CORRECCIÓN ---
        // Cargar el módulo de chat de voz ANTES de inicializar los listeners,
        // para que la función 'toggleVoiceChat' y 'toggleMute' estén disponibles.
        try {
            const voiceChatModule = await import('./voicechat.js');
            // Reasignar las funciones exportadas
            toggleVoiceChat = voiceChatModule.toggleVoiceChat;
            toggleMute = voiceChatModule.toggleMute;
            initializeVoiceChat = voiceChatModule.initializeVoiceChat;
        } catch (e) {
            console.warn("No se pudo cargar el módulo voicechat.js", e);
            // Si falla la carga, mantenemos las funciones predeterminadas asíncronas para evitar errores de promesa.
        }
        // --- FIN DE CORRECCIÓN ---


        // Inicializar elementos DOM y audios antes de cualquier llamada a Firebase o juego
        initializeEventListeners(); 
        initializeSkins(); 

        await initializeFirebase(); 
        
        // CORRECCIÓN CLAVE: Inicializar el chat de voz aquí, después de que el módulo esté cargado
        // y después de que Firebase haya completado el chequeo inicial de autenticación.
        // Esto evita el race condition y los warnings de "no cargado".
        if (initializeVoiceChat) initializeVoiceChat();


        // Iniciar bucles de juego y UI
        setInterval(gameLoop, 100);
        setInterval(updateLeaderboardVisualTicking, 1000);

        // Llamadas de actualización inicial
        updateUI();
        updateClickButtonSkin();
        
    } catch (error) {
        console.error("Error fatal al iniciar el juego:", error);
        document.body.innerHTML = "<h1>Error al cargar la configuración del juego. Inténtalo de nuevo más tarde.</h1>";
    }
}

// Iniciar el juego
loadGameConfigAndStart();