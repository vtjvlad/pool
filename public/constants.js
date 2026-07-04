export const CANVAS_WIDTH = 1040;
export const CANVAS_HEIGHT = 520;

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
export const POCKET_MAGNET = 0.38;
export const POCKET_MAGNET_RADIUS = POCKET_RADIUS; // базовый; у луз — свой radius
export const FRICTION = 0.985;
export const BALL_RESTITUTION = 0.96;
export const CUSHION_RESTITUTION = 0.72;
export const MIN_SPEED = 0.08;

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
    cushion: '#1a5a78',
    cushionLight: '#2d8ab5',
    cushionDark: '#0c3347',
    cushionEdge: 'rgba(255, 255, 255, 0.18)',
    woodBase: '#8b5e34',
    woodLight: '#b8844f',
    woodDark: '#4a3018',
    woodGrain: 'rgba(35, 18, 6, 0.14)',
    woodEdge: 'rgba(0, 0, 0, 0.28)',
    rubber: '#166b47',
    rubberDark: '#0b452d',
    rubberLight: '#1f8f5e',
    rubberHighlight: 'rgba(255, 255, 255, 0.14)',
    rubberShadow: 'rgba(0, 0, 0, 0.22)',
    metalBase: '#adb4bf',
    metalLight: '#e8ecf2',
    metalDark: '#636b78',
    metalEdge: 'rgba(255, 255, 255, 0.38)',
    metalShadow: 'rgba(18, 22, 30, 0.42)'
};

export const CUE_LENGTH = 300;
export const CUE_WIDTH = 6;
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
