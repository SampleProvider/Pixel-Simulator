@group(0) @binding(0) var<uniform> viewport: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: vec4<f32>;
@group(0) @binding(2) var<uniform> time: f32;
@group(1) @binding(0) var<uniform> tick: u32;
@group(1) @binding(1) var<uniform> grid_size: vec2<u32>;
@group(1) @binding(2) var<storage, read> grid: array<f32>;
@group(1) @binding(3) var<storage, read> chunks: array<u32>;
@group(1) @binding(4) var<storage, read> brush: array<f32>;
//@group(1) @binding(7) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(5) var<storage, read> selection_grid: array<f32>;
//@group(1) @binding(6) var<uniform> pixel_texture_pos: array<vec4<f32>>;


fn fade2(t: vec2f) -> vec2f { return t * t * t * (t * (t * 6. - 15.) + 10.); }

fn perlinNoise2(P: vec2f) -> f32 {
    var Pi: vec4f = floor(P.xyxy) + vec4f(0., 0., 1., 1.);
    let Pf = fract(P.xyxy) - vec4f(0., 0., 1., 1.);
    Pi = Pi % vec4f(289.); // To avoid truncation effects in permutation
    let ix = Pi.xzxz;
    let iy = Pi.yyww;
    let fx = Pf.xzxz;
    let fy = Pf.yyww;
    let i = permute4(permute4(ix) + iy);
    var gx: vec4f = 2. * fract(i * 0.0243902439) - 1.; // 1/41 = 0.024...
    let gy = abs(gx) - 0.5;
    let tx = floor(gx + 0.5);
    gx = gx - tx;
    var g00: vec2f = vec2f(gx.x, gy.x);
    var g10: vec2f = vec2f(gx.y, gy.y);
    var g01: vec2f = vec2f(gx.z, gy.z);
    var g11: vec2f = vec2f(gx.w, gy.w);
    let norm = 1.79284291400159 - 0.85373472095314 *
        vec4f(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 = g00 * norm.x;
    g01 = g01 * norm.y;
    g10 = g10 * norm.z;
    g11 = g11 * norm.w;
    let n00 = dot(g00, vec2f(fx.x, fy.x));
    let n10 = dot(g10, vec2f(fx.y, fy.y));
    let n01 = dot(g01, vec2f(fx.z, fy.z));
    let n11 = dot(g11, vec2f(fx.w, fy.w));
    let fade_xy = fade2(Pf.xy);
    let n_x = mix(vec2f(n00, n01), vec2f(n10, n11), vec2f(fade_xy.x));
    let n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.2 * n_xy; // 2.3
}

fn permute4(x: vec4f) -> vec4f { return ((x * 34. + 1.) * x) % vec4f(289.); }
fn taylorInvSqrt4(r: vec4f) -> vec4f { return 1.79284291400159 - 0.85373472095314 * r; }
fn fade3(t: vec3f) -> vec3f { return t * t * t * (t * (t * 6. - 15.) + 10.); }
//fn fade3(t: vec3f) -> vec3f { return t; }
//fn fade(t: f32) -> f32 { return smoothstep(0.0, 1.0, t); }
fn fade(t: f32) -> f32 { return t; }
//fn fade3(t: vec3f) -> vec3f { return smoothstep(vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(1.0, 1.0, 1.0), t); }
//fn fade3(t: vec3f) -> vec3f { return t; }
//fn fade3(t: vec3f) -> vec3f { return t * (1 - cos(3.1415 * t)) / 2; }

fn perlinNoise3(P: vec3f) -> f32 {
    var Pi0 : vec3f = floor(P); // Integer part for indexing
    var Pi1 : vec3f = Pi0 + vec3f(1.); // Integer part + 1
    Pi0 = Pi0 % vec3f(289.);
    Pi1 = Pi1 % vec3f(289.);
    let Pf0 = fract(P); // Fractional part for interpolation
    let Pf1 = Pf0 - vec3f(1.); // Fractional part - 1.
    let ix = vec4f(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    let iy = vec4f(Pi0.yy, Pi1.yy);
    let iz0 = Pi0.zzzz;
    let iz1 = Pi1.zzzz;

    let ixy = permute4(permute4(ix) + iy);
    let ixy0 = permute4(ixy + iz0);
    let ixy1 = permute4(ixy + iz1);

    var gx0: vec4f = ixy0 / 7.;
    var gy0: vec4f = fract(floor(gx0) / 7.) - 0.5;
    gx0 = fract(gx0);
    var gz0: vec4f = vec4f(0.5) - abs(gx0) - abs(gy0);
    var sz0: vec4f = step(gz0, vec4f(0.));
    gx0 = gx0 - sz0 * (step(vec4f(0.), gx0) - 0.5);
    gy0 = gy0 - sz0 * (step(vec4f(0.), gy0) - 0.5);

    var gx1: vec4f = ixy1 / 7.;
    var gy1: vec4f = fract(floor(gx1) / 7.) - 0.5;
    gx1 = fract(gx1);
    var gz1: vec4f = vec4f(0.5) - abs(gx1) - abs(gy1);
    var sz1: vec4f = step(gz1, vec4f(0.));
    gx1 = gx1 - sz1 * (step(vec4f(0.), gx1) - 0.5);
    gy1 = gy1 - sz1 * (step(vec4f(0.), gy1) - 0.5);

    var g000: vec3f = vec3f(gx0.x, gy0.x, gz0.x);
    var g100: vec3f = vec3f(gx0.y, gy0.y, gz0.y);
    var g010: vec3f = vec3f(gx0.z, gy0.z, gz0.z);
    var g110: vec3f = vec3f(gx0.w, gy0.w, gz0.w);
    var g001: vec3f = vec3f(gx1.x, gy1.x, gz1.x);
    var g101: vec3f = vec3f(gx1.y, gy1.y, gz1.y);
    var g011: vec3f = vec3f(gx1.z, gy1.z, gz1.z);
    var g111: vec3f = vec3f(gx1.w, gy1.w, gz1.w);

    let norm0 = taylorInvSqrt4(
        vec4f(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 = g000 * norm0.x;
    g010 = g010 * norm0.y;
    g100 = g100 * norm0.z;
    g110 = g110 * norm0.w;
    let norm1 = taylorInvSqrt4(
        vec4f(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 = g001 * norm1.x;
    g011 = g011 * norm1.y;
    g101 = g101 * norm1.z;
    g111 = g111 * norm1.w;

    let n000 = dot(g000, Pf0);
    let n100 = dot(g100, vec3f(Pf1.x, Pf0.yz));
    let n010 = dot(g010, vec3f(Pf0.x, Pf1.y, Pf0.z));
    let n110 = dot(g110, vec3f(Pf1.xy, Pf0.z));
    let n001 = dot(g001, vec3f(Pf0.xy, Pf1.z));
    let n101 = dot(g101, vec3f(Pf1.x, Pf0.y, Pf1.z));
    let n011 = dot(g011, vec3f(Pf0.x, Pf1.yz));
    let n111 = dot(g111, Pf1);

    var fade_xyz: vec3f = fade3(Pf0);
    fade_xyz.z = fade(Pf0.z);
    let temp = vec4f(f32(fade_xyz.z)); // simplify after chrome bug fix
    let n_z = mix(vec4f(n000, n100, n010, n110), vec4f(n001, n101, n011, n111), temp);
    let n_yz = mix(n_z.xy, n_z.zw, vec2f(f32(fade_xyz.y))); // simplify after chrome bug fix
    let n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    //return (2.2 * n_xyz + 1) / 2;
    return 2.2 * n_xyz;
}

fn random(input: u32) -> f32 {
    var state = input * 747796405 + 2891336453;
    var word = ((state >> ((state >> 28) + 4)) ^ state) * 277803737;
    return f32((word >> 22) ^ word) / 4294967296;
}

@vertex
fn vs_main(@location(0) pos: vec2<f32>) -> @builtin(position) vec4<f32> {
    return vec4<f32>(pos, 0.0, 1.0);
}

@group(1) @binding(6) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(7) var<storage, read> textures: array<vec4<f32>>;
@group(1) @binding(8) var pixelTexture: texture_2d<f32>;
@group(1) @binding(9) var pixelSampler: sampler;

//@group(1) @binding(9) var<storage, read> texture_pos: array<vec4<f32>>;
//const colors;
//const noise_colors;
//const colors = array<vec4<f32>, 2>(vec4<f32>(1.0, 1.0, 1.0, 1.0), vec4<f32>(1.0, 0.0, 0.0, 1.0));
//const noise_colors = array<vec4<f32>, 2>(vec4<f32>(0.0, 0.0, 0.0, 0.0), vec4<f32>(0.0, 1.0, 0.0, 0.0));

// constants are TERRIBLE

//const pixel_texture = array<vec2<f32>, 2>(vec2<f32>(0.0, 0.0), vec2<f32>(0.0, 0.0));

const stride = 4;

fn get_color(id: f32, color: vec4<f32>, pos: vec2<f32>) -> vec4<f32> {
    //if (id == 2) {
    //return sampledColor;
    //}
    if (id == WATER) {
        let noiseSpeed = 3.0;
        let noise = perlinNoise3(vec3<f32>(floor(pos) / 6, time * 0.001 * noiseSpeed)) + perlinNoise3(vec3<f32>(floor(pos) / 2, time * 0.003 * noiseSpeed)) / 2;
        //let noise = perlinNoise3(vec3<f32>(floor(pos) / 6, time * 0.001 * noiseSpeed));
        //let noise = perlinNoise3(vec3<f32>(floor(pos) / 6, 0));
        //let noise = perlinNoise2(vec2<f32>(floor(pos) / 6));
        //if (noise > 1) {
        //return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        //}
        //if (noise < 0) {
        //return vec4<f32>(1.0, 1.0, 0.0, 1.0);
        //}
        //let noise = perlinNoise3(vec3<f32>(floor(pos) / 6, time * 0.001 * noiseSpeed)) - fade31(abs(1 - fract(time * 0.001 * noiseSpeed / 2) * 2)) * 0.2;
        //let noise = perlinNoise3(vec3<f32>(floor(pos) / 6, time * 0.001 * noiseSpeed)) - perlinNoise3(vec3<f32>(floor(pos) / 6, 1 + time * 0.001 * noiseSpeed)) + perlinNoise3(vec3<f32>(floor(pos) / 2, time * 0.003 * noiseSpeed)) / 2 - perlinNoise3(vec3<f32>(floor(pos) / 2, 1 + time * 0.003 * noiseSpeed)) / 2;
        //return vec4<f32>(0.4 - (noise + 1) * 0.1, 0.45 - (noise + 1) * 0.15, 1.0, 1.0);
        //return vec4<f32>(0.4 - noise * 0.2, 0.45 - noise * 0.3, 1.0, 1.0);
        return vec4<f32>(0.3 - noise * 0.1, 0.3 - noise * 0.15, 1.0, 1.0);
        //return vec4<f32>(0.4 - noise * 0.1, 0.7 - noise * 0.5, 1.0, 1.0); // rps
        //return vec4<f32>(0.1 - noise * 0.1, 0.5 - noise * 0.25, 1.0, 0.5);
    }
    if (id == ICE) {
        let noiseSpeed = 0.1;
        let noise = perlinNoise3(vec3<f32>(floor(pos) / 6, time * 0.001 * noiseSpeed)) + perlinNoise3(vec3<f32>(floor(pos) / 2, time * 0.003 * noiseSpeed)) / 2;
        //return vec4<f32>(0.725 - noise * 0.025, 0.75 - noise * 0.05, 0.95 - noise * 0.025, 1.0);
        return vec4<f32>(185.0 / 255 - noise * 5.0 / 255, 190.0 / 255.0 - noise * 10.0 / 255.0, 247.5 / 255.0 - noise * 7.5 / 255.0, 1.0);
    }
    if (id == 111) {
        let noiseSpeed = 0.1;
        let noise = perlinNoise2(floor(pos) / 3) + perlinNoise2(floor(pos) / 1) / 2;
        //return vec4<f32>(0.725 - noise * 0.025, 0.75 - noise * 0.05, 0.95 - noise * 0.025, 1.0);
        return vec4<f32>(230.0 / 255.0, 240.0 / 255.0 - noise * 10.0 / 255.0, 240.0 / 255.0 - noise * 10.0 / 255.0, 1.0);
    }
    if (id == STEAM) {
        let noiseSpeed = 6.0;
        let noise = perlinNoise3(vec3<f32>(floor(pos) / 6, time * 0.001 * noiseSpeed)) + perlinNoise3(vec3<f32>(floor(pos) / 2, time * 0.003 * noiseSpeed)) / 2;
        return vec4<f32>(212.5 / 255 - noise * 12.5 / 255, 212.5 / 255 - noise * 12.5 / 255, 212.5 / 255 - noise * 12.5 / 255, 1.0);
    }
    if (id == LAVA) {
        let noiseSpeed = 0.5;
        let noise = perlinNoise3(vec3<f32>(floor(pos) / 6, time * 0.001 * noiseSpeed)) + perlinNoise3(vec3<f32>(floor(pos) / 2, time * 0.003 * noiseSpeed)) / 2;
        return vec4<f32>(1.0, 0.5 + noise * 0.5, 0.0, 1.0);
    }
    if (id == IRON) {
        let noise = perlinNoise2(floor(pos) / 6) + perlinNoise2(floor(pos) / 2) / 2;
        //noise *= 5;
        //noise = 1;
        //return vec4<f32>(0.725 - noise * 0.025, 0.75 - noise * 0.05, 0.95 - noise * 0.025, 1.0);
        //return vec4<f32>(190.0 / 255.0 - noise * 30.0 / 255.0, 180.0 / 255.0 - noise * 20.0 / 255.0, 150.0 / 255.0 - noise * 30.0 / 255.0, 1.0);
        return vec4<f32>(190.0 / 255.0 - noise * 30.0 / 255.0, 180.0 / 255.0 - noise * 20.0 / 255.0, 150.0 / 255.0 + noise * 30.0 / 255.0, 1.0);
        //return vec4<f32>(100.0 / 255.0 - noise * 100.0 / 255.0, 0.0, 0.0, 1.0);
        //return vec4<f32>(1.0, 0.5 + noise * 0.5, 0.0, 1.0);
    }
    let index = (u32(pos.x) + u32(pos.y) * grid_size.x) * stride;
    if (id == LAG_SPIKE_GENERATOR) {
        return vec4<f32>(0.5, 1.0, 0.0, random(index + u32(time * 1000)));
    }
    if (id == MOSS) {
        let noise = perlinNoise2(floor(pos) / 6) + perlinNoise2(floor(pos) / 2) / 2 + random(index) - 0.5;
        return vec4<f32>(37.5 / 255.0 - noise * 37.5 / 255.0, 162.5 / 255.0 - noise * 37.5 / 255.0, 25.0 / 255.0 + noise * 25.0 / 255.0, 1.0);
    }
    if (id == LICHEN) {
        let noise = perlinNoise2(floor(pos) / 6) + perlinNoise2(floor(pos) / 2) / 2 + random(index) - 0.5;
        return vec4<f32>(255.0 / 255.0 - noise * 125.0 / 255.0, 225.0 / 255.0 + noise * 125.0 / 255.0, 25.0 / 255.0, 1.0);
    }
    //return vec4<f32>(id, 0.0, 0.0, 1.0);
    return colors[u32(id) * 2] + random(index) * colors[u32(id) * 2 + 1];
    //return colors[u32(id) * 2];
    //return colors[u32(id)];
    //return colors[u32(id)] + random(index) * noise_colors[u32(id)];
    //if (id < 2) {
    //}
    //return color;
}
fn get_fire_color(color: vec4<f32>, pos: vec2<f32>) -> vec4<f32> {
    let index = (u32(pos.x) + u32(pos.y) * grid_size.x) * stride;
    var noise = perlinNoise2(vec2<f32>(floor(pos) / 6)) + perlinNoise2(vec2<f32>(floor(pos) / 3)) * 0.25 + perlinNoise2(vec2<f32>(floor(pos) / 2)) * 0.75;
    // noise = noise * (random(index) * 1.5 + 0.25) / 1.25;
    noise = noise * (random(index) * 1.5 + 0.25);
    //noise = noise + (random(index) - 0.5);
    //return vec4<f32>(1.0, 0.4 + noise * 0.3, 0.0, 0.3);
    //(x * 0.7 + (1, 0.4, 0) * 0.3) * 0.7 + (1, 1, 0) * noise * 0.3
    //x * 0.49 + (0.21, 0.084, 0) + (0.3, 0.3, 0) * noise
    //return color * 0.49 + vec4<f32>(0.21, 0.084, 0.0, 0.51) + vec4<f32>(0.3, 0.3, 0.0, 0.0) * noise;
    //return color * 0.5 + vec4<f32>(1.0, 0.4 + noise * 0.3, 0.0, 1.0) / 2;
    //return color * (1 - (0.3 + 0.05 * noise)) + vec4<f32>(1.0 + noise, 0.4 + noise * 0.3, 0.0, 1.0) * (0.3 + 0.05 * noise);
    //return vec4<f32>(1.0 + noise, 0.4 + noise * 0.3, 0.0, 1.0);
    // return mix(color, vec4<f32>(1.0, 0.55 + noise * 0.15, 0.0, 1.0), 0.575 + noise * 0.025); old with /1.25
    return mix(color, vec4<f32>(1.0, 0.55 + noise * 0.1, 0.0, 1.0), 0.575 + noise * 0.02);
    //return color * (1 - (0.3)) + vec4<f32>(1.0, 0.4 + noise * 0.3, 0.0, 1.0) * (0.3);
}
fn get_background_color(pos: vec2<f32>) -> vec4<f32> {
    let index = (u32(pos.x) + u32(pos.y) * grid_size.x) * stride;
    var noise = perlinNoise2(vec2<f32>(floor(pos) / 6)) + perlinNoise2(vec2<f32>(floor(pos) / 3)) * 0.25 + perlinNoise2(vec2<f32>(floor(pos) / 2)) * 0.75;
    noise = noise * (random(index) * 1.5 + 0.25) / 1.25;
    // return vec4<f32>(1.0, 0.55 + noise * 0.15, 0.0, 1.0);
    return vec4<f32>(1.0, 1.0, 1.0, 0.5);
}

@fragment
fn fs_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    //return vec4<f32>(pos.xy / viewport, 0.0, 1.0);
    //return vec4<f32>(1.0, 0.0, 1.0, 1.0);
    //let new_pos = floor(pos.xy * camera.zw + camera.xy);
    var new_pos = pos.xy / camera.zw + camera.xy;
    let floor_pos = (new_pos - floor(new_pos));
    // if ((new_pos - floor(new_pos)).x >= 0.99) {
    //     new_pos.x -= 0.01;
    // }
    // if ((new_pos - floor(new_pos)).y >= 0.99) {
    //     new_pos.y -= 0.01;
    // }
    // massive spaghetti but it fixes bug
    if ((new_pos - floor(new_pos)).x >= 0.99) {
        new_pos.x -= 0.01;
    }
    if ((new_pos - floor(new_pos)).y >= 0.99) {
        new_pos.y -= 0.01;
    }
    if ((new_pos - floor(new_pos)).x <= 0.01) {
        new_pos.x += 0.01;
    }
    if ((new_pos - floor(new_pos)).y <= 0.01) {
        new_pos.y += 0.01;
    }
    if (new_pos.x < 0 || u32(new_pos.x) >= grid_size.x || new_pos.y < 0 || u32(new_pos.y) >= grid_size.y) {
        //return vec4<f32>(0.0, 0.0, 0.0, 1.0);
        //return vec4<f32>(0.2, 0.2, 0.2, 1.0);
        discard;
    }
    let index = (u32(new_pos.x) + u32(new_pos.y) * grid_size.x) * stride;
    var texture_pos = (new_pos - floor(new_pos)) * textures[u32(grid[index])].zw + textures[u32(grid[index])].xy;
    let background_color = get_background_color(new_pos);
    //if (camera.z < 8.0) {
        //texture_pos = textures[u32(grid[index])].xy;
    //}

    /// IMPORTANT !!! LINE FIX
    // if ((new_pos - floor(new_pos)).x >= 0.9) {
    //     texture_pos.x -= 0.1 * textures[u32(grid[index])].z;
    // }
    // if ((new_pos - floor(new_pos)).y >= 0.9) {
    //     texture_pos.y -= 0.1 * textures[u32(grid[index])].w;
    // }
    //texture_pos = vec2<f32>(7.0, 4.0);
    if (grid[index] == ROTATOR_CLOCKWISE || grid[index] == ROTATOR_COUNTERCLOCKWISE) {
        texture_pos.x += (floor(time * 0.001 * 6) % 4) * textures[u32(grid[index])].z;
        // texture_pos.x += 3.0;
    }
    if (grid[index] == DETONATOR) {
        texture_pos.x += (floor(time * 0.001 * 2) % 2) * textures[u32(grid[index])].z;
        // texture_pos.x += 3.0;
    }
    // if (grid[index] == 41) {
    //     texture_pos.x += (2.5 - abs(4.5 - floor(time * 0.001 * 10 + 2) % 10)) * textures[u32(grid[index])].z;
    //     texture_pos.y += (floor((time * 0.001 * 10 + 2) / 5) % 2) * (1 - (new_pos - floor(new_pos)).y * 2) * textures[u32(grid[index])].w;
    //     // if ()
    //     // texture_pos.x += 3.0;
    // }
    let sampledColor = textureSample(pixelTexture, pixelSampler, texture_pos);
    var color: vec4<f32>;
    // if (u32(grid[index]) == 0) {
    //     color = background_color;
    // }
    // else
    if (textures[u32(grid[index])].x == -1) {
        color = get_color(grid[index], vec4<f32>(grid[index + 3], grid[index + 4], grid[index + 5], grid[index + 6]), new_pos);
    }
    else {
        color = sampledColor;
        // if (color.w == 0.0) {
        //     // color = vec4<f32>(1.0, 1.0, 1.0, 1.0);
        // }
    }
    if (grid[index] == LASER_LEFT && floor_pos.x * 6 <= 3 && floor_pos.y * 6 >= 2 && floor_pos.y * 6 <= 4) {
        color = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 3) + 1) / 2);
    }
    if (grid[index] == LASER_UP && floor_pos.x * 6 >= 2 && floor_pos.x * 6 <= 4 && floor_pos.y * 6 <= 3) {
        color = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 3) + 1) / 2);
    }
    if (grid[index] == LASER_RIGHT && floor_pos.x * 6 >= 3 && floor_pos.y * 6 >= 2 && floor_pos.y * 6 <= 4) {
        color = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 3) + 1) / 2);
    }
    if (grid[index] == LASER_DOWN && floor_pos.x * 6 >= 2 && floor_pos.x * 6 <= 4 && floor_pos.y * 6 >= 3) {
        color = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 3) + 1) / 2);
    }
    if (grid[index] == DELETER && floor_pos.x * 4 >= 1 && floor_pos.x * 4 <= 3 && floor_pos.y * 4 >= 1 && floor_pos.y * 4 <= 3) {
        // color = mix(vec4<f32>(0.8, 0.0, 1.0, 1.0), vec4<f32>(1.0, 0.0, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 1000 / 96) + 1) / 2);
        color = mix(vec4<f32>(0.8, 0.0, 1.0, 1.0), vec4<f32>(1.0, 0.0, 1.0, 1.0), (sin(time * 0.001 * 3.1415) + 1) / 2);
    }
    if (color.w != 1.0) {
        color = mix(background_color, color, color.w);
        // color = mix(color, vec4<f32>(1.0, 1.0, 1.0, 1.0), color.w);
        color.w = 1.0;
    }
    //var color = get_color(grid[index], vec4<f32>(grid[index + 3], grid[index + 4], grid[index + 5], grid[index + 6]), new_pos);
    if (grid[index + 1] == 1.0) {
        color = get_fire_color(color, new_pos);
    }
    //if (grid[index] != 0) {
    //color.r = abs(grid[index + 1] / 10);
    //color.g = abs(grid[index + 2] / 10);
    //}
    var id: u32 = 0;
    if (selection_grid[0] != -1) {
        if (new_pos.x >= brush[0] && new_pos.x < brush[0] + brush[2] && new_pos.y >= brush[1] && new_pos.y < brush[1] + brush[3]) {
            let index_2 = (u32(new_pos.x - brush[0]) + u32(new_pos.y - brush[1]) * u32(brush[2])) * stride;
            id = u32(selection_grid[index_2]);
        }
    }
    else {
        if (new_pos.x >= brush[0] - brush[2] + 1 && new_pos.x < brush[0] + brush[2] && new_pos.y >= brush[1] - brush[2] + 1 && new_pos.y < brush[1] + brush[2]) {
            id = u32(brush[3]);
        }
    }
    var texture_pos2 = (new_pos - floor(new_pos)) * textures[u32(id)].zw + textures[u32(id)].xy;
    if (id == ROTATOR_CLOCKWISE || id == ROTATOR_COUNTERCLOCKWISE) {
        texture_pos2.x += (floor(time * 0.001 * 6) % 4) * textures[u32(id)].z;
    }
    if (id == DETONATOR) {
        texture_pos2.x += (floor(time * 0.001 * 2) % 2) * textures[u32(id)].z;
    }
    let sampledColor2 = textureSample(pixelTexture, pixelSampler, texture_pos2);
    if (selection_grid[0] != -1) {
        if (new_pos.x >= brush[0] && new_pos.x < brush[0] + brush[2] && new_pos.y >= brush[1] && new_pos.y < brush[1] + brush[3]) {
            let index_2 = (u32(new_pos.x - brush[0]) + u32(new_pos.y - brush[1]) * u32(brush[2])) * stride;
            var color_2: vec4<f32>;
            if (textures[u32(id)].x == -1) {
                color_2 = get_color(selection_grid[index_2], vec4<f32>(selection_grid[index_2 + 3], selection_grid[index_2 + 4], selection_grid[index_2 + 5], selection_grid[index_2 + 6]), new_pos);
            }
            else {
                color_2 = sampledColor2;
            }
            if (selection_grid[index_2] == LASER_LEFT && floor_pos.x * 6 <= 3 && floor_pos.y * 6 >= 2 && floor_pos.y * 6 <= 4) {
                color_2 = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 2) + 1) / 2);
            }
            if (selection_grid[index_2] == LASER_UP && floor_pos.x * 6 >= 2 && floor_pos.x * 6 <= 4 && floor_pos.y * 6 <= 3) {
                color_2 = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 2) + 1) / 2);
            }
            if (selection_grid[index_2] == LASER_RIGHT && floor_pos.x * 6 >= 3 && floor_pos.y * 6 >= 2 && floor_pos.y * 6 <= 4) {
                color_2 = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 2) + 1) / 2);
            }
            if (selection_grid[index_2] == LASER_DOWN && floor_pos.x * 6 >= 2 && floor_pos.x * 6 <= 4 && floor_pos.y * 6 >= 3) {
                color_2 = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 2) + 1) / 2);
            }
            if (color_2.w != 1.0) {
                color_2 = mix(background_color, color_2, color_2.w);
                color_2.w = 1.0;
            }
            if (selection_grid[index_2 + 1] == 1.0) {
                color_2 = get_fire_color(color_2, new_pos);
            }
            color = mix(color, color_2, 0.5 * color_2.w);
        }
    }
    else {
        if (new_pos.x >= brush[0] - brush[2] + 1 && new_pos.x < brush[0] + brush[2] && new_pos.y >= brush[1] - brush[2] + 1 && new_pos.y < brush[1] + brush[2]) {
            if (brush[3] == FIRE) {
                color = get_fire_color(color, new_pos);
            }
            else {
                var color_2: vec4<f32>;
                // if (u32(id) == 0) {
                //     color_2 = background_color;
                // }
                if (textures[u32(id)].x == -1) {
                    color_2 = get_color(brush[3], vec4<f32>(brush[4], brush[5], brush[6], brush[7]) + random(index) * vec4<f32>(brush[8], brush[9], brush[10], brush[11]), new_pos);
                }
                else {
                    color_2 = sampledColor2;
                }
                if (id == LASER_LEFT && floor_pos.x * 6 <= 3 && floor_pos.y * 6 >= 2 && floor_pos.y * 6 <= 4) {
                    color_2 = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 2) + 1) / 2);
                }
                if (id == LASER_UP && floor_pos.x * 6 >= 2 && floor_pos.x * 6 <= 4 && floor_pos.y * 6 <= 3) {
                    color_2 = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 2) + 1) / 2);
                }
                if (id == LASER_RIGHT && floor_pos.x * 6 >= 3 && floor_pos.y * 6 >= 2 && floor_pos.y * 6 <= 4) {
                    color_2 = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 2) + 1) / 2);
                }
                if (id == LASER_DOWN && floor_pos.x * 6 >= 2 && floor_pos.x * 6 <= 4 && floor_pos.y * 6 >= 3) {
                    color_2 = mix(vec4<f32>(1.0, 0.0, 0.55, 1.0), vec4<f32>(0.25, 0.45, 1.0, 1.0), (sin(time * 0.001 * 3.1415 * 2) + 1) / 2);
                }
                if (color_2.w != 1.0) {
                    color_2 = mix(background_color, color_2, color_2.w);
                    color_2.w = 1.0;
                }
                color = mix(color, color_2, 0.5 * color_2.w);
            }
        }
    }
    return color;
}