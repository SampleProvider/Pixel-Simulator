import { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, tick, modal, setRunState, downloadFile, uploadFile, generateSaveCode, parseSaveCode, loadSaveCode, drawBlueprintImg, mouseX, mouseY, resetGrid } from "./game.js";
import { pixels, pixelInventory, resetPixelInventory, pixelInventoryUpdates, updatePixelInventory } from "./pixels.js";
import { transitionIn, transitionOut, slideInPuzzles } from "./menu.js";
import { playMusic } from "./sound.js";

const ID = 0;
const PUZZLE_DATA = 2;

let puzzles = {
    "pixel_simulator": {
        id: "pixel_simulator",
        name: "Pixel Simulator",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-239:concrete_powder:air-29:concrete_powder:air-28:concrete_powder-2:air-28:concrete_powder-2:air-27:concrete_powder-3:air-27:concrete_powder-3:air-26:concrete_powder-4:air-22:concrete-8:air-27:concrete:air-30:concrete:air-30:concrete:air-60:water-11:sand-2:air-15:grass-2:mud-2:water-8:sand-3:grass-9:air-3:grass-3:dirt-4:mud-4:water-3:gravel:sand-2:dirt-10:grass-3:dirt-11:gravel-4:sand:dirt-26:gravel-2:sand:dirt-50:stone-2:dirt-20:stone-5:dirt-3:stone-3:dirt-2:stone-7:dirt-6:stone-72;0:900;0-900;",
        inventory: {
            dirt: 100,
            grass: 100,
            mud: 100,
            sand: 100,
            gravel: 100,
            concrete_powder: 100,
            concrete: 100,
            water: 100,
            stone: 100,
        },
        objectives: [
            {
                type: "ticks",
                target: 100,
            },
        ],
        img: "data:image/png;base64,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",
        official: true,
    },
    "gravity": {
        id: "gravity",
        name: "Gravity",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-490:leaves-3:air-8:leaves-3:air-15:leaves-5:air-5:leaves-6:air-14:leaves-2:wood:leaves-2:air-4:leaves-3:wood:leaves-3:air-15:leaves:wood:leaves:air-5:leaves-3:wood:leaves-3:air-4:sand:air-11:wood:air-7:leaves:wood:leaves-3:air-4:sand-2:grass-2:air-9:wood:air-8:wood:air-6:sand-3:dirt-2:grass:air-8:wood:air-8:wood:air-5:sand-4:dirt-3:grass-2:air:monster:air-4:grass-8:air:wood:air-4:sand-5:dirt-5:grass-6:dirt-8:monster:grass:air-2:monster:sand-4:dirt-23:grass-5:dirt-124;0:900;0-450:1-450;",
        inventory: {
            dirt: 1,
            sand: 1,
            water: 1,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,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",
        official: true,
    },
    "mudslide": {
        id: "mudslide",
        name: "Mudslide",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;20-20;air-42:water:air-164:dirt:air-18:dirt-3:air-17:dirt-3:air-16:dirt-5:air-15:dirt-5:concrete:air-8:grass:air-4:dirt-6:concrete:air-8:grass:air-3:dirt-7:concrete:air-7:grass:dirt:air-2:dirt-8:concrete-4:air:monster:air:grass:dirt-16:grass:dirt:grass:dirt-23;0:400;1-5:0-4:1-16:0-4:1-16:0-4:1-16:0-4:1-16:0-4:1-11:0-9:1-11:0-9:1-11:0-9:1-11:0-9:1-231;",
        inventory: {
            wood: 10,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAAAXNSR0IArs4c6QAAA4dJREFUeF7t3T1y1EAQxfFRSmwCHHANcwf7GOYYEHAN+xAEOgROfAgSAohJRfkDV61Lo1Vb86zX47/jUW/r/aYlWVDrYZqmqfDTbQIDwN3a3p8YwH37Aty5L8AA955A5+fHPRjgzhPo/PSYYIA7T6Dz02OCAe48gc5PLzzBF5/nExmvOk8q6ekBnBRubdsAr00q6TqAk8KtbRvgtUklXQdwUri1bYeB1xZmnUcCAHs4yLoAWBatR2GAPRxkXQAsi9ajMMAeDrIuAJZF61EYYA8HWRcAy6L1KAywh4OsC4Bl0XoUBtjDQdYFwLJoPQoD7OEg6wJgWbQehQH2cJB1AbAsWo/CAHs4yLoAWBatR2GAPRxkXQAsi9ajMMAeDrIuAJZF61EYYA8HWRcAy6L1KAywh4OsC4Bl0XoUBtjDQdYFwLJoPQoD7OEg6wJgWbQehQH2cJB1AbAsWo/CAHs4yLoAWBatR2GAPRxkXQAsi9ajMMAeDrIuAJZF61EYYA8HWRcAy6L1KAywh4OsizTAXy+G2RC+jfzpxaXdAbBsdjwKA+zhIOsCYFm0HoUB9nCQdQGwLFqPwnbAtaflaFw8XT8kBnB05yRbD3AysGi7AEcTS7Ye4GRg0XYBjiaWbD3AycCi7QIcTSzZeoCTgUXbBTiaWLL1ACcDi7YLcDSxZOt3A271zjma91t7Rw1wdIckWw9wMrBouwBHE0u2HuBkYNF2AY4mlmz9mwO+LeezROM4JqM7bPf0++ls/wA/xgJw4/291+/BTHBjyFo5gNsGzSX6MU8muO3GqlZjgtsGvdsE7wVZi48JbruxCsCNA62UY4K5B2t2GhOsyfV5VSaYCdbsNCZYk+urT7AbZK9P0bVL8eX1L+27aID3nVSAO7kHM8FHBin7iw6AAT5IoNm/B3MP7uQenAUy+hTdiqf2Hwdu3s9/U9/Z7/lv6oteimv9hycY4OWtsAT86U8p08eH44efpfw4KQXgVqN15Cm61ccsAZ+9O/yUm78At8r9qU7tKbrVBwHcKskX1tkT+O4S/f/n7lLNBL8QcemwPYHn+pLfg7+cF75wueFGur78MFut9ioxuj7a6gBwNLLl9VGw6PpotwBHEzuyPgoWXR9tF+BoYgA3TixZuehERtdH42CCo4kxwY0To9ymBJjgTfH5Hwywv9GmDgHeFJ//wQD7G23qEOBN8fkf/A83u+ZvMKuvoQAAAABJRU5ErkJggg==",
        official: true,
    },
    "lava": {
        id: "lava",
        name: "Lava",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;20-20;air-232:wood-8:air-12:wood:air-19:wood:air-19:wood:air-5:monster:air:grass-9:air-3:wood:air:monster:air-2:monster-2:air:dirt-9:grass-3:dirt:grass:dirt:grass-2:dirt-2:grass:dirt-60;0:400;0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-10:0-10:1-19:0:1-90;",
        inventory: {
            lava: 1,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAAAXNSR0IArs4c6QAAAxtJREFUeF7tmzFyE0EQRWdTYhwo4RrmDjjwIcwxSLgEie9A4kPY1yCwA4hJl1pcwgJ2ND1jUWw/P0UqVe9U///297ZUpWme57n4wjowCRjL9qcwAbP5ChjOV8ACpjsA1+czWMBwB+DyTLCA4Q7A5ZlgAcMdgMszwQKGOwCXZ4IFDHcALs8ECxjuAFyeCRYw3AG4PBMsYLgDcHkmWMBwB+DyTLCA4Q7A5ZlgAcMdgMszwQKGOwCXZ4IFDHcALs8ECxjuAFyeCRYw3AG4PBMsYLgDcHkmWMBwB+DyTLCA4Q7A5ZlgAcMdgMszwQKGOwCXZ4IFDHcALs8ECxjuAFyeCRYw3AG4PBMsYLgDcHkmWMBwB+DyTLCA4Q7A5ZlgAcMdgMszwQKGOwCXZ4IFDHcALs8ECxjuAFyeCW4A/vT+4lfFbvdU/PDw9H7LnwtYwPAZJmAB7x3Y8iiuPTIc0SbYBJtg8D1Q26IvP96kUO2IHhzRAk5xf7ebNMFtj1JXCDg1vnbzAm57lLpCwKnxtZsXcNuj1BUCTo2v3byA2x6lrhBwanzt5gXc9ih1hYBT42s3vzXAd2fTatPnX+fVz/0tOtlv0Qvgt99Kmd88Nj59KeX2dSkCbod1tWKLCT5/9Xurd98FPIi3FAEPW5fjwi0CXkb0/rWMahP8jHtpi4DX5FSfwbvPu/X16xmmbOHS+8v7k7TRC7h3y601WTunVi/gQdwjgHu23GOA185Z6nvOn0zwcfIjgHu23GOA185Z6nvOF/CJvwcvo7UHgIAHR+v/fAb3bLmtEf3ntrwf0eEt2hF9+hHds+X+8yXrw7uC3KKvrw7+Cjg4BZbLrq4P/kZ4cE7t/N76Wmu1c2r1tX4mAR+n3wust17Ag+kzwY/GmeDGDdSbyN56E2yCQw74DA7Z9HdRbyJ7603wIBgvgz+DBSzgF3EPYLfoF0EvIFLAAZMylwg4M71A7wIOmJS5RMCZ6QV6F3DApMwlAs5ML9C7gAMmZS4RcGZ6gd4FHDApc4mAM9ML9C7ggEmZSwScmV6gdwEHTMpcIuDM9AK9/wBOUfEx1WTICAAAAABJRU5ErkJggg==",
        official: true,
    },
    "breaking_game": {
        id: "breaking_game",
        name: "Breaking Game",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-433:concrete-13:air-17:concrete-13:air-17:concrete-13:air-17:concrete-13:air-7:leaves-3:air-7:concrete-4:wood-5:concrete-4:air-6:leaves-5:air-6:concrete-4:wood:air-3:wood:concrete-4:air-6:leaves-2:wood:leaves-2:air-6:concrete-4:wood:air-3:wood:concrete-4:air-7:leaves:wood:leaves:air-7:concrete-4:wood:air:monster:air:wood:concrete-4:air-8:wood:air-8:concrete-4:wood-5:concrete-4:air-8:wood:air-8:concrete-13:air-8:wood:air:grass-7:concrete-13:grass-4:air:grass-5:dirt-7:concrete-13:dirt-4:grass:dirt-12:concrete-13:dirt-94;0:900;0-390:1-510;",
        inventory: {
            lava: 1,
            wood: 8, // unnecessary
            plant: 1,
            sponge: 1,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,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",
        official: true,
    },
    "platformer": {
        id: "platformer",
        name: "Platformer",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-275:monster:air-2:monster:air:monster:air-22:wood-9:air-25:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-29:wood:air-14:concrete:air-14:wood:air-10:grass-4:concrete:lava-7:water-7:wood:water-7:mud:grass-2:dirt-4:concrete:lava-7:mud-2:water-5:wood:water-4:mud-3:dirt-7:concrete-8:dirt-2:mud-5:dirt:mud-4:dirt-48;0:900;1-520:0-20:1-10:0-20:1-10:0-20:1-10:0-20:1-10:0-20:1-240;",
        inventory: {
            sand: 15,
            wood: 25,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAAAXNSR0IArs4c6QAABbdJREFUeF7t2T1uE20YheFxS0MDSEaImpoGCnaQFCwCxAKoadgETRaBUNgDaaipEVIkoKGhNQp/4ceO53knnhnf56ZCn97xzDnnij/jLFar1arzjw1AGlgIGrKkMb43IGghoBoQNGpOwwhaA6gGBI2a0zCC1gCqAUGj5jSMoDWAakDQqDkNI2gNoBoQNGpOwwhaA6gGBI2a0zCC1gCqAUGj5jSMoDWAakDQqDkNI2gNoBoQNGpOwwhaA6gGBI2a0zCC1gCqAUGj5jSMoDWAakDQqDkNI2gNoBoQNGpOwwhaA6gGBI2a0zCC1gCqAUGj5jSMoDWAakDQqDkNI2gNoBoQNGpOwwhaA6gGBI2a0zCC1gCqAUGj5jSMoDWAakDQqDkNI2gNoBoQNGpOwwhaA6gGBI2a0zCC1gCqAUGj5jSMoDWAakDQqDkNI2gNoBoQNGpOwwhaA6gGBI2a0zCTgT65vljb/r1Pq9Iq1depni89jIcnb2BS0Pc/d93q9o8OFu+77s21rmsBXXmdM9CV85Mv5AOUGpgU9L0rfz/rydc20JXXOQNdOV9q08OTNyDorutafpAmX84HWNvApKDP/tf/68/ZR48WWL8+QvR9nep53exXA5OCXldVy2foyuv4j8L9Alp92ksD/eLx4e97L5fnj3F6ev73ffzvD58fVzv1/IQNCPpn+Zt+8AQ9oc6GWwta0A1s5nuJoAU9X50NTyZoQTewme8lghb0fHU2PNmlgW64d+mSTd+i+I+2Uo34w4LGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbU3Pq2g8RNnBRR01t74tILGT5wVUNBZe+PTCho/cVZAQWftjU8raPzEWQEFnbX31rSHh4drzxwfH2+9dg4HBD2HFWb0DIIeaYwXj8/fOZbL85s+fL4f7xwj1TT4NoIeXGG/FxB0v56GnhL00AZ7Xi/onkUNPCbogQX2vVzQfZsadk7Qw/rrfbWgf1R18+XN3p21HLx7dHf9txzL1y0vN/o1fssxeuXDbijoi/sT9DBfo18taEGPjm6XNxS0oHfpa/TXFrSgR0e3yxsKegvog0er1S4HuKzXPujW/6bw6HQ/flN4691ibRWvnv7xa88eZT06Ou1xqv3I2+5gv7/lEHT7+JUrBV1pq/3sQtDt5VWuFHSlrfazgm7vrnSloEt1NR8WdHN1tQsFXeur9bSgW5srXifoYmGNxxdPHnSlbzk+3Ckdb3ys/y+b6luOTRCrwW5crV4xzflN33JM8zT1uwp6S2eCrqOa8gpBC/qvBnyHHunH0Y8c4xQt6HF67gQ9TtGCHqdnQY/U896DfnZQ+5bj45eRmv3nNpu+Jdj18+zLtxPTrDK/uy4EffEogp4f2oueSNBb9hK0oHfSgB85dlIr7kV9h/YdGoVa0ILOBo1KbxhcA+V3aFwDBkI1IGjUnIYRtAZQDQgaNadhBK0BVAPfACCeG9QvJiCDAAAAAElFTkSuQmCC",
        official: true,
    },
    "rafting": {
        id: "rafting",
        name: "Rafting",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-604:monster:air:monster:air-2:monster:air-23:wood-9:air-18:water-3:wood-9:water-228;0:900;1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-420;",
        inventory: {
            sand: 6,
            concrete_powder: 6,
            wood: 5,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAAAXNSR0IArs4c6QAABLhJREFUeF7t2jFyG2QUhVG5pYYiDdsIewgFi4CNsAkalsEiyDZoXEBNKyYEyDAjy+iNkJ6+Oa4yHv3Sf+89dmSPn47H4/HgQwORBp6Ajiwpxp8NAA1CqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6NacwQDOQagDo1JzCAM1AqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6NacwQDOQagDo1JzCAM1AqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6NacwQDOQagDo1JzCAM1AqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6NacwQDOQagDo1JzCAM1AqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6Nacw/zvo9188nWz57a/Hk5+/9PEvTXit50HksRq4Ceivfjscjl9+LObpl8Ph588Ph3OgL3n8OdDXeJ7HmtNtbwL67Wf/Lvr97+dBX/L4c6Cv8TyIPFYDQD/WXm77SgM3Af3hv/6/Pz689XjtO/Qlj3/tLcd/fV1SGg3cBPSpqvxQ2AC0LcXVQP/w3df/ZHvz5lPM5+dP/37Ez3/z/U/bNnOfMw0A/Vc5L33hAf1YXz9AA/1YYm/1Q6G3HCkXDxvGd2jfoR8W76mLAw10C/S7b4+n/6jiwpjvDs3fcvz47LccF1K468OfgP7Y/0u/5QD6rj4vfnGgX3nLAfTFpu56AGig7wrw2i8ONNDXNnXX5wMa6LsCvPaLXw30tS/m+TQwaQDoSWvOrG0A6LXTuNikAaAnrTmztgGg107jYpMGgJ605szaBoBeO42LTRoAetKaM2sbAHrtNC42aQDoSWvOrG0A6LXTuNikAaAnrTmztgGg107jYpMGgJ605szaBoBeO42LTRoAetKaM2sbAHrtNC42aQDoSWvOrG0A6LXTuNikAaAnrTmztgGg107jYpMGgJ605szaBoBeO42LTRoAetKaM2sbAHrtNC42aQDoSWvOrG0A6LXTuNikAaAnrTmztgGg107jYpMGgJ605szaBoBeO42LTRoAetKaM2sbAHrtNC42aQDoSWvOrG0A6LXTuNikAaAnrTmztgGg107jYpMGgJ605szaBoBeO42LTRoAetKaM2sbAHrtNC42aQDoSWvOrG3gD2vKzUK/FSmzAAAAAElFTkSuQmCC",
        official: true,
    },
    "raining": {
        id: "raining",
        name: "Raining",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-429:leaves-5:air-24:leaves-7:air-23:leaves-3:wood:leaves-3:air-18:leaves-5:air:leaves-2:wood:leaves-2:air-18:leaves-7:air-2:wood:air-5:concrete:air-14:leaves-3:wood:leaves-3:air-2:wood:air-5:concrete:air-14:leaves-3:wood:leaves-3:air-2:wood:air-5:concrete:air-15:leaves-2:wood:leaves-2:air-3:wood:air-5:concrete:air-17:wood:air-5:grass:air-5:concrete:air-17:wood:air-5:dirt:grass-2:air:monster:air:concrete:air-17:wood:air-4:grass:dirt-3:grass-3:concrete:air-13:monster:air-3:grass-5:dirt-7:concrete:air-12:grass-5:dirt-12:concrete:air-12:dirt-17:concrete-13:dirt-60;0:900;1-588:0-12:1-18:0-12:1-18:0-12:1-18:0-12:1-18:0-12:1-18:0-12:1-18:0-12:1-18:0-12:1-90;",
        inventory: {
            concrete: 25,
            water_pump: 1,
            lava_heater: 1,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,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",
        official: true,
    },
    "rafting_2": {
        id: "rafting_2",
        name: "Rafting 2",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-514:wood:air-5:wood:air-22:wood-9:air-22:wood:air-5:wood:air-23:wood:air:monster-2:air:monster:wood:air-22:wood-9:air-18:water-3:wood-9:water-228;0:900;1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-14:0-16:1-420;",
        inventory: {
            dirt: 5,
            concrete_powder: 10,
            concrete: 3,
            lava: 1,
            sapling: 1,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAAAXNSR0IArs4c6QAABORJREFUeF7t3D1yHGUYhdGZlBgCJ2zD7EEEXgRshE04YRkswk5YBIkCiEmHMpJ/q+WucWmqu5/3OLJVrZnv3nvUHqkknS+Xy+XkjwYiDZyBjiwpxv8NAA1CqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6NacwQDOQagDo1JzCAM1AqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6NacwQDOQagDo1JzCAM1AqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6NacwQDOQagDo1JzCAM1AqgGgU3MKAzQDqQaATs0pDNAMpBoAOjWnMEAzkGoA6NScwgDNQKoBoFNzCgM0A6kGgE7NKQzQDKQaADo1pzBAM5BqAOjUnMIAzUCqAaBTcwoDNAOpBoBOzSkM0AykGgA6NacwQDOQagDo1JzCAM1AqgGgU3MKAzQDqQaATs0pzM1Bv/715w8tv3jxsfBXv/2xSft7O88mJYSfFOjHcbf6AAvb2iQa0EBvAu9WTwo00LeytcnjAg30JvBu9aRAA30rW5s87rOBfuqrB/f3H3N9+lWOo7zdJ4ubuPzmJwX6sbqnPsCA/mZbm7wj0EBvAu9WTwo00LeytcnjAg30JvBu9aRAA30rW5s87rOBfur0e/veib2dZ5PVw08KtK9Dp3gDDTTQ1zSwt//i93aea7p07XoD7tDu0OtKDnQF0EAfiOv6UXcH+u0P5/VTf3LFy78vi9c/9Th/vrr7cP0efoLmqrAuXm1gl6B/+ud0uvz4cPbzX6fTm+8f/r709q+BXroe6FUTh75gl6Bffvd5p2//ffj30tu/BnrpeqAP7XX18EB7Db2K5EgX7BL0u5cK7/+8e+nx/g699Pa1lxxfPo479JF4Xn/WXYK+JoZPCq9pq3/ts4H2Eyt9LEdICPTjSn5i5Qhc188INNDrSg50BdBAH4jr+lGBBnpdyYGuABroA3FdP+r57pfL8jdDrL/vZ1fcnZZ/y+hRfv/GU+f8/X6b35J6Zf0uf2wA6JU7NNDH+lgBGuhjiV05LdBAA73UgNfQKReHDeMO7Q59WLxLB3820KlWhDlsA0AfdjoHd4dmIN+AO3R+4lkBgZ61dz4t0PmJZwUEetbe+bRA5yeeFRDoWXvn0wKdn3hWQKBn7Z1PC3R+4lkBgZ61dz4t0PmJZwUEetbe+bRA5yeeFRDoWXvn0wKdn3hWQKBn7Z1PC3R+4lkBgZ61dz4t0PmJZwUEetbe+bRA5yeeFRDoWXvn0wKdn3hWQKBn7Z1PC3R+4lkBgZ61dz4t0PmJZwUEetbe+bRA5yeeFRDoWXvn0wKdn3hWQKBn7Z1PC3R+4lkBgZ61dz4t0PmJZwUEetbe+bRA5yeeFRDoWXvn0wKdn3hWwP8Agn6NUdoswksAAAAASUVORK5CYII=",
        official: true,
    },
    "resupply_needed": {
        id: "resupply_needed",
        name: "Resupply Needed",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;40-40;air-267:concrete:water-3:concrete:air-35:concrete:water-3:concrete:air-35:concrete:water-3:concrete:air-34:grass:concrete-5:grass:air-32:stone:dirt-6:stone-2:air-32:stone-3:dirt-2:stone-2:air-34:stone-5:air-59:concrete:lava-3:concrete:air-35:concrete:lava-3:concrete:air-35:concrete:lava-3:concrete:air-33:grass-2:concrete-5:grass:air-31:stone:dirt-8:stone:air-30:stone-2:dirt-6:stone-2:air-31:stone-3:dirt-2:stone-3:air-34:stone-5:air-184:concrete:air-5:concrete:air-33:concrete:concrete_powder-5:concrete:air-29:leaves-3:air:concrete:concrete_powder-5:concrete:air-28:leaves-5:concrete:concrete_powder-5:concrete:air-28:leaves-2:wood:leaves-2:concrete:concrete_powder-5:concrete:air-29:leaves:wood:leaves:air:concrete:concrete_powder-5:concrete:air-30:wood:air-2:concrete:concrete_powder-5:concrete:monster:air-11:monster:air-15:monster:air:wood:air-2:concrete-7:dirt:grass-3:air-6:wood-5:air-12:grass-2:air:wood:air:monster:dirt-10:mud:water-22:mud:dirt-2:grass:dirt:grass:dirt-12:mud-2:water-16:mud-4:dirt-20:mud-3:water-9:mud-4:dirt-27:mud-9:dirt-95;0:1600;0-267:1:0-3:1:0-35:1:0-3:1:0-35:1:0-3:1:0-34:1-7:0-32:1-9:0-32:1-7:0-34:1-5:0-59:1-5:0-35:1-5:0-35:1-5:0-24:1-401:0-5:1-35:0-5:1-35:0-5:1-35:0-5:1-35:0-5:1-35:0-5:1-314;",
        inventory: {},
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,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",
        official: true,
    },
    "down_in_the_mines": {
        id: "down_in_the_mines",
        name: "Down in the Mines",
        author: "sp",
        world: "Square Caves",
        saveCode: "V3;1;30-30;basalt-6:stone-11:air-3:stone-8:basalt-8:stone-11:air-3:stone-8:basalt-8:stone-11:air-3:stone-8:basalt-7:stone-12:air-2:stone-9:basalt-6:stone-13:air-2:stone-10:basalt-5:stone-13:air-2:stone-10:basalt-5:stone-12:air-5:stone-9:basalt-3:stone-12:air-8:stone-20:air-12:stone-9:air-22:stone-7:air-24:stone-3:air-27:stone-3:air-27:stone-3:air-27:stone-3:air-27:stone-3:air-28:stone-2:air-129:monster:air-20:stone-4:air-2:wood_crate-5:air-16:stone-8:water-22:stone-8:water-21:stone-10:water-20:stone-11:water-17:stone-6:basalt-2:stone-6:water-13:stone-9:basalt-3:stone-26:basalt-6:stone-23:basalt-11:stone-17:basalt-4;0-900;1-17:0-3:1-27:0-3:1-27:0-3:1-27:0-2:1-28:0-2:1-28:0-2:1-27:0-5:1-24:0-8:1-20:0-12:1-635;",
        inventory: {
            sand: 8,
            wood_crate: 6,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        music: "square_waves",
        img: "data:image/png;base64,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",
        official: true,
    },
    "cave_in": {
        id: "cave_in",
        name: "Cave In",
        author: "sp",
        world: "Square Caves",
        saveCode: "V3;1;40-40;air-14:stone-14:gravel-5:stone-7:air-15:stone-12:gravel-8:stone-5:air-16:stone-11:gravel-11:stone-2:air-18:stone-2:air-4:stone-3:gravel-11:stone-2:air-22:monster:air-2:stone-2:gravel-11:stone-2:air-17:stone-2:air-2:wood_crate-2:air-2:stone-2:gravel-12:stone-2:air:stone-2:air-4:stone-2:air-5:monster:stone-3:water-5:stone-3:gravel-12:stone-6:air-3:stone-12:water-4:stone-4:gravel-11:stone-2:air-2:stone-2:air-3:stone-12:water-3:stone-6:gravel-9:stone-2:air-4:stone:air-3:stone-2:air-2:stone-17:gravel-8:stone-3:air-4:stone:air-3:stone:air-18:stone-4:gravel-3:stone-6:air-4:stone:air-3:stone:air-19:stone-12:air-55:stone:air-24:stone:air:monster:air-12:stone:air-3:stone-2:air-19:stone-4:air-5:stone-4:air:stone-2:air-3:stone-2:air-19:stone-5:air-3:stone-8:air-3:stone-2:air-19:stone-5:air-3:stone-8:air-3:stone-7:air-3:stone-11:air-7:detonator:stone-8:air-3:stone-7:air-3:stone-11:air:monster:air:gunpowder:monster:air-2:stone-9:air-3:stone-7:air-3:stone-27:air-3:stone-7:air-3:stone-27:air-3:stone-7:air-3:stone-19:gravel-2:stone-6:air-3:stone-7:air-3:stone-13:air-5:gravel-5:stone-4:air-3:stone-7:air-3:stone-13:air-4:gravel-6:stone-4:air-3:stone-7:air-3:stone-13:air-2:stone-4:gravel-3:stone-5:air-3:stone-7:air-3:stone-13:air-2:stone-12:air-3:stone-7:air-3:stone-11:air-31:stone-9:air-31:stone-9:air-25:monster:air-4:monster:stone-11:air-2:stone-22:air-3:stone-13:air-2:stone-22:air-3:stone-13:air-2:stone-22:air-3:stone-13:air-2:stone-22:air-3:stone-13:air-2:stone-21:air-5:stone-12:air-2:stone-21:air-3:monster:air:stone-12:air-7:stone-16:monster-2:air:monster-2:stone-12:air-6:monster:stone-111;0-1600;0-14:1-26:0-14:1-26:0-14:1-26:0-14:1-26:0-14:1-26:0-14:1-27:0:1-2:0-4:1-37:0-3:1-37:0-3:1-91:0-7:1-33:0-7:1-33:0-7:1-3:0-11:1-19:0-7:1-3:0-11:1-21:0-5:1-3:0-11:1-21:0-5:1-3:0-11:1-21:0-5:1-3:0-11:1-376:0-3:1-36:0-5:1-35:0-5:1-35:0-5:1-420;",
        inventory: {
            concrete: 20,
            gunpowder: 10,
            detonator: 3,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        music: "square_waves",
        img: "data:image/png;base64,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",
        official: true,
    },
    "lava_springs": {
        id: "lava_springs",
        name: "Lava Springs",
        author: "sp",
        world: "Square Caves",
        saveCode: "V3;1;50-50;stone-12:air-15:basalt-5:stone-7:basalt-11:air-3:stone-7:air-17:basalt-7:stone-4:basalt-5:air-6:basalt:air-5:stone-2:air-19:lava:basalt-14:air-34:basalt-15:air-32:basalt-17:air-32:basalt-14:air-35:basalt-11:air-38:basalt-12:air-19:stone-5:air-10:basalt-15:air-17:wood:air-2:basalt:stone-10:air:basalt-18:air-16:wood-3:air:basalt-2:stone-10:basalt-17:air-16:wood-5:basalt-3:air-3:basalt:stone-2:basalt-19:air-18:wood:air:wood:air:basalt-3:air-3:basalt-21:air-19:wood:monster:wood:air:basalt-3:air:monster:air:basalt-19:air-20:basalt-15:gravel-2:basalt-11:air-19:basalt:air:basalt-15:gravel-6:basalt-2:gravel:basalt-4:air-11:basalt:air-7:basalt-2:air:basalt-15:gravel-10:basalt-2:air-12:basalt:air-7:basalt-2:air-2:basalt-14:gravel-10:basalt-2:air-12:basalt-2:air-6:basalt-3:air-5:basalt-11:gravel-9:basalt:air-12:basalt-3:air-5:basalt-5:air-5:basalt-11:gravel-7:basalt-2:air-12:basalt-3:air:basalt-8:water-6:air-2:basalt-11:gravel-4:basalt-2:air-12:basalt-13:water-6:air-4:basalt-10:wood-3:basalt:air-13:basalt-14:water-5:air-8:basalt-6:air-16:basalt-16:water-4:air-9:basalt-6:air-14:basalt-18:wood:basalt-2:air-11:basalt-6:air-11:basalt-11:air:basalt-6:air-3:basalt:air-13:basalt-6:air-9:basalt-9:air-3:basalt-4:air-34:basalt-9:air-4:basalt-3:air-33:basalt-10:air-4:basalt-3:air-32:basalt-6:air:basalt-4:air-4:basalt-2:air-33:basalt-5:air-3:basalt-3:air-4:basalt-2:air-32:basalt-6:air-3:basalt-3:air-5:basalt:air-32:basalt-5:air-4:basalt-2:air-6:basalt:air-32:basalt-5:air-5:basalt:air-14:basalt:air-24:basalt-4:air-6:basalt:air-14:basalt-2:air-23:basalt-4:air-21:basalt-3:air-22:basalt-4:air-21:basalt-2:stone:air-22:basalt-5:air-20:basalt-2:stone-2:air-5:basalt:air-13:basalt-7:air-20:basalt:stone-7:basalt-2:lava-12:basalt-8:air-20:basalt:stone-7:basalt-2:lava-12:basalt-10:air-18:basalt-2:stone-5:basalt-4:lava-11:basalt-10:lava-18:basalt-2:wood:air-3:wood:basalt-5:lava-9:basalt-12:lava-17:basalt-2:wood:air:monster:air:wood:basalt-7:lava-6:basalt-15:lava-15:basalt-2:wood-5:basalt-30:lava-13:basalt-38:lava-4:basalt-4:lava-4:basalt-48:lava-2:stone:basalt-49:stone:basalt-49:stone-2:basalt:stone-4:basalt-43:stone-10:basalt-40;0-2500;1-12:0-15:1-23:0-3:1-7:0-17:1-16:0-6:1:0-5:1-2:0-19:1-15:0-34:1-15:0-32:1-17:0-32:1-14:0-35:1-11:0-38:1-12:0-19:1-5:0-10:1-15:0-17:1:0-2:1-11:0:1-18:0-16:1-3:0:1-29:0-16:1-33:0-18:1-3:0:1-27:0-19:1-3:0:1-25:0-20:1-28:0-19:1:0:1-28:0-11:1:0-7:1-2:0:1-27:0-12:1:0-7:1-2:0-2:1-26:0-12:1-2:0-6:1-3:0-5:1-21:0-12:1-3:0-5:1-5:0-5:1-20:0-12:1-3:0:1-14:0-2:1-17:0-12:1-19:0-4:1-14:0-13:1-19:0-8:1-6:0-16:1-20:0-9:1-6:0-14:1-21:0-11:1-6:0-11:1-11:0:1-6:0-3:1:0-13:1-6:0-9:1-9:0-3:1-4:0-34:1-9:0-4:1-3:0-33:1-10:0-4:1-3:0-32:1-6:0:1-4:0-4:1-2:0-33:1-5:0-3:1-3:0-4:1-2:0-32:1-6:0-3:1-3:0-5:1:0-32:1-5:0-4:1-2:0-6:1:0-32:1-5:0-5:1:0-14:1:0-24:1-4:0-6:1:0-14:1-2:0-23:1-4:0-21:1-3:0-22:1-4:0-21:1-3:0-22:1-5:0-20:1-4:0-5:1:0-13:1-7:0-20:1-30:0-20:1-32:0-18:1-500;",
        inventory: {
            water: 1,
            concrete: 50,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        music: "square_waves",
        img: "data:image/png;base64,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",
        official: true,
    },
    "breaking_gravity": {
        id: "breaking_gravity",
        name: "Breaking Gravity",
        author: "sp",
        world: "Square Caves",
        saveCode: "V2;1;50-50;basalt-18:stone-8:air-24:basalt-18:stone-8:air-24:basalt-17:stone-9:air-24:basalt-16:stone-10:air-24:basalt-14:stone-12:air-24:basalt-14:stone-12:air-24:basalt-13:stone-13:air-24:basalt-13:stone-13:air-24:basalt-13:stone-13:air-24:basalt-12:stone-14:air-24:basalt-12:stone-14:air-24:basalt-13:stone-13:air-24:basalt-13:stone-13:air-24:basalt-14:stone-10:air-26:basalt-8:air-17:stone-12:air-13:basalt-8:air:basalt-5:stone-23:air-13:basalt-8:air:basalt-6:stone-22:air-13:basalt-8:air:basalt-6:stone-22:air-13:basalt-8:air:basalt-6:stone-22:air-13:basalt-8:air:basalt-7:stone-21:air-13:basalt-8:air:basalt-8:stone-20:air-13:basalt-8:air:basalt-9:stone-19:air-13:basalt-8:air:basalt-11:stone-16:air-14:basalt-8:air:basalt-12:stone-15:air-14:basalt-8:air:basalt-13:stone-5:basalt-4:stone-5:air-14:basalt-8:air:basalt-15:stone-2:basalt-6:stone-4:air-14:basalt-8:air:basalt-24:stone-3:air-14:basalt-8:monster:basalt-25:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-35:stone-2:air-13:basalt-35:stone-2:air-13:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-34:stone-4:air-12:basalt-32:stone-6:air-12:basalt-31:stone-7:air-12:basalt-27:stone-10:water-13:basalt-26:stone-10:water-14:basalt:stone:basalt-2:stone:basalt-20:stone-9:water-16:basalt-19:stone-11:water-20:basalt:stone:basalt-2:stone:basalt-10:stone-10:water-25:basalt-2:stone-2:basalt-11:stone-5:water-30:basalt-14:stone-4:water-32;0:2500;1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-1800;",
        inventory: {
            concrete: 336,
            stone: 336,
            c4: 1,
            detonator: 1,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        music: "square_waves",
        img: "data:image/png;base64,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",
        official: true,
    },
    "breaking_longo_gravity": {
        id: "breaking_longo_gravity",
        name: "Breaking Longo Gravity",
        author: "sp",
        world: "Square Caves",
        saveCode: "V2;1;50-200;basalt-18:stone-8:air:concrete-23:basalt-18:stone-8:air-11:concrete-13:basalt-17:stone-9:air-14:stone-10:basalt-16:stone-10:air-11:stone-13:basalt-14:stone-12:air-11:stone-13:basalt-14:stone-12:air-11:stone-13:basalt-13:stone-13:air-11:stone-6:detonator:stone-6:basalt-13:stone-13:air-11:stone-6:c4:stone-6:basalt-13:stone-13:air-11:stone-6:c4:stone-6:basalt-12:stone-14:air-11:stone-13:basalt-12:stone-14:air-11:stone-13:basalt-13:stone-13:air-11:stone-13:basalt-13:stone-13:air-11:stone-13:basalt-14:stone-10:air-13:stone-13:basalt-8:air-17:stone-12:air-13:basalt-8:air:basalt-5:stone-23:air-13:basalt-8:air:basalt-6:stone-22:air-13:basalt-8:air:basalt-6:stone-22:air-13:basalt-8:air:basalt-6:stone-22:air-13:basalt-8:air:basalt-7:stone-21:air-13:basalt-8:air:basalt-8:stone-20:air-13:basalt-8:air:basalt-9:stone-19:air-13:basalt-8:air:basalt-11:stone-16:air-14:basalt-8:air:basalt-12:stone-15:air-14:basalt-8:air:basalt-13:stone-5:basalt-3:stone-6:air-14:basalt-8:air:basalt-15:stone-2:basalt-5:stone-5:air-14:basalt-8:air:basalt-22:stone-5:air-14:basalt-8:monster:basalt-23:stone-4:air-14:basalt-32:stone-4:air-14:basalt-32:stone-4:air-14:basalt-32:stone-4:air-14:basalt-33:stone-3:air-14:basalt-33:stone-3:air-14:basalt-33:stone-3:air-14:basalt-33:stone-4:air-13:basalt-33:stone-4:air-13:basalt-33:stone-4:air-13:basalt-33:stone-4:air-13:basalt-33:stone-4:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-4:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-34:stone-4:air-12:basalt-34:stone-4:air-12:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-4:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-34:stone-4:air-12:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-4:air-12:basalt-34:stone-4:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-34:stone-4:air-12:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-4:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-34:stone-4:air-12:basalt-34:stone-4:air-12:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-4:air-12:basalt-34:stone-4:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-34:stone-4:air-12:basalt-34:stone-4:air-12:basalt-34:stone-4:air-12:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-3:air-13:basalt-34:stone-4:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-35:stone-3:air-12:basalt-34:stone-4:air-12:basalt-32:stone-6:air-12:basalt-31:stone-7:air-12:basalt-27:stone-10:water-13:basalt-26:stone-10:water-14:basalt:stone:basalt-2:stone:basalt-20:stone-9:water-16:basalt-19:stone-11:water-20:basalt:stone:basalt-2:stone:basalt-10:stone-10:water-25:basalt-2:stone-2:basalt-11:stone-5:water-30:basalt-14:stone-4:water-32;0:10000;1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-26:0-24:1-9300;",
        inventory: {
            concrete: 336,
            stone: 336,
            c4: 2,
            detonator: 1,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,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",
        official: true,
    },
    "race": {
        id: "race",
        name: "Race",
        author: "sp",
        world: "fun stuff",
        saveCode: "V2;1;100-41;deleter-91:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-3:wall-5:air-91:slime:air-3:wall:air-3:wall:air-91:slime:air:wood:wall-2:air-3:wall:deleter-91:slime-2:ant_right_clockwise:slime-3:monster:air:wall:air-64:wall-27:glass:air:wood:wall-6:air-64:wall:wood:sticky_piston_right:air-27:rotator_down:wall:air-68:wall-29:air-2:wall:air-96:wall:nuke_defuser:nuke:wall:air-96:wall:deleter:wall-2:air-4;0:4100;1-100:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-38:0-62:1-638;",
        inventory: {
            air: 1000000,
            wall: 1000000,
            dirt: 1000000,
            grass: 1000000,
            mud: 1000000,
            sand: 1000000,
            gravel: 1000000,
            concrete_powder: 1000000,
            concrete: 1000000,
            water: 1000000,
            ice: 1000000,
            snow: 1000000,
            steam: 1000000,
            lava: 1000000,
            fire: 1000000,
            water_pump: 1000000,
            lava_heater: 1000000,
            ice_freezer: 1000000,
            clay: 1000000,
            bricks: 1000000,
            stone: 1000000,
            basalt: 1000000,
            iron: 1000000,
            steel: 1000000,
            rubber: 1000000,
            glass: 1000000,
            wood: 1000000,
            leaves: 1000000,
            sapling: 1000000,
            plant: 1000000,
            moss: 1000000,
            lichen: 1000000,
            sponge: 1000000,
            super_sponge: 1000000,
            ash: 1000000,
            wood_crate: 1000000,
            steel_crate: 1000000,
            piston_left: 1000000,
            piston_up: 1000000,
            piston_right: 1000000,
            piston_down: 1000000,
            pusher_left: 1000000,
            pusher_up: 1000000,
            pusher_right: 1000000,
            pusher_down: 1000000,
            fan_left: 1000000,
            fan_up: 1000000,
            fan_right: 1000000,
            fan_down: 1000000,
            sticky_piston_left: 1000000,
            sticky_piston_up: 1000000,
            sticky_piston_right: 1000000,
            sticky_piston_down: 1000000,
            copier_left: 1000000,
            copier_up: 1000000,
            copier_right: 1000000,
            copier_down: 1000000,
            cloner_left: 1000000,
            cloner_up: 1000000,
            cloner_right: 1000000,
            cloner_down: 1000000,
            rotator_left: 1000000,
            rotator_up: 1000000,
            rotator_right: 1000000,
            rotator_down: 1000000,
            rotator_clockwise: 1000000,
            rotator_counterclockwise: 1000000,
            slider_horizontal: 1000000,
            slider_vertical: 1000000,
            collapsable: 1000000,
            slime: 1000000,
            deactivator: 1000000,
            observer_left_off: 1000000,
            observer_left_on: 1000000,
            observer_right_off: 1000000,
            observer_right_on: 1000000,
            observer_up_off: 1000000,
            observer_up_on: 1000000,
            observer_down_off: 1000000,
            observer_down_on: 1000000,
            gunpowder: 1000000,
            activated_gunpowder: 1000000,
            c4: 1000000,
            activated_c4: 1000000,
            detonator: 1000000,
            flamethrower_left: 1000000,
            flamethrower_up: 1000000,
            flamethrower_right: 1000000,
            flamethrower_down: 1000000,
            nuke: 1000000,
            activated_nuke: 1000000,
            nuke_defuser: 1000000,
            deleter: 1000000,
            laser_left: 1000000,
            laser_up: 1000000,
            laser_right: 1000000,
            laser_down: 1000000,
            laser_scatterer: 1000000,
            mirror_1: 1000000,
            mirror_2: 1000000,
            lag_spike_generator: 1000000,
            pink_sand: 1000000,
            red_sand: 1000000,
            // pickle: 1000000,
            // pickled_pickle: 1000000,
            // random: 1000000,
            life: 1000000,
            life_2: 1000000,
            life_3: 1000000,
            // triangle: 1000000,
            // ant_left_clockwise: 1000000,
            // ant_left_counterclockwise: 1000000,
            // ant_up_clockwise: 1000000,
            // ant_up_counterclockwise: 1000000,
            // ant_right_clockwise: 1000000,
            // ant_right_counterclockwise: 1000000,
            // ant_down_clockwise: 1000000,
            // ant_down_counterclockwise: 1000000,
            // anteater: 1000000,
            // monster: 1000000,
            // placement_restriction: 1000000,
            // goal: 1000000,
            // target: 1000000,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAD2CAYAAAAK7/lrAAAAAXNSR0IArs4c6QAAD1JJREFUeF7t3UFuGwUYhuGxsmMNi2w4QSWkCqmcISUSvcNYyiUAkd4BItl3AClNzwBSQEJwAjYsYM0uGmScOI40QzLxNx7PzNNV1Tq/Z575476x42ZWlmVV+EWAAAECBAgQ6ENgUX+ni6LhL/o4xmfc52wVWGfL+5O4KOebMf58TcGBg8+L9Q5w4ODx0ONh/HFAYAkv/8AIccHtccDjgMcBjwPhxwGBFQb1zJBnCj0jstmB+FeEPr98fvn88vk1lMeBMQfWM15a9CEECBAgQIAAgd0FBNbuhiYQIECAAAECBB4IjDWwqqryLkK7ToAAAQIECPQiMC/uvwVp+wAG/y5CgdXLPrlTAgQIECBAoCgKgWUNCBAgQIAAAQJhAYEVBjWOAAECBAgQICCw7AABAgQIECBAICwgsMKgxhEgQIAAAQIEBJYdIECAAAECBAiEBQRWGNQ4AgQIECBAgIDAsgMECBAgQIAAgbCAwAqDGkeAAAECBAgQEFh2gAABAgQIECAQFhBYYVDjCBAgQIAAAQICyw4QIECAAAECBMICAisMahwBAgQIECBAQGDZAQIECBAgQIBAWEBghUGNI0CAAAECBAgILDtAgAABAgQIEAgLCKwwqHEECBAgQIAAAYFlBwgQIECAAAECYQGBFQY1jgABAgQIECAgsOwAAQIECBAgQCAsILDCoMYRIECAAAECBASWHSBAgAABAgQIhAUEVhjUOAIECBAgQICAwLIDBAgQIECAAIGwgMAKgxpHgAABAgQIEBBYdoAAAQIECBAgEBYQWGFQ4wgQIECAAAECAssOECBAgAABAgTCAgIrDGocAQIECBAgQEBg2QECBAgQIECAQFhAYIVBjSNAgAABAgQICCw7QIAAAQIECBAICwisMKhxBAgQIECAAAGBZQcIECBAgAABAmEBgRUGNY4AAQIECBAgILDsAAECBAgQIEAgLCCwwqDGESBAgAABAgQElh0gQIAAAQIECIQFBFYY1DgCBAgQIECAgMCyAwQIECBAgACBsIDACoMaR4AAAQIECBAQWHaAAAECBAgQIBAWEFhhUOMIECBAgAABAgLLDhAgQIAAAQIEwgICKwxqHAECBAgQIEBAYNkBAgQIECBAgEBYQGCFQY0jQIAAAQIECAgsO0CAAAECBAgQCAsIrDCocQQIECBAgAABgWUHCBAgQIAAAQJhAYEVBjWOAAECBAgQICCw7AABAgQIECBAICwgsMKgxhEgQIAAAQIEBJYdIECAAAECBAiEBQRWGNQ4AgQIECBAgIDAsgMECBAgQIAAgbCAwAqDGkeAAAECBAgQEFh2gAABAgQIECAQFhBYYVDjCBAgQIAAAQICyw4QIECAAAECBMICAisMahwBAgQIECBAQGDZAQIECBAgQIBAWEBghUGNI0CAAAECBAgILDtAgAABAgQIEAgLCKwwqHEECBAgQIAAAYFlBwgQIECAAAECYQGBFQY1jgABAgQIECAgsOwAAQIECBAgQCAsILDCoMYRIECAAAECBASWHSBAgAABAgQIhAUEVhjUOAIECBAgQICAwLIDBAgQIECAAIGwgMAKgxpHgAABAgQIEBBYdoAAAQIECBAgEBYQWGFQ4wgQIECAAAECAssOECBAgAABAgTCAgIrDGocAQIECBAgQEBg2QECBAgQIECAQFhAYIVBjSNAgAABAgQICCw7QIAAAQIECBAICwisMKhxBAgQIECAAAGBZQcIECBAgAABAmEBgRUGNY4AAQIECBAgILDsAAECBAgQIEAgLCCwwqDGESBAgAABAgQElh0gQIAAAQIECIQFBFYY1DgCBAgQIECAgMCyAwQIECBAgACBsIDACoMaR4AAAQIECBAQWHaAAAECBAgQIBAWEFhhUOMIECBAgAABAgLLDhAgQIAAAQIEwgICKwxqHAECBAgQIEBAYNkBAgQIECBAgEBYQGCFQY0jQIAAAQIECAgsO0CAAAECBAgQCAsIrDCocQQIECBAgAABgWUHCBAgQIAAAQJhAYEVBjWOAAECBAgQICCw7AABAgQIECBAICwgsMKgxhEgQIAAAQIEBJYdIECAAAECBAiEBQRWGNQ4AgQIECBAgIDAsgMECBAgQIAAgbCAwAqDGkeAAAECBAgQEFh2gAABAgQIECAQFhBYYVDjCBAgQIAAAQICyw4QIECAAAECBMICAisMahwBAgQIECBAQGDZAQIECBAgQIBAWEBghUGNI0CAAAECBAgILDtAgAABAgQIEAgLCKwwqHEECBAgQIAAAYFlBwgQIECAAAECYQGBFQY1jgABAgQIECAgsOwAAQIECBAgQCAsILDCoMYRIECAAAECBASWHSBAgAABAgQIhAUEVhjUOAIECBAgQICAwLIDBAgQIECAAIGwgMAKgxpHgAABAgQIEBBYdoAAAQIECBAgEBYQWGFQ4wgQIECAAAECAssOECBAgAABAgTCAgIrDGocAQIECBAgQEBg2QECBAgQIECAQFhAYIVBjSNAgAABAgQICCw7QIAAAQIECBAICwisMKhxBAgQIECAAAGBZQcIECBAgAABAmEBgRUGNY4AAQIECBAgILDsAAECBAgQIEAgLCCwwqDGESBAgAABAgQElh0gQIAAAQIECIQFBFYY1DgCBAgQIECAgMCyAwQIECBAgACBsIDACoMaR4AAAQIECBAQWHaAAAECBAgQIBAWEFhhUOMIECBAgAABAgLLDhAgQIAAAQIEwgICKwxqHAECBAgQIEBAYNkBAgQIECBAgEBYQGCFQY0jQIAAAQIECAgsO0CAAAECBAgQCAsIrDCocQQIECBAgAABgWUHCBAgQIAAAQJhAYEVBjWOAAECBAgQICCw7AABAgQIECBAICwgsMKgxhEgQIAAAQIEBJYdIECAAAECBAiEBQRWGNQ4AgQIECBAgIDAsgMECBAgQIAAgbCAwAqDGkeAAAECBAgQEFh2gAABAgQIECAQFhBYYVDjCBAgQIAAAQICyw4QIECAAAECBMICAisMahwBAgQIECBAQGDZAQIECBAgQIBAWEBghUGNI0CAAAECBAgILDtAgAABAgQIEAgLCKwwqHEECBAgQIAAAYFlBwgQIECAAAECYQGBFQY1jgABAgQIECAgsOwAAQIECBAgQCAsILDCoMYRIECAAAECBASWHSBAgAABAgQIhAUEVhjUOAIECBAgQICAwLIDBAgQIECAAIGwgMAKgxpHgAABAgQIEBBYdoAAAQIECBAgEBYQWGFQ4wgQIECAAAECAssOECBAgAABAgTCAgIrDGocAQIECBAgQEBg2QECBAgQIECAQFhAYIVBjSNAgAABAgQICCw7QIAAAQIECBAICwisMKhxBAgQIECAAAGBZQcIECBAgAABAmEBgRUGNY4AAQIECBAgILDsAAECBAgQIEAgLCCwwqDGESBAgAABAgQElh0gQIAAAQIECIQFBFYY1DgCBAgQIECAgMCyAwQIECBAgACBsIDACoMaR4AAAQIECBAQWHaAAAECBAgQIBAW6DqwZrNZ+IifNm5WVVX1tJu6FQECBAgQIEAgKyCwsp6mESBAgAABAgQKgWUJCBAgQIAAAQJhAYEVBjWOAAECBAgQICCw7AABAgQIECBAICwgsMKgxhEgQIAAAQIE+gqs1Hv8mt6l6F2EdpsAAQIECBDoTUBg9UbvjgkQIECAAIGxCgissV5Z50WAAAECBAj0JiCweqN3xwQIECBAgMBYBQTWWK+s8yJAgAABAgR6ExBYvdG7YwIECBAgQGCsAm0D67v55xuK4+N7lTdvr1oReRdhKy43JkCAAAECBIYkILCGdLUcKwECBAgQIDAIAYE1iMvkIAkQIECAAIEhCQisIV0tx0qAAAECBAgMQkBgDeIyOUgCBAgQIEBgSAKjDayyLKshXQjHSoAAAQIECIxIYNHuXBazZe0HzKuy3aCGW5cf1c9/9Vd9LjX+LMJVYJ0t78/uopxv7tKfryk4cPB5sd4BDhw8Hno8jD8OHGBgffZ3UVQfr6/17I+i+PHDohBYAtE/hL5g8IWBxwGPAx4HhvM4cICB9eqDh09v/fSPwPIV9u1OxL/C8EyeZ3Y9g7XZAZ9fnsnzTF7wmbwxB1bkRUtDCBAgQIAAAQJtBQ4wsFYvEd79Wr1U+OxnsNpauD0BAgQIECBAICJwgIFVd16tvwerSv0wnoiyIQQIECCwL4Gmdz/t6/7dD4GVwNXVb6cnJy8+Xf3+/fvfr+9UTk5eXNYJpX4WYdf6M4HVNbH5BAgQOEwBgXWY12VqR1VV1TeXl79cF8VRcXR0tDl9gTW1TXC+BAgQGImAwBrJhRz4aawD69fr7bhanZLAGviFdfgECBCYqoDAmuqVP6zzXr1EuH1ENzc3xenpJ6uXDL/2EuFhXStHQ4AAAQJPEBBYT0Byk84FtgNrFVdFsQqslwKrc3l3QIAAAQKdCAisTlgNbSmwHVjb3+zuJcKWkG5OgAABAoch0BRY35avNwd4fHx/rMvz+uN+V7w7jBNyFJMWmM/vf9TfNsRyWf+zBbv+TxS8i3DS6+jkCRCYsoDAmvLVH9+5C6zxXVNnRIAAgUEK7BJYV19dbc65Oq8Gef4OelwCAmtc19PZECBAYLACAmuwl86B1wjcBdafi/V/DX98+5KhlwitCwECBAjsVWCXwNo+UN+DtdfL5s4aBASW1SBAgACBgxAQWAdxGRxESEBghSCNIUCAAIHdBPw3Dbv5+eh+BNq++69pz9vOaXu23kXYVsztCRAgMBIBgTWSCzmx02gbRgJrYgvidAkQINC3gMDq+wq4/+cICKznqPkYAgQIENibgMDaG7U7CgoIrCCmUQQIECCQFxBYeVMTuxcQWN0buwcCBAgQ2EFAYO2A50N7ExBYvdG7YwIECBAgQGDoAk1fAHz/cn1mX9z+yMwfbn+owJufv6w/5dnb2j9vG2ptPb2LsK2Y2xMgQIAAAQKdCwiszondAQECBAgQIDA1gcb/XqHpiapzz2BNbUecLwECBAgQINBSQGC1BHNzAgQIECBAgMBjAl4ifEzI3xMgQIAAAQIEWgoIrJZgbk6AAAECBAgQeEygKbDKsqz90OVy+djIB3/vXYStuNyYAAECBAgQGIPA/wXW2XKxOcWLcv7f7wXWGK66cyBAgAABAgQ6FRBYnfIaToAAAQIECExRQGBN8ao7ZwIECBAgQKBTAd+D1Smv4QQIECBAgMAUBYYeWP8CSIM9PIq2jywAAAAASUVORK5CYII=",
        official: true,
    },
    "race_2": {
        id: "race_2",
        name: "Race 2",
        author: "sp",
        world: "fun stuff",
        saveCode: "V2;1;100-100;air-98:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air-99:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:air:wall-98:slime:monster;0:10000;0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-52:0-48:1-6752;",
        inventory: {
            air: 1000000,
            wall: 1000000,
            dirt: 1000000,
            grass: 1000000,
            mud: 1000000,
            sand: 1000000,
            gravel: 1000000,
            concrete_powder: 1000000,
            concrete: 1000000,
            water: 1000000,
            ice: 1000000,
            snow: 1000000,
            steam: 1000000,
            lava: 1000000,
            fire: 1000000,
            water_pump: 1000000,
            lava_heater: 1000000,
            ice_freezer: 1000000,
            clay: 1000000,
            bricks: 1000000,
            stone: 1000000,
            basalt: 1000000,
            iron: 1000000,
            steel: 1000000,
            rubber: 1000000,
            glass: 1000000,
            wood: 1000000,
            leaves: 1000000,
            sapling: 1000000,
            plant: 1000000,
            moss: 1000000,
            lichen: 1000000,
            sponge: 1000000,
            super_sponge: 1000000,
            ash: 1000000,
            wood_crate: 1000000,
            steel_crate: 1000000,
            piston_left: 1000000,
            piston_up: 1000000,
            piston_right: 1000000,
            piston_down: 1000000,
            pusher_left: 1000000,
            pusher_up: 1000000,
            pusher_right: 1000000,
            pusher_down: 1000000,
            fan_left: 1000000,
            fan_up: 1000000,
            fan_right: 1000000,
            fan_down: 1000000,
            sticky_piston_left: 1000000,
            sticky_piston_up: 1000000,
            sticky_piston_right: 1000000,
            sticky_piston_down: 1000000,
            copier_left: 1000000,
            copier_up: 1000000,
            copier_right: 1000000,
            copier_down: 1000000,
            cloner_left: 1000000,
            cloner_up: 1000000,
            cloner_right: 1000000,
            cloner_down: 1000000,
            rotator_left: 1000000,
            rotator_up: 1000000,
            rotator_right: 1000000,
            rotator_down: 1000000,
            rotator_clockwise: 1000000,
            rotator_counterclockwise: 1000000,
            slider_horizontal: 1000000,
            slider_vertical: 1000000,
            collapsable: 1000000,
            slime: 1000000,
            deactivator: 1000000,
            observer_left_off: 1000000,
            observer_left_on: 1000000,
            observer_right_off: 1000000,
            observer_right_on: 1000000,
            observer_up_off: 1000000,
            observer_up_on: 1000000,
            observer_down_off: 1000000,
            observer_down_on: 1000000,
            gunpowder: 1000000,
            activated_gunpowder: 1000000,
            c4: 1000000,
            activated_c4: 1000000,
            detonator: 1000000,
            flamethrower_left: 1000000,
            flamethrower_up: 1000000,
            flamethrower_right: 1000000,
            flamethrower_down: 1000000,
            nuke: 1000000,
            activated_nuke: 1000000,
            nuke_defuser: 1000000,
            deleter: 1000000,
            laser_left: 1000000,
            laser_up: 1000000,
            laser_right: 1000000,
            laser_down: 1000000,
            laser_scatterer: 1000000,
            mirror_1: 1000000,
            mirror_2: 1000000,
            lag_spike_generator: 1000000,
            pink_sand: 1000000,
            red_sand: 1000000,
            // pickle: 1000000,
            // pickled_pickle: 1000000,
            // random: 1000000,
            life: 1000000,
            life_2: 1000000,
            life_3: 1000000,
            // triangle: 1000000,
            // ant_left_clockwise: 1000000,
            // ant_left_counterclockwise: 1000000,
            // ant_up_clockwise: 1000000,
            // ant_up_counterclockwise: 1000000,
            // ant_right_clockwise: 1000000,
            // ant_right_counterclockwise: 1000000,
            // ant_down_clockwise: 1000000,
            // ant_down_counterclockwise: 1000000,
            // anteater: 1000000,
            // monster: 1000000,
            // placement_restriction: 1000000,
            // goal: 1000000,
            // target: 1000000,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
            {
                type: "ticks",
                max: 50,
            },
        ],
        img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAJYCAYAAAC+ZpjcAAAAAXNSR0IArs4c6QAAHihJREFUeF7t2jFKA1EYRtE3rbW2bkMXlKxqXJBuw9ra9omIhTAZCdwghmMZ4U9y8hUX4zLnnMMPAQIECBAgQIDASYHjOG7+bh3r5uOLwLImAgQIECBAgMC+gMCyEAIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQICCwbIECAAAECBAjEAgIrBnWOAAECBAgQICCwbIAAAQIECBAgEAsIrBjUOQIECBAgQICAwLIBAgQIECBAgEAsILBiUOcIECBAgAABAgLLBggQIECAAAECsYDAikGdI0CAAAECBAgILBsgQIAAAQIECMQCAisGdY4AAQIECBAgILBsgAABAgQIECAQCwisGNQ5AgQIECBAgIDAsgECBAgQIECAQCwgsGJQ5wgQIECAAAECAssGCBAgQIAAAQKxgMCKQZ0jQIAAAQIECAgsGyBAgAABAgQIxAICKwZ1jgABAgQIECAgsGyAAAECBAgQIBALCKwY1DkCBAgQIECAgMCyAQIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQICCwbIECAAAECBAjEAgIrBnWOAAECBAgQICCwbIAAAQIECBAgEAsIrBjUOQIECBAgQICAwLIBAgQIECBAgEAsILBiUOcIECBAgAABAgLLBggQIECAAAECsYDAikGdI0CAAAECBAgILBsgQIAAAQIECMQCAisGdY4AAQIECBAgILBsgAABAgQIECAQCwisGNQ5AgQIECBAgIDAsgECBAgQIECAQCwgsGJQ5wgQIECAAAECAssGCBAgQIAAAQKxgMCKQZ0jQIAAAQIECAgsGyBAgAABAgQIxAICKwZ1jgABAgQIECAgsGyAAAECBAgQIBALCKwY1DkCBAgQIECAgMCyAQIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQICCwbIECAAAECBAjEAgIrBnWOAAECBAgQICCwbIAAAQIECBAgEAsIrBjUOQIECBAgQICAwLIBAgQIECBAgEAsILBiUOcIECBAgAABAgLLBggQIECAAAECsYDAikGdI0CAAAECBAgILBsgQIAAAQIECMQCAisGdY4AAQIECBAgILBsgAABAgQIECAQCwisGNQ5AgQIECBAgIDAsgECBAgQIECAQCwgsGJQ5wgQIECAAAECAssGCBAgQIAAAQKxgMCKQZ0jQIAAAQIECAgsGyBAgAABAgQIxAICKwZ1jgABAgQIECAgsGyAAAECBAgQIBALCKwY1DkCBAgQIECAgMCyAQIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQICCwbIECAAAECBAjEAgIrBnWOAAECBAgQICCwbIAAAQIECBAgEAsIrBjUOQIECBAgQICAwLIBAgQIECBAgEAsILBiUOcIECBAgAABAgLLBggQIECAAAECsYDAikGdI0CAAAECBAgILBsgQIAAAQIECMQCAisGdY4AAQIECBAgILBsgAABAgQIECAQCwisGNQ5AgQIECBAgIDAsgECBAgQIECAQCwgsGJQ5wgQIECAAAECAssGCBAgQIAAAQKxgMCKQZ0jQIAAAQIECAgsGyBAgAABAgQIxAICKwZ1jgABAgQIECAgsGyAAAECBAgQIBALCKwY1DkCBAgQIECAgMCyAQIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQICCwbIECAAAECBAjEAgIrBnWOAAECBAgQICCwbIAAAQIECBAgEAsIrBjUOQIECBAgQICAwLIBAgQIECBAgEAsILBiUOcIECBAgAABAgLLBggQIECAAAECsYDAikGdI0CAAAECBAgILBsgQIAAAQIECMQCAisGdY4AAQIECBAgILBsgAABAgQIECAQCwisGNQ5AgQIECBAgIDAsgECBAgQIECAQCwgsGJQ5wgQIECAAAECAssGCBAgQIAAAQKxgMCKQZ0jQIAAAQIECAgsGyBAgAABAgQIxAICKwZ1jgABAgQIECAgsGyAAAECBAgQIBALCKwY1DkCBAgQIECAgMCyAQIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQICCwbIECAAAECBAjEAgIrBnWOAAECBAgQICCwbIAAAQIECBAgEAsIrBjUOQIECBAgQICAwLIBAgQIECBAgEAsILBiUOcIECBAgAABAgLLBggQIECAAAECsYDAikGdI0CAAAECBAgILBsgQIAAAQIECMQCAisGdY4AAQIECBAgILBsgAABAgQIECAQCwisGNQ5AgQIECBAgIDAsgECBAgQIECAQCwgsGJQ5wgQIECAAAECAssGCBAgQIAAAQKxgMCKQZ0jQIAAAQIECAgsGyBAgAABAgQIxAICKwZ1jgABAgQIECAgsGyAAAECBAgQIBALCKwY1DkCBAgQIECAgMCyAQIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQICCwbIECAAAECBAjEAgIrBnWOAAECBAgQICCwbIAAAQIECBAgEAsIrBjUOQIECBAgQICAwLIBAgQIECBAgEAsILBiUOcIECBAgAABAgLLBggQIECAAAECsYDAikGdI0CAAAECBAgILBsgQIAAAQIECMQCAisGdY4AAQIECBAgILBsgAABAgQIECAQCwisGNQ5AgQIECBAgIDAsgECBAgQIECAQCwgsGJQ5wgQIECAAAECAssGCBAgQIAAAQKxgMCKQZ0jQIAAAQIECAgsGyBAgAABAgQIxAICKwZ1jgABAgQIECAgsGyAAAECBAgQIBALCKwY1DkCBAgQIECAgMCyAQIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQICCwbIECAAAECBAjEAgIrBnWOAAECBAgQICCwbIAAAQIECBAgEAsIrBjUOQIECBAgQICAwLIBAgQIECBAgEAsILBiUOcIECBAgAABAgLLBggQIECAAAECsYDAikGdI0CAAAECBAgILBsgQIAAAQIECMQCAisGdY4AAQIECBAgILBsgAABAgQIECAQCwisGNQ5AgQIECBAgIDAsgECBAgQIECAQCwgsGJQ5wgQIECAAAECAssGCBAgQIAAAQKxgMCKQZ0jQIAAAQIECAgsGyBAgAABAgQIxAICKwZ1jgABAgQIECAgsGyAAAECBAgQIBALCKwY1DkCBAgQIECAgMCyAQIECBAgQIBALCCwYlDnCBAgQIAAAQICywYIECBAgAABArGAwIpBnSNAgAABAgQInB1YY4yJjQABAgQIECBA4LTAYR42f7mOdfPxRWCZEwECBAgQIEBgX0BgWQgBAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVhAYMWgzhEgQIAAAQIEBJYNECBAgAABAgRiAYEVgzpHgAABAgQIEBBYNkCAAAECBAgQiAUEVgzqHAECBAgQIEBAYNkAAQIECBAgQCAWEFgxqHMECBAgQIAAAYFlAwQIECBAgACBWEBgxaDOESBAgAABAgQElg0QIECAAAECBGIBgRWDOkeAAAECBAgQEFg2QIAAAQIECBCIBQRWDOocAQIECBAgQEBg2QABAgQIECBAIBYQWDGocwQIECBAgAABgWUDBAgQIECAAIFYQGDFoM4RIECAAAECBASWDRAgQIAAAQIEYgGBFYM6R4AAAQIECBAQWDZAgAABAgQIEIgFBFYM6hwBAgQIECBAQGDZAAECBAgQIEAgFhBYMahzBAgQIECAAAGBZQMECBAgQIAAgVjgVGAd7p42n2kZY8z4NThHgAABAgQIELgqgb3AenwbY95/vd3ldYzn2zEE1lV9/N4MAQIECBAgcAmBvcB6uPn5jC/vAusSn4GbBAgQIECAwJUJCKwr+0C9HQIECBAgQODvBX77ivD7FX5+VegvWH//eXkFBAgQIECAwD8QOPef3D8AFz/wyftYbtwAAAAASUVORK5CYII=",
        official: true,
    },
    "1d_nuke": {
        id: "1d_nuke",
        name: "Simulating Nukes in 1 Dimension",
        author: "sp",
        world: "fun stuff",
        saveCode: "V2;1;100-100;air-6797:monster:air-28:monster:air-70:monster:air-28:monster:air-58:monster:air-8:monster:air-2:monster:air:monster:air-26:monster:air-58:monster-3:air:monster:air-2:monster-6:air:monster:air-26:monster:air-57:monster-6:air:monster-9:air-26:monster:air-57:monster-16:air-26:monster-2:air-56:monster-16:air-26:monster-2:air-54:monster-18:air-20:monster:air:monster:air-2:monster-4:air-51:monster-20:air-20:monster-10:air-49:monster-21:air-16:monster:air:monster-13:air:monster:air-45:monster-22:air-15:monster-2:air:monster-15:air-2:monster:air-35:monster:air-2:monster:air-2:monster-23:air-15:monster-19:air:monster-2:air-34:monster:air-2:monster:air:monster-24:air-15:monster-23:air:monster-2:air-27:monster:air-2:monster:air-2:monster-26:air-14:monster-28:air-24:monster:air:monster-2:air:monster-29:air-5:monster:air-8:monster-28:air-24:monster-34:air:monster:air-3:monster:air-6:monster-31:air:monster-2:air-20:monster-34:air:monster:air-3:monster-2:air-5:monster-34:air:monster-2:air-8:monster:air-2:monster:air-4:monster-38:air:monster-3:air-5:monster-38:air-4:monster:air:monster-5:air-4:monster-42:air-4:monster-39:air-2:monster:air:monster-7:air-4:monster-44:air:monster-41:air:monster-9:air-3:monster-97:air-2:monster-98:air:monster-1038;0:10000;1-3300:0-100:1-6600;",
        inventory: {
            air: 1000000,
            wall: 1000000,
            dirt: 1000000,
            grass: 1000000,
            mud: 1000000,
            sand: 1000000,
            gravel: 1000000,
            concrete_powder: 1000000,
            concrete: 1000000,
            water: 1000000,
            ice: 1000000,
            snow: 1000000,
            steam: 1000000,
            lava: 1000000,
            fire: 1000000,
            water_pump: 1000000,
            lava_heater: 1000000,
            ice_freezer: 1000000,
            clay: 1000000,
            bricks: 1000000,
            stone: 1000000,
            basalt: 1000000,
            iron: 1000000,
            steel: 1000000,
            rubber: 1000000,
            glass: 1000000,
            wood: 1000000,
            leaves: 1000000,
            sapling: 1000000,
            plant: 1000000,
            moss: 1000000,
            lichen: 1000000,
            sponge: 1000000,
            super_sponge: 1000000,
            ash: 1000000,
            wood_crate: 1000000,
            steel_crate: 1000000,
            piston_left: 1000000,
            piston_up: 1000000,
            piston_right: 1000000,
            piston_down: 1000000,
            pusher_left: 1000000,
            pusher_up: 1000000,
            pusher_right: 1000000,
            pusher_down: 1000000,
            fan_left: 1000000,
            fan_up: 1000000,
            fan_right: 1000000,
            fan_down: 1000000,
            sticky_piston_left: 1000000,
            sticky_piston_up: 1000000,
            sticky_piston_right: 1000000,
            sticky_piston_down: 1000000,
            copier_left: 1000000,
            copier_up: 1000000,
            copier_right: 1000000,
            copier_down: 1000000,
            cloner_left: 1000000,
            cloner_up: 1000000,
            cloner_right: 1000000,
            cloner_down: 1000000,
            rotator_left: 1000000,
            rotator_up: 1000000,
            rotator_right: 1000000,
            rotator_down: 1000000,
            rotator_clockwise: 1000000,
            rotator_counterclockwise: 1000000,
            slider_horizontal: 1000000,
            slider_vertical: 1000000,
            collapsable: 1000000,
            slime: 1000000,
            deactivator: 1000000,
            observer_left_off: 1000000,
            observer_left_on: 1000000,
            observer_right_off: 1000000,
            observer_right_on: 1000000,
            observer_up_off: 1000000,
            observer_up_on: 1000000,
            observer_down_off: 1000000,
            observer_down_on: 1000000,
            gunpowder: 1000000,
            activated_gunpowder: 1000000,
            c4: 1000000,
            activated_c4: 1000000,
            detonator: 1000000,
            flamethrower_left: 1000000,
            flamethrower_up: 1000000,
            flamethrower_right: 1000000,
            flamethrower_down: 1000000,
            nuke: 1000000,
            activated_nuke: 1000000,
            nuke_defuser: 1000000,
            deleter: 1000000,
            laser_left: 1000000,
            laser_up: 1000000,
            laser_right: 1000000,
            laser_down: 1000000,
            laser_scatterer: 1000000,
            mirror_1: 1000000,
            mirror_2: 1000000,
            lag_spike_generator: 1000000,
            pink_sand: 1000000,
            red_sand: 1000000,
            // pickle: 1000000,
            // pickled_pickle: 1000000,
            // random: 1000000,
            life: 1000000,
            life_2: 1000000,
            life_3: 1000000,
            // triangle: 1000000,
            // ant_left_clockwise: 1000000,
            // ant_left_counterclockwise: 1000000,
            // ant_up_clockwise: 1000000,
            // ant_up_counterclockwise: 1000000,
            // ant_right_clockwise: 1000000,
            // ant_right_counterclockwise: 1000000,
            // ant_down_clockwise: 1000000,
            // ant_down_counterclockwise: 1000000,
            // anteater: 1000000,
            // monster: 1000000,
            // placement_restriction: 1000000,
            // goal: 1000000,
            // target: 1000000,
        },
        objectives: [
            {
                type: "destroyMonsters",
                target: "all",
            },
        ],
        img: "data:image/png;base64,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",
        official: true,
    },
};
let worlds = {

};

if (localStorage.getItem("puzzles") != null) {
    try {
        let json = JSON.parse(localStorage.getItem("puzzles"));
        for (let i in json) {
            if (puzzles[i] == null) {
                puzzles[i] = json[i];
            }
        }
    }
    catch (err) {
        modal("Puzzles Error", "The stored puzzles were unable to be loaded.<br><br>" + err.stack, "error");
    }
}

let puzzleProgress = {};

if (localStorage.getItem("puzzleProgress") != null) {
    try {
        puzzleProgress = JSON.parse(localStorage.getItem("puzzleProgress"));
    }
    catch (err) {
        modal("Puzzle Progress Error", "The stored puzzle progress was unable to be loaded.<br><br>" + err.stack, "error");
    }
}

let currentPuzzle = null;
// currentPuzzle = 1;

let targets = [];
function resetTargets() {
    targets = [];
};

let objectives = [];

let puzzleTooltip = document.getElementById("puzzleTooltip");
let puzzleTooltipName = document.getElementById("puzzleTooltipName");
let puzzleTooltipDescription = document.getElementById("puzzleTooltipDescription");

function showPuzzleTooltip(name, description) {
    puzzleTooltip.style.opacity = "1";
    puzzleTooltipName.innerHTML = name;
    puzzleTooltipDescription.innerHTML = description;
    // some text transition later
};
function hidePuzzleTooltip() {
    puzzleTooltip.style.opacity = "0";
};
function movePuzzleTooltip() {
    puzzleTooltip.style.left = mouseX / devicePixelRatio + "px";
    puzzleTooltip.style.right = "unset";
    puzzleTooltip.style.bottom = window.innerHeight - mouseY / devicePixelRatio + "px";
    // puzzleTooltip.style.left = rawMouseX + "px";
    // puzzleTooltip.style.right = "unset";
    // puzzleTooltip.style.top = rawMouseY + "px";
    // puzzleTooltip.style.bottom = "unset";
    var rect = puzzleTooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        puzzleTooltip.style.right = window.innerWidth - mouseX / devicePixelRatio + "px";
        puzzleTooltip.style.left = "unset";
    }
    // rect = puzzleTooltip.getBoundingClientRect();
    // if (rect.bottom > window.innerHeight) {
    //     puzzleTooltip.style.bottom = (window.innerHeight - rawMouseY) + "px";
    //     puzzleTooltip.style.top = "unset";
    // }
    // add the switch sides thing
};

const officialPuzzlesButton = document.getElementById("officialPuzzlesButton");
const customPuzzlesButton = document.getElementById("customPuzzlesButton");

const officialPuzzlesList = document.getElementById("officialPuzzlesList");
const customPuzzlesList = document.getElementById("customPuzzlesList");
const createCustomPuzzleContainer = document.getElementById("createCustomPuzzleContainer");

officialPuzzlesButton.onclick = function() {
    officialPuzzlesList.style.transform = "translateX(0%)";
    customPuzzlesList.style.transform = "translateX(100%)";
    createCustomPuzzleContainer.style.transform = "translateX(200%)";
};
customPuzzlesButton.onclick = function() {
    officialPuzzlesList.style.transform = "translateX(-100%)";
    customPuzzlesList.style.transform = "translateX(0%)";
    createCustomPuzzleContainer.style.transform = "translateX(100%)";
};

const uploadCustomPuzzleButton = document.getElementById("uploadCustomPuzzleButton");
const createCustomPuzzleButton = document.getElementById("createCustomPuzzleButton");

uploadCustomPuzzleButton.onclick = async function() {
    let file = await uploadFile([".json"]);
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            let json = JSON.parse(e.target.result);
            if (puzzles[json.id] != null) {
                if (puzzles[json.id].official) {
                    modal("Puzzle Already Exists", "An official puzzle with id '" + json.id + "' already exists.", "info");
                    return;
                }
                else if (!await modal("Overwrite Existing Puzzle?", "A puzzle with id '" + json.id + "' already exists. Continuing will overwrite this puzzle! This cannot be undone!", "confirm")) {
                    return;
                }
                puzzles[json.id].div.remove();
            }
            puzzles[json.id] = json;
            addPuzzle(json.id);
        }
        catch (err) {
            modal("Error Loading Puzzle", "An error occured while loading the puzzle.<br>" + err.stack, "error");
        }
    };
    reader.readAsText(file);
};
createCustomPuzzleButton.onclick = function() {
    officialPuzzlesList.style.transform = "translateX(-200%)";
    customPuzzlesList.style.transform = "translateX(-100%)";
    createCustomPuzzleContainer.style.transform = "translateX(0%)";
};

const createCustomPuzzleCloseButton = document.getElementById("createCustomPuzzleCloseButton");

createCustomPuzzleCloseButton.onclick = function() {
    officialPuzzlesList.style.transform = "translateX(-100%)";
    customPuzzlesList.style.transform = "translateX(0%)";
    createCustomPuzzleContainer.style.transform = "translateX(100%)";
};

const createCustomPuzzleId = document.getElementById("createCustomPuzzleId");
const createCustomPuzzleName = document.getElementById("createCustomPuzzleName");
const createCustomPuzzleAuthor = document.getElementById("createCustomPuzzleAuthor");
const createCustomPuzzleWorld = document.getElementById("createCustomPuzzleWorld");
const createCustomPuzzleSaveCode = document.getElementById("createCustomPuzzleSaveCode");
const createCustomPuzzleMusic = document.getElementById("createCustomPuzzleMusic");

createCustomPuzzleId.onkeydown = (e) => {
    e.stopImmediatePropagation();
};
createCustomPuzzleName.onkeydown = (e) => {
    e.stopImmediatePropagation();
};
createCustomPuzzleAuthor.onkeydown = (e) => {
    e.stopImmediatePropagation();
};
createCustomPuzzleWorld.onkeydown = (e) => {
    e.stopImmediatePropagation();
};
createCustomPuzzleSaveCode.onkeydown = (e) => {
    e.stopImmediatePropagation();
};

const createCustomPuzzleInventory = document.getElementById("createCustomPuzzleInventory");
const createCustomPuzzleInventoryList = document.getElementById("createCustomPuzzleInventoryList");

let createCustomPuzzleInventoryListNames = [];
let createCustomPuzzleInventoryListAmounts = [];

for (let i in pixels) {
    let name = document.createElement("label");
    name.setAttribute("for", "createCustomPuzzleInventoryList" + i);
    name.classList.add("createCustomPuzzleInventoryListName");
    name.innerText = pixels[i].name + ":";
    name.title = pixels[i].id;
    createCustomPuzzleInventoryList.appendChild(name);
    createCustomPuzzleInventoryListNames.push(name);
    let amount = document.createElement("input");
    amount.type = "number";
    amount.id = "createCustomPuzzleInventoryList" + i;
    amount.classList.add("createCustomPuzzleInventoryListAmount");
    amount.value = 0;
    amount.onkeydown = (e) => {
        e.stopImmediatePropagation();
    };
    createCustomPuzzleInventoryList.appendChild(amount);
    createCustomPuzzleInventoryListAmounts.push(amount);
}

createCustomPuzzleInventory.oninput = function() {
    for (let i in pixels) {
        if (pixels[i].name.toLowerCase().includes(createCustomPuzzleInventory.value.toLowerCase()) || pixels[i].id.toLowerCase().includes(createCustomPuzzleInventory.value.toLowerCase())) {
            createCustomPuzzleInventoryListNames[i].style.display = "block";
            createCustomPuzzleInventoryListAmounts[i].style.display = "block";
            // createCustomPuzzleInventoryListNames[i].style.height = "";
            // createCustomPuzzleInventoryListAmounts[i].style.height = "";
        }
        else {
            createCustomPuzzleInventoryListNames[i].style.display = "none";
            createCustomPuzzleInventoryListAmounts[i].style.display = "none";
            // createCustomPuzzleInventoryListNames[i].style.height = "0px";
            // createCustomPuzzleInventoryListAmounts[i].style.height = "0px";
        }
    }
};
createCustomPuzzleInventory.onkeydown = (e) => {
    e.stopImmediatePropagation();
};

const createCustomPuzzleObjectivesList = document.getElementById("createCustomPuzzleObjectivesList");
const createCustomPuzzleAddObjectiveButton = document.getElementById("createCustomPuzzleAddObjectiveButton");
const createCustomPuzzleObjectiveTemplate = document.getElementById("createCustomPuzzleObjectiveTemplate");
let createCustomPuzzleObjectives = [];

createCustomPuzzleAddObjectiveButton.onclick = function() {
    const objective = createCustomPuzzleObjectiveTemplate.content.cloneNode(true).children[0];
    let id = Math.random();
    objective.children[0].setAttribute("for", "createCustomPuzzleObjectiveType" + id);
    objective.children[1].id = "createCustomPuzzleObjectiveType" + id;
    objective.children[1].oninput = () => {
        if (objective.children[1].value == "destroyMonsters") {
            objective.children[2].style.display = "block";
            objective.children[3].style.display = "block";
        }
        else {
            objective.children[2].style.display = "none";
            objective.children[3].style.display = "none";
            objective.children[3].value = "";
        }
    }
    objective.children[2].setAttribute("for", "createCustomPuzzleObjectiveTargetAll" + id);
    objective.children[3].id = "createCustomPuzzleObjectiveTargetAll" + id;
    objective.children[4].setAttribute("for", "createCustomPuzzleObjectiveTarget" + id);
    objective.children[5].id = "createCustomPuzzleObjectiveTarget" + id;
    objective.children[5].onkeydown = (e) => {
        e.stopImmediatePropagation();
    };
    objective.children[6].setAttribute("for", "createCustomPuzzleObjectiveMin" + id);
    objective.children[7].id = "createCustomPuzzleObjectiveMin" + id;
    objective.children[7].onkeydown = (e) => {
        e.stopImmediatePropagation();
    };
    objective.children[8].setAttribute("for", "createCustomPuzzleObjectiveMax" + id);
    objective.children[9].id = "createCustomPuzzleObjectiveMax" + id;
    objective.children[9].onkeydown = (e) => {
        e.stopImmediatePropagation();
    };
    objective.children[10].onclick = () => {
        objective.remove();
        for (let i = 0; i < createCustomPuzzleObjectives.length; i++) {
            if (createCustomPuzzleObjectives[i] == objective) {
                createCustomPuzzleObjectives.splice(i, 1);
                break;
            }
        }
    };
    createCustomPuzzleObjectivesList.insertBefore(objective, createCustomPuzzleObjectivesList.lastElementChild);
    createCustomPuzzleObjectives.push(objective);
};

const createCustomPuzzleFinishButton = document.getElementById("createCustomPuzzleFinishButton");

createCustomPuzzleFinishButton.onclick = async function() {
    let id = createCustomPuzzleId.value;
    if (puzzles[id] != null) {
        if (puzzles[id].official) {
            modal("Puzzle Already Exists", "An official puzzle with id '" + id + "' already exists.", "info");
            return;
        }
        else if (!await modal("Overwrite Existing Puzzle?", "A puzzle with id '" + id + "' already exists. Continuing will overwrite this puzzle! This cannot be undone!", "confirm")) {
            return;
        }
        puzzles[id].div.remove();
    }
    puzzles[id] = {
        id: id,
        name: createCustomPuzzleName.value,
        author: createCustomPuzzleAuthor.value,
        world: createCustomPuzzleWorld.value,
        saveCode: createCustomPuzzleSaveCode.value,
        inventory: {},
        objectives: [],
        music: createCustomPuzzleMusic.value,
        img: "",
    };
    for (let i in pixels) {
        if (createCustomPuzzleInventoryListAmounts[i].value != 0) {
            puzzles[id].inventory[pixels[i].id] = Number(createCustomPuzzleInventoryListAmounts[i].value);
        }
    }
    for (let i in createCustomPuzzleObjectives) {
        let objective = {
            type: createCustomPuzzleObjectives[i].children[1].value,
        };
        if (createCustomPuzzleObjectives[i].children[3].checked) {
            objective.target = "all";
        }
        else if (createCustomPuzzleObjectives[i].children[5].value != "") {
            objective.target = Number(createCustomPuzzleObjectives[i].children[5].value);
        }
        if (createCustomPuzzleObjectives[i].children[7].value != "") {
            objective.min = Number(createCustomPuzzleObjectives[i].children[7].value);
        }
        if (createCustomPuzzleObjectives[i].children[9].value != "") {
            objective.max = Number(createCustomPuzzleObjectives[i].children[9].value);
        }
        puzzles[id].objectives.push(objective);
    }
    let parsed = parseSaveCode(createCustomPuzzleSaveCode.value);
    puzzles[id].img = drawBlueprintImg(parsed.grid, parsed.gridWidth, parsed.gridHeight, parsed.gridWidth * 6, parsed.gridHeight * 6);
    addPuzzle(id);
    officialPuzzlesList.style.transform = "translateX(-100%)";
    customPuzzlesList.style.transform = "translateX(0%)";
    createCustomPuzzleContainer.style.transform = "translateX(100%)";
};

function addPuzzle(id) {
    const puzzle = document.createElement("div");
    puzzle.classList.add("puzzle");
    if (puzzleProgress[id] != null && puzzleProgress[id].completed) {
        puzzle.classList.add("puzzleCompleted");
    }
    puzzle.style.backgroundImage = "url(" + puzzles[id].img + ")";
    puzzle.onclick = async () => {
        await transitionIn();
        loadPuzzle(id);
        gameContainer.style.display = "block";
        menuContainer.style.display = "none";
        await transitionOut();
    };
    puzzle.onmouseover = function() {
        if (puzzleProgress[id] != null && puzzleProgress[id].completed) {
            showPuzzleTooltip(puzzles[id].name, puzzles[id].author + "<br>" + puzzleProgress[id].ticks + " ticks");
        }
        else {
            showPuzzleTooltip(puzzles[id].name, puzzles[id].author);
        }
        movePuzzleTooltip();
    };
    puzzle.onmouseout = function() {
        hidePuzzleTooltip();
    };
    puzzle.onmousemove = function() {
        movePuzzleTooltip();
    };
    if (worlds[puzzles[id].world] == null) {
        const worldTitle = document.createElement("div");
        worldTitle.classList.add("puzzleWorld");
        worldTitle.innerText = puzzles[id].world;
        if (puzzles[id].official) {
            officialPuzzlesList.appendChild(worldTitle);
        }
        else {
            customPuzzlesList.appendChild(worldTitle);
        }
        const world = document.createElement("div");
        if (puzzles[id].official) {
            officialPuzzlesList.appendChild(world);
        }
        else {
            customPuzzlesList.appendChild(world);
        }
        worlds[puzzles[id].world] = world;
    }
    const downloadButton = document.createElement("button");
    downloadButton.classList.add("puzzleDownloadButton");
    downloadButton.classList.add("button");
    downloadButton.onclick = (e) => {
        e.stopImmediatePropagation();
        const blob = new Blob([JSON.stringify(puzzles[id])], { type: "application/json" });
        downloadFile(blob, puzzles[id].name + ".json");
    };
    downloadButton.onmouseover = (e) => {
        e.stopImmediatePropagation();
        hidePuzzleTooltip();
    };
    puzzle.appendChild(downloadButton);
    if (!puzzles[id].official) {
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("puzzleDeleteButton");
        deleteButton.classList.add("button");
        deleteButton.onclick = async (e) => {
            e.stopImmediatePropagation();
            if (await modal("Delete puzzle?", "'" + puzzles[id].name + "' will be lost forever!", "confirm")) {
                delete puzzles[id];
                puzzle.remove();
            }
        };
        deleteButton.onmouseover = (e) => {
            e.stopImmediatePropagation();
            hidePuzzleTooltip();
        };
        puzzle.appendChild(deleteButton);
    }
    worlds[puzzles[id].world].appendChild(puzzle);
    puzzles[id].div = puzzle;
};
for (let i in puzzles) {
    addPuzzle(i);
}

const puzzleOverlay = document.getElementById("puzzleOverlay");
const puzzleName = document.getElementById("puzzleName");
const puzzleAuthor = document.getElementById("puzzleAuthor");

function loadPuzzle(id) {
    currentPuzzle = id;
    multiplayerOverlay.style.display = "none";
    playButton.style.display = "block";
    stepButton.style.display = "block";
    simulateButton.style.display = "block";
    slowmodeButton.style.display = "block";
    resetButton.style.display = "block";
    if (id == null) {
        resetPixelInventory();
        puzzleOverlay.style.display = "none";
        return;
    }
    loadSaveCode(puzzles[id].saveCode);
    for (let i in pixels) {
        pixelInventory[i] = puzzles[id].inventory[pixels[i].id] ?? 0;
    }
    pixelInventory[AIR] = Infinity;
    resetPixelInventory();
    if (puzzleProgress[currentPuzzle] != null) {
        loadSaveCode(puzzleProgress[currentPuzzle].saveCode, false, true);
    }
    saveCode.value = generateSaveCode();
    puzzleOverlay.style.display = "";
    puzzleName.innerText = puzzles[id].name;
    puzzleAuthor.innerText = puzzles[id].author;
    // if >0 monsters
    objectives = [];
    puzzleObjectives.innerHTML = "";
    for (let i in puzzles[currentPuzzle].objectives) {
        let objective = puzzles[currentPuzzle].objectives[i];
        switch (objective.type) {
            case "destroyMonsters":
                let startMonsters = 0;
                for (let y = 0; y < gridHeight; y++) {
                    for (let x = 0; x < gridWidth; x++) {
                        if (grid[(x + y * gridWidth) * gridStride + ID] == MONSTER) {
                            startMonsters += 1;
                        }
                    }
                }
                function countMonsters() {
                    let monsters = 0;
                    for (let chunkY = 0; chunkY < chunkYAmount; chunkY++) {
                        for (let chunkX = 0; chunkX < chunkXAmount; chunkX++) {
                            if (nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride] == chunkX * chunkWidth + chunkWidth) {
                                continue;
                            }
                            let minX = nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride];
                            let maxX = nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 1];
                            let minY = nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 2];
                            let maxY = nextChunks[(chunkX + chunkY * chunkXAmount) * chunkStride + 3];
                            for (let y = minY; y <= maxY; y++) {
                                for (let x = minX; x <= maxX; x++) {
                                    let index = (x + y * gridWidth) * gridStride;
                                    if (grid[index + ID] == MONSTER) {
                                        monsters += 1;
                                    }
                                }
                            }
                        }
                    }
                    return monsters;
                };
                if (objective.target != null) {
                    if (objective.target == "all") {
                        addObjective("Destroy Monsters", function() {
                            let monsters = countMonsters();
                            return [startMonsters - monsters, startMonsters, monsters == 0];
                        });
                    }
                    else {
                        addObjective("Destroy " + objective.target + " Monsters", function() {
                            let monsters = countMonsters();
                            return [startMonsters - monsters, objective.target, startMonsters - monsters == objective.target];
                        });
                    }
                }
                else if (objective.max != null) {
                    if (objective.min != null) {
                        addObjective("Destroy " + objective.min + "-" + objective.max + " Monsters", function() {
                            let monsters = countMonsters();
                            return [startMonsters - monsters, objective.max, startMonsters - monsters <= objective.max && startMonsters - monsters >= objective.min];
                        });
                    }
                    else {
                        addObjective("Destroy <=" + objective.max + " Monsters", function() {
                            let monsters = countMonsters();
                            return [startMonsters - monsters, objective.max, startMonsters - monsters <= objective.max];
                        });
                    }
                }
                else if (objective.min != null) {
                    addObjective("Destroy >=" + objective.min + " Monsters", function() {
                        let monsters = countMonsters();
                        return [startMonsters - monsters, objective.min, startMonsters - monsters >= objective.min];
                    });
                }
                break;
            case "ticks":
                if (objective.target != null) {
                    addObjective("=" + objective.target + " Ticks", function() {
                        return [(tick - 1) / 7, objective.target, (tick - 1) / 7 == objective.target];
                    });
                }
                else if (objective.max != null) {
                    if (objective.min != null) {
                        addObjective(objective.min + "-" + objective.max + " Ticks", function() {
                            return [(tick - 1) / 7, objective.max, (tick - 1) / 7 <= objective.max && (tick - 1) / 7 >= objective.min];
                        });
                    }
                    else {
                        addObjective("<=" + objective.max + " Ticks", function() {
                            return [(tick - 1) / 7, objective.max, (tick - 1) / 7 <= objective.max];
                        });
                    }
                }
                else if (objective.min != null) {
                    addObjective(">=" + objective.min + " Ticks", function() {
                        return [(tick - 1) / 7, objective.min, (tick - 1) / 7 >= objective.min];
                    });
                }
                break;
            case "pixels":
                let placedPixels = 0;
                function countPlacedPixels() {
                    if (tick == 1) {
                        placedPixels = 0;
                        for (let y = 0; y < gridHeight; y++) {
                            for (let x = 0; x < gridWidth; x++) {
                                let index = (x + y * gridWidth) * gridStride;
                                if ((grid[index + PUZZLE_DATA] & 1) == 1) {
                                    continue;
                                }
                                if (grid[index + ID] != AIR) {
                                    placedPixels += 1;
                                }
                            }
                        }
                    }
                };
                if (objective.target != null) {
                    addObjective("=" + objective.target + " Pixels", function() {
                        countPlacedPixels();
                        return [placedPixels, objective.target, placedPixels == objective.target];
                    });
                }
                else if (objective.max != null) {
                    if (objective.min != null) {
                        addObjective(objective.min + "-" + objective.max + "Pixels", function() {
                            countPlacedPixels();
                            return [placedPixels, objective.max, placedPixels <= objective.max && placedPixels >= objective.min];
                        });
                    }
                    else {
                        addObjective("<=" + objective.max + " Pixels", function() {
                            countPlacedPixels();
                            return [placedPixels, objective.max, placedPixels <= objective.max];
                        });
                    }
                }
                else if (objective.min != null) {
                    addObjective(">=" + objective.min + " Pixels", function() {
                        countPlacedPixels();
                        return [placedPixels, objective.min, placedPixels >= objective.min];
                    });
                }
                break;
        }
    }
    updateObjectives();
};

const puzzleObjectives = document.getElementById("puzzleObjectives");
const puzzleObjectiveTemplate = document.getElementById("puzzleObjectiveTemplate");
function addObjective(name, update) {
    const objective = puzzleObjectiveTemplate.content.cloneNode(true);
    const objectiveName = objective.querySelector(".puzzleObjectiveName");
    objectiveName.innerText = name;
    const objectiveProgressBackground = objective.querySelector(".puzzleObjectiveProgressBackground");
    const objectiveProgressText = objective.querySelector(".puzzleObjectiveProgressText");
    puzzleObjectives.appendChild(objective);
    objectives.push({
        name: objectiveName,
        progressBackground: objectiveProgressBackground,
        progressText: objectiveProgressText,
        update: update,
    });
};
function updateObjectives() {
    let win = true;
    for (let i in objectives) {
        let progress = objectives[i].update();
        objectives[i].progressText.innerText = progress[0] + "/" + progress[1];
        objectives[i].progressBackground.style.width = Math.min(progress[0] / progress[1], 1) * 100 + "%";
        objectives[i].progressBackground.style.backgroundColor = progress[2] ? "green" : "red";
        if (!progress[2]) {
            win = false;
        }
    }
    if (win) {
        // idk win lolll
        if (puzzleProgress[currentPuzzle] == null) {
            puzzleProgress[currentPuzzle] = {
                saveCode: saveCode.value,
                completed: false,
                ticks: -1,
                pixels: -1,
            };
        }
        if (!puzzleProgress[currentPuzzle].completed) {
            puzzles[currentPuzzle].div.classList.add("puzzleCompleted");
        }
        puzzleProgress[currentPuzzle].completed = true;
        if (puzzleProgress[currentPuzzle].ticks == -1) {
            puzzleProgress[currentPuzzle].ticks = (tick - 1) / 7;
        }
        else {
            puzzleProgress[currentPuzzle].ticks = Math.min((tick - 1) / 7, puzzleProgress[currentPuzzle].ticks);
        }
        // store min pixels used as well?
        congratulationsContainer.classList.remove("hidden");
        congratulationsSubtitle.innerHTML = (tick - 1) / 7 + " ticks";
        setRunState("paused");
    }
};

const congratulationsContainer = document.getElementById("congratulationsContainer");
const congratulationsSubtitle = document.getElementById("congratulationsSubtitle");

const congratulationsResetButton = document.getElementById("congratulationsResetButton");
const congratulationsContinueButton = document.getElementById("congratulationsContinueButton");

congratulationsResetButton.onclick = () => {
    congratulationsContainer.classList.add("hidden");
    resetGrid();
};
congratulationsContinueButton.onclick = async () => {
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
    slideInPuzzles();
    await transitionIn();
    congratulationsContainer.classList.add("hidden");
    gameContainer.style.display = "none";
    menuContainer.style.opacity = 1;
    menuContainer.style.pointerEvents = "auto";
    menuContainer.style.display = "block";
    await transitionOut();
};

export { puzzles, puzzleProgress, currentPuzzle, targets, resetTargets, loadPuzzle, updateObjectives };