import { rand, randInt } from "../utils/math.js";
import { LEVELS } from "../config/levels.js";
import { gameState } from "./game.js";
import { resetPlayer } from "./player.js";

export const world = {
    width: 6000,
    height: 1600,
    platforms: [],
    decorations: [],
    shards: [],
    gate: null,
    switches: []
};

export function makeWorld(onSpawnEnemies) {
    const data = LEVELS[gameState.levelIndex];
    world.width = data.width;
    world.height = 1600;
    world.platforms = [];
    world.decorations = [];
    world.shards = [];
    world.switches = [];

    const floorY = 1400;

    let floorCursor = 0;

    // Base ground
    world.platforms.push({
        x: 0,
        y: floorY,
        w: 650,
        h: 200,
        type: "ground"
    });
    floorCursor = 650;

    while (floorCursor < world.width - 600) {
        const pitWidth = randInt(140, 260); // Gap that requires running jumps or dashes
        floorCursor += pitWidth;

        const segmentWidth = randInt(400, 900);
        world.platforms.push({
            x: floorCursor,
            y: floorY,
            w: Math.min(segmentWidth, world.width - floorCursor),
            h: 200,
            type: "ground"
        });
        floorCursor += segmentWidth;
    }

    // Ensure safe landing at gate
    world.platforms.push({
        x: world.width - 600,
        y: floorY,
        w: 600,
        h: 200,
        type: "ground"
    });

    // Platforms
    let px = 400;
    while (px < world.width - 500) {
        const width = randInt(160, 340);
        const tierCount = randInt(2, 4);

        for(let tier = 0; tier < tierCount; tier++){
            const py = floorY - tier * randInt(160, 240);
            world.platforms.push({
                x: px + randInt(-40, 40),
                y: py,
                w: width,
                h: 22,
                type: "platform"
            });
        }
        px += width + randInt(120, 280);
    }

    // Shards
    const shardCount = 5;
    for (let i = 0; i < shardCount; i++) {
        const sx = 700 + (i * (world.width - 1300)) / (shardCount - 1);
        world.shards.push({
            x: sx,
            y: randInt(450, 1100),
            collected: false,
            spin: rand(0, Math.PI * 2)
        });
    }

    // Switches
    for (let i = 0; i < 3; i++) {
        world.switches.push({
            x: 1200 + (i * (world.width - 1800)) / 2,
            y: randInt(700, 1000),
            active: false
        });
    }

    // Gate
    world.gate = {
        x: world.width - 340,
        y: floorY - 160,  
        w: 110,
        h: 160,
        open: false
    };

    // Decorations
    for (let i = 0; i < 280; i++) {
        world.decorations.push({
            x: rand(0, world.width),
            y: rand(200, 1350),
            size: rand(14, 110),
            depth: rand(0.1, 0.8),
            type: Math.random() < 0.5 ? 0 : 1
        });
    }

    resetPlayer(180, floorY - 80);

    if (onSpawnEnemies) onSpawnEnemies();
}