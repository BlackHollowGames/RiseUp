(() => {

  "use strict";


  /* ========================================================
     AUTH
     ======================================================== */

  const currentUser =
    localStorage.getItem(
      "riseup_currentUser"
    );

  if (!currentUser) {

    window.location.href =
      "index.html";

    return;
  }


  const $ =
    id =>
      document.getElementById(id);


  /* ========================================================
     STATE
     ======================================================== */

  let objects = [];

  let selectedObject =
    null;

  let currentTool =
    "select";

  let playing =
    false;

  let editorBackup =
    null;

  let loadedPublishedGame =
    null;

  let studioGame =
    null;


  /* ========================================================
     UTILITY
     ======================================================== */

  function escapeHTML(
    value
  ) {

    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      value;

    return div.innerHTML;
  }


  function toast(
    message
  ) {

    console.log(
      "RiseUp Studio:",
      message
    );
  }


  function output(
    message
  ) {

    const text =
      String(message);

    $("consoleOutput")
      .textContent =
      text;

    console.log(
      text
    );
  }


  /* ========================================================
     OBJECT CREATION
     ======================================================== */

  function makeObject(
    type,
    name
  ) {

    return {

      id:
        crypto.randomUUID
          ? crypto.randomUUID()
          : "obj_" +
            Date.now() +
            Math.random(),

      type,

      name,

      x:
        35 +
        Math.random() * 20,

      y:
        35 +
        Math.random() * 20,

      z: 0,

      width:
        type === "Light"
          ? 40
          : 100,

      height:
        type === "Light"
          ? 40
          : 70,

      depth: 60,

      rotation: 0

    };
  }


  function addObject(
    type,
    name
  ) {

    if (playing) {

      toast(
        "Stop Play Mode before editing."
      );

      return;
    }

    const object =
      makeObject(
        type,
        name
      );

    objects.push(
      object
    );

    selectedObject =
      object;

    render();

    output(
      `${name} created.`
    );
  }


  /* ========================================================
     EDITOR RENDER
     ======================================================== */

  function render() {

    if (playing)
      return;

    renderEditor();
    renderExplorer();
    renderProperties();

    $("contextSelection")
      .textContent =
      selectedObject
        ? selectedObject.name
        : "Nothing Selected";
  }


  function renderEditor() {

    const canvas =
      $("editorCanvas");

    const width =
      canvas.clientWidth;

    const height =
      canvas.clientHeight;

    if (!width || !height)
      return;

    const ctx =
      canvas.getContext(
        "2d"
      );

    canvas.width =
      width *
      devicePixelRatio;

    canvas.height =
      height *
      devicePixelRatio;

    ctx.scale(
      devicePixelRatio,
      devicePixelRatio
    );


    /*
     * Background.
     */
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        height
      );

    gradient.addColorStop(
      0,
      "#111b24"
    );

    gradient.addColorStop(
      1,
      "#0a1015"
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );


    /*
     * Grid.
     */
    const gridVisible =
      $("gridButton")
        .classList.contains(
          "active-button"
        );

    if (gridVisible) {

      ctx.strokeStyle =
        "rgba(110,140,160,.09)";

      ctx.lineWidth =
        1;

      const size =
        32;

      for (
        let x = 0;
        x < width;
        x += size
      ) {

        ctx.beginPath();

        ctx.moveTo(
          x,
          0
        );

        ctx.lineTo(
          x,
          height
        );

        ctx.stroke();
      }

      for (
        let y = 0;
        y < height;
        y += size
      ) {

        ctx.beginPath();

        ctx.moveTo(
          0,
          y
        );

        ctx.lineTo(
          width,
          y
        );

        ctx.stroke();
      }
    }


    /*
     * Horizon.
     */
    ctx.strokeStyle =
      "rgba(110,145,165,.18)";

    ctx.beginPath();

    ctx.moveTo(
      0,
      height * .63
    );

    ctx.lineTo(
      width,
      height * .63
    );

    ctx.stroke();


    /*
     * Objects.
     */
    objects.forEach(
      object => {

        const x =
          width *
          object.x /
          100;

        const y =
          height *
          object.y /
          100;

        const w =
          object.width;

        const h =
          object.height;


        ctx.save();

        ctx.translate(
          x,
          y
        );

        ctx.rotate(
          (
            object.rotation ||
            0
          ) *
          Math.PI /
          180
        );


        const selected =
          selectedObject &&
          selectedObject.id ===
            object.id;


        ctx.fillStyle =
          object.type ===
          "Light"

            ? "rgba(255,219,120,.25)"

            : object.type ===
              "Spawn"

              ? "#4c89b5"

              : object.type ===
                "Camera"

                ? "#9a64d7"

                : "#596773";


        ctx.strokeStyle =
          selected
            ? "#62b3ff"
            : "#303b44";


        ctx.lineWidth =
          selected
            ? 2
            : 1;


        if (
          object.type ===
          "Light"
        ) {

          ctx.beginPath();

          ctx.arc(
            0,
            0,
            Math.max(
              12,
              w / 2
            ),
            0,
            Math.PI * 2
          );

          ctx.fill();
          ctx.stroke();

        } else {

          ctx.fillRect(
            -w / 2,
            -h / 2,
            w,
            h
          );

          ctx.strokeRect(
            -w / 2,
            -h / 2,
            w,
            h
          );

        }


        if (selected) {

          ctx.strokeStyle =
            "#67b7ff";

          ctx.setLineDash(
            [4, 4]
          );

          ctx.strokeRect(
            -w / 2 - 5,
            -h / 2 - 5,
            w + 10,
            h + 10
          );

          ctx.setLineDash(
            []
          );

        }


        ctx.fillStyle =
          "#e4ebf0";

        ctx.font =
          "10px Arial";

        ctx.textAlign =
          "center";

        ctx.fillText(
          object.name,
          0,
          h / 2 + 14
        );


        ctx.restore();

      }
    );
  }


  /* ========================================================
     EXPLORER
     ======================================================== */

  function iconFor(
    type
  ) {

    switch (type) {

      case "Spawn":
        return "⌂";

      case "Light":
        return "☀";

      case "Camera":
        return "◈";

      case "Folder":
        return "□";

      default:
        return "■";
    }
  }


  function renderExplorer() {

    const tree =
      $("objectTree");

    const query =
      $("outlinerSearch")
        .value
        .trim()
        .toLowerCase();

    tree.innerHTML =
      `
        <div class="tree-root">
          ▾ Workspace
        </div>
      `;


    objects
      .filter(
        object => {

          if (!query)
            return true;

          return object.name
            .toLowerCase()
            .includes(
              query
            );
        }
      )
      .forEach(
        object => {

          const item =
            document.createElement(
              "div"
            );

          item.className =
            "tree-item" +
            (
              selectedObject &&
              selectedObject.id ===
                object.id
                ? " selected"
                : ""
            );


          item.innerHTML =
            `
              <span class="tree-icon">
                ${iconFor(object.type)}
              </span>

              ${escapeHTML(
                object.name
              )}
            `;


          item.addEventListener(
            "click",
            () => {

              selectedObject =
                object;

              render();

            }
          );


          tree.appendChild(
            item
          );
        }
      );


    $("outlinerFooter")
      .textContent =
      `${objects.length} object${
        objects.length === 1
          ? ""
          : "s"
      }`;
  }


  /* ========================================================
     INSPECTOR
     ======================================================== */

  function renderProperties() {

    const panel =
      $("propertiesContent");


    if (
      !selectedObject
    ) {

      panel.innerHTML =
        `
          <div class="nothing-selected">

            <div class="nothing-icon">
              ◇
            </div>

            <strong>
              Nothing Selected
            </strong>

            <p>
              Select an object.
            </p>

          </div>
        `;

      return;
    }


    const o =
      selectedObject;


    panel.innerHTML =
      `
        <div class="property-title">
          ${escapeHTML(o.name)}
        </div>

        <div class="property-group">
          <label>Name</label>

          <input
            id="propName"
            value="${escapeHTML(o.name)}"
          >
        </div>

        <div class="property-group">
          <label>Type</label>

          <input
            value="${escapeHTML(o.type)}"
            disabled
          >
        </div>

        <div class="property-title">
          Transform
        </div>

        <div class="property-group">
          <label>Position X</label>

          <input
            id="propX"
            type="number"
            value="${o.x}"
          >
        </div>

        <div class="property-group">
          <label>Position Y</label>

          <input
            id="propY"
            type="number"
            value="${o.y}"
          >
        </div>

        <div class="property-group">
          <label>Position Z</label>

          <input
            id="propZ"
            type="number"
            value="${o.z || 0}"
          >
        </div>

        <div class="property-group">
          <label>Width</label>

          <input
            id="propWidth"
            type="number"
            value="${o.width}"
          >
        </div>

        <div class="property-group">
          <label>Height</label>

          <input
            id="propHeight"
            type="number"
            value="${o.height}"
          >
        </div>

        <div class="property-group">
          <label>Depth</label>

          <input
            id="propDepth"
            type="number"
            value="${o.depth || 60}"
          >
        </div>

        <div class="property-group">
          <label>Rotation</label>

          <input
            id="propRotation"
            type="number"
            value="${o.rotation || 0}"
          >
        </div>
      `;


    const fields = [
      "propName",
      "propX",
      "propY",
      "propZ",
      "propWidth",
      "propHeight",
      "propDepth",
      "propRotation"
    ];


    fields.forEach(
      id => {

        $(id).addEventListener(
          "input",
          () => {

            if (playing)
              return;

            o.name =
              $("propName").value;

            o.x =
              Number(
                $("propX").value
              ) || 0;

            o.y =
              Number(
                $("propY").value
              ) || 0;

            o.z =
              Number(
                $("propZ").value
              ) || 0;

            o.width =
              Number(
                $("propWidth").value
              ) || 1;

            o.height =
              Number(
                $("propHeight").value
              ) || 1;

            o.depth =
              Number(
                $("propDepth").value
              ) || 1;

            o.rotation =
              Number(
                $("propRotation").value
              ) || 0;


            renderEditor();
            renderExplorer();

          }
        );
      }
    );
  }


  /* ========================================================
     DELETE / DUPLICATE
     ======================================================== */

  function deleteSelected() {

    if (
      playing ||
      !selectedObject
    )
      return;

    const name =
      selectedObject.name;

    objects =
      objects.filter(
        object =>
          object.id !==
          selectedObject.id
      );

    selectedObject =
      null;

    render();

    output(
      `${name} deleted.`
    );
  }


  function duplicateSelected() {

    if (
      playing ||
      !selectedObject
    )
      return;


    const copy =
      JSON.parse(
        JSON.stringify(
          selectedObject
        )
      );


    copy.id =
      crypto.randomUUID
        ? crypto.randomUUID()
        : "obj_" +
          Date.now();


    copy.name =
      selectedObject.name +
      " Copy";


    copy.x += 5;
    copy.y += 5;


    objects.push(
      copy
    );

    selectedObject =
      copy;


    render();

    output(
      `${copy.name} duplicated.`
    );
  }


  /* ========================================================
     SAVE
     ======================================================== */

  function saveProject() {

    /*
     * If opened from a published game,
     * only its owner can save.
     */
    if (
      loadedPublishedGame
    ) {

      if (
        loadedPublishedGame.projectOwner !==
        currentUser
      ) {

        toast(
          "You can only edit your own project."
        );

        return;
      }

      updatePublishedProject();

      return;
    }


    const project = {

      name:
        $("projectName")
          .value
          .trim() ||
        "Untitled Scene",

      objects:
        JSON.parse(
          JSON.stringify(
            objects
          )
        )
    };


    localStorage.setItem(
      "riseup_studio_project",
      JSON.stringify(
        project
      )
    );


    $("saveStatus")
      .textContent =
      "Saved";


    output(
      "Project saved."
    );
  }


  function updatePublishedProject() {

    let games = [];

    try {

      games =
        JSON.parse(
          localStorage.getItem(
            "riseup_games"
          ) || "[]"
        );

    } catch {

      games = [];
    }


    const index =
      games.findIndex(
        game =>
          String(game.id) ===
          String(
            loadedPublishedGame.id
          )
      );


    if (
      index === -1
    ) {

      toast(
        "Published game no longer exists."
      );

      return;
    }


    if (
      games[index].projectOwner !==
      currentUser
    ) {

      toast(
        "Only the owner can edit this project."
      );

      return;
    }


    games[index].projectName =
      $("projectName")
        .value
        .trim();


    games[index].objects =
      JSON.parse(
        JSON.stringify(
          objects
        )
      );


    games[index].codeFiles =
      getCodeFiles();


    localStorage.setItem(
      "riseup_games",
      JSON.stringify(
        games
      )
    );


    $("saveStatus")
      .textContent =
      "Saved";


    output(
      "Published project updated."
    );
  }


  /* ========================================================
     LOAD
     ======================================================== */

  function loadProject() {

    const playId =
      localStorage.getItem(
        "riseup_play_game_id"
      );


    if (playId) {

      localStorage.removeItem(
        "riseup_play_game_id"
      );


      const published =
        findPublishedGame(
          playId
        );


      if (published) {

        loadedPublishedGame =
          published;

        $("projectName")
          .value =
          published.projectName ||
          published.name ||
          "Game";


        objects =
          Array.isArray(
            published.objects
          )
            ? JSON.parse(
                JSON.stringify(
                  published.objects
                )
              )
            : [];


        loadCodeFiles(
          published.codeFiles
        );


        render();


        setTimeout(
          startPlay,
          250
        );


        return;
      }
    }


    try {

      const saved =
        JSON.parse(
          localStorage.getItem(
            "riseup_studio_project"
          ) || "null"
        );


      if (saved) {

        $("projectName")
          .value =
          saved.name ||
          "Untitled Scene";


        objects =
          Array.isArray(
            saved.objects
          )
            ? saved.objects
            : [];

      }

    } catch {

      objects = [];

    }


    loadCodeFiles(
      getCodeFiles()
    );


    render();
  }


  function findPublishedGame(
    id
  ) {

    try {

      const games =
        JSON.parse(
          localStorage.getItem(
            "riseup_games"
          ) || "[]"
        );


      if (
        !Array.isArray(games)
      ) {

        return null;
      }


      return (
        games.find(
          game =>
            String(game.id) ===
            String(id)
        ) ||
        null
      );

    } catch {

      return null;

    }
  }


  /* ========================================================
     CODE FILES
     ======================================================== */

  function getCodeFiles() {

    if (
      loadedPublishedGame &&
      Array.isArray(
        loadedPublishedGame.codeFiles
      )
    ) {

      return JSON.parse(
        JSON.stringify(
          loadedPublishedGame.codeFiles
        )
      );
    }


    try {

      const files =
        JSON.parse(
          localStorage.getItem(
            `riseup_code_files_${currentUser}`
          ) || "[]"
        );


      return Array.isArray(
        files
      )
        ? files
        : [];

    } catch {

      return [];

    }
  }


  function loadCodeFiles(
    files
  ) {

    if (
      !Array.isArray(files) ||
      !files.length
    ) {

      $("studioCodeEditor")
        .value =
`game.name = "My Game";
game.mode = "FPS";

world.gravity = 25;

camera.mode = "FirstPerson";
camera.fov = 90;

player.walk.speed = 7;
player.jump.power = 9;

createMap();`;

      updateCodeLines();

      return;
    }


    const main =
      files.find(
        file =>
          file &&
          (
            file.name ===
              "Game.rise" ||
            file.name ===
              "game.rise"
          )
      ) ||
      files[0];


    $("studioCodeEditor")
      .value =
      main.code || "";


    updateCodeLines();
  }


  function saveCodeFiles() {

    const code =
      $("studioCodeEditor")
        .value;


    const files =
      getCodeFiles();


    let main =
      files.find(
        file =>
          file &&
          (
            file.name ===
              "Game.rise" ||
            file.name ===
              "game.rise"
          )
      );


    if (!main) {

      main = {

        name:
          "Game.rise",

        code: ""

      };

      files.unshift(
        main
      );
    }


    main.code =
      code;


    if (
      loadedPublishedGame
    ) {

      if (
        loadedPublishedGame.projectOwner !==
        currentUser
      ) {

        $("codeStatus")
          .textContent =
          "Read only";

        toast(
          "Only the owner can edit this code."
        );

        return;
      }


      loadedPublishedGame.codeFiles =
        files;


      updatePublishedProject();

    } else {

      localStorage.setItem(
        `riseup_code_files_${currentUser}`,
        JSON.stringify(
          files
        )
      );

    }


    $("codeStatus")
      .textContent =
      "Saved";


    output(
      "RiseCode saved."
    );
  }


  function runCode() {

    saveCodeFiles();


    if (
      !window.RiseCodeRuntime ||
      !studioGame
    ) {

      toast(
        "3D game engine is not ready."
      );

      return;
    }


    try {

      const files =
        getCodeFiles();


      window.RiseCodeRuntime.run(
        files,
        studioGame
      );


      $("codeStatus")
        .textContent =
        "Running";


      output(
        "RiseScript executed."
      );

    } catch (error) {

      console.error(
        error
      );

      $("codeStatus")
        .textContent =
        "Error";


      output(
        error.message ||
        "RiseScript error."
      );
    }
  }


  function updateCodeLines() {

    const editor =
      $("studioCodeEditor");

    const count =
      editor.value
        .split("\n")
        .length;


    $("studioLineNumbers")
      .textContent =
      Array.from(
        {
          length: count
        },
        (_, i) =>
          i + 1
      ).join("\n");
  }


  /* ========================================================
     PLAY
     ======================================================== */

  function startPlay() {

    if (playing)
      return;


    editorBackup =
      JSON.parse(
        JSON.stringify(
          objects
        )
      );


    playing =
      true;


    document.body
      .classList.add(
        "playing"
      );


    $("playButton")
      .style.display =
      "none";


    $("stopButton")
      .style.display =
      "block";


    $("fpsHud")
      .classList.remove(
        "hidden"
      );


    try {

      studioGame =
        window.RiseUp3DGame;


      if (!studioGame) {

        throw new Error(
          "3D engine failed to load."
        );
      }


      /*
       * Start Three.js engine.
       */
      studioGame.start({

        canvas:
          $("gameCanvas"),

        objects:
          objects,

        onOutput:
          message =>
            output(
              message
            ),

        onToast:
          message =>
            toast(
              message
            )

      });


      /*
       * Execute actual RiseCode.
       */
      runCode();


      output(
        loadedPublishedGame
          ? `Playing ${loadedPublishedGame.name}.`
          : "Play Mode started."
      );


      toast(
        "Click the viewport to control the game."
      );

    } catch (error) {

      console.error(
        error
      );

      stopPlay();


      output(
        error.message ||
        "Unable to start Play Mode."
      );
    }
  }


  function stopPlay() {

    if (!playing)
      return;


    playing =
      false;


    if (studioGame) {

      try {

        studioGame.stop();

      } catch {}

    }


    studioGame =
      null;


    if (editorBackup) {

      objects =
        JSON.parse(
          JSON.stringify(
            editorBackup
          )
        );

    }


    editorBackup =
      null;


    document.body
      .classList.remove(
        "playing"
      );


    $("playButton")
      .style.display =
      "block";


    $("stopButton")
      .style.display =
      "none";


    $("fpsHud")
      .classList.add(
        "hidden"
      );


    output(
      "Play Mode stopped."
    );


    render();
  }


  /* ========================================================
     DELETE PROJECT
     ======================================================== */

  function deleteProject() {

    if (
      loadedPublishedGame
    ) {

      if (
        loadedPublishedGame.projectOwner !==
        currentUser
      ) {

        toast(
          "Only the project owner can delete this project."
        );

        return;
      }


      const confirmed =
        window.confirm(
          `Delete "${loadedPublishedGame.name}"?`
        );


      if (!confirmed)
        return;


      let games = [];


      try {

        games =
          JSON.parse(
            localStorage.getItem(
              "riseup_games"
            ) || "[]"
          );

      } catch {

        games = [];

      }


      games =
        games.filter(
          game =>
            !(
              String(game.id) ===
                String(
                  loadedPublishedGame.id
                ) &&
              game.projectOwner ===
                currentUser
            )
        );


      localStorage.setItem(
        "riseup_games",
        JSON.stringify(
          games
        )
      );


      removeRecent(
        loadedPublishedGame.id
      );


      removeFavorite(
        loadedPublishedGame.id
      );


      toast(
        "Project deleted."
      );


      setTimeout(
        () => {

          window.location.href =
            "home.html";

        },
        300
      );


      return;
    }


    const confirmed =
      window.confirm(
        "Delete this local project?"
      );


    if (!confirmed)
      return;


    localStorage.removeItem(
      "riseup_studio_project"
    );


    objects =
      [];


    selectedObject =
      null;


    render();


    toast(
      "Project deleted."
    );
  }


  function removeRecent(
    id
  ) {

    try {

      const data =
        JSON.parse(
          localStorage.getItem(
            "riseup_recent_games"
          ) || "[]"
        );


      localStorage.setItem(
        "riseup_recent_games",
        JSON.stringify(
          data.filter(
            value =>
              String(value) !==
              String(id)
          )
        )
      );

    } catch {}
  }


  function removeFavorite(
    id
  ) {

    try {

      const key =
        `riseup_favorites_${currentUser}`;


      const data =
        JSON.parse(
          localStorage.getItem(
            key
          ) || "[]"
        );


      localStorage.setItem(
        key,
        JSON.stringify(
          data.filter(
            value =>
              String(value) !==
              String(id)
          )
        )
      );

    } catch {}
  }


  /* ========================================================
     PUBLISH
     ======================================================== */

  function openPublish() {

    if (playing) {

      toast(
        "Stop Play Mode first."
      );

      return;
    }


    $("publishName")
      .value =
      $("projectName")
        .value
        .trim();


    $("publishModal")
      .classList.remove(
        "hidden"
      );
  }


  function closePublish() {

    $("publishModal")
      .classList.add(
        "hidden"
      );
  }


  function publishGame() {

    const name =
      $("publishName")
        .value
        .trim();


    if (!name) {

      toast(
        "Enter a game name."
      );

      return;
    }


    let games = [];


    try {

      games =
        JSON.parse(
          localStorage.getItem(
            "riseup_games"
          ) || "[]"
        );

    } catch {

      games = [];

    }


    const projectName =
      $("projectName")
        .value
        .trim();


    const codeFiles =
      getCodeFiles();


    const existing =
      games.findIndex(
        game =>
          game.projectOwner ===
            currentUser &&
          game.projectName ===
            projectName
      );


    const game = {

      id:
        existing >= 0
          ? games[existing].id
          : "game_" +
            Date.now(),

      name,

      projectName,

      projectOwner:
        currentUser,

      creator:
        currentUser,

      description:
        $("publishDescription")
          .value
          .trim(),

      objects:
        JSON.parse(
          JSON.stringify(
            objects
          )
        ),

      codeFiles:
        JSON.parse(
          JSON.stringify(
            codeFiles
          )
        ),

      publishedAt:
        new Date()
          .toISOString()

    };


    if (
      existing >= 0
    ) {

      games[existing] =
        game;

    } else {

      games.unshift(
        game
      );
    }


    localStorage.setItem(
      "riseup_games",
      JSON.stringify(
        games
      )
    );


    loadedPublishedGame =
      game;


    closePublish();


    output(
      `${name} published.`
    );


    toast(
      "Game published."
    );
  }


  /* ========================================================
     TOOL EVENTS
     ======================================================== */

  document
    .querySelectorAll(
      ".rail-tool[data-tool]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".rail-tool[data-tool]"
              )
              .forEach(
                b =>
                  b.classList.remove(
                    "active"
                  )
              );


            button.classList.add(
              "active"
            );


            currentTool =
              button.dataset.tool;

          }
        );
      }
    );


  $("addPart")
    .addEventListener(
      "click",
      () =>
        addObject(
          "Part",
          "Part"
        )
    );


  $("addSpawn")
    .addEventListener(
      "click",
      () =>
        addObject(
          "Spawn",
          "SpawnLocation"
        )
    );


  $("addLight")
    .addEventListener(
      "click",
      () =>
        addObject(
          "Light",
          "Light"
        )
    );


  $("addCamera")
    .addEventListener(
      "click",
      () =>
        addObject(
          "Camera",
          "Camera"
        )
    );


  $("addFolder")
    .addEventListener(
      "click",
      () =>
        addObject(
          "Folder",
          "Folder"
        )
    );


  /* ========================================================
     VIEWPORT
     ======================================================== */

  $("gridButton")
    .addEventListener(
      "click",
      () => {

        $("gridButton")
          .classList.toggle(
            "active-button"
          );

        renderEditor();

      }
    );


  $("refreshExplorer")
    .addEventListener(
      "click",
      renderExplorer
    );


  $("outlinerSearch")
    .addEventListener(
      "input",
      renderExplorer
    );


  $("duplicateButton")
    .addEventListener(
      "click",
      duplicateSelected
    );


  $("editorDeleteButton")
    .addEventListener(
      "click",
      deleteSelected
    );


  $("viewport")
    .addEventListener(
      "mousedown",
      event => {

        if (
          playing ||
          currentTool !==
            "select"
        )
          return;


        if (
          event.target !==
          $("editorCanvas")
        )
          return;


        const rect =
          $("editorCanvas")
            .getBoundingClientRect();


        const x =
          (
            event.clientX -
            rect.left
          ) /
          rect.width *
          100;


        const y =
          (
            event.clientY -
            rect.top
          ) /
          rect.height *
          100;


        let found =
          null;


        for (
          let i =
            objects.length - 1;
          i >= 0;
          i--
        ) {

          const object =
            objects[i];


          const halfW =
            object.width /
            rect.width *
            100 /
            2;


          const halfH =
            object.height /
            rect.height *
            100 /
            2;


          if (
            x >=
              object.x -
              halfW &&
            x <=
              object.x +
              halfW &&
            y >=
              object.y -
              halfH &&
            y <=
              object.y +
              halfH
          ) {

            found =
              object;

            break;
          }
        }


        selectedObject =
          found;


        render();

      }
    );


  /* ========================================================
     SHADING
     ======================================================== */

  document
    .querySelectorAll(
      ".shade"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".shade"
              )
              .forEach(
                b =>
                  b.classList.remove(
                    "active"
                  )
              );


            button.classList.add(
              "active"
            );


            const mode =
              button.dataset.shade;


            if (
              mode === "wire"
            ) {

              document.body
                .classList.add(
                  "wire-mode"
                );

            } else {

              document.body
                .classList.remove(
                  "wire-mode"
                );

            }

          }
        );
      }
    );


  /* ========================================================
     BOTTOM TABS
     ======================================================== */

  const bottomViews = {

    materials:
      $("bottomMaterials"),

    library:
      $("bottomLibrary"),

    timeline:
      $("bottomTimeline"),

    console:
      $("bottomConsole")

  };


  document
    .querySelectorAll(
      ".bottom-tab"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".bottom-tab"
              )
              .forEach(
                b =>
                  b.classList.remove(
                    "active"
                  )
              );


            button.classList.add(
              "active"
            );


            Object.values(
              bottomViews
            ).forEach(
              view =>
                view.classList.remove(
                  "active"
                )
            );


            bottomViews[
              button.dataset.bottom
            ].classList.add(
              "active"
            );

          }
        );
      }
    );


  /* ========================================================
     CODE
     ======================================================== */

  function showCode() {

    $("codePanel")
      .scrollIntoView({
        behavior:
          "smooth"
      });

  }


  $("codeButton")
    .addEventListener(
      "click",
      showCode
    );


  $("railCode")
    .addEventListener(
      "click",
      showCode
    );


  $("codeSaveButton")
    .addEventListener(
      "click",
      saveCodeFiles
    );


  $("codeRunButton")
    .addEventListener(
      "click",
      () => {

        if (!playing) {

          startPlay();

        } else {

          runCode();

        }

      }
    );


  $("studioCodeEditor")
    .addEventListener(
      "input",
      updateCodeLines
    );


  $("studioCodeEditor")
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key !==
          "Tab"
        )
          return;


        event.preventDefault();


        const editor =
          $("studioCodeEditor");


        const start =
          editor.selectionStart;


        const end =
          editor.selectionEnd;


        editor.value =
          editor.value.substring(
            0,
            start
          ) +
          "    " +
          editor.value.substring(
            end
          );


        editor.selectionStart =
          editor.selectionEnd =
            start + 4;


        updateCodeLines();

      }
    );


  /* ========================================================
     TOP ACTIONS
     ======================================================== */

  $("saveButton")
    .addEventListener(
      "click",
      saveProject
    );


  $("deleteProjectButton")
    .addEventListener(
      "click",
      deleteProject
    );


  $("playButton")
    .addEventListener(
      "click",
      startPlay
    );


  $("stopButton")
    .addEventListener(
      "click",
      stopPlay
    );


  $("publishButton")
    .addEventListener(
      "click",
      openPublish
    );


  $("closePublish")
    .addEventListener(
      "click",
      closePublish
    );


  $("cancelPublish")
    .addEventListener(
      "click",
      closePublish
    );


  $("confirmPublish")
    .addEventListener(
      "click",
      publishGame
    );


  $("publishModal")
    .addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("publishModal")
        ) {

          closePublish();

        }

      }
    );


  /* ========================================================
     KEYBOARD
     ======================================================== */

  document.addEventListener(
    "keydown",
    event => {

      /*
       * Delete selected object.
       */
      if (
        event.key ===
          "Delete" &&
        document.activeElement !==
          $("studioCodeEditor")
      ) {

        deleteSelected();

      }


      /*
       * Ctrl/Cmd + S
       */
      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key.toLowerCase() ===
          "s"
      ) {

        event.preventDefault();

        saveProject();

      }


      /*
       * F5.
       */
      if (
        event.key ===
        "F5"
      ) {

        event.preventDefault();

        if (!playing) {

          startPlay();

        }

      }


      /*
       * Escape.
       */
      if (
        event.key ===
        "Escape"
      ) {

        if (playing) {

          stopPlay();

        }

      }

    }
  );


  /* ========================================================
     WINDOW RESIZE
     ======================================================== */

  window.addEventListener(
    "resize",
    () => {

      if (
        !playing
      ) {

        renderEditor();

      }

    }
  );


  /* ========================================================
     START
     ======================================================== */

  loadProject();

})();