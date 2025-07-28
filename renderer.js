import { pixels } from "./pixels.js";

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

const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter?.requestDevice();
if (device == null) {
    alert("Your browser does not support WebGPU.");
}

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
    size: 4 * 1600,
    usage: GPUBufferUsage.FRAGMENT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

let pixelTexture;
const response = await fetch("pixels.png");
const imageBitmap = await createImageBitmap(await response.blob());

pixelTexture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    // size: [6, 6, 1],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
});
device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: pixelTexture },
    [imageBitmap.width, imageBitmap.height],
);

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
        array.push(pixels[i].texture[0] / imageBitmap.width);
        array.push(pixels[i].texture[1] / imageBitmap.height);
        array.push(pixels[i].texture[2] / imageBitmap.width);
        array.push(pixels[i].texture[3] / imageBitmap.height);
    }
    else {
        array.push(-1);
        array.push(0);
        array.push(0);
        array.push(0);
    }
}
device.queue.writeBuffer(texturesBuffer, 0, new Float32Array(array));

const pixelSampler = device.createSampler({
    magFilter: "nearest",
    minFilter: "nearest",
});

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
        },
    }, {
        binding: 9,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {
            viewDimension: "2d",
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
function resizeCanvas(width, height) {
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
function resizeGrid(gridWidth, gridHeight, gridStride, chunkXAmount, chunkYAmount, chunkStride) {
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
function render(camera, drawPlacementRestriction, tick, grid, chunks, brush, selectionGrid) {
    const encoder = device.createCommandEncoder();

    device.queue.writeBuffer(cameraBuffer, 0, camera);
    device.queue.writeBuffer(timeBuffer, 0, new Float32Array([performance.now()]));
    device.queue.writeBuffer(drawPlacementRestrictionBuffer, 0, new Uint32Array([drawPlacementRestriction]));

    device.queue.writeBuffer(tickBuffer, 0, new Uint32Array([tick]));
    device.queue.writeBuffer(gridBuffer, 0, grid);
    device.queue.writeBuffer(chunksBuffer, 0, chunks);
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

export { resizeCanvas, resizeGrid, render, imageBitmap }