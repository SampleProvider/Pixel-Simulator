import { pixels, pixelImages } from "./pixels.js";
import { modal } from "./game.js";
import { noise } from "./noise.js";
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

const titleImage = await createImageBitmap(await (await fetch(Math.random() < 0.001 ? "img/easterEggTitle.png" : "img/title.png")).blob());
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
                return Math.round(menuCanvas.height * 0.014);
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
    transitionContainer.innerText;
    transitionTop.style.transform = "translateX(0px)";
    transitionBottom.style.transform = "translateX(0px)";

    return new Promise((resolve, reject) => {
        transitionTop.ontransitionend = () => {
            resolve();
        };
    });
};
function transitionOut() {
    transitionTop.style.transform = "";
    transitionBottom.style.transform = "";

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

function pixelateInMenu() {
    menuState = "pixelateIn";
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
function pixelateOutMenu() {
    menuState = "pixelateOut";
    menuStateTime = 0;
    for (let i in titlePixels) {
        titlePixels[i].targetX = Math.random() * 200 - 100;
        titlePixels[i].targetY = Math.random() * 200 - 100;
        titlePixels[i].targetRotation = (Math.random() * Math.PI * 2 - Math.PI) * 8;
        titlePixels[i].targetOpacity = 0;
    }
};
function slideInMenu() {
    menuState = "slideIn";
    menuStateTime = 0;
};
function slideOutMenu() {
    menuState = "slideOut";
    menuStateTime = 0;
    gameContainer.style.display = "";
};

let menuState = "menu";
let menuStateTime = 0;
pixelateInMenu();

const menuContainer = document.getElementById("menuContainer");
const sandboxButtonContainer = document.getElementById("sandboxButtonContainer");
const puzzlesButtonContainer = document.getElementById("puzzlesButtonContainer");
const sandboxButton = document.getElementById("sandboxButton");
const puzzlesButton = document.getElementById("puzzlesButton");

sandboxButton.onclick = () => {
    slideOutMenu();
};

function updateMenu() {
    if (menuContainer.style.display == "none") {
        return;
    }
    // menuCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
    // menuCtx.fillRect(0, 0, menuCanvas.width, menuCanvas.height);
    menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
    let titleX = Math.round(menuCanvas.width / 2);
    let titleY = Math.round(menuCanvas.height * 0.35);
    if (menuState == "pixelateIn") {
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
            menuState = "menu";
        }
        if (menuStateTime == 168) {
            sandboxButtonContainer.style.transform = "translateY(0px)";
        }
        if (menuStateTime == 180) {
            puzzlesButtonContainer.style.transform = "translateY(0px)";
        }
    }
    else if (menuState == "pixelateOut") {
        if (menuStateTime == 18) {
            sandboxButtonContainer.style.transform = "";
        }
        if (menuStateTime == 12) {
            puzzlesButtonContainer.style.transform = "";
        }
    }
    else if (menuState == "slideIn") {
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
        if (menuStateTime == 96) {
            menuState = "menu";
        }
    }
    else if (menuState == "slideOut") {
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
        if (menuStateTime == 96) {
            menuContainer.style.display = "none";
            backgroundPixels = [];
        }
    }
    if (menuState == "menu") {
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
        backgroundPixels[i].x += backgroundPixels[i].spdX;
        backgroundPixels[i].y += backgroundPixels[i].spdY;
        backgroundPixels[i].rotation += backgroundPixels[i].spdRotation;
        backgroundPixels[i].spdX *= 0.99;
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
            menuCtx.fillRect(-size / 2, -size / 2, size, size);
        }
        else {
            menuCtx.drawImage(pixelImages, pixel.texture[0], pixel.texture[1], pixel.texture[2], pixel.texture[3], -size / 2, -size / 2, size, size);
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

export { resizeMenuCanvases, transitionIn, transitionOut, slideInMenu, updateMenu }