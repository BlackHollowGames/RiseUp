const STORAGE = {
currentUser: "riseup_currentUser",
project: "riseup_studio_project",
games: "riseup_games",
avatar: "riseup_avatar",
codeFilesPrefix: "riseup_code_files_",
codeProject: "riseup_code_project",
playProject: "riseup_play_project",
playGameId: "riseup_play_game_id",
lastGameId: "riseup_last_game_id"
};

const DEFAULT_FILES = {
"index.rise": `map.name = "World";

add.mesh.cube();
x = 0;
y = 0;
z = 0;

player.walk.speed = 5;`,
  "player.rise": `player.walk.speed = 5;

player.position.x = 0;
player.position.y = 2;
player.position.z = 0;`,
  "world.rise": `map.name = "World";

add.mesh.cube();
x = 0;
y = 0;
z = 0;`
};

const DEFAULT_PROJECT = {
version: 4,
name: "Untitled Project",
engine: "Game Engine X",
createdAt: Date.now(),
updatedAt: Date.now(),
scene: {
name: "World",
environment: "Default",
gravity: 9.81,
objects: []
},
settings: {
snap: true,
snapSize: 1,
gridSize: 1,
gridVisible: true,
shadows: true,
antialiasing: true,
physics: true,
fourD: false
},
camera: {
x: 12,
y: 10,
z: 14,
zoom: 1,
yaw: -35,
pitch: -25
}
};

const state = {
user: null,
project: null,
selectedId: null,
activeTool: "select",
activeDock: "explorer",
activeBottomTab: "scene",
activeCodeFile: "index.rise",
codeFiles: {},
codeDirty: false,
gridVisible: true,
snapEnabled: true,
snapSize: 1,
camera: {
x: 12,
y: 10,
z: 14,
zoom: 1,
yaw: -35,
pitch: -25,
panX: 0,
panY: 0
},
viewport: {
dragging: false,
dragMode: "orbit",
lastX: 0,
lastY: 0
},
history: [],
future: [],
logs: [],
consoleLines: [],
ai: {
waitingForPlacement: false,
lastPrompt: ""
},
playing: false,
loading: true,
blockDrag: null,
commandPaletteOpen: false,
contextMenuOpen: false,
importQueue: []
};

const dom = {};

function clone(value) {
try {
return structuredClone(value);
} catch {
return JSON.parse(JSON.stringify(value));
}
}

function byId(id) {
return document.getElementById(id);
}

function all(selector, root = document) {
return Array.from(root.querySelectorAll(selector));
}

function first(selector, root = document) {
return root.querySelector(selector);
}

function safeJSONParse(value, fallback) {
try {
return JSON.parse(value);
} catch {
return fallback;
}
}

function saveJSON(key, value) {
localStorage.setItem(key, JSON.stringify(value));
}

function readJSON(key, fallback) {
return safeJSONParse(localStorage.getItem(key), fallback);
}

function now() {
return new Date().toISOString();
}

function uid(prefix = "obj") {
return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function number(value, fallback = 0) {
const n = Number(value);
return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
return Math.max(min, Math.min(max, value));
}

function round(value, decimals = 3) {
const power = 10 ** decimals;
return Math.round(value * power) / power;
}

function titleCase(value) {
return String(value || "")
.replace(/[_-]+/g, " ")
.replace(/\b\w/g, c => c.toUpperCase());
}

function getUsername() {
const raw = localStorage.getItem(STORAGE.currentUser);
if (!raw) return null;

const parsed = safeJSONParse(raw, null);

if (typeof parsed === "string") return parsed;

if (parsed && typeof parsed === "object") {
return parsed.username || parsed.name || parsed.user || null;
}

return raw;
}

function defaultObject(type = "Part") {
const definitions = {
Part: {
type: "Part",
name: "Part",
size: { x: 2, y: 2, z: 2 },
color: "#55a7ff",
material: "plastic"
},
Wedge: {
type: "Wedge",
name: "Wedge",
size: { x: 3, y: 2, z: 3 },
color: "#55a7ff",
material: "plastic"
},
Sphere: {
type: "Sphere",
name: "Sphere",
size: { x: 2, y: 2, z: 2 },
color: "#8eb8ff",
material: "plastic"
},
Cylinder: {
type: "Cylinder",
name: "Cylinder",
size: { x: 2, y: 3, z: 2 },
color: "#6da6e8",
material: "plastic"
},
Plane: {
type: "Plane",
name: "Plane",
size: { x: 8, y: 0.2, z: 8 },
color: "#737b84",
material: "concrete"
},
Cone: {
type: "Cone",
name: "Cone",
size: { x: 2, y: 3, z: 2 },
color: "#e9a94d",
material: "plastic"
},
Spawn: {
type: "Spawn",
name: "Spawn",
size: { x: 3, y: 0.5, z: 3 },
color: "#54d48b",
material: "emissive"
},
Light: {
type: "Light",
name: "Light",
size: { x: 1, y: 1, z: 1 },
color: "#fff1b0",
material: "emissive"
},
Camera: {
type: "Camera",
name: "Camera",
size: { x: 1, y: 1, z: 1 },
color: "#b28cff",
material: "metal"
},
Folder: {
type: "Folder",
name: "Folder",
size: { x: 1, y: 1, z: 1 },
color: "#8893a1",
material: "default"
}
};

const definition = definitions[type] || definitions.Part;

return {
id: uid("object"),
type: definition.type,
name: definition.name,
position: { x: 0, y: 0, z: 0 },
rotation: { x: 0, y: 0, z: 0 },
size: clone(definition.size),
visible: true,
locked: false,
color: definition.color,
material: definition.material,
opacity: 1,
physics: {
static: true,
collision: true,
mass: 1,
gravity: true
},
visibility: {
castShadow: true,
receiveShadow: true
},
children: [],
metadata: {
createdAt: now(),
source: "studio"
}
};
}

function ensureProjectShape(project) {
const result = {
...clone(DEFAULT_PROJECT),
...(project || {})
};

result.scene = {
...clone(DEFAULT_PROJECT.scene),
...(project?.scene || {})
};

result.scene.objects = Array.isArray(project?.scene?.objects)
? project.scene.objects
: [];

result.settings = {
...clone(DEFAULT_PROJECT.settings),
...(project?.settings || {})
};

result.camera = {
...clone(DEFAULT_PROJECT.camera),
...(project?.camera || {})
};

if (!result.name) result.name = "Untitled Project";

return result;
}

function createInitialScene() {
const world = defaultObject("Folder");
world.id = "world";
world.name = "World";
world.type = "Folder";

const camera = defaultObject("Camera");
camera.id = "main_camera";
camera.name = "Main Camera";
camera.position = { x: 12, y: 10, z: 14 };
camera.rotation = { x: -25, y: 145, z: 0 };

const sun = defaultObject("Light");
sun.id = "sun";
sun.name = "Sun";
sun.position = { x: 8, y: 12, z: 5 };
sun.rotation = { x: -45, y: -30, z: 0 };

const environment = defaultObject("Folder");
environment.id = "environment";
environment.name = "Environment";

return [world, camera, sun, environment];
}

function initializeProject() {
const stored = readJSON(STORAGE.project, null);

if (stored) {
state.project = ensureProjectShape(stored);

```
if (!state.project.scene.objects.length) {
  state.project.scene.objects = createInitialScene();
}
```

} else {
state.project = ensureProjectShape(DEFAULT_PROJECT);
state.project.scene.objects = createInitialScene();
state.project.createdAt = Date.now();
state.project.updatedAt = Date.now();
}

state.gridVisible = state.project.settings.gridVisible !== false;
state.snapEnabled = state.project.settings.snap !== false;
state.snapSize = number(state.project.settings.snapSize, 1);

state.camera = {
...state.camera,
...clone(state.project.camera)
};
}

function initializeCodeFiles() {
const key = `${STORAGE.codeFilesPrefix}${state.user}`;
const saved = readJSON(key, null);

if (saved && typeof saved === "object") {
state.codeFiles = saved;
} else {
state.codeFiles = clone(DEFAULT_FILES);
saveJSON(key, state.codeFiles);
}

for (const [filename, content] of Object.entries(DEFAULT_FILES)) {
if (!(filename in state.codeFiles)) {
state.codeFiles[filename] = content;
}
}

if (!state.codeFiles[state.activeCodeFile]) {
state.activeCodeFile = Object.keys(state.codeFiles)[0] || "index.rise";
}

const codeProject = readJSON(STORAGE.codeProject, null);

if (codeProject?.name && state.project.name === "Untitled Project") {
state.project.name = codeProject.name;
}
}

function initializeDom() {
dom.viewport = byId("viewport");
dom.viewportCanvas =
byId("viewportCanvas") ||
first("canvas", dom.viewport || document);

dom.projectName =
byId("projectName") ||
first("[data-project-name]");

dom.sceneTree =
byId("sceneTree") ||
first("[data-scene-tree]");

dom.assetList =
byId("assetList") ||
first("[data-asset-list]");

dom.codeFileList =
byId("codeFileList") ||
first("[data-code-files]");

dom.codeEditor =
byId("codeEditor") ||
first("textarea[data-code-editor]") ||
first("textarea");

dom.inspector =
byId("inspector") ||
first("[data-inspector]");

dom.objectName =
byId("objectName") ||
first("[data-property='name']");

dom.aiInput =
byId("aiInput") ||
first("[data-ai-input]");

dom.aiMessages =
byId("aiMessages") ||
first("[data-ai-messages]");

dom.console =
byId("consoleOutput") ||
first("[data-console-output]");

dom.output =
byId("outputOutput") ||
first("[data-output]");

dom.commandPalette =
byId("commandPalette") ||
first("[data-command-palette]");

dom.commandInput =
byId("commandInput") ||
first("[data-command-input]");

dom.loadingScreen =
byId("loadingScreen") ||
first("[data-loading-screen]");

dom.toastContainer =
byId("toastContainer") ||
first("[data-toast-container]");

dom.contextMenu =
byId("contextMenu") ||
first("[data-context-menu]");

dom.assetInput =
byId("assetInput") ||
first("input[type='file']");

dom.canvas =
dom.viewportCanvas ||
document.createElement("canvas");

if (!dom.canvas.parentElement && dom.viewport) {
dom.viewport.appendChild(dom.canvas);
}

if (dom.canvas.tagName === "CANVAS") {
dom.canvas.setAttribute("aria-label", "Game Engine X 3D viewport");
}
}

function queryAction(action) {
return all(`[data-action="${action}"]`);
}

function queryTool(tool) {
return all(`[data-tool="${tool}"]`);
}

function bindClick(action, callback) {
queryAction(action).forEach(element => {
element.addEventListener("click", event => {
event.preventDefault();
callback(event, element);
});
});
}

function bindTool(tool, callback) {
queryTool(tool).forEach(element => {
element.addEventListener("click", event => {
event.preventDefault();
callback(event, element);
});
});
}

function bindEvents() {
bindActionButtons();
bindToolButtons();
bindNavigation();
bindInspector();
bindCodeEditor();
bindViewport();
bindAI();
bindMenus();
bindModals();
bindAssetImport();
bindKeyboard();
bindDragAndDrop();
}

function bindActionButtons() {
bindClick("save", saveProject);
bindClick("play", playProject);
bindClick("stop", stopProject);
bindClick("publish", openPublishModal);
bindClick("undo", undo);
bindClick("redo", redo);
bindClick("grid", toggleGrid);
bindClick("snap", toggleSnap);
bindClick("focus", focusSelected);
bindClick("camera-reset", resetCamera);
bindClick("fullscreen", toggleFullscreen);
bindClick("add-object", openAddObjectModal);
bindClick("rename-project", openRenameModal);
bindClick("project-settings", openSettingsModal);
bindClick("delete-project", openDeleteModal);
bindClick("command-palette", openCommandPalette);
bindClick("close-command-palette", closeCommandPalette);
bindClick("close-modal", closeAllModals);
bindClick("cancel-modal", closeAllModals);
bindClick("confirm-delete-project", deleteProject);
bindClick("confirm-rename-project", renameProject);
bindClick("confirm-publish", publishProject);
bindClick("toggle-ai", toggleAIPanel);
bindClick("import-asset", () => dom.assetInput?.click());
bindClick("account", toggleAccountMenu);
bindClick("project-menu", toggleProjectMenu);
bindClick("more-menu", toggleMoreMenu);
bindClick("new-code-file", createCodeFile);
bindClick("save-code", saveCodeFiles);
bindClick("run-code", runRiseCode);
bindClick("format-code", formatCode);
bindClick("clear-console", clearConsole);
bindClick("clear-output", clearOutput);
bindClick("ai-send", sendAI);
bindClick("ai-clear", clearAI);
bindClick("add-ai-block", () => {
setAIInput("add a block");
sendAI();
});
bindClick("play-test", playProject);
bindClick("stop-test", stopProject);
}

function bindToolButtons() {
["select", "move", "rotate", "scale"].forEach(tool => {
bindTool(tool, () => setTool(tool));
});
}

function bindNavigation() {
all("[data-dock]").forEach(element => {
element.addEventListener("click", () => {
setDock(element.dataset.dock);
});
});

all("[data-bottom-tab]").forEach(element => {
element.addEventListener("click", () => {
setBottomTab(element.dataset.bottomTab);
});
});

all("[data-object-type]").forEach(element => {
element.addEventListener("click", () => {
addObject(element.dataset.objectType);
closeAllModals();
});
});

all("[data-folder]").forEach(element => {
element.addEventListener("click", () => {
selectAssetFolder(element.dataset.folder);
});
});

all("[data-block-category]").forEach(element => {
element.addEventListener("click", () => {
renderBlockPalette(element.dataset.blockCategory);
});
});
}

function bindInspector() {
if (!dom.inspector) return;

dom.inspector.addEventListener("input", event => {
const target = event.target;
if (!target.dataset.property) return;

```
updateSelectedProperty(
  target.dataset.property,
  target.value,
  target.type === "number"
);
```

});

dom.inspector.addEventListener("change", event => {
const target = event.target;

```
if (target.dataset.property) {
  updateSelectedProperty(
    target.dataset.property,
    target.value,
    target.type === "number"
  );
}

if (target.dataset.booleanProperty) {
  updateSelectedBooleanProperty(
    target.dataset.booleanProperty,
    target.checked
  );
}
```

});
}

function bindCodeEditor() {
if (!dom.codeEditor) return;

dom.codeEditor.addEventListener("input", () => {
state.codeFiles[state.activeCodeFile] = dom.codeEditor.value;
state.codeDirty = true;
updateCodeStatus();
});

dom.codeEditor.addEventListener("keydown", event => {
if (event.key === "Tab") {
event.preventDefault();

```
  const start = dom.codeEditor.selectionStart;
  const end = dom.codeEditor.selectionEnd;

  dom.codeEditor.setRangeText(
    "    ",
    start,
    end,
    "end"
  );
}

if ((event.ctrlKey || event.metaKey) && event.key === "s") {
  event.preventDefault();
  saveCodeFiles();
}
```

});
}

function bindViewport() {
if (!dom.canvas) return;

dom.canvas.addEventListener("pointerdown", event => {
state.viewport.dragging = true;
state.viewport.lastX = event.clientX;
state.viewport.lastY = event.clientY;

```
if (event.button === 1 || event.altKey) {
  state.viewport.dragMode = "pan";
} else {
  state.viewport.dragMode = "orbit";
}

dom.canvas.setPointerCapture?.(event.pointerId);
```

});

dom.canvas.addEventListener("pointermove", event => {
if (!state.viewport.dragging) return;

```
const dx = event.clientX - state.viewport.lastX;
const dy = event.clientY - state.viewport.lastY;

state.viewport.lastX = event.clientX;
state.viewport.lastY = event.clientY;

if (state.viewport.dragMode === "pan") {
  state.camera.panX += dx;
  state.camera.panY += dy;
} else {
  state.camera.yaw += dx * 0.35;
  state.camera.pitch = clamp(
    state.camera.pitch + dy * 0.25,
    -85,
    85
  );
}

drawViewport();
```

});

const release = event => {
state.viewport.dragging = false;
dom.canvas.releasePointerCapture?.(event.pointerId);
};

dom.canvas.addEventListener("pointerup", release);
dom.canvas.addEventListener("pointercancel", release);

dom.canvas.addEventListener(
"wheel",
event => {
event.preventDefault();

```
  const factor = event.deltaY > 0 ? 0.9 : 1.1;

  state.camera.zoom = clamp(
    state.camera.zoom * factor,
    0.15,
    8
  );

  drawViewport();
},
{ passive: false }
```

);

dom.canvas.addEventListener("dblclick", event => {
const object = pickObject(event);

```
if (object) {
  selectObject(object.id);
  focusSelected();
}
```

});

dom.canvas.addEventListener("click", event => {
if (state.viewport.dragging) return;

```
const object = pickObject(event);

if (object) {
  selectObject(object.id);
}
```

});
}

function bindAI() {
if (!dom.aiInput) return;

dom.aiInput.addEventListener("keydown", event => {
if (event.key === "Enter" && !event.shiftKey) {
event.preventDefault();
sendAI();
}
});
}

function bindMenus() {
document.addEventListener("click", event => {
if (!event.target.closest("[data-menu-root]")) {
closeMenus();
}
});

if (dom.commandInput) {
dom.commandInput.addEventListener("input", () => {
renderCommandResults(dom.commandInput.value);
});

```
dom.commandInput.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCommandPalette();
  }

  if (event.key === "Enter") {
    const firstResult = first(
      "[data-command-result]",
      dom.commandPalette || document
    );

    firstResult?.click();
  }
});
```

}
}

function bindModals() {
all("[data-modal-backdrop]").forEach(backdrop => {
backdrop.addEventListener("click", event => {
if (event.target === backdrop) {
closeAllModals();
}
});
});
}

function bindAssetImport() {
if (!dom.assetInput) return;

dom.assetInput.addEventListener("change", event => {
const files = Array.from(event.target.files || []);

```
files.forEach(file => {
  importAsset(file);
});

event.target.value = "";
```

});
}

function bindKeyboard() {
document.addEventListener("keydown", event => {
const command = event.ctrlKey || event.metaKey;

```
if (command && event.key.toLowerCase() === "s") {
  event.preventDefault();
  saveProject();
  return;
}

if (command && event.key.toLowerCase() === "z") {
  event.preventDefault();

  if (event.shiftKey) {
    redo();
  } else {
    undo();
  }

  return;
}

if (command && event.key.toLowerCase() === "k") {
  event.preventDefault();
  openCommandPalette();
  return;
}

if (event.key === "F5") {
  event.preventDefault();
  playProject();
  return;
}

if ((command && event.key === "Enter") || event.key === "F4") {
  event.preventDefault();
  playProject();
  return;
}

if (
  (event.key === "Delete" || event.key === "Backspace") &&
  !isTypingTarget(event.target)
) {
  event.preventDefault();
  deleteSelected();
  return;
}

if (event.key === "Escape") {
  closeAllModals();
  closeCommandPalette();
  closeMenus();
}

if (isTypingTarget(event.target)) return;

if (event.key.toLowerCase() === "q") setTool("select");
if (event.key.toLowerCase() === "w") setTool("move");
if (event.key.toLowerCase() === "e") setTool("rotate");
if (event.key.toLowerCase() === "r") setTool("scale");
```

});
}

function bindDragAndDrop() {
document.addEventListener("dragover", event => {
if (
event.target.closest(".viewport") ||
event.target.closest("[data-asset-drop]")
) {
event.preventDefault();
}
});

document.addEventListener("drop", event => {
const files = Array.from(event.dataTransfer?.files || []);

```
if (!files.length) return;

const target = event.target.closest(
  ".viewport,[data-asset-drop]"
);

if (!target) return;

event.preventDefault();

files.forEach(file => importAsset(file));
```

});
}

function isTypingTarget(target) {
if (!target) return false;

const tag = target.tagName?.toLowerCase();

return (
tag === "input" ||
tag === "textarea" ||
tag === "select" ||
target.isContentEditable
);
}

function setTool(tool) {
state.activeTool = tool;

queryTool("[data-tool]").forEach(() => {});

all("[data-tool]").forEach(element => {
element.classList.toggle(
"active",
element.dataset.tool === tool
);

```
element.setAttribute(
  "aria-pressed",
  element.dataset.tool === tool ? "true" : "false"
);
```

});

showToast(`${titleCase(tool)} tool selected`);
drawViewport();
}

function setDock(dock) {
state.activeDock = dock;

all("[data-dock]").forEach(element => {
element.classList.toggle(
"active",
element.dataset.dock === dock
);
});

all("[data-dock-panel]").forEach(panel => {
panel.hidden = panel.dataset.dockPanel !== dock;
});
}

function setBottomTab(tab) {
state.activeBottomTab = tab;

all("[data-bottom-tab]").forEach(element => {
element.classList.toggle(
"active",
element.dataset.bottomTab === tab
);
});

all("[data-bottom-panel]").forEach(panel => {
panel.hidden = panel.dataset.bottomPanel !== tab;
});

if (tab === "code") {
renderCodeFiles();
loadActiveCode();
}

if (tab === "blocks") {
renderBlockPalette("logic");
renderBlocksWorkspace();
}

if (tab === "output") {
renderOutput();
}

if (tab === "console") {
renderConsole();
}
}

function getObjects() {
return state.project?.scene?.objects || [];
}

function getObject(id) {
return getObjects().find(object => object.id === id) || null;
}

function selectObject(id) {
const object = getObject(id);

if (!object) {
state.selectedId = null;
renderAll();
return;
}

state.selectedId = id;

renderSceneTree();
renderInspector();
drawViewport();
}

function getSelectedObject() {
return getObject(state.selectedId);
}

function addObject(type = "Part", options = {}) {
checkpoint();

const object = defaultObject(type);

object.name =
options.name ||
`${object.name}${countObjectsOfType(type) + 1}`;

object.position = {
x: number(options.x, 0),
y: number(options.y, 0),
z: number(options.z, 0)
};

object.rotation = {
x: number(options.rotationX, 0),
y: number(options.rotationY, 0),
z: number(options.rotationZ, 0)
};

object.size = {
x: number(options.sizeX, object.size.x),
y: number(options.sizeY, object.size.y),
z: number(options.sizeZ, object.size.z)
};

if (options.color) {
object.color = options.color;
}

getObjects().push(object);

state.selectedId = object.id;

touchProject();
renderAll();

showToast(`${object.name} added`);

return object;
}

function countObjectsOfType(type) {
return getObjects().filter(object => object.type === type).length;
}

function deleteSelected() {
const object = getSelectedObject();

if (!object) return;

if (object.locked) {
showToast("This object is locked");
return;
}

checkpoint();

const index = getObjects().findIndex(
item => item.id === object.id
);

if (index >= 0) {
getObjects().splice(index, 1);
}

state.selectedId = null;

touchProject();
renderAll();

showToast(`${object.name} deleted`);
}

function duplicateSelected() {
const object = getSelectedObject();

if (!object) return;

checkpoint();

const copy = clone(object);

copy.id = uid("object");
copy.name = `${object.name} Copy`;
copy.position.x += state.snapEnabled ? state.snapSize : 1;

getObjects().push(copy);
state.selectedId = copy.id;

touchProject();
renderAll();

showToast(`${copy.name} duplicated`);
}

function updateSelectedProperty(property, value, numeric = false) {
const object = getSelectedObject();

if (!object || object.locked) return;

const parts = property.split(".");

let target = object;

for (let index = 0; index < parts.length - 1; index++) {
if (!target[parts[index]]) {
target[parts[index]] = {};
}

```
target = target[parts[index]];
```

}

const key = parts[parts.length - 1];

if (numeric) {
value = number(value, 0);
}

if (property === "position.x" ||
property === "position.y" ||
property === "position.z") {
value = applySnap(number(value));
}

if (property === "rotation.x" ||
property === "rotation.y" ||
property === "rotation.z") {
value = number(value);
}

if (
property === "size.x" ||
property === "size.y" ||
property === "size.z"
) {
value = Math.max(0.01, number(value, 1));
}

target[key] = value;

touchProject(false);
renderInspector();
renderSceneTree();
drawViewport();
}

function updateSelectedBooleanProperty(property, checked) {
const object = getSelectedObject();

if (!object || object.locked) return;

const parts = property.split(".");
let target = object;

for (let index = 0; index < parts.length - 1; index++) {
if (!target[parts[index]]) {
target[parts[index]] = {};
}

```
target = target[parts[index]];
```

}

target[parts[parts.length - 1]] = Boolean(checked);

touchProject(false);
drawViewport();
}

function applySnap(value) {
if (!state.snapEnabled) return value;

const step = Math.max(0.001, state.snapSize);

return round(Math.round(value / step) * step);
}

function checkpoint() {
if (!state.project) return;

state.history.push({
project: clone(state.project),
selectedId: state.selectedId
});

if (state.history.length > 100) {
state.history.shift();
}

state.future.length = 0;
}

function undo() {
const previous = state.history.pop();

if (!previous) {
showToast("Nothing to undo");
return;
}

state.future.push({
project: clone(state.project),
selectedId: state.selectedId
});

state.project = ensureProjectShape(previous.project);
state.selectedId = previous.selectedId || null;

state.camera = {
...state.camera,
...clone(state.project.camera)
};

touchProject(false);
renderAll();

showToast("Undo");
}

function redo() {
const next = state.future.pop();

if (!next) {
showToast("Nothing to redo");
return;
}

state.history.push({
project: clone(state.project),
selectedId: state.selectedId
});

state.project = ensureProjectShape(next.project);
state.selectedId = next.selectedId || null;

state.camera = {
...state.camera,
...clone(state.project.camera)
};

touchProject(false);
renderAll();

showToast("Redo");
}

function touchProject(updateStorage = true) {
if (!state.project) return;

state.project.updatedAt = Date.now();

state.project.settings.gridVisible = state.gridVisible;
state.project.settings.snap = state.snapEnabled;
state.project.settings.snapSize = state.snapSize;

state.project.camera = {
...state.camera
};

if (updateStorage) {
saveJSON(STORAGE.project, state.project);
}
}

function saveProject() {
touchProject(true);
saveJSON(STORAGE.project, state.project);

if (state.codeDirty) {
saveCodeFiles();
}

logConsole(
"system",
`Project "${state.project.name}" saved.`
);

showToast("Project saved");
}

function loadProject() {
const saved = readJSON(STORAGE.project, null);

if (!saved) {
showToast("No saved project found");
return;
}

checkpoint();

state.project = ensureProjectShape(saved);

state.camera = {
...state.camera,
...clone(state.project.camera)
};

state.gridVisible =
state.project.settings.gridVisible !== false;

state.snapEnabled =
state.project.settings.snap !== false;

state.snapSize =
number(state.project.settings.snapSize, 1);

renderAll();

showToast("Project loaded");
}

function resetCamera() {
state.camera = {
x: 12,
y: 10,
z: 14,
zoom: 1,
yaw: -35,
pitch: -25,
panX: 0,
panY: 0
};

touchProject();
drawViewport();
showToast("Camera reset");
}

function focusSelected() {
const object = getSelectedObject();

if (!object) {
resetCamera();
return;
}

state.camera.panX = -object.position.x * 15;
state.camera.panY = object.position.y * 8;

state.camera.zoom = 1.5;

drawViewport();

showToast(`Focused ${object.name}`);
}

function toggleGrid() {
state.gridVisible = !state.gridVisible;

state.project.settings.gridVisible = state.gridVisible;

touchProject();

updateActionStates();
drawViewport();

showToast(
state.gridVisible ? "Grid enabled" : "Grid hidden"
);
}

function toggleSnap() {
state.snapEnabled = !state.snapEnabled;

state.project.settings.snap = state.snapEnabled;

touchProject();

updateActionStates();

showToast(
state.snapEnabled ? "Snap enabled" : "Snap disabled"
);
}

function toggleFullscreen() {
if (!document.fullscreenElement) {
document.documentElement.requestFullscreen?.();
} else {
document.exitFullscreen?.();
}
}

function playProject() {
if (state.playing) return;

saveProject();

state.playing = true;

saveJSON(STORAGE.playProject, {
...clone(state.project),
codeFiles: clone(state.codeFiles),
startedAt: Date.now()
});

localStorage.setItem(
STORAGE.playGameId,
state.project.name
);

localStorage.setItem(
STORAGE.lastGameId,
state.project.name
);

updatePlayState();

logConsole("play", "Game started in test mode.");

const url = `player3d.html?play=studio`;

setTimeout(() => {
window.location.href = url;
}, 100);
}

function stopProject() {
state.playing = false;

updatePlayState();

logConsole("play", "Game stopped.");

showToast("Game stopped");
}

function updatePlayState() {
all("[data-action='play']").forEach(button => {
button.disabled = state.playing;
});

all("[data-action='stop']").forEach(button => {
button.disabled = !state.playing;
});

document.body.classList.toggle(
"engine-playing",
state.playing
);
}

function openAddObjectModal() {
showModal("addObjectModal");
}

function openPublishModal() {
populatePublishModal();
showModal("publishModal");
}

function openSettingsModal() {
populateSettingsModal();
showModal("settingsModal");
}

function openDeleteModal() {
showModal("deleteProjectModal");
}

function openRenameModal() {
populateRenameModal();
showModal("renameProjectModal");
}

function showModal(id) {
const modal = byId(id);

if (!modal) return;

modal.hidden = false;
modal.classList.add("open");

const focusable = first(
"input,textarea,button,select",
modal
);

focusable?.focus();
}

function closeAllModals() {
all(
".modal,.modal-backdrop,[data-modal]"
).forEach(element => {
if (
element.classList.contains("modal") ||
element.dataset.modal !== undefined
) {
element.classList.remove("open");
element.hidden = true;
}
});
}

function populateRenameModal() {
const input =
byId("renameProjectInput") ||
first("[data-rename-project-input]");

if (input) {
input.value = state.project.name;
}
}

function populateSettingsModal() {
const settings = state.project.settings;

const map = {
gridSize: settings.gridSize,
snapSize: settings.snapSize,
gravity: state.project.scene.gravity
};

for (const [key, value] of Object.entries(map)) {
const element =
byId(`setting-${key}`) ||
first(`[data-setting="${key}"]`);

```
if (element) {
  element.value = value;
}
```

}

const checkboxes = {
shadows: settings.shadows,
antialiasing: settings.antialiasing,
physics: settings.physics,
fourD: settings.fourD
};

for (const [key, checked] of Object.entries(checkboxes)) {
const element =
byId(`setting-${key}`) ||
first(`[data-setting="${key}"]`);

```
if (element) {
  element.checked = Boolean(checked);
}
```

}
}

function populatePublishModal() {
const input =
byId("publishName") ||
first("[data-publish-name]");

if (input) {
input.value = state.project.name;
}

const description =
byId("publishDescription") ||
first("[data-publish-description]");

if (description) {
description.value =
state.project.description ||
"A game created with RiseUp Studio.";
}
}

function renameProject() {
const input =
byId("renameProjectInput") ||
first("[data-rename-project-input]");

const value = input?.value?.trim();

if (!value) {
showToast("Enter a project name");
return;
}

checkpoint();

state.project.name = value;

touchProject();
updateProjectName();
closeAllModals();

showToast(`Renamed to ${value}`);
}

function deleteProject() {
checkpoint();

const previousProject = clone(state.project);

state.project = ensureProjectShape(DEFAULT_PROJECT);
state.project.name = "Untitled Project";
state.project.scene.objects = createInitialScene();

state.selectedId = null;
state.history = state.history.slice(-100);

localStorage.removeItem(STORAGE.project);

touchProject(true);
renderAll();
closeAllModals();

logConsole(
"system",
`Project "${previousProject.name}" was reset.`
);

showToast(
"Project reset. Ctrl+Shift+Z can restore it."
);
}

function publishProject() {
const nameInput =
byId("publishName") ||
first("[data-publish-name]");

const descriptionInput =
byId("publishDescription") ||
first("[data-publish-description]");

const name =
nameInput?.value?.trim() ||
state.project.name;

const description =
descriptionInput?.value?.trim() ||
"A game created with RiseUp Studio.";

const games = readJSON(STORAGE.games, []);

const existingIndex = games.findIndex(game => {
return (
game.owner === state.user &&
game.name === state.project.name
);
});

const game = {
id:
existingIndex >= 0
? games[existingIndex].id
: uid("game"),
name,
description,
owner: state.user,
engine: "Game Engine X",
platform: "RiseUp",
updatedAt: Date.now(),
createdAt:
existingIndex >= 0
? games[existingIndex].createdAt
: Date.now(),
project: clone(state.project),
codeFiles: clone(state.codeFiles),
avatar: readJSON(STORAGE.avatar, {
name: "Your Avatar",
body: "default",
material: "clay",
pose: "standing",
rotation: 0
}),
thumbnail: null,
published: true
};

if (existingIndex >= 0) {
games[existingIndex] = game;
} else {
games.push(game);
}

saveJSON(STORAGE.games, games);

state.project.name = name;
state.project.description = description;

saveProject();

localStorage.setItem(
STORAGE.lastGameId,
game.id
);

closeAllModals();

logConsole(
"publish",
`Published "${game.name}" as ${game.id}.`
);

showToast("Game published");

setTimeout(() => {
window.location.href = "home.html";
}, 400);
}

function toggleAIPanel() {
const panel =
byId("aiPanel") ||
first("[data-ai-panel]");

if (!panel) return;

panel.classList.toggle("open");
panel.hidden = !panel.classList.contains("open");
}

function setAIInput(value) {
if (!dom.aiInput) return;

dom.aiInput.value = value;
dom.aiInput.focus();
}

function sendAI() {
if (!dom.aiInput) return;

const prompt = dom.aiInput.value.trim();

if (!prompt) return;

dom.aiInput.value = "";

addAIMessage("user", prompt);

state.ai.lastPrompt = prompt;

const response = processAICommand(prompt);

addAIMessage("assistant", response);
}

function processAICommand(prompt) {
const text = prompt.toLowerCase();

if (state.ai.waitingForPlacement) {
if (
text.includes("where") ||
text.includes("standing") ||
text.includes("here") ||
text.includes("ground") ||
text.includes("feet") ||
text.includes("player")
) {
state.ai.waitingForPlacement = false;

```
  const object = addObject("Part", {
    name: "AI Block",
    x: 0,
    y: 1,
    z: 0,
    sizeX: 2,
    sizeY: 2,
    sizeZ: 2
  });

  return `Added a 3D block at the player's standing position. Selected ${object.name}.`;
}

return "Tell me where in the 3D world you want it placed, such as the ground, where the player is standing, or a specific position.";
```

}

if (
text.includes("add a block") ||
text.includes("add block") ||
text.includes("create a block")
) {
state.ai.waitingForPlacement = true;

```
return "Where should I place the block?";
```

}

if (
text.includes("add a cube") ||
text.includes("create a cube")
) {
const object = addObject("Part", {
name: "Cube"
});

```
return `Created ${object.name} in the 3D scene.`;
```

}

if (text.includes("sphere")) {
const object = addObject("Sphere");

```
return `Created ${object.name}.`;
```

}

if (text.includes("wedge")) {
const object = addObject("Wedge");

```
return `Created ${object.name}.`;
```

}

if (text.includes("cylinder")) {
const object = addObject("Cylinder");

```
return `Created ${object.name}.`;
```

}

if (text.includes("cone")) {
const object = addObject("Cone");

```
return `Created ${object.name}.`;
```

}

if (
text.includes("spawn") ||
text.includes("spawn point")
) {
const object = addObject("Spawn", {
name: "Player Spawn",
y: 0.25
});

```
return `Created ${object.name}.`;
```

}

if (text.includes("light")) {
const object = addObject("Light", {
name: "Scene Light",
y: 5
});

```
return `Created ${object.name}.`;
```

}

if (text.includes("camera")) {
const object = addObject("Camera", {
name: "Camera"
});

```
return `Created ${object.name}.`;
```

}

if (
text.includes("delete") ||
text.includes("remove")
) {
if (getSelectedObject()) {
const name = getSelectedObject().name;
deleteSelected();
return `Deleted ${name}.`;
}

```
return "Select a 3D object first, then I can remove it.";
```

}

if (text.includes("duplicate") || text.includes("copy")) {
if (!getSelectedObject()) {
return "Select a 3D object first.";
}

```
duplicateSelected();

return "Duplicated the selected 3D object.";
```

}

if (text.includes("select")) {
const objectName = extractObjectName(
prompt,
["select", "select the"]
);

```
const object = findObjectByName(objectName);

if (object) {
  selectObject(object.id);
  return `Selected ${object.name}.`;
}

return "I couldn't find that object in the 3D scene.";
```

}

if (text.includes("move")) {
return "Use the Move tool or edit Position X, Y, and Z in the Inspector.";
}

if (text.includes("rotate")) {
return "Use the Rotate tool or edit Rotation X, Y, and Z in the Inspector.";
}

if (text.includes("scale")) {
return "Use the Scale tool or edit Size X, Y, and Z in the Inspector.";
}

if (
text.includes("map") ||
text.includes("world")
) {
if (text.includes("name")) {
const nameMatch =
prompt.match(/name\s+(?:the\s+)?(?:map|world)?\s*(?:to)?\s*["']?([^"']+)["']?$/i);

```
  if (nameMatch?.[1]) {
    checkpoint();

    state.project.scene.name =
      nameMatch[1].trim();

    touchProject();
    renderAll();

    return `The world is now named ${state.project.scene.name}.`;
  }
}

return "The current workspace is a 3D world. You can build it with meshes, lights, cameras, terrain, and scene objects.";
```

}

if (
text.includes("4d") ||
text.includes("four dimensional") ||
text.includes("four-dimensional")
) {
state.project.settings.fourD = true;

```
touchProject();
renderAll();

return "4D workspace mode is enabled. The scene remains spatially editable while 4D project data can be stored in the project settings.";
```

}

if (
text.includes("3d") ||
text.includes("three dimensional") ||
text.includes("three-dimensional")
) {
return "This Studio workspace is focused on building 3D scenes with Game Engine X.";
}

if (
text.includes("code") ||
text.includes("risecode")
) {
setBottomTab("code");

```
return "The RiseCode workspace is open. You can edit index.rise, player.rise, and world.rise.";
```

}

if (
text.includes("block") ||
text.includes("blocks")
) {
setBottomTab("blocks");

```
return "The visual scripting workspace is open.";
```

}

if (
text.includes("save")
) {
saveProject();
return "Project saved.";
}

if (
text.includes("play") ||
text.includes("test")
) {
return "Use Play to test the current 3D project.";
}

return "I can help with 3D and 4D scene building, meshes, cameras, lights, transforms, maps, RiseCode, visual scripting, and project settings.";
}

function extractObjectName(prompt, prefixes) {
let result = prompt;

prefixes.forEach(prefix => {
result = result.replace(
new RegExp(`^${prefix}\\s*`, "i"),
""
);
});

return result.trim();
}

function findObjectByName(name) {
if (!name) return null;

const normalized = name.toLowerCase();

return getObjects().find(object => {
return (
object.name.toLowerCase() === normalized ||
object.name.toLowerCase().includes(normalized)
);
});
}

function addAIMessage(role, message) {
if (!dom.aiMessages) return;

const wrapper = document.createElement("div");

wrapper.className = `ai-message ai-${role}`;

const label = document.createElement("div");

label.className = "ai-message-role";
label.textContent =
role === "user" ? "You" : "Rise AI";

const content = document.createElement("div");

content.className = "ai-message-content";
content.textContent = message;

wrapper.append(label, content);

dom.aiMessages.appendChild(wrapper);

dom.aiMessages.scrollTop =
dom.aiMessages.scrollHeight;
}

function clearAI() {
if (dom.aiMessages) {
dom.aiMessages.innerHTML = "";
}

state.ai.waitingForPlacement = false;
}

function renderAll() {
updateProjectName();
updateActionStates();
renderSceneTree();
renderAssets();
renderCodeFiles();
loadActiveCode();
renderInspector();
renderOutput();
renderConsole();
renderBlocksWorkspace();
renderBlockPalette("logic");
renderAvatar();
drawViewport();
updatePlayState();
}

function updateProjectName() {
if (!state.project) return;

if (dom.projectName) {
dom.projectName.textContent =
state.project.name;
}

all("[data-project-title]").forEach(element => {
element.textContent = state.project.name;
});

document.title =
`${state.project.name} — RiseUp Studio`;
}

function updateActionStates() {
all("[data-action='grid']").forEach(button => {
button.classList.toggle(
"active",
state.gridVisible
);

```
button.setAttribute(
  "aria-pressed",
  String(state.gridVisible)
);
```

});

all("[data-action='snap']").forEach(button => {
button.classList.toggle(
"active",
state.snapEnabled
);

```
button.setAttribute(
  "aria-pressed",
  String(state.snapEnabled)
);
```

});
}

function renderSceneTree() {
if (!dom.sceneTree) return;

dom.sceneTree.innerHTML = "";

const objects = getObjects();

objects.forEach(object => {
const row = document.createElement("button");

```
row.type = "button";
row.className = "scene-tree-row";
row.classList.toggle(
  "selected",
  object.id === state.selectedId
);

row.dataset.objectId = object.id;

const icon = document.createElement("span");

icon.className = "scene-tree-icon";
icon.textContent = sceneIcon(object.type);

const name = document.createElement("span");

name.className = "scene-tree-name";
name.textContent = object.name;

const type = document.createElement("span");

type.className = "scene-tree-type";
type.textContent = object.type;

row.append(icon, name, type);

row.addEventListener("click", () => {
  selectObject(object.id);
});

row.addEventListener("contextmenu", event => {
  event.preventDefault();
  selectObject(object.id);
  showObjectContextMenu(
    event.clientX,
    event.clientY
  );
});

dom.sceneTree.appendChild(row);
```

});

if (!objects.length) {
const empty = document.createElement("div");

```
empty.className = "empty-state";
empty.textContent = "Scene is empty";

dom.sceneTree.appendChild(empty);
```

}
}

function sceneIcon(type) {
const icons = {
Folder: "▱",
Part: "□",
Wedge: "◢",
Sphere: "○",
Cylinder: "◯",
Plane: "▱",
Cone: "△",
Spawn: "⌖",
Light: "✦",
Camera: "▣"
};

return icons[type] || "□";
}

function renderAssets() {
if (!dom.assetList) return;

const assets = [
["cube", "Cube", "Part"],
["wedge", "Wedge", "Wedge"],
["sphere", "Sphere", "Sphere"],
["cylinder", "Cylinder", "Cylinder"],
["plane", "Plane", "Plane"],
["cone", "Cone", "Cone"],
["spawn", "Spawn", "Spawn"],
["light", "Light", "Light"],
["camera", "Camera", "Camera"]
];

dom.assetList.innerHTML = "";

assets.forEach(([id, label, type]) => {
const button = document.createElement("button");

```
button.type = "button";
button.className = "asset-item";
button.dataset.asset = id;
button.draggable = true;

const preview = document.createElement("span");

preview.className = `asset-preview asset-${id}`;

const title = document.createElement("span");

title.className = "asset-title";
title.textContent = label;

const subtitle = document.createElement("span");

subtitle.className = "asset-subtitle";
subtitle.textContent = type;

button.append(preview, title, subtitle);

button.addEventListener("dblclick", () => {
  addObject(type);
});

button.addEventListener("dragstart", event => {
  event.dataTransfer?.setData(
    "application/x-riseup-object",
    type
  );
});

dom.assetList.appendChild(button);
```

});
}

function selectAssetFolder(folder) {
all("[data-folder]").forEach(element => {
element.classList.toggle(
"active",
element.dataset.folder === folder
);
});

showToast(`${titleCase(folder)} assets`);
}

function renderInspector() {
if (!dom.inspector) return;

const object = getSelectedObject();

if (!object) {
renderEmptyInspector();
return;
}

const propertyInputs =
all("[data-property]", dom.inspector);

propertyInputs.forEach(input => {
const value = getPropertyPath(
object,
input.dataset.property
);

```
if (input.type === "checkbox") {
  input.checked = Boolean(value);
} else {
  input.value =
    value === undefined ||
    value === null
      ? ""
      : value;
}
```

});

const objectName =
first("[data-object-name]", dom.inspector);

if (objectName) {
objectName.value = object.name;
}

const labels =
all("[data-inspector-object]", dom.inspector);

labels.forEach(element => {
element.textContent = object.name;
});

all("[data-object-type]", dom.inspector).forEach(element => {
element.textContent = object.type;
});
}

function renderEmptyInspector() {
all("[data-inspector-object]", dom.inspector || document)
.forEach(element => {
element.textContent = "No Selection";
});

all("[data-property]", dom.inspector || document)
.forEach(input => {
if (input.type === "checkbox") {
input.checked = false;
} else {
input.value = "";
}
});
}

function getPropertyPath(object, path) {
return path.split(".").reduce(
(current, key) =>
current == null ? undefined : current[key],
object
);
}

function renderCodeFiles() {
if (!dom.codeFileList) return;

dom.codeFileList.innerHTML = "";

Object.keys(state.codeFiles)
.sort()
.forEach(filename => {
const row = document.createElement("button");

```
  row.type = "button";
  row.className = "code-file-row";

  row.classList.toggle(
    "selected",
    filename === state.activeCodeFile
  );

  row.dataset.filename = filename;

  const icon = document.createElement("span");

  icon.className = "code-file-icon";
  icon.textContent = "</>";

  const name = document.createElement("span");

  name.className = "code-file-name";
  name.textContent = filename;

  row.append(icon, name);

  row.addEventListener("click", () => {
    openCodeFile(filename);
  });

  dom.codeFileList.appendChild(row);
});
```

}

function openCodeFile(filename) {
if (!(filename in state.codeFiles)) return;

state.activeCodeFile = filename;
state.codeDirty = false;

renderCodeFiles();
loadActiveCode();
}

function loadActiveCode() {
if (!dom.codeEditor) return;

dom.codeEditor.value =
state.codeFiles[state.activeCodeFile] || "";

updateCodeStatus();
}

function updateCodeStatus() {
all("[data-code-status]").forEach(element => {
element.textContent = state.codeDirty
? "Unsaved"
: "Saved";
});
}

function saveCodeFiles() {
state.codeFiles[state.activeCodeFile] =
dom.codeEditor?.value || "";

const key =
`${STORAGE.codeFilesPrefix}${state.user}`;

saveJSON(key, state.codeFiles);

state.codeDirty = false;

updateCodeStatus();

logConsole(
"code",
`Saved ${Object.keys(state.codeFiles).length} RiseCode files.`
);

showToast("Code saved");
}

function createCodeFile() {
const filename = prompt(
"New RiseCode file name:",
"new.rise"
);

if (!filename) return;

let clean = filename.trim();

if (!clean) return;

if (!clean.endsWith(".rise")) {
clean += ".rise";
}

if (state.codeFiles[clean]) {
showToast("That file already exists");
return;
}

checkpoint();

state.codeFiles[clean] = "";

openCodeFile(clean);
saveCodeFiles();

showToast(`${clean} created`);
}

function formatCode() {
if (!dom.codeEditor) return;

const source = dom.codeEditor.value;

const lines = source
.split("\n")
.map(line => line.trimEnd());

let indent = 0;

const formatted = lines.map(line => {
const trimmed = line.trim();

```
if (!trimmed) return "";

if (
  trimmed.startsWith("}") ||
  trimmed.startsWith("]")
) {
  indent = Math.max(0, indent - 1);
}

const result =
  "    ".repeat(indent) +
  trimmed;

if (
  trimmed.endsWith("{") ||
  trimmed.endsWith("[")
) {
  indent++;
}

return result;
```

});

dom.codeEditor.value =
formatted.join("\n");

state.codeFiles[state.activeCodeFile] =
dom.codeEditor.value;

state.codeDirty = true;

updateCodeStatus();
}

function runRiseCode() {
saveCodeFiles();

const files = clone(state.codeFiles);

const runtime =
window.RiseCodeRuntime ||
window.RiseCode?.Runtime ||
null;

if (runtime?.run) {
try {
const result = runtime.run(files);

```
  logConsole(
    "code",
    "RiseCode runtime executed."
  );

  if (result) {
    logConsole(
      "runtime",
      typeof result === "string"
        ? result
        : JSON.stringify(result)
    );
  }

  renderConsole();

  return;
} catch (error) {
  logConsole(
    "error",
    error?.message || String(error)
  );

  renderConsole();

  showToast("RiseCode execution failed");
  return;
}
```

}

executeLocalRiseCode(files);
}

function executeLocalRiseCode(files) {
const source = Object.values(files).join("\n");

const mapMatch =
source.match(
/map.name\s*=\s*["']([^%22']+)["']/
);

if (mapMatch) {
state.project.scene.name =
mapMatch[1];
}

const speedMatch =
source.match(
/player.walk.speed\s*=\s*([0-9.]+)/
);

if (speedMatch) {
logConsole(
"runtime",
`Player walk speed = ${speedMatch[1]}`
);
}

const meshRegex =
/add.mesh.([a-zA-Z0-9_]+)\s*\(\s*\)\s*;/g;

let match;
let created = 0;

while ((match = meshRegex.exec(source))) {
const shape = match[1].toLowerCase();

```
const typeMap = {
  cube: "Part",
  wedge: "Wedge",
  sphere: "Sphere",
  cylinder: "Cylinder",
  plane: "Plane",
  cone: "Cone"
};

const type =
  typeMap[shape] || "Part";

addObject(type, {
  name: `Code ${titleCase(shape)}`
});

created++;
```

}

touchProject();
renderAll();

logConsole(
"runtime",
`Local RiseCode execution completed. ${created} mesh instruction(s) processed.`
);
}

function renderBlocksWorkspace() {
const workspace =
byId("blocksWorkspace") ||
first("[data-blocks-workspace]");

if (!workspace) return;

if (!workspace.dataset.initialized) {
workspace.dataset.initialized = "true";

```
workspace.addEventListener("dragover", event => {
  event.preventDefault();
  workspace.classList.add("drag-over");
});

workspace.addEventListener("dragleave", () => {
  workspace.classList.remove("drag-over");
});

workspace.addEventListener("drop", event => {
  event.preventDefault();
  workspace.classList.remove("drag-over");

  const type =
    event.dataTransfer?.getData(
      "application/x-riseup-block"
    );

  if (type) {
    addVisualBlock(type);
  }
});
```

}
}

function renderBlockPalette(category = "logic") {
const palette =
byId("blockPalette") ||
first("[data-block-palette]");

if (!palette) return;

const categories = {
logic: [
["when-play", "When Play"],
["if", "If"],
["else", "Else"],
["wait", "Wait"],
["repeat", "Repeat"]
],
motion: [
["move", "Move"],
["rotate", "Rotate"],
["set-position", "Set Position"],
["set-rotation", "Set Rotation"]
],
objects: [
["add-cube", "Add Cube"],
["add-sphere", "Add Sphere"],
["add-wedge", "Add Wedge"],
["delete-object", "Delete Object"]
],
player: [
["player-speed", "Set Player Speed"],
["player-position", "Set Player Position"],
["player-spawn", "Set Spawn"]
],
world: [
["world-name", "Set World Name"],
["add-light", "Add Light"],
["add-camera", "Add Camera"]
]
};

palette.innerHTML = "";

(categories[category] || categories.logic)
.forEach(([id, label]) => {
const block = document.createElement("div");

```
  block.className =
    `visual-block visual-block-${category}`;

  block.draggable = true;
  block.dataset.blockType = id;

  block.textContent = label;

  block.addEventListener("dragstart", event => {
    event.dataTransfer?.setData(
      "application/x-riseup-block",
      id
    );
  });

  block.addEventListener("dblclick", () => {
    addVisualBlock(id);
  });

  palette.appendChild(block);
});
```

}

function addVisualBlock(type) {
const workspace =
byId("blocksWorkspace") ||
first("[data-blocks-workspace]");

if (!workspace) return;

const block = document.createElement("div");

block.className = "workspace-block";
block.dataset.blockType = type;

block.textContent = titleCase(
type.replace(/-/g, " ")
);

block.draggable = true;

block.addEventListener("dblclick", () => {
executeVisualBlock(type);
});

workspace.appendChild(block);

logConsole(
"blocks",
`Added block: ${type}`
);
}

function executeVisualBlock(type) {
switch (type) {
case "add-cube":
addObject("Part");
break;

```
case "add-sphere":
  addObject("Sphere");
  break;

case "add-wedge":
  addObject("Wedge");
  break;

case "add-light":
  addObject("Light");
  break;

case "add-camera":
  addObject("Camera");
  break;

case "delete-object":
  deleteSelected();
  break;

case "player-spawn":
  addObject("Spawn");
  break;

default:
  logConsole(
    "blocks",
    `Executed ${type}`
  );
  break;
```

}
}

function renderOutput() {
if (!dom.output) return;

const entries = state.logs
.slice(-100)
.map(entry => {
const row = document.createElement("div");

```
  row.className =
    `output-line output-${entry.level}`;

  row.textContent =
    `[${entry.time}] ${entry.message}`;

  return row;
});
```

dom.output.replaceChildren(...entries);
}

function logConsole(level, message) {
state.logs.push({
level,
message: String(message),
time: new Date().toLocaleTimeString()
});

if (state.logs.length > 300) {
state.logs.shift();
}

renderOutput();
renderConsole();
}

function renderConsole() {
if (!dom.console) return;

dom.console.innerHTML = "";

state.consoleLines
.slice(-200)
.forEach(line => {
const element = document.createElement("div");

```
  element.className =
    `console-line console-${line.level}`;

  element.textContent =
    `[${line.time}] ${line.message}`;

  dom.console.appendChild(element);
});
```

dom.console.scrollTop =
dom.console.scrollHeight;
}

function clearConsole() {
state.consoleLines = [];
renderConsole();
}

function clearOutput() {
state.logs = [];
renderOutput();
}

function executeConsoleCommand(command) {
const input = command.trim();

if (!input) return;

const normalized = input.toLowerCase();

logConsole("input", `> ${input}`);

if (normalized === "help") {
logConsole(
"system",
"Commands: help, clear, save, play, stop, undo, redo, grid, snap, objects, select <name>, add <type>, delete"
);
return;
}

if (normalized === "clear") {
clearConsole();
return;
}

if (normalized === "save") {
saveProject();
return;
}

if (normalized === "play") {
playProject();
return;
}

if (normalized === "stop") {
stopProject();
return;
}

if (normalized === "undo") {
undo();
return;
}

if (normalized === "redo") {
redo();
return;
}

if (normalized === "grid") {
toggleGrid();
return;
}

if (normalized === "snap") {
toggleSnap();
return;
}

if (normalized === "objects") {
logConsole(
"system",
getObjects()
.map(object => `${object.name} (${object.type})`)
.join(", ") || "No objects"
);
return;
}

const addMatch =
normalized.match(
/^add\s+(part|cube|wedge|sphere|cylinder|plane|cone|spawn|light|camera|folder)$/
);

if (addMatch) {
const typeMap = {
part: "Part",
cube: "Part",
wedge: "Wedge",
sphere: "Sphere",
cylinder: "Cylinder",
plane: "Plane",
cone: "Cone",
spawn: "Spawn",
light: "Light",
camera: "Camera",
folder: "Folder"
};

```
addObject(typeMap[addMatch[1]]);
return;
```

}

const selectMatch =
input.match(/^select\s+(.+)$/i);

if (selectMatch) {
const object =
findObjectByName(selectMatch[1]);

```
if (object) {
  selectObject(object.id);
  logConsole(
    "system",
    `Selected ${object.name}.`
  );
} else {
  logConsole(
    "error",
    "Object not found."
  );
}

return;
```

}

if (normalized === "delete") {
deleteSelected();
return;
}

logConsole(
"error",
`Unknown command: ${input}`
);
}

function attachConsoleInput() {
const input =
byId("consoleInput") ||
first("[data-console-input]");

if (!input || input.dataset.bound) return;

input.dataset.bound = "true";

input.addEventListener("keydown", event => {
if (event.key !== "Enter") return;

```
event.preventDefault();

executeConsoleCommand(input.value);

input.value = "";
```

});
}

function renderAvatar() {
const avatar =
readJSON(STORAGE.avatar, {
name: "Your Avatar",
body: "default",
material: "clay",
pose: "standing",
rotation: 0
});

all("[data-avatar-name]").forEach(element => {
element.textContent =
avatar.name || "Your Avatar";
});

all("[data-avatar]").forEach(element => {
element.dataset.body =
avatar.body || "default";

```
element.dataset.material =
  avatar.material || "clay";

element.dataset.pose =
  avatar.pose || "standing";

element.style.setProperty(
  "--avatar-rotation",
  `${number(avatar.rotation, 0)}deg`
);
```

});
}

function resizeCanvas() {
if (!dom.canvas) return;

const rect =
dom.canvas.parentElement?.getBoundingClientRect();

if (!rect) return;

const dpr =
Math.min(window.devicePixelRatio || 1, 2);

const width =
Math.max(1, Math.floor(rect.width));

const height =
Math.max(1, Math.floor(rect.height));

const targetWidth =
Math.floor(width * dpr);

const targetHeight =
Math.floor(height * dpr);

if (
dom.canvas.width !== targetWidth ||
dom.canvas.height !== targetHeight
) {
dom.canvas.width = targetWidth;
dom.canvas.height = targetHeight;

```
dom.canvas.style.width = `${width}px`;
dom.canvas.style.height = `${height}px`;
```

}
}

function getCanvasContext() {
if (!dom.canvas) return null;

resizeCanvas();

return dom.canvas.getContext("2d");
}

function drawViewport() {
const ctx = getCanvasContext();

if (!ctx) return;

const width = dom.canvas.width;
const height = dom.canvas.height;

ctx.clearRect(0, 0, width, height);

const dpr =
Math.min(window.devicePixelRatio || 1, 2);

ctx.save();
ctx.scale(dpr, dpr);

const cssWidth =
dom.canvas.clientWidth || width / dpr;

const cssHeight =
dom.canvas.clientHeight || height / dpr;

drawViewportBackground(
ctx,
cssWidth,
cssHeight
);

if (state.gridVisible) {
drawGrid(
ctx,
cssWidth,
cssHeight
);
}

drawAxes(
ctx,
cssWidth,
cssHeight
);

const objects =
getObjects()
.filter(object => object.visible !== false)
.sort((a, b) => {
return depthForObject(b) - depthForObject(a);
});

objects.forEach(object => {
drawObject(
ctx,
object,
cssWidth,
cssHeight
);
});

drawAvatarInViewport(
ctx,
cssWidth,
cssHeight
);

drawGizmo(
ctx,
cssWidth,
cssHeight
);

ctx.restore();

updateViewportStats();
}

function drawViewportBackground(
ctx,
width,
height
) {
const gradient =
ctx.createLinearGradient(
0,
0,
0,
height
);

gradient.addColorStop(0, "#111722");
gradient.addColorStop(1, "#080b10");

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

const horizon =
projectPoint(
{ x: 0, y: 0, z: 0 },
width,
height
);

const horizonY =
clamp(horizon.y, 0, height);

const sky =
ctx.createLinearGradient(
0,
0,
0,
horizonY
);

sky.addColorStop(0, "rgba(35,55,80,.25)");
sky.addColorStop(1, "rgba(10,15,22,0)");

ctx.fillStyle = sky;
ctx.fillRect(
0,
0,
width,
horizonY
);
}

function drawGrid(ctx, width, height) {
const gridSize =
Math.max(0.25, number(
state.project.settings.gridSize,
1
));

const lines = 30;

ctx.save();

for (let index = -lines; index <= lines; index++) {
const offset =
index * gridSize;

```
const a =
  projectPoint(
    {
      x: -lines * gridSize,
      y: 0,
      z: offset
    },
    width,
    height
  );

const b =
  projectPoint(
    {
      x: lines * gridSize,
      y: 0,
      z: offset
    },
    width,
    height
  );

ctx.beginPath();
ctx.moveTo(a.x, a.y);
ctx.lineTo(b.x, b.y);

ctx.strokeStyle =
  index === 0
    ? "rgba(90,120,155,.42)"
    : "rgba(90,105,125,.12)";

ctx.lineWidth =
  index === 0 ? 1.25 : 1;

ctx.stroke();

const c =
  projectPoint(
    {
      x: offset,
      y: 0,
      z: -lines * gridSize
    },
    width,
    height
  );

const d =
  projectPoint(
    {
      x: offset,
      y: 0,
      z: lines * gridSize
    },
    width,
    height
  );

ctx.beginPath();
ctx.moveTo(c.x, c.y);
ctx.lineTo(d.x, d.y);

ctx.strokeStyle =
  index === 0
    ? "rgba(100,125,155,.45)"
    : "rgba(90,105,125,.12)";

ctx.stroke();
```

}

ctx.restore();
}

function drawAxes(ctx, width, height) {
const origin =
projectPoint(
{ x: 0, y: 0, z: 0 },
width,
height
);

const x =
projectPoint(
{ x: 4, y: 0, z: 0 },
width,
height
);

const y =
projectPoint(
{ x: 0, y: 4, z: 0 },
width,
height
);

const z =
projectPoint(
{ x: 0, y: 0, z: 4 },
width,
height
);

drawAxisLine(
ctx,
origin,
x,
"X"
);

drawAxisLine(
ctx,
origin,
y,
"Y"
);

drawAxisLine(
ctx,
origin,
z,
"Z"
);
}

function drawAxisLine(ctx, a, b, label) {
ctx.beginPath();
ctx.moveTo(a.x, a.y);
ctx.lineTo(b.x, b.y);

ctx.strokeStyle =
label === "X"
? "#e95b63"
: label === "Y"
? "#62d68a"
: "#5b9ef5";

ctx.lineWidth = 1.5;
ctx.stroke();

ctx.font =
"600 11px system-ui";

ctx.fillStyle =
label === "X"
? "#e95b63"
: label === "Y"
? "#62d68a"
: "#5b9ef5";

ctx.fillText(
label,
b.x + 4,
b.y - 4
);
}

function projectPoint(point, width, height) {
const yaw =
(state.camera.yaw * Math.PI) / 180;

const pitch =
(state.camera.pitch * Math.PI) / 180;

const cosYaw = Math.cos(yaw);
const sinYaw = Math.sin(yaw);

const rotatedX =
point.x * cosYaw -
point.z * sinYaw;

const rotatedZ =
point.x * sinYaw +
point.z * cosYaw;

const cosPitch = Math.cos(pitch);
const sinPitch = Math.sin(pitch);

const screenY =
point.y * cosPitch -
rotatedZ * sinPitch;

const depth =
point.y * sinPitch +
rotatedZ * cosPitch;

const scale =
28 *
state.camera.zoom;

return {
x:
width / 2 +
rotatedX * scale +
state.camera.panX,
y:
height / 2 -
screenY * scale +
depth * 0.01 +
state.camera.panY
};
}

function depthForObject(object) {
return (
object.position.z +
object.position.x * 0.4 -
object.position.y * 0.7
);
}

function drawObject(
ctx,
object,
width,
height
) {
if (object.type === "Folder") {
return;
}

const center =
projectPoint(
object.position,
width,
height
);

const size =
object.size || {
x: 1,
y: 1,
z: 1
};

const sx =
Math.max(
3,
Math.abs(size.x) *
16 *
state.camera.zoom
);

const sy =
Math.max(
3,
Math.abs(size.y) *
16 *
state.camera.zoom
);

const sz =
Math.max(
3,
Math.abs(size.z) *
8 *
state.camera.zoom
);

if (object.type === "Sphere") {
drawSphere(
ctx,
center,
sx,
sy,
object.color
);
} else if (object.type === "Cylinder") {
drawCylinder(
ctx,
center,
sx,
sy,
object.color
);
} else if (object.type === "Cone") {
drawCone(
ctx,
center,
sx,
sy,
object.color
);
} else if (object.type === "Wedge") {
drawWedge(
ctx,
center,
sx,
sy,
sz,
object.color
);
} else if (object.type === "Plane") {
drawPlane(
ctx,
center,
sx,
sz,
object.color
);
} else if (object.type === "Spawn") {
drawSpawn(
ctx,
center,
sx,
sz
);
} else if (object.type === "Light") {
drawLight(
ctx,
center,
sx
);
} else if (object.type === "Camera") {
drawCamera(
ctx,
center,
sx,
sy
);
} else {
drawCube(
ctx,
center,
sx,
sy,
sz,
object.color
);
}

if (object.id === state.selectedId) {
drawSelection(
ctx,
center,
sx,
sy,
sz
);
}
}

function drawCube(
ctx,
center,
sx,
sy,
sz,
color
) {
const topY = center.y - sy;
const bottomY = center.y + sy;

const left = center.x - sx;
const right = center.x + sx;

ctx.beginPath();
ctx.moveTo(center.x, topY - sz * 0.35);
ctx.lineTo(right, topY);
ctx.lineTo(center.x, topY + sz * 0.35);
ctx.lineTo(left, topY);
ctx.closePath();

ctx.fillStyle =
shadeColor(color, 1.1);

ctx.fill();

ctx.strokeStyle =
"rgba(255,255,255,.15)";

ctx.stroke();

ctx.beginPath();
ctx.moveTo(left, topY);
ctx.lineTo(left, bottomY);
ctx.lineTo(center.x, bottomY + sz * 0.35);
ctx.lineTo(center.x, topY + sz * 0.35);
ctx.closePath();

ctx.fillStyle =
shadeColor(color, 0.78);

ctx.fill();
ctx.stroke();

ctx.beginPath();
ctx.moveTo(right, topY);
ctx.lineTo(right, bottomY);
ctx.lineTo(center.x, bottomY + sz * 0.35);
ctx.lineTo(center.x, topY + sz * 0.35);
ctx.closePath();

ctx.fillStyle =
shadeColor(color, 0.62);

ctx.fill();
ctx.stroke();
}

function drawSphere(
ctx,
center,
sx,
sy,
color
) {
const radius =
Math.max(sx, sy);

const gradient =
ctx.createRadialGradient(
center.x - radius * 0.35,
center.y - radius * 0.4,
radius * 0.1,
center.x,
center.y,
radius
);

gradient.addColorStop(
0,
shadeColor(color, 1.3)
);

gradient.addColorStop(
1,
shadeColor(color, 0.55)
);

ctx.beginPath();
ctx.ellipse(
center.x,
center.y,
sx,
sy,
0,
0,
Math.PI * 2
);

ctx.fillStyle = gradient;
ctx.fill();

ctx.strokeStyle =
"rgba(255,255,255,.16)";

ctx.stroke();
}

function drawCylinder(
ctx,
center,
sx,
sy,
color
) {
const top = center.y - sy * 0.65;
const bottom = center.y + sy * 0.65;

ctx.beginPath();

ctx.ellipse(
center.x,
top,
sx,
sy * 0.32,
0,
0,
Math.PI * 2
);

ctx.fillStyle =
shadeColor(color, 1.15);

ctx.fill();

ctx.beginPath();

ctx.moveTo(
center.x - sx,
top
);

ctx.lineTo(
center.x - sx,
bottom
);

ctx.quadraticCurveTo(
center.x,
bottom + sy * 0.32,
center.x + sx,
bottom
);

ctx.lineTo(
center.x + sx,
top
);

ctx.closePath();

ctx.fillStyle =
shadeColor(color, 0.7);

ctx.fill();

ctx.strokeStyle =
"rgba(255,255,255,.14)";

ctx.stroke();

ctx.beginPath();

ctx.ellipse(
center.x,
top,
sx,
sy * 0.32,
0,
0,
Math.PI * 2
);

ctx.stroke();
}

function drawCone(
ctx,
center,
sx,
sy,
color
) {
const top =
center.y - sy;

const bottom =
center.y + sy * 0.55;

ctx.beginPath();

ctx.moveTo(
center.x,
top
);

ctx.lineTo(
center.x + sx,
bottom
);

ctx.lineTo(
center.x - sx,
bottom
);

ctx.closePath();

ctx.fillStyle =
shadeColor(color, 0.75);

ctx.fill();

ctx.strokeStyle =
"rgba(255,255,255,.18)";

ctx.stroke();

ctx.beginPath();

ctx.ellipse(
center.x,
bottom,
sx,
sy * 0.3,
0,
0,
Math.PI * 2
);

ctx.fillStyle =
shadeColor(color, 0.62);

ctx.fill();

ctx.stroke();
}

function drawWedge(
ctx,
center,
sx,
sy,
sz,
color
) {
ctx.beginPath();

ctx.moveTo(
center.x - sx,
center.y + sy
);

ctx.lineTo(
center.x + sx,
center.y + sy
);

ctx.lineTo(
center.x + sx,
center.y - sy
);

ctx.lineTo(
center.x - sx,
center.y
);

ctx.closePath();

ctx.fillStyle =
shadeColor(color, 0.7);

ctx.fill();

ctx.strokeStyle =
"rgba(255,255,255,.15)";

ctx.stroke();

ctx.beginPath();

ctx.moveTo(
center.x - sx,
center.y
);

ctx.lineTo(
center.x - sx + sz,
center.y + sy
);

ctx.lineTo(
center.x + sx + sz,
center.y + sy
);

ctx.lineTo(
center.x + sx,
center.y + sy
);

ctx.closePath();

ctx.fillStyle =
shadeColor(color, 0.85);

ctx.fill();

ctx.stroke();
}

function drawPlane(
ctx,
center,
sx,
sz,
color
) {
ctx.save();

ctx.globalAlpha = 0.85;

ctx.beginPath();

ctx.rect(
center.x - sx,
center.y - sz * 0.35,
sx * 2,
sz * 0.7
);

ctx.fillStyle =
shadeColor(color, 0.8);

ctx.fill();

ctx.strokeStyle =
"rgba(255,255,255,.12)";

ctx.stroke();

ctx.restore();
}

function drawSpawn(
ctx,
center,
sx,
sz
) {
ctx.save();

ctx.strokeStyle =
"rgba(84,212,139,.85)";

ctx.fillStyle =
"rgba(84,212,139,.12)";

ctx.beginPath();

ctx.ellipse(
center.x,
center.y,
sx,
Math.max(5, sz * 0.45),
0,
0,
Math.PI * 2
);

ctx.fill();
ctx.stroke();

ctx.beginPath();

ctx.moveTo(
center.x,
center.y - 18
);

ctx.lineTo(
center.x,
center.y + 8
);

ctx.stroke();

ctx.beginPath();

ctx.moveTo(
center.x - 8,
center.y - 5
);

ctx.lineTo(
center.x,
center.y - 13
);

ctx.lineTo(
center.x + 8,
center.y - 5
);

ctx.stroke();

ctx.restore();
}

function drawLight(
ctx,
center,
radius
) {
ctx.save();

const glow =
ctx.createRadialGradient(
center.x,
center.y,
0,
center.x,
center.y,
radius * 4
);

glow.addColorStop(
0,
"rgba(255,230,135,.65)"
);

glow.addColorStop(
1,
"rgba(255,230,135,0)"
);

ctx.fillStyle = glow;

ctx.beginPath();

ctx.arc(
center.x,
center.y,
radius * 4,
0,
Math.PI * 2
);

ctx.fill();

ctx.fillStyle = "#ffe78a";

ctx.beginPath();

ctx.arc(
center.x,
center.y,
Math.max(3, radius * 0.35),
0,
Math.PI * 2
);

ctx.fill();

ctx.restore();
}

function drawCamera(
ctx,
center,
sx,
sy
) {
ctx.save();

ctx.strokeStyle =
"#b28cff";

ctx.fillStyle =
"rgba(178,140,255,.12)";

ctx.beginPath();

ctx.moveTo(
center.x - sx,
center.y - sy * 0.5
);

ctx.lineTo(
center.x + sx,
center.y - sy * 0.5
);

ctx.lineTo(
center.x + sx * 0.65,
center.y + sy * 0.5
);

ctx.lineTo(
center.x - sx * 0.65,
center.y + sy * 0.5
);

ctx.closePath();

ctx.fill();
ctx.stroke();

ctx.beginPath();

ctx.moveTo(
center.x,
center.y - sy * 0.5
);

ctx.lineTo(
center.x,
center.y + sy * 1.2
);

ctx.stroke();

ctx.restore();
}

function drawSelection(
ctx,
center,
sx,
sy,
sz
) {
ctx.save();

ctx.strokeStyle =
"#55a7ff";

ctx.setLineDash([5, 4]);

ctx.lineWidth = 1.25;

ctx.strokeRect(
center.x - sx - 5,
center.y - sy - 5,
sx * 2 + 10,
sy * 2 + sz * 0.35 + 10
);

ctx.setLineDash([]);

ctx.fillStyle =
"#55a7ff";

const handles = [
[center.x - sx - 5, center.y - sy - 5],
[center.x + sx + 5, center.y - sy - 5],
[center.x - sx - 5, center.y + sy + 5],
[center.x + sx + 5, center.y + sy + 5]
];

handles.forEach(([x, y]) => {
ctx.fillRect(
x - 3,
y - 3,
6,
6
);
});

ctx.restore();
}

function drawGizmo(
ctx,
width,
height
) {
const object =
getSelectedObject();

if (!object) return;

const center =
projectPoint(
object.position,
width,
height
);

const length =
38 *
state.camera.zoom;

ctx.save();

if (state.activeTool === "move") {
drawGizmoArrow(
ctx,
center,
{
x: length,
y: 0
},
"#e95b63",
"X"
);

```
drawGizmoArrow(
  ctx,
  center,
  {
    x: 0,
    y: -length
  },
  "#62d68a",
  "Y"
);

drawGizmoArrow(
  ctx,
  center,
  {
    x: -length * 0.55,
    y: length * 0.55
  },
  "#5b9ef5",
  "Z"
);
```

}

if (state.activeTool === "rotate") {
ctx.strokeStyle =
"#55a7ff";

```
ctx.lineWidth = 1.5;

ctx.beginPath();

ctx.arc(
  center.x,
  center.y,
  length,
  0,
  Math.PI * 2
);

ctx.stroke();
```

}

if (state.activeTool === "scale") {
ctx.strokeStyle =
"#55a7ff";

```
ctx.lineWidth = 1.5;

ctx.strokeRect(
  center.x - length,
  center.y - length,
  length * 2,
  length * 2
);
```

}

ctx.restore();
}

function drawGizmoArrow(
ctx,
start,
vector,
color,
label
) {
const end = {
x: start.x + vector.x,
y: start.y + vector.y
};

ctx.strokeStyle = color;
ctx.fillStyle = color;
ctx.lineWidth = 2;

ctx.beginPath();

ctx.moveTo(
start.x,
start.y
);

ctx.lineTo(
end.x,
end.y
);

ctx.stroke();

const angle =
Math.atan2(
vector.y,
vector.x
);

const size = 6;

ctx.beginPath();

ctx.moveTo(
end.x,
end.y
);

ctx.lineTo(
end.x -
Math.cos(angle - 0.45) * size,
end.y -
Math.sin(angle - 0.45) * size
);

ctx.lineTo(
end.x -
Math.cos(angle + 0.45) * size,
end.y -
Math.sin(angle + 0.45) * size
);

ctx.closePath();

ctx.fill();

ctx.font =
"600 10px system-ui";

ctx.fillText(
label,
end.x + 5,
end.y
);
}

function drawAvatarInViewport(
ctx,
width,
height
) {
const avatar =
readJSON(STORAGE.avatar, {
body: "default",
material: "clay",
pose: "standing",
rotation: 0
});

const base =
projectPoint(
{
x: 0,
y: 0,
z: -3
},
width,
height
);

const scale =
18 *
state.camera.zoom;

ctx.save();

ctx.translate(
base.x,
base.y
);

ctx.scale(
scale / 18,
scale / 18
);

ctx.fillStyle =
avatar.material === "stone"
? "#aeb3ba"
: avatar.material === "light"
? "#f0f2f4"
: "#d6d9dd";

ctx.strokeStyle =
"rgba(0,0,0,.15)";

ctx.lineWidth = 1;

ctx.beginPath();

ctx.arc(
0,
-35,
10,
0,
Math.PI * 2
);

ctx.fill();
ctx.stroke();

ctx.beginPath();

ctx.roundRect(
-9,
-24,
18,
26,
5
);

ctx.fill();
ctx.stroke();

ctx.beginPath();

ctx.moveTo(-7, 0);
ctx.lineTo(-12, 19);

ctx.moveTo(7, 0);
ctx.lineTo(12, 19);

ctx.moveTo(-7, -17);
ctx.lineTo(-18, -4);

ctx.moveTo(7, -17);
ctx.lineTo(18, -4);

ctx.stroke();

ctx.restore();
}

function shadeColor(color, multiplier) {
if (!color) {
return "#808894";
}

if (!color.startsWith("#")) {
return color;
}

let hex = color.slice(1);

if (hex.length === 3) {
hex = hex
.split("")
.map(char => char + char)
.join("");
}

const red =
parseInt(hex.slice(0, 2), 16);

const green =
parseInt(hex.slice(2, 4), 16);

const blue =
parseInt(hex.slice(4, 6), 16);

const r =
clamp(Math.round(red * multiplier), 0, 255);

const g =
clamp(Math.round(green * multiplier), 0, 255);

const b =
clamp(Math.round(blue * multiplier), 0, 255);

return `rgb(${r},${g},${b})`;
}

function pickObject(event) {
const rect =
dom.canvas.getBoundingClientRect();

const x =
event.clientX - rect.left;

const y =
event.clientY - rect.top;

const objects =
getObjects()
.filter(object => object.visible !== false)
.filter(object => object.type !== "Folder")
.slice()
.sort((a, b) => {
return depthForObject(a) -
depthForObject(b);
});

for (const object of objects) {
const center =
projectPoint(
object.position,
rect.width,
rect.height
);

```
const size =
  object.size || {
    x: 1,
    y: 1,
    z: 1
  };

const radius =
  Math.max(
    14,
    Math.max(
      size.x,
      size.y,
      size.z
    ) *
      18 *
      state.camera.zoom
  );

const distance =
  Math.hypot(
    x - center.x,
    y - center.y
  );

if (distance <= radius) {
  return object;
}
```

}

return null;
}

function updateViewportStats() {
const stats = {
objects: getObjects().length,
selected: getSelectedObject()?.name || "None",
zoom: `${Math.round(state.camera.zoom * 100)}%`
};

all("[data-stat]").forEach(element => {
const key = element.dataset.stat;

```
if (key in stats) {
  element.textContent = stats[key];
}
```

});
}

function showObjectContextMenu(x, y) {
const menu =
dom.contextMenu ||
byId("contextMenu");

if (!menu) return;

menu.innerHTML = "";

const actions = [
["Select", () => selectObject(state.selectedId)],
["Duplicate", duplicateSelected],
["Focus", focusSelected],
["Delete", deleteSelected]
];

actions.forEach(([label, callback]) => {
const button =
document.createElement("button");

```
button.type = "button";
button.textContent = label;

button.addEventListener("click", () => {
  callback();
  menu.hidden = true;
});

menu.appendChild(button);
```

});

menu.hidden = false;
menu.style.position = "fixed";
menu.style.left = `${x}px`;
menu.style.top = `${y}px`;

state.contextMenuOpen = true;
}

function closeMenus() {
all("[data-menu-panel],.menu-panel,.context-menu")
.forEach(element => {
element.classList.remove("open");
element.hidden = true;
});

if (dom.contextMenu) {
dom.contextMenu.hidden = true;
}

state.contextMenuOpen = false;
}

function toggleProjectMenu(event) {
toggleMenuFromButton(
event.currentTarget,
"projectMenuPanel"
);
}

function toggleMoreMenu(event) {
toggleMenuFromButton(
event.currentTarget,
"moreMenuPanel"
);
}

function toggleAccountMenu(event) {
toggleMenuFromButton(
event.currentTarget,
"accountMenuPanel"
);
}

function toggleMenuFromButton(button, id) {
const panel =
byId(id) ||
first(`[data-menu-panel="${id}"]`);

if (!panel) return;

const shouldOpen =
panel.hidden !== false;

closeMenus();

panel.hidden = !shouldOpen;
panel.classList.toggle(
"open",
shouldOpen
);
}

const COMMANDS = [
["Add Part", "addObject('Part')"],
["Add Sphere", "addObject('Sphere')"],
["Add Wedge", "addObject('Wedge')"],
["Add Light", "addObject('Light')"],
["Add Camera", "addObject('Camera')"],
["Save Project", "saveProject()"],
["Play Project", "playProject()"],
["Publish Project", "openPublishModal()"],
["Toggle Grid", "toggleGrid()"],
["Toggle Snap", "toggleSnap()"],
["Toggle AI", "toggleAIPanel()"],
["Focus Selection", "focusSelected()"],
["Delete Selection", "deleteSelected()"],
["Undo", "undo()"],
["Redo", "redo()"],
["Reset Camera", "resetCamera()"],
["Open Code", "setBottomTab('code')"],
["Open Blocks", "setBottomTab('blocks')"],
["Open Console", "setBottomTab('console')"]
];

function openCommandPalette() {
const palette =
dom.commandPalette ||
byId("commandPalette");

if (!palette) return;

palette.hidden = false;
palette.classList.add("open");

state.commandPaletteOpen = true;

if (dom.commandInput) {
dom.commandInput.value = "";
renderCommandResults("");
dom.commandInput.focus();
}
}

function closeCommandPalette() {
const palette =
dom.commandPalette ||
byId("commandPalette");

if (!palette) return;

palette.hidden = true;
palette.classList.remove("open");

state.commandPaletteOpen = false;
}

function renderCommandResults(query = "") {
const results =
byId("commandResults") ||
first("[data-command-results]");

if (!results) return;

const normalized =
query.trim().toLowerCase();

results.innerHTML = "";

COMMANDS
.filter(([label]) => {
return (
!normalized ||
label.toLowerCase().includes(normalized)
);
})
.forEach(([label, command]) => {
const button =
document.createElement("button");

```
  button.type = "button";
  button.dataset.commandResult = "true";

  const name =
    document.createElement("span");

  name.textContent = label;

  const shortcut =
    document.createElement("kbd");

  shortcut.textContent =
    command.includes("saveProject")
      ? "Ctrl+S"
      : "";

  button.append(name, shortcut);

  button.addEventListener("click", () => {
    executeCommand(command);
    closeCommandPalette();
  });

  results.appendChild(button);
});
```

}

function executeCommand(command) {
const commandMap = {
"addObject('Part')": () => addObject("Part"),
"addObject('Sphere')": () => addObject("Sphere"),
"addObject('Wedge')": () => addObject("Wedge"),
"addObject('Light')": () => addObject("Light"),
"addObject('Camera')": () => addObject("Camera"),
"saveProject()": saveProject,
"playProject()": playProject,
"openPublishModal()": openPublishModal,
"toggleGrid()": toggleGrid,
"toggleSnap()": toggleSnap,
"toggleAIPanel()": toggleAIPanel,
"focusSelected()": focusSelected,
"deleteSelected()": deleteSelected,
"undo()": undo,
"redo()": redo,
"resetCamera()": resetCamera,
"setBottomTab('code')": () => setBottomTab("code"),
"setBottomTab('blocks')": () => setBottomTab("blocks"),
"setBottomTab('console')": () => setBottomTab("console")
};

commandMap[command]?.();
}

function importAsset(file) {
if (!file) return;

const record = {
id: uid("asset"),
name: file.name,
type: file.type || "unknown",
size: file.size,
importedAt: Date.now()
};

state.importQueue.push(record);

const objectType =
inferObjectTypeFromFile(file);

if (objectType) {
const object =
addObject(objectType, {
name:
file.name.replace(
/.[^/.]+$/,
""
)
});

```
object.metadata.source =
  "imported";

object.metadata.fileName =
  file.name;

object.metadata.mimeType =
  file.type;

touchProject();
```

}

logConsole(
"asset",
`Imported ${file.name}.`
);

showToast(`${file.name} imported`);
}

function inferObjectTypeFromFile(file) {
const name =
file.name.toLowerCase();

if (
name.endsWith(".obj") ||
name.endsWith(".fbx") ||
name.endsWith(".gltf") ||
name.endsWith(".glb") ||
name.endsWith(".mesh")
) {
return "Part";
}

return null;
}

function addConsoleCommandBox() {
attachConsoleInput();
}

function updateUserUI() {
all("[data-username]").forEach(element => {
element.textContent =
state.user || "User";
});

all("[data-user-initial]").forEach(element => {
element.textContent =
String(state.user || "U")
.charAt(0)
.toUpperCase();
});

all("[data-account-name]").forEach(element => {
element.textContent =
state.user || "User";
});
}

function updateAvatarUI() {
const avatar =
readJSON(STORAGE.avatar, {
name: "Your Avatar",
body: "default",
material: "clay",
pose: "standing",
rotation: 0
});

all("[data-avatar-name]").forEach(element => {
element.textContent =
avatar.name || "Your Avatar";
});
}

function createLoadingProgress() {
const steps = [
"Loading project",
"Loading scene",
"Loading assets",
"Loading RiseCode",
"Starting viewport"
];

let index = 0;

return new Promise(resolve => {
const timer =
setInterval(() => {
if (index < steps.length) {
logConsole(
"boot",
`${steps[index]}...`
);

```
      index++;
      return;
    }

    clearInterval(timer);
    resolve();
  }, 40);
```

});
}

async function initialize() {
state.user = getUsername();

if (!state.user) {
window.location.href = "index.html";
return;
}

initializeDom();
initializeProject();
initializeCodeFiles();
updateUserUI();
updateAvatarUI();

await createLoadingProgress();

bindEvents();
addConsoleCommandBox();

renderAll();

window.addEventListener(
"resize",
drawViewport
);

if (dom.loadingScreen) {
setTimeout(() => {
dom.loadingScreen.classList.add("loaded");
dom.loadingScreen.hidden = true;
}, 150);
}

state.loading = false;

logConsole(
"boot",
"Game Engine X Studio ready."
);

showToast("Studio ready");
}

const api = {
state,
getProject: () => state.project,
getSelectedObject,
addObject,
deleteSelected,
duplicateSelected,
selectObject,
saveProject,
loadProject,
undo,
redo,
playProject,
stopProject,
publishProject,
setTool,
toggleGrid,
toggleSnap,
focusSelected,
resetCamera,
runRiseCode,
sendAI,
executeConsoleCommand
};

window.RiseUpStudio = api;

export {
state,
addObject,
deleteSelected,
duplicateSelected,
selectObject,
saveProject,
loadProject,
undo,
redo,
playProject,
stopProject,
publishProject,
setTool,
toggleGrid,
toggleSnap,
focusSelected,
resetCamera,
runRiseCode,
sendAI,
executeConsoleCommand
};

function showToast(message) {
let container =
dom.toastContainer ||
byId("toastContainer");

if (!container) {
container =
document.createElement("div");

```
container.id =
  "toastContainer";

container.className =
  "toast-container";

document.body.appendChild(container);

dom.toastContainer = container;
```

}

const toast =
document.createElement("div");

toast.className =
"toast";

toast.setAttribute(
"role",
"status"
);

toast.textContent =
String(message);

container.appendChild(toast);

requestAnimationFrame(() => {
toast.classList.add("show");
});

setTimeout(() => {
toast.classList.remove("show");

```
setTimeout(() => {
  toast.remove();
}, 250);
```

}, 2200);
}

if (document.readyState === "loading") {
document.addEventListener(
"DOMContentLoaded",
initialize,
{ once: true }
);
} else {
initialize();
}
