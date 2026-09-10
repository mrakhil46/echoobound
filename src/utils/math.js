export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function rand(a, b) {
    return Math.random() * (b - a) + a;
}

export function randInt(a, b) {
    return Math.floor(rand(a, b + 1));
}

export function rectsOverlap(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}