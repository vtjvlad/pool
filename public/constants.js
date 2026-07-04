/** Shared game constants — table proportions match real pool ratios */
export const TABLE = {
    width: 2.0,
    height: 1.0,
    cushionWidth: 0.052,
    pocketRadius: 0.078,
    pocketMouth: 0.108,
    ballRadius: 0.028,
    kitchenDepth: 0.25
};

export const CANVAS_WIDTH = 880;
export const CANVAS_HEIGHT = 440;

const SX = CANVAS_WIDTH / TABLE.width;
const SY = CANVAS_HEIGHT / TABLE.height;

/** Physics tuned to feel like 8 Ball Pool mobile */
export const PHYSICS = {
    friction: 0.985,
    cushionRestitution: 0.72,
    ballRestitution: 0.96,
    pocketCaptureRadius: 1.25,
    minVelocity: 0.0008,
    maxCueSpeed: 3.2,
    spinDecay: 0.992,
    spinTransfer: 0.35,
    rollingSpinFactor: 0.08,
    subSteps: 8,
    fixedDt: 1 / 120
};

export const COLORS = {
    felt: '#2a8cb8',
    feltDark: '#1a6a94',
    feltLight: '#3aa8d4',
    railWood: '#5c1f1f',
    railWoodDark: '#3a1010',
    railWoodLight: '#7a3535',
    railDiamond: '#c8c8c8',
    cushion: '#156842',
    cushionDark: '#0a4528',
    cushionLight: '#1f8a52',
    cushionEdge: '#2cb868',
    cushionFace: '#127038',
    pocket: '#030303',
    pocketLip: '#2a1510',
    pocketCollar: '#4a2018',
    cueStick: '#f5deb3',
    cueStickDark: '#8b6914',
    aimLine: 'rgba(255,255,255,0.85)',
    aimLineGhost: 'rgba(255,255,255,0.3)',
    powerFill: '#ffd700',
    text: '#ffffff',
    baulkLine: 'rgba(255,255,255,0.55)',
    background: '#0d1520'
};

// Canvas-pixel exports (derived from TABLE + PHYSICS)
export const BALL_RADIUS = TABLE.ballRadius * SY;
export const FRICTION = PHYSICS.friction;
export const BALL_RESTITUTION = PHYSICS.ballRestitution;
export const CUSHION_RESTITUTION = PHYSICS.cushionRestitution;
export const MIN_SPEED = 0.04;
export const RAIL_WIDTH = TABLE.cushionWidth * SX;
export const POCKET_OPENING = TABLE.pocketRadius * SY;
export const POCKET_CAPTURE = BALL_RADIUS * PHYSICS.pocketCaptureRadius;
export const POCKET_RECESS = TABLE.pocketRadius * SY;
export const POCKET_MOUTH_INSET = TABLE.pocketRadius * 0.22 * SX;
export const SIDE_NOTCH_HALF = TABLE.pocketMouth * 0.63 * SX;
export const CORNER_JAW_ALONG = TABLE.pocketMouth * 0.76 * SX;
export const POCKET_MAGNET = 0.42;
export const POCKET_RAIL_DEPTH = RAIL_WIDTH * 0.48;
export const POCKET_JAW_DEPTH = TABLE.pocketMouth * 0.3 * SY;

export const CUE_LENGTH = 300;
export const CUE_WIDTH = 6;
export const MAX_PULL = 115;
export const MIN_POWER_PERCENT = 5;
export const POWER_FACTOR = 0.11;
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
