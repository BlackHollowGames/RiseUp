const USER_KEY = "riseup_currentUser";
const FRIENDS_KEY_PREFIX = "riseup_friends_";
const AVATAR_KEY = "riseup_avatar";
const TOK_KEY = "riseup_tok";

function getCurrentUser() {
const raw = localStorage.getItem(USER_KEY);

```
if (!raw) {
    return {
        username: "Player",
        displayName: "Player"
    };
}

try {
    const parsed = JSON.parse(raw);

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
        username: raw,
        displayName: raw
    };
}
```

}

function loadAvatar() {
try {
return JSON.parse(localStorage.getItem(AVATAR_KEY)) || {
name: "Your Avatar",
body: "default",
material: "clay",
pose: "standing",
rotation: 0
};
} catch {
return {
name: "Your Avatar",
body: "default",
material: "clay",
pose: "standing",
rotation: 0
};
}
}

function getFriendsKey(username) {
return `${FRIENDS_KEY_PREFIX}${username}`;
}

function loadFriends() {
const user = getCurrentUser();

```
try {
    const friends = JSON.parse(
        localStorage.getItem(getFriendsKey(user.username)) || "[]"
    );

    return Array.isArray(friends) ? friends : [];
} catch {
    return [];
}
```

}

function saveFriends(friends) {
const user = getCurrentUser();

```
localStorage.setItem(
    getFriendsKey(user.username),
    JSON.stringify(friends)
);
```

}

function getTok() {
const value = Number(localStorage.getItem(TOK_KEY));
return Number.isFinite(value) ? value : 0;
}

function getFriendAvatar(friend) {
return {
name: friend.avatarName || "Avatar",
body: friend.body || "default",
material: friend.material || "clay",
pose: friend.pose || "standing"
};
}

function avatarMarkup(avatar) {
const body = avatar.body || "default";
const material = avatar.material || "clay";
const pose = avatar.pose || "standing";

```
return `
    <div class="friend-avatar"
         data-body="${body}"
         data-material="${material}"
         data-pose="${pose}">
        <div class="friend-head"></div>
        <div class="friend-neck"></div>
        <div class="friend-torso"></div>
        <div class="friend-arm friend-arm-left"></div>
        <div class="friend-arm friend-arm-right"></div>
        <div class="friend-leg friend-leg-left"></div>
        <div class="friend-leg friend-leg-right"></div>
    </div>
`;
```

}

function createFriendCard(friend, index) {
const card = document.createElement("article");

```
card.className = "friend-card";

const displayName =
    friend.displayName ||
    friend.username ||
    `Player ${index + 1}`;

const username =
    friend.username ||
    displayName.toLowerCase().replace(/\s+/g, "");

const avatar = getFriendAvatar(friend);

card.innerHTML = `
    <div class="friend-preview">
        ${avatarMarkup(avatar)}
    </div>

    <div class="friend-info">
        <div class="friend-name-row">
            <div>
                <h3></h3>
                <p></p>
            </div>

            <span class="online-dot"></span>
        </div>

        <div class="friend-actions">
            <button class="friend-button primary" data-action="profile">
                Profile
            </button>

            <button class="friend-button secondary" data-action="remove">
                Remove
            </button>
        </div>
    </div>
`;

card.querySelector("h3").textContent = displayName;
card.querySelector("p").textContent = `@${username}`;

card.querySelector('[data-action="profile"]').addEventListener(
    "click",
    () => {
        localStorage.setItem(
            "riseup_viewing_profile",
            JSON.stringify(friend)
        );

        window.location.href = "player.html";
    }
);

card.querySelector('[data-action="remove"]').addEventListener(
    "click",
    () => {
        const friends = loadFriends();

        friends.splice(index, 1);
        saveFriends(friends);

        renderFriends();
    }
);

return card;
```

}

function renderFriends(search = "") {
const grid = document.getElementById("friendsGrid");
const empty = document.getElementById("friendsEmpty");
const count = document.getElementById("friendsCount");

```
if (!grid) {
    return;
}

const friends = loadFriends();

const filtered = friends.filter(friend => {
    const text = [
        friend.displayName,
        friend.username
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return text.includes(search.toLowerCase());
});

grid.innerHTML = "";

if (count) {
    count.textContent = friends.length.toLocaleString();
}

if (!filtered.length) {
    if (empty) {
        empty.style.display = "block";
    }

    return;
}

if (empty) {
    empty.style.display = "none";
}

filtered.forEach((friend, index) => {
    grid.appendChild(createFriendCard(friend, index));
});
```

}

function addFriend(friend) {
const friends = loadFriends();

```
const username = String(friend.username || "").toLowerCase();

if (!username) {
    return false;
}

if (
    friends.some(
        existing =>
            String(existing.username || "").toLowerCase() === username
    )
) {
    return false;
}

friends.push({
    username: friend.username,
    displayName: friend.displayName || friend.username,
    avatarName: friend.avatarName || "Avatar",
    body: friend.body || "default",
    material: friend.material || "clay",
    pose: friend.pose || "standing"
});

saveFriends(friends);
renderFriends();

return true;
```

}

function goHome() {
window.location.href = "home.html";
}

function goAvatar() {
window.location.href = "player3d.html";
}

function goMarketplace() {
window.location.href = "home.html?page=marketplace";
}

function initializeFriendsPage() {
const currentUser = getCurrentUser();
const avatar = loadAvatar();

```
const usernameElement = document.getElementById("username");
const displayNameElement = document.getElementById("displayName");
const topAvatar = document.getElementById("topAvatar");
const tokAmount = document.getElementById("tokAmount");

if (usernameElement) {
    usernameElement.textContent = `@${currentUser.username}`;
}

if (displayNameElement) {
    displayNameElement.textContent = currentUser.displayName;
}

if (topAvatar) {
    topAvatar.textContent =
        currentUser.displayName.charAt(0).toUpperCase();
}

if (tokAmount) {
    tokAmount.textContent = getTok().toLocaleString();
}

const search = document.getElementById("friendSearch");

if (search) {
    search.addEventListener("input", () => {
        renderFriends(search.value);
    });
}

document.getElementById("homeButton")?.addEventListener(
    "click",
    goHome
);

document.getElementById("avatarButton")?.addEventListener(
    "click",
    goAvatar
);

document.getElementById("marketplaceButton")?.addEventListener(
    "click",
    goMarketplace
);

renderFriends();

window.RiseUpFriends = {
    getAll: loadFriends,
    add: addFriend,
    remove(username) {
        const friends = loadFriends().filter(
            friend =>
                String(friend.username).toLowerCase() !==
                String(username).toLowerCase()
        );

        saveFriends(friends);
        renderFriends();
    }
};

void avatar;
```

}

if (document.readyState === "loading") {
document.addEventListener(
"DOMContentLoaded",
initializeFriendsPage
);
} else {
initializeFriendsPage();
}
