(() => {
  "use strict";

  const USER_KEY = "riseup_currentUser";
  const PROJECT_KEY = "riseup_studio_project";
  const GAMES_KEY = "riseup_games";

  const state = {
    user: getCurrentUser(),

    project: {
      name: "Untitled Game",
      description: "",
      mode: "3D",
      objects: [],
      code: [
        'game.name = "My Game";',
        'game.mode = "3D";',
        "",
        "world.gravity = 25;",
        "",
        "player.walk.speed = 7;",
        "player.jump.power = 9;",
        "",
        "add.mesh.cube();",
        'map.name = "My World";'
      ].join("\n")
    },

    selectedId: null,

    tool: "select",

    bottom: "ai",

    mode: "3D",

    timeline: {
      time: 0,
      max: 120,
      playing: false
    },

    running: false,

    player: {
      x: 0,
      y: 0,
      z: 0
    },

    history: [],
    historyIndex: -1,

    ai: {
      waiting: false,
      conversation: []
    },

    scene: null,
    camera: null,
    renderer: null,
    raycaster: null,
    mouse: null,

    meshes: new Map(),
    grid: null,

    animationFrame: null,
    timelineFrame: null
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheElements();

    loadProject();

    bindUI();
    bindKeyboard();

    await loadThree();

    setupThree();

    syncProjectName();
    renderEverything();

    pushHistory();

    addAIMessage(
      "Rise AI",
      "I'm ready. Tell me what you want to build, change, debug, or code."
    );

    consoleLog("RiseUp Studio initialized.");
  }

  /* ========================================================
     ELEMENTS
     ======================================================== */

  function cacheElements() {
    els.projectName =
      document.getElementById("projectName");

    els.saveStatus =
      document.getElementById("saveStatus");

    els.codeButton =
      document.getElementById("codeButton");

    els.saveButton =
      document.getElementById("saveButton");

    els.publishButton =
      document.getElementById("publishButton");

    els.deleteProjectButton =
      document.getElementById("deleteProjectButton");

    els.playButton =
      document.getElementById("playButton");

    els.stopButton =
      document.getElementById("stopButton");

    els.viewport =
      document.getElementById("viewport");

    els.editorCanvas =
      document.getElementById("editorCanvas");

    els.viewportHint =
      document.getElementById("viewportHint");

    els.playOverlay =
      document.getElementById("playOverlay");

    els.fpsCounter =
      document.getElementById("fpsCounter");

    els.mode3D =
      document.getElementById("mode3D");

    els.mode4D =
      document.getElementById("mode4D");

    els.frameButton =
      document.getElementById("frameButton");

    els.resetViewButton =
      document.getElementById("resetViewButton");

    els.selectionLabel =
      document.getElementById("selectionLabel");

    els.bottomTabs =
      document.querySelectorAll(".bottom-tab");

    els.bottomViews =
      document.querySelectorAll(".bottom-view");

    els.aiMessages =
      document.getElementById("aiMessages");

    els.aiInput =
      document.getElementById("aiInput");

    els.aiSend =
      document.getElementById("aiSend");

    els.studioCodeEditor =
      document.getElementById("studioCodeEditor");

    els.codeSaveButton =
      document.getElementById("codeSaveButton");

    els.codeRunButton =
      document.getElementById("codeRunButton");

    els.studioLineNumbers =
      document.getElementById("studioLineNumbers");

    els.timelineTime =
      document.getElementById("timelineTime");

    els.timelineBack =
      document.getElementById("timelineBack");

    els.timelinePlay =
      document.getElementById("timelinePlay");

    els.timelineForward =
      document.getElementById("timelineForward");

    els.timelineReset =
      document.getElementById("timelineReset");

    els.timelineSlider =
      document.getElementById("timelineSlider");

    els.timelineObjects =
      document.getElementById("timelineObjects");

    els.consoleOutput =
      document.getElementById("consoleOutput");

    els.refreshExplorer =
      document.getElementById("refreshExplorer");

    els.outlinerSearch =
      document.getElementById("outlinerSearch");

    els.objectTree =
      document.getElementById("objectTree");

    els.outlinerFooter =
      document.getElementById("outlinerFooter");

    els.propertiesContent =
      document.getElementById("propertiesContent");

    els.publishModal =
      document.getElementById("publishModal");

    els.closePublish =
      document.getElementById("closePublish");

    els.cancelPublish =
      document.getElementById("cancelPublish");

    els.confirmPublish =
      document.getElementById("confirmPublish");

    els.publishName =
      document.getElementById("publishName");

    els.publishDescription =
      document.getElementById("publishDescription");

    els.locationModal =
      document.getElementById("locationModal");

    els.cancelLocation =
      document.getElementById("cancelLocation");

    els.toastContainer =
      document.getElementById("toastContainer");
  }

  /* ========================================================
     PROJECT
     ======================================================== */

  function defaultProject() {
    return {
      name: "Untitled Game",
      description: "",
      mode: "3D",

      objects: [
        makeObject("Spawn", {
          name: "Spawn",
          position: {
            x: 0,
            y: 0,
            z: 0
          },
          color: "#35c978"
        })
      ],

      code: [
        'game.name = "My Game";',
        'game.mode = "3D";',
        "",
        "world.gravity = 25;",
        "",
        "player.walk.speed = 7;",
        "player.jump.power = 9;",
        "",
        "add.mesh.cube();",
        'map.name = "My World";'
      ].join("\n")
    };
  }

  function loadProject() {
    const raw =
      localStorage.getItem(getProjectKey()) ||
      localStorage.getItem(PROJECT_KEY);

    if (!raw) {
      state.project =
        normalizeProject(defaultProject());

      return;
    }

    try {
      state.project =
        normalizeProject(
          JSON.parse(raw)
        );
    } catch {
      state.project =
        normalizeProject(defaultProject());
    }

    state.mode =
      state.project.mode || "3D";
  }

  function normalizeProject(project) {
    const base =
      defaultProject();

    const merged = {
      ...base,
      ...project
    };

    merged.objects =
      Array.isArray(project.objects)
        ? project.objects.map(normalizeObject)
        : [];

    merged.code =
      typeof project.code === "string"
        ? project.code
        : base.code;

    merged.mode =
      project.mode === "4D"
        ? "4D"
        : "3D";

    return merged;
  }

  function normalizeObject(object) {
    return {
      id:
        object.id ||
        makeId("object"),

      type:
        object.type ||
        "Cube",

      name:
        object.name ||
        object.type ||
        "Object",

      position:
        vector(
          object.position,
          0
        ),

      rotation:
        vector(
          object.rotation,
          0
        ),

      scale:
        vector(
          object.scale,
          1
        ),

      color:
        normalizeColor(
          object.color ||
          "#4da3ff"
        ),

      visible:
        typeof object.visible === "boolean"
          ? object.visible
          : true,

      createdAt:
        numberOr(
          object.createdAt,
          0
        ),

      hiddenAt:
        object.hiddenAt === null ||
        object.hiddenAt === undefined ||
        object.hiddenAt === ""
          ? null
          : numberOr(
              object.hiddenAt,
              null
            )
    };
  }

  function saveProject(showToast = true) {
    state.project.name =
      els.projectName?.value.trim() ||
      state.project.name ||
      "Untitled Game";

    state.project.mode =
      state.mode;

    state.project.code =
      els.studioCodeEditor?.value ??
      state.project.code;

    const data =
      JSON.stringify(state.project);

    try {
      localStorage.setItem(
        getProjectKey(),
        data
      );

      localStorage.setItem(
        PROJECT_KEY,
        data
      );

      setSaveStatus("Saved");

      if (showToast) {
        toast(
          "Project saved.",
          "success"
        );
      }

      consoleLog("Project saved.");
    } catch {
      setSaveStatus("Save failed");

      toast(
        "Could not save the project.",
        "error"
      );
    }
  }

  function getProjectKey() {
    const user =
      getUsername(state.user);

    return `${PROJECT_KEY}_${user}`;
  }

  function setSaveStatus(text) {
    if (els.saveStatus) {
      els.saveStatus.textContent =
        text;
    }
  }

  function syncProjectName() {
    if (els.projectName) {
      els.projectName.value =
        state.project.name;
    }

    if (els.studioCodeEditor) {
      els.studioCodeEditor.value =
        state.project.code;
    }

    updateLineNumbers();
  }

  /* ========================================================
     HISTORY
     ======================================================== */

  function pushHistory() {
    const snapshot =
      JSON.stringify(state.project);

    if (
      state.history[
        state.historyIndex
      ] === snapshot
    ) {
      return;
    }

    state.history =
      state.history.slice(
        0,
        state.historyIndex + 1
      );

    state.history.push(snapshot);

    if (state.history.length > 100) {
      state.history.shift();
    }

    state.historyIndex =
      state.history.length - 1;
  }

  function undo() {
    if (
      state.historyIndex <= 0
    ) {
      return;
    }

    state.historyIndex--;

    restoreSnapshot(
      state.history[
        state.historyIndex
      ]
    );
  }

  function redo() {
    if (
      state.historyIndex >=
      state.history.length - 1
    ) {
      return;
    }

    state.historyIndex++;

    restoreSnapshot(
      state.history[
        state.historyIndex
      ]
    );
  }

  function restoreSnapshot(snapshot) {
    try {
      state.project =
        normalizeProject(
          JSON.parse(snapshot)
        );

      state.mode =
        state.project.mode;

      state.selectedId = null;

      syncProjectName();
      rebuildScene();
      renderEverything();

      saveProject(false);
    } catch {
      toast(
        "Could not restore project.",
        "error"
      );
    }
  }

  /* ========================================================
     UI
     ======================================================== */

  function bindUI() {
    document
      .querySelectorAll(".rail-tool[data-tool]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            setTool(
              button.dataset.tool
            );
          }
        );
      });

    document
      .querySelectorAll(
        ".rail-tool[data-create]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            createObject(
              button.dataset.create
            );
          }
        );
      });

    els.bottomTabs.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            setBottom(
              button.dataset.bottom
            );
          }
        );
      }
    );

    els.mode3D?.addEventListener(
      "click",
      () => setMode("3D")
    );

    els.mode4D?.addEventListener(
      "click",
      () => setMode("4D")
    );

    els.codeButton?.addEventListener(
      "click",
      () => setBottom("code")
    );

    els.saveButton?.addEventListener(
      "click",
      () => saveProject(true)
    );

    els.playButton?.addEventListener(
      "click",
      startGame
    );

    els.stopButton?.addEventListener(
      "click",
      stopGame
    );

    els.publishButton?.addEventListener(
      "click",
      openPublish
    );

    els.deleteProjectButton?.addEventListener(
      "click",
      deleteProject
    );

    els.frameButton?.addEventListener(
      "click",
      frameSelected
    );

    els.resetViewButton?.addEventListener(
      "click",
      resetView
    );

    els.refreshExplorer?.addEventListener(
      "click",
      renderExplorer
    );

    els.outlinerSearch?.addEventListener(
      "input",
      renderExplorer
    );

    els.aiSend?.addEventListener(
      "click",
      submitAI
    );

    els.aiInput?.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          submitAI();
        }
      }
    );

    els.codeSaveButton?.addEventListener(
      "click",
      () => {
        saveCode();
      }
    );

    els.codeRunButton?.addEventListener(
      "click",
      () => {
        runCode();
      }
    );

    els.studioCodeEditor?.addEventListener(
      "input",
      updateLineNumbers
    );

    els.studioCodeEditor?.addEventListener(
      "keydown",
      handleEditorKeydown
    );

    els.timelineSlider?.addEventListener(
      "input",
      () => {
        setTimeline(
          Number(
            els.timelineSlider.value
          )
        );
      }
    );

    els.timelinePlay?.addEventListener(
      "click",
      toggleTimeline
    );

    els.timelineBack?.addEventListener(
      "click",
      () => {
        setTimeline(
          state.timeline.time - 1
        );
      }
    );

    els.timelineForward?.addEventListener(
      "click",
      () => {
        setTimeline(
          state.timeline.time + 1
        );
      }
    );

    els.timelineReset?.addEventListener(
      "click",
      () => {
        setTimeline(0);
      }
    );

    els.closePublish?.addEventListener(
      "click",
      closePublish
    );

    els.cancelPublish?.addEventListener(
      "click",
      closePublish
    );

    els.confirmPublish?.addEventListener(
      "click",
      publishProject
    );

    els.cancelLocation?.addEventListener(
      "click",
      closeLocation
    );

    els.projectName?.addEventListener(
      "input",
      () => setSaveStatus("Unsaved")
    );

    document
      .querySelectorAll(
        '[data-menu]'
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            handleMenu(
              button.dataset.menu
            );
          }
        );
      });

    document
      .querySelectorAll(
        "[data-location]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            placePendingObject(
              button.dataset.location
            );
          }
        );
      });
  }

  function bindKeyboard() {
    document.addEventListener(
      "keydown",
      (event) => {
        const key =
          event.key.toLowerCase();

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
          (event.ctrlKey ||
            event.metaKey) &&
          key === "s"
        ) {
          event.preventDefault();
          saveProject(true);
          return;
        }

        if (key === "f5") {
          event.preventDefault();
          setBottom("code");
          return;
        }

        if (
          event.key === "F4"
        ) {
          event.preventDefault();

          state.running
            ? stopGame()
            : startGame();

          return;
        }

        if (
          event.key === "Delete" &&
          !isTextField()
        ) {
          deleteSelected();
          return;
        }

        if (
          !isTextField()
        ) {
          if (key === "q") {
            setTool("select");
          }

          if (key === "w") {
            setTool("move");
          }

          if (key === "e") {
            setTool("rotate");
          }

          if (key === "r") {
            setTool("scale");
          }
        }

        if (
          event.key === "Escape"
        ) {
          closePublish();
          closeLocation();

          if (state.running) {
            stopGame();
          }
        }
      }
    );
  }

  function handleEditorKeydown(event) {
    if (
      event.key !== "Tab"
    ) {
      return;
    }

    event.preventDefault();

    const input =
      els.studioCodeEditor;

    const start =
      input.selectionStart;

    const end =
      input.selectionEnd;

    input.value =
      input.value.substring(
        0,
        start
      ) +
      "  " +
      input.value.substring(
        end
      );

    input.selectionStart =
      input.selectionEnd =
        start + 2;

    updateLineNumbers();
  }

  function isTextField() {
    const active =
      document.activeElement;

    if (!active) {
      return false;
    }

    return (
      active.tagName ===
        "INPUT" ||
      active.tagName ===
        "TEXTAREA" ||
      active.isContentEditable
    );
  }

  function handleMenu(menu) {
    switch (menu) {
      case "File":
        saveProject(true);
        break;

      case "Edit":
        toast(
          "Undo: Ctrl+Z   Redo: Ctrl+Shift+Z",
          "success"
        );
        break;

      case "Create":
        createObject("Cube");
        break;

      case "View":
        resetView();
        break;
    }
  }

  function setTool(tool) {
    state.tool =
      tool || "select";

    document
      .querySelectorAll(
        ".rail-tool[data-tool]"
      )
      .forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset.tool ===
            state.tool
        );
      });
  }

  function setBottom(bottom) {
    state.bottom =
      bottom || "ai";

    els.bottomTabs.forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.bottom ===
            state.bottom
        );
      }
    );

    els.bottomViews.forEach(
      (view) => {
        const target =
          state.bottom === "ai"
            ? "bottomAI"
            : state.bottom === "code"
            ? "bottomCode"
            : state.bottom ===
              "timeline"
            ? "bottomTimeline"
            : "bottomConsole";

        view.classList.toggle(
          "active",
          view.id === target
        );
      }
    );
  }

  function setMode(mode) {
    state.mode =
      mode === "4D"
        ? "4D"
        : "3D";

    state.project.mode =
      state.mode;

    els.mode3D?.classList.toggle(
      "active",
      state.mode === "3D"
    );

    els.mode4D?.classList.toggle(
      "active",
      state.mode === "4D"
    );

    if (
      state.mode === "4D"
    ) {
      setBottom("timeline");
    }

    refreshTimeline();
    saveProject(false);
  }

  /* ========================================================
     THREE
     ======================================================== */

  function loadThree() {
    return new Promise(
      (resolve) => {
        if (window.THREE) {
          resolve();
          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.min.js";

        script.onload =
          () => resolve();

        script.onerror =
          () => resolve();

        document.head.appendChild(
          script
        );
      }
    );
  }

  function setupThree() {
    if (
      !window.THREE ||
      !els.viewport
    ) {
      showFallbackViewport();
      return;
    }

    const THREE =
      window.THREE;

    state.scene =
      new THREE.Scene();

    state.scene.background =
      new THREE.Color(
        0x080b0f
      );

    state.camera =
      new THREE.PerspectiveCamera(
        55,
        1,
        0.1,
        5000
      );

    state.camera.position.set(
      22,
      17,
      24
    );

    state.camera.lookAt(
      0,
      0,
      0
    );

    state.renderer =
      new THREE.WebGLRenderer({
        antialias: true
      });

    state.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio ||
          1,
        2
      )
    );

    state.renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    els.viewport.innerHTML = "";

    els.viewport.appendChild(
      state.renderer.domElement
    );

    state.raycaster =
      new THREE.Raycaster();

    state.mouse =
      new THREE.Vector2();

    const ambient =
      new THREE.HemisphereLight(
        0xd8e6ff,
        0x14171b,
        2
      );

    state.scene.add(
      ambient
    );

    const light =
      new THREE.DirectionalLight(
        0xffffff,
        2.2
      );

    light.position.set(
      20,
      35,
      10
    );

    state.scene.add(
      light
    );

    state.grid =
      new THREE.GridHelper(
        500,
        50,
        0x3e4a56,
        0x202932
      );

    state.scene.add(
      state.grid
    );

    window.addEventListener(
      "resize",
      resizeViewport
    );

    state.renderer.domElement.addEventListener(
      "pointerdown",
      handleViewportClick
    );

    resizeViewport();

    renderLoop();
  }

  function showFallbackViewport() {
    if (
      !els.viewportHint
    ) {
      return;
    }

    els.viewportHint.style.display =
      "flex";

    els.viewportHint.innerHTML =
      "<strong>RiseUp Studio</strong><span>3D engine unavailable. Reload to try again.</span>";
  }

  function resizeViewport() {
    if (
      !state.renderer ||
      !state.camera ||
      !els.viewport
    ) {
      return;
    }

    const width =
      Math.max(
        1,
        els.viewport.clientWidth
      );

    const height =
      Math.max(
        1,
        els.viewport.clientHeight
      );

    state.renderer.setSize(
      width,
      height,
      false
    );

    state.camera.aspect =
      width / height;

    state.camera.updateProjectionMatrix();
  }

  function renderLoop() {
    if (
      state.renderer &&
      state.scene &&
      state.camera
    ) {
      state.renderer.render(
        state.scene,
        state.camera
      );
    }

    state.animationFrame =
      requestAnimationFrame(
        renderLoop
      );
  }

  function rebuildScene() {
    if (
      !state.scene ||
      !window.THREE
    ) {
      return;
    }

    state.meshes.forEach(
      (mesh) => {
        state.scene.remove(
          mesh
        );

        disposeMesh(mesh);
      }
    );

    state.meshes.clear();

    state.project.objects.forEach(
      (object) => {
        const mesh =
          makeMesh(object);

        if (!mesh) {
          return;
        }

        state.scene.add(
          mesh
        );

        state.meshes.set(
          object.id,
          mesh
        );

        applyVisibility(
          object,
          mesh
        );
      }
    );

    updateSelectionVisual();

    if (
      els.viewportHint
    ) {
      els.viewportHint.style.display =
        state.project.objects.length
          ? "none"
          : "flex";
    }
  }

  function makeMesh(object) {
    const THREE =
      window.THREE;

    let geometry;

    switch (
      String(object.type)
        .toLowerCase()
    ) {
      case "sphere":
        geometry =
          new THREE.SphereGeometry(
            1,
            32,
            20
          );
        break;

      case "cylinder":
        geometry =
          new THREE.CylinderGeometry(
            1,
            1,
            2,
            32
          );
        break;

      case "wedge":
        geometry =
          makeWedgeGeometry();
        break;

      case "spawn":
        geometry =
          new THREE.CylinderGeometry(
            1,
            1,
            0.25,
            32
          );
        break;

      case "light":
        geometry =
          new THREE.SphereGeometry(
            0.35,
            16,
            12
          );
        break;

      default:
        geometry =
          new THREE.BoxGeometry(
            2,
            2,
            2
          );
    }

    const material =
      new THREE.MeshStandardMaterial({
        color:
          object.color,
        roughness:
          0.72,
        metalness:
          0.08
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    mesh.position.set(
      object.position.x,
      object.position.y,
      object.position.z
    );

    mesh.rotation.set(
      radians(
        object.rotation.x
      ),
      radians(
        object.rotation.y
      ),
      radians(
        object.rotation.z
      )
    );

    mesh.scale.set(
      object.scale.x,
      object.scale.y,
      object.scale.z
    );

    mesh.userData.riseId =
      object.id;

    return mesh;
  }

  function makeWedgeGeometry() {
    const THREE =
      window.THREE;

    const vertices =
      new Float32Array([
        -1,-1,-1,
         1,-1,-1,
         1,-1, 1,

        -1,-1,-1,
         1,-1, 1,
        -1,-1, 1,

        -1,-1,-1,
         1,-1,-1,
         1, 1,-1,

        -1,-1,-1,
         1, 1,-1,
        -1, 1,-1,

        -1,-1, 1,
         1,-1, 1,
         1, 1,-1,

        -1,-1, 1,
         1, 1,-1,
        -1, 1,-1,

         1,-1,-1,
         1,-1, 1,
         1, 1,-1,

        -1,-1,-1,
        -1,-1, 1,
        -1, 1,-1
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

  function disposeMesh(mesh) {
    mesh.traverse(
      (child) => {
        child.geometry?.dispose();

        if (
          child.material
        ) {
          if (
            Array.isArray(
              child.material
            )
          ) {
            child.material.forEach(
              (material) =>
                material.dispose()
            );
          } else {
            child.material.dispose();
          }
        }
      }
    );
  }

  /* ========================================================
     VIEWPORT
     ======================================================== */

  function handleViewportClick(event) {
    if (
      state.running ||
      !state.raycaster ||
      !state.camera ||
      !state.renderer
    ) {
      return;
    }

    const rect =
      state.renderer
        .domElement
        .getBoundingClientRect();

    state.mouse.x =
      ((event.clientX -
        rect.left) /
        rect.width) *
        2 -
      1;

    state.mouse.y =
      -(
        (event.clientY -
          rect.top) /
        rect.height
      ) *
        2 +
      1;

    state.raycaster.setFromCamera(
      state.mouse,
      state.camera
    );

    const hits =
      state.raycaster.intersectObjects(
        [...state.meshes.values()],
        false
      );

    if (!hits.length) {
      selectObject(null);
      return;
    }

    selectObject(
      hits[0].object
        .userData.riseId
    );
  }

  function selectObject(id) {
    state.selectedId =
      id || null;

    updateSelectionVisual();
    renderExplorer();
    renderInspector();

    const object =
      getSelectedObject();

    if (
      els.selectionLabel
    ) {
      els.selectionLabel.textContent =
        object
          ? object.name
          : "Nothing Selected";
    }
  }

  function updateSelectionVisual() {
    state.meshes.forEach(
      (mesh, id) => {
        if (
          !mesh.material
        ) {
          return;
        }

        if (
          "emissive" in
          mesh.material
        ) {
          mesh.material.emissive.set(
            id ===
              state.selectedId
              ? 0x174d7d
              : 0x000000
          );

          mesh.material.emissiveIntensity =
            id ===
            state.selectedId
              ? 1
              : 0;
        }
      }
    );
  }

  function frameSelected() {
    const object =
      getSelectedObject();

    if (!object) {
      resetView();
      return;
    }

    if (!state.camera) {
      return;
    }

    state.camera.position.set(
      object.position.x + 10,
      object.position.y + 8,
      object.position.z + 10
    );

    state.camera.lookAt(
      object.position.x,
      object.position.y,
      object.position.z
    );
  }

  function resetView() {
    if (!state.camera) {
      return;
    }

    state.camera.position.set(
      22,
      17,
      24
    );

    state.camera.lookAt(
      0,
      0,
      0
    );
  }

  /* ========================================================
     OBJECTS
     ======================================================== */

  function makeObject(
    type,
    options = {}
  ) {
    return normalizeObject({
      id:
        options.id ||
        makeId(
          String(type).toLowerCase()
        ),

      type,

      name:
        options.name ||
        `${type} ${
          countType(type) + 1
        }`,

      position:
        options.position ||
        { ...state.player },

      rotation:
        options.rotation ||
        { x: 0, y: 0, z: 0 },

      scale:
        options.scale ||
        { x: 1, y: 1, z: 1 },

      color:
        options.color ||
        defaultColor(type),

      visible:
        options.visible !== undefined
          ? options.visible
          : true,

      createdAt:
        options.createdAt ??
        state.timeline.time,

      hiddenAt:
        options.hiddenAt ??
        null
    });
  }

  function createObject(
    type,
    options = {}
  ) {
    const object =
      makeObject(
        type,
        options
      );

    state.project.objects.push(
      object
    );

    state.selectedId =
      object.id;

    rebuildScene();
    renderEverything();

    pushHistory();
    saveProject(false);

    consoleLog(
      `Created ${object.name}.`
    );

    return object;
  }

  function deleteSelected() {
    if (
      !state.selectedId
    ) {
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
    renderEverything();

    pushHistory();
    saveProject(false);

    consoleLog(
      `Deleted ${object.name}.`
    );
  }

  function countType(type) {
    return state.project.objects.filter(
      (object) =>
        object.type
          .toLowerCase() ===
        String(type)
          .toLowerCase()
    ).length;
  }

  function defaultColor(type) {
    switch (
      String(type)
        .toLowerCase()
    ) {
      case "spawn":
        return "#35c978";

      case "sphere":
        return "#9b78ff";

      case "wedge":
        return "#ff9a62";

      case "cylinder":
        return "#4da3ff";

      case "light":
        return "#ffd96a";

      default:
        return "#4da3ff";
    }
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

  /* ========================================================
     EXPLORER
     ======================================================== */

  function renderExplorer() {
    if (
      !els.objectTree
    ) {
      return;
    }

    const query =
      (
        els.outlinerSearch?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    const objects =
      state.project.objects.filter(
        (object) => {
          if (!query) {
            return true;
          }

          return (
            object.name
              .toLowerCase()
              .includes(query) ||
            object.type
              .toLowerCase()
              .includes(query)
          );
        }
      );

    els.objectTree.innerHTML = "";

    if (!objects.length) {
      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "nothing-selected";

      empty.textContent =
        state.project.objects.length
          ? "No matching objects."
          : "No objects yet.";

      els.objectTree.appendChild(
        empty
      );
    }

    objects.forEach(
      (object) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "object-item";

        if (
          object.id ===
          state.selectedId
        ) {
          item.classList.add(
            "selected"
          );
        }

        item.innerHTML = `
          <span style="width:18px;color:#4da3ff;">
            ${getObjectLetter(object.type)}
          </span>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(object.name)}
          </span>
          <span style="color:#58636e;font-size:8px;">
            ${escapeHtml(object.type)}
          </span>
        `;

        item.addEventListener(
          "click",
          () =>
            selectObject(
              object.id
            )
        );

        els.objectTree.appendChild(
          item
        );
      }
    );

    if (
      els.outlinerFooter
    ) {
      els.outlinerFooter.textContent =
        `${state.project.objects.length} ${
          state.project.objects.length ===
          1
            ? "object"
            : "objects"
        }`;
    }
  }

  function getObjectLetter(type) {
    switch (
      String(type).toLowerCase()
    ) {
      case "sphere":
        return "O";

      case "wedge":
        return "W";

      case "cylinder":
        return "C";

      case "light":
        return "L";

      case "spawn":
        return "S";

      default:
        return "P";
    }
  }

  /* ========================================================
     INSPECTOR
     ======================================================== */

  function renderInspector() {
    if (
      !els.propertiesContent
    ) {
      return;
    }

    const object =
      getSelectedObject();

    if (!object) {
      els.propertiesContent.innerHTML = `
        <div class="nothing-selected">
          <strong>Nothing Selected</strong>
          <span>Select an object to inspect it.</span>
        </div>
      `;

      return;
    }

    els.propertiesContent.innerHTML = `
      <div class="property-section">
        <div class="property-section-title">
          General
        </div>

        <div class="property-row">
          <div class="property-name">
            Name
          </div>

          <input
            class="property-input"
            data-edit="name"
            value="${escapeHtml(object.name)}"
          >
        </div>

        <div class="property-row">
          <div class="property-name">
            Type
          </div>

          <input
            class="property-input"
            value="${escapeHtml(object.type)}"
            disabled
          >
        </div>

        <div class="property-row">
          <div class="property-name">
            Visible
          </div>

          <input
            type="checkbox"
            data-edit="visible"
            ${object.visible ? "checked" : ""}
          >
        </div>
      </div>

      <div class="property-section">
        <div class="property-section-title">
          Position
        </div>

        ${vectorEditor(
          "position",
          object.position
        )}
      </div>

      <div class="property-section">
        <div class="property-section-title">
          Rotation
        </div>

        ${vectorEditor(
          "rotation",
          object.rotation
        )}
      </div>

      <div class="property-section">
        <div class="property-section-title">
          Scale
        </div>

        ${vectorEditor(
          "scale",
          object.scale
        )}
      </div>

      <div class="property-section">
        <div class="property-section-title">
          Appearance
        </div>

        <div class="property-row">
          <div class="property-name">
            Color
          </div>

          <input
            class="property-input"
            data-edit="color"
            value="${escapeHtml(object.color)}"
          >
        </div>
      </div>

      <div class="property-section">
        <div class="property-section-title">
          4D
        </div>

        <div class="property-row">
          <div class="property-name">
            Created
          </div>

          <input
            class="property-input"
            type="number"
            step="0.01"
            data-edit="createdAt"
            value="${object.createdAt}"
          >
        </div>

        <div class="property-row">
          <div class="property-name">
            Disappear
          </div>

          <input
            class="property-input"
            type="number"
            step="0.01"
            data-edit="hiddenAt"
            value="${
              object.hiddenAt ??
              ""
            }"
          >
        </div>
      </div>

      <div style="padding:10px;">
        <button
          id="inspectorDelete"
          type="button"
          class="top-actions danger"
          style="width:100%;height:31px;"
        >
          Delete Object
        </button>
      </div>
    `;

    els.propertiesContent
      .querySelectorAll(
        "[data-edit]"
      )
      .forEach(
        (input) => {
          input.addEventListener(
            "change",
            () =>
              applyInspectorEdit(
                input
              )
          );
        }
      );

    els.propertiesContent
      .querySelectorAll(
        "[data-vector]"
      )
      .forEach(
        (input) => {
          input.addEventListener(
            "change",
            () =>
              applyVectorEdit(
                input
              )
          );
        }
      );

    document
      .getElementById(
        "inspectorDelete"
      )
      ?.addEventListener(
        "click",
        deleteSelected
      );
  }

  function vectorEditor(
    property,
    vectorValue
  ) {
    return `
      <div class="property-row">
        <div class="property-name">
          XYZ
        </div>

        <div class="vector-inputs">
          <input
            class="property-input"
            data-vector="${property}"
            data-axis="x"
            value="${vectorValue.x}"
          >

          <input
            class="property-input"
            data-vector="${property}"
            data-axis="y"
            value="${vectorValue.y}"
          >

          <input
            class="property-input"
            data-vector="${property}"
            data-axis="z"
            value="${vectorValue.z}"
          >
        </div>
      </div>
    `;
  }

  function applyInspectorEdit(
    input
  ) {
    const object =
      getSelectedObject();

    if (!object) {
      return;
    }

    const property =
      input.dataset.edit;

    if (
      property === "name"
    ) {
      object.name =
        input.value.trim() ||
        object.type;
    }

    if (
      property === "visible"
    ) {
      object.visible =
        input.checked;
    }

    if (
      property === "color"
    ) {
      object.color =
        normalizeColor(
          input.value
        );
    }

    if (
      property === "createdAt"
    ) {
      object.createdAt =
        numberOr(
          input.value,
          0
        );
    }

    if (
      property === "hiddenAt"
    ) {
      object.hiddenAt =
        input.value === ""
          ? null
          : numberOr(
              input.value,
              null
            );
    }

    applyObjectToMesh(
      object
    );

    pushHistory();
    saveProject(false);
    renderEverything();
  }

  function applyVectorEdit(
    input
  ) {
    const object =
      getSelectedObject();

    if (!object) {
      return;
    }

    const property =
      input.dataset.vector;

    const axis =
      input.dataset.axis;

    object[property][axis] =
      numberOr(
        input.value,
        0
      );

    applyObjectToMesh(
      object
    );

    pushHistory();
    saveProject(false);
    renderEverything();
  }

  function applyObjectToMesh(
    object
  ) {
    const mesh =
      state.meshes.get(
        object.id
      );

    if (!mesh) {
      return;
    }

    mesh.position.set(
      object.position.x,
      object.position.y,
      object.position.z
    );

    mesh.rotation.set(
      radians(
        object.rotation.x
      ),
      radians(
        object.rotation.y
      ),
      radians(
        object.rotation.z
      )
    );

    mesh.scale.set(
      object.scale.x,
      object.scale.y,
      object.scale.z
    );

    if (
      mesh.material?.color
    ) {
      mesh.material.color.set(
        object.color
      );
    }

    applyVisibility(
      object,
      mesh
    );
  }

  /* ========================================================
     4D
     ======================================================== */

  function refreshTimeline() {
    if (
      els.timelineTime
    ) {
      els.timelineTime.textContent =
        `${state.timeline.time.toFixed(2)}s`;
    }

    if (
      els.timelineSlider
    ) {
      els.timelineSlider.value =
        state.timeline.time;
    }

    state.meshes.forEach(
      (mesh, id) => {
        const object =
          state.project.objects.find(
            (item) =>
              item.id === id
          );

        if (object) {
          applyVisibility(
            object,
            mesh
          );
        }
      }
    );

    renderTimelineObjects();
  }

  function setTimeline(time) {
    state.timeline.time =
      Math.max(
        0,
        Math.min(
          state.timeline.max,
          Number(time) || 0
        )
      );

    refreshTimeline();
  }

  function toggleTimeline() {
    if (
      state.timeline.playing
    ) {
      pauseTimeline();
      return;
    }

    state.timeline.playing =
      true;

    els.timelinePlay.textContent =
      "Pause";

    const start =
      performance.now() -
      state.timeline.time * 1000;

    const tick =
      (now) => {
        if (
          !state.timeline.playing
        ) {
          return;
        }

        let time =
          (now - start) /
          1000;

        if (
          time >
          state.timeline.max
        ) {
          time = 0;
        }

        state.timeline.time =
          time;

        refreshTimeline();

        state.timelineFrame =
          requestAnimationFrame(
            tick
          );
      };

    state.timelineFrame =
      requestAnimationFrame(
        tick
      );
  }

  function pauseTimeline() {
    state.timeline.playing =
      false;

    if (
      state.timelineFrame
    ) {
      cancelAnimationFrame(
        state.timelineFrame
      );
    }

    if (
      els.timelinePlay
    ) {
      els.timelinePlay.textContent =
        "Play";
    }
  }

  function applyVisibility(
    object,
    mesh
  ) {
    const time =
      state.timeline.time;

    const before =
      time <
      object.createdAt;

    const after =
      object.hiddenAt !== null &&
      time >= object.hiddenAt;

    mesh.visible =
      object.visible &&
      !before &&
      !after;
  }

  function renderTimelineObjects() {
    if (
      !els.timelineObjects
    ) {
      return;
    }

    els.timelineObjects.innerHTML = "";

    state.project.objects.forEach(
      (object) => {
        const row =
          document.createElement(
            "div"
          );

        row.style.cssText =
          "height:24px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;position:relative;padding-left:8px;color:#89939e;font-size:9px;";

        const title =
          document.createElement(
            "span"
          );

        title.textContent =
          object.name;

        row.appendChild(
          title
        );

        if (
          object.createdAt <=
          state.timeline.max
        ) {
          const start =
            document.createElement(
              "span"
            );

          start.textContent =
            `  ${object.createdAt.toFixed(1)}s`;

          start.style.cssText =
            "margin-left:auto;color:#4da3ff;padding-right:8px;";

          row.appendChild(
            start
          );
        }

        if (
          object.hiddenAt !==
          null
        ) {
          const end =
            document.createElement(
              "span"
            );

          end.textContent =
            `→ ${object.hiddenAt.toFixed(1)}s`;

          end.style.cssText =
            "color:#e35d5d;padding-right:8px;";

          row.appendChild(
            end
          );
        }

        els.timelineObjects.appendChild(
          row
        );
      }
    );
  }

  /* ========================================================
     RISECODE
     ======================================================== */

  function updateLineNumbers() {
    if (
      !els.studioCodeEditor ||
      !els.studioLineNumbers
    ) {
      return;
    }

    const lines =
      els.studioCodeEditor.value
        .split("\n")
        .length;

    els.studioLineNumbers.innerHTML =
      Array.from(
        {
          length: lines
        },
        (_, index) =>
          index + 1
      ).join("<br>");
  }

  function saveCode() {
    state.project.code =
      els.studioCodeEditor?.value ||
      "";

    pushHistory();
    saveProject(true);

    consoleLog(
      "RiseCode saved."
    );
  }

  function runCode() {
    const code =
      els.studioCodeEditor?.value ||
      "";

    state.project.code =
      code;

    const result =
      executeRiseCode(code);

    renderEverything();

    if (
      result.errors.length
    ) {
      result.errors.forEach(
        (error) =>
          consoleLog(
            error,
            "error"
          )
      );

      toast(
        "RiseCode has errors.",
        "error"
      );

      return;
    }

    pushHistory();
    saveProject(false);

    toast(
      `RiseCode ran: ${result.executed} statement${
        result.executed === 1
          ? ""
          : "s"
      }.`,
      "success"
    );
  }

  function executeRiseCode(code) {
    const lines =
      code.split(/\r?\n/);

    const errors = [];

    let executed = 0;

    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      const raw =
        lines[i].trim();

      if (
        !raw ||
        raw.startsWith("//")
      ) {
        continue;
      }

      try {
        if (
          /^game\.name\s*=/.test(
            raw
          )
        ) {
          const value =
            extractQuoted(raw);

          if (value !== null) {
            state.project.name =
              value;
          }

          executed++;
          continue;
        }

        if (
          /^game\.mode\s*=/.test(
            raw
          )
        ) {
          const value =
            extractQuoted(raw);

          if (
            value?.toUpperCase() ===
            "4D"
          ) {
            setMode("4D");
          } else {
            setMode("3D");
          }

          executed++;
          continue;
        }

        if (
          /^add\.mesh\./.test(
            raw
          )
        ) {
          const match =
            raw.match(
              /^add\.mesh\.([a-z]+)\s*\(\s*\)\s*;?$/i
            );

          if (!match) {
            throw new Error(
              `Unknown mesh syntax on line ${i + 1}.`
            );
          }

          const type =
            capitalize(
              match[1]
            );

          createObject(
            normalizeShapeType(
              type
            )
          );

          executed++;
          continue;
        }

        if (
          /^player\.walk\.speed\s*=/.test(
            raw
          )
        ) {
          executed++;
          continue;
        }

        if (
          /^player\.jump\.power\s*=/.test(
            raw
          )
        ) {
          executed++;
          continue;
        }

        if (
          /^world\.gravity\s*=/.test(
            raw
          )
        ) {
          executed++;
          continue;
        }

        if (
          /^map\.name\s*=/.test(
            raw
          )
        ) {
          executed++;
          continue;
        }

        if (
          /^color\./.test(
            raw
          )
        ) {
          executed++;
          continue;
        }

        throw new Error(
          `Unknown RiseCode on line ${i + 1}.`
        );
      } catch (error) {
        errors.push(
          error.message
        );
      }
    }

    syncProjectName();

    return {
      errors,
      executed
    };
  }

  /* ========================================================
     AI
     ======================================================== */

  function submitAI() {
    const prompt =
      els.aiInput?.value.trim();

    if (!prompt) {
      return;
    }

    addAIMessage(
      "You",
      prompt,
      true
    );

    els.aiInput.value = "";

    state.ai.waiting =
      true;

    const result =
      aiThink(prompt);

    state.ai.waiting =
      false;

    if (
      result.code
    ) {
      addAIMessage(
        "Rise AI",
        result.message,
        false,
        result.code
      );
    } else {
      addAIMessage(
        "Rise AI",
        result.message,
        false
      );
    }

    if (
      result.changed
    ) {
      pushHistory();
      saveProject(false);
      rebuildScene();
      renderEverything();
    }
  }

  function aiThink(prompt) {
    const text =
      prompt.trim();

    const lower =
      text.toLowerCase();

    const context =
      buildAIContext();

    /*
      The local assistant has two modes:

      1. World mode:
         Create/edit 3D + 4D objects.

      2. Coding mode:
         Generate or explain RiseCode.
    */

    if (
      /\b(debug|fix|error|broken)\b/.test(
        lower
      )
    ) {
      return aiDebug(text);
    }

    if (
      /\b(write|generate|make|create)\b/.test(
        lower
      ) &&
      /\b(code|risecode|script)\b/.test(
        lower
      )
    ) {
      return aiGenerateCode(text);
    }

    if (
      /\b(explain|what does|how does)\b/.test(
        lower
      ) &&
      /\b(code|risecode|script)\b/.test(
        lower
      )
    ) {
      return aiExplainCode(text);
    }

    if (
      /\bshow\b|\bbuild\b|\bcreate\b|\badd\b|\bmake\b|\bput\b|\bplace\b|\bspawn\b/.test(
        lower
      )
    ) {
      return aiWorldCommand(
        text,
        context
      );
    }

    if (
      /\bmove\b|\brotate\b|\bscale\b|\bresize\b|\bcolor\b|\brecolor\b|\bdelete\b|\bremove\b|\bhide\b|\bdisappear\b|\bvanish\b|\bvisible\b|\bshow\b/.test(
        lower
      )
    ) {
      return aiWorldCommand(
        text,
        context
      );
    }

    if (
      /\b4d\b|\btimeline\b|\bseconds\b|\bsecond\b|\btime\b/.test(
        lower
      )
    ) {
      return aiWorldCommand(
        text,
        context
      );
    }

    if (
      /\bwhat\b.*\bcan\b.*\byou\b|\bhelp\b|\bwhat can you do\b/.test(
        lower
      )
    ) {
      return {
        changed: false,
        message:
          "I'm Rise AI, the coding edition built into RiseUp Studio. I can understand your project, create and modify 3D worlds, work with 4D timelines, generate RiseCode, explain code, debug code, and turn natural-language instructions into game systems."
      };
    }

    return {
      changed: false,
      message:
        `I understand the current project: "${context.projectName}" with ${context.objectCount} object${context.objectCount === 1 ? "" : "s"}. Tell me what you want to build, code, change, debug, or explain.`
    };
  }

  function aiWorldCommand(
    prompt,
    context
  ) {
    const lower =
      prompt.toLowerCase();

    if (
      /\bdelete\b|\bremove\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(prompt);

      if (!object) {
        return {
          changed: false,
          message:
            "I couldn't tell which object you want removed. Give me its name, such as 'delete Cube 1'."
        };
      }

      deleteObject(
        object.id
      );

      return {
        changed: true,
        message:
          `Done. I removed ${object.name} from the world.`
      };
    }

    if (
      /\bhide\b|\bdisappear\b|\bvanish\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(prompt);

      if (!object) {
        return {
          changed: false,
          message:
            "Which object should disappear?"
        };
      }

      const time =
        extractTime(prompt);

      if (
        time !== null
      ) {
        object.hiddenAt =
          time;

        return {
          changed: true,
          message:
            `Done. ${object.name} will disappear at ${time.toFixed(2)} seconds.`
        };
      }

      object.visible =
        false;

      return {
        changed: true,
        message:
          `${object.name} is now hidden.`
      };
    }

    if (
      /\bshow\b|\bvisible\b|\bunhide\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(prompt);

      if (!object) {
        return {
          changed: false,
          message:
            "Which object should I show?"
        };
      }

      object.visible =
        true;

      object.hiddenAt =
        null;

      return {
        changed: true,
        message:
          `${object.name} is visible again.`
      };
    }

    if (
      /\bmove\b|\bput\b|\bplace\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(prompt) ||
        getSelectedObject();

      if (!object) {
        return {
          changed: false,
          message:
            "Tell me which object to move, or select one in the Explorer."
        };
      }

      const position =
        parsePosition(
          prompt
        );

      if (
        position
      ) {
        object.position =
          position;

        return {
          changed: true,
          message:
            `Moved ${object.name} to (${position.x}, ${position.y}, ${position.z}).`
        };
      }

      if (
        /\bwhere i'm standing\b|\bwhere i am\b|\bhere\b/.test(
          lower
        )
      ) {
        object.position = {
          ...state.player
        };

        return {
          changed: true,
          message:
            `Placed ${object.name} where the player is standing.`
        };
      }

      return {
        changed: false,
        message:
          "Tell me a location like 'move the cube to x 10 y 5 z 20' or say 'move it where I'm standing'."
      };
    }

    if (
      /\brotate\b|\bturn\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(prompt) ||
        getSelectedObject();

      if (!object) {
        return {
          changed: false,
          message:
            "Select the object you want rotated."
        };
      }

      const amount =
        extractNumber(
          prompt
        ) ?? 90;

      if (
        /\bx\b/.test(
          lower
        )
      ) {
        object.rotation.x +=
          amount;
      } else if (
        /\bz\b/.test(
          lower
        )
      ) {
        object.rotation.z +=
          amount;
      } else {
        object.rotation.y +=
          amount;
      }

      return {
        changed: true,
        message:
          `Rotated ${object.name} by ${amount} degrees.`
      };
    }

    if (
      /\bscale\b|\bresize\b|\bbigger\b|\bsmaller\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(prompt) ||
        getSelectedObject();

      if (!object) {
        return {
          changed: false,
          message:
            "Select the object you want to resize."
        };
      }

      let amount =
        extractNumber(
          prompt
        );

      if (
        amount === null
      ) {
        amount =
          /\bsmaller\b/.test(
            lower
          )
            ? 0.5
            : 2;
      }

      object.scale = {
        x: amount,
        y: amount,
        z: amount
      };

      return {
        changed: true,
        message:
          `Scaled ${object.name} to ${amount}.`
      };
    }

    if (
      /\bcolor\b|\bcolour\b|\brecolor\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(prompt) ||
        getSelectedObject();

      const color =
        detectColor(
          lower
        );

      if (!object) {
        return {
          changed: false,
          message:
            "Select an object and tell me its new color."
        };
      }

      if (!color) {
        return {
          changed: false,
          message:
            "Tell me a color such as blue, red, green, purple, orange, or white."
        };
      }

      object.color =
        color;

      return {
        changed: true,
        message:
          `Changed ${object.name} to ${color}.`
      };
    }

    if (
      /\b4d\b|\btimeline\b|\bdisappear\b|\bappear\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(prompt);

      const time =
        extractTime(
          prompt
        );

      if (
        object &&
        /\bdisappear\b|\bvanish\b/.test(
          lower
        ) &&
        time !== null
      ) {
        object.hiddenAt =
          time;

        setMode("4D");

        return {
          changed: true,
          message:
            `4D enabled. ${object.name} disappears at ${time.toFixed(2)} seconds.`
        };
      }

      setMode("4D");

      if (
        time !== null
      ) {
        setTimeline(time);
      }

      return {
        changed: false,
        message:
          `4D mode is active at ${state.timeline.time.toFixed(2)} seconds.`
      };
    }

    const type =
      detectShape(
        lower
      );

    let position =
      parsePosition(
        prompt
      );

    if (
      !position &&
      /\bwhere i'm standing\b|\bwhere i am\b|\bhere\b/.test(
        lower
      )
    ) {
      position = {
        ...state.player
      };
    }

    if (!position) {
      position = {
        ...state.player
      };
    }

    const object =
      createObject(
        type,
        {
          position
        }
      );

    return {
      changed: true,
      message:
        `Done. I created ${object.name} at (${position.x}, ${position.y}, ${position.z}).`
    };
  }

  function aiGenerateCode(
    prompt
  ) {
    const lower =
      prompt.toLowerCase();

    let code = "";

    if (
      /\bobby\b|\bnpc\b/.test(
        lower
      )
    ) {
      code = [
        'npc.name = "Guard";',
        "npc.health = 100;",
        "npc.speed = 4;",
        'npc.behavior = "patrol";'
      ].join("\n");
    } else if (
      /\bweapon\b|\bgun\b|\bsword\b/.test(
        lower
      )
    ) {
      code = [
        'weapon.name = "Blaster";',
        "weapon.damage = 25;",
        "weapon.cooldown = 0.2;"
      ].join("\n");
    } else if (
      /\bui\b|\bmenu\b|\bbutton\b/.test(
        lower
      )
    ) {
      code = [
        'ui.create("MainMenu");',
        'ui.button("Play");',
        'ui.button("Settings");'
      ].join("\n");
    } else if (
      /\bmultiplayer\b|\bmulti player\b/.test(
        lower
      )
    ) {
      code = [
        "network.enabled = true;",
        "network.maxPlayers = 12;",
        'network.mode = "server-authoritative";'
      ].join("\n");
    } else if (
      /\bday\b|\bnight\b|\btime\b/.test(
        lower
      )
    ) {
      code = [
        "world.time.start = 0;",
        "world.time.speed = 1;",
        "world.time.cycle = true;"
      ].join("\n");
    } else {
      code = [
        'game.name = "My Game";',
        'game.mode = "3D";',
        "",
        "world.gravity = 25;",
        "player.walk.speed = 7;",
        "player.jump.power = 9;"
      ].join("\n");
    }

    setCodeFromAI(
      code
    );

    return {
      changed: true,
      code,
      message:
        "I generated RiseCode for that and placed it in the RiseCode editor."
    };
  }

  function aiExplainCode() {
    const code =
      els.studioCodeEditor?.value ||
      state.project.code;

    const lines =
      code
        .split("\n")
        .filter(
          (line) =>
            line.trim()
        );

    const explanations =
      lines
        .slice(0, 8)
        .map(
          (line) =>
            `${line.trim()}`
        );

    return {
      changed: false,
      message:
        `Your current RiseCode has ${lines.length} active line${lines.length === 1 ? "" : "s"}. I can explain each statement or rewrite the system in a cleaner way.\n\n${explanations.join("\n")}`
    };
  }

  function aiDebug() {
    const code =
      els.studioCodeEditor?.value ||
      "";

    const errors = [];

    const lines =
      code.split("\n");

    lines.forEach(
      (line, index) => {
        const trimmed =
          line.trim();

        if (
          !trimmed ||
          trimmed.startsWith(
            "//"
          )
        ) {
          return;
        }

        if (
          !trimmed.endsWith(";") &&
          !trimmed.endsWith("{") &&
          !trimmed.endsWith("}")
        ) {
          errors.push(
            `Line ${index + 1}: missing semicolon.`
          );
        }

        if (
          /^add\.mesh\./.test(
            trimmed
          ) &&
          !/^add\.mesh\.[a-z]+\(\);\s*$/i.test(
            trimmed
          )
        ) {
          errors.push(
            `Line ${index + 1}: mesh syntax should look like add.mesh.cube();`
          );
        }
      }
    );

    if (!errors.length) {
      return {
        changed: false,
        message:
          "I checked the current RiseCode and didn't find an obvious syntax problem in the statements I understand."
      };
    }

    return {
      changed: false,
      message:
        `I found ${errors.length} problem${errors.length === 1 ? "" : "s"}:\n${errors.join("\n")}`
    };
  }

  function buildAIContext() {
    return {
      projectName:
        state.project.name,

      mode:
        state.mode,

      objectCount:
        state.project.objects.length,

      selected:
        getSelectedObject()
          ?.name || null,

      objects:
        state.project.objects.map(
          (object) => ({
            name:
              object.name,
            type:
              object.type,
            position:
              object.position,
            color:
              object.color
          })
        ),

      code:
        els.studioCodeEditor
          ?.value ||
        state.project.code
    };
  }

  function addAIMessage(
    sender,
    message,
    user = false,
    code = ""
  ) {
    if (
      !els.aiMessages
    ) {
      return;
    }

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      `ai-message ${
        user
          ? "user"
          : "ai"
      }`;

    const title =
      document.createElement(
        "strong"
      );

    title.textContent =
      sender;

    const text =
      document.createElement(
        "p"
      );

    text.textContent =
      message;

    wrapper.appendChild(
      title
    );

    wrapper.appendChild(
      text
    );

    if (code) {
      const codeBox =
        document.createElement(
          "pre"
        );

      codeBox.style.cssText =
        "margin:8px 0 0;padding:10px;overflow:auto;background:#080b0f;border:1px solid #242b33;border-radius:4px;color:#dbe5ee;font-family:monospace;font-size:10px;line-height:1.5;white-space:pre;";

      codeBox.textContent =
        code;

      wrapper.appendChild(
        codeBox
      );
    }

    els.aiMessages.appendChild(
      wrapper
    );

    els.aiMessages.scrollTop =
      els.aiMessages.scrollHeight;
  }

  function setCodeFromAI(code) {
    state.project.code =
      code;

    if (
      els.studioCodeEditor
    ) {
      els.studioCodeEditor.value =
        code;
    }

    updateLineNumbers();
    setBottom("code");
  }

  /* ========================================================
     LOCATION / AI PLACEMENT
     ======================================================== */

  let pendingObjectType =
    null;

  function placePendingObject(
    location
  ) {
    if (
      !pendingObjectType
    ) {
      closeLocation();
      return;
    }

    let position;

    if (
      location ===
      "selected"
    ) {
      const selected =
        getSelectedObject();

      position =
        selected
          ? {
              ...selected.position
            }
          : {
              ...state.player
            };
    } else if (
      location === "origin"
    ) {
      position = {
        x: 0,
        y: 0,
        z: 0
      };
    } else {
      position = {
        ...state.player
      };
    }

    createObject(
      pendingObjectType,
      {
        position
      }
    );

    pendingObjectType =
      null;

    closeLocation();
  }

  function openLocation(
    type
  ) {
    pendingObjectType =
      type;

    els.locationModal?.classList.remove(
      "hidden"
    );
  }

  function closeLocation() {
    els.locationModal?.classList.add(
      "hidden"
    );

    pendingObjectType =
      null;
  }

  /* ========================================================
     PLAY
     ======================================================== */

  function startGame() {
    if (
      state.running
    ) {
      return;
    }

    state.running =
      true;

    document.body.classList.add(
      "play-mode"
    );

    els.playButton?.classList.add(
      "hidden"
    );

    els.stopButton?.classList.remove(
      "hidden"
    );

    els.playOverlay?.classList.remove(
      "hidden"
    );

    consoleLog(
      "Game started."
    );

    updateViewportHintForPlay();
  }

  function stopGame() {
    if (
      !state.running
    ) {
      return;
    }

    state.running =
      false;

    document.body.classList.remove(
      "play-mode"
    );

    els.playButton?.classList.remove(
      "hidden"
    );

    els.stopButton?.classList.add(
      "hidden"
    );

    els.playOverlay?.classList.add(
      "hidden"
    );

    consoleLog(
      "Game stopped."
    );
  }

  function updateViewportHintForPlay() {
    if (
      !els.viewportHint
    ) {
      return;
    }

    if (
      state.running
    ) {
      els.viewportHint.style.display =
        "none";
    }
  }

  /* ========================================================
     PUBLISH
     ======================================================== */

  function openPublish() {
    if (
      els.publishName
    ) {
      els.publishName.value =
        state.project.name;
    }

    if (
      els.publishDescription
    ) {
      els.publishDescription.value =
        state.project.description ||
        "";
    }

    els.publishModal?.classList.remove(
      "hidden"
    );
  }

  function closePublish() {
    els.publishModal?.classList.add(
      "hidden"
    );
  }

  function publishProject() {
    const name =
      els.publishName?.value.trim() ||
      state.project.name ||
      "Untitled Game";

    const description =
      els.publishDescription?.value.trim() ||
      "";

    state.project.name =
      name;

    state.project.description =
      description;

    saveProject(false);

    let games = [];

    try {
      games =
        JSON.parse(
          localStorage.getItem(
            GAMES_KEY
          ) ||
          "[]"
        );

      if (
        !Array.isArray(games)
      ) {
        games = [];
      }
    } catch {
      games = [];
    }

    const username =
      getUsername(
        state.user
      );

    const gameId =
      `${slugify(name)}-${username}`;

    const game = {
      id: gameId,
      name,
      title: name,
      description,
      creator:
        username,
      owner:
        username,
      projectOwner:
        username,
      objects:
        deepClone(
          state.project.objects
        ),
      code:
        state.project.code,
      mode:
        state.mode,
      updatedAt:
        new Date().toISOString()
    };

    const index =
      games.findIndex(
        (item) =>
          item.id === gameId
      );

    if (index >= 0) {
      games[index] =
        game;
    } else {
      games.push(
        game
      );
    }

    localStorage.setItem(
      GAMES_KEY,
      JSON.stringify(
        games
      )
    );

    closePublish();

    toast(
      `"${name}" published.`,
      "success"
    );

    consoleLog(
      `Published ${name}.`
    );
  }

  /* ========================================================
     DELETE PROJECT
     ======================================================== */

  function deleteProject() {
    const approved =
      window.confirm(
        "Delete this project? The Studio project will be reset."
      );

    if (!approved) {
      return;
    }

    localStorage.removeItem(
      getProjectKey()
    );

    localStorage.removeItem(
      PROJECT_KEY
    );

    state.project =
      normalizeProject(
        {
          ...defaultProject(),
          objects: []
        }
      );

    state.mode =
      "3D";

    state.selectedId =
      null;

    state.timeline.time =
      0;

    syncProjectName();
    rebuildScene();
    renderEverything();

    pushHistory();

    toast(
      "Project deleted and reset.",
      "success"
    );

    consoleLog(
      "Project reset."
    );
  }

  /* ========================================================
     RENDER EVERYTHING
     ======================================================== */

  function renderEverything() {
    syncProjectName();

    renderExplorer();
    renderInspector();
    refreshTimeline();

    updateSelectionVisual();

    if (
      els.selectionLabel
    ) {
      const object =
        getSelectedObject();

      els.selectionLabel.textContent =
        object
          ? object.name
          : "Nothing Selected";
    }

    els.mode3D?.classList.toggle(
      "active",
      state.mode === "3D"
    );

    els.mode4D?.classList.toggle(
      "active",
      state.mode === "4D"
    );

    updateLineNumbers();

    if (
      els.playButton &&
      els.stopButton
    ) {
      els.playButton.classList.toggle(
        "hidden",
        state.running
      );

      els.stopButton.classList.toggle(
        "hidden",
        !state.running
      );
    }
  }

  /* ========================================================
     CONSOLE
     ======================================================== */

  function consoleLog(
    message,
    type = "normal"
  ) {
    if (
      !els.consoleOutput
    ) {
      return;
    }

    const line =
      document.createElement(
        "div"
      );

    line.style.cssText =
      "padding:2px 0;";

    if (
      type === "error"
    ) {
      line.style.color =
        "#e35d5d";
    }

    if (
      type === "success"
    ) {
      line.style.color =
        "#35c978";
    }

    line.textContent =
      `[${new Date().toLocaleTimeString()}] ${message}`;

    els.consoleOutput.appendChild(
      line
    );

    els.consoleOutput.scrollTop =
      els.consoleOutput.scrollHeight;
  }

  /* ========================================================
     TOAST
     ======================================================== */

  function toast(
    message,
    type = "normal"
  ) {
    if (
      !els.toastContainer
    ) {
      return;
    }

    const element =
      document.createElement(
        "div"
      );

    element.className =
      `toast ${type}`;

    element.textContent =
      message;

    els.toastContainer.appendChild(
      element
    );

    setTimeout(
      () => {
        element.remove();
      },
      4000
    );
  }

  /* ========================================================
     HELPERS
     ======================================================== */

  function getCurrentUser() {
    try {
      const raw =
        localStorage.getItem(
          USER_KEY
        );

      if (!raw) {
        return "local";
      }

      try {
        return JSON.parse(
          raw
        );
      } catch {
        return raw;
      }
    } catch {
      return "local";
    }
  }

  function getUsername(user) {
    if (
      !user ||
      typeof user ===
        "string"
    ) {
      return (
        user ||
        "Creator"
      );
    }

    return (
      user.username ||
      user.displayName ||
      user.name ||
      user.user ||
      "Creator"
    );
  }

  function makeId(
    prefix
  ) {
    if (
      crypto?.randomUUID
    ) {
      return `${prefix}_${crypto.randomUUID()}`;
    }

    return (
      `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`
    );
  }

  function vector(
    value,
    fallback
  ) {
    return {
      x:
        numberOr(
          value?.x,
          fallback
        ),

      y:
        numberOr(
          value?.y,
          fallback
        ),

      z:
        numberOr(
          value?.z,
          fallback
        )
    };
  }

  function numberOr(
    value,
    fallback
  ) {
    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  }

  function radians(
    degrees
  ) {
    return (
      numberOr(
        degrees,
        0
      ) *
      Math.PI /
      180
    );
  }

  function normalizeColor(
    value
  ) {
    let color =
      String(
        value ||
          "#4da3ff"
      ).trim();

    if (
      !color.startsWith("#")
    ) {
      color =
        `#${color}`;
    }

    if (
      /^#[0-9a-f]{3}$/i.test(
        color
      )
    ) {
      return (
        "#" +
        color[1] +
        color[1] +
        color[2] +
        color[2] +
        color[3] +
        color[3]
      ).toLowerCase();
    }

    if (
      /^#[0-9a-f]{6}$/i.test(
        color
      )
    ) {
      return color.toLowerCase();
    }

    return "#4da3ff";
  }

  function deepClone(
    value
  ) {
    return JSON.parse(
      JSON.stringify(
        value
      )
    );
  }

  function escapeHtml(
    value
  ) {
    return String(
      value
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  function extractQuoted(
    line
  ) {
    const match =
      line.match(
        /"([^"]*)"|'([^']*)'/
      );

    return match
      ? match[1] ??
          match[2] ??
          null
      : null;
  }

  function capitalize(
    value
  ) {
    return (
      value.charAt(0)
        .toUpperCase() +
      value.slice(1)
    );
  }

  function normalizeShapeType(
    value
  ) {
    const lower =
      value.toLowerCase();

    if (
      lower === "cube" ||
      lower === "part"
    ) {
      return "Cube";
    }

    if (
      lower === "wedge"
    ) {
      return "Wedge";
    }

    if (
      lower === "sphere"
    ) {
      return "Sphere";
    }

    if (
      lower === "cylinder"
    ) {
      return "Cylinder";
    }

    if (
      lower === "light"
    ) {
      return "Light";
    }

    if (
      lower === "spawn"
    ) {
      return "Spawn";
    }

    return "Cube";
  }

  function detectShape(
    text
  ) {
    if (
      /\bwedge\b/.test(
        text
      )
    ) {
      return "Wedge";
    }

    if (
      /\bsphere\b|\bball\b/.test(
        text
      )
    ) {
      return "Sphere";
    }

    if (
      /\bcylinder\b/.test(
        text
      )
    ) {
      return "Cylinder";
    }

    if (
      /\blight\b/.test(
        text
      )
    ) {
      return "Light";
    }

    if (
      /\bspawn\b/.test(
        text
      )
    ) {
      return "Spawn";
    }

    return "Cube";
  }

  function findAIObject(
    prompt
  ) {
    const lower =
      prompt.toLowerCase();

    const objects =
      [...state.project.objects]
        .sort(
          (a, b) =>
            b.name.length -
            a.name.length
        );

    return (
      objects.find(
        (object) =>
          lower.includes(
            object.name.toLowerCase()
          )
      ) ||
      objects.find(
        (object) =>
          lower.includes(
            object.type.toLowerCase()
          )
      ) ||
      null
    );
  }

  function extractNumber(
    text
  ) {
    const match =
      text.match(
        /-?\d+(?:\.\d+)?/
      );

    return match
      ? Number(match[0])
      : null;
  }

  function extractTime(
    text
  ) {
    const match =
      text.match(
        /(-?\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i
      );

    if (match) {
      return Math.max(
        0,
        Math.min(
          state.timeline.max,
          Number(match[1])
        )
      );
    }

    return null;
  }

  function parsePosition(
    text
  ) {
    const xyz =
      text.match(
        /x\s*(-?\d+(?:\.\d+)?)\s*(?:,|and)?\s*y\s*(-?\d+(?:\.\d+)?)\s*(?:,|and)?\s*z\s*(-?\d+(?:\.\d+)?)/i
      );

    if (xyz) {
      return {
        x: Number(
          xyz[1]
        ),
        y: Number(
          xyz[2]
        ),
        z: Number(
          xyz[3]
        )
      };
    }

    const position =
      text.match(
        /(?:at|to|position)\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i
      );

    if (position) {
      return {
        x: Number(
          position[1]
        ),
        y: Number(
          position[2]
        ),
        z: Number(
          position[3]
        )
      };
    }

    return null;
  }

  function detectColor(
    text
  ) {
    const colors = {
      red: "#ff4d4d",
      green: "#35c978",
      blue: "#4da3ff",
      yellow: "#ffd34d",
      orange: "#ff914d",
      purple: "#9b78ff",
      pink: "#ff72b7",
      white: "#ffffff",
      black: "#111111",
      gray: "#808890",
      grey: "#808890",
      cyan: "#4de1ff",
      brown: "#8b5a3c"
    };

    for (
      const [
        name,
        color
      ] of Object.entries(
        colors
      )
    ) {
      if (
        new RegExp(
          `\\b${name}\\b`,
          "i"
        ).test(text)
      ) {
        return color;
      }
    }

    const hex =
      text.match(
        /#[0-9a-f]{6}/i
      );

    return hex
      ? hex[0]
      : null;
  }

  function slugify(
    value
  ) {
    return String(
      value
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      || "game";
  }

  function updateSelectionFromData() {
    updateSelectionVisual();
  }
})();
