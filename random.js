import { gridWidth, gridHeight, tick } from "./game.js";

// Seeded random number generator
// https://github.com/cprosche/mulberry32

function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
};

let random = mulberry32(0);
function randomSeed(x, y) {
    random = mulberry32(x + y * gridWidth + tick * gridWidth * gridHeight);
};

export { random, randomSeed };