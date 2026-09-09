import { rand, randInt } from "../utils/math.js";
import { LEVELS } from "../config/levels.js";
import { gameState } from "./game.js";
import { resetPlayer } from "./player.js";

export const world = {
    width: 6000,
    height: 900,
    platforms: [],
    decorations: [],
    shards: [],
    gate: null,
    switches: []
};

export function makeWorld(onSpawnEnemies) {
    const data = LEVELS[gameState.levelIndex];
    world.width = data.width;
    world.height = 900;
    world.platforms = [];
    world.decorations = [];
    world.shards = [];
    world.switches = [];

    // Base ground
    world.platforms.push({
        x: 0,
        y: 560,
        w: world.width,
        h: 340,
        type: "ground"
    });

    // Platforms
    let x = 400;
    while (x < world.width - 500) {
        const gap = randInt(80, 180);
        const width = randInt(180, 420);
        const height = randInt(70, 180);

        world.platforms.push({
            x: x,
            y: 560 - height,
            w: width,
            h: 24,
            type: "platform"
        });

        if (Math.random() < 0.55) {
            world.platforms.push({
                x: x + width * 0.55,
                y: 560 - height - randInt(70, 120),
                w: randInt(100, 220),
                h: 20,
                type: "platform"
            });
        }
        x += width + gap;
    }

    // Shards
    const shardCount = 5;
    for (let i = 0; i < shardCount; i++) {
        const sx = 700 + (i * (world.width - 1300)) / (shardCount - 1);
        world.shards.push({
            x: sx,
            y: randInt(300, 480),
            collected: false,
            spin: rand(0, Math.PI * 2)
        });
    }

    // Switches
    for (let i = 0; i < 3; i++) {
        world.switches.push({
            x: 1200 + (i * (world.width - 1800)) / 2,
            y: 500,
            active: false
        });
    }

    // Gate
    world.gate = {
        x: world.width - 360,
        y: 400,
        w: 110,
        h: 160,
        open: false
    };

    // Decorations
    for (let i = 0; i < 220; i++) {
        world.decorations.push({
            x: rand(0, world.width),
            y: rand(180, 520),
            size: rand(10, 90),
            depth: rand(0.1, 0.8),
            type: Math.random() < 0.5 ? 0 : 1
        });
    }

    resetPlayer();
    if (onSpawnEnemies) onSpawnEnemies();
}