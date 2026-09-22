const FILES_KEY = "riseup_code_files";
const PROJECT_KEY = "riseup_code_project";
const USER_KEY = "riseup_currentUser";

const defaultFiles = {
"index.rise": `// Welcome to RiseCode
// Your game starts here.

map.name = "My World";

add.mesh.cube();

player.walk.speed = 5;
`,
    "player.rise": `// Player settings

player.walk.speed = 5;
`,
    "world.rise": `// World setup

add.mesh.cube();
add.mesh.wedge();
`
};

let files = loadFiles();
let currentFile = "index.rise";

const fileList = document.getElementById("fileList");
const editorTabs = document.getElementById("editorTabs");
const editor = document.getElementById("codeEditor");
const lineNumbers = document.getElementById("lineNumbers");
const currentFileName = document.getElementById("currentFileName");
const cursorPosition = document.getElementById("cursorPosition");
const saveStatus = document.getElementById("saveStatus");
const projectName = document.getElementById("projectName");
const newFileModal = document.getElementById("newFileModal");
const newFileName = document.getElementById("newFileName");

function getUserName() {
const raw = localStorage.getItem(USER_KEY);

```
if (!raw) {
    return "Player";
}

try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === "string") {
        return parsed;
    }

    return parsed.username || parsed.name || "Player";
} catch {
    return raw;
}
```

}

function getStorageKey() {
return `${FILES_KEY}_${getUserName()}`;
}

function loadFiles() {
try {
const saved = localStorage.getItem(getStorageKey());

```
    if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === "object") {
            return {
                ...defaultFiles,
                ...parsed
            };
        }
    }
} catch {
    // Use defaults.
}

return { ...defaultFiles };
```

}

function saveFiles() {
localStorage.setItem(
getStorageKey(),
JSON.stringify(files)
);

```
saveStatus.textContent = "Saved";
```

}

function renderFileList() {
fileList.innerHTML = "";

```
Object.keys(files).forEach(name => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "file-item";
    button.classList.toggle("active", name === currentFile);

    button.innerHTML = `
        <span class="file-icon">R</span>
        <span class="file-name"></span>
    `;

    button.querySelector(".file-name").textContent = name;

    button.addEventListener("click", () => {
        openFile(name);
    });

    fileList.appendChild(button);
});
```

}

function renderTabs() {
editorTabs.innerHTML = "";

```
const names = Object.keys(files);

names.forEach(name => {
    const tab = document.createElement("button");

    tab.type = "button";
    tab.className = "editor-tab";
    tab.classList.toggle("active", name === currentFile);

    tab.innerHTML = `
        <span class="file-icon">R</span>
        <span></span>
    `;

    tab.querySelector("span:last-child").textContent = name;

    tab.addEventListener("click", () => {
        openFile(name);
    });

    editorTabs.appendChild(tab);
});
```

}

function updateLineNumbers() {
const count = Math.max(
1,
editor.value.split("\n").length
);

```
lineNumbers.innerHTML = "";

for (let i = 1; i <= count; i++) {
    const line = document.createElement("div");

    line.className = "line-number";
    line.textContent = i;

    lineNumbers.appendChild(line);
}
```

}

function openFile(name) {
if (!(name in files)) {
return;
}

```
files[currentFile] = editor.value;

currentFile = name;
editor.value = files[currentFile];

currentFileName.textContent = currentFile;

renderFileList();
renderTabs();
updateLineNumbers();
updateCursor();
```

}

function updateCursor() {
const position = editor.selectionStart;
const before = editor.value.slice(0, position);

```
const lines = before.split("\n");

const line = lines.length;
const column = lines[lines.length - 1].length + 1;

cursorPosition.textContent =
    `Ln ${line}, Col ${column}`;
```

}

function showSavedStatus(text = "Saved") {
saveStatus.textContent = text;

```
clearTimeout(showSavedStatus.timer);

showSavedStatus.timer = setTimeout(() => {
    saveStatus.textContent = "Ready";
}, 1600);
```

}

function saveCurrentFile() {
files[currentFile] = editor.value;
saveFiles();
showSavedStatus();
}

function formatCode() {
const source = editor.value;

```
const formatted = source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trimEnd())
    .join("\n");

editor.value = formatted;

files[currentFile] = formatted;

updateLineNumbers();
showSavedStatus("Formatted");
```

}

function openNewFileModal() {
newFileName.value = "script.rise";
newFileModal.classList.remove("hidden");

```
setTimeout(() => {
    newFileName.focus();
    newFileName.select();
}, 0);
```

}

function closeNewFileModal() {
newFileModal.classList.add("hidden");
}

function createFile() {
let name = newFileName.value.trim();

```
if (!name) {
    return;
}

if (!name.endsWith(".rise")) {
    name += ".rise";
}

if (files[name]) {
    openFile(name);
    closeNewFileModal();
    return;
}

files[name] = `// ${name}
```

`;

```
renderFileList();
renderTabs();
openFile(name);

closeNewFileModal();
```

}

function runCode() {
files[currentFile] = editor.value;

```
saveFiles();

if (
    window.RiseCodeRuntime &&
    typeof window.RiseCodeRuntime.run === "function"
) {
    const result = window.RiseCodeRuntime.run(files);

    if (result?.errors?.length) {
        saveStatus.textContent = "Runtime Error";
        console.error(result.errors);
    } else {
        showSavedStatus("Running");
    }

    return;
}

showSavedStatus("Saved");
```

}

function insertText(text) {
const start = editor.selectionStart;
const end = editor.selectionEnd;

```
editor.setRangeText(
    text,
    start,
    end,
    "end"
);

files[currentFile] = editor.value;

updateLineNumbers();
updateCursor();
editor.focus();
```

}

function handleQuickCommand(type) {
const commands = {
game: `// Game system

let gameState = "playing";

function startGame() {
gameState = "playing";
}
`,
        weapon: `// Weapon system

let weaponDamage = 25;
let weaponRange = 50;
`,
        npc: `// NPC system

let npcName = "NPC";
let npcHealth = 100;
`,
        ui: `// UI system

let uiVisible = true;
`,
        debug: `// Debug

console.log("Checking game...");
`,
        multiplayer: `// Multiplayer system

let multiplayerEnabled = true;
`
};

```
if (commands[type]) {
    insertText(commands[type]);
    showSavedStatus("Inserted");
}
```

}

document.getElementById("homeButton").addEventListener(
"click",
() => {
window.location.href = "home.html";
}
);

document.getElementById("studioButton").addEventListener(
"click",
() => {
window.location.href = "studio.html";
}
);

document.getElementById("saveButton").addEventListener(
"click",
saveCurrentFile
);

document.getElementById("newFileButton").addEventListener(
"click",
openNewFileModal
);

document.getElementById("addFileButton").addEventListener(
"click",
openNewFileModal
);

document.getElementById("closeModalButton").addEventListener(
"click",
closeNewFileModal
);

document.getElementById("cancelFileButton").addEventListener(
"click",
closeNewFileModal
);

document.getElementById("createFileButton").addEventListener(
"click",
createFile
);

document.querySelector(".modal-backdrop").addEventListener(
"click",
closeNewFileModal
);

document.getElementById("runButton").addEventListener(
"click",
runCode
);

document.getElementById("formatButton").addEventListener(
"click",
formatCode
);

document.querySelectorAll(".quick-command").forEach(button => {
button.addEventListener("click", () => {
handleQuickCommand(button.dataset.command);
});
});

editor.addEventListener("input", () => {
files[currentFile] = editor.value;

```
updateLineNumbers();
updateCursor();

saveStatus.textContent = "Unsaved";
```

});

editor.addEventListener("click", updateCursor);
editor.addEventListener("keyup", updateCursor);
editor.addEventListener("select", updateCursor);

editor.addEventListener("scroll", () => {
lineNumbers.scrollTop = editor.scrollTop;
});

editor.addEventListener("keydown", event => {
if (event.key === "Tab") {
event.preventDefault();
insertText("    ");
return;
}

```
if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "s"
) {
    event.preventDefault();
    saveCurrentFile();
}

if (
    (event.ctrlKey || event.metaKey) &&
    event.key === "Enter"
) {
    event.preventDefault();
    runCode();
}

if (event.key === "Escape") {
    closeNewFileModal();
}
```

});

newFileName.addEventListener("keydown", event => {
if (event.key === "Enter") {
event.preventDefault();
createFile();
}
});

projectName.textContent =
localStorage.getItem(PROJECT_KEY) ||
"Untitled Project";

editor.value = files[currentFile];

renderFileList();
renderTabs();
updateLineNumbers();
updateCursor();

window.RiseUpCode = {
getFiles() {
files[currentFile] = editor.value;
return { ...files };
},

```
save() {
    saveCurrentFile();
},

openFile,

createFile(name) {
    newFileName.value = name;
    createFile();
}
```

};
