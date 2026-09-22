"use strict";

const RiseUpAvatar = (() => {
const STORAGE_KEY = "riseup_avatar";
const TOK_KEY = "riseup_tok";

```
const defaults = {
    name: "Your Avatar",
    body: "default",
    material: "clay",
    pose: "standing",
    rotation: 0
};

const $ = (selector) => document.querySelector(selector);

let avatar = {
    ...defaults
};

let dragging = false;
let startX = 0;
let startRotation = 0;

function loadAvatar() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            avatar = {
                ...defaults
            };
            return;
        }

        const saved = JSON.parse(raw);

        avatar = {
            ...defaults,
            ...saved
        };
    } catch {
        avatar = {
            ...defaults
        };
    }
}

function saveAvatar(showMessage = true) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(avatar)
    );

    if (showMessage) {
        showToast("Avatar saved");
    }
}

function getTok() {
    const value = Number(
        localStorage.getItem(TOK_KEY) || "0"
    );

    return Number.isFinite(value) && value >= 0
        ? Math.floor(value)
        : 0;
}

function updateTok() {
    const amount = $("#tokAmount");

    if (amount) {
        amount.textContent = getTok().toLocaleString();
    }
}

function render() {
    const model = $("#clayAvatar");

    if (!model) {
        return;
    }

    model.className = "clay-avatar";

    if (avatar.body !== "default") {
        model.classList.add(`body-${avatar.body}`);
    }

    if (avatar.material !== "clay") {
        model.classList.add(`material-${avatar.material}`);
    }

    if (avatar.pose !== "standing") {
        model.classList.add(`pose-${avatar.pose}`);
    }

    model.style.setProperty(
        "--avatar-rotation",
        `${avatar.rotation}deg`
    );

    const name = $("#avatarName");
    const input = $("#nameInput");

    if (name) {
        name.textContent = avatar.name || "Your Avatar";
    }

    if (input && document.activeElement !== input) {
        input.value = avatar.name || "";
    }

    updateSelectedButtons();
    updateLabels();
}

function updateSelectedButtons() {
    document
        .querySelectorAll("[data-body]")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.body === avatar.body
            );
        });

    document
        .querySelectorAll("[data-material]")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.material === avatar.material
            );
        });

    document
        .querySelectorAll("[data-pose]")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.pose === avatar.pose
            );
        });
}

function updateLabels() {
    const bodyNames = {
        default: "Default",
        tall: "Tall",
        compact: "Compact"
    };

    const materialNames = {
        clay: "Clay",
        light: "Light",
        stone: "Stone"
    };

    const poseNames = {
        standing: "Standing",
        wave: "Wave",
        point: "Point",
        relaxed: "Relaxed"
    };

    $("#bodyValue").textContent =
        bodyNames[avatar.body] || "Default";

    $("#materialValue").textContent =
        materialNames[avatar.material] || "Clay";

    $("#poseValue").textContent =
        poseNames[avatar.pose] || "Standing";
}

function setupOptions() {
    document.querySelectorAll("[data-body]").forEach((button) => {
        button.addEventListener("click", () => {
            avatar.body = button.dataset.body;
            render();
        });
    });

    document.querySelectorAll("[data-material]").forEach((button) => {
        button.addEventListener("click", () => {
            avatar.material = button.dataset.material;
            render();
        });
    });

    document.querySelectorAll("[data-pose]").forEach((button) => {
        button.addEventListener("click", () => {
            avatar.pose = button.dataset.pose;
            render();
        });
    });
}

function setupNameInput() {
    const input = $("#nameInput");

    if (!input) {
        return;
    }

    input.addEventListener("input", () => {
        avatar.name = input.value.trim() || "Your Avatar";

        const heading = $("#avatarName");

        if (heading) {
            heading.textContent = avatar.name;
        }
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            input.blur();
            saveAvatar();
        }
    });
}

function setupRotation() {
    const stage = $("#avatarStage");

    if (!stage) {
        return;
    }

    stage.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button")) {
            return;
        }

        dragging = true;
        startX = event.clientX;
        startRotation = avatar.rotation;

        stage.classList.add("dragging");
        stage.setPointerCapture(event.pointerId);

        const model = $("#clayAvatar");

        model?.classList.add("no-transition");
    });

    stage.addEventListener("pointermove", (event) => {
        if (!dragging) {
            return;
        }

        const difference = event.clientX - startX;

        avatar.rotation = startRotation + difference * 0.7;

        if (avatar.rotation > 180) {
            avatar.rotation -= 360;
        }

        if (avatar.rotation < -180) {
            avatar.rotation += 360;
        }

        const model = $("#clayAvatar");

        if (model) {
            model.style.setProperty(
                "--avatar-rotation",
                `${avatar.rotation}deg`
            );
        }
    });

    const stopDragging = () => {
        if (!dragging) {
            return;
        }

        dragging = false;

        stage.classList.remove("dragging");

        const model = $("#clayAvatar");

        model?.classList.remove("no-transition");
    };

    stage.addEventListener("pointerup", stopDragging);
    stage.addEventListener("pointercancel", stopDragging);
    stage.addEventListener("lostpointercapture", stopDragging);

    stage.addEventListener("wheel", (event) => {
        event.preventDefault();

        const model = $("#clayAvatar");

        if (!model) {
            return;
        }

        const currentScale =
            Number(
                getComputedStyle(model)
                    .getPropertyValue("--avatar-scale")
            ) || 1;

        const nextScale =
            currentScale + (event.deltaY < 0 ? 0.04 : -0.04);

        const clamped = Math.max(
            0.72,
            Math.min(1.35, nextScale)
        );

        model.style.setProperty(
            "--avatar-scale",
            clamped
        );

        avatar.zoom = clamped;
    }, {
        passive: false
    });
}

function setupButtons() {
    $("#homeButton")?.addEventListener("click", () => {
        window.location.href = "home.html";
    });

    $("#saveButton")?.addEventListener("click", () => {
        saveAvatar();
    });

    $("#resetAvatarButton")?.addEventListener("click", () => {
        avatar = {
            ...defaults
        };

        saveAvatar(false);
        render();
        showToast("Avatar reset");
    });

    $("#resetViewButton")?.addEventListener("click", () => {
        avatar.rotation = 0;
        avatar.zoom = 1;

        const model = $("#clayAvatar");

        if (model) {
            model.style.setProperty(
                "--avatar-scale",
                "1"
            );
        }

        render();
    });

    $("#tokButton")?.addEventListener("click", () => {
        showToast("TOK balance");
    });
}

function showToast(message) {
    const toast = $("#saveToast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function initialize() {
    loadAvatar();

    if (typeof avatar.zoom !== "number") {
        avatar.zoom = 1;
    }

    setupOptions();
    setupNameInput();
    setupRotation();
    setupButtons();
    render();

    const model = $("#clayAvatar");

    if (model) {
        model.style.setProperty(
            "--avatar-scale",
            avatar.zoom
        );
    }
}

return {
    initialize,
    saveAvatar,
    reset() {
        avatar = {
            ...defaults
        };

        render();
    }
};
```

})();

document.addEventListener("DOMContentLoaded", () => {
RiseUpAvatar.initialize();
});
