Array.prototype.toString = function() {
    var list = [];
    for(var i = 0, l = this.length; i < l; i++)
        list.push(new String(this[i]));
    return "[" + list.join(',') + "]";
}

rexl.test = {};

rexl.test.resultsMatch = function (expected, actual) {
  if ((expected instanceof Array) && (actual instanceof Array)) {
    if (expected.length !== actual.length) {
      return false;
    }

    for (var i = 0; i < expected.length; i++) {
      if (expected[i] !== actual[i]) {
        return false;
      }
    }

    return true;
  }

  return expected === actual;
};

rexl.test.run = function(op, show_js, show_names, first_only) {
	var output = document.getElementById('output');
    var tests = rexl.test.tests;
	for(var i = 0, l = tests.length; i < l; i++) {
		var item = tests[i];
		output.innerHTML += "<p>\n";
		output.innerHTML += ('<strong>' + item.query + '</strong><br/>\n');
		try {
			var node = rexl.parse(item.query);
            if(show_js)
                output.innerHTML += ('<em>' + node.toJS() + '</em><br/>\n');
            if(show_names)
                output.innerHTML += ('<em>' + node.getNames() + '</em><br/>\n');
			var value = node[op](rexl.test.callback);
      if(value instanceof rexl.TypeInstance)
          value = value.cls;
			output.innerHTML += ('Expected: <strong>' + item.expect + '</strong>&nbsp;&nbsp;&nbsp;&nbsp;');
			output.innerHTML += ('Got: <strong>' + value + '</strong>&nbsp;&nbsp;&nbsp;&nbsp;');
      var match = rexl.test.resultsMatch(item.expect, value);
			var color = match ? 'green':'red';
			var text = match ? 'Passed':'Failed';
			output.innerHTML += ('Test: <strong style=\"color:' + color + '\">' + text + '</strong>');
		}
		catch(err) {
            if(item.expect == 'error') {
                output.innerHTML += ('Expected: <strong style="color:red">' + item.expect + '</strong>&nbsp;&nbsp;&nbsp;&nbsp;');
                output.innerHTML += ('Got: <strong style="color:red">' + err + '</strong>&nbsp;&nbsp;&nbsp;&nbsp;');
                output.innerHTML += ('Test: <strong style="color:green">Passed</strong>');
            
            }
            else
                output.innerHTML += ('<strong style="color:red">' + err + '</strong>');
		}
        if(first_only)
		    break;
	}
}
