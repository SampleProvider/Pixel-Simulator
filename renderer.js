import { pixels } from "./pixels.js";
import { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, drawChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, gridUpdatedChunks, tick, modal, brushPixel, setBrushPixel, showTooltip, hideTooltip, moveTooltip, setRunState } from "./game.js";
import { noise } from "./noise.js";

const VERTICES = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1,
]);
const INDICES = new Uint32Array([
    0, 1, 2,
    1, 2, 3,
]);

const ID = 0;
const PIXEL_DATA = 1;
const PUZZLE_DATA = 2;
const UPDATED = 3;

const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter?.requestDevice();

const webgpuSupported = device != null;

function resizeCanvas(width, height) {};
function resizeGrid() {};
function render() {};
if (device == null) {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    resizeCanvas = function(width, height) {
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
    };
    const imageBitmap = await createImageBitmap(await (await fetch("pixels.png")).blob());
    render = function(camera, drawPlacementRestriction, tick, grid, gridUpdated, gridUpdatedChunks, chunks, brush, selectionGrid) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        function random(input) {
            let state = input * 747796405 + 2891336453;
            let word = ((state >> ((state >> 28) + 4)) ^ state) * 277803737;
            return ((word >> 22) ^ word) / 4294967296;
        };
        let time = performance.now();
        function drawPixel(x, y, id, alpha) {
            let index = (x + y * gridWidth) * gridStride;
            let pixel = pixels[id];
            if (pixel.color != null) {
                if (id == WATER) {
                    let noiseSpeed = 3.0;
                    let noiseValue = noise.perlin3(x / 6, y / 6, time * 0.001 * noiseSpeed) + noise.perlin3(x / 2, y / 2, time * 0.003 * noiseSpeed) / 2;
                    ctx.fillStyle = "rgba(" + 255 * (0.3 - noiseValue * 0.1) + ", " + 255 * (0.3 - noiseValue * 0.15) + ", 255, 1)";
                }
                else if (id == ICE) {
                    let noiseSpeed = 0.1;
                    let noiseValue = noise.perlin3(x / 6, y / 6, time * 0.001 * noiseSpeed) + noise.perlin3(x / 2, y / 2, time * 0.003 * noiseSpeed) / 2;
                    ctx.fillStyle = "rgba(" + (185 - noiseValue * 5) + ", " + (190 - noiseValue * 10) + ", " + (247.5 - noise * 7.5) + ", 1)";
                }
                else if (id == STEAM) {
                    let noiseSpeed = 6.0;
                    let noiseValue = noise.perlin3(x / 6, y / 6, time * 0.001 * noiseSpeed) + noise.perlin3(x / 2, y / 2, time * 0.003 * noiseSpeed) / 2;
                    ctx.fillStyle = "rgba(" + (212.5 - noiseValue * 12.5) + ", " + (212.5 - noiseValue * 12.5) + ", " + (212.5 - noise * 12.5) + ", 1)";
                }
                else if (id == LAVA) {
                    let noiseSpeed = 0.5;
                    let noiseValue = noise.perlin3(x / 6, y / 6, time * 0.001 * noiseSpeed) + noise.perlin3(x / 2, y / 2, time * 0.003 * noiseSpeed) / 2;
                    ctx.fillStyle = "rgba(255, " + 255 * (0.5 + noiseValue * 0.5) + ", " + 0 + ", 1)";
                }
                else if (id == IRON) {
                    let noiseValue = noise.perlin2(x / 6, y / 6) + noise.perlin2(x / 2, y / 2) / 2;
                    ctx.fillStyle = "rgba(" + (190 - noiseValue * 30) + ", " + (180 - noiseValue * 20) + ", " + (150 + noiseValue * 30) + ", 1)";
                }
                else if (id == LAG_SPIKE_GENERATOR) {
                    ctx.fillStyle = "rgba(" + 255 * 0.5 + ", 255, 0, " + random(index + time * 1000) + ")";
                }
                else if (id == MOSS) {
                    let noiseValue = noise.perlin2(x / 6, y / 6) + noise.perlin2(x / 2, y / 2) / 2 + random(index) - 0.5;
                    ctx.fillStyle = "rgba(" + (37.5 - noiseValue * 37.5) + ", " + (162.5 - noiseValue * 37.5) + ", " + (25 + noiseValue * 25) + ", 1)";
                }
                else if (id == LICHEN) {
                    let noiseValue = noise.perlin2(x / 6, y / 6) + noise.perlin2(x / 2, y / 2) / 2 + random(index) - 0.5;
                    ctx.fillStyle = "rgba(" + (255 - noiseValue * 125) + ", " + (225 + noiseValue * 125) + ", 25, 1)";
                }
                else if (pixel.noise != null) {
                    let value = random(index);
                    ctx.fillStyle = "rgba(" + (pixel.color[0] + pixel.noise[0] * value) + ", " + (pixel.color[1] + pixel.noise[1] * value) + ", " + (pixel.color[2] + pixel.noise[2] * value) + ", 1)";
                }
                else {
                    ctx.fillStyle = "rgba(" + pixel.color[0] + ", " + pixel.color[1] + ", " + pixel.color[2] + ", 1)";
                }
                ctx.fillRect((x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2] + 1, camera[3] + 1);
            }
            else if (id == ROTATOR_CLOCKWISE) {
                let textureLayer = Math.floor(time * 0.001 * 6) % 4;
                ctx.drawImage(imageBitmap, pixel.texture[textureLayer][0], pixel.texture[textureLayer][1], pixel.texture[textureLayer][2], pixel.texture[textureLayer][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
            }
            else if (id == ROTATOR_COUNTERCLOCKWISE) {
                let textureLayer = (6 - Math.floor(time * 0.001 * 6) % 4) % 4 - 1;
                ctx.drawImage(imageBitmap, pixel.texture[textureLayer][0], pixel.texture[textureLayer][1], pixel.texture[textureLayer][2], pixel.texture[textureLayer][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
            }
            else if (id == DETONATOR) {
                let textureLayer = Math.floor(time * 0.001 * 2) % 2;
                ctx.drawImage(imageBitmap, pixel.texture[textureLayer][0], pixel.texture[textureLayer][1], pixel.texture[textureLayer][2], pixel.texture[textureLayer][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
            }
            else if (id == DELETER) {
                ctx.drawImage(imageBitmap, pixel.texture[0][0], pixel.texture[0][1], pixel.texture[0][2], pixel.texture[0][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                ctx.globalAlpha = alpha * (Math.sin(time * 0.001 * Math.PI) + 1) / 2;
                ctx.drawImage(imageBitmap, pixel.texture[1][0], pixel.texture[1][1], pixel.texture[1][2], pixel.texture[1][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                ctx.globalAlpha = alpha;
            }
            else if (id == LASER_LEFT || id == LASER_UP || id == LASER_RIGHT || id == LASER_DOWN) {
                ctx.drawImage(imageBitmap, pixel.texture[0][0], pixel.texture[0][1], pixel.texture[0][2], pixel.texture[0][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                ctx.globalAlpha = alpha * (Math.sin(time * 0.001 * Math.PI * 3) + 1) / 2;
                ctx.drawImage(imageBitmap, pixel.texture[1][0], pixel.texture[1][1], pixel.texture[1][2], pixel.texture[1][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                ctx.globalAlpha = alpha;
            }
            else if (id == COLOR_WELL || id == PASSIVE_COLOR_GENERATOR || id == ACTIVE_COLOR_GENERATOR) {
                let textureLayer = Math.floor(time * 0.002 + 5) % 6;
                ctx.drawImage(imageBitmap, pixel.texture[textureLayer][0], pixel.texture[textureLayer][1], pixel.texture[textureLayer][2], pixel.texture[textureLayer][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                ctx.globalAlpha = alpha * time * 0.002 - Math.floor(time * 0.002);
                ctx.drawImage(imageBitmap, pixel.texture[textureLayer + 1][0], pixel.texture[textureLayer + 1][1], pixel.texture[textureLayer + 1][2], pixel.texture[textureLayer + 1][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                ctx.globalAlpha = alpha;
            }
            // else if (Array.isArray(pixel.texture)) {
            //     ctx.drawImage(imageBitmap, pixel.texture[0][0], pixel.texture[0][1], pixel.texture[0][2], pixel.texture[0][3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
            // }
            else {
                ctx.drawImage(imageBitmap, pixel.texture[0], pixel.texture[1], pixel.texture[2], pixel.texture[3], (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
            }
        };
        for (let y = Math.max(Math.floor(camera[1]), 0); y < Math.min(Math.ceil(camera[1] + canvas.height / camera[3]), gridHeight); y++) {
            for (let x = Math.max(Math.floor(camera[0]), 0); x < Math.min(Math.ceil(camera[0] + canvas.width / camera[2]), gridWidth); x++) {
                let index = (x + y * gridWidth) * gridStride;
                drawPixel(x, y, grid[index + ID], 1);
                if ((grid[index + PIXEL_DATA] & 1) == 1) {
                    let value = noise.perlin2(x / 6, y / 6) + noise.perlin2(x / 3, y / 3) * 0.25 + noise.perlin2(x / 2, y / 2) * 0.75;
                    value = value * (random(index) * 1.5 + 0.25);
                    ctx.fillStyle = "rgba(255, " + (255 * (0.55 + value * 0.1)) + ", 0, " + (0.575 + value * 0.02) + ")";
                    ctx.fillRect((x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2] + 1, camera[3] + 1);
                }
                if (drawPlacementRestriction == -1 || (grid[index + PUZZLE_DATA] & (1 << drawPlacementRestriction)) != 0) {
                    if ((grid[index + PUZZLE_DATA] & 1) == 1) {
                        ctx.drawImage(imageBitmap, 0, 380, 60, 60, (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                    }
                    if ((grid[index + PUZZLE_DATA] & 4) == 4) {
                        ctx.drawImage(imageBitmap, 60, 380, 60, 60, (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                    }
                    if ((grid[index + PUZZLE_DATA] & 8) == 8) {
                        ctx.drawImage(imageBitmap, 120, 380, 60, 60, (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                    }
                }

                if (selectionGrid[0] != -1) {
                    if (x >= brush[0] && x < brush[0] + brush[2] && y >= brush[1] && y < brush[1] + brush[3]) {
                        ctx.globalAlpha = 0.5;
                        let selectionIndex = (x - brush[0] + (y - brush[1]) * brush[2]) * gridStride;
                        drawPixel(x, y, selectionGrid[selectionIndex + ID], 0.5);
                        if ((grid[selectionIndex + PIXEL_DATA] & 1) == 1) {
                            let value = noise.perlin2(x / 6, y / 6) + noise.perlin2(x / 3, y / 3) * 0.25 + noise.perlin2(x / 2, y / 2) * 0.75;
                            value = value * (random(index) * 1.5 + 0.25);
                            ctx.fillStyle = "rgba(255, " + (255 * (0.55 + value * 0.1)) + ", 0, " + (0.575 + value * 0.02) + ")";
                            ctx.fillRect((x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2] + 1, camera[3] + 1);
                        }
                        ctx.globalAlpha = 1;
                    }
                }
                else if (Math.abs(x - brush[0]) < brush[2] && Math.abs(y - brush[1]) < brush[2]) {
                    ctx.globalAlpha = 0.5;
                    if (brush[3] == FIRE) {
                        let value = noise.perlin2(x / 6, y / 6) + noise.perlin2(x / 3, y / 3) * 0.25 + noise.perlin2(x / 2, y / 2) * 0.75;
                        value = value * (random(index) * 1.5 + 0.25);
                        ctx.fillStyle = "rgba(255, " + (255 * (0.55 + value * 0.1)) + ", 0, " + (0.575 + value * 0.02) + ")";
                        ctx.fillRect((x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2] + 1, camera[3] + 1);
                    }
                    else if (brush[3] == PLACEMENT_RESTRICTION) {
                        ctx.drawImage(imageBitmap, 0, 380, 60, 60, (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                    }
                    else if (brush[3] == TEAM_PLACEMENT_RESTRICTION_A) {
                        ctx.drawImage(imageBitmap, 60, 380, 60, 60, (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                    }
                    else if (brush[3] == TEAM_PLACEMENT_RESTRICTION_B) {
                        ctx.drawImage(imageBitmap, 120, 380, 60, 60, (x - camera[0]) * camera[2], (y - camera[1]) * camera[3], camera[2], camera[3]);
                    }
                    else {
                        drawPixel(x, y, brush[3], 0.5);
                    }
                    ctx.globalAlpha = 1;
                }
            }
        }
    };
}
else {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({
        device: device,
        format: format,
    });

    device.pushErrorScope("validation");

    const vertexBuffer = device.createBuffer({
        size: 4 * 8,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, VERTICES);
    const indexBuffer = device.createBuffer({
        size: 4 * 6,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, INDICES);

    let viewport = new Float32Array([window.innerWidth, window.innerHeight]);
    const viewportBuffer = device.createBuffer({
        size: 4 * 2,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(viewportBuffer, 0, viewport);

    const cameraBuffer = device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const timeBuffer = device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const drawPlacementRestrictionBuffer = device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const cameraBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform",
            },
        }, {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform",
            },
        }, {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform",
            },
        }, {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform",
            },
        }],
    });
    const cameraBindGroup = device.createBindGroup({
        layout: cameraBindGroupLayout,
        entries: [{
            binding: 0,
            resource: {
                buffer: viewportBuffer,
            },
        }, {
            binding: 1,
            resource: {
                buffer: cameraBuffer,
            },
        }, {
            binding: 2,
            resource: {
                buffer: timeBuffer,
            },
        }, {
            binding: 3,
            resource: {
                buffer: drawPlacementRestrictionBuffer,
            },
        }],
    });

    const tickBuffer = device.createBuffer({
        size: 4 * 2,
        usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(tickBuffer, 0, new Uint32Array([0]));

    const gridSizeBuffer = device.createBuffer({
        size: 4 * 2,
        usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    let gridBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    let chunksBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    let brushBuffer = device.createBuffer({
        size: 4 * 120,
        usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    let selectionGridBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    let colorsBuffer = device.createBuffer({
        size: 4 * 1600,
        usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    let texturesBuffer = device.createBuffer({
        size: 1600,
        usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    let pixelTexture;
    const imageBitmap = await createImageBitmap(await (await fetch("pixel-mipmaps.png")).blob());
    // let mipLevelCount = Math.ceil(Math.log2(Math.max(imageBitmap.width, imageBitmap.height)));
    let mipLevelCount = Math.ceil(Math.log2(120));

    let textureLayers = 0;
    let textureMap = new Map();
    for (let i in pixels) {
        if (pixels[i].texture != null) {
            if (Array.isArray(pixels[i].texture)) {
                for (let j in pixels[i].texture) {
                    if (textureMap.has(pixels[i].texture[j][0] + ":" + pixels[i].texture[j][1] + ":" + pixels[i].texture[j][2] + ":" + pixels[i].texture[j][3])) {
                        continue;
                    }
                    textureMap.set(pixels[i].texture[j][0] + ":" + pixels[i].texture[j][1] + ":" + pixels[i].texture[j][2] + ":" + pixels[i].texture[j][3], textureLayers);
                    textureLayers += 1;
                }
            }
            else {
                if (textureMap.has(pixels[i].texture[0] + ":" + pixels[i].texture[1] + ":" + pixels[i].texture[2] + ":" + pixels[i].texture[3])) {
                    continue;
                }
                textureMap.set(pixels[i].texture[0] + ":" + pixels[i].texture[1] + ":" + pixels[i].texture[2] + ":" + pixels[i].texture[3], textureLayers);
                textureLayers += 1;
            }
        }
    }
    // let pixelCanvas = document.createElement("canvas");
    // let pixelCtx = pixelCanvas.getContext("2d");
    // pixelCanvas.width = 120;
    // pixelCanvas.height = 120;
    // let pixelCanvas2 = document.createElement("canvas");
    // let pixelCtx2 = pixelCanvas2.getContext("2d");
    // pixelCanvas2.width = 120;
    // pixelCanvas2.height = 120;
    // pixelCtx.imageSmoothingEnabled = false;
    // pixelCtx.webkitImageSmoothingEnabled = false;
    // pixelCtx.mozImageSmoothingEnabled = false;
    // pixelCtx2.imageSmoothingEnabled = false;
    // pixelCtx2.webkitImageSmoothingEnabled = false;
    // pixelCtx2.mozImageSmoothingEnabled = false;

    pixelTexture = device.createTexture({
        // size: [imageBitmap.width, imageBitmap.height, 1],
        size: [120, 120, textureLayers],
        // size: [6, 6, 1],
        format: "rgba8unorm",
        mipLevelCount: mipLevelCount,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    for (let i = 0; i < textureLayers; i++) {
        let x = 0;
        let size = 120;
        for (let j = 0; j < mipLevelCount; j++) {
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap, origin: [x, i * 120] },
                { texture: pixelTexture, mipLevel: j, origin: [0, 0, i] },
                [size, size, 1],
            );
            x += size;
            size = Math.floor(size / 2);
        }
    }

    // async function drawMipmapImages(texture, layer) {
    //     pixelCtx.clearRect(0, 0, 120, 120);
    //     pixelCtx.imageSmoothingEnabled = false;
    //     pixelCtx.webkitImageSmoothingEnabled = false;
    //     pixelCtx.mozImageSmoothingEnabled = false;
    //     pixelCtx.drawImage(imageBitmap, texture[0], texture[1], texture[2], texture[3], 0, 0, 120, 120);
    //     pixelCtx.imageSmoothingEnabled = true;
    //     pixelCtx.webkitImageSmoothingEnabled = true;
    //     pixelCtx.mozImageSmoothingEnabled = true;
    //     let size = 120;
    //         if (layer == 0) {
    //     pixelCtx2.imageSmoothingEnabled = true;
    //     pixelCtx2.webkitImageSmoothingEnabled = true;
    //     pixelCtx2.mozImageSmoothingEnabled = true;
    //             pixelCtx2.drawImage(pixelCanvas, 0, 0, size, size, 0, 0, 1, 1);
    //             pixelCanvas2.toBlob(function(blob) {
    //                 const a = document.createElement("a");
    //                 a.href = URL.createObjectURL(blob);
    //                 a.download = "buh";
    //                 a.click();
    //             });
    //         }
    //     for (let i = 0; i < mipLevelCount; i++) {
    //         device.queue.copyExternalImageToTexture(
    //             { source: await createImageBitmap(pixelCanvas, 0, 0, size, size) },
    //             { texture: pixelTexture, mipLevel: i, origin: [0, 0, layer] },
    //             [size, size, 1],
    //         );
    //         pixelCtx2.clearRect(0, 0, Math.floor(size / 2), Math.floor(size / 2));
    //         pixelCtx2.drawImage(pixelCanvas, 0, 0, size, size, 0, 0, Math.floor(size / 2), Math.floor(size / 2));
    //         let oldCtx = pixelCtx;
    //         pixelCtx = pixelCtx2;
    //         pixelCtx2 = oldCtx;
    //         let oldCanvas = pixelCanvas;
    //         pixelCanvas = pixelCanvas2;
    //         pixelCanvas2 = oldCanvas;
    //         size = Math.floor(size / 2);
    //     }
    // };

    // let layer = 0;
    // for (let i in pixels) {
    //     if (pixels[i].texture != null) {
    //         if (Array.isArray(pixels[i].texture[0])) {
    //             for (let j in pixels[i].texture) {
    //                 await drawMipmapImages(pixels[i].texture[j], layer);
    //                 layer += 1;
    //             }
    //         }
    //         else {
    //             await drawMipmapImages(pixels[i].texture, layer);
    //             layer += 1;
    //         }
    //     }
    // }

    let array = [];
    for (let i in pixels) {
        if (pixels[i].color != null) {
            array.push(pixels[i].color[0] / 255);
            array.push(pixels[i].color[1] / 255);
            array.push(pixels[i].color[2] / 255);
            array.push(pixels[i].color[3]);
            if (pixels[i].noise != null) {
                array.push(pixels[i].noise[0] / 255);
                array.push(pixels[i].noise[1] / 255);
                array.push(pixels[i].noise[2] / 255);
                array.push(pixels[i].noise[3]);
            }
            else {
                array.push(0);
                array.push(0);
                array.push(0);
                array.push(0);
            }
        }
        else {
            array.push(0);
            array.push(0);
            array.push(0);
            array.push(0);
            array.push(0);
            array.push(0);
            array.push(0);
            array.push(0);
        }
    }
    device.queue.writeBuffer(colorsBuffer, 0, new Float32Array(array));
    array = [];
    for (let i in pixels) {
        if (pixels[i].texture != null) {
            if (Array.isArray(pixels[i].texture)) {
                array.push(textureMap.get(pixels[i].texture[0][0] + ":" + pixels[i].texture[0][1] + ":" + pixels[i].texture[0][2] + ":" + pixels[i].texture[0][3]));
            }
            else {
                array.push(textureMap.get(pixels[i].texture[0] + ":" + pixels[i].texture[1] + ":" + pixels[i].texture[2] + ":" + pixels[i].texture[3]));
            }
        }
        else {
            array.push(-1);
        }
    }
    device.queue.writeBuffer(texturesBuffer, 0, new Int32Array(array));

    const pixelSampler = device.createSampler({
        addressModeU: "repeat",
        addressModeV: "repeat",
        magFilter: "nearest",
        minFilter: "nearest",
        mipmapFilter: "linear",
    });
    // {
    //     let uniformBindGroupLayout = device.createBindGroupLayout({
    //         label: "sdfsdf",
    //         entries: [
    //             {
    //                 binding: 0,
    //                 visibility: GPUShaderStage.FRAGMENT,
    //                 sampler: {},
    //             },
    //             {
    //                 binding: 1,
    //                 visibility: GPUShaderStage.FRAGMENT,
    //                 texture: {
    //                     viewDimension: "2d-array",
    //                 },
    //             }
    //         ]
    //     });


    //     // let mipmapShaderModule = shaderModuleFromCode(device, "mipmap-shader");
    //     let mipmapShaderModule = device.createShaderModule({
    //         code: `var<private> pos : array<vec2<f32>, 4> = array<vec2<f32>, 4>(
    // vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, 1.0),
    // vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0));

    // struct VertexOutput {
    //     @builtin(position) position: vec4<f32>,
    //     @location(0) texCoord: vec2<f32>,
    //     @location(1) @interpolate(flat) arrayIndex: u32,
    // };

    // @vertex
    // fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    //     var output : VertexOutput;
    //     output.texCoord = pos[vertexIndex % 4] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
    //     output.arrayIndex = vertexIndex / 4;
    //     output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    //     return output;
    // }

    // @group(0) @binding(0) var imgSampler: sampler;
    // @group(0) @binding(1) var img: texture_2d_array<f32>;

    // @fragment
    // fn fs_main(@location(0) texCoord: vec2<f32>, @location(1) @interpolate(flat) arrayIndex: u32) -> @location(0) vec4<f32> {
    //     return textureSample(img, imgSampler, texCoord, arrayIndex);
    // }`,
    //     });

    //     const mipmapPipelineLayoutDesc = { bindGroupLayouts: [uniformBindGroupLayout] };
    //     const layout = device.createPipelineLayout(mipmapPipelineLayoutDesc);
    //     const mipmapPipelineDesc = {
    //         layout,
    //         vertex: {
    //             module: mipmapShaderModule,
    //             entryPoint: "vs_main",
    //         },
    //         fragment: {
    //             module: mipmapShaderModule,
    //             entryPoint: "fs_main",
    //             targets: [{
    //                 format: pixelTexture.format // Make sure to use the same format as the texture
    //             }],
    //         },
    //         primitive: {
    //             topology: "triangle-strip",
    //             stripIndexFormat: "uint32",
    //         },
    //     };

    //     const mipmapPipeline = device.createRenderPipeline(mipmapPipelineDesc);
    //     let srcView = pixelTexture.createView({
    //         baseMipLevel: 0,
    //         mipLevelCount: 1
    //     });
    //     const sampler = device.createSampler({ minFilter: "linear" });

    //     // Loop through each mip level and renders the previous level"s contents into it.
    //     const commandEncoder = device.createCommandEncoder({});

    //     for (let i = 1; i < mipLevelCount; ++i) {
    //         const dstView = pixelTexture.createView({
    //             baseMipLevel: i,  // Make sure we"re getting the right mip level...
    //             mipLevelCount: 1, // And only selecting one mip level
    //         });

    //         const passEncoder = commandEncoder.beginRenderPass({
    //             colorAttachments: [{
    //                 view: dstView, // Render pass uses the next mip level as it"s render attachment.
    //                 clearValue: { r: 0, g: 0, b: 0, a: 1 },
    //                 loadOp: "clear",
    //                 storeOp: "store"
    //             }],
    //         });

    //         // Need a separate bind group for each level to ensure
    //         // we"re only sampling from the previous level.
    //         const bindGroup = device.createBindGroup({
    //             layout: uniformBindGroupLayout,
    //             entries: [{
    //                 binding: 0,
    //                 resource: sampler,
    //             }, {
    //                 binding: 1,
    //                 resource: srcView,
    //             }],
    //         });

    //         // Render
    //         passEncoder.setPipeline(mipmapPipeline);
    //         passEncoder.setBindGroup(0, bindGroup);
    //         passEncoder.draw(4 * textureDepth);
    //         // what is a render pass;
    //         passEncoder.end();

    //         srcView = dstView;
    //     }
    //     device.queue.submit([commandEncoder.finish()]);
    // }

    const renderGridBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "uniform",
            },
        }, {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "uniform",
            },
        }, {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            },
        }, {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            },
        }, {
            binding: 4,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            },
        }, {
            binding: 5,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            },
        }, {
            binding: 6,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            },
        }, {
            binding: 7,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage",
            },
        }, {
            binding: 8,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
                type: "filtering",
                viewDimension: "2d-array",
            },
        }, {
            binding: 9,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {
                viewDimension: "2d-array",
            },
        }],
    });
    let renderGridBindGroup;

    function createBindGroups() {
        renderGridBindGroup = device.createBindGroup({
            layout: renderGridBindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: tickBuffer,
                },
            }, {
                binding: 1,
                resource: {
                    buffer: gridSizeBuffer,
                },
            }, {
                binding: 2,
                resource: {
                    buffer: gridBuffer,
                },
            }, {
                binding: 3,
                resource: {
                    buffer: chunksBuffer,
                },
            }, {
                binding: 4,
                resource: {
                    buffer: brushBuffer,
                },
            }, {
                binding: 5,
                resource: {
                    buffer: selectionGridBuffer,
                },
            // }, {
            //     binding: 7,
            //     resource: {
            //         buffer: colorsBuffer,
            //     },
            }, {
                binding: 6,
                resource: {
                    buffer: colorsBuffer,
                },
            }, {
                binding: 7,
                resource: {
                    buffer: texturesBuffer,
                },
            }, {
                binding: 8,
                resource: pixelTexture.createView(),
            }, {
                binding: 9,
                resource: pixelSampler,
            }],
        });
    };


    let motionBlurTexture;
    let motionBlurTextureView;
    let motionBlurTextureSampler = device.createSampler();
    let motionBlurTextureBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: {
                sampleType: "float",
                viewDimension: "2d",
                multisampled: false,
            },
        }, {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            sampler: {
                type: "non-filtering",
            },
        }, {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: "uniform",
            },
        }],
    });
    let motionBlurTextureBindGroup;

    // computeGridBindGroupLayout = device.createBindGroupLayout({
    //     entries: [{
    //         binding: 0,
    //         visibility: GPUShaderStage.COMPUTE,
    //         buffer: {
    //             type: "uniform",
    //         },
    //     }, {
    //         binding: 1,
    //         visibility: GPUShaderStage.COMPUTE,
    //         buffer: {
    //             type: "uniform",
    //         },
    //     }, {
    //         binding: 2,
    //         visibility: GPUShaderStage.COMPUTE,
    //         buffer: {
    //             type: "storage",
    //         },
    //     }, {
    //         binding: 3,
    //         visibility: GPUShaderStage.COMPUTE,
    //         buffer: {
    //             type: "storage",
    //         },
    //     }, {
    //         binding: 4,
    //         visibility: GPUShaderStage.COMPUTE,
    //         buffer: {
    //             type: "storage",
    //         },
    //     }, {
    //         binding: 5,
    //         visibility: GPUShaderStage.COMPUTE,
    //         buffer: {
    //             type: "storage",
    //         },
    //     }],
    // });
    // computeGridBindGroup = device.createBindGroup({
    //     layout: computeGridBindGroupLayout,
    //     entries: [{
    //         binding: 0,
    //         resource: {
    //             buffer: tickBuffer,
    //         },
    //     }, {
    //         binding: 1,
    //         resource: {
    //             buffer: gridSizeBuffer,
    //         },
    //     }, {
    //         binding: 2,
    //         resource: {
    //             buffer: gridBuffer,
    //         },
    //     }, {
    //         binding: 3,
    //         resource: {
    //             buffer: activeGridBuffer,
    //         },
    //     }, {
    //         binding: 4,
    //         resource: {
    //             buffer: chunksBuffer,
    //         },
    //     }, {
    //         binding: 5,
    //         resource: {
    //             buffer: brushBuffer,
    //         },
    //     }],
    // });



    class RenderPass {
        constructor(dir) {
            this.dir = dir;
        }
        async init() {
            this.shader = await(await fetch("./passes/" + this.dir + ".wgsl")).text();
            
            // this.shader = await (await fetch(this.dir + ".wgsl")).text();
            if (this.shader == null) {
                throw new Error("no shader found buh");
            }

            let colorString = "const colors = array<vec4<f32>, " + pixels.length + ">(";
            let noiseString = "const noise_colors = array<vec4<f32>, " + pixels.length + ">(";
            for (let i in pixels) {
                if (i != 0) {
                    colorString += ", ";
                    noiseString += ", ";
                }
                if (pixels[i].color == null) {
                    colorString += "vec4<f32>(0.0, 0.0, 0.0, 0.0)";
                }
                else {
                    colorString += "vec4<f32>(" + pixels[i].color[0] + ", " + pixels[i].color[1] + ", " + pixels[i].color[2] + ", " + pixels[i].color[3] + ")";
                }
                if (pixels[i].noise == null) {
                    noiseString += "vec4<f32>(0.0, 0.0, 0.0, 0.0)";
                }
                else {
                    noiseString += "vec4<f32>(" + pixels[i].noise[0] + ", " + pixels[i].noise[1] + ", " + pixels[i].noise[2] + ", " + pixels[i].noise[3] + ")";
                }
            }
            colorString += ");";
            noiseString += ");";
            // this.shader = this.shader.replaceAll("const colors;", colorString);
            // this.shader = this.shader.replaceAll("const noise_colors;", noiseString);
            // let pixelIndices = {};
            let pixelIds = [];
            for (let i in pixels) {
                pixelIds.push({
                    name: pixels[i].id.toUpperCase(),
                    id: i,
                });
            }
            pixelIds.sort((a, b) => {
                return b.name.length - a.name.length;
            });
            for (let i in pixelIds) {
                // pixelIndices[pixels[i].id] = i;
                this.shader = this.shader.replaceAll(pixelIds[i].name, pixelIds[i].id);
            }
            // this.shader = this.shader.replaceAll("FIRE", pixelIndices.fire);
            // this.shader = this.shader.replaceAll("FIRE", pixelIndices.fire);

            this.module = device.createShaderModule({
                label: this.dir,
                code: this.shader,
            });

            if (this.dir == "render/useless" || this.dir == "render/useless2") {
                this.layout = device.createPipelineLayout({
                    bindGroupLayouts: [
                        cameraBindGroupLayout,
                        motionBlurTextureBindGroupLayout,
                    ],
                });
        
                this.pipeline = device.createRenderPipeline({
                    label: this.dir,
                    layout: this.layout,
                    vertex: {
                        module: this.module,
                        entryPoint: "vs_main",
                        buffers: [{
                            // vertex x y
                            // instance x y size color
                            attributes: [{
                                shaderLocation: 0, // @location(0)
                                offset: 0,
                                format: "float32x2",
                            }],
                            arrayStride: 4 * 2, // sizeof(float) * 3
                            stepMode: "vertex",
                        }],
                    },
                    fragment: {
                        module: this.module,
                        entryPoint: "fs_main",
                        // targets: [{
                        //     format: format,
                        //     blend: {
                        //         color: {
                        //             operation: "add",
                        //             srcFactor: "src-alpha",
                        //             dstFactor: "dst-alpha",
                        //         },
                        //         alpha: {
                        //             operation: "add",
                        //             srcFactor: "one",
                        //             dstFactor: "one",
                        //         },
                        //     },
                        // }, {
                        //     format: "r8unorm",
                        //     blend: {
                        //         color: {
                        //             operation: "add",
                        //             srcFactor: "src-alpha",
                        //             dstFactor: "dst-alpha",
                        //         },
                        //         alpha: {
                        //             operation: "add",
                        //             srcFactor: "one",
                        //             dstFactor: "one",
                        //         },
                        //     },
                        //     // writeMask: 0,
                        // }],
                        targets: [{
                            // format: "r8unorm",
                            format: format,
                            // blend: {
                            //     color: {
                            //         operation: "add",
                            //         srcFactor: "src-alpha",
                            //         dstFactor: "dst-alpha",
                            //     },
                            //     alpha: {
                            //         operation: "add",
                            //         srcFactor: "one",
                            //         dstFactor: "one",
                            //     },
                            // },
                            // writeMask: 0,
                        }],
                    },
                    primitive: {
                        topology: "triangle-list",
                    },
                });
            }
            else {
                this.layout = device.createPipelineLayout({
                    bindGroupLayouts: [
                        cameraBindGroupLayout,
                        renderGridBindGroupLayout,
                    ],
                });

                this.pipeline = device.createRenderPipeline({
                    label: this.dir,
                    layout: this.layout,
                    vertex: {
                        module: this.module,
                        entryPoint: "vs_main",
                        buffers: [{
                            // vertex x y
                            // instance x y size color
                            attributes: [{
                                shaderLocation: 0, // @location(0)
                                offset: 0,
                                format: "float32x2",
                            }],
                            arrayStride: 4 * 2, // sizeof(float) * 3
                            stepMode: "vertex",
                        }],
                    },
                    fragment: {
                        module: this.module,
                        entryPoint: "fs_main",
                        // targets: [{
                        //     format: format,
                        //     blend: {
                        //         color: {
                        //             operation: "add",
                        //             srcFactor: "src-alpha",
                        //             dstFactor: "dst-alpha",
                        //         },
                        //         alpha: {
                        //             operation: "add",
                        //             srcFactor: "one",
                        //             dstFactor: "one",
                        //         },
                        //     },
                        // }, {
                        //     format: "r8unorm",
                        //     blend: {
                        //         color: {
                        //             operation: "add",
                        //             srcFactor: "src-alpha",
                        //             dstFactor: "dst-alpha",
                        //         },
                        //         alpha: {
                        //             operation: "add",
                        //             srcFactor: "one",
                        //             dstFactor: "one",
                        //         },
                        //     },
                        //     // writeMask: 0,
                        // }],
                        targets: [{
                            // format: "r8unorm",
                            format: format,
                            blend: {
                                color: {
                                    operation: "add",
                                    srcFactor: "src-alpha",
                                    dstFactor: "one-minus-src-alpha",
                                },
                                alpha: {
                                    operation: "add",
                                    srcFactor: "one",
                                    dstFactor: "one",
                                },
                            },
                            // writeMask: 0,
                        }],
                    },
                    primitive: {
                        topology: "triangle-list",
                    },
                });
            }
        }
        async render(encoder) {
            let pass;
            if (this.dir == "render/useless" || this.dir == "render/useless2") {
                pass = encoder.beginRenderPass({
                    label: this.dir,
                    // colorAttachments: [{
                    //     view: ctx.getCurrentTexture().createView(),
                    //     loadOp: "load",
                    //     storeOp: "store",
                    // }, {
                    //     view: motionBlurTextureView,
                    //     loadOp: "load",
                    //     storeOp: "store",
                    // }],
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        // loadOp: "load",
                        loadOp: "clear",
                        clearValue: [0, 0, 0, 1],
                        // clearValue: [0, (performance.now() / 1000 % 10) / 10, 0, 1],
                        storeOp: "store",
                    }],
                });
                pass.setPipeline(this.pipeline);
                pass.setVertexBuffer(0, vertexBuffer);
                // pass.setVertexBuffer(1, particleBuffer);
                pass.setIndexBuffer(indexBuffer, "uint32");
                pass.setBindGroup(0, cameraBindGroup);
                pass.setBindGroup(1, motionBlurTextureBindGroup);
                pass.drawIndexed(INDICES.length, 1);

                pass.end();
            }
            else {
                pass = encoder.beginRenderPass({
                    label: this.dir,
                    // colorAttachments: [{
                    //     view: ctx.getCurrentTexture().createView(),
                    //     loadOp: "load",
                    //     storeOp: "store",
                    // }, {
                    //     view: motionBlurTextureView,
                    //     loadOp: "load",
                    //     storeOp: "store",
                    // }],
                    colorAttachments: [{
                        view: motionBlurTextureView,
                        loadOp: "load",
                        // loadOp: "clear",
                        clearValue: [0, 0, 0, 1],
                        // clearValue: [0, (performance.now() / 1000 % 10) / 10, 0, 1],
                        storeOp: "store",
                    }],
                });
                pass.setPipeline(this.pipeline);
                pass.setVertexBuffer(0, vertexBuffer);
                // pass.setVertexBuffer(1, particleBuffer);
                pass.setIndexBuffer(indexBuffer, "uint32");
                pass.setBindGroup(0, cameraBindGroup);
                pass.setBindGroup(1, renderGridBindGroup);
                pass.drawIndexed(INDICES.length, 1);

                pass.end();
            }
        }
    }
    class ComputePass {
        constructor(renderer, dir) {
            this.renderer = renderer;
            this.dir = dir;
        }
        async init() {
            this.shader = await (await fetch("./passes/" + this.dir + ".wgsl")).text();
            if (this.shader == null) {
                throw new Error("no shader found buh");
            }

            this.module = device.createShaderModule({
                label: this.dir,
                code: this.shader,
            });

            this.layout = device.createPipelineLayout({
                bindGroupLayouts: [
                    cameraBindGroupLayout,
                    computeGridBindGroupLayout,
                ],
            });

            this.pipeline = device.createComputePipeline({
                label: this.dir,
                layout: this.layout,
                compute: {
                    module: this.module,
                    entryPoint: "main",
                },
            });
        }
        async render(encoder) {
            if (this.dir == "compute/setup" && tick > 10000) {
                // if (this.dir == "compute/setup" && tick > 1000) {
                // if (this.dir == "compute/setup" && tick > 200) {
                // if (this.dir == "compute/setup" && tick > 2) {
                return;
            }
            const pass = encoder.beginComputePass({
                label: this.dir,
            });

            pass.setPipeline(this.pipeline);
            pass.setBindGroup(0, cameraBindGroup);
            pass.setBindGroup(1, computeGridBindGroup);
            // pass.setBindGroup(2, randomSeedBindGroup);
            // pass.dispatchWorkgroups(particles);
            // pass.dispatchWorkgroups(gridSize / 16 * gridSize / 16 / 16);
            // pass.dispatchWorkgroups(gridSize / 16 / 4, gridSize / 16 / 4);
            // pass.dispatchWorkgroups(gridSize / chunkSize, gridSize / chunkSize);
            pass.dispatchWorkgroups(gridSize / chunkSize / 8, gridSize / chunkSize / 8);
            // pass.dispatchWorkgroups(1000);
            pass.end();
        }
    }

    let renderPasses = ["main", "useless"];
    for (let i in renderPasses) {
        const pass = new RenderPass("render/" + renderPasses[i]);
        // const pass = new RenderPass(renderPasses[i]);
        await pass.init();
        renderPasses[i] = pass;
    }
    // for (let i in computePasses) {
    //     const pass = new ComputePass("compute/" + computePasses[i]);
    //     await pass.init();
    //     computePasses[i] = pass;
    // }
    device.popErrorScope().then((error) => {
        if (error) {
            alert("An error occured during initialization." + error.message);
        }
    });
    resizeCanvas = function(width, height) {
        canvas.width = width;
        canvas.height = height;
        viewport[0] = width;
        viewport[1] = height;
        device.queue.writeBuffer(viewportBuffer, 0, viewport);
        motionBlurTexture = device.createTexture({
            label: "Motion Blur Texture",
            size: [width, height],
            // format: "r8unorm",
            format: format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        motionBlurTextureView = motionBlurTexture.createView({
            // format: "r8unorm",
            format: format,
        });
        motionBlurTextureBindGroup = device.createBindGroup({
            layout: motionBlurTextureBindGroupLayout,
            entries: [{
                binding: 0,
                resource: motionBlurTextureView,
            }, {
                binding: 1,
                resource: motionBlurTextureSampler,
            }, {
                binding: 2,
                resource: {
                    buffer: gridSizeBuffer,
                },
            }],
        });
    };
    resizeGrid = function(gridWidth, gridHeight, gridStride, chunkXAmount, chunkYAmount, chunkStride) {
        gridBuffer = device.createBuffer({
            size: 4 * gridStride * gridWidth * gridHeight,
            usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        chunksBuffer = device.createBuffer({
            label: "test chunks buffer",
            size: 4 * chunkStride * chunkXAmount * chunkYAmount,
            usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        selectionGridBuffer = device.createBuffer({
            size: 4 * gridStride * gridWidth * gridHeight,
            usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(gridSizeBuffer, 0, new Uint32Array([gridWidth, gridHeight]));
        createBindGroups();
    };
    render = function(camera, drawPlacementRestriction, tick, grid, gridUpdated, gridUpdatedChunks, chunks, brush, selectionGrid) {
        const encoder = device.createCommandEncoder();

        device.queue.writeBuffer(cameraBuffer, 0, camera);
        device.queue.writeBuffer(timeBuffer, 0, new Float32Array([performance.now()]));
        device.queue.writeBuffer(drawPlacementRestrictionBuffer, 0, new Uint32Array([drawPlacementRestriction]));

        device.queue.writeBuffer(tickBuffer, 0, new Uint32Array([tick]));
        if (gridUpdated) {
            for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
                for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                    let minX = gridUpdatedChunks[(chunkX + chunkY * chunkXAmount) * chunkStride];
                    let maxX = gridUpdatedChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1];
                    if (maxX >= minX) {
                        let minY = gridUpdatedChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2];
                        let maxY = gridUpdatedChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3];
                        for (let y = minY; y <= maxY; y++) {
                            let index = (minX + y * gridWidth) * gridStride;
                            device.queue.writeBuffer(gridBuffer, index * 4, grid, index, (maxX - minX + 1) * gridStride);
                        }
                    }
                }
            }
            // device.queue.writeBuffer(gridBuffer, 0, grid);
            device.queue.writeBuffer(chunksBuffer, 0, chunks);
        }
        device.queue.writeBuffer(brushBuffer, 0, brush);
        device.queue.writeBuffer(selectionGridBuffer, 0, selectionGrid);

        // for (let i in computePasses) {
        //     computePasses[i].render(encoder);
        // }

        for (let i in renderPasses) {
            renderPasses[i].render(encoder);
        }

        device.queue.submit([encoder.finish()]);
    };
}

export { webgpuSupported, resizeCanvas, resizeGrid, render }