/* home.js */
(function () {
  "use strict";

  const CURRENT_USER_KEY = "riseup_currentUser";
  const GAMES_KEY = "riseup_games";
  const RECENT_KEY = "riseup_recent_games";
  const FAVORITES_PREFIX = "riseup_favorites_";

  let currentUser = "";
  let games = [];
  let favorites = [];
  let recentIds = [];
  let selectedGame = null;

  const $ = (id) => document.getElementById(id);

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(CURRENT_USER_KEY);

    if (!raw) {
      window.location.href = "index.html";
      return "";
    }

    try {
      const parsed = JSON.parse(raw);

      if (typeof parsed === "string") {
        return parsed.trim();
      }

      if (parsed && typeof parsed === "object") {
        return String(
          parsed.username ||
          parsed.userName ||
          parsed.name ||
          parsed.displayName ||
          parsed.email ||
          ""
        ).trim();
      }
    } catch {
      return raw.trim();
    }

    return "";
  }

  function normalizeGame(game, index) {
    if (!game || typeof game !== "object") {
      return null;
    }

    const id = String(
      game.id ||
      game.projectId ||
      game.gameId ||
      `game-${index}`
    );

    const name = String(
      game.name ||
      game.projectName ||
      game.title ||
      "Untitled Game"
    ).trim();

    const creator = String(
      game.creator ||
      game.projectOwner ||
      game.owner ||
      game.username ||
      "Unknown Creator"
    ).trim();

    const projectOwner = String(
      game.projectOwner ||
      game.owner ||
      game.creator ||
      ""
    ).trim();

    const description = String(
      game.description ||
      game.desc ||
      ""
    ).trim();

    const thumbnail = String(
      game.thumbnail ||
      game.thumbnailUrl ||
      game.image ||
      game.imageUrl ||
      game.cover ||
      game.coverUrl ||
      game.icon ||
      game.iconUrl ||
      ""
    ).trim();

    return {
      ...game,
      id,
      name,
      creator,
      projectOwner,
      projectName: name,
      description,
      thumbnail,
      objects: Array.isArray(game.objects) ? game.objects : [],
      codeFiles: Array.isArray(game.codeFiles) ? game.codeFiles : [],
      publishedAt: game.publishedAt || game.createdAt || null
    };
  }

  function loadGames() {
    const stored = readJSON(GAMES_KEY, []);

    if (!Array.isArray(stored)) {
      games = [];
      return;
    }

    games = stored
      .map(normalizeGame)
      .filter(Boolean);
  }

  function loadFavorites() {
    const key = FAVORITES_PREFIX + currentUser;
    const stored = readJSON(key, []);

    favorites = Array.isArray(stored)
      ? stored.map(String)
      : [];
  }

  function loadRecent() {
    const stored = readJSON(RECENT_KEY, []);

    recentIds = Array.isArray(stored)
      ? stored.map(String)
      : [];
  }

  function saveFavorites() {
    localStorage.setItem(
      FAVORITES_PREFIX + currentUser,
      JSON.stringify(favorites)
    );
  }

  function saveRecent() {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recentIds)
    );
  }

  function isOwner(game) {
    return Boolean(
      currentUser &&
      game &&
      String(game.projectOwner).toLowerCase() ===
      String(currentUser).toLowerCase()
    );
  }

  function isFavorite(game) {
    return favorites.includes(String(game.id));
  }

  function getThumbnail(game, className) {
    const wrapper = document.createElement("div");
    wrapper.className = className || "game-thumbnail";

    if (game.thumbnail) {
      const image = document.createElement("img");

      image.src = game.thumbnail;
      image.alt = game.name;
      image.loading = "lazy";

      image.onerror = function () {
        wrapper.innerHTML = "";
        wrapper.classList.add("thumbnail-empty");

        const text = document.createElement("span");
        text.textContent = "No thumbnail";
        wrapper.appendChild(text);
      };

      wrapper.appendChild(image);
    } else {
      wrapper.classList.add("thumbnail-empty");

      const text = document.createElement("span");
      text.textContent = "No thumbnail";

      wrapper.appendChild(text);
    }

    return wrapper;
  }

  function formatDate(date) {
    if (!date) {
      return "";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function createGameCard(game) {
    const card = document.createElement("article");
    card.className = "game-card";
    card.dataset.gameId = game.id;

    const thumbnail = getThumbnail(game, "game-thumbnail");

    const info = document.createElement("div");
    info.className = "game-info";

    const title = document.createElement("h3");
    title.className = "game-title";
    title.textContent = game.name;

    const creator = document.createElement("p");
    creator.className = "game-creator";
    creator.textContent = "by " + game.creator;

    info.appendChild(title);
    info.appendChild(creator);

    if (game.publishedAt) {
      const date = document.createElement("span");
      date.className = "game-date";
      date.textContent = formatDate(game.publishedAt);
      info.appendChild(date);
    }

    card.appendChild(thumbnail);
    card.appendChild(info);

    card.addEventListener("click", function (event) {
      if (event.target.closest(".delete-game")) {
        return;
      }

      openGame(game);
    });

    if (isOwner(game)) {
      const deleteButton = document.createElement("button");

      deleteButton.type = "button";
      deleteButton.className = "delete-game";
      deleteButton.textContent = "Delete";
      deleteButton.title = "Delete this game";

      deleteButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        deleteGame(game);
      });

      card.appendChild(deleteButton);
    }

    return card;
  }

  function renderGrid(element, list) {
    if (!element) {
      return;
    }

    element.innerHTML = "";

    list.forEach(function (game) {
      element.appendChild(createGameCard(game));
    });
  }

  function getRecentGames() {
    const result = [];

    recentIds.forEach(function (id) {
      const game = games.find(
        item => String(item.id) === String(id)
      );

      if (game && !result.some(item => item.id === game.id)) {
        result.push(game);
      }
    });

    return result;
  }

  function getDiscoverGames() {
    return [...games].sort(function (a, b) {
      const aDate = a.publishedAt
        ? new Date(a.publishedAt).getTime()
        : 0;

      const bDate = b.publishedAt
        ? new Date(b.publishedAt).getTime()
        : 0;

      return bDate - aDate;
    });
  }

  function getFavoriteGames() {
    return favorites
      .map(function (id) {
        return games.find(
          game => String(game.id) === String(id)
        );
      })
      .filter(Boolean);
  }

  function renderFeatured() {
    const featured = $("featured");

    if (!featured) {
      return;
    }

    featured.innerHTML = "";

    const game = getDiscoverGames()[0];

    if (!game) {
      featured.classList.add("hidden");
      return;
    }

    featured.classList.remove("hidden");

    const box = document.createElement("div");
    box.className = "featured-game";

    const image = getThumbnail(game, "featured-image");

    const content = document.createElement("div");
    content.className = "featured-content";

    const title = document.createElement("h2");
    title.textContent = game.name;

    const creator = document.createElement("p");
    creator.textContent = "by " + game.creator;

    const play = document.createElement("button");
    play.type = "button";
    play.className = "featured-play";
    play.textContent = "Play";

    play.addEventListener("click", function () {
      openGame(game);
    });

    content.appendChild(title);
    content.appendChild(creator);

    if (game.description) {
      const description = document.createElement("p");
      description.className = "featured-description";
      description.textContent = game.description;
      content.appendChild(description);
    }

    content.appendChild(play);

    box.appendChild(image);
    box.appendChild(content);

    featured.appendChild(box);
  }

  function renderHome() {
    loadGames();
    loadFavorites();
    loadRecent();

    const recent = getRecentGames();
    const discover = getDiscoverGames();
    const favoriteGames = getFavoriteGames();

    renderFeatured();

    renderGrid(
      $("continueGrid"),
      recent
    );

    renderGrid(
      $("discoverGrid"),
      discover
    );

    renderGrid(
      $("favoritesGrid"),
      favoriteGames
    );

    updateSection(
      "continue",
      recent.length > 0
    );

    updateSection(
      "discover",
      discover.length > 0
    );

    updateSection(
      "favorites",
      favoriteGames.length > 0
    );

    const noGames = $("noGames");

    if (noGames) {
      noGames.classList.toggle(
        "hidden",
        games.length !== 0
      );
    }

    updateUserUI();
    updateRux();
  }

  function updateSection(id, visible) {
    const section = $(id);

    if (!section) {
      return;
    }

    section.classList.toggle(
      "hidden",
      !visible
    );
  }

  function openGame(game) {
    if (!game) {
      return;
    }

    selectedGame = game;

    addRecentGame(game);

    const modal = $("gameModal");

    if (!modal) {
      return;
    }

    const title = $("modalTitle");
    const creator = $("modalCreator");
    const description = $("modalDescription");
    const modalImage = $("modalImage");
    const favoriteButton = $("favoriteGame");

    if (title) {
      title.textContent = game.name;
    }

    if (creator) {
      creator.textContent = "by " + game.creator;
    }

    if (description) {
      description.textContent =
        game.description || "";
    }

    if (modalImage) {
      modalImage.innerHTML = "";

      const image = getThumbnail(
        game,
        "modal-game-image"
      );

      modalImage.appendChild(image);
    }

    if (favoriteButton) {
      favoriteButton.textContent =
        isFavorite(game)
          ? "♥"
          : "♡";

      favoriteButton.classList.toggle(
        "active",
        isFavorite(game)
      );
    }

    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = $("gameModal");

    if (modal) {
      modal.classList.add("hidden");
    }

    selectedGame = null;
  }

  function addRecentGame(game) {
    if (!game) {
      return;
    }

    const id = String(game.id);

    recentIds = recentIds.filter(
      recentId => String(recentId) !== id
    );

    recentIds.unshift(id);

    recentIds = recentIds.slice(0, 20);

    saveRecent();
  }

  function toggleFavorite() {
    if (!selectedGame) {
      return;
    }

    const id = String(selectedGame.id);

    if (favorites.includes(id)) {
      favorites = favorites.filter(
        favoriteId => String(favoriteId) !== id
      );

      showToast("Removed from favorites");
    } else {
      favorites.push(id);

      showToast("Added to favorites");
    }

    saveFavorites();

    const button = $("favoriteGame");

    if (button) {
      button.textContent =
        isFavorite(selectedGame)
          ? "♥"
          : "♡";

      button.classList.toggle(
        "active",
        isFavorite(selectedGame)
      );
    }

    renderHome();
  }

  function deleteGame(game) {
    if (!game || !isOwner(game)) {
      return;
    }

    const confirmed = window.confirm(
      'Delete "' + game.name + '"? This cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    const gameId = String(game.id);

    const storedGames = readJSON(
      GAMES_KEY,
      []
    );

    if (!Array.isArray(storedGames)) {
      return;
    }

    const filteredGames = storedGames.filter(
      function (storedGame) {
        if (!storedGame || typeof storedGame !== "object") {
          return true;
        }

        const storedId = String(
          storedGame.id ||
          storedGame.projectId ||
          storedGame.gameId ||
          ""
        );

        const storedOwner = String(
          storedGame.projectOwner ||
          storedGame.owner ||
          storedGame.creator ||
          ""
        );

        const sameGame =
          storedId === gameId;

        const sameOwner =
          storedOwner.toLowerCase() ===
          currentUser.toLowerCase();

        return !(sameGame && sameOwner);
      }
    );

    localStorage.setItem(
      GAMES_KEY,
      JSON.stringify(filteredGames)
    );

    recentIds = recentIds.filter(
      id => String(id) !== gameId
    );

    favorites = favorites.filter(
      id => String(id) !== gameId
    );

    saveRecent();
    saveFavorites();

    if (
      selectedGame &&
      String(selectedGame.id) === gameId
    ) {
      closeModal();
    }

    showToast("Game deleted");

    renderHome();
  }

  function searchGames(query) {
    const value = query.trim().toLowerCase();

    const featured = $("featured");
    const continueSection = $("continue");
    const favoritesSection = $("favorites");
    const discoverGrid = $("discoverGrid");
    const discoverTitle = document.querySelector(
      "#discover .section-title h2"
    );

    if (!value) {
      if (featured) {
        featured.classList.remove("hidden");
      }

      renderHome();
      return;
    }

    if (featured) {
      featured.classList.add("hidden");
    }

    if (continueSection) {
      continueSection.classList.add("hidden");
    }

    if (favoritesSection) {
      favoritesSection.classList.add("hidden");
    }

    const results = games.filter(function (game) {
      return (
        game.name.toLowerCase().includes(value) ||
        game.creator.toLowerCase().includes(value) ||
        game.description.toLowerCase().includes(value)
      );
    });

    if (discoverTitle) {
      discoverTitle.textContent =
        results.length +
        (results.length === 1
          ? " Result"
          : " Results");
    }

    renderGrid(
      discoverGrid,
      results
    );

    const noGames = $("noGames");

    if (noGames) {
      noGames.classList.toggle(
        "hidden",
        results.length !== 0
      );

      const strong = noGames.querySelector("strong");
      const span = noGames.querySelector("span");

      if (results.length === 0) {
        if (strong) {
          strong.textContent = "No results";
        }

        if (span) {
          span.textContent =
            "No published games matched your search.";
        }
      }
    }
  }

  function updateUserUI() {
    const firstLetter =
      currentUser
        ? currentUser.charAt(0).toUpperCase()
        : "R";

    const avatarLetter = $("avatarLetter");
    const menuAvatar = $("menuAvatar");
    const menuUsername = $("menuUsername");

    if (avatarLetter) {
      avatarLetter.textContent = firstLetter;
    }

    if (menuAvatar) {
      menuAvatar.textContent = firstLetter;
    }

    if (menuUsername) {
      menuUsername.textContent =
        currentUser || "Player";
    }
  }

  function updateRux() {
    const possibleKeys = [
      "riseup_rux_" + currentUser,
      "riseup_rux",
      "rux_" + currentUser
    ];

    let balance = 0;

    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);

      if (value !== null) {
        const number = Number(value);

        if (Number.isFinite(number)) {
          balance = number;
          break;
        }

        const parsed = readJSON(key, null);

        if (
          parsed &&
          typeof parsed === "object" &&
          Number.isFinite(Number(parsed.balance))
        ) {
          balance = Number(parsed.balance);
          break;
        }
      }
    }

    const element = $("ruxBalance");

    if (element) {
      element.textContent =
        Math.max(0, balance).toLocaleString();
    }
  }

  function showToast(message) {
    const toast = $("toast");

    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(
      showToast.timeout
    );

    showToast.timeout = setTimeout(
      function () {
        toast.classList.add("hidden");
      },
      2200
    );
  }

  function toggleUserMenu() {
    const menu = $("userMenu");

    if (!menu) {
      return;
    }

    menu.classList.toggle("hidden");
  }

  function closeUserMenu() {
    const menu = $("userMenu");

    if (menu) {
      menu.classList.add("hidden");
    }
  }

  function goToStudio() {
    window.location.href = "studio.html";
  }

  function goToCode() {
    window.location.href = "code.html";
  }

  function logout() {
    localStorage.removeItem(
      CURRENT_USER_KEY
    );

    window.location.href = "index.html";
  }

  function setupEvents() {
    const searchInput = $("searchInput");

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        function () {
          searchGames(
            searchInput.value
          );
        }
      );
    }

    const studioButton = $("studioButton");

    if (studioButton) {
      studioButton.addEventListener(
        "click",
        goToStudio
      );
    }

    const emptyStudio = $("emptyStudio");

    if (emptyStudio) {
      emptyStudio.addEventListener(
        "click",
        goToStudio
      );
    }

    const menuStudio = $("menuStudio");

    if (menuStudio) {
      menuStudio.addEventListener(
        "click",
        function () {
          closeUserMenu();
          goToStudio();
        }
      );
    }

    const menuCode = $("menuCode");

    if (menuCode) {
      menuCode.addEventListener(
        "click",
        function () {
          closeUserMenu();
          goToCode();
        }
      );
    }

    const menuLogout = $("menuLogout");

    if (menuLogout) {
      menuLogout.addEventListener(
        "click",
        logout
      );
    }

    const avatarButton = $("avatarButton");

    if (avatarButton) {
      avatarButton.addEventListener(
        "click",
        function (event) {
          event.stopPropagation();
          toggleUserMenu();
        }
      );
    }

    const closeModalButton =
      $("closeModal");

    if (closeModalButton) {
      closeModalButton.addEventListener(
        "click",
        closeModal
      );
    }

    const favoriteButton =
      $("favoriteGame");

    if (favoriteButton) {
      favoriteButton.addEventListener(
        "click",
        toggleFavorite
      );
    }

    const playButton =
      $("playGame");

    if (playButton) {
      playButton.addEventListener(
        "click",
        function () {
          if (!selectedGame) {
            return;
          }

          /*
           * Keep the selected game available for
           * whatever player/preview page you use.
           *
           * The homepage does NOT pretend that
           * studio.html is a game player.
           */
          addRecentGame(selectedGame);

          localStorage.setItem(
            "riseup_play_game_id",
            String(selectedGame.id)
          );

          /*
           * Your actual player page should handle
           * this ID. If you already have one,
           * replace player.html with its filename.
           */
          window.location.href =
            "player.html";
        }
      );
    }

    const modal = $("gameModal");

    if (modal) {
      modal.addEventListener(
        "click",
        function (event) {
          if (event.target === modal) {
            closeModal();
          }
        }
      );
    }

    document.addEventListener(
      "click",
      function (event) {
        const menu = $("userMenu");
        const avatar = $("avatarButton");

        if (
          menu &&
          !menu.classList.contains("hidden") &&
          !menu.contains(event.target) &&
          !avatar?.contains(event.target)
        ) {
          closeUserMenu();
        }
      }
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Escape") {
          closeModal();
          closeUserMenu();
        }
      }
    );

    window.addEventListener(
      "storage",
      function (event) {
        if (
          event.key === GAMES_KEY ||
          event.key === CURRENT_USER_KEY
        ) {
          currentUser = getCurrentUser();
          renderHome();
        }
      }
    );
  }

  currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  setupEvents();
  renderHome();

})();