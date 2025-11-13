import { 
    UPGRADES_CONFIG, SKINS_CONFIG, fruits, 
    PRESTIGE_REQUIREMENT, PRESTIGE_UPGRADES_CONFIG, // NUEVO: Importar config de prestigio
    auth, db, ref, set, query, orderByChild, limitToLast, onValue, get, onDisconnect, // voiceDb import REMOVED
    push, serverTimestamp, onChildAdded, 
    _DateNow, _MathSqrt, _MathPow, _MathCeil, _MathRandom, _MathFloor, _MathAbs, _MathMin, _MathMax, _MathPI, _MathSin, _MathCos, // <--- LÍNEA CORREGIDA
    bgPatternTemplates
} from './config.js';
import { 
    updateUI, updateCoinsDisplay, initializeStore, updateSkinsUI, updateClickButtonSkin,
    showLoginModal, showOfflineEarningsModal, showToastNotification, displayChatMessage, 
    getDomElements, updateLeaderboardPresenceStatus, updateLeaderboardVisualTicking,
    // La siguiente función la crearemos en ui_handlers.js, pero la importamos aquí
    updatePrestigeUI // NUEVO: Para actualizar la UI de prestigio
} from './ui_handlers.js';


// --- VARIABLES DE ESTADO DEL JUEGO ---
export let score = 0;
export let clickPower = 1;
export let pps = 0;
export let level = 1;
export let xp = 0;
export let xpToNextLevel = 100;
export let levelMultiplier = 1.0;
export let totalScore = 0; // Puntuación total en esta "ronda" de prestigio
export let totalClicks = 0;
export let modalShown = false;
export let coins = 0;
export let currentSkin = 'default';
export let skinsState = {};
export let upgradeLevels = {};
export let globalPresence = {};

// --- NUEVO: Variables de Estado de Prestigio ---
export let prestigePoints = 0; // "Pipas de Prestigio"
export let totalPrestigePoints = 0; // Pipas totales ganadas (histórico)
export let prestigeLevels = {}; // Niveles de las mejoras de prestigio
export let startprestige = 0; // NUEVO: Flag para el reseteo inicial
// ----------------------------------------------

// --- NUEVO: Multiplicadores totales para la UI de la tienda ---
export let totalClickMultiplier = 1; 
export let totalAutoMultiplier = 1; 
// -----------------------------------------------------------

// Estas variables serán modificadas mediante funciones exportadas
let internalUserId = null;
let internalCurrentUsername = null; 
export let autoSaveInterval = null; // Mantener como export let para clearInterval
export let isGameLoaded = false;
export let isShiftPressed = false; // Mantener como export let para listeners de eventos directos

export let isBanned = false;
export let banExpiresAt = 0;
export let banCheckInterval = null;

// Exportar los getters y setters para userId y currentUsername
export const getUserId = () => internalUserId;
export const getCurrentUsername = () => internalCurrentUsername;

// Función para establecer el estado de usuario (usada por ui_handlers.js)
export const setAuthState = (uid, username) => {
    internalUserId = uid;
    internalCurrentUsername = username;
};

// Función para establecer isShiftPressed (usada por ui_handlers.js)
export const setIsShiftPressed = (value) => {
    isShiftPressed = value;
};

// Función para establecer isGameLoaded (usada por ui_handlers.js)
export const setIsGameLoaded = (value) => {
    isGameLoaded = value;
};

// Setter para GlobalPresence
export const setGlobalPresence = (presenceData) => {
    globalPresence = presenceData;
};

// NUEVA FUNCIÓN: Para que ui_handlers.js pueda actualizar la skin
export const setCurrentSkin = (skinId) => {
    currentSkin = skinId;
};

// NUEVA FUNCIÓN: Para que ui_handlers.js pueda actualizar las monedas
export const setCoins = (newCoins) => {
    coins = newCoins;
};

// NUEVA FUNCIÓN: Para actualizar skinsState (necesario para la compra)
export const updateSkinsState = (skinId, key, value) => {
    if (skinsState[skinId]) {
        skinsState[skinId][key] = value;
    }
};

// NUEVA FUNCIÓN: Para gastar monedas (usada por ui_handlers.js)
export const spendCoins = (amount) => {
    if (coins >= amount) {
        coins -= amount;
        return true;
    }
    return false;
};

// --- NUEVO: Setter para Pipas de Prestigio (para la UI) ---
export const setPrestigePoints = (value) => {
    prestigePoints = value;
};


// --- Variables Anti-Cheat ---
let _lct = 0; // lastClickTimestamp
let _cIntvls = []; // clickIntervals
const _cThresh = 1.0; // consistencyThreshold
const _cWnd = 20; // consistencyWindow
let _clkTmstmps = []; // clickTimestamps
const _maxCPS = 30; // Máximos clics por segundo permitidos
const _cpsWnd = 1000; // 1 segundo (ventana de CPS)


// --- UTILERIAS ---
export function formatNumber(num) {
    num = _MathFloor(num);
    if (num < 1000) return num.toString();
    // Lógica de formateo extendida
    if (num >= 1e45) return (num / 1e45).toFixed(num % 1e45 === 0 ? 0 : 2).replace(/\./g, ',') + 'qD';
    if (num >= 1e42) return (num / 1e42).toFixed(num % 1e42 === 0 ? 0 : 2).replace(/\./g, ',') + 'tD';
    if (num >= 1e39) return (num / 1e39).toFixed(num % 1e39 === 0 ? 0 : 2).replace(/\./g, ',') + 'dD';
    if (num >= 1e36) return (num / 1e36).toFixed(num % 1e36 === 0 ? 0 : 2).replace(/\./g, ',') + 'U';
    if (num >= 1e33) return (num / 1e33).toFixed(num % 1e33 === 0 ? 0 : 2).replace(/\./g, ',') + 'D';
    if (num >= 1e30) return (num / 1e30).toFixed(num % 1e30 === 0 ? 0 : 2).replace(/\./g, ',') + 'N';
    if (num >= 1e27) return (num / 1e27).toFixed(num % 1e27 === 0 ? 0 : 2).replace(/\./g, ',') + 'O';
    if (num >= 1e24) return (num / 1e24).toFixed(num % 1e24 === 0 ? 0 : 2).replace(/\./g, ',') + 'Y';
    if (num >= 1e21) return (num / 1e21).toFixed(num % 1e21 === 0 ? 0 : 2).replace(/\./g, ',') + 'Z';
    if (num >= 1e18) return (num / 1e18).toFixed(num % 1e18 === 0 ? 0 : 2).replace(/\./g, ',') + 'E';
    if (num >= 1e15) return (num / 1e15).toFixed(num % 1e15 === 0 ? 0 : 2).replace(/\./g, ',') + 'P';
    if (num >= 1e12) return (num / 1e12).toFixed(num % 1e12 === 0 ? 0 : 2).replace(/\./g, ',') + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(num % 1e9 === 0 ? 0 : 2).replace(/\./g, ',') + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(num % 1e6 === 0 ? 0 : 2).replace(/\./g, ',') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(num % 1e3 === 0 ? 0 : 1).replace(/\./g, ',') + 'K';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatTime(totalSeconds) {
    totalSeconds = _MathFloor(totalSeconds);
    const hours = _MathFloor(totalSeconds / 3600);
    const minutes = _MathFloor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getStandardDeviation(array) {
    if (array.length < 2) return 0;
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    const variance = array.reduce((a, b) => a + _MathPow(b - mean, 2), 0) / n;
    return _MathSqrt(variance);
}

// --- FUNCIONES DE ESTADO Y LÓGICA DE JUEGO ---

/**
 * Resetea el estado del juego.
 * @param {boolean} isLogout - Si es 'true', es un reseteo total (logout).
 * Si es 'false' (por defecto), es un reseteo por Prestigio.
 */
export function resetGameState(isLogout = false) {
    score = 0;
    totalScore = 0;
    level = 1;
    xp = 0;
    totalClicks = 0;
    modalShown = false; // Para que vuelva a salir el modal de login
    
    // Aplicar bonus de monedas iniciales de prestigio
    let startingCoinsBonus = 0;
    if (Object.keys(prestigeLevels).length > 0) {
        PRESTIGE_UPGRADES_CONFIG.forEach(config => {
            const state = prestigeLevels[config.id];
            if (state && state.level > 0 && config.type === 'startingCoins') {
                startingCoinsBonus += config.value * state.level;
            }
        });
    }
    coins = startingCoinsBonus;
    
    // Resetear anti-cheat
    _lct = 0;
    _cIntvls = [];
    _clkTmstmps = [];

    // Resetear mejoras normales
    upgradeLevels = {};
    UPGRADES_CONFIG.forEach(upgrade => {
        upgradeLevels[upgrade.id] = {
            level: 0,
            cost: upgrade.initialCost
        };
    });

    if (isLogout) {
        // Reseteo TOTAL por logout
        isBanned = false;
        banExpiresAt = 0;
        prestigePoints = 0;
        totalPrestigePoints = 0;
        prestigeLevels = {}; // Borra mejoras de prestigio
        skinsState = JSON.parse(JSON.stringify(SKINS_CONFIG)); // Resetea skins
        currentSkin = 'default';
        coins = 0; // Un logout resetea las monedas
        startprestige = 0; // NUEVO: Resetea el flag de inicio de prestigio
    }
    
    // Inicializar mejoras de prestigio si no existen (primera carga o post-logout)
    if (Object.keys(prestigeLevels).length === 0) {
        PRESTIGE_UPGRADES_CONFIG.forEach(upgrade => {
            prestigeLevels[upgrade.id] = {
                level: 0,
                cost: upgrade.initialCost
            };
        });
    }

    recalculateStats(); 
    recalculateLevelStats();
    
    if (isLogout) {
        isGameLoaded = true; 
        initializeStore();
        // initializePrestigeStore() se llamará desde ui_handlers
    }
    
    updateUI(); 
    updateSkinsUI(); 
    checkBanStatus(); // Re-chequear estado de ban (por si acaso)
    updateClickButtonSkin();
    updateCoinsDisplay(); // Actualizar monedas para mostrar las iniciales
}

export function gainXP(amount) {
    const { sfxNextLevel } = getDomElements();
    
    // --- Aplicar Bonus de XP de Prestigio ---
    let xpMultiplier = 1;
    if (Object.keys(prestigeLevels).length > 0) {
        PRESTIGE_UPGRADES_CONFIG.forEach(config => {
            const state = prestigeLevels[config.id];
            if (state && state.level > 0 && config.type === 'xpGain') {
                // Usamos _MathPow para que el bonus se acumule (ej. 1.5^2)
                xpMultiplier *= _MathPow(config.value, state.level);
            }
        });
    }
    // ---------------------------------------

    xp += (amount * xpMultiplier); // Ganancia de XP con bonus
    totalScore += amount; // totalScore rastrea la puntuación de esta ronda

    while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel;
        level++;
        recalculateLevelStats();
        sfxNextLevel.currentTime = 0;
        sfxNextLevel.play().catch(e => {}); // Reproducir sonido de nivel
    }
}

export function recalculateLevelStats() {
    xpToNextLevel = 100 * _MathPow(5, level - 1);
    levelMultiplier = 1 + (level - 1) * 0.05;
    
    // Lógica de cambio de fondo
    try {
        const hue = (level * 20) % 360;
        const patternColor = `hsl(${hue}, 100%, 85%)`;
        const bgColor = `hsl(${hue}, 80%, 95%)`; 
        const patternIndex = (level - 1) % bgPatternTemplates.length;
        const newPattern = bgPatternTemplates[patternIndex](patternColor);
        
        document.body.style.backgroundColor = bgColor;
        document.body.style.backgroundImage = newPattern;
    } catch (e) {
        console.error("Error al actualizar el fondo:", e);
    }
}

// Lógica de recálculo
export function recalculateStats() {
    let newPPS = 0;
    let newClickPower = 1;
    
    let clickMultiplierBonus = 0;
    let autoMultiplierBonus = 0;

    let synergyClickBonus = 0;
    let synergyAutoBonus = 0;
    let levelClickBonus = 0;
    let levelAutoBonus = 0;

    // 1. Calcular Sinergias y Bonos de Nivel
    UPGRADES_CONFIG.forEach(config => {
        const state = upgradeLevels[config.id];
        if (!state || state.level === 0) return;

        if (config.type === 'synergy') {
            const targetState = upgradeLevels[config.targetUpgrade];
            if (!targetState) return;
            
            const bonus = config.value * targetState.level * state.level;
            if (config.targetStat === 'clickValue') {
                synergyClickBonus += bonus;
            } else if (config.targetStat === 'autoClickValue') {
                synergyAutoBonus += bonus;
            }
        }
        
        if (config.type === 'levelBonus') {
             const bonus = config.value * level * state.level;
             if (config.targetStat === 'clickValue') {
                levelClickBonus += bonus;
            } else if (config.targetStat === 'autoClickValue') {
                levelAutoBonus += bonus;
            } else if (config.targetStat === 'all') {
                levelClickBonus += bonus;
                levelAutoBonus += bonus;
            }
        }
    });

    // 2. Calcular valores Base y Multiplicadores
    UPGRADES_CONFIG.forEach(config => {
        const state = upgradeLevels[config.id];
        if (!state || state.level === 0) return;

        switch (config.type) {
            case 'clickValue':
                newClickPower += config.value * state.level;
                break;
            case 'autoClickValue':
                newPPS += config.value * state.level;
                break;
            case 'clickMultiplier':
                clickMultiplierBonus += (config.value - 1) * state.level;
                break;
            case 'autoMultiplier':
                autoMultiplierBonus += (config.value - 1) * state.level;
                break;
        }
    });
    
    // 3. --- NUEVO: Calcular Multiplicadores Totales ---
    let prestigeClickMult = 1;
    let prestigeAutoMult = 1;

    if (Object.keys(prestigeLevels).length > 0) {
        PRESTIGE_UPGRADES_CONFIG.forEach(config => {
            const state = prestigeLevels[config.id];
            if (state && state.level > 0) {
                if (config.type === 'globalClickMultiplier') {
                    prestigeClickMult *= _MathPow(config.value, state.level);
                } else if (config.type === 'globalAutoMultiplier') {
                    prestigeAutoMult *= _MathPow(config.value, state.level);
                }
            }
        });
    }

    // Multiplicador total para la UI (No incluye el levelMultiplier, que se muestra separado)
    totalClickMultiplier = (1 + clickMultiplierBonus) * (1 + synergyClickBonus) * (1 + levelClickBonus) * prestigeClickMult;
    totalAutoMultiplier = (1 + autoMultiplierBonus) * (1 + synergyAutoBonus) * (1 + levelAutoBonus) * prestigeAutoMult;
    // ----------------------------------------------------


    // 4. Aplicar todos los multiplicadores
    let finalClickPower = (newClickPower);
    finalClickPower *= totalClickMultiplier; // Usar el multiplicador total
    
    let finalPPS = (newPPS);
    finalPPS *= totalAutoMultiplier; // Usar el multiplicador total

    // Asignar valores finales
    pps = finalPPS;
    clickPower = finalClickPower;
}

export function gameLoop() {
    const { myLiveScoreSpan } = getDomElements();
    if (isBanned) return;
    
    const baseGain = pps;
    // La ganancia es por frame, por eso se divide entre 10 (el setInterval está en 100ms)
    const earnedScore = (baseGain * levelMultiplier) / 10; 

    score += earnedScore;

    if (baseGain > 0) {
        gainXP(earnedScore);
        showPpsVisual(earnedScore);
    }

    updateUI();
    
    if (myLiveScoreSpan) {
        myLiveScoreSpan.textContent = formatNumber(totalScore);
    }
}

export function calculateMultiBuyCost(config, startLevel, amount) {
    let totalCost = 0;
    let currentLevel = startLevel;
    for (let i = 0; i < amount; i++) {
        if (config.maxLevel && (currentLevel + i) >= config.maxLevel) {
            break;
        }
        // Redondeo el costo a cada nivel antes de sumarlo
        totalCost += _MathCeil(config.initialCost * _MathPow(config.costMultiplier, currentLevel + i));
    }
    return totalCost;
}

export function buyUpgrade(key) {
    if (isBanned) return;
    
    const { sfxBuy } = getDomElements();
    
    const config = UPGRADES_CONFIG.find(u => u.id === key);
    if (!config) return;
    
    const state = upgradeLevels[key];
    if (!state) return;

    const amountToBuy = isShiftPressed ? 10 : 1;
    let currentLevel = state.level;
    
    let finalAmount = amountToBuy;
    if (config.maxLevel) {
        const remainingLevels = config.maxLevel - currentLevel;
        if (remainingLevels <= 0) return;
        finalAmount = _MathMin(amountToBuy, remainingLevels);
    }
    
    if (finalAmount === 0) return;

    const totalCost = calculateMultiBuyCost(config, currentLevel, finalAmount);
    
    if (score >= totalCost) {
        score -= totalCost;
        state.level += finalAmount;
        currentLevel = state.level;
        
        // Actualizar coste
        if (config.maxLevel && currentLevel >= config.maxLevel) {
            state.cost = null; // Nivel máximo alcanzado
        } else {
            // Calcular el coste del siguiente nivel
            state.cost = _MathCeil(config.initialCost * _MathPow(config.costMultiplier, currentLevel));
        }
        
        sfxBuy.currentTime = 0;
        sfxBuy.play().catch(e => {}); // Reproducir sonido de compra

        recalculateStats();
        updateUI();
        
        const itemEl = document.getElementById(`item-${key}`);
        if (itemEl) {
            itemEl.classList.add('purchased');
            setTimeout(() => itemEl.classList.remove('purchased'), 400);
        }
    }
}

// --- LÓGICA DE CLIC MANUAL Y EFECTOS ---
export let firstClick = true;

function requestFullscreen() {
    // Lógica original de pantalla completa
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && firstClick) {
        firstClick = false;
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => console.log(err));
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen().catch(err => console.log(err));
        } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen().catch(err => console.log(err));
        }
    }
}

export function handleManualClick(event) {
    if (isBanned) return;
    if (event.button === 2) return;
    
    requestFullscreen();

    // --- Lógica Anti-Cheat ---
    const now = _DateNow();
    if (_valClkRt(now) || _valClkRglrty(now)) {
        triggerBan(3600); // Baneo de 1 Hora
        return;
    }
    // --- Fin Lógica Anti-Cheat ---

    const baseGain = clickPower;
    const earnedScore = baseGain * levelMultiplier;

    score += earnedScore;
    gainXP(earnedScore); // Llama a gainXP, que ahora maneja el bonus de XP y el totalScore

    coins += 1;
    updateCoinsDisplay();

    showClickVisual(event, earnedScore);
    createClickParticles(event);
    updateUI();

    totalClicks++;
    if (totalClicks === 2000 && !modalShown && !internalUserId) { // Usar internalUserId
        showLoginModal();
        modalShown = true;
    }
}

function showClickVisual(event, amount) {
    const { clickerZone } = getDomElements();
    const visual = document.createElement('div');
    
    const fruitLevel = upgradeLevels['fruit_variety']?.level || 0;
    const unlockedFruits = fruits.slice(0, fruitLevel + 1);
    const randomFruit = unlockedFruits[_MathFloor(_MathRandom() * unlockedFruits.length)];
    
    visual.textContent = `${randomFruit} +${formatNumber(amount)}`;
    visual.classList.add('click-visual');

    const rect = clickerZone.getBoundingClientRect();
    const clickX = (event.touches ? event.touches[0].pageX : event.pageX) - rect.left;
    const clickY = (event.touches ? event.touches[0].pageY : event.pageY) - rect.top;

    visual.style.left = `${clickX}px`;
    visual.style.top = `${clickY}px`;

    clickerZone.appendChild(visual);

    setTimeout(() => {
        visual.remove();
    }, 1000);
}

function createClickParticles(event) {
    const { clickerZone } = getDomElements();
    const rect = clickerZone.getBoundingClientRect();
    const clickX = (event.touches ? event.touches[0].pageX : event.pageX) - rect.left;
    const clickY = (event.touches ? event.touches[0].pageY : event.pageY) - rect.top;

    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.classList.add('click-particle');
        clickerZone.appendChild(particle);

        const angle = _MathRandom() * _MathPI * 2;
        const distance = _MathRandom() * 30 + 20;
        const duration = _MathRandom() * 400 + 400;

        particle.style.transform = `translate(${clickX}px, ${clickY}px) scale(0)`;
        
        let startTime = null;
        function animateParticle(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            
            if (progress < duration) {
                const t = progress / duration;
                const scale = 1 - _MathPow(1 - t, 3); // easeOutCubic
                const currentX = clickX + _MathSin(angle) * distance * t;
                const currentY = clickY + _MathCos(angle) * distance * t;
                const opacity = 1 - t;
                
                particle.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
                particle.style.opacity = opacity;
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        }
        requestAnimationFrame(animateParticle);
    }
}

let ppsVisualTimer = null;
let ppsVisualElement = null;
function showPpsVisual(amount) {
    if (amount <= 0) return;
    
    if (!ppsVisualElement) {
        ppsVisualElement = document.createElement('div');
        ppsVisualElement.classList.add('pps-visual');
        document.querySelector('.stats').appendChild(ppsVisualElement);
    }
    
    ppsVisualElement.textContent = `+${formatNumber(amount)}`;
    ppsVisualElement.style.animation = 'none';
    ppsVisualElement.offsetHeight; 
    ppsVisualElement.style.animation = 'float-up-pps 1.5s ease-out forwards';

    if (ppsVisualTimer) clearTimeout(ppsVisualTimer);
    ppsVisualTimer = setTimeout(() => {
        if (ppsVisualElement) {
            ppsVisualElement.style.animation = 'none';
        }
    }, 1500);
}


// --- ANTI-CHEAT ---

function _valClkRt(now) {
    _clkTmstmps.push(now);
    _clkTmstmps = _clkTmstmps.filter(timestamp => now - timestamp < _cpsWnd);
    
    if (_clkTmstmps.length > _maxCPS) {
        console.warn(`Detección de Tasa de Clics: ${_clkTmstmps.length} CPS detectados.`);
        return true;
    }
    return false;
}

function _valClkRglrty(now) {
    if (_lct === 0) {
        _lct = now;
        return false;
    }

    const interval = now - _lct;
    _lct = now;
    
    if (interval < 10) { // Ignorar clics muy rápidos (macros/autoclickers de alta velocidad)
        return false;
    }

    _cIntvls.push(interval);
    if (_cIntvls.length > _cWnd) {
        _cIntvls.shift();
    }

    if (_cIntvls.length < _cWnd) {
        return false;
    }

    const stdDev = getStandardDeviation(_cIntvls);

    if (stdDev < _cThresh && stdDev !== 0) {
        console.warn(`Detección de Consistencia: Desviación estándar muy baja: ${stdDev}`);
        _cIntvls = []; // Resetear para evitar bans repetidos inmediatamente
        return true;
    }
    
    return false;
}

export function triggerBan(seconds) {
    if (isBanned) return; 
    
    const durationMs = seconds * 1000;
    banExpiresAt = _DateNow() + durationMs;
    isBanned = true;
    
    console.error(`USUARIO BANEADO por ${seconds} segundos.`);
    
    saveScore(false); 
    checkBanStatus();
}

export function checkBanStatus() {
    const { banCheckInterval: currentInterval } = getDomElements();
    if (currentInterval) clearInterval(currentInterval.value);

    const now = _DateNow();
    if (banExpiresAt > now) {
        isBanned = true;
        showBanScreen();
        
        getDomElements().banCheckInterval.value = setInterval(updateBanTimer, 1000);
    } else {
        isBanned = false;
        hideBanScreen();
    }
}

function showBanScreen() {
    let overlay = document.getElementById('ban-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ban-overlay';
        
        const title = document.createElement('h2');
        title.textContent = '¡BANEADO!';
        
        const message = document.createElement('p');
        message.textContent = 'Actividad sospechosa detectada (clics demasiado consistentes).';
        
        const timer = document.createElement('p');
        timer.id = 'ban-timer';
        
        overlay.appendChild(title);
        overlay.appendChild(message);
        overlay.appendChild(timer);
        
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    updateBanTimer();
}

function updateBanTimer() {
    const now = _DateNow();
    const timeLeft = banExpiresAt - now;
    
    if (timeLeft <= 0) {
        isBanned = false;
        hideBanScreen();
        const { banCheckInterval: currentInterval } = getDomElements();
        if (currentInterval.value) clearInterval(currentInterval.value);
    } else {
        const hours = _MathFloor(timeLeft / (1000 * 60 * 60));
        const minutes = _MathFloor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = _MathFloor((timeLeft % (1000 * 60)) / 1000);
        
        const timerEl = document.getElementById('ban-timer');
        if (timerEl) {
            timerEl.textContent = 
                `${hours.toString().padStart(2, '0')}:` +
                `${minutes.toString().padStart(2, '0')}:` +
                `${seconds.toString().padStart(2, '0')}`;
        }
    }
}

function hideBanScreen() {
    const overlay = document.getElementById('ban-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}


// --- FIREBASE: CARGA Y GUARDADO ---

export async function loadGameState() {
    if (!internalUserId) {
        resetGameState(true); // Reseteo total (isLogout = true)
        return;
    }
    const stateRef = ref(db, `userState/${internalUserId}`); // Usar internalUserId

    try {
        const snapshot = await get(stateRef);

        if (snapshot.exists()) {
            const savedState = snapshot.val();
            
            const lastSeen = savedState.lastSeen || _DateNow();

            score = savedState.score || 0;
            totalScore = savedState.totalScore || 0;
            level = savedState.level || 1;
            xp = savedState.xp || 0;
            totalClicks = savedState.totalClicks || 0;
            modalShown = savedState.modalShown || false;
            coins = savedState.coins || 0;
            currentSkin = savedState.currentSkin || 'default';
            banExpiresAt = savedState.banExpiresAt || 0;
            startprestige = savedState.startprestige || 0; // NUEVO: Cargar flag

            // --- NUEVO: Cargar datos de Prestigio ---
            prestigePoints = savedState.prestigePoints || 0;
            totalPrestigePoints = savedState.totalPrestigePoints || 0;
            
            // Cargar/Migrar niveles de Prestigio
            const savedPrestigeLevels = savedState.prestigeLevels || {};
            prestigeLevels = {};
            PRESTIGE_UPGRADES_CONFIG.forEach(config => {
                const savedUpgrade = savedPrestigeLevels[config.id];
                const currentLevel = savedUpgrade ? savedUpgrade.level : 0;
                let currentCost;

                if (config.maxLevel && currentLevel >= config.maxLevel) {
                    currentCost = null;
                } else {
                    currentCost = _MathCeil(config.initialCost * _MathPow(config.costMultiplier, currentLevel));
                }
                
                prestigeLevels[config.id] = {
                    level: currentLevel,
                    cost: currentCost
                };
            });
            // ----------------------------------------

            // Lógica de Migración de Mejoras (Recalculo de costos)
            const savedLevels = savedState.upgradeLevels || {};
            upgradeLevels = {}; 

            UPGRADES_CONFIG.forEach(config => {
                const savedUpgrade = savedLevels[config.id];
                const currentLevel = savedUpgrade ? savedUpgrade.level : 0;
                let currentCost;

                if (config.maxLevel && currentLevel >= config.maxLevel) {
                    currentCost = null; 
                } else {
                    currentCost = _MathCeil(config.initialCost * _MathPow(config.costMultiplier, currentLevel));
                }

                upgradeLevels[config.id] = {
                    level: currentLevel,
                    cost: currentCost
                };
            });
            
            // Lógica de migración de Skins
            skinsState = JSON.parse(JSON.stringify(SKINS_CONFIG));
            if (savedState.skins) {
                Object.keys(savedState.skins).forEach(skinId => {
                    if (skinsState[skinId]) {
                        skinsState[skinId].owned = savedState.skins[skinId].owned;
                        skinsState[skinId].unlocked = savedState.skins[skinId].unlocked;
                    }
                });
            }
            
            recalculateStats(); // Recalcula stats CON bonus de prestigio
            recalculateLevelStats();
            
            const now = _DateNow();
            let timeOfflineInSeconds = (now - lastSeen) / 1000;
            const maxOfflineTimeInSeconds = 10 * 60 * 60; // 10 horas
            const effectiveOfflineTime = _MathMin(timeOfflineInSeconds, maxOfflineTimeInSeconds);

            if (effectiveOfflineTime > 60) {
                const offlinePPS = pps * 0.05;
                const earnedOfflineScore = offlinePPS * effectiveOfflineTime * levelMultiplier;
                
                score += earnedOfflineScore;
                totalScore += earnedOfflineScore; // Añadir ganancia offline al total de esta ronda
                
                showOfflineEarningsModal(earnedOfflineScore, effectiveOfflineTime);
            }

        } else {
            console.log("No saved state found. Starting fresh.");
            resetGameState(true); // Reseteo total (isLogout = true)
        }
    } catch (error) {
        console.error("Error loading game state:", error);
        resetGameState(true); // Reseteo total (isLogout = true)
    } finally {
        isGameLoaded = true;
    }
    
    initializeStore(); 
    // initializePrestigeStore() se llamará desde ui_handlers

    updateUI();
    updateClickButtonSkin();
    updateSkinsUI();
    updateCoinsDisplay();
    updatePrestigeUI(); // Actualizar UI de prestigio al cargar
    checkBanStatus();
}

// Guardado de estado
export async function saveScore(manual = false) {
    const { saveStatus } = getDomElements();
    
    if (!isGameLoaded && manual === false) {
        console.warn("Guardado automático bloqueado: el juego aún no ha cargado.");
        return Promise.resolve(); 
    }

    if (!internalUserId || !db || !internalCurrentUsername) { // Usar internalUserId y internalCurrentUsername
        if (manual) {
            saveStatus.textContent = "Error: Debes iniciar sesión.";
            saveStatus.className = 'error';
        }
        return Promise.resolve();
    }
    
    if (!skinsState[currentSkin]) {
        currentSkin = 'default';
    }

    const scoreToSave = _MathFloor(totalScore); // El score del leaderboard es el total de la ronda
    const now = _DateNow();
    const currentPPS = pps * levelMultiplier;
    const currentSkinEmoji = skinsState[currentSkin]?.emoji || '👆';

    // --- NUEVO: Añadir estado de prestigio al guardado ---
    const stateToSave = {
        score: score,
        totalScore: totalScore,
        level: level,
        xp: xp,
        totalClicks: totalClicks,
        modalShown: modalShown,
        coins: coins,
        currentSkin: currentSkin,
        upgradeLevels: upgradeLevels,
        skins: skinsState,
        banExpiresAt: banExpiresAt,
        
        prestigePoints: prestigePoints, // NUEVO
        totalPrestigePoints: totalPrestigePoints, // NUEVO
        prestigeLevels: prestigeLevels, // NUEVO
        startprestige: startprestige, // NUEVO: Guardar flag
        
        lastSeen: now
    };
    // ----------------------------------------------------

    const p1 = set(ref(db, `userState/${internalUserId}`), stateToSave).catch((error) => { // Usar internalUserId
        console.error("Error saving game state:", error);
    });

    // Guardar en Leaderboard
    const p2 = set(ref(db, `leaderboard/${internalUserId}`), { // Usar internalUserId
        username: internalCurrentUsername, // Usar internalCurrentUsername
        score: scoreToSave, // Guardamos el totalScore de la ronda
        pps: currentPPS,
        lastSeen: now,
        skin: currentSkinEmoji,
        prestige: totalPrestigePoints // NUEVO: Guardar pipas totales para fardar
    }).then(() => {
        if (manual) {
            saveStatus.textContent = "¡Puntuación guardada!";
            saveStatus.className = 'success';
            setTimeout(() => { saveStatus.textContent = ""; }, 2000);
        }
    }).catch((error) => {
        if (manual) {
            saveStatus.textContent = "Error al guardar.";
            saveStatus.className = 'error';
        }
        console.error("Error al guardar puntuación:", error);
    });
    
    return Promise.all([p1, p2]);
}

// --- FIREBASE: CHAT DE TEXTO (Menos intensivo en consultas) ---
export function initializeChat() {
    const { chatMessagesContainer } = getDomElements();
    const chatRef = ref(db, 'chatMessages');
    const chatQuery = query(chatRef, orderByChild('timestamp'), limitToLast(50));
    
    // 1. Cargar el historial inicial (usando onValue y desuscribiéndose inmediatamente con get)
    get(chatQuery).then((snapshot) => {
        chatMessagesContainer.innerHTML = ''; // Limpiar antes de cargar historial
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            messages.push(childSnapshot.val());
        });
        
        // Mostrar todos los mensajes históricos cargados
        messages.forEach(msg => displayChatMessage(msg.username, msg.message, msg.skin));

        // 2. Escuchar solo los mensajes NUEVOS usando onChildAdded
        // Nota: onChildAdded se dispara para los elementos existentes al comienzo,
        // pero como ya los cargamos con 'get', esta llamada solo escuchará nuevos.
        // Sin embargo, si Firebase procesa la suscripción ANTES de que termine 'get',
        // puede haber duplicados. Un patrón más robusto es usar onValue y un tracker de ID.
        // Para simplificar y mejorar la intensidad, usaremos onChildAdded para los nuevos,
        A       // asumiendo que los mensajes históricos iniciales ya fueron mostrados.
        // Para evitar duplicados, solo usamos onChildAdded para mensajes con timestamp reciente.
        onChildAdded(chatRef, (snapshot) => {
             const data = snapshot.val();
             // Solo mostrar mensajes nuevos que tienen un timestamp muy reciente
             if (data.timestamp > (_DateNow() - 5000)) { 
                if (data.username !== internalCurrentUsername) {
                    showToastNotification(data.username, data.message, data.skin);
                }
                // Asegurarse de que no estamos volviendo a mostrar los del historial si la latencia es alta
                // (Esto es un compromiso, pero reduce la carga de lectura al inicio)
                displayChatMessage(data.username, data.message, data.skin);
             }
        });
    });
}

export function sendChatMessage() {
    const { chatInput } = getDomElements();
    const message = chatInput.value.trim();
    if (!message || !internalUserId || !internalCurrentUsername) { 
        return;
    }
    
    if (!skinsState[currentSkin]) {
        currentSkin = 'default';
    }
    const skinEmoji = skinsState[currentSkin]?.emoji || '👆';
    
    const chatRef = ref(db, 'chatMessages');
    // Usamos push para generar una nueva clave, y set para guardar el mensaje.
    // serverTimestamp se ha eliminado para usar Date.now() y optimizar la detección de nuevos mensajes para el toast.
    push(chatRef, { 
        username: internalCurrentUsername, 
        message: message,
        skin: skinEmoji,
        timestamp: _DateNow() 
    }).then(() => {
        chatInput.value = '';
    }).catch((e) => {
        console.error("Error al enviar mensaje:", e);
    });
}

// --- FIREBASE: CLASIFICACIÓN (LEADERBOARD) ---
export function loadLeaderboard() {
    const { leaderboardStatus, leaderboardList } = getDomElements();
    if (!db) return;
    const leaderboardRef = ref(db, 'leaderboard');
    // Ordenamos por 'score'
    const leaderboardQuery = query(leaderboardRef, orderByChild('score'), limitToLast(100));

    leaderboardStatus.style.display = 'flex';
    leaderboardList.style.display = 'none';

    onValue(leaderboardQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const scores = Object.entries(data).map(([uid, data]) => ({
                uid, ...data
            }));
            
            scores.sort((a, b) => b.score - a.score);

            leaderboardList.innerHTML = '';
            scores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.dataset.userId = entry.uid;
                li.dataset.baseScore = entry.score;
                li.dataset.pps = entry.pps || 0;
                li.dataset.lastSeen = entry.lastSeen || _DateNow();

                if (internalCurrentUsername && entry.username === internalCurrentUsername) { // Usar internalCurrentUsername
                    li.classList.add('current-user');
                }

                const rank = document.createElement('span');
                rank.textContent = `#${index + 1}`;
                rank.classList.add('rank');

                const name = document.createElement('span');
                name.classList.add('player-name');
                
                const statusDot = document.createElement('span');
                statusDot.classList.add('status-dot');
                
                const skinSpan = document.createElement('span');
                skinSpan.classList.add('player-skin');
                skinSpan.textContent = entry.skin || '👆'; 

                const nameSpan = document.createElement('span');
                nameSpan.textContent = entry.username || "Anónimo";
                
                name.appendChild(statusDot);
                name.appendChild(skinSpan);
                name.appendChild(nameSpan);

                const scoreVal = document.createElement('span');
                // NUEVO: Mostrar Pipas de Prestigio en el leaderboard si tienen
                const prestigeText = entry.prestige ? ` (Pipas: ${entry.prestige})` : '';
                scoreVal.textContent = formatNumber(entry.score) + prestigeText;
                scoreVal.classList.add('player-score');

                li.appendChild(rank);
                li.appendChild(name);
                li.appendChild(scoreVal);
                leaderboardList.appendChild(li);
            });

            leaderboardStatus.style.display = 'none';
            leaderboardList.style.display = 'block';
            updateLeaderboardPresenceStatus();

        } else {
            leaderboardStatus.innerHTML = '<span>¡Sé el primero en la clasificación!</span>';
            leaderboardList.style.display = 'none';
        }
    });
}

// --- NUEVA SECCIÓN: LÓGICA DE PRESTIGIO ---

// NUEVO: Límite máximo de ganancia de prestigio (respetando tu cambio)
const MAX_PRESTIGE_GAIN = 1000; 

/**
 * Calcula cuántas "Pipas de Prestigio" ganará el jugador.
 * @returns {number} - La cantidad de pipas a ganar.
 */
export function calculatePrestigeGain() {
    if (totalScore < PRESTIGE_REQUIREMENT) {
        return 0;
    }
    
    // Fórmula MODIFICADA: 5 * (score / req) ^ 0.7
    // Esto da más puntos que la raíz cuadrada (sqrt, ^0.5)
    // pero sigue teniendo rendimientos decrecientes (menos de ^1).
    const gain = _MathFloor(5 * _MathPow(totalScore / PRESTIGE_REQUIREMENT, 0.7));
    
    // Aplicar el máximo
    const finalGain = _MathMin(gain, MAX_PRESTIGE_GAIN);
    
    return _MathMax(1, finalGain); // Garantiza al menos 1 si cumples el requisito
}

/**
 * Ejecuta el reseteo por Prestigio.
 * Da pipas al jugador y resetea el progreso del juego.
 */
export function performPrestige() {
    const gain = calculatePrestigeGain();
    if (gain === 0) {
        console.warn("Intento de Prestigio fallido. No se cumple el requisito.");
        return;
    }
    
    prestigePoints += gain;
    totalPrestigePoints += gain;
    
    // Resetea el juego (isLogout = false), conservando prestigio y skins
    resetGameState(false); 
    
    // Llama a guardar inmediatamente
    saveScore(false);
    
    // Actualizar la UI (la función la crearemos en ui_handlers.js)
    updateUI();
    updatePrestigeUI();
    initializeStore(); // Reinicializar la tienda normal (costos reseteados)
}

/**
 * NUEVO: Resetea el juego para HABILITAR el prestigio.
 * Esta función es llamada por el nuevo botón.
 */
export function startPrestigeProcess() {
    resetGameState(false); // Resetea puntos, mejoras, nivel
    startprestige = 1;     // Pone la flag
    saveScore(false);      // Guarda el estado
    
    // Actualiza la UI para mostrar la tienda de prestigio
    updateUI();
    updatePrestigeUI();
    initializeStore(); // Reinicializar la tienda normal (costos reseteados)
}

/**
 * Compra una mejora de prestigio.
 * @param {string} key - El ID de la mejora de prestigio (ej: 'prestige_click_1').
 */
export function buyPrestigeUpgrade(key) {
    if (isBanned) return;
    
    const { sfxBuy } = getDomElements();
    
    const config = PRESTIGE_UPGRADES_CONFIG.find(u => u.id === key);
    if (!config) return;
    
    const state = prestigeLevels[key];
    if (!state) return;
    
    // No hay multi-buy (x10) para prestigio
    const cost = state.cost;
    if (cost === null) return; // Maxeado

    if (prestigePoints >= cost) {
        prestigePoints -= cost;
        state.level += 1;
        
        // Actualizar coste
        if (config.maxLevel && state.level >= config.maxLevel) {
            state.cost = null; // Maxeado
        } else {
            state.cost = _MathCeil(config.initialCost * _MathPow(config.costMultiplier, state.level));
        }
        
        // Recalcular stats INMEDIATAMENTE para aplicar el bonus
        recalculateStats();
        
        // Reproducir sonido
        sfxBuy.currentTime = 0;
        sfxBuy.play().catch(e => {});
        
        // Actualizar las UIs
        updateUI(); // Para PPS/PPC
        updatePrestigeUI(); // Para la tienda de prestigio
        
        // Guardar el cambio
        saveScore(false);
    }
}