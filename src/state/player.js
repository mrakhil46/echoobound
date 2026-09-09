import { clamp, lerp } from "../utils/math.js";
import { gameState } from "./game.js";
import { WEAPONS } from "../config/weapons.js";
import { keys, mobile, mouse } from "../systems/input.js";
import { addShake } from "../systems/camera.js";
import { createHitParticles } from "../systems/particles.js";
import { showMessage } from "../render/hud.js";

export const player = {
    x: 300,
    y: 400,
    w: 46,
    h: 72,
    vx: 0,
    vy: 0,
    speed: 5.2,
    jump: 14,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    fireCooldown: 0,
    invincible: 0,
    grounded: false,
    facing: 1,
    echoRecording: false,
    echoFrames: [],
    echoTimer: 0,
    gunFlash: 0,
    anim: 0
};

export function resetPlayer() {
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.x = 260;
    player.y = 350;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.echoRecording = false;
    player.echoFrames = [];
    player.echoTimer = 0;
}

export function switchWeapon() {
    if (!gameState.gameRunning) return;
    gameState.weaponIndex = (gameState.weaponIndex + 1) % WEAPONS.length;
    showMessage("WEAPON: " + WEAPONS[gameState.weaponIndex].name, 40);
}

export function gainXP(amount) {
    gameState.xp += amount;
    const needed = 300 + (gameState.playerLevel - 1) * 220;
    if (gameState.xp >= needed) {
        gameState.xp -= needed;
        gameState.playerLevel++;
        player.maxHealth += 10;
        player.health = player.maxHealth;
        player.maxEnergy += 10;
        player.energy = player.maxEnergy;
        showMessage("LEVEL UP — LEVEL " + gameState.playerLevel, 70);
    }
}

export function damagePlayer(amount, onGameOver) {
    if (player.invincible > 0) return;
    player.health -= amount;
    player.invincible = 45;
    addShake(8);
    createHitParticles(player.x + player.w / 2, player.y + player.h / 2);

    if (player.health <= 0) {
        player.health = 0;
        if (onGameOver) onGameOver();
    }
}

export function updatePlayer(worldWidth, onShoot, onDeployEcho) {
    let move = 0;
    if (keys["KeyA"] || keys["ArrowLeft"]) move -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) move += 1;
    if (Math.abs(mobile.moveX) > 0.1) move = mobile.moveX;

    if (move !== 0) {
        player.facing = move > 0 ? 1 : -1;
    }

    player.vx = lerp(player.vx, move * player.speed, 0.18);

    if ((keys["Space"] || keys["KeyW"] || keys["ArrowUp"] || mobile.jump) && player.grounded) {
        player.vy = -player.jump;
        player.grounded = false;
    }

    player.vy += 0.65;
    player.vy = Math.min(player.vy, 18);

    player.x += player.vx;
    player.y += player.vy;
    player.x = clamp(player.x, 0, worldWidth - player.w);

    if (player.fireCooldown > 0) player.fireCooldown--;
    if (player.invincible > 0) player.invincible--;
    if (player.gunFlash > 0) player.gunFlash--;

    player.energy = Math.min(player.maxEnergy, player.energy + 0.12);
    player.anim += 0.12;

    if (mouse.down || mobile.fire) onShoot();

    if (player.echoRecording) {
        player.echoTimer++;
        player.echoFrames.push({
            move: player.vx,
            jump: player.vy,
            x: player.x,
            y: player.y,
            fire: mouse.down || mobile.fire,
            aimX: mouse.worldX,
            aimY: mouse.worldY
        });

        if (player.echoTimer >= 300) {
            player.echoRecording = false;
            if (player.echoFrames.length) {
                onDeployEcho(player.echoFrames.slice());
            }
            player.echoFrames = [];
            player.echoTimer = 0;
            showMessage("ECHO AUTOMATICALLY DEPLOYED", 60);
        }
    }
}