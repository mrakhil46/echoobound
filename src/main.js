import { gameState, resetGameState } from "./state/game.js";
import { player, updatePlayer, damagePlayer, switchWeapon, gainXP } from "./state/player.js";
import { world, makeWorld } from "./state/world.js";
import { camera, updateCamera } from "./systems/camera.js";
import { initInput, mobile, mouse } from "./systems/input.js";
import { resolvePlayerPlatforms, checkPlayerShardCollisions, checkGateCollision } from "./systems/collisions.js";
import { particles, updateParticles } from "./systems/particles.js";
import { playSound } from "./systems/audio.js";
import { enemies, spawnEnemies, updateEnemies, damageEnemy } from "./entities/enemy.js";
import { bullets, enemyBullets, shoot, updateBullets, updateEnemyBullets } from "./entities/bullet.js";
import { echoes, activateEcho, deployEcho, updateEchoes } from "./entities/echo.js";
import { updateHUD, showLevelIntro, showMessage } from "./render/hud.js";
import { draw } from "./render/draw.js";
import { LEVELS } from "./config/levels.js";
import { rectsOverlap } from "./utils/math.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const crosshair = document.getElementById("crosshair");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");
const victoryScreen = document.getElementById("victory");

function resize() {
    gameState.dpr = Math.min(window.devicePixelRatio || 1, 2);
    gameState.viewportW = Math.max(800, window.innerWidth);
    gameState.viewportH = Math.max(450, window.innerHeight);

    canvas.width = Math.floor(gameState.viewportW * gameState.dpr);
    canvas.height = Math.floor(gameState.viewportH * gameState.dpr);
    canvas.style.width = gameState.viewportW + "px";
    canvas.style.height = gameState.viewportH + "px";
}

window.addEventListener("resize", resize);
resize();

function startGame() {
    if (gameState.gameStarted) return;
    gameState.gameStarted = true;
    gameState.gameRunning = true;
    gameState.gameWon = false;

    resetGameState();
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    victoryScreen.classList.add("hidden");

    makeWorld(() => spawnEnemies(world.width));
    showLevelIntro(gameState.levelIndex);
}

function restartGame() {
    if (!gameState.gameStarted) {
        startGame();
        return;
    }
    gameState.gameRunning = true;
    gameState.gameWon = false;
    gameOverScreen.classList.add("hidden");
    victoryScreen.classList.add("hidden");

    makeWorld(() => spawnEnemies(world.width));
    showLevelIntro(gameState.levelIndex);
}

function gameOver() {
    gameState.gameRunning = false;
    gameOverScreen.classList.remove("hidden");
}

function nextLevel() {
    if (gameState.levelIndex >= LEVELS.length - 1) {
        gameState.gameWon = true;
        gameState.gameRunning = false;
        victoryScreen.classList.remove("hidden");
        return;
    }

    gameState.levelIndex++;
    player.health = Math.min(player.maxHealth, player.health + 35);
    player.energy = player.maxEnergy;

    makeWorld(() => spawnEnemies(world.width));
    showLevelIntro(gameState.levelIndex);
}

// Wire system events
initInput(canvas, camera, crosshair, {
    onSwitchWeapon: switchWeapon,
    onEcho: activateEcho,
    onRestart: restartGame,
    onEnter: startGame
});

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", restartGame);
document.getElementById("againBtn").addEventListener("click", () => {
    gameState.gameStarted = false;
    startScreen.classList.remove("hidden");
    victoryScreen.classList.add("hidden");
});

document.addEventListener("touchmove", e => {
    if (gameState.gameStarted) e.preventDefault();
}, { passive: false });

document.addEventListener("contextmenu", e => e.preventDefault());

// Game update loop
function update() {
    if (!gameState.gameRunning) return;

    if (gameState.levelStartTimer > 0) gameState.levelStartTimer--;

    const oldY = player.y;
    updatePlayer(
        world.width,
        () => shoot(player, gameState, mobile, mouse),
        frames => deployEcho(frames)
    );
    resolvePlayerPlatforms(player, oldY, world.platforms, () => {
        damagePlayer(35, gameOver);
        player.x = 220;
        player.y = 1300;
        player.vx = 0;
        player.vy = 0;
        showMessage("FALLEN INTO THE VOID", 40);
    });

    updateEnemies(player, world.platforms, world.width, amt => damagePlayer(amt, gameOver));
    updateBullets(world.width, enemies, (enemy, dmg) => {
        damageEnemy(enemy, dmg, () => {
            world.gate.open = true;
        });
    });
    updateEnemyBullets(world.width, player, amt => damagePlayer(amt, gameOver));
    updateEchoes();
    
    for (const sw of world.switches) {
        const swBox = { x: sw.x, y: sw.y - 40, w: 28, h: 40 };

        const playerOnSwitch = rectsOverlap(player, swBox);
        const echoOnSwitch = echoes.some(e =>
            rectsOverlap({ x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h }, swBox)
        );

        if (playerOnSwitch || echoOnSwitch) {
            if (!sw.active) {
                sw.active = true;
                playSound("shard");
                showMessage("SWITCH ENGAGED", 30);
            }
        }
    }
    
    checkPlayerShardCollisions(player, world.shards, () => {
        gameState.shards++;
        gainXP(80);
        playSound("shard");
        showMessage("RIFT SHARD ACQUIRED", 40);

        const collected = world.shards.filter(s => s.collected).length;
        if (collected >= world.shards.length) {
            world.gate.open = true;
        }
    });

    checkGateCollision(player, world.gate, nextLevel);

    updateParticles();
    updateCamera(player, world.width, gameState.viewportW, gameState.viewportH);
    updateHUD(player, gameState);
}

// Initialize and start render loop
makeWorld(() => spawnEnemies(world.width));
updateHUD(player, gameState);

function loop() {
    if(gameState.hitStop > 0){
        gameState.hitStop--;
    }else{
        update();
    }
    draw(
        ctx,
        gameState.viewportW,
        gameState.viewportH,
        gameState.dpr,
        camera,
        world,
        player,
        enemies,
        bullets,
        enemyBullets,
        echoes,
        particles,
        gameState
    );
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);