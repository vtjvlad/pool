/**
 * legacy/const-legacy.js
 * Архив вытесненных констант и функций. Не подключать к сборке.
 * Создан при миграции на gl-matrix (Vite).
 */

// ── quatNormalize ──────────────────────────────────────────
// Было: public/ball.js, локальная function (стр. ~46)
// Назначение: нормализация кватерниона { w, x, y, z }
// Вызывалось из: applyRotationVector
// Заменено на: public/math3d.js → quatNormalize() (gl-matrix)
function quatNormalize(q) {
    const len = Math.hypot(q.w, q.x, q.y, q.z) || 1;
    return { w: q.w / len, x: q.x / len, y: q.y / len, z: q.z / len };
}

// ── quatMultiply ───────────────────────────────────────────
// Было: public/ball.js, локальная function (стр. ~51)
// Назначение: произведение двух кватернионов { w, x, y, z }
// Вызывалось из: applyRotationVector
// Заменено на: public/math3d.js → quatMultiply() (gl-matrix)
function quatMultiply(a, b) {
    return {
        w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
        x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
    };
}

// ── quatConjugate ──────────────────────────────────────────
// Было: public/ball.js, локальная function (стр. ~60)
// Назначение: сопряжённый кватернион (инверсия вращения)
// Вызывалось из: drawStripeSphere, drawCueMarks (invQ = quatConjugate(orientation))
// Заменено на: public/math3d.js → quatConjugate() (gl-matrix)
function quatConjugate(q) {
    return { w: q.w, x: -q.x, y: -q.y, z: -q.z };
}

// ── rotateVec ──────────────────────────────────────────────
// Было: public/ball.js, локальная function (стр. ~91)
// Назначение: поворот локального 3D-вектора кватернионом ориентации шара
// Вызывалось из: projectSurfacePoint, projectSurfacePointFade, drawStripeSphere, drawCueMarks
// Заменено на: public/math3d.js → rotateVec() (gl-matrix vec3.transformQuat)
function rotateVec(q, x, y, z) {
    const tx = 2 * (q.y * z - q.z * y);
    const ty = 2 * (q.z * x - q.x * z);
    const tz = 2 * (q.x * y - q.y * x);
    return [
        x + q.w * tx + (q.y * tz - q.z * ty),
        y + q.w * ty + (q.z * tx - q.x * tz),
        z + q.w * tz + (q.x * ty - q.y * tx)
    ];
}

// ── applyRotationVector (inline delta-quat) ─────────────────
// Было: public/ball.js, Ball.applyRotationVector (стр. ~432–435)
// Назначение: построение delta-кватерниона из вектора вращения (rx, ry, rz) через half-angle
// Вызывалось из: advanceRoll (omegaX/Y/Z * dt)
// Заменено на: public/math3d.js → quatFromRotation(rx, ry, rz)
function buildDeltaQuatFromRotationVector(rx, ry, rz) {
    const angle = Math.hypot(rx, ry, rz);
    if (angle < 1e-10) return { w: 1, x: 0, y: 0, z: 0 };

    const half = angle * 0.5;
    const s = Math.sin(half) / angle;
    const c = Math.cos(half);
    return { w: c, x: rx * s, y: ry * s, z: rz * s };
}
