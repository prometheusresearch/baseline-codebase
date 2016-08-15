var chalk = require('chalk');

function noFormat(msg) {
  return msg;
}

function createFormatter(config) {
  function format(msg, options) {
    options = options || {};
    msg = config.format(msg);
    if (options.label) {
      msg = config.formatLabel(' ' + options.label + ' ') + ' ' + msg;
    }
    return msg;
  }

  function write(msg, options) {
    options = options || {};
    msg = format(msg, options);
    process.stdout.write(msg + (options.noNewLine ? '' : '\n'));
  }

  write.format = format;

  return write;
}

var regular = createFormatter({
  format: noFormat,
  formatLabel: chalk.bgBlue.black,
});

var success = createFormatter({
  format: chalk.green,
  formatLabel: chalk.bgGreen.black,
});

var warning = createFormatter({
  format: chalk.yellow,
  formatLabel: chalk.bgYellow.black,
});

var error = createFormatter({
  format: chalk.red,
  formatLabel: chalk.bgRed.black,
});

function newLine() {
  process.stdout.write('\n');
}

function clear() {
  process.stdout.write('\033[2J');
  process.stdout.write('\033[0f');
}

module.exports = {
  newLine, clear,
  regular, success, warning, error
};
