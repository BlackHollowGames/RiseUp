(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");

  const viewport = document.getElementById("viewport");
  const loading = document.getElementById("loading");
  const fpsCounter = document.getElementById("fpsCounter");
  const stateCounter = document.getElementById("stateCounter");
  const gameTitle = document.getElementById("gameTitle");
  const gameCreator = document.getElementById("gameCreator");
  const toknAmount = document.getElementById("toknAmount");

  let scene, camera, renderer;
  let player;
  let velocity = new THREE.Vector3();
  let direction = new THREE.Vector3();

  let moveForward = false;
  let moveBackward = false;
  let moveLeft = false;
  let moveRight = false;
  let canJump = false;
  let isLocked = false;
  let isRunning = false;

  const keys = {};
  const PLAYER_HEIGHT = 1.7;
  const PLAYER_SPEED = 7;
  const JUMP_FORCE = 9;
  const GRAVITY = 22;

  let prevTime = performance.now();
  let frames = 0;
  let lastFps = 0;

  function hideLoading() {
    if (loading) loading.classList.add("hidden");
  }

  function getGames() {
    try {
      return JSON.parse(localStorage.getItem("riseup_games") || "[]");
    } catch {
      return [];
    }
  }

  function init() {
    // Game info
    const games = getGames();
    const game = games.find(g => String(g.id) === String(gameId));

    if (game) {
      if (gameTitle) gameTitle.textContent = game.name || "RiseUp 3D";
      if (gameCreator) gameCreator.textContent = game.creator ? "By " + game.creator : "";
    } else {
      if (gameTitle) gameTitle.textContent = "Demo World";
    }

    // Tokn
    if (toknAmount) {
      const amount = Number(localStorage.getItem("riseup_tokn_Creator") || 0);
      toknAmount.textContent = amount.toLocaleString();
    }

    // Check if Three.js loaded
    if (typeof THREE === "undefined") {
      if (loading) {
        loading.innerHTML = "<div class='loading-box'><strong>Error</strong><span>Three.js failed to load</span></div>";
      }
      return;
    }

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 25, 90);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, PLAYER_HEIGHT, 8);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    viewport.appendChild(renderer.domElement);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.75);
    hemi.position.set(0, 40, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(25, 35, 15);
    dir.castShadow = true;
    scene.add(dir);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x3a7d44 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Platforms
    createBox(0, 0.5, -10, 5, 1, 5, 0x8b5a2b);
    createBox(-7, 1.2, -16, 3, 2.4, 3, 0x6b4423);
    createBox(7, 1.8, -18, 4, 3.6, 2, 0x5c4033);
    createBox(0, 2.5, -26, 10, 1, 4, 0x4a3728);
    createBox(-12, 0.5, -6, 2.5, 1, 2.5, 0x228b22);
    createBox(12, 0.5, -6, 2.5, 1, 2.5, 0x228b22);

    // Invisible player body
    player = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, PLAYER_HEIGHT, 0.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    player.position.set(0, PLAYER_HEIGHT / 2, 8);
    scene.add(player);

    // Events
    renderer.domElement.addEventListener("click", () => {
      renderer.domElement.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", () => {
      isLocked = document.pointerLockElement === renderer.domElement;
      if (stateCounter) {
        stateCounter.textContent = isLocked ? "Playing" : "Click to play";
      }
    });

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);

    document.getElementById("backButton")?.addEventListener("click", () => {
      window.location.href = "home.html";
    });

    // Hide loading after short delay
    setTimeout(hideLoading, 500);

    // Start loop
    animate();
  }

  function createBox(x, y, z, w, h, d, color) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color })
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  function onMouseMove(e) {
    if (!isLocked) return;
    camera.rotation.order = "YXZ";
    camera.rotation.y -= e.movementX * 0.002;
    camera.rotation.x -= e.movementY * 0.002;
    camera.rotation.x = Math.max(-1.4, Math.min(1.4, camera.rotation.x));
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    switch (e.code) {
      case "KeyW": case "ArrowUp": moveForward = true; break;
      case "KeyS": case "ArrowDown": moveBackward = true; break;
      case "KeyA": case "ArrowLeft": moveLeft = true; break;
      case "KeyD": case "ArrowRight": moveRight = true; break;
      case "ShiftLeft": case "ShiftRight": isRunning = true; break;
      case "Space":
        if (canJump) {
          velocity.y = JUMP_FORCE;
          canJump = false;
        }
        break;
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
    switch (e.code) {
      case "KeyW": case "ArrowUp": moveForward = false; break;
      case "KeyS": case "ArrowDown": moveBackward = false; break;
      case "KeyA": case "ArrowLeft": moveLeft = false; break;
      case "KeyD": case "ArrowRight": moveRight = false; break;
      case "ShiftLeft": case "ShiftRight": isRunning = false; break;
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.05);
    prevTime = time;

    // FPS
    frames++;
    if (time - lastFps > 500) {
      if (fpsCounter) fpsCounter.textContent = Math.round((frames * 1000) / (time - lastFps)) + " FPS";
      frames = 0;
      lastFps = time;
    }

    if (isLocked) {
      // Gravity
      velocity.y -= GRAVITY * delta;

      // Direction
      direction.z = Number(moveForward) - Number(moveBackward);
      direction.x = Number(moveRight) - Number(moveLeft);
      direction.normalize();

      const speed = isRunning ? PLAYER_SPEED * 1.7 : PLAYER_SPEED;

      let moveX = 0;
      let moveZ = 0;

      if (moveForward || moveBackward) moveZ = -direction.z * speed;
      if (moveLeft || moveRight) moveX = -direction.x * speed;

      // Rotate movement by camera yaw
      const angle = camera.rotation.y;
      const vx = moveX * Math.cos(angle) - moveZ * Math.sin(angle);
      const vz = moveX * Math.sin(angle) + moveZ * Math.cos(angle);

      player.position.x += vx * delta;
      player.position.z += vz * delta;
      player.position.y += velocity.y * delta;

      // Ground
      if (player.position.y < PLAYER_HEIGHT / 2) {
        velocity.y = 0;
        player.position.y = PLAYER_HEIGHT / 2;
        canJump = true;
      }

      // Camera follows player
      camera.position.x = player.position.x;
      camera.position.y = player.position.y + 0.6;
      camera.position.z = player.position.z;
    }

    renderer.render(scene, camera);
  }

  // Start
  try {
    init();
  } catch (err) {
    console.error(err);
    if (loading) {
      loading.innerHTML = "<div class='loading-box'><strong>Error</strong><span>Could not start 3D world</span></div>";
    }
  }
})();
