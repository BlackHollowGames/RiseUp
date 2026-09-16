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

    // Tokn + secondary actions → coming soon
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

    document.getElementById("emptyCreate")?.addEventListener("click", () => saveLastAction("studio"));
    document.getElementById("allCreate")?.addEventListener("click", () => saveLastAction("studio"));

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

  /* ========== NAVIGATION ========== */
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
    state.activeSection = 
