//#region \0rolldown/runtime.js
var __esmMin = (fn, res, err) => () => {
	if (err) throw err[0];
	try {
		return fn && (res = fn(fn = 0)), res;
	} catch (e) {
		throw err = [e], e;
	}
};
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region public/constants.js
function computePocketFallDuration(entrySpeed) {
	const ratio = 10 / Math.max(POCKET_FALL_SPEED_CLAMP_MIN, Math.min(28, entrySpeed));
	return Math.max(260, Math.min(780, 600 * ratio));
}
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
	SIDE_SPIN_TRAJ_REF_SPEED = tuning.sideSpinTrajRefSpeed;
	SIDE_SPIN_TRAJ_MIN_EFF = tuning.sideSpinTrajMinEff;
	SIDE_SPIN_TRAJ_RAMP = tuning.sideSpinTrajRamp;
	DRAW_SPEED_REF = tuning.drawSpeedRef;
	DRAW_SPEED_FALLOFF = tuning.drawSpeedFalloff;
	DRAW_SPEED_MIN_EFF = tuning.drawSpeedMinEff;
	STRIKE_SPIN_MIN_EFF = tuning.strikeSpinMinEff;
	STRIKE_SPIN_PLATEAU_EFF = tuning.strikeSpinPlateauEff;
	STRIKE_SPIN_MAX_EFF = tuning.strikeSpinMaxEff;
	STRIKE_SPIN_REF = tuning.strikeSpinRef;
	STRIKE_SPIN_HIGH_REF = tuning.strikeSpinHighRef;
	STRIKE_DRAW_MIN_EFF = tuning.strikeDrawMinEff;
	STRIKE_DRAW_PLATEAU_EFF = tuning.strikeDrawPlateauEff;
	STRIKE_DRAW_MAX_EFF = tuning.strikeDrawMaxEff;
	STRIKE_DRAW_REF = tuning.strikeDrawRef;
	STRIKE_DRAW_HIGH_REF = tuning.strikeDrawHighRef;
	STRIKE_SQUIRT_REF = tuning.strikeSquirtRef;
	STRIKE_SQUIRT_FALLOFF = tuning.strikeSquirtFalloff;
	STRIKE_SQUIRT_EXP = tuning.strikeSquirtExp;
	STRIKE_SQUIRT_MIN_EFF = tuning.strikeSquirtMinEff;
	SIDE_SPIN_CURVE_MAX_SLIDING = tuning.sideSpinCurveMaxSliding;
	SIDE_SPIN_CURVE_MAX_ROLLING = tuning.sideSpinCurveMaxRolling;
	SIDE_SPIN_LATERAL_CAP = tuning.sideSpinLateralCap;
	SIDE_SPIN_RESIDUAL_MIX = tuning.sideSpinResidualMix;
	SLIDE_FROM_SIDE_SCALE = tuning.slideFromSideScale;
	SPIN_MOTION_PEAK_EFF = tuning.spinMotionPeakEff;
	SPIN_MOTION_MEDIUM_EFF = tuning.spinMotionMediumEff;
	SPIN_MOTION_LOW_EFF = tuning.spinMotionLowEff;
	SPIN_MOTION_HIGH_END_EFF = tuning.spinMotionHighEndEff;
	DRAW_MOTION_EFF_BIAS = tuning.drawMotionEffBias;
	STRIKE_SPIN_EFF_FLOOR = tuning.strikeSpinEffFloor;
	STRIKE_DRAW_EFF_FLOOR = tuning.strikeDrawEffFloor;
}
function setSpinPreset(preset) {
	if (!Object.prototype.hasOwnProperty.call(SPIN_PRESETS, preset)) return false;
	SPIN_PRESET = preset;
	applySpinPresetValues(SPIN_PRESETS[preset]);
	return true;
}
function clamp01(value) {
	return Math.max(0, Math.min(1, value));
}
function smoothstep01(t) {
	const x = clamp01(t);
	return x * x * (3 - 2 * x);
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
/**
* Эффективность винта от скорости (доля от макс. удара).
* Пик ~30–65%, средняя ~15–30% и ~65–85%, выше 85% — почти нет эффекта.
* @param {number} speed — текущая скорость шара
* @param {number} [maxSpeed] — скорость при 100% силе удара
*/
function spinMotionEffectiveness(speed, maxSpeed = 22) {
	if (speed <= .014) return SPIN_MOTION_PEAK_EFF;
	const r = clamp01(speed / Math.max(maxSpeed, 1e-6));
	const peak = SPIN_MOTION_PEAK_EFF;
	const medium = SPIN_MOTION_MEDIUM_EFF;
	const low = SPIN_MOTION_LOW_EFF;
	const highEnd = SPIN_MOTION_HIGH_END_EFF;
	const peakCenter = .475;
	if (r >= .85) return lerp(medium, highEnd, smoothstep01((r - .85) / .15));
	if (r >= .65) return lerp(peak * .96, medium, smoothstep01((r - .65) / .2));
	if (r >= .3) {
		const u = (r - peakCenter) / .175;
		return peak * (.96 + .04 * Math.max(0, 1 - u * u));
	}
	if (r >= .15) return lerp(medium, peak * .96, smoothstep01((r - .15) / .15));
	return lerp(low, medium, smoothstep01(r / .15));
}
function strikeAmountEffectiveness(power, floorEff) {
	if (power <= .014) return floorEff;
	const motionEff = spinMotionEffectiveness(power);
	return floorEff + (SPIN_MOTION_PEAK_EFF - floorEff) * (motionEff / Math.max(SPIN_MOTION_PEAK_EFF, 1e-6));
}
/** Эффективность бокового винта при ударе — следует кривой скорости */
function strikeSpinAmountEffectiveness(power) {
	return strikeAmountEffectiveness(power, STRIKE_SPIN_EFF_FLOOR);
}
/** Эффективность draw/follow при ударе */
function strikeDrawAmountEffectiveness(power) {
	return strikeAmountEffectiveness(power, STRIKE_DRAW_EFF_FLOOR);
}
/** Squirt при ударе — сильнее падает на максимальной силе */
function strikeSquirtEffectiveness(power) {
	return Math.max(STRIKE_SQUIRT_MIN_EFF, spinMotionEffectiveness(power) * .92);
}
/** Ослабление эффектов винта на текущей скорости шара (столкновения, topSpin) */
function spinSpeedEffectiveness(speed) {
	return spinMotionEffectiveness(speed);
}
/** Боковой винт → отклонение траектории по скорости шара */
function sideSpinTrajectoryEffectiveness(speed) {
	return spinMotionEffectiveness(speed);
}
/** Ослабление draw/follow на текущей скорости */
function drawSpeedEffectiveness(speed) {
	return Math.min(1, spinMotionEffectiveness(speed) * DRAW_MOTION_EFF_BIAS);
}
function setBallRestitutionProfile(profile) {
	if (!Object.prototype.hasOwnProperty.call(RESTITUTION_PRESETS, profile)) return false;
	BALL_RESTITUTION_PROFILE = profile;
	activeBallRestitution = RESTITUTION_PRESETS[profile];
	BALL_RESTITUTION = activeBallRestitution.ball;
	BALL_RESTITUTION_SLOW = activeBallRestitution.ballSlow;
	BALL_BOUNCE = BALL_RESTITUTION;
	return true;
}
function setCushionRestitutionProfile(profile) {
	if (!Object.prototype.hasOwnProperty.call(RESTITUTION_PRESETS, profile)) return false;
	CUSHION_RESTITUTION_PROFILE = profile;
	activeCushionRestitution = RESTITUTION_PRESETS[profile];
	CUSHION_RESTITUTION = activeCushionRestitution.cushion;
	CUSHION_RESTITUTION_SLOW = activeCushionRestitution.cushionSlow;
	CUSHION_BOUNCE = CUSHION_RESTITUTION;
	return true;
}
function setPhysicsMode(mode) {
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
function setCushionLipScale(nextScale) {
	const numeric = Number(nextScale);
	if (!Number.isFinite(numeric)) return false;
	const stepped = Math.round(Math.min(CUSHION_LIP_SCALE_MAX, Math.max(CUSHION_LIP_SCALE_MIN, numeric)) / CUSHION_LIP_SCALE_STEP) * CUSHION_LIP_SCALE_STEP;
	CUSHION_LIP_SCALE = Math.round(stepped * 100) / 100;
	RUBBER_THICKNESS = 22 * .75 * 1.28 * CUSHION_LIP_SCALE;
	return true;
}
function sliderPosToPower(sliderPos) {
	const pos = Math.max(0, Math.min(100, sliderPos));
	if (pos <= 0) return 0;
	if (pos <= 85) return 10 + pos / 85 * 60;
	return 70 + (pos - 85) / 15 * 30;
}
function powerToSliderPos(power) {
	const p = Math.max(0, Math.min(100, power));
	if (p <= 0) return 0;
	if (p <= 70) return (p - 10) / 60 * 85;
	return 85 + (p - 70) / 30 * 15;
}
var CANVAS_WIDTH, LAYOUT_WIDTH, CENTRAL_POCKET_RADIUS, POCKET_DRAW_DIAMETER, POCKET_DRAW_RADIUS, CORNER_POCKET_DRAW_RADIUS, CENTRAL_POCKET_DRAW_RADIUS, POCKET_LAYOUT_RADIUS, POCKET_INSET, CUSHION_LIP_SCALE_MIN, CUSHION_LIP_SCALE_MAX, CUSHION_LIP_SCALE_STEP, CUSHION_LIP_SCALE, CORNER_CUSHION_POCKET_GAP, CENTRAL_CUSHION_POCKET_GAP, CUSHION_CHAMFER, MID_POCKET_INSET, CORNER_POCKET_CENTER_SHIFT, CUSHION_DEPTH, PLAY_SURFACE_INSET, RUBBER_THICKNESS, POCKET_MAGNET, POCKET_CAPTURE_BOOST, POCKET_JAW_BIAS, POCKET_FALL_SPEED_CLAMP_MIN, MAX_PHYSICS_DT, BALL_MASS, RESTITUTION_PRESETS, BALL_RESTITUTION_PROFILE, CUSHION_RESTITUTION_PROFILE, activeBallRestitution, activeCushionRestitution, BALL_RESTITUTION, BALL_RESTITUTION_SLOW, PHYSICS_MODE_PRESETS, PHYSICS_MODES, PHYSICS_MODE, activePhysicsMode, BALL_FRICTION, CUSHION_RESTITUTION, CUSHION_RESTITUTION_SLOW, CUSHION_FRICTION, CLOTH_ROLL_DECEL, CLOTH_ROLL_SPEED_SCALE, LOW_SPEED_THRESHOLD, SLEEP_SPEED, CLOTH_SLIDE_DECEL, SLIP_RESOLVE_RATE, SLIDE_RESOLVE_RATE, SLIDE_THRESHOLD, SPIN_ROLL_DAMP, SPIN_SLIDE_DAMP, OBJECT_SPIN_ROLL_DAMP, OBJECT_SPIN_SLIDE_DAMP, SLEEP_SPIN, MAX_SPIN_OFFSET, SLIDE_FROM_OFFSET, CUSHION_SPIN_RETAIN, CUSHION_SPIN_ACQUIRE, BALL_SPIN_CONTACT, OBJECT_SPIN_COLLISION_TRANSFER, BALL_SPIN_COLLISION_GAIN, OBJECT_ENGLISH_VISUAL_SCALE, DRAW_COLLISION_MAX, DRAW_SPIN_TRANSFER, DRAW_REVERSE_FACTOR, DRAW_FORWARD_BRAKE, DRAW_REVERSE_SPEED_THRESHOLD, DRAW_MAX_REVERSE_SPEED_SCALE, OBJECT_DRAW_BRAKE_RATIO, FOLLOW_COLLISION_KICK, CUSHION_DRAW_KICK, COLLISION_SLIDE_MIN, CUSHION_SLIDE, SPIN_TUNING_DEFAULT, SPIN_PRESETS, SPIN_PRESET_IDS, SPIN_PRESET_LABELS, SPIN_PRESET, SPIN_CURVE_WHILE_SLIDING, SPIN_CURVE_WHILE_ROLLING, SIDE_SPIN_SLIDE_THROW, SIDE_SPIN_ROLL_THROW, SPIN_STRENGTH, SPIN_SIDE_POWER, SPIN_TOP_POWER, SQUIRT_FACTOR, SPIN_TIP_EFFICIENCY, CUSHION_THROW, BALL_SPIN_THROW, SIDE_SPIN_COLLISION_THROW, DRAW_COLLISION_KICK, SPIN_SPEED_REF, SPIN_SPEED_FALLOFF, SPIN_SPEED_EXP, SPIN_SPEED_MIN_EFF, SIDE_SPIN_TRAJ_REF_SPEED, SIDE_SPIN_TRAJ_MIN_EFF, SIDE_SPIN_TRAJ_RAMP, DRAW_SPEED_REF, DRAW_SPEED_FALLOFF, DRAW_SPEED_MIN_EFF, STRIKE_SPIN_MIN_EFF, STRIKE_SPIN_PLATEAU_EFF, STRIKE_SPIN_MAX_EFF, STRIKE_SPIN_REF, STRIKE_SPIN_HIGH_REF, STRIKE_DRAW_MIN_EFF, STRIKE_DRAW_PLATEAU_EFF, STRIKE_DRAW_MAX_EFF, STRIKE_DRAW_REF, STRIKE_DRAW_HIGH_REF, STRIKE_SQUIRT_REF, STRIKE_SQUIRT_FALLOFF, STRIKE_SQUIRT_EXP, STRIKE_SQUIRT_MIN_EFF, SIDE_SPIN_CURVE_MAX_SLIDING, SIDE_SPIN_CURVE_MAX_ROLLING, SIDE_SPIN_LATERAL_CAP, SIDE_SPIN_RESIDUAL_MIX, SLIDE_FROM_SIDE_SCALE, SPIN_MOTION_PEAK_EFF, SPIN_MOTION_MEDIUM_EFF, SPIN_MOTION_LOW_EFF, SPIN_MOTION_HIGH_END_EFF, DRAW_MOTION_EFF_BIAS, STRIKE_SPIN_EFF_FLOOR, STRIKE_DRAW_EFF_FLOOR, COLLISION_NORMAL_JITTER, BALL_BOUNCE, BALL_SURFACE_FRICTION, CUSHION_BOUNCE, CUSHION_TANGENTIAL_DAMPING, BALL_FRICTION_COEFF, AIM_SLIDER_SENSITIVITY, POWER_FACTOR, POWER_MARK_PERCENTS, AIM_LINE_VARIANTS, AIM_LINE_LABELS, AIM_MODIFIER_STORAGE_KEY, BALL_DEFS, RACK_POSITION_JITTER, RACK_ORDER;
var init_constants = __esmMin((() => {
	CANVAS_WIDTH = 1040;
	LAYOUT_WIDTH = 1244;
	CENTRAL_POCKET_RADIUS = 20 * .99225;
	POCKET_DRAW_DIAMETER = 47.52;
	POCKET_DRAW_RADIUS = POCKET_DRAW_DIAMETER / 2;
	CORNER_POCKET_DRAW_RADIUS = POCKET_DRAW_RADIUS * 1.1;
	CENTRAL_POCKET_DRAW_RADIUS = POCKET_DRAW_RADIUS * .99225;
	POCKET_LAYOUT_RADIUS = 33 / 2;
	POCKET_INSET = POCKET_LAYOUT_RADIUS * 1.5;
	CUSHION_LIP_SCALE_MIN = .7;
	CUSHION_LIP_SCALE_MAX = 1.2;
	CUSHION_LIP_SCALE_STEP = .1;
	CUSHION_LIP_SCALE = 1;
	CORNER_CUSHION_POCKET_GAP = 33 / 4;
	CENTRAL_CUSHION_POCKET_GAP = 33 / 5;
	CUSHION_CHAMFER = 33 / 4;
	MID_POCKET_INSET = (POCKET_INSET - 33 / 4) * .7;
	CORNER_POCKET_CENTER_SHIFT = POCKET_INSET * .24;
	CUSHION_DEPTH = Math.max(24.25, 41.25) * .75 * .75 * 1.1;
	PLAY_SURFACE_INSET = 33 / 4;
	RUBBER_THICKNESS = 22 * .75 * 1.28 * CUSHION_LIP_SCALE;
	POCKET_MAGNET = .28;
	POCKET_CAPTURE_BOOST = 1.15;
	POCKET_JAW_BIAS = .45;
	POCKET_FALL_SPEED_CLAMP_MIN = .5;
	MAX_PHYSICS_DT = .05;
	BALL_MASS = .167;
	2 / 5 * BALL_MASS * 11 * 11;
	RESTITUTION_PRESETS = {
		soft: {
			ball: .91,
			ballSlow: .78,
			cushion: .84,
			cushionSlow: .68
		},
		tournament: {
			ball: .93,
			ballSlow: .8,
			cushion: .87,
			cushionSlow: .72
		}
	};
	BALL_RESTITUTION_PROFILE = "tournament";
	CUSHION_RESTITUTION_PROFILE = "tournament";
	activeBallRestitution = RESTITUTION_PRESETS[BALL_RESTITUTION_PROFILE];
	activeCushionRestitution = RESTITUTION_PRESETS[CUSHION_RESTITUTION_PROFILE];
	BALL_RESTITUTION = activeBallRestitution.ball;
	BALL_RESTITUTION_SLOW = activeBallRestitution.ballSlow;
	PHYSICS_MODE_PRESETS = {
		real: {
			ballFriction: .05,
			cushionFriction: .17,
			clothRollDecel: .017,
			clothRollSpeedScale: .0028,
			lowSpeedThreshold: 1.3
		},
		balanced: {
			ballFriction: .055,
			cushionFriction: .18,
			clothRollDecel: .019,
			clothRollSpeedScale: .003,
			lowSpeedThreshold: 1.4
		},
		arcade: {
			ballFriction: .065,
			cushionFriction: .22,
			clothRollDecel: .022,
			clothRollSpeedScale: .0035,
			lowSpeedThreshold: 1.6
		}
	};
	PHYSICS_MODES = [
		"real",
		"balanced",
		"arcade"
	];
	PHYSICS_MODE = "balanced";
	activePhysicsMode = PHYSICS_MODE_PRESETS[PHYSICS_MODE];
	BALL_FRICTION = activePhysicsMode.ballFriction;
	CUSHION_RESTITUTION = activeCushionRestitution.cushion;
	CUSHION_RESTITUTION_SLOW = activeCushionRestitution.cushionSlow;
	CUSHION_FRICTION = activePhysicsMode.cushionFriction;
	CLOTH_ROLL_DECEL = activePhysicsMode.clothRollDecel;
	CLOTH_ROLL_SPEED_SCALE = activePhysicsMode.clothRollSpeedScale;
	LOW_SPEED_THRESHOLD = activePhysicsMode.lowSpeedThreshold;
	SLEEP_SPEED = .014;
	CLOTH_SLIDE_DECEL = .068;
	SLIP_RESOLVE_RATE = .072;
	SLIDE_RESOLVE_RATE = .048;
	SLIDE_THRESHOLD = .035;
	SPIN_ROLL_DAMP = .0024;
	SPIN_SLIDE_DAMP = .0048;
	OBJECT_SPIN_ROLL_DAMP = .0024;
	OBJECT_SPIN_SLIDE_DAMP = .0048;
	SLEEP_SPIN = .12;
	MAX_SPIN_OFFSET = .72;
	SLIDE_FROM_OFFSET = .88;
	CUSHION_SPIN_RETAIN = .71;
	CUSHION_SPIN_ACQUIRE = .52;
	BALL_SPIN_CONTACT = .54;
	OBJECT_SPIN_COLLISION_TRANSFER = .96;
	BALL_SPIN_COLLISION_GAIN = 3.84;
	OBJECT_ENGLISH_VISUAL_SCALE = 1.32;
	DRAW_COLLISION_MAX = .48;
	DRAW_SPIN_TRANSFER = .04;
	DRAW_REVERSE_FACTOR = .32;
	DRAW_FORWARD_BRAKE = .42;
	DRAW_REVERSE_SPEED_THRESHOLD = .72;
	DRAW_MAX_REVERSE_SPEED_SCALE = 1.35;
	OBJECT_DRAW_BRAKE_RATIO = .38;
	FOLLOW_COLLISION_KICK = .085;
	CUSHION_DRAW_KICK = .028;
	COLLISION_SLIDE_MIN = .34;
	CUSHION_SLIDE = .52;
	SPIN_TUNING_DEFAULT = {
		spinStrength: 1.5,
		spinSidePower: 1.28,
		spinTopPower: .64,
		squirtFactor: .17,
		spinTipEfficiency: .61,
		spinCurveWhileSliding: .0048,
		spinCurveWhileRolling: .00105,
		sideSpinSlideThrow: .0058,
		sideSpinRollThrow: .0012,
		cushionThrow: .062,
		ballSpinThrow: .26,
		sideSpinCollisionThrow: .6,
		drawCollisionKick: .38,
		spinSpeedRef: 18,
		spinSpeedFalloff: .72,
		spinSpeedExp: 1.5,
		spinSpeedMinEff: .36,
		sideSpinTrajRefSpeed: 25,
		sideSpinTrajMinEff: .038,
		sideSpinTrajRamp: .35,
		drawSpeedRef: 19,
		drawSpeedFalloff: .32,
		drawSpeedMinEff: .66,
		strikeSpinMinEff: .78,
		strikeSpinPlateauEff: .48,
		strikeSpinMaxEff: .52,
		strikeSpinRef: 12,
		strikeSpinHighRef: 24,
		strikeDrawMinEff: .8,
		strikeDrawPlateauEff: .52,
		strikeDrawMaxEff: .56,
		strikeDrawRef: 13,
		strikeDrawHighRef: 25,
		strikeSquirtRef: 13.5,
		strikeSquirtFalloff: 1.1,
		strikeSquirtExp: 1.85,
		strikeSquirtMinEff: .24,
		sideSpinCurveMaxSliding: .17,
		sideSpinCurveMaxRolling: .09,
		sideSpinLateralCap: .14,
		sideSpinResidualMix: .62,
		slideFromSideScale: .75,
		spinMotionPeakEff: 1,
		spinMotionMediumEff: .6,
		spinMotionLowEff: .38,
		spinMotionHighEndEff: .07,
		drawMotionEffBias: 1.06,
		strikeSpinEffFloor: .18,
		strikeDrawEffFloor: .2
	};
	SPIN_PRESETS = {
		default: SPIN_TUNING_DEFAULT,
		real: {
			spinStrength: 1,
			spinSidePower: .82,
			spinTopPower: .48,
			squirtFactor: .07,
			spinTipEfficiency: .35,
			spinCurveWhileSliding: .0011,
			spinCurveWhileRolling: 12e-5,
			sideSpinSlideThrow: .0012,
			sideSpinRollThrow: 2e-4,
			cushionThrow: .038,
			ballSpinThrow: .16,
			sideSpinCollisionThrow: .34,
			drawCollisionKick: .3,
			spinSpeedRef: 14,
			spinSpeedFalloff: .95,
			spinSpeedExp: 1.65,
			spinSpeedMinEff: .28,
			sideSpinTrajRefSpeed: 22,
			sideSpinTrajMinEff: .01,
			sideSpinTrajRamp: .38,
			drawSpeedRef: 16,
			drawSpeedFalloff: .42,
			drawSpeedMinEff: .58,
			strikeSpinMinEff: .74,
			strikeSpinPlateauEff: .42,
			strikeSpinMaxEff: .46,
			strikeSpinRef: 11,
			strikeSpinHighRef: 22,
			strikeDrawMinEff: .76,
			strikeDrawPlateauEff: .46,
			strikeDrawMaxEff: .5,
			strikeDrawRef: 12,
			strikeDrawHighRef: 23,
			strikeSquirtRef: 10.5,
			strikeSquirtFalloff: 1.65,
			strikeSquirtExp: 2.1,
			strikeSquirtMinEff: .12,
			sideSpinCurveMaxSliding: .06,
			sideSpinCurveMaxRolling: .022,
			sideSpinLateralCap: .055,
			sideSpinResidualMix: .24,
			slideFromSideScale: .58,
			spinMotionPeakEff: .92,
			spinMotionMediumEff: .52,
			spinMotionLowEff: .32,
			spinMotionHighEndEff: .05,
			drawMotionEffBias: 1.04,
			strikeSpinEffFloor: .15,
			strikeDrawEffFloor: .17
		},
		arcade: {
			spinStrength: 1.85,
			spinSidePower: 1.48,
			spinTopPower: .78,
			squirtFactor: .48,
			spinTipEfficiency: .72,
			spinCurveWhileSliding: .0032,
			spinCurveWhileRolling: 55e-5,
			sideSpinSlideThrow: .0036,
			sideSpinRollThrow: 62e-5,
			cushionThrow: .082,
			ballSpinThrow: .34,
			sideSpinCollisionThrow: .78,
			drawCollisionKick: .46,
			spinSpeedRef: 21,
			spinSpeedFalloff: .55,
			spinSpeedExp: 1.35,
			spinSpeedMinEff: .44,
			sideSpinTrajRefSpeed: 27,
			sideSpinTrajMinEff: .02,
			sideSpinTrajRamp: .48,
			drawSpeedRef: 22,
			drawSpeedFalloff: .24,
			drawSpeedMinEff: .72,
			strikeSpinMinEff: .82,
			strikeSpinPlateauEff: .54,
			strikeSpinMaxEff: .58,
			strikeSpinRef: 13,
			strikeSpinHighRef: 26,
			strikeDrawMinEff: .84,
			strikeDrawPlateauEff: .58,
			strikeDrawMaxEff: .62,
			strikeDrawRef: 14,
			strikeDrawHighRef: 27,
			strikeSquirtRef: 16,
			strikeSquirtFalloff: .82,
			strikeSquirtExp: 1.65,
			strikeSquirtMinEff: .32,
			sideSpinCurveMaxSliding: .14,
			sideSpinCurveMaxRolling: .058,
			sideSpinLateralCap: .11,
			sideSpinResidualMix: .55,
			slideFromSideScale: .88,
			spinMotionPeakEff: 1,
			spinMotionMediumEff: .68,
			spinMotionLowEff: .42,
			spinMotionHighEndEff: .1,
			drawMotionEffBias: 1.1,
			strikeSpinEffFloor: .22,
			strikeDrawEffFloor: .24
		}
	};
	SPIN_PRESET_IDS = [
		"default",
		"real",
		"arcade"
	];
	SPIN_PRESET_LABELS = {
		default: "def",
		real: "real",
		arcade: "arc"
	};
	SPIN_PRESET = "default";
	SPIN_CURVE_WHILE_SLIDING = SPIN_TUNING_DEFAULT.spinCurveWhileSliding;
	SPIN_CURVE_WHILE_ROLLING = SPIN_TUNING_DEFAULT.spinCurveWhileRolling;
	SIDE_SPIN_SLIDE_THROW = SPIN_TUNING_DEFAULT.sideSpinSlideThrow;
	SIDE_SPIN_ROLL_THROW = SPIN_TUNING_DEFAULT.sideSpinRollThrow;
	SPIN_STRENGTH = SPIN_TUNING_DEFAULT.spinStrength;
	SPIN_SIDE_POWER = SPIN_TUNING_DEFAULT.spinSidePower;
	SPIN_TOP_POWER = SPIN_TUNING_DEFAULT.spinTopPower;
	SQUIRT_FACTOR = SPIN_TUNING_DEFAULT.squirtFactor;
	SPIN_TIP_EFFICIENCY = SPIN_TUNING_DEFAULT.spinTipEfficiency;
	CUSHION_THROW = SPIN_TUNING_DEFAULT.cushionThrow;
	BALL_SPIN_THROW = SPIN_TUNING_DEFAULT.ballSpinThrow;
	SIDE_SPIN_COLLISION_THROW = SPIN_TUNING_DEFAULT.sideSpinCollisionThrow;
	DRAW_COLLISION_KICK = SPIN_TUNING_DEFAULT.drawCollisionKick;
	SPIN_TUNING_DEFAULT.spinSpeedRef;
	SPIN_TUNING_DEFAULT.spinSpeedFalloff;
	SPIN_TUNING_DEFAULT.spinSpeedExp;
	SPIN_TUNING_DEFAULT.spinSpeedMinEff;
	SPIN_TUNING_DEFAULT.sideSpinTrajRefSpeed;
	SPIN_TUNING_DEFAULT.sideSpinTrajMinEff;
	SPIN_TUNING_DEFAULT.sideSpinTrajRamp;
	SPIN_TUNING_DEFAULT.drawSpeedRef;
	SPIN_TUNING_DEFAULT.drawSpeedFalloff;
	SPIN_TUNING_DEFAULT.drawSpeedMinEff;
	SPIN_TUNING_DEFAULT.strikeSpinMinEff;
	SPIN_TUNING_DEFAULT.strikeSpinPlateauEff;
	SPIN_TUNING_DEFAULT.strikeSpinMaxEff;
	SPIN_TUNING_DEFAULT.strikeSpinRef;
	SPIN_TUNING_DEFAULT.strikeSpinHighRef;
	SPIN_TUNING_DEFAULT.strikeDrawMinEff;
	SPIN_TUNING_DEFAULT.strikeDrawPlateauEff;
	SPIN_TUNING_DEFAULT.strikeDrawMaxEff;
	SPIN_TUNING_DEFAULT.strikeDrawRef;
	SPIN_TUNING_DEFAULT.strikeDrawHighRef;
	SPIN_TUNING_DEFAULT.strikeSquirtRef;
	SPIN_TUNING_DEFAULT.strikeSquirtFalloff;
	SPIN_TUNING_DEFAULT.strikeSquirtExp;
	STRIKE_SQUIRT_MIN_EFF = SPIN_TUNING_DEFAULT.strikeSquirtMinEff;
	SIDE_SPIN_CURVE_MAX_SLIDING = SPIN_TUNING_DEFAULT.sideSpinCurveMaxSliding;
	SIDE_SPIN_CURVE_MAX_ROLLING = SPIN_TUNING_DEFAULT.sideSpinCurveMaxRolling;
	SIDE_SPIN_LATERAL_CAP = SPIN_TUNING_DEFAULT.sideSpinLateralCap;
	SIDE_SPIN_RESIDUAL_MIX = SPIN_TUNING_DEFAULT.sideSpinResidualMix;
	SLIDE_FROM_SIDE_SCALE = SPIN_TUNING_DEFAULT.slideFromSideScale;
	SPIN_MOTION_PEAK_EFF = SPIN_TUNING_DEFAULT.spinMotionPeakEff;
	SPIN_MOTION_MEDIUM_EFF = SPIN_TUNING_DEFAULT.spinMotionMediumEff;
	SPIN_MOTION_LOW_EFF = SPIN_TUNING_DEFAULT.spinMotionLowEff;
	SPIN_MOTION_HIGH_END_EFF = SPIN_TUNING_DEFAULT.spinMotionHighEndEff;
	DRAW_MOTION_EFF_BIAS = SPIN_TUNING_DEFAULT.drawMotionEffBias;
	STRIKE_SPIN_EFF_FLOOR = SPIN_TUNING_DEFAULT.strikeSpinEffFloor;
	STRIKE_DRAW_EFF_FLOOR = SPIN_TUNING_DEFAULT.strikeDrawEffFloor;
	COLLISION_NORMAL_JITTER = {
		enabled: true,
		cushionMaxDeg: .3,
		ballMaxDeg: .22,
		minSpeedFactor: .2,
		slowSpeedScale: .4,
		minImpactSpeed: SLEEP_SPEED * 3
	};
	BALL_BOUNCE = BALL_RESTITUTION;
	BALL_SURFACE_FRICTION = BALL_FRICTION;
	CUSHION_BOUNCE = CUSHION_RESTITUTION;
	CUSHION_TANGENTIAL_DAMPING = CUSHION_FRICTION;
	AIM_SLIDER_SENSITIVITY = .0037 / 8;
	POWER_FACTOR = .22;
	POWER_MARK_PERCENTS = [
		0,
		25,
		50,
		90
	];
	AIM_LINE_VARIANTS = [
		"off",
		"on",
		"max"
	];
	AIM_LINE_LABELS = {
		off: "off",
		on: "on",
		max: "MAX"
	};
	AIM_MODIFIER_STORAGE_KEY = "vtj-pool-aim-modifier";
	BALL_DEFS = {
		1: {
			color: "#f5d000",
			type: "solid"
		},
		2: {
			color: "#0044cc",
			type: "solid"
		},
		3: {
			color: "#cc0000",
			type: "solid"
		},
		4: {
			color: "#6600aa",
			type: "solid"
		},
		5: {
			color: "#ff6600",
			type: "solid"
		},
		6: {
			color: "#008833",
			type: "solid"
		},
		7: {
			color: "#880022",
			type: "solid"
		},
		8: {
			color: "#111111",
			type: "eight"
		},
		9: {
			color: "#f5d000",
			type: "stripe"
		},
		10: {
			color: "#0044cc",
			type: "stripe"
		},
		11: {
			color: "#cc0000",
			type: "stripe"
		},
		12: {
			color: "#6600aa",
			type: "stripe"
		},
		13: {
			color: "#ff6600",
			type: "stripe"
		},
		14: {
			color: "#008833",
			type: "stripe"
		},
		15: {
			color: "#880022",
			type: "stripe"
		}
	};
	RACK_POSITION_JITTER = .12;
	RACK_ORDER = [
		[1],
		[2, 3],
		[
			4,
			8,
			5
		],
		[
			6,
			7,
			9,
			10
		],
		[
			11,
			12,
			13,
			14,
			15
		]
	];
}));
//#endregion
//#region public/utils.js
function pocketRadius(id) {
	return CENTRAL_POCKET_IDS.has(id) ? CENTRAL_POCKET_RADIUS : 22;
}
function pocketDrawRadius(id) {
	return CENTRAL_POCKET_IDS.has(id) ? CENTRAL_POCKET_DRAW_RADIUS : CORNER_POCKET_DRAW_RADIUS;
}
function getPlayArea() {
	return {
		left: 0,
		top: 0,
		right: CANVAS_WIDTH,
		bottom: 520,
		width: CANVAS_WIDTH,
		height: 520
	};
}
function getPlaySurface() {
	return {
		left: PLAY_SURFACE_INSET,
		top: PLAY_SURFACE_INSET,
		right: CANVAS_WIDTH - PLAY_SURFACE_INSET,
		bottom: 520 - PLAY_SURFACE_INSET,
		width: CANVAS_WIDTH - PLAY_SURFACE_INSET * 2,
		height: 520 - PLAY_SURFACE_INSET * 2
	};
}
function buildPockets(cornerShift = 0) {
	const play = getPlayArea();
	const mx = play.left + play.width / 2;
	const cornerInset = POCKET_INSET + 0 + cornerShift;
	const midInset = MID_POCKET_INSET + 0;
	return [
		{
			id: "tl",
			x: play.left + cornerInset,
			y: play.top + cornerInset,
			wall: "left",
			radius: pocketRadius("tl"),
			drawRadius: pocketDrawRadius("tl")
		},
		{
			id: "tm",
			x: mx,
			y: play.top + midInset,
			wall: "top",
			radius: pocketRadius("tm"),
			drawRadius: pocketDrawRadius("tm")
		},
		{
			id: "tr",
			x: play.right - cornerInset,
			y: play.top + cornerInset,
			wall: "right",
			radius: pocketRadius("tr"),
			drawRadius: pocketDrawRadius("tr")
		},
		{
			id: "bl",
			x: play.left + cornerInset,
			y: play.bottom - cornerInset,
			wall: "left",
			radius: pocketRadius("bl"),
			drawRadius: pocketDrawRadius("bl")
		},
		{
			id: "bm",
			x: mx,
			y: play.bottom - midInset,
			wall: "bottom",
			radius: pocketRadius("bm"),
			drawRadius: pocketDrawRadius("bm")
		},
		{
			id: "br",
			x: play.right - cornerInset,
			y: play.bottom - cornerInset,
			wall: "right",
			radius: pocketRadius("br"),
			drawRadius: pocketDrawRadius("br")
		}
	];
}
/** Позиции луз для геометрии бортов — без сдвига угловых луз к центру. */
function getLayoutPockets() {
	return buildPockets(0);
}
function getPockets() {
	return buildPockets(CORNER_POCKET_CENTER_SHIFT);
}
function tryPocketBall(ball, timeScale = 1) {
	if (ball.inPocket || ball.isPocketing()) return true;
	const speed = Math.hypot(ball.vx, ball.vy);
	for (const pocket of getPockets()) {
		const dx = pocket.x - ball.x;
		const dy = pocket.y - ball.y;
		const dist = Math.hypot(dx, dy);
		if (dist < .5) {
			ball.startPocketFall(pocket);
			return true;
		}
		let captureRadius = pocket.radius;
		if (speed < 5) captureRadius *= POCKET_CAPTURE_BOOST;
		if (speed > .1) {
			const approach = (ball.vx * dx + ball.vy * dy) / (dist * speed);
			if (approach > 0) captureRadius *= 1 + POCKET_JAW_BIAS * approach;
		}
		if (dist < captureRadius) {
			const pull = POCKET_MAGNET * timeScale * (1 + speed * .04);
			ball.vx += dx / dist * pull;
			ball.vy += dy / dist * pull;
		}
		if (dist < captureRadius * .72) {
			ball.startPocketFall(pocket);
			return true;
		}
	}
	return false;
}
function getHeadSpot() {
	const surface = getPlaySurface();
	return {
		x: surface.left + surface.width * .25,
		y: surface.top + surface.height / 2
	};
}
function getFootSpot() {
	const surface = getPlaySurface();
	return {
		x: surface.left + surface.width * .75,
		y: surface.top + surface.height / 2
	};
}
function lighten(hex, amount) {
	const n = parseInt(hex.slice(1), 16);
	return `rgb(${Math.min(255, (n >> 16 & 255) + amount)},${Math.min(255, (n >> 8 & 255) + amount)},${Math.min(255, (n & 255) + amount)})`;
}
function darken(hex, amount) {
	const n = parseInt(hex.slice(1), 16);
	return `rgb(${Math.max(0, (n >> 16 & 255) - amount)},${Math.max(0, (n >> 8 & 255) - amount)},${Math.max(0, (n & 255) - amount)})`;
}
var CENTRAL_POCKET_IDS;
var init_utils = __esmMin((() => {
	init_constants();
	CENTRAL_POCKET_IDS = /* @__PURE__ */ new Set(["tm", "bm"]);
})), ARRAY_TYPE;
var init_common = __esmMin((() => {
	ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
	Math.PI / 180;
	180 / Math.PI;
}));
//#endregion
//#region node_modules/gl-matrix/esm/mat3.js
/**
* 3x3 Matrix
* @module mat3
*/
/**
* Creates a new identity mat3
*
* @returns {mat3} a new 3x3 matrix
*/
function create$3() {
	var out = new ARRAY_TYPE(9);
	if (ARRAY_TYPE != Float32Array) {
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[5] = 0;
		out[6] = 0;
		out[7] = 0;
	}
	out[0] = 1;
	out[4] = 1;
	out[8] = 1;
	return out;
}
var init_mat3 = __esmMin((() => {
	init_common();
}));
//#endregion
//#region node_modules/gl-matrix/esm/vec3.js
/**
* 3 Dimensional Vector
* @module vec3
*/
/**
* Creates a new, empty vec3
*
* @returns {vec3} a new 3D vector
*/
function create$2() {
	var out = new ARRAY_TYPE(3);
	if (ARRAY_TYPE != Float32Array) {
		out[0] = 0;
		out[1] = 0;
		out[2] = 0;
	}
	return out;
}
/**
* Calculates the length of a vec3
*
* @param {ReadonlyVec3} a vector to calculate length of
* @returns {Number} length of a
*/
function length(a) {
	var x = a[0];
	var y = a[1];
	var z = a[2];
	return Math.sqrt(x * x + y * y + z * z);
}
/**
* Creates a new vec3 initialized with the given values
*
* @param {Number} x X component
* @param {Number} y Y component
* @param {Number} z Z component
* @returns {vec3} a new 3D vector
*/
function fromValues(x, y, z) {
	var out = new ARRAY_TYPE(3);
	out[0] = x;
	out[1] = y;
	out[2] = z;
	return out;
}
/**
* Normalize a vec3
*
* @param {vec3} out the receiving vector
* @param {ReadonlyVec3} a vector to normalize
* @returns {vec3} out
*/
function normalize$2(out, a) {
	var x = a[0];
	var y = a[1];
	var z = a[2];
	var len = x * x + y * y + z * z;
	if (len > 0) len = 1 / Math.sqrt(len);
	out[0] = a[0] * len;
	out[1] = a[1] * len;
	out[2] = a[2] * len;
	return out;
}
/**
* Calculates the dot product of two vec3's
*
* @param {ReadonlyVec3} a the first operand
* @param {ReadonlyVec3} b the second operand
* @returns {Number} dot product of a and b
*/
function dot(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
* Computes the cross product of two vec3's
*
* @param {vec3} out the receiving vector
* @param {ReadonlyVec3} a the first operand
* @param {ReadonlyVec3} b the second operand
* @returns {vec3} out
*/
function cross(out, a, b) {
	var ax = a[0], ay = a[1], az = a[2];
	var bx = b[0], by = b[1], bz = b[2];
	out[0] = ay * bz - az * by;
	out[1] = az * bx - ax * bz;
	out[2] = ax * by - ay * bx;
	return out;
}
var len;
var init_vec3 = __esmMin((() => {
	init_common();
	len = length;
	(function() {
		var vec = create$2();
		return function(a, stride, offset, count, fn, arg) {
			var i, l;
			if (!stride) stride = 3;
			if (!offset) offset = 0;
			if (count) l = Math.min(count * stride + offset, a.length);
			else l = a.length;
			for (i = offset; i < l; i += stride) {
				vec[0] = a[i];
				vec[1] = a[i + 1];
				vec[2] = a[i + 2];
				fn(vec, vec, arg);
				a[i] = vec[0];
				a[i + 1] = vec[1];
				a[i + 2] = vec[2];
			}
			return a;
		};
	})();
}));
//#endregion
//#region node_modules/gl-matrix/esm/vec4.js
/**
* 4 Dimensional Vector
* @module vec4
*/
/**
* Creates a new, empty vec4
*
* @returns {vec4} a new 4D vector
*/
function create$1() {
	var out = new ARRAY_TYPE(4);
	if (ARRAY_TYPE != Float32Array) {
		out[0] = 0;
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
	}
	return out;
}
/**
* Set the components of a vec4 to the given values
*
* @param {vec4} out the receiving vector
* @param {Number} x X component
* @param {Number} y Y component
* @param {Number} z Z component
* @param {Number} w W component
* @returns {vec4} out
*/
function set$1(out, x, y, z, w) {
	out[0] = x;
	out[1] = y;
	out[2] = z;
	out[3] = w;
	return out;
}
/**
* Normalize a vec4
*
* @param {vec4} out the receiving vector
* @param {ReadonlyVec4} a vector to normalize
* @returns {vec4} out
*/
function normalize$1(out, a) {
	var x = a[0];
	var y = a[1];
	var z = a[2];
	var w = a[3];
	var len = x * x + y * y + z * z + w * w;
	if (len > 0) len = 1 / Math.sqrt(len);
	out[0] = x * len;
	out[1] = y * len;
	out[2] = z * len;
	out[3] = w * len;
	return out;
}
var init_vec4 = __esmMin((() => {
	init_common();
	(function() {
		var vec = create$1();
		return function(a, stride, offset, count, fn, arg) {
			var i, l;
			if (!stride) stride = 4;
			if (!offset) offset = 0;
			if (count) l = Math.min(count * stride + offset, a.length);
			else l = a.length;
			for (i = offset; i < l; i += stride) {
				vec[0] = a[i];
				vec[1] = a[i + 1];
				vec[2] = a[i + 2];
				vec[3] = a[i + 3];
				fn(vec, vec, arg);
				a[i] = vec[0];
				a[i + 1] = vec[1];
				a[i + 2] = vec[2];
				a[i + 3] = vec[3];
			}
			return a;
		};
	})();
}));
//#endregion
//#region node_modules/gl-matrix/esm/quat.js
/**
* Quaternion in the format XYZW
* @module quat
*/
/**
* Creates a new identity quat
*
* @returns {quat} a new quaternion
*/
function create() {
	var out = new ARRAY_TYPE(4);
	if (ARRAY_TYPE != Float32Array) {
		out[0] = 0;
		out[1] = 0;
		out[2] = 0;
	}
	out[3] = 1;
	return out;
}
/**
* Sets a quat from the given angle and rotation axis,
* then returns it.
*
* @param {quat} out the receiving quaternion
* @param {ReadonlyVec3} axis the axis around which to rotate
* @param {Number} rad the angle in radians
* @returns {quat} out
**/
function setAxisAngle(out, axis, rad) {
	rad = rad * .5;
	var s = Math.sin(rad);
	out[0] = s * axis[0];
	out[1] = s * axis[1];
	out[2] = s * axis[2];
	out[3] = Math.cos(rad);
	return out;
}
/**
* Multiplies two quat's
*
* @param {quat} out the receiving quaternion
* @param {ReadonlyQuat} a the first operand
* @param {ReadonlyQuat} b the second operand
* @returns {quat} out
*/
function multiply(out, a, b) {
	var ax = a[0], ay = a[1], az = a[2], aw = a[3];
	var bx = b[0], by = b[1], bz = b[2], bw = b[3];
	out[0] = ax * bw + aw * bx + ay * bz - az * by;
	out[1] = ay * bw + aw * by + az * bx - ax * bz;
	out[2] = az * bw + aw * bz + ax * by - ay * bx;
	out[3] = aw * bw - ax * bx - ay * by - az * bz;
	return out;
}
/**
* Performs a spherical linear interpolation between two quat
*
* @param {quat} out the receiving quaternion
* @param {ReadonlyQuat} a the first operand
* @param {ReadonlyQuat} b the second operand
* @param {Number} t interpolation amount, in the range [0-1], between the two inputs
* @returns {quat} out
*/
function slerp(out, a, b, t) {
	var ax = a[0], ay = a[1], az = a[2], aw = a[3];
	var bx = b[0], by = b[1], bz = b[2], bw = b[3];
	var omega, cosom = ax * bx + ay * by + az * bz + aw * bw, sinom, scale0, scale1;
	if (cosom < 0) {
		cosom = -cosom;
		bx = -bx;
		by = -by;
		bz = -bz;
		bw = -bw;
	}
	if (1 - cosom > 1e-6) {
		omega = Math.acos(cosom);
		sinom = Math.sin(omega);
		scale0 = Math.sin((1 - t) * omega) / sinom;
		scale1 = Math.sin(t * omega) / sinom;
	} else {
		scale0 = 1 - t;
		scale1 = t;
	}
	out[0] = scale0 * ax + scale1 * bx;
	out[1] = scale0 * ay + scale1 * by;
	out[2] = scale0 * az + scale1 * bz;
	out[3] = scale0 * aw + scale1 * bw;
	return out;
}
/**
* Creates a quaternion from the given 3x3 rotation matrix.
*
* NOTE: The resultant quaternion is not normalized, so you should be sure
* to renormalize the quaternion yourself where necessary.
*
* @param {quat} out the receiving quaternion
* @param {ReadonlyMat3} m rotation matrix
* @returns {quat} out
* @function
*/
function fromMat3(out, m) {
	var fTrace = m[0] + m[4] + m[8];
	var fRoot;
	if (fTrace > 0) {
		fRoot = Math.sqrt(fTrace + 1);
		out[3] = .5 * fRoot;
		fRoot = .5 / fRoot;
		out[0] = (m[5] - m[7]) * fRoot;
		out[1] = (m[6] - m[2]) * fRoot;
		out[2] = (m[1] - m[3]) * fRoot;
	} else {
		var i = 0;
		if (m[4] > m[0]) i = 1;
		if (m[8] > m[i * 3 + i]) i = 2;
		var j = (i + 1) % 3;
		var k = (i + 2) % 3;
		fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1);
		out[i] = .5 * fRoot;
		fRoot = .5 / fRoot;
		out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
		out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
		out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
	}
	return out;
}
var set, normalize;
var init_quat = __esmMin((() => {
	init_common();
	init_mat3();
	init_vec3();
	init_vec4();
	set = set$1;
	normalize = normalize$1;
	(function() {
		var tmpvec3 = create$2();
		var xUnitVec3 = fromValues(1, 0, 0);
		var yUnitVec3 = fromValues(0, 1, 0);
		return function(out, a, b) {
			var dot$1 = dot(a, b);
			if (dot$1 < -.999999) {
				cross(tmpvec3, xUnitVec3, a);
				if (len(tmpvec3) < 1e-6) cross(tmpvec3, yUnitVec3, a);
				normalize$2(tmpvec3, tmpvec3);
				setAxisAngle(out, tmpvec3, Math.PI);
				return out;
			} else if (dot$1 > .999999) {
				out[0] = 0;
				out[1] = 0;
				out[2] = 0;
				out[3] = 1;
				return out;
			} else {
				cross(tmpvec3, a, b);
				out[0] = tmpvec3[0];
				out[1] = tmpvec3[1];
				out[2] = tmpvec3[2];
				out[3] = 1 + dot$1;
				return normalize(out, out);
			}
		};
	})();
	(function() {
		var temp1 = create();
		var temp2 = create();
		return function(out, a, b, c, d, t) {
			slerp(temp1, a, d, t);
			slerp(temp2, b, c, t);
			slerp(out, temp1, temp2, 2 * t * (1 - t));
			return out;
		};
	})();
	(function() {
		var matr = create$3();
		return function(out, view, right, up) {
			matr[0] = right[0];
			matr[3] = right[1];
			matr[6] = right[2];
			matr[1] = up[0];
			matr[4] = up[1];
			matr[7] = up[2];
			matr[2] = -view[0];
			matr[5] = -view[1];
			matr[8] = -view[2];
			return normalize(out, fromMat3(out, matr));
		};
	})();
}));
//#endregion
//#region node_modules/gl-matrix/esm/index.js
var init_esm = __esmMin((() => {
	init_quat();
	init_vec3();
}));
//#endregion
//#region public/math3d.js
function quatFromObject(qObj, out = _q) {
	return set(out, qObj.x, qObj.y, qObj.z, qObj.w);
}
function quatToObject(q) {
	return {
		x: q[0],
		y: q[1],
		z: q[2],
		w: q[3]
	};
}
function quatMultiply(aObj, bObj) {
	multiply(_q, quatFromObject(aObj, _qa), quatFromObject(bObj, _qb));
	return quatToObject(_q);
}
function quatNormalize(qObj) {
	normalize(_q, quatFromObject(qObj));
	return quatToObject(_q);
}
function quatFromRotation(rx, ry, rz) {
	const angle = Math.hypot(rx, ry, rz);
	if (angle < 1e-10) return {
		w: 1,
		x: 0,
		y: 0,
		z: 0
	};
	const half = angle * .5;
	const s = Math.sin(half) / angle;
	return quatNormalize({
		w: Math.cos(half),
		x: rx * s,
		y: ry * s,
		z: rz * s
	});
}
var _q, _qa, _qb;
var init_math3d = __esmMin((() => {
	init_esm();
	create$2();
	_q = create();
	_qa = create();
	_qb = create();
}));
//#endregion
//#region public/ball.js
function clearCueDrawVisualState(ball) {
	ball.cueDrawApproach = false;
	ball.cueDrawPostHit = false;
}
/** Синхронизирует угловую скорость ω с кинематическим состоянием физики (v, spin, topSpin). */
function updateBallOmega(ball) {
	const r = ball.radius;
	const vx = ball.vx || 0;
	const vy = ball.vy || 0;
	const speed = Math.hypot(vx, vy);
	const spin = ball.spin || 0;
	const topSpin = ball.topSpin || 0;
	if (ball.isCueBall && ball.cueDrawPostHit) {
		ball.omegaX = speed > 1e-8 ? -vy / r : 0;
		ball.omegaY = speed > 1e-8 ? vx / r : 0;
		ball.omegaZ = spin / r;
		return;
	}
	let rollMix = rollingVisualMix(ball);
	let rollSign = 1;
	if (ball.isCueBall && ball.cueDrawApproach) {
		rollSign = -1;
		rollMix = cueDrawApproachRollMix(ball, topSpin, rollMix);
	}
	let omegaX = 0;
	let omegaY = 0;
	if (speed > 1e-8 && rollMix > 1e-6) {
		omegaX = -vy / r * rollMix * rollSign;
		omegaY = vx / r * rollMix * rollSign;
	}
	let omegaZ = spin / r;
	if (!ball.isCueBall) omegaZ *= OBJECT_ENGLISH_VISUAL_SCALE;
	const skipTopSpinRoll = ball.isCueBall && ball.cueDrawApproach;
	if (speed > 1e-8 && Math.abs(topSpin) > 1e-8 && rollMix > 1e-6 && !skipTopSpinRoll) {
		const dirX = vx / speed;
		const dirY = vy / speed;
		const topOmega = topSpin / r;
		omegaX += -dirY * topOmega * rollMix;
		omegaY += dirX * topOmega * rollMix;
	}
	ball.omegaX = omegaX;
	ball.omegaY = omegaY;
	ball.omegaZ = omegaZ;
}
function clearBallOmega(ball) {
	ball.omegaX = 0;
	ball.omegaY = 0;
	ball.omegaZ = 0;
}
function randomBallMass() {
	return (156 + Math.random() * 16) / 1e3;
}
var IDENTITY_QUAT, Ball;
var init_ball = __esmMin((() => {
	init_constants();
	init_utils();
	init_math3d();
	IDENTITY_QUAT = {
		w: 1,
		x: 0,
		y: 0,
		z: 0
	};
	Ball = class {
		constructor(x, y, options = {}) {
			this.x = x;
			this.y = y;
			this.vx = 0;
			this.vy = 0;
			this.radius = 11;
			this.mass = options.mass ?? .167;
			this.isCueBall = options.isCueBall || false;
			this.number = options.number || 0;
			this.ballType = options.ballType || (this.isCueBall ? "cue" : "solid");
			this.color = options.color || "#ffffff";
			this.inPocket = false;
			this.pocketFall = null;
			this.spin = 0;
			this.topSpin = 0;
			this.slide = 0;
			this.omegaX = 0;
			this.omegaY = 0;
			this.omegaZ = 0;
			this.orientation = { ...IDENTITY_QUAT };
			this.px = x;
			this.py = y;
			this.sleepFrames = 0;
			this.lastDirX = 1;
			this.lastDirY = 0;
			this.drawAxisX = 0;
			this.drawAxisY = 0;
			this.cueDrawApproach = false;
			this.cueDrawPostHit = false;
		}
		startPocketFall(pocket) {
			if (this.pocketFall || this.inPocket) return;
			const entrySpeed = Math.hypot(this.vx, this.vy);
			this.pocketFall = {
				pocketX: pocket.x,
				pocketY: pocket.y,
				pocketDrawRadius: pocket.drawRadius ?? pocket.radius,
				startX: this.x,
				startY: this.y,
				startTime: performance.now(),
				duration: computePocketFallDuration(entrySpeed),
				entrySpeed,
				entryAngle: Math.atan2(this.y - pocket.y, this.x - pocket.x),
				depth: 0,
				scale: 1,
				alpha: 1,
				progress: 0
			};
			this.vx = 0;
			this.vy = 0;
			this.spin = 0;
			this.topSpin = 0;
			this.slide = 0;
			clearBallOmega(this);
			this.drawAxisX = 0;
			this.drawAxisY = 0;
			clearCueDrawVisualState(this);
		}
		updatePocketFall(balls) {
			if (!this.pocketFall) return false;
			const { pocketX, pocketY, startX, startY, startTime, duration, entryAngle, entrySpeed } = this.pocketFall;
			const t = Math.min((performance.now() - startTime) / duration, 1);
			const speedFactor = clamp(entrySpeed / 10, .35, 2.6);
			const rollPhase = clamp(.4 - (speedFactor - 1) * .14, .22, .4);
			const dropStart = clamp(.3 - (speedFactor - 1) * .12, .14, .3);
			const rollT = Math.min(t / rollPhase, 1);
			const rollEase = rollT * rollT * (3 - 2 * rollT);
			const dropT = t < dropStart ? 0 : Math.min((t - dropStart) / (1 - dropStart), 1);
			const dropEase = dropT * dropT * dropT;
			const perpX = -Math.sin(entryAngle);
			const perpY = Math.cos(entryAngle);
			const wobbleAmp = 1.6 + entrySpeed * .09;
			const wobble = Math.sin(t * Math.PI * (3.2 + speedFactor * .4)) * (1 - t) * wobbleAmp;
			const baseX = startX + (pocketX - startX) * rollEase;
			const baseY = startY + (pocketY - startY) * rollEase;
			const sinkPull = dropEase * (3.2 + entrySpeed * .18);
			this.x = baseX + perpX * wobble + Math.cos(entryAngle) * sinkPull * .25;
			this.y = baseY + perpY * wobble + Math.sin(entryAngle) * sinkPull * .25;
			this.pocketFall.depth = dropEase;
			this.pocketFall.scale = 1 - dropEase * .91;
			this.pocketFall.alpha = 1 - dropEase * .97;
			this.pocketFall.progress = t;
			const rollScale = (.08 + dropEase * .34) * speedFactor;
			this.applyRotationVector(-Math.sin(entryAngle) * rollScale, Math.cos(entryAngle) * rollScale, rollScale * .35);
			if (t < 1) return false;
			const wasCue = this.isCueBall;
			this.pocketFall = null;
			this.inPocket = true;
			if (wasCue) setTimeout(() => this.respotCueBall(balls), 400);
			return true;
		}
		isPocketing() {
			return this.pocketFall !== null;
		}
		applyRotationVector(rx, ry, rz) {
			const delta = quatFromRotation(rx, ry, rz);
			if (delta.w === 1 && delta.x === 0 && delta.y === 0 && delta.z === 0) return;
			this.orientation = quatNormalize(quatMultiply(delta, this.orientation));
		}
		advanceRoll(dt) {
			if (this.inPocket) return;
			this.applyRotationVector((this.omegaX || 0) * dt, (this.omegaY || 0) * dt, (this.omegaZ || 0) * dt);
		}
		isMoving() {
			if (this.inPocket) return false;
			if (this.isPocketing()) return true;
			return Math.hypot(this.vx, this.vy) > SLEEP_SPEED;
		}
		respotCueBall(balls) {
			const spot = getHeadSpot();
			this.x = spot.x;
			this.y = spot.y;
			this.vx = 0;
			this.vy = 0;
			this.inPocket = false;
			this.pocketFall = null;
			this.spin = 0;
			this.topSpin = 0;
			this.slide = 0;
			clearBallOmega(this);
			this.sleepFrames = 0;
			this.orientation = { ...IDENTITY_QUAT };
			this.lastDirX = 1;
			this.lastDirY = 0;
			this.drawAxisX = 0;
			this.drawAxisY = 0;
			clearCueDrawVisualState(this);
			for (const ball of balls) {
				if (ball === this || ball.inPocket) continue;
				const dx = ball.x - this.x;
				const dy = ball.y - this.y;
				const dist = Math.hypot(dx, dy);
				const minDist = this.radius + ball.radius + 2;
				if (dist < minDist && dist > 0) {
					this.x -= dx / dist * (minDist - dist);
					this.y -= dy / dist * (minDist - dist);
				}
			}
		}
	};
}));
//#endregion
//#region public/game_logic.js
function shuffledRackNumbers() {
	const solids = [
		1,
		2,
		3,
		4,
		5,
		6,
		7
	];
	const stripes = [
		9,
		10,
		11,
		12,
		13,
		14,
		15
	];
	const pick = (arr) => arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
	const leftCorner = pick(solids);
	const rightCorner = pick(stripes);
	const corners = Math.random() < .5 ? [rightCorner, leftCorner] : [leftCorner, rightCorner];
	const others = [...solids, ...stripes];
	for (let i = others.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[others[i], others[j]] = [others[j], others[i]];
	}
	const numbers = [...corners, ...others];
	for (let i = numbers.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[numbers[i], numbers[j]] = [numbers[j], numbers[i]];
	}
	return {
		leftCorner: corners[0],
		rightCorner: corners[1],
		pool: numbers.filter((n) => n !== corners[0] && n !== corners[1])
	};
}
function createRack() {
	const foot = getFootSpot();
	const spacing = 11 * 2.02;
	const colSpacing = Math.sqrt(3) * 11 * 1.01;
	const rackBalls = [];
	const randomRack = shuffledRackNumbers();
	let randomIdx = 0;
	RACK_ORDER.forEach((row, rowIdx) => {
		row.forEach((num, colIdx) => {
			const actualNum = rowIdx === 2 && colIdx === 1 ? 8 : rowIdx === 4 && colIdx === 0 ? randomRack.leftCorner : rowIdx === 4 && colIdx === 4 ? randomRack.rightCorner : randomRack.pool[randomIdx++];
			const def = BALL_DEFS[actualNum];
			const x = foot.x + rowIdx * colSpacing + (Math.random() * 2 - 1) * RACK_POSITION_JITTER;
			const y = foot.y + (colIdx - (row.length - 1) / 2) * spacing + (Math.random() * 2 - 1) * RACK_POSITION_JITTER;
			rackBalls.push(new Ball(x, y, {
				number: actualNum,
				color: def.color,
				ballType: def.type,
				mass: randomBallMass()
			}));
		});
	});
	return rackBalls;
}
var init_game_logic = __esmMin((() => {
	init_constants();
	init_utils();
	init_ball();
}));
//#endregion
//#region public/cushions.js
function pocketById() {
	return Object.fromEntries(getLayoutPockets().map((pocket) => [pocket.id, pocket]));
}
function isCornerPocket(id) {
	return CORNER_POCKETS.has(id);
}
function isCentralPocket(id) {
	return CENTRAL_POCKETS.has(id);
}
function pocketEndGap(pocketId) {
	if (isCornerPocket(pocketId)) return CORNER_CUSHION_POCKET_GAP;
	if (isCentralPocket(pocketId)) return CENTRAL_CUSHION_POCKET_GAP;
	return 0;
}
function horizontalSegment(side, pocketA, pocketB, play) {
	const x = pocketA.x + POCKET_LAYOUT_RADIUS + pocketEndGap(pocketA.id);
	const width = pocketB.x - POCKET_LAYOUT_RADIUS - pocketEndGap(pocketB.id) - x;
	const y = side === "top" ? play.top : play.bottom - CUSHION_DEPTH;
	return {
		id: `cushion-${side}-${pocketA.id}-${pocketB.id}`,
		side,
		pocketIds: [pocketA.id, pocketB.id],
		x,
		y,
		width,
		height: CUSHION_DEPTH,
		chamferStart: isCornerPocket(pocketA.id),
		chamferEnd: isCornerPocket(pocketB.id)
	};
}
function verticalSegment(side, pocketA, pocketB, play) {
	const y = pocketA.y + POCKET_LAYOUT_RADIUS + pocketEndGap(pocketA.id);
	const height = pocketB.y - POCKET_LAYOUT_RADIUS - pocketEndGap(pocketB.id) - y;
	const x = side === "left" ? play.left : play.right - CUSHION_DEPTH;
	return {
		id: `cushion-${side}-${pocketA.id}-${pocketB.id}`,
		side,
		pocketIds: [pocketA.id, pocketB.id],
		x,
		y,
		width: CUSHION_DEPTH,
		height,
		chamferStart: isCornerPocket(pocketA.id),
		chamferEnd: isCornerPocket(pocketB.id)
	};
}
/** @returns {Array<{ id: string, side: string, pocketIds: string[], x: number, y: number, width: number, height: number, chamferStart: boolean, chamferEnd: boolean }>} */
function getCushionSegments() {
	const play = getPlayArea();
	const pockets = pocketById();
	const segments = [];
	for (const [pocketAId, pocketBId] of CUSHION_CHAINS.top) segments.push(horizontalSegment("top", pockets[pocketAId], pockets[pocketBId], play));
	for (const [pocketAId, pocketBId] of CUSHION_CHAINS.bottom) segments.push(horizontalSegment("bottom", pockets[pocketAId], pockets[pocketBId], play));
	for (const [pocketAId, pocketBId] of CUSHION_CHAINS.left) segments.push(verticalSegment("left", pockets[pocketAId], pockets[pocketBId], play));
	for (const [pocketAId, pocketBId] of CUSHION_CHAINS.right) segments.push(verticalSegment("right", pockets[pocketAId], pockets[pocketBId], play));
	return segments;
}
function chamferSize(segment) {
	const limit = Math.min(segment.width, segment.height) / 2 - .5;
	return Math.min(CUSHION_CHAMFER, Math.max(0, limit));
}
function innerEdgeLinesForSegment(segment) {
	const { x, y, width, height, side, chamferStart, chamferEnd } = segment;
	const c = chamferSize(segment);
	const w = width;
	const h = height;
	const lines = [];
	if (side === "top") {
		if (chamferStart) lines.push({
			x1: x,
			y1: y + h - c,
			x2: x + c,
			y2: y + h
		});
		lines.push({
			x1: chamferStart ? x + c : x,
			y1: y + h,
			x2: chamferEnd ? x + w - c : x + w,
			y2: y + h
		});
		if (chamferEnd) lines.push({
			x1: x + w - c,
			y1: y + h,
			x2: x + w,
			y2: y + h - c
		});
	} else if (side === "bottom") {
		if (chamferStart) lines.push({
			x1: x,
			y1: y + c,
			x2: x + c,
			y2: y
		});
		lines.push({
			x1: chamferStart ? x + c : x,
			y1: y,
			x2: chamferEnd ? x + w - c : x + w,
			y2: y
		});
		if (chamferEnd) lines.push({
			x1: x + w - c,
			y1: y,
			x2: x + w,
			y2: y + c
		});
	} else if (side === "left") {
		if (chamferStart) lines.push({
			x1: x + w - c,
			y1: y,
			x2: x + w,
			y2: y + c
		});
		lines.push({
			x1: x + w,
			y1: chamferStart ? y + c : y,
			x2: x + w,
			y2: chamferEnd ? y + h - c : y + h
		});
		if (chamferEnd) lines.push({
			x1: x + w,
			y1: y + h - c,
			x2: x + w - c,
			y2: y + h
		});
	} else {
		if (chamferStart) lines.push({
			x1: x + c,
			y1: y,
			x2: x,
			y2: y + c
		});
		lines.push({
			x1: x,
			y1: chamferStart ? y + c : y,
			x2: x,
			y2: chamferEnd ? y + h - c : y + h
		});
		if (chamferEnd) lines.push({
			x1: x,
			y1: y + h - c,
			x2: x + c,
			y2: y + h
		});
	}
	return lines;
}
function pocketRubberChamferAngle(pocketId) {
	if (isCentralPocket(pocketId)) return 70;
	if (isCornerPocket(pocketId)) return 45;
	return null;
}
function rubberEdgeLinesForSegment(segment) {
	const { x, y, width, height, side, chamferStart, chamferEnd, pocketIds } = segment;
	const c = chamferSize(segment);
	const w = width;
	const h = height;
	let line;
	if (side === "top") line = {
		x1: chamferStart ? x + c : x,
		y1: y + h,
		x2: chamferEnd ? x + w - c : x + w,
		y2: y + h
	};
	else if (side === "bottom") line = {
		x1: chamferStart ? x + c : x,
		y1: y,
		x2: chamferEnd ? x + w - c : x + w,
		y2: y
	};
	else if (side === "left") line = {
		x1: x + w,
		y1: chamferStart ? y + c : y,
		x2: x + w,
		y2: chamferEnd ? y + h - c : y + h
	};
	else line = {
		x1: x,
		y1: chamferStart ? y + c : y,
		x2: x,
		y2: chamferEnd ? y + h - c : y + h
	};
	line.chamferStartAngle = pocketRubberChamferAngle(pocketIds[0]);
	line.chamferEndAngle = pocketRubberChamferAngle(pocketIds[1]);
	line.side = side;
	return [line];
}
function getRubberInnerEdges() {
	const lines = [];
	for (const segment of getCushionSegments()) {
		if (segment.width <= 0 || segment.height <= 0) continue;
		lines.push(...rubberEdgeLinesForSegment(segment));
	}
	return lines;
}
function getCushionInnerEdges() {
	const lines = [];
	for (const segment of getCushionSegments()) {
		if (segment.width <= 0 || segment.height <= 0) continue;
		lines.push(...innerEdgeLinesForSegment(segment));
	}
	return lines;
}
var CUSHION_CHAINS, CORNER_POCKETS, CENTRAL_POCKETS;
var init_cushions = __esmMin((() => {
	init_constants();
	init_utils();
	CUSHION_CHAINS = {
		top: [["tl", "tm"], ["tm", "tr"]],
		bottom: [["bl", "bm"], ["bm", "br"]],
		left: [["tl", "bl"]],
		right: [["tr", "br"]]
	};
	CORNER_POCKETS = /* @__PURE__ */ new Set([
		"tl",
		"tr",
		"bl",
		"br"
	]);
	CENTRAL_POCKETS = /* @__PURE__ */ new Set(["tm", "bm"]);
}));
//#endregion
//#region public/cushion_rubber.js
function edgeNormal$1(x1, y1, x2, y2) {
	const len = Math.hypot(x2 - x1, y2 - y1) || 1;
	const edx = x2 - x1;
	const edy = y2 - y1;
	let nx = -edy / len;
	let ny = edx / len;
	const mx = (x1 + x2) / 2;
	const my = (y1 + y2) / 2;
	if ((PLAY_CENTER_X$1 - mx) * nx + (PLAY_CENTER_Y$1 - my) * ny < 0) {
		nx = -nx;
		ny = -ny;
	}
	return {
		nx,
		ny,
		tx: edx / len,
		ty: edy / len
	};
}
function chamferRunAlongEdge(thickness, angleDeg) {
	return thickness / Math.tan(angleDeg * Math.PI / 180);
}
function rubberCollisionLinesFrom(line) {
	const { nx, ny, tx, ty } = edgeNormal$1(line.x1, line.y1, line.x2, line.y2);
	const t = RUBBER_THICKNESS;
	const { x1, y1, x2, y2, chamferStartAngle, chamferEndAngle } = line;
	const ix1 = x1 + nx * t;
	const iy1 = y1 + ny * t;
	const ix2 = x2 + nx * t;
	const iy2 = y2 + ny * t;
	const lines = [];
	let ox1 = ix1;
	let oy1 = iy1;
	let ox2 = ix2;
	let oy2 = iy2;
	const minCurve = .5;
	const maxCurve = t * .85;
	if (chamferEndAngle != null) {
		const runEnd = chamferRunAlongEdge(t, chamferEndAngle);
		ox2 = ix2 - tx * runEnd;
		oy2 = iy2 - ty * runEnd;
		const curve = Math.min(runEnd * .65, maxCurve);
		const chamferDx = ox2 - x2;
		const chamferDy = oy2 - y2;
		const chamferLen = Math.hypot(chamferDx, chamferDy) || 1;
		const chamferUx = chamferDx / chamferLen;
		const chamferUy = chamferDy / chamferLen;
		const curveSafe = Math.min(curve, chamferLen * .45);
		if (curveSafe >= minCurve) {
			const chamferCutX = ox2 - chamferUx * curveSafe;
			const chamferCutY = oy2 - chamferUy * curveSafe;
			const edgeCutX = ox2 - tx * curveSafe;
			const edgeCutY = oy2 - ty * curveSafe;
			lines.push({
				x1: x2,
				y1: y2,
				x2: chamferCutX,
				y2: chamferCutY
			});
			lines.push({
				x1: chamferCutX,
				y1: chamferCutY,
				x2: edgeCutX,
				y2: edgeCutY
			});
			ox2 = edgeCutX;
			oy2 = edgeCutY;
		} else lines.push({
			x1: x2,
			y1: y2,
			x2: ox2,
			y2: oy2
		});
	}
	if (chamferStartAngle != null) {
		const runStart = chamferRunAlongEdge(t, chamferStartAngle);
		ox1 = ix1 + tx * runStart;
		oy1 = iy1 + ty * runStart;
		const curve = Math.min(runStart * .65, maxCurve);
		const chamferDx = x1 - ox1;
		const chamferDy = y1 - oy1;
		const chamferLen = Math.hypot(chamferDx, chamferDy) || 1;
		const chamferUx = chamferDx / chamferLen;
		const chamferUy = chamferDy / chamferLen;
		const curveSafe = Math.min(curve, chamferLen * .45);
		if (curveSafe >= minCurve) {
			const edgeCutX = ox1 + tx * curveSafe;
			const edgeCutY = oy1 + ty * curveSafe;
			const chamferCutX = ox1 + chamferUx * curveSafe;
			const chamferCutY = oy1 + chamferUy * curveSafe;
			lines.push({
				x1: edgeCutX,
				y1: edgeCutY,
				x2: chamferCutX,
				y2: chamferCutY
			});
			lines.push({
				x1: chamferCutX,
				y1: chamferCutY,
				x2: x1,
				y2: y1
			});
			ox1 = edgeCutX;
			oy1 = edgeCutY;
		} else lines.push({
			x1: ox1,
			y1: oy1,
			x2: x1,
			y2: y1
		});
	}
	lines.push({
		x1: ox1,
		y1: oy1,
		x2: ox2,
		y2: oy2
	});
	return lines;
}
function getRubberCollisionEdges() {
	const lines = [];
	for (const line of getRubberInnerEdges()) {
		if (Math.hypot(line.x2 - line.x1, line.y2 - line.y1) < .5) continue;
		lines.push(...rubberCollisionLinesFrom(line));
	}
	return lines;
}
var PLAY_CENTER_X$1, PLAY_CENTER_Y$1;
var init_cushion_rubber = __esmMin((() => {
	init_constants();
	init_cushions();
	PLAY_CENTER_X$1 = CANVAS_WIDTH / 2;
	PLAY_CENTER_Y$1 = 520 / 2;
}));
//#endregion
//#region public/collision_noise.js
function clamp$3(value, min, max) {
	return Math.max(min, Math.min(max, value));
}
function jitterScale(impactSpeed) {
	const { minImpactSpeed, minSpeedFactor, slowSpeedScale } = COLLISION_NORMAL_JITTER;
	if (impactSpeed <= minImpactSpeed) return 0;
	return clamp$3(impactSpeed / 8, minSpeedFactor, 1) * (impactSpeed < LOW_SPEED_THRESHOLD ? slowSpeedScale : 1);
}
/** Слегка поворачивает нормаль столкновения в пределах maxDeg * speedScale */
function jitterCollisionNormal(nx, ny, kind, impactSpeed, enabled = COLLISION_NORMAL_JITTER.enabled) {
	if (!enabled) return {
		nx,
		ny
	};
	if (!COLLISION_NORMAL_JITTER.enabled) return {
		nx,
		ny
	};
	const scale = jitterScale(impactSpeed);
	if (scale <= 0) return {
		nx,
		ny
	};
	const maxDeg = kind === "cushion" ? COLLISION_NORMAL_JITTER.cushionMaxDeg : COLLISION_NORMAL_JITTER.ballMaxDeg;
	const angle = (Math.random() * 2 - 1) * maxDeg * (Math.PI / 180) * scale;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		nx: nx * cos - ny * sin,
		ny: nx * sin + ny * cos
	};
}
var init_collision_noise = __esmMin((() => {
	init_constants();
}));
//#endregion
//#region public/cushion_collision.js
function edgeNormal(line) {
	const mx = (line.x1 + line.x2) / 2;
	const my = (line.y1 + line.y2) / 2;
	const edx = line.x2 - line.x1;
	let nx = -(line.y2 - line.y1);
	let ny = edx;
	const len = Math.hypot(nx, ny) || 1;
	nx /= len;
	ny /= len;
	if ((PLAY_CENTER_X - mx) * nx + (PLAY_CENTER_Y - my) * ny < 0) {
		nx = -nx;
		ny = -ny;
	}
	return {
		nx,
		ny
	};
}
function buildCollisionEdges() {
	const withNormals = (line) => {
		const { nx, ny } = edgeNormal(line);
		return {
			...line,
			nx,
			ny
		};
	};
	return [...getRubberCollisionEdges().map(withNormals), ...getCushionInnerEdges().map(withNormals)];
}
function getCollisionEdges() {
	if (!cachedCollisionEdges) cachedCollisionEdges = buildCollisionEdges();
	return cachedCollisionEdges;
}
function invalidateCushionCollisionCache() {
	cachedCollisionEdges = null;
}
function circleSegmentCollision(bx, by, radius, line) {
	const dx = line.x2 - line.x1;
	const dy = line.y2 - line.y1;
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) return null;
	let t = ((bx - line.x1) * dx + (by - line.y1) * dy) / lenSq;
	t = Math.max(0, Math.min(1, t));
	const closestX = line.x1 + t * dx;
	const closestY = line.y1 + t * dy;
	const distX = bx - closestX;
	const distY = by - closestY;
	const distSq = distX * distX + distY * distY;
	if (distSq >= radius * radius) return null;
	const dist = Math.sqrt(distSq) || 1e-4;
	let nx = distX / dist;
	let ny = distY / dist;
	if (nx * line.nx + ny * line.ny < 0) {
		nx = line.nx;
		ny = line.ny;
	}
	return {
		nx,
		ny,
		overlap: radius - dist
	};
}
function clamp$2(value, min, max) {
	return Math.max(min, Math.min(max, value));
}
function applyCushionSpin(ball, nx, ny, preImpactSpeed, preVx, preVy, vx, vy) {
	if (!ball) return {
		vx,
		vy
	};
	const tx = -ny;
	const ty = nx;
	let spin = ball.spin || 0;
	const topSpin = ball.topSpin || 0;
	const speedEff = sideSpinTrajectoryEffectiveness(preImpactSpeed);
	const contactEff = Math.max(.3, Math.sqrt(speedEff));
	const acquired = clamp$2((preVx * tx + preVy * ty + spin * BALL_SPIN_CONTACT * contactEff) * CUSHION_SPIN_ACQUIRE * contactEff, -preImpactSpeed * .22 * contactEff, preImpactSpeed * .22 * contactEff);
	spin += acquired;
	if (Math.abs(spin) > 1e-6) {
		const approachX = preVx / (preImpactSpeed || 1);
		const approachY = preVy / (preImpactSpeed || 1);
		const incidence = Math.abs(approachX * nx + approachY * ny);
		const throwScale = .55 + .45 * (1 - incidence);
		const throwCap = preImpactSpeed * (.085 + incidence * .028) * speedEff;
		const throwV = clamp$2(spin * CUSHION_THROW * preImpactSpeed * throwScale * speedEff, -throwCap, throwCap);
		vx += throwV * tx;
		vy += throwV * ty;
		ball.spin = spin * CUSHION_SPIN_RETAIN;
	} else ball.spin = 0;
	if (Math.abs(topSpin) > .12) {
		const topEff = topSpin < 0 ? drawSpeedEffectiveness(preImpactSpeed) : spinSpeedEffectiveness(preImpactSpeed);
		const inSpeed = Math.hypot(vx, vy) || 1;
		const inDirX = vx / inSpeed;
		const inDirY = vy / inSpeed;
		if (topSpin > 0) {
			const followKick = clamp$2(topSpin * .016 * topEff, 0, preImpactSpeed * .023 * topEff);
			vx += followKick * inDirX;
			vy += followKick * inDirY;
			ball.topSpin = topSpin * .68;
		} else {
			const drawKick = clamp$2(topSpin * CUSHION_DRAW_KICK * topEff, -preImpactSpeed * .04 * topEff, 0);
			vx += drawKick * inDirX;
			vy += drawKick * inDirY;
			ball.topSpin = topSpin * .72;
		}
	}
	ball.slide = Math.max(ball.slide || 0, CUSHION_SLIDE);
	return {
		vx,
		vy
	};
}
function resolveAtPosition(bx, by, vx, vy, r, edges, ball, allowBounce, applyJitter = true) {
	let bounced = false;
	for (let iter = 0; iter < 5; iter++) {
		let best = null;
		for (const edge of edges) {
			const collision = circleSegmentCollision(bx, by, r, edge);
			if (!collision) continue;
			if (!best || collision.overlap > best.collision.overlap) best = {
				edge,
				collision
			};
		}
		if (!best) break;
		const { collision } = best;
		bx += collision.nx * collision.overlap;
		by += collision.ny * collision.overlap;
		let nx = collision.nx;
		let ny = collision.ny;
		const dot = vx * nx + vy * ny;
		if (allowBounce && !bounced && dot < 0) {
			const preImpactSpeed = Math.hypot(vx, vy);
			const preVx = vx;
			const preVy = vy;
			const impactSpeed = -dot;
			({nx, ny} = jitterCollisionNormal(nx, ny, "cushion", impactSpeed, applyJitter));
			const restitution = impactSpeed < LOW_SPEED_THRESHOLD ? CUSHION_RESTITUTION_SLOW : CUSHION_RESTITUTION;
			const dotJ = vx * nx + vy * ny;
			vx -= (1 + restitution) * dotJ * nx;
			vy -= (1 + restitution) * dotJ * ny;
			const tx = -ny;
			const ty = nx;
			const vTan = vx * tx + vy * ty;
			vx -= vTan * CUSHION_FRICTION * tx;
			vy -= vTan * CUSHION_FRICTION * ty;
			({vx, vy} = applyCushionSpin(ball, nx, ny, preImpactSpeed, preVx, preVy, vx, vy));
			bounced = true;
		} else if (dot < 0) {
			vx -= dot * nx;
			vy -= dot * ny;
		}
	}
	return {
		bx,
		by,
		vx,
		vy
	};
}
function resolveBallCushionCollision(ball, prevX, prevY, options = {}) {
	if (ball.inPocket) return;
	const applyJitter = options.applyJitter !== false;
	const edges = getCollisionEdges();
	const r = ball.radius;
	const endX = ball.x;
	const endY = ball.y;
	let bx = endX;
	let by = endY;
	let vx = ball.vx;
	let vy = ball.vy;
	const travel = Math.hypot(endX - prevX, endY - prevY);
	const samples = Math.max(1, Math.ceil(travel / (r * .3)));
	for (let i = 0; i <= samples; i++) {
		const t = i / samples;
		const result = resolveAtPosition(prevX + (endX - prevX) * t, prevY + (endY - prevY) * t, vx, vy, r, edges, ball, i === samples, applyJitter);
		bx = result.bx;
		by = result.by;
		vx = result.vx;
		vy = result.vy;
	}
	ball.x = bx;
	ball.y = by;
	ball.vx = vx;
	ball.vy = vy;
	updateBallOmega(ball);
}
function raySegmentHit(ox, oy, dx, dy, radius, line) {
	const px1 = line.x1 + line.nx * radius;
	const py1 = line.y1 + line.ny * radius;
	const px2 = line.x2 + line.nx * radius;
	const py2 = line.y2 + line.ny * radius;
	const segDx = px2 - px1;
	const segDy = py2 - py1;
	const denom = dx * segDy - dy * segDx;
	if (Math.abs(denom) < 1e-9) return null;
	const t = ((px1 - ox) * segDy - (py1 - oy) * segDx) / denom;
	const u = ((px1 - ox) * dy - (py1 - oy) * dx) / denom;
	if (t > .001 && u >= 0 && u <= 1) return {
		t,
		nx: line.nx,
		ny: line.ny
	};
	return null;
}
function rayCushionHit(ox, oy, dx, dy, radius) {
	let best = null;
	for (const edge of getCollisionEdges()) {
		const hit = raySegmentHit(ox, oy, dx, dy, radius, edge);
		if (hit && (!best || hit.t < best.t)) best = hit;
	}
	return best;
}
var PLAY_CENTER_X, PLAY_CENTER_Y, cachedCollisionEdges;
var init_cushion_collision = __esmMin((() => {
	init_constants();
	init_cushions();
	init_cushion_rubber();
	init_collision_noise();
	init_ball();
	PLAY_CENTER_X = CANVAS_WIDTH / 2;
	PLAY_CENTER_Y = 520 / 2;
	cachedCollisionEdges = null;
}));
//#endregion
//#region public/physics_engine.js
function clamp$1(value, min, max) {
	return Math.max(min, Math.min(max, value));
}
function settleLinearMotion(ball) {
	ball.vx = 0;
	ball.vy = 0;
}
function stopBall(ball) {
	settleLinearMotion(ball);
	ball.spin = 0;
	ball.topSpin = 0;
	ball.slide = 0;
	ball.drawAxisX = 0;
	ball.drawAxisY = 0;
	clearCueDrawVisualState(ball);
	clearBallOmega(ball);
}
function setDrawAxis(ball, axisX, axisY) {
	const len = Math.hypot(axisX, axisY);
	if (len <= 1e-6) return;
	ball.drawAxisX = axisX / len;
	ball.drawAxisY = axisY / len;
}
function clearDrawAxis(ball) {
	ball.drawAxisX = 0;
	ball.drawAxisY = 0;
}
function getDrawAxis(ball, dirX, dirY) {
	const ax = ball.drawAxisX || 0;
	const ay = ball.drawAxisY || 0;
	const len = Math.hypot(ax, ay);
	if (len > .5) return {
		x: ax / len,
		y: ay / len
	};
	return {
		x: dirX,
		y: dirY
	};
}
function getSpinRollDamp(ball) {
	return ball.isCueBall ? SPIN_ROLL_DAMP : OBJECT_SPIN_ROLL_DAMP;
}
function getSpinSlideDamp(ball) {
	return ball.isCueBall ? SPIN_SLIDE_DAMP : OBJECT_SPIN_SLIDE_DAMP;
}
function zeroNegligibleSpin(ball) {
	if (Math.abs(ball.spin || 0) <= .12) ball.spin = 0;
	if (Math.abs(ball.topSpin || 0) <= .12) ball.topSpin = 0;
}
function decayResidualSpin(ball, dt) {
	const speed = Math.hypot(ball.vx, ball.vy);
	const rollBoost = speed < .014 * 2 ? 5 : speed < LOW_SPEED_THRESHOLD ? 2.5 : 1;
	const slideBoost = speed < .014 * 2 ? 4 : 2;
	if (Math.abs(ball.spin || 0) > .12) ball.spin *= Math.exp(-getSpinRollDamp(ball) * rollBoost * dt);
	if (Math.abs(ball.topSpin || 0) > .12) ball.topSpin *= Math.exp(-getSpinSlideDamp(ball) * slideBoost * dt);
	if ((ball.slide || 0) > .035) {
		ball.slide = Math.max(0, ball.slide - SLIDE_RESOLVE_RATE * dt);
		if (ball.slide <= .035) ball.slide = 0;
	}
	zeroNegligibleSpin(ball);
}
function wakeBall(ball) {
	ball.sleepFrames = 0;
}
function updateSleepState(ball) {
	const speed = Math.hypot(ball.vx, ball.vy);
	const spin = Math.max(Math.abs(ball.spin), Math.abs(ball.topSpin));
	const sliding = (ball.slide || 0) > SLIDE_THRESHOLD;
	if (speed < .014 && spin < .12 && !sliding) {
		ball.sleepFrames = (ball.sleepFrames || 0) + 1;
		if (ball.sleepFrames >= 10) stopBall(ball);
	} else wakeBall(ball);
}
function rollingLoss(speed, dt) {
	const speedRatio = clamp$1(speed / LOW_SPEED_THRESHOLD, 0, 1);
	return (CLOTH_ROLL_DECEL + speed * CLOTH_ROLL_SPEED_SCALE) * dt * (.62 + .38 * speedRatio);
}
function isSliding(ball, speed) {
	if ((ball.slide || 0) > .035) return true;
	if (speed <= .014) return false;
	if (Math.abs(ball.topSpin || 0) > .12 * 3) return true;
	if (Math.abs(ball.spin || 0) > .12 * 2) return true;
	return false;
}
function applySideSpinLateral(ball, speed, tanX, tanY, dt, throwStrength, slideMix) {
	if (Math.abs(ball.spin) <= .12 || speed <= .014 || slideMix <= 0) return;
	const trajEff = sideSpinTrajectoryEffectiveness(speed);
	const lateral = ball.spin * throwStrength * trajEff * slideMix * dt;
	const forwardTravel = speed * dt;
	const cap = Math.min(speed * SIDE_SPIN_LATERAL_CAP * trajEff * Math.max(dt * 50, .5), forwardTravel * trajEff * .075);
	const clamped = clamp$1(lateral, -cap, cap);
	ball.vx += tanX * clamped;
	ball.vy += tanY * clamped;
}
function applySideSpinCurve(ball, speed, tanX, tanY, dt, strength, maxTurn) {
	if (Math.abs(ball.spin) <= .12 || speed <= .014) return speed;
	const slideFactor = clamp$1(ball.slide || 0, 0, 1);
	const slideMix = slideFactor > .035 ? .5 + slideFactor * .5 : Math.abs(ball.spin) > .12 * 2 ? SIDE_SPIN_RESIDUAL_MIX : 0;
	const rollMix = 1 - slideMix;
	if (slideMix <= 0 && rollMix <= 0) return speed;
	applySideSpinLateral(ball, speed, tanX, tanY, dt, SIDE_SPIN_SLIDE_THROW, slideMix);
	applySideSpinLateral(ball, speed, tanX, tanY, dt, SIDE_SPIN_ROLL_THROW, rollMix);
	const slideBoost = 1 + slideFactor * 1.4;
	const trajEff = sideSpinTrajectoryEffectiveness(speed);
	const forwardTravel = speed * dt;
	const curve = clamp$1(ball.spin * strength * speed * trajEff * slideBoost * dt, -speed * maxTurn * dt * trajEff, speed * maxTurn * dt * trajEff);
	const curveCap = forwardTravel * trajEff * .078;
	const clampedCurve = clamp$1(curve, -curveCap, curveCap);
	ball.vx += tanX * clampedCurve;
	ball.vy += tanY * clampedCurve;
	const newSpeed = Math.hypot(ball.vx, ball.vy);
	if (newSpeed > 1e-8) {
		const scale = speed / newSpeed;
		ball.vx *= scale;
		ball.vy *= scale;
	}
	return speed;
}
function integrateSliding(ball, speed, dirX, dirY, tanX, tanY, dt) {
	const slideFactor = clamp$1(ball.slide || 0, 0, 1);
	const drawAxis = getDrawAxis(ball, dirX, dirY);
	const rollingBack = drawAxis.x * ball.vx + drawAxis.y * ball.vy < -SLEEP_SPEED;
	const hasDrawAxis = Math.hypot(ball.drawAxisX || 0, ball.drawAxisY || 0) > .5;
	const inDrawRollback = rollingBack || hasDrawAxis;
	if (hasDrawAxis && speed <= .014 * 4) {
		settleLinearMotion(ball);
		ball.topSpin = 0;
		ball.slide = 0;
		clearDrawAxis(ball);
		return;
	}
	let loss = rollingLoss(speed, dt) + CLOTH_SLIDE_DECEL * slideFactor * dt;
	const topSpin = ball.topSpin || 0;
	const speedEff = spinSpeedEffectiveness(speed);
	const drawEff = drawSpeedEffectiveness(speed);
	if (topSpin < -.12 && !rollingBack) loss += CLOTH_SLIDE_DECEL * clamp$1(-topSpin / LOW_SPEED_THRESHOLD, 0, .48) * dt * drawEff;
	else if (topSpin > .12) loss *= Math.max(.35, 1 - topSpin * speedEff / (LOW_SPEED_THRESHOLD * 2.2));
	let nextSpeed = Math.max(0, speed - loss);
	ball.vx = dirX * nextSpeed;
	ball.vy = dirY * nextSpeed;
	nextSpeed = applySideSpinCurve(ball, nextSpeed, tanX, tanY, dt, SPIN_CURVE_WHILE_SLIDING, SIDE_SPIN_CURVE_MAX_SLIDING);
	if (nextSpeed > 0) {
		const len = Math.hypot(ball.vx, ball.vy) || 1;
		ball.vx = ball.vx / len * nextSpeed;
		ball.vy = ball.vy / len * nextSpeed;
	} else {
		settleLinearMotion(ball);
		nextSpeed = 0;
	}
	if (Math.abs(topSpin) > .12) {
		const rollEff = topSpin < 0 ? drawSpeedEffectiveness(nextSpeed) : spinSpeedEffectiveness(nextSpeed);
		const speedFactor = 1 / (1 + nextSpeed / (LOW_SPEED_THRESHOLD * 2.4));
		const gripBoost = 1 + clamp$1(1 - nextSpeed / LOW_SPEED_THRESHOLD, 0, .75);
		const resolve = (rollingBack ? SLIP_RESOLVE_RATE * .42 : SLIP_RESOLVE_RATE) * dt * (1 + slideFactor * .75) * speedFactor * gripBoost * rollEff;
		const delta = Math.min(Math.abs(topSpin), resolve) * Math.sign(topSpin);
		ball.topSpin = topSpin - delta;
		if (topSpin < 0) {
			if (!rollingBack) {
				nextSpeed = Math.max(0, nextSpeed - Math.abs(delta) * DRAW_FORWARD_BRAKE * rollEff);
				if (nextSpeed > .014) {
					const len = Math.hypot(ball.vx, ball.vy) || 1;
					ball.vx = ball.vx / len * nextSpeed;
					ball.vy = ball.vy / len * nextSpeed;
				}
			}
			const reverseThreshold = LOW_SPEED_THRESHOLD * DRAW_REVERSE_SPEED_THRESHOLD;
			const spinLeft = Math.abs(ball.topSpin);
			const updatedForwardSpeed = drawAxis.x * ball.vx + drawAxis.y * ball.vy;
			if (!rollingBack && !hasDrawAxis && spinLeft > .12 && nextSpeed < reverseThreshold * (.72 + rollEff * .28) && updatedForwardSpeed >= -.014) {
				const backSpeed = Math.min((spinLeft * DRAW_REVERSE_FACTOR + (reverseThreshold - nextSpeed) * .22) * rollEff, LOW_SPEED_THRESHOLD * DRAW_MAX_REVERSE_SPEED_SCALE * rollEff);
				setDrawAxis(ball, drawAxis.x, drawAxis.y);
				ball.vx = -drawAxis.x * backSpeed;
				ball.vy = -drawAxis.y * backSpeed;
				ball.slide = Math.max(ball.slide || 0, .48);
				ball.topSpin *= .62;
				return;
			}
		} else if (topSpin > 0) {
			nextSpeed = Math.max(0, nextSpeed + delta * .08 * rollEff);
			const len = Math.hypot(ball.vx, ball.vy) || 1;
			ball.vx = ball.vx / len * nextSpeed;
			ball.vy = ball.vy / len * nextSpeed;
		}
	}
	ball.slide = Math.max(0, slideFactor - SLIDE_RESOLVE_RATE * dt);
	ball.spin *= Math.exp(-getSpinSlideDamp(ball) * dt);
	if (inDrawRollback && speed > .014 * 2) ball.slide = Math.max(ball.slide || 0, SLIDE_THRESHOLD + .02);
	if (ball.slide <= .035 && Math.abs(ball.topSpin) <= .12 * 3) {
		ball.slide = 0;
		if (!inDrawRollback) ball.topSpin = 0;
	}
}
function integrateRolling(ball, speed, dirX, dirY, dt) {
	const loss = rollingLoss(speed, dt);
	let nextSpeed = Math.max(0, speed - loss);
	if (nextSpeed <= 0) {
		settleLinearMotion(ball);
		decayResidualSpin(ball, dt);
		return;
	}
	const tanX = -dirY;
	const tanY = dirX;
	ball.vx = dirX * nextSpeed;
	ball.vy = dirY * nextSpeed;
	nextSpeed = applySideSpinCurve(ball, nextSpeed, tanX, tanY, dt, SPIN_CURVE_WHILE_ROLLING, SIDE_SPIN_CURVE_MAX_ROLLING);
	if (nextSpeed > .014) {
		const len = Math.hypot(ball.vx, ball.vy) || 1;
		ball.vx = ball.vx / len * nextSpeed;
		ball.vy = ball.vy / len * nextSpeed;
		ball.spin *= Math.exp(-getSpinRollDamp(ball) * dt);
		if ((ball.slide || 0) <= .035 && speed < .014 * 4) ball.spin *= Math.exp(-getSpinRollDamp(ball) * dt);
		ball.topSpin = 0;
		ball.slide = 0;
		zeroNegligibleSpin(ball);
	} else {
		settleLinearMotion(ball);
		decayResidualSpin(ball, dt);
	}
}
function applyMotionForces(ball, dt) {
	if (ball.inPocket || ball.isPocketing()) return;
	let speed = Math.hypot(ball.vx, ball.vy);
	if (speed <= 0) {
		decayResidualSpin(ball, dt);
		updateBallOmega(ball);
		updateSleepState(ball);
		return;
	}
	ball.lastDirX = ball.vx / speed;
	ball.lastDirY = ball.vy / speed;
	const dirX = ball.lastDirX;
	const dirY = ball.lastDirY;
	const tanX = -dirY;
	const tanY = dirX;
	if (isSliding(ball, speed)) integrateSliding(ball, speed, dirX, dirY, tanX, tanY, dt);
	else integrateRolling(ball, speed, dirX, dirY, dt);
	zeroNegligibleSpin(ball);
	updateBallOmega(ball);
	updateSleepState(ball);
}
function collisionNormal(b1, b2) {
	let dx = b2.x - b1.x;
	let dy = b2.y - b1.y;
	const dist = Math.hypot(dx, dy);
	if (dist > 0) return {
		nx: dx / dist,
		ny: dy / dist,
		dist
	};
	dx = b2.px - b1.px;
	dy = b2.py - b1.py;
	const prevDist = Math.hypot(dx, dy);
	if (prevDist > 0) return {
		nx: dx / prevDist,
		ny: dy / prevDist,
		dist: 0
	};
	return {
		nx: 1,
		ny: 0,
		dist: 0
	};
}
function separateBalls(b1, b2, nx, ny, dist) {
	const overlap = b1.radius + b2.radius - dist;
	if (overlap <= 0) return false;
	const totalMass = b1.mass + b2.mass;
	const share1 = b2.mass / totalMass;
	const share2 = b1.mass / totalMass;
	b1.x -= nx * overlap * share1;
	b1.y -= ny * overlap * share1;
	b2.x += nx * overlap * share2;
	b2.y += ny * overlap * share2;
	return true;
}
function setAlongVelocity(ball, dirX, dirY, alongSpeed) {
	const tx = -dirY;
	const ty = dirX;
	const tang = ball.vx * tx + ball.vy * ty;
	ball.vx = dirX * alongSpeed + tx * tang;
	ball.vy = dirY * alongSpeed + ty * tang;
}
function applyTopSpinCollision(striker, other, strikerPreVx, strikerPreVy, nx, ny, impactSpeed) {
	const topSpin = striker.topSpin || 0;
	const preSpeed = Math.hypot(strikerPreVx, strikerPreVy);
	let shotX = nx;
	let shotY = ny;
	if (strikerPreVx * nx + strikerPreVy * ny < 0) {
		shotX = -nx;
		shotY = -ny;
	}
	if (preSpeed > .014) {
		shotX = strikerPreVx / preSpeed;
		shotY = strikerPreVy / preSpeed;
	}
	const headOn = Math.abs(shotX * nx + shotY * ny);
	spinSpeedEffectiveness(impactSpeed);
	const drawEff = drawSpeedEffectiveness(impactSpeed);
	if (topSpin < -.12) {
		const drawSpin = -topSpin;
		const drawMag = clamp$1(drawSpin * DRAW_COLLISION_KICK * headOn * drawEff, 0, impactSpeed * DRAW_COLLISION_MAX * drawEff);
		if (drawMag <= .12) return;
		const transferred = topSpin * DRAW_SPIN_TRANSFER * Math.max(.35, headOn) * drawEff;
		other.topSpin = (other.topSpin || 0) + transferred;
		striker.topSpin = topSpin - transferred;
		const drawBackSpeed = clamp$1(drawSpin * .45 * drawEff + impactSpeed * .14, impactSpeed * .28, impactSpeed * .52 * drawEff);
		setDrawAxis(striker, shotX, shotY);
		setAlongVelocity(striker, shotX, shotY, -drawBackSpeed);
		const objBrake = drawMag * OBJECT_DRAW_BRAKE_RATIO;
		other.vx -= objBrake * shotX;
		other.vy -= objBrake * shotY;
		const slideBoost = clamp$1(.38 + drawMag / Math.max(impactSpeed, .1) * .48, .38, .82);
		other.slide = Math.max(other.slide || 0, slideBoost);
		striker.slide = Math.max(striker.slide || 0, slideBoost * .85);
		striker.topSpin = Math.min(striker.topSpin, topSpin * .72);
		striker.cueDrawApproach = false;
		striker.cueDrawPostHit = true;
		return;
	}
	if (topSpin > .12) {
		const followEff = drawSpeedEffectiveness(impactSpeed);
		const along = striker.vx * shotX + striker.vy * shotY;
		const followMag = clamp$1(topSpin * FOLLOW_COLLISION_KICK * headOn * followEff, 0, impactSpeed * .14 * followEff);
		const followMin = clamp$1(topSpin * .38 * followEff + impactSpeed * .22, impactSpeed * .32, impactSpeed * .52 * followEff);
		setAlongVelocity(striker, shotX, shotY, Math.max(along, followMin));
		other.vx += followMag * shotX;
		other.vy += followMag * shotY;
		striker.topSpin = topSpin * .42;
		striker.slide = Math.max(striker.slide || 0, .36);
	}
}
function collisionHeadOn(striker, strikerPreVx, strikerPreVy, nx, ny) {
	const preSpeed = Math.hypot(strikerPreVx, strikerPreVy);
	let shotX = nx;
	let shotY = ny;
	if (strikerPreVx * nx + strikerPreVy * ny < 0) {
		shotX = -nx;
		shotY = -ny;
	}
	if (preSpeed > .014) {
		shotX = strikerPreVx / preSpeed;
		shotY = strikerPreVy / preSpeed;
	}
	return Math.abs(shotX * nx + shotY * ny);
}
function applyCollisionSpinTransfer(b1, b2, b1PreVx, b1PreVy, b2PreVx, b2PreVy, nx, ny, impactSpeed, trajEff) {
	const spin1 = Math.abs(b1.spin || 0);
	const spin2 = Math.abs(b2.spin || 0);
	if (spin1 <= .12 && spin2 <= .12) return;
	let donor;
	let receiver;
	let donorPreVx;
	let donorPreVy;
	if (spin1 >= spin2 && spin1 > .12) {
		donor = b1;
		receiver = b2;
		donorPreVx = b1PreVx;
		donorPreVy = b1PreVy;
	} else {
		donor = b2;
		receiver = b1;
		donorPreVx = b2PreVx;
		donorPreVy = b2PreVy;
	}
	const donorSpin = donor.spin || 0;
	const headOn = collisionHeadOn(donor, donorPreVx, donorPreVy, nx, ny);
	const transfer = clamp$1(donorSpin * (donor.isCueBall ? 1 : OBJECT_SPIN_COLLISION_TRANSFER) * trajEff * Math.max(.42, headOn), -impactSpeed * .9 * trajEff, impactSpeed * .9 * trajEff);
	if (Math.abs(transfer) <= .12 * .5) return;
	receiver.spin = (receiver.spin || 0) + transfer;
	donor.spin = donorSpin - transfer * .78;
	receiver.slide = Math.max(receiver.slide || 0, COLLISION_SLIDE_MIN * .5);
}
function resolveCollision(b1, b2) {
	const { nx: baseNx, ny: baseNy, dist } = collisionNormal(b1, b2);
	if (!separateBalls(b1, b2, baseNx, baseNy, dist)) return;
	const b1PreVx = b1.vx;
	const b1PreVy = b1.vy;
	const b2PreVx = b2.vx;
	const b2PreVy = b2.vy;
	const v1nPre = b1PreVx * baseNx + b1PreVy * baseNy;
	const v2nPre = b2PreVx * baseNx + b2PreVy * baseNy;
	const rvx = b2.vx - b1.vx;
	const rvy = b2.vy - b1.vy;
	const velN = rvx * baseNx + rvy * baseNy;
	if (velN >= 0) return;
	const impactSpeed = -velN;
	let nx = baseNx;
	let ny = baseNy;
	({nx, ny} = jitterCollisionNormal(nx, ny, "ball", impactSpeed));
	const velNJ = rvx * nx + rvy * ny;
	if (velNJ >= 0) return;
	const restitution = impactSpeed < LOW_SPEED_THRESHOLD ? BALL_RESTITUTION_SLOW : BALL_RESTITUTION;
	const invMassSum = 1 / b1.mass + 1 / b2.mass;
	const impulse = -(1 + restitution) * velNJ / invMassSum;
	b1.vx -= impulse * nx / b1.mass;
	b1.vy -= impulse * ny / b1.mass;
	b2.vx += impulse * nx / b2.mass;
	b2.vy += impulse * ny / b2.mass;
	const tx = -ny;
	const ty = nx;
	const v1t = b1.vx * tx + b1.vy * ty;
	const v2t = b2.vx * tx + b2.vy * ty;
	const trajEff = sideSpinTrajectoryEffectiveness(impactSpeed);
	const contactEff = Math.max(.3, Math.sqrt(trajEff));
	const surf1 = v1t + (b1.spin || 0) * BALL_SPIN_CONTACT * contactEff;
	const relSurf = v2t + (b2.spin || 0) * BALL_SPIN_CONTACT * contactEff - surf1;
	const jtMax = BALL_FRICTION * Math.abs(impulse);
	const jt = clamp$1(-relSurf / (invMassSum * 1.55), -jtMax, jtMax);
	b1.vx -= jt * tx / b1.mass;
	b1.vy -= jt * ty / b1.mass;
	b2.vx += jt * tx / b2.mass;
	b2.vy += jt * ty / b2.mass;
	const spinFromJt = jt * BALL_SPIN_CONTACT * contactEff * BALL_SPIN_COLLISION_GAIN;
	b1.spin = (b1.spin || 0) + spinFromJt;
	b2.spin = (b2.spin || 0) - spinFromJt;
	const spinThrow = clamp$1((b1.spin - b2.spin) * BALL_SPIN_THROW * trajEff, -impactSpeed * .07 * trajEff, impactSpeed * .07 * trajEff);
	if (Math.abs(spinThrow) > 1e-6) {
		b1.vx += spinThrow * tx / b1.mass;
		b1.vy += spinThrow * ty / b1.mass;
		b2.vx -= spinThrow * tx / b2.mass;
		b2.vy -= spinThrow * ty / b2.mass;
	}
	let striker;
	let other;
	if (b1.isCueBall && !b2.isCueBall) {
		striker = b1;
		other = b2;
	} else if (b2.isCueBall && !b1.isCueBall) {
		striker = b2;
		other = b1;
	} else {
		striker = v1nPre > v2nPre ? b1 : b2;
		other = striker === b1 ? b2 : b1;
	}
	applyTopSpinCollision(striker, other, striker === b1 ? b1PreVx : b2PreVx, striker === b1 ? b1PreVy : b2PreVy, nx, ny, impactSpeed);
	applyCollisionSpinTransfer(b1, b2, b1PreVx, b1PreVy, b2PreVx, b2PreVy, nx, ny, impactSpeed, trajEff);
	if (striker.isCueBall && Math.abs(striker.spin || 0) > .12) {
		const spinKick = clamp$1(striker.spin * SIDE_SPIN_COLLISION_THROW * trajEff, -impactSpeed * .32 * trajEff, impactSpeed * .32 * trajEff);
		striker.vx += spinKick * tx;
		striker.vy += spinKick * ty;
		const postSpeed = Math.hypot(striker.vx, striker.vy);
		const minSpeed = impactSpeed * .15 * trajEff;
		if (postSpeed > .014 && postSpeed < minSpeed) {
			const scale = minSpeed / postSpeed;
			striker.vx *= scale;
			striker.vy *= scale;
		}
	}
	const slideBoost = clamp$1(COLLISION_SLIDE_MIN + impactSpeed * .018, COLLISION_SLIDE_MIN, .55);
	b1.slide = Math.max(b1.slide || 0, slideBoost);
	b2.slide = Math.max(b2.slide || 0, slideBoost);
	const cue = b1.isCueBall ? b1 : b2.isCueBall ? b2 : null;
	if (cue) {
		if (!(cue === b1 ? b2 : b1).isCueBall) {
			if (cue.cueDrawApproach || (cue.topSpin || 0) < -.12) cue.cueDrawPostHit = true;
			cue.cueDrawApproach = false;
		}
	}
	wakeBall(b1);
	wakeBall(b2);
	updateBallOmega(b1);
	updateBallOmega(b2);
}
function resolveAllBallCollisions(balls) {
	for (let pass = 0; pass < 4; pass++) for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
		const a = balls[i];
		const b = balls[j];
		if (a.inPocket || b.inPocket || a.isPocketing() || b.isPocketing()) continue;
		resolveCollision(a, b);
	}
}
function updatePocketAnimations(balls) {
	for (const ball of balls) ball.updatePocketFall(balls);
}
function stepPhysics(balls, frameScale = 1) {
	const subDt = frameScale / 10;
	for (let step = 0; step < 10; step++) {
		for (const ball of balls) {
			if (ball.inPocket || ball.isPocketing()) continue;
			ball.px = ball.x;
			ball.py = ball.y;
			ball.x += ball.vx * subDt;
			ball.y += ball.vy * subDt;
		}
		resolveAllBallCollisions(balls);
		for (const ball of balls) if (!ball.inPocket && !ball.isPocketing()) resolveBallCushionCollision(ball, ball.px, ball.py);
		resolveAllBallCollisions(balls);
		for (const ball of balls) {
			if (ball.inPocket || ball.isPocketing()) continue;
			applyMotionForces(ball, subDt);
			tryPocketBall(ball, subDt * 10);
			ball.advanceRoll(subDt);
		}
	}
}
var init_physics_engine = __esmMin((() => {
	init_constants();
	init_cushion_collision();
	init_collision_noise();
	init_utils();
	init_ball();
}));
//#endregion
//#region public/physics.js
function rayCircleHit(ox, oy, dx, dy, cx, cy, hitRadius) {
	const fx = ox - cx;
	const fy = oy - cy;
	const b = 2 * (fx * dx + fy * dy);
	const c = fx * fx + fy * fy - hitRadius * hitRadius;
	const disc = b * b - 4 * c;
	if (disc < 0) return null;
	const sqrtDisc = Math.sqrt(disc);
	const t1 = (-b - sqrtDisc) / 2;
	const t2 = (-b + sqrtDisc) / 2;
	if (t1 > .001) return t1;
	if (t2 > .001) return t2;
	return null;
}
function rayWallHit(ox, oy, dx, dy, radius) {
	const hit = rayCushionHit(ox, oy, dx, dy, radius);
	if (!hit) return null;
	const absNx = Math.abs(hit.nx);
	const absNy = Math.abs(hit.ny);
	let wall;
	if (absNy > absNx) wall = hit.ny > 0 ? "top" : "bottom";
	else wall = hit.nx > 0 ? "left" : "right";
	return {
		t: hit.t,
		wall,
		nx: hit.nx,
		ny: hit.ny
	};
}
function findFirstHit(ox, oy, dx, dy, balls, excludeBalls) {
	const wallHit = rayWallHit(ox, oy, dx, dy, 11);
	let hitT = wallHit ? wallHit.t : null;
	let hitType = wallHit ? "wall" : null;
	let hitWallNx = wallHit ? wallHit.nx : 0;
	let hitWallNy = wallHit ? wallHit.ny : 0;
	let hitBall = null;
	for (const ball of balls) {
		if (excludeBalls.has(ball) || ball.inPocket) continue;
		const t = rayCircleHit(ox, oy, dx, dy, ball.x, ball.y, 22);
		if (t !== null && (hitT === null || t < hitT)) {
			hitT = t;
			hitType = "ball";
			hitBall = ball;
		}
	}
	if (hitT === null) {
		hitT = Math.max(CANVAS_WIDTH, 520);
		hitType = "none";
	}
	return {
		t: hitT,
		type: hitType,
		hitBall,
		hitWallNx,
		hitWallNy
	};
}
function wallBounceDir(dx, dy, nx, ny) {
	const dot = dx * nx + dy * ny;
	let bounceDx = dx - (1 + CUSHION_BOUNCE) * dot * nx;
	let bounceDy = dy - (1 + CUSHION_BOUNCE) * dot * ny;
	const tx = -ny;
	const ty = nx;
	const vTan = bounceDx * tx + bounceDy * ty;
	bounceDx -= vTan * CUSHION_TANGENTIAL_DAMPING * tx;
	bounceDy -= vTan * CUSHION_TANGENTIAL_DAMPING * ty;
	const len = Math.hypot(bounceDx, bounceDy);
	if (len <= .08) return null;
	return {
		dx: bounceDx / len,
		dy: bounceDy / len
	};
}
function ballBounceDirs(dx, dy, contactX, contactY, hitBall) {
	const nx = hitBall.x - contactX;
	const ny = hitBall.y - contactY;
	const len = Math.hypot(nx, ny) || 1;
	const nxu = nx / len;
	const nyu = ny / len;
	const dot = dx * nxu + dy * nyu;
	let cueDx = dx - (1 + BALL_BOUNCE) * .5 * dot * nxu;
	let cueDy = dy - (1 + BALL_BOUNCE) * .5 * dot * nyu;
	const tx = -nyu;
	const ty = nxu;
	const vTan = cueDx * tx + cueDy * ty;
	cueDx -= vTan * BALL_SURFACE_FRICTION * tx;
	cueDy -= vTan * BALL_SURFACE_FRICTION * ty;
	let targetDx = (1 + BALL_BOUNCE) * .5 * dot * nxu;
	let targetDy = (1 + BALL_BOUNCE) * .5 * dot * nyu;
	let cueDir = null;
	const cueLen = Math.hypot(cueDx, cueDy);
	if (cueLen > .08) cueDir = {
		dx: cueDx / cueLen,
		dy: cueDy / cueLen
	};
	let targetDir = null;
	const targetLen = Math.hypot(targetDx, targetDy);
	if (targetLen > .08) targetDir = {
		dx: targetDx / targetLen,
		dy: targetDy / targetLen
	};
	return {
		cueDir,
		targetDir
	};
}
function traceBallPath(ox, oy, dirX, dirY, balls, excludeBalls, maxSegments) {
	const segments = [];
	const contacts = [];
	let x = ox;
	let y = oy;
	let dx = dirX;
	let dy = dirY;
	const excluded = new Set(excludeBalls);
	let firstBallHit = null;
	for (let step = 0; step < maxSegments; step++) {
		const hit = findFirstHit(x, y, dx, dy, balls, excluded);
		const cx = x + dx * hit.t;
		const cy = y + dy * hit.t;
		segments.push({
			x1: x,
			y1: y,
			x2: cx,
			y2: cy
		});
		if (hit.type === "none") break;
		contacts.push({
			x: cx,
			y: cy,
			type: hit.type
		});
		if (hit.type === "wall") {
			const bounce = wallBounceDir(dx, dy, hit.hitWallNx, hit.hitWallNy);
			if (!bounce) break;
			x = cx;
			y = cy;
			dx = bounce.dx;
			dy = bounce.dy;
			continue;
		}
		const bounce = ballBounceDirs(dx, dy, cx, cy, hit.hitBall);
		if (!firstBallHit) firstBallHit = {
			ball: hit.hitBall,
			contactX: cx,
			contactY: cy,
			targetDir: bounce.targetDir
		};
		excluded.add(hit.hitBall);
		if (!bounce.cueDir) break;
		x = cx;
		y = cy;
		dx = bounce.cueDir.dx;
		dy = bounce.cueDir.dy;
	}
	return {
		segments,
		contacts,
		firstBallHit
	};
}
function hitBallPreview(ball, x, y) {
	if (!ball) return null;
	return {
		x,
		y,
		color: ball.color,
		ballType: ball.ballType
	};
}
function predictCueTrajectory(angle, cueBall, balls) {
	const dx = Math.cos(angle);
	const dy = Math.sin(angle);
	const ox = cueBall.x;
	const oy = cueBall.y;
	const hit = findFirstHit(ox, oy, dx, dy, balls, /* @__PURE__ */ new Set([cueBall]));
	const contactX = ox + dx * hit.t;
	const contactY = oy + dy * hit.t;
	const endX = ox + dx * (hit.t + 18);
	const endY = oy + dy * (hit.t + 18);
	let bounceDx = 0;
	let bounceDy = 0;
	let targetDx = 0;
	let targetDy = 0;
	let hasBounce = false;
	let hasTargetLine = false;
	if (hit.type === "wall") {
		const bounce = wallBounceDir(dx, dy, hit.hitWallNx, hit.hitWallNy);
		if (bounce) {
			bounceDx = bounce.dx;
			bounceDy = bounce.dy;
			hasBounce = true;
		}
	} else if (hit.type === "ball" && hit.hitBall) {
		const bounce = ballBounceDirs(dx, dy, contactX, contactY, hit.hitBall);
		if (bounce.cueDir) {
			bounceDx = bounce.cueDir.dx;
			bounceDy = bounce.cueDir.dy;
			hasBounce = true;
		}
		if (bounce.targetDir) {
			targetDx = bounce.targetDir.dx;
			targetDy = bounce.targetDir.dy;
			hasTargetLine = true;
		}
	}
	const targetStartX = hit.type === "ball" && hit.hitBall ? hit.hitBall.x : contactX;
	const targetStartY = hit.type === "ball" && hit.hitBall ? hit.hitBall.y : contactY;
	return {
		contactX,
		contactY,
		endX,
		endY,
		hitType: hit.type,
		hasBounce,
		bounceDx,
		bounceDy,
		bounceEndX: contactX + bounceDx * 52,
		bounceEndY: contactY + bounceDy * 52,
		hasTargetLine,
		targetDx,
		targetDy,
		targetStartX,
		targetStartY,
		targetEndX: targetStartX + targetDx * 88,
		targetEndY: targetStartY + targetDy * 88
	};
}
function predictExtendedCueTrajectory(angle, cueBall, balls, limits = {}) {
	const cueMaxContacts = limits.cueMaxContacts ?? 5;
	const targetMaxContacts = limits.targetMaxContacts ?? 3;
	const dx = Math.cos(angle);
	const dy = Math.sin(angle);
	const cueTrace = traceBallPath(cueBall.x, cueBall.y, dx, dy, balls, [cueBall], cueMaxContacts);
	let targetSegments = [];
	let targetContacts = [];
	if (cueTrace.firstBallHit?.targetDir) {
		const { ball, targetDir } = cueTrace.firstBallHit;
		const targetTrace = traceBallPath(ball.x, ball.y, targetDir.dx, targetDir.dy, balls, [cueBall, ball], targetMaxContacts);
		targetSegments = targetTrace.segments;
		targetContacts = targetTrace.contacts;
	}
	const first = cueTrace.segments[0];
	const contactX = first ? first.x2 : cueBall.x + dx * 18;
	const contactY = first ? first.y2 : cueBall.y + dy * 18;
	let hitBall = null;
	if (cueTrace.firstBallHit && targetContacts.length >= 1) {
		const { ball } = cueTrace.firstBallHit;
		const firstContact = targetContacts[0];
		hitBall = hitBallPreview(ball, firstContact.x, firstContact.y);
	}
	return {
		contactX,
		contactY,
		hitType: cueTrace.contacts[0]?.type ?? "none",
		hitBall,
		cueSegments: cueTrace.segments,
		cueContacts: cueTrace.contacts,
		targetSegments,
		targetContacts
	};
}
var init_physics = __esmMin((() => {
	init_constants();
	init_cushion_collision();
}));
//#endregion
//#region public/spin.js
function spinOffsetNormalized(spinOffsetX, spinOffsetY) {
	return {
		offX: spinOffsetX / MAX_SPIN_OFFSET,
		offY: spinOffsetY / MAX_SPIN_OFFSET
	};
}
function hasSignificantSpin(spinOffsetX, spinOffsetY) {
	const { offX, offY } = spinOffsetNormalized(spinOffsetX, spinOffsetY);
	return Math.hypot(offX, offY) > .04;
}
/** Применяет винт к шару. Возвращает false, если винт в пределах мёртвой зоны. */
function applySpinToBall(cueBall, power, angle, spinOffsetX, spinOffsetY) {
	const { offX, offY } = spinOffsetNormalized(spinOffsetX, spinOffsetY);
	const offCenter = Math.hypot(offX, offY);
	if (offCenter <= .04) {
		cueBall.slide = 0;
		cueBall.topSpin = 0;
		cueBall.spin = 0;
		clearCueDrawVisualState(cueBall);
		updateBallOmega(cueBall);
		return false;
	}
	const tipEff = 1 - offCenter * SPIN_TIP_EFFICIENCY;
	const sideOff = Math.sign(offX) * Math.pow(Math.abs(offX), .9);
	const topOff = Math.sign(offY) * Math.pow(Math.abs(offY), .88);
	const spinAmountEff = strikeSpinAmountEffectiveness(power);
	const drawAmountEff = strikeDrawAmountEffectiveness(power);
	const topAmountEff = Math.abs(topOff) > .04 ? drawAmountEff : 1;
	cueBall.spin = sideOff * SPIN_SIDE_POWER * power * tipEff * spinAmountEff * SPIN_STRENGTH;
	cueBall.topSpin = -topOff * SPIN_TOP_POWER * power * tipEff * topAmountEff * SPIN_STRENGTH;
	const slideFromSide = Math.abs(sideOff) * SLIDE_FROM_OFFSET * SLIDE_FROM_SIDE_SCALE;
	const slideFromTop = Math.abs(topOff) * .88;
	cueBall.slide = Math.min(1, Math.max(slideFromSide, slideFromTop) + offCenter * .16);
	clearCueDrawVisualState(cueBall);
	cueBall.cueDrawApproach = cueBall.topSpin < -SLEEP_SPIN;
	if (Math.abs(sideOff) > .05) {
		const squirtEff = strikeSquirtEffectiveness(power);
		const shotAngle = angle + -sideOff * SQUIRT_FACTOR * (.5 + power * .055) * squirtEff * SPIN_STRENGTH;
		cueBall.vx = Math.cos(shotAngle) * power;
		cueBall.vy = Math.sin(shotAngle) * power;
	}
	updateBallOmega(cueBall);
	return true;
}
var init_spin = __esmMin((() => {
	init_constants();
	init_ball();
}));
//#endregion
//#region public/physics_preview.js
function cloneCueBall(cueBall) {
	const c = new Ball(cueBall.x, cueBall.y, {
		isCueBall: true,
		mass: cueBall.mass
	});
	c.vx = cueBall.vx;
	c.vy = cueBall.vy;
	c.px = cueBall.px;
	c.py = cueBall.py;
	c.sleepFrames = cueBall.sleepFrames;
	c.spin = 0;
	c.topSpin = 0;
	c.slide = 0;
	return c;
}
function staticObstacles(balls, cueBall) {
	return balls.filter((b) => b !== cueBall && !b.inPocket && !b.isPocketing()).map((b) => ({
		x: b.x,
		y: b.y,
		ball: b
	}));
}
function applyStrike(simCue, angle, power, spinOffsetX = 0, spinOffsetY = 0) {
	simCue.vx = Math.cos(angle) * power;
	simCue.vy = Math.sin(angle) * power;
	applySpinToBall(simCue, power, angle, spinOffsetX, spinOffsetY);
}
function resolveCueStaticBallCollision(cue, obstacle) {
	const dx = obstacle.x - cue.x;
	const dy = obstacle.y - cue.y;
	const dist = Math.hypot(dx, dy);
	const minDist = 22;
	if (dist >= minDist - .01) return null;
	const nx = dist > 1e-6 ? dx / dist : 1;
	const ny = dist > 1e-6 ? dy / dist : 0;
	const overlap = minDist - dist;
	cue.x -= nx * overlap;
	cue.y -= ny * overlap;
	const dot = cue.vx * nx + cue.vy * ny;
	if (dot > 0) return {
		type: "ball",
		x: cue.x,
		y: cue.y,
		ball: obstacle.ball
	};
	const tx = -ny;
	const ty = nx;
	const jn = -(1 + BALL_RESTITUTION) * dot;
	cue.vx += jn * nx;
	cue.vy += jn * ny;
	const vTan = cue.vx * tx + cue.vy * ty;
	cue.vx -= vTan * BALL_FRICTION * tx;
	cue.vy -= vTan * BALL_FRICTION * ty;
	return {
		type: "ball",
		x: cue.x,
		y: cue.y,
		ball: obstacle.ball
	};
}
function resolveStaticBallCollisions(cue, obstacles) {
	let hit = null;
	for (const obstacle of obstacles) {
		const contact = resolveCueStaticBallCollision(cue, obstacle);
		if (contact) hit = contact;
	}
	return hit;
}
function detectWallBounce(cue, prevCue) {
	const speedBefore = Math.hypot(prevCue.vx, prevCue.vy);
	const speedAfter = Math.hypot(cue.vx, cue.vy);
	if (speedBefore < .35) return null;
	if (prevCue.vx * cue.vx + prevCue.vy * cue.vy < speedBefore * speedAfter * .35) return {
		type: "wall",
		x: cue.x,
		y: cue.y
	};
	return null;
}
function stepCueOnly(cue, obstacles, frameScale) {
	const subDt = frameScale / 10;
	let ballContact = null;
	for (let step = 0; step < 10; step++) {
		cue.px = cue.x;
		cue.py = cue.y;
		cue.x += cue.vx * subDt;
		cue.y += cue.vy * subDt;
		const staticHit = resolveStaticBallCollisions(cue, obstacles);
		if (staticHit) ballContact = staticHit;
		resolveBallCushionCollision(cue, cue.px, cue.py, { applyJitter: false });
		const staticHit2 = resolveStaticBallCollisions(cue, obstacles);
		if (staticHit2) ballContact = staticHit2;
		applyMotionForces(cue, subDt);
		tryPocketBall(cue, subDt * 10);
		cue.advanceRoll(subDt);
	}
	return ballContact;
}
function runCueSimulation(simCue, obstacles, cueMaxContacts = DEFAULT_CUE_MAX_CONTACTS) {
	const samples = [{
		x: simCue.x,
		y: simCue.y
	}];
	let firstContactSampleIdx = -1;
	const cueContacts = [];
	let firstBallHit = null;
	let cueCooldown = 0;
	for (let step = 0; step < MAX_SIM_STEPS; step++) {
		const prevCue = {
			x: simCue.x,
			y: simCue.y,
			vx: simCue.vx,
			vy: simCue.vy
		};
		const ballContact = stepCueOnly(simCue, obstacles, 1);
		samples.push({
			x: simCue.x,
			y: simCue.y
		});
		if (simCue.inPocket || simCue.isPocketing()) break;
		if (cueContacts.length < cueMaxContacts) if (cueCooldown > 0) cueCooldown--;
		else {
			const contact = ballContact || detectWallBounce(simCue, prevCue);
			if (contact) {
				contact.vx = simCue.vx;
				contact.vy = simCue.vy;
				cueContacts.push(contact);
				cueCooldown = CONTACT_COOLDOWN_STEPS;
				if (firstContactSampleIdx < 0) firstContactSampleIdx = samples.length - 1;
				if (contact.type === "ball" && !firstBallHit) firstBallHit = contact;
			}
		}
		if (!simCue.isMoving()) break;
	}
	return {
		samples,
		firstContactSampleIdx,
		cueContacts,
		firstBallHit,
		simCue
	};
}
function unitDir(x1, y1, x2, y2) {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const len = Math.hypot(dx, dy);
	if (len <= .08) return null;
	return {
		dx: dx / len,
		dy: dy / len,
		len
	};
}
function sliceSamples(samples, startIdx, endIdx) {
	if (!samples.length) return [];
	const start = Math.max(0, startIdx);
	const end = endIdx < 0 ? samples.length : Math.min(samples.length, endIdx + 1);
	if (end <= start) return samples.slice(start, start + 1);
	return samples.slice(start, end);
}
function buildOffPath(sim, angle) {
	const { samples, firstContactSampleIdx, cueContacts, firstBallHit, simCue } = sim;
	const firstContact = cueContacts[0];
	const contactX = firstContact?.x ?? samples[samples.length - 1]?.x ?? simCue.x;
	const contactY = firstContact?.y ?? samples[samples.length - 1]?.y ?? simCue.y;
	const hitType = firstContact?.type ?? "none";
	const aimSamples = firstContactSampleIdx >= 0 ? sliceSamples(samples, 0, firstContactSampleIdx) : samples;
	let bounceSamples = [];
	if (firstContactSampleIdx >= 0) bounceSamples = sliceSamples(samples, firstContactSampleIdx, samples.length - 1);
	const stop = samples[samples.length - 1] ?? {
		x: simCue.x,
		y: simCue.y
	};
	const hasBounce = bounceSamples.length >= 2;
	const bounceEnd = bounceSamples[bounceSamples.length - 1];
	const bounceStart = bounceSamples[0] ?? {
		x: contactX,
		y: contactY
	};
	const bounceDir = hasBounce ? unitDir(bounceStart.x, bounceStart.y, bounceEnd.x, bounceEnd.y) : null;
	let hasTargetLine = false;
	let targetDx = 0;
	let targetDy = 0;
	let targetEndX = contactX;
	let targetEndY = contactY;
	if (firstBallHit?.ball) {
		const speed = Math.hypot(firstBallHit.vx, firstBallHit.vy);
		const bounce = ballBounceDirs(speed > .08 ? firstBallHit.vx / speed : Math.cos(angle), speed > .08 ? firstBallHit.vy / speed : Math.sin(angle), contactX, contactY, firstBallHit.ball);
		if (bounce.targetDir) {
			hasTargetLine = true;
			targetDx = bounce.targetDir.dx;
			targetDy = bounce.targetDir.dy;
			targetEndX = contactX + targetDx * TARGET_PREVIEW_LEN;
			targetEndY = contactY + targetDy * TARGET_PREVIEW_LEN;
		}
	}
	return {
		contactX,
		contactY,
		endX: stop.x,
		endY: stop.y,
		hitType,
		fullSamples: samples,
		firstContactSampleIdx,
		aimSamples,
		bounceSamples,
		stopX: stop.x,
		stopY: stop.y,
		hasBounce,
		bounceDx: bounceDir?.dx ?? 0,
		bounceDy: bounceDir?.dy ?? 0,
		bounceEndX: bounceEnd?.x ?? contactX,
		bounceEndY: bounceEnd?.y ?? contactY,
		hasTargetLine,
		targetDx,
		targetDy,
		targetEndX,
		targetEndY,
		simulated: true
	};
}
function predictSimulatedTrajectory(angle, cueBall, balls, options = {}) {
	const { power, spinOffsetX = 0, spinOffsetY = 0, cueMaxContacts = DEFAULT_CUE_MAX_CONTACTS } = options;
	const simCue = cloneCueBall(cueBall);
	const obstacles = staticObstacles(balls, cueBall);
	applyStrike(simCue, angle, power, spinOffsetX, spinOffsetY);
	return buildOffPath(runCueSimulation(simCue, obstacles, cueMaxContacts), angle);
}
var CONTACT_COOLDOWN_STEPS, MAX_SIM_STEPS, DEFAULT_CUE_MAX_CONTACTS, TARGET_PREVIEW_LEN;
var init_physics_preview = __esmMin((() => {
	init_ball();
	init_physics_engine();
	init_cushion_collision();
	init_utils();
	init_spin();
	init_constants();
	init_physics();
	CONTACT_COOLDOWN_STEPS = 4;
	MAX_SIM_STEPS = 3600;
	DEFAULT_CUE_MAX_CONTACTS = 2;
	TARGET_PREVIEW_LEN = 72;
}));
//#endregion
//#region public/cue_utils.js
/** Позиция наклейки кия относительно битка (без отрисовки). */
function getCueTipPosition(cueBall, angle, pullBack, spinOffsetX = 0, spinOffsetY = 0) {
	const r = 11;
	const perpX = -Math.sin(angle);
	const perpY = Math.cos(angle);
	const backX = -Math.cos(angle);
	const backY = -Math.sin(angle);
	const contactX = cueBall.x + backX * r + perpX * spinOffsetX * r * .9 + backX * spinOffsetY * r * .35;
	const contactY = cueBall.y + backY * r + perpY * spinOffsetX * r * .9 + backY * spinOffsetY * r * .35;
	const tipOffset = 2 + pullBack;
	return {
		x: contactX - Math.cos(angle) * tipOffset,
		y: contactY - Math.sin(angle) * tipOffset
	};
}
var init_cue_utils = __esmMin((() => {
	init_constants();
}));
//#endregion
//#region public/render/render_state.js
function serializeBall(ball) {
	if (!ball) return null;
	const fall = ball.pocketFall;
	return {
		x: ball.x,
		y: ball.y,
		radius: ball.radius,
		orientation: ball.orientation ? { ...ball.orientation } : {
			w: 1,
			x: 0,
			y: 0,
			z: 0
		},
		ballType: ball.ballType,
		color: ball.color,
		number: ball.number,
		isCueBall: !!ball.isCueBall,
		inPocket: !!ball.inPocket,
		pocketFall: fall ? {
			pocketX: fall.pocketX,
			pocketY: fall.pocketY,
			pocketDrawRadius: fall.pocketDrawRadius,
			scale: fall.scale,
			alpha: fall.alpha,
			depth: fall.depth
		} : null
	};
}
function buildRenderState({ balls, cueBall, strikeAnim, impactFlash, aimX, aimY, aimAngle, spinOffsetX, spinOffsetY, aimLineVariant, aimModifierEnabled, canShowCue, getPullFromPower, predictAimPath, getCueTipPosition }) {
	let cue = null;
	if (strikeAnim) {
		const tip = getCueTipPosition(cueBall, strikeAnim.angle, strikeAnim.currentPull, spinOffsetX, spinOffsetY);
		const path = predictAimPath(strikeAnim.angle);
		cue = {
			visible: true,
			angle: strikeAnim.angle,
			pullBack: strikeAnim.currentPull,
			tipX: tip.x,
			tipY: tip.y,
			aimX,
			aimY,
			spinOffsetX,
			spinOffsetY,
			trajectory: path,
			aimLineVariant: path.simulated ? "off" : aimModifierEnabled ? "off" : aimLineVariant,
			aimModifierEnabled
		};
	} else if (canShowCue) {
		const angle = aimAngle;
		const pullBack = getPullFromPower();
		const tip = getCueTipPosition(cueBall, angle, pullBack, spinOffsetX, spinOffsetY);
		const path = predictAimPath(angle);
		cue = {
			visible: true,
			angle,
			pullBack,
			tipX: tip.x,
			tipY: tip.y,
			aimX,
			aimY,
			spinOffsetX,
			spinOffsetY,
			trajectory: path,
			aimLineVariant: path.simulated ? "off" : aimModifierEnabled ? "off" : aimLineVariant,
			aimModifierEnabled
		};
	}
	let flash = null;
	if (impactFlash) {
		const t = (performance.now() - impactFlash.startTime) / 180;
		if (t < 1) flash = {
			x: impactFlash.x,
			y: impactFlash.y,
			t
		};
	}
	return {
		balls: balls.map(serializeBall),
		cue,
		impactFlash: flash,
		debug: { drawRubber: true }
	};
}
var init_render_state = __esmMin((() => {
	init_constants();
	init_utils();
}));
(/* @__PURE__ */ __commonJSMin((() => {
	init_constants();
	init_ball();
	init_game_logic();
	init_physics_engine();
	init_cushion_collision();
	init_physics();
	init_physics_preview();
	init_spin();
	init_cue_utils();
	init_render_state();
	init_utils();
	var preventBrowserZoom = (e) => e.preventDefault();
	var zoomBlockOptions = {
		passive: false,
		capture: true
	};
	var lastTouchEndAt = 0;
	document.addEventListener("dblclick", preventBrowserZoom, zoomBlockOptions);
	document.addEventListener("gesturestart", preventBrowserZoom, zoomBlockOptions);
	document.addEventListener("gesturechange", preventBrowserZoom, zoomBlockOptions);
	document.addEventListener("gestureend", preventBrowserZoom, zoomBlockOptions);
	document.addEventListener("touchstart", (e) => {
		if (e.touches.length > 1) e.preventDefault();
	}, zoomBlockOptions);
	document.addEventListener("touchmove", (e) => {
		if (e.touches.length > 1) e.preventDefault();
	}, zoomBlockOptions);
	document.addEventListener("touchend", (e) => {
		const now = performance.now();
		if (now - lastTouchEndAt < 350) e.preventDefault();
		lastTouchEndAt = now;
	}, zoomBlockOptions);
	document.addEventListener("wheel", (e) => {
		if (e.ctrlKey) e.preventDefault();
	}, zoomBlockOptions);
	window.addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "-" || e.key === "0")) e.preventDefault();
	}, zoomBlockOptions);
	var canvas = document.getElementById("billiard-canvas");
	var loadingOverlay = document.getElementById("loading-overlay");
	var scoreElement = document.getElementById("score");
	var resetBtn = document.getElementById("reset-btn");
	var powerValue = document.getElementById("power-value");
	var powerTrack = document.getElementById("power-pull-track");
	var powerMarks = document.getElementById("power-pull-marks");
	var powerFill = document.getElementById("power-pull-fill");
	var powerThumb = document.getElementById("power-pull-thumb");
	var aimTrack = document.getElementById("aim-slider-track");
	var aimWheelNotches = document.getElementById("aim-wheel-notches");
	var aimDegrees = document.getElementById("aim-degrees");
	var aimLineVariantBtn = document.getElementById("aim-line-variant-btn");
	var aimModifierBtn = document.getElementById("aim-modifier-btn");
	var ballRestitutionBtn = document.getElementById("ball-restitution-btn");
	var cushionRestitutionBtn = document.getElementById("cushion-restitution-btn");
	var physicsModeBtn = document.getElementById("physics-mode-btn");
	var cushionLipBtn = document.getElementById("cushion-lip-btn");
	var spinPresetBtn = document.getElementById("spin-preset-btn");
	var spinPad = document.getElementById("spin-pad");
	var spinThumb = document.getElementById("spin-pad-thumb");
	var spinResetBtn = document.getElementById("spin-reset-btn");
	var gameContainer = document.getElementById("game-container");
	var gameStage = document.getElementById("game-stage");
	var traySlots = document.getElementById("pocketed-tray-slots");
	canvas.width = CANVAS_WIDTH;
	canvas.height = 520;
	var renderWorker = null;
	var renderReady = false;
	var RENDER_INIT_TIMEOUT_MS = 45e3;
	var AIM_PATH_THROTTLE_MS = 80;
	var RENDER_PROFILE = typeof location !== "undefined" && new URLSearchParams(location.search).has("renderProfile");
	var gameLoopRafId = null;
	var gameLoopActive = false;
	var cachedAimPath = null;
	var cachedAimPathKey = "";
	var lastAimPathTime = 0;
	function setLoadingStatus(text) {
		if (!loadingOverlay || loadingOverlay.classList.contains("is-error")) return;
		loadingOverlay.textContent = text;
	}
	function showLoadingError(message) {
		if (!loadingOverlay) return;
		loadingOverlay.hidden = false;
		loadingOverlay.classList.remove("is-progress");
		loadingOverlay.classList.add("is-error");
		loadingOverlay.textContent = message;
	}
	function hideLoadingOverlay() {
		if (!loadingOverlay) return;
		loadingOverlay.hidden = true;
	}
	async function initRenderWorker() {
		if (typeof OffscreenCanvas === "undefined") throw new Error("Браузер не поддерживает OffscreenCanvas");
		setLoadingStatus("Запуск рендера…");
		const offscreen = canvas.transferControlToOffscreen();
		renderWorker = new Worker(new URL(
			/* @vite-ignore */
			"/assets/render_worker-Db9NVFg1.js",
			"" + import.meta.url
		), { type: "module" });
		await new Promise((resolve, reject) => {
			let settled = false;
			const finish = (fn, value) => {
				if (settled) return;
				settled = true;
				cleanup();
				fn(value);
			};
			const cleanup = () => {
				clearTimeout(timeoutId);
				renderWorker.removeEventListener("message", onMessage);
				renderWorker.removeEventListener("error", onWorkerError);
				renderWorker.removeEventListener("messageerror", onMessageError);
			};
			const timeoutId = setTimeout(() => {
				finish(reject, /* @__PURE__ */ new Error("Превышено время ожидания загрузки рендера (45 с). Откройте консоль браузера (F12) → вкладки Console и Network."));
			}, RENDER_INIT_TIMEOUT_MS);
			const onMessage = (event) => {
				const msg = event.data;
				if (msg.type === "progress") {
					setLoadingStatus(msg.text || "Загрузка…");
					return;
				}
				if (msg.type === "ready") {
					renderReady = true;
					finish(resolve);
				} else if (msg.type === "error") finish(reject, new Error(msg.message || "Ошибка worker"));
			};
			const onWorkerError = (event) => {
				const detail = [
					event.message,
					event.filename,
					event.lineno
				].filter(Boolean).join(" ");
				finish(reject, /* @__PURE__ */ new Error(detail ? `Worker: ${detail}` : "Не удалось загрузить render worker. Проверьте Network → render_worker.js и canvaskit.wasm"));
			};
			const onMessageError = () => {
				finish(reject, /* @__PURE__ */ new Error("Worker: ошибка десериализации сообщения"));
			};
			renderWorker.addEventListener("message", onMessage);
			renderWorker.addEventListener("error", onWorkerError);
			renderWorker.addEventListener("messageerror", onMessageError);
			if (RENDER_PROFILE) renderWorker.addEventListener("message", (e) => {
				if (e.data?.type === "profile" && e.data.workerMs != null) console.debug("[render profile]", e.data);
			});
			renderWorker.postMessage({
				type: "init",
				canvas: offscreen,
				width: CANVAS_WIDTH,
				height: 520
			}, [offscreen]);
		});
	}
	function buildAimPathKey(angle) {
		return [
			angle.toFixed(5),
			aimLineVariant,
			aimModifierEnabled ? 1 : 0,
			spinOffsetX.toFixed(4),
			spinOffsetY.toFixed(4),
			shotPower.toFixed(2),
			balls.map((b) => `${b.x.toFixed(1)},${b.y.toFixed(1)},${b.inPocket ? 1 : 0}`).join(";")
		].join("|");
	}
	function predictAimPathThrottled(angle) {
		const key = buildAimPathKey(angle);
		const now = performance.now();
		if (cachedAimPath && key === cachedAimPathKey && now - lastAimPathTime < AIM_PATH_THROTTLE_MS) return cachedAimPath;
		cachedAimPath = predictAimPath(angle);
		cachedAimPathKey = key;
		lastAimPathTime = now;
		return cachedAimPath;
	}
	function postRenderFrame() {
		if (!renderWorker || !renderReady) return;
		const t0 = RENDER_PROFILE ? performance.now() : 0;
		const state = buildRenderState({
			balls,
			cueBall,
			strikeAnim,
			impactFlash,
			aimX,
			aimY,
			aimAngle: getAimAngle(),
			spinOffsetX,
			spinOffsetY,
			aimLineVariant,
			aimModifierEnabled,
			canShowCue: canShowCue(),
			getPullFromPower,
			predictAimPath: predictAimPathThrottled,
			getCueTipPosition
		});
		const serializeMs = RENDER_PROFILE ? performance.now() - t0 : 0;
		renderWorker.postMessage({
			type: "frame",
			state,
			profile: RENDER_PROFILE ? { serializeMs } : void 0
		});
	}
	function invalidateRenderTable() {
		renderWorker?.postMessage({ type: "invalidate_table" });
	}
	function fitGameLayout() {
		if (!gameContainer || !gameStage) return;
		const availW = gameContainer.clientWidth;
		const availH = gameContainer.clientHeight;
		if (availW <= 0 || availH <= 0) return;
		const scale = Math.min(availW / LAYOUT_WIDTH, availH / 700) * .9;
		gameStage.style.transform = `scale(${scale})`;
	}
	var landscapeLockTried = false;
	function tryLockLandscape() {
		if (landscapeLockTried) return;
		landscapeLockTried = true;
	}
	var balls = [];
	var cueBall;
	var aimX = CANVAS_WIDTH / 2;
	var aimY = 520 / 2;
	var aimAngle = 0;
	var aimAngleTarget = 0;
	var shotPower = 0;
	var shotPowerTarget = 0;
	var isPullingPower = false;
	var activePullPointerId = null;
	var activeCanvasPointerId = null;
	var score = 0;
	var scoredBalls = /* @__PURE__ */ new Set();
	var strikeAnim = null;
	var impactFlash = null;
	var isDraggingAimSlider = false;
	var activeAimSliderPointerId = null;
	var aimSliderLastY = null;
	var aimPointer = null;
	var aimLineVariant = "off";
	var aimModifierEnabled = false;
	var lastFrameTime = performance.now();
	var spinOffsetX = 0;
	var spinOffsetY = 0;
	var isDraggingSpin = false;
	var activeSpinPadPointerId = null;
	var AIM_LINE_VARIANT_KEY = "vtj-pool-aim-line-variant";
	var BALL_RESTITUTION_PROFILE_KEY = "vtj-pool-ball-restitution-profile";
	var CUSHION_RESTITUTION_PROFILE_KEY = "vtj-pool-cushion-restitution-profile";
	var PHYSICS_MODE_KEY = "vtj-pool-physics-mode";
	var SPIN_PRESET_KEY = "vtj-pool-spin-preset";
	function loadAimLineVariant() {
		try {
			const saved = localStorage.getItem(AIM_LINE_VARIANT_KEY);
			const normalized = saved === "ghost" ? "off" : saved === "classic" ? "on" : saved;
			if (AIM_LINE_VARIANTS.includes(normalized)) aimLineVariant = normalized;
		} catch {}
	}
	function updateAimLineVariantButton() {
		if (!aimLineVariantBtn) return;
		aimLineVariantBtn.textContent = AIM_LINE_LABELS[aimLineVariant];
		const variantActive = aimLineVariant !== "off";
		aimLineVariantBtn.classList.toggle("is-active", variantActive && !aimModifierEnabled);
		aimLineVariantBtn.disabled = aimModifierEnabled;
		aimLineVariantBtn.classList.toggle("is-disabled", aimModifierEnabled);
		aimLineVariantBtn.setAttribute("aria-label", aimModifierEnabled ? "Вариант прицела: off (при включённом mod доступен только off)" : `Вариант прицела: ${AIM_LINE_LABELS[aimLineVariant]}. Нажмите для переключения`);
	}
	function cycleAimLineVariant() {
		if (aimModifierEnabled) return;
		aimLineVariant = AIM_LINE_VARIANTS[(AIM_LINE_VARIANTS.indexOf(aimLineVariant) + 1) % AIM_LINE_VARIANTS.length];
		try {
			localStorage.setItem(AIM_LINE_VARIANT_KEY, aimLineVariant);
		} catch {}
		updateAimLineVariantButton();
	}
	function loadAimModifier() {
		try {
			const saved = localStorage.getItem(AIM_MODIFIER_STORAGE_KEY);
			if (saved === "1" || saved === "true") aimModifierEnabled = true;
			else if (saved === "0" || saved === "false") aimModifierEnabled = false;
			if (aimModifierEnabled) aimLineVariant = "off";
		} catch {}
	}
	function updateAimModifierButton() {
		if (!aimModifierBtn) return;
		aimModifierBtn.textContent = "mod";
		aimModifierBtn.classList.toggle("is-active", aimModifierEnabled);
		aimModifierBtn.setAttribute("aria-pressed", aimModifierEnabled ? "true" : "false");
		aimModifierBtn.setAttribute("aria-label", `Модификатор прицела: ${aimModifierEnabled ? "включён" : "выключен"}. Нажмите для переключения`);
	}
	function toggleAimModifier() {
		aimModifierEnabled = !aimModifierEnabled;
		if (aimModifierEnabled) aimLineVariant = "off";
		try {
			localStorage.setItem(AIM_MODIFIER_STORAGE_KEY, aimModifierEnabled ? "1" : "0");
		} catch {}
		updateAimModifierButton();
		updateAimLineVariantButton();
	}
	function updateBallRestitutionButton() {
		if (!ballRestitutionBtn) return;
		const isSoft = BALL_RESTITUTION_PROFILE === "soft";
		ballRestitutionBtn.textContent = isSoft ? "ball:s" : "ball:t";
		ballRestitutionBtn.classList.toggle("is-active", !isSoft);
		ballRestitutionBtn.setAttribute("aria-label", `Профиль упругости шара: ${BALL_RESTITUTION_PROFILE}. Нажмите для переключения`);
	}
	function updateCushionRestitutionButton() {
		if (!cushionRestitutionBtn) return;
		const isSoft = CUSHION_RESTITUTION_PROFILE === "soft";
		cushionRestitutionBtn.textContent = isSoft ? "cush:s" : "cush:t";
		cushionRestitutionBtn.classList.toggle("is-active", !isSoft);
		cushionRestitutionBtn.setAttribute("aria-label", `Профиль упругости губ: ${CUSHION_RESTITUTION_PROFILE}. Нажмите для переключения`);
	}
	function loadRestitutionProfiles() {
		try {
			const savedBall = localStorage.getItem(BALL_RESTITUTION_PROFILE_KEY);
			if (savedBall) setBallRestitutionProfile(savedBall);
			const savedCushion = localStorage.getItem(CUSHION_RESTITUTION_PROFILE_KEY);
			if (savedCushion) setCushionRestitutionProfile(savedCushion);
		} catch {}
	}
	function toggleBallRestitutionProfile() {
		const next = BALL_RESTITUTION_PROFILE === "soft" ? "tournament" : "soft";
		setBallRestitutionProfile(next);
		try {
			localStorage.setItem(BALL_RESTITUTION_PROFILE_KEY, next);
		} catch {}
		updateBallRestitutionButton();
	}
	function toggleCushionRestitutionProfile() {
		const next = CUSHION_RESTITUTION_PROFILE === "soft" ? "tournament" : "soft";
		setCushionRestitutionProfile(next);
		try {
			localStorage.setItem(CUSHION_RESTITUTION_PROFILE_KEY, next);
		} catch {}
		updateCushionRestitutionButton();
	}
	function updatePhysicsModeButton() {
		if (!physicsModeBtn) return;
		physicsModeBtn.textContent = `mode:${PHYSICS_MODE === "balanced" ? "bal" : PHYSICS_MODE}`;
		physicsModeBtn.classList.toggle("is-active", PHYSICS_MODE !== "real");
		physicsModeBtn.setAttribute("aria-label", `Режим физики трения: ${PHYSICS_MODE}. Нажмите для переключения`);
	}
	function loadPhysicsMode() {
		try {
			const saved = localStorage.getItem(PHYSICS_MODE_KEY);
			if (saved) setPhysicsMode(saved);
		} catch {}
	}
	function togglePhysicsMode() {
		const next = PHYSICS_MODES[(PHYSICS_MODES.indexOf(PHYSICS_MODE) + 1) % PHYSICS_MODES.length];
		setPhysicsMode(next);
		try {
			localStorage.setItem(PHYSICS_MODE_KEY, next);
		} catch {}
		updatePhysicsModeButton();
	}
	function updateSpinPresetButton() {
		if (!spinPresetBtn) return;
		spinPresetBtn.textContent = `spin:${SPIN_PRESET_LABELS[SPIN_PRESET] ?? SPIN_PRESET}`;
		spinPresetBtn.classList.toggle("is-active", SPIN_PRESET !== "default");
		spinPresetBtn.setAttribute("aria-label", `Пресет винта: ${SPIN_PRESET}. Нажмите для переключения`);
	}
	function loadSpinPreset() {
		try {
			const saved = localStorage.getItem(SPIN_PRESET_KEY);
			if (saved) setSpinPreset(saved);
		} catch {}
	}
	function toggleSpinPreset() {
		const next = SPIN_PRESET_IDS[(SPIN_PRESET_IDS.indexOf(SPIN_PRESET) + 1) % SPIN_PRESET_IDS.length];
		setSpinPreset(next);
		try {
			localStorage.setItem(SPIN_PRESET_KEY, next);
		} catch {}
		updateSpinPresetButton();
	}
	function updateCushionLipButton() {
		if (!cushionLipBtn) return;
		const percent = Math.round(CUSHION_LIP_SCALE * 100);
		cushionLipBtn.textContent = `lip:${percent}%`;
		cushionLipBtn.classList.toggle("is-active", percent !== 100);
		cushionLipBtn.setAttribute("aria-label", `Ширина губ: ${percent} процентов. Нажмите для увеличения на 10 процентов`);
	}
	function loadCushionLipScale() {
		setCushionLipScale(1);
		invalidateCushionCollisionCache();
	}
	function cycleCushionLipScale() {
		const next = CUSHION_LIP_SCALE + CUSHION_LIP_SCALE_STEP;
		if (!setCushionLipScale(next > 1.2 ? .7 : next)) return;
		invalidateCushionCollisionCache();
		invalidateRenderTable();
		updateCushionLipButton();
	}
	var TRAY_CAPACITY = 15;
	function resetTray() {
		traySlots.innerHTML = "";
		for (let i = 0; i < TRAY_CAPACITY; i++) {
			const slot = document.createElement("div");
			slot.className = "tray-slot";
			traySlots.appendChild(slot);
		}
	}
	function miniBallBackground(ball) {
		if (ball.ballType === "stripe") return `linear-gradient(180deg,
            #f6f2ea 0%, #f6f2ea 22%,
            ${ball.color} 22%, ${ball.color} 78%,
            #f6f2ea 78%, #f6f2ea 100%)`;
		return `radial-gradient(circle at 32% 28%, ${lighten(ball.color, 70)}, ${ball.color} 60%, ${darken(ball.color, 40)})`;
	}
	function addBallToTray(ball) {
		const slot = traySlots.querySelector(".tray-slot:not(.filled)");
		if (!slot) return;
		slot.classList.add("filled");
		slot.style.background = miniBallBackground(ball);
		const num = document.createElement("span");
		num.className = "mini-ball-number";
		num.textContent = ball.number;
		slot.appendChild(num);
	}
	function updateSpinPadVisual() {
		const percentX = 50 + spinOffsetX / MAX_SPIN_OFFSET * 38;
		const percentY = 50 + spinOffsetY / MAX_SPIN_OFFSET * 38;
		spinThumb.style.left = `${percentX}%`;
		spinThumb.style.top = `${percentY}%`;
	}
	function setSpinOffset(localX, localY) {
		const len = Math.hypot(localX, localY);
		if (len > .72) {
			localX = localX / len * MAX_SPIN_OFFSET;
			localY = localY / len * MAX_SPIN_OFFSET;
		}
		spinOffsetX = localX;
		spinOffsetY = localY;
		updateSpinPadVisual();
	}
	function resetSpin() {
		setSpinOffset(0, 0);
	}
	function spinFromPadEvent(e) {
		const rect = spinPad.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = e.clientX - cx;
		const dy = e.clientY - cy;
		const radius = rect.width * .42;
		setSpinOffset(dx / radius * MAX_SPIN_OFFSET, dy / radius * MAX_SPIN_OFFSET);
	}
	function applySpinToCueBall(power, angle) {
		applySpinToBall(cueBall, power, angle, spinOffsetX, spinOffsetY);
		resetSpin();
	}
	function getAimAngle() {
		return aimAngle;
	}
	function normalizeAngle(angle) {
		while (angle <= -Math.PI) angle += Math.PI * 2;
		while (angle > Math.PI) angle -= Math.PI * 2;
		return angle;
	}
	function getAimMarkerDistance() {
		const dist = Math.hypot(aimX - cueBall.x, aimY - cueBall.y);
		return Math.max(48, dist);
	}
	function aimDegreesLabel(angle) {
		return `${Math.round((normalizeAngle(angle) * 180 / Math.PI + 360) % 360)}°`;
	}
	function updateAimSliderVisual() {
		aimDegrees.textContent = aimDegreesLabel(aimAngle);
		if (aimWheelNotches) aimWheelNotches.style.transform = `translateY(${-normalizeAngle(aimAngle) * 12}px)`;
	}
	function shortestAngleDelta(from, to) {
		let delta = normalizeAngle(to) - normalizeAngle(from);
		if (delta > Math.PI) delta -= Math.PI * 2;
		if (delta < -Math.PI) delta += Math.PI * 2;
		return delta;
	}
	function syncAimMarkerFromAngle() {
		const dist = getAimMarkerDistance();
		aimX = cueBall.x + Math.cos(aimAngle) * dist;
		aimY = cueBall.y + Math.sin(aimAngle) * dist;
	}
	function snapAimAngle() {
		aimAngle = aimAngleTarget;
		syncAimMarkerFromAngle();
		updateAimSliderVisual();
	}
	function setAimAngleTarget(angle, instant = false) {
		aimAngleTarget = normalizeAngle(angle);
		if (instant) snapAimAngle();
	}
	function updateAimSmoothing(frameScale) {
		if (!canShowCue()) return;
		const delta = shortestAngleDelta(aimAngle, aimAngleTarget);
		if (Math.abs(delta) < 5e-5) {
			if (aimAngle !== aimAngleTarget) snapAimAngle();
			return;
		}
		const rate = isDraggingAimSlider || aimPointer?.mode === "rotate" ? 15 : 6;
		const t = 1 - Math.exp(-rate * frameScale / 60);
		aimAngle = normalizeAngle(aimAngle + delta * t);
		syncAimMarkerFromAngle();
		updateAimSliderVisual();
	}
	function updateAimFromPoint(x, y) {
		const dx = x - cueBall.x;
		const dy = y - cueBall.y;
		if (dx * dx + dy * dy < 15.399999999999999 * 15.399999999999999) return;
		aimX = x;
		aimY = y;
		aimAngleTarget = Math.atan2(dy, dx);
		snapAimAngle();
	}
	function canAdjustAim() {
		return canShowCue();
	}
	function getPullFromPower() {
		return shotPower / 100 * 115;
	}
	function updatePowerVisual() {
		const power = Math.max(0, Math.min(100, shotPower));
		const sliderPos = powerToSliderPos(power);
		powerValue.textContent = `${Math.round(power)}%`;
		powerFill.style.height = `${sliderPos}%`;
		powerThumb.style.top = `${sliderPos}%`;
		powerTrack.style.setProperty("--pull-pos", `${sliderPos}%`);
		powerTrack.style.setProperty("--power-pct", String(power / 100));
		powerTrack.classList.toggle("has-power", power > .5 || isPullingPower);
	}
	function initPowerMarks() {
		if (!powerMarks) return;
		powerMarks.replaceChildren();
		for (const power of POWER_MARK_PERCENTS) {
			const mark = document.createElement("div");
			mark.className = "power-mark";
			mark.style.top = `${powerToSliderPos(power)}%`;
			const line = document.createElement("span");
			line.className = "power-mark-line";
			const label = document.createElement("span");
			label.className = "power-mark-label";
			label.textContent = `${power}%`;
			mark.append(line, label);
			powerMarks.appendChild(mark);
		}
	}
	function snapPower() {
		shotPower = shotPowerTarget;
		updatePowerVisual();
	}
	function setPowerTarget(percent, instant = false) {
		shotPowerTarget = Math.max(0, Math.min(100, percent));
		if (instant) snapPower();
	}
	function updatePowerSmoothing(frameScale) {
		if (strikeAnim) return;
		const delta = shotPowerTarget - shotPower;
		if (Math.abs(delta) < .01) {
			if (shotPower !== shotPowerTarget) snapPower();
			return;
		}
		const t = 1 - Math.exp(-(isPullingPower ? 15 : 6) * frameScale / 60);
		shotPower += delta * t;
		updatePowerVisual();
	}
	function resetPowerPull() {
		setPowerTarget(0, true);
		powerTrack.classList.remove("is-pulling");
	}
	function powerFromClientY(clientY) {
		const rect = powerTrack.getBoundingClientRect();
		const y = clientY - rect.top;
		return sliderPosToPower(Math.max(0, Math.min(rect.height, y)) / rect.height * 100);
	}
	function allBallsSettled() {
		return balls.every((ball) => !ball.isMoving());
	}
	function canShowCue() {
		return cueBall && !cueBall.inPocket && !cueBall.isPocketing() && allBallsSettled() && !strikeAnim;
	}
	function canPullPower() {
		return canShowCue();
	}
	function canAdjustSpin() {
		return canShowCue();
	}
	function startStrike(pullBack, angle) {
		wakeGameLoop();
		strikeAnim = {
			angle,
			pullBack,
			power: pullBack * POWER_FACTOR,
			startTime: performance.now(),
			duration: 85 + pullBack * .55
		};
		resetPowerPull();
	}
	function releasePowerPull() {
		if (!isPullingPower) return;
		isPullingPower = false;
		activePullPointerId = null;
		powerTrack.classList.remove("is-pulling");
		snapPower();
		if (shotPower >= 10 && canShowCue()) {
			snapAimAngle();
			startStrike(getPullFromPower(), getAimAngle());
		} else setPowerTarget(0);
	}
	function updateStrikeAnim() {
		if (!strikeAnim) return;
		const elapsed = performance.now() - strikeAnim.startTime;
		const progress = Math.min(elapsed / strikeAnim.duration, 1);
		const eased = 1 - Math.pow(1 - progress, 3);
		strikeAnim.currentPull = strikeAnim.pullBack * (1 - eased);
		if (progress >= 1) {
			const power = strikeAnim.power;
			const angle = strikeAnim.angle;
			cueBall.vx = Math.cos(angle) * power;
			cueBall.vy = Math.sin(angle) * power;
			applySpinToCueBall(power, angle);
			impactFlash = {
				x: cueBall.x,
				y: cueBall.y,
				startTime: performance.now()
			};
			strikeAnim = null;
		}
	}
	function updateImpactFlash() {
		if (impactFlash && performance.now() - impactFlash.startTime > 180) impactFlash = null;
	}
	function getShotPower() {
		return getPullFromPower() * POWER_FACTOR;
	}
	function predictAimPath(angle) {
		const power = getShotPower();
		const spinActive = hasSignificantSpin(spinOffsetX, spinOffsetY);
		if (aimModifierEnabled || spinActive) {
			let cueMaxContacts = 2;
			if (aimLineVariant === "max") cueMaxContacts = 64;
			else if (aimLineVariant !== "off") cueMaxContacts = 5;
			return predictSimulatedTrajectory(angle, cueBall, balls, {
				power,
				spinOffsetX,
				spinOffsetY,
				cueMaxContacts
			});
		}
		if (aimLineVariant === "off") return predictCueTrajectory(angle, cueBall, balls);
		if (aimLineVariant === "max") return predictExtendedCueTrajectory(angle, cueBall, balls, {
			cueMaxContacts: 64,
			targetMaxContacts: 64
		});
		return predictExtendedCueTrajectory(angle, cueBall, balls);
	}
	function initGame() {
		balls = [];
		score = 0;
		scoredBalls.clear();
		strikeAnim = null;
		impactFlash = null;
		activeCanvasPointerId = null;
		aimPointer = null;
		isDraggingAimSlider = false;
		activeAimSliderPointerId = null;
		aimSliderLastY = null;
		scoreElement.textContent = score;
		resetTray();
		const head = getHeadSpot();
		cueBall = new Ball(head.x, head.y, {
			isCueBall: true,
			mass: randomBallMass()
		});
		balls.push(cueBall);
		balls.push(...createRack());
		updateAimFromPoint(cueBall.x + CANVAS_WIDTH * .16, cueBall.y);
		resetPowerPull();
		resetSpin();
		isPullingPower = false;
		activePullPointerId = null;
		lastFrameTime = performance.now();
		wakeGameLoop();
	}
	function update(now = performance.now()) {
		const deltaMs = Math.min(now - lastFrameTime, MAX_PHYSICS_DT * 1e3);
		lastFrameTime = now;
		const frameScale = deltaMs / 1e3 * 60;
		updateStrikeAnim();
		updateImpactFlash();
		updateAimSmoothing(frameScale);
		updatePowerSmoothing(frameScale);
		stepPhysics(balls, frameScale);
		updatePocketAnimations(balls);
		balls.forEach((ball) => {
			if (ball.inPocket && !ball.isCueBall && !scoredBalls.has(ball)) {
				scoredBalls.add(ball);
				score++;
				scoreElement.textContent = score;
				addBallToTray(ball);
			}
		});
		if (isPullingPower && !canShowCue()) {
			resetPowerPull();
			isPullingPower = false;
			activePullPointerId = null;
		}
		if ((isDraggingAimSlider || aimPointer) && !canShowCue()) {
			isDraggingAimSlider = false;
			activeAimSliderPointerId = null;
			aimSliderLastY = null;
			aimTrack.classList.remove("is-dragging");
			activeCanvasPointerId = null;
			aimPointer = null;
		}
		if (isDraggingSpin && !canShowCue()) {
			isDraggingSpin = false;
			activeSpinPadPointerId = null;
			spinPad.classList.remove("is-dragging");
		}
	}
	function sceneIsAnimating() {
		if (impactFlash || strikeAnim) return true;
		if (balls.some((b) => b.isMoving() || b.isPocketing() || b.pocketFall)) return true;
		if (isPullingPower || isDraggingAimSlider || isDraggingSpin || aimPointer) return true;
		if (canShowCue()) {
			if (Math.abs(shortestAngleDelta(aimAngle, aimAngleTarget)) > 5e-5) return true;
			if (Math.abs(shotPowerTarget - shotPower) > .01) return true;
		}
		return false;
	}
	function wakeGameLoop() {
		if (!renderReady) return;
		if (!gameLoopActive) {
			gameLoopActive = true;
			scheduleGameLoop();
		}
	}
	function scheduleGameLoop() {
		if (gameLoopRafId !== null) return;
		gameLoopRafId = requestAnimationFrame(gameLoop);
	}
	function gameLoop(now) {
		gameLoopRafId = null;
		update(now);
		postRenderFrame();
		if (sceneIsAnimating()) scheduleGameLoop();
		else gameLoopActive = false;
	}
	function canvasPointerPosition(e) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: (e.clientX - rect.left) * (canvas.width / rect.width),
			y: (e.clientY - rect.top) * (canvas.height / rect.height)
		};
	}
	function handleCanvasAimMove(e) {
		if (!canShowCue() || !aimPointer) return;
		const pos = canvasPointerPosition(e);
		aimPointer.x = pos.x;
		aimPointer.y = pos.y;
		const moved = Math.hypot(pos.x - aimPointer.startX, pos.y - aimPointer.startY);
		if (aimPointer.mode === "pending" && moved >= 12) {
			aimPointer.mode = "rotate";
			aimPointer.lastAngle = Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x);
		}
		if (aimPointer.mode === "rotate") {
			const pointerAngle = Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x);
			let delta = pointerAngle - aimPointer.lastAngle;
			if (delta > Math.PI) delta -= Math.PI * 2;
			if (delta < -Math.PI) delta += Math.PI * 2;
			setAimAngleTarget(aimAngleTarget + delta);
			aimPointer.lastAngle = pointerAngle;
		}
	}
	function finishCanvasAim(e) {
		if (!aimPointer) return;
		if (e && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
		if (aimPointer.mode === "pending") {
			const elapsed = performance.now() - aimPointer.startTime;
			const moved = Math.hypot(aimPointer.x - aimPointer.startX, aimPointer.y - aimPointer.startY);
			if (elapsed <= 280 && moved < 12) updateAimFromPoint(aimPointer.x, aimPointer.y);
		}
		activeCanvasPointerId = null;
		aimPointer = null;
	}
	canvas.addEventListener("pointerdown", (e) => {
		if (!canShowCue()) return;
		wakeGameLoop();
		tryLockLandscape();
		const pos = canvasPointerPosition(e);
		canvas.setPointerCapture(e.pointerId);
		activeCanvasPointerId = e.pointerId;
		aimPointer = {
			id: e.pointerId,
			startX: pos.x,
			startY: pos.y,
			x: pos.x,
			y: pos.y,
			startTime: performance.now(),
			lastAngle: Math.atan2(pos.y - cueBall.y, pos.x - cueBall.x),
			mode: "pending"
		};
	});
	canvas.addEventListener("pointermove", (e) => {
		if (activeCanvasPointerId === null || e.pointerId !== activeCanvasPointerId) return;
		handleCanvasAimMove(e);
	});
	canvas.addEventListener("pointerup", (e) => {
		if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
		finishCanvasAim(e);
	});
	canvas.addEventListener("pointercancel", (e) => {
		if (activeCanvasPointerId !== null && e.pointerId !== activeCanvasPointerId) return;
		finishCanvasAim(e);
	});
	var lastCanvasTouchEnd = 0;
	canvas.addEventListener("touchstart", (e) => {
		if (Date.now() - lastCanvasTouchEnd <= 300) e.preventDefault();
	}, { passive: false });
	canvas.addEventListener("touchend", (e) => {
		e.preventDefault();
		lastCanvasTouchEnd = Date.now();
	}, { passive: false });
	canvas.addEventListener("gesturestart", (e) => e.preventDefault());
	var VIEWPORT_CONTENT = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
	function resetViewportScale() {
		const meta = document.querySelector("meta[name=\"viewport\"]");
		if (!meta) return;
		meta.setAttribute("content", "width=device-width, initial-scale=1.0");
		requestAnimationFrame(() => {
			meta.setAttribute("content", VIEWPORT_CONTENT);
		});
	}
	resetViewportScale();
	window.addEventListener("pageshow", resetViewportScale);
	window.addEventListener("resize", fitGameLayout);
	window.addEventListener("orientationchange", () => {
		setTimeout(fitGameLayout, 100);
	});
	powerTrack.addEventListener("pointerdown", (e) => {
		if (!canPullPower()) return;
		wakeGameLoop();
		e.preventDefault();
		powerTrack.setPointerCapture(e.pointerId);
		isPullingPower = true;
		activePullPointerId = e.pointerId;
		powerTrack.classList.add("is-pulling");
		setPowerTarget(powerFromClientY(e.clientY));
	});
	powerTrack.addEventListener("pointermove", (e) => {
		if (!isPullingPower || e.pointerId !== activePullPointerId) return;
		setPowerTarget(powerFromClientY(e.clientY));
	});
	function finishPowerPull(e) {
		if (!isPullingPower || e && e.pointerId !== activePullPointerId) return;
		if (powerTrack.hasPointerCapture(e.pointerId)) powerTrack.releasePointerCapture(e.pointerId);
		releasePowerPull();
	}
	powerTrack.addEventListener("pointerup", finishPowerPull);
	powerTrack.addEventListener("pointercancel", finishPowerPull);
	spinPad.addEventListener("pointerdown", (e) => {
		if (!canAdjustSpin()) return;
		wakeGameLoop();
		e.preventDefault();
		spinPad.setPointerCapture(e.pointerId);
		isDraggingSpin = true;
		activeSpinPadPointerId = e.pointerId;
		spinPad.classList.add("is-dragging");
		spinFromPadEvent(e);
	});
	spinPad.addEventListener("pointermove", (e) => {
		if (!isDraggingSpin || e.pointerId !== activeSpinPadPointerId) return;
		spinFromPadEvent(e);
	});
	function finishSpinDrag(e) {
		if (!isDraggingSpin || e && e.pointerId !== activeSpinPadPointerId) return;
		if (e && spinPad.hasPointerCapture(e.pointerId)) spinPad.releasePointerCapture(e.pointerId);
		isDraggingSpin = false;
		activeSpinPadPointerId = null;
		spinPad.classList.remove("is-dragging");
	}
	spinPad.addEventListener("pointerup", finishSpinDrag);
	spinPad.addEventListener("pointercancel", finishSpinDrag);
	spinResetBtn.addEventListener("click", resetSpin);
	aimTrack.addEventListener("pointerdown", (e) => {
		if (!canAdjustAim()) return;
		wakeGameLoop();
		e.preventDefault();
		aimTrack.setPointerCapture(e.pointerId);
		isDraggingAimSlider = true;
		activeAimSliderPointerId = e.pointerId;
		aimSliderLastY = e.clientY;
		aimTrack.classList.add("is-dragging");
	});
	aimTrack.addEventListener("pointermove", (e) => {
		if (!isDraggingAimSlider || e.pointerId !== activeAimSliderPointerId || aimSliderLastY === null) return;
		const deltaY = e.clientY - aimSliderLastY;
		aimSliderLastY = e.clientY;
		setAimAngleTarget(aimAngleTarget + deltaY * AIM_SLIDER_SENSITIVITY);
	});
	function finishAimSliderDrag(e) {
		if (!isDraggingAimSlider || e && e.pointerId !== activeAimSliderPointerId) return;
		if (e && aimTrack.hasPointerCapture(e.pointerId)) aimTrack.releasePointerCapture(e.pointerId);
		isDraggingAimSlider = false;
		activeAimSliderPointerId = null;
		aimSliderLastY = null;
		aimTrack.classList.remove("is-dragging");
	}
	aimTrack.addEventListener("pointerup", finishAimSliderDrag);
	aimTrack.addEventListener("pointercancel", finishAimSliderDrag);
	if (aimLineVariantBtn) {
		aimLineVariantBtn.classList.add("aim-toggle-btn");
		aimLineVariantBtn.addEventListener("click", cycleAimLineVariant);
	}
	if (aimModifierBtn) {
		aimModifierBtn.classList.add("aim-toggle-btn");
		aimModifierBtn.addEventListener("click", toggleAimModifier);
	}
	if (ballRestitutionBtn) {
		ballRestitutionBtn.classList.add("aim-toggle-btn");
		ballRestitutionBtn.addEventListener("click", toggleBallRestitutionProfile);
	}
	if (cushionRestitutionBtn) {
		cushionRestitutionBtn.classList.add("aim-toggle-btn");
		cushionRestitutionBtn.addEventListener("click", toggleCushionRestitutionProfile);
	}
	if (physicsModeBtn) {
		physicsModeBtn.classList.add("aim-toggle-btn");
		physicsModeBtn.addEventListener("click", togglePhysicsMode);
	}
	if (cushionLipBtn) {
		cushionLipBtn.classList.add("aim-toggle-btn");
		cushionLipBtn.addEventListener("click", cycleCushionLipScale);
	}
	if (spinPresetBtn) {
		spinPresetBtn.classList.add("aim-toggle-btn");
		spinPresetBtn.addEventListener("click", toggleSpinPreset);
	}
	resetBtn.addEventListener("click", () => {
		initGame();
		wakeGameLoop();
	});
	loadAimLineVariant();
	loadAimModifier();
	loadRestitutionProfiles();
	loadPhysicsMode();
	loadSpinPreset();
	loadCushionLipScale();
	updateAimLineVariantButton();
	updateAimModifierButton();
	updateBallRestitutionButton();
	updateCushionRestitutionButton();
	updatePhysicsModeButton();
	updateSpinPresetButton();
	updateCushionLipButton();
	updateAimSliderVisual();
	initPowerMarks();
	updateSpinPadVisual();
	(async () => {
		try {
			await initRenderWorker();
			hideLoadingOverlay();
			initGame();
			fitGameLayout();
			wakeGameLoop();
		} catch (err) {
			console.error(err);
			showLoadingError(err?.message || "Ошибка загрузки рендера");
		}
	})();
	window.__poolTest = {
		state() {
			const cue = cueBall;
			return {
				balls: balls.map((b) => ({
					x: b.x,
					y: b.y,
					vx: b.vx,
					vy: b.vy,
					inPocket: b.inPocket,
					isCueBall: b.isCueBall,
					number: b.number,
					moving: b.isMoving(),
					pocketing: b.isPocketing(),
					spin: b.spin,
					topSpin: b.topSpin,
					slide: b.slide || 0
				})),
				score: scoreElement?.textContent ?? "0",
				cue: cue ? {
					x: cue.x,
					y: cue.y,
					vx: cue.vx,
					vy: cue.vy,
					moving: cue.isMoving(),
					inPocket: cue.inPocket,
					pocketing: cue.isPocketing(),
					spin: cue.spin,
					topSpin: cue.topSpin,
					slide: cue.slide || 0
				} : null
			};
		},
		pockets() {
			return getPockets().map((p) => ({
				id: p.id,
				x: p.x,
				y: p.y,
				r: p.radius
			}));
		},
		playSurface() {
			const s = getPlaySurface();
			return {
				left: s.left,
				top: s.top,
				right: s.right,
				bottom: s.bottom
			};
		},
		setup({ cueX, cueY, withRack = false, extraBalls = [] } = {}) {
			initGame();
			if (!withRack) balls = balls.filter((b) => b.isCueBall);
			cueBall.x = cueX ?? cueBall.x;
			cueBall.y = cueY ?? cueBall.y;
			cueBall.vx = 0;
			cueBall.vy = 0;
			cueBall.spin = 0;
			cueBall.topSpin = 0;
			cueBall.slide = 0;
			cueBall.inPocket = false;
			cueBall.pocketFall = null;
			strikeAnim = null;
			for (const b of extraBalls) balls.push(new Ball(b.x, b.y, {
				number: b.number ?? 1,
				color: b.color
			}));
			resetSpin();
			resetPowerPull();
		},
		fire({ angle, power = 60, spinX = 0, spinY = 0 }) {
			spinOffsetX = spinX * MAX_SPIN_OFFSET;
			spinOffsetY = spinY * MAX_SPIN_OFFSET;
			const p = power / 100 * 115 * POWER_FACTOR;
			cueBall.vx = Math.cos(angle) * p;
			cueBall.vy = Math.sin(angle) * p;
			applySpinToCueBall(p, angle);
		},
		simulate(maxSteps = 4e3) {
			const surface = getPlaySurface();
			const r = 11;
			const events = [];
			const path = [];
			let prevVx = cueBall.vx;
			let prevVy = cueBall.vy;
			let bounceCount = 0;
			for (let step = 0; step < maxSteps; step++) {
				cueBall.x;
				cueBall.y;
				stepPhysics(balls, 1);
				updatePocketAnimations(balls);
				if (cueBall.x < surface.left - r * .5 || cueBall.x > surface.right + r * .5 || cueBall.y < surface.top - r * .5 || cueBall.y > surface.bottom + r * .5) {
					events.push({
						type: "escaped",
						step,
						x: cueBall.x,
						y: cueBall.y
					});
					break;
				}
				const speedBefore = Math.hypot(prevVx, prevVy);
				const dotPrev = prevVx * cueBall.vx + prevVy * cueBall.vy;
				if (speedBefore > 1.2 && dotPrev < 0 && Math.hypot(cueBall.vx, cueBall.vy) > .4) {
					bounceCount++;
					events.push({
						type: "bounce",
						step,
						x: cueBall.x,
						y: cueBall.y,
						vx: cueBall.vx,
						vy: cueBall.vy,
						n: bounceCount
					});
				}
				if (cueBall.inPocket || cueBall.isPocketing()) {
					events.push({
						type: "pocketed",
						step,
						x: cueBall.x,
						y: cueBall.y
					});
					break;
				}
				for (const b of balls) if (!b.isCueBall && (b.inPocket || b.isPocketing())) events.push({
					type: "object_pocketed",
					step,
					number: b.number,
					x: b.x,
					y: b.y
				});
				prevVx = cueBall.vx;
				prevVy = cueBall.vy;
				if (step % 8 === 0) path.push({
					x: +cueBall.x.toFixed(1),
					y: +cueBall.y.toFixed(1)
				});
				if (!balls.some((b) => !b.inPocket && b.isMoving())) break;
			}
			return {
				events,
				path,
				bounces: events.filter((e) => e.type === "bounce").length,
				pocketed: events.some((e) => e.type === "pocketed"),
				objectPocketed: events.some((e) => e.type === "object_pocketed"),
				escaped: events.some((e) => e.type === "escaped"),
				final: this.state()
			};
		}
	};
})))();
//#endregion

//# sourceMappingURL=index-XYbNx0NX.js.map