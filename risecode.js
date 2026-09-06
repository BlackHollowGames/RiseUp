(() => {

  "use strict";


  const RiseCode = {


    /* ======================================================
       REMOVE COMMENTS
       ====================================================== */

    stripComments(
      code
    ) {

      return code
        .split("\n")
        .map(
          line => {

            let quote =
              null;

            for (
              let i = 0;
              i < line.length;
              i++
            ) {

              const char =
                line[i];


              if (
                (
                  char === '"' ||
                  char === "'"
                )
              ) {

                if (
                  !quote
                ) {

                  quote =
                    char;

                } else if (
                  quote ===
                  char
                ) {

                  quote =
                    null;

                }

                continue;
              }


              if (
                char === "/" &&
                line[i + 1] === "/" &&
                !quote
              ) {

                return line
                  .substring(
                    0,
                    i
                  )
                  .trim();
              }
            }


            return line;
          }
        )
        .join("\n");
    },


    /* ======================================================
       VALIDATION
       ====================================================== */

    validate(
      code
    ) {

      if (
        typeof code !==
        "string"
      ) {

        return {

          valid: false,

          error:
            "RiseScript must be text."

        };
      }


      const cleaned =
        this.stripComments(
          code
        );


      const lines =
        cleaned.split(
          "\n"
        );


      let braces =
        0;

      let whenDepth =
        0;


      for (
        let i = 0;
        i < lines.length;
        i++
      ) {

        const line =
          lines[i].trim();


        if (
          !line
        )
          continue;


        /*
         * Old-style when/end.
         */
        if (
          /^when\b/.test(
            line
          )
        ) {

          whenDepth++;

          continue;
        }


        if (
          line ===
          "end;"
        ) {

          if (
            whenDepth <= 0
          ) {

            return {

              valid: false,

              error:
                `Unexpected end; on line ${i + 1}.`

            };
          }


          whenDepth--;

          continue;
        }


        /*
         * Open brace.
         */
        const opens =
          (
            line.match(
              /\{/g
            ) || []
          ).length;


        const closes =
          (
            line.match(
              /\}/g
            ) || []
          ).length;


        braces +=
          opens -
          closes;


        if (
          braces < 0
        ) {

          return {

            valid: false,

            error:
              `Unexpected } on line ${i + 1}.`

          };
        }


        /*
         * Command.
         */
        if (
          line.startsWith(
            "<command>"
          )
        ) {

          if (
            !line.endsWith(
              "</command>"
            )
          ) {

            return {

              valid: false,

              error:
                `Command is not closed on line ${i + 1}.`

            };
          }

          continue;
        }


        /*
         * Blocks do not require ;
         */
        if (
          line.endsWith("{") ||
          line === "}"
        ) {

          continue;
        }


        /*
         * Function call / declaration /
         * normal RiseScript statement.
         *
         * A missing semicolon is only an
         * error when the line is clearly
         * a normal statement.
         */
        if (
          !line.endsWith(";") &&
          !/^(if|else|for|while|function|event|loop)\b/.test(
            line
          )
        ) {

          /*
           * User-defined language may
           * contain multiline constructs.
           * Don't destroy the whole script
           * over these.
           */
          continue;
        }
      }


      if (
        braces !== 0
      ) {

        return {

          valid: false,

          error:
            "A { block is missing its closing }."

        };
      }


      if (
        whenDepth !== 0
      ) {

        return {

          valid: false,

          error:
            "A when block is missing end;."

        };
      }


      return {

        valid: true,

        error: null

      };
    },


    /* ======================================================
       PARSE
       ====================================================== */

    parse(
      code
    ) {

      const validation =
        this.validate(
          code
        );


      if (
        !validation.valid
      ) {

        throw new Error(
          validation.error
        );
      }


      const cleaned =
        this.stripComments(
          code
        );


      const lines =
        cleaned.split(
          "\n"
        );


      const instructions =
        [];


      for (
        let i = 0;
        i < lines.length;
        i++
      ) {

        const line =
          lines[i].trim();


        if (!line)
          continue;


        if (
          line.startsWith(
            "<command>"
          )
        ) {

          instructions.push({

            type:
              "command",

            value:
              line
                .replace(
                  "<command>",
                  ""
                )
                .replace(
                  "</command>",
                  ""
                )
                .trim()

          });

          continue;
        }


        if (
          /^event\b/.test(
            line
          )
        ) {

          instructions.push({

            type:
              "event",

            value:
              line

          });

          continue;
        }


        if (
          /^function\b/.test(
            line
          )
        ) {

          instructions.push({

            type:
              "function",

            value:
              line

          });

          continue;
        }


        if (
          /^loop\b/.test(
            line
          )
        ) {

          instructions.push({

            type:
              "loop",

            value:
              line

          });

          continue;
        }


        if (
          /^when\b/.test(
            line
          )
        ) {

          instructions.push({

            type:
              "when",

            value:
              line

          });

          continue;
        }


        if (
          line ===
          "end;"
        ) {

          instructions.push({

            type:
              "end"

          });

          continue;
        }


        if (
          line ===
          "}"
        ) {

          instructions.push({

            type:
              "braceEnd"

          });

          continue;
        }


        if (
          line.endsWith(
            "{"
          )
        ) {

          instructions.push({

            type:
              "block",

            value:
              line

          });

          continue;
        }


        instructions.push({

          type:
            "statement",

          value:
            line

        });
      }


      return instructions;
    }

  };


  window.RiseCode =
    RiseCode;

})();