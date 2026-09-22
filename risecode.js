(function () {
"use strict";

```
const RiseCode = {

    version: "1.0.0",

    types: [
        "number",
        "string",
        "boolean",
        "vector2",
        "vector3",
        "color",
        "object",
        "array",
        "function"
    ],

    keywords: [
        "let",
        "const",
        "var",
        "function",
        "if",
        "else",
        "for",
        "while",
        "return",
        "true",
        "false"
    ],

    shapes: [
        "cube",
        "wedge",
        "sphere",
        "cylinder",
        "plane",
        "cone"
    ],

    tokenize(code) {
        const tokens = [];
        const source = String(code || "");

        const pattern =
            /\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_.]*|===|!==|==|!=|<=|>=|&&|\|\||[{}()[\];,.=:+\-*/<>]/g;

        let match;

        while ((match = pattern.exec(source)) !== null) {
            const value = match[0];

            if (value.startsWith("//")) {
                continue;
            }

            tokens.push({
                value,
                index: match.index,
                type: this.getTokenType(value)
            });
        }

        return tokens;
    },

    getTokenType(value) {
        if (this.keywords.includes(value)) {
            return "keyword";
        }

        if (this.types.includes(value)) {
            return "type";
        }

        if (this.shapes.includes(value)) {
            return "shape";
        }

        if (/^\d/.test(value)) {
            return "number";
        }

        if (
            value.startsWith('"') ||
            value.startsWith("'")
        ) {
            return "string";
        }

        if (
            [
                "=",
                "==",
                "===",
                "!=",
                "!==",
                "<",
                ">",
                "<=",
                ">=",
                "+",
                "-",
                "*",
                "/",
                "&&",
                "||"
            ].includes(value)
        ) {
            return "operator";
        }

        if (
            [
                "{",
                "}",
                "(",
                ")",
                "[",
                "]",
                ";",
                ",",
                "."
            ].includes(value)
        ) {
            return "punctuation";
        }

        return "identifier";
    },

    parse(code) {
        const source = String(code || "");
        const lines = source.replace(/\r\n/g, "\n").split("\n");

        const result = [];

        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const trimmed = line.trim();

            if (!trimmed) {
                return;
            }

            if (
                trimmed.startsWith("//") ||
                trimmed.startsWith("#")
            ) {
                return;
            }

            const instruction =
                this.parseStatement(trimmed, lineNumber);

            if (instruction) {
                result.push(instruction);
            }
        });

        return result;
    },

    parseStatement(line, lineNumber) {

        let match = line.match(
            /^player\.walk\.speed\s*=\s*(.+?)\s*;?$/
        );

        if (match) {
            return {
                type: "statement",
                command: "player.walk.speed",
                value: this.parseValue(match[1]),
                line: lineNumber
            };
        }

        match = line.match(
            /^player\.position\.(x|y|z)\s*=\s*(.+?)\s*;?$/
        );

        if (match) {
            return {
                type: "statement",
                command: `player.position.${match[1]}`,
                value: this.parseValue(match[2]),
                line: lineNumber
            };
        }

        match = line.match(
            /^map\.name\s*=\s*(.+?)\s*;?$/
        );

        if (match) {
            return {
                type: "statement",
                command: "map.name",
                value: this.parseValue(match[1]),
                line: lineNumber
            };
        }

        match = line.match(
            /^add\.mesh\.([A-Za-z0-9_]+)\s*\(\s*\)\s*;?$/
        );

        if (match) {
            return {
                type: "command",
                command: `add.mesh.${match[1]}`,
                value: null,
                line: lineNumber
            };
        }

        match = line.match(
            /^([xyz])\s*=\s*(.+?)\s*;?$/
        );

        if (match) {
            return {
                type: "statement",
                command: match[1],
                value: this.parseValue(match[2]),
                line: lineNumber
            };
        }

        match = line.match(
            /^rotation\.(x|y|z)\s*=\s*(.+?)\s*;?$/
        );

        if (match) {
            return {
                type: "statement",
                command: `rotation.${match[1]}`,
                value: this.parseValue(match[2]),
                line: lineNumber
            };
        }

        match = line.match(
            /^let\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*;?$/
        );

        if (match) {
            return {
                type: "variable",
                name: match[1],
                value: this.parseValue(match[2]),
                line: lineNumber
            };
        }

        match = line.match(
            /^const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*;?$/
        );

        if (match) {
            return {
                type: "constant",
                name: match[1],
                value: this.parseValue(match[2]),
                line: lineNumber
            };
        }

        return {
            type: "unknown",
            source: line,
            line: lineNumber
        };
    },

    parseValue(value) {
        const input = String(value).trim();

        if (
            (
                input.startsWith('"') &&
                input.endsWith('"')
            ) ||
            (
                input.startsWith("'") &&
                input.endsWith("'")
            )
        ) {
            return input.slice(1, -1);
        }

        if (input === "true") {
            return true;
        }

        if (input === "false") {
            return false;
        }

        if (
            input.startsWith("[") &&
            input.endsWith("]")
        ) {
            try {
                return JSON.parse(input);
            } catch {
                return input;
            }
        }

        if (!Number.isNaN(Number(input))) {
            return Number(input);
        }

        return input;
    },

    validate(code) {
        const parsed = this.parse(code);
        const errors = [];

        parsed.forEach(instruction => {
            if (instruction.type === "unknown") {
                errors.push({
                    line: instruction.line,
                    message:
                        `Unknown RiseCode statement: ${instruction.source}`
                });
            }

            if (
                instruction.command &&
                instruction.command.startsWith("add.mesh.")
            ) {
                const shape =
                    instruction.command.replace(
                        "add.mesh.",
                        ""
                    );

                if (!this.shapes.includes(shape)) {
                    errors.push({
                        line: instruction.line,
                        message:
                            `Unknown mesh type: ${shape}`
                    });
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    },

    compile(code) {
        const validation = this.validate(code);

        return {
            success: validation.valid,
            instructions: validation.valid
                ? this.parse(code)
                : [],
            errors: validation.errors
        };
    }
};

window.RiseCode = RiseCode;
```

})();
