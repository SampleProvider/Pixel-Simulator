import { pixels, pixelTexture, pixelInventory, resetPixelInventory } from "./pixels.js";
import { modal, sandboxGrid, sandboxSaveCode, loadSaveCode, mouseX, mouseY } from "./game.js";
import { loadPuzzle } from "./puzzles.js";
import { noise } from "./noise.js";
import { playMusic } from "./sound.js";
import { bezier } from "./cubic-bezier.js";

let WIDTH = window.innerWidth * devicePixelRatio;
let HEIGHT = window.innerHeight * devicePixelRatio;

const menuCanvas = document.getElementById("menuCanvas");
const menuCtx = menuCanvas.getContext("2d");

const menuOffscreenCanvas1 = new OffscreenCanvas(WIDTH, HEIGHT);
const menuOffscreenCtx1 = menuOffscreenCanvas1.getContext("2d");
const menuOffscreenCanvas2 = new OffscreenCanvas(WIDTH, HEIGHT);
const menuOffscreenCtx2 = menuOffscreenCanvas2.getContext("2d");

function resizeMenuCanvases(WIDTH, HEIGHT) {
    menuCanvas.width = WIDTH;
    menuCanvas.height = HEIGHT;
    menuCtx.imageSmoothingEnabled = false;
    menuCtx.webkitImageSmoothingEnabled = false;
    menuCtx.mozImageSmoothingEnabled = false;
    menuOffscreenCanvas1.width = WIDTH;
    menuOffscreenCanvas1.height = HEIGHT;
    menuOffscreenCtx1.imageSmoothingEnabled = false;
    menuOffscreenCtx1.webkitImageSmoothingEnabled = false;
    menuOffscreenCtx1.mozImageSmoothingEnabled = false;
    menuOffscreenCanvas2.width = WIDTH;
    menuOffscreenCanvas2.height = HEIGHT;
    menuOffscreenCtx2.imageSmoothingEnabled = false;
    menuOffscreenCtx2.webkitImageSmoothingEnabled = false;
    menuOffscreenCtx2.mozImageSmoothingEnabled = false;
};
resizeMenuCanvases(WIDTH, HEIGHT);

let titleImage;

let titleRandom = Math.random();
if (titleRandom < 0.0005) {
    titleImage = await createImageBitmap(await (await fetch("img/pickleTitle.png")).blob());
}
else if (titleRandom < 0.0005) {
    titleImage = await createImageBitmap(await (await fetch("img/rightToLeftTitle.png")).blob());
    setTimeout(function() {
        let elements = document.getElementsByTagName("*");
        for (let i in elements) {
            if (elements[i].childNodes == null) {
                continue;
            }
            for (let j = 0; j < elements[i].childNodes.length; j++) {
                if (elements[i].childNodes[j].textContent == null || elements[i].childNodes[j].textContent.length == 0) {
                    continue;
                }
                if (elements[i].childNodes[j].hasChildNodes()) {
                    continue;
                }
                elements[i].childNodes[j].textContent = elements[i].childNodes[j].textContent.split("").reverse().join("");
            }
        }
    }, 1000);
}
else {
    titleImage = await createImageBitmap(await (await fetch("img/title.png")).blob());
}

let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
canvas.width = titleImage.width;
canvas.height = titleImage.height;
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

ctx.drawImage(titleImage, 0, 0);
let imageData = ctx.getImageData(0, 0, titleImage.width, titleImage.height);
let titlePixels = [];
for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] != 0) {
        titlePixels.push({
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 0,
            imageX: i / 4 % titleImage.width,
            imageY: Math.floor(i / 4 / titleImage.width),
            targetX: 0,
            targetY: 0,
            targetRotation: 0,
            targetOpacity: 0,
            color: "rgb(" + imageData.data[i - 3] + ", " + imageData.data[i - 2] + ", " + imageData.data[i - 1] + ")",
            pastLocations: [],
            getSize: function() {
                return Math.min(Math.round(menuCanvas.height * 0.014), Math.round(menuCanvas.width * 0.8 / titleImage.width));
            },
            getTargetPos: function() {
                let size = this.getSize();
                let x = -titleImage.width / 2 * size + this.imageX * size;
                let y = -titleImage.height / 2 * size + this.imageY * size - Math.sin(performance.now() / 2000 + this.imageX / 100) * menuCanvas.height * 0.01;
                // let x = Math.round(menuCanvas.width / 2) - titleImage.width / 2 * scale + this.imageX * scale;
                // let y = Math.round(menuCanvas.height * 0.35) - titleImage.height / 2 * scale + this.imageY * scale - Math.sin(performance.now() / 2000 + this.imageX / 100) * menuCanvas.height * 0.01;
                return [x, y];
            },
        });
    }
}

let backgroundPixels = [];
function addBackgroundPixel(id, x, y, rotation) {
    backgroundPixels.push({
        id: id,
        x: x,
        y: y,
        rotation: rotation,
        spdX: Math.random() * 2 - 1,
        spdY: Math.random() + 2,
        spdRotation: (Math.random() * 2 - 1) * 0.1,
        noise: Math.random(),
    });
};

const transitionContainer = document.getElementById("transitionContainer");
const transitionTop = document.getElementById("transitionTop");
const transitionBottom = document.getElementById("transitionBottom");

function transitionIn() {
    transitionContainer.style.display = "block";
    transitionContainer.style.pointerEvents = "auto";
    transitionTop.style.transform = "";
    transitionBottom.style.transform = "";
    transitionContainer.innerText;
    transitionTop.style.transform = "translateX(0vw)";
    transitionBottom.style.transform = "translateX(0vw)";

    return new Promise((resolve, reject) => {
        transitionTop.ontransitionend = () => {
            resolve();
        };
    });
};
function transitionOut() {
    transitionContainer.style.pointerEvents = "none";
    transitionTop.style.transform = "translateX(0vw)";
    transitionBottom.style.transform = "translateX(0vw)";
    transitionContainer.innerText;
    transitionTop.style.transform = "translateX(-100vw)";
    transitionBottom.style.transform = "translateX(100vw)";

    return new Promise((resolve, reject) => {
        transitionTop.ontransitionend = () => {
            transitionContainer.style.display = "none";
            resolve();
        };
    });
};

// pixelate in
// pixelate out
// slide in
// slide out

function pixelateInTitle() {
    menuState = "pixelateInTitle";
    menuStateTime = 0;
    for (let i in titlePixels) {
        // titlePixels[i].x = Math.random() * menuCanvas.width * 2 - menuCanvas.width;
        // titlePixels[i].y = Math.random() * menuCanvas.height * 2 - menuCanvas.height;
        titlePixels[i].x = Math.random() * 200 - 100;
        titlePixels[i].y = Math.random() * 200 - 100;
        titlePixels[i].rotation = (Math.random() * Math.PI * 2 - Math.PI) * 8;
        titlePixels[i].opacity = 0;
        titlePixels[i].targetX = 0;
        titlePixels[i].targetY = 0;
        titlePixels[i].targetRotation = 0;
        titlePixels[i].targetOpacity = 1;
    }
};
function pixelateOutTitle() {
    menuState = "pixelateOutTitle";
    menuStateTime = 0;
    for (let i in titlePixels) {
        titlePixels[i].targetX = Math.random() * 200 - 100;
        titlePixels[i].targetY = Math.random() * 200 - 100;
        titlePixels[i].targetRotation = (Math.random() * Math.PI * 2 - Math.PI) * 8;
        titlePixels[i].targetOpacity = 0;
    }
};
function slideInTitle() {
    menuState = "slideInTitle";
    menuStateTime = 0;
    // titleContainer.style.transform = "";
    // sandboxButtonContainer.style.transform = "";
    // puzzlesButtonContainer.style.transform = "";
    // puzzlesContainer.style.display = "none";
    // menuContainer.innerText;
    // backgroundPixels = [];
};
function slideOutTitle() {
    menuState = "slideOutTitle";
    menuStateTime = 0;
    menuContainer.style.pointerEvents = "none";
    gameContainer.style.display = "";
    for (let i in pixels) {
        pixelInventory[i] = Infinity;
        pixelInventory[i] = 100;
    }
    resetPixelInventory();
};
// for (let i in pixels) {
//     pixelInventory[i] = Infinity;
//     pixelInventory[i] = 100;
// }
// pixelInventory[37] = 0;
// resetPixelInventory();
function slideInPuzzles() {
    menuState = "slideInPuzzles";
    menuStateTime = 0;
    titleContainer.style.transform = "translateX(-100vw)";
    puzzlesContainer.style.display = "";
    // puzzlesContainer.style.transform = "translate(-50%, -50%) translateX(100vw)";
    puzzlesContainer.innerText;
    puzzlesContainer.style.transform = "translate(-50%, -50%)";
};
function slideOutPuzzles() {
    menuState = "slideOutPuzzles";
    menuStateTime = 0;
    titleContainer.style.transform = "";
    // puzzlesContainer.style.transform = "translate(-50%, -50%)";
    // puzzlesContainer.innerText;
    puzzlesContainer.style.transform = "translate(-50%, -50%) translateX(100vw)";
};
function slideInMultiplayer() {
    menuState = "slideInMultiplayer";
    menuStateTime = 0;
    titleContainer.style.transform = "translateX(100vw)";
    multiplayerContainer.style.display = "";
    multiplayerContainer.innerText;
    multiplayerContainer.style.transform = "translate(-50%, -50%)";
};
function slideOutMultiplayer() {
    menuState = "slideOutMultiplayer";
    menuStateTime = 0;
    titleContainer.style.transform = "";
    multiplayerContainer.style.transform = "translate(-50%, -50%) translateX(-100vw)";
};

let menuState = "title";
let menuStateTime = 0;
pixelateInTitle();

const searchParams = new URLSearchParams(window.location.search);

function loadSandbox() {
    try {
        if (sandboxGrid == null) {
            setTimeout(loadSandbox, 10);
            return;
        }
    }
    catch (err) {
        setTimeout(loadSandbox, 10);
        return;
    }
    loadSaveCode(sandboxGrid);
    saveCode.value = sandboxSaveCode;
    loadPuzzle(null);
    document.getElementById("menuContainer").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
};
if (searchParams.has("skipMenu")) {
    loadSandbox();
}
else {
}

const gameContainer = document.getElementById("gameContainer");
const menuContainer = document.getElementById("menuContainer");
const titleContainer = document.getElementById("titleContainer");
const sandboxButtonContainer = document.getElementById("sandboxButtonContainer");
const puzzlesButtonContainer = document.getElementById("puzzlesButtonContainer");
const multiplayerButtonContainer = document.getElementById("multiplayerButtonContainer");
const sandboxButton = document.getElementById("sandboxButton");
const puzzlesButton = document.getElementById("puzzlesButton");
const multiplayerButton = document.getElementById("multiplayerButton");

sandboxButton.onclick = () => {
    if (menuState != "title" && menuState != "pixelateInTitle" && menuState != "slideInTitle") {
        return;
    }
    slideOutTitle();
    loadSaveCode(sandboxGrid);
    saveCode.value = sandboxSaveCode;
    loadPuzzle(null);
    // very buh
};
puzzlesButton.onclick = () => {
    if (menuState != "title" && menuState != "pixelateInTitle" && menuState != "slideInTitle") {
        return;
    }
    slideInPuzzles();
};
multiplayerButton.onclick = () => {
    if (menuState != "title" && menuState != "pixelateInTitle" && menuState != "slideInTitle") {
        return;
    }
    slideInMultiplayer();
};

const puzzlesContainer = document.getElementById("puzzlesContainer");
const puzzlesCloseButton = document.getElementById("puzzlesCloseButton");

puzzlesCloseButton.onclick = () => {
    if (menuState != "puzzles") {
        return;
    }
    slideOutPuzzles();
};

const multiplayerContainer = document.getElementById("multiplayerContainer");
const multiplayerCloseButton = document.getElementById("multiplayerCloseButton");

multiplayerCloseButton.onclick = () => {
    if (menuState != "multiplayer") {
        return;
    }
    slideOutMultiplayer();
};

let menuTooltip = document.getElementById("menuTooltip");
let menuTooltipName = document.getElementById("menuTooltipName");
let menuTooltipDescription = document.getElementById("menuTooltipDescription");

function showMenuTooltip(name, description) {
    menuTooltip.style.opacity = "1";
    menuTooltipName.innerHTML = name;
    menuTooltipDescription.innerHTML = description;
    // some text transition later
};
function hideMenuTooltip() {
    menuTooltip.style.opacity = "0";
};
function moveMenuTooltip() {
    menuTooltip.style.left = mouseX / devicePixelRatio + "px";
    menuTooltip.style.right = "unset";
    menuTooltip.style.bottom = window.innerHeight - mouseY / devicePixelRatio + "px";
    // menuTooltip.style.left = rawMouseX + "px";
    // menuTooltip.style.right = "unset";
    // menuTooltip.style.top = rawMouseY + "px";
    // menuTooltip.style.bottom = "unset";
    var rect = menuTooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menuTooltip.style.right = window.innerWidth - mouseX / devicePixelRatio + "px";
        menuTooltip.style.left = "unset";
    }
    // rect = menuTooltip.getBoundingClientRect();
    // if (rect.bottom > window.innerHeight) {
    //     menuTooltip.style.bottom = (window.innerHeight - rawMouseY) + "px";
    //     menuTooltip.style.top = "unset";
    // }
    // add the switch sides thing
};

let mouseDown = false;
document.addEventListener("mousedown", (e) => {
    mouseDown = true;
});
document.addEventListener("touchstart", (e) => {
    mouseDown = true;
});
document.addEventListener("mouseup", (e) => {
    mouseDown = false;
});
document.addEventListener("touchend", (e) => {
    mouseDown = false;
});

function updateMenu() {
    if (menuContainer.style.display == "none") {
        return;
    }
    // menuCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
    // menuCtx.fillRect(0, 0, menuCanvas.width, menuCanvas.height);
    menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
    let titleX = Math.round(menuCanvas.width / 2);
    let titleY = Math.round(menuCanvas.height * 0.35);
    if (menuState == "pixelateInTitle") {
        // log(10^-4)/log(0.95) = 179 frames
        // 2500ms = 150 frames
        if (menuStateTime < 150) {
            titleY = Math.round(menuCanvas.height / 2);
        }
        else if (menuStateTime < 150 + 90) {
            // menuCanvas.style.transform = "none";
            // // let t = (1 - Math.cos((performance.now() - menuStateTime - 2500) / 1500 * Math.PI)) / 2;
            let t = (menuStateTime - 150) / 90;
            // t = t * t * t * (t * (t * 6. - 15.) + 10.);
            t = bezier(0.3, 0, 0.3, 1)(t);
            titleY = Math.round(menuCanvas.height / 2 * (1 - t) + menuCanvas.height * 0.35 * t);
        }
        else {
            menuState = "title";
        }
        if (menuStateTime == 168) {
            sandboxButtonContainer.style.transform = "translateY(0px)";
        }
        if (menuStateTime == 180) {
            puzzlesButtonContainer.style.transform = "translateY(0px)";
        }
        if (menuStateTime == 192) {
            multiplayerButtonContainer.style.transform = "translateY(0px)";
        }
    }
    else if (menuState == "pixelateOutTitle") {
        if (menuStateTime == 18) {
            sandboxButtonContainer.style.transform = "";
        }
        if (menuStateTime == 12) {
            puzzlesButtonContainer.style.transform = "";
        }
        if (menuStateTime == 6) {
            multiplayerButtonContainer.style.transform = "";
        }
    }
    else if (menuState == "slideInTitle") {
        if (menuStateTime < 90) {
            // menuCanvas.style.transform = "none";
            // // let t = (1 - Math.cos((performance.now() - menuStateTime - 2500) / 1500 * Math.PI)) / 2;
            let t = (menuStateTime - 0) / 90;
            // t = t * t * t * (t * (t * 6. - 15.) + 10.);
            t = bezier(0.5, 0, 0.5, 1)(t);
            titleY = Math.round(menuCanvas.height * -0.2 * (1 - t) + menuCanvas.height * 0.35 * t);
        }
        else {
            // menuState = MENU;
        }
        if (menuStateTime == 36) {
            sandboxButtonContainer.style.transform = "translateY(0px)";
        }
        if (menuStateTime == 42) {
            puzzlesButtonContainer.style.transform = "translateY(0px)";
        }
        if (menuStateTime == 48) {
            multiplayerButtonContainer.style.transform = "translateY(0px)";
        }
        if (menuStateTime == 96) {
            menuState = "title";
        }
    }
    else if (menuState == "slideOutTitle") {
        if (menuStateTime < 90) {
            // menuCanvas.style.transform = "none";
            // // let t = (1 - Math.cos((performance.now() - menuStateTime - 2500) / 1500 * Math.PI)) / 2;
            let t = (menuStateTime - 0) / 90;
            // t = t * t * t * (t * (t * 6. - 15.) + 10.);
            t = bezier(0.5, 0, 0.5, 1)(t);
            titleY = Math.round(menuCanvas.height * 0.35 * (1 - t) + menuCanvas.height * -0.35 * t);
        }
        else {
            // menuState = MENU;
        }
        if (menuStateTime == 36) {
            menuContainer.style.opacity = 0;
        }
        if (menuStateTime == 18) {
            sandboxButtonContainer.style.transform = "";
        }
        if (menuStateTime == 12) {
            puzzlesButtonContainer.style.transform = "";
        }
        if (menuStateTime == 6) {
            multiplayerButtonContainer.style.transform = "";
        }
        if (menuStateTime == 96) {
            menuContainer.style.display = "none";
            backgroundPixels = [];
        }
    }
    else if (menuState == "slideInPuzzles") {
        if (menuStateTime <= 30) {
            let t = (menuStateTime - 0) / 30;
            t = bezier(0.5, 0, 0.5, 1)(t);
            titleX = Math.round(menuCanvas.width / 2 * (1 - t) + -menuCanvas.width / 2 * t);
        }
        if (menuStateTime == 30) {
            menuState = "puzzles";
        }
    }
    else if (menuState == "slideOutPuzzles") {
        if (menuStateTime <= 30) {
            let t = (menuStateTime - 0) / 30;
            t = bezier(0.5, 0, 0.5, 1)(t);
            titleX = Math.round(-menuCanvas.width / 2 * (1 - t) + menuCanvas.width / 2 * t);
        }
        if (menuStateTime == 30) {
            menuState = "title";
            puzzlesContainer.style.display = "none";
        }
    }
    else if (menuState == "puzzles") {
        titleX = -menuCanvas.width / 2;
    }
    else if (menuState == "slideInMultiplayer") {
        if (menuStateTime <= 30) {
            let t = (menuStateTime - 0) / 30;
            t = bezier(0.5, 0, 0.5, 1)(t);
            titleX = Math.round(menuCanvas.width / 2 * (1 - t) + menuCanvas.width * 3 / 2 * t);
        }
        if (menuStateTime == 30) {
            menuState = "multiplayer";
        }
    }
    else if (menuState == "slideOutMultiplayer") {
        if (menuStateTime <= 30) {
            let t = (menuStateTime - 0) / 30;
            t = bezier(0.5, 0, 0.5, 1)(t);
            titleX = Math.round(menuCanvas.width * 3 / 2 * (1 - t) + menuCanvas.width / 2 * t);
        }
        if (menuStateTime == 30) {
            menuState = "title";
            multiplayerContainer.style.display = "none";
        }
    }
    else if (menuState == "multiplayer") {
        titleX = menuCanvas.width * 3 / 2;
    }
    if (menuState == "title" || menuState == "slideInPuzzles" || menuState == "puzzles" || menuState == "slideOutPuzzles" || menuState == "slideInMultiplayer" || menuState == "multiplayer" || menuState == "slideOutMultiplayer") {
        if (Math.random() < 0.1 * 2) {
            let validPixels = [
                DIRT,
                GRASS,
                MUD,
                SAND,
                GRAVEL,
                CONCRETE_POWDER,
                CONCRETE,
                WATER,
                ICE,
                SNOW,
                STEAM,
                LAVA,
                WATER_PUMP,
                LAVA_HEATER,
                ICE_FREEZER,
                CLAY,
                BRICKS,
                STONE,
                BASALT,
                IRON,
                STEEL,
                RUBBER,
                GLASS,
                WOOD,
                LEAVES,
                SAPLING,
                PLANT,
                MOSS,
                LICHEN,
                SPONGE,
                SUPER_SPONGE,
                ASH,
                WOOD_CRATE,
                STEEL_CRATE,
            ];
            addBackgroundPixel(validPixels[Math.floor(Math.random() * validPixels.length)], Math.random() * menuCanvas.width, -20 * Math.sqrt(2), Math.random() * Math.PI);
        }
    }   
    for (let i in backgroundPixels) {
        // if (mouseDown && Math.sqrt(Math.pow(mouseX - backgroundPixels[i].x, 2) + Math.pow(mouseY - backgroundPixels[i].y, 2)) < 100) {
        let distance = Math.sqrt(Math.pow(mouseX - backgroundPixels[i].x, 2) + Math.pow(mouseY - backgroundPixels[i].y, 2));
        if (mouseDown && distance < 100) {
            backgroundPixels[i].spdX += (backgroundPixels[i].x - mouseX) * 0.01;
            backgroundPixels[i].spdY += (backgroundPixels[i].y - mouseY) * 0.01;
        }
        if (mouseDown && distance < 10) {
            if (backgroundPixels[i].id == WATER_PUMP) {
                for (let j = 0; j < 50; j++) {
                    // addBackgroundPixel(WATER, Math.random() * menuCanvas.width, -20 * Math.sqrt(2) - Math.random() * 100, Math.random() * Math.PI);
                    // addBackgroundPixel(WATER, backgroundPixels[i].x, backgroundPixels[i].y, backgroundPixels[i].rotation);
                    let spdX = backgroundPixels[i].spdX;
                    let spdY = backgroundPixels[i].spdY;
                    let angle = Math.random() * Math.PI * 2;
                    let magnitude = Math.random();
                    backgroundPixels.push({
                        id: WATER,
                        x: backgroundPixels[i].x,
                        y: backgroundPixels[i].y,
                        rotation: backgroundPixels[i].rotation,
                        spdX: spdX + Math.cos(angle) * magnitude,
                        spdY: spdY + Math.sin(angle) * magnitude,
                        spdRotation: backgroundPixels[i].spdRotation + (Math.random() * 2 - 1) * 0.1,
                        noise: Math.random(),
                    });
                }
                backgroundPixels[i].id = WATER;
            }
            if (backgroundPixels[i].id == LAVA_HEATER) {
                for (let j = 0; j < 50; j++) {
                    // addBackgroundPixel(LAVA, Math.random() * menuCanvas.width, -20 * Math.sqrt(2) - Math.random() * 100, Math.random() * Math.PI);
                    let spdX = backgroundPixels[i].spdX;
                    let spdY = backgroundPixels[i].spdY;
                    let angle = Math.random() * Math.PI * 2;
                    let magnitude = Math.random();
                    backgroundPixels.push({
                        id: LAVA,
                        x: backgroundPixels[i].x,
                        y: backgroundPixels[i].y,
                        rotation: backgroundPixels[i].rotation,
                        spdX: spdX + Math.cos(angle) * magnitude,
                        spdY: spdY + Math.sin(angle) * magnitude,
                        spdRotation: backgroundPixels[i].spdRotation + (Math.random() * 2 - 1) * 0.1,
                        noise: Math.random(),
                    });
                }
                backgroundPixels[i].id = LAVA;
            }
        }
        backgroundPixels[i].x += backgroundPixels[i].spdX;
        backgroundPixels[i].y += backgroundPixels[i].spdY;
        backgroundPixels[i].rotation += backgroundPixels[i].spdRotation;
        backgroundPixels[i].spdX *= 0.99;
        if (backgroundPixels[i].spdY < 2) {
            backgroundPixels[i].spdY += (2 - backgroundPixels[i].spdY) * 0.01;
        }
        if (backgroundPixels[i].x < -20 * Math.sqrt(2)) {
            backgroundPixels.splice(i, 1);
            i -= 1;
            continue;
        }
        if (backgroundPixels[i].x > menuCanvas.width + 20 * Math.sqrt(2)) {
            backgroundPixels.splice(i, 1);
            i -= 1;
            continue;
        }
        // if (backgroundPixels[i].y < -20 * Math.sqrt(2)) {
        //     backgroundPixels.splice(i, 1);
        //     i -= 1;
        //     continue;
        // }
        if (backgroundPixels[i].y > menuCanvas.height + 20 * Math.sqrt(2)) {
            backgroundPixels.splice(i, 1);
            i -= 1;
            continue;
        }
    }
    for (let i in backgroundPixels) {
        let size = 20;
        menuCtx.save();
        menuCtx.translate(backgroundPixels[i].x, backgroundPixels[i].y);
        menuCtx.rotate(backgroundPixels[i].rotation);
        let pixel = pixels[backgroundPixels[i].id];
        if (pixel.color != null) {
            menuCtx.fillStyle = "rgba(" + pixel.color[0] + ", " + pixel.color[1] + ", " + pixel.color[2] + ", 1)";
            if (pixel.noise != null) {
                menuCtx.fillStyle = "rgba(" + (pixel.color[0] + pixel.noise[0] * backgroundPixels[i].noise) + ", " + (pixel.color[1] + pixel.noise[1] * backgroundPixels[i].noise) + ", " + (pixel.color[2] + pixel.noise[2] * backgroundPixels[i].noise) + ", 1)";
            }
            // if (backgroundPixels[i].id == WATER) {
            //     menuCtx.fillStyle = "rgba(" + (0.3 - backgroundPixels[i].noise * 0.1) * 255 + ", " + (0.3 - backgroundPixels[i].noise * 0.15) * 255 + ", " + (1) * 255 + ", 1)";
            // }
            // if (backgroundPixels[i].id == LAVA) {
                
            // }
            menuCtx.fillRect(-size / 2, -size / 2, size, size);
        }
        else {
            menuCtx.drawImage(pixelTexture, pixel.texture[0], pixel.texture[1], pixel.texture[2], pixel.texture[3], -size / 2, -size / 2, size, size);
        }
        menuCtx.restore();
    }
    for (let i in titlePixels) {
        titlePixels[i].pastLocations.push({
            x: titlePixels[i].x,
            y: titlePixels[i].y,
            rotation: titlePixels[i].rotation,
            opacity: titlePixels[i].opacity,
        });
        if (titlePixels[i].pastLocations.length > 5) {
            titlePixels[i].pastLocations.shift();
        }
        titlePixels[i].x = titlePixels[i].x + (titlePixels[i].targetX - titlePixels[i].x) * 0.05;
        titlePixels[i].y = titlePixels[i].y + (titlePixels[i].targetY - titlePixels[i].y) * 0.05;
        titlePixels[i].rotation = titlePixels[i].rotation + (titlePixels[i].targetRotation - titlePixels[i].rotation) * 0.05;
        if (Math.abs(titlePixels[i].targetOpacity - titlePixels[i].opacity) < 0.02) {
            titlePixels[i].opacity = titlePixels[i].targetOpacity;
        }
        else {
            titlePixels[i].opacity = Math.min(Math.max(titlePixels[i].opacity + 0.02 * Math.sign(titlePixels[i].targetOpacity - titlePixels[i].opacity), 0), 1);
        }
        if (Math.abs(titlePixels[i].targetX - titlePixels[i].x) < 1e-3) {
            titlePixels[i].x = titlePixels[i].targetX;
        }
        if (Math.abs(titlePixels[i].targetY - titlePixels[i].y) < 1e-3) {
            titlePixels[i].y = titlePixels[i].targetY;
        }
        if (Math.abs(titlePixels[i].targetRotation - titlePixels[i].rotation) < 1e-3) {
            titlePixels[i].rotation = titlePixels[i].targetRotation;
        }
    }
    menuOffscreenCtx1.clearRect(0, 0, menuOffscreenCtx1.canvas.width, menuOffscreenCtx1.canvas.height);
    menuOffscreenCtx2.clearRect(0, 0, menuOffscreenCtx2.canvas.width, menuOffscreenCtx2.canvas.height);
    // for (let j = 5; j >= 0; j--) {
    // for (let j = 5; j >= 0; j--) {
    for (let j = 2; j >= 0; j -= 2) {
        let ctx = j % 3 == 0 ? menuOffscreenCtx1 : menuOffscreenCtx2;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalCompositeOperation = "lighter";
        for (let i in titlePixels) {
            let size = titlePixels[i].getSize();
            let [x, y] = titlePixels[i].getTargetPos();
            let location = {
                x: titlePixels[i].x,
                y: titlePixels[i].y,
                rotation: titlePixels[i].rotation,
                opacity: titlePixels[i].opacity,
            };
            if (j > 0) {
                location = titlePixels[i].pastLocations[Math.max(titlePixels[i].pastLocations.length - j, 0)];
            }
            x += location.x * size;
            y += location.y * size;
            x += titleX;
            y += titleY;
            // let x = titlePixels[i].x;
            // let y = titlePixels[i].y;
            ctx.fillStyle = "#ffffff";
            ctx.fillStyle = titlePixels[i].color;
            let value = noise.perlin3(titlePixels[i].imageX / 5, titlePixels[i].imageY / 5, performance.now() / 1000);
            // menuCtx.fillStyle = "rgba(255, " + (255 - 125 * value) + ", " + (255 - 125 * value) + ")";
            // menuCtx.fillStyle = "rgba(255, 255, 255, " + (0.6 + 0.4 * (Math.sin((x + y + performance.now() / 10) / 100) + 1) / 2) + ")";
            ctx.globalAlpha = location.opacity;
            if (j == 0) {
            //     // menuCtx.fillStyle = "rgba(255, 255, 255, " + (0.6 + 0.4 * noise.perlin3(titlePixels[i].x / 5, titlePixels[i].y / 5, performance.now() / 1000)) + ")";
                // ctx.globalAlpha *= 0.6 + 0.4 * value;
            }
            // menuCtx.fillRect(x - scale / 2, y - scale / 2, scale, scale);
                // menuCtx.fillStyle = "#ffffff11";
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(location.rotation);
                ctx.fillRect(-size / 2 - j, -size / 2 - j, size + j * 2, size + j * 2);
                ctx.restore();
            // }
            ctx.globalAlpha = 1;
        }
        // if (j != 0) {
            let ctx2 = j % 3 == 2 ? menuOffscreenCanvas1 : menuOffscreenCanvas2;
            ctx.globalAlpha = 0.4;
            if (j == 1) {
                ctx.globalAlpha = 1;
            }
            ctx.drawImage(ctx2, 0, 0);
            ctx.globalAlpha = 1;
            // menuCtx.globalAlpha = 
            // menuCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
            // menuCtx.fillRect(0, 0, menuCanvas.width, menuCanvas.height);
        // }
        // else {
        if (j == 0) {
            menuCtx.drawImage(j % 2 == 0 ? menuOffscreenCanvas1 : menuOffscreenCanvas2, 0, 0);
        }
    }
    menuStateTime++;
};

export { resizeMenuCanvases, transitionIn, transitionOut, slideInTitle, slideOutTitle, slideInPuzzles, slideOutPuzzles, showMenuTooltip, hideMenuTooltip, moveMenuTooltip, updateMenu }