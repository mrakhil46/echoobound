export const gameState = {
    gameStarted: false,
    gameRunning: false,
    gameWon: false,
    levelIndex: 0,
    levelStartTimer: 0,
    score: 0,
    shards: 0,
    xp: 0,
    playerLevel: 1,
    weaponIndex: 0,
    viewportW: 1280,
    viewportH: 720,
    dpr: 1
};

export function resetGameState() {
    gameState.score = 0;
    gameState.shards = 0;
    gameState.xp = 0;
    gameState.playerLevel = 1;
    gameState.weaponIndex = 0;
    gameState.levelIndex = 0;
}