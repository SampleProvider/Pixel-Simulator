import { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, drawChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, gridUpdatedChunks, tick, modal, parseSaveCode, brushPixel, setBrushPixel, showTooltip, hideTooltip, moveTooltip, setRunState } from "./game.js";
// import { imageBitmap } from "./renderer.js";
import { random, randomSeed } from "./random.js";
import { currentPuzzle } from "./puzzles.js";
import { multiplayerId, multiplayerGameId, multiplayerGames, multiplayerPixelInventory } from "./multiplayer.js";

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
            if (id == COLLAPSABLE) {
                if (!allowRecursion) {
                    xPos = x2 - 1;
                    break;
                }
                // it shouldn't be possilbe for the pixel in front to be updated
                // if (x2 == 0 || failedPushPixels[x2 - 1 + y1 * gridWidth] == tick || grid[(x2 - 1 + y1 * gridWidth) * gridStride + UPDATED] == tick) {
                if (x2 == 0) {
                    xPos = x2 - 1;
                    break;
                }
                else {
                    // see if we can push with collapsing
                    // if we cannot, then we collapse this one
                    let [worked1, pushPixels1] = pushLeftCheck(x2 - 1, y1, selfX, selfY, false);
                    // we will collapse if we cannot push, allowing collapses (instant) but not unsticks
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
                        xPos = x2 - 1;
                        break;
                    }
                }
            }
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
            if (id == COLLAPSABLE) {
                if (!allowRecursion) {
                    xPos = x2 + 1;
                    break;
                }
                if (x2 == gridWidth - 1) {
                    xPos = x2 + 1;
                    break;
                }
                else {
                    // see if we can push with collapsing
                    // if we cannot, then we collapse this one
                    let [worked1, pushPixels1] = pushRightCheck(x2 + 1, y1, selfX, selfY, false);
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
                        xPos = x2 + 1;
                        break;
                    }
                }
            }
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
            if (id == COLLAPSABLE) {
                if (!allowRecursion) {
                    yPos = y2 - 1;
                    break;
                }
                if (y2 == 0) {
                    yPos = y2 - 1;
                    break;
                }
                else {
                    // see if we can push with collapsing
                    // if we cannot, then we collapse this one
                    let [worked1, pushPixels1] = pushUpCheck(x1, y2 - 1, selfX, selfY, false);
                    // alert(worked1)
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
                        yPos = y2 - 1;
                        break;
                    }
                }
            }
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
            if (id == COLLAPSABLE) {
                if (!allowRecursion) {
                    yPos = y2 + 1;
                    break;
                }
                if (y2 == gridHeight - 1) {
                    yPos = y2 + 1;
                    break;
                }
                else {
                    // see if we can push with collapsing
                    // if we cannot, then we collapse this one
                    let [worked1, pushPixels1] = pushDownCheck(x1, y2 + 1, selfX, selfY, false);
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
                        yPos = y2 + 1;
                        break;
                    }
                }
            }
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

let pixels = [];
let pixelData = {
    air: {
        name: "Air",
        description: "It's air... What did you expect?",
        group: "General",
        groupDescription: "The main set of pixels.",
        subgroup: "Air",
        color: new Float32Array([255, 255, 255, 0.5]),
        // texture: new Float32Array([3, 0, 0, 0]),
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
        stickable: false,
        cloneable: false,
        collectable: false,
    },
    wall: {
        name: "Wall",
        description: "An immovable wall",
        group: "General",
        subgroup: "Wall",
        color: new Float32Array([0, 0, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: -1,
        pushable: false,
        stickable: false,
        cloneable: false,
        collectable: false,
    },
    dirt: {
        name: "Dirt",
        description: "Wash your hands after handling it, it's pretty dirty",
        group: "General",
        subgroup: "Dirt",
        color: new Float32Array([125, 75, 0, 1]),
        // color: new Float32Array([0.5, 0.3, 0, 1]),
        state: SOLID,
        flammability: 1,
        blastResistance: 75,
        cost: {
            color_brown: 2,
        },
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + UPDATED] == tick) {
                    return;
                }
                if (grid[index1 + ID] == WATER) {
                    addPixel(x, y, MUD);
                    changed = true;
                }
            });
            if (changed) {
                pixels[MUD].update(x, y);
                return;
            }
            flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
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
        name: "Grass",
        description: "Go touch some",
        group: "General",
        subgroup: "Dirt",
        color: new Float32Array([25, 175, 25, 1]),
        // color: new Float32Array([0.1, 0.7, 0.1, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 75,
        cost: {
            color_brown: 2,
            color_green: 1,
        },
        update: function(x, y) {
            if (!isTouching(x, y, [AIR])) {
                addPixel(x, y, DIRT);
            }
            flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
        },
    },
    mud: {
        name: "Mud",
        description: "Basically wet dirt",
        group: "General",
        subgroup: "Dirt",
        color: new Float32Array([90, 50, 0, 1]),
        noise: new Float32Array([25, 20, 0, 0]),
        state: SOLID,
        flammability: 1,
        blastResistance: 85,
        cost: {
            color_brown: 2,
        },
        craftable: false,
        update: function(x, y) {
            flow(x, y, 3, 1, isPassableSolid, isMoveableSolid);
        },
        randomUpdate: function(x, y) {
            if (!isInRange(x, y, 5, [WATER])) {
                addPixel(x, y, DIRT);
            }
        },
    },
    sand: {
        name: "Sand",
        description: "Weird yellow powdery stuff that falls",
        group: "General",
        subgroup: "Sand",
        color: new Float32Array([255, 225, 125, 1]),
        // noise: new Float32Array([0, 0.05, 0, 0]),
        state: SOLID,
        flammability: 0,
        blastResistance: 100,
        cost: {
            color_yellow: 2,
        },
        update: function(x, y) {
            flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
    },
    gravel: {
        name: "Gravel",
        description: "Weird gray rocky stuff that falls",
        group: "General",
        subgroup: "Sand",
        color: new Float32Array([90, 90, 75, 1]),
        noise: new Float32Array([30, 30, 25, 0]),
        state: SOLID,
        flammability: 0,
        blastResistance: 125,
        cost: {
            color_gray: 1,
            color_black: 1,
        },
        update: function(x, y) {
            flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
    },
    concrete_powder: {
        name: "Concrete Powder",
        description: "Hardens into concrete upon contact with water",
        group: "General",
        subgroup: "Concrete Powder",
        color: new Float32Array([150, 150, 150, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 100,
        cost: {
            color_gray: 1,
            sand: 2,
            gravel: 2,
            clay: 1,
        },
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + UPDATED] == tick) {
                    return;
                }
                if (grid[index1 + ID] == WATER) {
                    addPixel(x, y, CONCRETE);
                    changed = true;
                }
            });
            if (changed) {
                return;
            }
            flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
        },
    },
    concrete: {
        name: "Concrete",
        description: "Hard stuff that doesn't melt",
        group: "General",
        subgroup: "Concrete Powder",
        color: new Float32Array([75, 75, 75, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 1000,
        cost: {
            concrete_powder: 1,
        },
    },
    water: {
        name: "Water",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Water",
        color: new Float32Array([75, 100, 255, 1]),
        state: LIQUID,
        flammability: 0,
        blastResistance: 650,
        stickable: false,
        cost: {
            color_cyan: 1,
            color_blue: 1,
        },
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

            flow(x, y, gridWidth, 1, isPassable, isMoveable);
            // flow1(x, y, isPassable, true, 1, true, 5);
        },
    },
    ice: {
        name: "Ice",
        description: "Cold water",
        group: "General",
        subgroup: "Water",
        color: new Float32Array([200, 220, 255, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 60,
        cost: {
            color_cyan: 1,
            color_blue: 1,
        },
        randomUpdate: function(x, y) {
            let touchingIce = 10;
            touchingIce *= 2 ** getTouching(x, y, [ICE, ICE_FREEZER]);
            touchingIce *= 1.5 ** getTouching(x, y, [SNOW]);
            touchingIce /= 2 ** getTouching(x, y, [WATER]);
            if (random() < 0.2 / touchingIce) {
                addPixel(x, y, WATER);
            }
        },
    },
    snow: {
        name: "Snow",
        description: "Fluffy cold water",
        group: "General",
        subgroup: "Water",
        color: new Float32Array([230, 235, 235, 1]),
        noise: new Float32Array([0, 10, 10, 0]),
        state: SOLID,
        flammability: 0,
        blastResistance: 60,
        cost: {
            color_cyan: 1,
            color_blue: 1,
        },
        update: function(x, y) {
            flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
        randomUpdate: function(x, y) {
            let touchingIce = 10;
            touchingIce *= 2 ** getTouching(x, y, [ICE, ICE_FREEZER]);
            touchingIce *= 1.5 ** getTouching(x, y, [SNOW]);
            touchingIce /= 2 ** getTouching(x, y, [WATER]);
            if (random() < 0.4 / touchingIce) {
                addPixel(x, y, WATER);
            }
        },
    },
    steam: {
        name: "Steam",
        description: "Hot water that will cause second-degree burns",
        group: "General",
        subgroup: "Water",
        color: new Float32Array([210, 210, 210, 1]),
        state: GAS,
        flammability: 0,
        blastResistance: 0,
        stickable: false,
        cost: {
            color_cyan: 1,
            color_blue: 1,
        },
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if ((grid[index1 + PIXEL_DATA] & 1) == 1) {
                    return;
                }
                if (random() < pixels[grid[index1 + ID]].flammability / 20) {
                    addFire(x1, y1, 1);
                    changed = true;
                }
                else if ((grid[index1 + ID] == ICE || grid[index1 + ID] == SNOW) && random() < 0.1) {
                    addPixel(x1, y1, WATER);
                    changed = true;
                }
            });
            if (changed) {
                addPixel(x, y, WATER);
                pixels[WATER].update(x, y);
                return;
            }
            function isPassable(x, y) {
                return isOnGrid(x, y) && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state != SOLID;
            };
            function isMoveable(x, y) {
                return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && (grid[(x + y * gridWidth) * gridStride + ID] == AIR || grid[(x + y * gridWidth) * gridStride + ID] == DELETER || grid[(x + y * gridWidth) * gridStride + ID] == MONSTER || pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == LIQUID);
            };
            rise(x, y, gridWidth, 1, isPassable, isMoveable);
            addUpdatedChunk(x, y);
        },
        randomUpdate: function(x, y) {
            if (random() < 0.5) {
                addPixel(x, y, WATER);
            }
            else {
                addPixel(x, y, AIR);
                addTeam(x, y, -1);
            }
            return;
        },
    },
    lava: {
        name: "Lava",
        description: "Melts stuff and sets things on fire",
        group: "General",
        subgroup: "Lava",
        color: new Float32Array([255, 100, 0, 1]),
        state: LIQUID,
        flammability: 0,
        blastResistance: 750,
        stickable: false,
        cost: {
            color_red: 1,
            color_orange: 1,
        },
        update: function(x, y) {
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
            if (random() < 0.5) {
                function isPassable(x, y) {
                    return isOnGrid(x, y) && (pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS || grid[(x + y * gridWidth) * gridStride + ID] == LAVA);
                };
                function isMoveable(x, y) {
                    return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS;
                };

                flow(x, y, gridWidth, 1, isPassable, isMoveable);
            }
            else {
                if (random() < 0.125) {
                    let left = x > 0 && grid[(x - 1 + y * gridWidth) * gridStride + ID] == STONE;
                    let right = x < gridWidth - 1 && grid[(x + 1 + y * gridWidth) * gridStride + ID] == STONE;
                    if (left && (!right || random() < 0.5)) {
                        move(x, y, x - 1, y);
                        return;
                    }
                    else if (right) {
                        move(x, y, x + 1, y);
                        return;
                    }
                }
                if (y > 0 && random() < 0.5 && grid[(x + (y + 1) * gridWidth) * gridStride + ID] == LAVA && grid[(x + (y - 1) * gridWidth) * gridStride + ID] == STONE) {
                    move(x, y, x, y - 1);
                    return;
                }
                else if (y < gridHeight - 1 && random() < 0.5 && grid[(x + (y + 1) * gridWidth) * gridStride + ID] == STONE) {
                    move(x, y, x, y + 1);
                    return;
                }
                addUpdatedChunk(x, y);
            }
        },
    },
    fire: {
        name: "Fire",
        description: "AAAAAA!!! It burns!",
        group: "General",
        subgroup: "Lava",
        color: new Float32Array([255, 180, 0, 1]),
        state: SOLID,
        flammability: 20,
        blastResistance: 0,
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
        name: "Water Pump",
        description: "Violates the laws of thermodynamics to create water",
        group: "General",
        subgroup: "Water Pump",
        texture: new Float32Array([0, 2, 3, 3]),
        state: SOLID,
        flammability: 8,
        blastResistance: 100,
        update: function(x, y) {
            if (isTouching(x, y, [LAVA])) {
                addPixel(x, y, WATER);
                explode(x, y, 5 * 5, 5 * 8, 800);
                return;
            }
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == AIR && random() < 0.125) {
                    // let team = getTeam(x, y);
                    // if (multiplayerId != null && team != -1) {
                    //     if (multiplayerPixelInventory[team])
                    // }
                    addPixel(x1, y1, WATER);
                    copyTeam(x, y, x1, y1);
                }
            });
            addUpdatedChunk(x, y);
        },
    },
    lava_heater: {
        name: "Lava Heater",
        description: "Violates the laws of thermodynamics to create lava",
        group: "General",
        subgroup: "Water Pump",
        texture: new Float32Array([3, 2, 3, 3]),
        state: SOLID,
        flammability: 0,
        blastResistance: 100,
        update: function(x, y) {
            if (isTouching(x, y, [WATER])) {
                addPixel(x, y, LAVA);
                explode(x, y, 5 * 5, 5 * 8, 800);
                return;
            }
            if (isTouching(x, y, [ICE, SNOW])) {
                addPixel(x, y, LAVA);
                explode(x, y, 7 * 7, 7 * 8, 800);
                return;
            }
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                // if ((grid[index1 + ID] == AIR || grid[index1 + ID] == STONE) && random() < 0.075) {
                if (grid[index1 + ID] == AIR && random() < 0.075) {
                    addPixel(x1, y1, LAVA);
                    copyTeam(x, y, x1, y1);
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
        },
    },
    ice_freezer: {
        name: "Ice Freezer",
        description: "Violates the laws of thermodynamics to freeze water",
        group: "General",
        subgroup: "Water Pump",
        texture: new Float32Array([6, 2, 3, 3]),
        state: SOLID,
        flammability: 8,
        blastResistance: 100,
        update: function(x, y) {
            if (isTouching(x, y, [LAVA])) {
                addPixel(x, y, ICE);
                explode(x, y, 7 * 7, 7 * 8, 800);
                return;
            }
            for (let i = 0; i < 3; i++) {
                let freezeAngle = random() * Math.PI * 2;
                raycast(x, y, Math.cos(freezeAngle), Math.sin(freezeAngle), (x1, y1) => {
                    let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                    if (dist > 10) {
                        return false;
                    }
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if (grid[index1 + ID] == WATER) {
                        if (random() < (10 - dist) / 400) {
                            addPixel(x1, y1, ICE);
                        }
                    }
                    else if (grid[index1 + ID] == STEAM) {
                        if (random() < (10 - dist) / 200) {
                            addPixel(x1, y1, WATER);
                        }
                    }
                    else if (grid[index1 + ID] != AIR && grid[index1 + ID] != ICE) {
                        return false;
                    }
                    return true;
                });
            }
            addUpdatedChunk(x, y);
        },
    },
    clay: {
        name: "Clay",
        description: "Impure clay with a red tint",
        group: "General",
        subgroup: "Clay",
        color: new Float32Array([160, 80, 50, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 140,
        cost: {
            color_red: 1,
            color_brown: 2,
        },
        update: function(x, y) {
            flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
        },
    },
    bricks: {
        name: "Bricks",
        description: "Hard rectangular clay",
        group: "General",
        subgroup: "Clay",
        texture: new Float32Array([0, 20, 8, 8]),
        state: SOLID,
        flammability: 0,
        blastResistance: 600,
        cost: {
            clay: 1,
        },
        update: function(x, y) {
            if (isMoveableSolid(x, y + 1)) {
                let stable = false;
                let left = 0;
                let right = 0;
                for (let i = 1; i <= 2; i++) {
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
        name: "Stone",
        description: "Very stony and hard",
        group: "General",
        subgroup: "Stone",
        color: new Float32Array([110, 110, 110, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 400,
        cost: {
            color_gray: 4,
        },
    },
    basalt: {
        name: "Basalt",
        description: "Stonier and harder",
        group: "General",
        subgroup: "Stone",
        color: new Float32Array([90, 90, 110, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 750,
        cost: {
            color_gray: 6,
            color_black: 2,
        },
    },
    iron: {
        name: "Raw Iron",
        description: "Some undefined iron",
        group: "General",
        subgroup: "Iron",
        color: new Float32Array([160, 160, 180, 1]),
        noise: new Float32Array([40, 20, -60, 0]),
        state: SOLID,
        flammability: 0,
        blastResistance: 500,
        cost: {
            color_yellow: 3,
            color_gray: 4,
        },
    },
    steel: {
        name: "Steel",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Iron",
        texture: new Float32Array([8, 20, 8, 8]),
        state: SOLID,
        flammability: 0,
        blastResistance: 700,
    },
    rubber: {
        name: "Rubber",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Iron",
        texture: new Float32Array([0, 14, 6, 6]),
        state: SOLID,
        flammability: 0,
        blastResistance: 180,
        pushable: false,
    },
    glass: {
        name: "Glass",
        description: "Somehow you can see it",
        group: "General",
        subgroup: "Glass",
        texture: new Float32Array([120, 55, 25, 25]),
        amountColor: "black",
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        stickable: false,
        cost: {
            sand: 1,
        },
    },
    wood: {
        name: "Wood",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Wood",
        texture: new Float32Array([0, 0, 2, 2]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        cost: {
            color_brown: 2,
        },
    },
    leaves: {
        name: "Leaves",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Wood",
        color: new Float32Array([100, 220, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 20,
        cost: {
            color_lime: 1,
        },
        randomUpdate: function(x, y) {
            if (isTouching(x, y, [WOOD])) {
                return;
            }
            let touchingLeaves = 0;
            touchingLeaves += getTouching(x, y, [WOOD, LEAVES]);
            touchingLeaves += getTouchingDiagonal(x, y, [WOOD, LEAVES]);
            if (touchingLeaves < 3) {
                if (random() < 1 / 140) {
                    addPixel(x, y, SAPLING);
                }
                else {
                    addPixel(x, y, AIR);
                    addTeam(x, y, -1);
                }
            }
        },
    },
    sapling: {
        name: "Sapling",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Wood",
        texture: new Float32Array([6, 14, 6, 6]),
        state: SOLID,
        flammability: 0,
        blastResistance: 60,
        cost: {
            color_lime: 8,
            color_brown: 8,
        },
        update: function(x, y) {
            fall(x, y, isMoveableSolid);
        },
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
                    addBranch(x, y, -Math.PI / 2, growth * (0.2 + random() * 0.1), growth * (0.8 + random() * 0.7));
                }
            }
        },
    },
    plant: {
        name: "Plant",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Plant",
        color: new Float32Array([125, 255, 75, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 50,
        cost: {
            color_lime: 24,
        },
        update: function(x, y) {
            let valid = false;
            if (isTouching(x, y, [LAVA])) {
                valid = false;
            }
            else {
                let touchingPlants = getTouching(x, y, [PLANT]);
                if (touchingPlants == 4) {
                    valid = false;
                }
                else if (touchingPlants >= 2) {
                    valid = true;
                }
                else {
                    valid = isTouching(x, y, [AIR, WATER]);
                }
            }
            if (!valid) {
                addPixel(x, y, WATER);
                return;
            }
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == CONCRETE) {
                    changed = true;
                    addPixel(x1, y1, PLANT);
                    copyTeam(x, y, x1, y1);
                }
            });
            if (changed) {
                addPixel(x, y, WATER);
                pixels[WATER].update(x, y);
                return;
            }
            let isMoveable = (x1, y1) => {
                return isOnGrid(x1, y1) && grid[(x1 + y1 * gridWidth) * gridStride + UPDATED] != tick && (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == GAS || (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == LIQUID && random() < 0.5));
            };
            if (isMoveable(x, y + 1)) {
                move(x, y, x, y + 1);
            }
            else if (isMoveableSolid(x, y + 1)) {
                addUpdatedChunk(x, y);
            }
        },
    },
    moss: {
        name: "Moss",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Plant",
        color: new Float32Array([50, 150, 25, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 60,
        cost: {
            color_lime: 8,
            color_green: 8,
        },
        update: function(x, y) {
            if (!isTouching(x, y, [STONE])) {
                flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
            }
            else if (isTouchingDiagonal(x, y, [STONE])) {
                addUpdatedChunk(x, y);
            }
            forTouchingDiagonal(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == STONE && random() < 0.1 && isTouching(x1, y1, [AIR])) {
                    addPixel(x1, y1, MOSS);
                    copyTeam(x, y, x1, y1);
                }
            });
        },
    },
    lichen: {
        name: "Lichen",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Plant",
        color: new Float32Array([255, 225, 25, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 60,
        cost: {
            color_orange: 12,
            color_yellow: 12,
            color_lime: 12,
        },
        update: function(x, y) {
            if (!isTouching(x, y, [BASALT])) {
                flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
            }
            else if (isTouchingDiagonal(x, y, [BASALT])) {
                addUpdatedChunk(x, y);
            }
            forTouchingDiagonal(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == BASALT && random() < 0.1 && isTouching(x1, y1, [AIR])) {
                    addPixel(x1, y1, LICHEN);
                    copyTeam(x, y, x1, y1);
                }
            });
        },
    },
    sponge: {
        name: "Sponge",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Plant",
        color: new Float32Array([225, 255, 75, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 50,
        cost: {
            color_yellow: 16,
            color_lime: 4,
        },
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == WATER) {
                    changed = true;
                    addPixel(x1, y1, SPONGE);
                    copyTeam(x, y, x1, y1);
                }
            });
            if (changed) {
                addPixel(x, y, AIR);
                addTeam(x, y, -1);
                return;
            }
            let isMoveable = (x1, y1) => {
                return isOnGrid(x1, y1) && grid[(x1 + y1 * gridWidth) * gridStride + UPDATED] != tick && (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == GAS || (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == LIQUID && random() < 0.5));
            };
            if (isMoveable(x, y + 1)) {
                move(x, y, x, y + 1);
            }
            else {
                let valid = isTouching(x, y, [SAND]);
                if (!valid && random() < 1 / 8) {
                    addPixel(x, y, AIR);
                    addTeam(x, y, -1);
                    return;
                }
                if (!valid || isMoveableSolid(x, y + 1)) {
                    addUpdatedChunk(x, y);
                }
            }
        },
    },
    super_sponge: {
        name: "Super Sponge",
        description: "Sponge pro max +++",
        group: "General",
        subgroup: "Plant",
        color: new Float32Array([175, 255, 75, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 50,
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == WATER || grid[index1 + ID] == LAVA) {
                    changed = true;
                    addPixel(x1, y1, SUPER_SPONGE);
                    copyTeam(x, y, x1, y1);
                }
            });
            if (changed) {
                addPixel(x, y, AIR);
                addTeam(x, y, -1);
                return;
            }
            let isMoveable = (x1, y1) => {
                return isOnGrid(x1, y1) && grid[(x1 + y1 * gridWidth) * gridStride + UPDATED] != tick && (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == GAS || (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == LIQUID && random() < 0.5));
            };
            if (isMoveable(x, y + 1)) {
                move(x, y, x, y + 1);
            }
            else {
                let valid = isTouching(x, y, [SAND]);
                if (!valid && random() < 1 / 8) {
                    addPixel(x, y, AIR);
                    addTeam(x, y, -1);
                    return;
                }
                if (!valid || isMoveableSolid(x, y + 1)) {
                    addUpdatedChunk(x, y);
                }
            }
        },
    },
    ash: {
        name: "Ash",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Ash",
        // color: new Float32Array([80, 85, 90, 1]),
        color: new Float32Array([40, 45, 45, 1]),
        noise: new Float32Array([40, 45, 50, 0]),
        state: SOLID,
        flammability: 4,
        blastResistance: 75,
        update: function(x, y) {
            flow(x, y, 2, 1, isPassableSolid, isMoveableSolid);
        },
    },
    wood_crate: {
        name: "Wooden Crate",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Crate",
        texture: new Float32Array([0, 40, 40, 40]),
        state: SOLID,
        flammability: 10,
        blastResistance: 175,
        cost: {
            color_brown: 3,
        },
        update: function(x, y) {
            let isMoveableUp = (x1, y1) => {
                return isOnGrid(x1, y1) && grid[(x1 + y1 * gridWidth) * gridStride + UPDATED] != tick && (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == LIQUID);
            };
            let isMoveableDown = (x1, y1) => {
                return isOnGrid(x1, y1) && grid[(x1 + y1 * gridWidth) * gridStride + UPDATED] != tick && (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == GAS);
            };
            if (isMoveableUp(x, y - 1)) {
                move(x, y, x, y - 1);
            }
            else if (isMoveableDown(x, y + 1)) {
                move(x, y, x, y + 1);
            }
        },
    },
    steel_crate: {
        name: "Steel Crate",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Crate",
        texture: new Float32Array([40, 40, 40, 40]),
        state: SOLID,
        flammability: 0,
        blastResistance: 500,
        pushable: false,
        update: function(x, y) {
            fall(x, y, isMoveableSolid);
        },
    },
    piston_left: {
        name: "Piston (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Piston",
        texture: new Float32Array([12, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 200,
        rotatable: true,
        rotations: ["piston_left", "piston_up", "piston_right", "piston_down"],
        cost: {
            color_cyan: 5,
            color_blue: 1,
        },
        update1: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            pushLeft(x, y, -1, -1, 1);
            addUpdatedChunk(x, y);
        },
    },
    piston_up: {
        name: "Piston (Up)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Piston",
        texture: new Float32Array([18, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 200,
        rotatable: true,
        rotations: ["piston_left", "piston_up", "piston_right", "piston_down"],
        cost: {
            piston_left: 1,
        },
        update3: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            pushUp(x, y, -1, -1, 1);
            addUpdatedChunk(x, y);
        },
    },
    piston_right: {
        name: "Piston (Right)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Piston",
        texture: new Float32Array([24, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 200,
        rotatable: true,
        rotations: ["piston_left", "piston_up", "piston_right", "piston_down"],
        cost: {
            piston_left: 1,
        },
        update2: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            pushRight(x, y, -1, -1, 1);
            addUpdatedChunk(x, y);
        },
    },
    piston_down: {
        name: "Piston (Down)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Piston",
        texture: new Float32Array([30, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 200,
        rotatable: true,
        rotations: ["piston_left", "piston_up", "piston_right", "piston_down"],
        cost: {
            piston_left: 1,
        },
        update4: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            pushDown(x, y, -1, -1, 1);
            addUpdatedChunk(x, y);
        },
    },
    pusher_left: {
        name: "Pusher Left",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Pusher",
        texture: new Float32Array([60, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 240,
        stickableLeft: false,
        rotatable: true,
        rotations: ["pusher_left", "pusher_up", "pusher_right", "pusher_down"],
        cost: {
            color_cyan: 2,
            color_blue: 1,
            color_gray: 3,
        },
        update1: function(x, y) {
            if (x == 0) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            pushLeft(x - 1, y, x, y, 1);
            addUpdatedChunk(x, y);
        },
    },
    pusher_up: {
        name: "Pusher Up",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Pusher",
        texture: new Float32Array([66, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 240,
        stickableUp: false,
        rotatable: true,
        rotations: ["pusher_left", "pusher_up", "pusher_right", "pusher_down"],
        cost: {
            pusher_left: 1,
        },
        update3: function(x, y) {
            if (y == 0) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            pushUp(x, y - 1, x, y, 1);
            addUpdatedChunk(x, y);
        },
    },
    pusher_right: {
        name: "Pusher Right",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Pusher",
        texture: new Float32Array([72, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 240,
        stickableRight: false,
        rotatable: true,
        rotations: ["pusher_left", "pusher_up", "pusher_right", "pusher_down"],
        cost: {
            pusher_left: 1,
        },
        update2: function(x, y) {
            if (x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            pushRight(x + 1, y, x, y, 1);
            addUpdatedChunk(x, y);
        },
    },
    pusher_down: {
        name: "Pusher Down",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Pusher",
        texture: new Float32Array([78, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 240,
        stickableDown: false,
        rotatable: true,
        rotations: ["pusher_left", "pusher_up", "pusher_right", "pusher_down"],
        cost: {
            pusher_left: 1,
        },
        update4: function(x, y) {
            if (y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            pushDown(x, y + 1, x, y, 1);
            addUpdatedChunk(x, y);
        },
    },
    fan_left: {
        name: "Fan Left",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Fan",
        texture: new Float32Array([0, 140, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 60,
        stickableLeft: false,
        rotatable: true,
        rotations: ["fan_left", "fan_up", "fan_right", "fan_down"],
        cost: {
            color_cyan: 1,
            color_blue: 1,
            color_gray: 3,
        },
        update1: function(x, y) {
            if (x == 0) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            pushLeft(x - 1, y, x, y, 0);
            addUpdatedChunk(x, y);
        },
    },
    fan_up: {
        name: "Fan Up",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Fan",
        texture: new Float32Array([60, 140, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 60,
        stickableUp: false,
        rotatable: true,
        rotations: ["fan_left", "fan_up", "fan_right", "fan_down"],
        cost: {
            fan_left: 1,
        },
        update3: function(x, y) {
            if (y == 0) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            pushUp(x, y - 1, x, y, 0);
            addUpdatedChunk(x, y);
        },
    },
    fan_right: {
        name: "Fan Right",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Fan",
        texture: new Float32Array([120, 140, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 60,
        stickableRight: false,
        rotatable: true,
        rotations: ["fan_left", "fan_up", "fan_right", "fan_down"],
        cost: {
            fan_left: 1,
        },
        update2: function(x, y) {
            if (x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            pushRight(x + 1, y, x, y, 0);
            addUpdatedChunk(x, y);
        },
    },
    fan_down: {
        name: "Fan Down",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Fan",
        texture: new Float32Array([180, 140, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 60,
        stickableDown: false,
        rotatable: true,
        rotations: ["fan_left", "fan_up", "fan_right", "fan_down"],
        cost: {
            fan_left: 1,
        },
        update4: function(x, y) {
            if (y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            pushDown(x, y + 1, x, y, 0);
            addUpdatedChunk(x, y);
        },
    },
    sticky_piston_left: {
        name: "Sticky Piston Left",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Sticky Piston",
        texture: new Float32Array([36, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["sticky_piston_left", "sticky_piston_up", "sticky_piston_right", "sticky_piston_down"],
        sticky: 1,
        cost: {
            piston_left: 1,
            slime: 1,
        },
        update1: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            pushLeft(x, y, -1, -1, 2);
            addUpdatedChunk(x, y);
        },
    },
    sticky_piston_up: {
        name: "Sticky Piston Up",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Sticky Piston",
        texture: new Float32Array([42, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["sticky_piston_left", "sticky_piston_up", "sticky_piston_right", "sticky_piston_down"],
        sticky: 1,
        cost: {
            piston_left: 1,
            slime: 1,
        },
        update3: function(x, y) {
            pushUp(x, y, -1, -1, 2);
            addUpdatedChunk(x, y);
        },
    },
    sticky_piston_right: {
        name: "Sticky Piston Right",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Sticky Piston",
        texture: new Float32Array([48, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["sticky_piston_left", "sticky_piston_up", "sticky_piston_right", "sticky_piston_down"],
        sticky: 1,
        cost: {
            piston_left: 1,
            slime: 1,
        },
        update2: function(x, y) {
            pushRight(x, y, -1, -1, 2);
            addUpdatedChunk(x, y);
        },
    },
    sticky_piston_down: {
        name: "Sticky Piston Down",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Sticky Piston",
        texture: new Float32Array([54, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["sticky_piston_left", "sticky_piston_up", "sticky_piston_right", "sticky_piston_down"],
        sticky: 1,
        cost: {
            piston_left: 1,
            slime: 1,
        },
        update4: function(x, y) {
            pushDown(x, y, -1, -1, 2);
            addUpdatedChunk(x, y);
        },
    },
    copier_left: {
        name: "Copier Left",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Copier",
        texture: new Float32Array([0, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 300,
        rotatable: true,
        rotations: ["copier_left", "copier_up", "copier_right", "copier_down"],
        cost: {
            color_lime: 1,
            color_blue: 1,
            concrete: 4,
        },
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
                let index1 = (x - 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x - 1, y, grid[index + ID]);
                copyTeam(x, y, x - 1, y);
            }
            // addUpdatedChunk(x, y);
        },
    },
    copier_up: {
        name: "Copier Up",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Copier",
        texture: new Float32Array([12, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 300,
        rotatable: true,
        rotations: ["copier_left", "copier_up", "copier_right", "copier_down"],
        cost: {
            copier_left: 1,
        },
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
                let index1 = (x + (y - 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x, y - 1, grid[index + ID]);
                copyTeam(x, y, x, y - 1);
            }
            // addUpdatedChunk(x, y);
        },
    },
    copier_right: {
        name: "Copier Right",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Copier",
        texture: new Float32Array([24, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 300,
        rotatable: true,
        rotations: ["copier_left", "copier_up", "copier_right", "copier_down"],
        cost: {
            copier_left: 1,
        },
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
                let index1 = (x + 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x + 1, y, grid[index + ID]);
                copyTeam(x, y, x + 1, y);
            }
            // addUpdatedChunk(x, y);
        },
    },
    copier_down: {
        name: "Copier Down",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Copier",
        texture: new Float32Array([36, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 300,
        rotatable: true,
        rotations: ["copier_left", "copier_up", "copier_right", "copier_down"],
        cost: {
            copier_left: 1,
        },
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
                let index1 = (x + (y + 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x, y + 1, grid[index + ID]);
                copyTeam(x, y, x, y + 1);
            }
            // addUpdatedChunk(x, y);
        },
    },
    cloner_left: {
        name: "Cloner Left",
        description: "Unrealistically flows and may or may not be wet",
        // description: "<button>look i put button in tooltip</button><br>and embeds lol<iframe src='https://beepbox.co'>",
        group: "Mechanical",
        subgroup: "Cloner",
        texture: new Float32Array([0, 80, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        rotatable: true,
        rotations: ["cloner_left", "cloner_up", "cloner_right", "cloner_down"],
        cost: {
            color_yellow: 1,
            color_lime: 1,
            color_blue: 1,
            concrete: 4,
        },
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
                        addUpdatedChunk(x, y);
                        return;
                    }
                }
                if (grid[index1 + ID] == AIR) {
                    addPixel(x - 1, y, id);
                    copyTeam(x, y, x - 1, y);
                }
            }
            addUpdatedChunk(x, y);
        },
    },
    cloner_up: {
        name: "Cloner Up",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Cloner",
        texture: new Float32Array([60, 80, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        rotatable: true,
        rotations: ["cloner_left", "cloner_up", "cloner_right", "cloner_down"],
        cost: {
            cloner_left: 1,
        },
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
                        addUpdatedChunk(x, y);
                        return;
                    }
                }
                if (grid[index1 + ID] == AIR) {
                    addPixel(x, y - 1, id);
                    copyTeam(x, y, x, y - 1);
                }
            }
            addUpdatedChunk(x, y);
        },
    },
    cloner_right: {
        name: "Cloner Right",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Cloner",
        texture: new Float32Array([120, 80, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        rotatable: true,
        rotations: ["cloner_left", "cloner_up", "cloner_right", "cloner_down"],
        cost: {
            cloner_left: 1,
        },
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
                        addUpdatedChunk(x, y);
                        return;
                    }
                }
                if (grid[index1 + ID] == AIR) {
                    addPixel(x + 1, y, id);
                    copyTeam(x, y, x + 1, y);
                }
            }
            addUpdatedChunk(x, y);
        },
    },
    cloner_down: {
        name: "Cloner Down",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Cloner",
        texture: new Float32Array([180, 80, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        rotatable: true,
        rotations: ["cloner_left", "cloner_up", "cloner_right", "cloner_down"],
        cost: {
            cloner_left: 1,
        },
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
                        addUpdatedChunk(x, y);
                        return;
                    }
                }
                if (grid[index1 + ID] == AIR) {
                    addPixel(x, y + 1, id);
                    copyTeam(x, y, x, y + 1);
                }
            }
            addUpdatedChunk(x, y);
        },
    },
    rotator_left: {
        name: "Rotator (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: new Float32Array([84, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        rotations: ["rotator_left", "rotator_up", "rotator_right", "rotator_down"],
        cost: {
            color_cyan: 1,
            color_gray: 5,
        },
        update: function(x, y) {
            let updated = false;
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                    updated = true;
                }
            });
            if (updated) {
                addUpdatedChunk(x, y);
            }
        },
    },
    rotator_up: {
        name: "Rotator (Up)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: new Float32Array([90, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        rotations: ["rotator_left", "rotator_up", "rotator_right", "rotator_down"],
        cost: {
            rotator_left: 1,
        },
        update: function(x, y) {
            let updated = false;
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                    updated = true;
                }
            });
            if (updated) {
                addUpdatedChunk(x, y);
            }
        },
    },
    rotator_right: {
        name: "Rotator (Right)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: new Float32Array([96, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        rotations: ["rotator_left", "rotator_up", "rotator_right", "rotator_down"],
        cost: {
            rotator_left: 1,
        },
        update: function(x, y) {
            let updated = false;
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                    updated = true;
                }
            });
            if (updated) {
                addUpdatedChunk(x, y);
            }
        },
    },
    rotator_down: {
        name: "Rotator (Down)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: new Float32Array([102, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        rotations: ["rotator_left", "rotator_up", "rotator_right", "rotator_down"],
        cost: {
            rotator_left: 1,
        },
        update: function(x, y) {
            let updated = false;
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                    updated = true;
                }
            });
            if (updated) {
                addUpdatedChunk(x, y);
            }
        },
    },
    rotator_clockwise: {
        name: "Rotator (Clockwise)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: [new Float32Array([9, 2, 3, 3]), new Float32Array([12, 2, 3, 3]), new Float32Array([15, 2, 3, 3]), new Float32Array([18, 2, 3, 3])],
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        cost: {
            rotator_left: 1,
        },
        update: function(x, y) {
            let updated = false;
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                    updated = true;
                }
            });
            if (updated) {
                addUpdatedChunk(x, y);
            }
        },
    },
    rotator_counterclockwise: {
        name: "Rotator (Counterclockwise)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: [new Float32Array([12, 2, 3, 3]), new Float32Array([9, 2, 3, 3]), new Float32Array([18, 2, 3, 3]), new Float32Array([15, 2, 3, 3])],
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
        cost: {
            rotator_left: 1,
        },
        update: function(x, y) {
            let updated = false;
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                    updated = true;
                }
            });
            if (updated) {
                addUpdatedChunk(x, y);
            }
        },
    },
    slider_horizontal: {
        name: "Slider (Horizontal)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Slider",
        texture: new Float32Array([0, 5, 4, 4]),
        state: SOLID,
        flammability: 10,
        blastResistance: 800,
        rotatable: true,
        rotations: ["slider_horizontal", "slider_vertical"],
        pushableUp: false,
        pushableDown: false,
        cost: {
            color_orange: 8,
            color_yellow: 8,
        },
    },
    slider_vertical: {
        name: "Slider (Vertical)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Slider",
        texture: new Float32Array([4, 5, 4, 4]),
        state: SOLID,
        flammability: 10,
        blastResistance: 800,
        rotatable: true,
        rotations: ["slider_horizontal", "slider_vertical"],
        pushableLeft: false,
        pushableRight: false,
        cost: {
            slider_horizontal: 1,
        },
    },
    collapsable: {
        name: "Collapsable Box",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Collapsable Box",
        texture: new Float32Array([80, 40, 40, 40]),
        state: SOLID,
        flammability: 12,
        blastResistance: 20,
        cost: {
            color_orange: 1,
            color_yellow: 1,
        },
    },
    slime: {
        name: "Slime",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Slime",
        // color: new Float32Array([30, 255, 75, 1]),
        color: new Float32Array([100, 255, 100, 1]),
        state: SOLID,
        flammability: 4,
        blastResistance: 50,
        sticky: 2,
        cost: {
            color_lime: 2,
        },
    },
    deactivator: {
        name: "Deactivator",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Deactivator",
        texture: new Float32Array([48, 28, 12, 12]),
        state: SOLID,
        flammability: 6,
        blastResistance: 220,
        cost: {
            color_yellow: 2,
            color_purple: 2,
            color_gray: 2,
        },
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
        name: "Observer (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Observer",
        texture: new Float32Array([0, 200, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["observer_left_off", "observer_up_off", "observer_right_off", "observer_down_off"],
        cost: {
            color_red: 1,
            color_yellow: 1,
            color_purple: 1,
            color_gray: 4,
        },
        update5: function(x, y) {
            if (x == gridWidth - 1) {
                return;
            }
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 9 && grid[index + UPDATED] < tick) {
                addPixel(x, y, OBSERVER_LEFT_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_LEFT_ON)) {
                addPixel(x, y, OBSERVER_LEFT_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    observer_left_on: {
        name: "Observer (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Observer",
        texture: new Float32Array([60, 200, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["observer_left_on", "observer_up_on", "observer_right_on", "observer_down_on"],
        cost: {
            observer_left_off: 1,
        },
        update5: function(x, y) {
            if (x == gridWidth - 1) {
                addPixel(x, y, OBSERVER_LEFT_OFF);
                return;
            }
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 9 && grid[index + UPDATED] < tick) {
                addUpdatedChunk(x, y);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_LEFT_ON)) {
                addUpdatedChunk(x, y);
                return;
            }
            addPixel(x, y, OBSERVER_LEFT_OFF);
            if (updated) {
                grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
            }
        },
    },
    observer_right_off: {
        name: "Observer (Right)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Observer",
        texture: new Float32Array([120, 200, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["observer_left_off", "observer_up_off", "observer_right_off", "observer_down_off"],
        cost: {
            observer_left_off: 1,
        },
        update5: function(x, y) {
            if (x == 0) {
                return;
            }
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 9 && grid[index + UPDATED] < tick) {
                addPixel(x, y, OBSERVER_RIGHT_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == COMPARATOR_RIGHT_OFF)) {
                addPixel(x, y, OBSERVER_RIGHT_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_RIGHT_ON)) {
                addPixel(x, y, OBSERVER_RIGHT_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    observer_right_on: {
        name: "Observer (Right)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Observer",
        texture: new Float32Array([180, 200, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["observer_left_on", "observer_up_on", "observer_right_on", "observer_down_on"],
        cost: {
            observer_left_off: 1,
        },
        update5: function(x, y) {
            if (x == 0) {
                addPixel(x, y, OBSERVER_RIGHT_OFF);
                return;
            }
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 8 && grid[index + UPDATED] < tick) {
                addUpdatedChunk(x, y);
                return;
            }
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == COMPARATOR_RIGHT_OFF)) {
                addUpdatedChunk(x, y);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_RIGHT_ON)) {
                addUpdatedChunk(x, y);
                return;
            }
            addPixel(x, y, OBSERVER_RIGHT_OFF);
            if (updated) {
                grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
            }
        },
    },
    observer_up_off: {
        name: "Observer (Up)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Observer",
        texture: new Float32Array([0, 260, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["observer_left_off", "observer_up_off", "observer_right_off", "observer_down_off"],
        cost: {
            observer_left_off: 1,
        },
        update5: function(x, y) {
            if (y == gridHeight - 1) {
                return;
            }
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 8 && grid[index + UPDATED] < tick) {
                addPixel(x, y, OBSERVER_UP_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_UP_ON)) {
                addPixel(x, y, OBSERVER_UP_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    observer_up_on: {
        name: "Observer (Up)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Observer",
        texture: new Float32Array([60, 260, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["observer_left_on", "observer_up_on", "observer_right_on", "observer_down_on"],
        cost: {
            observer_left_off: 1,
        },
        update5: function(x, y) {
            if (y == gridHeight - 1) {
                addPixel(x, y, OBSERVER_UP_OFF);
                return;
            }
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 8 && grid[index + UPDATED] < tick) {
                addUpdatedChunk(x, y);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_UP_ON)) {
                addUpdatedChunk(x, y);
                return;
            }
            addPixel(x, y, OBSERVER_UP_OFF);
            if (updated) {
                grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
            }
        },
    },
    observer_down_off: {
        name: "Observer (Down)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Observer",
        texture: new Float32Array([120, 260, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["observer_left_off", "observer_up_off", "observer_right_off", "observer_down_off"],
        cost: {
            observer_left_off: 1,
        },
        update5: function(x, y) {
            if (y == 0) {
                return;
            }
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 8 && grid[index + UPDATED] < tick) {
                addPixel(x, y, OBSERVER_DOWN_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == COMPARATOR_DOWN_OFF)) {
                addPixel(x, y, OBSERVER_DOWN_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_DOWN_ON)) {
                addPixel(x, y, OBSERVER_DOWN_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    observer_down_on: {
        name: "Observer (Down)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Observer",
        texture: new Float32Array([180, 260, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["observer_left_on", "observer_up_on", "observer_right_on", "observer_down_on"],
        cost: {
            observer_left_off: 1,
        },
        update5: function(x, y) {
            if (y == 0) {
                addPixel(x, y, OBSERVER_DOWN_OFF);
                setObserverUpdated(x, y, updated, true);
                return;
            }
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 8 && grid[index + UPDATED] < tick) {
                addUpdatedChunk(x, y);
                return;
            }
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == COMPARATOR_DOWN_OFF)) {
                addUpdatedChunk(x, y);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_DOWN_ON)) {
                addUpdatedChunk(x, y);
                return;
            }
            addPixel(x, y, OBSERVER_DOWN_OFF);
            if (updated) {
                grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
            }
        },
    },
    comparator_left_off: {
        name: "Comparator (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Comparator",
        texture: new Float32Array([60, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["comparator_left_off", "comparator_up_off", "comparator_right_off", "comparator_down_off"],
        cost: {
            color_red: 1,
            color_yellow: 1,
            color_purple: 2,
            color_gray: 2,
        },
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let pixel = AIR;
            let pixels = 0;
            if (x != gridWidth - 1) {
                let index = (x + 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != 0) {
                let index = (x + (y - 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != gridHeight - 1) {
                let index = (x + (y + 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels >= 2) {
                addPixel(x, y, COMPARATOR_LEFT_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    comparator_left_on: {
        name: "Comparator (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Comparator",
        texture: new Float32Array([72, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["comparator_left_on", "comparator_up_on", "comparator_right_on", "comparator_down_on"],
        cost: {
            comparator_left_off: 1,
        },
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let pixel = AIR;
            let pixels = 0;
            if (x != gridWidth - 1) {
                let index = (x + 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_LEFT_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != 0) {
                let index = (x + (y - 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_LEFT_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != gridHeight - 1) {
                let index = (x + (y + 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_LEFT_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels < 2) {
                addPixel(x, y, COMPARATOR_LEFT_OFF);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    comparator_up_off: {
        name: "Comparator (Up)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Comparator",
        texture: new Float32Array([84, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["comparator_left_off", "comparator_up_off", "comparator_right_off", "comparator_down_off"],
        cost: {
            comparator_left_off: 1,
        },
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let pixel = AIR;
            let pixels = 0;
            if (x != 0) {
                let index = (x - 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (x != gridWidth - 1) {
                let index = (x + 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != gridHeight - 1) {
                let index = (x + (y + 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels >= 2) {
                addPixel(x, y, COMPARATOR_UP_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    comparator_up_on: {
        name: "Comparator (Up)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Comparator",
        texture: new Float32Array([96, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["comparator_left_on", "comparator_up_on", "comparator_right_on", "comparator_down_on"],
        cost: {
            comparator_left_off: 1,
        },
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let pixel = AIR;
            let pixels = 0;
            if (x != 0) {
                let index = (x - 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_UP_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (x != gridWidth - 1) {
                let index = (x + 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_UP_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != gridHeight - 1) {
                let index = (x + (y + 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_UP_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels < 2) {
                addPixel(x, y, COMPARATOR_UP_OFF);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    comparator_right_off: {
        name: "Comparator (Right)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Comparator",
        texture: new Float32Array([108, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["comparator_left_off", "comparator_up_off", "comparator_right_off", "comparator_down_off"],
        cost: {
            comparator_left_off: 1,
        },
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let pixel = AIR;
            let pixels = 0;
            if (x != 0) {
                let index = (x - 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != 0) {
                let index = (x + (y - 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != gridHeight - 1) {
                let index = (x + (y + 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels >= 2) {
                addPixel(x, y, COMPARATOR_RIGHT_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    comparator_right_on: {
        name: "Comparator (Right)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Comparator",
        texture: new Float32Array([120, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["comparator_left_on", "comparator_up_on", "comparator_right_on", "comparator_down_on"],
        cost: {
            comparator_left_off: 1,
        },
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let pixel = AIR;
            let pixels = 0;
            if (x != 0) {
                let index = (x - 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_RIGHT_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != 0) {
                let index = (x + (y - 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_RIGHT_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != gridHeight - 1) {
                let index = (x + (y + 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_RIGHT_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels < 2) {
                addPixel(x, y, COMPARATOR_RIGHT_OFF);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    comparator_down_off: {
        name: "Comparator (Down)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Comparator",
        texture: new Float32Array([132, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["comparator_left_off", "comparator_up_off", "comparator_right_off", "comparator_down_off"],
        cost: {
            comparator_left_off: 1,
        },
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let pixel = AIR;
            let pixels = 0;
            if (x != 0) {
                let index = (x - 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (x != gridWidth - 1) {
                let index = (x + 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != 0) {
                let index = (x + (y - 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels >= 2) {
                addPixel(x, y, COMPARATOR_DOWN_ON);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    comparator_down_on: {
        name: "Comparator (Down)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Comparator",
        texture: new Float32Array([144, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 180,
        rotatable: true,
        rotations: ["comparator_left_on", "comparator_up_on", "comparator_right_on", "comparator_down_on"],
        cost: {
            comparator_left_off: 1,
        },
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] > tick - 9 && grid[(x + y * gridWidth) * gridStride + UPDATED] < tick;
            let pixel = AIR;
            let pixels = 0;
            if (x != 0) {
                let index = (x - 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_DOWN_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (x != gridWidth - 1) {
                let index = (x + 1 + y * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_DOWN_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (y != 0) {
                let index = (x + (y - 1) * gridWidth) * gridStride;
                let id = grid[index + ID];
                if (grid[index + UPDATED] == tick) {
                    if (id == OBSERVER_LEFT_OFF || id == OBSERVER_UP_OFF || id == OBSERVER_RIGHT_OFF || id == OBSERVER_DOWN_OFF || id == COMPARATOR_LEFT_OFF || id == COMPARATOR_UP_OFF || id == COMPARATOR_RIGHT_OFF || id == COMPARATOR_DOWN_OFF) {
                        id += 1;
                    }
                    else if (id == OBSERVER_LEFT_ON || id == OBSERVER_UP_ON || id == OBSERVER_RIGHT_ON || id == OBSERVER_DOWN_ON || id == COMPARATOR_LEFT_ON || id == COMPARATOR_UP_ON || id == COMPARATOR_RIGHT_ON || id == COMPARATOR_DOWN_ON) {
                        id -= 1;
                    }
                }
                if (id != AIR) {
                    if (pixel == AIR) {
                        pixel = id;
                    }
                    else if (pixel != id) {
                        addPixel(x, y, COMPARATOR_DOWN_OFF);
                        if (updated) {
                            grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                        }
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels < 2) {
                addPixel(x, y, COMPARATOR_DOWN_OFF);
                if (updated) {
                    grid[(x + y * gridWidth) * gridStride + UPDATED] = tick - 1;
                }
            }
        },
    },
    lamp_on: {
        name: "Lamp",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Lamp",
        texture: new Float32Array([40, 9, 5, 5]),
        state: SOLID,
        flammability: 4,
        blastResistance: 20,
        update: function(x, y) {
            if (isDeactivated(x, y)) {
                addPixel(x, y, LAMP_OFF);
                return;
            }
            addUpdatedChunk(x, y);
        },
    },
    lamp_off: {
        name: "Lamp",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Lamp",
        texture: new Float32Array([45, 9, 5, 5]),
        state: SOLID,
        flammability: 4,
        blastResistance: 20,
        update: function(x, y) {
            if (!isDeactivated(x, y)) {
                addPixel(x, y, LAMP_ON);
                return;
            }
            addUpdatedChunk(x, y);
        },
    },
    gunpowder: {
        name: "Gunpowder",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Gunpowder",
        color: new Float32Array([40, 30, 30, 1]),
        noise: new Float32Array([10, 10, 10, 0]),
        state: SOLID,
        flammability: 20,
        blastResistance: 20,
        cost: {
            color_lime: 8,
            color_brown: 8,
            color_black: 2,
        },
        update: function(x, y) {
            let exploding = false;
            let index = (x + y * gridWidth) * gridStride;
            if ((grid[index + PIXEL_DATA] & 1) == 1 || isTouching(x, y, [LAVA])) {
                exploding = true;
            }
            if (exploding) {
                explode(x, y, 5 * 5, 5 * 8, 800);
            }
            else {
                flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
            }
        },
    },
    activated_gunpowder: {
        name: "Gunpowder (Activated)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Gunpowder",
        color: new Float32Array([40, 30, 30, 1]),
        noise: new Float32Array([10, 10, 10, 0]),
        state: SOLID,
        flammability: 20,
        blastResistance: 20,
        cost: {
            gunpowder: 1,
        },
        update: function(x, y) {
            explode(x, y, 5 * 5, 5 * 8, 800);
        },
    },
    c4: {
        name: "C-4",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "C-4",
        color: new Float32Array([245, 245, 200, 1]),
        amountColor: "black",
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        cost: {
            water: 1,
            plant: 16,
            sponge: 1,
        },
    },
    activated_c4: {
        name: "C-4 (Activated)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "C-4",
        color: new Float32Array([245, 245, 200, 1]),
        amountColor: "black",
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        cost: {
            c4: 1,
        },
        update: function(x, y) {
            explode(x, y, 15 * 15, 15 * 8, 1200);
        },
    },
    detonator: {
        name: "Detonator",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Detonator",
        texture: [new Float32Array([0, 9, 5, 5]), new Float32Array([5, 9, 5, 5])],
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        cost: {
            color_red: 2,
            color_gray: 6,
            gunpowder: 1,
        },
        update: function(x, y) {
            if (isTouching(x, y, [GUNPOWDER, ACTIVATED_GUNPOWDER, C4, ACTIVATED_C4])) {
                explode(x, y, 3 * 3, 3 * 8, 300);
            }
        },
    },
    flamethrower_left: {
        name: "Flamethrower (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Flamethrower",
        texture: new Float32Array([120, 40, 15, 15]),
        state: SOLID,
        flammability: 0,
        blastResistance: 220,
        rotatable: true,
        rotations: ["flamethrower_left", "flamethrower_up", "flamethrower_right", "flamethrower_down"],
        update: function(x, y) {
            for (let i = 0; i < 3; i++) {
                let angle = Math.PI + random() * Math.PI / 6 - Math.PI / 12;
                raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                    let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                    if (dist > 10) {
                        return false;
                    }
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
        name: "Flamethrower (Up)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Flamethrower",
        texture: new Float32Array([135, 40, 15, 15]),
        state: SOLID,
        flammability: 0,
        blastResistance: 220,
        rotatable: true,
        rotations: ["flamethrower_left", "flamethrower_up", "flamethrower_right", "flamethrower_down"],
        update: function(x, y) {
            for (let i = 0; i < 3; i++) {
                let angle = Math.PI * 3 / 2 + random() * Math.PI / 6 - Math.PI / 12;
                raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                    let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                    if (dist > 10) {
                        return false;
                    }
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
        name: "Flamethrower (Right)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Flamethrower",
        texture: new Float32Array([150, 40, 15, 15]),
        state: SOLID,
        flammability: 0,
        blastResistance: 220,
        rotatable: true,
        rotations: ["flamethrower_left", "flamethrower_up", "flamethrower_right", "flamethrower_down"],
        update: function(x, y) {
            for (let i = 0; i < 3; i++) {
                let angle = random() * Math.PI / 6 - Math.PI / 12;
                raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                    let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                    if (dist > 10) {
                        return false;
                    }
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
        name: "Flamethrower (Down)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Flamethrower",
        texture: new Float32Array([165, 40, 15, 15]),
        state: SOLID,
        flammability: 0,
        blastResistance: 220,
        rotatable: true,
        rotations: ["flamethrower_left", "flamethrower_up", "flamethrower_right", "flamethrower_down"],
        update: function(x, y) {
            for (let i = 0; i < 3; i++) {
                let angle = Math.PI / 2 + random() * Math.PI / 6 - Math.PI / 12;
                raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                    let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                    if (dist > 10) {
                        return false;
                    }
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
        name: "Nuke",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Nuke",
        color: new Float32Array([0, 255, 125, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        cost: {
            water: 1,
            plant: 96,
            sponge: 1,
            c4: 4,
            detonator: 1,
        },
        update: function(x, y) {
            let exploding = false;
            if (!isTouching(x, y, [NUKE_DEFUSER])) {
                if (y == gridHeight - 1) {
                    exploding = true;
                }
                forTouching(x, y, (x1, y1) => {
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if (grid[index1 + ID] != AIR && grid[index1 + ID] != NUKE) {
                        exploding = true;
                    }
                });
            }
            if (exploding) {
                // explode(x, y, 15 * 15, 500);
                // explode(x, y, 30 * 30, 4000);
                // explode(x, y, 5 * 5, 20, 1500);
                // explode(x, y, 30 * 30, 15, 4000);
                explode(x, y, 30 * 30, 30 * 8, 2000);
                // explode(x, y, 120 * 120, 120 * 4, 16000);
                // explode(x, y, 5 * 5, 5 * 4, 1600);
            }
            else {
                fall(x, y, isMoveableSolid);
            }
        },
    },
    activated_nuke: {
        name: "Nuke (Activated)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Nuke",
        color: new Float32Array([255, 255, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        cost: {
            nuke: 1,
        },
        update: function(x, y) {
            // explode(x, y, 30 * 30, 15, 4000);
            explode(x, y, 30 * 30, 30 * 8, 2000);
        },
    },
    nuke_defuser: {
        name: "Nuke Defuser",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Nuke",
        texture: new Float32Array([21, 2, 3, 3]),
        state: SOLID,
        flammability: 0,
        blastResistance: 700,
        cost: {
            slider_horizontal: 2,
        },
    },
    deleter: {
        name: "Deleter",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Deleter",
        texture: [new Float32Array([8, 5, 4, 4]), new Float32Array([12, 5, 4, 4])],
        state: GAS,
        flammability: 0,
        blastResistance: -1,
        cloneable: false,
    },
    lag_spike_generator: {
        name: "lag_spike_generator",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "lag_spike_generator",
        color: new Float32Array([125, 255, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 1000,
        update: function(x, y) {
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == AIR) {
                    if (random() < 0.5) {
                        addPixel(x1, y1, LAG_SPIKE_GENERATOR);
                        copyTeam(x, y, x1, y1);
                    }
                    else if (random() < 0.025) {
                        addPixel(x1, y1, WATER_PUMP);
                        copyTeam(x, y, x1, y1);
                    }
                    else if (random() < 0.025) {
                        addPixel(x1, y1, CLONER_DOWN);
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
        name: "Acid",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Acid",
        color: new Float32Array([180, 255, 0, 1]),
        state: LIQUID,
        flammability: 0,
        blastResistance: 650,
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                if (changed) {
                    return;
                }
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] != BASE) {
                    return;
                }
                addPixel(x1, y1, WATER);
                addPixel(x, y, WATER);
                changed = true;
            });

            if (changed) {
                return;
            }

            function isPassable(x, y) {
                return isOnGrid(x, y) && (pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS || grid[(x + y * gridWidth) * gridStride + ID] == WATER || grid[(x + y * gridWidth) * gridStride + ID] == ACID || grid[(x + y * gridWidth) * gridStride + ID] == BASE);
            };
            function isMoveable(x, y) {
                return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS;
            };

            flow(x, y, gridWidth, 1, isPassable, isMoveable);
            if (grid[(x + y * gridWidth) * gridStride + UPDATED] != tick) {
                let total = getTouching(x, y, [WATER]);
                if (total > 0) {
                    // if (random() < 0.25) {
                        let direction = Math.floor(random() * total);
                        forTouching(x, y, (x1, y1) => {
                            let index1 = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index1 + ID] != WATER) {
                                return;
                            }
                            if (direction == 0) {
                                move(x, y, x1, y1);
                            }
                            direction -= 1;
                        });
                    // }
                    addUpdatedChunk(x, y);
                }
            }
        },
    },
    base: {
        name: "Base",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Acid",
        color: new Float32Array([160, 0, 255, 1]),
        state: LIQUID,
        flammability: 0,
        blastResistance: 650,
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                if (changed) {
                    return;
                }
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] != ACID) {
                    return;
                }
                addPixel(x1, y1, WATER);
                addPixel(x, y, WATER);
                changed = true;
            });

            if (changed) {
                return;
            }

            function isPassable(x, y) {
                return isOnGrid(x, y) && (pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS || grid[(x + y * gridWidth) * gridStride + ID] == WATER || grid[(x + y * gridWidth) * gridStride + ID] == ACID || grid[(x + y * gridWidth) * gridStride + ID] == BASE);
            };
            function isMoveable(x, y) {
                return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS;
            };

            flow(x, y, gridWidth, 1, isPassable, isMoveable);
            if (grid[(x + y * gridWidth) * gridStride + UPDATED] != tick) {
                let total = getTouching(x, y, [WATER]);
                if (total > 0) {
                    // if (random() < 0.25) {
                        let direction = Math.floor(random() * total);
                        forTouching(x, y, (x1, y1) => {
                            let index1 = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index1 + ID] != WATER) {
                                return;
                            }
                            if (direction == 0) {
                                move(x, y, x1, y1);
                            }
                            direction -= 1;
                        });
                    // }
                    addUpdatedChunk(x, y);
                }
            }
        },
    },
    pink_sand: {
        name: "Pink Sand",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Pink Sand",
        color: new Float32Array([255, 105, 180, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 100,
        update: function(x, y) {
            if (isTouching(x, y, [SAND])) {
                explode(x, y, 80 * 80, 80 * 8, 16000);
            }
            rise(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
    },
    red_sand: {
        name: "Red Sand",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Pink Sand",
        color: new Float32Array([225, 75, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 100,
        update: function(x, y) {
            if (isTouching(x, y, [WATER])) {
                explode(x, y, 5 * 5, 5 * 8, 3000);
            }
            flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
    },
    pickle: {
        name: "Pickle",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Pickle",
        color: new Float32Array([50, 225, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 50,
        update5: function(x, y) {
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
                    for (let i = 0; i < 100; i++) {
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
        name: "Pickled Pickle",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Pickle",
        color: new Float32Array([75, 255, 30, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 50,
        update4: function(x, y) {
            if (random() < 0.1) {
                if (random() < 0.01) {
                    let x1 = Math.floor(random() * gridWidth);
                    let y1 = Math.floor(random() * gridHeight);
                    if ((x1 - x) ** 2 + (y1 - y) ** 2 > 400) {
                        explode(x1, y1, 20 * 20, 20 * 8, 8000);
                        addPixel(x1, y1, PICKLED_PICKLE);
                        copyTeam(x, y, x1, y1);
                    }
                }
                else {
                    for (let i = 0; i < 100; i++) {
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
        name: "Spongy Rice",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Spongy Rice",
        color: new Float32Array([230, 230, 230, 1]),
        noise: new Float32Array([10, 10, -5, 0]),
        state: SOLID,
        flammability: 0,
        blastResistance: 60,
        update: function(x, y) {
            if (isTouching(x, y, [WATER])) {
                if (x != 0) {
                    pushLeft(x - 1, y, x, y, 2);
                    if (grid[(x - 1 + y * gridWidth) * gridStride + ID] == AIR) {
                        addPixel(x - 1, y, ACTIVATED_SPONGY_RICE);
                        copyTeam(x, y, x - 1, y);
                    }
                }
                if (x != gridWidth - 1) {
                    pushRight(x + 1, y, x, y, 2);
                    if (grid[(x + 1 + y * gridWidth) * gridStride + ID] == AIR) {
                        addPixel(x + 1, y, ACTIVATED_SPONGY_RICE);
                        copyTeam(x, y, x + 1, y);
                    }
                }
                if (y != 0) {
                    pushUp(x, y - 1, x, y, 2);
                    if (grid[(x + (y - 1) * gridWidth) * gridStride + ID] == AIR) {
                        addPixel(x, y - 1, ACTIVATED_SPONGY_RICE);
                        copyTeam(x, y, x, y - 1);
                    }
                }
                if (y != gridHeight - 1) {
                    pushDown(x, y + 1, x, y, 2);
                    if (grid[(x + (y + 1) * gridWidth) * gridStride + ID] == AIR) {
                        addPixel(x, y + 1, ACTIVATED_SPONGY_RICE);
                        copyTeam(x, y, x, y + 1);
                    }
                }
                addPixel(x, y, ACTIVATED_SPONGY_RICE);
            }
            else {
                flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
            }
        },
    },
    activated_spongy_rice: {
        name: "Spongy Rice (Activated)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Spongy Rice",
        color: new Float32Array([230, 230, 230, 1]),
        noise: new Float32Array([10, 10, -5, 0]),
        state: SOLID,
        flammability: 0,
        blastResistance: 60,
        update: function(x, y) {
            if (x != 0) {
                pushLeft(x - 1, y, x, y, 2);
                if (grid[(x - 1 + y * gridWidth) * gridStride + ID] == AIR) {
                    addPixel(x - 1, y, ACTIVATED_SPONGY_RICE);
                    copyTeam(x, y, x - 1, y);
                }
            }
            if (x != gridWidth - 1) {
                pushRight(x + 1, y, x, y, 2);
                if (grid[(x + 1 + y * gridWidth) * gridStride + ID] == AIR) {
                    addPixel(x + 1, y, ACTIVATED_SPONGY_RICE);
                    copyTeam(x, y, x + 1, y);
                }
            }
            if (y != 0) {
                pushUp(x, y - 1, x, y, 2);
                if (grid[(x + (y - 1) * gridWidth) * gridStride + ID] == AIR) {
                    addPixel(x, y - 1, ACTIVATED_SPONGY_RICE);
                    copyTeam(x, y, x, y - 1);
                }
            }
            if (y != gridHeight - 1) {
                pushDown(x, y + 1, x, y, 2);
                if (grid[(x + (y + 1) * gridWidth) * gridStride + ID] == AIR) {
                    addPixel(x, y + 1, ACTIVATED_SPONGY_RICE);
                    copyTeam(x, y, x, y + 1);
                }
            }
        },
    },
    recursive_sapling: {
        name: "Recursive Sapling",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Recursive Sapling",
        texture: new Float32Array([6, 14, 6, 6]),
        state: SOLID,
        flammability: 0,
        blastResistance: 60,
        update: function(x, y) {
            fall(x, y, isMoveableSolid);
        },
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
                                    if (grid[index1 + ID] != DIRT) {
                                        addPixel(x4, y4, RECURSIVE_SAPLING);
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
                    addBranch(x, y, -Math.PI / 2, growth * (0.2 + random() * 0.1), growth * (0.8 + random() * 0.7));
                }
            }
        },
    },
    random: {
        name: "Math.random()",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Math.random()",
        color: new Float32Array([0, 0, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update: function(x, y) {
            let functions = [addPixel, addFire, addTeam, addUpdatedChunk, move, fillEllipse, pushLeft, pushRight, pushUp, pushDown];
            for (let i in pixelData) {
                for (let j in pixelData[i]) {
                    if (typeof pixelData[i][j] == "function") {
                        functions.push(pixelData[i][j]);
                    }
                }
            }
            function runFunction(f) {
                if (f == addPixel) {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * pixels.length));
                }
                else if (f == addFire) {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * 2) == 0 ? true : false);
                }
                else if (f == fillEllipse) {
                    let f2 = functions[Math.floor(Math.random() * functions.length)];
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * 2) == 0 ? true : false);
                }
                else {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight));
                }
            };
            try {
                let f = functions[Math.floor(Math.random() * functions.length)];
                if (f == addPixel) {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * pixels.length));
                }
                else if (f == addFire) {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * 2));
                }
                else if (f == addTeam) {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * 3));
                }
                else if (f == fillEllipse) {
                    let f2 = functions[Math.floor(Math.random() * functions.length)];
                    let pixel = Math.floor(Math.random() * pixels.length);
                    // f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), function(x1, y1) {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), function(x1, y1) {
                        addPixel(x1, y1, pixel);
                        copyTeam(x, y, x1, y1);
                    });
                }
                // else if (Math.random() < 0.5) {
                //     let functions2 = [];
                //     for (let i in pixelData) {
                //         for (let j in pixelData[i]) {
                //             if (typeof pixelData[i][j] == "function") {
                //                 functions2.push(pixelData[i][j]);
                //             }
                //         }
                //     }
                //     let f2 = functions2[Math.floor(Math.random() * functions2.length)];
                //     f(x, y);
                // }
                else {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight));
                }
            }
            catch (err) {

            }
            addUpdatedChunk(x, y);
        },
    },
    corruption: {
        name: "Corruption",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Corruption",
        color: new Float32Array([0, 0, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update: async function(x, y) {
            // if (!window.enableCorruptionPixel) {
            //     // modal("Corruption Pixel Detected!", "Are you sure you want to permanently corrupt your game?", "confirm");
            //     await modal("Corruption Pixel Detected!", "Are you sure you want to permanently corrupt your game?", "info");
            //     window.enableCorruptionPixel = true;
            //     setRunState("playing");
            //     return;
            // }
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
        // draw: function(ctx, cameraScale, x, y) {
        //     randomSeed(x + y * gridWidth);
        //     let drawX = random();
        //     let drawY = random();
        //     let drawX = random();
        //     let drawX = random();
        //     ctx.drawImage(ctx.canvas, drawX * ctx.canvas.width, 0, 5, ctx.canvas.height, drawX * ctx.canvas.width, random() * 50, 5, ctx.canvas.height);
        // },
    },
    mimic: {
        name: "Mimic",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Mimic",
        texture: new Float32Array([180, 40, 16, 16]),
        state: SOLID,
        flammability: 5,
        blastResistance: 100,
        update: function(x, y) {
            // let id = Math.floor(Math.random() * pixels.length);
            let id = grid[Math.floor(Math.random() * gridWidth * gridHeight) * 4 + ID];
            if (pixels[id].update != null) {
                pixels[id].update(x, y);
            }
            else if (pixels[id].update1 != null) {
                pixels[id].update1(x, y);
            }
            else if (pixels[id].update2 != null) {
                pixels[id].update2(x, y);
            }
            else if (pixels[id].update3 != null) {
                pixels[id].update3(x, y);
            }
            else if (pixels[id].update4 != null) {
                pixels[id].update4(x, y);
            }
            else if (pixels[id].update5 != null) {
                pixels[id].update5(x, y);
            }
            else if (pixels[id].update6 != null) {
                pixels[id].update6(x, y);
            }
            addUpdatedChunk(x, y);
        },
    },
    lucky_pixel: {
        name: "Lucky Pixel",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Lucky Pixel",
        texture: new Float32Array([196, 40, 16, 16]),
        state: SOLID,
        flammability: 5,
        blastResistance: 100,
        update: function(x, y) {
            let activated = false;
            forTouching(x, y, (x1, y1) => {
                let index = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index + ID] != AIR && grid[index + ID] != LUCKY_PIXEL) {
                    activated = true;
                }
            });
            if (activated) {
                function addStructure(x, y, saveCode) {
                    let parsed = parseSaveCode(saveCode);
                    for (let y1 = Math.max(0, -y); y1 < Math.min(parsed.gridHeight, gridHeight - y); y1++) {
                        for (let x1 = Math.max(0, -x); x1 < Math.min(parsed.gridWidth, gridWidth - x); x1++) {
                            addPixel(x + x1, y + y1, parsed.grid[(x1 + y1 * parsed.gridWidth) * gridStride + ID]);
                        }
                    }
                };
                let functions = [{
                    weight: 0.5,
                    run: function() {
                        addPixel(x, y, MONSTER);
                    },
                }, {
                    weight: 1,
                    run: function() {
                        addPixel(x, y, WATER_PUMP);
                    },
                }, {
                    weight: 0.5,
                    run: function() {
                        addPixel(x, y, LAVA_HEATER);
                    },
                }, {
                    weight: 0.2,
                    run: function() {
                        addPixel(x, y, ICE_FREEZER);
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addPixel(x, y, WOOD_CRATE);
                    },
                }, {
                    weight: 0.05,
                    run: function() {
                        addPixel(x, y, STEEL_CRATE);
                    },
                }, {
                    weight: 0.05,
                    run: function() {
                        addPixel(x, y, SAND);
                    },
                }, {
                    weight: 0.05,
                    run: function() {
                        addPixel(x, y, PINK_SAND);
                    },
                }, {
                    weight: 1,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                    },
                }, {
                    weight: 1,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, WATER);
                            }
                        });
                    },
                }, {
                    weight: 0.5,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, LAVA);
                            }
                        });
                    },
                }, {
                    weight: 0.2,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, SAND);
                            }
                        });
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, MONSTER);
                            }
                        });
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, GUNPOWDER);
                            }
                        });
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, WOOD_CRATE);
                            }
                        });
                    },
                }, {
                    weight: 0.05,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, NUKE);
                            }
                        });
                    },
                }, {
                    weight: 0.05,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, LUCKY_PIXEL);
                            }
                        });
                    },
                }, {
                    weight: 0.025,
                    run: function() {
                        addStructure(x - 2, y - 2, "V3;1;5-5;air-2:wood:air-2:wood-5:air:wood:air:wood:air-2:stone:water:stone:air-2:stone-3:air;0-25;0-25;");
                        forInRange(x, y, 8 * 8, function(x1, y1) {
                            let index = (x1 + y1 * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                return;
                            }
                            if (random() < 0.1) {
                                addPixel(x1, y1, STEEL_CRATE);
                            }
                        });
                    },
                }, {
                    weight: 0.25,
                    run: function() {
                        addStructure(x - 1, y - 1, "V3;1;3-3;air:laser_up:air:laser_left:laser_scatterer:laser_right:air:laser_down:air;0-9;0-9;");
                    },
                }, {
                    weight: 0.25,
                    run: function() {
                        addStructure(x - 1, y - 1, "V3;1;3-3;air:flamethrower_up:air:flamethrower_left:detonator:flamethrower_right:air:flamethrower_down:air;0-9;0-9;");
                    },
                }, {
                    weight: 0.15,
                    run: function() {
                        addStructure(x - 1, y - 1, "V3;1;3-3;lava_heater:air:lava_heater:air:water_pump:air:lava_heater:air:lava_heater;0-9;0-9;");
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addStructure(x - 1, y - 1, "V3;1;3-3;air:cloner_down:air:cloner_right:slime:cloner_left:air:cloner_up:air;0-9;0-9;");
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addStructure(x - 1, y - 1, "V3;1;3-3;piston_right:piston_down:air:piston_right:rotator_clockwise:piston_left:air:piston_up:piston_left;0-9;0-9;");
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addStructure(x - 1, y - 1, "V3;1;3-3;air:piston_down:piston_left:piston_right:rotator_counterclockwise:piston_left:piston_right:piston_up:air;0-9;0-9;");
                    },
                }, {
                    weight: 0.05,
                    run: function() {
                        addStructure(x - 1, y - 1, "V3;1;3-3;air:nuke_defuser:air:nuke_defuser:nuke:nuke_defuser:air:nuke_defuser:air;0-9;0-9;");
                    },
                }, {
                    weight: 0.05,
                    run: function() {
                        addStructure(x - 1, y - 1, "V3;1;3-3;lucky_pixel:air:lucky_pixel:air:lucky_pixel:air:lucky_pixel:air:lucky_pixel;0-9;0-9;");
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addStructure(x - 3, y - 3, "V3;1;7-7;slime:air:slime:air:slime:air:slime-4:air:slime-4:air:slime:air:slime:air:slime-2:air:slime:collapsable:slime:air:slime-15:air:slime-5:air;0-49;0-49;");
                    },
                }, {
                    weight: 0.2,
                    run: function() {
                        explode(x, y, 5 * 5, 5 * 8, 800);
                    },
                }, {
                    weight: 0.01,
                    run: function() {
                        explode(x, y, 25 * 25, 25 * 8, 800);
                    },
                }, {
                    weight: 0.1,
                    run: function() {
                        addStructure(x - 7, y - 7, "V3;1;16-16;lucky_pixel:air:color_orange-12:air:lucky_pixel:air-2:color_orange-12:air-2:color_orange-2:color_yellow-12:color_orange-4:color_yellow-3:air-6:color_yellow-3:color_orange-4:color_yellow-3:air-6:color_yellow-3:color_orange-4:color_yellow-3:air-2:color_yellow-2:air-2:color_yellow-3:color_orange-4:color_yellow-7:air-2:color_yellow-3:color_orange-4:color_yellow-5:air-4:color_yellow-3:color_orange-4:color_yellow-5:air-4:color_yellow-3:color_orange-4:color_yellow-5:air-2:color_yellow-5:color_orange-4:color_yellow-12:color_orange-4:color_yellow-5:air-2:color_yellow-5:color_orange-4:color_yellow-5:air-2:color_yellow-5:color_orange-4:color_yellow-12:color_orange-2:air-2:color_orange-12:air-2:lucky_pixel:air:color_orange-12:air:lucky_pixel;0-256;0-256;");
                        // let x1 = Math.max(x - 7, 0);
                        // let y1 = Math.max(y - 7, 0);
                        // for (let y2 = 0; y2 < 16; y2++) {
                        //     if (y1 + y2 == gridHeight) {
                        //         break;
                        //     }
                        //     for (let x2 = 0; x2 < 16; x2++) {
                        //         if (x1 + x2 == gridWidth) {
                        //             break;
                        //         }
                        //         let id = COLOR_YELLOW;
                        //         if ((x2 == 0 || x2 == 15) && (y2 == 0 || y2 == 15)) {
                        //             id = LUCKY_PIXEL;
                        //         }
                        //         if ((x2 < 2 || x2 >= 14) && (y2 < 2 || y2 >= 14)) {
                        //             id = AIR;
                        //         }
                        //         else if (x2 >= 2 && x2 < 14 && (y2 < 2 || y2 >= 14)) {
                        //             id = COLOR_ORANGE;
                        //         }
                        //         else if (y2 >= 2 && y2 < 14 && (x2 < 2 || x2 >= 14)) {
                        //             id = COLOR_ORANGE;
                        //         }
                        //         else if (x2 >= 5 && x2 < 11 && y2 >= 3 && y2 < 5) {
                        //             id = AIR;
                        //         }
                        //         else if (x2 >= 5 && x2 < 7 && y2 == 5) {
                        //             id = AIR;
                        //         }
                        //         else if (x2 >= 9 && x2 < 11 && y2 >= 5 && y2 < 9) {
                        //             id = AIR;
                        //         }
                        //         else if (x2 >= 7 && x2 < 9 && y2 >= 7 && y2 < 10) {
                        //             id = AIR;
                        //         }
                        //         else if (x2 >= 7 && x2 < 9 && y2 >= 11 && y2 < 13) {
                        //             id = AIR;
                        //         }
                        //     }
                        // }
                    },
                }];
                let totalWeight = 0;
                for (let i in functions) {
                    totalWeight += functions[i].weight;
                }
                let randomWeight = random() * totalWeight;
                for (let i in functions) {
                    randomWeight -= functions[i].weight;
                    if (randomWeight < 0) {
                        functions[i].run();
                        break;
                    }
                }
            }
        },
    },
    life: {
        name: "Conway's Game of Life",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Conway's Game of Life",
        color: new Float32Array([0, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let adjacent = 0;
            forTouchingDiagonal(x, y, (x1, y1) => {
                let index = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index + ID] == LIFE || grid[index + ID] == LIFE_3) {
                    adjacent += 1;
                }
                if (grid[index + UPDATED] != tick && grid[index + ID] == AIR) {
                    let adjacent1 = getTouchingDiagonal(x1, y1, [LIFE, LIFE_3]);
                    if (adjacent1 == 3) {
                        addPixel(x1, y1, LIFE_2);
                        copyTeam(x, y, x1, y1);
                    }
                }
            });
            if (adjacent < 2 || adjacent > 3) {
                addPixel(x, y, LIFE_3);
            }
            else {
                addUpdatedChunk(x, y);
            }
        },
    },
    life_2: {
        name: "Conway's Game of Life",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Conway's Game of Life",
        color: new Float32Array([0, 255, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update5: function(x, y) {
            addPixel(x, y, LIFE);
        },
    },
    life_3: {
        name: "Conway's Game of Life",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Conway's Game of Life",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update5: function(x, y) {
            addPixel(x, y, AIR);
            addTeam(x, y, -1);
        },
    },
    triangle: {
        name: "Sierpinski's Triangle",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Sierpinski's Triangle",
        color: new Float32Array([25, 100, 255, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update: function(x, y) {
            addPixel(x, y, WALL);
            if (y == gridHeight - 1) {
                return;
            }
            if (x != 0) {
                let id = grid[(x - 1 + (y + 1) * gridWidth) * gridStride + ID];
                if (id == AIR) {
                    addPixel(x - 1, y + 1, TRIANGLE);
                    copyTeam(x, y, x - 1, y + 1);
                }
                else if (id == TRIANGLE) {
                    addPixel(x - 1, y + 1, AIR);
                    addTeam(x - 1, y + 1, -1);
                }
            }
            if (x != gridWidth - 1) {
                let id = grid[(x + 1 + (y + 1) * gridWidth) * gridStride + ID];
                if (id == AIR) {
                    addPixel(x + 1, y + 1, TRIANGLE);
                    copyTeam(x, y, x + 1, y + 1);
                }
                else if (id == TRIANGLE) {
                    addPixel(x + 1, y + 1, AIR);
                    addTeam(x + 1, y + 1, -1);
                }
            }
        },
    },
    ant_left_clockwise: {
        name: "Langton's Ant",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Langton's Ant",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (y == 0 || (grid[index] != AIR && grid[index] != WALL)) {
                addPixel(x, y, ANT_LEFT_COUNTERCLOCKWISE);
                return;
            }
            addPixel(x, y, WALL);
            if (grid[index + ID] == WALL) {
                addPixel(x, y - 1, ANT_UP_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x, y - 1, ANT_UP_CLOCKWISE);
            }
            copyTeam(x, y, x, y - 1);
        },
    },
    ant_left_counterclockwise: {
        name: "Langton's Ant",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Langton's Ant",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (y == gridHeight - 1 || (grid[index] != AIR && grid[index] != WALL)) {
                addPixel(x, y, ANT_LEFT_CLOCKWISE);
                return;
            }
            addPixel(x, y, AIR);
            if (grid[index + ID] == WALL) {
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
        name: "Langton's Ant",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Langton's Ant",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (x == gridWidth - 1 || (grid[index] != AIR && grid[index] != WALL)) {
                addPixel(x, y, ANT_UP_COUNTERCLOCKWISE);
                return;
            }
            addPixel(x, y, WALL);
            if (grid[index + ID] == WALL) {
                addPixel(x + 1, y, ANT_RIGHT_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x + 1, y, ANT_RIGHT_CLOCKWISE);
            }
            copyTeam(x, y, x + 1, y);
        },
    },
    ant_up_counterclockwise: {
        name: "Langton's Ant",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Langton's Ant",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (x == 0 || (grid[index] != AIR && grid[index] != WALL)) {
                addPixel(x, y, ANT_UP_CLOCKWISE);
                return;
            }
            addPixel(x, y, AIR);
            if (grid[index + ID] == WALL) {
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
        name: "Langton's Ant",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Langton's Ant",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (y == gridHeight - 1 || (grid[index] != AIR && grid[index] != WALL)) {
                addPixel(x, y, ANT_RIGHT_COUNTERCLOCKWISE);
                return;
            }
            addPixel(x, y, WALL);
            if (grid[index + ID] == WALL) {
                addPixel(x, y + 1, ANT_DOWN_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x, y + 1, ANT_DOWN_CLOCKWISE);
            }
            copyTeam(x, y, x, y + 1);
        },
    },
    ant_right_counterclockwise: {
        name: "Langton's Ant",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Langton's Ant",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (y == 0 || (grid[index] != AIR && grid[index] != WALL)) {
                addPixel(x, y, ANT_RIGHT_CLOCKWISE);
                return;
            }
            addPixel(x, y, AIR);
            if (grid[index + ID] == WALL) {
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
        name: "Langton's Ant",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Langton's Ant",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (x == 0 || (grid[index] != AIR && grid[index] != WALL)) {
                addPixel(x, y, ANT_DOWN_COUNTERCLOCKWISE);
                return;
            }
            addPixel(x, y, WALL);
            if (grid[index + ID] == WALL) {
                addPixel(x - 1, y, ANT_LEFT_COUNTERCLOCKWISE);
            }
            else {
                addPixel(x - 1, y, ANT_LEFT_CLOCKWISE);
            }
            copyTeam(x, y, x - 1, y);
        },
    },
    ant_down_counterclockwise: {
        name: "Langton's Ant",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Langton's Ant",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (x == gridWidth - 1 || (grid[index] != AIR && grid[index] != WALL)) {
                addPixel(x, y, ANT_DOWN_CLOCKWISE);
                return;
            }
            addPixel(x, y, AIR);
            if (grid[index + ID] == WALL) {
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
        name: "Anteater",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Anteater",
        color: new Float32Array([120, 75, 20, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        update: function(x, y) {
            let array = [AIR, WALL, ANT_LEFT_CLOCKWISE, ANT_LEFT_COUNTERCLOCKWISE, ANT_UP_CLOCKWISE, ANT_UP_COUNTERCLOCKWISE, ANT_RIGHT_CLOCKWISE, ANT_RIGHT_COUNTERCLOCKWISE, ANT_DOWN_CLOCKWISE, ANT_DOWN_COUNTERCLOCKWISE];
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
        name: "Laser (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Laser",
        texture: [new Float32Array([108, 14, 6, 6]), new Float32Array([132, 14, 6, 6])],
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["laser_left", "laser_up", "laser_right", "laser_down"],
        cost: {
            color_red: 5,
            color_blue: 5,
            color_purple: 50,
        },
        update: function(x, y) {
            let path = getLaserPath(x, y, 0);
            let x1 = path[path.length - 1][0];
            let y1 = path[path.length - 1][1];
            if (isOnGrid(x1, y1)) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == LASER_SCATTERER) {
                    addPixel(x1, y1, ACTIVATED_LASER_SCATTERER);
                    addDrawingChunk(x1, y1);
                }
                else if (grid[index1 + ID] != ACTIVATED_LASER_SCATTERER) {
                    // if (random() < (pixels[grid[index1 + ID]].flammability + (20 - pixel.blastResistance)) / 100) {
                    if (random() < pixels[grid[index1 + ID]].flammability / 100) {
                        addFire(x1, y1, 1);
                    }
                    if (random() < 10 / pixels[grid[index1 + ID]].blastResistance) {
                        if (grid[index1 + ID] == LASER_LEFT || grid[index1 + ID] == LASER_UP || grid[index1 + ID] == LASER_RIGHT || grid[index1 + ID] == LASER_DOWN) {
                            explode(x1, y1, 5 * 5, 5 * 8, 3000);
                        }
                        addPixel(x1, y1, AIR);
                        addTeam(x1, y1, -1);
                    }
                    // if (random() < pixelAt(last[0], last[1]).flammability / 100) nextFireGrid[last[1]][last[0]] = true;
                }
            }
            addDrawingChunk(x, y);
            addUpdatedChunk(x, y);
        },
        draw: function(ctx, cameraScale, x, y) {
            let path = getLaserPath(x, y, 0);
            ctx.strokeStyle = "rgb(70, 215, 160)";
            drawLaserPath(ctx, cameraScale, path);
        },
    },
    laser_up: {
        name: "Laser (Up)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Laser",
        texture: [new Float32Array([114, 14, 6, 6]), new Float32Array([138, 14, 6, 6])],
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["laser_left", "laser_up", "laser_right", "laser_down"],
        cost: {
            laser_left: 1,
        },
        update: function(x, y) {
            let path = getLaserPath(x, y, 1);
            let x1 = path[path.length - 1][0];
            let y1 = path[path.length - 1][1];
            if (isOnGrid(x1, y1)) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == LASER_SCATTERER) {
                    addPixel(x1, y1, ACTIVATED_LASER_SCATTERER);
                    addDrawingChunk(x1, y1);
                }
                else if (grid[index1 + ID] != ACTIVATED_LASER_SCATTERER) {
                    // if (random() < (pixels[grid[index1 + ID]].flammability + (20 - pixel.blastResistance)) / 100) {
                    if (random() < pixels[grid[index1 + ID]].flammability / 100) {
                        addFire(x1, y1, 1);
                    }
                    if (random() < 10 / pixels[grid[index1 + ID]].blastResistance) {
                        if (grid[index1 + ID] == LASER_LEFT || grid[index1 + ID] == LASER_UP || grid[index1 + ID] == LASER_RIGHT || grid[index1 + ID] == LASER_DOWN) {
                            explode(x1, y1, 5 * 5, 5 * 8, 3000);
                        }
                        addPixel(x1, y1, AIR);
                        addTeam(x1, y1, -1);
                    }
                    // if (random() < pixelAt(last[0], last[1]).flammability / 100) nextFireGrid[last[1]][last[0]] = true;
                }
            }
            addDrawingChunk(x, y);
            addUpdatedChunk(x, y);
        },
        draw: function(ctx, cameraScale, x, y) {
            let path = getLaserPath(x, y, 1);
            ctx.strokeStyle = "rgb(70, 215, 160)";
            drawLaserPath(ctx, cameraScale, path);
        },
    },
    laser_right: {
        name: "Laser (Right)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Laser",
        texture: [new Float32Array([120, 14, 6, 6]), new Float32Array([144, 14, 6, 6])],
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["laser_left", "laser_up", "laser_right", "laser_down"],
        cost: {
            laser_left: 1,
        },
        update: function(x, y) {
            let path = getLaserPath(x, y, 2);
            let x1 = path[path.length - 1][0];
            let y1 = path[path.length - 1][1];
            if (isOnGrid(x1, y1)) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == LASER_SCATTERER) {
                    addPixel(x1, y1, ACTIVATED_LASER_SCATTERER);
                    addDrawingChunk(x1, y1);
                }
                else if (grid[index1 + ID] != ACTIVATED_LASER_SCATTERER) {
                    // if (random() < (pixels[grid[index1 + ID]].flammability + (20 - pixel.blastResistance)) / 100) {
                    if (random() < pixels[grid[index1 + ID]].flammability / 100) {
                        addFire(x1, y1, 1);
                    }
                    if (random() < 10 / pixels[grid[index1 + ID]].blastResistance) {
                        if (grid[index1 + ID] == LASER_LEFT || grid[index1 + ID] == LASER_UP || grid[index1 + ID] == LASER_RIGHT || grid[index1 + ID] == LASER_DOWN) {
                            explode(x1, y1, 5 * 5, 5 * 8, 3000);
                        }
                        addPixel(x1, y1, AIR);
                        addTeam(x1, y1, -1);
                    }
                    // if (random() < pixelAt(last[0], last[1]).flammability / 100) nextFireGrid[last[1]][last[0]] = true;
                }
            }
            addDrawingChunk(x, y);
            addUpdatedChunk(x, y);
        },
        draw: function(ctx, cameraScale, x, y) {
            let path = getLaserPath(x, y, 2);
            ctx.strokeStyle = "rgb(70, 215, 160)";
            drawLaserPath(ctx, cameraScale, path);
        },
    },
    laser_down: {
        name: "Laser (Down)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Laser",
        texture: [new Float32Array([126, 14, 6, 6]), new Float32Array([150, 14, 6, 6])],
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["laser_left", "laser_up", "laser_right", "laser_down"],
        cost: {
            laser_left: 1,
        },
        update: function(x, y) {
            let path = getLaserPath(x, y, 3);
            let x1 = path[path.length - 1][0];
            let y1 = path[path.length - 1][1];
            if (isOnGrid(x1, y1)) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == LASER_SCATTERER) {
                    addPixel(x1, y1, ACTIVATED_LASER_SCATTERER);
                    addDrawingChunk(x1, y1);
                }
                else if (grid[index1 + ID] != ACTIVATED_LASER_SCATTERER) {
                    // if (random() < (pixels[grid[index1 + ID]].flammability + (20 - pixel.blastResistance)) / 100) {
                    if (random() < pixels[grid[index1 + ID]].flammability / 100) {
                        addFire(x1, y1, 1);
                    }
                    if (random() < 10 / pixels[grid[index1 + ID]].blastResistance) {
                        if (grid[index1 + ID] == LASER_LEFT || grid[index1 + ID] == LASER_UP || grid[index1 + ID] == LASER_RIGHT || grid[index1 + ID] == LASER_DOWN) {
                            explode(x1, y1, 5 * 5, 5 * 8, 3000);
                        }
                        addPixel(x1, y1, AIR);
                        addTeam(x1, y1, -1);
                    }
                    // if (random() < pixelAt(last[0], last[1]).flammability / 100) nextFireGrid[last[1]][last[0]] = true;
                }
            }
            addDrawingChunk(x, y);
            addUpdatedChunk(x, y);
        },
        draw: function(ctx, cameraScale, x, y) {
            let path = getLaserPath(x, y, 3);
            ctx.strokeStyle = "rgb(70, 215, 160)";
            drawLaserPath(ctx, cameraScale, path);
        },
    },
    laser_scatterer: {
        name: "Laser Scatterer",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Laser Scatterer",
        texture: new Float32Array([16, 5, 4, 4]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        cost: {
            glass: 3,
        },
    },
    activated_laser_scatterer: {
        name: "Laser Scatterer (Activated)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Laser Scatterer",
        texture: new Float32Array([16, 5, 4, 4]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update6: function(x, y) {
            addPixel(x, y, LASER_SCATTERER);
        },
        draw: function(ctx, cameraScale, x, y) {
            let size = (Math.sin(performance.now() / 1000 * Math.PI / 2) + 1) / 4 * cameraScale;
            ctx.fillStyle = "rgb(70, 215, 160, 0.2)";
            ctx.fillRect(x * cameraScale - size, y * cameraScale - size, cameraScale + size * 2, cameraScale + size * 2);
        },
    },
    mirror_1: {
        name: "Mirror",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Mirror",
        texture: new Float32Array([0, 320, 60, 60]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["mirror_1", "mirror_2"],
        cost: {
            glass: 2,
            color_gray: 1,
        },
    },
    mirror_2: {
        name: "Mirror",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Mirror",
        texture: new Float32Array([60, 320, 60, 60]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["mirror_1", "mirror_2"],
        cost: {
            glass: 2,
            color_gray: 1,
        },
    },
    monster: {
        name: "Monster",
        description: "Unrealistically flows and may or may not be wet",
        group: "Puzzles",
        subgroup: "Monster",
        texture: new Float32Array([240, 80, 60, 60]),
        state: GAS,
        flammability: 20,
        blastResistance: 20,
        cloneable: false,
        update: function(x, y) {
            function isMoveable(x, y) {
                return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state != SOLID && grid[(x + y * gridWidth) * gridStride + ID] != MONSTER;
            };
            fall(x, y, isMoveable);
        },
    },
    placement_restriction: {
        name: "Placement Restriction",
        description: "Unrealistically flows and may or may not be wet",
        group: "Puzzles",
        subgroup: "Placement Restriction",
        texture: [new Float32Array([240, 140, 50, 50]), new Float32Array([0, 380, 60, 60])],
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    goal: {
        name: "Goal",
        description: "Unrealistically flows and may or may not be wet",
        group: "Puzzles",
        subgroup: "Goal",
        texture: new Float32Array([10, 9, 5, 5]),
        state: SOLID,
        flammability: 0,
        blastResistance: -1,
        cloneable: false,
        collectable: false,
        update: function(x, y) {
            addDrawingChunk(x, y);
            addUpdatedChunk(x, y);
        },
        draw: function(ctx, cameraScale, x, y) {
            let size = (Math.sin(performance.now() / 1000 * Math.PI / 2) + 1) / 4 * cameraScale;
            ctx.fillStyle = "rgba(255, 180, 0, 0.2)";
            ctx.fillRect(x * cameraScale - size, y * cameraScale - size, cameraScale + size * 2, cameraScale + size * 2);
        },
    },
    target: {
        name: "Target",
        description: "Unrealistically flows and may or may not be wet",
        group: "Puzzles",
        subgroup: "Goal",
        texture: new Float32Array([15, 9, 5, 5]),
        state: GAS,
        flammability: 0,
        blastResistance: 0,
        // oopsies draw is hardcoded
        // draw: function(ctx, cameraScale, x, y) {
        //     let size = (Math.sin(performance.now() / 1000 * Math.PI / 2) + 1) / 4 * cameraScale;
        //     ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
        //     ctx.fillRect(x * cameraScale - size, y * cameraScale - size, cameraScale + size * 2, cameraScale + size * 2);
        // },
    },
    team_placement_restriction_a: {
        name: "Team Placement Restriction (Alpha)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Team Placement Restriction",
        texture: [new Float32Array([240, 190, 50, 50]), new Float32Array([60, 380, 60, 60])],
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    team_placement_restriction_b: {
        name: "Team Placement Restriction (Beta)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Team Placement Restriction",
        texture: [new Float32Array([240, 240, 50, 50]), new Float32Array([120, 380, 60, 60])],
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    team_marker_a: {
        name: "Team Marker (Alpha)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Team Marker",
        color: new Float32Array([255, 204, 204, 1]),
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    team_marker_b: {
        name: "Team Marker (Beta)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Team Marker",
        color: new Float32Array([204, 204, 255, 1]),
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    king_of_the_hill_marker: {
        name: "King of the Hill Marker",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "King of the Hill Marker",
        color: new Float32Array([255, 204, 255, 1]),
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    color_red: {
        name: "Red Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([255, 0, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_red: 1,
        },
    },
    color_orange: {
        name: "Orange Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([255, 125, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_orange: 1,
        },
    },
    color_yellow: {
        name: "Yellow Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([255, 255, 0, 1]),
        amountColor: "black",
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_yellow: 1,
        },
    },
    color_lime: {
        name: "Lime Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([0, 255, 0, 1]),
        amountColor: "black",
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_lime: 1,
        },
    },
    color_green: {
        name: "Green Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([0, 220, 75, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_green: 1,
        },
    },
    color_cyan: {
        name: "Cyan Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([0, 255, 255, 1]),
        amountColor: "black",
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_cyan: 1,
        },
    },
    color_blue: {
        name: "Blue Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([0, 75, 255, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_blue: 1,
        },
    },
    color_purple: {
        name: "Purple Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([125, 0, 255, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_purple: 1,
        },
    },
    color_brown: {
        name: "Brown Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([125, 50, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_brown: 1,
        },
    },
    color_gray: {
        name: "Gray Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([125, 125, 125, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_gray: 1,
        },
    },
    color_black: {
        name: "Black Color",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color",
        color: new Float32Array([25, 25, 25, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        alwaysCollectable: true,
        cost: {
            color_black: 1,
        },
    },
    color_well: {
        name: "Color Well",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color Well",
        texture: [new Float32Array([20, 5, 4, 4]), new Float32Array([24, 5, 4, 4]), new Float32Array([28, 5, 4, 4]), new Float32Array([32, 5, 4, 4]), new Float32Array([36, 5, 4, 4]), new Float32Array([40, 5, 4, 4])],
        state: SOLID,
        flammability: 0,
        blastResistance: -1,
        pushable: false,
        stickable: false,
        cloneable: false,
        collectable: false,
        update: function(x, y) {
            let colors = [COLOR_RED, COLOR_ORANGE, COLOR_YELLOW, COLOR_LIME, COLOR_GREEN, COLOR_CYAN, COLOR_BLUE, COLOR_PURPLE, COLOR_BROWN, COLOR_GRAY, COLOR_BLACK];
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == AIR && random() < 0.1) {
                    addPixel(x1, y1, colors[Math.floor(random() * colors.length)]);
                    copyTeam(x, y, x1, y1);
                }
            });
            addDrawingChunk(x, y);
            addUpdatedChunk(x, y);
        },
        draw: function(ctx, cameraScale, x, y) {
            let time = performance.now();
            let size = (time / 1000 % 1) * cameraScale;
            ctx.fillStyle = "rgba(" + Math.min(Math.max(2 * Math.abs((time / 1000) % 3 - 1.5) - 1, 0), 1) * 255 + ", " + Math.min(Math.max(-2 * Math.abs((time / 1000) % 3 - 1) + 2, 0), 1) * 255 + ", " + Math.min(Math.max(-2 * Math.abs((time / 1000) % 3 - 2) + 2, 0), 1) * 255 + ", " + (0.5 * (1 - time / 1000 % 1)) + ")";
            ctx.fillRect(x * cameraScale - size, y * cameraScale - size, cameraScale + size * 2, cameraScale + size * 2);
        },
    },
    passive_color_generator: {
        name: "Passive Color Generator",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color Generator",
        texture: [new Float32Array([50, 9, 5, 5]), new Float32Array([55, 9, 5, 5]), new Float32Array([60, 9, 5, 5]), new Float32Array([65, 9, 5, 5]), new Float32Array([70, 9, 5, 5]), new Float32Array([75, 9, 5, 5])],
        state: SOLID,
        flammability: 0,
        blastResistance: 100,
        cost: {
            color_red: 10,
            color_orange: 10,
            color_yellow: 10,
            color_lime: 10,
            color_green: 10,
            color_cyan: 10,
            color_blue: 10,
            color_purple: 10,
            color_brown: 10,
            color_gray: 10,
            color_black: 10,
        },
        update: function(x, y) {
            let colors = [COLOR_RED, COLOR_ORANGE, COLOR_YELLOW, COLOR_LIME, COLOR_GREEN, COLOR_CYAN, COLOR_BLUE, COLOR_PURPLE, COLOR_BROWN, COLOR_GRAY, COLOR_BLACK];
            let filterColors = [];
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == COLOR_GENERATOR_FILTER) {
                    forTouching(x1, y1, function(x2, y2) {
                        let index2 = (x2 + y2 * gridWidth) * gridStride;
                        for (let i = 0; i < colors.length; i++) {
                            if (grid[index2 + ID] == colors[i]) {
                                filterColors.push(grid[index2 + ID]);
                                break;
                            }
                        }
                    });
                }
            });
            if (filterColors.length > 0) {
                colors = filterColors;
            }
            let air = false;
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == AIR) {
                    air = true;
                    if (random() < 0.025) {
                        addPixel(x1, y1, colors[Math.floor(random() * colors.length)]);
                        copyTeam(x, y, x1, y1);
                    }
                }
            });
            if (air) {
                addUpdatedChunk(x, y);
            }
        },
    },
    active_color_generator: {
        name: "Active Color Generator",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color Generator",
        texture: [new Float32Array([80, 9, 5, 5]), new Float32Array([85, 9, 5, 5]), new Float32Array([90, 9, 5, 5]), new Float32Array([95, 9, 5, 5]), new Float32Array([100, 9, 5, 5]), new Float32Array([105, 9, 5, 5])],
        state: SOLID,
        flammability: 0,
        blastResistance: 250,
        cost: {
            color_red: 25,
            color_orange: 25,
            color_yellow: 25,
            color_lime: 25,
            color_green: 25,
            color_cyan: 25,
            color_blue: 25,
            color_purple: 25,
            color_brown: 25,
            color_gray: 25,
            color_black: 25,
        },
        update: function(x, y) {
            let colors = [COLOR_RED, COLOR_ORANGE, COLOR_YELLOW, COLOR_LIME, COLOR_GREEN, COLOR_CYAN, COLOR_BLUE, COLOR_PURPLE, COLOR_BROWN, COLOR_GRAY, COLOR_BLACK];
            let filterColors = [];
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == COLOR_GENERATOR_FILTER) {
                    forTouching(x1, y1, function(x2, y2) {
                        let index2 = (x2 + y2 * gridWidth) * gridStride;
                        for (let i = 0; i < colors.length; i++) {
                            if (grid[index2 + ID] == colors[i]) {
                                filterColors.push(grid[index2 + ID]);
                                break;
                            }
                        }
                    });
                }
            });
            if (filterColors.length > 0) {
                colors = filterColors;
            }
            let air = false;
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == AIR) {
                    air = true;
                    if (random() < 0.05) {
                        addPixel(x1, y1, colors[Math.floor(random() * colors.length)]);
                        copyTeam(x, y, x1, y1);
                    }
                }
            });
            if (air) {
                addUpdatedChunk(x, y);
            }
        },
    },
    color_generator_filter: {
        name: "Color Generator Filter",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Color Generator",
        texture: new Float32Array([110, 9, 5, 5]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        cost: {
            color_red: 1,
            color_orange: 1,
            color_yellow: 1,
            color_lime: 1,
            color_green: 1,
            color_cyan: 1,
            color_blue: 1,
            color_purple: 1,
            color_brown: 1,
            color_gray: 1,
            color_black: 1,
        },
        update: function(x, y) {
            addDrawingChunk(x, y);
            addUpdatedChunk(x, y);
        },
        draw: function(ctx, cameraScale, x, y) {
            let color = [0, 0, 0, 0];
            let colors = [COLOR_RED, COLOR_ORANGE, COLOR_YELLOW, COLOR_LIME, COLOR_GREEN, COLOR_CYAN, COLOR_BLUE, COLOR_PURPLE, COLOR_BROWN, COLOR_GRAY, COLOR_BLACK];
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                for (let i = 0; i < colors.length; i++) {
                    if (grid[index1 + ID] == colors[i]) {
                        for (let j = 0; j < 4; j++) {
                            color[j] += pixels[grid[index1 + ID]].color[j];
                        }
                    }
                }
            });
            if (color[3] == 0) {
                return;
            }
            for (let i = 0; i < 4; i++) {
                color[i] /= color[3];
            }
            ctx.fillStyle = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + color[3] + ")";
            ctx.fillRect(x * cameraScale + cameraScale / 5, y * cameraScale + cameraScale / 5, cameraScale * 3 / 5, cameraScale * 3 / 5);
        },
    },
    collector: {
        name: "Collector",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Collector",
        texture: new Float32Array([115, 9, 5, 5]),
        state: SOLID,
        flammability: 0,
        blastResistance: 200,
        collectable: false,
        cost: {
            color_red: 1,
            color_orange: 1,
            color_yellow: 1,
            color_lime: 1,
            color_green: 1,
            color_cyan: 1,
            color_blue: 1,
            color_purple: 1,
            color_brown: 1,
            color_gray: 1,
            color_black: 10,
        },
        update6: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + y * gridWidth) * gridStride;
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (!pixels[grid[index1 + ID]].collectable) {
                    return;
                }
                if (!pixels[grid[index1 + ID]].alwaysCollectable) {
                    for (let i = 0; i < 2; i++) {
                        if ((grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0 && (grid[index1 + PIXEL_DATA] & (1 << (i + 1))) == 0) {
                            return;
                        }
                    }
                }
                if (multiplayerId != null) {
                    for (let i = 0; i < 2; i++) {
                        if ((grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            for (let j in pixels[grid[index1 + ID]].cost) {
                                multiplayerPixelInventory[i][j] += pixels[grid[index1 + ID]].cost[j];
                                if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                    pixelInventoryUpdates[j] = true;
                                }
                            }
                        }
                    }
                }
                addPixel(x1, y1, AIR);
                addTeam(x1, y1, -1);
            });
        },
    },
};

for (let i in pixelData) {
    let defaultProperties = {
        pushableLeft: true,
        pushableUp: true,
        pushableRight: true,
        pushableDown: true,
        stickableLeft: true,
        stickableUp: true,
        stickableRight: true,
        stickableDown: true,
        cloneable: true,
        rotatable: false,
        craftable: pixelData[i].cost != null,
        collectable: true,
    };
    for (let j in defaultProperties) {
        if (pixelData[i][j] == null) {
            pixelData[i][j] = defaultProperties[j];
        }
    }
    if (pixelData[i].pushable != null) {
        pixelData[i].pushableLeft = pixelData[i].pushable;
        pixelData[i].pushableUp = pixelData[i].pushable;
        pixelData[i].pushableRight = pixelData[i].pushable;
        pixelData[i].pushableDown = pixelData[i].pushable;
    }
    if (pixelData[i].stickable != null) {
        pixelData[i].stickableLeft = pixelData[i].stickable;
        pixelData[i].stickableUp = pixelData[i].stickable;
        pixelData[i].stickableRight = pixelData[i].stickable;
        pixelData[i].stickableDown = pixelData[i].stickable;
    }
    pixelData[i].description = "Number: " + (pixels.length - 1) + "<br>";
    pixelData[i].description += "Id: " + i + "<br>";
    pixelData[i].description += "Name: " + pixelData[i].name + "<br>";
    pixelData[i].description += "Group: " + pixelData[i].group + "<br>";
    pixelData[i].description += "Subgroup: " + pixelData[i].subgroup + "<br>";
    pixelData[i].description += "Color: " + (pixelData[i].color == null ? "None" : "rgba(" + pixelData[i].color[0] + ", " + pixelData[i].color[1] + ", " + pixelData[i].color[2] + ", " + pixelData[i].color[3] + ")") + "<br>";
    pixelData[i].description += "Coluor: " + (pixelData[i].color == null ? "None" : "rgba(" + pixelData[i].color[0] + ", " + pixelData[i].color[1] + ", " + pixelData[i].color[2] + ", " + pixelData[i].color[3] + ")") + "<br>";
    pixelData[i].description += "Noise: " + (pixelData[i].noise == null ? "None" : "rgba(" + pixelData[i].noise[0] + ", " + pixelData[i].noise[1] + ", " + pixelData[i].noise[2] + ", " + pixelData[i].noise[3] + ")") + "<br>";
    pixelData[i].description += "Texture: " + (pixelData[i].texture == null ? "None" : "[" + pixelData[i].texture[0] + ", " + pixelData[i].texture[1] + ", " + pixelData[i].texture[2] + ", " + pixelData[i].texture[3] + "]") + "<br>";
    pixelData[i].description += "Flammability: " + pixelData[i].flammability + "<br>";
    pixelData[i].description += "State: " + (pixelData[i].state == GAS ? "Gas" : pixelData[i].state == LIQUID ? "Liquid" : "Solid") + "<br>";
    pixelData[i].description += "Flammability: " + pixelData[i].flammability + "<br>";
    pixelData[i].description += "Blast Resistance: " + pixelData[i].blastResistance + "<br>";
    pixelData[i].description += "Pushable Left: " + pixelData[i].pushableLeft + "<br>";
    pixelData[i].description += "Pushable Up: " + pixelData[i].pushableUp + "<br>";
    pixelData[i].description += "Pushable Right: " + pixelData[i].pushableRight + "<br>";
    pixelData[i].description += "Pushable Down: " + pixelData[i].pushableDown + "<br>";
    pixelData[i].description += "Stickable Left: " + pixelData[i].stickableLeft + "<br>";
    pixelData[i].description += "Stickable Up: " + pixelData[i].stickableUp + "<br>";
    pixelData[i].description += "Stickable Right: " + pixelData[i].stickableRight + "<br>";
    pixelData[i].description += "Stickable Down: " + pixelData[i].stickableDown + "<br>";
    pixelData[i].description += "Cloneable: " + pixelData[i].cloneable + "<br>";
    pixelData[i].description += "Rotatable: " + pixelData[i].rotatable + "<br>";
    pixelData[i].description += "Craftable: " + pixelData[i].craftable + "<br>";
    pixelData[i].description += "Collectable: " + pixelData[i].collectable + "<br>";
    // pixelData[i].description += "Update Stage 0: " + (pixelData[i].update != null ? "True" : "False") + "<br>";
    // pixelData[i].description += "Update Stage 1: " + (pixelData[i].update1 != null ? "True" : "False") + "<br>";
    // pixelData[i].description += "Update Stage 2: " + (pixelData[i].update2 != null ? "True" : "False") + "<br>";
    // pixelData[i].description += "Update Stage 3: " + (pixelData[i].update3 != null ? "True" : "False") + "<br>";
    // pixelData[i].description += "Update Stage 4: " + (pixelData[i].update4 != null ? "True" : "False") + "<br>";
    // pixelData[i].description += "Update Stage 5: " + (pixelData[i].update5 != null ? "True" : "False") + "<br>";
    // pixelData[i].description += "Random Update: " + (pixelData[i].randomUpdate != null ? "True" : "False") + "<br>";
    // pixelData[i].description += "Draw: " + (pixelData[i].draw != null ? "True" : "False") + "<br>";
    pixelData[i].description += "Update Stage 0: " + (pixelData[i].update != null ? pixelData[i].update.toString() : "None") + "<br>";
    pixelData[i].description += "Update Stage 1: " + (pixelData[i].update1 != null ? pixelData[i].update1.toString() : "None") + "<br>";
    pixelData[i].description += "Update Stage 2: " + (pixelData[i].update2 != null ? pixelData[i].update2.toString() : "None") + "<br>";
    pixelData[i].description += "Update Stage 3: " + (pixelData[i].update3 != null ? pixelData[i].update3.toString() : "None") + "<br>";
    pixelData[i].description += "Update Stage 4: " + (pixelData[i].update4 != null ? pixelData[i].update4.toString() : "None") + "<br>";
    pixelData[i].description += "Update Stage 5: " + (pixelData[i].update5 != null ? pixelData[i].update5.toString() : "None") + "<br>";
    pixelData[i].description += "Random Update: " + (pixelData[i].randomUpdate != null ? pixelData[i].randomUpdate.toString() : "None") + "<br>";
    pixelData[i].description += "Draw: " + (pixelData[i].draw != null ? pixelData[i].draw.toString() : "None") + "<br>";
    pixelData[i].description = "";
    pixels.push(pixelData[i]);
    pixels[pixels.length - 1].id = i;
    eval("window." + i.toUpperCase() + " = " + (pixels.length - 1) + ";");
}
for (let i = 0; i < pixels.length; i++) {
    if (pixels[i].rotations != null) {
        for (let j = 0; j < pixels[i].rotations.length; j++) {
            if (pixels[i].rotations[j] == pixels[i].id) {
                pixels[i].rotation = j;
            }
            for (let k = 0; k < pixels.length; k++) {
                if (pixels[k].id == pixels[i].rotations[j]) {
                    pixels[i].rotations[j] = k;
                    break;
                }
            }
        }
        pixels[i].rotations = new Uint32Array(pixels[i].rotations);
    }
    if (pixels[i].cost != null) {
        let cost = {};
        for (let j in pixels[i].cost) {
            for (let k = 0; k < pixels.length; k++) {
                if (pixels[k].id == j) {
                    cost[k] = pixels[i].cost[j];
                    break;
                }
            }
        }
        pixels[i].cost = cost;
    }
}
function updateCost(id) {
    let cost = {};
    for (let i in pixels[id].cost) {
        if (i != id && pixels[i].cost != null) {
            for (let j in pixels[i].cost) {
                if (pixels[j].cost != null) {
                    updateCost(i);
                    break;
                }
            }
            for (let j in pixels[i].cost) {
                if (cost[j] == null) {
                    cost[j] = 0;
                }
                cost[j] += pixels[i].cost[j] * pixels[id].cost[i];
            }
        }
        else {
            if (cost[i] == null) {
                cost[i] = 0;
            }
            cost[i] += pixels[id].cost[i];
        }
    }
    pixels[id].cost = cost;
};
for (let i in pixels) {
    if (pixels[i].cost != null) {
        updateCost(i);
    }
}

let corruptionName = pixelData.corruption.name;
setInterval(() => {
    let characters = "abcdefghijklmnopqrstuvwxyzABCEDFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-=_+[]{}\|;':\",./<>?`~";
    let index = Math.floor(Math.random() * pixels[CORRUPTION].name.length);
    if (Math.random() < 0.1) {
        pixels[CORRUPTION].name = corruptionName;
    }
    pixels[CORRUPTION].name = pixels[CORRUPTION].name.substring(0, index) + characters[Math.floor(Math.random() * characters.length)] + pixels[CORRUPTION].name.substring(index + 1);
});

let pixelPicker = document.getElementById("pixelPicker");
let pixelGroups = [];
let pixelSubgroups = [];
let pixelImageData = [];
let pixelDivs = [];
let pixelImages = [];
let pixelAmounts = [];
let pixelSubgroupToId = [];
let pixelDivToId = [];
let pixelIdToDiv = [];
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
canvas.width = 48;
canvas.height = 48;
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

let selectedDiv = null;

for (let i = 0; i < pixels.length; i++) {
    // if (!pixels[i].pickable) {
    //     continue;
    // }
    ctx.clearRect(0, 0, 48, 48);
    if (pixels[i].color != null) {
        ctx.fillStyle = "rgba(" + pixels[i].color[0] + ", " + pixels[i].color[1] + ", " + pixels[i].color[2] + ", 1)";
        if (pixels[i].noise != null) {
            ctx.fillStyle = "rgba(" + (pixels[i].color[0] + pixels[i].noise[0] / 2) + ", " + (pixels[i].color[1] + pixels[i].noise[1] / 2) + ", " + (pixels[i].color[2] + pixels[i].noise[2] / 2) + ", 1)";
        }
        ctx.fillRect(0, 0, 48, 48);
    }
    else if (Array.isArray(pixels[i].texture)) {
        ctx.drawImage(pixelTexture, pixels[i].texture[0][0], pixels[i].texture[0][1], pixels[i].texture[0][2], pixels[i].texture[0][3], 0, 0, 48, 48);
    }
    else {
        ctx.drawImage(pixelTexture, pixels[i].texture[0], pixels[i].texture[1], pixels[i].texture[2], pixels[i].texture[3], 0, 0, 48, 48);
    }
    // ctx.clearRect(0, 0, 60, 60);
    // ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
    // ctx.fillRect(0, 0, 60, 60);
    // ctx.rotate(-Math.PI / 4);
    // ctx.clearRect(-100, 0, 200, 6 / Math.sqrt(2));
    // ctx.clearRect(-100, 54 / Math.sqrt(2), 200, 12 / Math.sqrt(2));
    // ctx.clearRect(-100, 114 / Math.sqrt(2), 200, 6 / Math.sqrt(2));
    // ctx.resetTransform();
    let data = canvas.toDataURL("image/png");
    pixelImageData.push(data);
    if (pixelGroups[pixels[i].group] == null) {
        let group = document.createElement("div");
        group.classList.add("pixelGroup");
        pixelPicker.appendChild(group);
        pixelGroups[pixels[i].group] = group;
        pixelSubgroups[pixels[i].group] = [];
        let groupImg = document.createElement("div");
        groupImg.classList.add("pixelGroupImg");
        groupImg.style.backgroundImage = "url(" + data + ")";
        groupImg.onclick = function() {
            if (group.classList.contains("pixelGroupSelected")) {
                group.classList.remove("pixelGroupSelected");
            }
            else {
                for (let j in pixelGroups) {
                    pixelGroups[j].classList.remove("pixelGroupSelected");
                }
                group.classList.add("pixelGroupSelected");
            }
        };
        groupImg.onmouseover = function() {
            // showTooltip(pixels[i].group, pixels[i].groupDescription);
            showTooltip(pixels[i].group, "");
            moveTooltip();
        };
        groupImg.onmouseout = function() {
            hideTooltip();
        };
        groupImg.onmousemove = function() {
            moveTooltip();
        };
        group.appendChild(groupImg);
        let subgroups = document.createElement("div");
        subgroups.classList.add("pixelSubgroups");
        group.appendChild(subgroups);
    }
    if (pixelSubgroups[pixels[i].group][pixels[i].subgroup] == null) {
        let subgroup = document.createElement("div");
        subgroup.classList.add("pixelSubgroup");
        pixelGroups[pixels[i].group].children[1].appendChild(subgroup);
        pixelSubgroups[pixels[i].group][pixels[i].subgroup] = subgroup;
        pixelSubgroupToId[pixels[i].subgroup] = i;
        pixelDivs.push(subgroup);
        let subgroupImg = document.createElement("div");
        subgroupImg.classList.add("pixelSubgroupImg");
        subgroupImg.style.backgroundImage = "url(" + data + ")";
        subgroupImg.onclick = function() {
            let id = pixelDivToId[i];
            setBrushPixel(id);
        };
        let interval = 0;
        subgroupImg.onmouseover = function() {
            let id = pixelDivToId[i];
            showTooltip(pixels[id].name, pixels[id].description);
            if (id == CORRUPTION) {
                interval = setInterval(() => {
                    showTooltip(pixels[id].name, pixels[id].description);
                });
            }
            moveTooltip();
        };
        subgroupImg.onmouseout = function() {
            let id = pixelDivToId[i];
            if (id == CORRUPTION) {
                clearInterval(interval);
            }
            hideTooltip();
        };
        subgroupImg.onmousemove = function() {
            moveTooltip();
        };
        subgroup.appendChild(subgroupImg);
        pixelImages.push(subgroupImg);
        let pixelAmount = document.createElement("div");
        pixelAmount.classList.add("pixelAmount");
        pixelAmount.style.color = pixels[i].amountColor ?? "white";
        pixelAmounts.push(pixelAmount);
        subgroupImg.appendChild(pixelAmount);

        if (selectedDiv == null) {
            selectedDiv = subgroupImg;
        }
    }
    else {
        let pixel = document.createElement("div");
        pixel.classList.add("pixel");
        pixelSubgroups[pixels[i].group][pixels[i].subgroup].appendChild(pixel);
        pixelDivs.push(pixel);
        let pixelImg = document.createElement("div");
        pixelImg.classList.add("pixelImg");
        pixelImg.style.backgroundImage = "url(" + data + ")";
        pixelImg.onclick = function() {
            let id = pixelDivToId[i];
            setBrushPixel(id);
        };
        pixelImg.onmouseover = function() {
            let id = pixelDivToId[i];
            showTooltip(pixels[id].name, pixels[id].description);
            moveTooltip();
        };
        pixelImg.onmouseout = function() {
            hideTooltip();
        };
        pixelImg.onmousemove = function() {
            moveTooltip();
        };
        pixel.appendChild(pixelImg);
        pixelImages.push(pixelImg);
        let pixelAmount = document.createElement("div");
        pixelAmount.classList.add("pixelAmount");
        pixelAmount.style.color = pixels[i].amountColor ?? "white";
        pixelAmounts.push(pixelAmount);
        pixelImg.appendChild(pixelAmount);
    }
}
for (let i in pixels) {
    if (pixels[i].craftable) {
        for (let j in pixels[i].cost) {
            pixels[i].description += pixels[j].name + " <img class=\"pixelCostImg\" src=\"" + pixelImageData[j] + "\"> x" + pixels[i].cost[j] + "<br>";
        }
    }
}

function updateBrushPixel() {
    selectedDiv.classList.remove("pixelSelected");
    selectedDiv = pixelImages[pixelIdToDiv[brushPixel]];
    selectedDiv.classList.add("pixelSelected");
};

let pixelInventory = [];
let pixelInventoryUpdates = [];
function resetPixelInventory() {
    if (currentPuzzle != null) {
        for (let i in pixelGroups) {
            pixelGroups[i].style.display = "none";
            for (let j in pixelSubgroups[i]) {
                pixelSubgroups[i][j].style.display = "none";
            }
        }
        let pixelSubgroupIds = [];
        for (let i in pixels) {
            pixelDivToId[i] = i;
            pixelIdToDiv[i] = i;
            pixelDivs[i].classList.remove("shown");
            if (pixelSubgroupIds[pixels[i].subgroup] == null) {
                pixelSubgroupIds[pixels[i].subgroup] = [i];
            }
            else {
                pixelSubgroupIds[pixels[i].subgroup].push(i);
            }
        }
        for (let i in pixels) {
            if (pixelInventory[i] == 0) {
                continue;
            }
            let div = pixelSubgroupIds[pixels[i].subgroup].shift();
            pixelDivToId[div] = i;
            pixelIdToDiv[i] = div;
            pixelDivs[div].classList.add("shown");
            pixelAmounts[div].style.display = "";
            pixelAmounts[div].innerText = pixelInventory[i] == Infinity ? "∞" : pixelInventory[i];
            pixelImages[div].style.backgroundImage = "url(" + pixelImageData[i] + ")";
            if (pixelImages[div].classList.contains("disabled")) {
                pixelImages[div].classList.remove("disabled");
            }
            pixelGroups[pixels[i].group].style.display = "";
            pixelSubgroups[pixels[i].group][pixels[i].subgroup].style.display = "";
        }
    }
    else if (multiplayerId != null) {
        if (multiplayerGames[multiplayerGameId].allowCrafting) {
            for (let i in pixelGroups) {
                pixelGroups[i].style.display = "none";
                for (let j in pixelSubgroups[i]) {
                    pixelSubgroups[i][j].style.display = "none";
                }
            }
            let pixelSubgroupIds = [];
            for (let i in pixels) {
                pixelDivToId[i] = i;
                pixelIdToDiv[i] = i;
                pixelDivs[i].classList.remove("shown");
                if (pixelSubgroupIds[pixels[i].subgroup] == null) {
                    pixelSubgroupIds[pixels[i].subgroup] = [i];
                }
                else {
                    pixelSubgroupIds[pixels[i].subgroup].push(i);
                }
            }
            for (let i in pixels) {
                if (pixels[i].cost == null) {
                    continue;
                }
                let div = pixelSubgroupIds[pixels[i].subgroup].shift();
                pixelDivToId[div] = i;
                pixelIdToDiv[i] = div;
                pixelDivs[div].classList.add("shown");
                pixelAmounts[div].style.display = "";
                pixelAmounts[div].innerText = pixelInventory[i] == Infinity ? "∞" : pixelInventory[i];
                pixelImages[div].style.backgroundImage = "url(" + pixelImageData[i] + ")";
                if (pixelInventory[i] == 0) {
                    pixelImages[i].classList.add("disabled");
                }
                else {
                    pixelImages[i].classList.remove("disabled");
                }
                pixelGroups[pixels[i].group].style.display = "";
                pixelSubgroups[pixels[i].group][pixels[i].subgroup].style.display = "";
            }
        }
        else {
            for (let i in pixelGroups) {
                pixelGroups[i].style.display = "";
                for (let j in pixelSubgroups[i]) {
                    pixelSubgroups[i][j].style.display = "";
                }
            }
            for (let i in pixels) {
                pixelDivToId[i] = i;
                pixelIdToDiv[i] = i;
                pixelDivs[i].classList.add("shown");
                pixelAmounts[i].style.display = "";
                pixelAmounts[i].innerText = pixelInventory[i] == Infinity ? "∞" : pixelInventory[i];
                if (pixelInventory[i] == 0) {
                    pixelImages[i].classList.add("disabled");
                }
                else {
                    pixelImages[i].classList.remove("disabled");
                }
                pixelImages[i].style.backgroundImage = "url(" + pixelImageData[i] + ")";
            }
        }
    }
    else {
        for (let i in pixelGroups) {
            pixelGroups[i].style.display = "";
            for (let j in pixelSubgroups[i]) {
                pixelSubgroups[i][j].style.display = "";
            }
        }
        for (let i in pixels) {
            pixelDivToId[i] = i;
            pixelIdToDiv[i] = i;
            pixelDivs[i].classList.add("shown");
            pixelAmounts[i].style.display = "none";
            pixelImages[i].classList.remove("disabled");
            pixelImages[i].style.backgroundImage = "url(" + pixelImageData[i] + ")";
        }
    }
};
function updatePixelInventory() {
    for (let i in pixelInventoryUpdates) {
        let div = pixelIdToDiv[i];
        if (pixelInventory[i] != 0 && !pixelImages[div].classList.contains("shown")) {
            let pixelSubgroupIds = [];
            for (let j = 0; j < pixels.length; j++) {
                // if (j < Number(i)) {
                //     continue;
                // }
                if (pixels[j].subgroup == pixels[i].subgroup) {
                    pixelSubgroupIds.push(j);
                }
            }
            for (let j = 0; j < pixels.length; j++) {
                // if (j < Number(i)) {
                //     continue;
                // }
                if (pixelInventory[j] == 0 && (pixelDivToId[pixelIdToDiv[j]] != j || !pixelDivs[pixelIdToDiv[j]].classList.contains("shown"))) {
                    continue;
                }
                if (pixels[j].subgroup != pixels[i].subgroup) {
                    continue;
                }
                let div = pixelSubgroupIds.shift();
                if (j >= Number(i)) {
                    pixelDivToId[div] = j;
                    pixelIdToDiv[j] = div;
                    pixelDivs[div].classList.add("shown");
                    pixelAmounts[div].style.display = "";
                    pixelAmounts[div].innerText = pixelInventory[j] == Infinity ? "∞" : pixelInventory[j];
                    pixelImages[div].style.backgroundImage = "url(" + pixelImageData[j] + ")";
                    if (pixelInventory[j] != 0) {
                        if (pixelImages[div].classList.contains("disabled")) {
                            pixelImages[div].classList.remove("disabled");
                        }
                    }
                    pixelGroups[pixels[j].group].style.display = "";
                    pixelSubgroups[pixels[j].group][pixels[j].subgroup].style.display = "";
                }
            }
            div = pixelIdToDiv[i];
        }
        pixelAmounts[div].innerText = pixelInventory[i] == Infinity ? "∞" : pixelInventory[i];
        if ((pixelInventory[i] == 0) != pixelImages[div].classList.contains("disabled")) {
            pixelImages[div].classList.toggle("disabled");
        }
    }
    pixelInventoryUpdates = [];
};
function updateMultiplayerPixelInventory() {
    if (multiplayerGames[multiplayerGameId].allowCrafting) {
        for (let i = 0; i < multiplayerGames[multiplayerGameId].teams; i++) {
            for (let j in multiplayerGames[multiplayerGameId].pixelInventoryDivs[i]) {
                multiplayerGames[multiplayerGameId].pixelInventoryDivs[i][j].innerText = multiplayerPixelInventory[i][j];
            }
        }
        // for (let i in multiplayerGames[multiplayerGameId].pixelInventoryDivs[multiplayerGames[multiplayerGameId].players[multiplayerId].team]) {
        //     pixelInventory[i] = multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][i];
        //     if (pixelInventoryUpdates[i]) {
        //         multiplayerGames[multiplayerGameId].pixelInventoryDivs[multiplayerGames[multiplayerGameId].players[multiplayerId].team][i].innerText = pixelInventory[i];
        //     }
        // }
        for (let i in pixels) {
            let amount = null;
            if (!pixels[i].craftable) {
                pixelInventory[i] = 0;
                continue;
            }
            for (let j in pixels[i].cost) {
                if (amount == null) {
                    amount = Math.floor(multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][j] / pixels[i].cost[j]);
                }
                else {
                    amount = Math.min(amount, Math.floor(multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][j] / pixels[i].cost[j]));
                }
            }
            if (pixelInventory[i] != amount) {
                pixelInventory[i] = amount;
                pixelInventoryUpdates[i] = true;
            }
        }
    }
    else {
        for (let i in multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team]) {
            if (pixelInventory[i] != multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][i]) {
                pixelInventory[i] = multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][i];
                pixelInventoryUpdates[j] = true;
            }
        }
    }
};

export { pixels, addPixel, addFire, addTeam, addUpdatedChunk, addUpdatedChunk2, addGridUpdatedChunk, resetPushPixels, pixelTexture, pixelImageData, pixelInventory, pixelInventoryUpdates, updateBrushPixel, resetPixelInventory, updatePixelInventory, updateMultiplayerPixelInventory };