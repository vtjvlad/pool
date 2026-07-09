import { vec3, quat } from 'gl-matrix';

const _v = vec3.create();
const _q = quat.create();
const _qa = quat.create();
const _qb = quat.create();

function quatFromObject(qObj, out = _q) {
    return quat.set(out, qObj.x, qObj.y, qObj.z, qObj.w);
}

export function quatToObject(q) {
    return { x: q[0], y: q[1], z: q[2], w: q[3] };
}

export function rotateVec(qObj, x, y, z) {
    const q = quatFromObject(qObj);
    vec3.set(_v, x, y, z);
    vec3.transformQuat(_v, _v, q);
    return [_v[0], _v[1], _v[2]];
}

export function quatMultiply(aObj, bObj) {
    quat.multiply(_q, quatFromObject(aObj, _qa), quatFromObject(bObj, _qb));
    return quatToObject(_q);
}

export function quatNormalize(qObj) {
    quat.normalize(_q, quatFromObject(qObj));
    return quatToObject(_q);
}

export function quatConjugate(qObj) {
    quat.conjugate(_q, quatFromObject(qObj));
    return quatToObject(_q);
}

export function quatFromRotation(rx, ry, rz) {
    const angle = Math.hypot(rx, ry, rz);
    if (angle < 1e-10) {
        return { w: 1, x: 0, y: 0, z: 0 };
    }
    const half = angle * 0.5;
    const s = Math.sin(half) / angle;
    return quatNormalize({
        w: Math.cos(half),
        x: rx * s,
        y: ry * s,
        z: rz * s
    });
}

export { vec3, quat };
