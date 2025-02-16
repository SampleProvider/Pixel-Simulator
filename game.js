import { pixels, addPixel, addFire, addUpdatedChunk, addUpdatedChunk2, resetPushPixels } from "./pixels.js";
import { resizeCanvas, resizeGrid, render } from "./renderer.js";

/*

* TODO *

bugs:
none! yay

features:
history of savecodes/grid???
undo
blueprints
port to rust for webassembly

pixels:
polish pixels
changePixel vs addPixel
polish colors

fire optimization

change chunk update from 3x5 to 5x5? - DONE

change textures to left-right-up-down - oh wait rotations

look at the all caps constants - maybe we can just repalce wtih string

fix pushX pushY - DONE
fix collapseX collapseY - DONE
remove unnecessary workedPushPixels

add explode functions to pumps
isId function is so useless - DONE
deterministic random
lava cooling? and lava heater heating stone
lava heater raycasts for some reason

shader hardcoding pixel ids

transparency rendering - DONE

oh no tick overflow after 38.5 days

why are observers deactivatable that is dumb - DONE

water/flow code is kind of bad
water needs to check for acid in ispassible

check "for i in" stuff

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
window.onerror = function(e) {
    modal("ERROR BUG BUG BUG!!!", e.message + " " + e.filename + " " + e.lineno + " " + e.colno, "error");
};
const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");

let WIDTH = window.innerWidth * devicePixelRatio;
let HEIGHT = window.innerHeight * devicePixelRatio;

const pixelPicker = document.getElementById("pixelPicker"); // spaghetti buh
window.onresize = () => {
    WIDTH = window.innerWidth * devicePixelRatio;
    HEIGHT = window.innerHeight * devicePixelRatio;
    overlayCanvas.width = WIDTH;
    overlayCanvas.height = HEIGHT;
    resizeCanvas(WIDTH, HEIGHT);
    document.body.style.setProperty("--border-size", Number(getComputedStyle(pixelPicker).getPropertyValue("border-left-width").replaceAll("px", "")) / 2 + "px");
};
window.onresize();

const ID = 0;
const ON_FIRE = 1;
const HAS_TARGET = 2;
const UPDATED = 3;
const COLOR_R = 4;
const COLOR_G = 5;
const COLOR_B = 6;
const COLOR_A = 7;

let grid = new Float32Array();
// let gridWidth = 32;
// let gridHeight = 32;
let gridWidth = 128;
let gridHeight = 128;
gridWidth *= 2;
gridHeight *= 2;
gridWidth *= 2;
gridHeight *= 2;
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

let tick = 1;
let frame = 0;

const modalContainer = document.getElementById("modalContainer");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const modalYes = document.getElementById("modalYes");
const modalNo = document.getElementById("modalNo");
const modalOk = document.getElementById("modalOk");

function modal(title, content, type) {
    if (type == "error") {
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
        runState = PAUSED;
    }
    runState = PAUSED;
    return new Promise((resolve, reject) => {
        modalContainer.onclose = () => {
            console.log(modalContainer.returnValue)
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

const PAUSED = 0;
const PLAYING = 1;
const SIMULATING = 2;
const SLOWMODE = 3;
let runState = PAUSED;
let simulateSpeed = 10;

const playButton = document.getElementById("playButton");
const stepButton = document.getElementById("stepButton");
const simulateButton = document.getElementById("simulateButton");
const slowmodeButton = document.getElementById("slowmodeButton");

playButton.onclick = () => {
    if (runState != PLAYING) {
        runState = PLAYING;
        playButton.classList.add("pauseButton");
        simulateButton.classList.remove("pauseButton");
        slowmodeButton.classList.remove("pauseButton");
    }
    else {
        runState = PAUSED;
        playButton.classList.remove("pauseButton");
    }
};
stepButton.onclick = () => {
    if (runState == PAUSED) {
        updateGrid();
    }
};
simulateButton.onclick = () => {
    if (runState != SIMULATING) {
        runState = SIMULATING;
        playButton.classList.remove("pauseButton");
        simulateButton.classList.add("pauseButton");
        slowmodeButton.classList.remove("pauseButton");
    }
    else {
        runState = PAUSED;
        simulateButton.classList.remove("pauseButton");
    }
};
slowmodeButton.onclick = () => {
    if (runState != SLOWMODE) {
        runState = SLOWMODE;
        playButton.classList.remove("pauseButton");
        simulateButton.classList.remove("pauseButton");
        slowmodeButton.classList.add("pauseButton");
    }
    else {
        runState = PAUSED;
        slowmodeButton.classList.remove("pauseButton");
    }
};

const resetButton = document.getElementById("resetButton");
resetButton.onclick = async () => {
    if (await modal("Reset?", "Your current simulation will be deleted!", "confirm")) {
        loadSaveCode(saveCode.value);
    }
};

const saveCodeSettings = document.getElementById("saveCodeSettings");
const saveCodeSettingsToggle = document.getElementById("saveCodeSettingsToggle");
const saveCode = document.getElementById("saveCode");
const downloadSaveCodeButton = document.getElementById("downloadSaveCodeButton");
const uploadSaveCodeButton = document.getElementById("uploadSaveCodeButton");
const generateSaveCodeButton = document.getElementById("generateSaveCodeButton");

saveCodeSettingsToggle.onclick = () => {
    saveCodeSettings.classList.toggle("hidden");
};

downloadSaveCodeButton.onclick = () => {
    saveCode.value = generateSaveCode();
};
uploadSaveCodeButton.onclick = () => {
    saveCode.value = generateSaveCode();
};
generateSaveCodeButton.onclick = () => {
    saveCode.value = generateSaveCode();
};

function generateSaveCode() {
    let string = "";
    string += "V1;";
    string += gridWidth + "-" + gridHeight + ";";

    let id = grid[ID];
    let amount = 0;

    for (let i = 0; i < gridWidth * gridHeight * gridStride; i += gridStride) {
        amount += 1;
        if (grid[i + ID] != id) {
            string += pixels[id].id;
            if (amount > 1) {
                string += "-" + amount;
            }
            string += ":";

            id = grid[i + ID];
            amount = 0;
        }
    }
    string += pixels[id].id;
    if (amount > 1) {
        string += "-" + amount;
    }
    string += ";";

    id = grid[ON_FIRE];
    amount = 0;

    string += id + ":";

    for (let i = 0; i < gridWidth * gridHeight * gridStride; i += gridStride) {
        amount += 1;
        if (grid[i + ON_FIRE] != id) {
            string += amount + ":";

            id = grid[i + ON_FIRE];
            amount = 0;
        }
    }
    string += amount + ";";

    return string;
};
function loadSaveCode(string) {
    let sections = string.split(";");
    let version = sections[0];
    if (version == "V1") {
        let array = sections[1].split("-");
        gridWidth = Number(array[0]);
        if (array.length > 1) {
            gridHeight = Number(array[1]);
        }
        else {
            gridHeight = gridWidth;
        }
        createGrid();

        array = sections[2].split(":");

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

        array = sections[3].split(":");

        let fire = Number(array[0]);
        index = 0;

        array.shift();

        for (let i in array) {
            let amount = Number(array[i]);

            for (let j = 0; j < amount; j++) {
                grid[index + ON_FIRE] = fire;
                index += gridStride;
            }

            fire = (fire + 1) % 2;
        }
    }
};

// controls

let controls = {
    Control: false,
    Alt: false,
    Meta: false,
};
let keybinds = {};
keybinds["Main Action"] = [{ key: "LMB" }];
keybinds["Secondary Action"] = [{ key: "RMB" }];
keybinds["Move Left"] = [{ key: "a", ctrl: false, alt: false, meta: false }];
keybinds["Move Right"] = [{ key: "d", ctrl: false, alt: false, meta: false }];
keybinds["Move Up"] = [{ key: "w", ctrl: false, alt: false, meta: false }];
keybinds["Move Down"] = [{ key: "s", ctrl: false, alt: false, meta: false }];
keybinds["Zoom In"] = [{ key: "e", ctrl: false, alt: false, meta: false }, { key: "]", ctrl: false, alt: false, meta: false }];
keybinds["Zoom Out"] = [{ key: "q", ctrl: false, alt: false, meta: false }, { key: "[", ctrl: false, alt: false, meta: false }];
keybinds["Increment Brush Size"] = [{ key: "ArrowUp", ctrl: false, alt: false, meta: false }];
keybinds["Decrement Brush Size"] = [{ key: "ArrowDown", ctrl: false, alt: false, meta: false }];
keybinds["Begin Selection"] = [{ key: "Control", ctrl: true, alt: null, meta: null }];
keybinds["End Selection"] = [{ key: "Escape", ctrl: false, alt: false, meta: false }];
keybinds["Copy Selection"] = [{ key: "c", ctrl: true, alt: false, meta: false }];
keybinds["Paste Selection"] = [{ key: "v", ctrl: true, alt: false, meta: false }];
keybinds["Cut Selection"] = [{ key: "x", ctrl: true, alt: false, meta: false }];
keybinds["Rotate Selection"] = [{ key: "r", ctrl: false, alt: false, meta: false }];
keybinds["Flip Selection Horizontally"] = [{ key: "f", ctrl: false, alt: false, meta: false }];
keybinds["Flip Selection Vertically"] = [{ key: "g", ctrl: false, alt: false, meta: false }];
keybinds["Play"] = [{ key: "p", ctrl: false, alt: false, meta: false }, { key: "Space", ctrl: false, alt: false, meta: false }];
keybinds["Step"] = [{ key: "Enter", ctrl: false, alt: false, meta: false }];
keybinds["Draw Updating Chunks"] = [{ key: "b", ctrl: false, alt: false, meta: false }];

for (let i in keybinds) {
    for (let j in keybinds[i]) {
        controls[keybinds[i][j].key] = false;
    }
}

function isKeybindPressed(keybind) {
    for (let i in keybinds[keybind]) {
        if (controls[keybinds[keybind][i].key] == false) {
            continue;
        }
        if (keybinds[keybind][i].key != "LMB" && keybinds[keybind][i].key != "RMB") {
            if (keybinds[keybind][i].ctrl != null && ((controls["Control"] != false) && (controls["Control"] <= controls[keybinds[keybind][i].key])) != keybinds[keybind][i].ctrl) {
                continue;
            }
            if (keybinds[keybind][i].alt != null && ((controls["Alt"] != false) && (controls["Alt"] <= controls[keybinds[keybind][i].key])) != keybinds[keybind][i].alt) {
                continue;
            }
            if (keybinds[keybind][i].meta != null && ((controls["Meta"] != false) && (controls["Meta"] <= controls[keybinds[keybind][i].key])) != keybinds[keybind][i].meta) {
                continue;
            }
        }
        return true;
    }
    return false;
};
function isKeybindJustPressed(keybind) {
    // spaghetti but it seems to work
    for (let i in keybinds[keybind]) {
        if (controls[keybinds[keybind][i].key] == false || controls[keybinds[keybind][i].key] < lastFrame) {
            continue;
        }
        if (keybinds[keybind][i].key != "LMB" && keybinds[keybind][i].key != "RMB") {
            if (((controls["Control"] != false) && (controls["Control"] <= controls[keybinds[keybind][i].key])) != keybinds[keybind][i].ctrl) {
                continue;
            }
            if (((controls["Alt"] != false) && (controls["Alt"] <= controls[keybinds[keybind][i].key])) != keybinds[keybind][i].alt) {
                continue;
            }
            if (((controls["Meta"] != false) && (controls["Meta"] <= controls[keybinds[keybind][i].key])) != keybinds[keybind][i].meta) {
                continue;
            }
        }
        return true;
    }
    return false;
};

let mouseX = 0;
let mouseY = 0;
let mouseRawX = 0;
let mouseRawY = 0;

let brushSize = 1 + 4;
let brushPixel = 1;

function setBrushPixel(pixel) {
    brushPixel = pixel;
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
    if (isKeybindJustPressed("End Selection") || isKeybindJustPressed("Secondary Action")) {
        if (selectionState == SELECTING || selectionState == SELECTED || selectionState == PASTING) {
            selectionState = BRUSH;
            controls["RMB"] = false;
        }
    }
    else if (isKeybindPressed("Begin Selection") && isKeybindJustPressed("Main Action")) {
        if (selectionState == BRUSH) {
            selectionState = SELECTING;
            selectionX = brushX;
            selectionY = brushY;
        }
    }
    else {
        if (isKeybindJustPressed("Paste Selection")) {
            if (selectionGrid != null) {
                selectionState = PASTING;
                selectionWidth = selectionGridWidth;
                selectionHeight = selectionGridHeight;
            }
        }
        if (selectionState == SELECTING && !isKeybindPressed("Main Action")) {
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
    if (selectionState == BRUSH) {
        if (isKeybindPressed("Secondary Action")) {
            if (pixels[brushPixel].id == "fire") {
                for (let y = Math.max(brushY - (brushSize - 1), 0); y < Math.min(brushY + brushSize, gridHeight); y++) {
                    for (let x = Math.max(brushX - (brushSize - 1), 0); x < Math.min(brushX + brushSize, gridWidth); x++) {
                        addFire(x, y, 0);
                        // addUpdatedChunk2(x, y);
                    }
                }
            }
            else {
                for (let y = Math.max(brushY - (brushSize - 1), 0); y < Math.min(brushY + brushSize, gridHeight); y++) {
                    for (let x = Math.max(brushX - (brushSize - 1), 0); x < Math.min(brushX + brushSize, gridWidth); x++) {
                        addPixel(x, y, 0);
                        // addUpdatedChunk2(x, y);
                        grid[(x + y * gridWidth) * gridStride + UPDATED] = 0;
                    }
                }
            }
        }
        else if (isKeybindPressed("Main Action")) {
            if (pixels[brushPixel].id == "fire") {
                for (let y = Math.max(brushY - (brushSize - 1), 0); y < Math.min(brushY + brushSize, gridHeight); y++) {
                    for (let x = Math.max(brushX - (brushSize - 1), 0); x < Math.min(brushX + brushSize, gridWidth); x++) {
                        addFire(x, y, 1);
                        // addUpdatedChunk2(x, y);
                    }
                }
            }
            else {
                for (let y = Math.max(brushY - (brushSize - 1), 0); y < Math.min(brushY + brushSize, gridHeight); y++) {
                    for (let x = Math.max(brushX - (brushSize - 1), 0); x < Math.min(brushX + brushSize, gridWidth); x++) {
                        addPixel(x, y, brushPixel);
                        // addUpdatedChunk2(x, y);
                        grid[(x + y * gridWidth) * gridStride + UPDATED] = 0;
                    }
                }
            }
        }
    }
    else if (selectionState == SELECTING) {
    }
    else if (selectionState == SELECTED) {
        if (isKeybindJustPressed("Copy Selection")) {
            let array = [];
            for (let y = Math.max(selectionY, 0); y < Math.min(selectionY + selectionHeight, gridHeight); y++) {
                for (let x = Math.max(selectionX, 0); x < Math.min(selectionX + selectionWidth, gridWidth); x++) {
                    for (let i = 0; i < gridStride; i++) {
                        array.push(grid[(x + y * gridWidth) * gridStride + i]);
                    }
                }
            }
            selectionGrid = new Float32Array(array);
            selectionGridWidth = Math.min(selectionX + selectionWidth, gridWidth) - Math.max(selectionX, 0);
            selectionGridHeight = Math.min(selectionY + selectionHeight, gridHeight) - Math.max(selectionY, 0);
        }
        else if (isKeybindJustPressed("Cut Selection")) {
            let array = [];
            for (let y = Math.max(selectionY, 0); y < Math.min(selectionY + selectionHeight, gridHeight); y++) {
                for (let x = Math.max(selectionX, 0); x < Math.min(selectionX + selectionWidth, gridWidth); x++) {
                    for (let i = 0; i < gridStride; i++) {
                        array.push(grid[(x + y * gridWidth) * gridStride + i]);
                    }
                    addPixel(x, y, 0);
                    addFire(x, y, 0);
                    // addUpdatedChunk2(x, y);
                }
            }
            selectionGrid = new Float32Array(array);
            selectionGridWidth = Math.min(selectionX + selectionWidth, gridWidth) - Math.max(selectionX, 0);
            selectionGridHeight = Math.min(selectionY + selectionHeight, gridHeight) - Math.max(selectionY, 0);

            selectionState = PASTING;
            selectionWidth = selectionGridWidth;
            selectionHeight = selectionGridHeight;
        }
    }
    else if (selectionState == PASTING) {
        let startX = Math.floor(cameraX + mouseX / cameraScale - (selectionWidth - 1) / 2);
        let startY = Math.floor(cameraY + mouseY / cameraScale - (selectionHeight - 1) / 2);
        if (isKeybindPressed("Main Action")) {
            // pasting settings
            for (let y = Math.max(startY, 0); y < Math.min(startY + selectionHeight, gridHeight); y++) {
                for (let x = Math.max(startX, 0); x < Math.min(startX + selectionWidth, gridWidth); x++) {
                    for (let i = 0; i < gridStride; i++) {
                        grid[(x + y * gridWidth) * gridStride + i] = selectionGrid[(x - startX + (y - startY) * selectionWidth) * gridStride + i];
                    }
                    addUpdatedChunk(x, y);
                    // addUpdatedChunk2(x, y);
                }
            }
        }
        if (isKeybindJustPressed("Rotate Selection")) {
            let array = [];
            for (let x = 0; x < selectionGridWidth; x++) {
                for (let y = selectionGridHeight - 1; y >= 0; y--) {
                    for (let i = 0; i < gridStride; i++) {
                        let data = selectionGrid[(x + y * selectionGridWidth) * gridStride + i];
                        if (i == ID && pixels[data].rotatable) {
                            let pixel = pixels[data];
                            data = pixel.rotations[(pixel.rotation + 1) % pixel.rotations.length];
                        }
                        array.push(data);
                    }
                }
            }
            selectionGrid = new Float32Array(array);
            let width = selectionGridWidth;
            selectionGridWidth = selectionGridHeight;
            selectionGridHeight = width;

            selectionWidth = selectionGridWidth;
            selectionHeight = selectionGridHeight;
        }
        if (isKeybindJustPressed("Flip Selection Horizontally")) {
            let array = [];
            for (let y = 0; y < selectionGridHeight; y++) {
                for (let x = selectionGridWidth - 1; x >= 0; x--) {
                    for (let i = 0; i < gridStride; i++) {
                        let data = selectionGrid[(x + y * selectionGridWidth) * gridStride + i];
                        if (i == ID && pixels[data].rotatable) {
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
            selectionGrid = new Float32Array(array);
        }
        if (isKeybindJustPressed("Flip Selection Vertically")) {
            let array = [];
            for (let y = selectionGridHeight - 1; y >= 0; y--) {
                for (let x = 0; x < selectionGridWidth; x++) {
                    for (let i = 0; i < gridStride; i++) {
                        let data = selectionGrid[(x + y * selectionGridWidth) * gridStride + i];
                        if (i == ID && pixels[data].rotatable) {
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
            selectionGrid = new Float32Array(array);
        }
    }
};

let tooltip = document.getElementById("tooltip");
let tooltipName = document.getElementById("tooltipName");
let tooltipDescription = document.getElementById("tooltipDescription");

function showTooltip(name, description) {
    tooltip.style.opacity = "1";
    tooltipName.innerHTML = name;
    tooltipDescription.innerHTML = description;
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
    if (isKeybindPressed("Move Left")) {
        cameraSpeedX -= cameraAcceleration / cameraScale;
    }
    if (isKeybindPressed("Move Right")) {
        cameraSpeedX += cameraAcceleration / cameraScale;
    }
    if (isKeybindPressed("Move Up")) {
        cameraSpeedY -= cameraAcceleration / cameraScale;
    }
    if (isKeybindPressed("Move Down")) {
        cameraSpeedY += cameraAcceleration / cameraScale;
    }
    cameraSpeedX *= cameraFriction;
    cameraSpeedY *= cameraFriction;

    if (isKeybindPressed("Zoom In")) {
        cameraScaleTarget /= 1.01 ** (-10);
        cameraScaleX = mouseX;
        cameraScaleY = mouseY;
    }
    if (isKeybindPressed("Zoom Out")) {
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
    mouseX = e.clientX * devicePixelRatio;
    mouseY = e.clientY * devicePixelRatio;
};
overlayCanvas.onmousedown = (e) => {
    if (e.button == 0) {
        controls["LMB"] = performance.now();
    }
    else if (e.button == 2) {
        controls["RMB"] = performance.now();
    }
};
document.onmouseup = (e) => {
    if (e.button == 0) {
        controls["LMB"] = false;
    }
    else if (e.button == 2) {
        controls["RMB"] = false;
    }
};
document.oncontextmenu = (e) => {
    e.preventDefault();
};

document.onkeydown = (e) => {
    var key = e.key;
    if (key == " ") {
        key = "Space";
    }
    if (controls[key] == false) {
        controls[key] = performance.now();
    }
    if (selectionState == BRUSH) {
        for (let i in keybinds["Increment Brush Size"]) {
            if (key == keybinds["Increment Brush Size"][i].key) {
                if (isKeybindPressed("Increment Brush Size")) {
                    brushSize = Math.min(brushSize + 1, Math.ceil((Math.max(gridWidth, gridHeight) + 1) / 2));
                }
            }
        }
        for (let i in keybinds["Decrement Brush Size"]) {
            if (key == keybinds["Decrement Brush Size"][i].key) {
                if (isKeybindPressed("Decrement Brush Size")) {
                    brushSize = Math.max(brushSize - 1, 1);
                }
            }
        }
    }
    for (let i in keybinds["Play"]) {
        if (key == keybinds["Play"][i].key) {
            if (isKeybindPressed("Play")) {
                switch (runState) {
                    case PAUSED:
                    case PLAYING:
                        playButton.click();
                        break;
                    case SIMULATING:
                        simulateButton.click();
                        break;
                    case SLOWMODE:
                        slowmodeButton.click();
                        break;
                }
                break;
            }
        }
    }
    if (runState == PAUSED) {
        for (let i in keybinds["Step"]) {
            if (key == keybinds["Step"][i].key) {
                if (isKeybindPressed("Step")) {
                    updateGrid();
                }
            }
        }
    }
};
document.onkeyup = (e) => {
    var key = e.key;
    if (key == " ") {
        key = "Space";
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

function createGrid() {
    let gridArray = [];
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            // if (Math.random() < 0.5 && x > gridWidth * 4 / 5) {
            // if (Math.random() < 0.25 && x > gridWidth * 4 / 5) {
            // gridArray.push(...[4, 0, 0, 1, 0.85 + Math.random() * 0.05, 0.5, 1, 0, 0]);
            // }
            // // else if (Math.random() < 0.25) {
            // if (Math.random() < 10.5 && x > gridWidth * 4 / 5) {
            //     // else if (Math.random() < 0.5 && y > gridHeight * 3 / 4) {
            //     gridArray.push(...[2, 0, 0, 0.1, 0.3, 0.85 + Math.random() * 0.05, 1, 0, 0]);
            // }
            // // if (x == 0 && y == 0) {
            // //     gridArray.push(...[2, 0, 0, 0.1, 0.3, 0.85 + Math.random() * 0.05, 1, 0, 0]);
            // // }
            // else {
            //     // gridArray.push(...[0, 0, 0, 1, 1, 1, 1, 0, 0]);
            //     gridArray.push(...[6, 0, 0, 1, 1, 1, 1, 0, 0]);
            // }
            // gridArray.push(...[0, 0, 0, 1, 1, 1, 1, 0, 0]);
            // gridArray.push(...[0, 0, 0, 1, 1, 1, 0.5, 0, 0]);
            gridArray.push(...[0, 0, 0, 0]);
        }
    }

    let chunksArray = [];
    // for (let y = 0; y < chunkYAmount; y++) {
    //     for (let x = 0; x < chunkXAmount; x++) {
    //         chunksArray.push(...[x * chunkWidth + chunkWidth + 1, x * chunkWidth - 2, y * chunkHeight + chunkHeight + 1, y * chunkHeight - 2]);
    //     }
    // }
    for (let y = 0; y < chunkYAmount; y++) {
        for (let x = 0; x < chunkXAmount; x++) {
            chunksArray.push(...[x * chunkWidth, x * chunkWidth + chunkWidth - 1, y * chunkHeight, y * chunkHeight + chunkHeight - 1]);
        }
    }

    grid = new Float32Array(gridArray);
    chunks = new Int32Array(chunksArray);
    nextChunks = new Int32Array(chunksArray);
    drawChunks = new Int32Array(chunksArray);
    resetPushPixels();
    resizeGrid(gridWidth, gridHeight, gridStride, chunkXAmount, chunkYAmount, chunkStride);
};
createGrid();

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
    if (debug && controls["b"]) {
    // if (isKeybindPressed("Draw Updating Chunks")) {
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

function updateGrid() {
    console.log(tick)
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
                        if (grid[index + ON_FIRE] == 1) {
                            pixels[FIRE].update(x, y);
                        }
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
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
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
                let minY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2];
                let maxY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3];
                if (y >= minY && y <= maxY) {
                    // let minX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] - buffer, chunkX * chunkWidth);
                    // let maxX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1] + buffer, chunkX * chunkWidth + chunkWidth - 1);
                    let minX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride];
                    let maxX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1];
                    for (let x = maxX; x >= minX; x--) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update1 == null) {
                            continue;
                        }
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
                        if (pixels[grid[index + ID]].update2 == null) {
                            continue;
                        }
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
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkY);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let x = chunkX * chunkWidth; x < chunkX * chunkWidth + chunkWidth; x++) {
            for (let chunkY of updatingChunks) {
                let minX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride];
                let maxX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1];
                if (x >= minX && x <= maxX) {
                    let minY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2];
                    let maxY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3];
                    for (let y = maxY; y >= minY; y--) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update3 == null) {
                            continue;
                        }
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
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                updatingChunks.push(chunkY);
            }
        }
        if (updatingChunks.length == 0) {
            continue;
        }
        for (let x = chunkX * chunkWidth; x < chunkX * chunkWidth + chunkWidth; x++) {
            for (let chunkY of updatingChunks) {
                let minX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride];
                let maxX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1];
                if (x >= minX && x <= maxX) {
                    let minY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2];
                    let maxY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3];
                    for (let y = minY; y <= maxY; y++) {
                        let index = (x + y * gridWidth) * gridStride;
                        if (grid[index + UPDATED] == tick) {
                            continue;
                        }
                        if (pixels[grid[index + ID]].update4 == null) {
                            continue;
                        }
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
                if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
                    updatingChunks.push(chunkX);
                }
            }
            if (updatingChunks.length == 0) {
                continue;
            }
            // for (let y = chunkY * chunkHeight + chunkHeight - 1; y >= chunkY * chunkHeight; y--) {
            for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
                // for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                //     if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth + 1) {
                //         continue;
                //     }
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
                            if (pixels[grid[index + ID]].update == null) {
                                continue;
                            }
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
                if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] != chunkX * chunkWidth + chunkWidth) {
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
                    let minY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2];
                    let maxY = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3];
                    if (y >= minY && y <= maxY) {
                        let minX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride];
                        let maxX = chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1];
                        for (let x = maxX; x >= minX; x--) {
                            let index = (x + y * gridWidth) * gridStride;
                            if (grid[index + UPDATED] == tick) {
                                continue;
                            }
                            if (pixels[grid[index + ID]].update == null) {
                                continue;
                            }
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
            let x = chunkX * chunkWidth + Math.floor(Math.random() * chunkWidth);
            let y = chunkY * chunkHeight + Math.floor(Math.random() * chunkHeight);
            let index = (x + y * gridWidth) * gridStride;
            if (pixels[grid[index + ID]].randomUpdate != null) {
                pixels[grid[index + ID]].randomUpdate(x, y);
            }
        }
    }
    tick += 1;
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
                        if (pixels[grid[index + ID]].update5 == null) {
                            continue;
                        }
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
};

let debug = true;

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

function update() {
    let updateStart = performance.now();
    updateCamera();
    if (runState == PLAYING) {
        updateGrid();
    }
    else if (runState == SIMULATING) {
        if (fpsTimes.length >= 50 * simulateSpeed) {
            simulateSpeed += 1;
        }
        else {
            simulateSpeed = Math.max(Math.floor(simulateSpeed / 2), 10);
        }
        for (let i = 0; i < simulateSpeed; i++) {
            updateGrid();
        }
    }
    else if (runState == SLOWMODE && frame % 10 == 0) {
        updateGrid();
    }
    let updateEnd = performance.now();
    let drawStart = performance.now();
    // drawGrid(offscreenCtx);
    // ctx.drawImage(offscreenCanvas, 0, 0);

    if (runState != SIMULATING || frame % 10 == 0) {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        let brushX = Math.floor(cameraX + mouseX / cameraScale);
        let brushY = Math.floor(cameraY + mouseY / cameraScale);
        if (selectionState == BRUSH) {
            if (isKeybindPressed("Secondary Action")) {
                render(new Float32Array([cameraX, cameraY, cameraScale, cameraScale]), tick, grid, nextChunks, new Float32Array([brushX, brushY, brushSize, 0, 1, 0, 0, 1, 0, 0, 0, 0]), new Float32Array([-1]));
            }
            else {
                render(new Float32Array([cameraX, cameraY, cameraScale, cameraScale]), tick, grid, nextChunks, new Float32Array([brushX, brushY, brushSize, brushPixel, pixels[brushPixel].color != null ? pixels[brushPixel].color[0] / 255 : 0, pixels[brushPixel].color != null ? pixels[brushPixel].color[1] / 255 : 0, pixels[brushPixel].color != null ? pixels[brushPixel].color[2] / 255 : 0, pixels[brushPixel].color != null ? pixels[brushPixel].color[3] / 255 : 0, pixels[brushPixel].noise != null ? pixels[brushPixel].noise[0] / 255 : 0, pixels[brushPixel].noise != null ? pixels[brushPixel].noise[1] / 255 : 0, pixels[brushPixel].noise != null ? pixels[brushPixel].noise[2] / 255 : 0, pixels[brushPixel].noise != null ? pixels[brushPixel].noise[3] / 255 : 0]), new Float32Array([-1]));
            }
        }
        else if (selectionState == PASTING) {
            let startX = Math.floor(cameraX + mouseX / cameraScale - (selectionWidth - 1) / 2);
            let startY = Math.floor(cameraY + mouseY / cameraScale - (selectionHeight - 1) / 2);
            render(new Float32Array([cameraX, cameraY, cameraScale, cameraScale]), tick, grid, nextChunks, new Float32Array([startX, startY, selectionWidth, selectionHeight, 0, 0, 0, 0, 0, 0, 0, 0]), selectionGrid);
        }
        else {
            render(new Float32Array([cameraX, cameraY, cameraScale, cameraScale]), tick, grid, nextChunks, new Float32Array([brushX, brushY, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), new Float32Array([-1]));
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

    if (debug) {
        let fpsText = "FPS: " + fps + "; Min: " + minFps + "; Max: " + maxFps + "; Avg: " + averageFps.toFixed(2) + ";";
        let frameText = "Frame: " + frameTime.toFixed(2) + "ms; Min: " + minFrameTime.toFixed(2) + "ms; Max: " + maxFrameTime.toFixed(2) + "ms; Avg: " + averageFrameTime.toFixed(2) + "ms;";
        let updateText = "Update: " + updateTime.toFixed(2) + "ms; Min: " + minUpdateTime.toFixed(2) + "ms; Max: " + maxUpdateTime.toFixed(2) + "ms; Avg: " + averageUpdateTime.toFixed(2) + "ms;";
        let drawText = "Draw: " + drawTime.toFixed(2) + "ms; Min: " + minDrawTime.toFixed(2) + "ms; Max: " + maxDrawTime.toFixed(2) + "ms; Avg: " + averageDrawTime.toFixed(2) + "ms;";
        // let simulatingText = "TPS: " + tps + "; Min: " + minDrawTime.toFixed(2) + "ms; Max: " + maxDrawTime.toFixed(2) + "ms; Avg: " + averageDrawTime.toFixed(2) + "ms;";

        overlayCtx.fillStyle = "#ffffff55";
        // overlayCtx.fillStyle = "#00000066";
        // overlayCtx.strokeStyle = "#000000";
        // overlayCtx.lineWidth = 2;
        overlayCtx.fillRect(1, 0, overlayCtx.measureText(fpsText).width + 4, 16);
        overlayCtx.fillRect(1, 17, overlayCtx.measureText(frameText).width + 4, 16);
        overlayCtx.fillRect(1, 34, overlayCtx.measureText(updateText).width + 4, 16);
        overlayCtx.fillRect(1, 51, overlayCtx.measureText(drawText).width + 4, 16);
        // overlayCtx.strokeRect(1, 0, overlayCtx.measureText(fpsText).width + 4, 16);
        // overlayCtx.strokeRect(1, 17, overlayCtx.measureText(frameText).width + 4, 16);
        // overlayCtx.strokeRect(1, 34, overlayCtx.measureText(updateText).width + 4, 16);
        // overlayCtx.strokeRect(1, 51, overlayCtx.measureText(drawText).width + 4, 16);

        overlayCtx.font = "16px Source Code Pro";
        overlayCtx.font = "16px Noto Sans";
        overlayCtx.textBaseline = "top";
        overlayCtx.textAlign = "left";
        overlayCtx.fillStyle = "#000000";
        // overlayCtx.fillStyle = "#ffffff";
        overlayCtx.fillText(fpsText, 3, 1);
        overlayCtx.fillText(frameText, 3, 18);
        overlayCtx.fillText(updateText, 3, 35);
        overlayCtx.fillText(drawText, 3, 52);

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
    }

    if (frameTime > 30) {
        // console.log(cameraX, cameraY, Math.round(cameraScale * 256) / 256, frameTime)

    }

    window.requestAnimationFrame(update);
};

window.requestAnimationFrame(update);

// setInterval(update, 100);

export { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, drawChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, tick, modal, setBrushPixel, showTooltip, hideTooltip, moveTooltip };