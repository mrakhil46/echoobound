import { clamp, rand, rectsOverlap, randInt } from "../utils/math.js";
import { LEVELS } from "../config/levels.js";
import { WEAPONS } from "../config/weapons.js";
import { gameState, triggerHitStop } from "../state/game.js";
import { gainXP } from "../state/player.js";
import { resolveEnemyPlatforms } from "../systems/collisions.js";
import { createDeathParticles, createHitParticles } from "../systems/particles.js";
import { enemyBullets } from "./bullet.js";
import { showMessage } from "../render/hud.js";
import { playSound } from "../systems/audio.js";
import { echoes } from "./echo.js";

export const enemies = [];

export function spawnEnemies(worldWidth) {
    enemies.length = 0;
    const data = LEVELS[gameState.levelIndex];
    const count = data.enemyCount;

    for (let i = 0; i < count; i++) {
        const x = 850 + (i * (worldWidth - 1400)) / Math.max(1, count - 1);
        const types = ["crawler", "sentinel", "mimic", "drone"];
        const type = types[i % types.length];
        enemies.push(createEnemy(type, x));
    }

    if (data.boss) {
        spawnBoss(worldWidth);
    }
}

export function createEnemy(type, x) {
    const base = {
        type,
        x,
        y: type === "drone" ? randInt(500, 900) : 1300,
        w: 48,
        h: 64,
        vx: 0,
        vy: 0,
        health: 100,
        maxHealth: 100,
        speed: 1.2,
        attack: 0,
        grounded: false,
        dead: false,
        hitFlash: 0,
        anim: rand(0, 10),
        clonedWeapon: 0 // Mimic active gun index
    };

    if (type === "crawler") {
        base.w = 62;
        base.h = 42;
        base.health = 75;
        base.maxHealth = 75;
        base.speed = 1.7;
    } else if (type === "sentinel") {
        base.w = 50;
        base.h = 78;
        base.health = 150;
        base.maxHealth = 150;
        base.speed = 0.75;
    } else if (type === "mimic") {
        base.w = 54;
        base.h = 68;
        base.health = 120;
        base.maxHealth = 120;
        base.speed = 1.4;
    } else if (type === "drone") {
        base.w = 40;
        base.h = 36;
        base.health = 60;
        base.maxHealth = 60;
        base.speed = 2.2;
    }
    return base;
}

export function spawnBoss(worldWidth) {
    enemies.push({
        type: "warden",
        x: worldWidth - 1050,
        y: 1100,
        w: 110,
        h: 150,
        vx: 0,
        vy: 0,
        health: 1200,
        maxHealth: 1200,
        speed: 0.65,
        attack: 100,
        grounded: false,
        dead: false,
        hitFlash: 0,
        anim: 0,
        boss: true
    });
}

export function updateEnemies(player, platforms, worldWidth, onDamagePlayer) {
    for (const enemy of enemies) {
        if (enemy.dead) continue;
        enemy.anim += 0.1;

        const target = getClosestTarget(enemy, player);
        const dx = target.x - (enemy.x + enemy.w / 2);
        const dy = target.y - (enemy.y + enemy.h / 2);
        const distance = Math.hypot(dx, dy);

        if (enemy.type === "warden") {
            updateBoss(enemy, player, onDamagePlayer);
            continue;
        }

        // Flying Drone AI: Floats, hovers at a vertical distance, dive-bombs/shoots
        if (enemy.type === "drone") {
            const hoverY = target.y - 180 + Math.sin(enemy.anim * 1.5) * 40;
            enemy.vx = lerp(enemy.vx, Math.sign(dx) * enemy.speed, 0.05);
            enemy.vy = lerp(enemy.vy, Math.sign(hoverY - enemy.y) * enemy.speed, 0.05);

            enemy.x += enemy.vx;
            enemy.y += enemy.vy;

            enemy.attack--;
            if (enemy.attack <= 0 && distance < 650) {
                enemy.attack = 90;
                fireDrone(enemy, target);
            }
        } 
        // Ground-based enemies
        else {
            if (distance < 900) {
                enemy.vx = Math.sign(dx) * enemy.speed;
                if (distance < 550) enemy.attack--;

                if (enemy.attack <= 0) {
                    // Mimic copies player weapon rate & ammo style
                    if (enemy.type === "mimic") {
                        enemy.clonedWeapon = gameState.weaponIndex;
                        const copiedWep = WEAPONS[enemy.clonedWeapon];
                        enemy.attack = copiedWep.cooldown * 1.5;
                        fireMimicCopiedWeapon(enemy, target, copiedWep);
                    } else {
                        enemy.attack = enemy.type === "sentinel" ? 110 : 140;
                        fireEnemyAtTarget(enemy, target);
                    }
                }
            } else {
                enemy.vx *= 0.92;
            }

            // Only ground-based enemies receive gravity and platform collision
            if (enemy.type !== "drone") {
                const oldY = enemy.y;
                enemy.vy += 0.65;
                enemy.vy = Math.min(enemy.vy, 16);
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;
                enemy.x = clamp(enemy.x, 0, worldWidth - enemy.w);

                resolveEnemyPlatforms(enemy, oldY, platforms);
            } else {
                // Drone floating physics
                enemy.x = clamp(enemy.x, 0, worldWidth - enemy.w);
                enemy.y = clamp(enemy.y, 200, 1300);
            }
        }

        // Collisions
        if (rectsOverlap(player, enemy)) {
            onDamagePlayer(enemy.type === "crawler" ? 14 : 18);
        }
        for (const echo of echoes) {
            const echoRect = { x: echo.x - echo.w / 2, y: echo.y - echo.h / 2, w: echo.w, h: echo.h };
            if (rectsOverlap(echoRect, enemy)) {
                echo.health -= 1.5;
            }
        }

        if (enemy.hitFlash > 0) enemy.hitFlash--;
    }
}

function fireDrone(enemy, target) {
    const sx = enemy.x + enemy.w / 2;
    const sy = enemy.y + enemy.h / 2;
    const angle = Math.atan2(target.y - sy, target.x - sx);

    enemyBullets.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        life: 110,
        damage: 10,
        size: 4
    });
}

function fireMimicCopiedWeapon(enemy, target, wep) {
    const sx = enemy.x + enemy.w / 2;
    const sy = enemy.y + enemy.h / 2;
    const angle = Math.atan2(target.y - sy, target.x - sx) + rand(-wep.spread, wep.spread);

    enemyBullets.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * (wep.speed * 0.75),
        vy: Math.sin(angle) * (wep.speed * 0.75),
        life: 120,
        damage: Math.floor(wep.damage * 0.4),
        size: wep.size
    });
}

function updateBoss(enemy, player, onDamagePlayer) {
    const dx = player.x - enemy.x;
    enemy.vx = Math.sign(dx) * enemy.speed;
    enemy.vy += 0.4;
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;

    if (enemy.y + enemy.h >= 1400) {
        enemy.y = 1400 - enemy.h;
        enemy.vy = 0;
        enemy.grounded = true;
        if (Math.random() < 0.02) {
            enemy.vy = -11;
            enemy.grounded = false;
        }
    }

    enemy.attack--;
    if (enemy.attack <= 0) {
        enemy.attack = 80;
        for (let i = -1; i <= 1; i++) {
            const startX = enemy.x + enemy.w / 2;
            const startY = enemy.y + 60;
            const angle = Math.atan2(player.y + 30 - startY, player.x + 20 - startX) + i * 0.18;

            enemyBullets.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                life: 130,
                damage: 18,
                size: 7
            });
        }
    }

    if (rectsOverlap(player, enemy)) {
        onDamagePlayer(25);
    }
    if (enemy.hitFlash > 0) enemy.hitFlash--;
}

function fireEnemyAtTarget(enemy, target) {
    const sx = enemy.x + enemy.w / 2;
    const sy = enemy.y + enemy.h / 2;
    const angle = Math.atan2(target.y - sy, target.x - sx);

    enemyBullets.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        life: 140,
        damage: enemy.type === "sentinel" ? 12 : 9,
        size: 5
    });
}

function getClosestTarget(enemy, player) {
    let target = {
        x: player.x + player.w / 2,
        y: player.y + player.h / 2,
        ref: player,
        isEcho: false
    };
    let minDistance = Math.hypot(enemy.x - target.x, enemy.y - target.y);

    for (const echo of echoes) {
        const dist = Math.hypot(enemy.x - echo.x, enemy.y - echo.y);
        if (dist < minDistance || dist < 500) {
            minDistance = dist;
            target = {
                x: echo.x,
                y: echo.y,
                ref: echo,
                isEcho: true
            };
        }
    }
    return target;
}

export function damageEnemy(enemy, amount, onBossDefeated) {
    if (enemy.dead) return;
    enemy.health -= amount;
    enemy.hitFlash = 5;
    createHitParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    playSound("hit");

    if (enemy.health <= 0) {
        killEnemy(enemy, onBossDefeated);
    }
}

export function killEnemy(enemy, onBossDefeated) {
    if (enemy.dead) return;
    enemy.dead = true;
    gameState.score += enemy.boss ? 5000 : 150;
    gainXP(enemy.boss ? 1000 : 100);
    createDeathParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.boss);

    if (enemy.boss) {
        triggerHitStop(10);
        showMessage("RIFT WARDEN DESTROYED — CORE UNLOCKED", 120);
        if (onBossDefeated) onBossDefeated();
    } else {
        triggerHitStop(2);
    }
}