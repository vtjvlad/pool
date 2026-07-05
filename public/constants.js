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
export const RUBBER_THICKNESS = BALL_RADIUS * 2 * 0.75 * 1.1;
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

/** Физика в стиле 8 Ball Pool — аркадная модель с фазой скольжения */
export const REFERENCE_FPS = 60;
export const MAX_PHYSICS_DT = 0.05;
export const PHYSICS_SUBSTEPS = 8;
export const COLLISION_PASSES = 4;

export const BALL_BOUNCE = 0.94;
export const BALL_SURFACE_FRICTION = 0.22;
export const CUSHION_BOUNCE = 0.84;
export const CUSHION_TANGENTIAL_DAMPING = 0.28;

export const TABLE_DRAG = 0.9978;
export const SLIDE_DRAG = 0.992;
export const SLIDING_DECELERATION = 0.085;
export const SLIDE_DECAY = 0.86;
export const SLIDE_TO_ROLL_THRESHOLD = 0.08;
export const SLIDE_FROM_OFFSET = 0.92;
export const ROLLING_DECELERATION = 0.016;
export const LOW_SPEED_DECELERATION = 0.026;
export const LOW_SPEED_THRESHOLD = 1.3;

export const SLEEP_SPEED = 0.022;
export const SLEEP_SPIN = 0.012;
export const SLEEP_FRAMES = 12;
export const MIN_SPEED = SLEEP_SPEED;

export const MAX_SPIN_OFFSET = 0.72;
export const SPIN_SIDE_POWER = 0.28;
export const SPIN_TOP_POWER = 0.31;
export const SPIN_DECAY = 0.987;
export const SIDE_SPIN_CURVE = 0.00185;
export const SIDE_SPIN_THROW = 0.015;
export const SPIN_CUSHION_SIDE_THROW = 0.009;
export const TOP_SPIN_ACCEL = 0.093;
export const DRAW_SPIN_BRAKE = 0.27;
export const SPIN_TOP_MASSE_FACTOR = 0.06;
export const DRAW_SPIN_MASSE_FACTOR = 0.135;
export const TOP_SPIN_ROLLING_ACCEL = 0.016;
export const DRAW_SPIN_ROLLING_ACCEL = 0.036;
export const TOP_SPIN_CONVERSION = 0.82;
export const SPIN_TRANSFER = 0.18;
export const SPIN_CUSHION_RETAIN = 0.48;
export const TOP_SPIN_CUSHION_KICK = 0.13;
export const DRAW_SPIN_CUSHION_KICK = 0.36;
export const MAX_SPIN_SPEED_CHANGE = 0.28;
export const MAX_SIDE_SPIN_SPEED_CHANGE = 0.19;
export const SPIN_VISUAL_SCALE = 0.065;

/** Алиасы для превью прицела */
export const BALL_RESTITUTION = BALL_BOUNCE;
export const BALL_FRICTION = BALL_SURFACE_FRICTION;
export const CUSHION_RESTITUTION = CUSHION_BOUNCE;
export const CUSHION_FRICTION = CUSHION_TANGENTIAL_DAMPING;

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
    rubber: '#267da6',
    rubberDark: '#1a6a94',
    rubberLight: '#3aa8d4',
    rubberHighlight: 'rgba(255, 255, 255, 0.14)',
    rubberShadow: 'rgba(0, 0, 0, 0.22)',
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
export const MIN_BOUNCE_DRAW = 0.08;

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
