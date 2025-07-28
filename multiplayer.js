// import { io } from "socket.io-client";
import { transitionIn, transitionOut } from "./menu.js";
import { loadPuzzle } from "./puzzles.js";
import { pixels, pixelImageData } from "./pixels.js";
// dont forget this testing import

const socket = io("http://localhost:4000", {
// const socket = io("https://pixelsimulatorserver.onrender.com", {
    autoConnect: false,
    reconnection: false,
});

let multiplayerState = "disconnected";

// socket.connect();
socket.on("connect", () => {
    console.log("succesfully connected")
});
socket.on("connect_error", () => {
    console.log("buh bug connect erorr")
    socket.connect();
});
socket.on("disconnect", () => {
    console.log("disconnected")
});

let multiplayerId = null;
let multiplayerGameId = null;

let multiplayerGames = {};

let multiplayerPixelInventory = [];

socket.on("id", function(data) {
    multiplayerId = data;
});

const multiplayerGameListContainer = document.getElementById("multiplayerGameListContainer");
const multiplayerGameLobbyContainer = document.getElementById("multiplayerGameLobbyContainer");
const multiplayerLoadingContainer = document.getElementById("multiplayerLoadingContainer");

const multiplayerGameList = document.getElementById("multiplayerGameList");
const multiplayerGameTemplate = document.getElementById("multiplayerGameTemplate");
const multiplayerGameIdInput = document.getElementById("multiplayerGameIdInput");
const multiplayerJoinGameButton = document.getElementById("multiplayerJoinGameButton");
const multiplayerCreateGameButton = document.getElementById("multiplayerCreateGameButton");

const multiplayerGameLobbyId = document.getElementById("multiplayerGameLobbyId");
const multiplayerGameLobbyPublic = document.getElementById("multiplayerGameLobbyPublic");
const multiplayerGameLobbyPlayers = document.getElementById("multiplayerGameLobbyPlayers");
const multiplayerStartGameButton = document.getElementById("multiplayerStartGameButton");
const multiplayerLeaveGameButton = document.getElementById("multiplayerLeaveGameButton");

const multiplayerGameLobbyDraggingPlayer = document.getElementById("multiplayerGameLobbyDraggingPlayer");
let draggingPlayer = null;
let draggingPlayerId = null;
let draggingPlayerX = 0;
let draggingPlayerY = 0;

const multiplayerOverlay = document.getElementById("multiplayerOverlay");
const multiplayerTeamTemplate = document.getElementById("multiplayerTeamTemplate");

multiplayerJoinGameButton.onclick = () => {
    socket.emit("joinGame", Number(multiplayerGameIdInput.value));
};
multiplayerCreateGameButton.onclick = () => {
    socket.emit("createGame");
};
multiplayerStartGameButton.onclick = () => {
    socket.emit("startGame");
};
multiplayerLeaveGameButton.onclick = () => {
    socket.emit("leaveGame");
};

multiplayerGameLobbyPublic.oninput = () => {
    socket.emit("updateGame", {
        public: multiplayerGameLobbyPublic.checked,
    });
};

function getTeamName(team) {
    switch (team) {
        case 0:
            return "Alpha";
        case 1:
            return "Beta";
    }
};

function updateMultiplayerGameLobby() {
    multiplayerGameLobbyId.value = multiplayerGameId;
    multiplayerGameLobbyPublic.checked = multiplayerGames[multiplayerGameId].public;
    multiplayerGameLobbyPublic.disabled = multiplayerId != multiplayerGames[multiplayerGameId].host;
    if (multiplayerGames[multiplayerGameId].teamDivs.length != multiplayerGames[multiplayerGameId].teams) {
        multiplayerGameLobbyPlayers.innerHTML = "";
        multiplayerGames[multiplayerGameId].teamDivs = [];
        for (let i = 0; i < multiplayerGames[multiplayerGameId].teams; i++) {
            const title = document.createElement("div");
            title.classList.add("multiplayerGameLobbyTeamTitle");
            title.innerText = "Team " + getTeamName(i);
            multiplayerGameLobbyPlayers.appendChild(title);
            const players = document.createElement("div");
            players.classList.add("multiplayerGameLobbyTeamPlayers");
            players.onmouseover = function() {
                if (draggingPlayer != null) {
                    players.appendChild(draggingPlayer);
                }
            };
            multiplayerGameLobbyPlayers.appendChild(players);
            multiplayerGames[multiplayerGameId].teamDivs[i] = players;
        }
        multiplayerOverlay.innerHTML = "";
        multiplayerGames[multiplayerGameId].overlayDivs = [];
        multiplayerGames[multiplayerGameId].pixelInventoryDivs = [];
        for (let i = 0; i < multiplayerGames[multiplayerGameId].teams; i++) {
            const team = multiplayerTeamTemplate.content.cloneNode(true);
            team.querySelector(".multiplayerTeamName").innerText = "Team " + getTeamName(i);
            multiplayerGames[multiplayerGameId].pixelInventoryDivs[i] = [];
            let costPixels = [];
            for (let j in pixels) {
                if (pixels[j].cost == null) {
                    continue;
                }
                for (let k in pixels[j].cost) {
                    costPixels[k] = true;
                }
            }
            for (let j in costPixels) {
                if (multiplayerGames[multiplayerGameId].pixelInventoryDivs[i][j] == null) {
                    const pixel = document.createElement("div");
                    pixel.classList.add("multiplayerPixel");
                    pixel.style.backgroundImage = "url(" + pixelImageData[j] + ")";
                    pixel.style.color = pixels[j].amountColor ?? "white";
                    team.querySelector(".multiplayerPixelInventory").appendChild(pixel);
                    multiplayerGames[multiplayerGameId].pixelInventoryDivs[i][j] = pixel;
                }
            }
            multiplayerOverlay.appendChild(team);
            multiplayerGames[multiplayerGameId].overlayDivs[i] = multiplayerOverlay.lastElementChild;
        }
    }
    for (let i in multiplayerGames[multiplayerGameId].players) {
        if (multiplayerGames[multiplayerGameId].playerDivs[i] == null) {
            const div = document.createElement("div");
            div.classList.add("multiplayerGameLobbyPlayer");
            div.innerText = multiplayerGames[multiplayerGameId].players[i].id;
            multiplayerGames[multiplayerGameId].playerDivs[i] = div;
        }
        let div = multiplayerGames[multiplayerGameId].playerDivs[i];
        if (multiplayerId == multiplayerGames[multiplayerGameId].host && !div.classList.contains("draggable")) {
            div.classList.add("draggable");
            div.onmousedown = function(e) {
                multiplayerGameLobbyDraggingPlayer.style.display = "flex";
                multiplayerGameLobbyDraggingPlayer.innerText = multiplayerGames[multiplayerGameId].players[i].id;
                div.classList.add("dragging");
                draggingPlayer = div;
                draggingPlayerId = multiplayerGames[multiplayerGameId].players[i].id;
                let rect = div.getBoundingClientRect();
                draggingPlayerX = rect.x - e.clientX;
                draggingPlayerY = rect.y - e.clientY;
                multiplayerGameLobbyDraggingPlayer.style.left = e.clientX + draggingPlayerX + "px";
                multiplayerGameLobbyDraggingPlayer.style.top = e.clientY + draggingPlayerY + "px";
                multiplayerGameLobbyDraggingPlayer.style.width = rect.width + "px";
                multiplayerGameLobbyDraggingPlayer.style.height = rect.height + "px";
            };
            if (multiplayerGames[multiplayerGameId].players[i].id != multiplayerId) {
                const transferHostButton = document.createElement("button");
                transferHostButton.classList.add("multiplayerGameLobbyPlayerButton");
                transferHostButton.innerText = "Transfer Host";
                transferHostButton.onmousedown = function(e) {
                    e.stopImmediatePropagation();
                };
                transferHostButton.onclick = function(e) {
                    let data = {};
                    data[multiplayerGames[multiplayerGameId].players[i].id] = {
                        transferHost: true,
                    };
                    socket.emit("updateGame", {
                        players: data,
                    });
                };
                div.appendChild(transferHostButton);
                const kickButton = document.createElement("button");
                kickButton.classList.add("multiplayerGameLobbyPlayerButton");
                kickButton.innerText = "Kick";
                kickButton.onmousedown = function(e) {
                    e.stopImmediatePropagation();
                };
                kickButton.onclick = function(e) {
                    let data = {};
                    data[multiplayerGames[multiplayerGameId].players[i].id] = {
                        kick: true,
                    };
                    socket.emit("updateGame", {
                        players: data,
                    });
                };
                div.appendChild(kickButton);
            }
        }
        else if (multiplayerId != multiplayerGames[multiplayerGameId].host && div.classList.contains("draggable")) {
            div.classList.remove("draggable");
            div.onmousedown = function() {};
            if (multiplayerGames[multiplayerGameId].players[i].id != multiplayerId) {
                let buttons = div.querySelectorAll(".multiplayerGameLobbyPlayerButton");
                for (let j = 0; j < buttons.length; j++) {
                    buttons[j].remove();
                }
            }
        }
        if (multiplayerGames[multiplayerGameId].playerDivs[i].parentElement != multiplayerGames[multiplayerGameId].teamDivs[multiplayerGames[multiplayerGameId].players[i].team]) {
            multiplayerGames[multiplayerGameId].teamDivs[multiplayerGames[multiplayerGameId].players[i].team].appendChild(multiplayerGames[multiplayerGameId].playerDivs[i]);
        }
    }
    for (let i in multiplayerGames[multiplayerGameId].playerDivs) {
        if (multiplayerGames[multiplayerGameId].players[i] == null) {
            multiplayerGames[multiplayerGameId].playerDivs[i].remove();
        }
    }
    multiplayerStartGameButton.style.display = multiplayerId == multiplayerGames[multiplayerGameId].host ? "block" : "none";
};

document.addEventListener("mousemove", function(e) {
    if (draggingPlayer != null) {
        multiplayerGameLobbyDraggingPlayer.style.left = e.clientX + draggingPlayerX + "px";
        multiplayerGameLobbyDraggingPlayer.style.top = e.clientY + draggingPlayerY + "px";
    }
});
document.addEventListener("mouseup", function(e) {
    if (draggingPlayer != null) {
        draggingPlayer.classList.remove("dragging");
        multiplayerGameLobbyDraggingPlayer.style.display = "none";
        let data = {};
        for (let i = 0; i < multiplayerGames[multiplayerGameId].teams; i++) {
            if (draggingPlayer.parentElement == multiplayerGames[multiplayerGameId].teamDivs[i]) {
                data[draggingPlayerId] = {
                    team: i,
                };
                break;
            }
        }
        socket.emit("updateGame", {
            players: data,
        });
        draggingPlayer = null;
    }
});

socket.on("updateGame", function(data) {
    if (Object.keys(multiplayerGames).length == 0) {
        multiplayerGameList.innerText = "";
    }
    if (multiplayerGames[data.id] == null) {
        const game = multiplayerGameTemplate.content.cloneNode(true);
        game.querySelector(".multiplayerGameJoinGameButton").onclick = () => {
            socket.emit("joinGame", data.id);
        };
        multiplayerGameList.appendChild(game);
        multiplayerGames[data.id] = {
            id: data.id,
            players: data.players,
            teams: data.teams,
            host: data.host,
            public: data.public,
            allowCrafting: data.allowCrafting,
            started: data.started,
            div: multiplayerGameList.lastElementChild,
            teamDivs: [],
            playerDivs: {},
            overlayDivs: [],
            pixelInventoryDivs: [],
        };
    }
    multiplayerGames[data.id].div.querySelector(".multiplayerGameTitle").innerText = data.id;
    multiplayerGames[data.id].div.querySelector(".multiplayerGameSubtitle").innerText = data.public ? "Public" : "Private";
    multiplayerGames[data.id].div.querySelector(".multiplayerGameJoinGameButton").innerText = data.started ? "Spectate Game" : "Join Game";
    multiplayerGames[data.id].players = data.players;
    multiplayerGames[data.id].teams = data.teams;
    multiplayerGames[data.id].host = data.host;
    multiplayerGames[data.id].public = data.public;
    // gamemode here
    multiplayerGames[data.id].allowCrafting = data.allowCrafting;
    multiplayerGames[data.id].started = data.started;
    if (data.id == multiplayerGameId) {
        updateMultiplayerGameLobby();
    }
});
socket.on("removeGame", function(data) {
    if (multiplayerGames[data] == null) {
        return;
    }
    multiplayerGames[data].div.remove();
    delete multiplayerGames[data];
    if (Object.keys(multiplayerGames).length == 0) {
        multiplayerGameList.innerText = "No Active Games";
    }
});
socket.on("joinGame", function(data) {
    multiplayerGameId = data;
    updateMultiplayerGameLobby();
    multiplayerGameListContainer.style.transform = "translateX(-100%)";
    multiplayerGameLobbyContainer.style.transform = "translateX(100%)";
    multiplayerGameLobbyContainer.innerText;
    multiplayerGameLobbyContainer.style.transform = "translateX(0px)";
});
socket.on("leaveGame", function() {
    multiplayerGameId = null;
    multiplayerGameListContainer.style.transform = "";
    multiplayerGameLobbyContainer.style.transform = "translateX(100%)";
});
socket.on("startGame", async function() {
    await transitionIn();
    loadPuzzle(null);
    multiplayerOverlay.style.display = "block";
    playButton.style.display = "none";
    stepButton.style.display = "none";
    simulateButton.style.display = "none";
    slowmodeButton.style.display = "none";
    resetButton.style.display = "none";
    gameContainer.style.display = "block";
    menuContainer.style.display = "none";
    await transitionOut();
});

function updateMultiplayer() {
    if (multiplayerContainer.style.display == "none") {
        if (socket.connected) {
            console.log("attempting to disconnect")
            socket.disconnect();
            multiplayerState = "disconnected";
            multiplayerLoadingContainer.style.opacity = 1;
            multiplayerLoadingContainer.style.pointerEvents = "auto";
        }
        multiplayerId = null;
        return;
    }
    if (socket.connected) {
        multiplayerLoadingContainer.style.opacity = 0;
        multiplayerLoadingContainer.style.pointerEvents = "none";
        multiplayerState = "connected";
    }
    else {
        // socket.connect();
        if (multiplayerState == "connected") {
            multiplayerState = "disconnected";
        }
        multiplayerId = null;
        multiplayerGames = {};
        multiplayerGameList.innerHTML = "No Active Games";
        multiplayerGameListContainer.style.transform = "";
        multiplayerGameLobbyContainer.style.transform = "translateX(100%)";
        multiplayerLoadingContainer.style.opacity = 1;
        multiplayerLoadingContainer.style.pointerEvents = "auto";
    }
    if (multiplayerState == "disconnected") {
        socket.connect();
        multiplayerState = "connecting";
    }
};

export { socket, multiplayerId, multiplayerGameId, multiplayerGames, multiplayerPixelInventory, updateMultiplayer };