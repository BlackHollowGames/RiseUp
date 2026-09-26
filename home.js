"use strict";

/*
    RISEUP HOME CONTROLLER
    -----------------------
    Works directly with the current home.html structure.

    Main routes:
    Home          -> home.html
    Discover      -> discover.html
    Marketplace   -> marketplace.html
    Avatar        -> avatar.html
    Inventory     -> inventory.html
    Friends       -> friends.html
    Messages      -> messages.html
    Studio        -> studio.html
    RiseCode      -> code.html
    Settings      -> setting.html
*/

const RiseUpHome = (() => {

    const STORAGE = {
        currentUser: "riseup_currentUser",
        games: "riseup_games",
        tok: "riseup_tok",
        settings: "riseup_settings",
        friends: "riseup_friends_",
        messages: "riseup_messages_",
        inventory: "riseup_inventory_",
        avatar: "riseup_avatar_",
        selectedGame: "riseup_play_game_id",
        lastGame: "riseup_last_game_id",
        lastPage: "riseup_last_page",
        search: "riseup_search_query"
    };

    const ROUTES = {
        home: "home.html",
        discover: "discover.html",
        marketplace: "marketplace.html",
        avatar: "avatar.html",
        inventory: "inventory.html",
        friends: "friends.html",
        messages: "messages.html",
        studio: "studio.html",
        create: "studio.html",
        code: "code.html",
        settings: "setting.html"
    };

    let currentUser = null;

    function getUser() {
        return localStorage.getItem(STORAGE.currentUser) || "";
    }

    function setUserName() {
        currentUser = getUser();

        const welcomeTitle = document.getElementById("welcomeTitle");
        const headerAvatar = document.getElementById("headerAvatar");

        if (!currentUser) {
            if (welcomeTitle) {
                welcomeTitle.textContent = "Welcome to RiseUp";
            }

            if (headerAvatar) {
                headerAvatar.textContent = "R";
            }

            return;
        }

        const cleanName = currentUser.trim();

        if (welcomeTitle) {
            welcomeTitle.textContent = `Welcome back, ${cleanName}`;
        }

        if (headerAvatar) {
            headerAvatar.textContent = cleanName.charAt(0).toUpperCase();
        }
    }

    function getJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);

            if (!value) {
                return fallback;
            }

            const parsed = JSON.parse(value);

            return parsed ?? fallback;
        } catch (error) {
            console.warn("RiseUp JSON read error:", key, error);
            return fallback;
        }
    }

    function saveJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn("RiseUp JSON save error:", key, error);
            return false;
        }
    }

    function navigate(page) {
        const route = ROUTES[page];

        if (!route) {
            console.warn(`RiseUp: Unknown route "${page}"`);
            return;
        }

        localStorage.setItem(STORAGE.lastPage, page);

        window.location.assign(route);
    }

    function go(page, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        navigate(page);
    }

    function bindClick(id, page) {
        const element = document.getElementById(id);

        if (!element) {
            console.warn(`RiseUp: Missing element #${id}`);
            return;
        }

        element.addEventListener("click", function(event) {
            go(page, event);
        });
    }

    function setupMainNavigation() {
        const navItems = document.querySelectorAll(".nav-item[data-page]");

        navItems.forEach(item => {
            item.addEventListener("click", function(event) {
                const page = item.getAttribute("data-page");

                if (!page) {
                    return;
                }

                go(page, event);
            });
        });
    }

    function setupSidebarNavigation() {
        const sideItems = document.querySelectorAll(".side-item[data-page]");

        sideItems.forEach(item => {
            item.addEventListener("click", function(event) {
                const page = item.getAttribute("data-page");

                if (!page) {
                    return;
                }

                go(page, event);
            });
        });
    }

    function setupButtons() {

        bindClick("brandButton", "home");

        bindClick("heroCreateButton", "studio");

        bindClick("discoverButton", "discover");

        bindClick("avatarButton", "avatar");

        bindClick("emptyDiscoverButton", "discover");

        bindClick("featuredViewAll", "discover");

        bindClick("continueViewAll", "discover");

        bindClick("firstCreatorButton", "studio");

        bindClick("quickAvatar", "avatar");

        bindClick("quickFriends", "friends");

        bindClick("quickStudio", "studio");

        bindClick("quickMarketplace", "marketplace");

        bindClick("studioButton", "studio");

        bindClick("codeButton", "code");

        bindClick("settingsButton", "settings");

        bindClick("messagesButton", "messages");
    }

    function setupProfileButton() {
        const profileButton = document.getElementById("profileButton");

        if (!profileButton) {
            return;
        }

        profileButton.addEventListener("click", function(event) {
            event.preventDefault();

            const existingMenu = document.getElementById("riseupProfileMenu");

            if (existingMenu) {
                existingMenu.remove();
                return;
            }

            createProfileMenu(profileButton);
        });
    }

    function createProfileMenu(anchor) {

        const menu = document.createElement("div");

        menu.id = "riseupProfileMenu";

        menu.style.position = "fixed";
        menu.style.zIndex = "99999";
        menu.style.minWidth = "190px";
        menu.style.padding = "8px";
        menu.style.background = "#11151d";
        menu.style.border = "1px solid rgba(255,255,255,.10)";
        menu.style.borderRadius = "12px";
        menu.style.boxShadow = "0 18px 50px rgba(0,0,0,.45)";

        const rect = anchor.getBoundingClientRect();

        menu.style.top = `${rect.bottom + 8}px`;
        menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;

        const profileItem = createMenuButton(
            "Profile",
            () => showToast("Profile page coming soon.")
        );

        const settingsItem = createMenuButton(
            "Settings",
            () => navigate("settings")
        );

        const logoutItem = createMenuButton(
            "Log out",
            () => logout()
        );

        menu.appendChild(profileItem);
        menu.appendChild(settingsItem);
        menu.appendChild(logoutItem);

        document.body.appendChild(menu);

        setTimeout(() => {

            function closeMenu(event) {

                if (
                    !menu.contains(event.target) &&
                    event.target !== anchor
                ) {
                    menu.remove();
                    document.removeEventListener(
                        "click",
                        closeMenu
                    );
                }
            }

            document.addEventListener("click", closeMenu);

        }, 0);
    }

    function createMenuButton(text, action) {

        const button = document.createElement("button");

        button.type = "button";
        button.textContent = text;

        button.style.display = "block";
        button.style.width = "100%";
        button.style.border = "0";
        button.style.background = "transparent";
        button.style.color = "#fff";
        button.style.textAlign = "left";
        button.style.padding = "10px 12px";
        button.style.borderRadius = "8px";
        button.style.cursor = "pointer";
        button.style.fontSize = "14px";

        button.addEventListener("mouseenter", () => {
            button.style.background = "rgba(255,255,255,.07)";
        });

        button.addEventListener("mouseleave", () => {
            button.style.background = "transparent";
        });

        button.addEventListener("click", event => {
            event.preventDefault();
            action();

            const menu = document.getElementById("riseupProfileMenu");

            if (menu) {
                menu.remove();
            }
        });

        return button;
    }

    function setupTOK() {

        const tokButton = document.getElementById("tokButton");
        const tokAmount = document.getElementById("tokAmount");

        if (!tokAmount) {
            return;
        }

        const key = currentUser
            ? `${STORAGE.tok}_${currentUser}`
            : STORAGE.tok;

        let amount = Number(localStorage.getItem(key));

        if (!Number.isFinite(amount)) {
            amount = 0;
        }

        tokAmount.textContent = formatNumber(amount);

        if (tokButton) {
            tokButton.addEventListener("click", function(event) {
                event.preventDefault();

                showToast(`You have ${formatNumber(amount)} TOK.`);
            });
        }
    }

    function formatNumber(number) {
        return new Intl.NumberFormat("en-US").format(number);
    }

    function setupNotifications() {

        const button = document.getElementById("notificationsButton");

        if (!button) {
            return;
        }

        button.addEventListener("click", function(event) {
            event.preventDefault();

            showToast("No new notifications.");
        });
    }

    function setupSearch() {

        const searchInput = document.getElementById("searchInput");

        if (!searchInput) {
            return;
        }

        const savedSearch = localStorage.getItem(STORAGE.search);

        if (savedSearch) {
            searchInput.value = savedSearch;
        }

        searchInput.addEventListener("keydown", function(event) {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            const query = searchInput.value.trim();

            if (!query) {
                showToast("Enter something to search for.");
                searchInput.focus();
                return;
            }

            localStorage.setItem(STORAGE.search, query);

            navigate("discover");
        });
    }

    function setupKeyboardShortcuts() {

        document.addEventListener("keydown", function(event) {

            const tag = document.activeElement?.tagName;

            const typing =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT";

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();

                const search = document.getElementById("searchInput");

                if (search) {
                    search.focus();
                    search.select();
                }

                return;
            }

            if (
                event.key === "/" &&
                !typing
            ) {
                event.preventDefault();

                const search = document.getElementById("searchInput");

                if (search) {
                    search.focus();
                }
            }
        });
    }

    function setupGameCards() {

        document.addEventListener("click", function(event) {

            const target = event.target.closest(
                "[data-game-id], [data-game], .game-card"
            );

            if (!target) {
                return;
            }

            const gameId =
                target.dataset.gameId ||
                target.dataset.game;

            if (!gameId) {
                return;
            }

            event.preventDefault();

            localStorage.setItem(
                STORAGE.selectedGame,
                gameId
            );

            localStorage.setItem(
                STORAGE.lastGame,
                gameId
            );

            showToast("Opening game...");

            setTimeout(() => {
                navigate("discover");
            }, 150);
        });
    }

    function loadGames() {

        const games = getJSON(STORAGE.games, []);

        if (!Array.isArray(games)) {
            return [];
        }

        return games;
    }

    function createGameCard(game) {

        const card = document.createElement("article");

        card.className = "game-card";

        if (game.id !== undefined) {
            card.dataset.gameId = game.id;
        }

        const title =
            game.title ||
            game.name ||
            "Untitled Game";

        const description =
            game.description ||
            "A RiseUp experience.";

        const creator =
            game.creator ||
            game.username ||
            "Creator";

        card.innerHTML = `
            <div class="game-card-image">
                <div class="game-card-placeholder">R</div>
            </div>

            <div class="game-card-body">
                <h3>${escapeHTML(title)}</h3>
                <p>${escapeHTML(description)}</p>
                <span>${escapeHTML(creator)}</span>
            </div>
        `;

        return card;
    }

    function renderGames() {

        const games = loadGames();

        const continueGrid =
            document.getElementById("continueGrid");

        const featuredGrid =
            document.getElementById("featuredGrid");

        if (!continueGrid || !featuredGrid) {
            return;
        }

        const recentGameId =
            localStorage.getItem(STORAGE.lastGame) ||
            localStorage.getItem(STORAGE.selectedGame);

        const recentGames = recentGameId
            ? games.filter(game =>
                String(game.id) === String(recentGameId)
            )
            : [];

        if (recentGames.length > 0) {

            continueGrid.innerHTML = "";

            recentGames.forEach(game => {
                continueGrid.appendChild(
                    createGameCard(game)
                );
            });

        } else {

            continueGrid.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">◇</div>
                    <h3>No recent games</h3>
                    <p>Games you play will appear here.</p>
                    <button
                        class="small-button"
                        id="emptyDiscoverButton"
                        type="button"
                    >
                        Discover games
                    </button>
                </div>
            `;

            bindClick(
                "emptyDiscoverButton",
                "discover"
            );
        }

        if (games.length > 0) {

            featuredGrid.innerHTML = "";

            games
                .slice(0, 8)
                .forEach(game => {
                    featuredGrid.appendChild(
                        createGameCard(game)
                    );
                });

        } else {

            featuredGrid.innerHTML = `
                <div class="empty-card featured-empty">
                    <div class="empty-icon">✦</div>
                    <h3>No games yet</h3>
                    <p>Be the first creator to make a game.</p>
                    <button
                        class="small-button"
                        id="firstCreatorButton"
                        type="button"
                    >
                        Open Studio
                    </button>
                </div>
            `;

            bindClick(
                "firstCreatorButton",
                "studio"
            );
        }
    }

    function setupMobileBehavior() {

        const sidebar = document.querySelector(".sidebar");

        if (!sidebar) {
            return;
        }

        let menuButton =
            document.getElementById("mobileMenuButton");

        if (!menuButton) {

            menuButton = document.createElement("button");

            menuButton.id = "mobileMenuButton";
            menuButton.type = "button";
            menuButton.setAttribute(
                "aria-label",
                "Open navigation"
            );

            menuButton.textContent = "Menu";

            menuButton.style.display = "none";
            menuButton.style.position = "fixed";
            menuButton.style.top = "12px";
            menuButton.style.left = "12px";
            menuButton.style.zIndex = "10001";
            menuButton.style.padding = "9px 12px";
            menuButton.style.borderRadius = "9px";
            menuButton.style.border =
                "1px solid rgba(255,255,255,.12)";
            menuButton.style.background = "#11151d";
            menuButton.style.color = "#fff";
            menuButton.style.cursor = "pointer";

            document.body.appendChild(menuButton);
        }

        function updateMobileButton() {

            if (window.innerWidth <= 960) {
                menuButton.style.display = "block";
            } else {
                menuButton.style.display = "none";
                sidebar.classList.remove("mobile-open");
            }
        }

        menuButton.addEventListener("click", function(event) {

            event.preventDefault();

            sidebar.classList.toggle("mobile-open");
        });

        window.addEventListener(
            "resize",
            updateMobileButton
        );

        updateMobileButton();
    }

    function setupCloseProfileOnNavigation() {

        document.addEventListener("click", function(event) {

            if (
                event.target.closest(
                    ".nav-item, .side-item, .quick-card, .primary-button, .secondary-button, .create-button, .text-button, .small-button"
                )
            ) {
                const menu =
                    document.getElementById(
                        "riseupProfileMenu"
                    );

                if (menu) {
                    menu.remove();
                }
            }
        });
    }

    function setupToast() {

        const toast = document.getElementById("toast");

        if (!toast) {
            return;
        }

        toast.style.pointerEvents = "none";
    }

    function showToast(message) {

        const toast =
            document.getElementById("toast");

        const toastMessage =
            document.getElementById("toastMessage");

        if (!toast || !toastMessage) {
            return;
        }

        toastMessage.textContent = message;

        toast.classList.add("show");

        clearTimeout(
            showToast.timeout
        );

        showToast.timeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    function logout() {

        localStorage.removeItem(
            STORAGE.currentUser
        );

        showToast("Logged out.");

        setTimeout(() => {

            if (
                document.referrer &&
                document.referrer.includes("index.html")
            ) {
                window.location.assign("index.html");
            } else {
                window.location.assign("index.html");
            }

        }, 500);
    }

    function escapeHTML(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function restoreActiveNavigation() {

        const currentFile =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        document
            .querySelectorAll(
                ".nav-item[data-page], .side-item[data-page]"
            )
            .forEach(item => {

                const page =
                    item.getAttribute("data-page");

                const route =
                    ROUTES[page];

                if (!route) {
                    return;
                }

                const isActive =
                    route.toLowerCase() === currentFile;

                item.classList.toggle(
                    "active",
                    isActive
                );
            });
    }

    function preventBrokenButtonSubmits() {

        document
            .querySelectorAll("button")
            .forEach(button => {

                if (!button.getAttribute("type")) {
                    button.setAttribute(
                        "type",
                        "button"
                    );
                }
            });
    }

    function setupUniversalNavigation() {

        /*
            This is an extra safety layer.

            If another part of home.html gets a
            data-page attribute later, it will work
            automatically without editing home.js.
        */

        document.addEventListener("click", function(event) {

            const element =
                event.target.closest(
                    "[data-page]"
                );

            if (!element) {
                return;
            }

            if (
                element.classList.contains("nav-item") ||
                element.classList.contains("side-item")
            ) {
                return;
            }

            const page =
                element.getAttribute("data-page");

            if (!page || !ROUTES[page]) {
                return;
            }

            go(page, event);
        });
    }

    function initialize() {

        currentUser = getUser();

        setUserName();

        preventBrokenButtonSubmits();

        setupMainNavigation();

        setupSidebarNavigation();

        setupButtons();

        setupProfileButton();

        setupTOK();

        setupNotifications();

        setupSearch();

        setupKeyboardShortcuts();

        setupGameCards();

        setupMobileBehavior();

        setupCloseProfileOnNavigation();

        setupUniversalNavigation();

        setupToast();

        restoreActiveNavigation();

        renderGames();

        console.log(
            "%cRiseUp Home",
            "color:#55a7ff;font-weight:700;font-size:18px"
        );

        console.log(
            "Navigation system initialized."
        );
    }

    return {
        initialize,
        navigate,
        showToast,
        logout,
        getUser
    };

})();


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        RiseUpHome.initialize
    );

} else {

    RiseUpHome.initialize();

}