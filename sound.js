import { settings } from "./game.js";

const audioCtx = new AudioContext();

const globalGain = audioCtx.createGain();
globalGain.connect(audioCtx.destination);

const volumeSliderButton = document.getElementById("volumeSliderButton");
const volumeSlider = document.getElementById("volumeSlider");

volumeSliderButton.onclick = () => {
    if (settings.volume == 0) {
        settings.volume = 100;
    }
    else {
        settings.volume = 0;
    }
    volumeSlider.value = settings.volume;
    volumeSlider.oninput();
};
volumeSlider.oninput = () => {
    settings.volume = Number(volumeSlider.value);
    if (settings.volume == 0) {
        volumeSliderButton.style.backgroundPosition = "0% 0%";
    }
    else if (settings.volume < 50) {
        volumeSliderButton.style.backgroundPosition = "-100% 0%";
    }
    else {
        volumeSliderButton.style.backgroundPosition = "-200% 0%";
    }
    globalGain.gain.value = settings.volume / 100;
};

// playSound function
// playMusic function

let sounds = {};

let currentMusic = null;
let nextMusicTimeout = null;

function playSound(id, volume = 1) {
    if (sounds[id].length == 0) {
        setTimeout(() => {
            playSound(id, volume)
        }, 100);
        return;
    }
    let source = new AudioBufferSourceNode(audioCtx, {
        buffer: sounds[id][Math.floor(Math.random() * sounds[id].length)].buffer,
    });
    let gain = audioCtx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(globalGain);
    source.onended = () => {
        source.disconnect();
        gain.disconnect();
    };
    source.start();
};

function playMusic(id) {
    if (id != null && sounds[id].length == 0) {
        setTimeout(() => {
            playMusic(id);
        }, 100);
        return;
    }
    if (currentMusic != null) {
        clearTimeout(nextMusicTimeout);
        currentMusic.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        let lastMusic = currentMusic;
        setTimeout(() => {
            lastMusic.source.onended = () => {};
            lastMusic.source.stop();
            lastMusic.source.disconnect();
            lastMusic.gain.disconnect();
        }, 1000);
    }
    if (id != null) {
        let sound = sounds[id][Math.floor(Math.random() * sounds[id].length)];
        let source = new AudioBufferSourceNode(audioCtx, {
            buffer: sound.buffer,
        });
        let gain = audioCtx.createGain();
        source.connect(gain);
        gain.connect(globalGain);
        function loop() {
            source.disconnect();
            sound = sounds[id][Math.floor(Math.random() * sounds[id].length)];
            source = new AudioBufferSourceNode(audioCtx, {
                buffer: sound.buffer,
            });
            source.connect(gain);
            source.start();
            nextMusicTimeout = setTimeout(loop, sound.buffer.duration * 1000 + Math.random() * 10000 + 5000);
        };
        nextMusicTimeout = setTimeout(loop, sound.buffer.duration * 1000 + Math.random() * 10000 + 5000);
        if (currentMusic != null) {
            setTimeout(() => {
                // gain.gain.value = 0;
                // gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1);
                source.start();
            }, 2000);
        }
        else {
            source.start();
        }
        currentMusic = {
            source: source,
            gain: gain,
        };
    }
    else {
        currentMusic = null;
    }
};

async function loadSound(id, src, detune = 0) {
    if (sounds[id] == null) {
        sounds[id] = [];
    }
    sounds[id].push({
        buffer: await audioCtx.decodeAudioData(await (await fetch(src)).arrayBuffer()),
        detune: detune,
    });
};


document.onvisibilitychange = () => {

};

export { playMusic };