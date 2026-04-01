import { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, drawChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, gridUpdatedChunks, tick, modal, parseSaveCode, brushPixel, setBrushPixel, showTooltip, hideTooltip, moveTooltip, setRunState } from "./game.js";
// import { imageBitmap } from "./renderer.js";
import { random, randomSeed } from "./random.js";
import { currentPuzzle } from "./puzzles.js";
import { multiplayerId, multiplayerGameId, multiplayerGames, multiplayerPixelInventory } from "./multiplayer.js";

import { pixels } from "./pixels.js";
import { playMusic } from "./sound.js";

const pixelTexture = await createImageBitmap(await (await fetch("./img/pixels.png")).blob());
const ID = 0;
const PIXEL_DATA = 1;
const PUZZLE_DATA = 2;
const UPDATED = 3;
const COLOR_R = 4;
const COLOR_G = 5;
const COLOR_B = 6;
const COLOR_A = 7;
const VEL_X = 5;
const VEL_Y = 6;

const GAS = 0;
const LIQUID = 1;
const SOLID = 2;

function isOnGrid(x, y) {
    return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
};
function isAir(x, y) {
    return isOnGrid(x, y) && (grid[(x + y * gridWidth) * gridStride + ID] == AIR || grid[(x + y * gridWidth) * gridStride + ID] == DELETER || grid[(x + y * gridWidth) * gridStride + ID] == MONSTER);
};
function isGas(x, y) {
    return isOnGrid(x, y) && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS;
};
function isFluid(x, y) {
    return isOnGrid(x, y) && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state != SOLID;
};
function isPassableSolid(x, y) {
    return isOnGrid(x, y) && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state != SOLID;
};
function isMoveableSolid(x, y) {
    return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state != SOLID;
};
function updated(x, y) {
    return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] == tick;
};
// function isAir(x, y) {
//     return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + ID] == 0 && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick;
// };
function isId(x, y, id) {
    return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + ID] == id;
};

function isTouching(x, y, array) {
    if (x > 0) {
        let index = (x - 1 + y * gridWidth) * gridStride;
        for (let i in array) {
            if (grid[index + ID] == array[i]) {
                return true;
            }
        }
    }
    if (x < gridWidth - 1) {
        let index = (x + 1 + y * gridWidth) * gridStride;
        for (let i in array) {
            if (grid[index + ID] == array[i]) {
                return true;
            }
        }
    }
    if (y > 0) {
        let index = (x + (y - 1) * gridWidth) * gridStride;
        for (let i in array) {
            if (grid[index + ID] == array[i]) {
                return true;
            }
        }
    }
    if (y < gridHeight - 1) {
        let index = (x + (y + 1) * gridWidth) * gridStride;
        for (let i in array) {
            if (grid[index + ID] == array[i]) {
                return true;
            }
        }
    }
    return false;
};
function getTouching(x, y, array) {
    let number = 0;
    if (x > 0) {
        let index = (x - 1 + y * gridWidth) * gridStride;
        for (let i in array) {
            if (grid[index + ID] == array[i]) {
                number += 1;
                break;
            }
        }
    }
    if (x < gridWidth - 1) {
        let index = (x + 1 + y * gridWidth) * gridStride;
        for (let i in array) {
            if (grid[index + ID] == array[i]) {
                number += 1;
                break;
            }
        }
    }
    if (y > 0) {
        let index = (x + (y - 1) * gridWidth) * gridStride;
        for (let i in array) {
            if (grid[index + ID] == array[i]) {
                number += 1;
                break;
            }
        }
    }
    if (y < gridHeight - 1) {
        let index = (x + (y + 1) * gridWidth) * gridStride;
        for (let i in array) {
            if (grid[index + ID] == array[i]) {
                number += 1;
                break;
            }
        }
    }
    return number;
};
function forTouching(x, y, action) {
    if (x > 0) {
        action(x - 1, y);
    }
    if (x < gridWidth - 1) {
        action(x + 1, y);
    }
    if (y > 0) {
        action(x, y - 1);
    }
    if (y < gridHeight - 1) {
        action(x, y + 1);
    }
};
function isTouchingDiagonal(x, y, array) {
    for (let i = Math.max(y - 1, 0); i <= Math.min(y + 1, gridHeight - 1); i++) {
        for (let j = Math.max(x - 1, 0); j <= Math.min(x + 1, gridWidth - 1); j++) {
            if (j == x && i == y) {
                continue;
            }
            let index = (j + i * gridWidth) * gridStride;
            for (let i in array) {
                if (grid[index + ID] == array[i]) {
                    return true;
                }
            }
        }
    }
    return false;
};
function getTouchingDiagonal(x, y, array) {
    let number = 0;
    for (let i = Math.max(y - 1, 0); i <= Math.min(y + 1, gridHeight - 1); i++) {
        for (let j = Math.max(x - 1, 0); j <= Math.min(x + 1, gridWidth - 1); j++) {
            if (j == x && i == y) {
                continue;
            }
            let index = (j + i * gridWidth) * gridStride;
            for (let i in array) {
                if (grid[index + ID] == array[i]) {
                    number += 1;
                    break;
                }
            }
        }
    }
    return number;
};
function forTouchingDiagonal(x, y, action) {
    for (let i = Math.max(y - 1, 0); i <= Math.min(y + 1, gridHeight - 1); i++) {
        for (let j = Math.max(x - 1, 0); j <= Math.min(x + 1, gridWidth - 1); j++) {
            if (j == x && i == y) {
                continue;
            }
            action(j, i);
        }
    }
};
function isInRange(x, y, radiusSquared, array) {
    let radius = Math.floor(Math.sqrt(radiusSquared));
    for (let i = Math.max(y - radius, 0); i <= Math.min(y + radius, gridHeight - 1); i++) {
        for (let j = Math.max(x - radius, 0); j <= Math.min(x + radius, gridWidth - 1); j++) {
            if (Math.pow(x - j, 2) + Math.pow(y - i, 2) <= radiusSquared) {
                let index = (j + i * gridWidth) * gridStride;
                for (let i in array) {
                    if (grid[index + ID] == array[i]) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
};
function forInRange(x, y, radiusSquared, action) {
    let radius = Math.floor(Math.sqrt(radiusSquared));
    for (let i = Math.max(y - radius, 0); i <= Math.min(y + radius, gridHeight - 1); i++) {
        for (let j = Math.max(x - radius, 0); j <= Math.min(x + radius, gridWidth - 1); j++) {
            if (Math.pow(x - j, 2) + Math.pow(y - i, 2) <= radiusSquared) {
                action(j, i);
            }
        }
    }
};

function addPixel(x, y, id) {
    let index = (x + y * gridWidth) * gridStride;
    grid[index + ID] = id;
    grid[index + UPDATED] = tick;
    // if (pixels[id].color != null) {
    //     grid[index + COLOR_R] = pixels[id].color[0] / 255;
    //     grid[index + COLOR_G] = pixels[id].color[1] / 255;
    //     grid[index + COLOR_B] = pixels[id].color[2] / 255;
    //     grid[index + COLOR_A] = pixels[id].color[3];
    //     if (pixels[id].noise != null) {
    //         let r = random();
    //         grid[index + COLOR_R] += pixels[id].noise[0] / 255 * r;
    //         grid[index + COLOR_G] += pixels[id].noise[1] / 255 * r;
    //         grid[index + COLOR_B] += pixels[id].noise[2] / 255 * r;
    //         grid[index + COLOR_A] += pixels[id].noise[3] * r;
    //     }
    // }
    addUpdatedChunk(x, y);
};
function addFire(x, y, fire) {
    let index = (x + y * gridWidth) * gridStride;
    grid[index + PIXEL_DATA] &= ~1;
    grid[index + PIXEL_DATA] |= fire;
    addUpdatedChunk(x, y);
};

function addTeam(x, y, team) {
    grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] &= 1;
    if (team == 0) {
        grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] |= 2;
    }
    else if (team == 1) {
        grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] |= 4;
    }
};
function copyTeam(x, y, x1, y1) {
    if (x == x1 && y == y1) {
        return;
    }
    let index = (x + y * gridWidth) * gridStride;
    let index1 = (x1 + y1 * gridWidth) * gridStride;
    grid[index1 + PIXEL_DATA] &= 1;
    grid[index1 + PIXEL_DATA] |= (grid[index + PIXEL_DATA] & ~1);
};

function addUpdatedChunk(x, y) {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
        alert(x + " " + y)
    }
    let buffer = 2;

    let chunkX = Math.floor(x / chunkWidth);
    let chunkY = Math.floor(y / chunkHeight);
    let index = (Math.floor(x / chunkWidth) + Math.floor(y / chunkHeight) * chunkXAmount) * chunkStride;
    nextChunks[index] = Math.min(nextChunks[index], Math.max(x - buffer, chunkX * chunkWidth));
    nextChunks[index + 1] = Math.max(nextChunks[index + 1], Math.min(Math.min(x + buffer, gridWidth - 1), chunkX * chunkWidth + chunkWidth - 1));
    nextChunks[index + 2] = Math.min(nextChunks[index + 2], Math.max(y - buffer, chunkY * chunkHeight));
    nextChunks[index + 3] = Math.max(nextChunks[index + 3], Math.min(Math.min(y + buffer, gridHeight - 1), chunkY * chunkHeight + chunkHeight - 1));

    if (x >= buffer && x % chunkWidth < buffer) {
        nextChunks[index - chunkStride] = Math.min(nextChunks[index - chunkStride], x - buffer);
        nextChunks[index - chunkStride + 1] = Math.max(nextChunks[index - chunkStride + 1], chunkX * chunkWidth - 1);
        nextChunks[index - chunkStride + 2] = Math.min(nextChunks[index - chunkStride + 2], Math.max(y - buffer, chunkY * chunkHeight));
        nextChunks[index - chunkStride + 3] = Math.max(nextChunks[index - chunkStride + 3], Math.min(Math.min(y + buffer, gridHeight - 1), chunkY * chunkHeight + chunkHeight - 1));
    }
    if (x < gridWidth - 1 && x % chunkWidth >= chunkWidth - buffer) {
        nextChunks[index + chunkStride] = Math.min(nextChunks[index + chunkStride], chunkX * chunkWidth + chunkWidth);
        nextChunks[index + chunkStride + 1] = Math.max(nextChunks[index + chunkStride + 1], Math.min(x + buffer, gridWidth - 1));
        nextChunks[index + chunkStride + 2] = Math.min(nextChunks[index + chunkStride + 2], Math.max(y - buffer, chunkY * chunkHeight));
        nextChunks[index + chunkStride + 3] = Math.max(nextChunks[index + chunkStride + 3], Math.min(Math.min(y + buffer, gridHeight - 1), chunkY * chunkHeight + chunkHeight - 1));
    }
    if (y >= buffer && y % chunkHeight < buffer) {
        nextChunks[index - chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkXAmount * chunkStride], Math.max(x - buffer, chunkX * chunkWidth));
        nextChunks[index - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkXAmount * chunkStride + 1], Math.min(Math.min(x + buffer, gridWidth - 1), chunkX * chunkWidth + chunkWidth - 1));
        nextChunks[index - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkXAmount * chunkStride + 2], y - buffer);
        nextChunks[index - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkXAmount * chunkStride + 3], chunkY * chunkHeight - 1);
    }
    if (y < gridHeight - 1 && y % chunkHeight >= chunkHeight - buffer) {
        nextChunks[index + chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkXAmount * chunkStride], Math.max(x - buffer, chunkX * chunkWidth));
        nextChunks[index + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkXAmount * chunkStride + 1], Math.min(Math.min(x + buffer, gridWidth - 1), chunkX * chunkWidth + chunkWidth - 1));
        nextChunks[index + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkXAmount * chunkStride + 2], chunkY * chunkHeight + chunkHeight);
        nextChunks[index + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkXAmount * chunkStride + 3], Math.min(y + buffer, gridHeight - 1));
    }
    if (x >= buffer && x % chunkWidth < buffer) {
        if (y >= buffer && y % chunkHeight < buffer) {
            nextChunks[index - chunkStride - chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkStride - chunkXAmount * chunkStride], x - buffer);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 1], chunkX * chunkWidth - 1);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 2], y - buffer);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 3], chunkY * chunkHeight - 1);
        }
        if (y < gridHeight - 1 && y % chunkHeight >= chunkHeight - buffer) {
            nextChunks[index - chunkStride + chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkStride + chunkXAmount * chunkStride], x - buffer);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 1], chunkX * chunkWidth - 1);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 2], chunkY * chunkHeight + chunkHeight);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 3], Math.min(y + buffer, gridHeight - 1));
        }
    }
    if (x < gridWidth - 1 && x % chunkWidth >= chunkWidth - buffer) {
        if (y >= buffer && y % chunkHeight < buffer) {
            nextChunks[index + chunkStride - chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkStride - chunkXAmount * chunkStride], chunkX * chunkWidth + chunkWidth);
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 1], Math.min(x + buffer, gridWidth - 1));
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 2], y - buffer);
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 3], chunkY * chunkHeight - 1);
        }
        if (y < gridHeight - 1 && y % chunkHeight >= chunkHeight - buffer) {
            nextChunks[index + chunkStride + chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkStride + chunkXAmount * chunkStride], chunkX * chunkWidth + chunkWidth);
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 1], Math.min(x + buffer, gridWidth - 1));
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 2], chunkY * chunkHeight + chunkHeight);
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 3], Math.min(y + buffer, gridHeight - 1));
        }
    }
    addGridUpdatedChunk(x, y);
};
function addGridUpdatedChunk(x, y) {
    let index = (Math.floor(x / chunkWidth) + Math.floor(y / chunkHeight) * chunkXAmount) * chunkStride;
    gridUpdatedChunks[index] = Math.min(gridUpdatedChunks[index], x);
    gridUpdatedChunks[index + 1] = Math.max(gridUpdatedChunks[index + 1], x);
    gridUpdatedChunks[index + 2] = Math.min(gridUpdatedChunks[index + 2], y);
    gridUpdatedChunks[index + 3] = Math.max(gridUpdatedChunks[index + 3], y);
};
function addUpdatedChunk2(x, y) {
    let index = (Math.floor(x / chunkWidth) + Math.floor(y / chunkHeight) * chunkXAmount) * chunkStride;
    chunks[index] = Math.min(chunks[index], x);
    chunks[index + 1] = Math.max(chunks[index + 1], x);
    chunks[index + 2] = Math.min(chunks[index + 2], y);
    chunks[index + 3] = Math.max(chunks[index + 3], y);

    let buffer = 2;

    if (x >= buffer && x % chunkWidth < buffer) {
        chunks[index - chunkStride] = Math.min(chunks[index - chunkStride], x);
        chunks[index - chunkStride + 1] = Math.max(chunks[index - chunkStride + 1], x - 2);
        chunks[index - chunkStride + 2] = Math.min(chunks[index - chunkStride + 2], y);
        chunks[index - chunkStride + 3] = Math.max(chunks[index - chunkStride + 3], y);
    }
    if (x < gridWidth - buffer && x % chunkWidth >= chunkWidth - buffer) {
        chunks[index + chunkStride] = Math.min(chunks[index + chunkStride], x + 2);
        chunks[index + chunkStride + 1] = Math.max(chunks[index + chunkStride + 1], x);
        chunks[index + chunkStride + 2] = Math.min(chunks[index + chunkStride + 2], y);
        chunks[index + chunkStride + 3] = Math.max(chunks[index + chunkStride + 3], y);
    }
    if (y >= buffer && y % chunkHeight < buffer) {
        chunks[index - chunkXAmount * chunkStride] = Math.min(chunks[index - chunkXAmount * chunkStride], x);
        chunks[index - chunkXAmount * chunkStride + 1] = Math.max(chunks[index - chunkXAmount * chunkStride + 1], x);
        chunks[index - chunkXAmount * chunkStride + 2] = Math.min(chunks[index - chunkXAmount * chunkStride + 2], y);
        chunks[index - chunkXAmount * chunkStride + 3] = Math.max(chunks[index - chunkXAmount * chunkStride + 3], y - 2);
    }
    if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
        chunks[index + chunkXAmount * chunkStride] = Math.min(chunks[index + chunkXAmount * chunkStride], x);
        chunks[index + chunkXAmount * chunkStride + 1] = Math.max(chunks[index + chunkXAmount * chunkStride + 1], x);
        chunks[index + chunkXAmount * chunkStride + 2] = Math.min(chunks[index + chunkXAmount * chunkStride + 2], y + 2);
        chunks[index + chunkXAmount * chunkStride + 3] = Math.max(chunks[index + chunkXAmount * chunkStride + 3], y);
    }
    if (x >= buffer && x % chunkWidth < buffer) {
        if (y >= buffer && y % chunkHeight < buffer) {
            chunks[index - chunkStride - chunkXAmount * chunkStride] = Math.min(chunks[index - chunkStride - chunkXAmount * chunkStride], x);
            chunks[index - chunkStride - chunkXAmount * chunkStride + 1] = Math.max(chunks[index - chunkStride - chunkXAmount * chunkStride + 1], x - 2);
            chunks[index - chunkStride - chunkXAmount * chunkStride + 2] = Math.min(chunks[index - chunkStride - chunkXAmount * chunkStride + 2], y);
            chunks[index - chunkStride - chunkXAmount * chunkStride + 3] = Math.max(chunks[index - chunkStride - chunkXAmount * chunkStride + 3], y - 2);
        }
        if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
            chunks[index - chunkStride + chunkXAmount * chunkStride] = Math.min(chunks[index - chunkStride + chunkXAmount * chunkStride], x);
            chunks[index - chunkStride + chunkXAmount * chunkStride + 1] = Math.max(chunks[index - chunkStride + chunkXAmount * chunkStride + 1], x - 2);
            chunks[index - chunkStride + chunkXAmount * chunkStride + 2] = Math.min(chunks[index - chunkStride + chunkXAmount * chunkStride + 2], y + 2);
            chunks[index - chunkStride + chunkXAmount * chunkStride + 3] = Math.max(chunks[index - chunkStride + chunkXAmount * chunkStride + 3], y);
        }
    }
    if (x < gridWidth - buffer && x % chunkWidth >= chunkWidth - buffer) {
        if (y >= buffer && y % chunkHeight < buffer) {
            chunks[index + chunkStride - chunkXAmount * chunkStride] = Math.min(chunks[index + chunkStride - chunkXAmount * chunkStride], x + 2);
            chunks[index + chunkStride - chunkXAmount * chunkStride + 1] = Math.max(chunks[index + chunkStride - chunkXAmount * chunkStride + 1], x);
            chunks[index + chunkStride - chunkXAmount * chunkStride + 2] = Math.min(chunks[index + chunkStride - chunkXAmount * chunkStride + 2], y);
            chunks[index + chunkStride - chunkXAmount * chunkStride + 3] = Math.max(chunks[index + chunkStride - chunkXAmount * chunkStride + 3], y - 2);
        }
        if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
            chunks[index + chunkStride + chunkXAmount * chunkStride] = Math.min(chunks[index + chunkStride + chunkXAmount * chunkStride], x + 2);
            chunks[index + chunkStride + chunkXAmount * chunkStride + 1] = Math.max(chunks[index + chunkStride + chunkXAmount * chunkStride + 1], x);
            chunks[index + chunkStride + chunkXAmount * chunkStride + 2] = Math.min(chunks[index + chunkStride + chunkXAmount * chunkStride + 2], y + 2);
            chunks[index + chunkStride + chunkXAmount * chunkStride + 3] = Math.max(chunks[index + chunkStride + chunkXAmount * chunkStride + 3], y);
        }
    }
};
function addDrawingChunk(x, y) {
    let index = (Math.floor(x / chunkWidth) + Math.floor(y / chunkHeight) * chunkXAmount) * chunkStride;
    drawChunks[index] = Math.min(drawChunks[index], x);
    drawChunks[index + 1] = Math.max(drawChunks[index + 1], x);
    drawChunks[index + 2] = Math.min(drawChunks[index + 2], y);
    drawChunks[index + 3] = Math.max(drawChunks[index + 3], y);
};

function flow1(x, y, isPassable = isAir, slide = false, slope = 1, disperse = false, dispersion = 5, moveChance = 1) {
    let index = (x + y * gridWidth) * gridStride;
    let id = grid[index + ID];
    let velX = grid[index + VEL_X];
    let velY = grid[index + VEL_Y];
    let colorR = grid[index + COLOR_R];
    let colorG = grid[index + COLOR_G];
    let colorB = grid[index + COLOR_B];
    let colorA = grid[index + COLOR_A];
    let onFire = grid[index + PIXEL_DATA];
    velY += 1;
    velX *= 0.9;
    if (Math.abs(velX) < 1) {
        velX = 0;
    }
    if (velY > 1) {
        velY = 1;
    }

    let dispersed = false;

    let yLonger = Math.abs(velY) > Math.abs(velX);

    let shortLen = yLonger ? velX : velY;
    let longLen = yLonger ? velY : velX;

    let bounciness = 0.25;

    if (longLen != 0) {
        let inc = Math.sign(longLen);

        let multDiff = shortLen / longLen;
        let side = Math.sign(shortLen);
        if (side == 0) {
            // side = 1;
            side = Math.round(random()) * 2 - 1;
            // if ((x * x + y * y + tick * tick) % grid_size > grid_size / 2) {
            //     side = -1;
            // }
            //side = tick % 2) * 2 - 1;
            //side = floor(f32(x % 4) / 2)) * 2 - 1;
        }

        let offsetX = 0;
        let offsetY = 0;
        let sx = x;
        let sy = y;
        let cx = x;
        let cy = y;
        let ix = x;
        let iy = y;

        let moveStopped = random() > moveChance;

        if (yLonger) {
            // get optimal stop location
            for (let i = inc; ; i += inc) {
                cx = ix;
                cy = iy;
                ix = x + Math.floor(i * multDiff) + offsetX;
                iy = y + i + offsetY;
                let optimal = isPassable(ix, iy);
                let stuck = false;
                move: {
                    if (cx == ix) {
                        if (!optimal) {
                            if (slide) {
                                left: {
                                    for (let j = 0; j <= slope; j++) {
                                        if (!isPassable(cx + side, cy + inc * j)) {
                                            break left;
                                        }
                                    }
                                    offsetX += side;
                                    break move;
                                }
                                right: if (shortLen == 0) {
                                    for (let j = 0; j <= slope; j++) {
                                        if (!isPassable(cx - side, cy + inc * j)) {
                                            break right;
                                        }
                                    }
                                    offsetX -= side;
                                    break move;
                                }
                            }
                            if (disperse) {
                                left: {
                                    let stop = 0;
                                    for (let j = 1; j <= dispersion; j++) {
                                        let sameId = isId(cx + side * j, cy, id);
                                        if (!isPassable(cx + side * j, cy) && !sameId) {
                                            if (stop != 0) {
                                                offsetX += side * stop;
                                                offsetY -= inc;
                                                dispersed = true;
                                                break move;
                                            }
                                            break left;
                                        }
                                        else if (isPassable(cx + side * j, cy + inc)) {
                                            if (stop != 0) {
                                                offsetX += side * stop;
                                                offsetY -= inc;
                                                dispersed = true;
                                                break move;
                                            }
                                            break left;
                                        }
                                        // if (!sameId && isPassable(cx + side * j, cy - inc)) {
                                        if (!sameId) {
                                            stop = j;
                                        }
                                    }
                                    if (stop != 0) {
                                        offsetX += side * stop;
                                        offsetY -= inc;
                                        dispersed = true;
                                        break move;
                                    }
                                }
                                right: if (shortLen == 0) {
                                    let stop = 0;
                                    for (let j = 1; j <= dispersion; j++) {
                                        let sameId = isId(cx - side * j, cy, id);
                                        if (!isPassable(cx - side * j, cy) && !sameId) {
                                            if (stop != 0) {
                                                offsetX -= side * stop;
                                                offsetY -= inc;
                                                dispersed = true;
                                                break move;
                                            }
                                            break right;
                                        }
                                        else if (isPassable(cx - side * j, cy + inc)) {
                                            if (stop != 0) {
                                                offsetX -= side * stop;
                                                offsetY -= inc;
                                                dispersed = true;
                                                break move;
                                            }
                                            break right;
                                        }
                                        // if (!sameId && isPassable(cx - side * j, cy - inc)) {
                                        if (!sameId) {
                                            stop = j;
                                        }
                                    }
                                    if (stop != 0) {
                                        offsetX -= side * stop;
                                        offsetY -= inc;
                                        dispersed = true;
                                        break move;
                                    }
                                }
                            }
                            velX = 0;
                            velY = 0;
                            // if (velY >= 4) {
                            //     velX = velY * bounciness * -1 * f32(side);
                            //     velY *= -bounciness;
                            // }
                            // else {
                            //     velX = 0;
                            //     velY = 0;
                            // }
                            stuck = true;
                            break move;
                        }
                    }
                    else {
                        if (!optimal) {
                            if (isPassable(cx, cy + inc)) { // forward
                                offsetX -= side;
                            }
                            else if (isPassable(cx + side, cy)) {
                                offsetY -= inc;
                            }
                            else {
                                velX = 0;
                                velY = 0;
                                stuck = true;
                            }
                        }
                        else {
                            if (!isPassable(cx, cy + inc) && !isPassable(cx + side, cy)) {
                                velX = 0;
                                velY = 0;
                                stuck = true;
                            }
                        }
                    }
                }
                let cIndex = (cx + cy * gridWidth) * gridStride;
                if (stuck) {
                    if (cIndex != index) {
                        addUpdatedChunk(x, y);
                        addUpdatedChunk(cx, cy);
                    }
                    grid[cIndex + ID] = id;
                    grid[cIndex + VEL_X] = velX;
                    if (dispersed) {
                        velY -= 1;
                    }
                    grid[cIndex + VEL_Y] = velY;
                    grid[cIndex + COLOR_R] = colorR;
                    grid[cIndex + COLOR_G] = colorG;
                    grid[cIndex + COLOR_B] = colorB;
                    grid[cIndex + COLOR_A] = colorA;
                    grid[cIndex + UPDATED] = tick;
                    grid[cIndex + PIXEL_DATA] = onFire;
                    break;
                }
                if (moveStopped) {
                    addUpdatedChunk(x, y);
                    grid[index + ID] = id;
                    grid[index + VEL_X] = velX;
                    velY -= 1;
                    grid[index + VEL_Y] = velY - Math.sign(velY);
                    grid[index + COLOR_R] = colorR;
                    grid[index + COLOR_G] = colorG;
                    grid[index + COLOR_B] = colorB;
                    grid[index + COLOR_A] = colorA;
                    grid[index + UPDATED] = tick;
                    grid[index + PIXEL_DATA] = onFire;
                    break;
                }
                ix = x + Math.floor(i * multDiff) + offsetX;
                iy = y + i + offsetY;
                // if (stopPassable(ix, iy)) {
                //     sx = ix;
                //     sy = iy;
                // }
                let iIndex = (ix + iy * gridWidth) * gridStride;

                for (let j = 0; j < gridStride; j++) {
                    grid[cIndex + j] = grid[iIndex + j];
                }

                if (Math.abs(i) >= Math.abs(longLen)) {
                    addUpdatedChunk(x, y);
                    addUpdatedChunk(ix, iy);
                    grid[iIndex + ID] = id;
                    grid[iIndex + VEL_X] = velX;
                    if (dispersed) {
                        velY -= 1;
                    }
                    grid[iIndex + VEL_Y] = velY;
                    grid[iIndex + COLOR_R] = colorR;
                    grid[iIndex + COLOR_G] = colorG;
                    grid[iIndex + COLOR_B] = colorB;
                    grid[iIndex + COLOR_A] = colorA;
                    grid[iIndex + UPDATED] = tick;
                    grid[iIndex + PIXEL_DATA] = onFire;
                    break;
                }
            }

            // let sIndex = (sx + sy * gridWidth) * gridStride;
            // if (sIndex != index) {
            //     let minX = gridSize;
            //     let maxX = 0;
            //     let minY = gridSize;
            //     let maxY = 0;
            //     for (let i = 1; i < move.length; i++) {
            //         let x = (move[i] / gridStride) % gridSize;
            //         let y = Math.floor((move[i] / gridStride) / gridSize);
            //         minX = Math.min(minX, x);
            //         maxX = Math.max(maxX, x);
            //         minY = Math.min(minY, y);
            //         maxY = Math.max(maxY, y);
            //         for (let j = 0; j < gridStride; j++) {
            //             grid[move[i - 1] + j] = grid[move[i] + j];
            //         }
            //         if (move[i] == sIndex) {
            //             grid[sIndex + ID] = id;
            //             grid[sIndex + VEL_X] = velX;
            //             grid[sIndex + VEL_Y] = velY;
            //             grid[sIndex + COLOR_R] = colorR;
            //             grid[sIndex + COLOR_G] = colorG;
            //             grid[sIndex + COLOR_B] = colorB;
            //             grid[sIndex + COLOR_A] = colorA;
            //             grid[sIndex + UPDATED] = tick;
            //             break;
            //         }
            //     }
            // }
        }
        else {
            for (let i = inc; ; i += inc) {
                cx = ix;
                cy = iy;
                ix = x + i + offsetY;
                iy = y + Math.floor(i * multDiff) + offsetX;
                let optimal = isPassable(ix, iy);
                let stuck = false;
                move: {
                    if (cy == iy) {
                        if (!optimal) {
                            if (slide) {
                                left: {
                                    for (let j = 0; j <= slope; j++) {
                                        if (!isPassable(cx + inc * j, cy + side)) {
                                            break left;
                                        }
                                    }
                                    offsetX += side;
                                    break move;
                                }
                                right: if (shortLen == 0) {
                                    for (let j = 0; j <= slope; j++) {
                                        if (!isPassable(cx + inc * j, cy - side)) {
                                            break right;
                                        }
                                    }
                                    offsetX -= side;
                                    break move;
                                }
                            }
                            if (disperse) {
                                left: {
                                    let stop = 0;
                                    for (let j = 1; j <= dispersion; j++) {
                                        let sameId = isId(cx, cy + side * j, id);
                                        if (!isPassable(cx, cy + side * j) && !sameId) {
                                            if (stop != 0) {
                                                offsetX += side * stop;
                                                offsetY -= inc;
                                                break move;
                                            }
                                            break left;
                                        }
                                        if (!sameId) {
                                            stop = j;
                                        }
                                    }
                                    if (stop != 0) {
                                        offsetX += side * stop;
                                        offsetY -= inc;
                                        break move;
                                    }
                                }
                                right: if (shortLen == 0) {
                                    let stop = 0;
                                    for (let j = 1; j <= dispersion; j++) {
                                        let sameId = isId(cx, cy - side * j, id);
                                        if (!isPassable(cx, cy - side * j) && !sameId) {
                                            if (stop != 0) {
                                                offsetX -= side * stop;
                                                offsetY -= inc;
                                                break move;
                                            }
                                            break right;
                                        }
                                        if (!sameId) {
                                            stop = j;
                                        }
                                    }
                                    if (stop != 0) {
                                        offsetX -= side * stop;
                                        offsetY -= inc;
                                        break move;
                                    }
                                }
                            }
                            velX = 0;
                            velY = 0;
                            // if (velY >= 4) {
                            //     velX = velY * bounciness * -1 * f32(side);
                            //     velY *= -bounciness;
                            // }
                            // else {
                            //     velX = 0;
                            //     velY = 0;
                            // }
                            stuck = true;
                            break move;
                        }
                    }
                    else {
                        if (!optimal) {
                            if (isPassable(cx + inc, cy)) { // forward
                                offsetX -= side;
                            }
                            else if (isPassable(cx, cy + side)) {
                                offsetY -= inc;
                            }
                            else {
                                velX = 0;
                                velY = 0;
                                stuck = true;
                            }
                        }
                        else {
                            if (!isPassable(cx + inc, cy) && !isPassable(cx, cy + side)) {
                                velX = 0;
                                velY = 0;
                                stuck = true;
                            }
                        }
                    }
                }
                let cIndex = (cx + cy * gridWidth) * gridStride;
                if (stuck) {
                    if (cIndex != index) {
                        addUpdatedChunk(x, y);
                        addUpdatedChunk(cx, cy);
                    }
                    grid[cIndex + ID] = id;
                    if (dispersed) {
                        velX -= 1;
                    }
                    grid[cIndex + VEL_X] = velX;
                    grid[cIndex + VEL_Y] = velY;
                    grid[cIndex + COLOR_R] = colorR;
                    grid[cIndex + COLOR_G] = colorG;
                    grid[cIndex + COLOR_B] = colorB;
                    grid[cIndex + COLOR_A] = colorA;
                    grid[cIndex + UPDATED] = tick;
                    grid[cIndex + PIXEL_DATA] = onFire;
                    break;
                }
                if (moveStopped) {
                    addUpdatedChunk(x, y);
                    grid[index + ID] = id;
                    grid[index + VEL_X] = velX - Math.sign(velX);
                    velY -= 1;
                    grid[index + VEL_Y] = velY;
                    grid[index + COLOR_R] = colorR;
                    grid[index + COLOR_G] = colorG;
                    grid[index + COLOR_B] = colorB;
                    grid[index + COLOR_A] = colorA;
                    grid[index + UPDATED] = tick;
                    grid[index + PIXEL_DATA] = onFire;
                    break;
                }
                ix = x + i + offsetY;
                iy = y + Math.floor(i * multDiff) + offsetX;

                let iIndex = (ix + iy * gridWidth) * gridStride;

                for (let j = 0; j < gridStride; j++) {
                    grid[cIndex + j] = grid[iIndex + j];
                }

                if (Math.abs(i) >= Math.abs(longLen)) {
                    addUpdatedChunk(x, y);
                    addUpdatedChunk(ix, iy);
                    grid[iIndex + ID] = id;
                    grid[iIndex + VEL_X] = velX;
                    grid[iIndex + VEL_Y] = velY;
                    grid[iIndex + COLOR_R] = colorR;
                    grid[iIndex + COLOR_G] = colorG;
                    grid[iIndex + COLOR_B] = colorB;
                    grid[iIndex + COLOR_A] = colorA;
                    grid[iIndex + UPDATED] = tick;
                    grid[iIndex + PIXEL_DATA] = onFire;
                    break;
                }
            }
        }
    }
    else {
        addUpdatedChunk(x, y);
        grid[index + ID] = id;
        grid[index + VEL_X] = velX;
        grid[index + VEL_Y] = velY;
        grid[index + COLOR_R] = colorR;
        grid[index + COLOR_G] = colorG;
        grid[index + COLOR_B] = colorB;
        grid[index + COLOR_A] = colorA;
        grid[index + UPDATED] = tick;
        grid[index + PIXEL_DATA] = onFire;
    }
};

function move(x, y, x1, y1) {
    // this entire function is spaghetti
    let index = (x + y * gridWidth) * gridStride;
    let index1 = (x1 + y1 * gridWidth) * gridStride;
    addUpdatedChunk(x, y);
    addUpdatedChunk(x1, y1);
    if (grid[index1 + ID] == DELETER) {
        grid[index + 0] = AIR;
        grid[index + 1] = 0;
        grid[index + 3] = tick;
        return;
    }
    if (grid[index1 + ID] == MONSTER) {
        grid[index + 0] = AIR;
        grid[index + 1] = 0;
        grid[index + 3] = tick;
        grid[index1 + 0] = AIR;
        grid[index1 + 3] = tick;
        return;
    }
    let data0 = grid[index + 0]; // id
    let data1 = grid[index + 1]; // on fire
    // let data2 = grid[index + 2]; // updated
    let data3 = grid[index + 3]; // updated
    // let data3 = grid[index + 3]; // r
    // let data4 = grid[index + 4]; // g
    // let data5 = grid[index + 5]; // b
    // let data6 = grid[index + 6]; // a
    grid[index + 0] = grid[index1 + 0];
    grid[index + 1] = grid[index1 + 1];
    // grid[index + 2] = grid[index1 + 2];
    // grid[index + 2] = grid[index1 + 2];
    grid[index + 3] = tick;
    // grid[index + 3] = grid[index1 + 3];
    // grid[index + 4] = grid[index1 + 4];
    // grid[index + 5] = grid[index1 + 5];
    // grid[index + 6] = grid[index1 + 6];
    grid[index1 + 0] = data0;
    grid[index1 + 1] = data1;
    // grid[index1 + 2] = data2;
    // grid[index1 + 2] = data2;
    grid[index1 + 3] = tick;
    // grid[index1 + 3] = data3;
    // grid[index1 + 4] = data4;
    // grid[index1 + 5] = data5;
    // grid[index1 + 6] = data6;
};
function fall(x, y, isMoveable = isAir) {
    if (isMoveable(x, y + 1)) {
        move(x, y, x, y + 1);
    }
};
function flowSearch(x, y, distance, height, isPassable = isAir, isMoveable = isPassable) {
    if (y >= gridHeight - height) {
        return false;
    }
    let left = 0;
    let right = 0;
    for (let i = 1; i <= distance; i++) {
        if (left < 0) {

        }
        else if (!isMoveable(x - i, y)) {
            left = -i;
            if (isPassable(x - i + 1, y + 1) && !isPassable(x - i, y)) {
                let air = true;
                for (let j = 1; j <= height; j++) {
                    if (!isMoveable(x - i, y + j)) {
                        air = false;
                        break;
                    }
                }
                if (air) {
                    left = 1;
                }
            }
        }
        else {
            let air = true;
            for (let j = 0; j <= height; j++) {
                if (!isMoveable(x - i, y + j)) {
                    air = false;
                    break;
                }
            }
            if (air) {
                left = 1;
            }
        }
        if (right < 0) {

        }
        else if (!isMoveable(x + i, y)) {
            right = -i;
            if (isPassable(x + i - 1, y + 1) && !isPassable(x + i, y)) {
                let air = true;
                for (let j = 1; j <= height; j++) {
                    if (!isMoveable(x + i, y + j)) {
                        air = false;
                        break;
                    }
                }
                if (air) {
                    right = 1;
                }
            }
        }
        else {
            let air = true;
            for (let j = 0; j <= height; j++) {
                if (!isMoveable(x + i, y + j)) {
                    air = false;
                    break;
                }
            }
            if (air) {
                right = 1;
            }
        }
        if (left == 1 || right == 1) {
            if (left == 1 && right == 1) {
                if (random() < 0.5) {
                    return -i;
                }
                else {
                    return i;
                }
            }
            else if (left == 1) {
                return -i;
            }
            else if (right == 1) {
                return i;
            }
        }
        if (left < 0 && right < 0) {
            if (!isPassable(x, y - 1)) {
                let leftAir = 0;
                let rightAir = 0;
                for (let j = i; j <= distance; j++) {
                    if (leftAir == 0 && !isPassable(x - j, y)) {
                        leftAir = j;
                    }
                    if (rightAir == 0 && !isPassable(x + j, y)) {
                        rightAir = j;
                    }
                    if (leftAir != 0 || rightAir != 0) {
                        if (leftAir != 0) {
                            if (isMoveable(x - 1, y)) {
                                return -i;
                            }
                        }
                        else if (rightAir != 0) {
                            if (isMoveable(x + 1, y)) {
                                return i;
                            }
                        }
                        break;
                    }
                }
                // if (left < right) {
                //     if (isMoveable(x + 1, y)) {
                //         return i;
                //     }
                //     // if (isPassable(x + 1, y) || isId(x + 1, y, WATER)) {
                //     //     return -i;
                //     // }
                // }
                // else if (right < left) {
                //     if (isMoveable(x - 1, y)) {
                //         return -i;
                //     }
                //     // if (isPassable(x - 1, y) || isId(x - 1, y, WATER)) {
                //     //     return i;
                //     // }
                // }
            }
            if (left == -1 && right == -1) {
                return false;
            }
            return 0;
        }
    }
    return 0;
};
function flow(x, y, distance, height, isPassable = isAir, isMoveable = isPassable) {
    if (isMoveable(x, y + 1)) {
        move(x, y, x, y + 1);
        return;
    }
    let direction = flowSearch(x, y, distance, height, isPassable, isMoveable);
    if (direction === false) {
    }
    else if (direction == 0) {
        if (distance > 2 || height > 2) {
            addUpdatedChunk(x, y);
        }
    }
    else if (Math.abs(direction) == 1) {
        move(x, y, x + direction, y + 1);
    }
    else {
        move(x, y, x + Math.sign(direction), y);
    }
};
function riseSearch(x, y, distance, height, isPassable = isAir, isMoveable = isPassable) {
    if (y < height) {
        return false;
    }
    let left = 0;
    let right = 0;
    for (let i = 1; i <= distance; i++) {
        if (left < 0) {

        }
        else if (!isMoveable(x - i, y)) {
            left = -i;
            // if (isPassable(x - i + 1, y - 1) && !isPassable(x - i, y)) {
            //     let air = true;
            //     for (let j = 1; j <= height; j++) {
            //         if (!isMoveable(x - i, y - j)) {
            //             air = false;
            //             break;
            //         }
            //     }
            //     if (air) {
            //         left = 1;
            //     }
            // }
        }
        else {
            let air = true;
            for (let j = 0; j <= height; j++) {
                if (!isMoveable(x - i, y - j)) {
                    air = false;
                    break;
                }
            }
            if (air) {
                left = 1;
            }
        }
        if (right < 0) {

        }
        else if (!isMoveable(x + i, y)) {
            right = -i;
            // if (isPassable(x + i - 1, y - 1) && !isPassable(x + i, y)) {
            //     let air = true;
            //     for (let j = 1; j <= height; j++) {
            //         if (!isMoveable(x + i, y - j)) {
            //             air = false;
            //             break;
            //         }
            //     }
            //     if (air) {
            //         right = 1;
            //     }
            // }
        }
        else {
            let air = true;
            for (let j = 0; j <= height; j++) {
                if (!isMoveable(x + i, y - j)) {
                    air = false;
                    break;
                }
            }
            if (air) {
                right = 1;
            }
        }
        if (left == 1 || right == 1) {
            if (left == 1 && right == 1) {
                if (random() < 0.5) {
                    return -i;
                }
                else {
                    return i;
                }
            }
            else if (left == 1) {
                return -i;
            }
            else if (right == 1) {
                return i;
            }
        }
        if (left < 0 && right < 0) {
            if (!isPassable(x, y + 1)) {
                let leftAir = 0;
                let rightAir = 0;
                for (let j = 1; j <= distance; j++) {
                    if (leftAir == 0 && !isPassable(x - j, y)) {
                        leftAir = j;
                    }
                    if (rightAir == 0 && !isPassable(x + j, y)) {
                        rightAir = j;
                    }
                    if (leftAir != 0 || rightAir != 0) {
                        if (leftAir != 0) {
                            if (isMoveable(x - 1, y)) {
                                return -i;
                            }
                        }
                        else if (rightAir != 0) {
                            if (isMoveable(x + 1, y)) {
                                return i;
                            }
                        }
                        break;
                    }
                }
            }
            return 0;
        }
    }
    return 0;
};
function rise(x, y, distance, height, isPassable = isAir, isMoveable = isPassable) {
    if (isMoveable(x, y - 1)) {
        move(x, y, x, y - 1);
        return;
    }
    let direction = riseSearch(x, y, distance, height, isPassable, isMoveable);
    if (direction === false) {
    }
    else if (direction == 0) {
        if (distance > 2 || height > 2) {
            addUpdatedChunk(x, y);
        }
    }
    else if (Math.abs(direction) == 1) {
        move(x, y, x + direction, y - 1);
    }
    else {
        move(x, y, x + Math.sign(direction), y);
    }
};

function fillEllipse(x, y, width, height, action) {
    let widthSquared = width ** 2;
    let heightSquared = height ** 2;
    for (let i = -Math.ceil(height); i <= Math.ceil(height); i++) {
        for (let j = -Math.ceil(width); j <= Math.ceil(width); j++) {
            if (((j ** 2) / widthSquared) + ((i ** 2) / heightSquared) < 1 && isOnGrid(x + j, y + i)) {
                action(x + j, y + i);
            }
        }
    }
};

function raycast(x, y, dx, dy, isPassable) {
    let yLonger = Math.abs(dy) > Math.abs(dx);

    let shortLen = yLonger ? dx : dy;
    let longLen = yLonger ? dy : dx;

    let inc = Math.sign(longLen);

    let multDiff = shortLen / longLen;

    let cx, cy;
    if (yLonger) {
        for (let i = inc; ; i += inc) {
            cx = x + Math.round(i * multDiff);
            cy = y + i;
            if (!isOnGrid(cx, cy)) {
                return;
            }
            if (!isPassable(cx, cy)) {
                return;
            }
        }
    }
    else {
        for (let i = inc; ; i += inc) {
            cx = x + i;
            cy = y + Math.round(i * multDiff);
            if (!isOnGrid(cx, cy)) {
                return;
            }
            if (!isPassable(cx, cy)) {
                return;
            }
        }
    }
};
function raycast2(x, y, dx, dy, isPassable) {
    if (!isPassable(x, y)) {
        return;
    }
    let yLonger = Math.abs(dy) > Math.abs(dx);

    let shortLen = yLonger ? dx : dy;
    let longLen = yLonger ? dy : dx;

    let inc = Math.sign(longLen);

    let multDiff = shortLen / longLen;

    let cx, cy;
    if (yLonger) {
        for (let i = inc; ; i += inc) {
            cx = x + Math.round(i * multDiff);
            cy = y + i;
            if (!isOnGrid(cx, cy)) {
                return;
            }
            if (!isPassable(cx, cy)) {
                return;
            }
        }
    }
    else {
        for (let i = inc; ; i += inc) {
            cx = x + i;
            cy = y + Math.round(i * multDiff);
            if (!isOnGrid(cx, cy)) {
                return;
            }
            if (!isPassable(cx, cy)) {
                return;
            }
        }
    }
};
// raytrace
// function raytrace(x1, y1, x2, y2, isPassable) {
//     let slope = (y2 - y1) / (x2 - x1);
//     if (slope == 0 || !isFinite(slope)) {

//     }
//     if (Math.abs(slope) < 1) {
//         let minY = x2 < x1 ? y2 : y1;
//         let minX = Math.min(x1, x2);
//         let maxX = Math.max(x1, x2);
//         let start = Math.max(0, Math.max(minX, (-minY / slope - 0.5) + minX);
//         let end = Math.min(gridWidth - 1, maxX);
//         for (let x = start; x <= end; x++) {
//             let y = Math.round(slope * (x - minX)) + minY;
//             if (y < 0 || y >= gridHeight || isPassable(x, y)) {
//                 break;
//             }
//         }
//     } else {
//         slope = (x2 - x1) / (y1 - y1);
//         let xmin = y2 < y1 ? x2 : x1;
//         let start = Math.max(0, Math.min(y2, y1));
//         let end = Math.min(gridHeight - 1, Math.max(y2, y1));
//         for (let y = start, x = 0; y <= end; y++) {
//             x = Math.round(slope * (y - start)) + xmin;
//             if (x < 0 || x >= gridWidth || cb(x, y)) break;
//         }
//     }
// };

function explode(x, y, radiusSquared, rays, power) {
    let changed = [];
    addPixel(x, y, AIR);
    addFire(x, y, 1);
    addTeam(x, y, -1);
    // let size = 150;
    // let rays = 15;
    for (let i = 0; i < rays; i++) {
        let angle = i * Math.PI * 2 / rays;
        let rayPower = power;
        raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
            let dist = Math.sqrt(((x1 - x) ** 2 + (y1 - y) ** 2) / radiusSquared);
            let index1 = (x1 + y1 * gridWidth) * gridStride;
            rayPower -= dist * power;
            if (rayPower < 0) {
                return false;
            }
            let id = grid[index1 + ID];
            let blastResistance = pixels[id].blastResistance;
            if (blastResistance == -1) {
                return false;
            }
            if (random() > blastResistance / rayPower) {
                if (!changed[x1 + y1 * gridWidth]) {
                    changed[x1 + y1 * gridWidth] = true;
                    if (random() > blastResistance / rayPower + 0.5) {
                        addFire(x1, y1, 1);
                    }
                    if (id == AIR) {

                    }
                    else if (id == ASH) {
                        addPixel(x1, y1, AIR);
                        addTeam(x1, y1, -1);
                    }
                    else if ((id == WATER || id == ICE || id == SNOW) && random() > 3200 / rayPower) {
                        addPixel(x1, y1, STEAM);
                    }
                    else if (id == GUNPOWDER) {
                        addPixel(x1, y1, ACTIVATED_GUNPOWDER);
                    }
                    else if (id == ACTIVATED_GUNPOWDER) {

                    }
                    else if (id == C4) {
                        addPixel(x1, y1, ACTIVATED_C4);
                    }
                    else if (id == ACTIVATED_C4) {

                    }
                    else if (id == NUKE) {
                        addPixel(x1, y1, ACTIVATED_NUKE);
                    }
                    else if (id == ACTIVATED_NUKE) {

                    }
                    // else if (random() < 40 / power) {
                    else if (random() < 0.5) {
                        if (id == CONCRETE || id == STONE || id == BASALT || id == BRICKS) {
                            addPixel(x1, y1, GRAVEL);
                        }
                        else {
                            addPixel(x1, y1, ASH);
                        }
                    }
                    else {
                        addPixel(x1, y1, AIR);
                        addTeam(x1, y1, -1);
                    }
                }
                rayPower -= blastResistance / 40;
            }
            else {
                rayPower -= blastResistance / 5;
            }
            rayPower += dist * power;
            return true;
        });
    }
};

let workedPushPixels = null;
let failedPushPixels = null;

let workedPushPixelsArray = [new Int32Array(), new Int32Array(), new Int32Array()];
let failedPushPixelsArray = [new Int32Array(), new Int32Array(), new Int32Array()];

function resetPushPixels() {
    let pushPixelsArray = [];
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            pushPixelsArray.push(0);
        }
    }
    for (let i = 0; i < 3; i++) {
        workedPushPixelsArray[i] = new Int32Array(pushPixelsArray);
        failedPushPixelsArray[i] = new Int32Array(pushPixelsArray);
    }
};

// there are spaghetti push comments


let pushStrength = 0;

function setPushPixels() {
    workedPushPixels = workedPushPixelsArray[pushStrength];
    failedPushPixels = failedPushPixelsArray[pushStrength];
};

function pushLeft(x, y, selfX, selfY, strength) {
    pushStrength = strength;
    setPushPixels();
    let [worked, pushPixels] = pushLeftCheck(x, y, -1, -1, true);
    let pushedSelf = false;
    if (worked && pushPixels[selfY] != null && pushPixels[selfY][selfX] != null) {
        // prevent cloners from marking themselves as unpushable
        pushedSelf = true;
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                // necessary
                workedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
            }
        }
        [worked, pushPixels] = pushLeftCheck(x, y, selfX, selfY, true);
    }
    if (worked) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                i = Number(i);
                j = Number(j);
                // unnecessary
                workedPushPixels[j + i * gridWidth] = tick;
                let index = (j - 1 + i * gridWidth) * gridStride;
                if (grid[index + ID] != AIR && grid[index + ID] != MONSTER) {
                    addPixel(j, i, AIR);
                    addTeam(j, i, -1);
                }
                else if (grid[(j + i * gridWidth) * gridStride + ID] == COLLAPSABLE) {
                    move(j, i, j - 1, i);
                    addFire(j, i, 0);
                    addPixel(j, i, COLLAPSABLE);
                }
                else {
                    move(j, i, j - 1, i);
                    addFire(j, i, 0);
                }
            }
        }
        // if (grid[(x + y * gridWidth) * gridStride + ID] == MONSTER) {
        //     addPixel(x, y, AIR);
        // }
        return true;
    }
    else if (!pushedSelf) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 3) {
                    continue;
                }
                failedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
            }
        }
    }
    return false;
};
function pushLeftCheck(x, y, selfX, selfY, allowRecursion) {
    let pushPixels = [];
    let queue = [x + y * gridWidth + gridWidth * gridHeight];
    let worked = true;
    push: while (queue.length > 0) {
        let index = queue.pop();
        let stronglyConnected = index > gridWidth * gridHeight;
        index = index % (gridWidth * gridHeight);
        let x1 = index % gridWidth;
        let y1 = (index - x1) / gridWidth;
        function pushFail(x2) {
            if (selfX == -1 && selfY == -1) {
                for (let x3 = x1; x3 >= x2; x3--) {
                    // pushPixels[y][x2] = 3;
                    // failedPushPixels[x3 + y1 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] = tick;
                    failedPushPixels[x3 + y1 * gridWidth] = tick;
                }
            }
            worked = false;
        };
        let xPos;
        let x2;
        for (x2 = x1; x2 >= 0; x2--) {
            if (x2 == selfX && y1 == selfY) {
                pushFail(x2);
                break push;
            }
            let index1 = (x2 + y1 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            if (id == AIR || id == DELETER || id == MONSTER) {
                // cloner can push all
                // piston can't push piston
                // pusher can't push piston
                // fan can't push piston and pusher and fan?
                if (pushStrength == 0 && x2 != 0) {
                    let index2 = (x2 - 1 + y1 * gridWidth) * gridStride;
                    let id1 = grid[index2 + ID];
                    if ((id1 == PUSHER_RIGHT || id1 == FAN_RIGHT) && !isDeactivated(x2 - 1, y1)) {
                        pushFail(x2);
                        break push;
                    }
                }
                xPos = x2;
                break;
            }
            if (failedPushPixels[x2 + y1 * gridWidth] == tick) {
                if (x2 != x1) {
                    pushFail(x2 + 1);
                }
                worked = false;
                break push;
            }
            if (!allowRecursion && selfX == -1 && selfY == -1 && workedPushPixels[x2 + y1 * gridWidth] == tick) {
                xPos = x2;
                break;
            }
            if (grid[index1 + UPDATED] == tick) {
                if (x2 != x1) {
                    pushFail(x2 + 1);
                    modal("Push error", "Tried to push updated pixel left (this might not be an error)", "error");
                    break push;
                }
                worked = false;
                modal("Push error", "Tried to push updated pixel left 2 (this might not be an error)", "error");
                // continue push;
                break push;
            }
            if (pushPixels[y1] == null) {
                pushPixels[y1] = [];
            }
            // if (id == COLLAPSABLE) {
            //     if (!allowRecursion) {
            //         xPos = x2 - 1;
            //         break;
            //     }
            //     // it shouldn't be possilbe for the pixel in front to be updated
            //     // if (x2 == 0 || failedPushPixels[x2 - 1 + y1 * gridWidth] == tick || grid[(x2 - 1 + y1 * gridWidth) * gridStride + UPDATED] == tick) {
            //     if (x2 == 0) {
            //         xPos = x2 - 1;
            //         break;
            //     }
            //     else {
            //         // see if we can push with collapsing
            //         // if we cannot, then we collapse this one
            //         let [worked1, pushPixels1] = pushLeftCheck(x2 - 1, y1, selfX, selfY, false);
            //         // we will collapse if we cannot push, allowing collapses (instant) but not unsticks
            //         if (worked1) {
            //             for (let i in pushPixels1) {
            //                 for (let j in pushPixels1[i]) {
            //                     if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
            //                         continue;
            //                     }
            //                     workedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
            //                 }
            //             }
            //         }
            //         else {
            //             // prevent cloners from marking themselves as unpushable
            //             if (selfX == -1 && selfY == -1) {
            //                 for (let i in pushPixels1) {
            //                     for (let j in pushPixels1[i]) {
            //                         if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
            //                             continue;
            //                         }
            //                         failedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
            //                     }
            //                 }
            //             }
            //             xPos = x2 - 1;
            //             break;
            //         }
            //     }
            // }
            if (pushPixels[y1][x2] == null) {
                if (pushStrength < 2 && id == PISTON_RIGHT && !isDeactivated(x2, y1)) {
                    pushFail(x2);
                    break push;
                }
                if (!pixels[id].pushableLeft) {
                    pushFail(x2);
                    break push;
                }
            }
            else {
                xPos = x2;
                break;
            }
        }
        if (xPos == null) {
            pushFail(x2);
            break push;
        }
        function canUnstick(slimeX, slimeY) {
            if (!allowRecursion) {
                return true;
            }
            let [worked1, pushPixels1] = pushLeftCheck(slimeX, slimeY, selfX, selfY, false);
            // we will unstick if we cannot push, allowing collapses (instant) AND unsticks (instant)
            if (worked1) {
                for (let i in pushPixels1) {
                    for (let j in pushPixels1[i]) {
                        if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
                            continue;
                        }
                        workedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
                    }
                }
            }
            else {
                // prevent cloners from marking themselves as unpushable
                if (selfX == -1 && selfY == -1) {
                    for (let i in pushPixels1) {
                        for (let j in pushPixels1[i]) {
                            if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
                                continue;
                            }
                            failedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
                        }
                    }
                }
                return true;
            }
            return false;
        };
        for (let x2 = x1; x2 > xPos; x2--) {
            let index1 = (x2 + y1 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            pushPixels[y1][x2] = stronglyConnected ? 2 : 1;
            if (pixels[id].sticky) {
                stick: if (y1 > 0) {
                    let slimeX = x2;
                    let slimeY = y1 - 1;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableDown && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                stick: if (y1 < gridHeight - 1) {
                    let slimeX = x2;
                    let slimeY = y1 + 1;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableUp && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                stick: if (x2 == x1 && x2 < gridWidth - 1) {
                    let slimeX = x2 + 1;
                    let slimeY = y1;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableLeft && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
            }
            else {
                // if (y1 > 0) {
                //     let slimeX = x2;
                //     let slimeY = y1 - 1;
                //     if (grid[slimeIndex + ID] == GLUE && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                //         queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                //     }
                // }
                // if (y1 < gridHeight - 1) {
                //     let slimeX = x2;
                //     let slimeY = y1 + 1;
                //     if (grid[slimeIndex + ID] == GLUE && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                //         queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                //     }
                // }
                // if (x2 == x1) {
                //     if (x2 < gridWidth - 1) {
                //         let slimeX = x2 + 1;
                //         let slimeY = y1;
                //         if (grid[slimeIndex + ID] == GLUE && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                //             queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                //         }
                //     }
                // }
                stronglyConnected = false;
            }
        }
    }
    return [worked, pushPixels];
};
function pushRight(x, y, selfX, selfY, strength) {
    pushStrength = strength;
    setPushPixels();
    let [worked, pushPixels] = pushRightCheck(x, y, -1, -1, true);
    let pushedSelf = false;
    if (worked && pushPixels[selfY] != null && pushPixels[selfY][gridWidth - selfX] != null) {
        pushedSelf = true;
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                workedPushPixels[gridWidth - Number(j) + Number(i) * gridWidth] = tick;
            }
        }
        [worked, pushPixels] = pushRightCheck(x, y, selfX, selfY, true);
    }
    if (worked) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                i = Number(i);
                let j2 = gridWidth - Number(j);
                workedPushPixels[j2 + i * gridWidth] = tick;
                let index = (j2 + 1 + i * gridWidth) * gridStride;
                if (grid[index + ID] != AIR && grid[index + ID] != MONSTER) {
                    addPixel(j2, i, AIR);
                    addTeam(j2, i, -1);
                }
                else if (grid[(j2 + i * gridWidth) * gridStride + ID] == COLLAPSABLE) {
                    move(j2, i, j2 + 1, i);
                    addFire(j2, i, 0);
                    addPixel(j2, i, COLLAPSABLE);
                }
                else {
                    move(j2, i, j2 + 1, i);
                    addFire(j2, i, 0);
                }
            }
        }
        // if (grid[(x + y * gridWidth) * gridStride + ID] == MONSTER) {
        //     addPixel(x, y, AIR);
        // }
        return true;
    }
    else if (!pushedSelf) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 3) {
                    continue;
                }
                failedPushPixels[gridWidth - Number(j) + Number(i) * gridWidth] = tick;
            }
        }
    }
    return false;
};
function pushRightCheck(x, y, selfX, selfY, allowRecursion) {
    let pushPixels = [];
    let queue = [x + y * gridWidth + gridWidth * gridHeight];
    let worked = true;
    push: while (queue.length > 0) {
        let index = queue.pop();
        let stronglyConnected = index > gridWidth * gridHeight;
        index = index % (gridWidth * gridHeight);
        let x1 = index % gridWidth;
        let y1 = (index - x1) / gridWidth;
        function pushFail(x2) {
            if (selfX == -1 && selfY == -1) {
                for (let x3 = x1; x3 <= x2; x3++) {
                    // pushPixels[y][x2] = 3;
                    // failedPushPixels[x3 + y1 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] = tick;
                    failedPushPixels[x3 + y1 * gridWidth] = tick;
                }
            }
            worked = false;
        };
        let xPos;
        let x2;
        for (x2 = x1; x2 < gridWidth; x2++) {
            if (x2 == selfX && y1 == selfY) {
                pushFail(x2);
                break push;
            }
            let index1 = (x2 + y1 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            if (id == AIR || id == DELETER || id == MONSTER) {
                if (pushStrength == 0 && x2 != gridWidth - 1) {
                    let index2 = (x2 + 1 + y1 * gridWidth) * gridStride;
                    let id1 = grid[index2 + ID];
                    if ((id1 == PUSHER_LEFT || id1 == FAN_LEFT) && !isDeactivated(x2 + 1, y1)) {
                        pushFail(x2);
                        break push;
                    }
                }
                xPos = x2;
                break;
            }
            if (failedPushPixels[x2 + y1 * gridWidth] == tick) {
                if (x2 != x1) {
                    pushFail(x2 + 1);
                }
                worked = false;
                break push;
            }
            if (!allowRecursion && selfX == -1 && selfY == -1 && workedPushPixels[x2 + y1 * gridWidth] == tick) {
                xPos = x2;
                break;
            }
            if (grid[index1 + UPDATED] == tick) {
                if (x2 != x1) {
                    pushFail(x2 + 1);
                    modal("Push error", "Tried to push updated pixel right (this might not be an error)", "error");
                    break push;
                }
                worked = false;
                modal("Push error", "Tried to push updated pixel right 2 (this might not be an error)", "error");
                // continue push;
                break push;
            }
            if (pushPixels[y1] == null) {
                pushPixels[y1] = [];
            }
            // if (id == COLLAPSABLE) {
            //     if (!allowRecursion) {
            //         xPos = x2 + 1;
            //         break;
            //     }
            //     if (x2 == gridWidth - 1) {
            //         xPos = x2 + 1;
            //         break;
            //     }
            //     else {
            //         // see if we can push with collapsing
            //         // if we cannot, then we collapse this one
            //         let [worked1, pushPixels1] = pushRightCheck(x2 + 1, y1, selfX, selfY, false);
            //         if (worked1) {
            //             for (let i in pushPixels1) {
            //                 for (let j in pushPixels1[i]) {
            //                     if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
            //                         continue;
            //                     }
            //                     workedPushPixels[gridWidth - Number(j) + Number(i) * gridWidth] = tick;
            //                 }
            //             }
            //         }
            //         else {
            //             // prevent cloners from marking themselves as unpushable
            //             if (selfX == -1 && selfY == -1) {
            //                 for (let i in pushPixels1) {
            //                     for (let j in pushPixels1[i]) {
            //                         if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
            //                             continue;
            //                         }
            //                         failedPushPixels[gridWidth - Number(j) + Number(i) * gridWidth] = tick;
            //                     }
            //                 }
            //             }
            //             xPos = x2 + 1;
            //             break;
            //         }
            //     }
            // }
            if (pushPixels[y1][gridWidth - x2] == null) {
                if (pushStrength < 2 && id == PISTON_LEFT && !isDeactivated(x2, y1)) {
                    pushFail(x2);
                    break push;
                }
                if (!pixels[id].pushableRight) {
                    pushFail(x2);
                    break push;
                }
            }
            else {
                xPos = x2;
                break;
            }
        }
        if (xPos == null) {
            pushFail(x2);
            break push;
        }
        function canUnstick(slimeX, slimeY) {
            if (!allowRecursion) {
                return true;
            }
            let [worked1, pushPixels1] = pushRightCheck(slimeX, slimeY, selfX, selfY, false);
            // we will unstick if we cannot push, allowing collapses (instant) AND unsticks (instant)
            if (worked1) {
                for (let i in pushPixels1) {
                    for (let j in pushPixels1[i]) {
                        if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
                            continue;
                        }
                        workedPushPixels[gridWidth - Number(j) + Number(i) * gridWidth] = tick;
                    }
                }
            }
            else {
                // prevent cloners from marking themselves as unpushable
                if (selfX == -1 && selfY == -1) {
                    for (let i in pushPixels1) {
                        for (let j in pushPixels1[i]) {
                            if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
                                continue;
                            }
                            failedPushPixels[gridWidth - Number(j) + Number(i) * gridWidth] = tick;
                        }
                    }
                }
                return true;
            }
            return false;
        };
        for (let x2 = x1; x2 < xPos; x2++) {
            let index1 = (x2 + y1 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            pushPixels[y1][gridWidth - x2] = stronglyConnected ? 2 : 1;
            if (pixels[id].sticky) {
                stick: if (y1 > 0) {
                    let slimeX = x2;
                    let slimeY = y1 - 1;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableDown && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][gridWidth - slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                stick: if (y1 < gridHeight - 1) {
                    let slimeX = x2;
                    let slimeY = y1 + 1;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableUp && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][gridWidth - slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                stick: if (x2 == x1 && x2 > 0) {
                    let slimeX = x2 - 1;
                    let slimeY = y1;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableRight && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][gridWidth - slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
            }
            else {
                stronglyConnected = false;
            }
        }
    }
    return [worked, pushPixels];
};
function pushUp(x, y, selfX, selfY, strength) {
    pushStrength = strength;
    setPushPixels();
    let [worked, pushPixels] = pushUpCheck(x, y, -1, -1, true);
    // alert("setp1")
    let pushedSelf = false;
    if (worked && pushPixels[selfY] != null && pushPixels[selfY][selfX] != null) {
        pushedSelf = true;
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                workedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
            }
        }
        [worked, pushPixels] = pushUpCheck(x, y, selfX, selfY, true);
        // alert("setp2")
    }
    if (worked) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                i = Number(i);
                j = Number(j);
                workedPushPixels[j + i * gridWidth] = tick;
                let index = (j + (i - 1) * gridWidth) * gridStride;
                if (grid[index + ID] != AIR && grid[index + ID] != MONSTER) {
                    addPixel(j, i, AIR);
                    addTeam(j, i, -1);
                }
                else if (grid[(j + i * gridWidth) * gridStride + ID] == COLLAPSABLE) {
                    move(j, i, j, i - 1);
                    addFire(j, i, 0);
                    addPixel(j, i, COLLAPSABLE);
                }
                else {
                    move(j, i, j, i - 1);
                    addFire(j, i, 0);
                }
            }
        }
        // if (grid[(x + y * gridWidth) * gridStride + ID] == MONSTER) {
        //     addPixel(x, y, AIR);
        // }
        return true;
    }
    else if (!pushedSelf) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 3) {
                    continue;
                }
                failedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
            }
        }
    }
    return false;
};
function pushUpCheck(x, y, selfX, selfY, allowRecursion) {
    let pushPixels = [];
    let queue = [x + y * gridWidth + gridWidth * gridHeight];
    let worked = true;
    push: while (queue.length > 0) {
        let index = queue.pop();
        let stronglyConnected = index > gridWidth * gridHeight;
        index = index % (gridWidth * gridHeight);
        let x1 = index % gridWidth;
        let y1 = (index - x1) / gridWidth;
        function pushFail(y2) {
            if (selfX == -1 && selfY == -1) {
                for (let y3 = y1; y3 >= y2; y3--) {
                    // pushPixels[y][x2] = 3;
                    // failedPushPixels[x1 + y3 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] = tick;
                    failedPushPixels[x1 + y3 * gridWidth] = tick;
                }
            }
            worked = false;
        };
        let yPos;
        let y2;
        for (y2 = y1; y2 >= 0; y2--) {
            if (x1 == selfX && y2 == selfY) {
                pushFail(y2);
                break push;
            }
            let index1 = (x1 + y2 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            if (id == AIR || id == DELETER || id == MONSTER) {
                if (pushStrength == 0 && y2 != 0) {
                    let index2 = (x1 + (y2 - 1) * gridWidth) * gridStride;
                    let id1 = grid[index2 + ID];
                    if ((id1 == PUSHER_DOWN || id1 == FAN_DOWN) && !isDeactivated(x1, y2 - 1)) {
                        pushFail(y2);
                        break push;
                    }
                }
                yPos = y2;
                break;
            }
            if (failedPushPixels[x1 + y2 * gridWidth] == tick) {
                if (y2 != y1) {
                    pushFail(y2 + 1);
                }
                worked = false;
                break push;
            }
            if (!allowRecursion && selfX == -1 && selfY == -1 && workedPushPixels[x1 + y2 * gridWidth] == tick) {
                yPos = y2;
                break;
            }
            if (grid[index1 + UPDATED] == tick) {
                if (y2 != y1) {
                    pushFail(y2 + 1);
                    modal("Push error", "Tried to push updated pixel up (this might not be an error)", "error");
                    break push;
                }
                worked = false;
                modal("Push error", "Tried to push updated pixel up 2 (this might not be an error)", "error");
                // continue push;
                break push;
            }
            if (pushPixels[y2] == null) {
                pushPixels[y2] = [];
            }
            // if (id == COLLAPSABLE) {
            //     if (!allowRecursion) {
            //         yPos = y2 - 1;
            //         break;
            //     }
            //     if (y2 == 0) {
            //         yPos = y2 - 1;
            //         break;
            //     }
            //     else {
            //         // see if we can push with collapsing
            //         // if we cannot, then we collapse this one
            //         let [worked1, pushPixels1] = pushUpCheck(x1, y2 - 1, selfX, selfY, false);
            //         // alert(worked1)
            //         if (worked1) {
            //             for (let i in pushPixels1) {
            //                 for (let j in pushPixels1[i]) {
            //                     if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
            //                         continue;
            //                     }
            //                     workedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
            //                 }
            //             }
            //         }
            //         else {
            //             // prevent cloners from marking themselves as unpushable
            //             if (selfX == -1 && selfY == -1) {
            //                 for (let i in pushPixels1) {
            //                     for (let j in pushPixels1[i]) {
            //                         if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
            //                             continue;
            //                         }
            //                         failedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
            //                     }
            //                 }
            //             }
            //             yPos = y2 - 1;
            //             break;
            //         }
            //     }
            // }
            if (pushPixels[y2][x1] == null) {
                if (pushStrength < 2 && id == PISTON_DOWN && !isDeactivated(x1, y2)) {
                    pushFail(y2);
                    break push;
                }
                if (!pixels[id].pushableUp) {
                    pushFail(y2);
                    break push;
                }
            }
            else {
                yPos = y2;
                break;
            }
        }
        if (yPos == null) {
            pushFail(y2);
            break push;
        }
        function canUnstick(slimeX, slimeY) {
            if (!allowRecursion) {
                return true;
            }
            let [worked1, pushPixels1] = pushUpCheck(slimeX, slimeY, selfX, selfY, false);
            // we will unstick if we cannot push, allowing collapses (instant) AND unsticks (instant)
            if (worked1) {
                for (let i in pushPixels1) {
                    for (let j in pushPixels1[i]) {
                        if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
                            continue;
                        }
                        workedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
                    }
                }
            }
            else {
                // prevent cloners from marking themselves as unpushable
                if (selfX == -1 && selfY == -1) {
                    for (let i in pushPixels1) {
                        for (let j in pushPixels1[i]) {
                            if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
                                continue;
                            }
                            failedPushPixels[Number(j) + Number(i) * gridWidth] = tick;
                        }
                    }
                }
                return true;
            }
            return false;
        };
        for (let y2 = y1; y2 > yPos; y2--) {
            let index1 = (x1 + y2 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            pushPixels[y2][x1] = stronglyConnected ? 2 : 1;
            if (pixels[id].sticky) {
                stick: if (x1 > 0) {
                    let slimeX = x1 - 1;
                    let slimeY = y2;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableRight && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                stick: if (x1 < gridWidth - 1) {
                    let slimeX = x1 + 1;
                    let slimeY = y2;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableLeft && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                stick: if (y2 == y1 && y2 < gridHeight - 1) {
                    let slimeX = x1;
                    let slimeY = y2 + 1;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableUp && grid[slimeIndex + UPDATED] != tick && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
            }
            else {
                stronglyConnected = false;
            }
        }
    }
    return [worked, pushPixels];
};
function pushDown(x, y, selfX, selfY, strength) {
    pushStrength = strength;
    setPushPixels();
    let [worked, pushPixels] = pushDownCheck(x, y, -1, -1, true);
    let pushedSelf = false;
    if (worked && pushPixels[gridHeight - selfY] != null && pushPixels[gridHeight - selfY][selfX] != null) {
        pushedSelf = true;
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                workedPushPixels[Number(j) + (gridHeight - Number(i)) * gridWidth] = tick;
            }
        }
        [worked, pushPixels] = pushDownCheck(x, y, selfX, selfY, true);
    }
    if (worked) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                let i2 = gridHeight - Number(i);
                j = Number(j);
                workedPushPixels[j + i2 * gridWidth] = tick;
                let index = (j + (i2 + 1) * gridWidth) * gridStride;
                if (grid[index + ID] != AIR && grid[index + ID] != MONSTER) {
                    addPixel(j, i2, AIR);
                    addTeam(j, i2, -1);
                }
                else if (grid[(j + i2 * gridWidth) * gridStride + ID] == COLLAPSABLE) {
                    move(j, i2, j, i2 + 1);
                    addFire(j, i2, 0);
                    addPixel(j, i2, COLLAPSABLE);
                }
                else {
                    move(j, i2, j, i2 + 1);
                    addFire(j, i2, 0);
                }
            }
        }
        // if (grid[(x + y * gridWidth) * gridStride + ID] == MONSTER) {
        //     addPixel(x, y, AIR);
        // }
        return true;
    }
    else if (!pushedSelf) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 3) {
                    continue;
                }
                failedPushPixels[Number(j) + (gridHeight - Number(i)) * gridWidth] = tick;
            }
        }
    }
    return false;
};
function pushDownCheck(x, y, selfX, selfY, allowRecursion) {
    let pushPixels = [];
    let queue = [x + y * gridWidth + gridWidth * gridHeight];
    let worked = true;
    push: while (queue.length > 0) {
        let index = queue.pop();
        let stronglyConnected = index > gridWidth * gridHeight;
        index = index % (gridWidth * gridHeight);
        let x1 = index % gridWidth;
        let y1 = (index - x1) / gridWidth;
        function pushFail(y2) {
            if (selfX == -1 && selfY == -1) {
                for (let y3 = y1; y3 <= y2; y3++) {
                    // pushPixels[y][x2] = 3;
                    // failedPushPixels[x1 + y3 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] = tick;
                    failedPushPixels[x1 + y3 * gridWidth] = tick;
                }
            }
            worked = false;
        };
        let yPos;
        let y2;
        for (y2 = y1; y2 < gridHeight; y2++) {
            if (x1 == selfX && y2 == selfY) {
                pushFail(y2);
                break push;
            }
            let index1 = (x1 + y2 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            if (id == AIR || id == DELETER || id == MONSTER) {
                if (pushStrength == 0 && y2 != gridHeight - 1) {
                    let index2 = (x1 + (y2 + 1) * gridWidth) * gridStride;
                    let id1 = grid[index2 + ID];
                    if ((id1 == PUSHER_UP || id1 == FAN_UP) && !isDeactivated(x1, y2 + 1)) {
                        pushFail(y2);
                        break push;
                    }
                }
                yPos = y2;
                break;
            }
            if (failedPushPixels[x1 + y2 * gridWidth] == tick) {
                if (y2 != y1) {
                    pushFail(y2 + 1);
                }
                worked = false;
                break push;
            }
            if (!allowRecursion && selfX == -1 && selfY == -1 && workedPushPixels[x1 + y2 * gridWidth] == tick) {
                yPos = y2;
                break;
            }
            if (grid[index1 + UPDATED] == tick) {
                if (y2 != y1) {
                    pushFail(y2 + 1);
                    modal("Push error", "Tried to push updated pixel down (this might not be an error)", "error");
                    break push;
                }
                worked = false;
                modal("Push error", "Tried to push updated pixel down 2 (this might not be an error)", "error");
                // continue push;
                break push;
            }
            if (pushPixels[gridHeight - y2] == null) {
                pushPixels[gridHeight - y2] = [];
            }
            // if (id == COLLAPSABLE) {
            //     if (!allowRecursion) {
            //         yPos = y2 + 1;
            //         break;
            //     }
            //     if (y2 == gridHeight - 1) {
            //         yPos = y2 + 1;
            //         break;
            //     }
            //     else {
            //         // see if we can push with collapsing
            //         // if we cannot, then we collapse this one
            //         let [worked1, pushPixels1] = pushDownCheck(x1, y2 + 1, selfX, selfY, false);
            //         if (worked1) {
            //             for (let i in pushPixels1) {
            //                 for (let j in pushPixels1[i]) {
            //                     if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
            //                         continue;
            //                     }
            //                     workedPushPixels[Number(j) + (gridHeight - Number(i)) * gridWidth] = tick;
            //                 }
            //             }
            //         }
            //         else {
            //             // prevent cloners from marking themselves as unpushable
            //             if (selfX == -1 && selfY == -1) {
            //                 for (let i in pushPixels1) {
            //                     for (let j in pushPixels1[i]) {
            //                         if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
            //                             continue;
            //                         }
            //                         failedPushPixels[Number(j) + (gridHeight - Number(i)) * gridWidth] = tick;
            //                     }
            //                 }
            //             }
            //             yPos = y2 + 1;
            //             break;
            //         }
            //     }
            // }
            if (pushPixels[gridHeight - y2][x1] == null) {
                if (pushStrength < 2 && id == PISTON_UP && !isDeactivated(x1, y2)) {
                    pushFail(y2);
                    break push;
                }
                if (!pixels[id].pushableDown) {
                    pushFail(y2);
                    break push;
                }
            }
            else {
                yPos = y2;
                break;
            }
        }
        if (yPos == null) {
            pushFail(y2);
            break push;
        }
        function canUnstick(slimeX, slimeY) {
            if (!allowRecursion) {
                return true;
            }
            let [worked1, pushPixels1] = pushDownCheck(slimeX, slimeY, selfX, selfY, false);
            // we will unstick if we cannot push, allowing collapses (instant) AND unsticks (instant)
            if (worked1) {
                for (let i in pushPixels1) {
                    for (let j in pushPixels1[i]) {
                        if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
                            continue;
                        }
                        workedPushPixels[Number(j) + (gridHeight - Number(i)) * gridWidth] = tick;
                    }
                }
            }
            else {
                // prevent cloners from marking themselves as unpushable
                if (selfX == -1 && selfY == -1) {
                    for (let i in pushPixels1) {
                        for (let j in pushPixels1[i]) {
                            if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
                                continue;
                            }
                            failedPushPixels[Number(j) + (gridHeight - Number(i)) * gridWidth] = tick;
                        }
                    }
                }
                return true;
            }
            return false;
        };
        for (let y2 = y1; y2 < yPos; y2++) {
            let index1 = (x1 + y2 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            pushPixels[gridHeight - y2][x1] = stronglyConnected ? 2 : 1;
            if (pixels[id].sticky) {
                stick: if (x1 > 0) {
                    let slimeX = x1 - 1;
                    let slimeY = y2;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableRight && grid[slimeIndex + UPDATED] != tick && (pushPixels[gridHeight - slimeY] == null || pushPixels[gridHeight - slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                stick: if (x1 < gridWidth - 1) {
                    let slimeX = x1 + 1;
                    let slimeY = y2;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableLeft && grid[slimeIndex + UPDATED] != tick && (pushPixels[gridHeight - slimeY] == null || pushPixels[gridHeight - slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                stick: if (y2 == y1 && y2 > 0) {
                    let slimeX = x1;
                    let slimeY = y2 - 1;
                    let slimeIndex = (slimeX + slimeY * gridWidth) * gridStride;
                    if (slimeX == selfX && slimeY == selfY) {
                        break stick;
                    }
                    if (pixels[id].sticky == 1 && canUnstick(slimeX, slimeY)) {
                        break stick;
                    }
                    if (pixels[grid[slimeIndex + ID]].stickableDown && grid[slimeIndex + UPDATED] != tick && (pushPixels[gridHeight - slimeY] == null || pushPixels[gridHeight - slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[slimeIndex + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
            }
            else {
                stronglyConnected = false;
            }
        }
    }
    return [worked, pushPixels];
};

function isRotatable(x, y) {
    return grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].rotatable;
};
function rotatePixel(x, y) {
    let index = (x + y * gridWidth) * gridStride;
    let id = grid[index + ID];
    if (pixels[id].rotations == null) {
        return;
    }
    //sdfsdf fix for corruption
    let rotations = pixels[id].rotation;
    forTouching(x, y, (x1, y1) => {
        let index1 = (x1 + y1 * gridWidth) * gridStride;
        let id1 = grid[index1 + ID];
        if (id1 == ROTATOR_LEFT) {
            rotations += (4 - pixels[id].rotation);
        }
        if (id1 == ROTATOR_UP) {
            rotations += (5 - pixels[id].rotation);
        }
        if (id1 == ROTATOR_RIGHT) {
            rotations += (6 - pixels[id].rotation);
        }
        if (id1 == ROTATOR_DOWN) {
            rotations += (7 - pixels[id].rotation);
        }
        if (id1 == ROTATOR_CLOCKWISE) {
            rotations += 1;
        }
        if (id1 == ROTATOR_COUNTERCLOCKWISE) {
            rotations += 3;
        }
    });
    addPixel(x, y, pixels[id].rotations[rotations % pixels[id].rotations.length]);
};

function isDeactivated(x, y) {
    if (x > 0) {
        let index = (x - 1 + y * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == COMPARATOR_RIGHT_ON) {
            return true;
        }
    }
    if (x < gridWidth - 1) {
        let index = (x + 1 + y * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR || grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == COMPARATOR_LEFT_ON) {
            return true;
        }
    }
    if (y > 0) {
        let index = (x + (y - 1) * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_DOWN_ON) {
            return true;
        }
    }
    if (y < gridHeight - 1) {
        let index = (x + (y + 1) * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == COMPARATOR_UP_ON) {
            return true;
        }
    }
    return false;
};
function isDeactivatedObserver(x, y) {
    if (x > 0) {
        let index = (x - 1 + y * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR) {
            return true;
        }
        // if (grid[index + ID] == OBSERVER_LEFT_ON && grid[index + UPDATED] != tick) {
        if ((grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_RIGHT_ON) && (grid[index + UPDATED] == tick - 1 || grid[index + UPDATED] == tick - 3)) {
            return true;
        }
    }
    if (x < gridWidth - 1) {
        let index = (x + 1 + y * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR) {
            return true;
        }
        if (grid[index + ID] == OBSERVER_LEFT_ON) {
            return true;
        }
    }
    if (y > 0) {
        let index = (x + (y - 1) * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR) {
            return true;
        }
        if ((grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == OBSERVER_DOWN_ON) && (grid[index + UPDATED] == tick - 1 || grid[index + UPDATED] == tick - 3)) {
            return true;
        }
    }
    if (y < gridHeight - 1) {
        let index = (x + (y + 1) * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR) {
            return true;
        }
        if (grid[index + ID] == OBSERVER_UP_ON) {
            return true;
        }
    }
    return false;
};

function setObserverUpdated(x, y, updated, on) {
    // tick = last tick updated, last tick off
    // 
    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick + (updated ? -2 : 0) + (on ? 0 : -1);
};

function getLaserPath(x, y, dir) {
    let path = [[x, y]];
    switch (dir) {
        case 0:
            x -= 1;
            break;
        case 1:
            y -= 1;
            break;
        case 2:
            x += 1;
            break;
        case 3:
            y += 1;
            break;
    }
    while (isOnGrid(x, y)) {
        let index = (x + y * gridWidth) * gridStride;
        if (grid[index + ID] == MIRROR_1) {
            path.push([x, y]);
            // dir = 3 - dir;
            switch (dir) {
                case 0:
                    dir = 3;
                    break;
                case 1:
                    dir = 2;
                    break;
                case 2:
                    dir = 1;
                    break;
                case 3:
                    dir = 0;
                    break;
            }
        }
        else if (grid[index + ID] == MIRROR_2) {
            path.push([x, y]);
            switch (dir) {
                case 0:
                    dir = 1;
                    break;
                case 1:
                    dir = 0;
                    break;
                case 2:
                    dir = 3;
                    break;
                case 3:
                    dir = 2;
                    break;
            }
        }
        else if (grid[index + ID] != AIR && grid[index + ID] != GLASS) {
            break;
        }
        switch (dir) {
            case 0:
                x -= 1;
                break;
            case 1:
                y -= 1;
                break;
            case 2:
                x += 1;
                break;
            case 3:
                y += 1;
                break;
        }
    }
    path.push([x, y]);
    return path;
};
function drawLaserPath(ctx, cameraScale, path) {
    // very scuffed code but it should work
    path[0][0] += Math.sign(path[1][0] - path[0][0]) / 2;
    path[0][1] += Math.sign(path[1][1] - path[0][1]) / 2;
    path[path.length - 1][0] += Math.sign(path[path.length - 2][0] - path[path.length - 1][0]) / 2;
    path[path.length - 1][1] += Math.sign(path[path.length - 2][1] - path[path.length - 1][1]) / 2;
    if (path.length == 2 && path[0][0] == path[1][0] && path[0][1] == path[1][1]) {
        return;
    }
    ctx.lineWidth = cameraScale / 3;
    ctx.lineJoin = "bevel";
    ctx.lineCap = "butt";
    ctx.beginPath();
    for (let i in path) {
        if (i == 0) {
            ctx.moveTo((path[i][0] + 0.5) * cameraScale, (path[i][1] + 0.5) * cameraScale);
        }
        else {
            ctx.lineTo((path[i][0] + 0.5) * cameraScale, (path[i][1] + 0.5) * cameraScale);
        }
    }
    ctx.stroke();
};

let aprilFoolsPixelData = {
    air: {
        name: "Vacuum",
        group: "Miscellaneous",
    },
    wall: {
        name: "Block",
        group: "Miscellaneous",
    },
    dirt: {
        name: "Earth",
        group: "Miscellaneous",
        update: function(x, y) {
            let changed = false;
            let dirt = 0;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + UPDATED] == tick) {
                    return;
                }
                if (grid[index1 + ID] == WATER) {
                    addPixel(x, y, MUD);
                    changed = true;
                }
                if (grid[index1 + ID] == DIRT) {
                    dirt += 1;
                }
            });
            if (changed) {
                pixels[MUD].update(x, y);
                return;
            }
            if (dirt < 2) {
                flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
            }
        },
        randomUpdate: function(x, y) {
            if (isTouching(x, y, [AIR])) {
                for (let i = Math.max(y - 1, 0); i <= Math.min(y + 1, gridHeight - 1); i++) {
                    for (let j = Math.max(x - 1, 0); j <= Math.min(x + 1, gridWidth - 1); j++) {
                        let index = (j + i * gridWidth) * gridStride;
                        if (grid[index + ID] == GRASS) {
                            addPixel(x, y, GRASS);
                            return;
                        }
                    }
                }
            }
        },
    },
    grass: {
        name: "Living Earth",
        group: "Miscellaneous",
        update: function(x, y) {
            if (!isTouching(x, y, [AIR])) {
                addPixel(x, y, DIRT);
            }
            if (random() < 0.2) {
                rise(x, y, 1, 1, isPassableSolid, isMoveableSolid);
                return;
            }
            flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
        },
    },
    mud: {
        name: "Wet Earth",
        group: "Miscellaneous",
        update: function(x, y) {
            flow(x, y, 5, 2, isPassableSolid, isMoveableSolid);
        },
        randomUpdate: function(x, y) {
            if (!isInRange(x, y, 1, [WATER])) {
                addPixel(x, y, SAND);
            }
        },
    },
    sand: {
        name: "Powder",
        group: "Miscellaneous",
    },
    gravel: {
        name: "Gray Powder",
        group: "Miscellaneous",
    },
    concrete_powder: {
        name: "Slush",
        group: "Miscellaneous",
    },
    concrete: {
        name: "Hardened Slush",
        group: "Miscellaneous",
    },
    water: {
        name: "Liquid",
        group: "Miscellaneous",
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + UPDATED] == tick) {
                    return;
                }
                if (grid[index1 + ID] == LAVA) {
                    addPixel(x1, y1, STONE);
                    changed = true;
                }
                else if (grid[index1 + ID] == CONCRETE_POWDER) {
                    addPixel(x1, y1, CONCRETE);
                }
            });

            if (changed) {
                if (random() < 0.8) {
                    addPixel(x, y, STEAM);
                    pixels[STEAM].update(x, y);
                }
                else {
                    addPixel(x, y, AIR);
                    addTeam(x, y, -1);
                }
                return;
            }

            function isPassable(x, y) {
                return isOnGrid(x, y) && (pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS || grid[(x + y * gridWidth) * gridStride + ID] == WATER);
            };
            function isMoveable(x, y) {
                return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS;
            };

            if (random() < 0.2) {
                rise(x, y, 1, 1, isPassable, isMoveable);
                return;
            }
            flow(x, y, gridWidth, 1, isPassable, isMoveable);
            // flow1(x, y, isPassable, true, 1, true, 5);
        },
    },
    ice: {
        name: "Cold Crystal",
        group: "Miscellaneous",
        randomUpdate: function(x, y) {
            let touchingIce = 10;
            touchingIce *= 2 ** getTouching(x, y, [ICE, ICE_FREEZER]);
            touchingIce *= 1.5 ** getTouching(x, y, [SNOW]);
            touchingIce /= 2 ** getTouching(x, y, [WATER]);
            if (random() < 0.2 / touchingIce) {
                if (random() < 0.01) {
                    addPixel(x, y, LAVA);
                    return;
                }
                addPixel(x, y, WATER);
            }
        },
    },
    snow: {
        name: "Cold Powder",
        group: "Miscellaneous",
        randomUpdate: function(x, y) {
            let touchingIce = 10;
            touchingIce *= 2 ** getTouching(x, y, [ICE, ICE_FREEZER]);
            touchingIce *= 1.5 ** getTouching(x, y, [SNOW]);
            touchingIce /= 2 ** getTouching(x, y, [WATER]);
            if (random() < 0.4 / touchingIce) {
                if (random() < 0.001) {
                    addPixel(x, y, LAVA);
                    return;
                }
                addPixel(x, y, WATER);
            }
        },
    },
    steam: {
        name: "Vapor",
        group: "Miscellaneous",
        randomUpdate: function(x, y) {
            if (random() < 0.9) {
                addPixel(x, y, WATER);
            }
            else {
                addPixel(x, y, LAVA);
            }
            return;
        },
    },
    lava: {
        name: "Magma",
        group: "Miscellaneous",
        update: function(x, y) {
            if (random() < 0.01) {
                addPixel(x, y, STONE);
                return;
            }
            // let index = (x + y * gridWidth) * gridStride;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == LAVA) {
                    return;
                }
                let flammability = pixels[grid[index1 + ID]].flammability;
                let touchingAir = true;
                if (random() < flammability / (touchingAir ? 20 : 60) + (y1 < y ? 0.4 : 0) - (touchingAir ? 0 : 0.2)) {
                    // grid[index1 + PIXEL_DATA] |= 1;
                    addFire(x1, y1, 1);
                }
                if (grid[index1 + ID] == SAND && random() < 0.01) {
                    addPixel(x1, y1, GLASS);
                }
                if (grid[index1 + ID] == GLASS && random() < 0.01) {
                    addPixel(x1, y1, SAND);
                }
                if (grid[index1 + ID] == WATER && random() < 0.05) {
                    addPixel(x1, y1, STEAM);
                }
                if (grid[index1 + ID] == ICE && random() < 0.1) {
                    addPixel(x1, y1, WATER);
                }
                if (grid[index1 + ID] == SNOW && random() < 0.2) {
                    addPixel(x1, y1, WATER);
                }
                if (grid[index1 + ID] == IRON && random() < 0.1) {
                    addPixel(x1, y1, STEEL);
                }
                if (random() < flammability / 1200) {
                    // grid[index + PIXEL_DATA] &= ~1;
                    if (grid[index1 + ID] != ASH && random() < 0.3) {
                        addPixel(x1, y1, ASH);
                    }
                    else {
                        addPixel(x1, y1, AIR);
                        addTeam(x1, y1, -1);
                    }
                }
            });
            for (let i = 0; i < 3; i++) {
                let meltAngle = random() * Math.PI * 2;
                raycast(x, y, Math.cos(meltAngle), Math.sin(meltAngle), (x1, y1) => {
                    let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                    if (dist > 10) {
                        return false;
                    }
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if (grid[index1 + ID] == SNOW) {
                        if (random() < (15 - dist) / 20) {
                            addPixel(x1, y1, WATER);
                        }
                    }
                    else if (grid[index1 + ID] == ICE) {
                        if (random() < (15 - dist) / 40) {
                            addPixel(x1, y1, WATER);
                        }
                    }
                    else if (grid[index1 + ID] == MUD) {
                        if (random() < (10 - dist) / 10) {
                            addPixel(x1, y1, DIRT);
                        }
                    }
                    else if (grid[index1 + ID] == CLAY) {
                        if (random() < (10 - dist) / 20) {
                            addPixel(x1, y1, BRICKS);
                        }
                    }
                    if (grid[index1 + ID] != AIR) {
                        return false;
                    }
                    return true;
                });
            }
            addUpdatedChunk(x, y);
            function isPassable(x, y) {
                return isOnGrid(x, y) && (pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS || grid[(x + y * gridWidth) * gridStride + ID] == LAVA);
            };
            function isMoveable(x, y) {
                return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS;
            };

            flow(x, y, gridWidth, 1, isPassable, isMoveable);
        },
    },
    fire: {
        name: "Combustion",
        group: "Miscellaneous",
        update: function(x, y) {
            // flammability:
            // flammability 0: not flammable
            let index = (x + y * gridWidth) * gridStride;
            let flammability = pixels[grid[index + ID]].flammability;
            if (grid[index + ID] == LAVA) {
                // grid[index + PIXEL_DATA] &= ~1;
                addFire(x, y, 0);
                return;
            }
            if (flammability == 0 && (grid[index + ID] != AIR || random() < 0.3)) {
                // grid[index + PIXEL_DATA] &= ~1;
                addFire(x, y, 0);
                forTouchingDiagonal(x, y, (x1, y1) => {
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if (grid[index1 + ID] == WATER && random() < 0.05) {
                        addPixel(x1, y1, STEAM);
                    }
                    if (grid[index1 + ID] == ICE && random() < 0.1) {
                        addPixel(x1, y1, WATER);
                    }
                    if (grid[index1 + ID] == SNOW && random() < 0.2) {
                        addPixel(x1, y1, WATER);
                    }
                });
                return;
            }
            if (grid[index + ID] == WATER || isTouching(x, y, [WATER])) {
                // grid[index + PIXEL_DATA] &= ~1;
                addFire(x, y, 0);
            }
            let touchingAir = grid[index + ID] == AIR || isTouching(x, y, [AIR]);
            if (random() < (20 - flammability) / (touchingAir ? 280 : 20)) {
                // grid[index + PIXEL_DATA] &= ~1;
                addFire(x, y, 0);
            }

            // change to just adjacent pixels? also makes it more consistent
            let meltAngle = random() * Math.PI * 2;
            raycast(x, y, Math.cos(meltAngle), Math.sin(meltAngle), (x1, y1) => {
                let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                if (dist > 5) {
                    return false;
                }
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == SNOW) {
                    if (random() < (5 - dist) / 30) {
                        addPixel(x1, y1, WATER);
                    }
                }
                else if (grid[index1 + ID] == ICE) {
                    if (random() < (5 - dist) / 60) {
                        addPixel(x1, y1, WATER);
                    }
                }
                else if (grid[index1 + ID] == MUD) {
                    if (random() < (5 - dist) / 20) {
                        addPixel(x1, y1, DIRT);
                    }
                }
                else if (grid[index1 + ID] == CLAY) {
                    if (random() < (5 - dist) / 30) {
                        addPixel(x1, y1, BRICKS);
                    }
                }
                if (grid[index1 + ID] != AIR) {
                    return false;
                }
                return true;
                // if (grid[ay][ax] == pixNum.SNOW || grid[ay][ax] == pixNum.ICE) {
                //     if (random() < (5 - travel) / 30) nextGrid[ay][ax] = pixNum.WATER;
                // } else if (grid[ay][ax] == pixNum.SILT) {
                //     if (random() < (5 - travel) / 20) nextGrid[ay][ax] = pixNum.CLAY;
                // } else if (grid[ay][ax] == pixNum.CLAY) {
                //     if (random() < (5 - travel) / 30) nextGrid[ay][ax] = pixNum.BRICKS;
                //     return true;
                // } else if (grid[ay][ax] == pixNum.MUD) {
                //     if (random() < (5 - travel) / 20) nextGrid[ay][ax] = pixNum.DIRT;
                // } else if (grid[ay][ax] !== pixNum.AIR) return true;
            });
            if (random() < flammability / 1200) {
                // if (grid[y][x] >= pixNum.LASER_UP && grid[y][x] <= pixNum.LASER_RIGHT) {
                //     nextGrid[y][x] = pixNum.AIR;
                //     teamGrid[y][x] = 0;
                //     explode(x, y, 5, true);
                // }
                // else if (grid[y][x] != pixNum.ASH && random() < 0.3) {
                //     nextGrid[y][x] = pixNum.ASH;
                //     teamGrid[y][x] = 0;
                // }
                // else {
                if (grid[index + ID] != ASH && random() < 0.3) {
                    addPixel(x, y, ASH);
                }
                else {
                    addPixel(x, y, AIR);
                    addTeam(x, y, -1);
                }
                // nextGrid[y][x] = pixNum.AIR;
                // teamGrid[y][x] = 0;
                // }
            }
            // if (tick % 100 != 0) {
            //     let r = 10;
            //     for (let i = Math.max(y - r, 0); i <= Math.min(y + r, gridHeight - 1); i++) {
            //         for (let j = Math.max(x - r, 0); j <= Math.min(x + r, gridWidth - 1); j++) {
            //             //action(j, i);
            //             let index1 = (j + i * gridWidth) * gridStride;
            //             grid[index1 + VEL_X] = (j - x) * 0.5;
            //             grid[index1 + VEL_Y] = (i - y) * 0.5;
            //             addUpdatedChunk(j, i);
            //         }
            //     }
            //     // forTouchingDiagonal(x, y, (x1, y1) => {
            //     // });
            //     return;
            // }
            forTouchingDiagonal(x, y, (x1, y1) => {
                // forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                let flammability = pixels[grid[index1 + ID]].flammability;
                if (random() < flammability / (touchingAir ? 20 : 60) + (y1 < y ? 0.4 : 0) - ((x1 != x && y1 != y) ? 0.4 : 0) - (touchingAir ? 0 : 0.2)) {
                    // grid[index1 + PIXEL_DATA] |= 1;
                    // grid[index1 + UPDATED] = tick;
                    addFire(x1, y1, 1);
                }
                if (y1 == y - 1 && random() < 0.3) {
                    addFire(x1, y1, 1);
                }
                if (grid[index1 + ID] == WATER && random() < 0.05) {
                    addPixel(x1, y1, STEAM);
                }
                if (grid[index1 + ID] == ICE && random() < 0.1) {
                    addPixel(x1, y1, WATER);
                }
                if (grid[index1 + ID] == SNOW && random() < 0.2) {
                    addPixel(x1, y1, WATER);
                }
                // if (grid[j][i] == pixNum.WATER && random() < 0.05) nextGrid[j][i] = pixNum.STEAM;
                // if (grid[j][i] == pixNum.ICE && random() < 0.1) nextGrid[j][i] = pixNum.WATER;
                // if (grid[j][i] == pixNum.SNOW && random() < 0.2) nextGrid[j][i] = pixNum.WATER;
            });
            addUpdatedChunk(x, y);
        },
    },
    water_pump: {
        name: "Liquid Spawner",
        group: "Miscellaneous",
    },
    lava_heater: {
        name: "Magma Spawner",
        group: "Miscellaneous",
    },
    ice_freezer: {
        name: "Heat Deleter",
        group: "Miscellaneous",
    },
    clay: {
        name: "Silt",
        group: "Miscellaneous",
    },
    bricks: {
        name: "Dry Silt",
        group: "Miscellaneous",
        update: function(x, y) {
            if (isMoveableSolid(x, y + 1)) {
                let stable = false;
                let left = 0;
                let right = 0;
                for (let i = 1; i <= 1; i++) {
                    if (left < 0) {

                    }
                    else if (grid[(x - i + y * gridWidth) * gridStride + ID] != BRICKS) {
                        left = -1;
                    }
                    else if (grid[(x - i + (y + 1) * gridWidth) * gridStride + ID] == BRICKS) {
                        stable = true;
                        break;
                    }
                    if (right < 0) {

                    }
                    else if (grid[(x + i + y * gridWidth) * gridStride + ID] != BRICKS) {
                        right = -1;
                    }
                    else if (grid[(x + i + (y + 1) * gridWidth) * gridStride + ID] == BRICKS) {
                        stable = true;
                        break;
                    }
                    if (left < 0 && right < 0) {
                        break;
                    }
                }
                if (!stable) {
                    fall(x, y, isMoveableSolid);
                }
            }
        },
    },
    stone: {
        name: "Rock",
        group: "Miscellaneous",
    },
    basalt: {
        name: "Heavy Rock",
        group: "Miscellaneous",
        update: function(x, y) {
            fall(x, y, isMoveableSolid);
        },
    },
    iron: {
        name: "Fe",
        group: "Miscellaneous",
    },
    steel: {
        name: "Refined Fe",
        group: "Miscellaneous",
    },
    rubber: {
        name: "Petrolium",
        group: "Miscellaneous",
    },
    glass: {
        name: "Clear",
        group: "Miscellaneous",
    },
    wood: {
        name: "Log",
        group: "Miscellaneous",
    },
    leaves: {
        name: "Stem",
        group: "Miscellaneous",
    },
    sapling: {
        name: "Seed",
        group: "Miscellaneous",
        randomUpdate: function(x, y) {
            if (y == gridHeight - 1) {
                addPixel(x, y, LEAVES);
            }
            else {
                let id = grid[(x + (y + 1) * gridWidth) * gridStride + ID];
                if (id != DIRT && id != GRASS && id != MUD) {
                    addPixel(x, y, LEAVES);
                    return;
                }
                let growth = 0;
                let growthFactor = 1;
                // check for water in future
                for (let y1 = y + 1; y1 < gridHeight && (y1 - y) < 6; y1++) {
                    let index1 = (x + y1 * gridWidth) * gridStride;
                    if (grid[index1 + ID] == DIRT || grid[index1 + ID] == GRASS) {
                        growth += 2;
                    }
                    else if (grid[index1 + ID] == MUD) {
                        growth += 1;
                    }
                    else {
                        break;
                    }
                }
                let addBranch = (x1, y1, angle, size, length) => {
                    // alert(x1 + " " + y1 + " " + angle + " " + size + " " + length);
                    let x3 = x1;
                    let y3 = y1;
                    // let finalSize = size * (0.2 + random() * 0.4);
                    let finalSize = size;
                    let branchOffset = random() < 0.5;
                    raycast2(x1, y1, Math.cos(angle), Math.sin(angle), (x2, y2) => {
                        let dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                        if (dist > length) {
                            if (finalSize > 1) {
                                // addBranch(x3, y3, angle - (15 + random() * 30) / 180 * Math.PI, finalSize, length * (0.2 + random() * 0.4));
                                // addBranch(x3, y3, angle + (15 + random() * 30) / 180 * Math.PI, finalSize, length * (0.2 + random() * 0.4));
                                addBranch(x3, y3, angle - (15 + random() * 30) / 180 * Math.PI, finalSize * (0.6 + random() * 0.4), length * (0.4 + random() * 0.4));
                                addBranch(x3, y3, angle + (15 + random() * 30) / 180 * Math.PI, finalSize * (0.6 + random() * 0.4), length * (0.4 + random() * 0.4));
                                // let continueAngle = random(0.2, 0.4) * (Math.round(random()) * 2 - 1);
                                // branch(x2, y2, angle + continueAngle, size * random(0.5, 0.9), length * random(0.5, 1));
                                // let forcedBranch = random() < 0.5 - continueAngle * 0.8 + (((Math.PI / 2) - angle) * 0.5);
                                // if (random() < 0.2 || forcedBranch) branch(x2, y2, angle + random(0.6, 1.6) + (((Math.PI / 2) - angle) * 0.2), size * random(0.2, 0.6), length * random(0.5, 1));
                                // if (random() < 0.2 || !forcedBranch) branch(x2, y2, angle - random(0.6, 1.6) - (((Math.PI / 2) - angle) * 0.2), size * random(0.2, 0.6), length * random(0.5, 1));
                            }
                            else {
                                fillEllipse(x3, y3, (2 + random() * 0.5) * growthFactor, (1.5 + random() * 0.5) * growthFactor, (x4, y4) => {
                                    let index1 = (x4 + y4 * gridWidth) * gridStride;
                                    if (pixels[grid[index1 + ID]].state == GAS) {
                                        addPixel(x4, y4, LEAVES);
                                        copyTeam(x, y, x4, y4);
                                    }
                                });
                            }
                            return false;
                        }
                        let branchWidth = Math.max(1, (size * (1 - dist / length) + finalSize * dist / length) * Math.abs(Math.sin(angle)));
                        let branchHeight = Math.max(1, (size * (1 - dist / length) + finalSize * dist / length) * Math.abs(Math.cos(angle)));
                        // alert(branchWidth + " " + branchHeight + " " + (size * (1 - dist / length) + finalSize * dist / length) + " " + Math.sin(angle));
                        x3 = x2;
                        y3 = y2;
                        // branchOffset = false;
                        x2 -= Math.floor(Math.round(branchWidth - (branchOffset ? Math.abs(Math.sin(angle)) : 0)) / 2);
                        y2 -= Math.floor(Math.round(branchHeight - (branchOffset ? Math.abs(Math.cos(angle)) : 0)) / 2);
                        for (let y4 = Math.max(y2, 0); y4 < Math.min(y2 + Math.round(branchHeight), gridHeight); y4++) {
                            for (let x4 = Math.max(x2, 0); x4 < Math.min(x2 + Math.round(branchWidth), gridWidth); x4++) {
                                let index1 = (x4 + y4 * gridWidth) * gridStride;
                                if (pixels[grid[index1 + ID]].state == GAS || grid[index1 + ID] == LEAVES || grid[index1 + ID] == SAPLING) {
                                    addPixel(x4, y4, WOOD);
                                    copyTeam(x, y, x4, y4);
                                }
                            }
                        }
                        return true;
                    });
                };
                // growth = 10;
                if (random() < growth / 10) {
                    growthFactor = (Math.log(growth) / Math.log(4)) + 0.5;
                    addBranch(x, y, Math.atan2(x, y), growth * 3 * (0.2 + random() * 0.1), growth * 3 * (0.8 + random() * 0.7));
                }
            }
        },
    },
    plant: {
        name: "Algae",
        group: "Miscellaneous",
    },
    moss: {
        name: "Vine",
        group: "Miscellaneous",
    },
    lichen: {
        name: "Coral",
        group: "Miscellaneous",
    },
    sponge: {
        name: "Liquid Deleter",
        group: "Miscellaneous",
    },
    super_sponge: {
        name: "Hot Liquid Deleter",
        group: "Miscellaneous",
    },
    ash: {
        name: "Soot",
        group: "Miscellaneous",
    },
    wood_crate: {
        name: "Box o' Log",
        group: "Miscellaneous",
    },
    steel_crate: {
        name: "Box o' Fe",
        group: "Miscellaneous",
    },
    piston_left: {
        name: "Puller (Left)",
        group: "Redstone (wait thats reserved for RPS)",
        update1: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            if (x != 0 && grid[(x - 1 + y * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            if (x == gridWidth - 1 || grid[(x + 1 + y * gridWidth) * gridStride + ID] == AIR) {
                pushLeft(x, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
            else {
                pushLeft(x + 1, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
        },
    },
    piston_up: {
        name: "Puller (Up)",
        group: "Redstone (wait thats reserved for RPS)",
        update3: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            if (y != 0 && grid[(x + (y - 1) * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            if (y == gridHeight - 1 || grid[(x + (y + 1) * gridWidth) * gridStride + ID] == AIR) {
                pushUp(x, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
            else {
                pushUp(x, y + 1, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
        },
    },
    piston_right: {
        name: "Puller (Right)",
        group: "Redstone (wait thats reserved for RPS)",
        update2: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            if (x != gridWidth - 1 && grid[(x + 1 + y * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            if (x == 0 || grid[(x - 1 + y * gridWidth) * gridStride + ID] == AIR) {
                pushRight(x, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
            else {
                pushRight(x - 1, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
        },
    },
    piston_down: {
        name: "Puller (Down)",
        group: "Redstone (wait thats reserved for RPS)",
        update4: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            if (y != gridHeight - 1 && grid[(x + (y + 1) * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            if (y == 0 || grid[(x + (y - 1) * gridWidth) * gridStride + ID] == AIR) {
                pushDown(x, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
            else {
                pushDown(x, y - 1, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
        },
    },
    pusher_left: {
        name: "Pullston Left",
        group: "Redstone (wait thats reserved for RPS)",
        update1: function(x, y) {
            if (x <= 2) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            if (grid[(x - 2 + y * gridWidth) * gridStride + ID] == AIR || grid[(x - 1 + y * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            pushRight(x - 2, y, x, y, 1);
            addUpdatedChunk(x, y);
        },
    },
    pusher_up: {
        name: "Pullston Up",
        group: "Redstone (wait thats reserved for RPS)",
        update3: function(x, y) {
            if (y <= 2) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            if (grid[(x + (y - 2) * gridWidth) * gridStride + ID] == AIR || grid[(x + (y - 1) * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            pushDown(x, y - 2, x, y, 1);
            addUpdatedChunk(x, y);
        },
    },
    pusher_right: {
        name: "Pullston Right",
        group: "Redstone (wait thats reserved for RPS)",
        update2: function(x, y) {
            if (x >= gridWidth - 2) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            if (grid[(x + 2 + y * gridWidth) * gridStride + ID] == AIR || grid[(x + 1 + y * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            pushLeft(x + 2, y, x, y, 1);
            addUpdatedChunk(x, y);
        },
    },
    pusher_down: {
        name: "Pullston Down",
        group: "Redstone (wait thats reserved for RPS)",
        update4: function(x, y) {
            if (y >= gridHeight - 2) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            if (grid[(x + (y + 2) * gridWidth) * gridStride + ID] == AIR || grid[(x + (y + 1) * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            pushUp(x, y + 2, x, y, 1);
            addUpdatedChunk(x, y);
        },
    },
    fan_left: {
        name: "Turbine Left",
        group: "Redstone (wait thats reserved for RPS)",
        update1: function(x, y) {
            if (x == 0) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            addUpdatedChunk(x, y);
            for (let i = x - 1; i >= 0; i--) {
                if (grid[(i + y * gridWidth) * gridStride + ID] != AIR) {
                    pushLeft(i, y, x, y, 0);
                    return;
                }
            }
        },
    },
    fan_up: {
        name: "Turbine Up",
        group: "Redstone (wait thats reserved for RPS)",
        update3: function(x, y) {
            if (y == 0) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            addUpdatedChunk(x, y);
            for (let i = y - 1; i >= 0; i--) {
                if (grid[(x + i * gridWidth) * gridStride + ID] != AIR) {
                    pushUp(x, i, x, y, 0);
                    return;
                }
            }
        },
    },
    fan_right: {
        name: "Turbine Right",
        group: "Redstone (wait thats reserved for RPS)",
        update2: function(x, y) {
            if (x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            addUpdatedChunk(x, y);
            for (let i = x + 1; i < gridWidth; i++) {
                if (grid[(i + y * gridWidth) * gridStride + ID] != AIR) {
                    pushRight(i, y, x, y, 0);
                    return;
                }
            }
        },
    },
    fan_down: {
        name: "Turbine Down",
        group: "Redstone (wait thats reserved for RPS)",
        update4: function(x, y) {
            if (y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            addUpdatedChunk(x, y);
            for (let i = y + 1; i < gridHeight; i++) {
                if (grid[(x + i * gridWidth) * gridStride + ID] != AIR) {
                    pushDown(x, i, x, y, 0);
                    return;
                }
            }
        },
    },
    sticky_piston_left: {
        name: "Sticky Puller Left",
        group: "Redstone (wait thats reserved for RPS)",
        update1: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            if (x != 0 && grid[(x - 1 + y * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            if (x == gridWidth - 1 || grid[(x + 1 + y * gridWidth) * gridStride + ID] == AIR) {
                pushLeft(x, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
            else {
                pushLeft(x + 1, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
        },
    },
    sticky_piston_up: {
        name: "Sticky Puller Up",
        group: "Redstone (wait thats reserved for RPS)",
        update3: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            if (y != 0 && grid[(x + (y - 1) * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            if (y == gridHeight - 1 || grid[(x + (y + 1) * gridWidth) * gridStride + ID] == AIR) {
                pushUp(x, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
            else {
                pushUp(x, y + 1, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
        },
    },
    sticky_piston_right: {
        name: "Sticky Puller Right",
        group: "Redstone (wait thats reserved for RPS)",
        update2: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            if (x != gridWidth - 1 && grid[(x + 1 + y * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            if (x == 0 || grid[(x - 1 + y * gridWidth) * gridStride + ID] == AIR) {
                pushRight(x, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
            else {
                pushRight(x - 1, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
        },
    },
    sticky_piston_down: {
        name: "Sticky Puller Down",
        group: "Redstone (wait thats reserved for RPS)",
        update4: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            if (y != gridHeight - 1 && grid[(x + (y + 1) * gridWidth) * gridStride + ID] != AIR) {
                return;
            }
            if (y == 0 || grid[(x + (y - 1) * gridWidth) * gridStride + ID] == AIR) {
                pushDown(x, y, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
            else {
                pushDown(x, y - 1, -1, -1, 1);
                addUpdatedChunk(x, y);
            }
        },
    },
    copier_left: {
        name: "Converter Left",
        group: "Redstone (wait thats reserved for RPS)",
        update1: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].cloneable && grid[index + UPDATED] != tick) {
                if (multiplayerId != null) {
                    if (pixels[grid[index + ID]].cost == null) {
                        return;
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) == 0 && (grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            return;
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                if (multiplayerPixelInventory[i][j] < pixels[grid[index + ID]].cost[j]) {
                                    addUpdatedChunk(x, y);
                                    return;
                                }
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                multiplayerPixelInventory[i][j] -= pixels[grid[index + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                addPixel(x - 1, y, grid[index + ID]);
                copyTeam(x, y, x - 1, y);
            }
            // addUpdatedChunk(x, y);
        },
    },
    copier_up: {
        name: "Converter Up",
        group: "Redstone (wait thats reserved for RPS)",
        update3: function(x, y) {
            if (y == 0 || y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].cloneable && grid[index + UPDATED] != tick) {
                if (multiplayerId != null) {
                    if (pixels[grid[index + ID]].cost == null) {
                        return;
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) == 0 && (grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            return;
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                if (multiplayerPixelInventory[i][j] < pixels[grid[index + ID]].cost[j]) {
                                    addUpdatedChunk(x, y);
                                    return;
                                }
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                multiplayerPixelInventory[i][j] -= pixels[grid[index + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                addPixel(x, y - 1, grid[index + ID]);
                copyTeam(x, y, x, y - 1);
            }
            // addUpdatedChunk(x, y);
        },
    },
    copier_right: {
        name: "Converter Right",
        group: "Redstone (wait thats reserved for RPS)",
        update2: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].cloneable && grid[index + UPDATED] != tick) {
                if (multiplayerId != null) {
                    if (pixels[grid[index + ID]].cost == null) {
                        return;
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) == 0 && (grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            return;
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                if (multiplayerPixelInventory[i][j] < pixels[grid[index + ID]].cost[j]) {
                                    addUpdatedChunk(x, y);
                                    return;
                                }
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                multiplayerPixelInventory[i][j] -= pixels[grid[index + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                addPixel(x + 1, y, grid[index + ID]);
                copyTeam(x, y, x + 1, y);
            }
            // addUpdatedChunk(x, y);
        },
    },
    copier_down: {
        name: "Converter Down",
        group: "Redstone (wait thats reserved for RPS)",
        update4: function(x, y) {
            if (y == 0 || y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].cloneable && grid[index + UPDATED] != tick) {
                if (multiplayerId != null) {
                    if (pixels[grid[index + ID]].cost == null) {
                        return;
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) == 0 && (grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            return;
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                if (multiplayerPixelInventory[i][j] < pixels[grid[index + ID]].cost[j]) {
                                    addUpdatedChunk(x, y);
                                    return;
                                }
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                multiplayerPixelInventory[i][j] -= pixels[grid[index + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                addPixel(x, y + 1, grid[index + ID]);
                copyTeam(x, y, x, y + 1);
            }
            // addUpdatedChunk(x, y);
        },
    },
    cloner_left: {
        name: "Push Converter Left",
        group: "Redstone (wait thats reserved for RPS)",
        update1: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + 1 + y * gridWidth) * gridStride;
            let id = grid[index + ID];
            if (!pixels[id].cloneable) {
                return;
            }
            if (grid[index + UPDATED] != tick) {
                if (multiplayerId != null) {
                    if (pixels[grid[index + ID]].cost == null) {
                        return;
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) == 0 && (grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            return;
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                if (multiplayerPixelInventory[i][j] < pixels[grid[index + ID]].cost[j]) {
                                    addUpdatedChunk(x, y);
                                    return;
                                }
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                multiplayerPixelInventory[i][j] -= pixels[grid[index + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                let index1 = (x - 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    if (!pushLeft(x - 1, y, x, y, 2)) {
                    }
                }
                addPixel(x - 1, y, id);
                copyTeam(x, y, x - 1, y);
            }
            addUpdatedChunk(x, y);
        },
    },
    cloner_up: {
        name: "Push Converter Up",
        group: "Redstone (wait thats reserved for RPS)",
        update3: function(x, y) {
            if (y == 0 || y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + (y + 1) * gridWidth) * gridStride;
            let id = grid[index + ID];
            if (!pixels[id].cloneable) {
                return;
            }
            if (grid[index + UPDATED] != tick) {
                if (multiplayerId != null) {
                    if (pixels[grid[index + ID]].cost == null) {
                        return;
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) == 0 && (grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            return;
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                if (multiplayerPixelInventory[i][j] < pixels[grid[index + ID]].cost[j]) {
                                    addUpdatedChunk(x, y);
                                    return;
                                }
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                multiplayerPixelInventory[i][j] -= pixels[grid[index + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                let index1 = (x + (y - 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    if (!pushUp(x, y - 1, x, y, 2)) {
                    }
                }
                addPixel(x, y - 1, id);
                copyTeam(x, y, x, y - 1);
            }
            addUpdatedChunk(x, y);
        },
    },
    cloner_right: {
        name: "Push Converter Right",
        group: "Redstone (wait thats reserved for RPS)",
        update2: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x - 1 + y * gridWidth) * gridStride;
            let id = grid[index + ID];
            if (!pixels[id].cloneable) {
                return;
            }
            if (grid[index + UPDATED] != tick) {
                if (multiplayerId != null) {
                    if (pixels[grid[index + ID]].cost == null) {
                        return;
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) == 0 && (grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            return;
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                if (multiplayerPixelInventory[i][j] < pixels[grid[index + ID]].cost[j]) {
                                    addUpdatedChunk(x, y);
                                    return;
                                }
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                multiplayerPixelInventory[i][j] -= pixels[grid[index + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                let index1 = (x + 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    if (!pushRight(x + 1, y, x, y, 2)) {
                    }
                }
                addPixel(x + 1, y, id);
                copyTeam(x, y, x + 1, y);
            }
            addUpdatedChunk(x, y);
        },
    },
    cloner_down: {
        name: "Push Converter Down",
        group: "Redstone (wait thats reserved for RPS)",
        update4: function(x, y) {
            if (y == 0 || y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + (y - 1) * gridWidth) * gridStride;
            let id = grid[index + ID];
            if (!pixels[id].cloneable) {
                return;
            }
            if (grid[index + UPDATED] != tick) {
                if (multiplayerId != null) {
                    if (pixels[grid[index + ID]].cost == null) {
                        return;
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) == 0 && (grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            return;
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                if (multiplayerPixelInventory[i][j] < pixels[grid[index + ID]].cost[j]) {
                                    addUpdatedChunk(x, y);
                                    return;
                                }
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index + ID]].cost) {
                                multiplayerPixelInventory[i][j] -= pixels[grid[index + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                let index1 = (x + (y + 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    if (!pushDown(x, y + 1, x, y, 2)) {
                    }
                }
                addPixel(x, y + 1, id);
                copyTeam(x, y, x, y + 1);
            }
            addUpdatedChunk(x, y);
        },
    },
    rotator_left: {
        name: "Rotator Lanoitcerid (Left)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    rotator_up: {
        name: "Rotator Lanoitcerid (Up)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    rotator_right: {
        name: "Rotator Lanoitcerid (Right)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    rotator_down: {
        name: "Rotator Lanoitcerid (Down)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    rotator_clockwise: {
        name: "Sticky Rotator (Clockwise)",
        group: "Redstone (wait thats reserved for RPS)",
        update: function(x, y) {
            let updated = false;
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                    updated = true;
                }
            });

            addUpdatedChunk(x, y);

            if (x == 0 || y == 0 || x == gridWidth - 1 || y == gridHeight - 1) {
                return;
            }

            let positions = [[-1, 0], [0, -1], [1, 0], [0, 1]];
            for (let i = 2; i >= 0; i--) {
                move(x + positions[i][0], y + positions[i][1], x + positions[i + 1][0], y + positions[i + 1][1]);
            }
        },
    },
    rotator_counterclockwise: {
        name: "Sticky Rotator (Counterclockwise)",
        group: "Redstone (wait thats reserved for RPS)",
        update: function(x, y) {
            let updated = false;
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                    updated = true;
                }
            });

            addUpdatedChunk(x, y);

            if (x == 0 || y == 0 || x == gridWidth - 1 || y == gridHeight - 1) {
                return;
            }

            let positions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
            for (let i = 2; i >= 0; i--) {
                move(x + positions[i][0], y + positions[i][1], x + positions[i + 1][0], y + positions[i + 1][1]);
            }
        },
    },
    slider_horizontal: {
        name: "Swapper (Horizontal)",
        group: "Redstone (wait thats reserved for RPS)",
        pushableUp: true,
        pushableDown: true,
        update: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }

            move(x - 1, y, x + 1, y);
        },
    },
    slider_vertical: {
        name: "Swapper (Vertical)",
        group: "Redstone (wait thats reserved for RPS)",
        pushableLeft: true,
        pushableRight: true,
        update: function(x, y) {
            if (y == 0 || y == gridHeight - 1) {
                return;
            }

            move(x, y - 1, x, y + 1);
        },
    },
    collapsable: {
        name: "Expandable Box",
        group: "Redstone (wait thats reserved for RPS)",
    },
    slime: {
        name: "Honey",
        group: "Redstone (wait thats reserved for RPS)",
        sticky: 1,
        color: new Float32Array([255, 200, 100, 1]),
    },
    deactivator: {
        name: "Activator",
        group: "Redstone (wait thats reserved for RPS)",
    },
    // glue: {
    //     name: "Glue",
    //     description: "Unrealistically flows and may or may not be wet",
    //     group: "Mechanical",
    //     subgroup: "Glue",
    //     // texture: new Float32Array([0, 40, 15, 15]),
    //     texture: new Float32Array([10, 9, 5, 5]),
    //     // color: new Float32Array([100, 255, 100, 1]),
    //     state: SOLID,
    //     flammability: 4,
    //     blastResistance: 0,
    //     sticky: true,
    // },
    observer_left_off: {
        name: "BUD (Left)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    observer_left_on: {
        name: "BUD (Left)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    observer_right_off: {
        name: "BUD (Right)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    observer_right_on: {
        name: "BUD (Right)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    observer_up_off: {
        name: "BUD (Up)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    observer_up_on: {
        name: "BUD (Up)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    observer_down_off: {
        name: "BUD (Down)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    observer_down_on: {
        name: "BUD (Down)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    comparator_left_off: {
        name: "Repeater (Left)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    comparator_left_on: {
        name: "Repeater (Left)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    comparator_up_off: {
        name: "Repeater (Up)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    comparator_up_on: {
        name: "Repeater (Up)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    comparator_right_off: {
        name: "Repeater (Right)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    comparator_right_on: {
        name: "Repeater (Right)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    comparator_down_off: {
        name: "Repeater (Down)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    comparator_down_on: {
        name: "Repeater (Down)",
        group: "Redstone (wait thats reserved for RPS)",
    },
    lamp_on: {
        name: "Yellow Light",
        group: "Redstone (wait thats reserved for RPS)",
    },
    lamp_off: {
        name: "Yellow Light",
        group: "Redstone (wait thats reserved for RPS)",
    },
    gunpowder: {
        name: "Sulfur",
        group: "[!] Danger [!]",
    },
    activated_gunpowder: {
        name: "Sulfur (Activated)",
        group: "[!] Danger [!]",
    },
    c4: {
        name: "TNT",
        group: "[!] Danger [!]",
    },
    activated_c4: {
        name: "TNT (Activated)",
        group: "[!] Danger [!]",
    },
    detonator: {
        name: "Flint and Steel",
        group: "[!] Danger [!]",
    },
    flamethrower_left: {
        name: "Ignitor (Left)",
        group: "[!] Danger [!]",
        update: function(x, y) {
            for (let i = 0; i < 10; i++) {
                let angle = Math.PI + random() * Math.PI / 6 - Math.PI / 12;
                raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if ((grid[index1 + PIXEL_DATA] & 1) == 0) {
                        addFire(x1, y1, 1);
                        return false;
                    }
                    if (grid[index1 + ID] != AIR) {
                        return false;
                    }
                    return true;
                });
            }
        },
    },
    flamethrower_up: {
        name: "Ignitor (Up)",
        group: "[!] Danger [!]",
        update: function(x, y) {
        for (let i = 0; i < 10; i++) {
            let angle = Math.PI * 3 / 2 + random() * Math.PI / 6 - Math.PI / 12;
            raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if ((grid[index1 + PIXEL_DATA] & 1) == 0) {
                    addFire(x1, y1, 1);
                    return false;
                }
                if (grid[index1 + ID] != AIR) {
                    return false;
                }
                return true;
            });
        }
    },
    },
    flamethrower_right: {
        name: "Ignitor (Right)",
        group: "[!] Danger [!]",
        update: function(x, y) {
            for (let i = 0; i < 10; i++) {
                let angle = random() * Math.PI / 6 - Math.PI / 12;
                raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if ((grid[index1 + PIXEL_DATA] & 1) == 0) {
                        addFire(x1, y1, 1);
                        return false;
                    }
                    if (grid[index1 + ID] != AIR) {
                        return false;
                    }
                    return true;
                });
            }
        },
    },
    flamethrower_down: {
        name: "Ignitor (Down)",
        group: "[!] Danger [!]",
        update: function(x, y) {
            for (let i = 0; i < 10; i++) {
                let angle = Math.PI / 2 + random() * Math.PI / 6 - Math.PI / 12;
                raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if ((grid[index1 + PIXEL_DATA] & 1) == 0) {
                        addFire(x1, y1, 1);
                        return false;
                    }
                    if (grid[index1 + ID] != AIR) {
                        return false;
                    }
                    return true;
                });
            }
        },
    },
    nuke: {
        name: "Explosion",
        group: "[!] Danger [!]",
    },
    activated_nuke: {
        name: "Explosion (Activated)",
        group: "[!] Danger [!]",
    },
    nuke_defuser: {
        name: "Explosion Diffuser",
        group: "[!] Danger [!]",
    },
    deleter: {
        name: "Remover",
        group: "[!] Danger [!]",
    },
    lag_spike_generator: {
        name: "frame_drop_accelerator",
        group: "[!] Danger [!]",
        color: new Float32Array([0, 125, 255, 1]),
        update: function(x, y) {
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == AIR) {
                    if (random() < 0.5) {
                        addPixel(x1, y1, LAG_SPIKE_GENERATOR);
                        copyTeam(x, y, x1, y1);
                    }
                    else if (random() < 0.025) {
                        addPixel(x1, y1, LAVA_HEATER);
                        copyTeam(x, y, x1, y1);
                    }
                    else if (random() < 0.025) {
                        addPixel(x1, y1, COPIER_UP);
                        copyTeam(x, y, x1, y1);
                    }
                }
            });
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == LAG_SPIKE_GENERATOR) {
                    if (random() < 0.005) {
                        // addPixel(x1, y1, NUKE);
                        let size = 8;
                        explode(x, y, size * size, size * 8, 4000);
                        return true;
                    }
                }
            });
        },
    },
    acid: {
        name: "H+",
        group: "[!] Danger [!]",
    },
    base: {
        name: "OH-",
        group: "[!] Danger [!]",
    },
    pink_sand: {
        name: "Teal Sand",
        group: "[!] Danger [!]",
        update: function(x, y) {
            if (isTouching(x, y, [SAND])) {
                explode(x, y, 8 * 8, 8 * 8, 16000);
            }
            if (isTouching(x, y, [GRAVEL])) {
                explode(x, y, 80 * 80, 80 * 8, 160000);
            }
            rise(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
    },
    red_sand: {
        name: "Cyan Sand",
        group: "[!] Danger [!]",
        update: function(x, y) {
            if (isTouching(x, y, [LAVA])) {
                explode(x, y, 5 * 5, 5 * 8, 3000);
            }
            flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
    },
    pickle: {
        name: "Cucumber",
        group: "[!] Danger [!]",
        update5: function(x, y) {
            if (random() < 0.1) {
                if (random() < 0.01) {
                    let x1 = Math.floor(random() * gridWidth);
                    let y1 = Math.floor(random() * gridHeight);
                    if ((x1 - x) ** 2 + (y1 - y) ** 2 > 400) {
                        explode(x1, y1, 20 * 20, 20 * 8, 8000);
                        addPixel(x1, y1, WATER);
                        copyTeam(x, y, x1, y1);
                    }
                }
                else {
                    for (let i = 0; i < 1; i++) {
                        let chunkX = Math.floor(random() * chunkXAmount);
                        let chunkY = Math.floor(random() * chunkYAmount);
                        let chunkIndex = (chunkX + chunkY * chunkXAmount) * chunkStride;
                        nextChunks[chunkIndex] = chunkX * chunkWidth + chunkWidth;
                        nextChunks[chunkIndex + 1] = chunkX * chunkWidth - 1;
                        nextChunks[chunkIndex + 2] = chunkY * chunkHeight + chunkHeight;
                        nextChunks[chunkIndex + 3] = chunkY * chunkHeight - 1;
                    }
                }
            }
            flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
            addUpdatedChunk(x, y);
        },
    },
    pickled_pickle: {
        name: "Cucumbered Cucumber",
        group: "[!] Danger [!]",
        update4: function(x, y) {
            if (random() < 0.1) {
                if (random() < 0.01) {
                    let x1 = Math.floor(random() * gridWidth);
                    let y1 = Math.floor(random() * gridHeight);
                    if ((x1 - x) ** 2 + (y1 - y) ** 2 > 400) {
                        explode(x1, y1, 20 * 20, 20 * 8, 8000);
                        addPixel(x1, y1, PICKLE);
                        copyTeam(x, y, x1, y1);
                    }
                }
                else {
                    for (let i = 0; i < 10; i++) {
                        let chunkX = Math.floor(random() * chunkXAmount);
                        let chunkY = Math.floor(random() * chunkYAmount);
                        let chunkIndex = (chunkX + chunkY * chunkXAmount) * chunkStride;
                        nextChunks[chunkIndex] = chunkX * chunkWidth + chunkWidth;
                        nextChunks[chunkIndex + 1] = chunkX * chunkWidth - 1;
                        nextChunks[chunkIndex + 2] = chunkY * chunkHeight + chunkHeight;
                        nextChunks[chunkIndex + 3] = chunkY * chunkHeight - 1;
                    }
                }
            }
            flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
        update5: function(x, y) {
            addUpdatedChunk(x, y);
        },
    },
    spongy_rice: {
        name: "Ricey Sponge",
        group: "[!] Danger [!]",
        update: function(x, y) {
            if (isTouching(x, y, [WATER])) {
                fillEllipse(x, y, Math.floor(5 + random() * 30), Math.floor(5 + random() * 30), (x1, y1) => {
                    addPixel(x1, y1, ACTIVATED_SPONGY_RICE);
                });
            }
            else {
                flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
            }
        },
    },
    activated_spongy_rice: {
        name: "Ricey Sponge (Activated)",
        group: "[!] Danger [!]",
        update: null,
    },
    recursive_sapling: {
        name: "Depth First Seed",
        group: "[!] Danger [!]",
        randomUpdate: function(x, y) {
            if (y == gridHeight - 1) {
                addPixel(x, y, DIRT);
            }
            else {
                let id = grid[(x + (y + 1) * gridWidth) * gridStride + ID];
                if (id != DIRT && id != GRASS && id != MUD) {
                    addPixel(x, y, DIRT);
                    return;
                }
                let growth = 0;
                let growthFactor = 1;
                // check for water in future
                for (let y1 = y + 1; y1 < gridHeight && (y1 - y) < 6; y1++) {
                    let index1 = (x + y1 * gridWidth) * gridStride;
                    if (grid[index1 + ID] == DIRT || grid[index1 + ID] == GRASS) {
                        growth += 2;
                    }
                    else if (grid[index1 + ID] == MUD) {
                        growth += 1;
                    }
                    else {
                        break;
                    }
                }
                let addBranch = (x1, y1, angle, size, length) => {
                    // alert(x1 + " " + y1 + " " + angle + " " + size + " " + length);
                    let x3 = x1;
                    let y3 = y1;
                    // let finalSize = size * (0.2 + random() * 0.4);
                    let finalSize = size;
                    let branchOffset = random() < 0.5;
                    raycast2(x1, y1, Math.cos(angle), Math.sin(angle), (x2, y2) => {
                        let dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                        if (dist > length) {
                            // if (finalSize > 1) {
                            //     // addBranch(x3, y3, angle - (15 + random() * 30) / 180 * Math.PI, finalSize, length * (0.2 + random() * 0.4));
                            //     // addBranch(x3, y3, angle + (15 + random() * 30) / 180 * Math.PI, finalSize, length * (0.2 + random() * 0.4));
                            //     addBranch(x3, y3, angle - (15 + random() * 30) / 180 * Math.PI, finalSize * (0.6 + random() * 0.4), length * (0.4 + random() * 0.4));
                            //     addBranch(x3, y3, angle + (15 + random() * 30) / 180 * Math.PI, finalSize * (0.6 + random() * 0.4), length * (0.4 + random() * 0.4));
                            //     // let continueAngle = random(0.2, 0.4) * (Math.round(random()) * 2 - 1);
                            //     // branch(x2, y2, angle + continueAngle, size * random(0.5, 0.9), length * random(0.5, 1));
                            //     // let forcedBranch = random() < 0.5 - continueAngle * 0.8 + (((Math.PI / 2) - angle) * 0.5);
                            //     // if (random() < 0.2 || forcedBranch) branch(x2, y2, angle + random(0.6, 1.6) + (((Math.PI / 2) - angle) * 0.2), size * random(0.2, 0.6), length * random(0.5, 1));
                            //     // if (random() < 0.2 || !forcedBranch) branch(x2, y2, angle - random(0.6, 1.6) - (((Math.PI / 2) - angle) * 0.2), size * random(0.2, 0.6), length * random(0.5, 1));
                            // }
                            // else {
                                fillEllipse(x3, y3, (2 + random() * 0.5) * growthFactor, (1.5 + random() * 0.5) * growthFactor, (x4, y4) => {
                                    let index1 = (x4 + y4 * gridWidth) * gridStride;
                                    if (grid[index1 + ID] != DIRT) {
                                        addPixel(x4, y4, RECURSIVE_SAPLING);
                                        copyTeam(x, y, x4, y4);
                                    }
                                });
                            // }
                            return false;
                        }
                        let branchWidth = Math.max(1, (size * (1 - dist / length) + finalSize * dist / length) * Math.abs(Math.sin(angle)));
                        let branchHeight = Math.max(1, (size * (1 - dist / length) + finalSize * dist / length) * Math.abs(Math.cos(angle)));
                        // alert(branchWidth + " " + branchHeight + " " + (size * (1 - dist / length) + finalSize * dist / length) + " " + Math.sin(angle));
                        x3 = x2;
                        y3 = y2;
                        // branchOffset = false;
                        x2 -= Math.floor(Math.round(branchWidth - (branchOffset ? Math.abs(Math.sin(angle)) : 0)) / 2);
                        y2 -= Math.floor(Math.round(branchHeight - (branchOffset ? Math.abs(Math.cos(angle)) : 0)) / 2);
                        for (let y4 = Math.max(y2, 0); y4 < Math.min(y2 + Math.round(branchHeight), gridHeight); y4++) {
                            for (let x4 = Math.max(x2, 0); x4 < Math.min(x2 + Math.round(branchWidth), gridWidth); x4++) {
                                let index1 = (x4 + y4 * gridWidth) * gridStride;
                                addPixel(x4, y4, DIRT);
                                copyTeam(x, y, x4, y4);
                            }
                        }
                        return true;
                    });
                };
                // growth = 10;
                if (random() < growth / 10) {
                    growthFactor = (Math.log(growth) / Math.log(4)) + 0.5;
                    addBranch(x, y, -Math.PI / 2 + (random() * 2 - 1) * (90) / 180 * Math.PI, growth * (0.2 + random() * 0.1), growth * (0.8 + random() * 0.7));
                }
            }
        },
    },
    random: {
        name: "noise.perlin2()",
        group: "[!] Danger [!]",
    },
    corruption: {
        name: "Corrlefttion",
        group: "[!] Danger [!]",
        update: async function(x, y) {
            if (!window.enableCorruptionPixel) {
                // modal("Corruption Pixel Detected!", "Are you sure you want to permanently corrupt your game?", "confirm");
                await modal("Corrlefttion Pixel Detected!", "Are you sure you want to permanently corrleftt your game?", "info");
                window.enableCorruptionPixel = true;
                setRunState("playing");
                // playMusic();
                // error TOTO pls fix
                return;
            }
            let pixel1 = Math.floor(Math.random() * pixels.length);
            let pixel2 = Math.floor(Math.random() * pixels.length);
            let property = Object.keys(pixels[pixel1])[Math.floor(Math.random() * Object.keys(pixels[pixel1]).length)];
            // property = "update";
            // if (typeof pixels[pixel1][property] == "number" || pixels[pixel2][property] == "number") {
            if (pixels[pixel2][property] === undefined) {
                pixels[pixel2][property] = pixels[pixel1][property];
                // delete pixels[pixel1][property];
            }
            else {
                let pixel2Property = pixels[pixel2][property];
                pixels[pixel2][property] = pixels[pixel1][property];
                pixels[pixel1][property] = pixel2Property;
                // let pixel2Pixel = pixels[pixel2];
                // pixels[pixel2] = pixels[pixel1];
                // pixels[pixel1] = pixel2Pixel;
                // if ()
                // pixels[pixel1].update = 
            }
            // }
            addUpdatedChunk(x, y);
            addDrawingChunk(x, y);
        },
    },
    mimic: {
        name: "Subset",
        group: "[!] Danger [!]",
    },
    lucky_pixel: {
        name: "Unlucky Pixel",
        group: "[!] Danger [!]",
    },
    life: {
        name: "Death",
        group: "[!] Danger [!]",
    },
    life_2: {
        name: "Death",
        group: "[!] Danger [!]",
    },
    life_3: {
        name: "Death",
        group: "[!] Danger [!]",
    },
    triangle: {
        name: "Square",
        group: "[!] Danger [!]",
        update: function(x, y) {
            addPixel(x, y, MIMIC);
            if (x != gridWidth - 1) {
                let id = grid[(x + 1 + y * gridWidth) * gridStride + ID];
                if (id == AIR) {
                    addPixel(x + 1, y, TRIANGLE);
                    copyTeam(x, y, x + 1, y);
                }
                else if (id == TRIANGLE) {
                    addPixel(x + 1, y, AIR);
                    addTeam(x + 1, y, -1);
                }
            }
            if (y != gridHeight - 1) {
                let id = grid[(x + (y + 1) * gridWidth) * gridStride + ID];
                if (id == AIR) {
                    addPixel(x, y + 1, TRIANGLE);
                    copyTeam(x, y, x, y + 1);
                }
                else if (id == TRIANGLE) {
                    addPixel(x, y + 1, AIR);
                    addTeam(x, y + 1, -1);
                }
            }
        },
    },
    ant_left_clockwise: {
        name: "Art",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (y == 0 || (grid[index] != AIR && grid[index] != MIMIC)) {
                addPixel(x, y, ANT_LEFT_COUNTERCLOCKWISE);
                return;
            }
            addPixel(x, y, MIMIC);
            if (grid[index + ID] == MIMIC) {
                addPixel(x, y - 1, ANT_UP_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x, y - 1, ANT_UP_CLOCKWISE);
            }
            copyTeam(x, y, x, y - 1);
        },
    },
    ant_left_counterclockwise: {
        name: "Art",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (y == gridHeight - 1 || (grid[index] != AIR && grid[index] != MIMIC)) {
                addPixel(x, y, ANT_LEFT_CLOCKWISE);
                return;
            }
            addPixel(x, y, AIR);
            if (grid[index + ID] == MIMIC) {
                addPixel(x, y + 1, ANT_DOWN_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x, y + 1, ANT_DOWN_CLOCKWISE);
            }
            copyTeam(x, y, x, y + 1);
            addTeam(x, y, -1);
        },
    },
    ant_up_clockwise: {
        name: "Art",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (x == gridWidth - 1 || (grid[index] != AIR && grid[index] != MIMIC)) {
                addPixel(x, y, ANT_UP_COUNTERCLOCKWISE);
                return;
            }
            addPixel(x, y, MIMIC);
            if (grid[index + ID] == MIMIC) {
                addPixel(x + 1, y, ANT_RIGHT_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x + 1, y, ANT_RIGHT_CLOCKWISE);
            }
            copyTeam(x, y, x + 1, y);
        },
    },
    ant_up_counterclockwise: {
        name: "Art",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (x == 0 || (grid[index] != AIR && grid[index] != MIMIC)) {
                addPixel(x, y, ANT_UP_CLOCKWISE);
                return;
            }
            addPixel(x, y, AIR);
            if (grid[index + ID] == MIMIC) {
                addPixel(x - 1, y, ANT_LEFT_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x - 1, y, ANT_LEFT_CLOCKWISE);
            }
            copyTeam(x, y, x - 1, y);
            addTeam(x, y, -1);
        },
    },
    ant_right_clockwise: {
        name: "Art",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (y == gridHeight - 1 || (grid[index] != AIR && grid[index] != MIMIC)) {
                addPixel(x, y, ANT_RIGHT_COUNTERCLOCKWISE);
                return;
            }
            addPixel(x, y, MIMIC);
            if (grid[index + ID] == MIMIC) {
                addPixel(x, y + 1, ANT_DOWN_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x, y + 1, ANT_DOWN_CLOCKWISE);
            }
            copyTeam(x, y, x, y + 1);
        },
    },
    ant_right_counterclockwise: {
        name: "Art",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (y == 0 || (grid[index] != AIR && grid[index] != MIMIC)) {
                addPixel(x, y, ANT_RIGHT_CLOCKWISE);
                return;
            }
            addPixel(x, y, AIR);
            if (grid[index + ID] == MIMIC) {
                addPixel(x, y - 1, ANT_UP_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x, y - 1, ANT_UP_CLOCKWISE);
            }
            copyTeam(x, y, x, y - 1);
            addTeam(x, y, -1);
        },
    },
    ant_down_clockwise: {
        name: "Art",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (x == 0 || (grid[index] != AIR && grid[index] != MIMIC)) {
                addPixel(x, y, ANT_DOWN_COUNTERCLOCKWISE);
                return;
            }
            addPixel(x, y, MIMIC);
            if (grid[index + ID] == MIMIC) {
                addPixel(x - 1, y, ANT_LEFT_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x - 1, y, ANT_LEFT_CLOCKWISE);
            }
            copyTeam(x, y, x - 1, y);
        },
    },
    ant_down_counterclockwise: {
        name: "Art",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (x == gridWidth - 1 || (grid[index] != AIR && grid[index] != MIMIC)) {
                addPixel(x, y, ANT_DOWN_CLOCKWISE);
                return;
            }
            addPixel(x, y, AIR);
            if (grid[index + ID] == MIMIC) {
                addPixel(x + 1, y, ANT_RIGHT_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x + 1, y, ANT_RIGHT_CLOCKWISE);
            }
            copyTeam(x, y, x + 1, y);
            addTeam(x, y, -1);
        },
    },
    anteater: {
        name: "Artdevourer",
        group: "[!] Danger [!]",
        update: function(x, y) {
            let array = [AIR, MIMIC, ANT_LEFT_CLOCKWISE, ANT_LEFT_COUNTERCLOCKWISE, ANT_UP_CLOCKWISE, ANT_UP_COUNTERCLOCKWISE, ANT_RIGHT_CLOCKWISE, ANT_RIGHT_COUNTERCLOCKWISE, ANT_DOWN_CLOCKWISE, ANT_DOWN_COUNTERCLOCKWISE];
            let total = getTouching(x, y, array);
            let direction = Math.floor(random() * total);
            forTouching(x, y, (x1, y1) => {
                let index = (x1 + y1 * gridWidth) * gridStride;
                let canMove = false;
                for (let i in array) {
                    if (grid[index + ID] == array[i]) {
                        canMove = true;
                        break;
                    }
                }
                if (!canMove) {
                    return;
                }
                total -= 1;
                if (direction == total) {
                    addPixel(x1, y1, AIR);
                    addTeam(x1, y1, -1);
                    move(x, y, x1, y1);
                }
            });
        },
    },
    laser_left: {
        name: "Lol Are Super Entities Rowing (Boats) (Left)",
        group: "Lol Are Super Entities Rowing (Boats)",
        draw: function(ctx, cameraScale, x, y) {
            let path = getLaserPath(x, y, 0);
            ctx.strokeStyle = "rgb(0, 0, 255)";
            drawLaserPath(ctx, cameraScale, path);
        },
    },
    laser_up: {
        name: "Lol Are Super Entities Rowing (Boats) (Up)",
        group: "Lol Are Super Entities Rowing (Boats)",
        draw: function(ctx, cameraScale, x, y) {
            let path = getLaserPath(x, y, 1);
            ctx.strokeStyle = "rgb(0, 0, 255)";
            drawLaserPath(ctx, cameraScale, path);
        },
    },
    laser_right: {
        name: "Lol Are Super Entities Rowing (Boats) (Right)",
        group: "Lol Are Super Entities Rowing (Boats)",
        draw: function(ctx, cameraScale, x, y) {
            let path = getLaserPath(x, y, 2);
            ctx.strokeStyle = "rgb(0, 0, 255)";
            drawLaserPath(ctx, cameraScale, path);
        },
    },
    laser_down: {
        name: "Lol Are Super Entities Rowing (Boats) (Down)",
        group: "Lol Are Super Entities Rowing (Boats)",
        draw: function(ctx, cameraScale, x, y) {
            let path = getLaserPath(x, y, 3);
            ctx.strokeStyle = "rgb(0, 0, 255)";
            drawLaserPath(ctx, cameraScale, path);
        },
    },
    laser_scatterer: {
        name: "Diffuser",
        group: "Lol Are Super Entities Rowing (Boats)",
    },
    activated_laser_scatterer: {
        name: "Diffuser (Activated)",
        group: "Lol Are Super Entities Rowing (Boats)",
        update6: function(x, y) {
            addPixel(x, y, LASER_SCATTERER);
        },
        draw: function(ctx, cameraScale, x, y) {
            let size = (Math.sin(performance.now() / 1000 * Math.PI / 2) + 1) / 4 * cameraScale;
            ctx.fillStyle = "rgb(0, 0, 255, 0.2)";
            ctx.fillRect(x * cameraScale - size, y * cameraScale - size, cameraScale + size * 2, cameraScale + size * 2);
        },
    },
    mirror_1: {
        name: "Reflector",
        group: "Lol Are Super Entities Rowing (Boats)",
    },
    mirror_2: {
        name: "Reflector",
        group: "Lol Are Super Entities Rowing (Boats)",
    },
    monster: {
        name: "Enemy",
        group: "I love my challenge puzzle levels",
        update: null,
    },
    placement_restriction: {
        name: "Brush Disabler",
        group: "I love my challenge puzzle levels",
    },
    goal: {
        name: "Target",
        group: "I love my challenge puzzle levels",
    },
    target: {
        name: "Goal",
        group: "I love my challenge puzzle levels",
    },
    team_placement_restriction_a: {
        name: "Group Brush Disabler (Alpha)",
        group: "Singleplayer",
    },
    team_placement_restriction_b: {
        name: "Group Brush Disabler (Beta)",
        group: "Singleplayer",
    },
    team_marker_a: {
        name: "Group Control (Alpha)",
        group: "Singleplayer",
    },
    team_marker_b: {
        name: "Group Control (Beta)",
        group: "Singleplayer",
    },
    king_of_the_hill_marker: {
        name: "Queen of the Valley Marker",
        group: "Singleplayer",
    },
    color_red: {
        name: "Red Blob",
        group: "Singleplayer",
    },
    color_orange: {
        name: "Orange Blob",
        group: "Singleplayer",
    },
    color_yellow: {
        name: "Yellow Blob",
        group: "Singleplayer",
    },
    color_lime: {
        name: "Lime Blob",
        group: "Singleplayer",
    },
    color_green: {
        name: "Green Blob",
        group: "Singleplayer",
    },
    color_cyan: {
        name: "Cyan Blob",
        group: "Singleplayer",
    },
    color_blue: {
        name: "Blue Blob",
        group: "Singleplayer",
    },
    color_purple: {
        name: "Purple Blob",
        group: "Singleplayer",
    },
    color_brown: {
        name: "Brown Blob",
        group: "Singleplayer",
    },
    color_gray: {
        name: "Gray Blob",
        group: "Singleplayer",
    },
    color_black: {
        name: "Black Blob",
        group: "Singleplayer",
    },
    color_well: {
        name: "Natural Blob Spawner",
        group: "Singleplayer",
    },
    passive_color_generator: {
        name: "Artificial Blob Spawner",
        group: "Singleplayer",
    },
    active_color_generator: {
        name: "Boosted Artificial Blob Spawner",
        group: "Singleplayer",
    },
    color_generator_filter: {
        name: "Blob Spawner Parapameter",
        group: "Singleplayer",
    },
    collector: {
        name: "Miner",
        group: "Singleplayer",
    },
};

function aprilFools() {
    for (let i in pixels) {
        for (let j in aprilFoolsPixelData[pixels[i].id]) {
            pixels[i][j] = aprilFoolsPixelData[pixels[i].id][j];
        }
    }
}

let buttons = document.getElementsByClassName("button");
for (let i = 0; i < buttons.length; i++) {
    buttons[i].style.transform += "rotate(180deg)";
}
document.getElementById("volumeSliderButton").style.transform += " rotate(180deg)";

document.getElementById("sandboxButton").innerText = "Box o' Sand";
document.getElementById("puzzlesButton").innerText = "Challenge Puzles Levels";
document.getElementById("multiplayerButton").innerText = "Singleplayer";

document.getElementById("saveCodeText").innerText = "Save Cod";
document.getElementById("blueprintsListText").innerText = "Saved Redprints";

export { aprilFools };