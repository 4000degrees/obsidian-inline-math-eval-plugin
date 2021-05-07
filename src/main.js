import {
  create,
  all
} from 'mathjs'

'use strict';

var obsidian = require('obsidian');

// Remove Widgets in CodeMirror Editor
const clearWidges = (cm) => {
  var lastLine = cm.lastLine();
  for (let i = 0; i <= lastLine; i++) {
    // Get the current Line
    const line = cm.lineInfo(i);
    // Clear the image widgets if exists
    if (line.widgets) {
      for (const wid of line.widgets) {
        if (wid.className === 'test-inline-math') {
          wid.clear();
        }
      }
    }
  }
};

class InlineMathEval extends obsidian.Plugin {
  constructor() {
    super(...arguments);


    const config = {}
    this.math = create(all, config)

    // Line Edit Changes
    this.codemirrorLineChanges = (cm, change) => {
      this.check_lines(cm, change.from.line, change.from.line + change.text.length - 1);
    };
    // Only Triggered during initial Load
    this.handleInitialLoad = (cm) => {
      var lastLine = cm.lastLine();
      for (let i = 0; i < lastLine; i++) {
        this.check_line(cm, i);
      }
    };
    // Check Single Line
    this.check_line = (cm, line_number, targetFile) => {

      const regex = /(.*)::=/;
      const line = cm.lineInfo(line_number);
      if (line === null)
        return;

      const match = line.text.match(regex);

      if (line.widgets) {
        for (const wid of line.widgets) {
          if (wid.className === 'test-inline-math') {
            wid.clear();
          }
        }
      }

      if (match) {

        // var w = document.createElement("span")

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

        // w.innerHTML = result
        // cm.addLineWidget(line_number, w, {
        //   className: 'test-inline-math'
        // });
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
      this.handleInitialLoad(cm);
    });
  }
  onunload() {
    this.app.workspace.iterateCodeMirrors((cm) => {
      cm.off("change", this.codemirrorLineChanges);
      clearWidges(cm);
    });
    new obsidian.Notice('Image in Editor Plugin is unloaded');
  }
}

module.exports = InlineMathEval;