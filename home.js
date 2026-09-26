"use strict";

const RiseUpHome = (() => {
    const STORAGE = {
        currentUser: "riseup_currentUser",
        games: "riseup_games",
        tok: "riseup_tok",
        settings: "riseup_settings",
        friendsPrefix: "riseup_friends_",
        messagesPrefix: "riseup_messages_",
        inventoryPrefix: "riseup_inventory_",
        avatarPrefix: "riseup_avatar_",
        search: "riseup_search_query",
        selectedGame: "riseup_play_game_id",
        lastGame: "riseup_last_game_id",
        lastPage: "riseup_last_page"
    };

    const routes = {
        home: "home.html",
        discover: "discover.html",
        marketplace: "marketplace.html",
        avatar: "avatar.html",
        inventory: "inventory.html",
        friends: "friends.html",
        messages: "messages.html",
        create: "studio.html",
        studio: "studio.html",
        code: "code.html",
        settings: "setting.html"
    };

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    let currentUser = null;
    let settings = {};
    let games = [];

    function safeJSON(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);

            if (!raw) {
                return fallback;
            }

            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

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

    function getUsername(user = currentUser) {
        if (!user) {
            return "Player";
        }

        if (typeof user === "string") {
            return user;
        }

        return (
            user.displayName ||
            user.username ||
            user.name ||
            "Player"
        );
    }

    function getInitial(user = currentUser) {
        const name = getUsername(user).trim();

        return name
            ? name.charAt(0).toUpperCase()
            : "R";
    }

    function getUserId(user = currentUser) {
        if (!user) {
            return "Player";
        }

        if (typeof user === "string") {
            return user;
        }

        return (
            user.username ||
            user.id ||
            user.userId ||
            user.displayName ||
            "Player"
        );
    }

    function getTok() {
        const stored = localStorage.getItem(STORAGE.tok);

        if (stored === null) {
            return 0;
        }

        const amount = Number(stored);

        return Number.isFinite(amount) && amount >= 0
            ? Math.floor(amount)
            : 0;
    }

    function setTok(amount) {
        const safeAmount = Math.max(
            0,
            Math.floor(Number(amount) || 0)
        );

        localStorage.setItem(
            STORAGE.tok,
            String(safeAmount)
        );

        updateTokUI(safeAmount);
    }

    function updateTokUI(amount = getTok()) {
        const formatted = Number(amount).toLocaleString();

        [
            "#tokAmount",
            "#tokBalance",
            "[data-tok-balance]"
        ].forEach(selector => {
            $$(selector).forEach(element => {
                element.textContent = formatted;
            });
        });
    }

    function loadSettings() {
        const stored = safeJSON(STORAGE.settings, {});

        settings = {
            theme: "dark",
            accent: "blue",
            animations: true,
            compactNav: false,
            performance: false,
            reducedMotion: false,
            largeText: false,
            highContrast: false,
            rememberPage: true,
            ...stored
        };
    }

    function applySettings() {
        document.documentElement.dataset.theme =
            settings.theme || "dark";

        document.documentElement.dataset.accent =
            settings.accent || "blue";

        document.body.classList.toggle(
            "large-text",
            Boolean(settings.largeText)
        );

        document.body.classList.toggle(
            "high-contrast",
            Boolean(settings.highContrast)
        );

        document.body.classList.toggle(
            "reduce-motion",
            Boolean(settings.reducedMotion)
        );

        document.body.classList.toggle(
            "compact-navigation",
            Boolean(settings.compactNav)
        );

        if (
            settings.reducedMotion ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            document.documentElement.style.setProperty(
                "--riseup-motion",
                "0s"
            );
        } else {
            document.documentElement.style.removeProperty(
                "--riseup-motion"
            );
        }
    }

    function updateUserUI() {
        currentUser = getCurrentUser();

        const name = getUsername();
        const initial = getInitial();

        const welcome = $("#welcomeTitle");

        if (welcome) {
            welcome.textContent =
                `Welcome back, ${name}`;
        }

        $$("#headerAvatar, #profileAvatar, #userAvatar").forEach(
            avatar => {
                avatar.textContent = initial;

                avatar.setAttribute(
                    "aria-label",
                    `${name}'s avatar`
                );
            }
        );

        $$("#username, #profileName, #sideUsername").forEach(
            element => {
                element.textContent = name;
            }
        );

        updateTokUI();
    }

    function navigate(page) {
        const destination = routes[page];

        if (!destination) {
            showToast(
                "That RiseUp page is not available yet."
            );

            return;
        }

        if (settings.rememberPage) {
            localStorage.setItem(
                STORAGE.lastPage,
                page
            );
        }

        window.location.href = destination;
    }

    function setActivePage(page) {
        $$(".nav-item, .side-item").forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.page === page
            );
        });
    }

    function showToast(message, duration = 2600) {
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
        }, duration);
    }

    function loadGames() {
        const stored = safeJSON(
            STORAGE.games,
            []
        );

        games = Array.isArray(stored)
            ? stored
            : [];

        renderGames();
    }

    function renderGames() {
        const grid = $("#featuredGrid");

        if (!grid) {
            return;
        }

        if (!games.length) {
            return;
        }

        grid.innerHTML = "";

        games
            .slice(0, 8)
            .forEach((game, index) => {
                grid.appendChild(
                    createGameCard(game, index)
                );
            });
    }

    function getGameTitle(game, index) {
        return (
            game.title ||
            game.name ||
            game.gameName ||
            `RiseUp Game ${index + 1}`
        );
    }

    function getGameCreator(game) {
        return (
            game.creator ||
            game.owner ||
            game.author ||
            "RiseUp Creator"
        );
    }

    function getGameId(game, index) {
        return String(
            game.id ||
            game.gameId ||
            game._id ||
            `game-${index}`
        );
    }

    function createGameCard(game, index) {
        const card = document.createElement("article");

        card.className = "game-card";

        const title = getGameTitle(game, index);
        const creator = getGameCreator(game);
        const id = getGameId(game, index);

        const thumbnail =
            game.thumbnail ||
            game.image ||
            game.cover ||
            "";

        if (thumbnail) {
            card.innerHTML = `
                <div class="game-thumbnail">
                    <img
                        src="${escapeAttribute(thumbnail)}"
                        alt="${escapeAttribute(title)}"
                        loading="lazy"
                    >
                </div>

                <div class="game-info">
                    <h3>${escapeHTML(title)}</h3>
                    <p>Created by ${escapeHTML(creator)}</p>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="game-thumbnail">
                    <span class="game-thumbnail-letter">
                        ${escapeHTML(
                            title.charAt(0).toUpperCase()
                        )}
                    </span>
                </div>

                <div class="game-info">
                    <h3>${escapeHTML(title)}</h3>
                    <p>Created by ${escapeHTML(creator)}</p>
                </div>
            `;
        }

        card.setAttribute(
            "role",
            "button"
        );

        card.setAttribute(
            "tabindex",
            "0"
        );

        const openGame = () => {
            localStorage.setItem(
                STORAGE.selectedGame,
                id
            );

            localStorage.setItem(
                STORAGE.lastGame,
                id
            );

            showToast(
                `Opening ${title}...`
            );

            setTimeout(() => {
                if (game.url) {
                    window.location.href =
                        game.url;
                } else {
                    navigate("discover");
                }
            }, 250);
        };

        card.addEventListener(
            "click",
            openGame
        );

        card.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    openGame();
                }
            }
        );

        return card;
    }

    function setupNavigation() {
        $$(".nav-item, .side-item[data-page]").forEach(
            button => {
                if (
                    button.dataset.riseupBound === "true"
                ) {
                    return;
                }

                button.dataset.riseupBound = "true";

                button.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();

                        const page =
                            button.dataset.page;

                        if (!page) {
                            return;
                        }

                        navigate(page);
                    }
                );
            }
        );
    }

    function bindNavigationButton(
        selector,
        page
    ) {
        $$(selector).forEach(button => {
            if (
                button.dataset.riseupBound === "true"
            ) {
                return;
            }

            button.dataset.riseupBound = "true";

            button.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    navigate(page);
                }
            );
        });
    }

    function setupButtons() {
        bindNavigationButton(
            "#brandButton",
            "home"
        );

        bindNavigationButton(
            "#heroCreateButton",
            "create"
        );

        bindNavigationButton(
            "#discoverButton",
            "discover"
        );

        bindNavigationButton(
            "#emptyDiscoverButton",
            "discover"
        );

        bindNavigationButton(
            "#featuredViewAll",
            "discover"
        );

        bindNavigationButton(
            "#continueViewAll",
            "discover"
        );

        bindNavigationButton(
            "#avatarButton",
            "avatar"
        );

        bindNavigationButton(
            "#quickAvatar",
            "avatar"
        );

        bindNavigationButton(
            "#quickFriends",
            "friends"
        );

        bindNavigationButton(
            "#quickStudio",
            "studio"
        );

        bindNavigationButton(
            "#quickMarketplace",
            "marketplace"
        );

        bindNavigationButton(
            "#firstCreatorButton",
            "studio"
        );

        bindNavigationButton(
            "#studioButton",
            "studio"
        );

        bindNavigationButton(
            "#codeButton",
            "code"
        );

        bindNavigationButton(
            "#settingsButton",
            "settings"
        );

        bindNavigationButton(
            "#profileButton",
            "avatar"
        );

        bindNavigationButton(
            "#messagesButton",
            "messages"
        );

        $("#tokButton")?.addEventListener(
            "click",
            () => {
                showToast(
                    `${getTok().toLocaleString()} TOK available`
                );
            }
        );

        $("#notificationsButton")?.addEventListener(
            "click",
            () => {
                showToast(
                    "You have no new notifications."
                );
            }
        );

        $("#logoutButton")?.addEventListener(
            "click",
            logout
        );
    }

    function setupSearch() {
        const input = $("#searchInput");

        if (!input) {
            return;
        }

        const previousQuery =
            localStorage.getItem(
                STORAGE.search
            );

        if (previousQuery) {
            input.value = previousQuery;
        }

        input.addEventListener(
            "input",
            () => {
                const query =
                    input.value.trim();

                if (query) {
                    localStorage.setItem(
                        STORAGE.search,
                        query
                    );
                } else {
                    localStorage.removeItem(
                        STORAGE.search
                    );
                }
            }
        );

        input.addEventListener(
            "keydown",
            event => {
                if (event.key !== "Enter") {
                    return;
                }

                event.preventDefault();

                const query =
                    input.value.trim();

                if (!query) {
                    navigate("discover");
                    return;
                }

                localStorage.setItem(
                    STORAGE.search,
                    query
                );

                navigate("discover");
            }
        );
    }

    function setupKeyboardShortcuts() {
        document.addEventListener(
            "keydown",
            event => {
                const target =
                    event.target;

                const isTyping =
                    target &&
                    (
                        target.tagName === "INPUT" ||
                        target.tagName === "TEXTAREA" ||
                        target.isContentEditable
                    );

                if (
                    (event.ctrlKey ||
                        event.metaKey) &&
                    event.key.toLowerCase() === "k"
                ) {
                    event.preventDefault();

                    $("#searchInput")?.focus();

                    return;
                }

                if (isTyping) {
                    return;
                }

                if (event.key === "/") {
                    event.preventDefault();

                    $("#searchInput")?.focus();

                    return;
                }

                if (event.key.toLowerCase() === "g") {
                    event.preventDefault();

                    navigate("studio");
                }
            }
        );
    }

    function setupMobileMenu() {
        const menuButton =
            $("#mobileMenuButton");

        const sidebar =
            $(".sidebar");

        if (!menuButton || !sidebar) {
            return;
        }

        menuButton.addEventListener(
            "click",
            () => {
                sidebar.classList.toggle(
                    "open"
                );

                menuButton.setAttribute(
                    "aria-expanded",
                    sidebar.classList.contains(
                        "open"
                    )
                );
            }
        );

        $$(".sidebar a").forEach(link => {
            link.addEventListener(
                "click",
                () => {
                    sidebar.classList.remove(
                        "open"
                    );
                }
            );
        });
    }

    function setupQuickActions() {
        $$("[data-riseup-action]").forEach(
            element => {
                if (
                    element.dataset.riseupBound ===
                    "true"
                ) {
                    return;
                }

                element.dataset.riseupBound =
                    "true";

                element.addEventListener(
                    "click",
                    () => {
                        const action =
                            element.dataset.riseupAction;

                        if (routes[action]) {
                            navigate(action);
                        }
                    }
                );
            }
        );
    }

    function setupTokControls() {
        $$("[data-add-tok]").forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        const amount =
                            Number(
                                button.dataset.addTok
                            );

                        if (
                            !Number.isFinite(
                                amount
                            ) ||
                            amount <= 0
                        ) {
                            return;
                        }

                        setTok(
                            getTok() + amount
                        );

                        showToast(
                            `Added ${amount.toLocaleString()} TOK`
                        );
                    }
                );
            }
        );
    }

    function setupGameControls() {
        $$("[data-game-id]").forEach(
            element => {
                element.addEventListener(
                    "click",
                    () => {
                        const id =
                            element.dataset.gameId;

                        if (!id) {
                            return;
                        }

                        localStorage.setItem(
                            STORAGE.selectedGame,
                            id
                        );

                        localStorage.setItem(
                            STORAGE.lastGame,
                            id
                        );

                        showToast(
                            "Game selected."
                        );
                    }
                );
            }
        );
    }

    function setupOutsideClicks() {
        document.addEventListener(
            "click",
            event => {
                const sidebar =
                    $(".sidebar");

                const menu =
                    $("#mobileMenuButton");

                if (
                    !sidebar ||
                    !menu ||
                    !sidebar.classList.contains(
                        "open"
                    )
                ) {
                    return;
                }

                if (
                    !sidebar.contains(
                        event.target
                    ) &&
                    !menu.contains(
                        event.target
                    )
                ) {
                    sidebar.classList.remove(
                        "open"
                    );
                }
            }
        );
    }

    function logout() {
        localStorage.removeItem(
            STORAGE.currentUser
        );

        showToast(
            "Signed out of RiseUp."
        );

        setTimeout(() => {
            window.location.href =
                "index.html";
        }, 400);
    }

    function exposeGlobalAPI() {
        window.RiseUpHome = {
            initialize,
            navigate,
            showToast,

            getUser() {
                return currentUser;
            },

            getUsername() {
                return getUsername();
            },

            getTok() {
                return getTok();
            },

            setTok,

            addTok(amount) {
                const value =
                    Number(amount);

                if (
                    !Number.isFinite(value) ||
                    value <= 0
                ) {
                    return getTok();
                }

                const next =
                    getTok() +
                    Math.floor(value);

                setTok(next);

                return next;
            },

            getGames() {
                return [...games];
            },

            refreshGames() {
                loadGames();
            },

            getSettings() {
                return {
                    ...settings
                };
            }
        };
    }

    function initialize() {
        currentUser =
            getCurrentUser();

        loadSettings();
        applySettings();
        updateUserUI();
        loadGames();

        setupNavigation();
        setupButtons();
        setupSearch();
        setupKeyboardShortcuts();
        setupMobileMenu();
        setupQuickActions();
        setupTokControls();
        setupGameControls();
        setupOutsideClicks();

        const params =
            new URLSearchParams(
                window.location.search
            );

        const page =
            params.get("page");

        if (page) {
            setActivePage(page);
        } else {
            setActivePage("home");
        }

        exposeGlobalAPI();
    }

    return {
        initialize,
        navigate,
        showToast,
        getTok,
        setTok
    };
})();

document.addEventListener(
    "DOMContentLoaded",
    () => {
        RiseUpHome.initialize();
    }
);