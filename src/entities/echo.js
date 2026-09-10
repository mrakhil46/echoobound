import { showMessage } from "../render/hud.js";
import { bullets } from "./bullet.js";
import { player } from "../state/player.js";
import { gameState } from "../state/game.js";
import { playSound } from "../systems/audio.js";
import { createHitParticles } from "../systems/particles.js";

export const echoes = [];

export function activateEcho() {
    if (!gameState.gameRunning) return;

    // 1. If an Echo exists, pressing E swaps position with the newest Echo
    if (echoes.length > 0 && !player.echoRecording) {
        const targetEcho = echoes[echoes.length - 1];

        const tempX = player.x;
        const tempY = player.y;

        player.x = targetEcho.x - player.w / 2;
        player.y = targetEcho.y - player.h / 2;
        player.vx = 0;
        player.vy = 0;

        targetEcho.x = tempX + player.w / 2;
        targetEcho.y = tempY + player.h / 2;

        createHitParticles(player.x + player.w / 2, player.y + player.h / 2);
        playSound("shard");
        showMessage("ECHO PHASE SWAP", 40);
        return;
    }

    // 2. Stop recording and deploy
    if (player.echoRecording) {
        player.echoRecording = false;
        if (player.echoFrames.length > 5) {
            deployEcho(player.echoFrames.slice());
            showMessage("ECHO DEPLOYED", 50);
        }
        player.echoFrames = [];
        player.echoTimer = 0;
    } else {
        // 3. Start recording
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