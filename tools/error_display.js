var clc = require('cli-color');

const colors = {
  warning: clc.bold.yellowBright,
  error: clc.bold.redBright,
  hint: clc.bold.blueBright,
  note: clc.bold.greenBright,
  desc: clc.bold,
}

exports.formatSlice = function(slice) {
  let result = '';

  let lines = slice.content.split('\n');
  let maxLnIndent = (slice.lineNum + lines.length).toString().length; 

  result += formatTitleLine(slice);
  result += formatPosLine(slice, maxLnIndent);

  result += colors.hint(`${" ".repeat(maxLnIndent)} |\n`);

  let ptr = 0;

  for (let i = 0; i < lines.length; i++) {
    let lnIndent = maxLnIndent - (slice.lineNum + i).toString().length; 
    let ln = colors.hint(`${i + slice.lineNum}${" ".repeat(lnIndent)} |`);
    result += `${ln} ${lines[i]}\n`;

    let labels = addLabels(slice, [ptr, ptr + lines[i].length], maxLnIndent);
    if (labels) {
      result += labels;
    }
    if (i === lines.length - 1 && (!labels || slice.blocks.length > 0)) {
      result += colors.hint(`${" ".repeat(maxLnIndent)} |\n`);
    }

    ptr += lines[i].length + 1;
  }
  for (let block of slice.blocks) {
    result += addBlock(block, maxLnIndent);
  }

  return result;
}

function formatTitleLine(slice) {
  let type = colors[slice.type](slice.type);
  let name = colors.desc(slice.desc);
  return `${type}: ${name}\n`;
}

function formatPosLine(slice, lnIndent) {
  let ptr = 0;
  let ln = slice.lineNum;
  let col = 0;

  for (let line of slice.content.split('\n')) {
    if (ptr + line.length + 1 > slice.pos) {
      col = slice.pos - ptr;
      break;
    }
    ptr += line.length + 1;
    ln += 1;
  }
  let arrow = colors.hint('-->');
  return `${" ".repeat(lnIndent)}${arrow} ${slice.source}:${ln}:${col + 1}\n`;
}

function addBlock(block, maxLnIndent) {
  let result = '';
  let lines = block.content.split('\n');
  let type = block.type;

  let ln = " ".repeat(maxLnIndent); 
  for (let i = 0; i < lines.length; i++) {
    let pre = i === 0 ? `${colors.hint('=')} ${colors.desc(type)}: ` : `  ${" ".repeat(type.length)}  `;
    result += `${ln} ${pre}${lines[i]}\n`;
  }
  return result;
}

function addLabels(slice, linePos, maxLnIndent) {
  let result = '';


  for (let i = 0; i < slice.labels.length; i++) {
    let label = slice.labels[i];

    if (label.mark[0] >= linePos[0] && label.mark[0] < linePos[1]) {
      let markChar = label.type == 'primary' ? '^' : '-';
      let preLen = label.mark[0] - linePos[0];
      let pre = " ".repeat(preLen);
      let markLen = label.mark[1] - label.mark[0];

      if (markLen > linePos[1] - linePos[0] - preLen) {
        markLen = linePos[1] - linePos[0] - preLen;
      }
      let mark = markChar.repeat(markLen);
      if (label.type === 'primary') {
        mark = colors[slice.type](mark);
      } else {
        mark = colors.hint(mark);
      }
      result += `${" ".repeat(maxLnIndent)} ${colors.hint('|')} ${pre}${mark} ${label.desc}\n`;
    }
  }
  return result;
}
