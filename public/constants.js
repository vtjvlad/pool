export const CANVAS_WIDTH = 1040;
export const CANVAS_HEIGHT = 520;

export const BALL_RADIUS = 11;
export const FRICTION = 0.985;
export const BALL_RESTITUTION = 0.96;
export const CUSHION_RESTITUTION = 0.72;
export const MIN_SPEED = 0.04;

export const COLORS = {
    felt: '#2a8cb8',
    feltDark: '#1a6a94',
    feltLight: '#3aa8d4',
    background: '#0d1520',
    cueStick: '#f5deb3',
    cueStickDark: '#8b6914',
    aimLine: 'rgba(255,255,255,0.85)',
    aimLineGhost: 'rgba(255,255,255,0.3)',
    baulkLine: 'rgba(255,255,255,0.55)'
};

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
