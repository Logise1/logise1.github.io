import { 
    UPGRADES_CONFIG, SKINS_CONFIG, fruits, 
    auth, db, ref, set, query, orderByChild, limitToLast, onValue, get, onDisconnect, 
    push, serverTimestamp, onChildAdded,
    _DateNow, _MathSqrt, _MathPow, _MathCeil, _MathRandom, _MathFloor, _MathAbs, _MathMin, _MathPI, _MathSin, _MathCos,
    bgPatternTemplates
} from './config.js';
import { 
    updateUI, updateCoinsDisplay, initializeStore, updateSkinsUI, updateClickButtonSkin,
    showLoginModal, showOfflineEarningsModal, showToastNotification, displayChatMessage, 
    getDomElements, updateLeaderboardPresenceStatus, updateLeaderboardVisualTicking 
} from './ui_handlers.js';


// --- VARIABLES DE ESTADO DEL JUEGO ---
export let score = 0;
export let clickPower = 1;
export let pps = 0;
export let level = 1;
export let xp = 0;
export let xpToNextLevel = 100;
export let levelMultiplier = 1.0;
export let totalScore = 0;
export let totalClicks = 0;
export let modalShown = false;
export let coins = 0;
export let currentSkin = 'default';
export let skinsState = {};
export let upgradeLevels = {};
export let globalPresence = {};

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

// Setter para GlobalPresence (CORRECCIÓN V3)
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

export function resetGameState(isLoggedIn = false) {
    score = 0;
    totalScore = 0;
    level = 1;
    xp = 0;
    totalClicks = 0;
    modalShown = false;
    coins = 0;
    currentSkin = 'default';
    isBanned = false;
    banExpiresAt = 0;
    _lct = 0;
    _cIntvls = [];
    _clkTmstmps = [];

    // Inicializa upgradeLevels desde la config
    upgradeLevels = {};
    UPGRADES_CONFIG.forEach(upgrade => {
        upgradeLevels[upgrade.id] = {
            level: 0,
            cost: upgrade.initialCost
        };
    });

    // Clonar el estado inicial de las skins
    skinsState = JSON.parse(JSON.stringify(SKINS_CONFIG));

    recalculateStats(); 
    recalculateLevelStats();
    
    if (!isLoggedIn) {
        isGameLoaded = true; 
        initializeStore();
    }
    
    updateUI(); 
    updateSkinsUI(); 
    checkBanStatus();
    updateClickButtonSkin();
}

export function gainXP(amount) {
    const { sfxNextLevel } = getDomElements();
    xp += amount;
    totalScore += amount; 

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
    
    // 3. Aplicar todos los multiplicadores
    let finalClickPower = (newClickPower);
    finalClickPower *= (1 + clickMultiplierBonus);
    finalClickPower *= (1 + synergyClickBonus);
    finalClickPower *= (1 + levelClickBonus);
    
    let finalPPS = (newPPS);
    finalPPS *= (1 + autoMultiplierBonus);
    finalPPS *= (1 + synergyAutoBonus);
    finalPPS *= (1 + levelAutoBonus);

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
    gainXP(earnedScore); 

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
        resetGameState(false);
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
            
            recalculateStats();
            recalculateLevelStats();
            
            const now = _DateNow();
            let timeOfflineInSeconds = (now - lastSeen) / 1000;
            const maxOfflineTimeInSeconds = 10 * 60 * 60; // 10 horas
            const effectiveOfflineTime = _MathMin(timeOfflineInSeconds, maxOfflineTimeInSeconds);

            if (effectiveOfflineTime > 60) {
                const offlinePPS = pps * 0.05;
                const earnedOfflineScore = offlinePPS * effectiveOfflineTime * levelMultiplier;
                
                score += earnedOfflineScore;
                totalScore += earnedOfflineScore;
                
                showOfflineEarningsModal(earnedOfflineScore, effectiveOfflineTime);
            }

        } else {
            console.log("No saved state found. Starting fresh.");
            resetGameState(true);
        }
    } catch (error) {
        console.error("Error loading game state:", error);
        resetGameState(true);
    } finally {
        isGameLoaded = true;
    }
    
    initializeStore(); 

    updateUI();
    updateClickButtonSkin();
    updateSkinsUI();
    updateCoinsDisplay();
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

    const scoreToSave = _MathFloor(totalScore);
    const now = _DateNow();
    const currentPPS = pps * levelMultiplier;
    const currentSkinEmoji = skinsState[currentSkin]?.emoji || '👆';

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
        lastSeen: now
    };

    const p1 = set(ref(db, `userState/${internalUserId}`), stateToSave).catch((error) => { // Usar internalUserId
        console.error("Error saving game state:", error);
    });

    const p2 = set(ref(db, `leaderboard/${internalUserId}`), { // Usar internalUserId
        username: internalCurrentUsername, // Usar internalCurrentUsername
        score: scoreToSave,
        pps: currentPPS,
        lastSeen: now,
        skin: currentSkinEmoji
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

// --- FIREBASE: CHAT ---
export function initializeChat() {
    const { chatMessagesContainer, chatInput, chatSendBtn } = getDomElements();
    const chatRef = ref(db, 'chatMessages');
    const chatQuery = query(chatRef, limitToLast(50));
    
    onChildAdded(chatQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            displayChatMessage(data.username, data.message, data.skin);
            const messageTime = data.timestamp || 0;
            // Solo mostrar toast para mensajes que no sean del usuario actual
            const isRecent = (_DateNow() - messageTime) < 30000;
            
            if (data.username !== internalCurrentUsername && isRecent) { // Usar internalCurrentUsername
                showToastNotification(data.username, data.message, data.skin);
            }
        }
    });
    
    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !chatSendBtn.disabled) {
            sendChatMessage();
        }
    });
}

export function sendChatMessage() {
    const { chatInput } = getDomElements();
    const message = chatInput.value.trim();
    if (!message || !internalUserId || !internalCurrentUsername) { // Usar internalUserId y internalCurrentUsername
        return;
    }
    
    if (!skinsState[currentSkin]) {
        currentSkin = 'default';
    }
    const skinEmoji = skinsState[currentSkin]?.emoji || '👆';
    
    const chatRef = ref(db, 'chatMessages');
    push(chatRef, {
        username: internalCurrentUsername, // Usar internalCurrentUsername
        message: message,
        skin: skinEmoji,
        timestamp: _DateNow() // Usamos Date.now() para la lógica del toast, y Firebase lo guarda como serverTimestamp
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
                scoreVal.textContent = formatNumber(entry.score);
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