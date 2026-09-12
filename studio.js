/* =========================================================
   RISEUP STUDIO
   studio.js
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEYS = {
    project: "riseup_studio_project",
    games: "riseup_games",
    currentUser: "riseup_currentUser",
    codeFilesPrefix: "riseup_code_files_"
  };

  const state = {
    project: {
      name: "Untitled Game",
      description: "",
      objects: [],
      settings: {
        gridSize: 10,
        snap: true,
        mode: "3d"
      }
    },

    selectedId: null,
    activeTool: "select",
    activeDock: "ai",

    running: false,
    codeOpen: false,

    timeline: {
      currentTime: 0,
      duration: 60,
      playing: false
    },

    player: {
      x: 0,
      y: 0,
      z: 0
    },

    history: [],
    historyIndex: -1,

    lastSaved: null
  };

  let renderer = null;
  let scene = null;
  let camera = null;
  let controls = null;

  let raycaster = null;
  let mouse = null;

  let animationFrame = null;
  let timelineAnimation = null;

  let THREE_REF = null;

  const els = {};

  /* =======================================================
     INIT
     ======================================================= */

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheElements();

    loadProject();

    setupUI();
    setupKeyboard();
    setupViewport();

    await loadThree();

    if (THREE_REF) {
      setupThreeScene();
      rebuildScene();
    }

    refreshAll();

    pushHistory();
    saveProject(false);
  }

  function cacheElements() {
    els.viewport = document.getElementById("viewport");

    els.projectName = document.querySelector(".project-name");

    els.toolButtons = document.querySelectorAll("[data-tool]");
    els.dockTabs = document.querySelectorAll("[data-dock]");
    els.dockPanels = document.querySelectorAll(".dock-panel");

    els.explorer = document.querySelector(".explorer");
    els.inspector = document.querySelector(".inspector");

    els.aiMessages = document.querySelector(".ai-messages");
    els.aiInput = document.querySelector(".ai-input");
    els.aiSend = document.querySelector(".ai-send");

    els.timeline = document.querySelector(".timeline");
    els.timelineTime = document.querySelector(".timeline-time");
    els.timelinePlayhead = document.querySelector(".timeline-playhead");

    els.codeEditor =
      document.querySelector(".code-editor") ||
      document.querySelector("#codeEditor");

    els.consoleOutput = document.querySelector(".console-output");
    els.consoleInput = document.querySelector(".console-input");

    els.modalBackdrop = document.querySelector(".modal-backdrop");
    els.toastContainer = document.querySelector(".toast-container");

    els.playButton =
      document.querySelector("#playButton") ||
      document.querySelector('[data-action="play"]');

    els.stopButton =
      document.querySelector("#stopButton") ||
      document.querySelector('[data-action="stop"]');

    els.saveButton =
      document.querySelector("#saveButton") ||
      document.querySelector('[data-action="save"]');

    els.publishButton =
      document.querySelector("#publishButton") ||
      document.querySelector('[data-action="publish"]');

    els.deleteButton =
      document.querySelector("#deleteProject") ||
      document.querySelector('[data-action="delete-project"]');

    els.newButton =
      document.querySelector("#newProject") ||
      document.querySelector('[data-action="new-project"]');

    els.undoButton =
      document.querySelector("#undoButton") ||
      document.querySelector('[data-action="undo"]');

    els.redoButton =
      document.querySelector("#redoButton") ||
      document.querySelector('[data-action="redo"]');

    els.resetViewButton =
      document.querySelector("#resetView") ||
      document.querySelector('[data-action="reset-view"]');

    els.gridButton =
      document.querySelector("#gridToggle") ||
      document.querySelector('[data-action="grid"]');

    els.modeButton =
      document.querySelector("#modeButton") ||
      document.querySelector('[data-action="mode"]');

    els.addButtons = document.querySelectorAll("[data-create]");
  }

  /* =======================================================
     THREE.JS LOADER
     ======================================================= */

  function loadThree() {
    return new Promise((resolve) => {
      if (window.THREE) {
        THREE_REF = window.THREE;
        resolve();
        return;
      }

      const existing = document.querySelector(
        'script[src*="three.min.js"]'
      );

      if (existing) {
        existing.addEventListener("load", () => {
          THREE_REF = window.THREE || null;
          resolve();
        });

        existing.addEventListener("error", () => {
          resolve();
        });

        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.min.js";

      script.onload = () => {
        THREE_REF = window.THREE || null;
        resolve();
      };

      script.onerror = () => {
        console.warn("RiseUp Studio could not load Three.js.");
        resolve();
      };

      document.head.appendChild(script);
    });
  }

  /* =======================================================
     PROJECT STORAGE
     ======================================================= */

  function getCurrentUser() {
    return localStorage.getItem(STORAGE_KEYS.currentUser) || "local";
  }

  function getProjectStorageKey() {
    return `${STORAGE_KEYS.project}_${getCurrentUser()}`;
  }

  function loadProject() {
    let raw = null;

    try {
      raw = localStorage.getItem(getProjectStorageKey());

      if (!raw) {
        raw = localStorage.getItem(STORAGE_KEYS.project);
      }
    } catch {
      raw = null;
    }

    if (!raw) {
      state.project = createDefaultProject();
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      state.project = {
        ...createDefaultProject(),
        ...parsed,
        settings: {
          ...createDefaultProject().settings,
          ...(parsed.settings || {})
        },
        objects: Array.isArray(parsed.objects)
          ? parsed.objects
          : []
      };

      state.project.objects = state.project.objects.map(normalizeObject);
    } catch {
      state.project = createDefaultProject();
    }
  }

  function createDefaultProject() {
    return {
      name: "Untitled Game",
      description: "",
      objects: [
        {
          id: createId("spawn"),
          type: "Spawn",
          name: "Spawn",
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: "#4da3ff",
          visible: true,
          createdAt: 0,
          hiddenAt: null
        }
      ],
      settings: {
        gridSize: 10,
        snap: true,
        mode: "3d"
      }
    };
  }

  function normalizeObject(object) {
    return {
      id: object.id || createId("object"),
      type: object.type || "Part",
      name: object.name || object.type || "Object",

      position: normalizeVector(object.position, 0),
      rotation: normalizeVector(object.rotation, 0),
      scale: normalizeVector(object.scale, 1),

      color: object.color || "#4da3ff",

      visible:
        typeof object.visible === "boolean"
          ? object.visible
          : true,

      createdAt:
        Number.isFinite(Number(object.createdAt))
          ? Number(object.createdAt)
          : 0,

      hiddenAt:
        object.hiddenAt === null ||
        object.hiddenAt === undefined ||
        object.hiddenAt === ""
          ? null
          : Number(object.hiddenAt),

      material: object.material || "standard"
    };
  }

  function normalizeVector(value, fallback) {
    return {
      x:
        value && Number.isFinite(Number(value.x))
          ? Number(value.x)
          : fallback,

      y:
        value && Number.isFinite(Number(value.y))
          ? Number(value.y)
          : fallback,

      z:
        value && Number.isFinite(Number(value.z))
          ? Number(value.z)
          : fallback
    };
  }

  function saveProject(showToast = true) {
    const snapshot = JSON.stringify(state.project);

    try {
      localStorage.setItem(getProjectStorageKey(), snapshot);
      localStorage.setItem(STORAGE_KEYS.project, snapshot);

      state.lastSaved = Date.now();

      if (showToast) {
        toast("Project saved.", "success");
      }

      consoleMessage("Project saved.");
    } catch (error) {
      console.error(error);
      toast("Could not save the project.", "error");
    }
  }

  /* =======================================================
     HISTORY
     ======================================================= */

  function pushHistory() {
    const snapshot = JSON.stringify(state.project);

    if (
      state.history[state.historyIndex] === snapshot
    ) {
      return;
    }

    state.history = state.history.slice(
      0,
      state.historyIndex + 1
    );

    state.history.push(snapshot);

    if (state.history.length > 80) {
      state.history.shift();
    }

    state.historyIndex = state.history.length - 1;

    refreshUndoRedo();
  }

  function undo() {
    if (state.historyIndex <= 0) {
      return;
    }

    state.historyIndex--;

    restoreHistorySnapshot(
      state.history[state.historyIndex]
    );

    toast("Undo", "success");
  }

  function redo() {
    if (
      state.historyIndex >=
      state.history.length - 1
    ) {
      return;
    }

    state.historyIndex++;

    restoreHistorySnapshot(
      state.history[state.historyIndex]
    );

    toast("Redo", "success");
  }

  function restoreHistorySnapshot(snapshot) {
    try {
      state.project = JSON.parse(snapshot);
    } catch {
      return;
    }

    state.project.objects =
      state.project.objects.map(normalizeObject);

    state.selectedId = null;

    rebuildScene();
    refreshAll();
    saveProject(false);
  }

  function refreshUndoRedo() {
    if (els.undoButton) {
      els.undoButton.disabled =
        state.historyIndex <= 0;
    }

    if (els.redoButton) {
      els.redoButton.disabled =
        state.historyIndex >=
        state.history.length - 1;
    }
  }

  /* =======================================================
     UI
     ======================================================= */

  function setupUI() {
    els.toolButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tool = button.dataset.tool;

        if (!tool) {
          return;
        }

        setTool(tool);
      });
    });

    els.dockTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const dock = tab.dataset.dock;

        if (!dock) {
          return;
        }

        setDock(dock);
      });
    });

    els.addButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const type =
          button.dataset.create || "Part";

        createObject(type);
      });
    });

    if (els.aiSend) {
      els.aiSend.addEventListener("click", submitAI);
    }

    if (els.aiInput) {
      els.aiInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitAI();
        }
      });
    }

    if (els.saveButton) {
      els.saveButton.addEventListener("click", () => {
        saveProject(true);
      });
    }

    if (els.playButton) {
      els.playButton.addEventListener("click", startGame);
    }

    if (els.stopButton) {
      els.stopButton.addEventListener("click", stopGame);
    }

    if (els.publishButton) {
      els.publishButton.addEventListener(
        "click",
        publishProject
      );
    }

    if (els.deleteButton) {
      els.deleteButton.addEventListener(
        "click",
        deleteProject
      );
    }

    if (els.newButton) {
      els.newButton.addEventListener(
        "click",
        newProject
      );
    }

    if (els.undoButton) {
      els.undoButton.addEventListener(
        "click",
        undo
      );
    }

    if (els.redoButton) {
      els.redoButton.addEventListener(
        "click",
        redo
      );
    }

    if (els.resetViewButton) {
      els.resetViewButton.addEventListener(
        "click",
        resetCamera
      );
    }

    if (els.gridButton) {
      els.gridButton.addEventListener(
        "click",
        toggleGrid
      );
    }

    if (els.modeButton) {
      els.modeButton.addEventListener(
        "click",
        toggleMode
      );
    }

    document.addEventListener(
      "click",
      handleDocumentClick
    );
  }

  function setupKeyboard() {
    document.addEventListener(
      "keydown",
      (event) => {
        const key = event.key.toLowerCase();

        if (
          event.ctrlKey &&
          event.shiftKey &&
          key === "z"
        ) {
          event.preventDefault();
          redo();
          return;
        }

        if (
          event.ctrlKey &&
          !event.shiftKey &&
          key === "z"
        ) {
          event.preventDefault();
          undo();
          return;
        }

        if (
          (event.ctrlKey || event.metaKey) &&
          key === "s"
        ) {
          event.preventDefault();
          saveProject(true);
          return;
        }

        if (key === "f5") {
          event.preventDefault();
          setDock("code");
          return;
        }

        if (key === "f4") {
          event.preventDefault();

          if (state.running) {
            stopGame();
          } else {
            startGame();
          }

          return;
        }

        if (event.key === "Delete") {
          if (isTypingContext()) {
            return;
          }

          deleteSelected();
          return;
        }

        if (key === "w") {
          setTool("move");
          return;
        }

        if (key === "e") {
          setTool("rotate");
          return;
        }

        if (key === "r") {
          setTool("scale");
          return;
        }

        if (key === "q") {
          setTool("select");
          return;
        }

        if (
          event.key === "Escape" &&
          state.running
        ) {
          stopGame();
        }
      },
      true
    );
  }

  function handleDocumentClick(event) {
    const deleteElement =
      event.target.closest?.(
        '[data-action="delete-selected"]'
      );

    if (deleteElement) {
      deleteSelected();
    }
  }

  function isTypingContext() {
    const active = document.activeElement;

    if (!active) {
      return false;
    }

    return (
      active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.isContentEditable
    );
  }

  /* =======================================================
     TOOL / DOCK
     ======================================================= */

  function setTool(tool) {
    const valid = [
      "select",
      "move",
      "rotate",
      "scale"
    ];

    if (!valid.includes(tool)) {
      return;
    }

    state.activeTool = tool;

    els.toolButtons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.tool === tool
      );
    });

    if (els.viewport) {
      els.viewport.dataset.tool = tool;
    }
  }

  function setDock(dock) {
    state.activeDock = dock;

    els.dockTabs.forEach((tab) => {
      tab.classList.toggle(
        "active",
        tab.dataset.dock === dock
      );
    });

    els.dockPanels.forEach((panel) => {
      const panelDock =
        panel.dataset.panel ||
        panel.id ||
        "";

      panel.classList.toggle(
        "active",
        panelDock === dock ||
          panelDock === `${dock}Panel`
      );
    });
  }

  /* =======================================================
     VIEWPORT SETUP
     ======================================================= */

  function setupViewport() {
    if (!els.viewport) {
      return;
    }

    els.viewport.addEventListener(
      "pointerdown",
      onViewportPointerDown
    );

    els.viewport.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
      }
    );
  }

  function setupThreeScene() {
    if (!els.viewport || !THREE_REF) {
      return;
    }

    const THREE = THREE_REF;

    scene = new THREE.Scene();

    scene.background = new THREE.Color(
      0x090d12
    );

    camera = new THREE.PerspectiveCamera(
      55,
      1,
      0.1,
      5000
    );

    camera.position.set(
      16,
      14,
      20
    );

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(
      els.viewport.clientWidth,
      els.viewport.clientHeight,
      false
    );

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    els.viewport.innerHTML = "";
    els.viewport.appendChild(
      renderer.domElement
    );

    addLighting();
    addGrid();

    createResizeObserver();

    animate();
  }

  function addLighting() {
    if (!scene || !THREE_REF) {
      return;
    }

    const THREE = THREE_REF;

    const ambient =
      new THREE.HemisphereLight(
        0xb9d5ff,
        0x1c2027,
        1.8
      );

    scene.add(ambient);

    const directional =
      new THREE.DirectionalLight(
        0xffffff,
        2.5
      );

    directional.position.set(
      20,
      35,
      15
    );

    directional.castShadow = false;

    scene.add(directional);
  }

  let gridHelper = null;

  function addGrid() {
    if (!scene || !THREE_REF) {
      return;
    }

    const THREE = THREE_REF;

    gridHelper = new THREE.GridHelper(
      500,
      50,
      0x3a444f,
      0x202832
    );

    gridHelper.position.y = 0;

    scene.add(gridHelper);
  }

  function createResizeObserver() {
    if (!els.viewport) {
      return;
    }

    const resize = () => {
      if (!renderer || !camera) {
        return;
      }

      const width =
        els.viewport.clientWidth || 1;

      const height =
        els.viewport.clientHeight || 1;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(
        width,
        height,
        false
      );
    };

    if ("ResizeObserver" in window) {
      const observer =
        new ResizeObserver(resize);

      observer.observe(els.viewport);
    } else {
      window.addEventListener(
        "resize",
        resize
      );
    }

    resize();
  }

  function animate() {
    if (!renderer || !scene || !camera) {
      return;
    }

    renderer.render(scene, camera);

    animationFrame =
      requestAnimationFrame(animate);
  }

  /* =======================================================
     SCENE OBJECTS
     ======================================================= */

  const threeObjects = new Map();

  function rebuildScene() {
    if (!scene || !THREE_REF) {
      refreshExplorer();
      refreshInspector();
      return;
    }

    threeObjects.forEach((object3d) => {
      scene.remove(object3d);
      disposeObject(object3d);
    });

    threeObjects.clear();

    state.project.objects.forEach(
      (object) => {
        const mesh =
          createThreeObject(object);

        if (!mesh) {
          return;
        }

        scene.add(mesh);
        threeObjects.set(
          object.id,
          mesh
        );

        updateObjectVisibility(
          object,
          mesh
        );
      }
    );

    updateSelection();
    refreshExplorer();
    refreshInspector();
  }

  function createThreeObject(object) {
    const THREE = THREE_REF;

    if (!THREE) {
      return null;
    }

    const geometry =
      createGeometryForType(
        object.type
      );

    if (!geometry) {
      return null;
    }

    const material =
      new THREE.MeshStandardMaterial({
        color: object.color || "#4da3ff",
        roughness: 0.78,
        metalness: 0.08
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    mesh.userData.riseId =
      object.id;

    mesh.position.set(
      object.position.x,
      object.position.y,
      object.position.z
    );

    mesh.rotation.set(
      degToRad(object.rotation.x),
      degToRad(object.rotation.y),
      degToRad(object.rotation.z)
    );

    mesh.scale.set(
      object.scale.x,
      object.scale.y,
      object.scale.z
    );

    return mesh;
  }

  function createGeometryForType(type) {
    const THREE = THREE_REF;

    switch (String(type).toLowerCase()) {
      case "sphere":
        return new THREE.SphereGeometry(
          1,
          32,
          20
        );

      case "cylinder":
        return new THREE.CylinderGeometry(
          1,
          1,
          2,
          32
        );

      case "wedge":
        return createWedgeGeometry();

      case "light":
        return new THREE.SphereGeometry(
          0.35,
          16,
          12
        );

      case "spawn":
        return new THREE.CylinderGeometry(
          1,
          1,
          0.3,
          32
        );

      case "folder":
        return new THREE.BoxGeometry(
          1,
          1,
          1
        );

      case "part":
      case "cube":
      default:
        return new THREE.BoxGeometry(
          2,
          2,
          2
        );
    }
  }

  function createWedgeGeometry() {
    const THREE = THREE_REF;

    const vertices = new Float32Array([
      -1, -1, -1,
       1, -1, -1,
       1, -1,  1,

      -1, -1, -1,
       1, -1,  1,
      -1, -1,  1,

      -1, -1, -1,
       1, -1, -1,
       1,  1, -1,

      -1, -1, -1,
       1,  1, -1,
      -1,  1, -1,

      -1, -1,  1,
       1, -1,  1,
       1,  1, -1,

      -1, -1,  1,
       1,  1, -1,
      -1,  1, -1,

       1, -1, -1,
       1, -1,  1,
       1,  1, -1,

      -1, -1, -1,
      -1, -1,  1,
      -1,  1, -1
    ]);

    const geometry =
      new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        vertices,
        3
      )
    );

    geometry.computeVertexNormals();

    return geometry;
  }

  function disposeObject(object3d) {
    object3d.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(
            (material) =>
              material.dispose()
          );
        } else {
          child.material.dispose();
        }
      }
    });
  }

  /* =======================================================
     CREATE OBJECT
     ======================================================= */

  function createObject(
    type = "Part",
    options = {}
  ) {
    const object = normalizeObject({
      id: createId(
        String(type).toLowerCase()
      ),

      type,

      name:
        options.name ||
        `${type} ${
          countObjectsOfType(type) + 1
        }`,

      position:
        options.position ||
        {
          x: state.player.x,
          y: state.player.y,
          z: state.player.z
        },

      rotation:
        options.rotation || {
          x: 0,
          y: 0,
          z: 0
        },

      scale:
        options.scale || {
          x: 1,
          y: 1,
          z: 1
        },

      color:
        options.color ||
        getDefaultColor(type),

      visible:
        options.visible !== undefined
          ? options.visible
          : true,

      createdAt:
        Number.isFinite(options.createdAt)
          ? options.createdAt
          : state.timeline.currentTime,

      hiddenAt:
        options.hiddenAt ?? null
    });

    state.project.objects.push(object);

    state.selectedId = object.id;

    rebuildScene();
    refreshAll();

    pushHistory();

    consoleMessage(
      `Created ${object.name}.`
    );

    return object;
  }

  function countObjectsOfType(type) {
    return state.project.objects.filter(
      (object) =>
        String(object.type).toLowerCase() ===
        String(type).toLowerCase()
    ).length;
  }

  function getDefaultColor(type) {
    switch (String(type).toLowerCase()) {
      case "spawn":
        return "#46c47b";

      case "light":
        return "#ffd76a";

      case "sphere":
        return "#a987ff";

      case "cylinder":
        return "#4da3ff";

      case "wedge":
        return "#ff9a62";

      default:
        return "#4da3ff";
    }
  }

  /* =======================================================
     SELECT
     ======================================================= */

  function selectObject(id) {
    if (
      id &&
      !state.project.objects.some(
        (object) => object.id === id
      )
    ) {
      return;
    }

    state.selectedId = id || null;

    updateSelection();
    refreshExplorer();
    refreshInspector();
  }

  function updateSelection() {
    threeObjects.forEach(
      (mesh, id) => {
        const selected =
          id === state.selectedId;

        if (
          mesh.material &&
          "emissive" in mesh.material
        ) {
          mesh.material.emissive.set(
            selected ? 0x183f67 : 0x000000
          );

          mesh.material.emissiveIntensity =
            selected ? 0.9 : 0;
        }
      }
    );
  }

  function onViewportPointerDown(event) {
    if (
      state.running ||
      !raycaster ||
      !camera ||
      !renderer
    ) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const rect =
      renderer.domElement.getBoundingClientRect();

    mouse.x =
      ((event.clientX - rect.left) /
        rect.width) *
        2 -
      1;

    mouse.y =
      -(
        (event.clientY - rect.top) /
        rect.height
      ) *
        2 +
      1;

    raycaster.setFromCamera(
      mouse,
      camera
    );

    const meshes = [
      ...threeObjects.values()
    ];

    const hits =
      raycaster.intersectObjects(
        meshes,
        true
      );

    if (!hits.length) {
      selectObject(null);
      return;
    }

    let target =
      hits[0].object;

    while (
      target &&
      !target.userData.riseId
    ) {
      target = target.parent;
    }

    if (!target) {
      return;
    }

    selectObject(
      target.userData.riseId
    );
  }

  /* =======================================================
     INSPECTOR
     ======================================================= */

  function refreshInspector() {
    if (!els.inspector) {
      return;
    }

    const object =
      getSelectedObject();

    if (!object) {
      els.inspector.innerHTML = `
        <div class="inspector-empty">
          Select an object to edit its properties.
        </div>
      `;

      return;
    }

    els.inspector.innerHTML = `
      <div class="inspector-section">
        <div class="inspector-section-title">
          General
        </div>

        <div class="property-row">
          <div class="property-label">Name</div>
          <div class="property-value">
            <input
              class="property-input"
              data-property="name"
              value="${escapeHtml(object.name)}"
            >
          </div>
        </div>

        <div class="property-row">
          <div class="property-label">Type</div>
          <div class="property-value">
            <input
              class="property-input"
              value="${escapeHtml(object.type)}"
              disabled
            >
          </div>
        </div>

        <div class="property-row">
          <div class="property-label">Visible</div>
          <div class="property-value">
            <input
              type="checkbox"
              data-property="visible"
              ${object.visible ? "checked" : ""}
            >
          </div>
        </div>
      </div>

      <div class="inspector-section">
        <div class="inspector-section-title">
          Transform
        </div>

        ${vectorProperty(
          "Position",
          "position",
          object.position
        )}

        ${vectorProperty(
          "Rotation",
          "rotation",
          object.rotation
        )}

        ${vectorProperty(
          "Scale",
          "scale",
          object.scale
        )}
      </div>

      <div class="inspector-section">
        <div class="inspector-section-title">
          Appearance
        </div>

        <div class="property-row">
          <div class="property-label">Color</div>
          <div class="property-value">
            <div class="property-color">
              <input
                type="color"
                data-property="color"
                value="${safeColor(object.color)}"
              >

              <input
                class="property-input property-color-value"
                data-property="color-text"
                value="${escapeHtml(object.color)}"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="inspector-section">
        <div class="inspector-section-title">
          4D Timeline
        </div>

        ${numberProperty(
          "Created At",
          "createdAt",
          object.createdAt
        )}

        ${numberProperty(
          "Hidden At",
          "hiddenAt",
          object.hiddenAt ?? ""
        )}
      </div>

      <div class="inspector-section">
        <div class="inspector-section-title">
          Actions
        </div>

        <div style="padding:8px;">
          <button
            class="studio-button danger"
            data-action="delete-selected"
            style="width:100%;"
          >
            Delete Object
          </button>
        </div>
      </div>
    `;

    bindInspectorEvents();
  }

  function vectorProperty(
    label,
    property,
    value
  ) {
    return `
      <div class="property-row">
        <div class="property-label">${label}</div>
        <div class="property-value">
          <div class="property-vector">

            <input
              class="property-input"
              data-vector="${property}"
              data-axis="x"
              value="${value.x}"
            >

            <input
              class="property-input"
              data-vector="${property}"
              data-axis="y"
              value="${value.y}"
            >

            <input
              class="property-input"
              data-vector="${property}"
              data-axis="z"
              value="${value.z}"
            >

          </div>
        </div>
      </div>
    `;
  }

  function numberProperty(
    label,
    property,
    value
  ) {
    return `
      <div class="property-row">
        <div class="property-label">${label}</div>
        <div class="property-value">
          <input
            class="property-input"
            data-property="${property}"
            value="${value}"
            type="number"
            step="0.01"
          >
        </div>
      </div>
    `;
  }

  function bindInspectorEvents() {
    if (!els.inspector) {
      return;
    }

    els.inspector
      .querySelectorAll(
        "[data-property]"
      )
      .forEach((input) => {
        input.addEventListener(
          "change",
          () => {
            updateInspectorProperty(
              input
            );
          }
        );
      });

    els.inspector
      .querySelectorAll(
        "[data-vector]"
      )
      .forEach((input) => {
        input.addEventListener(
          "change",
          () => {
            updateInspectorVector(
              input
            );
          }
        );
      });
  }

  function updateInspectorProperty(input) {
    const object =
      getSelectedObject();

    if (!object) {
      return;
    }

    const property =
      input.dataset.property;

    if (property === "visible") {
      object.visible = input.checked;
    } else if (
      property === "name"
    ) {
      object.name =
        input.value.trim() ||
        object.type;
    } else if (
      property === "color"
    ) {
      object.color =
        normalizeHex(
          input.value
        );
    } else if (
      property === "color-text"
    ) {
      object.color =
        normalizeHex(
          input.value
        );
    } else if (
      property === "createdAt"
    ) {
      object.createdAt =
        Number(input.value) || 0;
    } else if (
      property === "hiddenAt"
    ) {
      object.hiddenAt =
        input.value === ""
          ? null
          : Number(input.value);
    }

    if (
      property === "color-text"
    ) {
      refreshInspector();
    }

    applyObjectToThree(object);

    refreshExplorer();
    pushHistory();
    saveProject(false);
  }

  function updateInspectorVector(input) {
    const object =
      getSelectedObject();

    if (!object) {
      return;
    }

    const property =
      input.dataset.vector;

    const axis =
      input.dataset.axis;

    if (
      !object[property] ||
      !["x", "y", "z"].includes(axis)
    ) {
      return;
    }

    let value =
      Number(input.value);

    if (!Number.isFinite(value)) {
      value = 0;
    }

    if (
      property === "scale" &&
      value === 0
    ) {
      value = 0.001;
    }

    object[property][axis] =
      state.project.settings.snap
        ? snapValue(
            value,
            state.project.settings.gridSize
          )
        : value;

    applyObjectToThree(object);

    pushHistory();
    saveProject(false);
  }

  function applyObjectToThree(object) {
    const mesh =
      threeObjects.get(object.id);

    if (!mesh) {
      return;
    }

    mesh.position.set(
      object.position.x,
      object.position.y,
      object.position.z
    );

    mesh.rotation.set(
      degToRad(object.rotation.x),
      degToRad(object.rotation.y),
      degToRad(object.rotation.z)
    );

    mesh.scale.set(
      object.scale.x,
      object.scale.y,
      object.scale.z
    );

    if (mesh.material) {
      mesh.material.color.set(
        object.color || "#4da3ff"
      );
    }

    updateObjectVisibility(
      object,
      mesh
    );
  }

  function updateObjectVisibility(
    object,
    mesh
  ) {
    const time =
      state.timeline.currentTime;

    const beforeCreation =
      time < object.createdAt;

    const afterHidden =
      object.hiddenAt !== null &&
      time >= object.hiddenAt;

    mesh.visible =
      object.visible &&
      !beforeCreation &&
      !afterHidden;
  }

  function getSelectedObject() {
    return (
      state.project.objects.find(
        (object) =>
          object.id ===
          state.selectedId
      ) || null
    );
  }

  /* =======================================================
     EXPLORER
     ======================================================= */

  function refreshExplorer() {
    if (!els.explorer) {
      return;
    }

    if (!state.project.objects.length) {
      els.explorer.innerHTML = `
        <div class="inspector-empty">
          No objects in the scene.
        </div>
      `;

      return;
    }

    els.explorer.innerHTML =
      state.project.objects
        .map(
          (object) => `
            <div
              class="tree-item ${
                object.id ===
                state.selectedId
                  ? "selected"
                  : ""
              }"
              data-object-id="${object.id}"
            >
              <span class="tree-arrow">
                ${getTreeArrow(object)}
              </span>

              <span class="tree-icon">
                ${getObjectSymbol(object.type)}
              </span>

              <span class="tree-name">
                ${escapeHtml(object.name)}
              </span>
            </div>
          `
        )
        .join("");

    els.explorer
      .querySelectorAll(
        "[data-object-id]"
      )
      .forEach((item) => {
        item.addEventListener(
          "click",
          () => {
            selectObject(
              item.dataset.objectId
            );
          }
        );
      });
  }

  function getTreeArrow(object) {
    return object.type === "Folder"
      ? ">"
      : "";
  }

  function getObjectSymbol(type) {
    switch (
      String(type).toLowerCase()
    ) {
      case "spawn":
        return "S";

      case "light":
        return "L";

      case "sphere":
        return "O";

      case "cylinder":
        return "C";

      case "wedge":
        return "W";

      case "folder":
        return "F";

      default:
        return "P";
    }
  }

  /* =======================================================
     4D TIMELINE
     ======================================================= */

  function refreshTimeline() {
    if (els.timelineTime) {
      els.timelineTime.textContent =
        `${formatTime(
          state.timeline.currentTime
        )} / ${formatTime(
          state.timeline.duration
        )}`;
    }

    if (els.timelinePlayhead) {
      const percent =
        (state.timeline.currentTime /
          state.timeline.duration) *
        100;

      els.timelinePlayhead.style.left =
        `${Math.max(
          0,
          Math.min(100, percent)
        )}%`;
    }

    threeObjects.forEach(
      (mesh, id) => {
        const object =
          state.project.objects.find(
            (item) =>
              item.id === id
          );

        if (object) {
          updateObjectVisibility(
            object,
            mesh
          );
        }
      }
    );
  }

  function setTimelineTime(time) {
    state.timeline.currentTime =
      Math.max(
        0,
        Math.min(
          state.timeline.duration,
          Number(time) || 0
        )
      );

    refreshTimeline();
  }

  function playTimeline() {
    if (state.timeline.playing) {
      return;
    }

    state.timeline.playing = true;

    const start =
      performance.now() -
      state.timeline.currentTime * 1000;

    const tick = (now) => {
      if (!state.timeline.playing) {
        return;
      }

      state.timeline.currentTime =
        (now - start) / 1000;

      if (
        state.timeline.currentTime >=
        state.timeline.duration
      ) {
        state.timeline.currentTime = 0;
      }

      refreshTimeline();

      timelineAnimation =
        requestAnimationFrame(tick);
    };

    timelineAnimation =
      requestAnimationFrame(tick);
  }

  function pauseTimeline() {
    state.timeline.playing = false;

    if (timelineAnimation) {
      cancelAnimationFrame(
        timelineAnimation
      );

      timelineAnimation = null;
    }
  }

  /* =======================================================
     AI
     ======================================================= */

  function submitAI() {
    if (!els.aiInput) {
      return;
    }

    const prompt =
      els.aiInput.value.trim();

    if (!prompt) {
      return;
    }

    addAIMessage(
      "You",
      prompt,
      true
    );

    els.aiInput.value = "";

    const result =
      interpretAI(prompt);

    addAIMessage(
      "Rise AI",
      result.message,
      false
    );

    if (result.changed) {
      pushHistory();
      saveProject(false);
      rebuildScene();
      refreshAll();
    }

    setDock("ai");
  }

  function addAIMessage(
    sender,
    message,
    user = false
  ) {
    if (!els.aiMessages) {
      return;
    }

    const element =
      document.createElement("div");

    element.className =
      `ai-message ${
        user ? "user" : ""
      }`;

    element.innerHTML = `
      <div class="sender">
        ${escapeHtml(sender)}
      </div>

      <div class="message-body">
        ${escapeHtml(message)}
      </div>
    `;

    els.aiMessages.appendChild(
      element
    );

    els.aiMessages.scrollTop =
      els.aiMessages.scrollHeight;
  }

  function interpretAI(prompt) {
    const text =
      prompt
        .trim()
        .toLowerCase();

    /* -----------------------------------------------
       ADD OBJECT
       ----------------------------------------------- */

    if (
      /\badd\b/.test(text) ||
      /\bcreate\b/.test(text) ||
      /\bmake\b/.test(text)
    ) {
      const type =
        detectObjectType(text);

      const position =
        detectPosition(text);

      const object =
        createObject(type, {
          position
        });

      if (
        /\bhere\b/.test(text) ||
        /\bwhere i'm standing\b/.test(text) ||
        /\bwhere i am\b/.test(text)
      ) {
        return {
          changed: true,
          message:
            `Added a ${type.toLowerCase()} at your current position.`
        };
      }

      return {
        changed: true,
        message:
          `Added ${object.name}.`
      };
    }

    /* -----------------------------------------------
       DELETE
       ----------------------------------------------- */

    if (
      /\bdelete\b/.test(text) ||
      /\bremove\b/.test(text)
    ) {
      const target =
        findObjectFromPrompt(text);

      if (!target) {
        return {
          changed: false,
          message:
            "I could not find an object to remove."
        };
      }

      deleteObject(target.id);

      return {
        changed: true,
        message:
          `Removed ${target.name}.`
      };
    }

    /* -----------------------------------------------
       MOVE
       ----------------------------------------------- */

    if (
      /\bmove\b/.test(text) ||
      /\bput\b/.test(text)
    ) {
      const target =
        findObjectFromPrompt(text) ||
        getSelectedObject();

      if (!target) {
        return {
          changed: false,
          message:
            "Select an object or tell me which object to move."
        };
      }

      const position =
        detectPosition(
          text,
          target.position
        );

      target.position = position;

      applyObjectToThree(target);

      return {
        changed: true,
        message:
          `Moved ${target.name} to ${formatVector(position)}.`
      };
    }

    /* -----------------------------------------------
       ROTATE
       ----------------------------------------------- */

    if (
      /\brotate\b/.test(text) ||
      /\bturn\b/.test(text)
    ) {
      const target =
        findObjectFromPrompt(text) ||
        getSelectedObject();

      if (!target) {
        return {
          changed: false,
          message:
            "Select an object or tell me which object to rotate."
        };
      }

      const degrees =
        extractNumber(text) ?? 90;

      if (/\bx\b/.test(text)) {
        target.rotation.x += degrees;
      } else if (/\by\b/.test(text)) {
        target.rotation.y += degrees;
      } else {
        target.rotation.y += degrees;
      }

      applyObjectToThree(target);

      return {
        changed: true,
        message:
          `Rotated ${target.name}.`
      };
    }

    /* -----------------------------------------------
       SCALE
       ----------------------------------------------- */

    if (
      /\bscale\b/.test(text) ||
      /\bresize\b/.test(text) ||
      /\bmake .* bigger\b/.test(text)
    ) {
      const target =
        findObjectFromPrompt(text) ||
        getSelectedObject();

      if (!target) {
        return {
          changed: false,
          message:
            "Select an object or tell me which object to scale."
        };
      }

      const amount =
        extractNumber(text) ?? 2;

      const factor =
        amount > 0 ? amount : 1;

      target.scale = {
        x: factor,
        y: factor,
        z: factor
      };

      applyObjectToThree(target);

      return {
        changed: true,
        message:
          `Scaled ${target.name} to ${factor}.`
      };
    }

    /* -----------------------------------------------
       COLOR
       ----------------------------------------------- */

    if (
      /\bcolor\b/.test(text) ||
      /\bcolour\b/.test(text)
    ) {
      const target =
        findObjectFromPrompt(text) ||
        getSelectedObject();

      if (!target) {
        return {
          changed: false,
          message:
            "Select an object or tell me which object to recolor."
        };
      }

      const color =
        detectColor(text);

      if (!color) {
        return {
          changed: false,
          message:
            "Tell me a color, such as blue, red, green, or white."
        };
      }

      target.color = color;

      applyObjectToThree(target);

      return {
        changed: true,
        message:
          `Changed ${target.name} to ${color}.`
      };
    }

    /* -----------------------------------------------
       HIDE / DISAPPEAR / 4D
       ----------------------------------------------- */

    if (
      /\bdisappear\b/.test(text) ||
      /\bhide\b/.test(text) ||
      /\bvanish\b/.test(text)
    ) {
      const target =
        findObjectFromPrompt(text) ||
        getSelectedObject();

      if (!target) {
        return {
          changed: false,
          message:
            "Select an object or tell me which object should disappear."
        };
      }

      const time =
        extractTime(text);

      if (time !== null) {
        target.hiddenAt = time;

        refreshTimeline();

        return {
          changed: true,
          message:
            `${target.name} will disappear at ${formatTime(time)}.`
        };
      }

      target.visible = false;

      applyObjectToThree(target);

      return {
        changed: true,
        message:
          `${target.name} is now hidden.`
      };
    }

    /* -----------------------------------------------
       SHOW
       ----------------------------------------------- */

    if (
      /\bshow\b/.test(text) ||
      /\bunhide\b/.test(text) ||
      /\bvisible\b/.test(text)
    ) {
      const target =
        findObjectFromPrompt(text) ||
        getSelectedObject();

      if (!target) {
        return {
          changed: false,
          message:
            "Select an object or tell me which object to show."
        };
      }

      target.visible = true;
      target.hiddenAt = null;

      applyObjectToThree(target);

      return {
        changed: true,
        message:
          `${target.name} is visible again.`
      };
    }

    /* -----------------------------------------------
       PLAYER
       ----------------------------------------------- */

    if (
      /\bplayer\b/.test(text) &&
      (
        /\bmove\b/.test(text) ||
        /\bgo\b/.test(text) ||
        /\bposition\b/.test(text)
      )
    ) {
      const position =
        detectPosition(
          text,
          state.player
        );

      state.player = position;

      return {
        changed: false,
        message:
          `Player position set to ${formatVector(position)}.`
      };
    }

    /* -----------------------------------------------
       TIMELINE
       ----------------------------------------------- */

    if (
      /\b4d\b/.test(text) ||
      /\btimeline\b/.test(text) ||
      /\btime\b/.test(text)
    ) {
      const time =
        extractTime(text);

      if (time !== null) {
        setTimelineTime(time);

        return {
          changed: false,
          message:
            `Timeline moved to ${formatTime(time)}.`
        };
      }

      setDock("timeline");

      return {
        changed: false,
        message:
          "Opened the 4D timeline."
      };
    }

    /* -----------------------------------------------
       SELECT
       ----------------------------------------------- */

    if (
      /\bselect\b/.test(text)
    ) {
      const target =
        findObjectFromPrompt(text);

      if (!target) {
        return {
          changed: false,
          message:
            "I could not find that object."
        };
      }

      selectObject(target.id);

      return {
        changed: false,
        message:
          `Selected ${target.name}.`
      };
    }

    /* -----------------------------------------------
       FALLBACK
       ----------------------------------------------- */

    return {
      changed: false,
      message:
        "I can create, move, rotate, scale, color, hide, show, delete, and timeline-control 3D objects."
    };
  }

  function detectObjectType(text) {
    if (/\bwedge\b/.test(text)) {
      return "Wedge";
    }

    if (/\bsphere\b/.test(text)) {
      return "Sphere";
    }

    if (/\bcylinder\b/.test(text)) {
      return "Cylinder";
    }

    if (/\blight\b/.test(text)) {
      return "Light";
    }

    if (/\bspawn\b/.test(text)) {
      return "Spawn";
    }

    if (/\bfolder\b/.test(text)) {
      return "Folder";
    }

    return "Part";
  }

  function detectPosition(
    text,
    fallback = null
  ) {
    const standing =
      /\bwhere i'm standing\b/.test(text) ||
      /\bwhere i am\b/.test(text) ||
      /\bcurrent position\b/.test(text) ||
      /\bhere\b/.test(text);

    if (standing) {
      return {
        ...state.player
      };
    }

    const xyz =
      text.match(
        /x\s*(-?\d+(?:\.\d+)?)\s*(?:,|and)?\s*y\s*(-?\d+(?:\.\d+)?)\s*(?:,|and)?\s*z\s*(-?\d+(?:\.\d+)?)/i
      );

    if (xyz) {
      return {
        x: Number(xyz[1]),
        y: Number(xyz[2]),
        z: Number(xyz[3])
      };
    }

    const numbers =
      text.match(
        /-?\d+(?:\.\d+)?/g
      );

    if (
      numbers &&
      numbers.length >= 3
    ) {
      return {
        x: Number(numbers[0]),
        y: Number(numbers[1]),
        z: Number(numbers[2])
      };
    }

    if (fallback) {
      return {
        ...fallback
      };
    }

    return {
      ...state.player
    };
  }

  function findObjectFromPrompt(text) {
    const objects =
      [...state.project.objects]
        .sort(
          (a, b) =>
            b.name.length -
            a.name.length
        );

    return (
      objects.find((object) =>
        text.includes(
          object.name.toLowerCase()
        )
      ) ||
      objects.find(
        (object) =>
          text.includes(
            object.type.toLowerCase()
          )
      ) ||
      null
    );
  }

  function detectColor(text) {
    const colors = {
      red: "#ff4d4d",
      green: "#46c47b",
      blue: "#4da3ff",
      yellow: "#ffd34d",
      orange: "#ff914d",
      purple: "#9d72ff",
      pink: "#ff72b7",
      white: "#ffffff",
      black: "#111111",
      gray: "#808890",
      grey: "#808890",
      cyan: "#4de1ff"
    };

    for (const [name, hex] of Object.entries(
      colors
    )) {
      if (
        new RegExp(
          `\\b${name}\\b`,
          "i"
        ).test(text)
      ) {
        return hex;
      }
    }

    const hexMatch =
      text.match(
        /#[0-9a-f]{6}\b/i
      );

    return hexMatch
      ? hexMatch[0]
      : null;
  }

  function extractNumber(text) {
    const match =
      text.match(
        /-?\d+(?:\.\d+)?/
      );

    return match
      ? Number(match[0])
      : null;
  }

  function extractTime(text) {
    const seconds =
      text.match(
        /(-?\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i
      );

    if (seconds) {
      return Math.max(
        0,
        Math.min(
          state.timeline.duration,
          Number(seconds[1])
        )
      );
    }

    const timestamp =
      text.match(
        /\b(\d+):(\d{1,2})\b/
      );

    if (timestamp) {
      return Math.max(
        0,
        Math.min(
          state.timeline.duration,
          Number(timestamp[1]) * 60 +
            Number(timestamp[2])
        )
      );
    }

    return null;
  }

  /* =======================================================
     DELETE
     ======================================================= */

  function deleteSelected() {
    if (!state.selectedId) {
      return;
    }

    deleteObject(
      state.selectedId
    );
  }

  function deleteObject(id) {
    const index =
      state.project.objects.findIndex(
        (object) =>
          object.id === id
      );

    if (index === -1) {
      return;
    }

    const object =
      state.project.objects[index];

    state.project.objects.splice(
      index,
      1
    );

    if (
      state.selectedId === id
    ) {
      state.selectedId = null;
    }

    rebuildScene();
    refreshAll();

    pushHistory();
    saveProject(false);

    consoleMessage(
      `Deleted ${object.name}.`
    );
  }

  /* =======================================================
     NEW / DELETE PROJECT
     ======================================================= */

  function newProject() {
    if (
      !confirm(
        "Create a new empty project?"
      )
    ) {
      return;
    }

    state.project = {
      name: "Untitled Game",
      description: "",
      objects: [],
      settings: {
        gridSize: 10,
        snap: true,
        mode: "3d"
      }
    };

    state.selectedId = null;

    rebuildScene();
    refreshAll();

    pushHistory();
    saveProject(false);

    toast(
      "New project created.",
      "success"
    );
  }

  function deleteProject() {
    if (
      !confirm(
        "Delete this project? This will reset the Studio project."
      )
    ) {
      return;
    }

    const backup =
      JSON.stringify(state.project);

    try {
      localStorage.setItem(
        `${getProjectStorageKey()}_deleted_backup`,
        backup
      );

      localStorage.removeItem(
        getProjectStorageKey()
      );

      localStorage.removeItem(
        STORAGE_KEYS.project
      );
    } catch {
      /* Ignore localStorage errors. */
    }

    state.project = {
      name: "Untitled Game",
      description: "",
      objects: [],
      settings: {
        gridSize: 10,
        snap: true,
        mode: "3d"
      }
    };

    state.selectedId = null;

    rebuildScene();
    refreshAll();

    pushHistory();

    toast(
      "Project deleted and reset.",
      "success"
    );

    consoleMessage(
      "Project reset."
    );
  }

  /* =======================================================
     PUBLISH
     ======================================================= */

  function publishProject() {
    saveProject(false);

    const games =
      readStorageArray(
        STORAGE_KEYS.games
      );

    const currentUser =
      getCurrentUser();

    const gameId =
      createGameId(
        state.project.name
      );

    const existingIndex =
      games.findIndex(
        (game) =>
          game.id === gameId
      );

    const game = {
      id: gameId,
      name:
        state.project.name ||
        "Untitled Game",
      description:
        state.project.description ||
        "",
      owner:
        currentUser,
      objects:
        deepClone(
          state.project.objects
        ),
      settings:
        deepClone(
          state.project.settings
        ),
      updatedAt:
        new Date().toISOString(),
      createdAt:
        existingIndex >= 0
          ? games[existingIndex]
              .createdAt
          : new Date().toISOString()
    };

    if (existingIndex >= 0) {
      games[existingIndex] =
        game;
    } else {
      games.push(game);
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.games,
        JSON.stringify(games)
      );
    } catch {
      toast(
        "Could not publish the game.",
        "error"
      );

      return;
    }

    toast(
      "Game published.",
      "success"
    );

    consoleMessage(
      `Published "${game.name}".`
    );
  }

  function readStorageArray(key) {
    try {
      const value =
        JSON.parse(
          localStorage.getItem(key) ||
            "[]"
        );

      return Array.isArray(value)
        ? value
        : [];
    } catch {
      return [];
    }
  }

  /* =======================================================
     PLAY MODE
     ======================================================= */

  function startGame() {
    if (state.running) {
      return;
    }

    state.running = true;

    document.body.classList.add(
      "play-mode"
    );

    pauseTimeline();

    refreshPlayButtons();

    consoleMessage(
      "Game started."
    );

    if (els.viewport) {
      els.viewport.focus();
    }
  }

  function stopGame() {
    if (!state.running) {
      return;
    }

    state.running = false;

    document.body.classList.remove(
      "play-mode"
    );

    refreshPlayButtons();

    consoleMessage(
      "Game stopped."
    );
  }

  function refreshPlayButtons() {
    if (els.playButton) {
      els.playButton.disabled =
        state.running;
    }

    if (els.stopButton) {
      els.stopButton.disabled =
        !state.running;
    }
  }

  /* =======================================================
     VIEW
     ======================================================= */

  function resetCamera() {
    if (!camera) {
      return;
    }

    camera.position.set(
      16,
      14,
      20
    );

    camera.lookAt(
      0,
      0,
      0
    );

    toast(
      "View reset.",
      "success"
    );
  }

  function toggleGrid() {
    if (!gridHelper) {
      return;
    }

    gridHelper.visible =
      !gridHelper.visible;

    if (els.gridButton) {
      els.gridButton.classList.toggle(
        "active",
        gridHelper.visible
      );
    }
  }

  function toggleMode() {
    state.project.settings.mode =
      state.project.settings.mode ===
      "3d"
        ? "4d"
        : "3d";

    if (els.modeButton) {
      els.modeButton.textContent =
        state.project.settings.mode.toUpperCase();
    }

    setDock(
      state.project.settings.mode ===
        "4d"
        ? "timeline"
        : "ai"
    );

    refreshTimeline();
    saveProject(false);
  }

  /* =======================================================
     CONSOLE
     ======================================================= */

  function consoleMessage(
    message,
    type = "info"
  ) {
    if (!els.consoleOutput) {
      return;
    }

    const line =
      document.createElement("div");

    line.className =
      `console-line ${type}`;

    line.textContent =
      `[${new Date().toLocaleTimeString()}] ${message}`;

    els.consoleOutput.appendChild(
      line
    );

    els.consoleOutput.scrollTop =
      els.consoleOutput.scrollHeight;
  }

  if (els.consoleInput) {
    els.consoleInput.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key !== "Enter"
        ) {
          return;
        }

        const command =
          els.consoleInput.value.trim();

        if (!command) {
          return;
        }

        els.consoleInput.value = "";

        consoleMessage(
          `> ${command}`
        );

        interpretConsoleCommand(
          command
        );
      }
    );
  }

  function interpretConsoleCommand(command) {
    const normalized =
      command.toLowerCase();

    if (normalized === "clear") {
      if (els.consoleOutput) {
        els.consoleOutput.innerHTML = "";
      }

      return;
    }

    if (normalized === "help") {
      consoleMessage(
        "Commands: clear, save, play, stop, objects, time."
      );

      return;
    }

    if (normalized === "save") {
      saveProject(true);
      return;
    }

    if (normalized === "play") {
      startGame();
      return;
    }

    if (normalized === "stop") {
      stopGame();
      return;
    }

    if (normalized === "objects") {
      consoleMessage(
        state.project.objects
          .map(
            (object) =>
              `${object.name} (${object.type})`
          )
          .join(", ") ||
          "No objects."
      );

      return;
    }

    if (
      normalized.startsWith(
        "time "
      )
    ) {
      const time =
        Number(
          normalized.slice(5)
        );

      if (Number.isFinite(time)) {
        setTimelineTime(time);

        consoleMessage(
          `Timeline set to ${time}s.`
        );

        return;
      }
    }

    consoleMessage(
      "Unknown command. Type help."
    );
  }

  /* =======================================================
     REFRESH
     ======================================================= */

  function refreshAll() {
    if (els.projectName) {
      els.projectName.textContent =
        state.project.name ||
        "Untitled Game";
    }

    refreshExplorer();
    refreshInspector();
    refreshTimeline();
    refreshUndoRedo();
    refreshPlayButtons();

    if (els.modeButton) {
      els.modeButton.textContent =
        state.project.settings.mode.toUpperCase();
    }

    if (
      els.gridButton &&
      gridHelper
    ) {
      els.gridButton.classList.toggle(
        "active",
        gridHelper.visible
      );
    }
  }

  /* =======================================================
     HELPERS
     ======================================================= */

  function createId(prefix) {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {
      return `${prefix}_${window.crypto.randomUUID()}`;
    }

    return (
      `${prefix}_${Date.now()}_` +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  }

  function createGameId(name) {
    const slug =
      String(name || "game")
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        ) ||
      "game";

    return `${slug}-${getCurrentUser()}`;
  }

  function degToRad(value) {
    return (
      (Number(value) || 0) *
      Math.PI /
      180
    );
  }

  function snapValue(
    value,
    gridSize
  ) {
    const size =
      Number(gridSize) || 1;

    return (
      Math.round(value / size) *
      size
    );
  }

  function safeColor(value) {
    const normalized =
      normalizeHex(value);

    return /^#[0-9a-f]{6}$/i.test(
      normalized
    )
      ? normalized
      : "#4da3ff";
  }

  function normalizeHex(value) {
    let color =
      String(value || "")
        .trim();

    if (!color.startsWith("#")) {
      color = `#${color}`;
    }

    if (
      /^#[0-9a-f]{3}$/i.test(color)
    ) {
      return (
        "#" +
        color[1] +
        color[1] +
        color[2] +
        color[2] +
        color[3] +
        color[3]
      );
    }

    return /^#[0-9a-f]{6}$/i.test(
      color
    )
      ? color.toLowerCase()
      : "#4da3ff";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function deepClone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function formatVector(vector) {
    return `(${Number(
      vector.x || 0
    )}, ${Number(
      vector.y || 0
    )}, ${Number(
      vector.z || 0
    )})`;
  }

  function formatTime(seconds) {
    const total =
      Math.max(
        0,
        Math.floor(
          Number(seconds) || 0
        )
      );

    const minutes =
      Math.floor(total / 60);

    const secs =
      total % 60;

    return (
      `${String(minutes).padStart(
        2,
        "0"
      )}:` +
      `${String(secs).padStart(
        2,
        "0"
      )}`
    );
  }

  function toast(
    message,
    type = "info"
  ) {
    if (!els.toastContainer) {
      return;
    }

    const item =
      document.createElement("div");

    item.className =
      `toast ${type}`;

    item.textContent = message;

    els.toastContainer.appendChild(
      item
    );

    setTimeout(() => {
      item.remove();
    }, 4200);
  }

  /* =======================================================
     EXPOSE RISEUP STUDIO API
     ======================================================= */

  window.RiseUpStudio = {
    state,

    createObject,
    deleteObject,
    deleteSelected,

    selectObject,

    saveProject,
    publishProject,

    startGame,
    stopGame,

    setTimelineTime,
    playTimeline,
    pauseTimeline,

    undo,
    redo,

    resetCamera,

    getProject() {
      return state.project;
    }
  };
})();
