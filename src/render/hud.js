import { clamp } from "../utils/math.js";
import { LEVELS } from "../config/levels.js";
import { WEAPONS } from "../config/weapons.js";

const elements = {
    levelName: document.getElementById("levelName"),
    levelValue: document.getElementById("levelValue"),
    xpValue: document.getElementById("xpValue"),
    shardValue: document.getElementById("shardValue"),
    weaponValue: document.getElementById("weaponValue"),
    healthFill: document.getElementById("healthFill"),
    energyFill: document.getElementById("energyFill"),
    xpFill: document.getElementById("xpFill"),
    levelIntro: document.getElementById("levelIntro"),
    introTitle: document.getElementById("introTitle"),
    introSub: document.getElementById("introSub"),
    message: document.getElementById("message")
};

export function updateHUD(player, gameState) {
    elements.levelName.textContent = LEVELS[gameState.levelIndex].name;
    elements.levelValue.textContent = gameState.playerLevel;
    elements.xpValue.textContent = Math.floor(gameState.xp);
    elements.shardValue.textContent = gameState.shards;
    elements.weaponValue.textContent = WEAPONS[gameState.weaponIndex].name;

    elements.healthFill.style.width = clamp((player.health / player.maxHealth) * 100, 0, 100) + "%";
    elements.energyFill.style.width = clamp((player.energy / player.maxEnergy) * 100, 0, 100) + "%";

    const needed = 300 + (gameState.playerLevel - 1) * 220;
    elements.xpFill.style.width = clamp((gameState.xp / needed) * 100, 0, 100) + "%";
}

export function showMessage(text, time = 130) {
    elements.message.textContent = text;
    elements.message.style.opacity = "1";
    setTimeout(() => {
        elements.message.style.opacity = "0";
    }, time * 8);
}

export function showLevelIntro(levelIndex) {
    const data = LEVELS[levelIndex];
    elements.levelName.textContent = data.name;
    elements.introTitle.textContent = data.name;
    elements.introSub.textContent = data.sub;
    elements.levelIntro.classList.remove("hidden");

    setTimeout(() => {
        elements.levelIntro.classList.add("hidden");
    }, 1600);
}