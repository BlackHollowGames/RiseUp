(() => {
  "use strict";

  const params =
    new URLSearchParams(window.location.search);

  const gameId = params.get("game");

  const world = document.getElementById("gameWorld");
  const loading = document.getElementById("loading");

  let game = null;

  let player = {
    x: 10,
    y: 70,
    speed: 0.6,
    rux: Number(
      localStorage.getItem("riseup_rux") || 0
    )
  };

  const keys = {};

  function getGames() {
    try {
      return JSON.parse(
        localStorage.getItem("riseup_games") || "[]"
      );
    } catch {
      return [];
    }
  }

  function loadGame() {
    game =
      getGames().find(
        item => item.id === gameId
      );

    if (!game) {
      loading.textContent =
        "Game could not be found.";
      return;
    }

    document.getElementById("gameTitle")
      .textContent = game.name;

    document.getElementById("gameCreator")
      .textContent = ` · By ${game.creator}`;

    renderObjects();

    loading.classList.add("hidden");

    if (window.RiseCodeRuntime) {
      window.RiseCodeRuntime.run(
        game.codeFiles || [],
        {
          player,
          objects: game.objects || []
        }
      );
    }
  }

  function renderObjects() {
    world.innerHTML = "";

    (game.objects || []).forEach(object => {
      const el = document.createElement("div");

      el.className =
        "game-object " +
        object.type.toLowerCase();

      el.textContent = object.name;

      el.style.left = object.x + "%";
      el.style.top = object.y + "%";
      el.style.width = object.width + "px";
      el.style.height = object.height + "px";

      el.dataset.objectId = object.id;

      world.appendChild(el);
    });

    createPlayer();
  }

  function createPlayer() {
    let el = document.getElementById("runtimePlayer");

    if (!el) {
      el = document.createElement("div");
      el.id = "runtimePlayer";
      el.className = "game-object";
      el.textContent = "Player";

      el.style.width = "45px";
      el.style.height = "55px";

      world.appendChild(el);
    }

    el.style.left = player.x + "%";
    el.style.top = player.y + "%";
  }

  function update() {
    if (keys.ArrowLeft || keys.a) {
      player.x -= player.speed;
    }

    if (keys.ArrowRight || keys.d) {
      player.x += player.speed;
    }

    if (keys.ArrowUp || keys.w) {
      player.y -= player.speed;
    }

    if (keys.ArrowDown || keys.s) {
      player.y += player.speed;
    }

    player.x = Math.max(0, Math.min(96, player.x));
    player.y = Math.max(0, Math.min(90, player.y));

    createPlayer();

    requestAnimationFrame(update);
  }

  window.addEventListener("keydown", event => {
    keys[event.key] = true;
  });

  window.addEventListener("keyup", event => {
    keys[event.key] = false;
  });

  document.getElementById("backButton")
    .addEventListener("click", () => {
      window.location.href = "home.html";
    });

  document.getElementById("restartButton")
    .addEventListener("click", () => {
      player.x = 10;
      player.y = 70;
    });

  loadGame();
  update();
})();