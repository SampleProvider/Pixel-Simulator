import { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, tick, modal, setRunState, generateSaveCode, parseSaveCode, loadSaveCode, mouseX, mouseY } from "./game.js";
import { pixels, pixelInventory, resetPixelInventory, pixelInventoryUpdates, updatePixelInventory } from "./pixels.js";
import { transitionIn, transitionOut, slideInPuzzles } from "./menu.js";

const ID = 0;

let puzzles = {
    test: {
        id: "test",
        name: "test level",
        author: "sp",
        world: "tset world",
        saveCode: "V1;512-512;air-61621:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-40106:wall:air-510:wall:air-510:wall:air-511:wall:air-511:wall:air-10:wall-2:air-499:wall-3:air-3:wall-5:air-504:wall-3:air-1013:wall:air-512:wall:air-2:wall:air-833:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-511:glass:air-12100:wall-9:air-503:wall-9:air-503:wall-9:air-503:wall-9:air-503:wall-9:air-503:wall-9:air-496:wall-16:air-496:wall-16:air-496:wall-5:air-2:wall-9:air-4894:wall-15:air-497:wall-16:air-496:wall-17:air-495:wall-19:air-493:wall-20:air-492:wall-22:air-490:wall-23:air-489:wall-25:air-487:wall-26:air-486:wall-27:air-485:wall-28:air-484:wall-29:air-483:wall-30:air-482:wall-32:air-480:wall-33:air-480:wall-33:air-480:wall-33:air-480:wall-33:air-481:wall-32:air-481:wall-31:air-483:wall-30:air-483:wall-30:air-484:wall-29:air-484:wall-28:air-485:wall-28:air-485:wall-28:air-485:wall-28:air-485:wall-27:air-487:wall-26:air-487:wall-25:air-488:wall-25:air-488:wall-24:air-489:wall-24:air-488:wall-24:air-489:wall-24:air-489:wall-23:air-490:wall-23:air-489:wall-23:air-490:wall-23:air-490:wall-22:air-491:wall-22:air-490:wall-22:air-491:wall-21:air-491:wall-22:air-491:wall-21:air-491:wall-21:air-492:wall-21:air-491:wall-21:air-492:wall-20:air-492:wall-20:air-493:wall-20:air-492:wall-20:air-97:wall-2:air-394:wall-19:air-493:wall-20:air-97:wall-9:air-387:wall-19:air-97:wall-10:air-386:wall-19:air-97:wall-10:air-386:wall-19:air-97:wall-10:air-387:wall-18:air-97:wall-10:air-387:wall-18:air-97:wall-10:air-387:wall-18:air-97:wall-10:air-388:wall-17:air-97:wall-10:air-388:wall-17:air-97:wall-10:air-388:wall-17:air-98:wall-9:air-388:wall-17:air-496:wall-16:air-496:wall-16:air-496:wall-16:air-497:wall-15:air-497:wall-15:air-497:wall-15:air-497:wall-15:air-496:wall-16:air-496:wall-16:air-496:wall-16:air-496:wall-16:air-496:wall-16:air-496:wall-16:air-496:wall-16:air-496:wall-16:air-495:wall-17:air-495:wall-17:air-495:wall-17:air-407:wall-32:air-56:wall-17:air-399:wall-42:air-54:wall-17:air-392:wall-51:air-51:wall-18:air-388:wall-57:air-49:wall-17:air-385:wall-63:air-47:wall-17:air-381:wall-69:air-45:wall-17:air-378:wall-73:air-43:wall-18:air-376:wall-76:air-42:wall-18:air-374:wall-80:air-40:wall-18:air-372:wall-83:air-39:wall-18:air-370:wall-86:air-37:wall-19:air-369:wall-89:air-35:wall-18:air-368:wall-92:air-34:wall-18:air-366:wall-95:air-32:wall-19:air-364:wall-98:air-31:wall-19:air-362:wall-61:air-4:wall-35:air-30:wall-20:air-360:wall-55:air-14:wall-34:air-29:wall-19:air-360:wall-49:air-23:wall-33:air-28:wall-19:air-359:wall-46:air-29:wall-32:air-26:wall-20:air-358:wall-43:air-35:wall-30:air-26:wall-20:air-357:wall-40:air-41:wall-29:air-24:wall-20:air-357:wall-38:air-45:wall-29:air-23:wall-20:air-356:wall-37:air-48:wall-29:air-21:wall-21:air-355:wall-36:air-52:wall-27:air-21:wall-21:air-354:wall-35:air-55:wall-27:air-19:wall-21:air-354:wall-34:air-58:wall-27:air-17:wall-22:air-353:wall-34:air-61:wall-25:air-17:wall-22:air-352:wall-33:air-64:wall-25:air-15:wall-22:air-352:wall-32:air-67:wall-25:air-13:wall-23:air-352:wall-30:air-69:wall-26:air-12:wall-22:air-352:wall-29:air-72:wall-25:air-11:wall-23:air-352:wall-27:air-75:wall-25:air-9:wall-24:air-351:wall-27:air-77:wall-25:air-7:wall-24:air-351:wall-27:air-78:wall-25:air-5:wall-26:air-351:wall-26:air-80:wall-25:air-3:wall-26:air-351:wall-26:air-82:wall-25:air:wall-27:air-351:wall-25:air-84:wall-51:air-351:wall-25:air-85:wall-51:air-351:wall-24:air-87:wall-49:air-352:wall-23:air-89:wall-47:air-353:wall-22:air-90:wall-47:air-352:wall-22:air-34:wall-18:air-40:wall-45:air-353:wall-21:air-30:wall-5:air-18:wall-5:air-36:wall-43:air-354:wall-21:air-29:wall:air-28:wall-4:air-33:wall-42:air-354:wall-20:air-28:wall-2:air-33:wall-2:air-31:wall-41:air-355:wall-20:air-27:wall:air-37:wall-2:air-30:wall-39:air-356:wall-19:air-26:wall-2:air-40:wall-2:air-29:wall-37:air-356:wall-19:air-26:wall:air-44:wall-2:air-27:wall-36:air-357:wall-19:air-25:wall:air-47:wall:air-27:wall-33:air-359:wall-18:air-26:wall:air-48:wall:air-27:wall-31:air-360:wall-18:air-25:wall:air-50:wall:air-27:wall-29:air-361:wall-17:air-25:wall:air-52:wall-2:air-25:wall-28:air-362:wall-17:air-25:wall:air-54:wall:air-25:wall-26:air-363:wall-17:air-24:wall:air-56:wall:air-22:wall-27:air-364:wall-17:air-24:wall:air-56:wall:air-14:wall-8:air-5:wall-21:air-365:wall-16:air-24:wall:air-58:wall:air-9:wall-4:air-15:wall-17:air-367:wall-16:air-24:wall:air-58:wall:air-5:wall-4:air-23:wall-2:air-378:wall-16:air-24:wall:air-59:wall-5:air-29:wall:air-377:wall-16:air-24:wall:air-58:wall-2:air-34:wall:air-376:wall-16:air-24:wall:air-56:wall-2:air-2:wall:air-34:wall:air-375:wall-17:air-24:wall:air-52:wall-3:air-4:wall:air-35:wall:air-374:wall-17:air-25:wall:air-49:wall-2:air-8:wall:air-35:wall:air-373:wall-17:air-26:wall:air-46:wall-2:air-10:wall:air-35:wall:air-373:wall-17:air-27:wall-2:air-42:wall-2:air-13:wall:air-35:wall:air-372:wall-18:air-28:wall-2:air-39:wall:air-15:wall:air-36:wall:air-371:wall-18:air-30:wall-2:air-32:wall-5:air-17:wall:air-35:wall:air-371:wall-19:air-31:wall-2:air-29:wall-2:air:wall:air-19:wall:air-36:wall:air-371:wall-19:air-32:wall-3:air-21:wall-5:air:wall-2:air-21:wall:air-35:wall:air-371:wall-19:air-35:wall-4:air-12:wall-5:air-5:wall:air-24:wall:air-35:wall:air-370:wall-20:air-38:wall-12:air-9:wall:air-25:wall:air-35:wall:air-370:wall-21:air-58:wall:air-26:wall:air-35:wall:air-369:wall-21:air-57:wall:air-28:wall:air-34:wall:air-369:wall-22:air-55:wall:air-30:wall:air-33:wall:air-369:wall-23:air-53:wall:air-31:wall-3:air-32:wall:air-369:wall-22:air-53:wall:air-66:wall:air-369:wall-23:air-51:wall:air-68:wall:air-368:wall-24:air-49:wall:air-69:wall:air-368:wall-26:air-47:wall:air-70:wall:air-368:wall-26:air-45:wall:air-71:wall:air-368:wall-27:air-44:wall:air-71:wall:air-369:wall-27:air-42:wall:air-73:wall:air-369:wall-28:air-40:wall:air-73:wall:air-369:wall-29:air-38:wall:air-75:wall:air-369:wall-29:air-37:wall:air-75:wall:air-370:wall-29:air-35:wall:air-77:wall:air-369:wall-31:air-33:wall:air-77:wall:air-370:wall-31:air-32:wall:air-77:wall:air-371:wall-32:air-29:wall:air-79:wall:air-370:wall-34:air-27:wall:air-79:wall:air-371:wall-36:air-24:wall:air-80:wall:air-371:wall-38:air-20:wall:air-81:wall:air-372:wall-39:air-18:wall:air-82:wall:air-246:dirt-2:air-125:wall-40:air-15:wall:air-82:wall:air-245:stone-4:air-125:wall-43:air-10:wall:air-83:wall:air-375:wall-47:air-3:wall-15:air-72:wall:air-375:wall-64:air-72:wall:air-377:wall-62:air-73:wall:air-377:wall-61:air-73:wall:air-378:wall-60:air-74:wall:air-378:wall-59:air-74:wall:air-380:wall-57:air-74:wall:air-381:wall-56:air-75:wall:air-382:wall-54:air-75:wall:air-384:wall-52:air-76:wall:air-386:wall-49:air-76:wall:air-389:wall-46:air-77:wall:air-390:wall-44:air-77:wall:air-229:wall-8:air:dirt:air-4:dirt:air:wall-9:air-139:wall-41:air-78:wall:air-220:wall-8:air-8:wall-8:air-8:wall:air-143:wall-37:air-78:wall:air-219:wall:air-4:leaves-3:air-25:wall:air-148:wall-32:air-78:wall:air-219:wall:air-3:leaves-5:air-19:stone:air-2:stone:air:wall:air-153:wall-26:air-79:wall:air-219:wall:air-3:leaves-2:wood:leaves-2:air:goal:air-3:goal:air-4:goal:air-9:stone-2:air-2:wall:air-177:wall-5:air-77:wall:air-218:wall:air-5:wood:air-2:concrete_powder-2:air:goal:air:wood-2:air-2:grass:dirt:stone:goal:air-11:wall:air-182:wall-4:air-73:wall:air-218:wall:air:goal:air:goal:air:wood:goal:concrete_powder-2:concrete:water-6:grass:dirt-2:stone:basalt:lava-6:basalt:air-4:wall:air-186:wall-9:air-64:wall:air-218:wall:grass:dirt:grass:dirt:grass:dirt-3:concrete_powder-2:plant:water-4:mud:dirt-3:stone-2:basalt:lava-3:basalt-2:stone:air-4:wall:air-259:wall:air-218:wall:dirt-11:mud-4:dirt-3:stone-4:basalt-3:stone-3:air-4:wall:air-260:wall:air-217:wall:dirt-16:stone-12:air-4:wall:air-260:wall:air-217:wall-34:air-260:wall:air-511:wall:air-511:wall:air-511:wall:air-511:wall:air-511:wall:air-511:wall:air-511:wall:air-511:wall:air-511:wall:air-511:wall:air-510:wall:air-511:wall:air-510:wall:air-511:wall:air-510:wall:air-511:wall:air-510:wall:air-510:wall:air-510:wall:air-510:wall:air-510:wall:air-508:wall-3:air-12645:ash-2:air-363;0:234616:1:1:2:508:3:2:1:27010;0-10325:1-14:0-498:1-20:0-492:1-26:0-486:1-29:0-483:1-31:0-481:1-32:0-480:1-33:0-479:1-35:0-477:1-36:0-476:1-38:0-474:1-39:0-473:1-12:0-6:1-22:0-472:1-13:0-8:1-21:0-471:1-12:0-10:1-20:0-470:1-13:0-10:1-20:0-469:1-14:0-10:1-20:0-469:1-14:0-11:1-19:0-468:1-15:0-11:1-19:0-468:1-15:0-12:1-18:0-467:1-16:0-12:1-18:0-467:1-16:0-12:1-17:0-467:1-17:0-13:1-16:0-467:1-17:0-13:1-16:0-467:1-17:0-13:1-16:0-467:1-17:0-13:1-16:0-467:1-17:0-13:1-16:0-467:1-17:0-13:1-15:0-468:1-17:0-13:1-15:0-468:1-17:0-12:1-15:0-469:1-17:0-12:1-15:0-469:1-17:0-12:1-14:0-470:1-17:0-12:1-14:0-470:1-17:0-12:1-13:0-471:1-17:0-12:1-13:0-471:1-17:0-11:1-13:0-472:1-17:0-11:1-13:0-472:1-18:0-9:1-13:0-473:1-18:0-9:1-13:0-473:1-18:0-8:1-13:0-474:1-18:0-8:1-13:0-474:1-18:0-7:1-13:0-475:1-18:0-7:1-13:0-475:1-18:0-6:1-13:0-476:1-18:0-6:1-13:0-476:1-18:0-5:1-13:0-478:1-17:0-5:1-12:0-479:1-17:0-4:1-12:0-480:1-17:0-4:1-12:0-480:1-18:0-2:1-12:0-481:1-18:0-2:1-11:0-482:1-18:0:1-11:0-483:1-18:0:1-10:0-484:1-28:0-485:1-28:0-485:1-27:0-486:1-26:0-487:1-25:0-489:1-23:0-490:1-22:0-491:1-21:0-492:1-20:0-493:1-19:0-495:1-18:0-495:1-18:0-492:1-21:0-488:1-25:0-485:1-28:0-481:1-32:0-477:1-36:0-474:1-38:0-471:1-42:0-464:1-49:0-454:1-41:0-2:1-16:0-443:1-49:0-5:1-16:0-433:1-55:0-9:1-16:0-407:1-78:0-12:1-16:0-349:1-132:0-16:1-16:0-348:1-129:0-19:1-17:0-347:1-127:0-22:1-17:0-346:1-124:0-26:1-16:0-346:1-118:0-33:1-16:0-345:1-109:0-43:1-16:0-344:1-99:0-54:1-16:0-343:1-90:0-64:1-15:0-343:1-65:0-90:1-15:0-498:1-15:0-498:1-15:0-497:1-15:0-498:1-15:0-498:1-15:0-498:1-14:0-498:1-15:0-498:1-15:0-498:1-15:0-498:1-14:0-498:1-15:0-498:1-14:0-499:1-14:0-498:1-14:0-499:1-13:0-500:1-12:0-501:1-11:0-501:1-11:0-502:1-10:0-502:1-10:0-503:1-9:0-503:1-9:0-503:1-9:0-503:1-9:0-503:1-9:0-195916;",
        inventory: {
            dirt: 1,
        },
        img: "sdf",
        official: true,
    },
    test2: {
        id: "test2",
        name: "test level 2",
        author: "sp",
        world: "tset world",
        saveCode: "V1;20-20;air-24:water-9:air-7:water-13:air-7:water-13:air-7:water-13:air-7:water-13:air-7:water-13:air-7:water-13:air-7:water-13:air-7:water-13:air-7:water-9:air-131:monster-3:air-17:monster-3:air-17:monster-3:air-16;0:400;0-399;",
        inventory: {
            dirt: 1,
        },
        img: "sdf",
        official: true,
    },
    test3: {
        id: "test3",
        name: "test level 3",
        author: "sp",
        world: "tset world",
        saveCode: "V1;20-20;air-146:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood-9:air-19:wood:air-19:wood:air-19:wood:air:sand-4:air-14:wood:sand-5:air-14:wood:sand-5:monster-11:air-3:wood:sand-4;0:400;0-280:1-14:0-6:1-14:0-6:1-14:0-6:1-14:0-6:1-14:0-6:1-14:0-5;",
        inventory: {
            dirt: 1,
            water: 100,
            sand: 1,
            nuke: 100000,
        },
        img: "sdf",
        official: true,
    },
    test3: {
        id: "test3",
        name: "test level 3",
        author: "sp",
        world: "tset world",
        saveCode: "V1;20-20;air-146:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood:air-7:wood:air-11:wood-9:air-19:wood:air-19:wood:air-19:wood:air:sand-4:air-14:wood:sand-5:air-14:wood:sand-5:monster-11:air-3:wood:sand-4;0:400;0-280:1-14:0-6:1-14:0-6:1-14:0-6:1-14:0-6:1-14:0-6:1-14:0-5;",
        inventory: {
            dirt: 1,
            water: 100,
            sand: 1,
            nuke: 100000,
        },
        img: "sdf",
        official: true,
    },
    "pixel_simulator": {
        id: "pixel_simulator",
        name: "Pixel Simulator",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-239:concrete_powder:air-29:concrete_powder:air-28:concrete_powder-2:air-28:concrete_powder-2:air-27:concrete_powder-3:air-27:concrete_powder-3:air-26:concrete_powder-4:air-22:concrete-8:air-27:concrete:air-30:concrete:air-30:concrete:air-60:water-11:sand-2:air-15:grass-2:mud-2:water-8:sand-3:grass-9:air-3:grass-3:dirt-4:mud-4:water-3:gravel:sand-2:dirt-10:grass-3:dirt-11:gravel-4:sand:dirt-26:gravel-2:sand:dirt-50:stone-2:dirt-20:stone-5:dirt-3:stone-3:dirt-2:stone-7:dirt-6:stone-71;0:900;0-899;",
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
        img: "sdf",
        official: true,
    },
    "gravity": {
        id: "gravity",
        name: "Gravity",
        author: "sp",
        world: "A Grid of Numbers",
        saveCode: "V2;1;30-30;air-490:leaves-3:air-8:leaves-3:air-15:leaves-5:air-5:leaves-6:air-14:leaves-2:wood:leaves-2:air-4:leaves-3:wood:leaves-3:air-15:leaves:wood:leaves:air-5:leaves-3:wood:leaves-3:air-4:sand:air-11:wood:air-7:leaves:wood:leaves-3:air-4:sand-2:grass-2:air-9:wood:air-8:wood:air-6:sand-3:dirt-2:grass:air-8:wood:air-8:wood:air-5:sand-4:dirt-3:grass-2:air:monster:air-4:grass-8:air:wood:air-4:sand-5:dirt-5:grass-6:dirt-8:monster:grass:air-2:monster:sand-4:dirt-23:grass-5:dirt-123;0:900;0-450:1-449;",
        inventory: {
            dirt: 1,
            sand: 1,
            water: 1,
        },
        img: "sdf",
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
        img: "sdf",
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
        img: "sdf",
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
        img: "sdf",
        official: true,
    },
};
let worlds = {

};

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

officialPuzzlesButton.onclick = function() {
    officialPuzzlesList.style.display = "block";
    customPuzzlesList.style.display = "none";
};
customPuzzlesButton.onclick = function() {
    officialPuzzlesList.style.display = "none";
    customPuzzlesList.style.display = "block";
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
    if (id == null) {
        resetPixelInventory();
        puzzleOverlay.style.display = "none";
        return;
    }
    loadSaveCode(puzzles[id].saveCode);
    for (let i in pixels) {
        pixelInventory[i] = puzzles[id].inventory[pixels[i].id] ?? 0;
    }
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
    let startMonsters = 0;
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (grid[(x + y * gridWidth) * gridStride + ID] == MONSTER) {
                startMonsters += 1;
            }
        }
    }
    if (startMonsters > 0) {
        addObjective("Destroy Monsters", function() {
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
            return [startMonsters - monsters, startMonsters];
        });
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
addObjective("test objective", function() {
    return [3, 3];
});
addObjective("Destroy Monsters", function() {
    var startMonsters = 10;
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

                    if (pixels[grid[index + ID]].id == "monster") {
                        monsters += 1;
                    }
                }
            }
        }
    }
    return [startMonsters - monsters, startMonsters];
});
addObjective("Bork RPS", function() {
    return [1, 1];
});
function updateObjectives() {
    let win = true;
    for (let i in objectives) {
        let progress = objectives[i].update();
        objectives[i].progressText.innerText = progress[0] + "/" + progress[1];
        objectives[i].progressBackground.style.width = progress[0] / progress[1] * 100 + "%";
        if (progress[0] != progress[1]) {
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
    loadSaveCode(puzzles[currentPuzzle].saveCode);
    for (let i in pixels) {
        pixelInventory[i] = puzzles[currentPuzzle].inventory[pixels[i].id] ?? 0;
    }
    resetPixelInventory();
    loadSaveCode(saveCode.value, false, true);
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