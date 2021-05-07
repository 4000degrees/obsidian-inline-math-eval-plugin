import {
  create,
  all
} from 'mathjs'

'use strict';

var obsidian = require('obsidian');

export default class InlineMathEval extends obsidian.Plugin {
  constructor() {
    super(...arguments);


    const config = {}
    this.math = create(all, config)

    // Line Edit Changes
    this.codemirrorLineChanges = (cm, change) => {
      this.check_lines(cm, change.from.line, change.from.line + change.text.length - 1);
    };

    // Check Single Line
    this.check_line = (cm, line_number, targetFile) => {

      const regex = /(.*)::=/;
      const line = cm.lineInfo(line_number);
      if (line === null)
        return;

      const match = line.text.match(regex);

      if (match) {

        var result = false;
        var triggerIndex = line.text.indexOf("::=")
        var maybeSpace = line.text.charAt(triggerIndex - 1) == " " ? "" : " "
        try {
          result = this.math.evaluate(match[1])
          result = maybeSpace + "= " + result
        } catch (e) {
          new obsidian.Notice(e);
          result = ""
        }

        cm.replaceRange(result, {
          line: line_number,
          ch: triggerIndex
        }, {
          line: line_number
        })

      }
    };

    // Check All Lines Function
    this.check_lines = (cm, from, to) => {
      for (let i = from; i <= to; i++) {
        this.check_line(cm, i);
      }
    };
  }
  onload() {
    // Register event for each change
    this.registerCodeMirror((cm) => {
      cm.on("change", this.codemirrorLineChanges);
    });
  }
  onunload() {
    this.app.workspace.iterateCodeMirrors((cm) => {
      cm.off("change", this.codemirrorLineChanges);
    });
  }
}