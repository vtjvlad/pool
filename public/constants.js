export const CANVAS_WIDTH = 1040;
export const CANVAS_HEIGHT = 520;

/** Эталонный размер всего UI для пропорционального масштабирования */
export const LAYOUT_SIDE_PANEL = 67;
export const LAYOUT_AIM_PANEL = 67;
/** Минимальный отступ между столом и остальными элементами UI */
export const LAYOUT_TABLE_MARGIN = 24;
export const LAYOUT_TOP_BAR = 46;
export const LAYOUT_HINT = 40;
export const LAYOUT_WIDTH =
    LAYOUT_SIDE_PANEL + LAYOUT_TABLE_MARGIN + CANVAS_WIDTH + LAYOUT_TABLE_MARGIN + LAYOUT_AIM_PANEL;
export const LAYOUT_HEIGHT =
    LAYOUT_TOP_BAR + LAYOUT_TABLE_MARGIN + CANVAS_HEIGHT + LAYOUT_TABLE_MARGIN + LAYOUT_HINT;

export const BALL_RADIUS = 11;
export const POCKET_DIAMETER = 47.52;
export const POCKET_RADIUS = POCKET_DIAMETER / 2;
export const CORNER_POCKET_RADIUS = POCKET_RADIUS * 1.1;
export const CENTRAL_POCKET_RADIUS = POCKET_RADIUS * 0.99225;

/** Геометрия бортов и позиций луз — не меняется при изменении POCKET_DIAMETER */
export const POCKET_LAYOUT_DIAMETER = 33;
export const POCKET_LAYOUT_RADIUS = POCKET_LAYOUT_DIAMETER / 2;
export const POCKET_INSET = POCKET_LAYOUT_RADIUS * 1.5;
export const CUSHION_POCKET_GAP = 0;
export const CORNER_CUSHION_POCKET_GAP = POCKET_LAYOUT_DIAMETER / 4;
export const CENTRAL_CUSHION_POCKET_GAP = POCKET_LAYOUT_DIAMETER / 5;
export const CUSHION_CHAMFER = POCKET_LAYOUT_DIAMETER / 4;
export const MID_POCKET_INSET = (POCKET_INSET - POCKET_LAYOUT_DIAMETER / 4) * 0.7;
export const POCKET_CENTER_SHIFT = 0;
export const CORNER_POCKET_CENTER_SHIFT = POCKET_INSET * 0.24;
export const CUSHION_DEPTH = Math.max(16 + POCKET_LAYOUT_DIAMETER / 4, POCKET_INSET + POCKET_LAYOUT_RADIUS) * 0.75 * 0.75 * 1.1;
export const PLAY_SURFACE_INSET = POCKET_LAYOUT_DIAMETER / 4;
export const RUBBER_THICKNESS = BALL_RADIUS * 2 * 0.75 * 1.28;
export const RUBBER_CENTER_CHAMFER_ANGLE = 60;
export const RUBBER_CORNER_CHAMFER_ANGLE = 45;
export const DEBUG_DRAW_RUBBER = true;
export const POCKET_MAGNET = 0.42;
export const POCKET_CAPTURE_BOOST = 1.28;
export const POCKET_SLOW_SPEED = 5.0;
export const POCKET_JAW_BIAS = 0.62;
export const POCKET_MAGNET_RADIUS = POCKET_RADIUS;
export const POCKET_FALL_MS = 520;
export const CUE_RESPOT_DELAY_MS = 400;

/** Базовая физика: импульсные столкновения, отскоки от бортов, торможение сукна */
export const REFERENCE_FPS = 60;
export const MAX_PHYSICS_DT = 0.05;
export const PHYSICS_SUBSTEPS = 10;
export const COLLISION_PASSES = 4;

export const BALL_MASS = 1;
export const BALL_MOMENT = (2 / 5) * BALL_MASS * BALL_RADIUS * BALL_RADIUS;

export const BALL_RESTITUTION = 0.945;
export const BALL_RESTITUTION_SLOW = 0.82;
export const BALL_FRICTION = 0.055;
export const CUSHION_RESTITUTION = 0.89;
export const CUSHION_RESTITUTION_SLOW = 0.74;
export const CUSHION_FRICTION = 0.20;

export const CLOTH_ROLL_DECEL = 0.019;
export const CLOTH_ROLL_SPEED_SCALE = 0.0031;

export const LOW_SPEED_THRESHOLD = 1.4;

export const SLEEP_SPEED = 0.014;
export const SLEEP_FRAMES = 10;
export const MIN_SPEED = SLEEP_SPEED;

/** Алиасы для превью прицела и совместимости */
export const BALL_BOUNCE = BALL_RESTITUTION;
export const BALL_SURFACE_FRICTION = BALL_FRICTION;
export const CUSHION_BOUNCE = CUSHION_RESTITUTION;
export const CUSHION_TANGENTIAL_DAMPING = CUSHION_FRICTION;
export const BALL_FRICTION_COEFF = BALL_FRICTION;

export const COLORS = {
    felt: '#2a8cb8',
    feltDark: '#1a6a94',
    feltLight: '#3aa8d4',
    background: '#0d1520',
    cueStick: '#f5deb3',
    cueStickDark: '#8b6914',
    aimLine: 'rgba(255,255,255,0.85)',
    aimLineGhost: 'rgba(255,255,255,0.3)',
    baulkLine: 'rgba(255,255,255,0.55)',
    pocket: '#0a0908',
    pocketDeep: '#000000',
    pocketLeather: '#14110e',
    pocketLiner: '#1c1712',
    pocketRim: '#2a2218',
    pocketRimLight: '#4a3d30',
    pocketNet: 'rgba(72, 64, 54, 0.72)',
    pocketNetShadow: 'rgba(20, 16, 12, 0.85)',
    pocketNetKnot: 'rgba(95, 85, 72, 0.55)',
    cushion: '#1f6f96',
    cushionLight: '#3aa8d4',
    cushionDark: '#164f6e',
    cushionEdge: 'rgba(255, 255, 255, 0.16)',
    woodBase: '#8b5e34',
    woodLight: '#b8844f',
    woodDark: '#4a3018',
    woodGrain: 'rgba(35, 18, 6, 0.14)',
    woodEdge: 'rgba(0, 0, 0, 0.28)',
    rubber: '#155e7f',
    rubberDark: '#0e3a52',
    rubberLight: '#1f7399',
    /** Оттенки губ vs градиент сукна: сверху темнее feltLight, снизу светлее feltDark */
    rubberPalettes: {
        top: {
            dark: '#082636',
            mid: '#104a62',
            light: '#145e78'
        },
        bottom: {
            dark: '#0a2836',
            mid: '#184e66',
            light: '#3ca6cc'
        }
    },
    rubberHighlight: 'rgba(255, 255, 255, 0.09)',
    rubberShadow: 'rgba(0, 0, 0, 0.34)',
    rubberFeltEdge: 'rgba(0, 0, 0, 0.28)',
    cushionFeltShadow: 'rgba(0, 0, 0, 0.34)',
    metalBase: '#adb4bf',
    metalLight: '#e8ecf2',
    metalDark: '#636b78',
    metalEdge: 'rgba(255, 255, 255, 0.38)',
    metalShadow: 'rgba(18, 22, 30, 0.42)'
};

export const CUE_LENGTH = 300;
export const CUE_WIDTH = 6;
export const AIM_TAP_THRESHOLD_PX = 12;
export const AIM_TAP_MAX_MS = 280;
export const AIM_MARKER_MIN_DIST = 48;
export const AIM_BALL_DEAD_ZONE = BALL_RADIUS * 1.4;
/** Во сколько раз колесо прицела менее чувствительно, чем прицеливание по столу */
export const AIM_WHEEL_FINE_FACTOR = 3;
export const AIM_SLIDER_SENSITIVITY = 0.0037 / AIM_WHEEL_FINE_FACTOR;
export const AIM_WHEEL_SCROLL_PX = 12;
export const MAX_PULL = 115;
export const MIN_POWER_PERCENT = 5;
export const POWER_FACTOR = 0.22;
export const STRIKE_ANIM_BASE_MS = 85;
export const IMPACT_FLASH_MS = 180;
export const TRAJECTORY_EXTEND = 18;
export const BOUNCE_PREVIEW_LEN = 52;
export const BOUNCE_PREVIEW_LEN_GHOST = 72;
export const MIN_BOUNCE_DRAW = 0.08;
/** Макс. касаний при расширенном превью (on) */
export const EXTENDED_CUE_MAX_CONTACTS = 5;
export const EXTENDED_TARGET_MAX_CONTACTS = 3;
/** Макс. касаний при полном превью (MAX) — до естественной остановки луча */
export const MAX_CUE_MAX_CONTACTS = 64;
export const MAX_TARGET_MAX_CONTACTS = 64;

/** Варианты отрисовки прицельной линии */
export const AIM_LINE_VARIANTS = ['off', 'on', 'max'];
export const AIM_LINE_LABELS = {
    off: 'off',
    on: 'on',
    max: 'MAX'
};

/** Особый модификатор прицела (вкл/выкл для всех вариантов) */
export const AIM_MODIFIER_STORAGE_KEY = 'vtj-pool-aim-modifier';
export const AIM_MODIFIER_LABEL = 'mod';

export const BALL_DEFS = {
    1: { color: '#f5d000', type: 'solid' },
    2: { color: '#0044cc', type: 'solid' },
    3: { color: '#cc0000', type: 'solid' },
    4: { color: '#6600aa', type: 'solid' },
    5: { color: '#ff6600', type: 'solid' },
    6: { color: '#008833', type: 'solid' },
    7: { color: '#880022', type: 'solid' },
    8: { color: '#111111', type: 'eight' },
    9: { color: '#f5d000', type: 'stripe' },
    10: { color: '#0044cc', type: 'stripe' },
    11: { color: '#cc0000', type: 'stripe' },
    12: { color: '#6600aa', type: 'stripe' },
    13: { color: '#ff6600', type: 'stripe' },
    14: { color: '#008833', type: 'stripe' },
    15: { color: '#880022', type: 'stripe' }
};

export const RACK_ORDER = [
    [1],
    [2, 3],
    [4, 8, 5],
    [6, 7, 9, 10],
    [11, 12, 13, 14, 15]
];
