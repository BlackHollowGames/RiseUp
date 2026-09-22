const AVATAR_KEY = "riseup_avatar";
const USER_KEY = "riseup_currentUser";
const TOK_KEY = "riseup_tok";
const GAMES_KEY = "riseup_games";

const defaultAvatar = {
name: "Your Avatar",
body: "default",
material: "clay",
pose: "standing",
rotation: 0
};

function getCurrentUser() {
try {
const stored = localStorage.getItem(USER_KEY);


    if (!stored) {
        return {
            username: "Player",
            displayName: "Player"
        };
    }

    try {
        const parsed = JSON.parse(stored);

        if (typeof parsed === "string") {
            return {
                username: parsed,
                displayName: parsed
            };
        }

        return {
            username: parsed.username || parsed.name || "Player",
            displayName: parsed.displayName || parsed.username || parsed.name || "Player"
        };
    } catch {
        return {
            username: stored,
            displayName: stored
        };
    }
} catch {
    return {
        username: "Player",
        displayName: "Player"
    };
}


}

function loadAvatar() {
try {
const saved = localStorage.getItem(AVATAR_KEY);


    if (!saved) {
        return { ...defaultAvatar };
    }

    return {
        ...defaultAvatar,
        ...JSON.parse(saved)
    };
} catch {
    return { ...defaultAvatar };
}


}

function saveAvatar(avatar) {
localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar));
}

function getTok() {
const value = Number(localStorage.getItem(TOK_KEY));
return Number.isFinite(value) ? value : 0;
}

function getGames() {
try {
const games = JSON.parse(localStorage.getItem(GAMES_KEY) || "[]");
return Array.isArray(games) ? games : [];
} catch {
return [];
}
}

const user = getCurrentUser();
const avatarData = loadAvatar();

const displayName = document.getElementById("displayName");
const username = document.getElementById("username");
const topUsername = document.getElementById("topUsername");
const topAvatar = document.getElementById("topAvatar");
const tokAmount = document.getElementById("tokAmount");

displayName.textContent = user.displayName;
username.textContent = `@${user.username}`;
topUsername.textContent = user.displayName;
topAvatar.textContent = (user.displayName || "R").charAt(0).toUpperCase();

tokAmount.textContent = getTok().toLocaleString();

function titleCase(value) {
return String(value || "")
.replace(/[-_]/g, " ")
.replace(/\b\w/g, letter => letter.toUpperCase());
}

function applyAvatar() {
const avatar = document.getElementById("avatar");


avatar.style.transform =
    rotateY(${Number(avatarData.rotation) || 0}deg);

const model = avatar.querySelector(".avatar-model");

model.classList.remove(
    "body-default",
    "body-tall",
    "body-compact",
    "material-clay",
    "material-light",
    "material-stone",
    "pose-standing",
    "pose-wave",
    "pose-point",
    "pose-relaxed"
);

model.classList.add(`body-${avatarData.body}`);
model.classList.add(`material-${avatarData.material}`);
model.classList.add(`pose-${avatarData.pose}`);

document.getElementById("avatarName").textContent =
    avatarData.name || "Your Avatar";

document.getElementById("avatarBody").textContent =
    titleCase(avatarData.body);

document.getElementById("avatarMaterial").textContent =
    titleCase(avatarData.material);

document.getElementById("avatarPose").textContent =
    titleCase(avatarData.pose);

applyMiniAvatar();


}

function applyMiniAvatar() {
const mini = document.getElementById("miniAvatar");


mini.classList.remove(
    "body-default",
    "body-tall",
    "body-compact",
    "material-clay",
    "material-light",
    "material-stone"
);

mini.classList.add(`body-${avatarData.body}`);
mini.classList.add(`material-${avatarData.material}`);


}

function renderGames() {
const allGames = getGames();


const ownGames = allGames.filter(game => {
    const creator =
        game.creator ||
        game.owner ||
        game.username ||
        game.createdBy ||
        "";

    return String(creator).toLowerCase() ===
        String(user.username).toLowerCase();
});

document.getElementById("gamesPlayed").textContent =
    Number(user.gamesPlayed || 0).toLocaleString();

document.getElementById("friendsCount").textContent =
    Number(user.friendsCount || 0).toLocaleString();

document.getElementById("followersCount").textContent =
    Number(user.followersCount || 0).toLocaleString();

document.getElementById("createdCount").textContent =
    ownGames.length.toLocaleString();

const empty = document.getElementById("gamesEmpty");
const grid = document.getElementById("gamesGrid");

grid.innerHTML = "";

if (!ownGames.length) {
    empty.style.display = "block";
    return;
}

empty.style.display = "none";

ownGames.forEach(game => {
    const card = document.createElement("article");
    card.className = "game-card";

    const title =
        game.name ||
        game.title ||
        "Untitled Game";

    const description =
        game.description ||
        "A game created on RiseUp.";

    card.innerHTML = 
        <div class="game-thumbnail">R</div>
        <div class="game-info">
            <h3></h3>
            <p></p>
        </div>
    ;

    card.querySelector("h3").textContent = title;
    card.querySelector("p").textContent = description;

    grid.appendChild(card);
});


}

function goHome() {
window.location.href = "home.html";
}

function goAvatar() {
window.location.href = "player3d.html";
}

function goCreate() {
window.location.href = "studio.html";
}

document.getElementById("homeButton").addEventListener("click", goHome);

document.getElementById("editAvatarButton").addEventListener(
"click",
goAvatar
);

document.getElementById("customizeButton").addEventListener(
"click",
goAvatar
);

document.getElementById("createButton").addEventListener(
"click",
goCreate
);

document.getElementById("createGameButton").addEventListener(
"click",
goCreate
);

document.getElementById("profileButton").addEventListener(
"click",
goAvatar
);

document.getElementById("messagesButton").addEventListener(
"click",
() => {
window.location.href = "home.html?page=messages";
}
);

document.getElementById("addFriendButton").addEventListener(
"click",
event => {
const button = event.currentTarget;


    if (button.dataset.added === "true") {
        return;
    }

    button.dataset.added = "true";
    button.textContent = "Friend Added";
}


);

applyAvatar();
renderGames();

window.addEventListener("storage", event => {
if (event.key === AVATAR_KEY) {
Object.assign(avatarData, loadAvatar());
applyAvatar();
}


if (event.key === TOK_KEY) {
    tokAmount.textContent = getTok().toLocaleString();
}

if (event.key === GAMES_KEY) {
    renderGames();
}


});

window.RiseUpAvatar = {
get() {
return loadAvatar();
},


save(nextAvatar) {
    const updated = {
        ...defaultAvatar,
        ...nextAvatar
    };

    saveAvatar(updated);
    Object.assign(avatarData, updated);
    applyAvatar();

    return updated;
},

reset() {
    saveAvatar({ ...defaultAvatar });
    Object.assign(avatarData, defaultAvatar);
    applyAvatar();

    return { ...defaultAvatar };
}


};
