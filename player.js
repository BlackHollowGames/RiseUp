(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");

  const world = document.getElementById("gameWorld");
  const loading = document.getElementById("loading");

  let game = null;

  let player = {
    x: 10,
    y: 70,
    speed: 0.55
  };

  const keys = {};

  function getGames() {
    try {
      return JSON.parse(localStorage.getItem("riseup_games") || "[]");
    } catch {
      return [];
    }
  }

  function loadGame() {
    if (!gameId) {
      if (loading) loading.textContent = "No game selected.";
      return;
    }

    game = getGames().find(item => String(item.id) === String(gameId));

    if (!game) {
      if (loading) loading.textContent = "Game could not be found.";
      return;
    }

    const titleEl = document.getElementById("gameTitle");
    const creatorEl = document.getElementById("gameCreator");
    if (titleEl) titleEl.textContent = game.name || "Untitled";
    if (creatorEl) creatorEl.textContent = game.creator ? ` · By ${game.creator}` : "";

    // Tokn display
    const toknEl = document.getElementById("rux") || document.getElementById("tokn");
    if (toknEl) {
      const amount = Number(localStorage.getItem("riseup_tokn_Creator") || 0);
      toknEl.textContent = amount.toLocaleString();
    }

    renderObjects();
    if (loading) loading.classList.add("hidden");

    if (window.RiseCodeRuntime && Array.isArray(game.codeFiles)) {
      try {
        window.RiseCodeRuntime.run(game.codeFiles, {
          player,
          objects: game.objects || []
        });
      } catch (err) {
        console.warn("RiseCode error:", err);
      }
    }
  }

  function renderObjects() {
    if (!world) return;
    world.innerHTML = "";

    (game.objects || []).forEach(object => {
      const el = document.createElement("div");
      el.className = "game-object " + (object.type || "block").toLowerCase();
      el.textContent = object.name || "";
      el.style.left = (object.x || 0) + "%";
      el.style.top = (object.y || 0) + "%";
      el.style.width = (object.width || 40) + "px";
      el.style.height = (object.height || 40) + "px";
      el.dataset.objectId = object.id || "";
      world.appendChild(el);
    });

    createPlayer();
  }

  function createPlayer() {
    let el = document.getElementById("runtimePlayer");

    if (!el) {
      el = document.createElement("div");
      el.id = "runtimePlayer";
      el.className = "game-object player";
      el.textContent = "You";
      el.style.width = "42px";
      el.style.height = "52px";
      if (world) world.appendChild(el);
    }

    el.style.left = player.x + "%";
    el.style.top = player.y + "%";
  }

  function update() {
    if (keys.ArrowLeft || keys.a || keys.A) player.x -= player.speed;
    if (keys.ArrowRight || keys.d || keys.D) player.x += player.speed;
    if (keys.ArrowUp || keys.w || keys.W) player.y -= player.speed;
    if (keys.ArrowDown || keys.s || keys.S) player.y += player.speed;

    player.x = Math.max(0, Math.min(95, player.x));
    player.y = Math.max(0, Math.min(90, player.y));

    createPlayer();
    requestAnimationFrame(update);
  }

  window.addEventListener("keydown", e => { keys[e.key] = true; });
  window.addEventListener("keyup", e => { keys[e.key] = false; });

  document.getElementById("backButton")?.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  document.getElementById("restartButton")?.addEventListener("click", () => {
    player.x = 10;
    player.y = 70;
  });

  loadGame();
  update();
})();
