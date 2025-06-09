import { grid, gridWidth, gridHeight, gridStride, chunks, nextChunks, chunkWidth, chunkHeight, chunkXAmount, chunkYAmount, chunkStride, tick, modal, setRunState, generateSaveCode, parseSaveCode, loadSaveCode, mouseX, mouseY, resetGrid } from "./game.js";
import { pixels, pixelInventory, resetPixelInventory, pixelInventoryUpdates, updatePixelInventory } from "./pixels.js";
import { transitionIn, transitionOut, slideInPuzzles } from "./menu.js";

const ID = 0;
const PUZZLE_DATA = 2;

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
        img: "data:image/png;base64,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",
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
        img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAAAXNSR0IArs4c6QAACrpJREFUeF7t3a9yHNkVx/ERDTFJUmXVVohJsMjmHSTgNwjx0vUTLAkK1ZKA+CEMRu8QE+MQk1RKrtpdYhKqlKJRJCfd0pw7d/re0/djuHv/nPv9na+73dPSnNzc3Nxs/EEAgZQETgicMjdFI/AfAgTWCAgkJkDgxOEpHQEC6wEEEhMgcOLwlI4AgfUAAokJEDhxeEpHgMB6AIHEBAicODylI0BgPYBAYgIEThye0hEgsB5AIDEBAicOT+kIEFgPIJCYAIETh6d0BAisBxBITIDAicNTOgIE1gMIJCZA4MThKR0BAusBBBITIHDi8JSOAIH1AAKJCRA4cXhKR4DAegCBxAQInDg8pSNAYD2AQGICBE4cntIRILAeQCAxAQInDk/pCBBYDyCQmACBE4endAQIrAcQSEyAwInDUzoCBNYDCCQmQODE4SkdAQLrgS4IXFxcTNfxclunvs/T62+3ldavU2V4FQKHkZlwDAIELqNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZhUSOH1/Ojnz7N1Z4YqHTfv45uPkAtevrw9beKHZBF4ItG3uCBC4bicQuC5Pqz1DgMB1W4TAdXlajcCL9gCBF8VtM1fguj1A4Lo8reYKvGgPEHhR3ONs9vbt28nDvvj0Y1cQvrz6PlTP5eVlaPyxBxP42IQHXZ/AywRP4GU4D7cLgZeJnMDLcB5uFwIvEzmBl+E83C4EXiZyAi/DebhdCLxM5ARehrNddgTmxI4Cij7Nzv60eY4PgaOdY/xBBAh8EL7/m0zgujyt9gwBAtdtEQLX5Wk1Ai/aAwReFLfNXIHr9gCB6/K0mivwoj1A4EVx22yOQK0rc5Rwb+82R+sncJSY8UchQOAyrAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42ZWZQIELgNK4DJuZlUmQOAyoAQu42YWAl0QIHAXMSgCgTICBC7jZhYCXRAgcBcxKAKBMgIELuNmFgJdECBwFzEoAoEyAgTecZv7esvty6sysv8z6+Lz+eQ62+22yvoWGZMAgQk8Zuev5NQEJvBKWnnMYxCYwGN2/kpOTWACr6SVxzwGgQk8Zuev5NQEJvBKWnnMYxCYwGN2/kpOTWACr6SVxzwGgQk8Zuev5NQEJvBKWnnMYxCYwGN2/kpOTWACr6SVxzwGgQk8Zuev5NQEJvBKWnnMYxCYwGN2/kpOTWACr6SVxzwGgQk8Zuev5NSrFfj0/WkoorN3Z6HxtQZ/fPNxcqnr19e1trDOigkQeBcugVfc5Ss+GoEJvOL2Xv/RCEzg9Xf5ik9IYAKvuL3XfzQCE3j9Xb7iE6YXeO5rKV98+jF1bF9efT9Z/+XlZepzKb4uAQLX5VltNQJXQ7nqhQjcabwE7jSYzsoicGeB3JdD4E6D6awsAncWCIE7DaTTsgjcaTCuwJ0G01lZqxV4jnNvT6fnRJ2r31PozgxqXA6BGwdA4MYBJN+ewI0DJHDjAJJvT+DGARK4cQDJtydw4wAJ3DiA5NsTuHGABG4cQPLt0ws8x3/uHeloXtGn1lEhPW2OJmL8YwIEfqYfCEyYngkQmMA996faniFAYAKTJDEBAhM4cfsqncAEZkFiAqsVOJpJrafW0X292xwlZvwQT6GjMRM4Ssz4Hgi4Au9SIHAP7aiGKAECEzjaM8Z3RIDABO6oHZUSJUBgAkd7xviOCBC4ozCUgkCUAIGjxIxHoCMCBO4oDKUgECVA4Cgx4xHoiACBOwpDKQhECRA4Ssx4BDoiQOCOwlAKAlECBI4SMx6BjggQuKMwlIJAlACBo8SMR6AjAgTuKAylIBAlQOAoMeMR6IgAgTsKQykIRAkQOErMeAQ6IkDgjsJQCgJRAgSOEjMegY4IELijMJSCQJQAgaPEjEegIwIE7igMpSAQJUDgKDHjEeiIAIE7CkMpCEQJEDhKzHgEOiJA4I7CUAoCUQIEjhIzHoGOCJycn5/fTNWz3W6blHlxcTG5b6t6mkCwKQJ7EiDwnqAMQ6BHAgTuMRU1IbAnAQLvCcowBHokQOAeU1ETAnsSIPCeoAxDoEcCswKfn583qffq6spT6CbkbXoMAt99Oqmy7F9fTX5YtCFwFbwWQWCaAIF3XHwOTJGMBAhM4Ix9q+YdAQITmAyJCRCYwInbV+kEJjALEhCoJWr0qJ5CR4kZj8AEAQLvoPgcmB8ZCRCYwBn7Vs2VnzZHgbqFjhIzHgG30PM94BaaHxkJuIV2C52xb9VceAt99ueHnzV4+fIB49Ufp38WYA60W2gtiEAFAtErMIErQLcEArUIENgtdK1esk4DAgQmcIO2s2UtAgQmcK1esk4DAgQmcIO2s+WxCcyJHX2I5TdyHDsp6yMwQYDAOyh+Iwc/MhIgMIEz9q2adwQITGAyJCZAYAInbl+lE5jALFghgb989/AtnI/fhX79p9i3gnoXeoXN4Uj9EyBw/xmpEIFZAgTWHAgkJkDgxOEpHQEC6wEEEhMYTuAfPkz/poJvf57+1rbE2RaV/uE309+Ch08RzvCkKP8hBf7DL5vNze/u2J78Y7P52683Gw16x+O2gfAJe1dtQpT/kAJ/+6uveX/4F4Hvidw2ED7VfAwvFOVP4NurDoH/22jRBgp3qAlPEojyH1Lg21vE+z+3t9IEfuBxfwuHT5u/aaL8hxR4Khr/Bn74NzA+beS9fwYR4X90gduhmN75bDP9FPrdm0e/VPeAoq9fXx8wu/7UuYA/f37Y6/E7tLX+e/Rd3Pon73vF0/enoQLn+ioq8NxT7tl3oUNVLjCYwHeQa4k6tw6Bn27mlgJPfcpA4F1ersB3IAjcr8BTnzIQmMCbQ36cbYGbr662aHkFJvATreAK7Aq8z98ULQWe+hTGFdgV2BV4H3N3Y1oKPFXmyQ/nm6FeJv7py3Ra//z9UBgCLTvm0G/+Pv1u+W9fxHjMfUry5t2jjxMeLRkdT+AdPALHGnPtowncacKuwJ0G01lZBO4skPtyCNxpMJ2VReDOAiFwp4F0WhaBOw3GFbjTYDori8CdBfJcOXNiz83z0Os5osf9/3OC1do1+rS51r7RdYZ7Cj0HiMDR1mk7nsB3/Am860MCtxUyujuBCfxVzxA4qlDb8QQmMIHbOnjQ7gQmMIEPUqjtZAIT+KAOjN5yj/Y0m2AHtdfekz3E2hvV1wMJ/DQ4Ahc2VnAagYPA7ocTmMCFrVN1GoELcRKYwIWtU3UagQtxEpjAha1TdRqBC3ESmMCFrVN1GoGr4owvVusvgvjOx52R5V3i41I4/uoEPj7jJ3cgcOMAkm9P4MYBErhxAMm3J3DjAAncOIDk2xO4cYAEbhxA8u0J3DhAAjcOIPn2BE4eoPLHJkDgsfN3+uQECJw8QOWPTYDAY+fv9MkJEDh5gMofmwCBx87f6ZMTIHDyAJU/NgECj52/0ycnQODkASp/bAIEHjt/p09OgMDJA1T+2AQIPHb+Tp+cwL8BTF6uhPDo8JQAAAAASUVORK5CYII=",
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