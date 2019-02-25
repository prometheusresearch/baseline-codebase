var fs = require('fs');
var path = require('path');

var REX_ACTION = /rex[\.\-]action(\/static)?\/js\/lib/;
var REX_WIDGET = /rex[\.\-]widget(\/static)?\/js\/lib/;

var config = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.babelrc')));
config.only = function(filename) {
  var ok = REX_ACTION.exec(filename) || REX_WIDGET.exec(filename);
  return ok;
};

require('babel-core/register')(config);
