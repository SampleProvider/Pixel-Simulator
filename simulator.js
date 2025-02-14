// class Simulator {
//     grid = null;
//     gridWidth = 0;
//     gridHeight = 0;
//     gridStride = 9;
//     chunks = null;
//     nextChunks = null;
//     chunkWidth = 0;
//     chunkHeight = 0;
//     chunkXAmount = 0;
//     chunkYAmount = 0;
//     chunkStride = 4;

//     tick = 0;

//     cameraX = 0;
//     cameraY = 0;
//     cameraXScale = 0;
//     cameraYScale = 0;
    
//     constructor() {
        
//     }
//     createGrid() {
//         let gridArray = [];
//         for (let y = 0; y < this.gridHeight; y++) {
//             for (let x = 0; x < this.gridWidth; x++) {
//                 // if (Math.random() < 0.5 && x > gridWidth * 4 / 5) {
//                 if (Math.random() < 0.5) {
//                     gridArray.push(...[1, 0, 0, 1, 0.85 + Math.random() * 0.05, 0.5, 1, 0, 0]);
//                 }
//                 else {
//                     gridArray.push(...[0, 0, 0, 1, 1, 1, 1, 0, 0]);
//                 }
//             }
//         }
        
//         this.chunkXAmount = Math.ceil(this.gridWidth / this.chunkWidth);
//         this.chunkYAmount = Math.ceil(this.gridHeight / this.chunkHeight);
//         let chunksArray = [];
//         for (let y = 0; y < this.chunkYAmount; y++) {
//             for (let x = 0; x < this.chunkXAmount; x++) {
//                 chunksArray.push(...[x * this.chunkWidth, x * this.chunkWidth + this.chunkWidth, y * this.chunkHeight, y * this.chunkHeight + this.chunkHeight]);
//             }
//         }
    
//         this.grid = new Float32Array(gridArray);
//         this.chunks = new Float32Array(chunksArray);
//         this.nextChunks = new Float32Array(chunksArray);

//         this.tick = 0;
//     }
//     updateGrid() {
        
//     }
// }

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");

window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    overlayCanvas.width = window.innerWidth;
    overlayCanvas.height = window.innerHeight;
    offscreenCanvas.width = window.innerWidth;
    offscreenCanvas.height = window.innerHeight;
};
window.onresize();

const ID = 0;
const VEL_X = 1;
const VEL_Y = 2;
const COLOR_R = 3;
const COLOR_G = 4;
const COLOR_B = 5;
const COLOR_A = 6;
const UPDATED = 7;

let grid = new Float32Array();
// let gridWidth = 32;
// let gridHeight = 32;
let gridWidth = 128;
let gridHeight = 128;
gridWidth *= 2;
gridHeight *= 2;
let gridStride = 9;
let chunks = new Float32Array();
let nextChunks = new Float32Array();
let chunkWidth = 16;
let chunkHeight = 16;
let chunkXAmount = Math.ceil(gridWidth / chunkWidth);
let chunkYAmount = Math.ceil(gridHeight / chunkHeight);
let chunkStride = 4;

let tick = 0;

let cameraX = 0;
let cameraY = 0;
let cameraZoom = 4;

function createGrid() {
    let gridArray = [];
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            // if (Math.random() < 0.5 && x > gridWidth * 4 / 5) {
            if (Math.random() < 0.5) {
                gridArray.push(...[1, 0, 0, 1, 0.85 + Math.random() * 0.05, 0.5, 1, 0, 0]);
            }
            else {
                gridArray.push(...[0, 0, 0, 1, 1, 1, 1, 0, 0]);
            }
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
            chunksArray.push(...[x * chunkWidth, x * chunkWidth + chunkWidth, y * chunkHeight, y * chunkHeight + chunkHeight]);
        }
    }

    grid = new Float32Array(gridArray);
    chunks = new Float32Array(chunksArray);
    nextChunks = new Float32Array(chunksArray);
};
createGrid();

function drawGrid(ctx) {
    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
        for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
            if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth + 1) {
                continue;
            }
            let minX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] - 1, chunkX * chunkWidth);
            let maxX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1] + 1, chunkX * chunkWidth + chunkWidth - 1);
            let minY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2] - 1, chunkY * chunkHeight);
            let maxY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3] + 1, chunkY * chunkHeight + chunkHeight - 1);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(minX * cameraZoom, minY * cameraZoom, (maxX - minX + 1) * cameraZoom, (maxY - minY + 1) * cameraZoom);
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    let index = (x + y * gridWidth) * gridStride;

                    if (grid[index + ID] == 0) {
                        continue;
                    }
            
                    ctx.fillStyle = "rgba(" + grid[index + COLOR_R] * 255 + ", " + grid[index + COLOR_G] * 255 + ", " + grid[index + COLOR_B] * 255 + ", " + grid[index + COLOR_A] + ")";
                    ctx.fillRect(x * cameraZoom, y * cameraZoom, cameraZoom, cameraZoom);
                }
            }
        }
    }
    // for (let y = 0; y < gridHeight; y++) {
    //     for (let x = 0; x < gridWidth; x++) {
    //         let index = (x + y * gridWidth) * gridStride;
            
    //         ctx.fillStyle = "rgba(" + grid[index + COLOR_R] * 255 + ", " + grid[index + COLOR_G] * 255 + ", " + grid[index + COLOR_B] * 255 + ", " + grid[index + COLOR_A] + ")";
    //         ctx.fillRect(x * cameraZoom, y * cameraZoom, cameraZoom, cameraZoom);
    //     }
    // }
    if (debug) {
        for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
            for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                ctx.strokeStyle = "rgba(0, 0, 0)";
                ctx.lineWidth = cameraZoom / 10;
                ctx.strokeRect(chunkX * chunkWidth * cameraZoom, chunkY * chunkHeight * cameraZoom, chunkWidth * cameraZoom, chunkHeight * cameraZoom);
                if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth + 1) {
                    continue;
                }
                let minX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] - 1, chunkX * chunkWidth);
                let maxX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1] + 1, chunkX * chunkWidth + chunkWidth - 1);
                let minY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2] - 1, chunkY * chunkHeight);
                let maxY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3] + 1, chunkY * chunkHeight + chunkHeight - 1);
                // for (let y = minY; y <= maxY; y++) {
                //     for (let x = minX; x <= maxX; x++) {
                //         let index = (x + y * gridWidth) * gridStride;
                
                //         ctx.fillStyle = "rgba(" + grid[index + COLOR_R] * 255 + ", " + 200 + ", " + grid[index + COLOR_B] * 255 + ", " + grid[index + COLOR_A] + ")";
                //         ctx.fillRect(x * cameraZoom, y * cameraZoom, cameraZoom, cameraZoom);
                //     }
                // }
                // ctx.fillStyle = "rgba(125, " + chunkY * 255 + ", " + chunkX * 255 + ", 0.2)";
                // ctx.fillRect(minX * cameraZoom, minY * cameraZoom, (maxX - minX + 1) * cameraZoom, (maxY - minY + 1) * cameraZoom)
                ctx.strokeStyle = "rgba(0, 255, 0)";
                ctx.lineWidth = cameraZoom / 5;
                ctx.strokeRect(minX * cameraZoom, minY * cameraZoom, (maxX - minX + 1) * cameraZoom, (maxY - minY + 1) * cameraZoom);
            }
        }
    }
};

function updateGrid() {
    if (tick % 2 == 0) {
        for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
            for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
                for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                    if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth + 1) {
                        continue;
                    }
                    let minY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2] - 1, chunkY * chunkHeight);
                    let maxY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3] + 1, chunkY * chunkHeight + chunkHeight - 1);
                    if (y >= minY && y <= maxY) {
                        let minX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] - 1, chunkX * chunkWidth);
                        let maxX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1] + 1, chunkX * chunkWidth + chunkWidth - 1);
                        for (let x = minX; x <= maxX; x++) {
                            let index = (x + y * gridWidth) * gridStride;
                            if (grid[index + UPDATED] == tick) {
                                continue;
                            }
                            if (grid[index + ID] == 1) {
                                // flow(x, y, isAir, true);
                                flow(x, y, isAir, true, 1, true, 5);
                            }
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
            for (let y = chunkY * chunkHeight; y < chunkY * chunkHeight + chunkHeight; y++) {
                for (let chunkX = chunkXAmount - 1; chunkX >= 0; chunkX--) {
                    if (chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth + 1) {
                        continue;
                    }
                    let minY = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2] - 1, chunkY * chunkHeight);
                    let maxY = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3] + 1, chunkY * chunkHeight + chunkHeight - 1);
                    if (y >= minY && y <= maxY) {
                        let minX = Math.max(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride] - 1, chunkX * chunkWidth);
                        let maxX = Math.min(chunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1] + 1, chunkX * chunkWidth + chunkWidth - 1);
                        for (let x = maxX; x >= minX; x--) {
                            let index = (x + y * gridWidth) * gridStride;
                            if (grid[index + UPDATED] == tick) {
                                continue;
                            }
                            if (grid[index + ID] == 1) {
                                // flow(x, y, isAir, true);
                                flow(x, y, isAir, true, 1, true, 5);
                            }
                        }
                    }
                    // for (let y = minY; y <= maxY; y++) {
                    // }
                }
            }
        }
    }
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            let index = (x + y * gridWidth) * gridStride;
            if (grid[index + UPDATED] == tick) {
                continue;
            }
            if (grid[index + ID] == 1) {
                // flow(x, y, isAir, true);
                flow(x, y, isAir, true, 1, true, 5);
            }
        }
    }
    tick += 1;
    let lastChunks = chunks;
    chunks = nextChunks;
    nextChunks = lastChunks;
    for (let y = 0; y < chunkYAmount; y++) {
        for (let x = 0; x < chunkXAmount; x++) {
            let index = (x + y * chunkXAmount) * chunkStride;
            nextChunks[index] = x * chunkWidth + chunkWidth + 1;
            nextChunks[index + 1] = x * chunkWidth - 2;
            nextChunks[index + 2] = y * chunkHeight + chunkHeight + 1;
            nextChunks[index + 3] = y * chunkHeight - 2;
        }
    }
};

let debug = true;

let fpsTimes = [];
let fpsHistory = [];
let lastFrame = performance.now();
let frameHistory = [];
let updateHistory = [];
let drawHistory = [];
let historyLength = 100;

const timingGradient = overlayCtx.createLinearGradient(0, 106, 0, 204);
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
    updateGrid();
    let updateEnd = performance.now();
    let drawStart = performance.now();
    drawGrid(offscreenCtx);
    ctx.drawImage(offscreenCanvas, 0, 0);
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
	[drawHistory, drawTime, minDrawTime, maxDrawTime, averageDrawTime] = updateTimes(drawHistory, drawEnd - drawStart);

    lastFrame = performance.now();

	overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
	if (debug) {
		let fpsText = "FPS: " + fps + "; Min: " + minFps + "; Max: " + maxFps + "; Avg: " + averageFps.toFixed(2) + ";";
		let frameText = "Frame: " + frameTime.toFixed(2) + "ms; Min: " + minFrameTime.toFixed(2) + "ms; Max: " + maxFrameTime.toFixed(2) + "ms; Avg: " + averageFrameTime.toFixed(2) + "ms;";
		let updateText = "Update: " + updateTime.toFixed(2) + "ms; Min: " + minUpdateTime.toFixed(2) + "ms; Max: " + maxUpdateTime.toFixed(2) + "ms; Avg: " + averageUpdateTime.toFixed(2) + "ms;";
		let drawText = "Draw: " + drawTime.toFixed(2) + "ms; Min: " + minDrawTime.toFixed(2) + "ms; Max: " + maxDrawTime.toFixed(2) + "ms; Avg: " + averageDrawTime.toFixed(2) + "ms;";

		overlayCtx.fillStyle = "#ffffff55";
		overlayCtx.fillRect(1, 0, overlayCtx.measureText(fpsText).width + 4, 20);
		overlayCtx.fillRect(1, 21, overlayCtx.measureText(frameText).width + 4, 20);
		overlayCtx.fillRect(1, 42, overlayCtx.measureText(updateText).width + 4, 20);
		overlayCtx.fillRect(1, 63, overlayCtx.measureText(drawText).width + 4, 20);

		overlayCtx.font = "20px Source Code Pro";
		overlayCtx.textBaseline = "top";
		overlayCtx.textAlign = "left";
		overlayCtx.fillStyle = "#000000";
		overlayCtx.fillText(fpsText, 3, 1);
		overlayCtx.fillText(frameText, 3, 22);
		overlayCtx.fillText(updateText, 3, 43);
		overlayCtx.fillText(drawText, 3, 64);

		overlayCtx.fillStyle = "#7f7f7f7f";
        overlayCtx.fillRect(5, 105, 300, 100);

        overlayCtx.strokeStyle = timingGradient;
        overlayCtx.lineJoin = "bevel";
        overlayCtx.lineCap = "butt";
        overlayCtx.lineWidth = 3;
        overlayCtx.setLineDash([]);
        overlayCtx.beginPath();
        overlayCtx.moveTo(5, Math.max(106, 204 - frameHistory[0] * 2));
        for (let i = 1; i < frameHistory.length; i++) {
            overlayCtx.lineTo(5 + i * 3, Math.max(106, 204 - frameHistory[i] * 2));
        }
        overlayCtx.stroke();
		overlayCtx.lineWidth = 2;
        overlayCtx.beginPath();
        overlayCtx.moveTo(5, Math.max(106, 204 - updateHistory[0] * 2));
        for (let i = 1; i < updateHistory.length; i++) {
            overlayCtx.lineTo(5 + i * 3, Math.max(106, 204 - updateHistory[i] * 2));
        }
        overlayCtx.stroke();
		overlayCtx.lineWidth = 1;
        overlayCtx.beginPath();
        overlayCtx.moveTo(5, Math.max(106, 204 - drawHistory[0] * 2));
        for (let i = 1; i < drawHistory.length; i++) {
            overlayCtx.lineTo(5 + i * 3, Math.max(106, 204 - drawHistory[i] * 2));
        }
        overlayCtx.stroke();

        overlayCtx.strokeStyle = "#555555";
        overlayCtx.lineWidth = 2;
        overlayCtx.setLineDash([6, 6]);
        overlayCtx.beginPath();
        overlayCtx.moveTo(8, 204 - 1000 / 60 * 2);
        overlayCtx.lineTo(302, 204 - 1000 / 60 * 2);
        overlayCtx.moveTo(8, 204 - 1000 / 30 * 2);
        overlayCtx.lineTo(302, 204 - 1000 / 30 * 2);
        overlayCtx.stroke();

		overlayCtx.fillStyle = "#000000";
		overlayCtx.fillText("60 FPS", 8, 204 - 1000 / 60 * 2 - 21);
		overlayCtx.fillText("30 FPS", 8, 204 - 1000 / 30 * 2 - 21);
    }
    
    window.requestAnimationFrame(update);
};
window.requestAnimationFrame(update);

// setInterval(update, 100);