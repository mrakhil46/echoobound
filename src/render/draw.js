import { clamp } from "../utils/math.js";
import { LEVELS } from "../config/levels.js";
import { getCameraShakeOffset } from "../systems/camera.js";

export function draw(ctx, W, H, dpr, camera, world, player, enemies, bullets, enemyBullets, echoes, particles, gameState) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawBackground(ctx, W, H, camera, world.width, gameState.levelIndex);

    const { sx, sy } = getCameraShakeOffset();

    ctx.save();
    ctx.translate(sx, sy);
    drawWorld(ctx, camera, world, player, enemies, bullets, enemyBullets, echoes, particles);
    ctx.restore();

    drawScreenEffects(ctx, W, H, player, enemies);
}

export function drawBackground(ctx, W, H, camera, worldWidth, levelIndex) {
    const data = LEVELS[levelIndex];
    let g;
    if (data.sky === 0) {
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#071426");
        g.addColorStop(0.55, "#12354b");
        g.addColorStop(1, "#05070d");
    } else if (data.sky === 1) {
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#08130f");
        g.addColorStop(0.5, "#12362b");
        g.addColorStop(1, "#050806");
    } else if (data.sky === 2) {
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#111322");
        g.addColorStop(0.55, "#30253d");
        g.addColorStop(1, "#07070d");
    } else if (data.sky === 3) {
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#03151b");
        g.addColorStop(0.5, "#073943");
        g.addColorStop(1, "#020609");
    } else {
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#10041e");
        g.addColorStop(0.5, "#34134b");
        g.addColorStop(1, "#030208");
    }

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Moon / Core
    const pulse = Math.sin(performance.now() * 0.001) * 8;
    ctx.beginPath();
    ctx.arc(W * 0.72, H * 0.24, 70 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = data.sky === 4 ? "rgba(180,100,255,.14)" : "rgba(100,220,255,.08)";
    ctx.fill();

    // Distant Mountains
    ctx.save();
    ctx.translate(-(camera.x * 0.12), -(camera.y * 0.03));
    ctx.fillStyle = data.sky === 2 ? "rgba(50,40,70,.7)" : "rgba(10,35,48,.7)";
    ctx.beginPath();
    ctx.moveTo(-100, H * 0.65);
    for (let x = -100; x < W + worldWidth * 0.15; x += 180) {
        const peak = H * 0.35 + Math.sin(x * 0.017) * 65 + Math.sin(x * 0.041) * 35;
        ctx.lineTo(x, peak);
        ctx.lineTo(x + 90, H * 0.65);
    }
    ctx.lineTo(W + 100, H);
    ctx.lineTo(-100, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export function drawWorld(ctx, camera, world, player, enemies, bullets, enemyBullets, echoes, particles) {
    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    drawDecorations(ctx, world.decorations);
    drawPlatforms(ctx, world.platforms);
    drawShards(ctx, world.shards);
    drawSwitches(ctx, world.switches);
    drawGate(ctx, world.gate);

    for (const echo of echoes) drawEcho(ctx, echo);
    for (const enemy of enemies) {
        if (!enemy.dead) drawEnemy(ctx, enemy);
    }

    drawBullets(ctx, bullets);
    drawEnemyBullets(ctx, enemyBullets);
    drawPlayer(ctx, player);
    drawParticles(ctx, particles);

    ctx.restore();
}

function drawDecorations(ctx, decorations) {
    for (const d of decorations) {
        ctx.globalAlpha = 0.08 + d.depth * 0.2;
        if (d.type === 0) {
            ctx.fillStyle = "#6bb9c9";
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - d.size * 0.5, d.y + d.size);
            ctx.lineTo(d.x + d.size * 0.5, d.y + d.size);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = "#5c7890";
            ctx.fillRect(d.x, d.y, 4, d.size);
            ctx.fillRect(d.x - 12, d.y + d.size * 0.2, 28, 3);
        }
    }
    ctx.globalAlpha = 1;
}

function drawPlatforms(ctx, platforms) {
    for (const p of platforms) {
        if (p.type === "ground") {
            const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
            g.addColorStop(0, "#172b39");
            g.addColorStop(1, "#05070b");
            ctx.fillStyle = g;
            ctx.fillRect(p.x, p.y, p.w, p.h);

            ctx.fillStyle = "rgba(90,220,255,.12)";
            ctx.fillRect(p.x, p.y, p.w, 3);
        } else {
            ctx.fillStyle = "#1a2c38";
            ctx.fillRect(p.x, p.y, p.w, p.h);

            ctx.fillStyle = "rgba(100,225,255,.4)";
            ctx.fillRect(p.x, p.y, p.w, 2);

            for (let x = p.x + 20; x < p.x + p.w; x += 40) {
                ctx.fillStyle = "rgba(255,255,255,.035)";
                ctx.fillRect(x, p.y + 8, 18, 2);
            }
        }
    }
}

function drawShards(ctx, shards) {
    for (const s of shards) {
        if (s.collected) continue;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.spin);
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#56eaff";
        ctx.fillStyle = "#72efff";
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, 18);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function drawSwitches(ctx, switches) {
    for (const s of switches) {
        ctx.fillStyle = s.active ? "#7affb0" : "#293d49";
        ctx.fillRect(s.x, s.y - 40, 28, 40);
        ctx.fillStyle = s.active ? "#7affb0" : "#3a6575";
        ctx.fillRect(s.x + 7, s.y - 32, 14, 14);
    }
}

function drawGate(ctx, g) {
    if (!g) return;
    ctx.save();
    ctx.shadowBlur = 35;
    ctx.shadowColor = g.open ? "#64ffbe" : "#a45cff";
    ctx.strokeStyle = g.open ? "#64ffbe" : "#9d5cff";
    ctx.lineWidth = 4;
    ctx.strokeRect(g.x, g.y, g.w, g.h);

    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = g.open ? "rgba(80,255,180,.15)" : "rgba(160,90,255,.12)";
        ctx.fillRect(g.x + 12 + i * 19, g.y + 10, 5, g.h - 20);
    }
    ctx.restore();

    if (!g.open) {
        ctx.fillStyle = "#a77cff";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("COLLECT ALL SHARDS", g.x + g.w / 2, g.y - 12);
    }
}

function drawPlayer(ctx, p) {
    if (p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) return;
    const x = p.x;
    const y = p.y;

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(70,220,255,.25)";

    // Legs & Boots
    ctx.fillStyle = "#17232f";
    ctx.fillRect(x + 9, y + 48, 10, 24);
    ctx.fillRect(x + 28, y + 48, 10, 24);
    ctx.fillStyle = "#0a1018";
    ctx.fillRect(x + 5, y + 68, 17, 6);
    ctx.fillRect(x + 27, y + 68, 17, 6);

    // Body
    const bodyGrad = ctx.createLinearGradient(x, y, x + p.w, y + 50);
    bodyGrad.addColorStop(0, "#152b3a");
    bodyGrad.addColorStop(0.5, "#2a5668");
    bodyGrad.addColorStop(1, "#0b141e");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 22, 36, 32, 8);
    ctx.fill();

    // Chest core
    ctx.fillStyle = "#67e9ff";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#52eaff";
    ctx.fillRect(x + 20, y + 29, 8, 15);
    ctx.shadowBlur = 0;

    // Neck & Head
    ctx.fillStyle = "#1d2830";
    ctx.fillRect(x + 18, y + 16, 12, 10);
    ctx.fillStyle = "#b87962";
    ctx.beginPath();
    ctx.arc(x + 24, y + 12, 15, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#111923";
    ctx.beginPath();
    ctx.arc(x + 24, y + 8, 16, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 9, y + 7, 30, 7);

    // Visor & Eye
    ctx.fillStyle = "rgba(80,220,255,.65)";
    ctx.fillRect(x + 10, y + 10, 28, 5);
    ctx.fillStyle = "#dfffff";
    ctx.fillRect(x + 27, y + 11, 5, 2);

    // Gun
    ctx.save();
    if (p.facing < 0) {
        ctx.scale(-1, 1);
        ctx.translate(-2 * x - p.w, 0);
    }
    ctx.fillStyle = "#101820";
    ctx.fillRect(x + 30, y + 28, 34, 8);
    ctx.fillStyle = "#5aeaff";
    ctx.fillRect(x + 57, y + 30, 13, 4);

    if (p.gunFlash > 0) {
        ctx.fillStyle = "#dfffff";
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#6ef3ff";
        ctx.beginPath();
        ctx.moveTo(x + 70, y + 32);
        ctx.lineTo(x + 86, y + 32);
        ctx.lineTo(x + 73, y + 27);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    ctx.restore();
}

function drawEnemy(ctx, enemy) {
    ctx.save();
    if (enemy.hitFlash > 0) ctx.globalAlpha = 0.55;

    if (enemy.type === "crawler") drawCrawler(ctx, enemy);
    else if (enemy.type === "sentinel") drawSentinel(ctx, enemy);
    else if (enemy.type === "mimic") drawMimic(ctx, enemy);
    else if (enemy.type === "warden") drawWarden(ctx, enemy);

    ctx.restore();

    // HP Bar
    const bw = enemy.w * (enemy.boss ? 1.25 : 1);
    const bx = enemy.x + enemy.w / 2 - bw / 2;
    const by = enemy.y - 14;
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(bx, by, bw, 5);
    ctx.fillStyle = enemy.boss ? "#d46cff" : "#ff526c";
    ctx.fillRect(bx, by, bw * clamp(enemy.health / enemy.maxHealth, 0, 1), 5);
}

function drawCrawler(ctx, e) {
    ctx.fillStyle = "#182f36";
    ctx.beginPath();
    ctx.roundRect(e.x, e.y + 8, e.w, e.h - 8, 15);
    ctx.fill();
    ctx.fillStyle = "#3ed8d1";
    ctx.fillRect(e.x + 10, e.y + 18, e.w - 20, 5);
    ctx.fillStyle = "#ff526d";
    ctx.fillRect(e.x + 15, e.y + 12, 7, 5);
    ctx.fillRect(e.x + 40, e.y + 12, 7, 5);
    ctx.strokeStyle = "#4b7279";
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
        const lx = e.x + 8 + i * 14;
        ctx.beginPath();
        ctx.moveTo(lx, e.y + 34);
        ctx.lineTo(lx - 5, e.y + e.h);
        ctx.stroke();
    }
}

function drawSentinel(ctx, e) {
    ctx.fillStyle = "#202c3c";
    ctx.fillRect(e.x + 7, e.y + 20, e.w - 14, e.h - 20);
    ctx.fillStyle = "#4b6a82";
    ctx.fillRect(e.x + 12, e.y + 25, e.w - 24, 32);
    ctx.fillStyle = "#a9f6ff";
    ctx.fillRect(e.x + 18, e.y + 32, e.w - 36, 5);
    ctx.fillStyle = "#101821";
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + 16, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff405f";
    ctx.fillRect(e.x + e.w / 2 - 8, e.y + 13, 16, 4);
    ctx.strokeStyle = "#516b7d";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(e.x + 7, e.y + 35);
    ctx.lineTo(e.x - 10, e.y + 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.x + e.w - 7, e.y + 35);
    ctx.lineTo(e.x + e.w + 10, e.y + 50);
    ctx.stroke();
}

function drawMimic(ctx, e) {
    ctx.fillStyle = "#241d38";
    ctx.beginPath();
    ctx.roundRect(e.x, e.y, e.w, e.h, 12);
    ctx.fill();
    ctx.strokeStyle = "#a36cff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#0c0a12";
    ctx.fillRect(e.x + 8, e.y + 16, e.w - 16, 18);
    ctx.fillStyle = "#d574ff";
    ctx.fillRect(e.x + 16, e.y + 22, 7, 3);
    ctx.fillRect(e.x + 31, e.y + 22, 7, 3);
    ctx.strokeStyle = "#bd6fff";
    ctx.beginPath();
    ctx.moveTo(e.x + 17, e.y + 42);
    ctx.lineTo(e.x + 37, e.y + 42);
    ctx.stroke();
    ctx.strokeStyle = "#6be9ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2, e.y);
    ctx.lineTo(e.x + e.w / 2, e.y - 18);
    ctx.stroke();
    ctx.fillStyle = "#6be9ff";
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y - 20, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawWarden(ctx, e) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#b452ff";
    ctx.fillStyle = "#171025";
    ctx.beginPath();
    ctx.moveTo(e.x + 20, e.y + 30);
    ctx.lineTo(e.x + e.w - 20, e.y + 30);
    ctx.lineTo(e.x + e.w, e.y + e.h);
    ctx.lineTo(e.x, e.y + e.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#34234c";
    ctx.fillRect(e.x + 25, e.y + 48, e.w - 50, 62);
    ctx.fillStyle = "#a96bd0";
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + 28, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#100b18";
    ctx.fillRect(e.x + 20, e.y + 21, e.w - 40, 15);
    ctx.fillStyle = "#ff62e9";
    ctx.fillRect(e.x + 31, e.y + 27, 13, 4);
    ctx.fillStyle = "#d06cff";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#d06cff";
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + 80, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawEcho(ctx, echo) {
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.translate(echo.x, echo.y);
    ctx.fillStyle = "#67efff";
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#5deaff";
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-14, -12, 28, 35);
    ctx.restore();
}

function drawBullets(ctx, bullets) {
    for (const b of bullets) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.shadowBlur = b.echo ? 15 : 12;
        ctx.shadowColor = b.echo ? "#8fffff" : "#5deaff";
        ctx.fillStyle = b.echo ? "#c4ffff" : "#72efff";
        ctx.fillRect(-b.size * 2, -b.size / 2, b.size * 4, b.size);
        ctx.restore();
    }
}

function drawEnemyBullets(ctx, enemyBullets) {
    for (const b of enemyBullets) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff4f7b";
        ctx.fillStyle = "#ff5f82";
        ctx.fillRect(-b.size * 2, -2, b.size * 4, 4);
        ctx.restore();
    }
}

function drawParticles(ctx, particles) {
    for (const p of particles) {
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = p.type === "death" ? "#c76cff" : p.type === "flash" ? "#e8ffff" : "#67eaff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawScreenEffects(ctx, W, H, player, enemies) {
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.8);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.65)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,.018)";
    for (let y = 0; y < H; y += 5) ctx.fillRect(0, y, W, 1);

    if (player.echoRecording) {
        ctx.fillStyle = "#ff526c";
        ctx.beginPath();
        ctx.arc(W - 30, H - 30, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "11px Arial";
        ctx.textAlign = "right";
        ctx.fillText("RECORDING ECHO", W - 45, H - 26);
    }

    const boss = enemies.find(e => e.boss && !e.dead);
    if (boss && player.x > boss.x - 800) {
        ctx.fillStyle = "rgba(255,50,100,.7)";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⚠ RIFT WARDEN", W / 2, 80);

        const bw = 420;
        ctx.fillStyle = "rgba(0,0,0,.65)";
        ctx.fillRect(W / 2 - bw / 2, 90, bw, 10);
        ctx.fillStyle = "#c76cff";
        ctx.fillRect(W / 2 - bw / 2, 90, bw * clamp(boss.health / boss.maxHealth, 0, 1), 10);
    }
}