(() => {
  "use strict";

  const USER_KEY = "riseup_currentUser";
  const PROJECT_KEY = "riseup_studio_project";
  const GAMES_KEY = "riseup_games";

  const state = {
    user: null,

    project: {
      name: "Untitled Game",
      description: "",
      mode: "3D",
      code: "",
      objects: []
    },

    selectedId: null,
    tool: "select",
    bottom: "ai",
    mode: "3D",

    running: false,

    player: {
      x: 0,
      y: 2,
      z: 6
    },

    timeline: {
      time: 0,
      max: 120,
      playing: false
    },

    history: [],
    historyIndex: -1,

    scene: null,
    camera: null,
    renderer: null,
    raycaster: null,
    mouse: null,

    meshes: new Map(),

    world: {
      ground: null,
      sky: null,
      sun: null,
      ambient: null,
      spawnMarker: null,
      playerMarker: null,
      grid: null
    },

    animationFrame: null,
    timelineFrame: null
  };

  const els = {};

  let pendingLocationType = null;

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

  /* ========================================================
     INIT
     ======================================================== */

  async function init() {
    try {
      state.user = getCurrentUser();

      cacheElements();
      loadProject();

      bindUI();
      bindKeyboard();

      setBottom("ai");
      syncProjectUI();

      await loadThree();

      setupThree();
      buildWorld();

      rebuildScene();
      renderEverything();

      pushHistory();

      addAIMessage(
        "Rise AI",
        "I'm ready. Tell me what you want to build. I can create and edit your 3D world, work with 4D time, write RiseCode, explain code, and debug it."
      );

      consoleLog(
        "RiseUp Studio ready.",
        "success"
      );
    } catch (error) {
      console.error(error);

      consoleLog(
        `Studio startup error: ${error.message}`,
        "error"
      );

      toast(
        "Studio started with an error. Check the Console.",
        "error"
      );
    }
  }

  /* ========================================================
     ELEMENT CACHE
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
      document.getElementById(
        "deleteProjectButton"
      );

    els.playButton =
      document.getElementById("playButton");

    els.stopButton =
      document.getElementById("stopButton");

    els.viewport =
      document.getElementById("viewport");

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
      document.getElementById(
        "resetViewButton"
      );

    els.selectionLabel =
      document.getElementById(
        "selectionLabel"
      );

    els.bottomTabs =
      document.querySelectorAll(
        ".bottom-tab"
      );

    els.bottomViews =
      document.querySelectorAll(
        ".bottom-view"
      );

    els.aiMessages =
      document.getElementById("aiMessages");

    els.aiInput =
      document.getElementById("aiInput");

    els.aiSend =
      document.getElementById("aiSend");

    els.studioCodeEditor =
      document.getElementById(
        "studioCodeEditor"
      );

    els.studioLineNumbers =
      document.getElementById(
        "studioLineNumbers"
      );

    els.codeSaveButton =
      document.getElementById(
        "codeSaveButton"
      );

    els.codeRunButton =
      document.getElementById(
        "codeRunButton"
      );

    els.timelineTime =
      document.getElementById(
        "timelineTime"
      );

    els.timelineBack =
      document.getElementById(
        "timelineBack"
      );

    els.timelinePlay =
      document.getElementById(
        "timelinePlay"
      );

    els.timelineForward =
      document.getElementById(
        "timelineForward"
      );

    els.timelineReset =
      document.getElementById(
        "timelineReset"
      );

    els.timelineSlider =
      document.getElementById(
        "timelineSlider"
      );

    els.timelineObjects =
      document.getElementById(
        "timelineObjects"
      );

    els.consoleOutput =
      document.getElementById(
        "consoleOutput"
      );

    els.refreshExplorer =
      document.getElementById(
        "refreshExplorer"
      );

    els.outlinerSearch =
      document.getElementById(
        "outlinerSearch"
      );

    els.objectTree =
      document.getElementById(
        "objectTree"
      );

    els.outlinerFooter =
      document.getElementById(
        "outlinerFooter"
      );

    els.propertiesContent =
      document.getElementById(
        "propertiesContent"
      );

    els.publishModal =
      document.getElementById(
        "publishModal"
      );

    els.closePublish =
      document.getElementById(
        "closePublish"
      );

    els.cancelPublish =
      document.getElementById(
        "cancelPublish"
      );

    els.confirmPublish =
      document.getElementById(
        "confirmPublish"
      );

    els.publishName =
      document.getElementById(
        "publishName"
      );

    els.publishDescription =
      document.getElementById(
        "publishDescription"
      );

    els.locationModal =
      document.getElementById(
        "locationModal"
      );

    els.cancelLocation =
      document.getElementById(
        "cancelLocation"
      );
  }

  /* ========================================================
     PROJECT
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
        return JSON.parse(raw);
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
      typeof user === "string"
    ) {
      return user || "Creator";
    }

    return (
      user.username ||
      user.displayName ||
      user.name ||
      user.user ||
      "Creator"
    );
  }

  function projectKey() {
    return `${PROJECT_KEY}_${getUsername(
      state.user
    )}`;
  }

  function getDefaultCode() {
    return [
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
    ].join("\n");
  }

  function defaultProject() {
    return {
      name: "Untitled Game",
      description: "",
      mode: "3D",
      code: getDefaultCode(),
      objects: [
        makeObject(
          "Spawn",
          "Player Spawn",
          {
            x: 0,
            y: 0,
            z: 6
          },
          "#35c978"
        )
      ]
    };
  }

  function loadProject() {
    const raw =
      localStorage.getItem(
        projectKey()
      ) ||
      localStorage.getItem(
        PROJECT_KEY
      );

    if (!raw) {
      state.project =
        normalizeProject(
          defaultProject()
        );

      return;
    }

    try {
      state.project =
        normalizeProject(
          JSON.parse(raw)
        );

      state.mode =
        state.project.mode;
    } catch {
      state.project =
        normalizeProject(
          defaultProject()
        );
    }
  }

  function normalizeProject(project) {
    const base =
      defaultProject();

    return {
      ...base,
      ...project,

      objects:
        Array.isArray(
          project?.objects
        )
          ? project.objects.map(
              normalizeObject
            )
          : base.objects,

      code:
        typeof project?.code ===
        "string"
          ? project.code
          : base.code,

      mode:
        project?.mode === "4D"
          ? "4D"
          : "3D"
    };
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
        normalizeVector(
          object.position,
          0
        ),

      rotation:
        normalizeVector(
          object.rotation,
          0
        ),

      scale:
        normalizeVector(
          object.scale,
          1
        ),

      color:
        normalizeColor(
          object.color ||
            "#4da3ff"
        ),

      visible:
        typeof object.visible ===
        "boolean"
          ? object.visible
          : true,

      createdAt:
        Number.isFinite(
          Number(
            object.createdAt
          )
        )
          ? Number(
              object.createdAt
            )
          : 0,

      hiddenAt:
        object.hiddenAt ===
          null ||
        object.hiddenAt ===
          undefined ||
        object.hiddenAt === ""
          ? null
          : Number(
              object.hiddenAt
            )
    };
  }

  function saveProject(
    showToast = true
  ) {
    state.project.name =
      els.projectName?.value.trim() ||
      state.project.name ||
      "Untitled Game";

    state.project.mode =
      state.mode;

    state.project.code =
      els.studioCodeEditor?.value ||
      state.project.code ||
      getDefaultCode();

    const data =
      JSON.stringify(
        state.project
      );

    try {
      localStorage.setItem(
        projectKey(),
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

      consoleLog(
        "Project saved.",
        "success"
      );
    } catch (error) {
      console.error(error);

      setSaveStatus(
        "Save failed"
      );

      toast(
        "Could not save the project.",
        "error"
      );
    }
  }

  function setSaveStatus(
    text
  ) {
    if (els.saveStatus) {
      els.saveStatus.textContent =
        text;
    }
  }

  function syncProjectUI() {
    if (els.projectName) {
      els.projectName.value =
        state.project.name;
    }

    if (
      els.studioCodeEditor
    ) {
      els.studioCodeEditor.value =
        state.project.code;
    }

    if (
      els.mode3D &&
      els.mode4D
    ) {
      els.mode3D.classList.toggle(
        "active",
        state.mode === "3D"
      );

      els.mode4D.classList.toggle(
        "active",
        state.mode === "4D"
      );
    }

    updateLineNumbers();
  }

  /* ========================================================
     HISTORY
     ======================================================== */

  function pushHistory() {
    const snapshot =
      JSON.stringify(
        state.project
      );

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

    state.history.push(
      snapshot
    );

    if (
      state.history.length > 100
    ) {
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

    restoreHistory(
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

    restoreHistory(
      state.history[
        state.historyIndex
      ]
    );
  }

  function restoreHistory(
    snapshot
  ) {
    try {
      state.project =
        normalizeProject(
          JSON.parse(
            snapshot
          )
        );

      state.mode =
        state.project.mode;

      state.selectedId =
        null;

      syncProjectUI();
      rebuildScene();
      renderEverything();
      saveProject(false);
    } catch {
      toast(
        "Could not restore that state.",
        "error"
      );
    }
  }

  /* ========================================================
     UI
     ======================================================== */

  function bindUI() {
    document
      .querySelectorAll(
        ".rail-tool[data-tool]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              setTool(
                button.dataset.tool
              );
            }
          );
        }
      );

    document
      .querySelectorAll(
        ".rail-tool[data-create]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              createObject(
                normalizeShapeType(
                  button.dataset.create
                )
              );
            }
          );
        }
      );

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

    if (els.aiSend) {
      els.aiSend.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          submitAI();
        }
      );
    }

    if (els.aiInput) {
      els.aiInput.addEventListener(
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
    }

    els.codeSaveButton?.addEventListener(
      "click",
      saveCode
    );

    els.codeRunButton?.addEventListener(
      "click",
      runCode
    );

    els.studioCodeEditor?.addEventListener(
      "input",
      () => {
        updateLineNumbers();
        setSaveStatus("Unsaved");
      }
    );

    els.studioCodeEditor?.addEventListener(
      "keydown",
      handleCodeTab
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

    els.timelineBack?.addEventListener(
      "click",
      () =>
        setTimeline(
          state.timeline.time - 1
        )
    );

    els.timelineForward?.addEventListener(
      "click",
      () =>
        setTimeline(
          state.timeline.time + 1
        )
    );

    els.timelineReset?.addEventListener(
      "click",
      () => setTimeline(0)
    );

    els.timelinePlay?.addEventListener(
      "click",
      toggleTimeline
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
      () =>
        setSaveStatus("Unsaved")
    );

    document
      .querySelectorAll(
        "[data-menu]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () =>
              handleMenu(
                button.dataset.menu
              )
          );
        }
      );

    document
      .querySelectorAll(
        "[data-location]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () =>
              placePendingObject(
                button.dataset.location
              )
          );
        }
      );
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

        if (
          event.key === "F5"
        ) {
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

        if (!isTextField()) {
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

          if (
            state.running
          ) {
            stopGame();
          }
        }
      }
    );
  }

  function handleCodeTab(event) {
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

    return (
      active?.tagName ===
        "INPUT" ||
      active?.tagName ===
        "TEXTAREA" ||
      active?.isContentEditable
    );
  }

  function handleMenu(
    menu
  ) {
    if (menu === "File") {
      saveProject(true);
    }

    if (menu === "Edit") {
      toast(
        "Ctrl+Z undo. Ctrl+Shift+Z redo.",
        "success"
      );
    }

    if (menu === "Create") {
      createObject("Cube");
    }

    if (menu === "View") {
      resetView();
    }
  }

  function setTool(
    tool
  ) {
    state.tool =
      tool;

    document
      .querySelectorAll(
        ".rail-tool[data-tool]"
      )
      .forEach(
        (button) => {
          button.classList.toggle(
            "active",
            button.dataset.tool ===
              tool
          );
        }
      );
  }

  function setBottom(
    bottom
  ) {
    state.bottom =
      bottom;

    els.bottomTabs.forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.bottom ===
            bottom
        );
      }
    );

    const targets = {
      ai: "bottomAI",
      code: "bottomCode",
      timeline:
        "bottomTimeline",
      console:
        "bottomConsole"
    };

    els.bottomViews.forEach(
      (view) => {
        view.classList.toggle(
          "active",
          view.id ===
            targets[bottom]
        );
      }
    );
  }

  function setMode(
    mode
  ) {
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
  }

  /* ========================================================
     THREE.JS
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
      showNoThree();
      return;
    }

    const THREE =
      window.THREE;

    state.scene =
      new THREE.Scene();

    state.scene.background =
      new THREE.Color(
        0x9ec6e7
      );

    state.scene.fog =
      new THREE.Fog(
        0x9ec6e7,
        80,
        380
      );

    state.camera =
      new THREE.PerspectiveCamera(
        60,
        1,
        0.1,
        2000
      );

    state.camera.position.set(
      16,
      10,
      18
    );

    state.camera.lookAt(
      0,
      2,
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

    state.renderer.shadowMap.enabled =
      true;

    state.renderer.shadowMap.type =
      THREE.PCFSoftShadowMap;

    els.viewport.innerHTML = "";

    els.viewport.appendChild(
      state.renderer.domElement
    );

    state.raycaster =
      new THREE.Raycaster();

    state.mouse =
      new THREE.Vector2();

    state.renderer.domElement.addEventListener(
      "pointerdown",
      handleViewportClick
    );

    window.addEventListener(
      "resize",
      resizeViewport
    );

    resizeViewport();

    if (els.viewportHint) {
      els.viewportHint.style.display =
        "none";
    }

    renderLoop();
  }

  function showNoThree() {
    if (!els.viewport) {
      return;
    }

    els.viewport.innerHTML = "";

    const message =
      document.createElement(
        "div"
      );

    message.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#89939e;font-size:13px;";

    message.textContent =
      "3D engine could not load. Reload the page.";

    els.viewport.appendChild(
      message
    );
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

  /* ========================================================
     ATMOSPHERE / WORLD
     ======================================================== */

  function buildWorld() {
    if (
      !state.scene ||
      !window.THREE
    ) {
      return;
    }

    const THREE =
      window.THREE;

    /*
      Ground
      */

    const groundGeometry =
      new THREE.BoxGeometry(
        500,
        2,
        500
      );

    const groundMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x45564a,
        roughness: 0.95,
        metalness: 0
      });

    state.world.ground =
      new THREE.Mesh(
        groundGeometry,
        groundMaterial
      );

    state.world.ground.position.y =
      -1;

    state.world.ground.receiveShadow =
      true;

    state.world.ground.userData.world =
      true;

    state.scene.add(
      state.world.ground
    );

    /*
      Sky dome
      */

    const skyGeometry =
      new THREE.SphereGeometry(
        900,
        32,
        20
      );

    const skyMaterial =
      new THREE.MeshBasicMaterial({
        color: 0x8dbce5,
        side:
          THREE.BackSide,
        fog: false
      });

    state.world.sky =
      new THREE.Mesh(
        skyGeometry,
        skyMaterial
      );

    state.scene.add(
      state.world.sky
    );

    /*
      Soft ambient light
      */

    state.world.ambient =
      new THREE.HemisphereLight(
        0xd9edff,
        0x394036,
        2.2
      );

    state.scene.add(
      state.world.ambient
    );

    /*
      Sun
      */

    state.world.sun =
      new THREE.DirectionalLight(
        0xfff0cb,
        3.2
      );

    state.world.sun.position.set(
      70,
      110,
      45
    );

    state.world.sun.castShadow =
      true;

    state.world.sun.shadow.mapSize.width =
      2048;

    state.world.sun.shadow.mapSize.height =
      2048;

    state.world.sun.shadow.camera.left =
      -120;

    state.world.sun.shadow.camera.right =
      120;

    state.world.sun.shadow.camera.top =
      120;

    state.world.sun.shadow.camera.bottom =
      -120;

    state.scene.add(
      state.world.sun
    );

    /*
      Grid
      */

    state.world.grid =
      new THREE.GridHelper(
        300,
        60,
        0x8aa08d,
        0x627266
      );

    state.world.grid.position.y =
      0.01;

    state.scene.add(
      state.world.grid
    );

    /*
      Player spawn marker
      */

    createPlayerMarker();

    /*
      Small environment props so
      the world doesn't feel empty.
      */

    createStarterEnvironment();
  }

  function createPlayerMarker() {
    if (
      !state.scene ||
      !window.THREE
    ) {
      return;
    }

    const THREE =
      window.THREE;

    const group =
      new THREE.Group();

    const ring =
      new THREE.Mesh(
        new THREE.RingGeometry(
          1.2,
          1.38,
          32
        ),
        new THREE.MeshBasicMaterial({
          color: 0x35c978,
          transparent: true,
          opacity: 0.9,
          side:
            THREE.DoubleSide
        })
      );

    ring.rotation.x =
      -Math.PI / 2;

    ring.position.y =
      0.04;

    const pole =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.05,
          0.05,
          2.5,
          10
        ),
        new THREE.MeshBasicMaterial({
          color: 0x35c978
        })
      );

    pole.position.y =
      1.25;

    group.position.set(
      state.player.x,
      0,
      state.player.z
    );

    group.add(
      ring
    );

    group.add(
      pole
    );

    state.world.playerMarker =
      group;

    state.scene.add(
      group
    );
  }

  function updatePlayerMarker() {
    if (
      !state.world.playerMarker
    ) {
      return;
    }

    state.world.playerMarker.position.set(
      state.player.x,
      0,
      state.player.z
    );
  }

  function createStarterEnvironment() {
    const props = [
      {
        type: "Cube",
        name: "Welcome Platform",
        position: {
          x: 0,
          y: 1,
          z: 0
        },
        scale: {
          x: 5,
          y: 0.5,
          z: 5
        },
        color: "#527ea3"
      },

      {
        type: "Cube",
        name: "North Platform",
        position: {
          x: 0,
          y: 1,
          z: -22
        },
        scale: {
          x: 4,
          y: 0.5,
          z: 4
        },
        color: "#566f62"
      },

      {
        type: "Cube",
        name: "East Platform",
        position: {
          x: 24,
          y: 1,
          z: 0
        },
        scale: {
          x: 4,
          y: 0.5,
          z: 4
        },
        color: "#6d6854"
      }
    ];

    props.forEach(
      (prop) => {
        if (
          state.project.objects.some(
            (object) =>
              object.name ===
              prop.name
          )
        ) {
          return;
        }

        state.project.objects.push(
          makeObject(
            prop.type,
            prop.name,
            prop.position,
            prop.color,
            prop.scale
          )
        );
      }
    );
  }

  /* ========================================================
     SCENE OBJECTS
     ======================================================== */

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

        applyObjectToMesh(
          object
        );
      }
    );

    updateSelectionVisual();
  }

  function makeMesh(
    object
  ) {
    const THREE =
      window.THREE;

    let geometry;

    const type =
      String(
        object.type
      ).toLowerCase();

    if (
      type === "sphere"
    ) {
      geometry =
        new THREE.SphereGeometry(
          1,
          32,
          20
        );
    } else if (
      type === "cylinder"
    ) {
      geometry =
        new THREE.CylinderGeometry(
          1,
          1,
          2,
          32
        );
    } else if (
      type === "wedge"
    ) {
      geometry =
        makeWedgeGeometry();
    } else if (
      type === "spawn"
    ) {
      geometry =
        new THREE.CylinderGeometry(
          1,
          1,
          0.25,
          32
        );
    } else if (
      type === "light"
    ) {
      geometry =
        new THREE.SphereGeometry(
          0.35,
          16,
          12
        );
    } else {
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
          0.8,
        metalness:
          0.04
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    mesh.castShadow =
      true;

    mesh.receiveShadow =
      true;

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

  function disposeMesh(
    mesh
  ) {
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
     VIEWPORT SELECT
     ======================================================== */

  function handleViewportClick(
    event
  ) {
    if (
      state.running ||
      !state.renderer ||
      !state.camera ||
      !state.raycaster
    ) {
      return;
    }

    const rect =
      state.renderer.domElement.getBoundingClientRect();

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

    const objects = [
      ...state.meshes.values()
    ];

    const hits =
      state.raycaster.intersectObjects(
        objects,
        false
      );

    if (!hits.length) {
      selectObject(null);
      return;
    }

    selectObject(
      hits[0].object.userData.riseId
    );
  }

  function selectObject(
    id
  ) {
    state.selectedId =
      id || null;

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

    updateSelectionVisual();
    renderExplorer();
    renderInspector();
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
            id === state.selectedId
              ? 0x184b78
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

    if (
      !state.camera
    ) {
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
    if (
      !state.camera
    ) {
      return;
    }

    state.camera.position.set(
      16,
      10,
      18
    );

    state.camera.lookAt(
      0,
      2,
      0
    );
  }

  /* ========================================================
     OBJECT CREATION
     ======================================================== */

  function makeObject(
    type,
    name,
    position,
    color,
    scale = {
      x: 1,
      y: 1,
      z: 1
    }
  ) {
    return normalizeObject({
      id:
        makeId(
          String(type)
            .toLowerCase()
        ),

      type,

      name,

      position,

      rotation: {
        x: 0,
        y: 0,
        z: 0
      },

      scale,

      color:

        color ||
        defaultColor(type),

      visible: true,

      createdAt:
        state.timeline.time,

      hiddenAt:
        null
    });
  }

  function createObject(
    type,
    options = {}
  ) {
    const finalType =
      normalizeShapeType(
        type
      );

    const object =
      makeObject(
        finalType,
        options.name ||
          `${finalType} ${
            countObjects(
              finalType
            ) + 1
          }`,
        options.position ||
          {
            x:
              state.player.x,
            y:
              1,
            z:
              state.player.z
          },
        options.color ||
          defaultColor(
            finalType
          ),
        options.scale || {
          x: 1,
          y: 1,
          z: 1
        }
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
      `Created ${object.name}.`,
      "success"
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

  function deleteObject(
    id
  ) {
    const index =
      state.project.objects.findIndex(
        (object) =>
          object.id === id
      );

    if (
      index === -1
    ) {
      return;
    }

    const object =
      state.project.objects[
        index
      ];

    state.project.objects.splice(
      index,
      1
    );

    state.selectedId =
      null;

    rebuildScene();
    renderEverything();

    pushHistory();
    saveProject(false);

    consoleLog(
      `Deleted ${object.name}.`,
      "success"
    );
  }

  function countObjects(
    type
  ) {
    return state.project.objects.filter(
      (object) =>
        object.type
          .toLowerCase() ===
        String(type)
          .toLowerCase()
    ).length;
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

    els.objectTree.innerHTML =
      "";

    objects.forEach(
      (object) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "object-item";

        item.classList.toggle(
          "selected",
          object.id ===
            state.selectedId
        );

        item.innerHTML = `
          <span style="width:20px;color:#4da3ff;font-weight:700;">
            ${getObjectLetter(object.type)}
          </span>

          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${escapeHtml(object.name)}
          </span>

          <span style="font-size:8px;color:#5f6974;">
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
      !objects.length
    ) {
      const empty =
        document.createElement(
          "div"
        );

      empty.style.cssText =
        "padding:15px;color:#5f6974;font-size:10px;text-align:center;";

      empty.textContent =
        state.project.objects.length
          ? "No matching objects."
          : "No objects yet.";

      els.objectTree.appendChild(
        empty
      );
    }

    if (
      els.outlinerFooter
    ) {
      els.outlinerFooter.textContent =
        `${state.project.objects.length} ${
          state.project.objects.length === 1
            ? "object"
            : "objects"
        }`;
    }
  }

  function getObjectLetter(
    type
  ) {
    const map = {
      Cube: "C",
      Wedge: "W",
      Sphere: "S",
      Cylinder: "C",
      Light: "L",
      Spawn: "P"
    };

    return (
      map[type] ||
      "P"
    );
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
            ${
              object.visible
                ? "checked"
                : ""
            }
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
          style="width:100%;height:31px;color:#ee9999;background:#251719;border:1px solid #633234;border-radius:4px;cursor:pointer;"
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
              inspectorEdit(
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
              vectorEdit(
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
    value
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
    `;
  }

  function inspectorEdit(
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
        Number(input.value) ||
        0;
    }

    if (
      property === "hiddenAt"
    ) {
      object.hiddenAt =
        input.value === ""
          ? null
          : Number(input.value);
    }

    applyObjectToMesh(
      object
    );

    pushHistory();
    saveProject(false);

    renderEverything();
  }

  function vectorEdit(
    input
  ) {
    const object =
      getSelectedObject();

    if (!object) {
      return;
    }

    object[
      input.dataset.vector
    ][
      input.dataset.axis
    ] =
      Number(input.value) ||
      0;

    applyObjectToMesh(
      object
    );

    pushHistory();
    saveProject(false);
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
     AI
     ======================================================== */

  function submitAI() {
    try {
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

      els.aiInput.value =
        "";

      const result =
        thinkLikeRiseAI(
          prompt
        );

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

      consoleLog(
        `Rise AI: ${result.message.split("\n")[0]}`,
        "success"
      );
    } catch (error) {
      console.error(error);

      addAIMessage(
        "Rise AI",
        "I hit an error while processing that request. Try saying it another way."
      );

      consoleLog(
        `Rise AI error: ${error.message}`,
        "error"
      );
    }
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

    const strong =
      document.createElement(
        "strong"
      );

    strong.textContent =
      sender;

    const text =
      document.createElement(
        "p"
      );

    text.textContent =
      message;

    wrapper.appendChild(
      strong
    );

    wrapper.appendChild(
      text
    );

    if (code) {
      const pre =
        document.createElement(
          "pre"
        );

      pre.style.cssText =
        "margin:8px 0 0;padding:10px;overflow:auto;background:#080b0f;border:1px solid #242b33;border-radius:5px;color:#dbe5ee;font-family:monospace;font-size:10px;line-height:1.5;";

      pre.textContent =
        code;

      wrapper.appendChild(
        pre
      );
    }

    els.aiMessages.appendChild(
      wrapper
    );

    els.aiMessages.scrollTop =
      els.aiMessages.scrollHeight;
  }

  function thinkLikeRiseAI(
    prompt
  ) {
    const lower =
      prompt
        .trim()
        .toLowerCase();

    if (
      /\bhelp\b|\bwhat can you do\b|\bwhat do you do\b/.test(
        lower
      )
    ) {
      return {
        changed: false,
        message:
          "I'm Rise AI, the coding edition inside RiseUp Studio. I understand the project you're editing. I can build 3D worlds, place objects, modify objects, create 4D events, write RiseCode, explain RiseCode, and debug it."
      };
    }

    if (
      /\b(debug|fix)\b/.test(
        lower
      ) &&
      /\b(code|script|risecode)\b/.test(
        lower
      )
    ) {
      return debugCode();
    }

    if (
      /\b(explain|what does)\b/.test(
        lower
      ) &&
      /\b(code|script|risecode)\b/.test(
        lower
      )
    ) {
      return explainCode();
    }

    if (
      /\b(write|generate|make)\b/.test(
        lower
      ) &&
      /\b(code|script|risecode)\b/.test(
        lower
      )
    ) {
      return generateCode(
        lower
      );
    }

    if (
      /\bdelete\b|\bremove\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(
          lower
        );

      if (!object) {
        return {
          changed: false,
          message:
            "Tell me which object to delete, such as 'delete Cube 1'."
        };
      }

      deleteObject(
        object.id
      );

      return {
        changed: true,
        message:
          `Done. I removed ${object.name}.`
      };
    }

    if (
      /\bhide\b|\bdisappear\b|\bvanish\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(
          lower
        );

      if (!object) {
        return {
          changed: false,
          message:
            "Tell me which object should disappear."
        };
      }

      const time =
        extractTime(
          lower
        );

      if (
        time !== null
      ) {
        object.hiddenAt =
          time;

        setMode("4D");

        return {
          changed: true,
          message:
            `${object.name} will disappear at ${time.toFixed(2)} seconds.`
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
      /\bmove\b|\bput\b|\bplace\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(
          lower
        ) ||
        getSelectedObject();

      if (!object) {
        return {
          changed: false,
          message:
            "Tell me which object to move, or select one in Explorer."
        };
      }

      if (
        /\bwhere i'm standing\b|\bwhere i am\b|\bwhere im standing\b|\bhere\b/.test(
          lower
        )
      ) {
        object.position = {
          x:
            state.player.x,
          y:
            1,
          z:
            state.player.z
        };

        return {
          changed: true,
          message:
            `Placed ${object.name} where the player is standing.`
        };
      }

      const position =
        parsePosition(
          lower
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

      return {
        changed: false,
        message:
          "Give me a location, like 'move the cube to x 10 y 2 z 20', or say 'put it where I'm standing'."
      };
    }

    if (
      /\brotate\b|\bturn\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(
          lower
        ) ||
        getSelectedObject();

      if (!object) {
        return {
          changed: false,
          message:
            "Select an object or tell me which object to rotate."
        };
      }

      const amount =
        extractNumber(
          lower
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
        findAIObject(
          lower
        ) ||
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
          lower
        );

      if (
        amount ===
        null
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
        findAIObject(
          lower
        ) ||
        getSelectedObject();

      const color =
        detectColor(
          lower
        );

      if (!object) {
        return {
          changed: false,
          message:
            "Select an object you want to recolor."
        };
      }

      if (!color) {
        return {
          changed: false,
          message:
            "Tell me the color you want."
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
      /\b4d\b|\btimeline\b|\bdisappear\b|\bappear\b|\btime\b/.test(
        lower
      )
    ) {
      const object =
        findAIObject(
          lower
        );

      const time =
        extractTime(
          lower
        );

      setMode("4D");

      if (
        object &&
        time !== null &&
        /\bdisappear\b|\bvanish\b/.test(
          lower
        )
      ) {
        object.hiddenAt =
          time;

        return {
          changed: true,
          message:
            `4D event created. ${object.name} disappears at ${time.toFixed(2)} seconds.`
        };
      }

      if (
        time !== null
      ) {
        setTimeline(
          time
        );
      }

      return {
        changed: false,
        message:
          `4D mode is active at ${state.timeline.time.toFixed(2)} seconds.`
      };
    }

    /*
      ADD / BUILD COMMANDS
      */

    if (
      /\b(add|create|make|build|spawn|place)\b/.test(
        lower
      )
    ) {
      const type =
        detectShape(
          lower
        );

      let position =
        parsePosition(
          lower
        );

      if (
        /\bwhere i'm standing\b|\bwhere i am\b|\bwhere im standing\b|\bhere\b/.test(
          lower
        )
      ) {
        position = {
          x:
            state.player.x,
          y:
            1,
          z:
            state.player.z
        };
      }

      if (!position) {
        position = {
          x:
            state.player.x,
          y:
            1,
          z:
            state.player.z
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

    /*
      Natural-language world requests.
      */

    if (
      /\bworld\b|\bmap\b|\benvironment\b|\bscene\b/.test(
        lower
      )
    ) {
      return {
        changed: false,
        message:
          `Your current world has ${state.project.objects.length} objects, a ground plane, sky, sun, atmosphere, grid, and a player spawn at (${state.player.x}, ${state.player.y}, ${state.player.z}). Tell me what you want to add to it.`
      };
    }

    return {
      changed: false,
      message:
        "I understand natural-language 3D commands. Try 'add a cube where I'm standing', 'make a red sphere at x 10 y 2 z 5', 'move Cube 1 to x 20 y 2 z 10', 'make the cube disappear after 10 seconds', or 'write code for an NPC'."
    };
  }

  function generateCode(
    prompt
  ) {
    let code;

    if (
      /\bnpc\b/.test(
        prompt
      )
    ) {
      code = [
        'npc.name = "Guard";',
        "npc.health = 100;",
        "npc.speed = 4;",
        'npc.behavior = "patrol";'
      ].join("\n");
    } else if (
      /\bweapon\b/.test(
        prompt
      )
    ) {
      code = [
        'weapon.name = "Blaster";',
        "weapon.damage = 25;",
        "weapon.cooldown = 0.2;"
      ].join("\n");
    } else if (
      /\bmultiplayer\b/.test(
        prompt
      )
    ) {
      code = [
        "network.enabled = true;",
        "network.maxPlayers = 12;",
        'network.mode = "server-authoritative";'
      ].join("\n");
    } else if (
      /\bday\b|\bnight\b/.test(
        prompt
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

    return {
      changed: true,
      code,
      message:
        "I generated the RiseCode and placed it into the editor."
    };
  }

  function explainCode() {
    const code =
      els.studioCodeEditor?.value ||
      state.project.code;

    const lines =
      code
        .split(/\r?\n/)
        .filter(
          (line) =>
            line.trim()
        );

    return {
      changed: false,
      message:
        `Your current script has ${lines.length} active line${
          lines.length === 1
            ? ""
            : "s"
        }.\n\n${lines
          .slice(0, 12)
          .join("\n")}`
    };
  }

  function debugCode() {
    const code =
      els.studioCodeEditor?.value ||
      "";

    const errors =
      [];

    code
      .split(/\r?\n/)
      .forEach(
        (line, index) => {
          const text =
            line.trim();

          if (
            !text ||
            text.startsWith(
              "//"
            )
          ) {
            return;
          }

          if (
            !text.endsWith(";") &&
            !text.endsWith("{") &&
            !text.endsWith("}")
          ) {
            errors.push(
              `Line ${
                index + 1
              }: missing semicolon.`
            );
          }
        }
      );

    if (!errors.length) {
      return {
        changed: false,
        message:
          "I checked the current RiseCode and did not find an obvious syntax issue in the statements I understand."
      };
    }

    return {
      changed: false,
      message:
        `I found ${errors.length} possible issue${
          errors.length === 1
            ? ""
            : "s"
        }:\n${errors.join(
          "\n"
        )}`
    };
  }

  /* ========================================================
     TIMELINE
     ======================================================== */

  function setTimeline(
    time
  ) {
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

  function toggleTimeline() {
    if (
      state.timeline.playing
    ) {
      pauseTimeline();
      return;
    }

    state.timeline.playing =
      true;

    if (
      els.timelinePlay
    ) {
      els.timelinePlay.textContent =
        "Pause";
    }

    const start =
      performance.now() -
      state.timeline.time *
        1000;

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

      state.timelineFrame =
        null;
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
    const before =
      state.timeline.time <
      object.createdAt;

    const after =
      object.hiddenAt !==
        null &&
      state.timeline.time >=
        object.hiddenAt;

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

    els.timelineObjects.innerHTML =
      "";

    state.project.objects.forEach(
      (object) => {
        const row =
          document.createElement(
            "div"
          );

        row.style.cssText =
          "height:24px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;padding:0 8px;color:#89939e;font-size:9px;";

        const name =
          document.createElement(
            "span"
          );

        name.textContent =
          object.name;

        row.appendChild(
          name
        );

        const created =
          document.createElement(
            "span"
          );

        created.style.cssText =
          "margin-left:auto;color:#4da3ff;";

        created.textContent =
          `${object.createdAt.toFixed(
            1
          )}s`;

        row.appendChild(
          created
        );

        if (
          object.hiddenAt !==
          null
        ) {
          const hidden =
            document.createElement(
              "span"
            );

          hidden.style.cssText =
            "margin-left:10px;color:#e35d5d;";

          hidden.textContent =
            `→ ${object.hiddenAt.toFixed(
              1
            )}s`;

          row.appendChild(
            hidden
          );
        }

        els.timelineObjects.appendChild(
          row
        );
      }
    );
  }

  /* ========================================================
     CODE
     ======================================================== */

  function updateLineNumbers() {
    if (
      !els.studioCodeEditor ||
      !els.studioLineNumbers
    ) {
      return;
    }

    const count =
      els.studioCodeEditor.value.split(
        "\n"
      ).length;

    els.studioLineNumbers.innerHTML =
      Array.from(
        {
          length:
            count
        },
        (_, index) =>
          index + 1
      ).join(
        "<br>"
      );
  }

  function saveCode() {
    state.project.code =
      els.studioCodeEditor
        ?.value ||
      "";

    pushHistory();
    saveProject(true);

    consoleLog(
      "RiseCode saved.",
      "success"
    );
  }

  function runCode() {
    const code =
      els.studioCodeEditor
        ?.value ||
      "";

    state.project.code =
      code;

    const result =
      executeRiseCode(
        code
      );

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

    rebuildScene();
    renderEverything();

    toast(
      `Ran ${result.executed} RiseCode statement${
        result.executed === 1
          ? ""
          : "s"
      }.`,
      "success"
    );
  }

  function executeRiseCode(
    code
  ) {
    const errors =
      [];

    let executed =
      0;

    code
      .split(/\r?\n/)
      .forEach(
        (line, index) => {
          const text =
            line.trim();

          if (
            !text ||
            text.startsWith(
              "//"
            )
          ) {
            return;
          }

          if (
            /^game\.name\s*=/.test(
              text
            )
          ) {
            const value =
              extractQuoted(
                text
              );

            if (
              value !== null
            ) {
              state.project.name =
                value;
            }

            executed++;
            return;
          }

          if (
            /^game\.mode\s*=/.test(
              text
            )
          ) {
            const value =
              extractQuoted(
                text
              );

            setMode(
              String(
                value
              ).toUpperCase() ===
                "4D"
                ? "4D"
                : "3D"
            );

            executed++;
            return;
          }

          if (
            /^add\.mesh\./i.test(
              text
            )
          ) {
            const match =
              text.match(
                /^add\.mesh\.([a-z]+)\s*\(\s*\)\s*;?$/i
              );

            if (!match) {
              errors.push(
                `Line ${
                  index + 1
                }: invalid mesh syntax.`
              );

              return;
            }

            createObject(
              normalizeShapeType(
                match[1]
              )
            );

            executed++;
            return;
          }

          if (
            /^map\.name\s*=/.test(
              text
            ) ||
            /^world\.gravity\s*=/.test(
              text
            ) ||
            /^player\.walk\.speed\s*=/.test(
              text
            ) ||
            /^player\.jump\.power\s*=/.test(
              text
            )
          ) {
            executed++;
            return;
          }

          errors.push(
            `Line ${
              index + 1
            }: RiseCode statement not recognized.`
          );
        }
      );

    syncProjectUI();

    return {
      errors,
      executed
    };
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
      "Game started.",
      "success"
    );
  }

  function stopGame() {
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
      "Game stopped.",
      "success"
    );
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

    let games =
      [];

    try {
      games =
        JSON.parse(
          localStorage.getItem(
            GAMES_KEY
          ) ||
          "[]"
        );

      if (
        !Array.isArray(
          games
        )
      ) {
        games = [];
      }
    } catch {
      games = [];
    }

    const owner =
      getUsername(
        state.user
      );

    const id =
      `${slugify(name)}-${owner}`;

    const game = {
      id,
      name,
      title: name,
      description,
      creator: owner,
      owner,
      projectOwner: owner,
      mode: state.mode,
      code:
        state.project.code,
      objects:
        deepClone(
          state.project.objects
        ),
      updatedAt:
        new Date().toISOString()
    };

    const index =
      games.findIndex(
        (item) =>
          item.id === id
      );

    if (
      index >= 0
    ) {
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
      `Published "${name}".`,
      "success"
    );
  }

  /* ========================================================
     DELETE PROJECT
     ======================================================== */

  function deleteProject() {
    if (
      !confirm(
        "Delete this project and reset the Studio?"
      )
    ) {
      return;
    }

    localStorage.removeItem(
      projectKey()
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

    state.selectedId =
      null;

    state.mode =
      "3D";

    state.timeline.time =
      0;

    syncProjectUI();
    rebuildScene();
    renderEverything();

    pushHistory();

    toast(
      "Project reset.",
      "success"
    );
  }

  /* ========================================================
     LOCATION
     ======================================================== */

  function openLocation(
    type
  ) {
    pendingLocationType =
      type;

    els.locationModal?.classList.remove(
      "hidden"
    );
  }

  function closeLocation() {
    pendingLocationType =
      null;

    els.locationModal?.classList.add(
      "hidden"
    );
  }

  function placePendingObject(
    location
  ) {
    if (
      !pendingLocationType
    ) {
      closeLocation();
      return;
    }

    let position;

    if (
      location ===
      "origin"
    ) {
      position = {
        x: 0,
        y: 1,
        z: 0
      };
    } else if (
      location ===
      "selected"
    ) {
      const selected =
        getSelectedObject();

      position =
        selected
          ? {
              x:
                selected.position.x,
              y:
                selected.position.y +
                1,
              z:
                selected.position.z
            }
          : {
              x:
                state.player.x,
              y: 1,
              z:
                state.player.z
            };
    } else {
      position = {
        x:
          state.player.x,
        y: 1,
        z:
          state.player.z
      };
    }

    createObject(
      pendingLocationType,
      {
        position
      }
    );

    closeLocation();
  }

  /* ========================================================
     FINAL RENDER
     ======================================================== */

  function renderEverything() {
    renderExplorer();
    renderInspector();
    refreshTimeline();
    syncProjectUI();

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

    updatePlayerMarker();
  }

  /* ========================================================
     HELPERS
     ======================================================== */

  function findAIObject(
    text
  ) {
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

  function normalizeShapeType(
    type
  ) {
    const text =
      String(
        type
      ).toLowerCase();

    if (
      text === "cube" ||
      text === "part"
    ) {
      return "Cube";
    }

    if (
      text === "wedge"
    ) {
      return "Wedge";
    }

    if (
      text === "sphere"
    ) {
      return "Sphere";
    }

    if (
      text === "cylinder"
    ) {
      return "Cylinder";
    }

    if (
      text === "light"
    ) {
      return "Light";
    }

    if (
      text === "spawn"
    ) {
      return "Spawn";
    }

    return "Cube";
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
        x:
          Number(
            xyz[1]
          ),
        y:
          Number(
            xyz[2]
          ),
        z:
          Number(
            xyz[3]
          )
      };
    }

    const tuple =
      text.match(
        /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/
      );

    if (tuple) {
      return {
        x:
          Number(
            tuple[1]
          ),
        y:
          Number(
            tuple[2]
          ),
        z:
          Number(
            tuple[3]
          )
      };
    }

    return null;
  }

  function extractTime(
    text
  ) {
    const match =
      text.match(
        /(-?\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i
      );

    return match
      ? Math.max(
          0,
          Math.min(
            state.timeline.max,
            Number(match[1])
          )
        )
      : null;
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
        ).test(
          text
        )
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

  function defaultColor(
    type
  ) {
    const colors = {
      Cube: "#4da3ff",
      Wedge: "#ff9a62",
      Sphere: "#9b78ff",
      Cylinder: "#4da3ff",
      Light: "#ffd96a",
      Spawn: "#35c978"
    };

    return (
      colors[type] ||
      "#4da3ff"
    );
  }

  function normalizeVector(
    value,
    fallback
  ) {
    return {
      x:
        Number.isFinite(
          Number(
            value?.x
          )
        )
          ? Number(
              value.x
            )
          : fallback,

      y:
        Number.isFinite(
          Number(
            value?.y
          )
        )
          ? Number(
              value.y
            )
          : fallback,

      z:
        Number.isFinite(
          Number(
            value?.z
          )
        )
          ? Number(
              value.z
            )
          : fallback
    };
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

  function radians(
    degrees
  ) {
    return (
      (Number(degrees) ||
        0) *
      Math.PI /
      180
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
      ) ||
      "game";
  }

  function makeId(
    prefix
  ) {
    if (
      window.crypto &&
      typeof window.crypto
        .randomUUID ===
        "function"
    ) {
      return `${prefix}_${window.crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;
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

  function toast(
    message,
    type = "normal"
  ) {
    let container =
      document.getElementById(
        "toastContainer"
      );

    if (!container) {
      container =
        document.createElement(
          "div"
        );

      container.id =
        "toastContainer";

      container.className =
        "toast-container";

      document.body.appendChild(
        container
      );
    }

    const item =
      document.createElement(
        "div"
      );

    item.className =
      `toast ${type}`;

    item.textContent =
      message;

    container.appendChild(
      item
    );

    setTimeout(
      () =>
        item.remove(),
      3500
    );
  }

  /* ========================================================
     GLOBAL API
     ======================================================== */

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

    setMode,
    setTimeline,

    undo,
    redo,

    openLocation,

    getProject() {
      return state.project;
    }
  };
})();
