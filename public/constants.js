export const CANVAS_WIDTH = 1040;
export const CANVAS_HEIGHT = 520;

/** Эталонный размер всего UI для пропорционального масштабирования */
export const LAYOUT_SIDE_PANEL = 64;
export const LAYOUT_AIM_PANEL = 92;
/** Минимальный отступ между столом и остальными элементами UI */
export const LAYOUT_TABLE_MARGIN = 24;
export const LAYOUT_TOP_BAR = 92;
export const LAYOUT_HINT = 40;
export const LAYOUT_WIDTH =
    LAYOUT_SIDE_PANEL + LAYOUT_TABLE_MARGIN + CANVAS_WIDTH + LAYOUT_TABLE_MARGIN + LAYOUT_AIM_PANEL;
export const LAYOUT_HEIGHT =
    LAYOUT_TOP_BAR + LAYOUT_TABLE_MARGIN + CANVAS_HEIGHT + LAYOUT_TABLE_MARGIN + LAYOUT_HINT;

export const BALL_RADIUS = 11;
export const POCKET_DIAMETER = 40;
export const POCKET_RADIUS = POCKET_DIAMETER / 2;
export const CORNER_POCKET_RADIUS = POCKET_RADIUS * 1.1;
export const CENTRAL_POCKET_RADIUS = POCKET_RADIUS * 0.99225;

/** Визуальный размер лузы — не влияет на физику захвата */
export const POCKET_DRAW_DIAMETER = 47.52;
export const POCKET_DRAW_RADIUS = POCKET_DRAW_DIAMETER / 2;
export const CORNER_POCKET_DRAW_RADIUS = POCKET_DRAW_RADIUS * 1.1;
export const CENTRAL_POCKET_DRAW_RADIUS = POCKET_DRAW_RADIUS * 0.99225;

/** Геометрия бортов и позиций луз — не меняется при изменении POCKET_DIAMETER */
export const POCKET_LAYOUT_DIAMETER = 33;
export const POCKET_LAYOUT_RADIUS = POCKET_LAYOUT_DIAMETER / 2;
export const POCKET_INSET = POCKET_LAYOUT_RADIUS * 1.5;
export const CUSHION_LIP_SCALE_MIN = 0.7;
export const CUSHION_LIP_SCALE_MAX = 1.2;
export const CUSHION_LIP_SCALE_STEP = 0.1;
export let CUSHION_LIP_SCALE = 1.0;
export const CUSHION_POCKET_GAP = 0;
export const CORNER_CUSHION_POCKET_GAP = POCKET_LAYOUT_DIAMETER / 4;
export const CENTRAL_CUSHION_POCKET_GAP = POCKET_LAYOUT_DIAMETER / 5;
export const CUSHION_CHAMFER = POCKET_LAYOUT_DIAMETER / 4;
export const MID_POCKET_INSET = (POCKET_INSET - POCKET_LAYOUT_DIAMETER / 4) * 0.7;
export const POCKET_CENTER_SHIFT = 0;
export const CORNER_POCKET_CENTER_SHIFT = POCKET_INSET * 0.24;
export const CUSHION_DEPTH = Math.max(16 + POCKET_LAYOUT_DIAMETER / 4, POCKET_INSET + POCKET_LAYOUT_RADIUS) * 0.75 * 0.75 * 1.1;
export const PLAY_SURFACE_INSET = POCKET_LAYOUT_DIAMETER / 4;
export let RUBBER_THICKNESS = BALL_RADIUS * 2 * 0.75 * 1.28 * CUSHION_LIP_SCALE;
export const RUBBER_CENTER_CHAMFER_ANGLE = 70;
export const RUBBER_CORNER_CHAMFER_ANGLE = 45;
export const DEBUG_DRAW_RUBBER = true;
export const POCKET_MAGNET = 0.28;
export const POCKET_CAPTURE_BOOST = 1.15;
export const POCKET_SLOW_SPEED = 5.0;
export const POCKET_JAW_BIAS = 0.45;
export const POCKET_MAGNET_RADIUS = POCKET_RADIUS;
export const POCKET_FALL_MS = 600;
export const POCKET_FALL_MS_MIN = 260;
export const POCKET_FALL_MS_MAX = 780;
export const POCKET_FALL_SPEED_REF = 10;
export const POCKET_FALL_SPEED_CLAMP_MIN = 0.5;
export const POCKET_FALL_SPEED_CLAMP_MAX = 28;

export function computePocketFallDuration(entrySpeed) {
    const speed = Math.max(
        POCKET_FALL_SPEED_CLAMP_MIN,
        Math.min(POCKET_FALL_SPEED_CLAMP_MAX, entrySpeed)
    );
    const ratio = POCKET_FALL_SPEED_REF / speed;
    return Math.max(
        POCKET_FALL_MS_MIN,
        Math.min(POCKET_FALL_MS_MAX, POCKET_FALL_MS * ratio)
    );
}
export const CUE_RESPOT_DELAY_MS = 400;

/** Базовая физика: импульсные столкновения, отскоки от бортов, торможение сукна */
export const REFERENCE_FPS = 60;
export const MAX_PHYSICS_DT = 0.05;
export const PHYSICS_SUBSTEPS = 10;
export const COLLISION_PASSES = 4;

export const BALL_MASS = 0.167;
export const BALL_MASS_MIN_G = 156;
export const BALL_MASS_MAX_G = 172;
export const BALL_MOMENT = (2 / 5) * BALL_MASS * BALL_RADIUS * BALL_RADIUS;

export const RESTITUTION_PRESETS = {
    soft: {
        ball: 0.91,
        ballSlow: 0.78,
        cushion: 0.84,
        cushionSlow: 0.68
    },
    tournament: {
        ball: 0.93,
        ballSlow: 0.80,
        cushion: 0.87,
        cushionSlow: 0.72
    }
};
export const RESTITUTION_PROFILES = ['soft', 'tournament'];
export let BALL_RESTITUTION_PROFILE = 'tournament';
export let CUSHION_RESTITUTION_PROFILE = 'tournament';

let activeBallRestitution = RESTITUTION_PRESETS[BALL_RESTITUTION_PROFILE];
let activeCushionRestitution = RESTITUTION_PRESETS[CUSHION_RESTITUTION_PROFILE];

export let BALL_RESTITUTION = activeBallRestitution.ball;
export let BALL_RESTITUTION_SLOW = activeBallRestitution.ballSlow;
export const PHYSICS_MODE_PRESETS = {
    real: {
        ballFriction: 0.05,
        cushionFriction: 0.17,
        clothRollDecel: 0.017,
        clothRollSpeedScale: 0.0028,
        lowSpeedThreshold: 1.3
    },
    balanced: {
        ballFriction: 0.055,
        cushionFriction: 0.18,
        clothRollDecel: 0.019,
        clothRollSpeedScale: 0.0030,
        lowSpeedThreshold: 1.4
    },
    arcade: {
        ballFriction: 0.065,
        cushionFriction: 0.22,
        clothRollDecel: 0.022,
        clothRollSpeedScale: 0.0035,
        lowSpeedThreshold: 1.6
    }
};
export const PHYSICS_MODES = ['real', 'balanced', 'arcade'];
export let PHYSICS_MODE = 'balanced';
let activePhysicsMode = PHYSICS_MODE_PRESETS[PHYSICS_MODE];

export let BALL_FRICTION = activePhysicsMode.ballFriction;
export let CUSHION_RESTITUTION = activeCushionRestitution.cushion;
export let CUSHION_RESTITUTION_SLOW = activeCushionRestitution.cushionSlow;
export let CUSHION_FRICTION = activePhysicsMode.cushionFriction;

export let CLOTH_ROLL_DECEL = activePhysicsMode.clothRollDecel;
export let CLOTH_ROLL_SPEED_SCALE = activePhysicsMode.clothRollSpeedScale;

export let LOW_SPEED_THRESHOLD = activePhysicsMode.lowSpeedThreshold;

export const SLEEP_SPEED = 0.014;
export const SLEEP_FRAMES = 10;
export const MIN_SPEED = SLEEP_SPEED;

export const CLOTH_SLIDE_DECEL = 0.068;
export const SLIP_RESOLVE_RATE = 0.072;
export const SLIDE_RESOLVE_RATE = 0.048;
export const SLIDE_THRESHOLD = 0.035;

export const SPIN_ROLL_DAMP = 0.0024;
export const SPIN_SLIDE_DAMP = 0.0048;

export const SLEEP_SPIN = 0.12;

export const MAX_SPIN_OFFSET = 0.72;
export const SLIDE_FROM_OFFSET = 0.88;

export const CUSHION_SPIN_RETAIN = 0.71;
export const BALL_SPIN_CONTACT = 0.54;
export const DRAW_COLLISION_MAX = 0.48;
export const DRAW_SPIN_TRANSFER = 0.04;
export const DRAW_REVERSE_FACTOR = 0.32;
export const DRAW_FORWARD_BRAKE = 0.42;
export const DRAW_REVERSE_SPEED_THRESHOLD = 0.72;
export const DRAW_MAX_REVERSE_SPEED_SCALE = 1.35;
export const CUE_DRAW_BACK_RATIO = 1.85;
export const OBJECT_DRAW_BRAKE_RATIO = 0.38;
export const FOLLOW_COLLISION_KICK = 0.085;
export const CUE_FOLLOW_RATIO = 0.82;
export const CUSHION_DRAW_KICK = 0.028;
export const COLLISION_SLIDE_MIN = 0.34;
export const CUSHION_SLIDE = 0.52;

/** Текущие игровые параметры винта — пресет default */
const SPIN_TUNING_DEFAULT = {
    spinStrength: 1.5,
    spinSidePower: 1.28,
    spinTopPower: 0.64,
    squirtFactor: 0.607,
    spinTipEfficiency: 0.61,
    spinCurveWhileSliding: 0.0021,
    spinCurveWhileRolling: 0.00038,
    sideSpinSlideThrow: 0.0025,
    sideSpinRollThrow: 0.00045,
    cushionThrow: 0.062,
    ballSpinThrow: 0.26,
    sideSpinCollisionThrow: 0.6,
    drawCollisionKick: 0.38,
    spinSpeedRef: 13.5,
    spinSpeedFalloff: 1.1,
    spinSpeedExp: 1.85,
    spinSpeedMinEff: 0.24,
    sideSpinSpeedRef: 20,
    sideSpinSpeedFalloff: 0.58,
    sideSpinSpeedMinEff: 0.42,
    drawSpeedRef: 17,
    drawSpeedFalloff: 0.44,
    drawSpeedMinEff: 0.62,
    sideSpinCurveMaxSliding: 0.11,
    sideSpinCurveMaxRolling: 0.045,
    sideSpinLateralCap: 0.085,
    sideSpinResidualMix: 0.42,
    slideFromSideScale: 0.75
};

export const SPIN_PRESETS = {
    default: SPIN_TUNING_DEFAULT,
    real: {
        spinStrength: 1.0,
        spinSidePower: 0.82,
        spinTopPower: 0.48,
        squirtFactor: 0.22,
        spinTipEfficiency: 0.35,
        spinCurveWhileSliding: 0.0011,
        spinCurveWhileRolling: 0.00012,
        sideSpinSlideThrow: 0.0012,
        sideSpinRollThrow: 0.0002,
        cushionThrow: 0.038,
        ballSpinThrow: 0.16,
        sideSpinCollisionThrow: 0.34,
        drawCollisionKick: 0.3,
        spinSpeedRef: 10.5,
        spinSpeedFalloff: 1.65,
        spinSpeedExp: 2.1,
        spinSpeedMinEff: 0.12,
        sideSpinSpeedRef: 15,
        sideSpinSpeedFalloff: 0.95,
        sideSpinSpeedMinEff: 0.28,
        drawSpeedRef: 13,
        drawSpeedFalloff: 0.72,
        drawSpeedMinEff: 0.45,
        sideSpinCurveMaxSliding: 0.06,
        sideSpinCurveMaxRolling: 0.022,
        sideSpinLateralCap: 0.055,
        sideSpinResidualMix: 0.24,
        slideFromSideScale: 0.58
    },
    arcade: {
        spinStrength: 1.85,
        spinSidePower: 1.48,
        spinTopPower: 0.78,
        squirtFactor: 0.48,
        spinTipEfficiency: 0.72,
        spinCurveWhileSliding: 0.0032,
        spinCurveWhileRolling: 0.00055,
        sideSpinSlideThrow: 0.0036,
        sideSpinRollThrow: 0.00062,
        cushionThrow: 0.082,
        ballSpinThrow: 0.34,
        sideSpinCollisionThrow: 0.78,
        drawCollisionKick: 0.46,
        spinSpeedRef: 16,
        spinSpeedFalloff: 0.82,
        spinSpeedExp: 1.65,
        spinSpeedMinEff: 0.32,
        sideSpinSpeedRef: 24,
        sideSpinSpeedFalloff: 0.42,
        sideSpinSpeedMinEff: 0.52,
        drawSpeedRef: 20,
        drawSpeedFalloff: 0.32,
        drawSpeedMinEff: 0.72,
        sideSpinCurveMaxSliding: 0.14,
        sideSpinCurveMaxRolling: 0.058,
        sideSpinLateralCap: 0.11,
        sideSpinResidualMix: 0.55,
        slideFromSideScale: 0.88
    }
};

export const SPIN_PRESET_IDS = ['default', 'real', 'arcade'];
export const SPIN_PRESET_LABELS = {
    default: 'def',
    real: 'real',
    arcade: 'arc'
};

export let SPIN_PRESET = 'default';

export let SPIN_CURVE_WHILE_SLIDING = SPIN_TUNING_DEFAULT.spinCurveWhileSliding;
export let SPIN_CURVE_WHILE_ROLLING = SPIN_TUNING_DEFAULT.spinCurveWhileRolling;
export let SIDE_SPIN_SLIDE_THROW = SPIN_TUNING_DEFAULT.sideSpinSlideThrow;
export let SIDE_SPIN_ROLL_THROW = SPIN_TUNING_DEFAULT.sideSpinRollThrow;

/** Общий множитель силы спина (1 = базовый) */
export let SPIN_STRENGTH = SPIN_TUNING_DEFAULT.spinStrength;

export let SPIN_SIDE_POWER = SPIN_TUNING_DEFAULT.spinSidePower;
export let SPIN_TOP_POWER = SPIN_TUNING_DEFAULT.spinTopPower;
export let SQUIRT_FACTOR = SPIN_TUNING_DEFAULT.squirtFactor;
export let SPIN_TIP_EFFICIENCY = SPIN_TUNING_DEFAULT.spinTipEfficiency;

export let CUSHION_THROW = SPIN_TUNING_DEFAULT.cushionThrow;
export let BALL_SPIN_THROW = SPIN_TUNING_DEFAULT.ballSpinThrow;
export let SIDE_SPIN_COLLISION_THROW = SPIN_TUNING_DEFAULT.sideSpinCollisionThrow;
export let DRAW_COLLISION_KICK = SPIN_TUNING_DEFAULT.drawCollisionKick;

export let SPIN_SPEED_REF = SPIN_TUNING_DEFAULT.spinSpeedRef;
export let SPIN_SPEED_FALLOFF = SPIN_TUNING_DEFAULT.spinSpeedFalloff;
export let SPIN_SPEED_EXP = SPIN_TUNING_DEFAULT.spinSpeedExp;
export let SPIN_SPEED_MIN_EFF = SPIN_TUNING_DEFAULT.spinSpeedMinEff;

export let SIDE_SPIN_SPEED_REF = SPIN_TUNING_DEFAULT.sideSpinSpeedRef;
export let SIDE_SPIN_SPEED_FALLOFF = SPIN_TUNING_DEFAULT.sideSpinSpeedFalloff;
export let SIDE_SPIN_SPEED_MIN_EFF = SPIN_TUNING_DEFAULT.sideSpinSpeedMinEff;

export let DRAW_SPEED_REF = SPIN_TUNING_DEFAULT.drawSpeedRef;
export let DRAW_SPEED_FALLOFF = SPIN_TUNING_DEFAULT.drawSpeedFalloff;
export let DRAW_SPEED_MIN_EFF = SPIN_TUNING_DEFAULT.drawSpeedMinEff;

export let SIDE_SPIN_CURVE_MAX_SLIDING = SPIN_TUNING_DEFAULT.sideSpinCurveMaxSliding;
export let SIDE_SPIN_CURVE_MAX_ROLLING = SPIN_TUNING_DEFAULT.sideSpinCurveMaxRolling;
export let SIDE_SPIN_LATERAL_CAP = SPIN_TUNING_DEFAULT.sideSpinLateralCap;
export let SIDE_SPIN_RESIDUAL_MIX = SPIN_TUNING_DEFAULT.sideSpinResidualMix;
export let SLIDE_FROM_SIDE_SCALE = SPIN_TUNING_DEFAULT.slideFromSideScale;

function applySpinPresetValues(tuning) {
    SPIN_STRENGTH = tuning.spinStrength;
    SPIN_SIDE_POWER = tuning.spinSidePower;
    SPIN_TOP_POWER = tuning.spinTopPower;
    SQUIRT_FACTOR = tuning.squirtFactor;
    SPIN_TIP_EFFICIENCY = tuning.spinTipEfficiency;
    SPIN_CURVE_WHILE_SLIDING = tuning.spinCurveWhileSliding;
    SPIN_CURVE_WHILE_ROLLING = tuning.spinCurveWhileRolling;
    SIDE_SPIN_SLIDE_THROW = tuning.sideSpinSlideThrow;
    SIDE_SPIN_ROLL_THROW = tuning.sideSpinRollThrow;
    CUSHION_THROW = tuning.cushionThrow;
    BALL_SPIN_THROW = tuning.ballSpinThrow;
    SIDE_SPIN_COLLISION_THROW = tuning.sideSpinCollisionThrow;
    DRAW_COLLISION_KICK = tuning.drawCollisionKick;
    SPIN_SPEED_REF = tuning.spinSpeedRef;
    SPIN_SPEED_FALLOFF = tuning.spinSpeedFalloff;
    SPIN_SPEED_EXP = tuning.spinSpeedExp;
    SPIN_SPEED_MIN_EFF = tuning.spinSpeedMinEff;
    SIDE_SPIN_SPEED_REF = tuning.sideSpinSpeedRef;
    SIDE_SPIN_SPEED_FALLOFF = tuning.sideSpinSpeedFalloff;
    SIDE_SPIN_SPEED_MIN_EFF = tuning.sideSpinSpeedMinEff;
    DRAW_SPEED_REF = tuning.drawSpeedRef;
    DRAW_SPEED_FALLOFF = tuning.drawSpeedFalloff;
    DRAW_SPEED_MIN_EFF = tuning.drawSpeedMinEff;
    SIDE_SPIN_CURVE_MAX_SLIDING = tuning.sideSpinCurveMaxSliding;
    SIDE_SPIN_CURVE_MAX_ROLLING = tuning.sideSpinCurveMaxRolling;
    SIDE_SPIN_LATERAL_CAP = tuning.sideSpinLateralCap;
    SIDE_SPIN_RESIDUAL_MIX = tuning.sideSpinResidualMix;
    SLIDE_FROM_SIDE_SCALE = tuning.slideFromSideScale;
}

export function setSpinPreset(preset) {
    if (!Object.prototype.hasOwnProperty.call(SPIN_PRESETS, preset)) return false;
    SPIN_PRESET = preset;
    applySpinPresetValues(SPIN_PRESETS[preset]);
    return true;
}

export function spinSpeedEffectiveness(speed) {
    if (speed <= SLEEP_SPEED) return 1;
    const ratio = speed / SPIN_SPEED_REF;
    const falloff = 1 / (1 + Math.pow(ratio, SPIN_SPEED_EXP) * SPIN_SPEED_FALLOFF);
    return Math.max(SPIN_SPEED_MIN_EFF, falloff);
}

/** Ослабление бокового спина на скорости — мягче, чем у follow/draw */
export function sideSpinSpeedEffectiveness(speed) {
    if (speed <= SLEEP_SPEED) return 1;
    const ratio = speed / SIDE_SPIN_SPEED_REF;
    const falloff = 1 / (1 + ratio * ratio * SIDE_SPIN_SPEED_FALLOFF);
    return Math.max(SIDE_SPIN_SPEED_MIN_EFF, falloff);
}

/** Ослабление нижнего спина на скорости — мягче, чем у общего spinSpeedEffectiveness */
export function drawSpeedEffectiveness(speed) {
    if (speed <= SLEEP_SPEED) return 1;
    const ratio = speed / DRAW_SPEED_REF;
    const falloff = 1 / (1 + ratio * ratio * DRAW_SPEED_FALLOFF);
    return Math.max(DRAW_SPEED_MIN_EFF, falloff);
}

/** Микро-джиттер угла нормали при столкновениях (только runtime-физика) */
export const COLLISION_NORMAL_JITTER = {
    enabled: true,
    cushionMaxDeg: 0.30,
    ballMaxDeg: 0.22,
    minSpeedFactor: 0.2,
    slowSpeedScale: 0.4,
    minImpactSpeed: SLEEP_SPEED * 3
};

/** Алиасы для превью прицела и совместимости */
export let BALL_BOUNCE = BALL_RESTITUTION;
export let BALL_SURFACE_FRICTION = BALL_FRICTION;
export let CUSHION_BOUNCE = CUSHION_RESTITUTION;
export let CUSHION_TANGENTIAL_DAMPING = CUSHION_FRICTION;
export let BALL_FRICTION_COEFF = BALL_FRICTION;

export function setBallRestitutionProfile(profile) {
    if (!Object.prototype.hasOwnProperty.call(RESTITUTION_PRESETS, profile)) return false;
    BALL_RESTITUTION_PROFILE = profile;
    activeBallRestitution = RESTITUTION_PRESETS[profile];
    BALL_RESTITUTION = activeBallRestitution.ball;
    BALL_RESTITUTION_SLOW = activeBallRestitution.ballSlow;
    BALL_BOUNCE = BALL_RESTITUTION;
    return true;
}

export function setCushionRestitutionProfile(profile) {
    if (!Object.prototype.hasOwnProperty.call(RESTITUTION_PRESETS, profile)) return false;
    CUSHION_RESTITUTION_PROFILE = profile;
    activeCushionRestitution = RESTITUTION_PRESETS[profile];
    CUSHION_RESTITUTION = activeCushionRestitution.cushion;
    CUSHION_RESTITUTION_SLOW = activeCushionRestitution.cushionSlow;
    CUSHION_BOUNCE = CUSHION_RESTITUTION;
    return true;
}

export function setPhysicsMode(mode) {
    if (!Object.prototype.hasOwnProperty.call(PHYSICS_MODE_PRESETS, mode)) return false;
    PHYSICS_MODE = mode;
    activePhysicsMode = PHYSICS_MODE_PRESETS[mode];
    BALL_FRICTION = activePhysicsMode.ballFriction;
    CUSHION_FRICTION = activePhysicsMode.cushionFriction;
    CLOTH_ROLL_DECEL = activePhysicsMode.clothRollDecel;
    CLOTH_ROLL_SPEED_SCALE = activePhysicsMode.clothRollSpeedScale;
    LOW_SPEED_THRESHOLD = activePhysicsMode.lowSpeedThreshold;
    BALL_SURFACE_FRICTION = BALL_FRICTION;
    CUSHION_TANGENTIAL_DAMPING = CUSHION_FRICTION;
    BALL_FRICTION_COEFF = BALL_FRICTION;
    return true;
}

export function setCushionLipScale(nextScale) {
    const numeric = Number(nextScale);
    if (!Number.isFinite(numeric)) return false;
    const clamped = Math.min(CUSHION_LIP_SCALE_MAX, Math.max(CUSHION_LIP_SCALE_MIN, numeric));
    const stepped = Math.round(clamped / CUSHION_LIP_SCALE_STEP) * CUSHION_LIP_SCALE_STEP;
    CUSHION_LIP_SCALE = Math.round(stepped * 100) / 100;
    RUBBER_THICKNESS = BALL_RADIUS * 2 * 0.75 * 1.28 * CUSHION_LIP_SCALE;
    return true;
}

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

export const CUE_LENGTH = 380;
export const CUE_WIDTH = 6.5;
export const AIM_TAP_THRESHOLD_PX = 12;
export const AIM_TAP_MAX_MS = 280;
export const AIM_MARKER_MIN_DIST = 48;
export const AIM_BALL_DEAD_ZONE = BALL_RADIUS * 1.4;
/** Во сколько раз колесо прицела менее чувствительно, чем прицеливание по столу */
export const AIM_WHEEL_FINE_FACTOR = 8;
export const AIM_SLIDER_SENSITIVITY = 0.0037 / AIM_WHEEL_FINE_FACTOR;
export const AIM_WHEEL_SCROLL_PX = 12;
/** Плавность прицеливания: скорость догонки целевого угла (кадры эталонного FPS) */
export const AIM_SMOOTH_RATE = 6;
export const AIM_SMOOTH_RATE_DRAG = 15;
export const MAX_PULL = 115;
export const MIN_POWER_PERCENT = 10;
export const POWER_FACTOR = 0.22;
/** Доля шкалы: 0–85% → 10–70% удара, последние 15% → 70–100% */
export const POWER_SLIDER_FINE_END = 85;
export const POWER_FINE_START = 10;
export const POWER_FINE_END = 70;

export function sliderPosToPower(sliderPos) {
    const pos = Math.max(0, Math.min(100, sliderPos));
    if (pos <= 0) return 0;
    if (pos <= POWER_SLIDER_FINE_END) {
        return POWER_FINE_START + (pos / POWER_SLIDER_FINE_END) * (POWER_FINE_END - POWER_FINE_START);
    }
    const t = (pos - POWER_SLIDER_FINE_END) / (100 - POWER_SLIDER_FINE_END);
    return POWER_FINE_END + t * (100 - POWER_FINE_END);
}

export function powerToSliderPos(power) {
    const p = Math.max(0, Math.min(100, power));
    if (p <= 0) return 0;
    if (p <= POWER_FINE_END) {
        return ((p - POWER_FINE_START) / (POWER_FINE_END - POWER_FINE_START)) * POWER_SLIDER_FINE_END;
    }
    const t = (p - POWER_FINE_END) / (100 - POWER_FINE_END);
    return POWER_SLIDER_FINE_END + t * (100 - POWER_SLIDER_FINE_END);
}

/** Реальные отметки силы удара на шкале */
export const POWER_MARK_PERCENTS = [0, 25, 50, 90];
/** Плавность изменения силы удара */
export const POWER_SMOOTH_RATE = 6;
export const POWER_SMOOTH_RATE_DRAG = 15;
export const STRIKE_ANIM_BASE_MS = 85;
export const IMPACT_FLASH_MS = 180;
export const TRAJECTORY_EXTEND = 18;
export const BOUNCE_PREVIEW_LEN = 52;
export const BOUNCE_PREVIEW_LEN_GHOST = 72;
/** Длина линии направления целевого шара в варианте прицела off */
export const OFF_TARGET_PREVIEW_LEN = 88;
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

/** Случайный микросдвиг позиции шара в пирамиде (px по каждой оси) */
export const RACK_POSITION_JITTER = 0.12;

export const RACK_ORDER = [
    [1],
    [2, 3],
    [4, 8, 5],
    [6, 7, 9, 10],
    [11, 12, 13, 14, 15]
];
