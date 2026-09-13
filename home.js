(() => {
  "use strict";

  const USER_KEY = "riseup_currentUser";
  const GAMES_KEY = "riseup_games";
  const FRIENDS_PREFIX = "riseup_friends_";
  const TOKEN_PREFIX = "riseup_tokens_";
  const SETTINGS_PREFIX = "riseup_settings_";
  const AVATAR_PREFIX = "riseup_avatar_";

  const state = {
    user: getCurrentUser(),
    games: [],
    friends: [],
    query: "",
    activeSection: "home"
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();

    if (!state.user) {
      window.location.href = "index.html";
      return;
    }

    loadData();
    bindEvents();
    renderUser();
    renderFriends();
    renderGames();
    updateRux();
    renderSettingsState();
  }

  function cacheElements() {
    els.brandButton = document.getElementById("brandButton");
    els.welcomeName = document.getElementById("welcomeName");
    els.avatarLetter = document.getElementById("avatarLetter");
    els.avatarButton = document.getElementById("avatarButton");
    els.profileMenu = document.getElementById("profileMenu");
    els.menuName = document.getElementById("menuName");
    els.ruxButton = document.getElementById("ruxButton");
    els.ruxAmount = document.getElementById("ruxAmount");

    els.friendsCount = document.getElementById("friendsCount");
    els.friendsRow = document.getElementById("friendsRow");

    els.searchInput = document.getElementById("searchInput");

    els.continueGrid = document.getElementById("continueGrid");
    els.recommendedGrid = document.getElementById("recommendedGrid");
    els.allGamesGrid = document.getElementById("allGamesGrid");

    els.continueEmpty = document.getElementById("continueEmpty");
    els.recommendedEmpty = document.getElementById("recommendedEmpty");
    els.allEmpty = document.getElementById("allEmpty");

    els.friendsSection = document.getElementById("friendsSection");
    els.allGamesSection = document.getElementById("allGamesSection");

    els.viewFriends = document.getElementById("viewFriends");
    els.continueAll = document.getElementById("continueAll");
    els.recommendedAll = document.getElementById("recommendedAll");

    els.settingsButton = document.getElementById("settingsButton");

    els.messagesButton = document.getElementById("messagesButton");
    els.notificationsButton = document.getElementById("notificationsButton");

    els.toast = document.getElementById("toast");
    els.logoutButton = document.getElementById("logoutButton");
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function bindEvents() {

    /*
     * TOP NAV
     */

    document.querySelectorAll(".top-nav-item[data-page]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const page = button.dataset.page;

          if (page === "home") {
            goHome();
          }

          if (page === "discover") {
            goToDiscover();
          }

          if (page === "marketplace") {
            openEverything("marketplace");
          }

          setActiveTopNav(button);
        });
      });

    /*
     * SIDEBAR
     */

    document.querySelectorAll(".side-item[data-section]")
      .forEach(button => {
        button.addEventListener("click", () => {
          handleSidebar(button.dataset.section);
          setActiveSide(button);
        });
      });

    /*
     * BRAND
     */

    els.brandButton?.addEventListener("click", goHome);

    /*
     * SEARCH
     */

    els.searchInput?.addEventListener("input", () => {
      state.query =
        els.searchInput.value
          .trim()
          .toLowerCase();

      renderGames();

      if (state.query) {
        setActiveTopNav(
          document.querySelector(
            '.top-nav-item[data-page="discover"]'
          )
        );
      }
    });

    els.searchInput?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        goToDiscover();
      }

      if (event.key === "Escape") {
        els.searchInput.value = "";
        state.query = "";
        renderGames();
        els.searchInput.blur();
      }
    });

    /*
     * PROFILE
     */

    els.avatarButton?.addEventListener("click", event => {
      event.stopPropagation();
      toggleProfileMenu();
    });

    document.querySelectorAll("#profileMenu a")
      .forEach(link => {
        link.addEventListener("click", () => {
          closeProfileMenu();
        });
      });

    /*
     * RUX/TOKEN BUTTON
     */

    els.ruxButton?.addEventListener("click", () => {
      openEverything("tokens");
    });

    /*
     * MESSAGES
     */

    els.messagesButton?.addEventListener("click", () => {
      openEverything("messages");
    });

    /*
     * NOTIFICATIONS
     */

    els.notificationsButton?.addEventListener("click", () => {
      openEverything("notifications");
    });

    /*
     * SETTINGS
     */

    els.settingsButton?.addEventListener("click", () => {
      openEverything("settings");
    });

    /*
     * HOME ACTIONS
     */

    document.querySelectorAll(
      'a[href="studio.html"]'
    ).forEach(link => {
      link.addEventListener("click", () => {
        saveLastAction("studio");
      });
    });

    /*
     * VIEW BUTTONS
     */

    els.viewFriends?.addEventListener("click", () => {
      if (els.friendsSection) {
        scrollToElement(els.friendsSection);
      }

      if (!state.friends.length) {
        showToast("You do not have any friends yet.");
      }
    });

    els.continueAll?.addEventListener("click", goToDiscover);

    els.recommendedAll?.addEventListener("click", goToDiscover);

    /*
     * LOGOUT
     */

    els.logoutButton?.addEventListener("click", logout);

    /*
     * CLOSE PROFILE
     */

    document.addEventListener("click", event => {
      if (
        els.profileMenu &&
        !els.profileMenu.contains(event.target) &&
        event.target !== els.avatarButton
      ) {
        closeProfileMenu();
      }
    });

    /*
     * OTHER HOME CREATE LINKS
     */

    document.getElementById("emptyCreate")
      ?.addEventListener("click", () => {
        saveLastAction("studio");
      });

    document.getElementById("allCreate")
      ?.addEventListener("click", () => {
        saveLastAction("studio");
      });

    /*
     * STORAGE SYNC
     */

    window.addEventListener("storage", () => {
      loadData();
      renderUser();
      renderFriends();
      renderGames();
      updateRux();
    });
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function handleSidebar(section) {

    closeProfileMenu();

    state.activeSection = section;

    switch (section) {

      case "home":
        goHome();
        break;

      case "discover":
        goToDiscover();
        break;

      case "avatar":
        openEverything("avatar");
        break;

      case "inventory":
        openEverything("inventory");
        break;

      case "friends":
        openEverything("friends");
        break;

      case "messages":
        openEverything("messages");
        break;

      case "marketplace":
        openEverything("marketplace");
        break;

      case "settings":
        openEverything("settings");
        break;

      default:
        goHome();
        break;
    }
  }

  function goHome() {

    state.activeSection = "home";

    window.scrollTo({
      top: 0,
      behavior: getSettings().reducedMotion
        ? "auto"
        : "smooth"
    });

    setActiveTopNav(
      document.querySelector(
        '.top-nav-item[data-page="home"]'
      )
    );

    setActiveSide(
      document.querySelector(
        '.side-item[data-section="home"]'
      )
    );

    closeProfileMenu();
  }

  function goToDiscover() {

    state.activeSection = "discover";

    setActiveTopNav(
      document.querySelector(
        '.top-nav-item[data-page="discover"]'
      )
    );

    setActiveSide(
      document.querySelector(
        '.side-item[data-section="discover"]'
      )
    );

    if (els.allGamesSection) {
      els.allGamesSection.scrollIntoView({
        behavior: getSettings().reducedMotion
          ? "auto"
          : "smooth",
        block: "start"
      });
    }

    renderGames();
    closeProfileMenu();
  }

  /*
   * All secondary pages use the existing
   * everything.html system.
   */

  function openEverything(page) {
    window.location.href =
      "everything.html#" + encodeURIComponent(page);
  }

  function setActiveTopNav(button) {
    document.querySelectorAll(".top-nav-item")
      .forEach(item => {
        item.classList.toggle(
          "active",
          item === button
        );
      });
  }

  function setActiveSide(button) {
    document.querySelectorAll(
      ".side-item[data-section]"
    ).forEach(item => {
      item.classList.toggle(
        "active",
        item === button
      );
    });
  }

  /* =========================================================
     USER
     ========================================================= */

  function getCurrentUser() {

    try {
      const raw =
        localStorage.getItem(USER_KEY);

      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }

    } catch {
      return null;
    }
  }

  function getUsername() {

    const user =
      state.user ||
      getCurrentUser();

    if (!user) {
      return "Creator";
    }

    if (typeof user === "string") {
      return user;
    }

    return (
      user.username ||
      user.name ||
      user.user ||
      user.displayName ||
      "Creator"
    );
  }

  function getDisplayName() {

    const user =
      state.user ||
      getCurrentUser();

    if (!user) {
      return "Creator";
    }

    if (typeof user === "string") {
      return user;
    }

    return (
      user.displayName ||
      user.username ||
      user.name ||
      user.user ||
      "Creator"
    );
  }

  function renderUser() {

    const name =
      getDisplayName();

    const letter =
      name
        .charAt(0)
        .toUpperCase() ||
      "R";

    if (els.welcomeName) {
      els.welcomeName.textContent =
        name;
    }

    if (els.menuName) {
      els.menuName.textContent =
        name;
    }

    if (els.avatarLetter) {
      els.avatarLetter.textContent =
        letter;
    }

    updateRux();
  }

  /* =========================================================
     TOKENS / RUX
     ========================================================= */

  function tokenKey() {
    return (
      TOKEN_PREFIX +
      getUsername()
    );
  }

  function getTokens() {

    try {
      const value =
        Number(
          localStorage.getItem(
            tokenKey()
          )
        );

      if (
        Number.isFinite(value) &&
        value >= 0
      ) {
        return Math.floor(value);
      }

    } catch {}

    return getRuxFromAccount();
  }

  function getRuxFromAccount() {

    const user =
      state.user ||
      getCurrentUser();

    if (
      !user ||
      typeof user === "string"
    ) {
      return 0;
    }

    const amount =
      Number(
        user.rux ??
        user.RUX ??
        user.balance ??
        0
      );

    return Number.isFinite(amount)
      ? Math.floor(amount)
      : 0;
  }

  function updateRux() {

    const amount =
      getTokens();

    if (els.ruxAmount) {
      els.ruxAmount.textContent =
        formatNumber(amount);
    }
  }

  /* =========================================================
     FRIENDS
     ========================================================= */

  function friendsKey() {
    return (
      FRIENDS_PREFIX +
      getUsername()
    );
  }

  function loadFriends() {

    try {

      const raw =
        localStorage.getItem(
          friendsKey()
        );

      if (!raw) {
        return [];
      }

      const data =
        JSON.parse(raw);

      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .map(friend => {

          if (
            typeof friend ===
            "string"
          ) {
            return {
              name: friend
            };
          }

          if (
            friend &&
            typeof friend ===
            "object"
          ) {
            return {
              name:
                friend.name ||
                friend.username ||
                friend.displayName ||
                "Friend"
            };
          }

          return null;
        })
        .filter(Boolean);

    } catch {

      return [];

    }
  }

  function renderFriends() {

    if (!els.friendsRow) {
      return;
    }

    els.friendsRow.replaceChildren();

    state.friends =
      loadFriends();

    if (els.friendsCount) {
      els.friendsCount.textContent =
        String(
          state.friends.length
        );
    }

    if (!state.friends.length) {

      const empty =
        document.createElement("div");

      empty.className =
        "friends-empty";

      empty.innerHTML = `
        <div class="friend-placeholder"></div>

        <div>
          <strong>No friends yet</strong>
          <span>Add friends to see them here.</span>
        </div>
      `;

      els.friendsRow.appendChild(
        empty
      );

      return;
    }

    const list =
      document.createElement("div");

    list.className =
      "friend-list";

    state.friends
      .forEach(friend => {

        const card =
          document.createElement("div");

        card.className =
          "friend-card";

        const avatar =
          document.createElement("div");

        avatar.className =
          "friend-avatar";

        avatar.textContent =
          friend.name
            .charAt(0)
            .toUpperCase() ||
          "F";

        const name =
          document.createElement("span");

        name.className =
          "friend-name";

        name.textContent =
          friend.name;

        card.appendChild(
          avatar
        );

        card.appendChild(
          name
        );

        list.appendChild(
          card
        );
      });

    els.friendsRow.appendChild(
      list
    );
  }

  /* =========================================================
     GAMES
     ========================================================= */

  function loadData() {

    state.games =
      readGames();

    state.friends =
      loadFriends();
  }

  function readGames() {

    try {

      const raw =
        localStorage.getItem(
          GAMES_KEY
        );

      if (!raw) {
        return [];
      }

      const data =
        JSON.parse(raw);

      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .map(normalizeGame)
        .filter(Boolean);

    } catch {

      return [];

    }
  }

  function normalizeGame(game,index) {

    if (
      !game ||
      typeof game !==
      "object"
    ) {
      return null;
    }

    return {
      id:
        String(
          game.id ??
          game.gameId ??
          "game-" + index
        ),

      name:
        String(
          game.name ||
          game.title ||
          game.gameName ||
          "Untitled Experience"
        ),

      creator:
        String(
          game.creator ||
          game.creatorName ||
          game.owner ||
          game.username ||
          "Unknown Creator"
        ),

      owner:
        String(
          game.projectOwner ||
          game.owner ||
          game.creator ||
          game.creatorName ||
          game.username ||
          ""
        ),

      description:
        String(
          game.description ||
          ""
        ),

      thumbnail:
        String(
          game.thumbnail ||
          game.thumbnailUrl ||
          game.image ||
          ""
        ),

      createdAt:
        game.createdAt ||
        null,

      updatedAt:
        game.updatedAt ||
        game.createdAt ||
        null
    };
  }

  function getFilteredGames() {

    if (!state.query) {
      return [...state.games];
    }

    return state.games.filter(game => {

      const text = [
        game.name,
        game.creator,
        game.description
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(
        state.query
      );
    });
  }

  function renderGames() {

    const games =
      getFilteredGames();

    const current =
      getUsername()
        .toLowerCase();

    const continueGames =
      games
        .filter(game => {

          const owner =
            game.owner
              .toLowerCase();

          const creator =
            game.creator
              .toLowerCase();

          return (
            owner === current ||
            creator === current
          );

        })
        .slice(0,8);

    const recommended =
      games.slice(
        0,
        8
      );

    renderGameGrid(
      els.continueGrid,
      continueGames
    );

    renderGameGrid(
      els.recommendedGrid,
      recommended
    );

    renderGameGrid(
      els.allGamesGrid,
      games
    );

    if (els.continueEmpty) {
      els.continueEmpty.hidden =
        continueGames.length > 0;
    }

    if (els.recommendedEmpty) {
      els.recommendedEmpty.hidden =
        recommended.length > 0;
    }

    if (els.allEmpty) {
      els.allEmpty.hidden =
        games.length > 0;
    }

    if (state.query && !games.length) {

      if (els.allEmpty) {

        const title =
          els.allEmpty.querySelector(
            "h3"
          );

        const text =
          els.allEmpty.querySelector(
            "p"
          );

        if (title) {
          title.textContent =
            "No results found";
        }

        if (text) {
          text.textContent =
            `Nothing matched "${state.query}".`;
        }
      }

    } else if (els.allEmpty) {

      const title =
        els.allEmpty.querySelector(
          "h3"
        );

      const text =
        els.allEmpty.querySelector(
          "p"
        );

      if (title) {
        title.textContent =
          "No games yet";
      }

      if (text) {
        text.textContent =
          "Be the first creator to make a game.";
      }
    }
  }

  function renderGameGrid(
    container,
    games
  ) {

    if (!container) {
      return;
    }

    container.replaceChildren();

    games.forEach(game => {

      const card =
        document.createElement("article");

      card.className =
        "game-card";

      card.tabIndex =
        0;

      const thumbnail =
        document.createElement("div");

      thumbnail.className =
        "game-thumbnail";

      if (game.thumbnail) {

        const safe =
          sanitizeImageUrl(
            game.thumbnail
          );

        if (safe) {

          thumbnail.style.backgroundImage =
            `url("${escapeCssUrl(safe)}")`;

          thumbnail.style.backgroundSize =
            "cover";

          thumbnail.style.backgroundPosition =
            "center";

        }
      }

      const info =
        document.createElement("div");

      info.className =
        "game-info";

      const title =
        document.createElement("h3");

      title.className =
        "game-title";

      title.textContent =
        game.name;

      const creator =
        document.createElement("div");

      creator.className =
        "game-creator";

      creator.textContent =
        `By ${game.creator}`;

      info.appendChild(
        title
      );

      info.appendChild(
        creator
      );

      card.appendChild(
        thumbnail
      );

      card.appendChild(
        info
      );

      card.addEventListener(
        "click",
        () => openGame(game)
      );

      card.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
              "Enter" ||
            event.key ===
              " "
          ) {

            event.preventDefault();

            openGame(game);
          }
        }
      );

      container.appendChild(
        card
      );
    });
  }

  function openGame(game) {

    try {

      localStorage.setItem(
        "riseup_play_game_id",
        game.id
      );

      localStorage.setItem(
        "riseup_last_game_id",
        game.id
      );

    } catch {}

    window.location.href =
      "studio.html";
  }

  /* =========================================================
     PROFILE
     ========================================================= */

  function toggleProfileMenu() {

    if (!els.profileMenu) {
      return;
    }

    els.profileMenu.classList.toggle(
      "open"
    );
  }

  function closeProfileMenu() {

    els.profileMenu?.classList.remove(
      "open"
    );
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function getSettings() {

    try {

      const raw =
        localStorage.getItem(
          SETTINGS_PREFIX +
          getUsername()
        );

      return {
        reducedMotion:false,
        ...(raw
          ? JSON.parse(raw)
          : {})
      };

    } catch {

      return {
        reducedMotion:false
      };
    }
  }

  function saveLastAction(action) {

    try {

      localStorage.setItem(
        "riseup_last_action",
        action
      );

    } catch {}
  }

  function renderSettingsState() {
    updateRux();
  }

  /* =========================================================
     AVATAR COLOR
     ========================================================= */

  function getAvatar() {

    const fallback = {
      head:"#FFE047",
      body:"#249BFF",
      legs:"#00A82D"
    };

    try {

      const raw =
        localStorage.getItem(
          AVATAR_PREFIX +
          getUsername()
        );

      return {
        ...fallback,
        ...(raw
          ? JSON.parse(raw)
          : {})
      };

    } catch {

      return fallback;
    }
  }

  /* =========================================================
     LOGOUT
     ========================================================= */

  function logout() {

    try {
      localStorage.removeItem(
        USER_KEY
      );
    } catch {}

    window.location.href =
      "index.html";
  }

  /* =========================================================
     UI HELPERS
     ========================================================= */

  function scrollToElement(element) {

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior:
        getSettings().reducedMotion
          ? "auto"
          : "smooth",
      block:"start"
    });
  }

  function formatNumber(value) {

    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return new Intl.NumberFormat(
      "en-US"
    ).format(number);
  }

  function sanitizeImageUrl(value) {

    const input =
      String(value || "")
        .trim();

    if (!input) {
      return "";
    }

    if (
      input.startsWith("data:image/") ||
      input.startsWith("blob:") ||
      input.startsWith("./") ||
      input.startsWith("../") ||
      input.startsWith("/")
    ) {
      return input;
    }

    try {

      const url =
        new URL(
          input,
          window.location.href
        );

      if (
        url.protocol ===
          "https:" ||
        url.protocol ===
          "http:"
      ) {
        return url.href;
      }

    } catch {}

    return "";
  }

  function escapeCssUrl(value) {

    return String(value)
      .replace(
        /\\/g,
        "\\\\"
      )
      .replace(
        /"/g,
        '\\"'
      )
      .replace(
        /\r?\n/g,
        ""
      );
  }

  function showToast(message) {

    if (!els.toast) {
      return;
    }

    els.toast.textContent =
      message;

    els.toast.classList.add(
      "show"
    );

    clearTimeout(
      showToast.timer
    );

    showToast.timer =
      setTimeout(() => {

        els.toast.classList.remove(
          "show"
        );

      },2400);
  }

  window.RiseUpHome = {
    state,
    goHome,
    goToDiscover,
    openEverything,
    openGame,
    updateRux
  };

})();
