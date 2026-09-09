import { rectsOverlap } from "../utils/math.js";

export function resolvePlayerPlatforms(player, oldY, platforms) {
    player.grounded = false;

    for (const p of platforms) {
        const horizontal = player.x + player.w > p.x && player.x < p.x + p.w;
        const previousBottom = oldY + player.h;
        const currentBottom = player.y + player.h;

        if (horizontal && player.vy >= 0 && previousBottom <= p.y && currentBottom >= p.y) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.grounded = true;
        }
    }

    if (player.y + player.h > 880) {
        player.y = 560 - player.h;
        player.vy = 0;
        player.grounded = true;
    }
}

export function resolveEnemyPlatforms(enemy, oldY, platforms) {
    enemy.grounded = false;

    for (const p of platforms) {
        if (
            enemy.x + enemy.w > p.x &&
            enemy.x < p.x + p.w &&
            enemy.vy >= 0 &&
            oldY + enemy.h <= p.y &&
            enemy.y + enemy.h >= p.y
        ) {
            enemy.y = p.y - enemy.h;
            enemy.vy = 0;
            enemy.grounded = true;
        }
    }
}

export function checkPlayerShardCollisions(player, shards, onCollect) {
    for (const s of shards) {
        if (s.collected) continue;
        s.spin += 0.04;
        const dx = player.x + player.w / 2 - s.x;
        const dy = player.y + player.h / 2 - s.y;
        if (Math.hypot(dx, dy) < 45) {
            s.collected = true;
            onCollect(s);
        }
    }
}

export function checkGateCollision(player, gate, onEnterGate) {
    if (gate && gate.open && rectsOverlap(player, gate)) {
        onEnterGate();
    }
}