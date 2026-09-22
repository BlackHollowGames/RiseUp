(function () {
"use strict";

```
const Runtime = {
    state: {
        running: false,
        player: {
            speed: 5,
            position: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        objects: [],
        map: {
            name: "Untitled Map"
        },
        logs: [],
        errors: []
    },

    reset() {
        this.state = {
            running: false,
            player: {
                speed: 5,
                position: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            },
            objects: [],
            map: {
                name: "Untitled Map"
            },
            logs: [],
            errors: []
        };
    },

    log(message) {
        this.state.logs.push(String(message));
        console.log("[RiseCode]", message);
    },

    error(message) {
        this.state.errors.push(String(message));
        console.error("[RiseCode]", message);
    },

    parseLine(line, lineNumber) {
        const trimmed = line.trim();

        if (!trimmed) {
            return null;
        }

        if (
            trimmed.startsWith("//") ||
            trimmed.startsWith("#")
        ) {
            return null;
        }

        let match;

        match = trimmed.match(
            /^player\.walk\.speed\s*=\s*([0-9.+-]+)\s*;?$/
        );

        if (match) {
            return {
                type: "player.speed",
                value: Number(match[1]),
                line: lineNumber
            };
        }

        match = trimmed.match(
            /^player\.position\.(x|y|z)\s*=\s*([0-9.+-]+)\s*;?$/
        );

        if (match) {
            return {
                type: "player.position",
                axis: match[1],
                value: Number(match[2]),
                line: lineNumber
            };
        }

        match = trimmed.match(
            /^map\.name\s*=\s*["'](.+)["']\s*;?$/
        );

        if (match) {
            return {
                type: "map.name",
                value: match[1],
                line: lineNumber
            };
        }

        match = trimmed.match(
            /^add\.mesh\.(cube|wedge|sphere|cylinder|plane|cone)\s*\(\s*\)\s*;?$/
        );

        if (match) {
            return {
                type: "add.mesh",
                shape: match[1],
                line: lineNumber
            };
        }

        match = trimmed.match(
            /^([xyz])\s*=\s*([0-9.+-]+)\s*;?$/
        );

        if (match) {
            return {
                type: "standalone.position",
                axis: match[1],
                value: Number(match[2]),
                line: lineNumber
            };
        }

        match = trimmed.match(
            /^rotation\.(x|y|z)\s*=\s*([0-9.+-]+)\s*;?$/
        );

        if (match) {
            return {
                type: "rotation",
                axis: match[1],
                value: Number(match[2]),
                line: lineNumber
            };
        }

        if (
            trimmed.startsWith("let ") ||
            trimmed.startsWith("const ") ||
            trimmed.startsWith("var ") ||
            trimmed.startsWith("function ")
        ) {
            return {
                type: "declaration",
                source: trimmed,
                line: lineNumber
            };
        }

        if (trimmed.startsWith("console.log")) {
            return {
                type: "log",
                source: trimmed,
                line: lineNumber
            };
        }

        return {
            type: "unknown",
            source: trimmed,
            line: lineNumber
        };
    },

    parse(code) {
        return String(code || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map((line, index) =>
                this.parseLine(line, index + 1)
            )
            .filter(Boolean);
    },

    execute(instruction) {
        if (!instruction) {
            return;
        }

        switch (instruction.type) {

            case "player.speed":
                this.state.player.speed = instruction.value;
                break;

            case "player.position":
                this.state.player.position[instruction.axis] =
                    instruction.value;
                break;

            case "map.name":
                this.state.map.name = instruction.value;
                break;

            case "add.mesh": {
                const object = {
                    id:
                        `object_${Date.now()}_${this.state.objects.length}`,
                    type: "mesh",
                    shape: instruction.shape,
                    position: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    rotation: {
                        x: 0,
                        y: 0,
                        z: 0
                    }
                };

                this.state.objects.push(object);
                break;
            }

            case "standalone.position": {
                const lastObject =
                    this.state.objects[
                        this.state.objects.length - 1
                    ];

                if (lastObject) {
                    lastObject.position[instruction.axis] =
                        instruction.value;
                } else {
                    this.state.player.position[instruction.axis] =
                        instruction.value;
                }

                break;
            }

            case "rotation": {
                const lastObject =
                    this.state.objects[
                        this.state.objects.length - 1
                    ];

                if (lastObject) {
                    lastObject.rotation[instruction.axis] =
                        instruction.value;
                }

                break;
            }

            case "log":
                this.log(instruction.source);
                break;

            case "declaration":
                break;

            case "unknown":
                this.error(
                    `Line ${instruction.line}: Unknown RiseCode statement: ${instruction.source}`
                );
                break;
        }
    },

    run(files, game = null) {
        this.reset();
        this.state.running = true;

        const sourceFiles = files || {};

        Object.keys(sourceFiles).forEach(fileName => {
            const code = sourceFiles[fileName];

            const instructions = this.parse(code);

            instructions.forEach(instruction => {
                this.execute(instruction);
            });
        });

        if (game) {
            this.applyToGame(game);
        }

        return {
            success: this.state.errors.length === 0,
            errors: [...this.state.errors],
            logs: [...this.state.logs],
            state: structuredClone
                ? structuredClone(this.state)
                : JSON.parse(JSON.stringify(this.state))
        };
    },

    applyToGame(game) {
        if (!game) {
            return;
        }

        if (game.player) {
            game.player.speed =
                this.state.player.speed;

            if (game.player.position) {
                Object.assign(
                    game.player.position,
                    this.state.player.position
                );
            }
        }

        game.mapName = this.state.map.name;

        if (Array.isArray(game.objects)) {
            game.objects.length = 0;

            this.state.objects.forEach(object => {
                game.objects.push({
                    ...object,
                    position: { ...object.position },
                    rotation: { ...object.rotation }
                });
            });
        }
    },

    stop() {
        this.state.running = false;
    }
};

window.RiseCodeRuntime = Runtime;

window.RiseCode = window.RiseCode || {};

window.RiseCode.Runtime = Runtime;
```

})();
