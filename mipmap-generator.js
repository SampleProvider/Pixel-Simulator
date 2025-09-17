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
                if ((grid[index1 + PIXEL_DATA] & 1) == 1) {
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
                    grid[index1 + PIXEL_DATA] |= 1;
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
                grid[index + PIXEL_DATA] &= ~1;
                return;
            }
            if (flammability == 0 && (grid[index + ID] != AIR || random() < 0.3)) {
                grid[index + PIXEL_DATA] &= ~1;
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
                grid[index + PIXEL_DATA] &= ~1;
            }
            let touchingAir = grid[index + ID] == AIR || isTouching(x, y, [AIR]);
            if (random() < (20 - flammability) / (touchingAir ? 280 : 20)) {
                grid[index + PIXEL_DATA] &= ~1;
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
                    grid[index1 + PIXEL_DATA] |= 1;
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
        blastResistance: 200,
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
        blastResistance: 200,
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
        blastResistance: 200,
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
        blastResistance: 200,
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
        blastResistance: 240,
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
        blastResistance: 240,
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
        blastResistance: 240,
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
        blastResistance: 240,
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
        blastResistance: 60,
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
        blastResistance: 60,
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
        blastResistance: 60,
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
        blastResistance: 60,
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
        blastResistance: 180,
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
        blastResistance: 180,
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
        blastResistance: 180,
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
        blastResistance: 180,
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
        blastResistance: 300,
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
        texture: [new Float32Array([15, 2, 3, 3]), new Float32Array([18, 2, 3, 3]), new Float32Array([9, 2, 3, 3]), new Float32Array([12, 2, 3, 3])],
        state: SOLID,
        flammability: 10,
        blastResistance: 250,
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
        blastResistance: 2500,
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
        blastResistance: 2500,
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
        flammability: 12,
        blastResistance: 20,
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
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_LEFT_ON)) {
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
        blastResistance: 180,
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
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_LEFT_ON)) {
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
        blastResistance: 180,
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
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == COMPARATOR_RIGHT_OFF)) {
                addPixel(x, y, OBSERVER_RIGHT_ON);
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_RIGHT_ON)) {
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
        blastResistance: 180,
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
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == COMPARATOR_RIGHT_OFF)) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, false);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_RIGHT_ON)) {
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
        blastResistance: 180,
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
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_UP_ON)) {
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
        blastResistance: 180,
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
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_UP_ON)) {
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
        blastResistance: 180,
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
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == COMPARATOR_DOWN_OFF)) {
                addPixel(x, y, OBSERVER_DOWN_ON);
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_DOWN_ON)) {
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
        blastResistance: 180,
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
            else if (grid[index + UPDATED] == tick && (grid[index + ID] == OBSERVER_LEFT_OFF || grid[index + ID] == OBSERVER_UP_OFF || grid[index + ID] == OBSERVER_RIGHT_OFF || grid[index + ID] == OBSERVER_DOWN_OFF || grid[index + ID] == COMPARATOR_DOWN_OFF)) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            else if (grid[index + UPDATED] != tick && (grid[index + ID] == OBSERVER_LEFT_ON || grid[index + ID] == OBSERVER_UP_ON || grid[index + ID] == OBSERVER_RIGHT_ON || grid[index + ID] == OBSERVER_DOWN_ON || grid[index + ID] == COMPARATOR_DOWN_ON)) {
                addUpdatedChunk(x, y);
                // setObserverUpdated(x, y, updated, true);
                return;
            }
            addPixel(x, y, OBSERVER_DOWN_OFF);
            // setObserverUpdated(x, y, updated, true);
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
        update5: function(x, y) {
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
        update5: function(x, y) {
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
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels < 2) {
                addPixel(x, y, COMPARATOR_LEFT_OFF);
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
        update5: function(x, y) {
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
        update5: function(x, y) {
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
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels < 2) {
                addPixel(x, y, COMPARATOR_UP_OFF);
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
        update5: function(x, y) {
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
        update5: function(x, y) {
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
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels < 2) {
                addPixel(x, y, COMPARATOR_RIGHT_OFF);
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
        update5: function(x, y) {
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
        update5: function(x, y) {
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
                        return;
                    }
                    pixels += 1;
                }
            }
            if (pixels < 2) {
                addPixel(x, y, COMPARATOR_DOWN_OFF);
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
        update: function(x, y) {
            let exploding = false;
            let index = (x + y * gridWidth) * gridStride;
            if ((grid[index + PIXEL_DATA] & 1) == 1 || isTouching(x, y, [LAVA])) {
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
        texture: [new Float32Array([0, 9, 5, 5]), new Float32Array([5, 9, 5, 5])],
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
                    if ((grid[index1 + PIXEL_DATA] & 1) == 0) {
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
                    if ((grid[index1 + PIXEL_DATA] & 1) == 0) {
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
                    if ((grid[index1 + PIXEL_DATA] & 1) == 0) {
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
                    if ((grid[index1 + PIXEL_DATA] & 1) == 0) {
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
        blastResistance: 20,
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
        update: function(x, y) {
            // explode(x, y, 30 * 30, 15, 4000);
            explode(x, y, 30 * 30, 30 * 8, 4000);
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
        blastResistance: 2100,
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
        blastResistance: 1600,
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
                        explode(x, y, size * size, size * 8, 10000);
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
        subgroup: "Goal",
        texture: [new Float32Array([108, 14, 6, 6]), new Float32Array([132, 14, 6, 6])],
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
        subgroup: "Goal",
        texture: [new Float32Array([114, 14, 6, 6]), new Float32Array([138, 14, 6, 6])],
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
        subgroup: "Goal",
        texture: [new Float32Array([120, 14, 6, 6]), new Float32Array([144, 14, 6, 6])],
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
        subgroup: "Goal",
        texture: [new Float32Array([126, 14, 6, 6]), new Float32Array([150, 14, 6, 6])],
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
        texture: new Float32Array([240, 190, 50, 50]),
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
        texture: new Float32Array([240, 240, 50, 50]),
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    team_a: {
        name: "Team (Alpha)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Team",
        color: new Float32Array([255, 204, 204, 1]),
        amountColor: "black",
        state: GAS,
        flammability: 0,
        blastResistance: 0,
    },
    team_b: {
        name: "Team (Beta)",
        description: "Unrealistically flows and may or may not be wet",
        group: "Multiplayer",
        subgroup: "Team",
        color: new Float32Array([204, 204, 255, 1]),
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
        update: function(x, y) {
            if (isDeactivated(x, y)) {
                return;
            }
            let index = (x + y * gridWidth) * gridStride;
            forTouching(x, y, function(x1, y1) {
                let index1 = (x1 + y1 * gridWidth) * gridStride;
                if (!pixels[grid[index1 + ID]].collectable) {
                    return;
                }
                for (let i = 0; i < 2; i++) {
                    if ((grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0 && (grid[index1 + PIXEL_DATA] & (1 << (i + 1))) == 0) {
                        return;
                    }
                }
                if (multiplayerId != null) {
                    for (let i = 0; i < 2; i++) {
                        if ((grid[index + PIXEL_DATA] & (1 << (i + 1))) != 0) {
                            multiplayerPixelInventory[i][grid[index1 + ID]] += 1;
                            if (i == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
                                pixelInventoryUpdates[grid[index1 + ID]] = true;
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

const input = document.getElementById("input");
const resolutionInput = document.getElementById("resolutionInput");
const generateButton = document.getElementById("generateButton");
const progressBarText = document.getElementById("progressBarText");
const progressBarBackground = document.getElementById("progressBarBackground");
const timeRemaining = document.getElementById("timeRemaining");

let generating = false;

generateButton.onclick = function() {
    if (generating) {
        return;
    }
    if (input.files != null && input.files[0] != null) {
        generating = true;
        var reader = new FileReader();
        reader.onload = function(e) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = function() {
                const canvas = document.createElement("canvas");
                let layers = 0;
                let textures = new Map();
                for (let i in pixels) {
                    if (pixels[i].texture != null) {
                        if (Array.isArray(pixels[i].texture)) {
                            for (let j in pixels[i].texture) {
                                if (textures.has(pixels[i].texture[j][0] + ":" + pixels[i].texture[j][1] + ":" + pixels[i].texture[j][2] + ":" + pixels[i].texture[j][3])) {
                                    continue;
                                }
                                textures.set(pixels[i].texture[j][0] + ":" + pixels[i].texture[j][1] + ":" + pixels[i].texture[j][2] + ":" + pixels[i].texture[j][3], true);
                                layers += 1;
                            }
                        }
                        else {
                            if (textures.has(pixels[i].texture[0] + ":" + pixels[i].texture[1] + ":" + pixels[i].texture[2] + ":" + pixels[i].texture[3])) {
                                continue;
                            }
                            textures.set(pixels[i].texture[0] + ":" + pixels[i].texture[1] + ":" + pixels[i].texture[2] + ":" + pixels[i].texture[3], true);
                            layers += 1;
                        }
                    }
                }
                let resolution = Number(resolutionInput.value);
                let width = resolution * 2;
                let height = layers * resolution;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.imageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;
                ctx.mozImageSmoothingEnabled = false;
                function drawMipmaps(texture, layer) {
                    ctx.drawImage(image, texture[0], texture[1], texture[2], texture[3], 0, layer * resolution, resolution, resolution);
                    let x = 0;
                    let size = resolution;
                    let nextSize = Math.floor(size / 2);
                    while (nextSize > 0) {
                        let imageData = ctx.getImageData(x, layer * resolution, size, size);
                        let nextImageData = ctx.createImageData(nextSize, nextSize);
                        for (let y1 = 0; y1 < nextSize; y1++) {
                            for (let x1 = 0; x1 < nextSize; x1++) {
                                let r = 0;
                                let g = 0;
                                let b = 0;
                                let a = 0;
                                let total = 0;
                                for (let y2 = Math.floor(y1 / nextSize * size); y2 <= Math.floor((y1 + 1) / nextSize * size); y2++) {
                                    if (y2 == size) {
                                        break;
                                    }
                                    for (let x2 = Math.floor(x1 / nextSize * size); x2 <= Math.floor((x1 + 1) / nextSize * size); x2++) {
                                        if (x2 == size) {
                                            break;
                                        }
                                        let maxX = Math.max(x2, x1 / nextSize * size);
                                        let minX = Math.min(x2 + 1, (x1 + 1) / nextSize * size);
                                        let maxY = Math.max(y2, y1 / nextSize * size);
                                        let minY = Math.min(y2 + 1, (y1 + 1) / nextSize * size);
                                        let area = (minX - maxX) * (minY - maxY);
                                        r += imageData.data[(x2 + y2 * size) * 4] * area;
                                        g += imageData.data[(x2 + y2 * size) * 4 + 1] * area;
                                        b += imageData.data[(x2 + y2 * size) * 4 + 2] * area;
                                        a += imageData.data[(x2 + y2 * size) * 4 + 3] * area;
                                        total += area;
                                        // if (layer == 0) {
                                        //     console.log(r,g,b,a,area, maxX, minX, maxY, minY)
                                        // }
                                    }
                                }
                                r /= total;
                                g /= total;
                                b /= total;
                                a /= total;
                                nextImageData.data[(x1 + y1 * nextSize) * 4] = r;
                                nextImageData.data[(x1 + y1 * nextSize) * 4 + 1] = g;
                                nextImageData.data[(x1 + y1 * nextSize) * 4 + 2] = b;
                                nextImageData.data[(x1 + y1 * nextSize) * 4 + 3] = a;
                            }
                        }
                        ctx.putImageData(nextImageData, x + size, layer * resolution);
                        x += size;
                        size = nextSize;
                        nextSize = Math.floor(size / 2);
                    }
                };
                let layersDrawn = 0;
                let texturesDrawn = new Map();
                let i = 0;
                let start = performance.now();
                let interval = setInterval(function() {
                    for (i in pixels) {
                        if (pixels[i].texture != null) {
                            if (Array.isArray(pixels[i].texture)) {
                                for (let j in pixels[i].texture) {
                                    if (texturesDrawn.has(pixels[i].texture[j][0] + ":" + pixels[i].texture[j][1] + ":" + pixels[i].texture[j][2] + ":" + pixels[i].texture[j][3])) {
                                        continue;
                                    }
                                    texturesDrawn.set(pixels[i].texture[j][0] + ":" + pixels[i].texture[j][1] + ":" + pixels[i].texture[j][2] + ":" + pixels[i].texture[j][3], true);
                                    drawMipmaps(pixels[i].texture[j], layersDrawn);
                                    layersDrawn += 1;
                                }
                            }
                            else {
                                if (texturesDrawn.has(pixels[i].texture[0] + ":" + pixels[i].texture[1] + ":" + pixels[i].texture[2] + ":" + pixels[i].texture[3])) {
                                    continue;
                                }
                                texturesDrawn.set(pixels[i].texture[0] + ":" + pixels[i].texture[1] + ":" + pixels[i].texture[2] + ":" + pixels[i].texture[3], true);
                                drawMipmaps(pixels[i].texture, layersDrawn);
                                layersDrawn += 1;
                            }
                        }
                    }
                    if (layersDrawn == layers) {
                        progressBarText.innerText = (layersDrawn / layers * 100).toFixed(2) + "%";
                        progressBarBackground.style.width = (layersDrawn / layers * 100) + "%";
                        timeRemaining.innerText = "Done";
                        generating = false;
                        clearInterval(interval);
                        canvas.toBlob(function(blob) {
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = "output.png";
                            a.click();
                        });
                        return;
                    }
                    progressBarText.innerText = (layersDrawn / layers * 100).toFixed(2) + "%";
                    progressBarBackground.style.width = (layersDrawn / layers * 100) + "%";
                    let time = (performance.now() - start) / (layersDrawn / layers) / 1000 * (1 - layersDrawn / layers);
                    let seconds = (time % 60).toFixed(2);
                    if (time % 60 < 10) {
                        seconds = "0" + seconds;
                    }
                    let minutes = Math.floor((time % 3600) / 60);
                    if (time >= 3600) {
                        if (minutes < 10) {
                            minutes = "0" + minutes;
                        }
                        timeRemaining.innerText = Math.floor(time / 3600) + ":" + minutes + ":" + seconds;
                    }
                    else {
                        timeRemaining.innerText = minutes + ":" + seconds;
                    }
                }, 1);
            };
        };
        reader.readAsDataURL(input.files[0]);
    }
    else {
        alert("No image uploaded!");
    }
};