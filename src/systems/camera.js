import { clamp, lerp, rand } from "../utils/math.js";
import { mouse } from "./input.js";

export const camera = {
    x: 0,
    y: 0,
    shake: 0
};

export function addShake(amount) {
    camera.shake = Math.min(8, camera.shake + amount);
}

export function updateCamera(player, worldWidth, viewportW, viewportH) {
    const targetX = player.x - viewportW * 0.42;
    const targetY = player.y - viewportH * 0.52;

    camera.x = lerp(camera.x, targetX, 0.09);
    camera.y = lerp(camera.y, targetY, 0.08);

    camera.x = clamp(camera.x, 0, Math.max(0, worldWidth - viewportW));
    camera.y = clamp(camera.y, 0, 300);

    mouse.worldX = mouse.screenX + camera.x;
    mouse.worldY = mouse.screenY + camera.y;

    if (camera.shake > 0) {
        camera.shake *= 0.85;
        if (camera.shake < 0.1) camera.shake = 0;
    }
}

export function getCameraShakeOffset() {
    if (camera.shake <= 0) return { sx: 0, sy: 0 };
    return {
        sx: rand(-camera.shake, camera.shake),
        sy: rand(-camera.shake, camera.shake)
    };
}