import { showMessage } from "../render/hud.js";
import { bullets } from "./bullet.js";
import { player } from "../state/player.js";
import { gameState } from "../state/game.js";

export const echoes = [];

export function activateEcho() {
    if (!gameState.gameRunning) return;

    if (player.echoRecording) {
        player.echoRecording = false;
        if (player.echoFrames.length > 5) {
            echoes.push({
                x: player.x + player.w / 2,
                y: player.y + player.h / 2,
                frames: player.echoFrames.slice(),
                frame: 0,
                life: player.echoFrames.length,
                fireTimer: 0
            });
            showMessage("ECHO DEPLOYED", 50);
        }
        player.echoFrames = [];
        player.echoTimer = 0;
    } else {
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
    echoes.push({
        x: player.x + player.w / 2,
        y: player.y + player.h / 2,
        frames,
        frame: 0,
        life: frames.length,
        fireTimer: 0
    });
}

export function updateEchoes() {
    for (let i = echoes.length - 1; i >= 0; i--) {
        const echo = echoes[i];
        if (echo.frame >= echo.frames.length) {
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