import { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, drawChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, tick, modal, brushPixel, setBrushPixel, showTooltip, hideTooltip, moveTooltip } from "./game.js";
// import { imageBitmap } from "./renderer.js";
import { random } from "./random.js";
import { currentPuzzle } from "./puzzles.js";

const pixelTexture = await createImageBitmap(await (await fetch("pixels.png")).blob());
const ID = 0;
const ON_FIRE = 1;
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
    grid[index + ON_FIRE] = fire;
    addUpdatedChunk(x, y);
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
    nextChunks[index + 1] = Math.max(nextChunks[index + 1], Math.min(x + buffer, chunkX * chunkWidth + chunkWidth - 1));
    nextChunks[index + 2] = Math.min(nextChunks[index + 2], Math.max(y - buffer, chunkY * chunkHeight));
    nextChunks[index + 3] = Math.max(nextChunks[index + 3], Math.min(y + buffer, chunkY * chunkHeight + chunkHeight - 1));

    if (x >= buffer && x % chunkWidth < buffer) {
        nextChunks[index - chunkStride] = Math.min(nextChunks[index - chunkStride], x - buffer);
        nextChunks[index - chunkStride + 1] = Math.max(nextChunks[index - chunkStride + 1], chunkX * chunkWidth - 1);
        nextChunks[index - chunkStride + 2] = Math.min(nextChunks[index - chunkStride + 2], Math.max(y - buffer, chunkY * chunkHeight));
        nextChunks[index - chunkStride + 3] = Math.max(nextChunks[index - chunkStride + 3], Math.min(y + buffer, chunkY * chunkHeight + chunkHeight - 1));
    }
    if (x < gridWidth - buffer && x % chunkWidth >= chunkWidth - buffer) {
        nextChunks[index + chunkStride] = Math.min(nextChunks[index + chunkStride], chunkX * chunkWidth + chunkWidth);
        nextChunks[index + chunkStride + 1] = Math.max(nextChunks[index + chunkStride + 1], x + buffer);
        nextChunks[index + chunkStride + 2] = Math.min(nextChunks[index + chunkStride + 2], Math.max(y - buffer, chunkY * chunkHeight));
        nextChunks[index + chunkStride + 3] = Math.max(nextChunks[index + chunkStride + 3], Math.min(y + buffer, chunkY * chunkHeight + chunkHeight - 1));
    }
    if (y >= buffer && y % chunkHeight < buffer) {
        nextChunks[index - chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkXAmount * chunkStride], Math.max(x - buffer, chunkX * chunkWidth));
        nextChunks[index - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkXAmount * chunkStride + 1], Math.min(x + buffer, chunkX * chunkWidth + chunkWidth - 1));
        nextChunks[index - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkXAmount * chunkStride + 2], y - buffer);
        nextChunks[index - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkXAmount * chunkStride + 3], chunkY * chunkHeight - 1);
    }
    if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
        nextChunks[index + chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkXAmount * chunkStride], Math.max(x - buffer, chunkX * chunkWidth));
        nextChunks[index + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkXAmount * chunkStride + 1], Math.min(x + buffer, chunkX * chunkWidth + chunkWidth - 1));
        nextChunks[index + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkXAmount * chunkStride + 2], chunkY * chunkHeight + chunkHeight);
        nextChunks[index + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkXAmount * chunkStride + 3], y + buffer);
    }
    if (x >= buffer && x % chunkWidth < buffer) {
        if (y >= buffer && y % chunkHeight < buffer) {
            nextChunks[index - chunkStride - chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkStride - chunkXAmount * chunkStride], x - buffer);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 1], chunkX * chunkWidth - 1);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 2], y - buffer);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 3], chunkY * chunkHeight - 1);
        }
        if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
            nextChunks[index - chunkStride + chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkStride + chunkXAmount * chunkStride], x - buffer);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 1], chunkX * chunkWidth - 1);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 2], chunkY * chunkHeight + chunkHeight);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 3], y + buffer);
        }
    }
    if (x < gridWidth - buffer && x % chunkWidth >= chunkWidth - buffer) {
        if (y >= buffer && y % chunkHeight < buffer) {
            nextChunks[index + chunkStride - chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkStride - chunkXAmount * chunkStride], chunkX * chunkWidth + chunkWidth);
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 1], x + buffer);
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 2], y - buffer);
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 3], chunkY * chunkHeight - 1);
        }
        if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
            nextChunks[index + chunkStride + chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkStride + chunkXAmount * chunkStride], chunkX * chunkWidth + chunkWidth);
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 1], x + buffer);
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 2], chunkY * chunkHeight + chunkHeight);
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 3], y + buffer);
        }
    }
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
    let onFire = grid[index + ON_FIRE];
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
                    grid[cIndex + ON_FIRE] = onFire;
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
                    grid[index + ON_FIRE] = onFire;
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
                    grid[iIndex + ON_FIRE] = onFire;
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
                    grid[cIndex + ON_FIRE] = onFire;
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
                    grid[index + ON_FIRE] = onFire;
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
                    grid[iIndex + ON_FIRE] = onFire;
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
        grid[index + ON_FIRE] = onFire;
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
        grid[index + 1] = false;
        grid[index + 3] = tick;
        return;
    }
    if (grid[index1 + ID] == MONSTER) {
        grid[index + 0] = AIR;
        grid[index + 1] = false;
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
    addFire(x, y, true);
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
                        addFire(x1, y1, true);
                    }
                    if (id == AIR) {

                    }
                    else if (id == ASH) {
                        addPixel(x1, y1, AIR);
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
                    if ((id1 == PUSHER_UP || id1 == FAN_UP) && !isDeactivated(x1, y2 - 1)) {
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
        if (grid[index + ID] == DEACTIVATOR || grid[index + ID] == OBSERVER_RIGHT_ON) {
            return true;
        }
    }
    if (x < gridWidth - 1) {
        let index = (x + 1 + y * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR || grid[index + ID] == OBSERVER_LEFT_ON) {
            return true;
        }
    }
    if (y > 0) {
        let index = (x + (y - 1) * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR || grid[index + ID] == OBSERVER_DOWN_ON) {
            return true;
        }
    }
    if (y < gridHeight - 1) {
        let index = (x + (y + 1) * gridWidth) * gridStride;
        if (grid[index + ID] == DEACTIVATOR || grid[index + ID] == OBSERVER_UP_ON) {
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
        blastResistance: 2500,
    },
    water: {
        name: "Water",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Water",
        color: new Float32Array([75, 100, 255, 1]),
        state: LIQUID,
        flammability: 0,
        blastResistance: 1750,
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
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ON_FIRE]) {
                    return;
                }
                if (random() < pixels[grid[index1 + ID]].flammability / 20) {
                    addFire(x1, y1, true);
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
        blastResistance: 2200,
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
                    grid[index1 + ON_FIRE] = 1;
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
                    // grid[index + ON_FIRE] = 0;
                    if (grid[index1 + ID] != ASH && random() < 0.3) {
                        addPixel(x1, y1, ASH);
                    }
                    else {
                        addPixel(x1, y1, AIR);
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
                    if (left || (left && right && random() < 0.5)) {
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
                grid[index + ON_FIRE] = 0;
                return;
            }
            if (flammability == 0 && (grid[index + ID] != AIR || random() < 0.3)) {
                grid[index + ON_FIRE] = 0;
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
                grid[index + ON_FIRE] = 0;
            }
            let touchingAir = grid[index + ID] == AIR || isTouching(x, y, [AIR]);
            if (random() < (20 - flammability) / (touchingAir ? 280 : 20)) {
                grid[index + ON_FIRE] = 0;
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
                    grid[index1 + ON_FIRE] = 1;
                    grid[index1 + UPDATED] = tick;
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
        description: "Hard rectangular clay",
        group: "General",
        subgroup: "Water Pump",
        texture: new Float32Array([0, 2, 3, 3]),
        state: SOLID,
        flammability: 8,
        blastResistance: 100,
        update: function(x, y) {
            if (isTouching(x, y, [LAVA])) {
                addPixel(x, y, WATER);
                // explode
                return;
            }
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == AIR && random() < 0.125) {
                    addPixel(x1, y1, WATER);
                }
            });
            addUpdatedChunk(x, y);
        },
    },
    lava_heater: {
        name: "Lava Heater",
        description: "Hard rectangular clay",
        group: "General",
        subgroup: "Water Pump",
        texture: new Float32Array([3, 2, 3, 3]),
        state: SOLID,
        flammability: 0,
        blastResistance: 100,
        update: function(x, y) {
            if (isTouching(x, y, [WATER])) {
                addPixel(x, y, LAVA);
                // explode
                return;
            }
            if (isTouching(x, y, [ICE, SNOW])) {
                addPixel(x, y, LAVA);
                // explode
                return;
            }
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                // if ((grid[index1 + ID] == AIR || grid[index1 + ID] == STONE) && random() < 0.075) {
                if (grid[index1 + ID] == AIR && random() < 0.075) {
                    addPixel(x1, y1, LAVA);
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
        description: "Hard rectangular clay",
        group: "General",
        subgroup: "Water Pump",
        texture: new Float32Array([6, 2, 3, 3]),
        state: SOLID,
        flammability: 8,
        blastResistance: 100,
        update: function(x, y) {
            if (isTouching(x, y, [LAVA])) {
                // addPixel(x, y, ICE);
                // explode
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
        blastResistance: 1600,
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
        blastResistance: 1000,
    },
    basalt: {
        name: "Basalt",
        description: "Stonier and harder",
        group: "General",
        subgroup: "Stone",
        color: new Float32Array([90, 90, 110, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 2200,
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
        blastResistance: 1250,
    },
    steel: {
        name: "Steel",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Iron",
        texture: new Float32Array([8, 20, 8, 8]),
        state: SOLID,
        flammability: 0,
        blastResistance: 2000,
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
    },
    glass: {
        name: "Glass",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Glass",
        texture: new Float32Array([204, 40, 25, 25]),
        amountColor: "black",
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        stickable: false,
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
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == WATER) {
                    changed = true;
                    addPixel(x1, y1, SPONGE);
                }
            });
            if (changed) {
                addPixel(x, y, AIR);
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
                }
            });
            if (changed) {
                addPixel(x, y, AIR);
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
        blastResistance: 1650,
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["piston_left", "piston_up", "piston_right", "piston_down"],
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["piston_left", "piston_up", "piston_right", "piston_down"],
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["piston_left", "piston_up", "piston_right", "piston_down"],
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["piston_left", "piston_up", "piston_right", "piston_down"],
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
        blastResistance: 0,
        stickableLeft: false,
        rotatable: true,
        rotations: ["pusher_left", "pusher_up", "pusher_right", "pusher_down"],
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
        blastResistance: 0,
        stickableUp: false,
        rotatable: true,
        rotations: ["pusher_left", "pusher_up", "pusher_right", "pusher_down"],
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
        blastResistance: 0,
        stickableRight: false,
        rotatable: true,
        rotations: ["pusher_left", "pusher_up", "pusher_right", "pusher_down"],
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
        blastResistance: 0,
        stickableDown: false,
        rotatable: true,
        rotations: ["pusher_left", "pusher_up", "pusher_right", "pusher_down"],
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
        blastResistance: 0,
        stickableLeft: false,
        rotatable: true,
        rotations: ["fan_left", "fan_up", "fan_right", "fan_down"],
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
        blastResistance: 0,
        stickableUp: false,
        rotatable: true,
        rotations: ["fan_left", "fan_up", "fan_right", "fan_down"],
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
        blastResistance: 0,
        stickableRight: false,
        rotatable: true,
        rotations: ["fan_left", "fan_up", "fan_right", "fan_down"],
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
        blastResistance: 0,
        stickableDown: false,
        rotatable: true,
        rotations: ["fan_left", "fan_up", "fan_right", "fan_down"],
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["sticky_piston_left", "sticky_piston_up", "sticky_piston_right", "sticky_piston_down"],
        sticky: 1,
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["sticky_piston_left", "sticky_piston_up", "sticky_piston_right", "sticky_piston_down"],
        sticky: 1,
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["sticky_piston_left", "sticky_piston_up", "sticky_piston_right", "sticky_piston_down"],
        sticky: 1,
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["sticky_piston_left", "sticky_piston_up", "sticky_piston_right", "sticky_piston_down"],
        sticky: 1,
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["copier_left", "copier_up", "copier_right", "copier_down"],
        update1: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].cloneable && grid[index + UPDATED] != tick) {
                let index1 = (x - 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x - 1, y, grid[index + ID]);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["copier_left", "copier_up", "copier_right", "copier_down"],
        update3: function(x, y) {
            if (y == 0 || y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].cloneable && grid[index + UPDATED] != tick) {
                let index1 = (x + (y - 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x, y - 1, grid[index + ID]);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["copier_left", "copier_up", "copier_right", "copier_down"],
        update2: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].cloneable && grid[index + UPDATED] != tick) {
                let index1 = (x + 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x + 1, y, grid[index + ID]);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["copier_left", "copier_up", "copier_right", "copier_down"],
        update4: function(x, y) {
            if (y == 0 || y == gridHeight - 1) {
                return;
            }
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].cloneable && grid[index + UPDATED] != tick) {
                let index1 = (x + (y + 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x, y + 1, grid[index + ID]);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["cloner_left", "cloner_up", "cloner_right", "cloner_down"],
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
                let index1 = (x - 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    if (!pushLeft(x - 1, y, x, y, 2)) {
                        addUpdatedChunk(x, y);
                        return;
                    }
                }
                if (grid[index1 + ID] == AIR) {
                    addPixel(x - 1, y, id);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["cloner_left", "cloner_up", "cloner_right", "cloner_down"],
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
                let index1 = (x + (y - 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    if (!pushUp(x, y - 1, x, y, 2)) {
                        addUpdatedChunk(x, y);
                        return;
                    }
                }
                if (grid[index1 + ID] == AIR) {
                    addPixel(x, y - 1, id);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["cloner_left", "cloner_up", "cloner_right", "cloner_down"],
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
                let index1 = (x + 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    if (!pushRight(x + 1, y, x, y, 2)) {
                        addUpdatedChunk(x, y);
                        return;
                    }
                }
                if (grid[index1 + ID] == AIR) {
                    addPixel(x + 1, y, id);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["cloner_left", "cloner_up", "cloner_right", "cloner_down"],
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
                let index1 = (x + (y + 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    if (!pushDown(x, y + 1, x, y, 2)) {
                        addUpdatedChunk(x, y);
                        return;
                    }
                }
                if (grid[index1 + ID] == AIR) {
                    addPixel(x, y + 1, id);
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
        blastResistance: 0,
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
        blastResistance: 0,
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
        blastResistance: 0,
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
        blastResistance: 0,
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
        texture: new Float32Array([9, 2, 3, 3]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
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
        texture: new Float32Array([21, 2, 3, 3]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["slider_horizontal", "slider_vertical"],
        pushableUp: false,
        pushableDown: false,
    },
    slider_vertical: {
        name: "Slider (Vertical)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Slider",
        texture: new Float32Array([4, 5, 4, 4]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        rotatable: true,
        rotations: ["slider_horizontal", "slider_vertical"],
        pushableLeft: false,
        pushableRight: false,
    },
    collapsable: {
        name: "Collapsable Box",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Collapsable Box",
        texture: new Float32Array([80, 40, 40, 40]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
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
        blastResistance: 0,
        sticky: 2,
    },
    deactivator: {
        name: "Deactivator",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Deactivator",
        texture: new Float32Array([48, 28, 12, 12]),
        state: SOLID,
        flammability: 4,
        blastResistance: 0,
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["observer_left_off", "observer_up_off", "observer_right_off", "observer_down_off"],
        update5: function(x, y) {
            // tick = last off
            // tick - 1 = last on

            // we will turn on if: pixel in front has had an update
            // observer in front is on


            // right and down: last update is easy, just >= -14
            // left and up: 
            // let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] >= tick - 14;
            if (x == gridWidth - 1) {
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            // if (isDeactivatedObserver(x, y)) {
            //     // setObserverUpdated(x, y, updated, false);
            //     return;
            // }
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 7 && grid[index + UPDATED] < tick) {
                addPixel(x, y, OBSERVER_LEFT_ON);
                // setObserverUpdated(x, y, updated, false);
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON)) {
                addPixel(x, y, OBSERVER_LEFT_ON);
            }
            // addUpdatedChunk(x, y);
            // setObserverUpdated(x, y, updated, false);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["observer_left_on", "observer_up_on", "observer_right_on", "observer_down_on"],
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] >= tick - 14;
            if (x == gridWidth - 1) {
                addPixel(x, y, OBSERVER_LEFT_OFF);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            // if (isDeactivatedObserver(x, y)) {
            //     addPixel(x, y, OBSERVER_LEFT_OFF);
            //     setObserverUpdated(x, y, updated, true);
            //     return;
            // }
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 7 && grid[index + UPDATED] < tick) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON)) {
                // addPixel(x, y, OBSERVER_LEFT_ON);
                addUpdatedChunk(x, y);
                return;
            }
            addPixel(x, y, OBSERVER_LEFT_OFF);
            // setObserverUpdated(x, y, updated, true);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["observer_left_off", "observer_up_off", "observer_right_off", "observer_down_off"],
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] >= tick - 14;
            if (x == 0) {
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            // if (isDeactivatedObserver(x, y)) {
            //     // setObserverUpdated(x, y, updated, false);
            //     return;
            // }
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 7 && grid[index + UPDATED] < tick) {
                addPixel(x, y, OBSERVER_RIGHT_ON);
                // setObserverUpdated(x, y, updated, false);
            }
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF)) {
                addPixel(x, y, OBSERVER_RIGHT_ON);
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON)) {
                addPixel(x, y, OBSERVER_RIGHT_ON);
            }
            // addUpdatedChunk(x, y);
            // setObserverUpdated(x, y, updated, false);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["observer_left_on", "observer_up_on", "observer_right_on", "observer_down_on"],
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] >= tick - 14;
            if (x == 0) {
                addPixel(x, y, OBSERVER_RIGHT_OFF);
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            // if (isDeactivatedObserver(x, y)) {
            //     addPixel(x, y, OBSERVER_RIGHT_OFF);
            //     setObserverUpdated(x, y, updated, false);
            //     return;
            // }
            let index = (x - 1 + y * gridWidth) * gridStride;
            // if (grid[index + UPDATED] >= tick - 14 && grid[index + UPDATED] <= tick - 2) {
            // }
            if (grid[index + UPDATED] > tick - 7 && grid[index + UPDATED] < tick) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF)) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON)) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            addPixel(x, y, OBSERVER_RIGHT_OFF);
            // setObserverUpdated(x, y, updated, false);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["observer_left_off", "observer_up_off", "observer_right_off", "observer_down_off"],
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] >= tick - 14;
            if (y == gridHeight - 1) {
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            // if (isDeactivatedObserver(x, y)) {
            //     // setObserverUpdated(x, y, updated, false);
            //     return;
            // }
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 7 && grid[index + UPDATED] < tick) {
                addPixel(x, y, OBSERVER_UP_ON);
                // setObserverUpdated(x, y, updated, false);
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON)) {
                addPixel(x, y, OBSERVER_UP_ON);
            }
            // setObserverUpdated(x, y, updated, false);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["observer_left_on", "observer_up_on", "observer_right_on", "observer_down_on"],
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] >= tick - 14;
            if (y == gridHeight - 1) {
                addPixel(x, y, OBSERVER_UP_OFF);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            // if (isDeactivatedObserver(x, y)) {
            //     addPixel(x, y, OBSERVER_UP_OFF);
            //     setObserverUpdated(x, y, updated, true);
            //     return;
            // }
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 7 && grid[index + UPDATED] < tick) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON)) {
                addUpdatedChunk(x, y);
                return;
            }
            addPixel(x, y, OBSERVER_UP_OFF);
            // setObserverUpdated(x, y, updated, true);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["observer_left_off", "observer_up_off", "observer_right_off", "observer_down_off"],
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] >= tick - 14;
            if (y == 0) {
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            // if (isDeactivatedObserver(x, y)) {
            //     // setObserverUpdated(x, y, updated, false);
            //     return;
            // }
            let index = (x + (y - 1) * gridWidth) * gridStride;
            if (grid[index + UPDATED] > tick - 7 && grid[index + UPDATED] < tick) {
                addPixel(x, y, OBSERVER_DOWN_ON);
                // setObserverUpdated(x, y, updated, false);
            }
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF)) {
                addPixel(x, y, OBSERVER_DOWN_ON);
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON)) {
                addPixel(x, y, OBSERVER_DOWN_ON);
            }
            // addUpdatedChunk(x, y);
            // setObserverUpdated(x, y, updated, false);
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
        blastResistance: 0,
        rotatable: true,
        rotations: ["observer_left_on", "observer_up_on", "observer_right_on", "observer_down_on"],
        update5: function(x, y) {
            let updated = grid[(x + y * gridWidth) * gridStride + UPDATED] >= tick - 14;
            if (y == 0) {
                addPixel(x, y, OBSERVER_DOWN_OFF);
                setObserverUpdated(x, y, updated, true);
                return;
            }
            // if (isDeactivatedObserver(x, y)) {
            //     addPixel(x, y, OBSERVER_DOWN_OFF);
            //     setObserverUpdated(x, y, updated, true);
            //     return;
            // }
            let index = (x + (y - 1) * gridWidth) * gridStride;
            // if (grid[index + UPDATED] >= tick - 14 && grid[index + UPDATED] <= tick - 2) {
            //     addUpdatedChunk(x, y);
            //     // setObserverUpdated(x, y, updated, true);
            //     return;
            // }
            if (grid[index + UPDATED] > tick - 7 && grid[index + UPDATED] < tick) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF)) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON)) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            addPixel(x, y, OBSERVER_DOWN_OFF);
            // setObserverUpdated(x, y, updated, true);
        },
    },
    // lamp_on: {
    //     name: "Lamp",
    //     description: "Unrealistically flows and may or may not be wet",
    //     group: "Mechanical",
    //     subgroup: "Lamp",
    //     texture: new Float32Array([20, 9, 5, 5]),
    //     state: SOLID,
    //     flammability: 4,
    //     blastResistance: 0,
    //     update: function(x, y) {
    //         if (isDeactivated(x, y)) {
    //             addPixel(x, y, LAMP_OFF);
    //             return;
    //         }
    //         addUpdatedChunk(x, y);
    //     },
    // },
    // lamp_off: {
    //     name: "Lamp",
    //     description: "Unrealistically flows and may or may not be wet",
    //     group: "Mechanical",
    //     subgroup: "Lamp",
    //     texture: new Float32Array([25, 9, 5, 5]),
    //     state: SOLID,
    //     flammability: 4,
    //     blastResistance: 0,
    //     update: function(x, y) {
    //         if (!isDeactivated(x, y)) {
    //             addPixel(x, y, LAMP_ON);
    //             return;
    //         }
    //         addUpdatedChunk(x, y);
    //     },
    // },
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
        update: function(x, y) {
            let exploding = false;
            let index = (x + y * gridWidth) * gridStride;
            if (grid[index + ON_FIRE] || isTouching(x, y, [LAVA])) {
                exploding = true;
            }
            if (exploding) {
                explode(x, y, 5 * 5, 5 * 8, 2000);
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
        update: function(x, y) {
            explode(x, y, 5 * 5, 5 * 8, 2000);
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
        update: function(x, y) {
            explode(x, y, 15 * 15, 15 * 8, 3000);
        },
    },
    detonator: {
        name: "Detonator",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Detonator",
        texture: new Float32Array([0, 9, 5, 5]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        update: function(x, y) {
            if (isTouching(x, y, [GUNPOWDER, ACTIVATED_GUNPOWDER, C4, ACTIVATED_C4])) {
                explode(x, y, 3 * 3, 3 * 8, 800);
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
                    if (grid[index1 + ON_FIRE] == false) {
                        addFire(x1, y1, true);
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
                    if (grid[index1 + ON_FIRE] == false) {
                        addFire(x1, y1, true);
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
                    if (grid[index1 + ON_FIRE] == false) {
                        addFire(x1, y1, true);
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
                    if (grid[index1 + ON_FIRE] == false) {
                        addFire(x1, y1, true);
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
        blastResistance: 0,
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
                explode(x, y, 30 * 30, 30 * 8, 4000);
                // explode(x, y, 120 * 120, 120 * 4, 16000);
                // explode(x, y, 5 * 5, 5 * 4, 1600);
                // let changed = [];
                // addPixel(x, y, AIR);
                // addFire(x, y, true);
                // // let size = 150;
                // let size = 15;
                // for (let i = 0; i < 8 * size; i++) {
                //     let angle = i * Math.PI / size / 4;
                //     let power = size;
                //     raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                //         let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                //         let index1 = (x1 + y1 * gridWidth) * gridStride;
                //         power -= dist;
                //         if (power < 0) {
                //             return false;
                //         }
                //         let id = grid[index1 + ID];
                //         let blastResistance = pixels[id].blastResistance;
                //         // if (random() > blastResistance / power) {
                //         if (random() < 1 / blastResistance) {
                //             if (!changed[x1 + y1 * gridWidth]) {
                //                 changed[x1 + y1 * gridWidth] = true;
                //                 if (random() > blastResistance / power + 0.5) {
                //                     addFire(x1, y1, true);
                //                 }
                //                 if (id == AIR) {

                //                 }
                //                 else if (id == ASH) {
                //                     addPixel(x1, y1, AIR);
                //                 }
                //                 else if ((id == WATER || id == ICE || id == SNOW) && random() > 20 / power) {
                //                     addPixel(x1, y1, STEAM);
                //                 }
                //                 else if (id == NUKE) {
                //                     addPixel(x1, y1, ACTIVATED_NUKE);
                //                 }
                //                 else if (id == ACTIVATED_NUKE) {

                //                 }
                //                 // else if (random() < 40 / power) {
                //                 else if (random() < 0.5) {
                //                     if (id == CONCRETE || id == STONE || id == BASALT || id == BRICKS) {
                //                         addPixel(x1, y1, GRAVEL);
                //                     }
                //                     else {
                //                         addPixel(x1, y1, ASH);
                //                     }
                //                 }
                //                 else {
                //                     addPixel(x1, y1, AIR);
                //                 }
                //             }
                //             power -= blastResistance / 40;
                //         }
                //         else {
                //             power -= blastResistance / 5;
                //         }
                //         power += dist;
                //         return true;
                //     });
                // }
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
        blastResistance: 0,
        update: function(x, y) {
            // explode(x, y, 30 * 30, 15, 4000);
            explode(x, y, 30 * 30, 30 * 8, 4000);
            // let changed = [];
            // addPixel(x, y, AIR);
            // addFire(x, y, true);
            // // let size = 150;
            // let size = 15;
            // for (let i = 0; i < 8 * size; i++) {
            //     let angle = i * Math.PI / size / 4;
            //     let power = size;
            //     raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
            //         let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
            //         let index1 = (x1 + y1 * gridWidth) * gridStride;
            //         power -= dist;
            //         if (power < 0) {
            //             return false;
            //         }
            //         let id = grid[index1 + ID];
            //         let blastResistance = pixels[id].blastResistance;
            //         if (random() > blastResistance / power) {
            //             if (!changed[x1 + y1 * gridWidth]) {
            //                 changed[x1 + y1 * gridWidth] = true;
            //                 if (random() > blastResistance / power + 0.5) {
            //                     addFire(x1, y1, true);
            //                 }
            //                 if (id == AIR) {

            //                 }
            //                 else if (id == ASH) {
            //                     addPixel(x1, y1, AIR);
            //                 }
            //                 else if ((id == WATER || id == ICE || id == SNOW) && random() > 20 / power) {
            //                     addPixel(x1, y1, STEAM);
            //                 }
            //                 else if (id == NUKE) {
            //                     addPixel(x1, y1, ACTIVATED_NUKE);
            //                 }
            //                 else if (id == ACTIVATED_NUKE) {

            //                 }
            //                 // else if (random() < 40 / power) {
            //                 else if (random() < 0.5) {
            //                     if (id == CONCRETE || id == STONE || id == BASALT || id == BRICKS) {
            //                         addPixel(x1, y1, GRAVEL);
            //                     }
            //                     else {
            //                         addPixel(x1, y1, ASH);
            //                     }
            //                 }
            //                 else {
            //                     addPixel(x1, y1, AIR);
            //                 }
            //             }
            //             power -= blastResistance / 40;
            //         }
            //         else {
            //             power -= blastResistance / 5;
            //         }
            //         power += dist;
            //         return true;
            //     });
            // }
        },
    },
    nuke_defuser: {
        name: "Nuke Defuser",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Nuke",
        texture: new Float32Array([33, 2, 3, 3]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
    },
    deleter: {
        name: "Deleter",
        description: "Unrealistically flows and may or may not be wet",
        group: "Destruction",
        subgroup: "Deleter",
        texture: new Float32Array([8, 5, 4, 4]),
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
        blastResistance: 1600,
        update: function(x, y) {
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == AIR) {
                    if (random() < 0.5) {
                        addPixel(x1, y1, LAG_SPIKE_GENERATOR);
                    }
                    else if (random() < 0.025) {
                        addPixel(x1, y1, WATER_PUMP);
                    }
                    else if (random() < 0.025) {
                        addPixel(x1, y1, CLONER_DOWN);
                    }
                }
                else if (grid[index1 + ID] == LAG_SPIKE_GENERATOR) {
                    if (random() < 0.005) {
                        // addPixel(x1, y1, NUKE);
                        let size = 8;
                        explode(x1, y1, size * size, size * 8, 10000);
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
        blastResistance: 1750,
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
        blastResistance: 1750,
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
                    }
                }
                if (x != gridWidth - 1) {
                    pushRight(x + 1, y, x, y, 2);
                    if (grid[(x + 1 + y * gridWidth) * gridStride + ID] == AIR) {
                        addPixel(x + 1, y, ACTIVATED_SPONGY_RICE);
                    }
                }
                if (y != 0) {
                    pushUp(x, y - 1, x, y, 2);
                    if (grid[(x + (y - 1) * gridWidth) * gridStride + ID] == AIR) {
                        addPixel(x, y - 1, ACTIVATED_SPONGY_RICE);
                    }
                }
                if (y != gridHeight - 1) {
                    pushDown(x, y + 1, x, y, 2);
                    if (grid[(x + (y + 1) * gridWidth) * gridStride + ID] == AIR) {
                        addPixel(x, y + 1, ACTIVATED_SPONGY_RICE);
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
                }
            }
            if (x != gridWidth - 1) {
                pushRight(x + 1, y, x, y, 2);
                if (grid[(x + 1 + y * gridWidth) * gridStride + ID] == AIR) {
                    addPixel(x + 1, y, ACTIVATED_SPONGY_RICE);
                }
            }
            if (y != 0) {
                pushUp(x, y - 1, x, y, 2);
                if (grid[(x + (y - 1) * gridWidth) * gridStride + ID] == AIR) {
                    addPixel(x, y - 1, ACTIVATED_SPONGY_RICE);
                }
            }
            if (y != gridHeight - 1) {
                pushDown(x, y + 1, x, y, 2);
                if (grid[(x + (y + 1) * gridWidth) * gridStride + ID] == AIR) {
                    addPixel(x, y + 1, ACTIVATED_SPONGY_RICE);
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
            let functions = [addPixel, addFire, addUpdatedChunk, move, fillEllipse, pushLeft, pushRight, pushUp, pushDown];
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
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * 2) == 0 ? true : false);
                }
                else if (f == fillEllipse) {
                    let f2 = functions[Math.floor(Math.random() * functions.length)];
                    let pixel = Math.floor(Math.random() * pixels.length);
                    // f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), function(x1, y1) {
                    f(Math.floor(Math.random() * gridWidth), Math.floor(Math.random() * gridHeight), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), function(x1, y1) {
                        addPixel(x1, y1, pixel);
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
                }
                else if (id == TRIANGLE) {
                    addPixel(x - 1, y + 1, AIR);
                }
            }
            if (x != gridWidth - 1) {
                let id = grid[(x + 1 + (y + 1) * gridWidth) * gridStride + ID];
                if (id == AIR) {
                    addPixel(x + 1, y + 1, TRIANGLE);
                }
                else if (id == TRIANGLE) {
                    addPixel(x + 1, y + 1, AIR);
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
                    grid[index + ID] = AIR;
                    move(x, y, x1, y1);
                }
            });
        },
    },
    laser_left: {
        name: "Laser (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Lasers",
        subgroup: "Goal",
        texture: new Float32Array([108, 14, 6, 6]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["laser_left", "laser_up", "laser_right", "laser_down"],
        update: function(x, y) {
            let path = getLaserPath(x, y, 0);
            let x1 = path[path.length - 1][0];
            let y1 = path[path.length - 1][1];
            if (isOnGrid(x1, y1)) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] != LASER_SCATTERER) {
                    // if (random() < (pixels[grid[index1 + ID]].flammability + (20 - pixel.blastResistance)) / 100) {
                    if (random() < pixels[grid[index1 + ID]].flammability / 100) {
                        addFire(x1, y1, true);
                    }
                    if (random() < 10 / pixels[grid[index1 + ID]].blastResistance) {
                        if (grid[index1 + ID] == LASER_LEFT || grid[index1 + ID] == LASER_UP || grid[index1 + ID] == LASER_RIGHT || grid[index1 + ID] == LASER_DOWN) {
                            explode(x1, y1, 5 * 5, 5 * 8, 3000);
                        }
                        addPixel(x1, y1, AIR);
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
        subgroup: "Goal",
        texture: new Float32Array([114, 14, 6, 6]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["laser_left", "laser_up", "laser_right", "laser_down"],
        update: function(x, y) {
            let path = getLaserPath(x, y, 1);
            let x1 = path[path.length - 1][0];
            let y1 = path[path.length - 1][1];
            if (isOnGrid(x1, y1)) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] != LASER_SCATTERER) {
                    // if (random() < (pixels[grid[index1 + ID]].flammability + (20 - pixel.blastResistance)) / 100) {
                    if (random() < pixels[grid[index1 + ID]].flammability / 100) {
                        addFire(x1, y1, true);
                    }
                    if (random() < 10 / pixels[grid[index1 + ID]].blastResistance) {
                        if (grid[index1 + ID] == LASER_LEFT || grid[index1 + ID] == LASER_UP || grid[index1 + ID] == LASER_RIGHT || grid[index1 + ID] == LASER_DOWN) {
                            explode(x1, y1, 5 * 5, 5 * 8, 3000);
                        }
                        addPixel(x1, y1, AIR);
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
        subgroup: "Goal",
        texture: new Float32Array([120, 14, 6, 6]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["laser_left", "laser_up", "laser_right", "laser_down"],
        update: function(x, y) {
            let path = getLaserPath(x, y, 2);
            let x1 = path[path.length - 1][0];
            let y1 = path[path.length - 1][1];
            if (isOnGrid(x1, y1)) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] != LASER_SCATTERER) {
                    // if (random() < (pixels[grid[index1 + ID]].flammability + (20 - pixel.blastResistance)) / 100) {
                    if (random() < pixels[grid[index1 + ID]].flammability / 100) {
                        addFire(x1, y1, true);
                    }
                    if (random() < 10 / pixels[grid[index1 + ID]].blastResistance) {
                        if (grid[index1 + ID] == LASER_LEFT || grid[index1 + ID] == LASER_UP || grid[index1 + ID] == LASER_RIGHT || grid[index1 + ID] == LASER_DOWN) {
                            explode(x1, y1, 5 * 5, 5 * 8, 3000);
                        }
                        addPixel(x1, y1, AIR);
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
        subgroup: "Goal",
        texture: new Float32Array([126, 14, 6, 6]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        rotatable: true,
        rotations: ["laser_left", "laser_up", "laser_right", "laser_down"],
        update: function(x, y) {
            let path = getLaserPath(x, y, 3);
            let x1 = path[path.length - 1][0];
            let y1 = path[path.length - 1][1];
            if (isOnGrid(x1, y1)) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] != LASER_SCATTERER) {
                    // if (random() < (pixels[grid[index1 + ID]].flammability + (20 - pixel.blastResistance)) / 100) {
                    if (random() < pixels[grid[index1 + ID]].flammability / 100) {
                        addFire(x1, y1, true);
                    }
                    if (random() < 10 / pixels[grid[index1 + ID]].blastResistance) {
                        if (grid[index1 + ID] == LASER_LEFT || grid[index1 + ID] == LASER_UP || grid[index1 + ID] == LASER_RIGHT || grid[index1 + ID] == LASER_DOWN) {
                            explode(x1, y1, 5 * 5, 5 * 8, 3000);
                        }
                        addPixel(x1, y1, AIR);
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
        texture: new Float32Array([12, 5, 4, 4]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
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
            addUpdatedChunk(x, y);
        },
    },
    placement_restriction: {
        name: "Placement Restriction",
        description: "Unrealistically flows and may or may not be wet",
        group: "Puzzles",
        subgroup: "Placement Restriction",
        texture: new Float32Array([240, 140, 50, 50]),
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
        blastResistance: 0,
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
    pixels.push(pixelData[i]);
    pixels[pixels.length - 1].id = i;
    eval("window." + i.toUpperCase() + " = " + (pixels.length - 1) + ";");
}
for (let i = 0; i < pixels.length; i++) {
    if (pixels[i].rotatable) {
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
}

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
    else {
        ctx.drawImage(pixelTexture, pixels[i].texture[0], pixels[i].texture[1], pixels[i].texture[2], pixels[i].texture[3], 0, 0, 48, 48);
    }
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
            showTooltip(pixels[i].group, pixels[i].groupDescription);
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
            updatePixelImage();
        };
        subgroupImg.onmouseover = function() {
            let id = pixelDivToId[i];
            showTooltip(pixels[id].name, pixels[id].description);
            moveTooltip();
        };
        subgroupImg.onmouseout = function() {
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
            updatePixelImage();
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

// buh this name is kind of bad
function updatePixelImage() {
    selectedDiv.classList.remove("pixelSelected");
    selectedDiv = pixelImages[pixelIdToDiv[brushPixel]];
    selectedDiv.classList.add("pixelSelected");
};

let pixelInventory = [];
let pixelInventoryUpdates = [];
function resetPixelInventory() {
    if (currentPuzzle == null) {
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
    else {
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
};
function updatePixelInventory() {
    for (let i in pixelInventoryUpdates) {
        let div = pixelIdToDiv[i];
        if (pixelInventory[i] != 0 && !pixelImages[div].classList.contains("shown")) {
            let pixelSubgroupIds = [];
            for (let j = 0; j < pixels.length; j++) {
                if (j < Number(i)) {
                    continue;
                }
                if (pixels[j].subgroup == pixels[i].subgroup) {
                    pixelSubgroupIds.push(j);
                }
            }
            for (let j = 0; j < pixels.length; j++) {
                if (j < Number(i)) {
                    continue;
                }
                if (pixelInventory[j] == 0) {
                    continue;
                }
                if (pixels[j].subgroup != pixels[i].subgroup) {
                    continue;
                }
                let div = pixelSubgroupIds.shift();
                pixelDivToId[div] = j;
                pixelIdToDiv[j] = div;
                pixelDivs[div].classList.add("shown");
                pixelAmounts[div].style.display = "";
                pixelAmounts[div].innerText = pixelInventory[j] == Infinity ? "∞" : pixelInventory[j];
                pixelImages[div].style.backgroundImage = "url(" + pixelImageData[j] + ")";
                if (pixelImages[div].classList.contains("disabled")) {
                    pixelImages[div].classList.remove("disabled");
                }
                pixelGroups[pixels[j].group].style.display = "";
                pixelSubgroups[pixels[j].group][pixels[j].subgroup].style.display = "";
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

export { pixels, addPixel, addFire, addUpdatedChunk, addUpdatedChunk2, resetPushPixels, pixelTexture, pixelInventory, pixelInventoryUpdates, updatePixelImage, resetPixelInventory, updatePixelInventory };