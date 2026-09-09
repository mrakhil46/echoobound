import { clamp, rand, rectsOverlap } from "../utils/math.js";
import { LEVELS } from "../config/levels.js";
import { gameState } from "../state/game.js";
import { gainXP } from "../state/player.js";
import { resolveEnemyPlatforms } from "../systems/collisions.js";
import { createDeathParticles, createHitParticles } from "../systems/particles.js";
import { enemyBullets } from "./bullet.js";
import { showMessage } from "../render/hud.js";
import { playSound } from "../systems/audio.js";

export const enemies = [];

export function spawnEnemies(worldWidth) {
    enemies.length = 0;
    const data = LEVELS[gameState.levelIndex];
    const count = data.enemyCount;

    for (let i = 0; i < count; i++) {
        const x = 850 + (i * (worldWidth - 1400)) / Math.max(1, count - 1);
        const type = i % 3 === 0 ? "crawler" : i % 3 === 1 ? "sentinel" : "mimic";
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
        y: 380,
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
        anim: rand(0, 10)
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
        base.health = 115;
        base.maxHealth = 115;
        base.speed = 1;
    }
    return base;
}

export function spawnBoss(worldWidth) {
    enemies.push({
        type: "warden",
        x: worldWidth - 1050,
        y: 300,
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

export function damageEnemy(enemy, amount) {
    if (enemy.dead) return;
    enemy.health -= amount;
    enemy.hitFlash = 5;
    createHitParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    playSound("hit");

    if (enemy.health <= 0) {
        killEnemy(enemy);
    }
}

export function killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    gameState.score += enemy.boss ? 5000 : 150;
    gainXP(enemy.boss ? 1000 : 100);
    createDeathParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.boss);

    if (enemy.boss) {
        showMessage("RIFT WARDEN DESTROYED", 100);
    }
}

export function updateEnemies(player, platforms, worldWidth, onDamagePlayer) {
    for (const enemy of enemies) {
        if (enemy.dead) continue;
        enemy.anim += 0.1;
        const dx = player.x - enemy.x;
        const distance = Math.abs(dx);

        if (enemy.type === "warden") {
            updateBoss(enemy, player, onDamagePlayer);
            continue;
        }

        if (distance < 900) {
            enemy.vx = Math.sign(dx) * enemy.speed;
            if (distance < 480) enemy.attack--;

            if (enemy.attack <= 0 && distance < 650) {
                enemy.attack = enemy.type === "sentinel" ? 110 : 150;
                fireEnemy(enemy, player);
            }
        } else {
            enemy.vx *= 0.92;
        }

        const oldY = enemy.y;
        enemy.vy += 0.65;
        enemy.vy = Math.min(enemy.vy, 16);
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.x = clamp(enemy.x, 0, worldWidth - enemy.w);

        resolveEnemyPlatforms(enemy, oldY, platforms);

        if (rectsOverlap(player, enemy)) {
            onDamagePlayer(enemy.type === "crawler" ? 12 : 18);
        }
        if (enemy.hitFlash > 0) enemy.hitFlash--;
    }
}

function updateBoss(enemy, player, onDamagePlayer) {
    const dx = player.x - enemy.x;
    enemy.vx = Math.sign(dx) * enemy.speed;
    enemy.vy += 0.4;
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;

    if (enemy.y + enemy.h > 500) {
        enemy.y = 500 - enemy.h;
        enemy.vy = -10;
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

function fireEnemy(enemy, player) {
    const sx = enemy.x + enemy.w / 2;
    const sy = enemy.y + enemy.h / 2;
    const angle = Math.atan2(player.y + player.h / 2 - sy, player.x + player.w / 2 - sx);

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