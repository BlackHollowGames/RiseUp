"use strict";

const RiseUpHome = (() => {
const STORAGE = {
currentUser: "riseup_currentUser",
games: "riseup_games",
tok: "riseup_tok"
};


const routes = {
    home: "home.html",
    discover: "home.html?page=discover",
    marketplace: "home.html?page=marketplace",
    avatar: "player3d.html",
    inventory: "home.html?page=inventory",
    friends: "friends.html",
    messages: "home.html?page=messages",
    create: "studio.html",
    studio: "studio.html",
    code: "code.html",
    settings: "home.html?page=settings"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(STORAGE.currentUser);

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return {
                username: raw,
                displayName: raw
            };
        }
    } catch {
        return null;
    }
}

function getUsername(user) {
    if (!user) {
        return "Player";
    }

    if (typeof user === "string") {
        return user;
    }

    return user.displayName ||
        user.username ||
        user.name ||
        "Player";
}

function getInitial(user) {
    const name = getUsername(user).trim();

    return name
        ? name.charAt(0).toUpperCase()
        : "R";
}

function getTok() {
    const stored = localStorage.getItem(STORAGE.tok);

    if (stored === null) {
        return 0;
    }

    const amount = Number(stored);

    return Number.isFinite(amount) && amount >= 0
        ? amount
        : 0;
}

function setTok(amount) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));

    localStorage.setItem(STORAGE.tok, String(safeAmount));

    const tokAmount = $("#tokAmount");

    if (tokAmount) {
        tokAmount.textContent = safeAmount.toLocaleString();
    }
}

function updateUserUI() {
    const user = getCurrentUser();
    const name = getUsername(user);
    const initial = getInitial(user);

    const title = $("#welcomeTitle");
    const avatar = $("#headerAvatar");

    if (title) {
        title.textContent = `Welcome back, ${name}`;
    }

    if (avatar) {
        avatar.textContent = initial;
        avatar.setAttribute("aria-label", `${name}'s avatar`);
    }

    setTok(getTok());
}

function navigate(page) {
    const destination = routes[page];

    if (!destination) {
        showToast("That RiseUp page is not available yet.");
        return;
    }

    window.location.href = destination;
}

function setActivePage(page) {
    $$(".nav-item").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    $$(".side-item").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });
}

function showToast(message) {
    const toast = $("#toast");
    const text = $("#toastMessage");

    if (!toast || !text) {
        return;
    }

    text.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function loadGames() {
    const grid = $("#featuredGrid");

    if (!grid) {
        return;
    }

    let games = [];

    try {
        const raw = localStorage.getItem(STORAGE.games);

        if (raw) {
            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {
                games = parsed;
            }
        }
    } catch {
        games = [];
    }

    if (!games.length) {
        return;
    }

    grid.innerHTML = "";

    games.slice(0, 8).forEach((game, index) => {
        const card = createGameCard(game, index);

        grid.appendChild(card);
    });
}

function createGameCard(game, index) {
    const card = document.createElement("article");

    card.className = "game-card";

    const title =
        game.title ||
        game.name ||
        `RiseUp Game ${index + 1}`;

    const creator =
        game.creator ||
        game.owner ||
        "RiseUp Creator";

    const thumbnailLetter =
        title.charAt(0).toUpperCase();

    card.innerHTML = `
        <div class="game-thumbnail">
            <span class="game-thumbnail-letter">${escapeHTML(thumbnailLetter)}</span>
        </div>

        <div class="game-info">
            <h3>${escapeHTML(title)}</h3>
            <p>Created by ${escapeHTML(creator)}</p>
        </div>
    `;

    card.addEventListener("click", () => {
        const gameId =
            game.id ||
            game.gameId ||
            "";

        if (gameId) {
            localStorage.setItem(
                "riseup_play_game_id",
                String(gameId)
            );
        }

        showToast(`Opening ${title}...`);

        setTimeout(() => {
            if (game.url) {
                window.location.href = game.url;
            } else {
                navigate("discover");
            }
        }, 300);
    });

    return card;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setupNavigation() {
    $$(".nav-item, .side-item[data-page]").forEach((button) => {
        button.addEventListener("click", () => {
            const page = button.dataset.page;

            if (!page) {
                return;
            }

            if (page === "home") {
                navigate("home");
                return;
            }

            navigate(page);
        });
    });
}

function setupButtons() {
    $("#brandButton")?.addEventListener("click", () => {
        navigate("home");
    });

    $("#heroCreateButton")?.addEventListener("click", () => {
        navigate("create");
    });

    $("#discoverButton")?.addEventListener("click", () => {
        navigate("discover");
    });

    $("#emptyDiscoverButton")?.addEventListener("click", () => {
        navigate("discover");
    });

    $("#featuredViewAll")?.addEventListener("click", () => {
        navigate("discover");
    });

    $("#continueViewAll")?.addEventListener("click", () => {
        navigate("discover");
    });

    $("#avatarButton")?.addEventListener("click", () => {
        navigate("avatar");
    });

    $("#quickAvatar")?.addEventListener("click", () => {
        navigate("avatar");
    });

    $("#quickFriends")?.addEventListener("click", () => {
        navigate("friends");
    });

    $("#quickStudio")?.addEventListener("click", () => {
        navigate("studio");
    });

    $("#quickMarketplace")?.addEventListener("click", () => {
        navigate("marketplace");
    });

    $("#firstCreatorButton")?.addEventListener("click", () => {
        navigate("studio");
    });

    $("#studioButton")?.addEventListener("click", () => {
        navigate("studio");
    });

    $("#codeButton")?.addEventListener("click", () => {
        navigate("code");
    });

    $("#settingsButton")?.addEventListener("click", () => {
        navigate("settings");
    });

    $("#profileButton")?.addEventListener("click", () => {
        navigate("avatar");
    });

    $("#tokButton")?.addEventListener("click", () => {
        showToast("TOK balance");
    });

    $("#messagesButton")?.addEventListener("click", () => {
        navigate("messages");
    });

    $("#notificationsButton")?.addEventListener("click", () => {
        showToast("You have no new notifications.");
    });
}

function setupSearch() {
    const input = $("#searchInput");

    if (!input) {
        return;
    }

    input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
            return;
        }

        const query = input.value.trim();

        if (!query) {
            navigate("discover");
            return;
        }

        localStorage.setItem(
            "riseup_search_query",
            query
        );

        navigate("discover");
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();

            $("#searchInput")?.focus();
        }
    });
}

function initialize() {
    updateUserUI();
    loadGames();
    setupNavigation();
    setupButtons();
    setupSearch();
    setupKeyboardShortcuts();

    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");

    if (page) {
        setActivePage(page);
    }
}

return {
    initialize,
    navigate,
    showToast
};
```

})();

document.addEventListener("DOMContentLoaded", () => {
RiseUpHome.initialize();
});
