import { rand, randInt } from "../utils/math.js";

export const particles = [];

export function createHitParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x,
            y,
            vx: rand(-3, 3),
            vy: rand(-3, 3),
            life: randInt(10, 25),
            maxLife: 25,
            size: rand(2, 5),
            type: "hit"
        });
    }
}

export function createMuzzleFlash(x, y, angle) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x,
            y,
            vx: Math.cos(angle) + rand(-1, 1),
            vy: Math.sin(angle) + rand(-1, 1),
            life: randInt(8, 16),
            maxLife: 16,
            size: rand(2, 6),
            type: "flash"
        });
    }
}

export function createDeathParticles(x, y, isBoss) {
    const count = isBoss ? 45 : 15;
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: rand(-4, 4),
            vy: rand(-5, 2),
            life: randInt(20, 50),
            maxLife: 50,
            size: rand(2, 7),
            type: "death"
        });
    }
}

export function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}