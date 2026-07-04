export const CANVAS_WIDTH = 880;
export const CANVAS_HEIGHT = 440;
export const BALL_RADIUS = 11;
export const FRICTION = 0.992;
export const BALL_RESTITUTION = 0.94;
export const CUSHION_RESTITUTION = 0.84;
export const MIN_SPEED = 0.04;
export const RAIL_WIDTH = 38;
export const POCKET_OPENING = 22;
export const POCKET_CAPTURE = BALL_RADIUS * 1.55;
export const POCKET_RECESS = 22;
export const POCKET_MOUTH_INSET = 8;
export const SIDE_NOTCH_HALF = 30;
export const CORNER_JAW_ALONG = 36;
export const POCKET_MAGNET = 0.42;
export const POCKET_RAIL_DEPTH = RAIL_WIDTH * 0.48;

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
    1: { color: '#f1c40f', type: 'solid' },
    2: { color: '#2471a3', type: 'solid' },
    3: { color: '#c0392b', type: 'solid' },
    4: { color: '#8e44ad', type: 'solid' },
    5: { color: '#e67e22', type: 'solid' },
    6: { color: '#1e8449', type: 'solid' },
    7: { color: '#922b21', type: 'solid' },
    8: { color: '#1a1a1a', type: 'eight' },
    9: { color: '#f1c40f', type: 'stripe' },
    10: { color: '#2471a3', type: 'stripe' },
    11: { color: '#c0392b', type: 'stripe' },
    12: { color: '#8e44ad', type: 'stripe' },
    13: { color: '#e67e22', type: 'stripe' },
    14: { color: '#1e8449', type: 'stripe' },
    15: { color: '#922b21', type: 'stripe' }
};

export const RACK_ORDER = [
    [1],
    [2, 3],
    [4, 8, 5],
    [6, 7, 9, 10],
    [11, 12, 13, 14, 15]
];
