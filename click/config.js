import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword as FBCreateUser, // Renombrar para evitar conflictos
    signInWithEmailAndPassword as FBSignIn,       // Renombrar
    signOut as FBSignOut,                         // Renombrar
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    set,
    query,
    orderByChild,
    limitToLast,
    onValue,
    get as FBGet, // Renombrar
    onDisconnect,
    push, 
    serverTimestamp, 
    onChildAdded
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// --- EXPORTACIONES CLAVE DE FIREBASE ---
export const createUserWithEmailAndPassword = FBCreateUser;
export const signInWithEmailAndPassword = FBSignIn;
export const signOut = FBSignOut;
export const get = FBGet;

// Exportamos también las funciones restantes para que estén disponibles
export { ref, set, query, orderByChild, limitToLast, onValue, onDisconnect, push, serverTimestamp, onChildAdded, onAuthStateChanged };

// --- CONFIGURACIÓN DE FIREBASE PARA EL JUEGO PRINCIPAL (Game State, Leaderboard, Text Chat) ---
const GAME_FIREBASE_CONFIG = {
    apiKey: "AIzaSyB_y8OqwksVYbzKZgjSFmzgD2AOg32CsI4",
    authDomain: "shittyclicker.firebaseapp.com",
    databaseURL: "https://shittyclicker-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "shittyclicker",
    storageBucket: "shittyclicker.firebasestorage.app",
    messagingSenderId: "585004353396",
    appId: "1:585004353396:web:fcabf12ba0d695ed0ece21",
    measurementId: "G-XRYBFXCYPG"
};

// --- Configuración de Firebase para Chat de Voz ELIMINADA ---

let gameApp;

try {
    gameApp = getApp('gameApp');
} catch (e) {
    gameApp = initializeApp(GAME_FIREBASE_CONFIG, 'gameApp');
}

export const auth = getAuth(gameApp);
export const db = getDatabase(gameApp); // DB para juego principal
// voiceDb ELIMINADO

// --- CONSTANTES GLOBALES DE JUEGO ---
export const fruits = ["🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", "🥝"];

export const SKINS_CONFIG = {
    default: { name: "Clásico", emoji: "👆", cost: 0, unlocked: true, owned: true },
    smile: { name: "Feliz", emoji: "😊", cost: 5, unlocked: false, owned: false },
    heart: { name: "Corazón", emoji: "❤️", cost: 25, unlocked: false, owned: false },
    star: { name: "Estrella", emoji: "⭐", cost: 100, unlocked: false, owned: false },
    fire: { name: "Fuego", emoji: "🔥", cost: 500, unlocked: false, owned: false },
    diamond: { name: "Diamante", emoji: "💎", cost: 2500, unlocked: false, owned: false },
    ghost: { name: "Fantasma", emoji: "👻", cost: 10000, unlocked: false, owned: false },
    rocket: { name: "Cohete", emoji: "🚀", cost: 50000, unlocked: false, owned: false },
    crown: { name: "Corona", emoji: "👑", cost: 250000, unlocked: false, owned: false },
    skull: { name: "Calavera", emoji: "💀", cost: 1000000, unlocked: false, owned: false },
    alien: { name: "Alienígena", emoji: "👽", cost: 7500000, unlocked: false, owned: false },
    robot: { name: "Robot", emoji: "🤖", cost: 50000000, unlocked: false, owned: false }
};

// --- CONSTANTES MATEMÁTICAS ---
export const _DateNow = Date.now;
export const _MathSqrt = Math.sqrt;
export const _MathPow = Math.pow;
export const _MathCeil = Math.ceil;
export const _MathRandom = Math.random;
export const _MathFloor = Math.floor;
export const _MathAbs = Math.abs;
export const _MathMin = Math.min;
export const _MathPI = Math.PI;
export const _MathSin = Math.sin;
export const _MathCos = Math.cos;

// --- PLANTILLAS DE FONDO ---
export const bgPatternTemplates = [
    // Patrón 1: Puntos
    (color) => {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>
                        <rect width='14' height='14' fill='none'/>
                        <circle cx='7' cy='7' r='1.5' fill='${color}' fill-opacity='0.5'/>
                     </svg>`;
        return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    },
    // Patrón 2: Líneas diagonales
    (color) => {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'>
                        <rect width='20' height='20' fill='none'/>
                        <path d='M-5,5 l10,-10 M0,20 l20,-20 M15,25 l10,-10' stroke='${color}' stroke-width='1' stroke-opacity='0.3'/>
                     </svg>`;
        return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    },
    // Patrón 3: Cuadrícula
    (color) => {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'>
                        <rect width='20' height='20' fill='none'/>
                        <path d='M0,10 H20 M10,0 V20' stroke='${color}' stroke-width='1' stroke-opacity='0.2'/>
                     </svg>`;
        return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    },
    // Patrón 4: Checks sutiles
    (color) => {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'>
                        <rect width='20' height='20' fill='none'/>
                        <rect x='0' y='0' width='10' height='10' fill='${color}' fill-opacity='0.1'/>
                        <rect x='10' y='10' width='10' height='10' fill='${color}' fill-opacity='0.1'/>
                     </svg>`;
        return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    }
];

// --- CONFIGURACIÓN DE MEJORAS ---
export const UPGRADES_CONFIG = [
    // Clics (Producción)
    { id: 'click_1', name: 'Dedos Ágiles', emoji: '👆', description: '+2 por clic', initialCost: 14, costMultiplier: 1.08, type: 'clickValue', value: 2 },
    { id: 'click_2', name: 'Muñeca Entrenada', emoji: '💪', description: '+10 por clic', initialCost: 70, costMultiplier: 1.15, type: 'clickValue', value: 10 },
    { id: 'click_3', name: 'Clic Potente', emoji: '💥', description: '+50 por clic', initialCost: 350, costMultiplier: 1.20, type: 'clickValue', value: 50 },
    { id: 'click_4', name: 'Super Clic', emoji: '🚀', description: '+200 por clic', initialCost: 1400, costMultiplier: 1.25, type: 'clickValue', value: 200 },
    { id: 'click_5', name: 'Clic Divino', emoji: '✨', description: '+1k por clic', initialCost: 7000, costMultiplier: 1.30, type: 'clickValue', value: 1000 },
    { id: 'click_6', name: 'Mega Clic', emoji: '🌠', description: '+5k por clic', initialCost: 35000, costMultiplier: 1.35, type: 'clickValue', value: 5000 },
    { id: 'click_7', name: 'Giga Clic', emoji: '🌌', description: '+25k por clic', initialCost: 175000, costMultiplier: 1.40, type: 'clickValue', value: 25000 },
    { id: 'click_8', name: 'Tera Clic', emoji: '⚡', description: '+125k por clic', initialCost: 875000, costMultiplier: 1.45, type: 'clickValue', value: 125000 },
    { id: 'click_9', name: 'Peta Clic', emoji: '👑', description: '+600k por clic', initialCost: 4200000, costMultiplier: 1.50, type: 'clickValue', value: 600000 },
    { id: 'click_10', name: 'Exa Clic', emoji: '💎', description: '+3M por clic', initialCost: 21000000, costMultiplier: 1.55, type: 'clickValue', value: 3000000 },
    { id: 'click_11', name: 'Zetta Clic', emoji: '👽', description: '+15M por clic', initialCost: 1e9, costMultiplier: 1.60, type: 'clickValue', value: 1.5e7 },
    { id: 'click_12', name: 'Yotta Clic', emoji: '🤖', description: '+75M por clic', initialCost: 5e9, costMultiplier: 1.65, type: 'clickValue', value: 7.5e7 },
    { id: 'click_13', name: 'Clic Infinito', emoji: '♾️', description: '+350M por clic', initialCost: 2e10, costMultiplier: 1.70, type: 'clickValue', value: 3.5e8 },
    { id: 'click_14', name: 'Clic Cósmico', emoji: '💫', description: '+1.5B por clic', initialCost: 1e12, costMultiplier: 1.70, type: 'clickValue', value: 1.5e9 },
    { id: 'click_15', name: 'Pulso Galáctico', emoji: '🌠', description: '+7B por clic', initialCost: 8e12, costMultiplier: 1.72, type: 'clickValue', value: 7e9 },
    { id: 'click_16', name: 'Toque Universal', emoji: '🪐', description: '+30B por clic', initialCost: 5e13, costMultiplier: 1.74, type: 'clickValue', value: 3e10 },
    { id: 'click_17', name: 'Fuerza Primordial', emoji: '🔥', description: '+150B por clic', initialCost: 4e14, costMultiplier: 1.76, type: 'clickValue', value: 1.5e11 },
    { id: 'click_171', name: 'Energía Primordial', emoji: '⚡', description: '+75B por clic', initialCost: 2e14, costMultiplier: 1.75, type: 'clickValue', value: 7.5e10 },
    { id: 'click_172', name: 'Esencia Primordial', emoji: '🌟', description: '+100B por clic', initialCost: 3e14, costMultiplier: 1.76, type: 'clickValue', value: 1e11 },
    { id: 'click_173', name: 'Alma Primordial', emoji: '💠', description: '+125B por clic', initialCost: 3.5e14, costMultiplier: 1.77, type: 'clickValue', value: 1.25e11 },
    { id: 'click_18', name: 'Decreto Divino', emoji: '📜', description: '+700B por clic', initialCost: 3e15, costMultiplier: 1.78, type: 'clickValue', value: 7e11 },
    { id: 'click_19', name: 'Clic Metafísico', emoji: '🧠', description: '+3T por clic', initialCost: 2e16, costMultiplier: 1.80, type: 'clickValue', value: 3e12 },
    { id: 'click_20', name: 'El Último Clic', emoji: '🏆', description: '+12T por clic', initialCost: 1.5e17, costMultiplier: 1.82, type: 'clickValue', value: 1.2e13 },
    { id: 'click_21', name: 'Vórtice de Ideas', emoji: '🌀', description: '+45T por clic', initialCost: 1.8e18, costMultiplier: 1.84, type: 'clickValue', value: 4.5e13 },
    { id: 'click_22', name: 'Idea Pura', emoji: '💡', description: '+180T por clic', initialCost: 2e19, costMultiplier: 1.86, type: 'clickValue', value: 1.8e14 },
    { id: 'click_23', name: 'Toque Multiversal', emoji: '🌌', description: '+700T por clic', initialCost: 2.2e20, costMultiplier: 1.88, type: 'clickValue', value: 7e14 },
    { id: 'click_24', name: 'Singularidad Manual', emoji: '💥', description: '+2.8Qa por clic', initialCost: 2.5e21, costMultiplier: 1.90, type: 'clickValue', value: 2.8e15 },
    { id: 'click_25', name: 'Clic de Dios', emoji: '🙏', description: '+15Qa por clic', initialCost: 3e22, costMultiplier: 1.85, type: 'clickValue', value: 1.5e16 }, // Antes 11Qa, costMultiplier 1.91
    { id: 'click_26', name: 'El Fin', emoji: '🔚', description: '+50Qa por clic', initialCost: 3.5e23, costMultiplier: 1.87, type: 'clickValue', value: 5e16 }, // Antes 40Qa, costMultiplier 1.92
    { id: 'click_27', name: 'Quasar', emoji: '☄️', description: '+200Qa por clic', initialCost: 4e24, costMultiplier: 1.89, type: 'clickValue', value: 2e17 }, // Antes 150Qa, costMultiplier 1.93
    { id: 'click_28', name: 'Supernova', emoji: '💥', description: '+700Qa por clic', initialCost: 5e25, costMultiplier: 1.91, type: 'clickValue', value: 7e17 }, // Antes 500Qa, costMultiplier 1.94
    { id: 'click_29', name: 'Púlsar', emoji: '💫', description: '+2Qi por clic', initialCost: 6e26, costMultiplier: 1.93, type: 'clickValue', value: 2e18 }, // Antes 1.8Qi
    { id: 'click_30', name: 'Magnetar', emoji: '🌠', description: '+8Qi por clic', initialCost: 7e27, costMultiplier: 1.95, type: 'clickValue', value: 8e18 }, // Antes 6Qi
    { id: 'click_31', name: 'Hipernova', emoji: '✨', description: '+30Qi por clic', initialCost: 8e28, costMultiplier: 1.96, type: 'clickValue', value: 3e19 }, // Antes 20Qi
    { id: 'click_32', name: 'Materia Oscura', emoji: '⚫', description: '+100Qi por clic', initialCost: 9e29, costMultiplier: 1.97, type: 'clickValue', value: 1e20 }, // Antes 70Qi
    { id: 'click_33', name: 'Energía Oscura', emoji: '🌌', description: '+250Qi por clic', initialCost: 1e31, costMultiplier: 1.99, type: 'clickValue', value: 2.5e20 },
    { id: 'click_34', name: 'Big Bang', emoji: '💥', description: '+900Qi por clic', initialCost: 1.2e32, costMultiplier: 2.00, type: 'clickValue', value: 9e20 },
    { id: 'click_35', name: 'Big Crunch', emoji: '🌀', description: '+3.5Sx por clic', initialCost: 1.5e33, costMultiplier: 2.01, type: 'clickValue', value: 3.5e21 },
    { id: 'click_36', name: 'Conciencia Pura', emoji: '🧘', description: '+12Sx por clic', initialCost: 2e34, costMultiplier: 2.02, type: 'clickValue', value: 1.2e22 },
    { id: 'click_37', name: 'Nirvana', emoji: '🕉️', description: '+40Sx por clic', initialCost: 2.5e35, costMultiplier: 2.03, type: 'clickValue', value: 4e22 },
    { id: 'click_38', name: 'Ojo de Dios', emoji: '👁️', description: '+150Sx por clic', initialCost: 3e36, costMultiplier: 2.04, type: 'clickValue', value: 1.5e23 },
    { id: 'click_39', name: 'Voluntad Divina', emoji: '📜', description: '+500Sx por clic', initialCost: 4e37, costMultiplier: 2.05, type: 'clickValue', value: 5e23 },
    { id: 'click_40', name: 'Panteón', emoji: '🏛️', description: '+1.8Sp por clic', initialCost: 5e38, costMultiplier: 2.06, type: 'clickValue', value: 1.8e24 },
    { id: 'click_41', name: 'Ragnarok', emoji: '🔥', description: '+6Sp por clic', initialCost: 6e39, costMultiplier: 2.08, type: 'clickValue', value: 6e24 },
    { id: 'click_42', name: 'Azathoth', emoji: '🐙', description: '+20Sp por clic', initialCost: 7e40, costMultiplier: 2.10, type: 'clickValue', value: 2e25 },
    { id: 'click_43', name: 'Yog-Sothoth', emoji: '🔑', description: '+70Sp por clic', initialCost: 8e41, costMultiplier: 2.12, type: 'clickValue', value: 7e25 },
    { id: 'click_44', name: 'Clic del Vacío', emoji: '🕳️', description: '+250Sp por clic', initialCost: 1e43, costMultiplier: 2.14, type: 'clickValue', value: 2.5e26 },
    // === CAMBIO CLAVE 2: Reducción de Cost Multiplier en las últimas mejoras ===
    { id: 'click_45', name: 'A-Omega', emoji: '♎', description: '+900Sp por clic', initialCost: 1.2e44, costMultiplier: 1.85, type: 'clickValue', value: 9e26 }, // Antes 1.95
    { id: 'click_46', name: 'El Creador', emoji: '🌌', description: '+3.5Oc por clic', initialCost: 1.5e45, costMultiplier: 1.85, type: 'clickValue', value: 3.5e27 }, // Antes 1.95

    // Auto (Producción)
    { id: 'auto_1', name: 'Cursor Tímido', emoji: '🖱️', description: '+1 pps', initialCost: 7, costMultiplier: 1.15, type: 'autoClickValue', value: 1 },
    { id: 'auto_2', name: 'Abuela Ayudante', emoji: '👵', description: '+8 pps', initialCost: 56, costMultiplier: 1.20, type: 'autoClickValue', value: 8 },
    { id: 'auto_3', name: 'Granja de Clics', emoji: '🧑‍🌾', description: '+40 pps', initialCost: 280, costMultiplier: 1.25, type: 'autoClickValue', value: 40 },
    { id: 'auto_4', name: 'Fábrica Frutal', emoji: '🏭', description: '+200 pps', initialCost: 1400, costMultiplier: 1.30, type: 'autoClickValue', value: 200 },
    { id: 'auto_5', name: 'Mina de Puntos', emoji: '⛏️', description: '+1k pps', initialCost: 7000, costMultiplier: 1.35, type: 'autoClickValue', value: 1000 },
    { id: 'auto_6', name: 'Banco de Clics', emoji: '🏦', description: '+5k pps', initialCost: 35000, costMultiplier: 1.40, type: 'autoClickValue', value: 5000 },
    { id: 'auto_7', name: 'Templo del Clic', emoji: '🏛️', description: '+25k pps', initialCost: 175000, costMultiplier: 1.45, type: 'autoClickValue', value: 25000 },
    { id: 'auto_8', name: 'Alquimia Frutal', emoji: '⚗️', description: '+120k pps', initialCost: 840000, costMultiplier: 1.50, type: 'autoClickValue', value: 120000 },
    { id: 'auto_9', name: 'Portal Interdimensional', emoji: '🌀', description: '+600k pps', initialCost: 4200000, costMultiplier: 1.55, type: 'autoClickValue', value: 600000 },
    { id: 'auto_10', name: 'Máquina del Tiempo', emoji: '⏳', description: '+3M pps', initialCost: 21000000, costMultiplier: 1.60, type: 'autoClickValue', value: 3000000 },
    { id: 'auto_11', name: 'Generador Singularidad', emoji: '👾', description: '+15M pps', initialCost: 7e9, costMultiplier: 1.65, type: 'autoClickValue', value: 1.5e7 },
    { id: 'auto_12', name: 'Agujero Negro Puntos', emoji: '🕳️', description: '+70M pps', initialCost: 4e10, costMultiplier: 1.70, type: 'autoClickValue', value: 7e7 },
    { id: 'auto_13', name: 'Realidad Alternativa', emoji: '❓', description: '+300M pps', initialCost: 2e11, costMultiplier: 1.75, type: 'autoClickValue', value: 3e8 },
    { id: 'auto_14', name: 'Extractor del Vacío', emoji: '🔭', description: '+1.2B pps', initialCost: 1.2e12, costMultiplier: 1.75, type: 'autoClickValue', value: 1.2e9 },
    { id: 'auto_15', name: 'Nebulosa de Puntos', emoji: '✨', description: '+6B pps', initialCost: 9e12, costMultiplier: 1.77, type: 'autoClickValue', value: 6e9 },
    { id: 'auto_16', name: 'Conciencia Cósmica', emoji: '👁️', description: '+25B pps', initialCost: 6e13, costMultiplier: 1.79, type: 'autoClickValue', value: 2.5e10 },
    { id: 'auto_17', name: 'Motor de Realidad', emoji: '⚙️', description: '+120B pps', initialCost: 5e14, costMultiplier: 1.81, type: 'autoClickValue', value: 1.2e11 },
    { id: 'auto_18', name: 'Omnipresencia', emoji: '🌌', description: '+550B pps', initialCost: 4e15, costMultiplier: 1.83, type: 'autoClickValue', value: 5.5e11 },
    { id: 'auto_19', name: 'Fuente Infinita', emoji: '⛲', description: '+2.5T pps', initialCost: 3e16, costMultiplier: 1.85, type: 'autoClickValue', value: 2.5e12 },
    { id: 'auto_20', name: 'Fin del Tiempo', emoji: '⌛', description: '+10T pps', initialCost: 2.5e17, costMultiplier: 1.87, type: 'autoClickValue', value: 1e13 },
    { id: 'auto_21', name: 'Fábrica de ADN', emoji: '🧬', description: '+40T pps', initialCost: 2.8e18, costMultiplier: 1.89, type: 'autoClickValue', value: 4e13 },
    { id: 'auto_22', name: 'Núcleo Estelar', emoji: '☀️', description: '+160T pps', initialCost: 3e19, costMultiplier: 1.91, type: 'autoClickValue', value: 1.6e14 },
    { id: 'auto_23', name: 'Cosechador Galáctico', emoji: '🌠', description: '+650T pps', initialCost: 3.3e20, costMultiplier: 1.93, type: 'autoClickValue', value: 6.5e14 },
    { id: 'auto_24', name: 'El Gran Atractor', emoji: '🌀', description: '+2.6Qa pps', initialCost: 3.6e21, costMultiplier: 1.95, type: 'autoClickValue', value: 2.6e15 },
    { id: 'auto_25', name: 'Motor Infinito', emoji: '♾️', description: '+15Qa pps', initialCost: 4e22, costMultiplier: 1.85, type: 'autoClickValue', value: 1.5e16 }, // Antes 10Qa, costMultiplier 1.96
    { id: 'auto_26', name: 'El Creador (Auto)', emoji: '✨', description: '+50Qa pps', initialCost: 4.5e23, costMultiplier: 1.87, type: 'autoClickValue', value: 5e16 }, // Antes 40Qa, costMultiplier 1.97
    { id: 'auto_27', name: 'Ejército de Clones', emoji: '👥', description: '+200Qa pps', initialCost: 5e24, costMultiplier: 1.89, type: 'autoClickValue', value: 2e17 }, // Antes 150Qa, costMultiplier 1.98
    { id: 'auto_28', name: 'Enjambre de IA', emoji: '🤖', description: '+700Qa pps', initialCost: 6e25, costMultiplier: 1.91, type: 'autoClickValue', value: 7e17 }, // Antes 500Qa, costMultiplier 1.99
    { id: 'auto_29', name: 'Red Neuronal', emoji: '🧠', description: '+2Qi pps', initialCost: 7e26, costMultiplier: 1.93, type: 'autoClickValue', value: 2e18 }, // Antes 1.8Qi
    { id: 'auto_30', name: 'IA Sentiente', emoji: '💡', description: '+8Qi pps', initialCost: 8e27, costMultiplier: 1.95, type: 'autoClickValue', value: 8e18 }, // Antes 6Qi
    { id: 'auto_31', name: 'Dominio de la IA', emoji: '👑', description: '+30Qi pps', initialCost: 9e28, costMultiplier: 1.96, type: 'autoClickValue', value: 3e19 }, // Antes 20Qi
    { id: 'auto_32', name: 'Simulación Ancestral', emoji: '💻', description: '+100Qi pps', initialCost: 1e30, costMultiplier: 1.97, type: 'autoClickValue', value: 1e20 }, // Antes 70Qi
    { id: 'auto_33', name: 'Mundo Matriz', emoji: '🟩', description: '+250Qi pps', initialCost: 1.2e31, costMultiplier: 2.04, type: 'autoClickValue', value: 2.5e20 },
    { id: 'auto_34', name: 'Constructor Universal', emoji: '🛠️', description: '+900Qi pps', initialCost: 1.5e32, costMultiplier: 2.05, type: 'autoClickValue', value: 9e20 },
    { id: 'auto_35', name: 'Esfera de Dyson', emoji: '☀️', description: '+3.5Sx pps', initialCost: 2e33, costMultiplier: 2.06, type: 'autoClickValue', value: 3.5e21 },
    { id: 'auto_36', name: 'Computronium', emoji: '🧱', description: '+12Sx pps', initialCost: 2.5e34, costMultiplier: 2.07, type: 'autoClickValue', value: 1.2e22 },
    { id: 'auto_37', name: 'Cerebro de Júpiter', emoji: '🪐', description: '+40Sx pps', initialCost: 3e35, costMultiplier: 2.08, type: 'autoClickValue', value: 4e22 },
    { id: 'auto_38', name: 'Red Galáctica', emoji: '🌌', description: '+150Sx pps', initialCost: 4e36, costMultiplier: 2.10, type: 'autoClickValue', value: 1.5e23 },
    { id: 'auto_39', name: 'Motor de Azathoth', emoji: '🐙', description: '+500Sx pps', initialCost: 5e37, costMultiplier: 2.12, type: 'autoClickValue', value: 5e23 },
    { id: 'auto_40', name: 'Coro Celestial', emoji: '🎶', description: '+1.8Sp pps', initialCost: 6e38, costMultiplier: 2.14, type: 'autoClickValue', value: 1.8e24 },
    { id: 'auto_41', name: 'Frecuencia Omega', emoji: '♎', description: '+6Sp pps', initialCost: 7e39, costMultiplier: 2.16, type: 'autoClickValue', value: 6e24 },
    { id: 'auto_42', name: 'El Telar del Destino', emoji: '🕸️', description: '+20Sp pps', initialCost: 8e40, costMultiplier: 2.18, type: 'autoClickValue', value: 2e25 },
    { id: 'auto_43', name: 'Eco del Principio', emoji: '🌀', description: '+70Sp pps', initialCost: 9e41, costMultiplier: 2.20, type: 'autoClickValue', value: 7e25 },
    // === CAMBIO CLAVE 2: Reducción de Cost Multiplier en las últimas mejoras ===
    { id: 'auto_44', name: 'Flujo Infinito', emoji: '🌊', description: '+250Sp pps', initialCost: 1.2e43, costMultiplier: 1.85, type: 'autoClickValue', value: 2.5e26 }, // Antes 1.95
    { id: 'auto_45', name: 'Deus Ex Machina', emoji: '⚙️', description: '+900Sp pps', initialCost: 1.5e44, costMultiplier: 1.85, type: 'autoClickValue', value: 9e26 }, // Antes 1.95
    { id: 'auto_46', name: 'La Singularidad', emoji: '🕳️', description: '+3.5Oc pps', initialCost: 2e45, costMultiplier: 1.85, type: 'autoClickValue', value: 3.5e27 }, // Antes 1.95

    // Multiplicadores de Clic
    { id: 'click_mult_1', name: 'Guantes de Poder', emoji: '🧤', description: 'Clics x1.1', initialCost: 1000, costMultiplier: 2.0, type: 'clickMultiplier', value: 1.1, maxLevel: 1 },
    { id: 'click_mult_2', name: 'Energía Cósmica', emoji: '🪐', description: 'Clics x1.2', initialCost: 50000, costMultiplier: 2.5, type: 'clickMultiplier', value: 1.2, maxLevel: 1 },
    { id: 'click_mult_3', name: 'Bendición Frutal', emoji: '🙏', description: 'Clics x1.5', initialCost: 1000000, costMultiplier: 3.0, type: 'clickMultiplier', value: 1.5, maxLevel: 1 },
    { id: 'click_mult_4', name: 'Furia del Clicker', emoji: '😠', description: 'Clics x2', initialCost: 50000000, costMultiplier: 3.5, type: 'clickMultiplier', value: 2.0, maxLevel: 1 },
    { id: 'click_mult_5', name: 'Singularidad', emoji: '⚫', description: 'Clics x3', initialCost: 1000000000, costMultiplier: 4.0, type: 'clickMultiplier', value: 3.0, maxLevel: 1 },
    { id: 'click_mult_6', name: 'Esencia de Clic', emoji: '👻', description: 'Clics x5', initialCost: 5e10, costMultiplier: 4.5, type: 'clickMultiplier', value: 5.0, maxLevel: 1 },
    { id: 'click_mult_7', name: 'Amplificador Total', emoji: '🔊', description: 'Clics x10', initialCost: 1e19, costMultiplier: 5, type: 'clickMultiplier', value: 10.0, maxLevel: 1 },
    { id: 'click_mult_8', name: 'Potencia Absoluta', emoji: '💯', description: 'Clics x20', initialCost: 5e21, costMultiplier: 6, type: 'clickMultiplier', value: 20.0, maxLevel: 1 },
    { id: 'click_mult_9', name: 'Dominio Final', emoji: '🌠', description: 'Clics x50', initialCost: 5e23, costMultiplier: 5, type: 'clickMultiplier', value: 50.0, maxLevel: 1 }, // Antes 7

    // Multiplicadores de Auto
    { id: 'auto_mult_1', name: 'Engranajes Precisos', emoji: '⚙️', description: 'PPS x1.1', initialCost: 2000, costMultiplier: 2.0, type: 'autoMultiplier', value: 1.1, maxLevel: 1 },
    { id: 'auto_mult_2', name: 'Flujo Constante', emoji: '💧', description: 'PPS x1.2', initialCost: 100000, costMultiplier: 2.5, type: 'autoMultiplier', value: 1.2, maxLevel: 1 },
    { id: 'auto_mult_3', name: 'Corriente Infinita', emoji: '🌊', description: 'PPS x1.5', initialCost: 2000000, costMultiplier: 3.0, type: 'autoMultiplier', value: 1.5, maxLevel: 1 },
    { id: 'auto_mult_4', name: 'Motor Cuántico', emoji: '⚛️', description: 'PPS x2', initialCost: 100000000, costMultiplier: 3.5, type: 'autoMultiplier', value: 2.0, maxLevel: 1 },
    { id: 'auto_mult_5', name: 'Eco Temporal', emoji: '💫', description: 'PPS x3', initialCost: 2000000000, costMultiplier: 4.0, type: 'autoMultiplier', value: 3.0, maxLevel: 1 },
    { id: 'auto_mult_6', name: 'Motor Perpetuo', emoji: '🤯', description: 'PPS x5', initialCost: 1e11, costMultiplier: 4.5, type: 'autoMultiplier', value: 5.0, maxLevel: 1 },
    { id: 'auto_mult_7', name: 'Acelerador Final', emoji: '⏩', description: 'PPS x10', initialCost: 1e20, costMultiplier: 5, type: 'autoMultiplier', value: 10.0, maxLevel: 1 },
    { id: 'auto_mult_8', name: 'Acelerador de Partículas', emoji: '⚛️', description: 'PPS x20', initialCost: 6e21, costMultiplier: 6, type: 'autoMultiplier', value: 20.0, maxLevel: 1 },
    { id: 'auto_mult_9', name: 'Perpetuidad Cósmica', emoji: '♾️', description: 'PPS x50', initialCost: 6e23, costMultiplier: 5, type: 'autoMultiplier', value: 50.0, maxLevel: 1 }, // Antes 7

    // Sinergias (Especiales)
    { id: 'synergy_1', name: 'Sinergia Inicial', emoji: '🤝', description: '+0.1% PPS por nivel de Dedos Ágiles', initialCost: 5000, costMultiplier: 1.5, type: 'synergy', value: 0.001, targetUpgrade: 'click_1', targetStat: 'autoClickValue' },
    { id: 'synergy_2', name: 'Eco del Cursor', emoji: '🔊', description: '+0.1% Clic por nivel de Cursor Tímido', initialCost: 10000, costMultiplier: 1.6, type: 'synergy', value: 0.001, targetUpgrade: 'auto_1', targetStat: 'clickValue' },
    { id: 'synergy_3', name: 'Conexión Profunda', emoji: '🧠', description: '+0.05% PPS por nivel Clic Potente', initialCost: 1e6, costMultiplier: 1.7, type: 'synergy', value: 0.0005, targetUpgrade: 'click_3', targetStat: 'autoClickValue' },
    { id: 'synergy_4', name: 'Resonancia Automática', emoji: '🦾', description: '+0.05% Clic por nivel Fábrica Frutal', initialCost: 2.5e6, costMultiplier: 1.8, type: 'synergy', value: 0.0005, targetUpgrade: 'auto_4', targetStat: 'clickValue' },
    { id: 'synergy_5', name: 'Fusión Cuántica', emoji: '🌌', description: '+0.01% PPS por nivel Giga Clic', initialCost: 1e10, costMultiplier: 1.9, type: 'synergy', value: 0.0001, targetUpgrade: 'click_7', targetStat: 'autoClickValue' },
    { id: 'synergy_6', name: 'Sinergia Total', emoji: '🌀', description: '+0.001% PPS por nivel Clic Infinito', initialCost: 1e15, costMultiplier: 2.0, type: 'synergy', value: 0.00001, targetUpgrade: 'click_13', targetStat: 'autoClickValue' },
    { id: 'synergy_7', name: 'Sinergia Inversa', emoji: '☯️', description: '+0.001% Clic por nivel Realidad Alternativa', initialCost: 1e16, costMultiplier: 2.1, type: 'synergy', value: 0.00001, targetUpgrade: 'auto_13', targetStat: 'clickValue' },
    
    // Bonos de Nivel (Especiales)
    { id: 'level_boost_1', name: 'Bono de Nivel', emoji: '📈', description: '+5% PPS por Nivel', initialCost: 25000, costMultiplier: 1.8, type: 'levelBonus', value: 0.05, targetStat: 'autoClickValue' },
    { id: 'level_boost_2', name: 'Maestría de Nivel', emoji: '🎓', description: '+2.5% Clic por Nivel', initialCost: 50000, costMultiplier: 1.9, type: 'levelBonus', value: 0.025, targetStat: 'clickValue' },
    { id: 'level_boost_3', name: 'Bono de Nivel Experto', emoji: '🌟', description: '+1% Clic y PPS por Nivel', initialCost: 1e20, costMultiplier: 2.5, type: 'levelBonus', value: 0.01, targetStat: 'all' },
    
    // Otros (Especiales)
    { id: 'fruit_variety', name: 'Variedad Frutal', emoji: '🌈', description: 'Desbloquea más frutas', initialCost: 100, costMultiplier: 10, type: 'cosmetic', value: 1, maxLevel: fruits.length -1 },
];
