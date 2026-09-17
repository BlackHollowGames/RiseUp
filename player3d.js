(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");

  // DOM
  const viewport = document.getElementById("viewport");
  const loading = document.getElementById("loading");
  const fpsCounter = document.getElementById("fpsCounter");
  const stateCounter = document.getElementById("stateCounter");
  const gameTitle = document.getElementById("gameTitle");
  const gameCreator = document.getElementById("gameCreator");
  const toknAmount = document.getElementById("toknAmount");

  // Three.js
  let scene, camera, renderer, clock;
  let player, velocity, direction;
  let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
  let canJump = false;
  let isLocked = false;

  const objects = [];
  let prevTime = performance.now();
  let frames = 0;
  let lastFpsUpdate = 0;

  // Player settings
  const PLAYER_HEIGHT = 1.7;
  const PLAYER_SPEED = 8;
  const PLAYER_RUN_MULTIPLIER = 1.7;
  const JUMP_VELOCITY = 8;
  const GRAVITY = 20;

  function getGames() {
    try {
      return JSON.parse(localStorage.getItem("riseup_games") || "[]");
    } catch {
      return [];
    }
  }

  function init() {
    // Load game info
    const games = getGames();
    const game = games.find(g => String(g.id) === String(gameId));

    if (game) {
      if (gameTitle) gameTitle.textContent = game.name || "RiseUp 3D";
      if (gameCreator) gameCreator.textContent = game.creator ? `By ${game.creator}` : "";
    } else {
      if (gameTitle) gameTitle.textContent = "Demo World";
    }

    // Tokn
    if (toknAmount) {
      const amount = Number(localStorage.getItem("riseup_tokn_Creator") || 0);
      toknAmount.textContent = amount.toLocaleString();
    }

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, PLAYER_HEIGHT, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    viewport.appendChild(renderer.domElement);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(30, 40, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 120;
    dir.shadow.camera.left = -40;
    dir.shadow.camera.right = 40;
    dir.shadow.camera.top = 40;
    dir.shadow.camera.bottom = -40;
    scene.add(dir);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    objects.push(ground);

    // Simple platforms / obstacles
    createBox(0, 0.5, -8, 4, 1, 4, 0x8b5a2b);
    createBox(-6, 1, -12, 3, 2, 3, 0x6b4423);
    createBox(6, 1.5, -15, 5, 3, 2, 0x5c4033);
    createBox(0, 2, -22, 8, 1, 3, 0x4a3728);
    createBox(-10, 0.5, -5, 2, 1, 2, 0x228b22);
    createBox(10, 0.5, -5, 2, 1, 2, 0x228b22);

    // Player collision body (invisible)
    const playerGeo = new THREE.BoxGeometry(0.6, PLAYER_HEIGHT, 0.6);
    const playerMat = new THREE.MeshBasicMaterial({ visible: false });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, PLAYER_HEIGHT / 2, 5);
    scene.add(player);

    velocity = new THREE.Vector3();
    direction = new THREE.Vector3();
    clock = new THREE.Clock();

    // Pointer lock
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

    // Hide loading
    setTimeout(() => {
      if (loading) loading.classList.add("hidden");
    }, 600);

    animate();
  }

  function createBox(x, y, z, w, h, d, color) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function onMouseMove(event) {
    if (!isLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    // Rotate camera (yaw + pitch)
    camera.rotation.order = "YXZ";
    camera.rotation.y -= movementX * 0.002;
    camera.rotation.x -= movementY * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, camera.rotation.x));
  }

  function onKeyDown(event) {
    switch (event.code) {
      case "KeyW": case "ArrowUp": moveForward = true; break;
      case "KeyS": case "ArrowDown": moveBackward = true; break;
      case "KeyA": case "ArrowLeft": moveLeft = true; break;
      case "KeyD": case "ArrowRight": moveRight = true; break;
      case "Space":
        if (canJump) {
          velocity.y = JUMP_VELOCITY;
          canJump = false;
        }
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case "KeyW": case "ArrowUp": moveForward = false; break;
      case "KeyS": case "ArrowDown": moveBackward = false; break;
      case "KeyA": case "ArrowLeft": moveLeft = false; break;
      case "KeyD": case "ArrowRight": moveRight = false; break;
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
    const delta = Math.min((time - prevTime) / 1000, 0.1);
    prevTime = time;

    // FPS counter
    frames++;
    if (time - lastFpsUpdate > 500) {
      if (fpsCounter) fpsCounter.textContent = Math.round(frames * 1000 / (time - lastFpsUpdate)) + " FPS";
      frames = 0;
      lastFpsUpdate = time;
    }

    if (isLocked) {
      // Gravity
      velocity.y -= GRAVITY * delta;

      // Movement direction relative to camera
      direction.z = Number(moveForward) - Number(moveBackward);
      direction.x = Number(moveRight) - Number(moveLeft);
      direction.normalize();

      const speed = (event => {
        // Check shift for run – we need a simple flag
        return PLAYER_SPEED;
      })() * (document.body.dataset.running === "1" ? PLAYER_RUN_MULTIPLIER : 1);

      // Simple shift run detection via key state
      const running = keys["ShiftLeft"] || keys["ShiftRight"];
      const finalSpeed = running ? PLAYER_SPEED * PLAYER_RUN_MULTIPLIER : PLAYER_SPEED;

      if (moveForward || moveBackward) {
        velocity.z = -direction.z * finalSpeed;
      } else {
        velocity.z = 0;
      }

      if (moveLeft || moveRight) {
        velocity.x = -direction.x * finalSpeed;
      } else {
        velocity.x = 0;
      }

      // Apply rotation to movement
      const angle = camera.rotation.y;
      const vx = velocity.x * Math.cos(angle) - velocity.z * Math.sin(angle);
      const vz = velocity.x * Math.sin(angle) + velocity.z * Math.cos(angle);

      player.position.x += vx * delta;
      player.position.z += vz * delta;
      player.position.y += velocity.y * delta;

      // Ground collision
      if (player.position.y < PLAYER_HEIGHT / 2) {
        velocity.y = 0;
        player.position.y = PLAYER_HEIGHT / 2;
        canJump = true;
      }

      // Sync camera to player
      camera.position.x = player.position.x;
      camera.position.y = player.position.y + PLAYER_HEIGHT / 2 - 0.2;
      camera.position.z = player.position.z;
    }

    renderer.render(scene, camera);
  }

  // Track shift keys
  const keys = {};
  window.addEventListener("keydown", e => { keys[e.code] = true; });
  window.addEventListener("keyup", e => { keys[e.code] = false; });

  // Start
  init();
})();
