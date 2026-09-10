import { showMessage } from "../render/hud.js";
import { bullets } from "./bullet.js";
import { player } from "../state/player.js";
import { gameState } from "../state/game.js";
import { playSound } from "../systems/audio.js";
import { createHitParticles } from "../systems/particles.js";

export const echoes = [];

export function activateEcho() {
    if (!gameState.gameRunning) return;

    // If already recording, stop recording and deploy the captured echo.
    if (player.echoRecording) {
        player.echoRecording = false;
        if (player.echoFrames.length > 5) {
            deployEcho(player.echoFrames.slice());
            showMessage("ECHO DEPLOYED", 50);
        }
        player.echoFrames = [];
        player.echoTimer = 0;
        return;
    }

    // If an echo exists, swap positions with the newest recorded echo.
    if (echoes.length > 0) {
        const targetEcho = echoes[echoes.length - 1];

        const oldPlayerX = player.x;
        const oldPlayerY = player.y;

        const echoTargetX = oldPlayerX + player.w / 2;
        const echoTargetY = oldPlayerY + player.h / 2;
        const shiftX = echoTargetX - targetEcho.x;
        const shiftY = echoTargetY - targetEcho.y;

        player.x = targetEcho.x - player.w / 2;
        player.y = targetEcho.y - player.h;
        player.vx = 0;
        player.vy = 0;
        player.grounded = false;
        player.justTeleported = true;

        targetEcho.x = echoTargetX;
        targetEcho.y = echoTargetY;

        for (let i = targetEcho.frame; i < targetEcho.frames.length; i++) {
            if (typeof targetEcho.frames[i].x === "number") {
                targetEcho.frames[i].x += shiftX;
                targetEcho.frames[i].y += shiftY;
            }
        }

        createHitParticles(player.x + player.w / 2, player.y + player.h / 2);
        playSound("shard");
        showMessage("ECHO PHASE SWAP", 40);
        return;
    }

    // Otherwise start a new recording.
    if (player.energy < 25) {
        showMessage("NOT ENOUGH ENERGY", 40);
        return;
    }

    player.energy -= 25;
    player.echoRecording = true;
    player.echoFrames = [];
    player.echoTimer = 0;
    showMessage("RECORDING ECHO...", 40);
}

export function deployEcho(frames) {
    const initialFrame = frames[0] || { x: player.x, y: player.y };
    echoes.push({
        x: initialFrame.x + player.w / 2,
        y: initialFrame.y + player.h / 2,
        w: player.w,
        h: player.h,
        health: 80,
        frames,
        frame: 0,
        life: frames.length,
        fireTimer: 0
    });
}

export function updateEchoes() {
    for (let i = echoes.length - 1; i >= 0; i--) {
        const echo = echoes[i];

        if (echo.frame >= echo.frames.length || echo.health <= 0) {
            createHitParticles(echo.x, echo.y);
            echoes.splice(i, 1);
            continue;
        }

        const f = echo.frames[echo.frame];
        if (f) {
            if (typeof f.x === "number" && typeof f.y === "number") {
                echo.x = f.x + player.w / 2;
                echo.y = f.y + player.h / 2;
            }

            if (f.fire && echo.fireTimer <= 0) {
                let angle = 0;
                if (typeof f.aimX === "number" && typeof f.aimY === "number") {
                    angle = Math.atan2(f.aimY - echo.y, f.aimX - echo.x);
                } else if (f.dx !== undefined) {
                    angle = Math.atan2(f.dy, f.dx);
                }

                bullets.push({
                    x: echo.x,
                    y: echo.y,
                    vx: Math.cos(angle) * 12,
                    vy: Math.sin(angle) * 12,
                    life: 70,
                    damage: 20,
                    size: 3,
                    weapon: 0,
                    echo: true
                });
                echo.fireTimer = 10;
            }
        }
        echo.fireTimer--;
        echo.frame++;
    }
}