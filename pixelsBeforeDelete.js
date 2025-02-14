import { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, tick, modal, setBrushPixel, showTooltip, hideTooltip, moveTooltip } from "./game.js";
// import { imageBitmap } from "./renderer.js";

const response = await fetch("pixels.png");
const imageBitmap = await createImageBitmap(await response.blob());
const ID = 0;
const ON_FIRE = 1;
const UPDATED = 2;
const COLOR_R = 3;
const COLOR_G = 4;
const COLOR_B = 5;
const COLOR_A = 6;
const VEL_X = 5;
const VEL_Y = 6;

const GAS = 0;
const LIQUID = 1;
const SOLID = 2;

function isOnGrid(x, y) {
    return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
};
function isAir(x, y) {
    return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + ID] == AIR;
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
    if (y < gridWidth - 1) {
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
    if (y < gridWidth - 1) {
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
    if (y < gridWidth - 1) {
        action(x, y + 1);
    }
};
function isTouchingDiagonal(x, y, array) {
    for (let i = Math.max(y - 1, 0); i <= Math.min(y + 1, gridHeight - 1); i++) {
        for (let j = Math.max(x - 1, 0); j <= Math.min(x + 1, gridWidth - 1); j++) {
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
    //         let r = Math.random();
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
    let index = (Math.floor(x / chunkWidth) + Math.floor(y / chunkHeight) * chunkXAmount) * chunkStride;
    nextChunks[index] = Math.min(nextChunks[index], x);
    nextChunks[index + 1] = Math.max(nextChunks[index + 1], x);
    nextChunks[index + 2] = Math.min(nextChunks[index + 2], y);
    nextChunks[index + 3] = Math.max(nextChunks[index + 3], y);

    let buffer = 2;

    if (x >= buffer && x % chunkWidth < buffer) {
        nextChunks[index - chunkStride] = Math.min(nextChunks[index - chunkStride], x);
        nextChunks[index - chunkStride + 1] = Math.max(nextChunks[index - chunkStride + 1], x - 2);
        nextChunks[index - chunkStride + 2] = Math.min(nextChunks[index - chunkStride + 2], y);
        nextChunks[index - chunkStride + 3] = Math.max(nextChunks[index - chunkStride + 3], y);
    }
    if (x < gridWidth - buffer && x % chunkWidth >= chunkWidth - buffer) {
        nextChunks[index + chunkStride] = Math.min(nextChunks[index + chunkStride], x + 2);
        nextChunks[index + chunkStride + 1] = Math.max(nextChunks[index + chunkStride + 1], x);
        nextChunks[index + chunkStride + 2] = Math.min(nextChunks[index + chunkStride + 2], y);
        nextChunks[index + chunkStride + 3] = Math.max(nextChunks[index + chunkStride + 3], y);
    }
    if (y >= buffer && y % chunkHeight < buffer) {
        nextChunks[index - chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkXAmount * chunkStride], x);
        nextChunks[index - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkXAmount * chunkStride + 1], x);
        nextChunks[index - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkXAmount * chunkStride + 2], y);
        nextChunks[index - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkXAmount * chunkStride + 3], y - 2);
    }
    if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
        nextChunks[index + chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkXAmount * chunkStride], x);
        nextChunks[index + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkXAmount * chunkStride + 1], x);
        nextChunks[index + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkXAmount * chunkStride + 2], y + 2);
        nextChunks[index + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkXAmount * chunkStride + 3], y);
    }
    if (x >= buffer && x % chunkWidth < buffer) {
        if (y >= buffer && y % chunkHeight < buffer) {
            nextChunks[index - chunkStride - chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkStride - chunkXAmount * chunkStride], x);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 1], x - 2);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 2], y);
            nextChunks[index - chunkStride - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkStride - chunkXAmount * chunkStride + 3], y - 2);
        }
        if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
            nextChunks[index - chunkStride + chunkXAmount * chunkStride] = Math.min(nextChunks[index - chunkStride + chunkXAmount * chunkStride], x);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 1], x - 2);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 2], y + 2);
            nextChunks[index - chunkStride + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index - chunkStride + chunkXAmount * chunkStride + 3], y);
        }
    }
    if (x < gridWidth - buffer && x % chunkWidth >= chunkWidth - buffer) {
        if (y >= buffer && y % chunkHeight < buffer) {
            nextChunks[index + chunkStride - chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkStride - chunkXAmount * chunkStride], x + 2);
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 1], x);
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 2], y);
            nextChunks[index + chunkStride - chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkStride - chunkXAmount * chunkStride + 3], y - 2);
        }
        if (y < gridHeight - buffer && y % chunkHeight >= chunkHeight - buffer) {
            nextChunks[index + chunkStride + chunkXAmount * chunkStride] = Math.min(nextChunks[index + chunkStride + chunkXAmount * chunkStride], x + 2);
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 1] = Math.max(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 1], x);
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 2] = Math.min(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 2], y + 2);
            nextChunks[index + chunkStride + chunkXAmount * chunkStride + 3] = Math.max(nextChunks[index + chunkStride + chunkXAmount * chunkStride + 3], y);
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
            side = Math.round(Math.random()) * 2 - 1;
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

        let moveStopped = Math.random() > moveChance;

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
    let index = (x + y * gridWidth) * gridStride;
    let index1 = (x1 + y1 * gridWidth) * gridStride;
    addUpdatedChunk(x, y);
    addUpdatedChunk(x1, y1);
    let data0 = grid[index + 0]; // id
    let data1 = grid[index + 1]; // on fire
    let data2 = grid[index + 2]; // updated
    // let data3 = grid[index + 3]; // r
    // let data4 = grid[index + 4]; // g
    // let data5 = grid[index + 5]; // b
    // let data6 = grid[index + 6]; // a
    grid[index + 0] = grid[index1 + 0];
    grid[index + 1] = grid[index1 + 1];
    // grid[index + 2] = grid[index1 + 2];
    grid[index + 2] = tick;
    // grid[index + 3] = grid[index1 + 3];
    // grid[index + 4] = grid[index1 + 4];
    // grid[index + 5] = grid[index1 + 5];
    // grid[index + 6] = grid[index1 + 6];
    grid[index1 + 0] = data0;
    grid[index1 + 1] = data1;
    // grid[index1 + 2] = data2;
    grid[index1 + 2] = tick;
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
                if (Math.random() < 0.5) {
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
                if (Math.random() < 0.5) {
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


let pushX = -1;
let pushY = -1;
let pushPixels = [];
let failedPushPixels = new Int32Array();
let workedPushPixels = new Int32Array();

function resetFailedPushPixels() {
    let failedPushPixelsArray = [];
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            failedPushPixelsArray.push(0);
            failedPushPixelsArray.push(0);
        }
    }
    failedPushPixels = new Int32Array(failedPushPixelsArray);
    workedPushPixels = new Int32Array(failedPushPixelsArray);
    // failedPushPixels2 = new Int32Array(failedPushPixelsArray);
};

// there are spaghetti push comments

function tryPushLeft(x, y, pushPistons) {
    let queue = [x + y * gridWidth + gridWidth * gridHeight];
    let worked = true;
    let pushPixels2 = [];
    push: while (queue.length > 0) {
        let index = queue.pop();
        let stronglyConnected = index > gridWidth * gridHeight;
        index = index % (gridWidth * gridHeight);
        let x1 = index % gridWidth;
        let y1 = (index - x1) / gridWidth;
        // loop through
        // check for air
        // recursive for slime
        if (x1 == pushX && y1 == pushY) {
            continue;
        }
        function pushFail(x2) {
            for (let x3 = x1; x3 >= x2; x3--) {
                // pushPixels[y][x2] = 3;
                failedPushPixels[x3 + y1 * gridWidth] = tick;
            }
            worked = false;
        };
        let xPos = -1;
        let x2;
        for (x2 = x1; x2 >= 0; x2--) {
            if (x2 == pushX && y1 == pushY) {
                pushFail(x2);
                break push;
            }
            let index1 = (x2 + y1 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            if (id == AIR) {
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
            if (grid[index1 + UPDATED] == tick) {
                if (x2 != x1) {
                    pushFail(x2 + 1);
                    // break;
                    break push;
                    // return false;
                }
                // return true;
                continue push;
            }
            if (pushPixels2[y1] == null) {
                pushPixels2[y1] = [];
            }
            if (pushPixels2[y1][x2] == null) {
                if (!pixels[id].pushable) {
                    pushFail(x2);
                    break push;
                }
                if (!pushPistons && id == PISTON_RIGHT) {
                    pushFail(x2);
                    break push;
                }
            }
            else {
                xPos = x2;
                break;
            }
        }
        if (xPos == -1) {
            pushFail(x2);
            break push;
        }
        for (let x2 = x1; x2 > xPos; x2--) {
            pushPixels2[y1][x2] = stronglyConnected ? 2 : 1;
        }
        for (let x2 = x1; x2 > xPos; x2--) {
            let index1 = (x2 + y1 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            if (pixels[id].sticky) {
                if (y1 > 0) {
                    let slimeX = x2;
                    let slimeY = y1 - 1;
                    if (grid[(slimeX + slimeY * gridWidth) * gridStride + ID] != AIR && (pushPixels2[slimeY] == null || pushPixels2[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[(slimeX + slimeY * gridWidth) * gridStride + ID]].sticky ? (gridWidth * gridHeight) : 0));
                    }
                }
                if (y1 < gridHeight - 1) {
                    let slimeX = x2;
                    let slimeY = y1 + 1;
                    if (grid[(slimeX + slimeY * gridWidth) * gridStride + ID] != AIR && (pushPixels2[slimeY] == null || pushPixels2[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[(slimeX + slimeY * gridWidth) * gridStride + ID]].sticky ? (gridWidth * gridHeight) : 0));
                    }
                }
                if (x2 == x1) {
                    if (x2 < gridWidth - 1) {
                        let slimeX = x2 + 1;
                        let slimeY = y1;
                        if (grid[(slimeX + slimeY * gridWidth) * gridStride + ID] != AIR && (pushPixels2[slimeY] == null || pushPixels2[slimeY][slimeX] == null)) {
                            queue.push(slimeX + slimeY * gridWidth + (pixels[grid[(slimeX + slimeY * gridWidth) * gridStride + ID]].sticky ? (gridWidth * gridHeight) : 0));
                        }
                    }
                }
            }
        }
    }
    if (worked) {
        for (let i in pushPixels2) {
            for (let j in pushPixels2[i]) {
                if (pushPixels2[i][j] != 2 && pushPixels2[i][j] != 1) {
                    continue;
                }
                i = Number(i);
                j = Number(j);
                workedPushPixels[j + i * gridWidth] = tick;
            }
        }
    }
    else {
        // prevent cloners from marking themselves as unpushable
        if (pushPixels2[pushY] == null || pushPixels2[pushY][pushX] == null) {
            for (let i in pushPixels2) {
                for (let j in pushPixels2[i]) {
                    if (pushPixels2[i][j] != 2 && pushPixels2[i][j] != 3) {
                        continue;
                    }
                    i = Number(i);
                    j = Number(j);
                    if (failedPushPixels[j + i * gridWidth] == tick) {
                        alert("bnuh")
                    }
                    failedPushPixels[j + i * gridWidth] = tick;
                    // addPixel(j, i, SAND)
                }
            }
        }
    }
};

function pushLeftCheck(x, y, canCollapse) {
    let pushPixels = [];
    let queue = [x + y * gridWidth + gridWidth * gridHeight];
    let worked = true;
    let hasCollapsable = false;
    push: while (queue.length > 0) {
        let index = queue.pop();
        let stronglyConnected = index > gridWidth * gridHeight;
        index = index % (gridWidth * gridHeight);
        let x1 = index % gridWidth;
        let y1 = (index - x1) / gridWidth;
        if (x1 == pushX && y1 == pushY) {
            continue;
        }
        function pushFail(x2) {
            for (let x3 = x1; x3 >= x2; x3--) {
                // pushPixels[y][x2] = 3;
                failedPushPixels[x3 + y1 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] = tick;
            }
            worked = false;
        };
        let xPos = -1;
        let x2;
        for (x2 = x1; x2 >= 0; x2--) {
            if (x2 == pushX && y1 == pushY) {
                pushFail(x2);
                break push;
            }
            let index1 = (x2 + y1 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            if (id == AIR) {
                xPos = x2;
                break;
            }
            if (id == COLLAPSABLE && x2 != x1) {
                hasCollapsable = true;
                if (canCollapse != 0) {
                    if (canCollapse == 2) {
                        xPos = x2;
                        break;
                    }
                    if (failedPushPixels[x2 + y1 * gridWidth + gridWidth * gridHeight] == tick) {
                        xPos = x2;
                        break;
                    }
                    else if (workedPushPixels[x2 + y1 * gridWidth + gridWidth * gridHeight] != tick) {
                        // pushLeft(x2, y1);
                        // // tryPushLeft(x2, y1, pushPistons);

                        // see if we can push with collapsing
                        // if we cannot, then we collapse this one
                        let [worked1, pushPixels1] = pushLeftCheck(x2, y1, 2);
                        if (worked1) {
                            for (let i in pushPixels1) {
                                for (let j in pushPixels1[i]) {
                                    if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 1) {
                                        continue;
                                    }
                                    i = Number(i);
                                    j = Number(j);
                                    workedPushPixels[j + i * gridWidth + gridWidth * gridHeight] = tick;
                                    console.log(j, i);
                                }
                            }
                        }
                        else {
                            if (pushPixels1[pushY] == null || pushPixels1[pushY][pushX] == null) {
                                for (let i in pushPixels1) {
                                    for (let j in pushPixels1[i]) {
                                        if (pushPixels1[i][j] != 2 && pushPixels1[i][j] != 3) {
                                            continue;
                                        }
                                        i = Number(i);
                                        j = Number(j);
                                        if (failedPushPixels[j + i * gridWidth + gridWidth * gridHeight] == tick) {
                                            modal("Push error", "Collapsable failed push pixel setter", "error");
                                        }
                                        failedPushPixels[j + i * gridWidth + gridWidth * gridHeight] = tick;
                                        // addPixel(j, i, SAND)
                                    }
                                }
                            }
                            xPos = x2;
                            break;
                        }
                        // if (failedPushPixels[x2 + y1 * gridWidth] == tick) {
                        //     xPos = x2;
                        //     break;
                        // }
                    }
                }
            }
            if (failedPushPixels[x2 + y1 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] == tick) {
                if (x2 != x1) {
                    pushFail(x2 + 1);
                }
                worked = false;
                break push;
            }
            if (canCollapse == 0) {
                if (workedPushPixels[x2 + y1 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] == tick) {
                    if (x2 != x1) {
                        pushFail(x2 + 1);
                        modal("Push error", "Tried to push already pushed pixel", "error");
                        break push;
                    }
                    continue push;
                }
            }
            if (grid[index1 + UPDATED] == tick) {
                if (x2 != x1) {
                    pushFail(x2 + 1);
                    modal("Push error", "Tried to push updated pixel (this might not be an error)", "error");
                    break push;
                }
                continue push;
            }
            if (pushPixels[y1] == null) {
                pushPixels[y1] = [];
            }
            if (pushPixels[y1][x2] == null) {
                if (!pixels[id].pushable) {
                    pushFail(x2);
                    break push;
                }
            }
            else {
                xPos = x2;
                break;
            }
        }
        if (xPos == -1) {
            pushFail(x2);
            break push;
        }
        for (let x2 = x1; x2 > xPos; x2--) {
            let index1 = (x2 + y1 * gridWidth) * gridStride;
            let id = grid[index1 + ID];
            pushPixels[y1][x2] = stronglyConnected ? 2 : 1;
            if (pixels[id].sticky) {
                if (y1 > 0) {
                    let slimeX = x2;
                    let slimeY = y1 - 1;
                    if (grid[(slimeX + slimeY * gridWidth) * gridStride + ID] != AIR && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[(slimeX + slimeY * gridWidth) * gridStride + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                if (y1 < gridHeight - 1) {
                    let slimeX = x2;
                    let slimeY = y1 + 1;
                    if (grid[(slimeX + slimeY * gridWidth) * gridStride + ID] != AIR && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                        queue.push(slimeX + slimeY * gridWidth + (pixels[grid[(slimeX + slimeY * gridWidth) * gridStride + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                    }
                }
                if (x2 == x1) {
                    if (x2 < gridWidth - 1) {
                        let slimeX = x2 + 1;
                        let slimeY = y1;
                        if (grid[(slimeX + slimeY * gridWidth) * gridStride + ID] != AIR && (pushPixels[slimeY] == null || pushPixels[slimeY][slimeX] == null)) {
                            queue.push(slimeX + slimeY * gridWidth + (pixels[grid[(slimeX + slimeY * gridWidth) * gridStride + ID]].sticky && stronglyConnected ? (gridWidth * gridHeight) : 0));
                        }
                    }
                }
            }
            else {
                stronglyConnected = false;
            }
        }
    }
    return [worked, pushPixels, hasCollapsable];
};
function pushLeft(x, y) {
    let [worked, pushPixels, hasCollapsable] = pushLeftCheck(x, y, 0);
    if (worked) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                i = Number(i);
                j = Number(j);
                workedPushPixels[j + i * gridWidth] = tick;
                let index = (j - 1 + i * gridWidth) * gridStride;
                if (grid[index + ID] == COLLAPSABLE) {
                    addPixel(j - 1, i, AIR);
                }
                move(j, i, j - 1, i);
            }
        }
        pushX = -1;
        pushY = -1;
        pushPixels = [];
        return true;
    }
    else {
        // prevent cloners from marking themselves as unpushable
        if (pushPixels[pushY] == null || pushPixels[pushY][pushX] == null) {
            for (let i in pushPixels) {
                for (let j in pushPixels[i]) {
                    if (pushPixels[i][j] != 2 && pushPixels[i][j] != 3) {
                        continue;
                    }
                    i = Number(i);
                    j = Number(j);
                    if (failedPushPixels[j + i * gridWidth] == tick) {
                        modal("Push error", "Failed push pixel setter", "error");
                    }
                    failedPushPixels[j + i * gridWidth] = tick;
                    // addPixel(j, i, SAND)
                }
            }
        }
        if (hasCollapsable) {
            [worked, pushPixels, hasCollapsable] = pushLeftCheck(x, y, 1);
            if (worked) {
                for (let i in pushPixels) {
                    for (let j in pushPixels[i]) {
                        if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                            continue;
                        }
                        i = Number(i);
                        j = Number(j);
                        let index = (j - 1 + i * gridWidth) * gridStride;
                        if (grid[index + ID] == COLLAPSABLE) {
                            addPixel(j - 1, i, AIR);
                        }
                        move(j, i, j - 1, i);
                    }
                }
                pushX = -1;
                pushY = -1;
                pushPixels = [];
                return true;
            }
        }
    }
    pushX = -1;
    pushY = -1;
    pushPixels = [];
    return false;
};
// function pushLeft(x, y, pushPistons) {
//     pushPistons = pushPistons;
//     canCollapse = false;
//     let worked = pushLeftCheck(x, y, true);
//     if (!worked) {
//         // prevent cloners from marking themselves as unpushable
//         if (pushPixels[pushY] == null || pushPixels[pushY][pushX] == null) {
//             for (let i in pushPixels) {
//                 for (let j in pushPixels[i]) {
//                     if (pushPixels[i][j] != 2 && pushPixels[i][j] != 3) {
//                         continue;
//                     }
//                     i = Number(i);
//                     j = Number(j);
//                     if (failedPushPixels[j + i * gridWidth] == tick) {
//                         alert("bnuh")
//                     }
//                     failedPushPixels[j + i * gridWidth] = tick;
//                     // addPixel(j, i, SAND)
//                 }
//             }
//         }
//         pushPixels = [];
//         canCollapse = true;
//         worked = pushLeftCheck(x, y, true);
//     }
//     if (!worked) {
//         if (pushPixels[pushY] == null || pushPixels[pushY][pushX] == null) {
//             for (let i in pushPixels) {
//                 for (let j in pushPixels[i]) {
//                     if (pushPixels[i][j] != 2 && pushPixels[i][j] != 3) {
//                         continue;
//                     }
//                     i = Number(i);
//                     j = Number(j);
//                     failedPushPixels[j + i * gridWidth + gridWidth * gridHeight] = tick;
//                 }
//             }
//         }
//     }
//     if (worked) {
//         for (let i in pushPixels) {
//             for (let j in pushPixels[i]) {
//                 if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
//                     continue;
//                 }
//                 i = Number(i);
//                 j = Number(j);
//                 let index = (j - 1 + i * gridWidth) * gridStride;
//                 if (grid[index + ID] == COLLAPSABLE) {
//                     addPixel(j - 1, i, AIR);
//                 }
//                 move(j, i, j - 1, i);
//             }
//         }
//         pushX = -1;
//         pushY = -1;
//         pushPixels = [];
//         return true;
//     }
//     pushX = -1;
//     pushY = -1;
//     pushPixels = [];
//     return false;
// };
function pushLeftCheck1(x, y, stronglyConnected) {
    if (x == pushX && y == pushY) {
        return true;
    }
    function pushFail(x1) {
        for (let x2 = x; x2 >= x1; x2--) {
            pushPixels[y][x2] = 3;
        }
    };
    let xPos = -1;
    let collapsableXPos = -1;
    let x1;
    for (x1 = x; x1 >= 0; x1--) {
        if (x1 == pushX && y == pushY) {
            if (collapsableXPos != -1) {
                break;
            }
            pushFail(x1);
            return false;
        }
        let index = (x1 + y * gridWidth) * gridStride;
        let id = grid[index + ID];
        if (id == AIR) {
            xPos = x1;
            break;
        }
        // if (canCollapse && id == COLLAPSABLE && x1 != x && failedPushPixels[x1 + y * gridWidth] == tick) {
        if (canCollapse && id == COLLAPSABLE && x1 != x) {
            collapsableXPos = x1;
            // xPos = x1;
            // break;
        }
        if (failedPushPixels[x1 + y * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] == tick) {
            if (collapsableXPos != -1) {
                break;
            }
            if (x1 != x) {
                pushFail(x1 + 1);
            }
            return false;
        }
        // if (canCollapse && failedPushPixels[x1 + y * gridWidth + gridWidth * gridHeight] == tick) {
        //     if (collapsableXPos != -1) {
        //         break;
        //     }
        // }
        if (grid[index + UPDATED] == tick) {
            if (collapsableXPos != -1) {
                break;
            }
            if (x1 != x) {
                return false;
            }
            // if (collapsableXPos != -1) {
            //     alert("how buh impossible state")
            //     break;
            // }
            return true;
        }
        if (pushPixels[y] == null) {
            pushPixels[y] = [];
        }
        if (pushPixels[y][x1] == null) {
            if (!pixels[id].pushable) {
                if (collapsableXPos != -1) {
                    break;
                }
                pushFail(x1);
                return false;
            }
            if (!pushPistons && id == PISTON_RIGHT) {
                if (collapsableXPos != -1) {
                    break;
                }
                pushFail(x1);
                return false;
            }
        }
        else {
            xPos = x1;
            break;
        }
    }
    if (xPos == -1) {
        xPos = collapsableXPos;
    }
    if (xPos == -1) {
        pushFail(x1);
        return false;
    }
    for (let x1 = x; x1 > xPos; x1--) {
        pushPixels[y][x1] = stronglyConnected ? 2 : 1;
        if (failedPushPixels[x1 + y * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] == tick) {
            alert("ee")
        }
    }
    for (let x1 = x; x1 > xPos; x1--) {
        let index = (x1 + y * gridWidth) * gridStride;
        let id = grid[index + ID];
        if (pixels[id].sticky) {
            if (y > 0 && !pixels[grid[(x1 + (y - 1) * gridWidth) * gridStride + ID]].antiSticky) {
                if (pushPixels[y - 1] == null || pushPixels[y - 1][x1] == null) {
                    if (!pushLeftCheck(x1, y - 1, stronglyConnected && pixels[grid[(x1 + (y - 1) * gridWidth) * gridStride + ID]].sticky)) {
                        if (x1 < collapsableXPos) {
                            for (let x2 = collapsableXPos; x2 > xPos; x2--) {
                                pushPixels[y][x2] = null;
                            }
                            for (let x2 = collapsableXPos; x2 >= x1; x2--) {
                                pushPixels[y][x2] = 3;
                            }
                            // for (let x2 = collapsableXPos; x2 > xPos; x2--) {
                            //     pushPixels[y][x2] = 3;
                            // }
                            xPos = collapsableXPos;
                            break;
                        }
                        pushFail(x1);
                        return false;
                    }
                }
            }
            if (y < gridHeight - 1 && !pixels[grid[(x1 + (y + 1) * gridWidth) * gridStride + ID]].antiSticky) {
                if (pushPixels[y + 1] == null || pushPixels[y + 1][x1] == null) {
                    if (!pushLeftCheck(x1, y + 1, stronglyConnected && pixels[grid[(x1 + (y + 1) * gridWidth) * gridStride + ID]].sticky)) {
                        if (x1 < collapsableXPos) {
                            for (let x2 = collapsableXPos; x2 > xPos; x2--) {
                                pushPixels[y][x2] = null;
                            }
                            for (let x2 = collapsableXPos; x2 >= x1; x2--) {
                                pushPixels[y][x2] = 3;
                            }
                            // for (let x2 = collapsableXPos; x2 > xPos; x2--) {
                            //     pushPixels[y][x2] = 3;
                            // }
                            xPos = collapsableXPos;
                            break;
                        }
                        pushFail(x1);
                        return false;
                    }
                }
            }
            if (x1 == x) {
                if (x < gridWidth - 1 && grid[(x1 + 1 + y * gridWidth) * gridStride + ID] != AIR && !pixels[grid[(x1 + 1 + y * gridWidth) * gridStride + ID]].antiSticky) {
                    if (pushPixels[y] == null || pushPixels[y][x + 1] == null) {
                        if (!pushLeftCheck(x + 1, y, stronglyConnected && pixels[grid[(x1 + 1 + y * gridWidth) * gridStride + ID]].sticky)) {
                            if (x1 < collapsableXPos) {
                                for (let x2 = collapsableXPos; x2 > xPos; x2--) {
                                    pushPixels[y][x2] = null;
                                }
                                for (let x2 = collapsableXPos; x2 >= x1; x2--) {
                                    pushPixels[y][x2] = 3;
                                }
                                xPos = collapsableXPos;
                                break;
                            }
                            pushFail(x1);
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
};
function pushRight(x, y, pushPistons) {
    pushPistons = pushPistons;
    canCollapse = false;
    let worked = pushRightCheck(x, y, true);
    if (!worked) {
        // prevent cloners from marking themselves as unpushable
        if (pushPixels[pushY] == null || pushPixels[pushY][pushX] == null) {
            for (let i in pushPixels) {
                for (let j in pushPixels[i]) {
                    if (pushPixels[i][j] != 2) {
                        continue;
                    }
                    i = Number(i);
                    j = gridWidth - Number(j);
                    if (failedPushPixels[j + i * gridWidth] == tick) {
                        alert("bnuh")
                    }
                    failedPushPixels[j + i * gridWidth] = tick;
                }
            }
        }
        pushPixels = [];
        canCollapse = true;
        worked = pushRightCheck(x, y, true, true);
    }
    if (!worked) {
        if (pushPixels[pushY] == null || pushPixels[pushY][pushX] == null) {
            for (let i in pushPixels) {
                for (let j in pushPixels[i]) {
                    if (pushPixels[i][j] != 2) {
                        continue;
                    }
                    i = Number(i);
                    j = gridWidth - Number(j);
                    failedPushPixels[j + i * gridWidth + gridWidth * gridHeight] = tick;
                }
            }
        }
    }
    if (worked) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                i = Number(i);
                j = gridWidth - Number(j);
                let index = (j + 1 + i * gridWidth) * gridStride;
                if (grid[index + ID] == COLLAPSABLE) {
                    addPixel(j + 1, i, AIR);
                }
                move(j, i, j + 1, i);
            }
        }
        pushX = -1;
        pushY = -1;
        pushPixels = [];
        return true;
    }
    pushX = -1;
    pushY = -1;
    pushPixels = [];
    return false;
};
function pushRightCheck(x, y, stronglyConnected) {
    if (x == pushX && y == pushY) {
        return true;
    }
    function pushFail(x1) {
        for (let x2 = x; x2 <= x1; x2++) {
            pushPixels[y][gridWidth - x2] = 2;
        }
    };
    let xPos = -1;
    let collapsableXPos = -1;
    let x1;
    for (x1 = x; x1 < gridWidth; x1++) {
        if (x1 == pushX && y == pushY) {
            pushFail(x1);
            return false;
        }
        let index = (x1 + y * gridWidth) * gridStride;
        let id = grid[index + ID];
        if (id == AIR) {
            xPos = x1;
            break;
        }
        if (canCollapse && id == COLLAPSABLE) {
            collapsableXPos = x1;
        }
        if (failedPushPixels[x1 + y * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] == tick) {
            if (collapsableXPos != -1) {
                break;
            }
            return false;
        }
        if (grid[index + UPDATED] == tick) {
            if (x1 != x) {
                return false;
            }
            if (collapsableXPos != -1) {
                alert("how buh impossible state")
                break;
            }
            return true;
        }
        if (pushPixels[y] == null) {
            pushPixels[y] = [];
        }
        if (pushPixels[y][gridWidth - x1] == null) {
            if (!pixels[id].pushable) {
                pushFail(x1);
                return false;
            }
            if (!pushPistons && id == PISTON_LEFT) {
                pushFail(x1);
                return false;
            }
        }
        else {
            xPos = x1;
            break;
        }
    }
    if (xPos == -1) {
        xPos = collapsableXPos;
    }
    if (xPos == -1) {
        pushFail(x1);
        return false;
    }
    for (let x1 = x; x1 < xPos; x1++) {
        pushPixels[y][gridWidth - x1] = stronglyConnected ? 2 : 1;
        if (failedPushPixels[x1 + y * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] == tick) {
            alert("ee")
        }
    }
    for (let x1 = x; x1 < xPos; x1++) {
        let index = (x1 + y * gridWidth) * gridStride;
        let id = grid[index + ID];
        if (pixels[id].sticky) {
            if (y > 0 && !pixels[grid[(x1 + (y - 1) * gridWidth) * gridStride + ID]].antiSticky) {
                if (pushPixels[y - 1] == null || pushPixels[y - 1][gridWidth - x1] == null) {
                    if (!pushRightCheck(x1, y - 1, stronglyConnected && pixels[grid[(x1 + (y - 1) * gridWidth) * gridStride + ID]].sticky)) {
                        pushFail(x1);
                        return false;
                    }
                }
            }
            if (y < gridHeight - 1 && !pixels[grid[(x1 + (y + 1) * gridWidth) * gridStride + ID]].antiSticky) {
                if (pushPixels[y + 1] == null || pushPixels[y + 1][gridWidth - x1] == null) {
                    if (!pushRightCheck(x1, y + 1, stronglyConnected && pixels[grid[(x1 + (y + 1) * gridWidth) * gridStride + ID]].sticky)) {
                        pushFail(x1);
                        return false;
                    }
                }
            }
            if (x1 == x) {
                if (x > 0 && grid[(x1 - 1 + y * gridWidth) * gridStride + ID] != AIR && !pixels[grid[(x1 - 1 + y * gridWidth) * gridStride + ID]].antiSticky) {
                    if (pushPixels[y] == null || pushPixels[y][gridWidth - (x - 1)] == null) {
                        if (!pushRightCheck(x - 1, y, stronglyConnected && pixels[grid[(x1 - 1 + y * gridWidth) * gridStride + ID]].sticky)) {
                            pushFail(x1);
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
};
function pushUp(x, y, pushPistons) {
    pushPistons = pushPistons;
    canCollapse = false;
    let worked = pushUpCheck(x, y, true);
    if (!worked) {
        // prevent cloners from marking themselves as unpushable
        if (pushPixels[pushY] == null || pushPixels[pushY][pushX] == null) {
            for (let i in pushPixels) {
                for (let j in pushPixels[i]) {
                    if (pushPixels[i][j] != 2) {
                        continue;
                    }
                    i = Number(i);
                    j = Number(j);
                    if (failedPushPixels[j + i * gridWidth] == tick) {
                        alert("bnuh")
                    }
                    failedPushPixels[j + i * gridWidth] = tick;
                }
            }
        }
        pushPixels = [];
        canCollapse = true;
        worked = pushUpCheck(x, y, true);
    }
    if (!worked) {
        if (pushPixels[pushY] == null || pushPixels[pushY][pushX] == null) {
            for (let i in pushPixels) {
                for (let j in pushPixels[i]) {
                    if (pushPixels[i][j] != 2) {
                        continue;
                    }
                    i = Number(i);
                    j = Number(j);
                    failedPushPixels[j + i * gridWidth + gridWidth * gridHeight] = tick;
                }
            }
        }
    }
    if (worked) {
        for (let i in pushPixels) {
            for (let j in pushPixels[i]) {
                if (pushPixels[i][j] != 2 && pushPixels[i][j] != 1) {
                    continue;
                }
                i = Number(i);
                j = Number(j);
                let index = (j + (i - 1) * gridWidth) * gridStride;
                if (grid[index + ID] == COLLAPSABLE) {
                    addPixel(j, i - 1, AIR);
                }
                move(j, i, j, i - 1);
            }
        }
        pushX = -1;
        pushY = -1;
        pushPixels = [];
        return true;
    }
    pushX = -1;
    pushY = -1;
    pushPixels = [];
    return false;
};
function pushUpCheck(x, y, stronglyConnected) {
    if (x == pushX && y == pushY) {
        return true;
    }
    function pushFail(y1) {
        for (let y2 = y; y2 >= y1; y2--) {
            pushPixels[y2][x] = 2;
        }
    };
    let yPos = -1;
    let collapsableYPos = -1;
    let y1;
    for (y1 = y; y1 >= 0; y1--) {
        if (x == pushX && y1 == pushY) {
            pushFail(y1);
            return false;
        }
        let index = (x + y1 * gridWidth) * gridStride;
        let id = grid[index + ID];
        if (id == AIR) {
            yPos = y1;
            break;
        }
        if (canCollapse && id == COLLAPSABLE) {
            collapsableYPos = y1;
        }
        if (failedPushPixels[x + y1 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] == tick) {
            if (collapsableYPos != -1) {
                break;
            }
            return false;
        }
        if (grid[index + UPDATED] == tick) {
            if (y1 != y) {
                return false;
            }
            if (collapsableYPos != -1) {
                alert("how buh impossible state")
                break;
            }
            return true;
        }
        if (pushPixels[y1] == null) {
            pushPixels[y1] = [];
        }
        if (pushPixels[y1][x] == null) {
            if (!pixels[id].pushable) {
                pushFail(y1);
                return false;
            }
            if (!pushPistons && id == PISTON_DOWN) {
                pushFail(y1);
                return false;
            }
        }
        else {
            yPos = y1;
            break;
        }
    }
    if (yPos == -1) {
        yPos = collapsableYPos;
    }
    if (yPos == -1) {
        pushFail(y1);
        return false;
    }
    for (let y1 = y; y1 > yPos; y1--) {
        pushPixels[y1][x] = stronglyConnected ? 2 : 1;
        if (failedPushPixels[x + y1 * gridWidth + (canCollapse ? (gridWidth * gridHeight) : 0)] == tick) {
            alert("ee")
        }
    }
    for (let y1 = y; y1 > yPos; y1--) {
        let index = (x + y1 * gridWidth) * gridStride;
        let id = grid[index + ID];
        if (pixels[id].sticky) {
            if (x > 0 && !pixels[grid[(x - 1 + y1 * gridWidth) * gridStride + ID]].antiSticky) {
                if (pushPixels[y1] == null || pushPixels[y1][x - 1] == null) {
                    if (!pushLeftCheck(x - 1, y1, stronglyConnected && pixels[grid[(x - 1 + y1 * gridWidth) * gridStride + ID]].sticky)) {
                        pushFail(y1);
                        return false;
                    }
                }
            }
            if (x < gridWidth - 1 && !pixels[grid[(x + 1 + y1 * gridWidth) * gridStride + ID]].antiSticky) {
                if (pushPixels[y1] == null || pushPixels[y1][x + 1] == null) {
                    if (!pushLeftCheck(x + 1, y1, stronglyConnected && pixels[grid[(x + 1 + y1 * gridWidth) * gridStride + ID]].sticky)) {
                        pushFail(y1);
                        return false;
                    }
                }
            }
            if (y1 == y) {
                if (y < gridHeight - 1 && grid[(x + (y1 + 1) * gridWidth) * gridStride + ID] != AIR && !pixels[grid[(x + (y1 + 1) * gridWidth) * gridStride + ID]].antiSticky) {
                    if (pushPixels[y + 1] == null || pushPixels[y + 1][x] == null) {
                        if (!pushLeftCheck(x, y + 1, stronglyConnected && pixels[grid[(x + (y1 + 1) * gridWidth) * gridStride + ID]].sticky)) {
                            pushFail(y1);
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
};

function isRotatable(x, y) {
    return grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID].rotatable];
};
function rotatePixel(x, y) {
    let rotations = 0;
    forTouching(x, y, (x1, y1) => {
        let index = (x1 + y1 * gridWidth) * gridStride;
        let id = grid[index + ID];
        if (id == ROTATOR_CLOCKWISE) {
            rotations += 1;
        }
        if (id == ROTATOR_COUNTERCLOCKWISE) {
            rotations += 3;
        }
    });
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
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    wall: {
        name: "Wall",
        description: "An immovable wall",
        group: "General",
        subgroup: "Wall",
        color: new Float32Array([0, 0, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 20,
        pushable: true,
        cloneable: true,
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
        blastResistance: 3,
        update: function(x, y) {
            if (isTouching(x, y, [WATER])) {
                addPixel(x, y, MUD);
                // oops
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
        blastResistance: 3,
        update: function(x, y) {
            if (!isTouching(x, y, [AIR])) {
                addPixel(x, y, DIRT);
            }
            flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
        },
    },
    mud: {
        name: "Mud",
        description: "Wet dirt that has liquified",
        group: "General",
        subgroup: "Dirt",
        color: new Float32Array([90, 50, 0, 1]),
        noise: new Float32Array([25, 20, 0, 1]),
        state: SOLID,
        flammability: 1,
        blastResistance: 4,
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
        blastResistance: 5,
        pushable: true,
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
        blastResistance: 6,
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
        blastResistance: 6,
        update: function(x, y) {
            if (isTouching(x, y, [WATER])) {
                addPixel(x, y, CONCRETE);
                // oops
                return;
            }
            flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
        },
    },
    concrete: {
        name: "Concrete",
        description: "Weird gray rocky stuff that falls",
        group: "General",
        subgroup: "Concrete Powder",
        color: new Float32Array([75, 75, 75, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 6,
    },
    water: {
        name: "Water",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Water",
        color: new Float32Array([75, 100, 255, 1]),
        state: LIQUID,
        flammability: 0,
        blastResistance: 15,
        update: function(x, y) {
            let changed = false;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] != LAVA) {
                    return;
                }
                addPixel(x1, y1, STONE);
                changed = true;
            });

            if (changed) {
                if (Math.random() < 0.8) {
                    addPixel(x, y, STEAM);
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
        },
    },
    ice: {
        name: "Ice",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Water",
        color: new Float32Array([200, 220, 255, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        randomUpdate: function(x, y) {
            let touchingIce = 10;
            touchingIce *= 2 ** getTouching(x, y, [ICE]);
            touchingIce *= 1.5 ** getTouching(x, y, [SNOW]);
            touchingIce /= 2 ** getTouching(x, y, [WATER]);
            if (Math.random() < 0.2 / touchingIce) {
                addPixel(x, y, WATER);
            }
        },
    },
    snow: {
        name: "Snow",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Water",
        color: new Float32Array([230, 235, 235, 1]),
        noise: new Float32Array([0, 10, 10, 0]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update: function(x, y) {
            flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
        },
        randomUpdate: function(x, y) {
            let touchingIce = 10;
            touchingIce *= 2 ** getTouching(x, y, [ICE]);
            touchingIce *= 1.5 ** getTouching(x, y, [SNOW]);
            touchingIce /= 2 ** getTouching(x, y, [WATER]);
            if (Math.random() < 0.4 / touchingIce) {
                addPixel(x, y, WATER);
            }
        },
    },
    steam: {
        name: "Steam",
        description: "Unrealistically flows and may or may not be wet",
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
                if (Math.random() < pixels[grid[index1 + ID]].flammability / 20) {
                    addFire(x1, y1, true);
                    changed = true;
                }
                else if ((grid[index1 + ID] == ICE || grid[index1 + ID] == SNOW) && Math.random() < 0.1) {
                    addPixel(x1, y1, WATER);
                    changed = true;
                }
            });
            if (changed) {
                addPixel(x, y, WATER);
                return;
            }
            function isPassable(x, y) {
                return isOnGrid(x, y) && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state != SOLID;
            };
            function isMoveable(x, y) {
                return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && (grid[(x + y * gridWidth) * gridStride + ID] == AIR || pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == LIQUID);
            };
            rise(x, y, gridWidth, 1, isPassable, isMoveable);
            addUpdatedChunk(x, y);
        },
        randomUpdate: function(x, y) {
            if (Math.random() < 0.5) {
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
        blastResistance: 17,
        update: function(x, y) {
            // let index = (x + y * gridWidth) * gridStride;
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == LAVA) {
                    return;
                }
                let flammability = pixels[grid[index1 + ID]].flammability;
                let touchingAir = true;
                if (Math.random() < flammability / (touchingAir ? 20 : 60) + (y1 < y ? 0.4 : 0) - (touchingAir ? 0 : 0.2)) {
                    grid[index1 + ON_FIRE] = 1;
                }
                if (grid[index1 + ID] == WATER && Math.random() < 0.05) {
                    addPixel(x1, y1, STEAM);
                }
                if (grid[index1 + ID] == ICE && Math.random() < 0.1) {
                    addPixel(x1, y1, WATER);
                }
                if (grid[index1 + ID] == SNOW && Math.random() < 0.2) {
                    addPixel(x1, y1, WATER);
                }
                if (grid[index1 + ID] == IRON && Math.random() < 0.1) {
                    addPixel(x1, y1, STEEL);
                }
                if (Math.random() < flammability / 1200) {
                    // grid[index + ON_FIRE] = 0;
                    if (grid[index1 + ID] != ASH && Math.random() < 0.3) {
                        addPixel(x1, y1, ASH);
                    }
                    else {
                        addPixel(x1, y1, AIR);
                    }
                }
            });
            for (let i = 0; i < 3; i++) {
                let meltAngle = Math.random() * Math.PI * 2;
                raycast(x, y, Math.cos(meltAngle), Math.sin(meltAngle), (x1, y1) => {
                    let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                    if (dist > 10) {
                        return false;
                    }
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if (grid[index1 + ID] == SNOW) {
                        if (Math.random() < (15 - dist) / 20) {
                            addPixel(x1, y1, WATER);
                        }
                    }
                    else if (grid[index1 + ID] == ICE) {
                        if (Math.random() < (15 - dist) / 40) {
                            addPixel(x1, y1, WATER);
                        }
                    }
                    else if (grid[index1 + ID] == MUD) {
                        if (Math.random() < (10 - dist) / 10) {
                            addPixel(x1, y1, DIRT);
                        }
                    }
                    else if (grid[index1 + ID] == CLAY) {
                        if (Math.random() < (10 - dist) / 20) {
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
            if (Math.random() < 0.5) {
                function isPassable(x, y) {
                    return isOnGrid(x, y) && (pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS || grid[(x + y * gridWidth) * gridStride + ID] == LAVA);
                };
                function isMoveable(x, y) {
                    return isOnGrid(x, y) && grid[(x + y * gridWidth) * gridStride + UPDATED] != tick && pixels[grid[(x + y * gridWidth) * gridStride + ID]].state == GAS;
                };

                flow(x, y, gridWidth, 1, isPassable, isMoveable);
            }
            else {
                if (Math.random() < 0.125) {
                    let left = isId(x - 1, y, STONE);
                    let right = isId(x + 1, y, STONE);
                    if (left || (left && right && Math.random() < 0.5)) {
                        move(x, y, x - 1, y);
                        return;
                    }
                    else if (right) {
                        move(x, y, x + 1, y);
                        return;
                    }
                }
                if (Math.random() < 0.5 && isId(x, y + 1, LAVA) && isId(x, y - 1, STONE)) {
                    move(x, y, x, y - 1);
                    return;
                }
                else if (Math.random() < 0.5 && isId(x, y + 1, STONE)) {
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
            let index = (x + y * gridWidth) * gridStride;
            let flammability = pixels[grid[index + ID]].flammability;
            if (grid[index + ID] == LAVA) {
                grid[index + ON_FIRE] = 0;
                return;
            }
            if (flammability == 0 && (grid[index + ID] != AIR || Math.random() < 0.3)) {
                grid[index + ON_FIRE] = 0;
                forTouchingDiagonal(x, y, (x1, y1) => {
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    if (index == index1) {
                        return;
                    }
                    if (grid[index1 + ID] == WATER && Math.random() < 0.05) {
                        addPixel(x1, y1, STEAM);
                    }
                    if (grid[index1 + ID] == ICE && Math.random() < 0.1) {
                        addPixel(x1, y1, WATER);
                    }
                    if (grid[index1 + ID] == SNOW && Math.random() < 0.2) {
                        addPixel(x1, y1, WATER);
                    }
                });
                return;
            }
            if (grid[index + ID] == WATER || isTouching(x, y, [WATER])) {
                grid[index + ON_FIRE] = 0;
            }
            let touchingAir = grid[index + ID] == AIR || isTouching(x, y, [AIR]);
            if (Math.random() < (20 - flammability) / (touchingAir ? 280 : 20)) {
                grid[index + ON_FIRE] = 0;
            }

            // change to just adjacent pixels? also makes it more consistent
            let meltAngle = Math.random() * Math.PI * 2;
            raycast(x, y, Math.cos(meltAngle), Math.sin(meltAngle), (x1, y1) => {
                let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                if (dist > 5) {
                    return false;
                }
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == SNOW) {
                    if (Math.random() < (5 - dist) / 30) {
                        addPixel(x1, y1, WATER);
                    }
                }
                else if (grid[index1 + ID] == ICE) {
                    if (Math.random() < (5 - dist) / 60) {
                        addPixel(x1, y1, WATER);
                    }
                }
                else if (grid[index1 + ID] == MUD) {
                    if (Math.random() < (5 - dist) / 20) {
                        addPixel(x1, y1, DIRT);
                    }
                }
                else if (grid[index1 + ID] == CLAY) {
                    if (Math.random() < (5 - dist) / 30) {
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
            if (Math.random() < flammability / 1200) {
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
                if (grid[index + ID] != ASH && Math.random() < 0.3) {
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
                if (index == index1) {
                    return;
                }
                let flammability = pixels[grid[index1 + ID]].flammability;
                if (Math.random() < flammability / (touchingAir ? 20 : 60) + (y1 < y ? 0.4 : 0) - ((x1 != x && y1 != y) ? 0.4 : 0) - (touchingAir ? 0 : 0.2)) {
                    grid[index1 + ON_FIRE] = 1;
                }
                if (grid[index1 + ID] == WATER && Math.random() < 0.05) {
                    addPixel(x1, y1, STEAM);
                }
                if (grid[index1 + ID] == ICE && Math.random() < 0.1) {
                    addPixel(x1, y1, WATER);
                }
                if (grid[index1 + ID] == SNOW && Math.random() < 0.2) {
                    addPixel(x1, y1, WATER);
                }
                // if (grid[j][i] == pixNum.WATER && random() < 0.05) nextGrid[j][i] = pixNum.STEAM;
                // if (grid[j][i] == pixNum.ICE && random() < 0.1) nextGrid[j][i] = pixNum.WATER;
                // if (grid[j][i] == pixNum.SNOW && random() < 0.2) nextGrid[j][i] = pixNum.WATER;
            });
            addUpdatedChunk(x, y);
        },
    },
    clay: {
        name: "Clay",
        description: "Weird gray rocky stuff that falls",
        group: "General",
        subgroup: "Clay",
        color: new Float32Array([160, 80, 50, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 7,
        update: function(x, y) {
            flow(x, y, 1, 2, isPassableSolid, isMoveableSolid);
        },
    },
    bricks: {
        name: "Bricks",
        description: "Weird gray rocky stuff that falls",
        group: "General",
        subgroup: "Clay",
        texture: new Float32Array([0, 20, 8, 8]),
        state: SOLID,
        flammability: 8,
        blastResistance: 7,
        update: function(x, y) {
            if (isMoveableSolid(x, y + 1)) {
                let stable = false;
                let left = 0;
                let right = 0;
                for (let i = 1; i <= 2; i++) {
                    if (left < 0) {

                    }
                    else if (!isId(x - i, y, BRICKS)) {
                        left = -1;
                    }
                    else if (isId(x - i, y + 1, BRICKS)) {
                        stable = true;
                        break;
                    }
                    if (right < 0) {

                    }
                    else if (!isId(x + i, y, BRICKS)) {
                        right = -1;
                    }
                    else if (isId(x + i, y + 1, BRICKS)) {
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
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Stone",
        color: new Float32Array([110, 110, 110, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 16,
    },
    basalt: {
        name: "Basalt",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Stone",
        color: new Float32Array([90, 90, 110, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 5,
    },
    iron: {
        name: "Raw Iron",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Iron",
        color: new Float32Array([160, 160, 180, 1]),
        noise: new Float32Array([40, 20, -60, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
    },
    steel: {
        name: "Steel",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Iron",
        texture: new Float32Array([8, 20, 8, 8]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
    },
    rubber: {
        name: "Rubber",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Iron",
        texture: new Float32Array([0, 14, 6, 6]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
    },
    wood: {
        name: "Wood",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Wood",
        texture: new Float32Array([0, 0, 2, 2]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        pushable: true,
    },
    leaves: {
        name: "Leaves",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Wood",
        color: new Float32Array([100, 220, 0, 1]),
        state: SOLID,
        flammability: 15,
        blastResistance: 0,
        randomUpdate: function(x, y) {
            if (isTouching(x, y, [WOOD])) {
                return;
            }
            let touchingLeaves = 0;
            touchingLeaves += getTouching(x, y, [WOOD, LEAVES]);
            touchingLeaves += getTouchingDiagonal(x, y, [WOOD, LEAVES]);
            if (touchingLeaves < 3) {
                if (Math.random() < 1 / 140) {
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
        blastResistance: 0,
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
                    // let finalSize = size * (0.2 + Math.random() * 0.4);
                    let finalSize = size;
                    let branchOffset = Math.random() < 0.5;
                    raycast2(x1, y1, Math.cos(angle), Math.sin(angle), (x2, y2) => {
                        let dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                        if (dist > length) {
                            if (finalSize > 1) {
                                // addBranch(x3, y3, angle - (15 + Math.random() * 30) / 180 * Math.PI, finalSize, length * (0.2 + Math.random() * 0.4));
                                // addBranch(x3, y3, angle + (15 + Math.random() * 30) / 180 * Math.PI, finalSize, length * (0.2 + Math.random() * 0.4));
                                addBranch(x3, y3, angle - (15 + Math.random() * 30) / 180 * Math.PI, finalSize * (0.6 + Math.random() * 0.4), length * (0.4 + Math.random() * 0.4));
                                addBranch(x3, y3, angle + (15 + Math.random() * 30) / 180 * Math.PI, finalSize * (0.6 + Math.random() * 0.4), length * (0.4 + Math.random() * 0.4));
                                // let continueAngle = random(0.2, 0.4) * (Math.round(random()) * 2 - 1);
                                // branch(x2, y2, angle + continueAngle, size * random(0.5, 0.9), length * random(0.5, 1));
                                // let forcedBranch = random() < 0.5 - continueAngle * 0.8 + (((Math.PI / 2) - angle) * 0.5);
                                // if (random() < 0.2 || forcedBranch) branch(x2, y2, angle + random(0.6, 1.6) + (((Math.PI / 2) - angle) * 0.2), size * random(0.2, 0.6), length * random(0.5, 1));
                                // if (random() < 0.2 || !forcedBranch) branch(x2, y2, angle - random(0.6, 1.6) - (((Math.PI / 2) - angle) * 0.2), size * random(0.2, 0.6), length * random(0.5, 1));
                            }
                            else {
                                fillEllipse(x3, y3, (2 + Math.random() * 0.5) * growthFactor, (1.5 + Math.random() * 0.5) * growthFactor, (x4, y4) => {
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
                if (Math.random() < growth / 10) {
                    growthFactor = (Math.log(growth) / Math.log(4)) + 0.5;
                    addBranch(x, y, -Math.PI / 2, growth * (0.2 + Math.random() * 0.1), growth * (0.8 + Math.random() * 0.7));
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
        blastResistance: 0,
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
                return;
            }
            let isMoveable = (x1, y1) => {
                return isOnGrid(x1, y1) && grid[(x1 + y1 * gridWidth) * gridStride + UPDATED] != tick && (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == GAS || (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == LIQUID && Math.random() < 0.5));
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
        blastResistance: 0,
        update: function(x, y) {
            if (!isTouching(x, y, [STONE])) {
                flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
            }
            else if (isTouchingDiagonal(x, y, [STONE])) {
                addUpdatedChunk(x, y);
            }
            forTouchingDiagonal(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == STONE && Math.random() < 0.1 && isTouching(x1, y1, [AIR])) {
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
        blastResistance: 0,
        update: function(x, y) {
            if (!isTouching(x, y, [BASALT])) {
                flow(x, y, 1, 1, isPassableSolid, isMoveableSolid);
            }
            else if (isTouchingDiagonal(x, y, [BASALT])) {
                addUpdatedChunk(x, y);
            }
            forTouchingDiagonal(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] == BASALT && Math.random() < 0.1 && isTouching(x1, y1, [AIR])) {
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
        blastResistance: 0,
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
                return isOnGrid(x1, y1) && grid[(x1 + y1 * gridWidth) * gridStride + UPDATED] != tick && (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == GAS || (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == LIQUID && Math.random() < 0.5));
            };
            if (isMoveable(x, y + 1)) {
                move(x, y, x, y + 1);
            }
            else {
                let valid = isTouching(x, y, [SAND]);
                if (!valid && Math.random() < 1 / 8) {
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
        blastResistance: 0,
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
                return isOnGrid(x1, y1) && grid[(x1 + y1 * gridWidth) * gridStride + UPDATED] != tick && (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == GAS || (pixels[grid[(x1 + y1 * gridWidth) * gridStride + ID]].state == LIQUID && Math.random() < 0.5));
            };
            if (isMoveable(x, y + 1)) {
                move(x, y, x, y + 1);
            }
            else {
                let valid = isTouching(x, y, [SAND]);
                if (!valid && Math.random() < 1 / 8) {
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
        color: new Float32Array([80, 85, 90, 1]),
        noise: new Float32Array([40, 45, 50, 1]),
        state: SOLID,
        flammability: 4,
        blastResistance: 0,
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
        blastResistance: 0,
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
        flammability: 10,
        blastResistance: 0,
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
        pushable: true,
        rotatable: true,
        update1: function(x, y) {
            pushLeft(x, y, false);
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
        pushable: true,
        rotatable: true,
        update3: function(x, y) {
            pushUp(x, y, false);
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
        pushable: true,
        rotatable: true,
        update2: function(x, y) {
            pushRight(x, y, false);
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
        pushable: true,
        rotatable: true,
        update4: function(x, y) {
            pushUp(x, y, false);
            addUpdatedChunk(x, y);
        },
    },
    pusher_left: {
        name: "Pusher Left",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Piston",
        texture: new Float32Array([60, 14, 6, 6]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        pushable: true,
        update1: function(x, y) {
            if (x == 0) {
                return;
            }
            pushX = x;
            pushY = y;
            pushLeft(x - 1, y, false);
            // addUpdatedChunk(x, y);
        },
    },
    // sticky_piston_left: {
    //     name: "Sticky Piston Left",
    //     description: "Unrealistically flows and may or may not be wet",
    //     group: "Mechanical",
    //     subgroup: "Piston",
    //     texture: new Float32Array([36, 14, 6, 6]),
    //     state: SOLID,
    //     flammability: 10,
    //     blastResistance: 0,
    //     pushable: true,
    //     sticky: true,
    //     update1: function(x, y) {
    //         pushLeft(x, y);
    //         addUpdatedChunk(x, y);
    //     },
    // },
    copier_left: {
        name: "Copier Left",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Copier",
        texture: new Float32Array([0, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        pushable: true,
        update1: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (grid[index + ID] != AIR && grid[index + UPDATED] != tick) {
                let index1 = (x - 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x - 1, y, grid[index + ID]);
            }
            // addUpdatedChunk(x, y);
        },
    },
    copier_right: {
        name: "Copier Right",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Copier",
        texture: new Float32Array([6, 28, 12, 12]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        pushable: true,
        update2: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            let index = (x - 1 + y * gridWidth) * gridStride;
            if (grid[index + ID] != AIR && grid[index + UPDATED] != tick) {
                let index1 = (x + 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x + 1, y, grid[index + ID]);
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
        pushable: true,
        update2: function(x, y) {
            if (y == 0 || y == gridHeight - 1) {
                return;
            }
            let index = (x + (y + 1) * gridWidth) * gridStride;
            if (grid[index + ID] != AIR && grid[index + UPDATED] != tick) {
                let index1 = (x + (y - 1) * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    return;
                }
                addPixel(x, y - 1, grid[index + ID]);
            }
            // addUpdatedChunk(x, y);
        },
    },
    cloner_left: {
        name: "Cloner Left",
        description: "<button>look i put button in tooltip</button><br>and embeds lol<iframe src='https://beepbox.co'>",
        group: "Mechanical",
        subgroup: "Cloner",
        texture: new Float32Array([0, 80, 60, 60]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        pushable: true,
        update1: function(x, y) {
            if (x == 0 || x == gridWidth - 1) {
                return;
            }
            let index = (x + 1 + y * gridWidth) * gridStride;
            if (grid[index + ID] != AIR && grid[index + UPDATED] != tick) {
                let index1 = (x - 1 + y * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR) {
                    pushX = x;
                    pushY = y;
                    if (!pushLeft(x - 1, y, true)) {
                        return;
                    }
                }
                addPixel(x - 1, y, grid[index + ID]);
            }
            // addUpdatedChunk(x, y);
        },
    },
    rotator_left: {
        name: "Rotator (Left)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: new Float32Array([80, 40, 40, 40]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        pushable: true,
    },
    rotator_clockwise: {
        name: "Rotator (Clockwise)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: new Float32Array([0, 2, 3, 3]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        pushable: true,
        update: function(x, y) {
            forTouching(x, y, (x1, y1) => {
                if (isRotatable(x1, y1)) {
                    rotatePixel(x1, y1);
                }
            });
            addUpdatedChunk(x, y);
        },
    },
    rotator_counterclockwise: {
        name: "Rotator (Counterclockwise)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Mechanical",
        subgroup: "Rotator",
        texture: new Float32Array([12, 2, 3, 3]),
        state: SOLID,
        flammability: 10,
        blastResistance: 0,
        pushable: true,
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
        pushable: true,
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
        pushable: true,
        sticky: true,
    },
    nuke: {
        name: "Nuke",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Nuke",
        color: new Float32Array([0, 255, 125, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update: function(x, y) {
            let exploding = false;
            if (y == gridHeight - 1) {
                exploding = true;
            }
            forTouching(x, y, (x1, y1) => {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (grid[index1 + ID] != AIR && grid[index1 + ID] != NUKE) {
                    exploding = true;
                }
            });
            if (exploding) {
                let changed = [];
                addPixel(x, y, AIR);
                addFire(x, y, true);
                let size = 150;
                for (let i = 0; i < 8 * size; i++) {
                    let angle = i * Math.PI / size / 4;
                    let power = size;
                    raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                        let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                        let index1 = (x1 + y1 * gridWidth) * gridStride;
                        power -= dist;
                        if (power < 0) {
                            return false;
                        }
                        let id = grid[index1 + ID];
                        let blastResistance = pixels[id].blastResistance;
                        // if (Math.random() > blastResistance / power) {
                        if (Math.random() < 1 / blastResistance) {
                            if (!changed[x1 + y1 * gridWidth]) {
                                changed[x1 + y1 * gridWidth] = true;
                                if (Math.random() > blastResistance / power + 0.5) {
                                    addFire(x1, y1, true);
                                }
                                if (id == AIR) {

                                }
                                else if (id == ASH) {
                                    addPixel(x1, y1, AIR);
                                }
                                else if ((id == WATER || id == ICE || id == SNOW) && Math.random() > 20 / power) {
                                    addPixel(x1, y1, STEAM);
                                }
                                else if (id == NUKE) {
                                    addPixel(x1, y1, ACTIVATED_NUKE);
                                }
                                else if (id == ACTIVATED_NUKE) {

                                }
                                // else if (Math.random() < 40 / power) {
                                else if (Math.random() < 0.5) {
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
                            power -= blastResistance / 40;
                        }
                        else {
                            power -= blastResistance / 5;
                        }
                        power += dist;
                        return true;
                    });
                }
            }
            else {
                fall(x, y, isMoveableSolid);
                addUpdatedChunk(x, y);
            }
        },
    },
    activated_nuke: {
        name: "Nuke",
        description: "Unrealistically flows and may or may not be wet",
        group: "General",
        subgroup: "Nuke",
        color: new Float32Array([255, 255, 0, 1]),
        state: SOLID,
        flammability: 0,
        blastResistance: 0,
        update: function(x, y) {
            let changed = [];
            addPixel(x, y, AIR);
            addFire(x, y, true);
            let size = 150;
            for (let i = 0; i < 8 * size; i++) {
                let angle = i * Math.PI / size / 4;
                let power = size;
                raycast(x, y, Math.cos(angle), Math.sin(angle), (x1, y1) => {
                    let dist = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
                    let index1 = (x1 + y1 * gridWidth) * gridStride;
                    power -= dist;
                    if (power < 0) {
                        return false;
                    }
                    let id = grid[index1 + ID];
                    let blastResistance = pixels[id].blastResistance;
                    if (Math.random() > blastResistance / power) {
                        if (!changed[x1 + y1 * gridWidth]) {
                            changed[x1 + y1 * gridWidth] = true;
                            if (Math.random() > blastResistance / power + 0.5) {
                                addFire(x1, y1, true);
                            }
                            if (id == AIR) {

                            }
                            else if (id == ASH) {
                                addPixel(x1, y1, AIR);
                            }
                            else if ((id == WATER || id == ICE || id == SNOW) && Math.random() > 20 / power) {
                                addPixel(x1, y1, STEAM);
                            }
                            else if (id == NUKE) {
                                addPixel(x1, y1, ACTIVATED_NUKE);
                            }
                            else if (id == ACTIVATED_NUKE) {

                            }
                            // else if (Math.random() < 40 / power) {
                            else if (Math.random() < 0.5) {
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
                        power -= blastResistance / 40;
                    }
                    else {
                        power -= blastResistance / 5;
                    }
                    power += dist;
                    return true;
                });
            }
        },
    },
};
for (let i in pixelData) {
    pixels.push(pixelData[i]);
    pixels[pixels.length - 1].id = i;
    eval("window." + i.toUpperCase() + " = " + (pixels.length - 1) + ";");
}

let pixelPicker = document.getElementById("pixelPicker");
let pixelGroups = [];
let pixelSubgroups = [];
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
canvas.width = 48;
canvas.height = 48;
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

let selectedDiv = null;

for (let i in pixels) {
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
        ctx.drawImage(imageBitmap, pixels[i].texture[0], pixels[i].texture[1], pixels[i].texture[2], pixels[i].texture[3], 0, 0, 48, 48);
    }
    let data = canvas.toDataURL("image/png");
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
                for (let j in pixelSubgroups[pixels[i].group]) {
                    pixelSubgroups[pixels[i].group][j].classList.remove("pixelSubgroupSelected");
                }
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
        let subgroupImg = document.createElement("div");
        subgroupImg.classList.add("pixelSubgroupImg");
        subgroupImg.style.backgroundImage = "url(" + data + ")";
        subgroupImg.onclick = function() {
            if (subgroup.classList.contains("pixelSubgroupSelected")) {
                subgroup.classList.remove("pixelSubgroupSelected");
            }
            else {
                for (let j in pixelSubgroups[pixels[i].group]) {
                    pixelSubgroups[pixels[i].group][j].classList.remove("pixelSubgroupSelected");
                }
                subgroup.classList.add("pixelSubgroupSelected");
            }
            selectedDiv.classList.remove("pixelSelected");
            selectedDiv = subgroupImg;
            selectedDiv.classList.add("pixelSelected");
            setBrushPixel(i);
        };
        subgroupImg.onmouseover = function() {
            showTooltip(pixels[i].name, pixels[i].description);
            moveTooltip();
        };
        subgroupImg.onmouseout = function() {
            hideTooltip();
        };
        subgroupImg.onmousemove = function() {
            moveTooltip();
        };
        subgroup.appendChild(subgroupImg);

        if (selectedDiv == null) {
            selectedDiv = subgroupImg;
        }
    }
    else {
        let pixel = document.createElement("div");
        pixel.classList.add("pixel");
        pixelSubgroups[pixels[i].group][pixels[i].subgroup].appendChild(pixel);
        let pixelImg = document.createElement("div");
        pixelImg.classList.add("pixelImg");
        pixelImg.style.backgroundImage = "url(" + data + ")";
        pixelImg.onclick = function() {
            selectedDiv.classList.remove("pixelSelected");
            selectedDiv = pixelImg;
            selectedDiv.classList.add("pixelSelected");
            setBrushPixel(i);
        };
        pixelImg.onmouseover = function() {
            showTooltip(pixels[i].name, pixels[i].description);
            moveTooltip();
        };
        pixelImg.onmouseout = function() {
            hideTooltip();
        };
        pixelImg.onmousemove = function() {
            moveTooltip();
        };
        pixel.appendChild(pixelImg);
    }
}

export { pixels, addPixel, addFire, addUpdatedChunk, addUpdatedChunk2, resetFailedPushPixels };