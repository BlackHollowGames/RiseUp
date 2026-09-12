(() => {
  "use strict";

  const USER_KEY = "riseup_currentUser";
  const GAMES_KEY = "riseup_games";

  const user = getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const els = {
    brandButton: document.getElementById("brandButton"),
    welcomeName: document.getElementById("welcomeName"),
    menuName: document.getElementById("menuName"),
    avatarLetter: document.getElementById("avatarLetter"),
    avatarButton: document.getElementById("avatarButton"),
    profileMenu: document.getElementById("profileMenu"),
    ruxAmount: document.getElementById("ruxAmount"),
    friendsCount: document.getElementById("friendsCount"),
    friendsRow: document.getElementById("friendsRow"),
    searchInput: document.getElementById("searchInput"),
    continueGrid: document.getElementById("continueGrid"),
    recommendedGrid: document.getElementById("recommendedGrid"),
    allGamesGrid: document.getElementById("allGamesGrid"),
    continueEmpty: document.getElementById("continueEmpty"),
    recommendedEmpty: document.getElementById("recommendedEmpty"),
    allEmpty: document.getElementById("allEmpty"),
    toast: document.getElementById("toast"),
    friendsSection: document.getElementById("friendsSection"),
    allGamesSection: document.getElementById("allGamesSection")
  };

  const state = {
    user,
    games: readGames(),
    friends: readFriends(),
    query: ""
  };

  initialize();
  bindEvents();

  function initialize() {
    const displayName = getDisplayName(state.user);
    const letter = displayName.charAt(0).toUpperCase() || "R";

    els.welcomeName.textContent = displayName;
    els.menuName.textContent = displayName;
    els.avatarLetter.textContent = letter;
    els.ruxAmount.textContent = formatNumber(getRux(state.user));
    els.friendsCount.textContent = String(state.friends.length);

    renderFriends();
    renderGames();
  }

  function bindEvents() {
    els.brandButton?.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      setActiveTopNav(
        document.querySelector('.top-nav-item[data-page="home"]')
      );

      setActiveSideItem(
        document.querySelector('.side-item[data-section="home"]')
      );
    });

    document.querySelectorAll(".top-nav-item[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        handleTopNavigation(button.dataset.page, button);
      });
    });

    document.querySelectorAll(".side-item[data-section]").forEach((button) => {
      button.addEventListener("click", () => {
        handleSidebarSection(button.dataset.section);
        setActiveSideItem(button);
      });
    });

    document.getElementById("createTop")?.addEventListener("click", goToStudio);
    document.getElementById("createSidebar")?.addEventListener("click", goToStudio);
    document.getElementById("emptyCreate")?.addEventListener("click", goToStudio);
    document.getElementById("allCreate")?.addEventListener("click", goToStudio);

    document.getElementById("studioButton")?.addEventListener("click", goToStudio);
    document.getElementById("profileStudio")?.addEventListener("click", goToStudio);

    document.getElementById("riseCodeButton")?.addEventListener("click", goToRiseCode);
    document.getElementById("profileCode")?.addEventListener("click", goToRiseCode);

    document.getElementById("settingsButton")?.addEventListener("click", () => {
      showToast("Settings are coming next.");
    });

    document.getElementById("messagesButton")?.addEventListener("click", () => {
      showToast("No new messages.");
    });

    document.getElementById("notificationsButton")?.addEventListener("click", () => {
      showToast("No new notifications.");
    });

    document.getElementById("ruxButton")?.addEventListener("click", () => {
      showToast(`You have ${formatNumber(getRux(state.user))} RUX.`);
    });

    document.getElementById("viewFriends")?.addEventListener("click", () => {
      scrollToElement(els.friendsSection);

      if (!state.friends.length) {
        showToast("You do not have any friends yet.");
      }
    });

    document.getElementById("continueAll")?.addEventListener("click", () => {
      scrollToElement(els.allGamesSection);
    });

    document.getElementById("recommendedAll")?.addEventListener("click", () => {
      scrollToElement(els.allGamesSection);
    });

    els.searchInput?.addEventListener("input", () => {
      state.query = els.searchInput.value.trim().toLowerCase();
      renderGames();
    });

    els.searchInput?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        els.searchInput.value = "";
        state.query = "";
        renderGames();
        els.searchInput.blur();
      }
    });

    els.avatarButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      els.profileMenu.classList.toggle("open");
    });

    document.getElementById("logoutButton")?.addEventListener("click", logout);

    document.addEventListener("click", (event) => {
      if (
        els.profileMenu &&
        !els.profileMenu.contains(event.target) &&
        event.target !== els.avatarButton
      ) {
        els.profileMenu.classList.remove("open");
      }
    });

    window.addEventListener("storage", () => {
      state.games = readGames();
      state.friends = readFriends();

      els.friendsCount.textContent = String(state.friends.length);

      renderFriends();
      renderGames();
    });
  }

  function handleTopNavigation(page, button) {
    setActiveTopNav(button);

    if (page === "home") {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      setActiveSideItem(
        document.querySelector('.side-item[data-section="home"]')
      );

      return;
    }

    if (page === "discover") {
      scrollToElement(els.allGamesSection);
      setActiveSideItem(
        document.querySelector('.side-item[data-section="discover"]')
      );

      showToast(
        state.games.length
          ? `Showing ${state.games.length} available experience${state.games.length === 1 ? "" : "s"}.`
          : "No experiences have been created yet."
      );

      return;
    }

    if (page === "marketplace") {
      setActiveSideItem(
        document.querySelector('.side-item[data-section="marketplace"]')
      );

      showToast("Marketplace is coming next.");
    }
  }

  function handleSidebarSection(section) {
    switch (section) {
      case "home":
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
        setActiveTopNav(
          document.querySelector('.top-nav-item[data-page="home"]')
        );
        break;

      case "discover":
        scrollToElement(els.allGamesSection);
        setActiveTopNav(
          document.querySelector('.top-nav-item[data-page="discover"]')
        );
        showToast(
          state.games.length
            ? `Showing ${state.games.length} available experience${state.games.length === 1 ? "" : "s"}.`
            : "No experiences have been created yet."
        );
        break;

      case "friends":
        scrollToElement(els.friendsSection);

        if (!state.friends.length) {
          showToast("You do not have any friends yet.");
        }
        break;

      case "marketplace":
        setActiveTopNav(
          document.querySelector('.top-nav-item[data-page="marketplace"]')
        );
        showToast("Marketplace is coming next.");
        break;

      case "messages":
        showToast("No new messages.");
        break;

      case "avatar":
        showToast("Avatar is coming next.");
        break;

      case "inventory":
        showToast("Inventory is coming next.");
        break;
    }
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);

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

  function getDisplayName(account) {
    if (!account) {
      return "Creator";
    }

    if (typeof account === "string") {
      return account;
    }

    return (
      account.displayName ||
      account.username ||
      account.name ||
      account.user ||
      "Creator"
    );
  }

  function getUsername(account) {
    if (!account) {
      return "Creator";
    }

    if (typeof account === "string") {
      return account;
    }

    return (
      account.username ||
      account.name ||
      account.user ||
      account.displayName ||
      "Creator"
    );
  }

  function getRux(account) {
    if (!account || typeof account === "string") {
      return 0;
    }

    const value =
      account.rux ??
      account.RUX ??
      account.balance ??
      account.currency ??
      0;

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
  }

  function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return new Intl.NumberFormat("en-US").format(number);
  }

  function readGames() {
    try {
      const raw = localStorage.getItem(GAMES_KEY);

      if (!raw) {
        return [];
      }

      const data = JSON.parse(raw);

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

  function normalizeGame(game, index) {
    if (!game || typeof game !== "object") {
      return null;
    }

    const name = String(
      game.name ||
      game.title ||
      game.gameName ||
      "Untitled Experience"
    ).trim();

    const creator = String(
      game.creator ||
      game.creatorName ||
      game.owner ||
      game.username ||
      game.projectOwner ||
      "Unknown Creator"
    ).trim();

    const owner = String(
      game.projectOwner ||
      game.owner ||
      game.creator ||
      game.creatorName ||
      game.username ||
      ""
    ).trim();

    return {
      id: String(game.id ?? game.gameId ?? `game-${index}`),
      name,
      creator,
      owner,
      description: String(game.description || "").trim(),
      thumbnail: String(
        game.thumbnail ||
        game.thumbnailUrl ||
        game.image ||
        ""
      ).trim(),
      updatedAt: game.updatedAt || game.createdAt || null,
      createdAt: game.createdAt || null
    };
  }

  function readFriends() {
    const username = getUsername(state.user);
    const displayName = getDisplayName(state.user);

    const possibleKeys = [
      `riseup_friends_${username}`,
      `riseup_friends_${displayName}`
    ];

    const uniqueKeys = [...new Set(possibleKeys)];

    for (const key of uniqueKeys) {
      try {
        const raw = localStorage.getItem(key);

        if (!raw) {
          continue;
        }

        const data = JSON.parse(raw);

        if (Array.isArray(data)) {
          return data
            .map(normalizeFriend)
            .filter(Boolean);
        }
      } catch {
        // Try the next supported key.
      }
    }

    return [];
  }

  function normalizeFriend(friend) {
    if (typeof friend === "string") {
      const name = friend.trim();

      return name
        ? {
            name
          }
        : null;
    }

    if (!friend || typeof friend !== "object") {
      return null;
    }

    const name = String(
      friend.displayName ||
      friend.username ||
      friend.name ||
      friend.user ||
      "Friend"
    ).trim();

    if (!name) {
      return null;
    }

    return {
      name
    };
  }

  function renderFriends() {
    els.friendsRow.replaceChildren();

    if (!state.friends.length) {
      const empty = document.createElement("div");
      empty.className = "friends-empty";

      const placeholder = document.createElement("div");
      placeholder.className = "friend-placeholder";

      const textWrap = document.createElement("div");

      const strong = document.createElement("strong");
      strong.textContent = "No friends yet";

      const span = document.createElement("span");
      span.textContent = "Add friends to see them here.";

      textWrap.appendChild(strong);
      textWrap.appendChild(span);

      empty.appendChild(placeholder);
      empty.appendChild(textWrap);

      els.friendsRow.appendChild(empty);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "friend-list";

    state.friends.forEach((friend) => {
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

      wrapper.appendChild(card);
    });

    els.friendsRow.appendChild(wrapper);
  }

  function renderGames() {
    const filtered = getFilteredGames();

    const continueGames = getContinueGames(filtered);
    const recommendedGames = filtered.slice(0, 8);
    const allGames = filtered;

    renderGameGrid(els.continueGrid, continueGames);
    renderGameGrid(els.recommendedGrid, recommendedGames);
    renderGameGrid(els.allGamesGrid, allGames);

    els.continueEmpty.hidden = continueGames.length > 0;
    els.recommendedEmpty.hidden = recommendedGames.length > 0;
    els.allEmpty.hidden = allGames.length > 0;

    updateSearchState(filtered.length);
  }

  function getFilteredGames() {
    if (!state.query) {
      return [...state.games];
    }

    return state.games.filter((game) => {
      const searchable = [
        game.name,
        game.creator,
        game.description
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(state.query);
    });
  }

  function updateSearchState(resultCount) {
    if (!state.query) {
      els.allEmpty.querySelector("h3").textContent = "No games yet";
      els.allEmpty.querySelector("p").textContent =
        "Be the first creator to make a game.";
      return;
    }

    if (resultCount > 0) {
      return;
    }

    els.allEmpty.querySelector("h3").textContent = "No results found";
    els.allEmpty.querySelector("p").textContent =
      `Nothing matched "${state.query}".`;
  }

  function getContinueGames(games) {
    const current = getUsername(state.user).toLowerCase();

    return games
      .filter((game) => {
        const owner = game.owner.toLowerCase();
        const creator = game.creator.toLowerCase();

        return owner === current || creator === current;
      })
      .slice(0, 8);
  }

  function renderGameGrid(container, games) {
    container.replaceChildren();

    games.forEach((game) => {
      container.appendChild(createGameCard(game));
    });
  }

  function createGameCard(game) {
    const card = document.createElement("article");
    card.className = "game-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${game.name}`);

    const thumbnail = document.createElement("div");
    thumbnail.className = "game-thumbnail";

    if (game.thumbnail) {
      const safeThumbnail = sanitizeImageUrl(game.thumbnail);

      if (safeThumbnail) {
        thumbnail.style.backgroundImage =
          `url("${escapeCssUrl(safeThumbnail)}")`;
        thumbnail.style.backgroundSize = "cover";
        thumbnail.style.backgroundPosition = "center";
      }
    }

    const info = document.createElement("div");
    info.className = "game-info";

    const title = document.createElement("h3");
    title.className = "game-title";
    title.textContent = game.name;

    const creator = document.createElement("div");
    creator.className = "game-creator";
    creator.textContent = `By ${game.creator}`;

    info.appendChild(title);
    info.appendChild(creator);

    card.appendChild(thumbnail);
    card.appendChild(info);

    card.addEventListener("click", () => openGame(game));

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openGame(game);
      }
    });

    return card;
  }

  function openGame(game) {
    try {
      localStorage.setItem("riseup_play_game_id", game.id);
      localStorage.setItem("riseup_last_game_id", game.id);
    } catch {
      // Continue to Studio even when storage is unavailable.
    }

    window.location.href = "studio.html";
  }

  function goToStudio() {
    window.location.href = "studio.html";
  }

  function goToRiseCode() {
    window.location.href = "code.html";
  }

  function setActiveTopNav(activeButton) {
    document.querySelectorAll(".top-nav-item").forEach((button) => {
      button.classList.toggle("active", button === activeButton);
    });
  }

  function setActiveSideItem(activeButton) {
    document.querySelectorAll(".side-item[data-section]").forEach((button) => {
      button.classList.toggle("active", button === activeButton);
    });
  }

  function scrollToElement(element) {
    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function logout() {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Continue to the login page.
    }

    window.location.href = "index.html";
  }

  function showToast(message) {
    if (!els.toast) {
      return;
    }

    els.toast.textContent = message;
    els.toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2400);
  }

  function sanitizeImageUrl(value) {
    const input = String(value || "").trim();

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
      const url = new URL(input, window.location.href);

      if (
        url.protocol === "https:" ||
        url.protocol === "http:"
      ) {
        return url.href;
      }
    } catch {
      return "";
    }

    return "";
  }

  function escapeCssUrl(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "");
  }
})();
