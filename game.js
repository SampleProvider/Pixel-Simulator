import { random, randomSeed } from "./random.js";
import { puzzles, puzzleProgress, currentPuzzle, targets, resetTargets, updateObjectives } from "./puzzles.js";
import { webgpuSupported, resizeCanvas, resizeGrid, render } from "./renderer.js";
import { resizeMenuCanvases, transitionIn, transitionOut, slideInTitle, updateMenu } from "./menu.js";
import { playMusic } from "./sound.js";
import { socket, multiplayerId, multiplayerGameId, multiplayerGames, multiplayerPixelInventory, updateMultiplayer } from "./multiplayer.js";
import { pixels, addPixel, addFire, addTeam, addUpdatedChunk, addUpdatedChunk2, addGridUpdatedChunk, resetPushPixels, pixelTexture, pixelInventory, pixelInventoryUpdates, updateBrushPixel, resetPixelInventory, updatePixelInventory, updateMultiplayerPixelInventory } from "./pixels.js";

/*

* TODO *

bugs:
none! yay

features:
history of savecodes/grid???
undo
blueprints - DONE
port to rust for webassembly

pixels:
polish pixels
changePixel vs addPixel
polish colors

fire optimization

change chunk update from 3x5 to 5x5? - DONE

change textures to left-right-up-down - oh wait rotations

look at the all caps constants - maybe we can just repalce wtih string - DONE

fix pushX pushY - DONE
fix collapseX collapseY - DONE
remove unnecessary workedPushPixels

add explode functions to pumps - DONE
isId function is so useless - DONE
deterministic random - DONE
lava cooling? and lava heater heating stone
lava heater raycasts for some reason

shader hardcoding pixel ids - DONE

transparency rendering - DONE

oh no tick overflow after 38.5 days

why are observers deactivatable that is dumb - DONE

water/flow code is kind of bad
water needs to check for acid in ispassible

button textures for 2x1 button clicked - DONE

why is on_fire sometimes true/false and sometimes 0/1 - DONE

check "for i in" stuff

for transitions use css classes instead of editing css

display block/revert layer

menu transitions are dumb, do they just reset what changed or set everything?

wgsl can definitely be optimized:
- if statements
- drawplacementrestriction buffer

alt to show pixel name - DONE

concrete powder - fix pixel conversions

rename drawBlueprintImg

img -> image

refactor code for selecting brush pixel - function for changing div styles name

fps display borks in simulate mode - DONE

optimize the code for when you pick up a pixel starting from 0 in inventory

fix bug where loading puzzle save code on resupply needed is borken - DONE

random() in shader is [-1, 1] i think, this breaks noise (ash is one of the pixels that are borken) - DONE (its opacity 1 on noise)

remove css classes that can be done like "#modalButtons button"

buh what is this id name createCustomPuzzleFinishButton

inconsistent naming, some things have Button at the end
multiplayerGameIdInput

// todo: type to brush/selection instead of 0/1

// clonenode removes the elements and leaves document fragment behind, some code like blueprints and puzzle creator might be borken

TILE_DATA buh - DONE

change css of pixel picker to use css gap property

showSaveFilePicker taking too long leads to dom exception

updatedGridChunks - name

updateMultiplayerPixelInventory - update the color innerText only on changed

fix random:
- seed non butterfly effect random for explosions
- randomseed for random ticking

// todo: minimize mode for savecodes
// if (currentPuzzle != null) {
//     if ((generatingGrid[i + PUZZLE_DATA] & 1) == 1) {
//         continue;
//     }
// }

monsters always update because updateObjectives only scans updated chunks for monsters


polishing:

updateMouse Spaghetti
showTooltip transitions
moveTooltip sides thing
pasting settings
css property order

ghost stuff where the fade texture off the grid is not cleared

*/

// window.onerror = function(a, b, c, d, e) {
//     alert(a + " " + b + " " + c + " " + d + " " + e)
// }
window.onerror = function(message, source, lineno, colno, error) {
    // modal("ERROR BUG BUG BUG!!!", source + "<br>" + message + " " + source + " " + lineno + " " + colno, "error");
    modal("ERROR BUG BUG BUG!!!", source + "<br><br>" + error.stack, "error");
};
const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");

let WIDTH = window.innerWidth * devicePixelRatio;
let HEIGHT = window.innerHeight * devicePixelRatio;

const pixelPicker = document.getElementById("pixelPicker"); // spaghetti buh
window.onresize = () => {
    cameraX += WIDTH / 2 / cameraScale;
    cameraY += HEIGHT / 2 / cameraScale;
    WIDTH = window.innerWidth * devicePixelRatio;
    HEIGHT = window.innerHeight * devicePixelRatio;
    cameraX -= WIDTH / 2 / cameraScale;
    cameraY -= HEIGHT / 2 / cameraScale;
    overlayCanvas.width = WIDTH;
    overlayCanvas.height = HEIGHT;
    resizeMenuCanvases(WIDTH, HEIGHT);
    resizeCanvas(WIDTH, HEIGHT);
    document.body.style.setProperty("--border-size", Number(getComputedStyle(pixelPicker).getPropertyValue("border-left-width").replaceAll("px", "")) / 2 + "px");
};

const ID = 0;
const PIXEL_DATA = 1;
const PUZZLE_DATA = 2;
const UPDATED = 3;
const COLOR_R = 4;
const COLOR_G = 5;
const COLOR_B = 6;
const COLOR_A = 7;

let grid = new Int32Array();
// let gridWidth = 32;
// let gridHeight = 32;
let gridWidth = 128;
let gridHeight = 128;
// gridWidth *= 2;
// gridHeight *= 2;
// gridWidth *= 2;
// gridHeight *= 2;
// gridWidth = gridHeight = 2048;
// gridWidth *= 2;
// gridHeight *= 2;
// let gridStride = 9;
let gridStride = 4;
let chunks = new Int32Array();
let nextChunks = new Int32Array();
let drawChunks = new Int32Array();
let chunkWidth = 16;
let chunkHeight = 16;
// chunkWidth *= 2;
// chunkHeight *= 2;
let chunkXAmount = Math.ceil(gridWidth / chunkWidth);
let chunkYAmount = Math.ceil(gridHeight / chunkHeight);
let chunkStride = 4;

let gridUpdated = true;
let gridUpdatedChunks = new Int32Array();

let tick = 1;
let frame = 0;

const modalContainer = document.getElementById("modalContainer");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const modalYes = document.getElementById("modalYes");
const modalNo = document.getElementById("modalNo");
const modalOk = document.getElementById("modalOk");

function modal(title, content, type) {
    if (type == "error" && title == "Push error") {
        return;
    }
    modalContainer.showModal();
    modalTitle.innerHTML = title;
    modalContent.innerHTML = content;
    if (type == "confirm") {
        modalYes.style.display = "revert-layer";
        modalNo.style.display = "revert-layer";
        modalOk.style.display = "none";
    }
    else if (type == "info" || type == "error") {
        modalYes.style.display = "none";
        modalNo.style.display = "none";
        modalOk.style.display = "revert-layer";
    }

    if (type == "error") {
        modalTitle.innerHTML = "An error has occured";
        modalContent.innerHTML = title + "<br><br>" + content + "<br><br>Please report this to the developers";
    }
    setRunState("paused");
    return new Promise((resolve, reject) => {
        modalContainer.onclose = () => {
            resolve(modalContainer.returnValue == "true");
            modalContainer.returnValue = null;
        };
        // document.addEventListener("keydown", function cancel(e) {
        //     if (e.key == "Escape") {
        //         hide();
        //         resolve(false);
        //         document.removeEventListener("keydown", cancel);
        //     }
        // });
    });
};
modalYes.onclick = () => {
    modalContainer.close("true");
};
modalNo.onclick = () => {
    modalContainer.close("false");
};
modalOk.onclick = () => {
    modalContainer.close("true");
};

let runState = "paused";
let simulateSpeed = 10;

const playButton = document.getElementById("playButton");
const stepButton = document.getElementById("stepButton");
const simulateButton = document.getElementById("simulateButton");
const slowmodeButton = document.getElementById("slowmodeButton");

function setRunState(state) {
    runState = state;
    if (runState == "paused") {
        playButton.classList.remove("pauseButton");
        simulateButton.classList.remove("pauseButton");
        slowmodeButton.classList.remove("pauseButton");
    }
    else if (runState == "playing") {
        playButton.classList.add("pauseButton");
        simulateButton.classList.remove("pauseButton");
        slowmodeButton.classList.remove("pauseButton");
    }
    else if (runState == "simulating") {
        playButton.classList.remove("pauseButton");
        simulateButton.classList.add("pauseButton");
        slowmodeButton.classList.remove("pauseButton");
    }
    else if (runState == "slowmode") {
        playButton.classList.remove("pauseButton");
        simulateButton.classList.remove("pauseButton");
        slowmodeButton.classList.add("pauseButton");
    }
};

playButton.onclick = () => {
    setRunState(runState == "playing" ? "paused" : "playing");
};
stepButton.onclick = () => {
    if (runState == "paused") {
        updateGrid();
    }
};
simulateButton.onclick = () => {
    setRunState(runState == "simulating" ? "paused" : "simulating");
};
slowmodeButton.onclick = () => {
    setRunState(runState == "slowmode" ? "paused" : "slowmode");
};

const resetButton = document.getElementById("resetButton");
resetButton.onclick = async () => {
    if (await modal("Reset?", "Your current simulation will be deleted!", "confirm")) {
        resetGrid();
    }
};

const screenshotButton = document.getElementById("screenshotButton");
screenshotButton.onclick = async () => {
    console.log(drawBlueprintImg(grid, gridWidth, gridHeight, gridWidth * 6, gridHeight * 6))
    downloadFile(await (await fetch(drawBlueprintImg(grid, gridWidth, gridHeight, gridWidth * 6, gridHeight * 6))).blob(), "pixelsimulator" + Math.floor(Math.random() * 1000) + ".png");
};

const settingsContainer = document.getElementById("settingsContainer");

const settingsButton = document.getElementById("settingsButton");
settingsButton.onclick = async () => {
    settingsContainer.showModal();
};

const transitionContainer = document.getElementById("transitionContainer");
const transitionTop = document.getElementById("transitionTop");
const transitionBottom = document.getElementById("transitionBottom");
const gameContainer = document.getElementById("gameContainer");
const menuContainer = document.getElementById("menuContainer");

const menuButton = document.getElementById("menuButton");
menuButton.onclick = async () => {
    if (multiplayerContainer.style.display == "none") {
        if (currentPuzzle == null) {
            sandboxGrid = generateSaveCode();
            sandboxSaveCode = saveCode.value;
        }
        else {
            if (puzzleProgress[currentPuzzle] == null) {
                puzzleProgress[currentPuzzle] = {
                    saveCode: saveCode.value,
                    completed: false,
                    ticks: -1,
                    pixels: -1,
                };
            }
            else {
                puzzleProgress[currentPuzzle].saveCode = saveCode.value;
            }
        }
        setRunState("paused");
    }
    await transitionIn();
    gameContainer.style.display = "none";
    menuContainer.style.opacity = 1;
    menuContainer.style.pointerEvents = "auto";
    menuContainer.style.display = "block";
    if (currentPuzzle == null && multiplayerContainer.style.display == "none") {
        transitionContainer.style.display = "none";
        transitionTop.style.transform = "";
        transitionBottom.style.transform = "";
        slideInTitle();
    }
    else {
        transitionOut();
    }
};

const supportsFileSystemAccess = "showOpenFilePicker" in window &&
(() => {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
})();
async function downloadFile(blob, name) {
    // if (supportsFileSystemAccess) {
    //     const handle = await showSaveFilePicker({
    //         suggestedName: name,
    //     });
    //     const writable = await handle.createWritable();
    //     await writable.write(blob);
    //     await writable.close();
    //     return;
    // }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
};
async function uploadFile(acceptedFiles) {
    if (supportsFileSystemAccess) {
        const handle = await showOpenFilePicker({
            types: [
                {
                    accept: {
                        // "application/octet-stream": [acceptedFiles],
                        // "text/plain": [acceptedFiles],
                        "application/json": acceptedFiles,
                    },
                },
            ],
        });
        let file = await handle[0].getFile();
        // file.handle = handle;
        return file;
    }
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = acceptedFiles;
        input.oninput = () => {
            let files = input.files;
            if (files.length == 0) {
                return;
            }
            resolve(files[0]);
        };
        input.click();
    });
};

let sandboxGrid = "";
let sandboxSaveCode = "";

const saveCodeSettings = document.getElementById("saveCodeSettings");
const saveCodeSettingsToggle = document.getElementById("saveCodeSettingsToggle");
const saveCode = document.getElementById("saveCode");
const downloadSaveCodeButton = document.getElementById("downloadSaveCodeButton");
const uploadSaveCodeButton = document.getElementById("uploadSaveCodeButton");
const generateSaveCodeButton = document.getElementById("generateSaveCodeButton");

saveCodeSettingsToggle.onclick = () => {
    saveCodeSettings.classList.toggle("hidden");
};
saveCode.onkeydown = (e) => {
    e.stopImmediatePropagation();
};

downloadSaveCodeButton.onclick = (e) => {
    const blob = new Blob([JSON.stringify({
        saveCode: saveCode.value,
    })], { type: "application/json" });
    const now = new Date();
    downloadFile(blob, now.toISOString().slice(0, 16).replaceAll("T", "_") + ".pixel");
};
uploadSaveCodeButton.onclick = async (e) => {
    let file = await uploadFile([".pixel", ".json"]);
    const reader = new FileReader();
    reader.onload = async (e1) => {
        if (await modal("Load Save?", "Your current simulation will be overwritten!", "confirm")) {
            if (e.shiftKey) {
                let saveCode;
                try {
                    saveCode = JSON.parse(e1.target.result).saveCode;
                }
                catch (err) {
                    saveCode = e1.target.result;
                }
                loadSaveCode(saveCode);
            }
            else {
                try {
                    saveCode.value = JSON.parse(e1.target.result).saveCode;
                }
                catch (err) {
                    saveCode.value = e1.target.result;
                }
                loadSaveCode(saveCode.value);
            }
            setRunState("paused");
        }
    };
    reader.readAsText(file);
};
generateSaveCodeButton.onclick = () => {
    saveCode.value = generateSaveCode();
};

if (localStorage.getItem("sandboxSaveCode") != null) {
    try {
        sandboxSaveCode = localStorage.getItem("sandboxSaveCode");
    }
    catch (err) {
        modal("Save Code Error", "The stored sandbox save code was unable to be loaded.<br><br>" + err.stack, "error");
    }
}

let blueprints = [];

const blueprintSettingsContainer = document.getElementById("blueprintSettingsContainer");
const blueprintSettingsToggle = document.getElementById("blueprintSettingsToggle");
const saveBlueprintButton = document.getElementById("saveBlueprintButton");
const uploadBlueprintButton = document.getElementById("uploadBlueprintButton");
const blueprintsList = document.getElementById("blueprintsList");
const blueprintTemplate = document.getElementById("blueprintTemplate");

blueprintSettingsToggle.onclick = () => {
    blueprintSettingsContainer.classList.toggle("hidden");
    blueprintSettingsToggle.classList.toggle("hidden");
};

saveBlueprintButton.onclick = () => {
    if (selectionGrid != null) {
        let saveCode = generateSaveCode(true);
        addBlueprint("New Blueprint", saveCode, drawBlueprintImg(selectionGrid, selectionGridWidth, selectionGridHeight, 100, 100));
    }
    else {
        modal("No Selection!", "A copied selection is required to make a blueprint!", "info");
    }
};
uploadBlueprintButton.onclick = async () => {
    let file = await uploadFile([".pixel", ".json"]);
    const reader = new FileReader();
    reader.onload = async (e) => {
        let json;
        try {
            json = JSON.parse(e.target.result);
        }
        catch (err) {
            json = {
                saveCode: e.target.result,
            };
        }
        if (json.name == null) {
            json.name = "Unnamed";
        }
        if (json.img == null) {
            let parsed = parseSaveCode(json.saveCode);
            json.img = drawBlueprintImg(parsed.grid, parsed.gridWidth, parsed.gridHeight, 100, 100);
        }
        for (let i in blueprints) {
            if (blueprints[i].name == json.name) {
                if (!await modal("Overwrite Existing Blueprint?", "A blueprint with the name '" + json.name + "' already exists. Loading will overwrite this blueprint! This cannot be undone!", "confirm")) {
                    return;
                }
                blueprints[i].saveCode = json.saveCode;
                blueprints[i].img = json.img;
                blueprints[i].div.querySelector(".blueprintImg").style.backgroundImage = "url(" + json.img + ")";
                break;
            }
        }
        addBlueprint(json.name, json.saveCode, json.img);
    };
    reader.readAsText(file);
};

if (localStorage.getItem("blueprints") != null) {
    try {
        let storedBlueprints = JSON.parse(localStorage.getItem("blueprints"));
        for (let i in storedBlueprints) {
            addBlueprint(storedBlueprints[i].name, storedBlueprints[i].saveCode, storedBlueprints[i].img);
        }
    }
    catch (err) {
        modal("Blueprint Error", "The stored blueprints were unable to be loaded.<br><br>" + err.stack, "error");
    }
}

function generateSaveCode(selection = false) {
    let generatingGrid = grid;
    let generatingGridWidth = gridWidth;
    let generatingGridHeight = gridHeight;
    if (selection) {
        generatingGrid = selectionGrid;
        generatingGridWidth = selectionGridWidth;
        generatingGridHeight = selectionGridHeight;
    }

    let string = "";
    string += "V3;";
    string += tick + ";";
    string += generatingGridWidth + "-" + generatingGridHeight + ";";

    let id = generatingGrid[ID];
    let amount = 0;
    for (let i = 0; i < generatingGridWidth * generatingGridHeight * gridStride; i += gridStride) {
        if (generatingGrid[i + ID] != id) {
            string += pixels[id].id;
            if (amount > 1) {
                string += "-" + amount;
            }
            string += ":";

            id = generatingGrid[i + ID];
            amount = 0;
        }
        amount += 1;
    }
    string += pixels[id].id;
    if (amount > 1) {
        string += "-" + amount;
    }
    string += ";";

    id = generatingGrid[PIXEL_DATA];
    amount = 0;
    for (let i = 0; i < generatingGridWidth * generatingGridHeight * gridStride; i += gridStride) {
        if (generatingGrid[i + PIXEL_DATA] != id) {
            string += id;
            if (amount > 1) {
                string += "-" + amount;
            }
            string += ":";

            id = generatingGrid[i + PIXEL_DATA];
            amount = 0;
        }
        amount += 1;
    }
    string += id;
    if (amount > 1) {
        string += "-" + amount;
    }
    string += ";";

    id = generatingGrid[PUZZLE_DATA];
    amount = 0;
    for (let i = 0; i < generatingGridWidth * generatingGridHeight * gridStride; i += gridStride) {
        if (generatingGrid[i + PUZZLE_DATA] != id) {
            string += id;
            if (amount > 1) {
                string += "-" + amount;
            }
            string += ":";

            id = generatingGrid[i + PUZZLE_DATA];
            amount = 0;
        }
        amount += 1;
    }
    string += id;
    if (amount > 1) {
        string += "-" + amount;
    }
    string += ";";

    return string;
};
function parseSaveCode(string) {
    let sections = string.split(";");
    let version = sections.shift();
    if (version == "V1" || version == "V2") {
        let tick = 1;
        if (version == "V2") {
            tick = Number(sections.shift());
        }

        let array = sections.shift().split("-");
        let gridWidth = Number(array[0]);
        let gridHeight = array.length > 1 ? Number(array[1]) : gridWidth;
        let gridArray = [];
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                gridArray.push(...[0, 0, 0, 0]);
            }
        }
        let grid = new Int32Array(gridArray);

        array = sections.shift().split(":");
        let index = 0;
        for (let i in array) {
            let array2 = array[i].split("-");
            let id = array2[0];
            for (let j = 0; j < pixels.length; j++) {
                if (pixels[j].id == id) {
                    id = j;
                    break;
                }
            }
            let amount = 1;
            if (array2.length > 1) {
                amount = Number(array2[1]);
            }

            for (let j = 0; j < amount; j++) {
                grid[index + ID] = id;
                index += gridStride;
            }
        }

        array = sections.shift().split(":");
        let fire = Number(array[0]);
        array.shift();
        index = 0;

        for (let i in array) {
            let amount = Number(array[i]);

            for (let j = 0; j < amount; j++) {
                grid[index + PIXEL_DATA] = fire;
                index += gridStride;
            }

            fire = (fire + 1) % 2;
        }

        array = sections.shift().split(":");
        index = 0;
        for (let i in array) {
            let array2 = array[i].split("-");
            let id = Number(array2[0]);
            let amount = 1;
            if (array2.length > 1) {
                amount = Number(array2[1]);
            }

            for (let j = 0; j < amount; j++) {
                grid[index + PUZZLE_DATA] = id;
                index += gridStride;
            }
        }

        return {
            tick: tick,
            grid: grid,
            gridWidth: gridWidth,
            gridHeight: gridHeight,
        };
    }
    else if (version == "V3") {
        let tick = Number(sections.shift());

        let array = sections.shift().split("-");
        let gridWidth = Number(array[0]);
        let gridHeight = array.length > 1 ? Number(array[1]) : gridWidth;
        let gridArray = [];
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                gridArray.push(...[0, 0, 0, 0]);
            }
        }
        let grid = new Int32Array(gridArray);

        array = sections.shift().split(":");
        let index = 0;
        for (let i in array) {
            let array2 = array[i].split("-");
            let id = array2[0];
            for (let j = 0; j < pixels.length; j++) {
                if (pixels[j].id == id) {
                    id = j;
                    break;
                }
            }
            let amount = 1;
            if (array2.length > 1) {
                amount = Number(array2[1]);
            }

            for (let j = 0; j < amount; j++) {
                grid[index + ID] = id;
                index += gridStride;
            }
        }

        array = sections.shift().split(":");
        index = 0;
        for (let i in array) {
            let array2 = array[i].split("-");
            let id = Number(array2[0]);
            let amount = 1;
            if (array2.length > 1) {
                amount = Number(array2[1]);
            }

            for (let j = 0; j < amount; j++) {
                grid[index + PIXEL_DATA] = id;
                index += gridStride;
            }
        }

        array = sections.shift().split(":");
        index = 0;
        for (let i in array) {
            let array2 = array[i].split("-");
            let id = Number(array2[0]);
            let amount = 1;
            if (array2.length > 1) {
                amount = Number(array2[1]);
            }

            for (let j = 0; j < amount; j++) {
                grid[index + PUZZLE_DATA] = id;
                index += gridStride;
            }
        }

        return {
            tick: tick,
            grid: grid,
            gridWidth: gridWidth,
            gridHeight: gridHeight,
        };
    }
};
function loadSaveCode(string, selection = false, puzzle = false) {
    let parsed = parseSaveCode(string);
    if (parsed == null) {
        return;
    }
    if (selection) {
        selectionGrid = parsed.grid;
        selectionGridWidth = parsed.gridWidth;
        selectionGridHeight = parsed.gridHeight;
    }
    else if (!puzzle) {
        tick = parsed.tick;
        gridWidth = parsed.gridWidth;
        gridHeight = parsed.gridHeight;
        createGrid();
        grid = parsed.grid;
        gridUpdated = true;
        let sections = string.split(";");
        let version = sections[0];
        if (version == "V1" || version == "V2" || version == "V3") {
            let array = sections[version != "V1" ? 5 : 4].split(":");
            let index = 0;
            for (let i in array) {
                let array2 = array[i].split("-");
                let id = Number(array2[0]);
                let amount = 1;
                if (array2.length > 1) {
                    amount = Number(array2[1]);
                }

                if ((id & 2) == 2) {
                    for (let j = 0; j < amount; j++) {
                        if (targets[Math.floor(index / gridWidth)] == null) {
                            targets[Math.floor(index / gridWidth)] = [];
                        }
                        targets[Math.floor(index / gridWidth)][index % gridWidth] = 1;
                        index++;
                    }
                }
                else {
                    index += amount;
                }
            }
        }
    }
    else {
        for (let y = 0; y < Math.min(gridHeight, parsed.gridHeight); y++) {
            for (let x = 0; x < Math.min(gridWidth, parsed.gridWidth); x++) {
                let index = (x + y * gridWidth) * gridStride;
                let parsedIndex = (x + y * parsed.gridWidth) * gridStride;
                if ((grid[index + PUZZLE_DATA] & 1) == 1) {
                    continue;
                }
                let id = parsed.grid[parsedIndex + ID];
                if (grid[index + ID] != id) {
                    if (grid[index + ID] != AIR) {
                        pixelInventory[grid[index + ID]] += 1;
                        pixelInventoryUpdates[grid[index + ID]] = true;
                    }
                    grid[index + ID] = AIR;
                }
                let pixelData = parsed.grid[parsedIndex + PIXEL_DATA];
                if ((grid[index + PIXEL_DATA] & 1) != (pixelData & 1) && (pixelData & 1) == 0) {
                    pixelInventory[FIRE] += 1;
                    pixelInventoryUpdates[FIRE] = true;
                    grid[index + PIXEL_DATA] &= ~1;
                }
            }
        }
        updatePixelInventory();
        for (let y = 0; y < Math.min(gridHeight, parsed.gridHeight); y++) {
            for (let x = 0; x < Math.min(gridWidth, parsed.gridWidth); x++) {
                let index = (x + y * gridWidth) * gridStride;
                let parsedIndex = (x + y * parsed.gridWidth) * gridStride;
                if ((grid[index + PUZZLE_DATA] & 1) == 1) {
                    continue;
                }
                let id = parsed.grid[parsedIndex + ID];
                if (grid[index + ID] != id && id != AIR && pixelInventory[id] != 0) {
                    if (grid[index + ID] != AIR) {
                        pixelInventory[grid[index + ID]] += 1;
                        pixelInventoryUpdates[grid[index + ID]] = true;
                    }
                    grid[index + ID] = id;
                    pixelInventory[id] -= 1;
                    pixelInventoryUpdates[id] = true;
                }
                let pixelData = parsed.grid[parsedIndex + PIXEL_DATA];
                if ((grid[index + PIXEL_DATA] & 1) != (pixelData & 1) && (pixelData & 1) == 1 && pixelInventory[FIRE] != 0) {
                    pixelInventory[FIRE] -= 1;
                    pixelInventoryUpdates[FIRE] = true;
                    grid[index + PIXEL_DATA] |= 1;
                }
            }
        }
        updatePixelInventory();
        gridUpdated = true;
    }
};

function addBlueprint(name, saveCode, img) {
    let data = {
        name: name,
        saveCode: saveCode,
        img: img,
    };
    const blueprint = blueprintTemplate.content.cloneNode(true);
    const blueprintImg = blueprint.querySelector(".blueprintImg");
    blueprintImg.style.backgroundImage = "url(" + img + ")";
    const blueprintName = blueprint.querySelector(".blueprintName");
    blueprintName.value = name;
    blueprintName.oninput = () => {
        data.name = blueprintName.value;
    };
    blueprintName.onkeydown = (e) => {
        e.stopImmediatePropagation();
    };
    const blueprintCopyButton = blueprint.querySelector(".blueprintCopyButton");
    blueprintCopyButton.onclick = () => {
        loadSaveCode(data.saveCode, true);
    };
    const blueprintDownloadButton = blueprint.querySelector(".blueprintDownloadButton");
    blueprintDownloadButton.onclick = () => {
        const blob = new Blob([JSON.stringify({
            name: data.name,
            saveCode: data.saveCode,
            img: data.img,
        })], { type: "application/json" });
        const now = new Date();
        downloadFile(blob, now.toISOString().slice(0, 16).replaceAll("T", "_") + ".pixel");
    };
    const blueprintDeleteButton = blueprint.querySelector(".blueprintDeleteButton");
    blueprintDeleteButton.onclick = async () => {
        if (await modal("Delete blueprint?", "'" + data.name + "' will be lost forever!", "confirm")) {
            // TODO: how to not spaghetti buh
            // blueprintsList.removeChild(data.div);
            data.div.remove();
            for (let i in blueprints) {
                if (blueprints[i] == data) {
                    blueprints.splice(i, 1);
                    return;
                }
            }
        }
    };
    blueprintsList.appendChild(blueprint);
    data.div = blueprintImg.parentNode;
    blueprints.push(data);
};
function drawBlueprintImg(grid, gridWidth, gridHeight, width, height) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    let scale = Math.min(width / gridWidth, height / gridHeight);
    ctx.scale(scale, scale);
    for (let i = 0; i < gridWidth * gridHeight * gridStride; i += gridStride) {
        let x = width / 2 / scale - gridWidth / 2 + (i / gridStride) % gridWidth;
        let y = height / 2 / scale - gridHeight / 2 + Math.floor(i / gridStride / gridWidth);
        let pixel = pixels[grid[i + ID]];
        if (pixel.color != null) {
            ctx.fillStyle = "rgba(" + pixel.color[0] + ", " + pixel.color[1] + ", " + pixel.color[2] + ", 1)";
            if (pixel.noise != null) {
                ctx.fillStyle = "rgba(" + (pixel.color[0] + pixel.noise[0] / 2) + ", " + (pixel.color[1] + pixel.noise[1] / 2) + ", " + (pixel.color[2] + pixel.noise[2] / 2) + ", 1)";
            }
            ctx.fillRect(x, y, 1, 1);
        }
        else if (Array.isArray(pixel.texture)) {
            ctx.drawImage(pixelTexture, pixel.texture[0][0], pixel.texture[0][1], pixel.texture[0][2], pixel.texture[0][3], x, y, 1, 1);
        }
        else {
            ctx.drawImage(pixelTexture, pixel.texture[0], pixel.texture[1], pixel.texture[2], pixel.texture[3], x, y, 1, 1);
        }
        if ((grid[i + PIXEL_DATA] & 1) == 1) {
            ctx.fillStyle = "rgba(255, 153, 0, 0.585)";
            ctx.fillRect(x, y, 1, 1);
        }
        if ((grid[i + PUZZLE_DATA] & 1) == 1) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
            ctx.fillRect(x, y, 1, 1);
        }
        if ((grid[i + PUZZLE_DATA] & 4) == 4) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.16)";
            ctx.fillRect(x, y, 1, 1);
        }
        if ((grid[i + PUZZLE_DATA] & 8) == 8) {
            ctx.fillStyle = "rgba(0, 0, 255, 0.16)";
            ctx.fillRect(x, y, 1, 1);
        }
    }
    return canvas.toDataURL("image/png");
};

// settings

let settingsData = {
    volume: {
        name: "Volume",
        group: "Sound",
        min: 0,
        max: 100,
        step: 1,
        default: 100,
    },
    debug: {
        name: "Debug",
        group: "Debug",
        default: false,
    },
    drawUpdatingChunks: {
        name: "Draw Updating Chunks",
        group: "Debug",
        default: false,
    },
};

let settings = {};

for (let i in settingsData) {
    settings[i] = structuredClone(settingsData[i].default);
}

if (localStorage.getItem("settings") != null) {
    try {
        let json = JSON.parse(localStorage.getItem("settings"));
        for (let i in settings) {
            if (typeof settings[i] == typeof json[i]) {
                settings[i] = json[i];
            }
        }
    }
    catch (err) {
        modal("Settings Error", "The stored settings were unable to be loaded.<br><br>" + err.stack, "error");
    }
}

const settingsGrid = document.getElementById("settingsGrid");

const settingsCloseButton = document.getElementById("settingsCloseButton");
settingsCloseButton.onclick = () => {
    settingsContainer.close();
};

const volumeSlider = document.getElementById("volumeSlider");
volumeSlider.value = settings.volume;
volumeSlider.oninput();

// controls

let controls = {
    Shift: false,
    Control: false,
    Alt: false,
    Meta: false,
};

let keybindsData = {
    mainAction: {
        name: "Main Action",
        subgroup: "Controls",
        default: [{ keys: ["LMB"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    secondaryAction: {
        name: "Secondary Action",
        subgroup: "Controls",
        default: [{ keys: ["RMB"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    move: {
        name: "Move",
        subgroup: "Camera",
        default: [{ keys: ["MMB"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    moveLeft: {
        name: "Move Left",
        subgroup: "Camera",
        default: [{ keys: ["A"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    moveRight: {
        name: "Move Right",
        subgroup: "Camera",
        default: [{ keys: ["D"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    moveUp: {
        name: "Move Up",
        subgroup: "Camera",
        default: [{ keys: ["W"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    moveDown: {
        name: "Move Down",
        subgroup: "Camera",
        default: [{ keys: ["S"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    zoomIn: {
        name: "Zoom In",
        subgroup: "Camera",
        default: [{ keys: ["E"], shift: false, ctrl: false, alt: false, meta: false }, { keys: ["]"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    zoomOut: {
        name: "Zoom Out",
        subgroup: "Camera",
        default: [{ keys: ["Q"], shift: false, ctrl: false, alt: false, meta: false }, { keys: ["["], shift: false, ctrl: false, alt: false, meta: false }],
    },
    incrementBrushSize: {
        name: "Increment Brush Size",
        subgroup: "Brush",
        default: [{ keys: ["ArrowUp"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    decrementBrushSize: {
        name: "Decrement Brush Size",
        subgroup: "Brush",
        default: [{ keys: ["ArrowDown"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    pickBrushPixel: {
        name: "Pick Brush Pixel",
        subgroup: "Brush",
        default: [{ keys: ["MMB"], shift: false, ctrl: true, alt: false, meta: false }],
    },
    beginSelection: {
        name: "Begin Selection",
        subgroup: "Selection",
        default: [{ keys: ["LMB"], shift: false, ctrl: true, alt: false, meta: false }],
    },
    endSelection: {
        name: "End Selection",
        subgroup: "Selection",
        default: [{ keys: ["Escape"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    copySelection: {
        name: "Copy Selection",
        subgroup: "Selection",
        default: [{ keys: ["C"], shift: false, ctrl: true, alt: false, meta: false }],
    },
    pasteSelection: {
        name: "Paste Selection",
        subgroup: "Selection",
        default: [{ keys: ["V"], shift: false, ctrl: true, alt: false, meta: false }],
    },
    cutSelection: {
        name: "Cut Selection",
        subgroup: "Selection",
        default: [{ keys: ["X"], shift: false, ctrl: true, alt: false, meta: false }],
    },
    deleteSelection: {
        name: "Delete Selection",
        subgroup: "Selection",
        default: [{ keys: ["Backspace"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    rotateSelectionClockwise: {
        name: "Rotate Selection Clockwise",
        subgroup: "Selection",
        default: [{ keys: ["R"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    rotateSelectionCounterClockwise: {
        name: "Rotate Selection Counterclockwise",
        subgroup: "Selection",
        default: [{ keys: ["R"], shift: true, ctrl: false, alt: false, meta: false }],
    },
    flipSelectionHorizontally: {
        name: "Flip Selection Horizontally",
        subgroup: "Selection",
        default: [{ keys: ["F"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    flipSelectionVertically: {
        name: "Flip Selection Vertically",
        subgroup: "Selection",
        default: [{ keys: ["G"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    play: {
        name: "Play",
        subgroup: "Controls",
        default: [{ keys: ["P"], shift: false, ctrl: false, alt: false, meta: false }, { keys: ["Space"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    step: {
        name: "Step",
        subgroup: "Controls",
        default: [{ keys: ["Enter"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    debug: {
        name: "Debug",
        subgroup: "Debug",
        default: [{ keys: ["\\"], shift: false, ctrl: false, alt: false, meta: false }],
    },
    drawUpdatingChunks: {
        name: "Draw Updating Chunks",
        subgroup: "Debug",
        default: [{ keys: ["B"], shift: false, ctrl: false, alt: false, meta: false }],
    },
};

let keybinds = {};

for (let i in keybindsData) {
    keybinds[i] = structuredClone(keybindsData[i].default);
}

if (localStorage.getItem("keybinds") != null) {
    try {
        let json = JSON.parse(localStorage.getItem("keybinds"));
        for (let i in keybinds) {
            if (typeof keybinds[i] == typeof json[i]) {
                keybinds[i] = json[i];
            }
        }
    }
    catch (err) {
        modal("Keybinds Error", "The stored keybinds were unable to be loaded.<br><br>" + err.stack, "error");
    }
}

let keyboardLayoutMap = await navigator?.keyboard?.getLayoutMap();

// keybinds["Main Action"] = [{ key: "LMB" }];
// keybinds["Secondary Action"] = [{ key: "RMB" }];
// keybinds["Move"] = [{ key: "MMB" }];
// keybinds["Move Left"] = [{ key: "a", ctrl: false, alt: false, meta: false }];
// keybinds["Move Right"] = [{ key: "d", ctrl: false, alt: false, meta: false }];
// keybinds["Move Up"] = [{ key: "w", ctrl: false, alt: false, meta: false }];
// keybinds["Move Down"] = [{ key: "s", ctrl: false, alt: false, meta: false }];
// keybinds["Zoom In"] = [{ key: "e", ctrl: false, alt: false, meta: false }, { key: "]", ctrl: false, alt: false, meta: false }];
// keybinds["Zoom Out"] = [{ key: "q", ctrl: false, alt: false, meta: false }, { key: "[", ctrl: false, alt: false, meta: false }];
// keybinds["Increment Brush Size"] = [{ key: "ArrowUp", ctrl: false, alt: false, meta: false }];
// keybinds["Decrement Brush Size"] = [{ key: "ArrowDown", ctrl: false, alt: false, meta: false }];
// keybinds["Pick Brush Pixel"] = [{ key: "MMB" }];
// keybinds["Begin Selection"] = [{ key: "Control", ctrl: true, alt: null, meta: null }];
// keybinds["End Selection"] = [{ key: "Escape", ctrl: false, alt: false, meta: false }];
// keybinds["Copy Selection"] = [{ key: "c", ctrl: true, alt: false, meta: false }];
// keybinds["Paste Selection"] = [{ key: "v", ctrl: true, alt: false, meta: false }];
// keybinds["Cut Selection"] = [{ key: "x", ctrl: true, alt: false, meta: false }];
// keybinds["Delete Selection"] = [{ key: "Backspace", ctrl: false, alt: false, meta: false }];
// keybinds["Rotate Selection Clockwise"] = [{ key: "r", ctrl: false, alt: false, meta: false }];
// keybinds["Rotate Selection Counterclockwise"] = [{ key: "R", ctrl: false, alt: false, meta: false }];
// keybinds["Flip Selection Horizontally"] = [{ key: "f", ctrl: false, alt: false, meta: false }];
// keybinds["Flip Selection Vertically"] = [{ key: "g", ctrl: false, alt: false, meta: false }];
// keybinds["Play"] = [{ key: "p", ctrl: false, alt: false, meta: false }, { key: "Space", ctrl: false, alt: false, meta: false }];
// keybinds["Step"] = [{ key: "Enter", ctrl: false, alt: false, meta: false }];
// keybinds["Draw Updating Chunks"] = [{ key: "b", ctrl: false, alt: false, meta: false }];

function getKeybindText(keybind) {
    let text = "";
    for (let i in keybind.keys) {
        if (i != 0) {
            text += " + ";
        }
        let key = keybind.keys[i];
        text += key;
    }
    if (keybind.shift) {
        text = "Shift + " + text;
    }
    if (keybind.meta) {
        text = "Meta + " + text;
    }
    if (keybind.alt) {
        text = "Alt + " + text;
    }
    if (keybind.ctrl) {
        text = "Ctrl + " + text;
    }
    return text;
};

let addingKeybind = null;
const addKeybindContainer = document.getElementById("addKeybindContainer");

function updateAddingKeybind() {
    let text = "";
    for (let i in controls) {
        if (!controls[i]) {
            continue;
        }
        if (i != "Shift" && i != "Meta" && i != "Alt" && i != "Control") {
            if (text != "") {
                text += " + ";
            }
            text += i;
        }
    }
    if (controls["Shift"] != false) {
        text = "Shift + " + text;
    }
    if (controls["Meta"] != false) {
        text = "Meta + " + text;
    }
    if (controls["Alt"] != false) {
        text = "Alt + " + text;
    }
    if (controls["Control"] != false) {
        text = "Ctrl + " + text;
    }
    if (text != "") {
        addKeybindContainer.innerText = text;
    }
    else {
        addKeybindContainer.innerText = "Press any key"
    }
};
function endAddingKeybind() {
    let keybind = {
        keys: [],
        shift: controls["Shift"] != false,
        ctrl: controls["Control"] != false,
        alt: controls["Alt"] != false,
        meta: controls["Meta"] != false,
    };
    for (let i in controls) {
        if (!controls[i]) {
            continue;
        }
        if (i != "Shift" && i != "Meta" && i != "Alt" && i != "Control") {
            keybind.keys.push(i);
        }
    }
    keybinds[addingKeybind].push(keybind);
    
    let text = "";
    for (let i in keybinds[addingKeybind]) {
        if (i != 0) {
            text += ", ";
        }
        text += getKeybindText(keybinds[addingKeybind][i]);
    }
    keybindButtons[addingKeybind].innerText = text;

    addingKeybind = null;
    addKeybindContainer.close();
};

let keybindButtons = {};
let keybindsSubgroupDivs = {};

let group = document.createElement("div");
group.classList.add("settingsGroupTitle");
group.innerText = "Keybinds";
settingsGrid.appendChild(group);

for (let i in keybindsData) {
    if (keybindsSubgroupDivs[keybindsData[i].subgroup] == null) {
        let subgroup = document.createElement("div");
        subgroup.classList.add("settingsSubgroupTitle");
        subgroup.innerText = keybindsData[i].subgroup;
        settingsGrid.appendChild(subgroup);
        keybindsSubgroupDivs[keybindsData[i].subgroup] = subgroup;
    }
    let label = document.createElement("label");
    label.classList.add("settingsKeybindLabel");
    label.innerText = keybindsData[i].name + ":";
    settingsGrid.appendChild(label);
    let buttons = document.createElement("div");
    buttons.classList.add("settingsKeybindButtons");
    let button = document.createElement("button");
    button.classList.add("settingsKeybindButton");
    let text = "";
    for (let j in keybinds[i]) {
        if (j != 0) {
            text += ", ";
        }
        text += getKeybindText(keybinds[i][j]);
    }
    button.innerText = text;
    button.onclick = function() {
        addKeybindContainer.showModal();
        addingKeybind = i;
        updateAddingKeybind();
    };
    keybindButtons[i] = button;
    buttons.appendChild(button);
    let resetButton = document.createElement("button");
    resetButton.classList.add("settingsKeybindResetButton");
    resetButton.innerText = "Reset";
    resetButton.onclick = function() {
        keybinds[i] = [];
        keybindButtons[i].innerText = "Not Bound";
    };
    buttons.appendChild(resetButton);
    settingsGrid.appendChild(buttons);
}
let resetToDefaultsButton = document.createElement("button");
resetToDefaultsButton.id = "settingsKeybindResetToDefaultsButton";
resetToDefaultsButton.innerText = "Reset All Keybinds to Defaults";
resetToDefaultsButton.onclick = function() {
    for (let i in keybinds) {
        keybinds[i] = structuredClone(keybindsData[i].default);
        let text = "";
        for (let j in keybinds[i]) {
            if (j != 0) {
                text += ", ";
            }
            text += getKeybindText(keybinds[i][j]);
        }
        keybindButtons[i].innerText = text;
    }
};
settingsGrid.appendChild(resetToDefaultsButton);

for (let i in keybinds) {
    for (let j in keybinds[i]) {
        for (let k in keybinds[i][j].keys) {
            controls[keybinds[i][j].keys[k]] = false;
        }
    }
}

function isKeybindPressed(keybind) {
    if (addingKeybind) {
        return false;
    }
    search: for (let i in keybinds[keybind]) {
        let min = Number.MAX_VALUE;
        for (let j in keybinds[keybind][i].keys) {
            if (controls[keybinds[keybind][i].keys[j]] == false) {
                continue search;
            }
            min = Math.min(min, controls[keybinds[keybind][i].keys[j]]);
        }
        if (((controls["Shift"] != false) && (controls["Shift"] <= min)) != keybinds[keybind][i].shift) {
            continue;
        }
        if (((controls["Control"] != false) && (controls["Control"] <= min)) != keybinds[keybind][i].ctrl) {
            continue;
        }
        if (((controls["Alt"] != false) && (controls["Alt"] <= min)) != keybinds[keybind][i].alt) {
            continue;
        }
        if (((controls["Meta"] != false) && (controls["Meta"] <= min)) != keybinds[keybind][i].meta) {
            continue;
        }
        return true;
    }
    return false;
};
function isKeybindJustPressed(keybind) {
    if (addingKeybind) {
        return false;
    }
    // spaghetti but it seems to work
    search: for (let i in keybinds[keybind]) {
        let min = Number.MAX_VALUE;
        for (let j in keybinds[keybind][i].keys) {
            if (controls[keybinds[keybind][i].keys[j]] == false || controls[keybinds[keybind][i].keys[j]] < lastFrame) {
                continue search;
            }
            min = Math.min(min, controls[keybinds[keybind][i].keys[j]]);
        }
        if (((controls["Shift"] != false) && (controls["Shift"] <= min)) != keybinds[keybind][i].shift) {
            continue;
        }
        if (((controls["Control"] != false) && (controls["Control"] <= min)) != keybinds[keybind][i].ctrl) {
            continue;
        }
        if (((controls["Alt"] != false) && (controls["Alt"] <= min)) != keybinds[keybind][i].alt) {
            continue;
        }
        if (((controls["Meta"] != false) && (controls["Meta"] <= min)) != keybinds[keybind][i].meta) {
            continue;
        }
        return true;
    }
    return false;
};

function updateKeybinds(key) {
    if (selectionState == BRUSH) {
        for (let i in keybinds["incrementBrushSize"]) {
            for (let j in keybinds["incrementBrushSize"][i].keys) {
                if (key == keybinds["incrementBrushSize"][i].keys[j]) {
                    if (isKeybindPressed("incrementBrushSize")) {
                        brushSize = Math.min(brushSize + 1, Math.ceil((Math.max(gridWidth, gridHeight) + 1) / 2));
                    }
                }
            }
        }
        for (let i in keybinds["decrementBrushSize"]) {
            for (let j in keybinds["decrementBrushSize"][i].keys) {
                if (key == keybinds["decrementBrushSize"][i].keys[j]) {
                    if (isKeybindPressed("decrementBrushSize")) {
                        brushSize = Math.max(brushSize - 1, 1);
                    }
                }
            }
        }
    }
    search: for (let i in keybinds["play"]) {
        for (let j in keybinds["play"][i].keys) {
            if (key == keybinds["play"][i].keys[j]) {
                if (isKeybindPressed("play")) {
                    // e.preventDefault();
                    let button = null;
                    switch (runState) {
                        case "paused":
                        case "playing":
                            button = playButton;
                            playButton.focus();
                            // playButton.click();
                            break;
                        case "simulating":
                            button = simulateButton;
                            // simulateButton.click();
                            break;
                        case "slowmode":
                            button = slowmodeButton;
                            // slowmodeButton.click();
                            break;
                    }
                    if (document.activeElement != button) {
                        e.preventDefault();
                        button.focus();
                        button.click();
                    }
                    break search;
                }
            }
        }
    }
    if (runState == "paused") {
        for (let i in keybinds["step"]) {
            for (let j in keybinds["step"][i].keys) {
                if (key == keybinds["step"][i].keys[j]) {
                    if (isKeybindPressed("step")) {
                        updateGrid();
                    }
                }
            }
        }
    }
    for (let i in keybinds["debug"]) {
        for (let j in keybinds["debug"][i].keys) {
            if (key == keybinds["debug"][i].keys[j]) {
                if (isKeybindJustPressed("debug")) {
                    settings.debug = !settings.debug;
                }
            }
        }
    }
    for (let i in keybinds["drawUpdatingChunks"]) {
        for (let j in keybinds["drawUpdatingChunks"][i].keys) {
            if (key == keybinds["drawUpdatingChunks"][i].keys[j]) {
                if (isKeybindJustPressed("drawUpdatingChunks")) {
                    settings.drawUpdatingChunks = !settings.drawUpdatingChunks;
                }
            }
        }
    }
};

let mouseX = 0;
let mouseY = 0;
let mouseRawX = 0;
let mouseRawY = 0;

let brushSize = 1 + 4;
let brushPixel = 1;
let lastBrushX = 0;
let lastBrushY = 0;

function setBrushPixel(pixel) {
    brushPixel = pixel;
    updateBrushPixel();
};

const BRUSH = 0;
const SELECTING = 1;
const SELECTED = 2;
const PASTING = 3;

let selectionState = BRUSH;
let selectionX = 0;
let selectionY = 0;
let selectionWidth = 0;
let selectionHeight = 0;
let selectionGrid = null;
let selectionGridWidth = 0;
let selectionGridHeight = 0;

function drawMouse(ctx) {
    let brushX = Math.floor(cameraX + mouseX / cameraScale);
    let brushY = Math.floor(cameraY + mouseY / cameraScale);
    if (selectionState == BRUSH) {
        ctx.translate(-Math.round(cameraX * cameraScale), -Math.round(cameraY * cameraScale));
        ctx.strokeStyle = "rgba(0, 0, 0)";
        ctx.lineWidth = cameraScale / 10;
        ctx.setLineDash([]);
        ctx.lineJoin = "miter";
        ctx.strokeRect(brushX * cameraScale - (brushSize - 1) * cameraScale, brushY * cameraScale - (brushSize - 1) * cameraScale, (brushSize * 2 - 1) * cameraScale, (brushSize * 2 - 1) * cameraScale);
    }
    else if (selectionState == SELECTING) {
        ctx.translate(-Math.round(cameraX * cameraScale), -Math.round(cameraY * cameraScale));
        ctx.strokeStyle = "rgba(0, 0, 0)";
        // ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = cameraScale / 10;
        ctx.setLineDash([cameraScale / 2, cameraScale / 2]);
        ctx.lineJoin = "miter";
        let minX = Math.min(selectionX, brushX);
        let maxX = Math.max(selectionX, brushX);
        let minY = Math.min(selectionY, brushY);
        let maxY = Math.max(selectionY, brushY);
        ctx.strokeRect(minX * cameraScale, minY * cameraScale, (maxX - minX + 1) * cameraScale, (maxY - minY + 1) * cameraScale);
        ctx.fillRect(minX * cameraScale, minY * cameraScale, (maxX - minX + 1) * cameraScale, (maxY - minY + 1) * cameraScale);
    }
    else if (selectionState == SELECTED) {
        ctx.translate(-Math.round(cameraX * cameraScale), -Math.round(cameraY * cameraScale));
        ctx.strokeStyle = "rgba(0, 0, 0)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = cameraScale / 10;
        ctx.setLineDash([cameraScale / 2, cameraScale / 2]);
        ctx.lineJoin = "miter";
        ctx.strokeRect(selectionX * cameraScale, selectionY * cameraScale, selectionWidth * cameraScale, selectionHeight * cameraScale);
        ctx.fillRect(selectionX * cameraScale, selectionY * cameraScale, selectionWidth * cameraScale, selectionHeight * cameraScale);
    }
    else if (selectionState == PASTING) {
        let startX = Math.floor(cameraX + mouseX / cameraScale - (selectionWidth - 1) / 2);
        let startY = Math.floor(cameraY + mouseY / cameraScale - (selectionHeight - 1) / 2);

        ctx.translate(-Math.round(cameraX * cameraScale), -Math.round(cameraY * cameraScale));
        ctx.strokeStyle = "rgba(0, 0, 0)";
        ctx.lineWidth = cameraScale / 10;
        ctx.setLineDash([cameraScale / 2, cameraScale / 2]);
        ctx.lineJoin = "miter";
        ctx.strokeRect(startX * cameraScale, startY * cameraScale, selectionWidth * cameraScale, selectionHeight * cameraScale);
    }
    ctx.setLineDash([]);
    ctx.resetTransform();
};
function updateMouse() {
    let brushX = Math.floor(cameraX + mouseX / cameraScale);
    let brushY = Math.floor(cameraY + mouseY / cameraScale);
    // this is a lot of spaghetti
    if (isKeybindJustPressed("endSelection") || isKeybindJustPressed("secondaryAction")) {
        if (selectionState == SELECTING || selectionState == SELECTED || selectionState == PASTING) {
            selectionState = BRUSH;
            controls["RMB"] = false;
        }
    }
    else if (isKeybindJustPressed("beginSelection")) {
        if (selectionState == BRUSH) {
            selectionState = SELECTING;
            selectionX = brushX;
            selectionY = brushY;
        }
    }
    else {
        if (isKeybindJustPressed("pasteSelection")) {
            if (selectionGrid != null) {
                selectionState = PASTING;
                selectionWidth = selectionGridWidth;
                selectionHeight = selectionGridHeight;
            }
        }
        if (selectionState == SELECTING && !isKeybindPressed("beginSelection")) {
            selectionState = SELECTED;
            let minX = Math.min(selectionX, brushX);
            let maxX = Math.max(selectionX, brushX);
            let minY = Math.min(selectionY, brushY);
            let maxY = Math.max(selectionY, brushY);

            selectionX = minX;
            selectionY = minY;
            selectionWidth = maxX - minX + 1;
            selectionHeight = maxY - minY + 1;
        }
    }
    if (multiplayerId != null) {
        if (selectionState == BRUSH) {
            if (isKeybindPressed("secondaryAction")) {
                socket.emit("brush", {
                    type: 0,
                    remove: true,
                    x: brushX,
                    y: brushY,
                    lastX: lastBrushX,
                    lastY: lastBrushY,
                    size: brushSize,
                    pixel: brushPixel,
                });
                lastBrushX = brushX;
                lastBrushY = brushY;
                return;
            }
            else if (isKeybindPressed("mainAction")) {
                socket.emit("brush", {
                    type: 0,
                    remove: false,
                    x: brushX,
                    y: brushY,
                    lastX: lastBrushX,
                    lastY: lastBrushY,
                    size: brushSize,
                    pixel: brushPixel,
                });
                lastBrushX = brushX;
                lastBrushY = brushY;
                return;
            }
        }
        else if (selectionState == PASTING) {
            let startX = Math.floor(cameraX + mouseX / cameraScale - (selectionWidth - 1) / 2);
            let startY = Math.floor(cameraY + mouseY / cameraScale - (selectionHeight - 1) / 2);
            if (isKeybindPressed("mainAction")) {
                socket.emit("brush", {
                    type: 1,
                    x: startX,
                    y: startY,
                    width: selectionWidth,
                    height: selectionHeight,
                    grid: selectionGrid,
                });
                lastBrushX = brushX;
                lastBrushY = brushY;
                return;
            }
        }
    }
    let changed = false;
    if (selectionState == BRUSH) {
        function raytrace(x1, y1, x2, y2, size, action) {
            let slope = (y2 - y1) / (x2 - x1);
            if (slope == 0) {
                if (y1 <= -size || y1 >= gridHeight + size) {
                    return;
                }
                let minX = Math.min(x1, x2);
                let maxX = Math.max(x1, x2);
                let start = Math.max(1 - size, minX);
                let end = Math.min(gridWidth - 2 + size, maxX);
                for (let x = start; x <= end; x++) {
                    if (!action(Math.max(x - size + 1, 0), Math.max(y1 - size + 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y1 + size - 1, gridHeight - 1))) {
                        return;
                    }
                }
            }
            else if (!isFinite(slope)) {
                if (x1 <= -size || x1 >= gridWidth + size) {
                    return;
                }
                let minY = Math.min(y1, y2);
                let maxY = Math.max(y1, y2);
                let start = Math.max(1 - size, minY);
                let end = Math.min(gridHeight - 2 + size, maxY);
                for (let y = start; y <= end; y++) {
                    if (!action(Math.max(x1 - size + 1, 0), Math.max(y - size + 1, 0), Math.min(x1 + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                        return;
                    }
                }
            }
            else if (Math.abs(slope) < 1) {
                let startY = x2 < x1 ? y2 : y1;
                let endY = x2 < x1 ? y1 : y2;
                let minX = Math.min(x1, x2);
                let maxX = Math.max(x1, x2);
                let start = Math.max(1 - size, minX);
                if (slope < 0) {
                    start = Math.max(start, Math.ceil((gridHeight - 2 + size + 0.5 - startY) / slope) + minX);
                }
                else {
                    start = Math.max(start, Math.ceil((1 - size - 0.5 - startY) / slope) + minX);
                }
                let end = Math.min(gridWidth - 2 + size, maxX);
                if (slope < 0) {
                    end = Math.min(end, maxX - Math.ceil((endY - (1 - size - 0.5)) / slope));
                }
                else {
                    end = Math.min(end, maxX - Math.ceil((endY - (gridHeight - 2 + size) - 0.5) / slope));
                }
                let lastY = 0;
                for (let x = start; x <= end; x++) {
                    let y = Math.round(slope * (x - minX)) + startY;
                    if (x == start) {
                        if (!action(Math.max(x - size + 1, 0), Math.max(y - size + 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                            return;
                        }
                    }
                    else {
                        if (!action(Math.max(x + size - 1, 0), Math.max(y - size + 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                            return;
                        }
                        if (y != lastY) {
                            if (!action(Math.max(x - size + 1, 0), Math.min(Math.max(y + (size - 1) * (y - lastY), 0), gridHeight - 1), Math.min(x + size - 1, gridWidth - 1), Math.min(Math.max(y + (size - 1) * (y - lastY), 0), gridHeight - 1))) {
                                return;
                            }
                        }
                    }
                    lastY = y;
                }
            }
            else {
                slope = (x2 - x1) / (y2 - y1);
                let startX = y2 < y1 ? x2 : x1;
                let endX = y2 < y1 ? x1 : x2;
                let minY = Math.min(y1, y2);
                let maxY = Math.max(y1, y2);
                let start = Math.max(1 - size, minY);
                if (slope < 0) {
                    start = Math.max(start, Math.ceil((gridWidth - 2 + size + 0.5 - startX) / slope) + minY);
                }
                else {
                    start = Math.max(start, Math.ceil((1 - size - 0.5 - startX) / slope) + minY);
                }
                let end = Math.min(gridHeight - 2 + size, maxY);
                if (slope < 0) {
                    end = Math.min(end, maxY - Math.ceil((endX - (1 - size - 0.5)) / slope));
                }
                else {
                    end = Math.min(end, maxY - Math.ceil((endX - (gridWidth - 2 + size) - 0.5) / slope));
                }
                let lastX = 0;
                for (let y = start; y <= end; y++) {
                    let x = Math.round(slope * (y - minY)) + startX;
                    if (y == start) {
                        if (!action(Math.max(x - size + 1, 0), Math.max(y - size + 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                            return;
                        }
                    }
                    else {
                        if (!action(Math.max(x - size + 1, 0), Math.max(y + size - 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                            return;
                        }
                        if (x != lastX) {
                            if (!action(Math.min(Math.max(x + (size - 1) * (x - lastX), 0), gridWidth - 1), Math.max(y - size + 1, 0), Math.min(Math.max(x + (size - 1) * (x - lastX), 0), gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                                return;
                            }
                        }
                    }
                    lastX = x;
                }
            }
        }
        if (isKeybindPressed("secondaryAction")) {
            if (pixels[brushPixel].id == "fire") {
                if (currentPuzzle == null) {
                    raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                        for (let y = y1; y <= y2; y++) {
                            for (let x = x1; x <= x2; x++) {
                                addFire(x, y, 0);
                                // addUpdatedChunk2(x, y);
                                changed = true;
                            }
                        }
                        return true;
                    });
                }
                else if (tick == 1) {
                    raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                        for (let y = y1; y <= y2; y++) {
                            for (let x = x1; x <= x2; x++) {
                                if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & 1) == 1) {
                                    continue;
                                }
                                if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & 1) == 1) {
                                    pixelInventory[brushPixel] += 1;
                                }
                                addFire(x, y, 0);
                                // addUpdatedChunk2(x, y);
                                changed = true;
                            }
                        }
                        return true;
                    });
                    pixelInventoryUpdates[brushPixel] = true;
                    updatePixelInventory();
                }
            }
            else if (pixels[brushPixel].id == "placement_restriction") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] &= ~1;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "target") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        if (targets[y] == null) {
                            continue;
                        }
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] &= ~2;
                            delete targets[y][x];
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                        if (targets[y].length == 0) {
                            delete targets[y];
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "team_placement_restriction_a") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] &= ~4;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "team_placement_restriction_b") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] &= ~8;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "team_marker_a") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] &= ~2;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "team_marker_b") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] &= ~4;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "king_of_the_hill_marker") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] &= ~16;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else {
                if (currentPuzzle == null) {
                    raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                        for (let y = y1; y <= y2; y++) {
                            for (let x = x1; x <= x2; x++) {
                                addPixel(x, y, AIR);
                                // addUpdatedChunk2(x, y);
                                grid[(x + y * gridWidth) * gridStride + UPDATED] = 0;
                                changed = true;
                            }
                        }
                        return true;
                    });
                }
                else if (tick == 1) {
                    raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                        for (let y = y1; y <= y2; y++) {
                            for (let x = x1; x <= x2; x++) {
                                if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & 1) == 1) {
                                    continue;
                                }
                                let index = (x + y * gridWidth) * gridStride;
                                if (grid[index + ID] != AIR) {
                                    pixelInventory[grid[index + ID]] += 1;
                                    pixelInventoryUpdates[grid[index + ID]] = true;
                                }
                                addPixel(x, y, AIR);
                                // addUpdatedChunk2(x, y);
                                grid[index + UPDATED] = 0;
                                changed = true;
                            }
                        }
                        return true;
                    });
                    updatePixelInventory();
                }
            }
            gridUpdated = true;
        }
        else if (isKeybindPressed("mainAction")) {
            if (pixels[brushPixel].id == "fire") {
                if (currentPuzzle == null) {
                    raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                        for (let y = y1; y <= y2; y++) {
                            for (let x = x1; x <= x2; x++) {
                                addFire(x, y, 1);
                                // addUpdatedChunk2(x, y);
                                changed = true;
                            }
                        }
                        return true;
                    });
                }
                else if (tick == 1) {
                    raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                        for (let y = y1; y <= y2; y++) {
                            for (let x = x1; x <= x2; x++) {
                                if (pixelInventory[brushPixel] == 0) {
                                    return false;
                                }
                                if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & 1) == 1) {
                                    continue;
                                }
                                if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & 1) == 0) {
                                    pixelInventory[brushPixel] -= 1;
                                }
                                addFire(x, y, 1);
                                // addUpdatedChunk2(x, y);
                                changed = true;
                            }
                        }
                        return true;
                    });
                    pixelInventoryUpdates[brushPixel] = true;
                    updatePixelInventory();
                }
            }
            else if (pixels[brushPixel].id == "placement_restriction") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] |= 1;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "target") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        if (targets[y] == null) {
                            targets[y] = [];
                        }
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] |= 2;
                            targets[y][x] = 1;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "team_placement_restriction_a") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] |= 4;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "team_placement_restriction_b") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] |= 8;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "team_marker_a") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] |= 2;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "team_marker_b") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] |= 4;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else if (pixels[brushPixel].id == "king_of_the_hill_marker") {
                raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] |= 16;
                            addGridUpdatedChunk(x, y);
                            changed = true;
                        }
                    }
                    return true;
                });
            }
            else {
                if (currentPuzzle == null) {
                    raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                        for (let y = y1; y <= y2; y++) {
                            for (let x = x1; x <= x2; x++) {
                                addPixel(x, y, brushPixel);
                                // addUpdatedChunk2(x, y);
                                grid[(x + y * gridWidth) * gridStride + UPDATED] = 0;
                                changed = true;
                            }
                        }
                        return true;
                    });
                }
                else if (tick == 1) {
                    raytrace(lastBrushX, lastBrushY, brushX, brushY, brushSize, (x1, y1, x2, y2) => {
                        for (let y = y1; y <= y2; y++) {
                            for (let x = x1; x <= x2; x++) {
                                if (pixelInventory[brushPixel] == 0) {
                                    return false;
                                }
                                if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & 1) == 1) {
                                    continue;
                                }
                                let index = (x + y * gridWidth) * gridStride;
                                if (grid[index + ID] != AIR) {
                                    pixelInventory[grid[index + ID]] += 1;
                                    pixelInventoryUpdates[grid[index + ID]] = true;
                                }
                                addPixel(x, y, brushPixel);
                                // addUpdatedChunk2(x, y);
                                grid[index + UPDATED] = 0;
                                pixelInventory[brushPixel] -= 1;
                                changed = true;
                            }
                        }
                        return true;
                    });
                    pixelInventoryUpdates[brushPixel] = true;
                    updatePixelInventory();
                }
            }
            gridUpdated = true;
        }
        if (isKeybindJustPressed("pickBrushPixel")) {
            if (brushX >= 0 && brushX < gridWidth && brushY >= 0 && brushY < gridHeight) {
                setBrushPixel(grid[(brushX + brushY * gridWidth) * gridStride + ID]);
            }
        }
        if (isKeybindJustPressed("rotateSelectionClockwise")) {
            if (pixels[brushPixel].rotations != null) {
                let pixel = pixels[brushPixel];
                setBrushPixel(pixel.rotations[(pixel.rotation + 1) % pixel.rotations.length]);
            }
        }
        if (isKeybindJustPressed("rotateSelectionCounterClockwise")) {
            if (pixels[brushPixel].rotations != null) {
                let pixel = pixels[brushPixel];
                setBrushPixel(pixel.rotations[(pixel.rotation + pixel.rotations.length - 1) % pixel.rotations.length]);
            }
        }
        if (isKeybindJustPressed("flipSelectionHorizontally")) {
            if (pixels[brushPixel].rotations != null) {
                let pixel = pixels[brushPixel];
                switch (pixel.rotations.length) {
                    case 4:
                        if (pixel.rotation % 2 == 0) {
                            setBrushPixel(pixel.rotations[(pixel.rotation + 2) % 4]);
                        }
                        break;
                    case 2:
                        if (brushPixel == MIRROR_1 || brushPixel == MIRROR_2) {
                            setBrushPixel(pixel.rotations[(pixel.rotation + 1) % 2]);
                        }
                        break;
                }
            }
        }
        if (isKeybindJustPressed("flipSelectionVertically")) {
            if (pixels[brushPixel].rotations != null) {
                let pixel = pixels[brushPixel];
                switch (pixel.rotations.length) {
                    case 4:
                        if (pixel.rotation % 2 == 1) {
                            setBrushPixel(pixel.rotations[(pixel.rotation + 2) % 4]);
                        }
                        break;
                    case 2:
                        if (brushPixel == MIRROR_1 || brushPixel == MIRROR_2) {
                            setBrushPixel(pixel.rotations[(pixel.rotation + 1) % 2]);
                        }
                        break;
                }
            }
        }
    }
    else if (selectionState == SELECTING) {
    }
    else if (selectionState == SELECTED) {
        if (isKeybindJustPressed("copySelection")) {
            let array = [];
            for (let y = Math.max(selectionY, 0); y < Math.min(selectionY + selectionHeight, gridHeight); y++) {
                for (let x = Math.max(selectionX, 0); x < Math.min(selectionX + selectionWidth, gridWidth); x++) {
                    for (let i = 0; i < gridStride; i++) {
                        if (i == PUZZLE_DATA) {
                            array.push(0);
                        }
                        else {
                            array.push(grid[(x + y * gridWidth) * gridStride + i]);
                        }
                    }
                }
            }
            selectionGrid = new Int32Array(array);
            selectionGridWidth = Math.min(selectionX + selectionWidth, gridWidth) - Math.max(selectionX, 0);
            selectionGridHeight = Math.min(selectionY + selectionHeight, gridHeight) - Math.max(selectionY, 0);
        }
        else if (isKeybindJustPressed("cutSelection")) {
            let array = [];
            for (let y = Math.max(selectionY, 0); y < Math.min(selectionY + selectionHeight, gridHeight); y++) {
                for (let x = Math.max(selectionX, 0); x < Math.min(selectionX + selectionWidth, gridWidth); x++) {
                    for (let i = 0; i < gridStride; i++) {
                        if (i == PUZZLE_DATA) {
                            array.push(0);
                        }
                        else {
                            array.push(grid[(x + y * gridWidth) * gridStride + i]);
                        }
                    }
                }
            }
            if (currentPuzzle == null) {
                for (let y = Math.max(selectionY, 0); y < Math.min(selectionY + selectionHeight, gridHeight); y++) {
                    for (let x = Math.max(selectionX, 0); x < Math.min(selectionX + selectionWidth, gridWidth); x++) {
                        addPixel(x, y, AIR);
                        addFire(x, y, 0);
                        grid[(x + y * gridWidth) * gridStride + UPDATED] = 0;
                        changed = true;
                    }
                }
            }
            else if (tick == 1) {
                for (let y = Math.max(selectionY, 0); y < Math.min(selectionY + selectionHeight, gridHeight); y++) {
                    for (let x = Math.max(selectionX, 0); x < Math.min(selectionX + selectionWidth, gridWidth); x++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if ((grid[index + PUZZLE_DATA] & 1) == 1) {
                            continue;
                        }
                        if (grid[index + ID] != AIR) {
                            pixelInventory[grid[index + ID]] += 1;
                            pixelInventoryUpdates[grid[index + ID]] = true;
                        }
                        grid[index + ID] = AIR;
                        if ((grid[index + PIXEL_DATA] & 1) == 1) {
                            pixelInventory[FIRE] += 1;
                            pixelInventoryUpdates[FIRE] = true;
                        }
                        addFire(x, y, 0);
                        changed = true;
                    }
                }
            }
            selectionGrid = new Int32Array(array);
            selectionGridWidth = Math.min(selectionX + selectionWidth, gridWidth) - Math.max(selectionX, 0);
            selectionGridHeight = Math.min(selectionY + selectionHeight, gridHeight) - Math.max(selectionY, 0);

            selectionState = PASTING;
            selectionWidth = selectionGridWidth;
            selectionHeight = selectionGridHeight;
        }
        else if (isKeybindJustPressed("deleteSelection")) {
            if (currentPuzzle == null) {
                for (let y = Math.max(selectionY, 0); y < Math.min(selectionY + selectionHeight, gridHeight); y++) {
                    for (let x = Math.max(selectionX, 0); x < Math.min(selectionX + selectionWidth, gridWidth); x++) {
                        addPixel(x, y, AIR);
                        addFire(x, y, 0);
                        grid[(x + y * gridWidth) * gridStride + UPDATED] = 0;
                        changed = true;
                    }
                }
            }
            else if (tick == 1) {
                for (let y = Math.max(selectionY, 0); y < Math.min(selectionY + selectionHeight, gridHeight); y++) {
                    for (let x = Math.max(selectionX, 0); x < Math.min(selectionX + selectionWidth, gridWidth); x++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if ((grid[index + PUZZLE_DATA] & 1) == 1) {
                            continue;
                        }
                        if (grid[index + ID] != AIR) {
                            pixelInventory[grid[index + ID]] += 1;
                            pixelInventoryUpdates[grid[index + ID]] = true;
                        }
                        grid[index + ID] = AIR;
                        if ((grid[index + PIXEL_DATA] & 1) == 1) {
                            pixelInventory[FIRE] += 1;
                            pixelInventoryUpdates[FIRE] = true;
                        }
                        addFire(x, y, 0);
                        changed = true;
                    }
                }
            }
            selectionState = BRUSH;
        }
    }
    else if (selectionState == PASTING) {
        let startX = Math.floor(cameraX + mouseX / cameraScale - (selectionWidth - 1) / 2);
        let startY = Math.floor(cameraY + mouseY / cameraScale - (selectionHeight - 1) / 2);
        if (isKeybindPressed("mainAction")) {
            // pasting settings
            if (currentPuzzle == null) {
                for (let y = Math.max(startY, 0); y < Math.min(startY + selectionHeight, gridHeight); y++) {
                    for (let x = Math.max(startX, 0); x < Math.min(startX + selectionWidth, gridWidth); x++) {
                        for (let i = 0; i < gridStride; i++) {
                            if (i != PUZZLE_DATA) {
                                grid[(x + y * gridWidth) * gridStride + i] = selectionGrid[(x - startX + (y - startY) * selectionWidth) * gridStride + i];
                            }
                        }
                        addUpdatedChunk(x, y);
                        // addUpdatedChunk2(x, y);
                        changed = true;
                    }
                }
            }
            else if (tick == 1) {
                for (let y = Math.max(startY, 0); y < Math.min(startY + selectionHeight, gridHeight); y++) {
                    for (let x = Math.max(startX, 0); x < Math.min(startX + selectionWidth, gridWidth); x++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if ((grid[index + PUZZLE_DATA] & 1) == 1) {
                            continue;
                        }
                        let id = selectionGrid[(x - startX + (y - startY) * selectionWidth) * gridStride + ID];
                        if (id == AIR || pixelInventory[id] != 0) {
                            if (grid[index + ID] != AIR) {
                                pixelInventory[grid[index + ID]] += 1;
                                pixelInventoryUpdates[grid[index + ID]] = true;
                            }
                            grid[index + ID] = id;
                            if (id != AIR) {
                                pixelInventory[id] -= 1;
                                pixelInventoryUpdates[id] = true;
                            }
                        }
                        let fire = selectionGrid[(x - startX + (y - startY) * selectionWidth) * gridStride + PIXEL_DATA] & 1;
                        if ((grid[index + PIXEL_DATA] & 1) != fire) {
                            if (fire == 0) {
                                pixelInventory[FIRE] += 1;
                                pixelInventoryUpdates[FIRE] = true;
                                grid[index + PIXEL_DATA] &= ~1;
                            }
                            else if (pixelInventory[FIRE] != 0) {
                                pixelInventory[FIRE] -= 1;
                                pixelInventoryUpdates[FIRE] = true;
                                grid[index + PIXEL_DATA] |= 1;
                            }
                        }
                        addUpdatedChunk(x, y);
                        // addUpdatedChunk2(x, y);
                        changed = true;
                    }
                }
                updatePixelInventory();
            }
            gridUpdated = true;
        }
        if (isKeybindJustPressed("rotateSelectionClockwise")) {
            let array = [];
            for (let x = 0; x < selectionGridWidth; x++) {
                for (let y = selectionGridHeight - 1; y >= 0; y--) {
                    for (let i = 0; i < gridStride; i++) {
                        let data = selectionGrid[(x + y * selectionGridWidth) * gridStride + i];
                        if (i == ID && pixels[data].rotations != null) {
                            let pixel = pixels[data];
                            data = pixel.rotations[(pixel.rotation + 1) % pixel.rotations.length];
                        }
                        array.push(data);
                    }
                }
            }
            selectionGrid = new Int32Array(array);
            let width = selectionGridWidth;
            selectionGridWidth = selectionGridHeight;
            selectionGridHeight = width;

            selectionWidth = selectionGridWidth;
            selectionHeight = selectionGridHeight;
        }
        if (isKeybindJustPressed("rotateSelectionCounterClockwise")) {
            let array = [];
            for (let x = selectionGridWidth - 1; x >= 0; x--) {
                for (let y = 0; y < selectionGridHeight; y++) {
                    for (let i = 0; i < gridStride; i++) {
                        let data = selectionGrid[(x + y * selectionGridWidth) * gridStride + i];
                        if (i == ID && pixels[data].rotations != null) {
                            let pixel = pixels[data];
                            data = pixel.rotations[(pixel.rotation + pixel.rotations.length - 1) % pixel.rotations.length];
                        }
                        array.push(data);
                    }
                }
            }
            selectionGrid = new Int32Array(array);
            let width = selectionGridWidth;
            selectionGridWidth = selectionGridHeight;
            selectionGridHeight = width;

            selectionWidth = selectionGridWidth;
            selectionHeight = selectionGridHeight;
        }
        if (isKeybindJustPressed("flipSelectionHorizontally")) {
            let array = [];
            for (let y = 0; y < selectionGridHeight; y++) {
                for (let x = selectionGridWidth - 1; x >= 0; x--) {
                    for (let i = 0; i < gridStride; i++) {
                        let data = selectionGrid[(x + y * selectionGridWidth) * gridStride + i];
                        if (i == ID && pixels[data].rotations != null) {
                            let pixel = pixels[data];
                            switch (pixel.rotations.length) {
                                case 4:
                                    if (pixel.rotation % 2 == 0) {
                                        data = pixel.rotations[(pixel.rotation + 2) % 4];
                                    }
                                    break;
                                case 2:
                                    if (data == MIRROR_1 || data == MIRROR_2) {
                                        data = pixel.rotations[(pixel.rotation + 1) % 2];
                                    }
                                    break;
                            }
                        }
                        array.push(data);
                    }
                }
            }
            selectionGrid = new Int32Array(array);
        }
        if (isKeybindJustPressed("flipSelectionVertically")) {
            let array = [];
            for (let y = selectionGridHeight - 1; y >= 0; y--) {
                for (let x = 0; x < selectionGridWidth; x++) {
                    for (let i = 0; i < gridStride; i++) {
                        let data = selectionGrid[(x + y * selectionGridWidth) * gridStride + i];
                        if (i == ID && pixels[data].rotations != null) {
                            let pixel = pixels[data];
                            switch (pixel.rotations.length) {
                                case 4:
                                    if (pixel.rotation % 2 == 1) {
                                        data = pixel.rotations[(pixel.rotation + 2) % 4];
                                    }
                                    break;
                                case 2:
                                    if (data == MIRROR_1 || data == MIRROR_2) {
                                        data = pixel.rotations[(pixel.rotation + 1) % 2];
                                    }
                                    break;
                            }
                        }
                        array.push(data);
                    }
                }
            }
            selectionGrid = new Int32Array(array);
        }
    }
    lastBrushX = brushX;
    lastBrushY = brushY;
    if (currentPuzzle != null && changed) {
        saveCode.value = generateSaveCode();
        updateObjectives();
    }
};

function addBrushUpdate(data) {
    let team = multiplayerGames[multiplayerGameId].players[multiplayerId].team;
    let allowCrafting = multiplayerGames[multiplayerGameId].allowCrafting;
    if (data.type == 0) {
        function raytrace(x1, y1, x2, y2, size, action) {
            let slope = (y2 - y1) / (x2 - x1);
            if (slope == 0) {
                if (y1 <= -size || y1 >= gridHeight + size) {
                    return;
                }
                let minX = Math.min(x1, x2);
                let maxX = Math.max(x1, x2);
                let start = Math.max(1 - size, minX);
                let end = Math.min(gridWidth - 2 + size, maxX);
                for (let x = start; x <= end; x++) {
                    if (!action(Math.max(x - size + 1, 0), Math.max(y1 - size + 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y1 + size - 1, gridHeight - 1))) {
                        return;
                    }
                }
            }
            else if (!isFinite(slope)) {
                if (x1 <= -size || x1 >= gridWidth + size) {
                    return;
                }
                let minY = Math.min(y1, y2);
                let maxY = Math.max(y1, y2);
                let start = Math.max(1 - size, minY);
                let end = Math.min(gridHeight - 2 + size, maxY);
                for (let y = start; y <= end; y++) {
                    if (!action(Math.max(x1 - size + 1, 0), Math.max(y - size + 1, 0), Math.min(x1 + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                        return;
                    }
                }
            }
            else if (Math.abs(slope) < 1) {
                let startY = x2 < x1 ? y2 : y1;
                let endY = x2 < x1 ? y1 : y2;
                let minX = Math.min(x1, x2);
                let maxX = Math.max(x1, x2);
                let start = Math.max(1 - size, minX);
                if (slope < 0) {
                    start = Math.max(start, Math.ceil((gridHeight - 2 + size + 0.5 - startY) / slope) + minX);
                }
                else {
                    start = Math.max(start, Math.ceil((1 - size - 0.5 - startY) / slope) + minX);
                }
                let end = Math.min(gridWidth - 2 + size, maxX);
                if (slope < 0) {
                    end = Math.min(end, maxX - Math.ceil((endY - (1 - size - 0.5)) / slope));
                }
                else {
                    end = Math.min(end, maxX - Math.ceil((endY - (gridHeight - 2 + size) - 0.5) / slope));
                }
                let lastY = 0;
                for (let x = start; x <= end; x++) {
                    let y = Math.round(slope * (x - minX)) + startY;
                    if (x == start) {
                        if (!action(Math.max(x - size + 1, 0), Math.max(y - size + 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                            return;
                        }
                    }
                    else {
                        if (!action(Math.max(x + size - 1, 0), Math.max(y - size + 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                            return;
                        }
                        if (y != lastY) {
                            if (!action(Math.max(x - size + 1, 0), Math.min(Math.max(y + (size - 1) * (y - lastY), 0), gridHeight - 1), Math.min(x + size - 1, gridWidth - 1), Math.min(Math.max(y + (size - 1) * (y - lastY), 0), gridHeight - 1))) {
                                return;
                            }
                        }
                    }
                    lastY = y;
                }
            }
            else {
                slope = (x2 - x1) / (y2 - y1);
                let startX = y2 < y1 ? x2 : x1;
                let endX = y2 < y1 ? x1 : x2;
                let minY = Math.min(y1, y2);
                let maxY = Math.max(y1, y2);
                let start = Math.max(1 - size, minY);
                if (slope < 0) {
                    start = Math.max(start, Math.ceil((gridWidth - 2 + size + 0.5 - startX) / slope) + minY);
                }
                else {
                    start = Math.max(start, Math.ceil((1 - size - 0.5 - startX) / slope) + minY);
                }
                let end = Math.min(gridHeight - 2 + size, maxY);
                if (slope < 0) {
                    end = Math.min(end, maxY - Math.ceil((endX - (1 - size - 0.5)) / slope));
                }
                else {
                    end = Math.min(end, maxY - Math.ceil((endX - (gridWidth - 2 + size) - 0.5) / slope));
                }
                let lastX = 0;
                for (let y = start; y <= end; y++) {
                    let x = Math.round(slope * (y - minY)) + startX;
                    if (y == start) {
                        if (!action(Math.max(x - size + 1, 0), Math.max(y - size + 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                            return;
                        }
                    }
                    else {
                        if (!action(Math.max(x - size + 1, 0), Math.max(y + size - 1, 0), Math.min(x + size - 1, gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                            return;
                        }
                        if (x != lastX) {
                            if (!action(Math.min(Math.max(x + (size - 1) * (x - lastX), 0), gridWidth - 1), Math.max(y - size + 1, 0), Math.min(Math.max(x + (size - 1) * (x - lastX), 0), gridWidth - 1), Math.min(y + size - 1, gridHeight - 1))) {
                                return;
                            }
                        }
                    }
                    lastX = x;
                }
            }
        }
        if (data.remove || data.pixel == AIR) {
            if (data.pixel == FIRE) {
                if (allowCrafting) {
                    return;
                }
                raytrace(data.lastX, data.lastY, data.x, data.y, data.size, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & 1) == 1) {
                                continue;
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & (1 << (data.team + 2))) != 0) {
                                continue;
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & 1) == 1) {
                                multiplayerPixelInventory[data.team][data.pixel] += 1;
                            }
                            addFire(x, y, 0);
                        }
                    }
                    return true;
                });
                if (data.team == team) {
                    pixelInventoryUpdates[data.pixel] = true;
                }
            }
            else {
                raytrace(data.lastX, data.lastY, data.x, data.y, data.size, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & 1) == 1) {
                                continue;
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & (1 << (data.team + 2))) != 0) {
                                continue;
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & (1 << (data.team + 1))) == 0) {
                                continue;
                            }
                            let index = (x + y * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                if (allowCrafting && pixels[grid[index + ID]].cost == null) {
                                    continue;
                                }
                                if (allowCrafting) {
                                    for (let i in pixels[grid[index + ID]].cost) {
                                        multiplayerPixelInventory[data.team][i] += pixels[grid[index + ID]].cost[i];
                                        if (data.team == team) {
                                            pixelInventoryUpdates[i] = true;
                                        }
                                    }
                                }
                                else {
                                    multiplayerPixelInventory[data.team][grid[index + ID]] += 1;
                                    if (data.team == team) {
                                        pixelInventoryUpdates[grid[index + ID]] = true;
                                    }
                                }
                            }
                            addPixel(x, y, AIR);
                            addTeam(x, y, -1);
                            grid[index + UPDATED] = 0;
                        }
                    }
                    return true;
                });
            }
        }
        else {
            if (data.pixel == FIRE) {
                if (allowCrafting) {
                    return;
                }
                raytrace(data.lastX, data.lastY, data.x, data.y, data.size, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            if (multiplayerPixelInventory[data.team][data.pixel] == 0) {
                                return false;
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & 1) == 1) {
                                continue;
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & (1 << (data.team + 2))) != 0) {
                                continue;
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PIXEL_DATA] & 1) == 0) {
                                multiplayerPixelInventory[data.team][data.pixel] -= 1;
                            }
                            addFire(x, y, 1);
                        }
                    }
                    return true;
                });
                if (data.team == team) {
                    pixelInventoryUpdates[data.pixel] = true;
                }
            }
            else {
                raytrace(data.lastX, data.lastY, data.x, data.y, data.size, (x1, y1, x2, y2) => {
                    for (let y = y1; y <= y2; y++) {
                        for (let x = x1; x <= x2; x++) {
                            if (allowCrafting) {
                                if (!pixels[data.pixel].craftable) {
                                    return false;
                                }
                                for (let i in pixels[data.pixel].cost) {
                                    if (multiplayerPixelInventory[data.team][i] < pixels[data.pixel].cost[i]) {
                                        return false;
                                    }
                                }
                            }
                            else {
                                if (multiplayerPixelInventory[data.team][data.pixel] == 0) {
                                    return false;
                                }
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & 1) == 1) {
                                continue;
                            }
                            if ((grid[(x + y * gridWidth) * gridStride + PUZZLE_DATA] & (1 << (data.team + 2))) != 0) {
                                continue;
                            }
                            let index = (x + y * gridWidth) * gridStride;
                            if (grid[index + ID] != AIR) {
                                if ((grid[index + PIXEL_DATA] & (1 << (data.team + 1))) == 0) {
                                    continue;
                                }
                                if (allowCrafting && pixels[grid[index + ID]].cost == null) {
                                    continue;
                                }
                                if (allowCrafting) {
                                    for (let i in pixels[grid[index + ID]].cost) {
                                        multiplayerPixelInventory[data.team][i] += pixels[grid[index + ID]].cost[i];
                                        if (data.team == team) {
                                            pixelInventoryUpdates[i] = true;
                                        }
                                    }
                                }
                                else {
                                    multiplayerPixelInventory[data.team][grid[index + ID]] += 1;
                                    if (data.team == team) {
                                        pixelInventoryUpdates[grid[index + ID]] = true;
                                    }
                                }
                            }
                            addPixel(x, y, data.pixel);
                            addTeam(x, y, data.team);
                            grid[index + UPDATED] = 0;
                            if (allowCrafting) {
                                for (let i in pixels[data.pixel].cost) {
                                    multiplayerPixelInventory[data.team][i] -= pixels[data.pixel].cost[i];
                                }
                            }
                            else {
                                multiplayerPixelInventory[data.team][data.pixel] -= 1;
                            }
                        }
                    }
                    return true;
                });
                if (data.team == team) {
                    if (allowCrafting) {
                        for (let i in pixels[data.pixel].cost) {
                            pixelInventoryUpdates[i] = true;
                        }
                    }
                    else {
                        pixelInventoryUpdates[data.pixel] = true;
                    }
                }
            }
        }
    }
    else if (data.type == 1) {
        for (let y = Math.max(data.y, 0); y < Math.min(data.y + data.height, gridHeight); y++) {
            for (let x = Math.max(data.x, 0); x < Math.min(data.x + data.width, gridWidth); x++) {
                let index = (x + y * gridWidth) * gridStride;
                if ((grid[index + PUZZLE_DATA] & 1) == 1) {
                    continue;
                }
                if ((grid[index + PUZZLE_DATA] & (1 << (data.team + 2))) != 0) {
                    continue;
                }
                let id = data.grid.readInt32LE(((x - data.x + (y - data.y) * data.width) * gridStride + ID) * 4);
                if (allowCrafting) {
                    if (!pixels[id].craftable) {
                        continue;
                    }
                    let hasCost = false;
                    for (let i in pixels[id].cost) {
                        if (multiplayerPixelInventory[data.team][i] < pixels[id].cost[i]) {
                            hasCost = false;
                            break;
                        }
                    }
                    if (!hasCost) {
                        continue;
                    }
                }
                else if (multiplayerPixelInventory[data.team][id] == 0) {
                    continue;
                }
                if (grid[index + ID] != AIR) {
                    if (allowCrafting && pixels[grid[index + ID]].cost == null) {
                        continue;
                    }
                    if (allowCrafting) {
                        for (let i in pixels[grid[index + ID]].cost) {
                            multiplayerPixelInventory[data.team][i] += pixels[grid[index + ID]].cost[i];
                            if (data.team == team) {
                                pixelInventoryUpdates[i] = true;
                            }
                        }
                    }
                    else {
                        multiplayerPixelInventory[data.team][grid[index + ID]] += 1;
                        if (data.team == team) {
                            pixelInventoryUpdates[grid[index + ID]] = true;
                        }
                    }
                }
                grid[index + ID] = id;
                if (id != AIR) {
                    if (allowCrafting) {
                        for (let i in pixels[id].cost) {
                            multiplayerPixelInventory[data.team][i] -= pixels[id].cost[i];
                            if (data.team == team) {
                                pixelInventoryUpdates[i] = true;
                            }
                        }
                    }
                    else {
                        multiplayerPixelInventory[data.team][id] -= 1;
                        if (data.team == team) {
                            pixelInventoryUpdates[id] = true;
                        }
                    }
                }
                if (!allowCrafting) {
                    let fire = data.grid.readInt32LE(((x - data.x + (y - data.y) * data.width) * gridStride + PIXEL_DATA) * 4) & 1;
                    if ((grid[index + PIXEL_DATA] & 1) != fire) {
                        if (fire == 0) {
                            multiplayerPixelInventory[data.team][FIRE] += 1;
                            if (data.team == team) {
                                pixelInventoryUpdates[FIRE] = true;
                            }
                            grid[index + PIXEL_DATA] &= ~1;
                        }
                        else if (multiplayerPixelInventory[data.team][FIRE] != 0) {
                            multiplayerPixelInventory[data.team][FIRE] -= 1;
                            if (data.team == team) {
                                pixelInventoryUpdates[FIRE] = true;
                            }
                            grid[index + PIXEL_DATA] |= 1;
                        }
                    }
                }
                addUpdatedChunk(x, y);
            }
        }
    }
};

socket.on("clientData", function(data) {
    // grid = new Int32Array(data.grid);
    // let chunksArray = [];
    // for (let y = 0; y < chunkYAmount; y++) {
    //     for (let x = 0; x < chunkXAmount; x++) {
    //         chunksArray.push(...[x * chunkWidth, Math.min(x * chunkWidth + chunkWidth - 1, gridWidth - 1), y * chunkHeight, Math.min(y * chunkHeight + chunkHeight - 1, gridHeight - 1)]);
    //     }
    // }
    // gridUpdatedChunks = new Int32Array(chunksArray);
    // gridUpdated = true;
    // if (gridWidth != data.gridWidth || gridHeight != data.gridHeight || chunkXAmount != Math.ceil(data.gridWidth / data.chunkWidth) || chunkYAmount != Math.ceil(data.gridHeight / data.chunkHeight)) {
    //     gridWidth = data.gridWidth;
    //     gridHeight = data.gridHeight;
    //     chunkWidth = data.chunkWidth;
    //     chunkHeight = data.chunkHeight;
    //     chunkXAmount = Math.ceil(gridWidth / chunkWidth);
    //     chunkYAmount = Math.ceil(gridHeight / chunkHeight);
    //     resizeGrid(gridWidth, gridHeight, gridStride, chunkXAmount, chunkYAmount, chunkStride);

    //     cameraScale = Math.min(WIDTH / gridWidth, HEIGHT / gridHeight);
    //     cameraScaleTarget = cameraScale;
    //     cameraX = -WIDTH / cameraScale / 2 + gridWidth / 2;
    //     cameraY = -HEIGHT / cameraScale / 2 + gridHeight / 2;
    //     cameraSpeedX = 0;
    //     cameraSpeedY = 0;
    // }
    // nextChunks = new Int32Array(data.nextChunks);
    // drawChunks = new Int32Array(data.drawChunks);
    // tick = data.tick - 7;
    // for (let i in data.pixelInventory) {
    //     multiplayerPixelInventory[i] = data.pixelInventory[i];
    // }
    // for (let i in data.pixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team]) {
    //     data.pixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][i];
    //     pixelInventoryUpdates[i] = true;
    // }
    for (let i in data.pixelInventoryUpdates) {
        pixelInventoryUpdates[i] = data.pixelInventoryUpdates[i];
    }
    for (let i in data.brushUpdates) {
        addBrushUpdate(data.brushUpdates[i]);
    }
    updateGrid();

    // if (multiplayerGames[multiplayerGameId].allowCrafting) {
    //     // color display
    //     for (let i in pixels) {
    //         let amount = null;
    //         if (pixels[i].cost == null) {
    //             continue;
    //         }
    //         for (let j in pixels[i].cost) {
    //             if (amount == null) {
    //                 amount = Math.floor(multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][j] / pixels[i].cost[j]);
    //             }
    //             else {
    //                 amount = Math.min(amount, multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][j] / pixels[i].cost[j]);
    //             }
    //         }
    //         if (pixelInventory[i] != amount) {
    //             pixelInventory[i] = amount;
    //             pixelInventoryUpdates[i] = true;
    //         }
    //     }
    // }
    // else {
    //     for (let i in multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team]) {
    //         pixelInventory[i] = multiplayerPixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][i];
    //     }
    // }
    updateMultiplayerPixelInventory();
    updatePixelInventory();

    for (let i in data.scores) {
        if (data.scores[i].score != multiplayerGames[multiplayerGameId].scores[i].score) {
            multiplayerGames[multiplayerGameId].overlayDivs[i].querySelector(".multiplayerScore").innerText = data.scores[i].score + " (+" + (data.scores[i].score - multiplayerGames[multiplayerGameId].scores[i].score) + ") / " + data.scores[i].maxScore;
        }
        else {
            multiplayerGames[multiplayerGameId].overlayDivs[i].querySelector(".multiplayerScore").innerText = data.scores[i].score + " / " + data.scores[i].maxScore;
        }
        multiplayerGames[multiplayerGameId].overlayDivs[i].querySelector(".multiplayerScore").style.width = data.scores[i].score / data.scores[i].maxScore * 100 + "%";
    }
    multiplayerGames[multiplayerGameId].scores = data.scores;
});
socket.on("initClientData", function(data) {
    // set grid and pixel inventory
    gridWidth = data.gridWidth;
    gridHeight = data.gridHeight;
    chunkWidth = data.chunkWidth;
    chunkHeight = data.chunkHeight;

    createGrid();
    grid = new Int32Array(data.grid);
    nextChunks = new Int32Array(data.nextChunks);
    chunks = new Int32Array(data.chunks);
    drawChunks = new Int32Array(data.drawChunks);

    tick = data.tick - 8;
    multiplayerPixelInventory.length = 0;
    for (let i in data.pixelInventory) {
        multiplayerPixelInventory[i] = data.pixelInventory[i];
    }
    for (let i in data.pixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team]) {
        pixelInventory[i] = data.pixelInventory[multiplayerGames[multiplayerGameId].players[multiplayerId].team][i];
        pixelInventoryUpdates[i] = true;
    }
    // console.log(pixelInventory)
    updateMultiplayerPixelInventory();
    resetPixelInventory();

    multiplayerGames[multiplayerGameId].scores = data.scores;
    for (let i in data.scores) {
        multiplayerGames[multiplayerGameId].overlayDivs[i].querySelector(".multiplayerScore").innerText = data.scores[i].score + " / " + data.scores[i].maxScore;
        multiplayerGames[multiplayerGameId].overlayDivs[i].querySelector(".multiplayerScore").style.width = data.scores[i].score / data.scores[i].maxScore * 100 + "%";
    }
});

let tooltip = document.getElementById("tooltip");
let tooltipName = document.getElementById("tooltipName");
let tooltipDescription = document.getElementById("tooltipDescription");

function showTooltip(name, description) {
    tooltip.style.opacity = "1";
    tooltipName.innerHTML = name;
    tooltipDescription.innerHTML = description;
    tooltipDescription.style.display = description == "" ? "none" : "block";
    // some text transition later
};
function hideTooltip() {
    tooltip.style.opacity = "0";
};
function moveTooltip() {
    tooltip.style.left = mouseX / devicePixelRatio + "px";
    tooltip.style.right = "unset";
    tooltip.style.bottom = window.innerHeight - mouseY / devicePixelRatio + "px";
    // tooltip.style.left = rawMouseX + "px";
    // tooltip.style.right = "unset";
    // tooltip.style.top = rawMouseY + "px";
    // tooltip.style.bottom = "unset";
    var rect = tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        tooltip.style.right = window.innerWidth - mouseX / devicePixelRatio + "px";
        tooltip.style.left = "unset";
    }
    // rect = tooltip.getBoundingClientRect();
    // if (rect.bottom > window.innerHeight) {
    //     tooltip.style.bottom = (window.innerHeight - rawMouseY) + "px";
    //     tooltip.style.top = "unset";
    // }
    // add the switch sides thing
};

let cameraX = 0;
let cameraY = 0;
let cameraSpeedX = 0;
let cameraSpeedY = 0;
let cameraAcceleration = 6;
let cameraFriction = 0.75;
let cameraScaleX = 0;
let cameraScaleY = 0;
let cameraScale = 3;
let cameraScaleTarget = 3;
let cameraLerpSpeed = 0.25;
function updateCamera() {
    // cameraSpeedX *= 0;
    // cameraSpeedY *= 0;
    if (isKeybindPressed("moveLeft")) {
        cameraSpeedX -= cameraAcceleration / cameraScale;
    }
    if (isKeybindPressed("moveRight")) {
        cameraSpeedX += cameraAcceleration / cameraScale;
    }
    if (isKeybindPressed("moveUp")) {
        cameraSpeedY -= cameraAcceleration / cameraScale;
    }
    if (isKeybindPressed("moveDown")) {
        cameraSpeedY += cameraAcceleration / cameraScale;
    }
    cameraSpeedX *= cameraFriction;
    cameraSpeedY *= cameraFriction;

    if (isKeybindPressed("zoomIn")) {
        cameraScaleTarget /= 1.01 ** (-10);
        cameraScaleX = mouseX;
        cameraScaleY = mouseY;
    }
    if (isKeybindPressed("zoomOut")) {
        cameraScaleTarget /= 1.01 ** (10);
        cameraScaleX = mouseX;
        cameraScaleY = mouseY;
    }

    let t = (performance.now() - lastFrame) / 1000 * 60;
    t = 1;
    let oldCameraScale = cameraScale;
    cameraScale += (cameraScaleTarget - cameraScale) * (1 - (1 - cameraLerpSpeed) ** t);
    // cameraScale += (cameraScaleTarget - cameraScale) * (1 - (1 - cameraLerpSpeed));
    // if (cameraScaleTarget / cameraScale > 1 && cameraScaleTarget / cameraScale < 1.01) {
    //     cameraScale = cameraScaleTarget;
    // }
    // if (1 / (cameraScaleTarget / cameraScale) > 1 && 1 / (cameraScaleTarget / cameraScale) < 1.01) {
    //     cameraScale = cameraScaleTarget;
    // }
    cameraX = ((cameraX + cameraScaleX / oldCameraScale) - cameraScaleX / cameraScale);
    cameraY = ((cameraY + cameraScaleY / oldCameraScale) - cameraScaleY / cameraScale);
    cameraX += cameraSpeedX * t;
    cameraY += cameraSpeedY * t;
};

document.onmousemove = (e) => {
    var rect = canvas.getBoundingClientRect();
    mouseRawX = e.clientX;
    mouseRawY = e.clientY;
    if (isKeybindPressed("move")) {
        cameraX -= (e.clientX * devicePixelRatio - mouseX) / cameraScale;
        cameraY -= (e.clientY * devicePixelRatio - mouseY) / cameraScale;
    }
    mouseX = e.clientX * devicePixelRatio;
    mouseY = e.clientY * devicePixelRatio;
};
document.ontouchmove = (e) => {
    var rect = canvas.getBoundingClientRect();
    mouseRawX = e.touches[0].clientX;
    mouseRawY = e.touches[0].clientY;
    if (isKeybindPressed("move")) {
        cameraX -= (e.touches[0].clientX * devicePixelRatio - mouseX) / cameraScale;
        cameraY -= (e.touches[0].clientY * devicePixelRatio - mouseY) / cameraScale;
    }
    mouseX = e.touches[0].clientX * devicePixelRatio;
    mouseY = e.touches[0].clientY * devicePixelRatio;
};
overlayCanvas.onmousedown = (e) => {
    let key = null;
    if (e.button == 0) {
        key = "LMB";
    }
    else if (e.button == 1) {
        key = "MMB";
    }
    else if (e.button == 2) {
        key = "RMB";
    }
    if (key != null) {
        controls[key] = performance.now();
        // if (addingKeybind != null) {
        //     updateAddingKeybind();
        // }
    }
    search: for (let i in keybinds["move"]) {
        for (let j in keybinds["move"][i].keys) {
            if (key == keybinds["move"][i].keys[j]) {
                if (isKeybindJustPressed("move")) {
                    overlayCanvas.style.cursor = "move";
                    break search;
                }
            }
        }
    }
};
overlayCanvas.ontouchstart = (e) => {
    let key = "";
    key = "LMB";
    controls[key] = performance.now();
    // if (addingKeybind != null) {
    //     updateAddingKeybind();
    // }
    mouseRawX = e.touches[0].clientX;
    mouseRawY = e.touches[0].clientY;
    if (isKeybindPressed("move")) {
        cameraX -= (e.touches[0].clientX * devicePixelRatio - mouseX) / cameraScale;
        cameraY -= (e.touches[0].clientY * devicePixelRatio - mouseY) / cameraScale;
    }
    mouseX = e.touches[0].clientX * devicePixelRatio;
    mouseY = e.touches[0].clientY * devicePixelRatio;
    let brushX = Math.floor(cameraX + mouseX / cameraScale);
    let brushY = Math.floor(cameraY + mouseY / cameraScale);
    lastBrushX = brushX;
    lastBrushY = brushY;
};
addKeybindContainer.onmousedown = (e) => {
    let key = null;
    if (e.button == 0) {
        key = "LMB";
    }
    else if (e.button == 1) {
        key = "MMB";
    }
    else if (e.button == 2) {
        key = "RMB";
    }
    if (key != null) {
        controls[key] = performance.now();
        if (addingKeybind != null) {
            updateAddingKeybind();
        }
    }
    updateKeybinds();
};
addKeybindContainer.ontouchstart = (e) => {
    let key = "";
    key = "LMB";
    controls[key] = performance.now();
    if (addingKeybind != null) {
        updateAddingKeybind();
    }
    updateKeybinds(key);
};
document.onmouseup = (e) => {
    let key = null;
    if (e.button == 0) {
        key = "LMB";
    }
    else if (e.button == 1) {
        key = "MMB";
    }
    else if (e.button == 2) {
        key = "RMB";
    }
    if (key != null) {
        if (addingKeybind != null) {
            endAddingKeybind();
        }
        controls[key] = false;
    }
    search: for (let i in keybinds["move"]) {
        for (let j in keybinds["move"][i].keys) {
            if (key == keybinds["move"][i].keys[j]) {
                if (!isKeybindPressed("move")) {
                    overlayCanvas.style.cursor = "";
                    break search;
                }
            }
        }
    }
};
document.ontouchend = (e) => {
    let key = "";
    key = "LMB";
    if (addingKeybind != null) {
        endAddingKeybind();
    }
    controls[key] = false;
};
document.oncontextmenu = (e) => {
    e.preventDefault();
};

document.onkeydown = (e) => {
    // congratulationsContainer dumb
    if (modalContainer.open || !congratulationsContainer.classList.contains("hidden")) {
        return;
    }
    let key = null;
    if (keyboardLayoutMap != null) {
        key = keyboardLayoutMap.get(e.code);
        if (key == null) {
            if (e.code.startsWith("Shift")) {
                key = "Shift";
            }
            else if (e.code.startsWith("Control")) {
                key = "Control";
            }
            else if (e.code.startsWith("Alt")) {
                key = "Alt";
            }
            else if (e.code.startsWith("Meta")) {
                key = "Meta";
            }
            else {
                key = e.code;
            }
        }
    }
    else {
        key = e.key;
    }
    if (key.length == 1) {
        key = key.toUpperCase();
    }
    if (controls[key] == false || (key != "Shift" && key != "Control" && key != "Alt" && key != "Meta")) {
        controls[key] = performance.now();
    }
    if (addingKeybind != null) {
        updateAddingKeybind();
    }
    updateKeybinds(key);
};
document.onkeyup = (e) => {
    let key = null;
    if (keyboardLayoutMap != null) {
        key = keyboardLayoutMap.get(e.code);
        if (key == null) {
            if (e.code.startsWith("Shift")) {
                key = "Shift";
            }
            else if (e.code.startsWith("Control")) {
                key = "Control";
            }
            else if (e.code.startsWith("Alt")) {
                key = "Alt";
            }
            else if (e.code.startsWith("Meta")) {
                key = "Meta";
            }
            else {
                key = e.code;
            }
        }
    }
    else {
        key = e.key;
    }
    if (key.length == 1) {
        key = key.toUpperCase();
    }
    if (addingKeybind != null) {
        endAddingKeybind();
    }
    controls[key] = false;
};

// document.onvisibilitychange = () => {
window.onblur = () => {
    for (let i in controls) {
        controls[i] = false;
    }
};
let buttons = document.getElementsByClassName("button");
for (let i = 0; i < buttons.length; i++) {
    // buttons[i].onfocus = () => {
    //     buttons[i].blur();
    // };
}

overlayCanvas.addEventListener("wheel", (e) => {
    if (e.ctrlKey) {
        cameraScaleTarget /= 1.01 ** (e.deltaY);
        cameraScaleX = mouseX;
        cameraScaleY = mouseY;
    }
    else if (e.altKey) {
        brushSize = Math.max(Math.min(brushSize - Math.sign(e.deltaY) * 5, Math.ceil((Math.max(gridWidth, gridHeight) + 1) / 2)), 1);
    }
    else {
        brushSize = Math.max(Math.min(brushSize - Math.sign(e.deltaY), Math.ceil((Math.max(gridWidth, gridHeight) + 1) / 2)), 1);
    }
    // if (e.deltaY > 0) {
    // }
    // else if (e.deltaY < 0) {
    //     cameraScaleTarget *= 1.5;
    //     cameraScaleX = mouseX;
    //     cameraScaleY = mouseY;
    // }
    e.preventDefault();
    // }
});

window.onbeforeunload = () => {
    if (gameContainer.style.display != "none") {
        if (multiplayerContainer.style.display == "none") {
            if (currentPuzzle == null) {
                sandboxGrid = generateSaveCode();
                sandboxSaveCode = saveCode.value;
            }
            else {
                if (puzzleProgress[currentPuzzle] == null) {
                    puzzleProgress[currentPuzzle] = {
                        saveCode: saveCode.value,
                        completed: false,
                        ticks: -1,
                        pixels: -1,
                    };
                }
                else {
                    puzzleProgress[currentPuzzle].saveCode = saveCode.value;
                }
            }
        }
    }
    localStorage.setItem("sandboxGrid", sandboxGrid);
    localStorage.setItem("sandboxSaveCode", sandboxSaveCode);
    let customPuzzles = {};
    for (let i in puzzles) {
        if (!puzzles[i].official) {
            customPuzzles[i] = puzzles[i];
        }
    }
    localStorage.setItem("puzzles", JSON.stringify(customPuzzles));
    localStorage.setItem("puzzleProgress", JSON.stringify(puzzleProgress));
    if (selectionGrid != null) {
        localStorage.setItem("selectionGrid", generateSaveCode(true));
    }
    localStorage.setItem("blueprints", JSON.stringify(blueprints));
    localStorage.setItem("settings", JSON.stringify(settings));
    localStorage.setItem("keybinds", JSON.stringify(keybinds));
};

function createGrid() {
    let gridArray = [];
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            gridArray.push(...[0, 0, 0, 0]);
        }
    }

    chunkXAmount = Math.ceil(gridWidth / chunkWidth);
    chunkYAmount = Math.ceil(gridHeight / chunkHeight);

    let chunksArray = [];
    // for (let y = 0; y < chunkYAmount; y++) {
    //     for (let x = 0; x < chunkXAmount; x++) {
    //         chunksArray.push(...[x * chunkWidth + chunkWidth + 1, x * chunkWidth - 2, y * chunkHeight + chunkHeight + 1, y * chunkHeight - 2]);
    //     }
    // }
    for (let y = 0; y < chunkYAmount; y++) {
        for (let x = 0; x < chunkXAmount; x++) {
            chunksArray.push(...[x * chunkWidth, Math.min(x * chunkWidth + chunkWidth - 1, gridWidth - 1), y * chunkHeight, Math.min(y * chunkHeight + chunkHeight - 1, gridHeight - 1)]);
        }
    }

    grid = new Int32Array(gridArray);
    chunks = new Int32Array(chunksArray);
    nextChunks = new Int32Array(chunksArray);
    drawChunks = new Int32Array(chunksArray);
    gridUpdatedChunks = new Int32Array(chunksArray);
    gridUpdated = true;
    resetPushPixels();
    resizeGrid(gridWidth, gridHeight, gridStride, chunkXAmount, chunkYAmount, chunkStride);

    resetTargets();

    cameraScale = Math.min(WIDTH / gridWidth, HEIGHT / gridHeight);
    cameraScaleTarget = cameraScale;
    cameraX = -WIDTH / cameraScale / 2 + gridWidth / 2;
    cameraY = -HEIGHT / cameraScale / 2 + gridHeight / 2;
    cameraSpeedX = 0;
    cameraSpeedY = 0;
};
createGrid();
if (localStorage.getItem("sandboxGrid") != null) {
    try {
        sandboxGrid = localStorage.getItem("sandboxGrid");
    }
    catch (err) {
        modal("Grid Error", "The stored sandbox grid was unable to be loaded.<br><br>" + err.stack, "error");
    }
}
if (localStorage.getItem("selectionGrid") != null) {
    try {
        loadSaveCode(localStorage.getItem("selectionGrid"), true);
    }
    catch (err) {
        modal("Selection Grid Error", "The stored selection grid was unable to be loaded.<br><br>" + err.stack, "error");
    }
}

function drawGrid(ctx) {
    // for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
    //     for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
    //         if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth + 1) {
    //             continue;
    //         }
    //         let minX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] - 1, chunkX * chunkWidth);
    //         let maxX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1] + 1, chunkX * chunkWidth + chunkWidth - 1);
    //         let minY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2] - 1, chunkY * chunkHeight);
    //         let maxY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3] + 1, chunkY * chunkHeight + chunkHeight - 1);
    //         ctx.fillStyle = "#ffffff";
    //         ctx.fillRect(minX * cameraScale, minY * cameraScale, (maxX - minX + 1) * cameraScale, (maxY - minY + 1) * cameraScale);
    //         for (let y = minY; y <= maxY; y++) {
    //             for (let x = minX; x <= maxX; x++) {
    //                 let index = (x + y * gridWidth) * gridStride;

    //                 if (grid[index + ID] == 0) {
    //                     continue;
    //                 }

    //                 ctx.fillStyle = "rgba(" + grid[index + COLOR_R] * 255 + ", " + grid[index + COLOR_G] * 255 + ", " + grid[index + COLOR_B] * 255 + ", " + grid[index + COLOR_A] + ")";
    //                 ctx.fillRect(x * cameraScale, y * cameraScale, cameraScale, cameraScale);
    //             }
    //         }
    //     }
    // }
    // for (let y = 0; y < gridHeight; y++) {
    //     for (let x = 0; x < gridWidth; x++) {
    //         let index = (x + y * gridWidth) * gridStride;

    //         ctx.fillStyle = "rgba(" + grid[index + COLOR_R] * 255 + ", " + grid[index + COLOR_G] * 255 + ", " + grid[index + COLOR_B] * 255 + ", " + grid[index + COLOR_A] + ")";
    //         ctx.fillRect(x * cameraScale, y * cameraScale, cameraScale, cameraScale);
    //     }
    // }
    ctx.translate(-Math.round(cameraX * cameraScale), -Math.round(cameraY * cameraScale));
    // ctx.scale(Math.round(cameraScale * 4) / 4, Math.round(cameraScale * 4) / 4);
    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
        for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
            if (drawChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth) {
                continue;
            }
            let minX = drawChunks[(chunkX + chunkY * chunkXAmount) * chunkStride];
            let maxX = drawChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1];
            let minY = drawChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2];
            let maxY = drawChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3];
            // ctx.fillStyle = "#ffffff";
            // ctx.fillRect(minX * cameraScale, minY * cameraScale, (maxX - minX + 1) * cameraScale, (maxY - minY + 1) * cameraScale);
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    let index = (x + y * gridWidth) * gridStride;

                    if (!pixels[grid[index + ID]].draw) {
                        continue;
                    }

                    pixels[grid[index + ID]].draw(ctx, cameraScale, x, y);
                }
            }
        }
    }
    for (let y in targets) {
        if (y < Math.round(cameraY * cameraScale) / cameraScale - 1.5 || y > (Math.round(cameraY * cameraScale) + HEIGHT) / cameraScale + 0.5) {
            continue;
        }
        for (let x in targets[y]) {
            if (x < Math.round(cameraX * cameraScale) / cameraScale - 1.5 || x > (Math.round(cameraX * cameraScale) + WIDTH) / cameraScale + 0.5) {
                continue;
            }
            // ctx.fillStyle = "rgb(0, 204, 255)";
            // ctx.fillRect(x * cameraScale, y * cameraScale, cameraScale, cameraScale / 5);
            // ctx.fillRect(x * cameraScale, y * cameraScale + cameraScale * 4 / 5, cameraScale, cameraScale / 5);
            // ctx.fillRect(x * cameraScale, y * cameraScale + cameraScale / 5, cameraScale / 5, cameraScale * 3 / 5);
            // ctx.fillRect(x * cameraScale + cameraScale * 4 / 5, y * cameraScale + cameraScale / 5, cameraScale / 5, cameraScale * 3 / 5);
            let size = (Math.sin(performance.now() / 1000 * Math.PI / 2) + 1) / 4 * cameraScale;
            ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
            ctx.fillRect(x * cameraScale - size, y * cameraScale - size, cameraScale + size * 2, cameraScale + size * 2);
        }
    }
    if (settings.debug && settings.drawUpdatingChunks) {
        ctx.strokeStyle = "rgba(0, 0, 0)";
        ctx.lineWidth = cameraScale / 10;
        ctx.setLineDash([cameraScale, 3 * cameraScale]);
        ctx.lineJoin = "miter";
        for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
            for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                ctx.strokeRect(chunkX * chunkWidth * cameraScale, chunkY * chunkHeight * cameraScale, chunkWidth * cameraScale, chunkHeight * cameraScale);
            }
        }
        ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        ctx.strokeStyle = "rgba(0, 255, 0)";
        ctx.lineWidth = cameraScale / 5;
        ctx.setLineDash([]);
        for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
            for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                if (nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth) {
                    continue;
                }
                let minX = Math.max(nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride], chunkX * chunkWidth);
                let maxX = Math.min(nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], chunkX * chunkWidth + chunkWidth - 1);
                let minY = Math.max(nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], chunkY * chunkHeight);
                let maxY = Math.min(nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], chunkY * chunkHeight + chunkHeight - 1);
                // for (let y = minY; y <= maxY; y++) {
                //     for (let x = minX; x <= maxX; x++) {
                //         let index = (x + y * gridWidth) * gridStride;

                //         ctx.fillStyle = "rgba(" + grid[index + COLOR_R] * 255 + ", " + 200 + ", " + grid[index + COLOR_B] * 255 + ", " + grid[index + COLOR_A] + ")";
                //         ctx.fillRect(x * 1, y * 1, 1, 1);
                //     }
                // }
                // ctx.fillStyle = "rgba(125, " + chunkY * 255 + ", " + chunkX * 255 + ", 0.2)";
                ctx.fillRect(minX * cameraScale, minY * cameraScale, (maxX - minX + 1) * cameraScale, (maxY - minY + 1) * cameraScale)
                ctx.strokeRect(minX * cameraScale, minY * cameraScale, (maxX - minX + 1) * cameraScale, (maxY - minY + 1) * cameraScale);
            }
        }
    }
    ctx.resetTransform();
};

function resetGrid() {
    if (currentPuzzle == null) {
        loadSaveCode(saveCode.value);
    }
    else {
        loadSaveCode(puzzles[currentPuzzle].saveCode);
        for (let i in pixels) {
            pixelInventory[i] = puzzles[currentPuzzle].inventory[pixels[i].id] ?? 0;
        }
        pixelInventory[AIR] = Infinity;
        resetPixelInventory();
        loadSaveCode(saveCode.value, false, true);
        updateObjectives();
    }
};

function updateGrid() {
    let lastChunks = chunks;
    chunks = nextChunks;
    nextChunks = lastChunks;
    for (let y = 0; y < chunkYAmount; y++) {
        for (let x = 0; x < chunkXAmount; x++) {
            let index = (x + y * chunkXAmount) * chunkStride;
            nextChunks[index] = x * chunkWidth + chunkWidth;
            nextChunks[index + 1] = x * chunkWidth - 1;
            nextChunks[index + 2] = y * chunkHeight + chunkHeight;
            nextChunks[index + 3] = y * chunkHeight - 1;
            drawChunks[index] = x * chunkWidth + chunkWidth;
            drawChunks[index + 1] = x * chunkWidth - 1;
            drawChunks[index + 2] = y * chunkHeight + chunkHeight;
            drawChunks[index + 3] = y * chunkHeight - 1;
        }
    }
    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
        let updatingChunks = [];
        for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkX);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
            for (let chunkX of updatingChunks) {
                let minY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2];
                let maxY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3];
                if (y >= minY && y <= maxY) {
                    let minX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride];
                    let maxX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1];
                    for (let x = minX; x <= maxX; x++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if ((grid[index + PIXEL_DATA] & 1) == 1) {
                            randomSeed(x, y);
                            pixels[FIRE].update(x, y);
                        }
                    }
                }
            }
        }
    }
    tick += 1;
    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
        let updatingChunks = [];
        for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth || nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkX);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
            for (let chunkX of updatingChunks) {
                let minY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2]);
                let maxY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3]);
                if (y >= minY && y <= maxY) {
                    let minX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride]);
                    let maxX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1]);
                    for (let x = minX; x <= maxX; x++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update6 == null) {
                            continue;
                        }
                        randomSeed(x, y);
                        pixels[grid[index + ID]].update6(x, y);
                    }
                }
            }
        }
    }
    tick += 1;
    // tick += 1;
    // Left
    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
        let updatingChunks = [];
        for (let chunkX = chunkXAmount - 1; chunkX >= 0; chunkX--) {
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth || nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkX);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
            for (let chunkX of updatingChunks) {
                // let minY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2] - buffer, chunkY * chunkHeight);
                // let maxY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3] + buffer, chunkY * chunkHeight + chunkHeight - 1);
                let minY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2]);
                let maxY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3]);
                if (y >= minY && y <= maxY) {
                    // let minX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] - buffer, chunkX * chunkWidth);
                    // let maxX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1] + buffer, chunkX * chunkWidth + chunkWidth - 1);
                    let minX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride]);
                    let maxX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1]);
                    for (let x = maxX; x >= minX; x--) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update1 == null) {
                            continue;
                        }
                        randomSeed(x, y);
                        pixels[grid[index + ID]].update1(x, y);
                    }
                }
            }
        }
    }
    tick += 1;
    // tick += 1;
    // Right
    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
        let updatingChunks = [];
        for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth || nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkX);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
            for (let chunkX of updatingChunks) {
                let minY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2]);
                let maxY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3]);
                if (y >= minY && y <= maxY) {
                    let minX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride]);
                    let maxX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1]);
                    for (let x = minX; x <= maxX; x++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update2 == null) {
                            continue;
                        }
                        randomSeed(x, y);
                        pixels[grid[index + ID]].update2(x, y);
                    }
                }
            }
        }
    }
    tick += 1;
    // tick += 1;
    // Up
    for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
        let updatingChunks = [];
        for (let chunkY = chunkYAmount - 1; chunkY >= 0; chunkY--) {
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth || nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkY);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let x = chunkX * chunkWidth; x < chunkX * chunkWidth + chunkWidth; x++) {
            for (let chunkY of updatingChunks) {
                let minX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride]);
                let maxX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1]);
                if (x >= minX && x <= maxX) {
                    let minY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2]);
                    let maxY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3]);
                    for (let y = maxY; y >= minY; y--) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update3 == null) {
                            continue;
                        }
                        randomSeed(x, y);
                        pixels[grid[index + ID]].update3(x, y);
                    }
                }
            }
        }
    }
    tick += 1;
    // tick += 1;
    // Down
    for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
        let updatingChunks = [];
        for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth || nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkY);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let x = chunkX * chunkWidth; x < chunkX * chunkWidth + chunkWidth; x++) {
            for (let chunkY of updatingChunks) {
                let minX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride]);
                let maxX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1]);
                if (x >= minX && x <= maxX) {
                    let minY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2]);
                    let maxY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3]);
                    for (let y = minY; y <= maxY; y++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update4 == null) {
                            continue;
                        }
                        randomSeed(x, y);
                        pixels[grid[index + ID]].update4(x, y);
                    }
                }
            }
        }
    }
    tick += 1;
    // tick += 1;
    if (tick % 2 == 0) {
        // for (let chunkY = chunkYAmount - 1; chunkY >= 0; chunkY--) {
        for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
            let updatingChunks = [];
            for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth || nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                    updatingChunks.push(chunkX);
                }
            }
            if (updatingChunks.length == 0) {
                continue;
            }
            for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
                for (let chunkX of updatingChunks) {
                    let minY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2]);
                    let maxY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3]);
                    if (y >= minY && y <= maxY) {
                        let minX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride]);
                        let maxX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1]);
                        for (let x = minX; x <= maxX; x++) {
                            let index = (x + y * gridWidth) * gridStride;
                            if (grid[index + UPDATED] == tick) {
                                continue;
                            }
                            if (pixels[grid[index + ID]].update == null) {
                                continue;
                            }
                            randomSeed(x, y);
                            pixels[grid[index + ID]].update(x, y);
                        }
                    }
                    // for (let y = minY; y <= maxY; y++) {
                    // }
                }
            }
        }
    }
    else {
        for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
            // for (let chunkY = chunkYAmount - 1; chunkY >= 0; chunkY--) {
            let updatingChunks = [];
            for (let chunkX = chunkXAmount - 1; chunkX >= 0; chunkX--) {
                if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth || nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                    updatingChunks.push(chunkX);
                }
            }
            if (updatingChunks.length == 0) {
                continue;
            }
            for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
                // for (let y = chunkY * chunkHeight + chunkHeight - 1; y >= chunkY * chunkHeight; y--) {
                // for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                //     if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth + 1) {
                //         continue;
                //     }
                for (let chunkX of updatingChunks) {
                    // for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
                    //     for (let chunkX = chunkXAmount - 1; chunkX >= 0; chunkX--) {
                    //         if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth + 1) {
                    //             continue;
                    //         }
                    let minY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2]);
                    let maxY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3]);
                    if (y >= minY && y <= maxY) {
                        let minX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride]);
                        let maxX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1]);
                        for (let x = maxX; x >= minX; x--) {
                            let index = (x + y * gridWidth) * gridStride;
                            if (grid[index + UPDATED] == tick) {
                                continue;
                            }
                            if (pixels[grid[index + ID]].update == null) {
                                continue;
                            }
                            randomSeed(x, y);
                            pixels[grid[index + ID]].update(x, y);
                        }
                    }
                    // for (let y = minY; y <= maxY; y++) {
                    // }
                }
            }
        }
    }
    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
        for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
            randomSeed(chunkX, chunkY);
            let x = chunkX * chunkWidth + Math.floor(random() * chunkWidth);
            let y = chunkY * chunkHeight + Math.floor(random() * chunkHeight);
            if (x >= gridWidth || y >= gridHeight) {
                continue;
            }
            let index = (x + y * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].randomUpdate != null) {
                randomSeed(x, y);
                pixels[grid[index + ID]].randomUpdate(x, y);
            }
        }
    }
    tick += 1;
    tick += 1;
    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
        let updatingChunks = [];
        for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth || nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkX);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
            for (let chunkX of updatingChunks) {
                let minY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2]);
                let maxY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3]);
                if (y >= minY && y <= maxY) {
                    let minX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride]);
                    let maxX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1], nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1]);
                    for (let x = minX; x <= maxX; x++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update5 == null) {
                            continue;
                        }
                        randomSeed(x, y);
                        pixels[grid[index + ID]].update5(x, y);
                    }
                }
            }
        }
    }
    // for (let y = 0; y < gridHeight; y++) {
    //     for (let x = 0; x < gridWidth; x++) {
    //         let index = (x + y * gridWidth) * gridStride;
    //         if (grid[index + UPDATED] == tick) {
    //             continue;
    //         }
    //         if (grid[index + ID] == 1) {
    //             // flow(x, y, isAir, true);
    //             flow(x, y, isAir, true, 1, true, 5);
    //         }
    //     }
    // }
    tick += 1;
    // if (tick > 12) {
    //     for (let y = 0; y < gridHeight; y++) {
    //         for (let x = 0; x < gridWidth; x++) {
    //             let index = (x + y * gridWidth) * gridStride;
    //             grid[index + UPDATED] = Math.max(grid[index + UPDATED] - 11, 0);
    //         }
    //     }
    //     tick -= 11;
    // }

    if (currentPuzzle != null) {
        updateObjectives();
    }
    gridUpdated = true;
};

let fpsTimes = [];
let fpsHistory = [];
// let tpsTimes = [];
// let tpsHistory = [];
let lastFrame = performance.now();
let frameHistory = [];
let updateHistory = [];
let drawHistory = [];
let historyLength = 100;

let graphX = 5;
let graphY = 68 + 5;
graphY = 69 + 2;
let graphWidth = 300;
let graphHeight = 100;

const timingGradient = overlayCtx.createLinearGradient(0, graphY + 1, 0, graphY + graphHeight - 1);
timingGradient.addColorStop(0, "#ff00ff");
timingGradient.addColorStop(0.1, "#ff0000");
timingGradient.addColorStop(0.25, "#ff0000");
timingGradient.addColorStop(0.4, "#ffff00");
timingGradient.addColorStop(0.7, "#00ff00");
timingGradient.addColorStop(1, "#00ff00");

function updateTimes(history, time) {
    history.push(time);
    while (history.length > historyLength) {
        history.shift();
    }
    let minTime = history[0];
    let maxTime = history[0];
    let averageTime = history[0];
    for (let i = 1; i < history.length; i++) {
        if (minTime > history[i]) {
            minTime = history[i];
        }
        if (maxTime < history[i]) {
            maxTime = history[i];
        }
        averageTime += history[i];
    }
    averageTime /= history.length;
    return [history, time, minTime, maxTime, averageTime];
};

function updateGame() {
    if (gameContainer.style.display == "none") {
        return;
    }
    let updateStart = performance.now();
    updateCamera();
    try {
        if (runState == "playing") {
            updateGrid();
        }
        else if (runState == "simulating") {
            if (fpsTimes.length >= 50 * simulateSpeed) {
                simulateSpeed += 1;
            }
            else {
                simulateSpeed = Math.max(Math.floor(simulateSpeed / 2), 10);
            }
            for (let i = 0; i < simulateSpeed; i++) {
                updateGrid();
                if (runState != "simulating") {
                    break;
                }
            }
        }
        else if (runState == "slowmode" && frame % 10 == 0) {
            updateGrid();
        }
    }
    catch (err) {
        modal("ERROR BUG BUG BUG!!!", err.stack, "error");
    }
    let updateEnd = performance.now();
    let drawStart = performance.now();
    // drawGrid(offscreenCtx);
    // ctx.drawImage(offscreenCanvas, 0, 0);

    if (runState != "simulating" || frame % 10 == 0) {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        let brushX = Math.floor(cameraX + mouseX / cameraScale);
        let brushY = Math.floor(cameraY + mouseY / cameraScale);
        let cameraArray = new Float32Array([cameraX, cameraY, cameraScale, cameraScale]);
        let drawPlacementRestriction = -1;
        if (currentPuzzle != null && tick != 1) {
            drawPlacementRestriction = 4;
        }
        else if (multiplayerGameId != null) {
            drawPlacementRestriction = multiplayerGames[multiplayerGameId].players[multiplayerId].team + 2;
        }
        if (gridWidth % chunkWidth != 0) {
            for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
                gridUpdatedChunks[(chunkXAmount - 1 + chunkY * chunkXAmount) * chunkStride + 1] = Math.min(gridUpdatedChunks[(chunkXAmount - 1 + chunkY * chunkXAmount) * chunkStride + 1], gridWidth - 1);
            }
        }
        if (gridHeight % chunkHeight != 0) {
            for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                gridUpdatedChunks[(chunkX + (chunkYAmount - 1) * chunkXAmount) * chunkStride + 3] = Math.min(gridUpdatedChunks[(chunkX + (chunkYAmount - 1) * chunkXAmount) * chunkStride + 3], gridHeight - 1);
            }
        }
        if (selectionState == BRUSH) {
            if (isKeybindPressed("secondaryAction")) {
                render(cameraArray, drawPlacementRestriction, tick, grid, gridUpdated, gridUpdatedChunks, nextChunks, new Float32Array([brushX, brushY, brushSize, 0, 1, 0, 0, 1, 0, 0, 0, 0]), new Int32Array([-1]));
            }
            else {
                render(cameraArray, drawPlacementRestriction, tick, grid, gridUpdated, gridUpdatedChunks, nextChunks, new Float32Array([brushX, brushY, brushSize, brushPixel, pixels[brushPixel].color != null ? pixels[brushPixel].color[0] / 255 : 0, pixels[brushPixel].color != null ? pixels[brushPixel].color[1] / 255 : 0, pixels[brushPixel].color != null ? pixels[brushPixel].color[2] / 255 : 0, pixels[brushPixel].color != null ? pixels[brushPixel].color[3] / 255 : 0, pixels[brushPixel].noise != null ? pixels[brushPixel].noise[0] / 255 : 0, pixels[brushPixel].noise != null ? pixels[brushPixel].noise[1] / 255 : 0, pixels[brushPixel].noise != null ? pixels[brushPixel].noise[2] / 255 : 0, pixels[brushPixel].noise != null ? pixels[brushPixel].noise[3] / 255 : 0]), new Int32Array([-1]));
            }
        }
        else if (selectionState == PASTING) {
            let startX = Math.floor(cameraX + mouseX / cameraScale - (selectionWidth - 1) / 2);
            let startY = Math.floor(cameraY + mouseY / cameraScale - (selectionHeight - 1) / 2);
            render(cameraArray, drawPlacementRestriction, tick, grid, gridUpdated, gridUpdatedChunks, nextChunks, new Float32Array([startX, startY, selectionWidth, selectionHeight, 0, 0, 0, 0, 0, 0, 0, 0]), selectionGrid);
        }
        else {
            render(cameraArray, drawPlacementRestriction, tick, grid, gridUpdated, gridUpdatedChunks, nextChunks, new Float32Array([brushX, brushY, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), new Int32Array([-1]));
        }
        gridUpdated = false;
        for (let y = 0; y < chunkYAmount; y++) {
            for (let x = 0; x < chunkXAmount; x++) {
                let index = (x + y * chunkXAmount) * chunkStride;
                gridUpdatedChunks[index] = x * chunkWidth + chunkWidth;
                gridUpdatedChunks[index + 1] = x * chunkWidth - 1;
                gridUpdatedChunks[index + 2] = y * chunkHeight + chunkHeight;
                gridUpdatedChunks[index + 3] = y * chunkHeight - 1;
            }
        }

        updateMouse();
        drawGrid(overlayCtx);
        drawMouse(overlayCtx);
    }

    let drawEnd = performance.now();

    fpsTimes.push(performance.now());
    while (performance.now() - fpsTimes[0] > 1000) {
        fpsTimes.shift();
    }

    let fps, minFps, maxFps, averageFps;
    let frameTime, minFrameTime, maxFrameTime, averageFrameTime;
    let updateTime, minUpdateTime, maxUpdateTime, averageUpdateTime;
    let drawTime, minDrawTime, maxDrawTime, averageDrawTime;
    [frameHistory, frameTime, minFrameTime, maxFrameTime, averageFrameTime] = updateTimes(frameHistory, performance.now() - lastFrame);
    [fpsHistory, fps, minFps, maxFps, averageFps] = updateTimes(fpsHistory, fpsTimes.length);
    [updateHistory, updateTime, minUpdateTime, maxUpdateTime, averageUpdateTime] = updateTimes(updateHistory, updateEnd - updateStart);
    // [drawHistory, drawTime, minDrawTime, maxDrawTime, averageDrawTime] = updateTimes(drawHistory, drawEnd - drawStart);
    [drawHistory, drawTime, minDrawTime, maxDrawTime, averageDrawTime] = updateTimes(drawHistory, frameTime - updateTime);

    lastFrame = performance.now();
    frame += 1;

    if (settings.debug && (runState != "simulating" || frame % 10 == 1)) {
        function drawText(text, x, y) {
            overlayCtx.fillStyle = "#ffffff55";
            overlayCtx.fillRect(x - 2, y - 1, overlayCtx.measureText(text).width + 4, 16);
            // overlayCtx.font = "16px Source Code Pro";
            overlayCtx.font = "16px Noto Sans";
            overlayCtx.textBaseline = "top";
            overlayCtx.textAlign = "left";
            overlayCtx.fillStyle = "#000000";
            overlayCtx.fillText(text, x, y);
        };

        drawText("FPS: " + fps + "; Min: " + minFps + "; Max: " + maxFps + "; Avg: " + averageFps.toFixed(2) + ";", 3, 1);
        drawText("Frame: " + frameTime.toFixed(2) + "ms; Min: " + minFrameTime.toFixed(2) + "ms; Max: " + maxFrameTime.toFixed(2) + "ms; Avg: " + averageFrameTime.toFixed(2) + "ms;", 3, 18);
        drawText("Update: " + updateTime.toFixed(2) + "ms; Min: " + minUpdateTime.toFixed(2) + "ms; Max: " + maxUpdateTime.toFixed(2) + "ms; Avg: " + averageUpdateTime.toFixed(2) + "ms;", 3, 35);
        drawText("Draw: " + drawTime.toFixed(2) + "ms; Min: " + minDrawTime.toFixed(2) + "ms; Max: " + maxDrawTime.toFixed(2) + "ms; Avg: " + averageDrawTime.toFixed(2) + "ms;", 3, 52);
        // let fpsText = "FPS: " + fps + "; Min: " + minFps + "; Max: " + maxFps + "; Avg: " + averageFps.toFixed(2) + ";";
        // let frameText = "Frame: " + frameTime.toFixed(2) + "ms; Min: " + minFrameTime.toFixed(2) + "ms; Max: " + maxFrameTime.toFixed(2) + "ms; Avg: " + averageFrameTime.toFixed(2) + "ms;";
        // let updateText = "Update: " + updateTime.toFixed(2) + "ms; Min: " + minUpdateTime.toFixed(2) + "ms; Max: " + maxUpdateTime.toFixed(2) + "ms; Avg: " + averageUpdateTime.toFixed(2) + "ms;";
        // let drawText = "Draw: " + drawTime.toFixed(2) + "ms; Min: " + minDrawTime.toFixed(2) + "ms; Max: " + maxDrawTime.toFixed(2) + "ms; Avg: " + averageDrawTime.toFixed(2) + "ms;";
        // let simulatingText = "TPS: " + tps + "; Min: " + minDrawTime.toFixed(2) + "ms; Max: " + maxDrawTime.toFixed(2) + "ms; Avg: " + averageDrawTime.toFixed(2) + "ms;";

        // overlayCtx.fillStyle = "#ffffff55";
        // // overlayCtx.fillStyle = "#00000066";
        // // overlayCtx.strokeStyle = "#000000";
        // // overlayCtx.lineWidth = 2;
        // overlayCtx.fillRect(1, 0, overlayCtx.measureText(fpsText).width + 4, 16);
        // overlayCtx.fillRect(1, 17, overlayCtx.measureText(frameText).width + 4, 16);
        // overlayCtx.fillRect(1, 34, overlayCtx.measureText(updateText).width + 4, 16);
        // overlayCtx.fillRect(1, 51, overlayCtx.measureText(drawText).width + 4, 16);
        // // overlayCtx.strokeRect(1, 0, overlayCtx.measureText(fpsText).width + 4, 16);
        // // overlayCtx.strokeRect(1, 17, overlayCtx.measureText(frameText).width + 4, 16);
        // // overlayCtx.strokeRect(1, 34, overlayCtx.measureText(updateText).width + 4, 16);
        // // overlayCtx.strokeRect(1, 51, overlayCtx.measureText(drawText).width + 4, 16);

        // overlayCtx.font = "16px Source Code Pro";
        // overlayCtx.font = "16px Noto Sans";
        // overlayCtx.textBaseline = "top";
        // overlayCtx.textAlign = "left";
        // overlayCtx.fillStyle = "#000000";
        // // overlayCtx.fillStyle = "#ffffff";
        // overlayCtx.fillText(fpsText, 3, 1);
        // overlayCtx.fillText(frameText, 3, 18);
        // overlayCtx.fillText(updateText, 3, 35);
        // overlayCtx.fillText(drawText, 3, 52);

        overlayCtx.fillStyle = "#7f7f7f7f";
        overlayCtx.fillRect(graphX, graphY, graphWidth, graphHeight);

        overlayCtx.strokeStyle = timingGradient;
        overlayCtx.lineJoin = "bevel";
        overlayCtx.lineCap = "butt";
        overlayCtx.lineWidth = 3;
        overlayCtx.setLineDash([]);
        overlayCtx.beginPath();
        overlayCtx.moveTo(graphX, Math.max(graphY + 1, graphY + graphHeight - 1 - frameHistory[0] * 2));
        for (let i = 1; i < frameHistory.length; i++) {
            overlayCtx.lineTo(graphX + i / historyLength * graphWidth, Math.max(graphY + 1, graphY + graphHeight - 1 - frameHistory[i] * 2));
        }
        overlayCtx.stroke();
        overlayCtx.lineWidth = 2;
        overlayCtx.beginPath();
        overlayCtx.moveTo(graphX, Math.max(graphY + 1, graphY + graphHeight - 1 - updateHistory[0] * 2));
        for (let i = 1; i < updateHistory.length; i++) {
            overlayCtx.lineTo(graphX + i / historyLength * graphWidth, Math.max(graphY + 1, graphY + graphHeight - 1 - updateHistory[i] * 2));
        }
        overlayCtx.stroke();
        overlayCtx.lineWidth = 1;
        overlayCtx.beginPath();
        overlayCtx.moveTo(graphX, Math.max(graphY + 1, graphY + graphHeight - 1 - drawHistory[0] * 2));
        for (let i = 1; i < drawHistory.length; i++) {
            overlayCtx.lineTo(graphX + i / historyLength * graphWidth, Math.max(graphY + 1, graphY + graphHeight - 1 - drawHistory[i] * 2));
        }
        overlayCtx.stroke();

        overlayCtx.strokeStyle = "#555555";
        overlayCtx.lineWidth = 2;
        overlayCtx.setLineDash([6, 6]);
        overlayCtx.beginPath();
        overlayCtx.moveTo(graphX + 3, graphY + graphHeight - 1 - 1000 / 60 * 2);
        overlayCtx.lineTo(graphX + graphWidth - 3, graphY + graphHeight - 1 - 1000 / 60 * 2);
        overlayCtx.moveTo(graphX + 3, graphY + graphHeight - 1 - 1000 / 30 * 2);
        overlayCtx.lineTo(graphX + graphWidth - 3, graphY + graphHeight - 1 - 1000 / 30 * 2);
        overlayCtx.stroke();

        overlayCtx.fillStyle = "#000000";
        overlayCtx.fillText("60 FPS", graphX + 3, graphY + graphHeight - 1 - 1000 / 60 * 2 - 21);
        overlayCtx.fillText("30 FPS", graphX + 3, graphY + graphHeight - 1 - 1000 / 30 * 2 - 21);
        overlayCtx.setLineDash([]);

        drawText("Tick: " + (tick - 1) / 9, 3, graphY + graphHeight + 3);

        let brushX = Math.floor(cameraX + mouseX / cameraScale);
        let brushY = Math.floor(cameraY + mouseY / cameraScale);
        if (selectionState == BRUSH) {
            drawText("Brush Size: " + (brushSize * 2 - 1), 3, graphY + graphHeight + 20);
        }
        else if (selectionState == SELECTING) {
            drawText("Selection: (" + Math.min(selectionX, brushX) + ", " + Math.min(selectionY, brushY) + ") => (" + Math.max(selectionX, brushX) + ", " + Math.max(selectionY, brushY) + "), " + (Math.abs(selectionX - brushX) + 1) + "x" + (Math.abs(selectionY - brushY) + 1), 3, graphY + graphHeight + 20);
        }
        else if (selectionState == SELECTED) {
            drawText("Selection: (" + selectionX + ", " + selectionY + ") => (" + (selectionX + selectionWidth - 1) + ", " + (selectionY + selectionHeight - 1) + "), " + selectionWidth + "x" + selectionHeight, 3, graphY + graphHeight + 20);
        }
        else if (selectionState == PASTING) {
            drawText("Selection: " + selectionWidth + "x" + selectionHeight, 3, graphY + graphHeight + 20);
        }
        if (brushX >= 0 && brushX < gridWidth && brushY >= 0 && brushY < gridHeight) {
            drawText(pixels[grid[(brushX + brushY * gridWidth) * gridStride + ID]].name + " (" + brushX + ", " + brushY + ")", 3, graphY + graphHeight + 37);
        }
        if (!webgpuSupported) {
            drawText("Using Backup Renderer", 3, graphY + graphHeight + 54);
        }
    }

    if (frameTime > 30) {
        // console.log(cameraX, cameraY, Math.round(cameraScale * 256) / 256, frameTime)

    }

    // if (runState == "simulating") {
    //     setTimeout(updateGame, 0);
    // }
};
function update() {
    updateMenu();
    updateMultiplayer();
    updateGame();
    window.requestAnimationFrame(update);
};
window.requestAnimationFrame(update);

// setInterval(update, 100);
window.onresize();

export { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, drawChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, gridUpdatedChunks, tick, modal, setRunState, sandboxGrid, sandboxSaveCode, downloadFile, uploadFile, generateSaveCode, parseSaveCode, loadSaveCode, drawBlueprintImg, settings, mouseX, mouseY, brushPixel, setBrushPixel, showTooltip, hideTooltip, moveTooltip, resetGrid };