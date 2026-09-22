(function () {
"use strict";

const currentUser = localStorage.getItem("riseup_currentUser");

if (!currentUser) {
window.location.href = "index.html";
return;
}

const STORAGE_KEY = "riseup_studio_project";
const GAMES_KEY = "riseup_games";
const AVATAR_KEY = "riseup_avatar";

const state = {
projectName: localStorage.getItem("riseup_code_project") || "Untitled Project",
selectedId: "root",
activeTool: "select",
gridVisible: true,
cameraZoom: 1,
objects: [],
history: [],
future: [],
avatar: loadAvatar()
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
cacheElements();
loadProject();
loadAvatarIntoStudio();
bindEvents();
renderTree();
renderProperties();
updateProjectName();
updateSaveStatus("Saved");
writeOutput("RiseUp Studio ready.");
}

function cacheElements() {
els.projectNameDisplay = document.getElementById("projectNameDisplay");
els.saveStatus = document.getElementById("saveStatus");

```
els.sceneTree = document.getElementById("sceneTree");
els.objectTree = document.getElementById("objectTree");

els.propertiesPanel = document.getElementById("propertiesPanel");

els.viewport = document.getElementById("viewport");
els.previewCube = document.getElementById("previewCube");
els.studioAvatar = document.getElementById("studioAvatar");
els.viewportGrid = document.querySelector(".viewport-grid");

els.coordinatesInfo = document.getElementById("coordinatesInfo");

els.addObjectButton = document.getElementById("addObjectButton");
els.addObjectModal = document.getElementById("addObjectModal");
els.closeObjectModal = document.getElementById("closeObjectModal");

els.publishButton = document.getElementById("publishButton");
els.publishModal = document.getElementById("publishModal");
els.closePublishModal = document.getElementById("closePublishModal");
els.confirmPublishButton = document.getElementById("confirmPublishButton");
els.publishName = document.getElementById("publishName");
els.publishDescription = document.getElementById("publishDescription");

els.saveButton = document.getElementById("saveButton");
els.playButton = document.getElementById("playButton");
els.undoButton = document.getElementById("undoButton");
els.redoButton = document.getElementById("redoButton");

els.openCodeButton = document.getElementById("openCodeButton");
els.avatarButton = document.getElementById("avatarButton");

els.cameraResetButton = document.getElementById("cameraResetButton");
els.gridButton = document.getElementById("gridButton");

els.quickCode = document.getElementById("quickCode");
els.outputLog = document.getElementById("outputLog");

els.aiInput = document.getElementById("aiInput");
els.aiSendButton = document.getElementById("aiSendButton");
els.aiMessage = document.querySelector(".ai-message");
```

}

function bindEvents() {
els.addObjectButton.addEventListener("click", openObjectModal);
els.closeObjectModal.addEventListener("click", closeObjectModal);

```
els.publishButton.addEventListener("click", openPublishModal);
els.closePublishModal.addEventListener("click", closePublishModal);
els.confirmPublishButton.addEventListener("click", publishGame);

els.saveButton.addEventListener("click", saveProject);
els.playButton.addEventListener("click", playProject);
els.undoButton.addEventListener("click", undo);
els.redoButton.addEventListener("click", redo);

els.openCodeButton.addEventListener("click", function () {
  window.location.href = "code.html";
});

els.avatarButton.addEventListener("click", function () {
  window.location.href = "player3d.html";
});

els.gridButton.addEventListener("click", toggleGrid);
els.cameraResetButton.addEventListener("click", resetCamera);

document.querySelectorAll(".tool-button[data-tool]").forEach(function (button) {
  button.addEventListener("click", function () {
    state.activeTool = button.dataset.tool;

    document.querySelectorAll(".tool-button[data-tool]").forEach(function (item) {
      item.classList.remove("active");
    });

    button.classList.add("active");
    writeOutput("Tool selected: " + state.activeTool);
  });
});

document.querySelectorAll(".editor-tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    switchBottomTab(tab.dataset.tab);
  });
});

document.querySelectorAll("[data-object-type]").forEach(function (button) {
  button.addEventListener("click", function () {
    addObject(button.dataset.objectType);
  });
});

document.querySelectorAll("[data-ai]").forEach(function (button) {
  button.addEventListener("click", function () {
    handleAIRequest(button.dataset.ai);
  });
});

els.aiSendButton.addEventListener("click", function () {
  handleAIRequest(els.aiInput.value);
});

els.aiInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleAIRequest(els.aiInput.value);
  }
});

els.viewport.addEventListener("wheel", handleViewportWheel, {
  passive: false
});

els.viewport.addEventListener("mousedown", startViewportDrag);

window.addEventListener("keydown", handleKeyboard);

window.addEventListener("beforeunload", function () {
  saveProject(true);
});
```

}

function loadAvatar() {
try {
const raw = localStorage.getItem(AVATAR_KEY);

```
  if (!raw) {
    return {
      name: "Your Avatar",
      body: "default",
      material: "clay",
      pose: "standing",
      rotation: 0
    };
  }

  return JSON.parse(raw);
} catch (error) {
  return {
    name: "Your Avatar",
    body: "default",
    material: "clay",
    pose: "standing",
    rotation: 0
  };
}
```

}

function loadAvatarIntoStudio() {
if (!els.studioAvatar) {
return;
}

```
els.studioAvatar.className = "studio-avatar";

if (state.avatar.body) {
  els.studioAvatar.classList.add("avatar-body-" + state.avatar.body);
}

if (state.avatar.material) {
  els.studioAvatar.classList.add("avatar-material-" + state.avatar.material);
}

if (state.avatar.pose) {
  els.studioAvatar.classList.add("avatar-pose-" + state.avatar.pose);
}

const rotation = Number(state.avatar.rotation) || 0;

els.studioAvatar.style.transform =
  "translateX(-50%) rotateY(" + rotation + "deg)";
```

}

function loadProject() {
try {
const raw = localStorage.getItem(STORAGE_KEY);

```
  if (!raw) {
    state.objects = [
      {
        id: createId(),
        type: "Part",
        name: "Part",
        x: 0,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        sizeX: 4,
        sizeY: 4,
        sizeZ: 4
      }
    ];

    return;
  }

  const saved = JSON.parse(raw);

  if (saved.projectName) {
    state.projectName = saved.projectName;
  }

  if (Array.isArray(saved.objects)) {
    state.objects = saved.objects;
  }
} catch (error) {
  state.objects = [];
  writeOutput("Could not load the saved Studio project.");
}
```

}

function saveProject(silent) {
const project = {
version: 1,
projectName: state.projectName,
objects: state.objects,
avatar: state.avatar,
savedAt: new Date().toISOString()
};

```
localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
localStorage.setItem("riseup_code_project", state.projectName);

updateSaveStatus("Saved");

if (!silent) {
  showToast("Project saved.");
  writeOutput("Project saved successfully.");
}
```

}

function updateSaveStatus(text) {
if (els.saveStatus) {
els.saveStatus.textContent = text;
}
}

function markUnsaved() {
updateSaveStatus("Unsaved changes");
}

function updateProjectName() {
els.projectNameDisplay.textContent = state.projectName;
}

function createId() {
return "obj_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function pushHistory() {
state.history.push(JSON.stringify(state.objects));

```
if (state.history.length > 30) {
  state.history.shift();
}

state.future = [];
```

}

function undo() {
if (!state.history.length) {
showToast("Nothing to undo.");
return;
}

```
state.future.push(JSON.stringify(state.objects));

const previous = state.history.pop();

try {
  state.objects = JSON.parse(previous);
} catch (error) {
  state.objects = [];
}

state.selectedId = "root";

renderTree();
renderProperties();
markUnsaved();
writeOutput("Undo.");
```

}

function redo() {
if (!state.future.length) {
showToast("Nothing to redo.");
return;
}

```
state.history.push(JSON.stringify(state.objects));

const next = state.future.pop();

try {
  state.objects = JSON.parse(next);
} catch (error) {
  return;
}

renderTree();
renderProperties();
markUnsaved();
writeOutput("Redo.");
```

}

function renderTree() {
els.objectTree.innerHTML = "";

```
state.objects.forEach(function (object) {
  const item = document.createElement("div");

  item.className =
    "tree-item" +
    (state.selectedId === object.id ? " selected" : "");

  item.dataset.objectId = object.id;

  item.innerHTML =
    '<span class="tree-icon">◆</span>' +
    "<span>" +
    escapeHtml(object.name) +
    "</span>";

  item.addEventListener("click", function () {
    selectObject(object.id);
  });

  els.objectTree.appendChild(item);
});
```

}

function selectObject(id) {
state.selectedId = id;

```
renderTree();
renderProperties();

const object = findObject(id);

if (object) {
  els.coordinatesInfo.textContent =
    "X " + object.x +
    "   Y " + object.y +
    "   Z " + object.z;
} else {
  els.coordinatesInfo.textContent = "X 0   Y 0   Z 0";
}

updateCubePreview();
```

}

function findObject(id) {
return state.objects.find(function (object) {
return object.id === id;
}) || null;
}

function renderProperties() {
if (state.selectedId === "root") {
els.propertiesPanel.innerHTML =
'<div class="property-empty">' +
"Select an object to edit its properties." +
"</div>";

```
  return;
}

const object = findObject(state.selectedId);

if (!object) {
  state.selectedId = "root";
  renderProperties();
  return;
}

els.propertiesPanel.innerHTML = `
  <div class="property-group">
    <div class="property-title">Object</div>

    <div class="property-row">
      <label>Name</label>
      <input id="propName" value="${escapeAttribute(object.name)}">
    </div>

    <div class="property-row">
      <label>Type</label>
      <input value="${escapeAttribute(object.type)}" disabled>
    </div>
  </div>

  <div class="property-group">
    <div class="property-title">Position</div>

    <div class="property-row">
      <label>X</label>
      <input id="propX" type="number" value="${object.x}">
    </div>

    <div class="property-row">
      <label>Y</label>
      <input id="propY" type="number" value="${object.y}">
    </div>

    <div class="property-row">
      <label>Z</label>
      <input id="propZ" type="number" value="${object.z}">
    </div>
  </div>

  <div class="property-group">
    <div class="property-title">Rotation</div>

    <div class="property-row">
      <label>X</label>
      <input id="propRX" type="number" value="${object.rotationX}">
    </div>

    <div class="property-row">
      <label>Y</label>
      <input id="propRY" type="number" value="${object.rotationY}">
    </div>

    <div class="property-row">
      <label>Z</label>
      <input id="propRZ" type="number" value="${object.rotationZ}">
    </div>
  </div>

  <div class="property-group">
    <div class="property-title">Size</div>

    <div class="property-row">
      <label>X</label>
      <input id="propSX" type="number" value="${object.sizeX}">
    </div>

    <div class="property-row">
      <label>Y</label>
      <input id="propSY" type="number" value="${object.sizeY}">
    </div>

    <div class="property-row">
      <label>Z</label>
      <input id="propSZ" type="number" value="${object.sizeZ}">
    </div>
  </div>
`;

bindPropertyInputs();
```

}

function bindPropertyInputs() {
const ids = [
"propName",
"propX",
"propY",
"propZ",
"propRX",
"propRY",
"propRZ",
"propSX",
"propSY",
"propSZ"
];

```
ids.forEach(function (id) {
  const input = document.getElementById(id);

  if (!input) {
    return;
  }

  input.addEventListener("change", function () {
    updateSelectedObjectFromProperties();
  });
});
```

}

function updateSelectedObjectFromProperties() {
const object = findObject(state.selectedId);

```
if (!object) {
  return;
}

pushHistory();

object.name = document.getElementById("propName").value || object.type;

object.x = numberValue("propX", object.x);
object.y = numberValue("propY", object.y);
object.z = numberValue("propZ", object.z);

object.rotationX = numberValue("propRX", object.rotationX);
object.rotationY = numberValue("propRY", object.rotationY);
object.rotationZ = numberValue("propRZ", object.rotationZ);

object.sizeX = numberValue("propSX", object.sizeX);
object.sizeY = numberValue("propSY", object.sizeY);
object.sizeZ = numberValue("propSZ", object.sizeZ);

renderTree();
updateCubePreview();
markUnsaved();
```

}

function numberValue(id, fallback) {
const value = Number(document.getElementById(id).value);

```
return Number.isFinite(value) ? value : fallback;
```

}

function addObject(type) {
pushHistory();

```
const names = {
  Part: "Part",
  Spawn: "SpawnLocation",
  Light: "Light",
  Folder: "Folder"
};

const object = {
  id: createId(),
  type: type,
  name: names[type] || "Object",
  x: 0,
  y: 0,
  z: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  sizeX: type === "Part" ? 4 : 2,
  sizeY: type === "Part" ? 4 : 2,
  sizeZ: type === "Part" ? 4 : 2
};

state.objects.push(object);
state.selectedId = object.id;

closeObjectModal();
renderTree();
renderProperties();
updateCubePreview();

markUnsaved();
writeOutput("Added " + type + ".");
```

}

function updateCubePreview() {
if (!els.previewCube) {
return;
}

```
const object = findObject(state.selectedId);

if (!object) {
  els.previewCube.style.opacity = "0.35";
  return;
}

els.previewCube.style.opacity = "1";

const x = Number(object.x) || 0;
const y = Number(object.y) || 0;
const z = Number(object.z) || 0;

const rx = Number(object.rotationX) || 0;
const ry = Number(object.rotationY) || 0;
const rz = Number(object.rotationZ) || 0;

const size = Math.max(
  30,
  Math.min(100, Number(object.sizeX) * 12)
);

els.previewCube.style.width = size + "px";
els.previewCube.style.height = size + "px";

els.previewCube.style.transform =
  "translate(" +
  (75 + x * 4) +
  "px, " +
  (-y * 4) +
  "px) " +
  "rotateX(" + (-15 + rx) + "deg) " +
  "rotateY(" + (-30 + ry) + "deg) " +
  "rotateZ(" + (8 + rz) + "deg)";

els.coordinatesInfo.textContent =
  "X " + x +
  "   Y " + y +
  "   Z " + z;
```

}

function openObjectModal() {
els.addObjectModal.classList.remove("hidden");
}

function closeObjectModal() {
els.addObjectModal.classList.add("hidden");
}

function openPublishModal() {
els.publishModal.classList.remove("hidden");

```
els.publishName.value = state.projectName;
els.publishDescription.value = "";
```

}

function closePublishModal() {
els.publishModal.classList.add("hidden");
}

function publishGame() {
const name = els.publishName.value.trim() || state.projectName;
const description =
els.publishDescription.value.trim() ||
"A game created with RiseUp Studio.";

```
const games = readGames();

const existingIndex = games.findIndex(function (game) {
  return game.owner === currentUser &&
    game.name === name;
});

const game = {
  id: existingIndex >= 0
    ? games[existingIndex].id
    : "game_" + Date.now(),

  name: name,
  description: description,
  owner: currentUser,
  project: state.objects,
  avatar: state.avatar,
  updatedAt: new Date().toISOString(),
  createdAt: existingIndex >= 0
    ? games[existingIndex].createdAt
    : new Date().toISOString()
};

if (existingIndex >= 0) {
  games[existingIndex] = game;
} else {
  games.push(game);
}

localStorage.setItem(GAMES_KEY, JSON.stringify(games));

state.projectName = name;
updateProjectName();
saveProject(true);

closePublishModal();

showToast("Game published.");
writeOutput("Published \"" + name + "\".");

setTimeout(function () {
  window.location.href = "home.html";
}, 650);
```

}

function readGames() {
try {
const raw = localStorage.getItem(GAMES_KEY);

```
  if (!raw) {
    return [];
  }

  const games = JSON.parse(raw);

  return Array.isArray(games) ? games : [];
} catch (error) {
  return [];
}
```

}

function playProject() {
saveProject(true);

```
const playableProject = {
  projectName: state.projectName,
  objects: state.objects,
  avatar: state.avatar,
  owner: currentUser
};

localStorage.setItem(
  "riseup_play_project",
  JSON.stringify(playableProject)
);

localStorage.setItem(
  "riseup_play_game_id",
  "studio_preview"
);

showToast("Starting game preview...");
writeOutput("Game preview started.");

setTimeout(function () {
  window.location.href = "player3d.html?play=studio";
}, 350);
```

}

function toggleGrid() {
state.gridVisible = !state.gridVisible;

```
els.viewportGrid.style.display =
  state.gridVisible ? "block" : "none";

writeOutput(
  state.gridVisible
    ? "Grid enabled."
    : "Grid disabled."
);
```

}

function resetCamera() {
state.cameraZoom = 1;

```
els.worldTransformReset = true;

document.querySelector(".world").style.transform =
  "translate(-50%, -50%)";

writeOutput("Camera reset.");
```

}

function handleViewportWheel(event) {
event.preventDefault();

```
const direction = event.deltaY > 0 ? -0.08 : 0.08;

state.cameraZoom = Math.max(
  0.65,
  Math.min(1.5, state.cameraZoom + direction)
);

const scale = state.cameraZoom;

document.querySelector(".world").style.transform =
  "translate(-50%, -50%) scale(" + scale + ")";
```

}

function startViewportDrag(event) {
const startX = event.clientX;
const startY = event.clientY;

```
const world = document.querySelector(".world");

const initialX = state.viewportRotationX || 0;
const initialY = state.viewportRotationY || 0;

function move(moveEvent) {
  const dx = moveEvent.clientX - startX;
  const dy = moveEvent.clientY - startY;

  state.viewportRotationY = initialY + dx * 0.25;
  state.viewportRotationX = initialX - dy * 0.15;

  world.style.transform =
    "translate(-50%, -50%) " +
    "scale(" + state.cameraZoom + ") " +
    "rotateX(" + state.viewportRotationX + "deg) " +
    "rotateY(" + state.viewportRotationY + "deg)";
}

function stop() {
  window.removeEventListener("mousemove", move);
  window.removeEventListener("mouseup", stop);
}

window.addEventListener("mousemove", move);
window.addEventListener("mouseup", stop);
```

}

function switchBottomTab(tab) {
document.querySelectorAll(".editor-tab").forEach(function (button) {
button.classList.toggle(
"active",
button.dataset.tab === tab
);
});

```
document.getElementById("sceneTab").classList.toggle(
  "hidden",
  tab !== "scene"
);

document.getElementById("codeTab").classList.toggle(
  "hidden",
  tab !== "code"
);

document.getElementById("outputTab").classList.toggle(
  "hidden",
  tab !== "output"
);
```

}

function handleAIRequest(request) {
const text = String(request || "").trim();

```
if (!text) {
  return;
}

const lower = text.toLowerCase();

if (lower.includes("add") && lower.includes("block")) {
  els.aiMessage.textContent =
    "Where should I place the block?";

  writeOutput("AI: Where should I place the block?");

  els.aiInput.value = "";
  return;
}

if (
  lower.includes("where") ||
  lower.includes("standing") ||
  lower.includes("here")
) {
  addObject("Part");

  els.aiMessage.textContent =
    "Done. I placed a block at the requested location.";

  els.aiInput.value = "";
  return;
}

if (lower.includes("spawn")) {
  addObject("Spawn");

  els.aiMessage.textContent =
    "Done. I created a player spawn.";

  els.aiInput.value = "";
  return;
}

if (lower.includes("light")) {
  addObject("Light");

  els.aiMessage.textContent =
    "Done. I added a scene light.";

  els.aiInput.value = "";
  return;
}

if (lower.includes("delete")) {
  deleteSelectedObject();

  els.aiMessage.textContent =
    "The selected object was removed.";

  els.aiInput.value = "";
  return;
}

els.aiMessage.textContent =
  "I can build 3D objects, spawn points, lights, and scene structures. Try asking me to add a block.";

writeOutput("AI received: " + text);
els.aiInput.value = "";
```

}

function deleteSelectedObject() {
if (state.selectedId === "root") {
showToast("Select an object first.");
return;
}

```
const index = state.objects.findIndex(function (object) {
  return object.id === state.selectedId;
});

if (index === -1) {
  return;
}

pushHistory();

const removed = state.objects.splice(index, 1)[0];

state.selectedId = "root";

renderTree();
renderProperties();
updateCubePreview();
markUnsaved();

writeOutput("Deleted " + removed.name + ".");
```

}

function handleKeyboard(event) {
const target = event.target;

```
const typing =
  target &&
  (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA"
  );

if (
  (event.ctrlKey || event.metaKey) &&
  event.key.toLowerCase() === "s"
) {
  event.preventDefault();
  saveProject(false);
  return;
}

if (
  (event.ctrlKey || event.metaKey) &&
  event.shiftKey &&
  event.key.toLowerCase() === "z"
) {
  event.preventDefault();
  redo();
  return;
}

if (
  (event.ctrlKey || event.metaKey) &&
  event.key.toLowerCase() === "z" &&
  !event.shiftKey
) {
  event.preventDefault();
  undo();
  return;
}

if (typing) {
  return;
}

if (event.key === "Delete" || event.key === "Backspace") {
  deleteSelectedObject();
}

if (event.key === "F5") {
  event.preventDefault();
  saveProject(true);
  playProject();
}
```

}

function writeOutput(message) {
if (!els.outputLog) {
return;
}

```
const line = document.createElement("div");

line.textContent =
  "[" +
  new Date().toLocaleTimeString() +
  "] " +
  message;

els.outputLog.appendChild(line);
els.outputLog.scrollTop = els.outputLog.scrollHeight;
```

}

function showToast(message) {
const toast = document.getElementById("toast");

```
if (!toast) {
  return;
}

toast.textContent = message;
toast.classList.add("show");

clearTimeout(showToast.timer);

showToast.timer = setTimeout(function () {
  toast.classList.remove("show");
}, 2200);
```

}

function escapeHtml(value) {
return String(value)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");
}

function escapeAttribute(value) {
return escapeHtml(value);
}

window.RiseUpStudio = {
save: saveProject,
addObject: addObject,
deleteSelectedObject: deleteSelectedObject,
getObjects: function () {
return state.objects;
},
getAvatar: function () {
return state.avatar;
}
};
})();
