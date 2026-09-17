(() => {
  "use strict";

  const USER_KEY = "riseup_currentUser";
  const GAMES_KEY = "riseup_games";
  const FRIENDS_PREFIX = "riseup_friends_";
  const TOKN_PREFIX = "riseup_tokn_";
  const SETTINGS_PREFIX = "riseup_settings_";

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
    updateTokn();
    goHome(false);
  }

  function cacheElements() {
    els.brandButton = document.getElementById("brandButton");
    els.welcomeName = document.getElementById("welcomeName");
    els.avatarLetter = document.getElementById("avatarLetter");
    els.avatarButton = document.getElementById("avatarButton");
    els.profileMenu = document.getElementById("profileMenu");
    els.menuName = document.getElementById("menuName");
    els.toknButton = document.getElementById("toknButton");
    els.toknAmount = document.getElementById("toknAmount");
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

  function bindEvents() {
    document.querySelectorAll(".top-nav-item[data-page]").forEach(btn => {
      btn.addEventListener("click", () => navigateTo(btn.dataset.page));
    });

    document.querySelectorAll(".side-item[data-section]").forEach(btn => {
      btn.addEventListener("click", () => navigateTo(btn.dataset.section));
    });

    els.brandButton?.addEventListener("click", () => navigateTo("home"));

    els.searchInput?.addEventListener("input", () => {
      state.query = els.searchInput.value.trim().toLowerCase();
      renderGames();
      if (state.query) {
        setActiveTopNav(document.querySelector('.top-nav-item[data-page="discover"]'));
        setActiveSide(document.querySelector('.side-item[data-section="discover"]'));
      }
    });

    els.searchInput?.addEventListener("keydown", e => {
      if (e.key === "Enter") navigateTo("discover");
      if (e.key === "Escape") {
        els.searchInput.value = "";
        state.query = "";
        renderGames();
        els.searchInput.blur();
        navigateTo("home");
      }
    });

    els.avatarButton?.addEventListener("click", e => {
      e.stopPropagation();
      toggleProfileMenu();
    });

    els.toknButton?.addEventListener("click", () => comingSoon("Tokn"));
    els.messagesButton?.addEventListener("click", () => comingSoon("Messages"));
    els.notificationsButton?.addEventListener("click", () => comingSoon("Notifications"));
    els.settingsButton?.addEventListener("click", () => comingSoon("Settings"));

    els.viewFriends?.addEventListener("click", () => {
      if (els.friendsSection) scrollTo(els.friendsSection);
      if (!state.friends.length) showToast("You don't have any friends yet.");
    });

    els.continueAll?.addEventListener("click", () => navigateTo("discover"));
    els.recommendedAll?.addEventListener("click", () => navigateTo("discover"));

    els.logoutButton?.addEventListener("click", logout);

    document.addEventListener("click", e => {
      if (els.profileMenu && !els.profileMenu.contains(e.target) && e.target !== els.avatarButton) {
        closeProfileMenu();
      }
    });

    document.getElementById("emptyCreate")?.addEventListener("click", () => {
      saveLastAction("studio");
    });
    document.getElementById("allCreate")?.addEventListener("click", () => {
      saveLastAction("studio");
    });

    window.addEventListener("popstate", () => {
      const hash = (location.hash || "").replace("#", "").toLowerCase() || "home";
      navigateTo(hash, false);
    });

    window.addEventListener("storage", () => {
      loadData();
      renderUser();
      renderFriends();
      renderGames();
      updateTokn();
    });
  }

  function navigateTo(target, push = true) {
    closeProfileMenu();
    const page = (target || "home").toLowerCase();

    const secondary = [
      "avatar", "inventory", "friends", "messages",
      "marketplace", "tokn", "tokens", "settings", "notifications"
    ];

    if (secondary.includes(page)) {
      comingSoon(capitalize(page === "tokn" || page === "tokens" ? "Tokn" : page));
      setActiveSide(document.querySelector(`.side-item[data-section="${page}"]`));
      return;
    }

    state.activeSection = page;

    if (page === "discover") {
      goToDiscover(push);
    } else {
      goHome(push);
    }
  }

  function goHome(push = true) {
    state.activeSection = "home";
    state.query = "";
    if (els.searchInput) els.searchInput.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveTopNav(document.querySelector('.top-nav-item[data-page="home"]'));
    setActiveSide(document.querySelector('.side-item[data-section="home"]'));

    if (push) history.pushState({ page: "home" }, "", "#home");
    renderGames();
  }

  function goToDiscover(push = true) {
    state.activeSection = "discover";
    setActiveTopNav(document.querySelector('.top-nav-item[data-page="discover"]'));
    setActiveSide(document.querySelector('.side-item[data-section="discover"]'));

    if (els.allGamesSection) scrollTo(els.allGamesSection);
    if (push) history.pushState({ page: "discover" }, "", "#discover");
    renderGames();
  }

  function comingSoon(name) {
    showToast(name + " is coming soon");
  }

  function setActiveTopNav(button) {
    document.querySelectorAll(".top-nav-item").forEach(item => {
      item.classList.toggle("active", item === button);
    });
  }

  function setActiveSide(button) {
    document.querySelectorAll(".side-item[data-section]").forEach(item => {
      item.classList.toggle("active", item === button);
    });
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return raw; }
    } catch { return null; }
  }

  function getUsername() {
    const user = state.user || getCurrentUser();
    if (!user) return "Creator";
    if (typeof user === "string") return user;
    return user.username || user.name || user.user || user.displayName || "Creator";
  }

  function getDisplayName() {
    const user = state.user || getCurrentUser();
    if (!user) return "Creator";
    if (typeof user === "string") return user;
    return user.displayName || user.username || user.name || user.user || "Creator";
  }

  function renderUser() {
    const name = getDisplayName();
    const letter = name.charAt(0).toUpperCase() || "R";
    if (els.welcomeName) els.welcomeName.textContent = name;
    if (els.menuName) els.menuName.textContent = name;
    if (els.avatarLetter) els.avatarLetter.textContent = letter;
    updateTokn();
  }

  function toknKey() {
    return TOKN_PREFIX + getUsername();
  }

  function getTokn() {
    try {
      const value = Number(localStorage.getItem(toknKey()));
      if (Number.isFinite(value) && value >= 0) return Math.floor(value);
    } catch {}
    return 0;
  }

  function updateTokn() {
    if (els.toknAmount) {
      els.toknAmount.textContent = formatNumber(getTokn());
    }
  }

  function friendsKey() {
    return FRIENDS_PREFIX + getUsername();
  }

  function loadFriends() {
    try {
      const raw = localStorage.getItem(friendsKey());
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.map(f => {
        if (typeof f === "string") return { name: f };
        if (f && typeof f === "object") {
          return { name: f.name || f.username || f.displayName || "Friend" };
        }
        return null;
      }).filter(Boolean);
    } catch { return []; }
  }

  function renderFriends() {
    if (!els.friendsRow) return;
    els.friendsRow.replaceChildren();
    state.friends = loadFriends();

    if (els.friendsCount) {
      els.friendsCount.textContent = String(state.friends.length);
    }

    if (!state.friends.length) {
      const empty = document.createElement("div");
      empty.className = "friends-empty";
      empty.innerHTML = `
        <div class="friend-placeholder"></div>
        <div>
          <strong>No friends yet</strong>
          <span>Add friends to see them here.</span>
        </div>`;
      els.friendsRow.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "friend-list";

    state.friends.forEach(friend => {
      const card = document.createElement("div");
      card.className = "friend-card";

      const avatar = document.createElement("div");
      avatar.className = "friend-avatar";
      avatar.textContent = friend.name.charAt(0).toUpperCase() || "F";

      const name = document.createElement("span");
      name.className = "friend-name";
      name.textContent = friend.name;

      card.appendChild(avatar);
      card.appendChild(name);
      list.appendChild(card);
    });

    els.friendsRow.appendChild(list);
  }

  function loadData() {
    state.games = readGames();
    state.friends = loadFriends();
  }

  function readGames() {
    try {
      const raw = localStorage.getItem(GAMES_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.map(normalizeGame).filter(Boolean);
    } catch { return []; }
  }

  function normalizeGame(game, index) {
    if (!game || typeof game !== "object") return null;
    return {
      id: String(game.id ?? game.gameId ?? "game-" + index),
      name: String(game.name || game.title || game.gameName || "Untitled Experience"),
      creator: String(game.creator || game.creatorName || game.owner || game.username || "Unknown Creator"),
      owner: String(game.projectOwner || game.owner || game.creator || game.creatorName || game.username || ""),
      description: String(game.description || ""),
      thumbnail: String(game.thumbnail || game.thumbnailUrl || game.image || ""),
      mode: String(game.mode || "2d").toLowerCase(), // "2d" or "3d"
      createdAt: game.createdAt || null,
      updatedAt: game.updatedAt || game.createdAt || null
    };
  }

  function getFilteredGames() {
    if (!state.query) return [...state.games];
    return state.games.filter(game => {
      const text = [game.name, game.creator, game.description].join(" ").toLowerCase();
      return text.includes(state.query);
    });
  }

  function renderGames() {
    const games = getFilteredGames();
    const current = getUsername().toLowerCase();

    const continueGames = games
      .filter(g => {
        const owner = g.owner.toLowerCase();
        const creator = g.creator.toLowerCase();
        return owner === current || creator === current;
      })
      .slice(0, 8);

    const recommended = games.slice(0, 8);

    renderGameGrid(els.continueGrid, continueGames);
    renderGameGrid(els.recommendedGrid, recommended);
    renderGameGrid(els.allGamesGrid, games);

    if (els.continueEmpty) els.continueEmpty.hidden = continueGames.length > 0;
    if (els.recommendedEmpty) els.recommendedEmpty.hidden = recommended.length > 0;
    if (els.allEmpty) els.allEmpty.hidden = games.length > 0;

    if (state.query && !games.length && els.allEmpty) {
      const title = els.allEmpty.querySelector("h3");
      const text = els.allEmpty.querySelector("p");
      if (title) title.textContent = "No results";
      if (text) text.textContent = "Try a different search term.";
    }
  }

  function renderGameGrid(container, games) {
    if (!container) return;
    container.replaceChildren();

    games.forEach(game => {
      const card = document.createElement("div");
      card.className = "game-card";

      // Open the correct player
      card.addEventListener("click", () => {
        const mode = (game.mode || "2d").toLowerCase();
        if (mode === "3d") {
          window.location.href = "player3d.html?game=" + encodeURIComponent(game.id);
        } else {
          window.location.href = "player.html?game=" + encodeURIComponent(game.id);
        }
      });

      const thumb = document.createElement("div");
      thumb.className = "game-thumbnail";
      if (game.thumbnail) {
        thumb.style.backgroundImage = `url(${game.thumbnail})`;
        thumb.style.backgroundSize = "cover";
        thumb.style.backgroundPosition = "center";
      }

      const info = document.createElement("div");
      info.className = "game-info";

      const title = document.createElement("h3");
      title.className = "game-title";
      title.textContent = game.name;

      const creator = document.createElement("div");
      creator.className = "game-creator";
      creator.textContent = "by " + game.creator;

      info.appendChild(title);
      info.appendChild(creator);
      card.appendChild(thumb);
      card.appendChild(info);
      container.appendChild(card);
    });
  }

  function toggleProfileMenu() {
    els.profileMenu?.classList.toggle("open");
  }

  function closeProfileMenu() {
    els.profileMenu?.classList.remove("open");
  }

  function logout() {
    try { localStorage.removeItem(USER_KEY); } catch {}
    window.location.href = "index.html";
  }

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2600);
  }

  function scrollTo(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatNumber(n) {
    return Number(n).toLocaleString();
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function saveLastAction(action) {
    try { localStorage.setItem("riseup_lastAction", action); } catch {}
  }

  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_PREFIX + getUsername());
      if (raw) return JSON.parse(raw);
    } catch {}
    return { reducedMotion: false };
  }
})();
