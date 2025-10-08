// import { io } from "socket.io-client";
import { modal } from "./game.js";
import { transitionIn, transitionOut, showMenuTooltip, hideMenuTooltip, moveMenuTooltip } from "./menu.js";
import { loadPuzzle } from "./puzzles.js";
import { pixels, pixelImageData } from "./pixels.js";
// dont forget this testing import

const socket = io("http://spuh:4000", {
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
    multiplayerId = null;
    multiplayerGameId = null;
    socket.connect();
});
socket.on("disconnect", () => {
    multiplayerId = null;
    multiplayerGameId = null;
    if (multiplayerContainer.style.display != "none") {
        modal("Disconnected", "Disconnected from server", "info");
    }
    console.log("disconnected")
});

let multiplayerId = null;
let multiplayerGameId = null;

let multiplayerGames = {};

let multiplayerPixelInventory = [];

socket.on("id", function(data) {
    multiplayerId = data;
});

const multiplayerMenuContainer = document.getElementById("multiplayerMenuContainer");
const multiplayerSignInContainer = document.getElementById("multiplayerSignInContainer");
const multiplayerProfileContainer = document.getElementById("multiplayerProfileContainer");
const multiplayerGameListContainer = document.getElementById("multiplayerGameListContainer");
const multiplayerGameLobbyContainer = document.getElementById("multiplayerGameLobbyContainer");
const multiplayerLoadingContainer = document.getElementById("multiplayerLoadingContainer");

const multiplayerSignedInTexts = document.getElementsByClassName("multiplayerSignedInText");

const multiplayerProfileButton = document.getElementById("multiplayerProfileButton");
const multiplayerGameListButton = document.getElementById("multiplayerGameListButton");
const multiplayerLogOutButton = document.getElementById("multiplayerLogOutButton");

multiplayerProfileButton.onclick = function() {
    multiplayerProfileContainer.style.transform = "translateX(0%)";
    multiplayerMenuContainer.style.transform = "translateX(100%)";
};
multiplayerGameListButton.onclick = function() {
    multiplayerGameListContainer.style.transform = "translateX(0%)";
    multiplayerMenuContainer.style.transform = "translateX(-100%)";
};
multiplayerLogOutButton.onclick = function() {
    multiplayerSignInContainer.style.transform = "translateX(0%)";
    multiplayerMenuContainer.style.transform = "translateX(100%)";
    socket.emit("logOut");
};

const multiplayerSignInUsername = document.getElementById("multiplayerSignInUsername");
const multiplayerSignInPassword = document.getElementById("multiplayerSignInPassword");
const multiplayerSignInRetypePassword = document.getElementById("multiplayerSignInRetypePassword");
const multiplayerSignInRetypePasswordLabel = document.getElementById("multiplayerSignInRetypePasswordLabel");
const multiplayerSignInResponse = document.getElementById("multiplayerSignInResponse");
const multiplayerSignInButton = document.getElementById("multiplayerSignInButton");
const multiplayerCreateAccountButton = document.getElementById("multiplayerCreateAccountButton");

multiplayerSignInButton.onclick = function() {
    multiplayerSignInUsername.disabled = true;
    multiplayerSignInPassword.disabled = true;
    multiplayerSignInRetypePassword.disabled = true;
    multiplayerSignInButton.disabled = true;
    multiplayerCreateAccountButton.disabled = true;
    socket.emit("signIn", {
        username: multiplayerSignInUsername.value,
        password: multiplayerSignInPassword.value,
    });
};
multiplayerCreateAccountButton.onclick = function() {
    if (multiplayerSignInRetypePassword.style.display == "none") {
        multiplayerSignInRetypePassword.style.display = "block";
        multiplayerSignInRetypePasswordLabel.style.display = "block";
    }
    else {
        if (multiplayerSignInPassword.value != multiplayerSignInRetypePassword.value) {
            multiplayerSignInResponse.innerText = "Passwords do not match";
            multiplayerSignInResponse.style.color = "red";
            return;
        }
        multiplayerSignInUsername.disabled = true;
        multiplayerSignInPassword.disabled = true;
        multiplayerSignInRetypePassword.disabled = true;
        multiplayerSignInButton.disabled = true;
        multiplayerCreateAccountButton.disabled = true;
        socket.emit("createAccount", {
            username: multiplayerSignInUsername.value,
            password: multiplayerSignInPassword.value,
        });
    }
};

socket.on("signIn", function(data) {
    multiplayerSignInUsername.disabled = false;
    multiplayerSignInPassword.disabled = false;
    multiplayerSignInRetypePassword.disabled = false;
    multiplayerSignInButton.disabled = false;
    multiplayerCreateAccountButton.disabled = false;
    switch (data.result) {
        case true:
            multiplayerSignInResponse.innerText = "";
            for (let i = 0; i < multiplayerSignedInTexts.length; i++) {
                multiplayerSignedInTexts[i].innerText = "Signed in as " + data.username;
            }
            multiplayerSignInContainer.style.transform = "translateX(-100%)";
            multiplayerMenuContainer.style.transform = "translateX(0%)";
            break;
        case "usernameShort":
        case "usernameLong":
            multiplayerSignInResponse.innerText = "Your username must be between 3 and 32 characters long";
            multiplayerSignInResponse.style.color = "red";
            break;
        case "usernameInvalid":
            multiplayerSignInResponse.innerText = "Your username can only use the characters \"abcdefghijklmnopqrstuvwxyz1234567890-=`~!@#$%^&*()_+[]{}\\|;:'\",.<>/?\"";
            multiplayerSignInResponse.style.color = "red";
            break;
        case "usernameIncorrect":
            multiplayerSignInResponse.innerText = "Account \"" + data.username + "\" does not exist";
            multiplayerSignInResponse.style.color = "red";
            break;
        case "passwordIncorrect":
            multiplayerSignInResponse.innerText = "Incorrect password";
            multiplayerSignInResponse.style.color = "red";
            break;
        case "alreadyLoggedIn":
            multiplayerSignInResponse.innerText = "Account \"" + data.username + "\" is already logged in";
            multiplayerSignInResponse.style.color = "red";
            break;
    }
});
socket.on("createAccount", function(data) {
    multiplayerSignInUsername.disabled = false;
    multiplayerSignInPassword.disabled = false;
    multiplayerSignInRetypePassword.disabled = false;
    multiplayerSignInButton.disabled = false;
    multiplayerCreateAccountButton.disabled = false;
    switch (data.result) {
        case true:
            multiplayerSignInResponse.innerText = "Successfully created account \"" + data.username + "\"";
            multiplayerSignInResponse.style.color = "lime";
            multiplayerSignInRetypePassword.style.display = "none";
            multiplayerSignInRetypePasswordLabel.style.display = "none";
            break;
        case "usernameShort":
        case "usernameLong":
            multiplayerSignInResponse.innerText = "Your username must be between 3 and 32 characters long";
            multiplayerSignInResponse.style.color = "red";
            break;
        case "usernameInvalid":
            multiplayerSignInResponse.innerText = "Your username can only use the characters \"abcdefghijklmnopqrstuvwxyz1234567890-=`~!@#$%^&*()_+[]{}\\|;:'\",.<>/?\"";
            multiplayerSignInResponse.style.color = "red";
            break;
        case "usernameExists":
            multiplayerSignInResponse.innerText = "An account with username \"" + data.username + "\" already exists";
            multiplayerSignInResponse.style.color = "red";
            break;
        case "passwordLong":
            multiplayerSignInResponse.innerText = "Your password must be at most 128 characters long";
            multiplayerSignInResponse.style.color = "red";
            break;
        case "alreadyLoggedIn":
            multiplayerSignInResponse.innerText = "Account \"" + data.username + "\" is already logged in";
            multiplayerSignInResponse.style.color = "red";
            break;
    }
});

const multiplayerProfilePassword = document.getElementById("multiplayerProfilePassword");
const multiplayerProfileResponse = document.getElementById("multiplayerProfileResponse");
const multiplayerProfileNewUsername = document.getElementById("multiplayerProfileNewUsername");
const multiplayerChangeUsernameButton = document.getElementById("multiplayerChangeUsernameButton");
const multiplayerProfileNewPassword = document.getElementById("multiplayerProfileNewPassword");
const multiplayerProfileRetypeNewPassword = document.getElementById("multiplayerProfileRetypeNewPassword");
const multiplayerChangePasswordButton = document.getElementById("multiplayerChangePasswordButton");
const multiplayerDeleteAccountPassword = document.getElementById("multiplayerDeleteAccountPassword");
const multiplayerDeleteAccountButton = document.getElementById("multiplayerDeleteAccountButton");
const multiplayerProfileBackButton = document.getElementById("multiplayerProfileBackButton");

multiplayerChangeUsernameButton.onclick = function() {
    socket.emit("changeUsername", {
        password: multiplayerProfilePassword.value,
        newUsername: multiplayerProfileNewUsername.value,
    });
};
multiplayerChangePasswordButton.onclick = function() {
    if (multiplayerProfileNewPassword.value != multiplayerProfileRetypeNewPassword.value) {
        multiplayerProfileResponse.innerText = "Passwords do not match";
        multiplayerProfileResponse.style.color = "red";
        return;
    }
    socket.emit("changePassword", {
        password: multiplayerProfilePassword.value,
        newPassword: multiplayerProfileNewPassword.value,
    });
};
multiplayerDeleteAccountButton.onclick = function() {
    socket.emit("deleteAccount", {
        password: multiplayerDeleteAccountPassword.value,
    });
};

multiplayerProfileBackButton.onclick = function() {
    multiplayerProfileContainer.style.transform = "translateX(-100%)";
    multiplayerMenuContainer.style.transform = "translateX(0%)";
};

socket.on("changeUsername", function(data) {
    switch (data.result) {
        case true:
            multiplayerProfileResponse.innerText = "Successfully changed username to \"" + data.newUsername + "\"";
            multiplayerProfileResponse.style.color = "lime";
            for (let i = 0; i < multiplayerSignedInTexts.length; i++) {
                multiplayerSignedInTexts[i].innerText = "Signed in as " + data.newUsername;
            }
            break;
        case "newUsernameShort":
        case "newUsernameLong":
            multiplayerProfileResponse.innerText = "Your username must be between 3 and 32 characters long";
            multiplayerProfileResponse.style.color = "red";
            break;
        case "newUsernameInvalid":
            multiplayerProfileResponse.innerText = "Your username can only use the characters \"abcdefghijklmnopqrstuvwxyz1234567890-=`~!@#$%^&*()_+[]{}\\|;:'\",.<>/?\"";
            multiplayerProfileResponse.style.color = "red";
            break;
        case "newUsernameExists":
            multiplayerProfileResponse.innerText = "An account with username \"" + data.username + "\" already exists";
            multiplayerProfileResponse.style.color = "red";
            break;
        case "usernameIncorrect":
            multiplayerProfileResponse.innerText = "Account \"" + data.username + "\" does not exist";
            multiplayerProfileResponse.style.color = "red";
            break;
        case "passwordIncorrect":
            multiplayerProfileResponse.innerText = "Incorrect password";
            multiplayerProfileResponse.style.color = "red";
            break;
    }
});
socket.on("changePassword", function(data) {
    switch (data.result) {
        case true:
            multiplayerProfileResponse.innerText = "Successfully changed password";
            multiplayerProfileResponse.style.color = "lime";
            break;
        case "newPasswordLong":
            multiplayerProfileResponse.innerText = "Your password must be at most 128 characters long";
            multiplayerProfileResponse.style.color = "red";
            break;
        case "usernameIncorrect":
            multiplayerProfileResponse.innerText = "Account \"" + data.username + "\" does not exist";
            multiplayerProfileResponse.style.color = "red";
            break;
        case "passwordIncorrect":
            multiplayerProfileResponse.innerText = "Incorrect password";
            multiplayerProfileResponse.style.color = "red";
            break;
    }
});
socket.on("deleteAccount", function(data) {
    switch (data.result) {
        case true:
            multiplayerProfileResponse.innerText = "Successfully deleted account";
            multiplayerProfileResponse.style.color = "lime";
            break;
        case "usernameIncorrect":
            multiplayerProfileResponse.innerText = "Account \"" + data.username + "\" does not exist";
            multiplayerProfileResponse.style.color = "red";
            break;
        case "passwordIncorrect":
            multiplayerProfileResponse.innerText = "Incorrect password";
            multiplayerProfileResponse.style.color = "red";
            break;
    }
});

const multiplayerGameList = document.getElementById("multiplayerGameList");
const multiplayerGameTemplate = document.getElementById("multiplayerGameTemplate");
const multiplayerGameIdInput = document.getElementById("multiplayerGameIdInput");
const multiplayerJoinGameButton = document.getElementById("multiplayerJoinGameButton");
const multiplayerCreateGameButton = document.getElementById("multiplayerCreateGameButton");
const multiplayerGameListBackButton = document.getElementById("multiplayerGameListBackButton");

multiplayerJoinGameButton.onclick = () => {
    socket.emit("joinGame", Number(multiplayerGameIdInput.value));
};
multiplayerCreateGameButton.onclick = () => {
    socket.emit("createGame");
};

multiplayerGameListBackButton.onclick = function() {
    multiplayerGameListContainer.style.transform = "translateX(100%)";
    multiplayerMenuContainer.style.transform = "translateX(0%)";
};

const multiplayerGameLobbyId = document.getElementById("multiplayerGameLobbyId");
const multiplayerGameLobbyPublic = document.getElementById("multiplayerGameLobbyPublic");
const multiplayerGameLobbyPlayers = document.getElementById("multiplayerGameLobbyPlayers");
const multiplayerStartGameButton = document.getElementById("multiplayerStartGameButton");
const multiplayerLeaveGameButton = document.getElementById("multiplayerLeaveGameButton");

multiplayerStartGameButton.onclick = () => {
    socket.emit("startGame");
};
multiplayerLeaveGameButton.onclick = () => {
    socket.emit("leaveGame");
};

let draggingPlayer = null;
let draggingPlayerId = null;
let draggingPlayerX = 0;
let draggingPlayerY = 0;

const multiplayerGameLobbyDraggingPlayer = document.getElementById("multiplayerGameLobbyDraggingPlayer");

const multiplayerOverlay = document.getElementById("multiplayerOverlay");
const multiplayerTeamTemplate = document.getElementById("multiplayerTeamTemplate");

const multiplayerWinTitle = document.getElementById("multiplayerWinTitle");
const multiplayerWinSubtitle = document.getElementById("multiplayerWinSubtitle");

multiplayerGameLobbyPublic.oninput = () => {
    socket.emit("updateGame", {
        public: multiplayerGameLobbyPublic.checked,
    });
};

let multiplayerMaps = {};

let lastMultiplayerMapId = null;

const multiplayerGameLobbyMap = document.getElementById("multiplayerGameLobbyMap");
const multiplayerGameLobbyMaps = document.getElementById("multiplayerGameLobbyMaps");

multiplayerGameLobbyMap.onmouseover = function() {
    showMenuTooltip(multiplayerMaps[multiplayerGames[multiplayerGameId].map].name, multiplayerMaps[multiplayerGames[multiplayerGameId].map].author);
    moveMenuTooltip();
};
multiplayerGameLobbyMap.onmouseout = function() {
    hideMenuTooltip();
};
multiplayerGameLobbyMap.onmousemove = function() {
    moveMenuTooltip();
};

function addMap(id) {
    const map = document.createElement("div");
    map.classList.add("multiplayerGameLobbyMap");
    map.style.backgroundImage = "url(" + multiplayerMaps[id].img + ")";
    map.onclick = async () => {
        socket.emit("updateGame", {
            map: id,
        });
    };
    map.onmouseover = function() {
        showMenuTooltip(multiplayerMaps[id].name, multiplayerMaps[id].author);
        moveMenuTooltip();
    };
    map.onmouseout = function() {
        hideMenuTooltip();
    };
    map.onmousemove = function() {
        moveMenuTooltip();
    };
    multiplayerMaps[id].div = map;
    multiplayerGameLobbyMaps.appendChild(map);
};

socket.on("maps", function(data) {
    multiplayerMaps = data;
    lastMultiplayerMapId = null;
    multiplayerGameLobbyMaps.innerHTML = "";
    for (let i in multiplayerMaps) {
        addMap(i);
    }
});

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
    multiplayerGameLobbyMap.style.display = multiplayerId != multiplayerGames[multiplayerGameId].host ? "block" : "none";
    multiplayerGameLobbyMaps.style.display = multiplayerId == multiplayerGames[multiplayerGameId].host ? "grid" : "none";
    if (multiplayerGames[multiplayerGameId].map != lastMultiplayerMapId) {
        multiplayerGameLobbyMap.style.backgroundImage = "url(" + multiplayerMaps[multiplayerGames[multiplayerGameId].map].img + ")";
        if (multiplayerId == multiplayerGames[multiplayerGameId].host) {
            if (lastMultiplayerMapId != null) {
                multiplayerMaps[lastMultiplayerMapId].div.classList.remove("multiplayerGameLobbyMapSelected");
            }
            multiplayerMaps[multiplayerGames[multiplayerGameId].map].div.classList.add("multiplayerGameLobbyMapSelected");
        }
        lastMultiplayerMapId = multiplayerGames[multiplayerGameId].map;
    }
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
            div.innerText = multiplayerGames[multiplayerGameId].players[i].username;
            multiplayerGames[multiplayerGameId].playerDivs[i] = div;
        }
        let div = multiplayerGames[multiplayerGameId].playerDivs[i];
        if (multiplayerId == multiplayerGames[multiplayerGameId].host && !div.classList.contains("draggable")) {
            div.classList.add("draggable");
            div.onmousedown = function(e) {
                multiplayerGameLobbyDraggingPlayer.style.display = "flex";
                multiplayerGameLobbyDraggingPlayer.innerText = multiplayerGames[multiplayerGameId].players[i].username;
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
            scores: [],
            map: data.map,
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
    multiplayerGames[data.id].map = data.map;
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
    // multiplayerGameLobbyContainer.style.transform = "translateX(100%)";
    // multiplayerGameLobbyContainer.innerText;
    multiplayerGameLobbyContainer.style.transform = "translateX(0%)";
});
socket.on("leaveGame", function() {
    multiplayerGameId = null;
    multiplayerGameListContainer.style.transform = "translateX(0%)";
    multiplayerGameLobbyContainer.style.transform = "translateX(100%)";
});
socket.on("startGame", async function() {
    await transitionIn();
    loadPuzzle(null);
    multiplayerOverlay.style.display = "flex";
    playButton.style.display = "none";
    stepButton.style.display = "none";
    simulateButton.style.display = "none";
    slowmodeButton.style.display = "none";
    resetButton.style.display = "none";
    gameContainer.style.display = "block";
    menuContainer.style.display = "none";
    await transitionOut();
});
socket.on("endGame", function(data) {
    multiplayerWinTitle.style.opacity = 2;
    if (data == multiplayerGames[multiplayerGameId].players[multiplayerId].team) {
        multiplayerWinTitle.innerText = "Victory!";
    }
    else {
        multiplayerWinTitle.innerText = "Defeat";
    }
    multiplayerWinTitle.style.opacity = 0;
    multiplayerWinSubtitle.innerText = "Team " + getTeamName(data) + " won";
    multiplayerGameId = null;
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
        multiplayerGameId = null;
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
        multiplayerGameId = null;
        multiplayerGames = {};
        multiplayerGameList.innerHTML = "No Active Games";
        multiplayerMenuContainer.style.transform = "translateX(100%)";
        multiplayerSignInContainer.style.transform = "";
        multiplayerProfileContainer.style.transform = "translateX(-100%)";
        multiplayerGameListContainer.style.transform = "translateX(100%)";
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