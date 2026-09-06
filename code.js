(() => {
  "use strict";

  const currentUser =
    localStorage.getItem("riseup_currentUser");

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const editor =
    document.getElementById("codeEditor");

  const fileName =
    document.getElementById("fileName");

  const fileList =
    document.getElementById("fileList");

  const lineNumbers =
    document.getElementById("lineNumbers");

  const status =
    document.getElementById("codeStatus");

  const runButton =
    document.getElementById("runCode");

  let files = [];
  let activeIndex = 0;

  function storageKey() {
    return `riseup_code_files_${currentUser}`;
  }

  function loadFiles() {
    try {
      files = JSON.parse(
        localStorage.getItem(storageKey()) || "[]"
      );
    } catch {
      files = [];
    }

    if (!Array.isArray(files)) {
      files = [];
    }

    if (!files.length) {
      files.push({
        name: "Game.rise",
        code:
`player.walk.speed = 5;
player.jump.power = 10;
player.health = 100;

when player.touches(coin)
    player.rux += coin.value;
    coin.remove();
end;`
      });
    }

    activeIndex = 0;

    renderFiles();
    loadActiveFile();
  }

  function saveFiles() {
    localStorage.setItem(
      storageKey(),
      JSON.stringify(files)
    );
  }

  function renderFiles() {
    fileList.innerHTML = "";

    files.forEach((file, index) => {

      const item =
        document.createElement("div");

      item.className =
        "file-item" +
        (index === activeIndex ? " active" : "");

      item.textContent =
        "▣ " + file.name;

      item.addEventListener("click", () => {

        saveCurrentFile();

        activeIndex = index;

        renderFiles();
        loadActiveFile();

      });

      fileList.appendChild(item);
    });
  }

  function loadActiveFile() {

    const file =
      files[activeIndex];

    if (!file) return;

    fileName.value =
      file.name;

    editor.value =
      file.code;

    document.getElementById(
      "currentFile"
    ).textContent =
      file.name;

    updateLines();
  }

  function saveCurrentFile() {

    if (!files[activeIndex]) {
      return;
    }

    files[activeIndex].name =
      fileName.value.trim() ||
      "Game.rise";

    files[activeIndex].code =
      editor.value;

    saveFiles();
  }

  function validateCode() {

    if (!window.RiseCode) {
      return {
        valid: false,
        error: "RiseCode compiler is not loaded."
      };
    }

    return window.RiseCode.validate(
      editor.value
    );
  }

  function saveCode() {

    saveCurrentFile();

    const result =
      validateCode();

    if (!result.valid) {

      status.textContent =
        "Error: " + result.error;

      toast(result.error);

      return false;
    }

    status.textContent =
      "Saved";

    renderFiles();

    toast("RiseCode saved.");

    return true;
  }

  function runCode() {

    saveCurrentFile();

    const result =
      validateCode();

    if (!result.valid) {

      status.textContent =
        "Error: " + result.error;

      toast(result.error);

      return;
    }

    if (!window.RiseCodeRuntime) {

      status.textContent =
        "Runtime missing";

      toast(
        "RiseCode runtime is not loaded."
      );

      return;
    }

    status.textContent =
      "Running...";

    runButton.disabled = true;

    try {

      const game =
        window.RiseUpGame ||
        window.RiseCodeGame ||
        createEditorGame();

      window.RiseCodeRuntime.run(
        files,
        game
      );

      /*
       * Tell Studio / the game that
       * RiseCode has been executed.
       */
      window.dispatchEvent(
        new CustomEvent(
          "riseup:code-run",
          {
            detail: {
              files: files,
              activeFile:
                files[activeIndex],
              game: game
            }
          }
        )
      );

      status.textContent =
        "Running";

      toast(
        "▶ RiseScript is running."
      );

    } catch (error) {

      console.error(error);

      status.textContent =
        "Runtime error";

      toast(
        error.message ||
        "RiseScript failed to run."
      );

    } finally {

      setTimeout(() => {
        runButton.disabled = false;
      }, 250);

    }
  }

  function createEditorGame() {

    if (!window.RiseCodeEditorGame) {

      window.RiseCodeEditorGame = {

        name: "RiseUp Game",

        player: {

          health: 100,

          speed: 5,

          jumpPower: 10,

          rux: 0

        },

        world: {

          gravity: 9.8

        },

        objects: []

      };

    }

    return window.RiseCodeEditorGame;
  }

  function createFile() {

    saveCurrentFile();

    files.push({

      name:
        `Script${files.length + 1}.rise`,

      code:
`player.walk.speed = 5;`

    });

    activeIndex =
      files.length - 1;

    saveFiles();

    renderFiles();
    loadActiveFile();

    toast(
      "New code file created."
    );
  }

  function updateLines() {

    const count =
      editor.value.split("\n").length;

    lineNumbers.textContent =
      Array.from(
        { length: count },
        (_, i) => i + 1
      ).join("\n");
  }

  function toast(message) {

    const el =
      document.getElementById(
        "codeToast"
      );

    el.textContent =
      message;

    el.classList.add("show");

    clearTimeout(
      toast.timer
    );

    toast.timer =
      setTimeout(() => {

        el.classList.remove(
          "show"
        );

      }, 2200);
  }

  editor.addEventListener(
    "input",
    updateLines
  );

  editor.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Tab") {
        return;
      }

      event.preventDefault();

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

      updateLines();
    }
  );

  editor.addEventListener(
    "scroll",
    () => {

      lineNumbers.scrollTop =
        editor.scrollTop;

    }
  );

  document
    .getElementById("saveCode")
    .addEventListener(
      "click",
      saveCode
    );

  runButton.addEventListener(
    "click",
    runCode
  );

  document
    .getElementById("newFile")
    .addEventListener(
      "click",
      createFile
    );

  document
    .getElementById("backStudio")
    .addEventListener(
      "click",
      () => {

        saveCurrentFile();

        window.location.href =
          "studio.html";

      }
    );

  fileName.addEventListener(
    "input",
    () => {

      if (files[activeIndex]) {

        files[activeIndex].name =
          fileName.value;

      }

    }
  );

  /*
   * Ctrl + S
   */
  document.addEventListener(
    "keydown",
    event => {

      if (
        (event.ctrlKey ||
         event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {

        event.preventDefault();

        saveCode();

      }

    }
  );

  /*
   * F5 = Run
   */
  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "F5"
      ) {

        event.preventDefault();

        runCode();

      }

    }
  );

  loadFiles();

})();