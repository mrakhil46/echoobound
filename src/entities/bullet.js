import { rand, rectsOverlap } from "../utils/math.js";
import { WEAPONS } from "../config/weapons.js";
import { createMuzzleFlash } from "../systems/particles.js";
import { addShake } from "../systems/camera.js";
import { showMessage } from "../render/hud.js";
import { playSound } from "../systems/audio.js";
import { echoes } from "./echo.js";
import { triggerHitStop } from "../state/game.js";

export const bullets = [];
export const enemyBullets = [];

export function shoot(player, gameState, mobile, mouse) {
    if (!gameState.gameRunning) return;
    if (player.fireCooldown > 0) return;

    const weapon = WEAPONS[gameState.weaponIndex];
    if (player.energy < weapon.energy) {
        showMessage("ENERGY LOW", 20);
        return;
    }

    player.energy -= weapon.energy;
    player.fireCooldown = weapon.cooldown;
    player.gunFlash = 5;

    const startX = player.x + player.w / 2 + player.facing * 28;
    const startY = player.y + 30;

    let targetX, targetY;
    if (Math.abs(mobile.aimX) > 0.12 || Math.abs(mobile.aimY) > 0.12) {
        targetX = startX + mobile.aimX * 650;
        targetY = startY + mobile.aimY * 650;
    } else {
        targetX = mouse.worldX;
        targetY = mouse.worldY;
    }

    let dx = targetX - startX;
    let dy = targetY - startY;
    const distance = Math.hypot(dx, dy);

    if (distance < 1) {
        dx = player.facing;
        dy = 0;
    } else {
        dx /= distance;
        dy /= distance;
    }

    let angle = Math.atan2(dy, dx) + rand(-weapon.spread, weapon.spread);

    bullets.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * weapon.speed,
        vy: Math.sin(angle) * weapon.speed,
        life: 90,
        damage: weapon.damage,
        size: weapon.size,
        weapon: gameState.weaponIndex
    });

    player.vx -= Math.cos(angle) * weapon.recoil;
    if (Math.sin(angle) > 0.4 && !player.grounded) {
        player.vy -= Math.sin(angle) * (weapon.recoil * 0.4); // Slight rocket-jump effect
    }

    createMuzzleFlash(startX, startY, angle);
    addShake(2);
    playSound("shoot");

    if (player.echoRecording) {
        player.echoFrames.push({
            dx: Math.cos(angle),
            dy: Math.sin(angle)
        });
    }
}

export function updateBullets(worldWidth, enemies, onDamageEnemy) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        let remove = b.life <= 0 || b.x < -200 || b.x > worldWidth + 200 || b.y < -200 || b.y > 1000;

        if (!remove) {
            for (const enemy of enemies) {
                if (enemy.dead) continue;
                const hitbox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
                const point = { x: b.x - b.size, y: b.y - b.size, w: b.size * 2, h: b.size * 2 };

                if (rectsOverlap(point, hitbox)) {
                    if(b.weapon === 2){
                        triggerHitStop(5);
                    }
                    onDamageEnemy(enemy, b.damage);
                    remove = true;
                    break;
                }
            }
        }
        if (remove) bullets.splice(i, 1);
    }
}

export function updateEnemyBullets(worldWidth, player, onDamagePlayer) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        const point = { x: b.x - b.size, y: b.y - b.size, w: b.size * 2, h: b.size * 2 };

        if (rectsOverlap(point, player)) {
            onDamagePlayer(b.damage);
            enemyBullets.splice(i, 1);
            continue;
        }

        for (const echo of echoes) {
            const echoHitbox = {
                x: echo.x - echo.w / 2,
                y: echo.y - echo.h / 2,
                w: echo.w,
                h: echo.h
            };
            if (rectsOverlap(point, echoHitbox)) {
                echo.health -= b.damage;
                b.life = 0; // Marks bullet for removal
                break;
            }
        }

        if (b.life <= 0 || b.x < -200 || b.x > worldWidth + 200 || b.y < -200 || b.y > 1000) {
            enemyBullets.splice(i, 1);
        }
    }
}