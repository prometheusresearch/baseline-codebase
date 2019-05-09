global.rexl = window.rexl = {}

// export in CommonJS environment
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = rexl;
}

rexl.Class = function(constructor, inherits) {
    var clazz = function() {
        if (clazz.__) return delete(clazz.__);
        this.constructor = clazz;
        if(constructor)
            constructor.apply(this, arguments);
    };
    if(inherits) {
        inherits.__ = true;
        clazz.prototype = new inherits;
        clazz.prototype.constructor = inherits;
        // statics
        for(var key in inherits)
            if(key != 'prototype')
                clazz[key] = inherits[key];
    }
    return clazz;
}

rexl.log = function() {
	if(typeof console != 'undefined')
		for(var i = 0, l = arguments.length; i < l; i++)
			console.debug(arguments[i]);
}

rexl.evaluate = function(s, callback, obj) {
	var node = rexl.parse(s);
	return node.evaluate(callback, obj);
}

rexl.parse = function(s) {
	var tokens = rexl.tokenize(s);
	var node = rexl._parse_test(tokens);
	return node;
}

rexl.Error = rexl.Class(function(type, message, start, end) {
    this.message = '[' + rexl._error_types[type] + '] ' + message;
    this.start = start;
    this.end = end;
});

rexl.Error.prototype.toString = function() {
    return this.message;
}

rexl._error_types = {
	tokenizer: '[Tokenizer Error]',
	parser:'[Parser Error]',
	evaluator:'[Evaluator Error]',
    validator: '[Validator Error]'
};

rexl._error = function(type, message, start, end) {
	throw new rexl.Error(type, message, start, end);
} 

rexl.types = {
    'Untyped': 'Untyped',
    'String': 'String',
    'Number': 'Number',
    'Boolean': 'Boolean',
    'List': 'List'
};

rexl._separator = '.';
rexl.setSeparator = function(separator) {
    rexl._separator = separator;
};

// Tokenizer
rexl.Token = rexl.Class(function(name, value, start, end) {
	this.name = name;
	this.value = value;
	this.start = start;
	this.end = end;
})

rexl.Token.prototype.toString = function() {
	return this.name + '(' + this.value + ')';
}

rexl.re_ws = /^\s+/;

rexl.re = {	
	NAME: /^(?!\d)(?:\w)+|^"(?:[^"]|"")+"/,
	UNQUOTED_LITERAL: /^@(?:(?!\d)(?:\w|\:)+|^"(?:[^"]|"")+")\[[^\]]+\]/,
	QUOTED_LITERAL: /^'(?:[^']|'')*'/,
	NUMERIC_LITERAL: /^[0-9]+(?:\.[0-9]*(?:[eE][-+][0-9]+)?)?/,
	SYMBOL: /^(?:=~~|=~|==|=|<=|<|>=|>|~~|~|\^~~|\^~|\$~~|\$~|!=~~|!=~|!==|!=|!~~|!~|!\^~~|!\^~|!\$~~|!\$~|!|&|\||\.|\:|,|\(|\)|\[|\]|\{|\}|\?|\:|;|@|\^|\/\+|\/|\*|\+|-)/
};

rexl.tokenize = function(s) {
    var last = s.length - 1;
	var index = 0;
	var tokens = [];
	while(s) {
		var matches = rexl.re_ws.exec(s);
		if(matches && matches.length) {
			var match = matches[0];
			s = s.substr(match.length);
			index += match.length;
			if(!s) break;
		}
		
		var token_found = false;
		for(var token_type in rexl.re) {
			matches = rexl.re[token_type].exec(s);
			if(matches && matches.length) {
				token_found = true;
				var match = matches[0];
				s = s.substr(match.length);
					
				tokens.push(new rexl.Token(token_type, match, index, index + match.length - 1));
				index += match.length;
				break;
			}
		}

		if(!token_found)
			rexl._error('tokenizer', "Can't find the next token", index, last);
	}
	return tokens;
}

/*
 * Parser
 */

rexl._check = function(tokens, name, value, eat) {
	if(typeof(eat) == 'undefined')
		eat = true;
	if(!tokens.length)
		return null;
	if(typeof(name) == 'string')
		name = [name];
	if(typeof(value) == 'undefined') {
		for(var i = 0, l = name.length; i < l; i++)
			if(tokens[0].name == name[i]) {
				if(eat)
					return tokens.shift();
				else
					return tokens[0];
			}
		return null;
	}
		
	if(typeof(value) == 'string')
		value = [value];
	for(var i = 0, l = value.length; i < l; i++)
		for(var j = 0, l1 = name.length; j < l1; j++) {
			if(tokens[0].name == name[j] && tokens[0].value == value[i]) {
				if(eat)
					return tokens.shift();
				else
					return tokens[0];
			}
		}
	return null;
}

rexl._expect = function(tokens, name, value) {
	var token = rexl._check(tokens, name, value);
	if(token == null) {
		rexl._error('parser', name + ' expected but ' + tokens[0].name + ' found', tokens[0].start, tokens[0].end);
	}
	else
		return token;
}

rexl.Node = rexl.Class(function(type, value, start, end, args) {
	this.type = type;
	this.value = value;
    this.start = start;
    this.end = end;
	this.args = args;

	if(type == 'QUOTED_LITERAL') {
		this.value = this.value.substr(1, this.value.length - 2);
		this.value = this.value.replace(/''/g, "'");
	}
    else if(type == 'IDENTIFIER' && /^".+"$/.test(this.value)) {
        this.value = this.value.substr(1, this.value.length - 2);
        this.value = this.value.replace(/""/g, '"');
        this.quoted = true;
    }
});

rexl.Node.prototype.mapArgs = function(f, list) {
    list = list || this.args;
    var ret = [];
    for(var i = 0, l = list.length; i < l; i++)
        ret.push(f(list[i]));
    return ret;
};

rexl.Node.prototype.toString = function() {
    //console.debug(this.type);
	switch(this.type) {
		case 'NUMERIC_LITERAL': return this.value + '';
		case 'UNQUOTED_LITERAL': return this.value; 
		case 'QUOTED_LITERAL': return "'" + this.value.replace(/'/g, "''") + "'";
        case 'IDENTIFIER': return !this.quoted ? this.value:
                                  '"' + this.value.replace(/"/g, '""') + '"';
		case 'OPERATION': {
			if(typeof(this.value) != 'string' 
						&& this.value instanceof rexl.Node
						&& this.value.isSpecifier()) {
				var arg = this.value.args[0];
				var method = this.value.args[1];
				if(!method.isIdentifier())
					rexl._error('parser', 'Method name should be identifier. ' 
							+ method.type + ' found.', method.start, method.end);
				method = method.value;
				arg = arg.toString();
                if(!(/^[A-Za-z_]\w*$/.test(arg)))
                    arg = '(' + arg + ')';
				var args = this.mapArgs(function(item) {
                    return item.toString();
                }).join(',');
                return arg + '.' + method + '(' + args + ')';
			}
			else if(typeof(this.value) == 'string' 
						|| (this.value instanceof rexl.Node
						&& this.value.isIdentifier())) {
				var op = !(this.value instanceof rexl.Node && this.value.isIdentifier()) ?
					     this.value:this.value.value;
				var args = this.mapArgs(function(item) {
                    return item.toString();
                });

                if(op == '!()')
                    return '!(' + args[0] + ')';
                else if(/^[A-Za-z_]\w*$/.test(op))
                    return op + '(' + args.join(',') + ')';
                else 
                    return this.mapArgs(function(item) {
                        var s = item.toString();
                        return item.isIdentifier() 
                               || item.isSpecifier() 
                               || !item.isOperation() 
                               || item.isOperation() && /^null|true|false$/.test(item.value) 
                               ? item:'(' + item + ')';
                    }).join(op);

			}
			else
				rexl._error('parser', 'Can\'t process the operation: ' + this.toString(), this.start, this.end);
			break;
		}

	}
}

rexl.Node.prototype.toJS = function() {
	if(this._js)
		return this._js;
	switch(this.type) {
		case 'NUMERIC_LITERAL': {
			this._js = "e.num(" + this.value + ")"; 
			break;
		}
		case 'UNQUOTED_LITERAL': 
		case 'QUOTED_LITERAL': {
			this._js =  "e.str(\"" + this.value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\")";
			break;
		}
		case 'IDENTIFIER': { 
			this._js = "e.ident(\"" + this.value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\")";
			break;
		}
		case 'OPERATION': {
            var e = 'e.pos(' + this.start + ',' + this.end + ')';
			if(typeof(this.value) != 'string' 
						&& this.value instanceof rexl.Node
						&& this.value.isSpecifier()) {
				var arg = this.value.args[0];
				var method = this.value.args[1];
				if(!method.isIdentifier())
					rexl._error('parser', 'Method name should be identifier. ' 
							+ method.type + ' found.', method.start, method.end);
				method = method.value;
				arg = arg.toJS();
				var args = this.argsToJS();
				args = args ? e + ',' + arg + ',' + args:e + ',' + arg;
				this._js = "e.f('" + method + "')(" + args + ")";
			}
			else if(typeof(this.value) == 'string' 
						|| (this.value instanceof rexl.Node
						&& this.value.isIdentifier())) {
				if(this.value instanceof rexl.Node && this.value.isIdentifier())
					this.value = this.value.value;
				var args = this.argsToJS();
				args = args ? e + ', ' + args:e;
				this._js = "e.f('" + this.value + "')(" + args  + ")";

			}
			else
				rexl._error('parser', 'Can\'t process the operation: ' + this.toString(), this.start, this.end);
			break;
		}

	}
	return this._js;
}

rexl.Node.prototype.argsToJS = function() {
	var js = [];
	for(var i = 0, l = this.args.length; i < l; i++)
		js.push(this.args[i].toJS());
	return js.join(',');
}

rexl.Node.prototype.isIdentifier = function() {
	return this.type == 'IDENTIFIER';
}

rexl.Node.prototype.isSpecifier = function() {
	return this.isOperation() && this.value == rexl._separator;
}

rexl.Node.prototype.isOperation = function() {
	return this.type == 'OPERATION';
}

rexl.Node.prototype.getNames = function() {
    var dict = {};
    this._getNames(dict);
    var ret = [];
    for(var key in dict) {
        ret.push(dict[key]);
    }
    return ret;
}

rexl.Node.prototype._getNames = function(dict) {
    if(this.isOperation()) {
        if(this.isSpecifier()) {
            var left = this.args[0];
            var right = this.args[1];
            if(!(left.isIdentifier() || left.isSpecifier()))
                return;
            var id = [];
            if(right.isIdentifier())
               id.unshift(right.toString()); 
            while(left.isSpecifier()) {
               id.unshift(left.args[1].toString()); 
               left = left.args[0];
            }
            if(!left.isIdentifier())
                return;
            id.unshift(left.toString());
            dict[id.join(rexl._separator)] = id;
        }
        else {
            for(var i = 0, l = this.args.length; i < l; i++)
                this.args[i]._getNames(dict);
            if(this.value instanceof rexl.Node && this.value.isSpecifier()) {
                // method call
                this.value.args[0]._getNames(dict);
            }
        }
    }
    else if(this.isIdentifier()) {
        dict[this.toString()] = [this.toString()]; 
    }
}

rexl.Node.prototype.evaluate = function(callback, obj) {
	var e = new rexl.Evaluator(this, callback, obj);
    rexl.evaluator = e;
	return e.evaluate();
}

rexl.Node.prototype.validate = function(callback, obj) {
	var v = new rexl.Validator(this, callback, obj);
    rexl.validator = v;
	return v.evaluate();
}

rexl.Node.prototype.validateUntyped = function() {
    return this.validate(function() {
        return rexl.type(rexl.Untyped); 
    }, null);
}

// rexl_expr ::= and_test ('|' and_test)*
rexl._parse_test = function(tokens) {
	var tests = [];
	do {
		var test = rexl._parse_and_test(tokens);
		if(test != null)
			tests.push(test);
	} 
	while(rexl._check(tokens, 'SYMBOL', '|', true));

	switch(tests.length) {
		case 0: return null;
		case 1: return tests[0];
		default: return new rexl.Node('OPERATION', '|', tests[0].start, tests[tests.length - 1].end, tests);
	}
}

// and_test ::= not_test ('&' not_test)*
rexl._parse_and_test = function(tokens) {
	var tests = [];
	do {
		var test = rexl._parse_not_test(tokens);
		if(test != null)
			tests.push(test);
	} 
	while(rexl._check(tokens, 'SYMBOL', '&'));

	switch(tests.length) {
		case 0: return null;
		case 1: return tests[0];
		default: return new rexl.Node('OPERATION', '&', tests[0].start, tests[tests.length - 1].end, tests);
	}
}

// not_test ::= '!' not_test | comp
rexl._parse_not_test = function(tokens) {
	var start = rexl._check(tokens, 'SYMBOL', '!');
	if(start) {
		var test = rexl._parse_not_test(tokens);
		return new rexl.Node('OPERATION', '!()', start.start, test.end, [test]);
	}
	return rexl._parse_comp(tokens);
}

/*
 * comp ::= expr ( ( '==' | '=' | '<=' | '<' | '>=' | '>' | '~=' | '~'
 * | '!==' | '!=' | '!~=' | '!~' ) expr (',' expr)* | ':=' expr )?
 */
rexl._parse_comp = function(tokens) {
	var left = rexl._parse_expr(tokens);
	var op = rexl._check(tokens, 'SYMBOL', ['==','=','<=','<','>=','>','~~',
			'~','!==','!=','!~~','!~', '=~', '=~~', '!=~', '!=~~']);
	if(!op)
		return left;

	var right = rexl._parse_expr(tokens);

	return new rexl.Node('OPERATION', op.value, left.start, right.end, [left, right]);
}

// expr ::= term (('+'|'-') term)*
rexl._parse_expr = function(tokens) {
	var left = rexl._parse_term(tokens);
	var op = rexl._check(tokens, 'SYMBOL', ['+', '-']);
	if(!op)
		return left;
	do {
		var right = rexl._parse_term(tokens);
		left = new rexl.Node('OPERATION', op.value, left.start, right.end, [left, right]);
	}
	while(op = rexl._check(tokens, 'SYMBOL', ['+', '-']));
	return left;
}

// term ::= factor (('*'|'div'|'mod') factor)*
rexl._parse_term = function(tokens) {
	var left = rexl._parse_factor(tokens);
	var op = rexl._check(tokens, 'SYMBOL', ['*', '/', 'mod']);
	if(!op)
		return left;
	do {
		var right = rexl._parse_factor(tokens);
		left = new rexl.Node('OPERATION', op.value, left.start, right.end, [left, right]);
	}
	while(op = rexl._check(tokens, 'SYMBOL', ['*', '/', 'mod']));
	return left;
}

// factor ::= ('+'|'-') factor | power
rexl._parse_factor = function(tokens) {
	var op = rexl._check(tokens, 'SYMBOL', ['+', '-']);
	if(!op)
		return rexl._parse_power(tokens);
	var factor = rexl._parse_factor(tokens);
	return new rexl.Node('OPERATION', op.value + '()', op.start, factor.end, [factor]);
}

// power ::= atom ('^' factor)?
rexl._parse_power = function(tokens) {
	var left = rexl._parse_atom(tokens);
	var op = rexl._check(tokens, 'SYMBOL', '^');
	if(!op)
		return left;
	var right = rexl._parse_factor(tokens);
	return new rexl.Node('OPERATION', '^', left.start, right.end, [left, right]);
}

/* atom ::= ( locator | identifier | literal | '(' test ')' )
 *       ('[' test ']' | '(' args? ')' | '.' identifier )*?
 */
rexl._parse_atom = function(tokens) {
    var literal, symbol;
	if(literal = rexl._check(tokens, ['UNQUOTED_LITERAL', 'QUOTED_LITERAL', 'NUMERIC_LITERAL'])) {
		var _parent = new rexl.Node(literal.name, literal.value, literal.start, literal.end);
	}
	else if(rexl._check(tokens, 'SYMBOL', '(')) {
		var _parent = rexl._parse_test(tokens);
		rexl._expect(tokens, 'SYMBOL', ')');
	}
	/*else if(rexl._check(tokens, 'SYMBOL', '$')) {
		var token = rexl._expect(tokens, 'NAME');
		var _parent = new rexl.Node('OPERATION', '$', token.value);
	}*/
	else {
		var _parent = rexl._parse_identifier(tokens);
	}
	while(symbol = rexl._check(tokens, 'SYMBOL', ['[', '(', rexl._separator])){
		switch(symbol.value) {
			case '[': {
				var index = rexl._parse_test();
				var s = rexl._expect(tokens, 'SYMBOL', ']');
				_parent = new rexl.Node('OPERATION', '[]', _parent.start, s.end, [_parent, index]);
				break;
			}
			case '(': {
				var args = rexl._parse_args(tokens);
				var s = rexl._expect(tokens, 'SYMBOL', ')');
				_parent = new rexl.Node('OPERATION', _parent, _parent.start, s.end, args);
				break;
			}
			case rexl._separator: {
				var identifier = rexl._parse_identifier(tokens);
				_parent = new rexl.Node('OPERATION', rexl._separator, _parent.start, identifier.end, [_parent, identifier]);
				break;
			}
		}
	}
	return _parent;
}

// identifier ::= NAME
rexl._parse_identifier = function(tokens) {
	var token = rexl._expect(tokens, 'NAME');
	return new rexl.Node('IDENTIFIER', token.value, token.start, token.end);
}

rexl._parse_args = function(tokens) {
	var args = [];
	while(!rexl._check(tokens, 'SYMBOL', ')', false)) {
		args.push(rexl._parse_comp(tokens));
		if(!rexl._check(tokens, 'SYMBOL', ',', false))
			break;
		rexl._check(tokens, 'SYMBOL', ',');
	}
	return args;
}

/*
 * Evaluator
 */


rexl.value = function(value, type, remainder) {
	var value = new rexl.Value(value, type);
    if(remainder instanceof Array) {
        for(var i = 0, l = remainder.length; i < l; i++)
            value = value.property(remainder[i]); 
    }
    return value;
}

rexl.Value = rexl.Class(function(value, type) {
	this.value = value;
	this.type = type;
})

rexl.Value.prototype.property = function(name) {
    return rexl.evaluator.f('.' + name)(this);
    /*switch(this.type) {
        default: rexl.evaluator.error(this.type + " instance doesn't have property '" + name + "'");
    }
    if(this.properties[name])
        return this.properties[name];
    else
        rexl._error('evaluator', this.type + " instance doesn't have property '" + name + "'");*/
}

rexl.Value.prototype.isValue = function() {
	return true;
}

rexl.Value.prototype.isIdentifier = function() {
	return false;
}

rexl.Value.prototype.isNull = function() {
	return this.value === null;
}

rexl.Value.prototype.is = function(cls) {
    return this.type.cls.is(cls);
}

rexl.Value.prototype.getTypeClass = function() {
    return this.type.cls;
}

rexl.Identifier = rexl.Class(function(data) {
	if(!(data instanceof Array))
		data = [data];
	this.data = data;
})

rexl.Identifier.prototype.isValue = function() {
	return false;
}

rexl.Identifier.prototype.isIdentifier = function() {
	return true;
}

rexl.Identifier.prototype.getData = function() {
	return this.data.slice(0, this.data.length);
}

rexl.Identifier.prototype.toString = function() {
    return this.data.join(rexl._separator);
}


rexl.type = function(cls, data) {
    return new rexl.TypeInstance(cls, data);
} 

rexl.TypeInstance = rexl.Class(function(cls, data) {
    if(!data)
        data = {};
    this.cls = cls;
    this.data = data;
});

rexl.TypeInstance.prototype.adapt = function(cls) {
    if(this.cls.is(rexl.Untyped))
        return rexl.type(cls, this.data);
    if(this.cls.is(cls))
        return this;
    rexl.validator.error("Can't adapt from " + this.cls + " to " + cls);
}

rexl.Type = rexl.Class(null);
rexl.Type.toString = function() {return 'Type';}
rexl.Type.is = function(cls) {
    return this == cls;
}
rexl.Type.value = function(value, remainder, typeData) {
    return new rexl.Value(value, rexl.type(this, typeData));
}

rexl.List = rexl.Class(null, rexl.Type);
rexl.List.toString = function() {return 'List';}
rexl.List.cast = function(value) {
  if (value.isNull()) {
    return this.value(null);
  }
  if (value.is(this)) {
    return value;
  }
  return this.value([value.value]);
};

rexl.Untyped = rexl.Class(null, rexl.Type);
rexl.Untyped.toString = function() {return 'Untyped';}

rexl.String = rexl.Class(null, rexl.Type);
rexl.String.cast = function(value) {
	if(value.isNull())
		return this.value(null);
	return this.value(value.value.toString());
}
rexl.String.toString = function() {return 'String'};

rexl.Number = rexl.Class(null, rexl.Type);
rexl.Number.cast = function(value) {
	if(value.is(this))
		return value;
	if(value.is(rexl.Untyped) || value.is(rexl.String)) {
		if(value.isNull())
			return this.value(null);
		var num = parseFloat(value.value);
		if(isNaN(num))
			rexl.evaluator.error("Can't cast to Number. Value: " + value.value);
		return this.value(value.value);
	}
	rexl.evaluator.error("Can't cast to Number value of type: " + this);
}
rexl.Number.toString = function() {return 'Number'};

rexl.Boolean = rexl.Class(null, rexl.Type);
rexl.Boolean.cast = function(value) {
	if(value.is(this))
		return value;
  if(value.is(rexl.Untyped) && value.value == null)
    return this.value(null);
  if (value.is(rexl.List)) {
    if (!value.isNull() && (value.value.length > 0)) {
      return this.value(true);
    }
    return this.value(false);
  }
	return this.value(value.value ? true:false);
}
rexl.Boolean.toString = function() {return 'Boolean'};

rexl.Binary = rexl.Class(null, rexl.Type);
rexl.Binary.toString = function() {return 'Binary';}

rexl.BitString = rexl.Class(null, rexl.Type);
rexl.BitString.toString = function() {return 'BitString';}

rexl.Date = rexl.Class(null, rexl.Type);
rexl.Date.toString = function() {return 'Date';}

rexl.Time = rexl.Class(null, rexl.Type);
rexl.Time.toString = function() {return 'Time';}

rexl.DateTime = rexl.Class(null, rexl.Type);
rexl.DateTime.toString = function() {return 'DateTime';}

rexl.TimeDelta = rexl.Class(null, rexl.Type);
rexl.TimeDelta.toString = function() {return 'TimeDelta';}


rexl.EvalBase = rexl.Class(function(cls, callback, obj) {
    this.cls = cls;
    this.callback = callback;
    this.obj = obj;
});

rexl.EvalBase.prototype.check = function(values) {
    if(!(values instanceof Array))
        values = [values];
	var ret = [];
	for(var i = 0, l = values.length; i < l; i++) {
		var value = values[i];
		if(value instanceof this.cls)
			ret.push(value);
		else {
			ret.push(this.callback.call(this.obj, value.data));
		}
	}
	return ret;
}

rexl.EvalBase.prototype.ident = function(id) {
	return new rexl.Identifier(id);
}

rexl.EvalBase.prototype.argList = function(args) {
	var ret = [];
	for(var i = 1, l = args.length; i < l; i++)
		ret.push(args[i]);
	return ret;
}

rexl.EvalBase.prototype.findCommon = function(args, types, common) {
    var dict = {}, list = [];
    for(i = 0, l = args.length; i < l; i++) 
        if(!args[i].cls.is(rexl.Untyped))
            dict[args[i].cls.toString()] = args[i].cls;
    for(var key in dict)
        list.push(dict[key]);
    if(list.length == 0 && args.length)
        return rexl.String;
    else if (list.length == 1) {
        for(var i = 0, l = types.length; i < l; i++)
            if(types[i].is(list[0]))
                return types[i];
    } 
    
    return null;
}

rexl.EvalBase.prototype.eval = function() {
	var e = this;
	var js = this.node.toJS(); 	
	var value = eval(js);
    value = this.check(value);
	/*if(value.isIdentifier())
		value = this.callback.call(this.obj, value.data);*/
	return value[0];
}

rexl.Evaluator = rexl.Class(function(node, callback, obj) {
    rexl.EvalBase.call(this, rexl.Value, callback, obj);
	this.node = node;
}, rexl.EvalBase);

rexl.Evaluator.prototype._f = {
    '+': function() {
        var e = arguments[0];
        var data = e.check(e.argList(arguments));
        var argTypes = data.map(function (item) { return item.type; });
        var common = e.findCommon(argTypes, [rexl.String, rexl.Number])
        var values = data.map(function (i) { return common.cast(i); }),
            ret = null;
        if(common.is(rexl.Number)) {
            ret = 0;
            for(var i = 0, l = values.length; i < l; i++) {
                if(values[i].isNull())
                    return common.value(null);
                ret -= values[i].value;
            }
            ret *= -1;
        }
        else {
            ret = '';
            for(var i = 0, l = values.length; i < l; i++) {
                if(values[i].isNull())
                    return common.value(null);
                ret += values[i].value;
            }
        }
        return common.value(ret)
    },
    '-': function() {
        var e = arguments[0];
        var data = e.check(e.argList(arguments));
        var argTypes = data.map(function (item) { return item.type; });
        var common = e.findCommon(argTypes, [rexl.Number]);
        var values = data.map(function (i) { return common.cast(i); }),
            ret = null;
        if (common.is(rexl.Number)) {
            ret = 0;
            for (var i = 0, l = values.length; i < l; i++) {
                if(values[i].isNull())
                    return common.value(null);
                ret -= values[i].value;
                if (i == 0)
                    ret *= -1;
            }
        }
        return common.value(ret);
    },
    '*': function() {
        var e = arguments[0];
        var data = e.check(e.argList(arguments));
        var argTypes = data.map(function (item) { return item.type; });
        var common = e.findCommon(argTypes, [rexl.Number]);
        var values = data.map(function (i) { return common.cast(i); }),
            ret = null;
        if (common.is(rexl.Number)) {
            ret = 1;
            for (var i = 0, l = values.length; i < l; i++) {
                if(values[i].isNull())
                    return common.value(null);
                ret *= values[i].value;
            }
        }
        return common.value(ret);
    },
    '/': function() {
        var e = arguments[0];
        var data = e.check(e.argList(arguments));
        var argTypes = data.map(function (item) { return item.type; });
        var common = e.findCommon(argTypes, [rexl.Number]);
        var values = data.map(function (i) { return common.cast(i); }),
            ret = null;
        if (common.is(rexl.Number)) {
            if (values[0].isNull()) {
                return common.value(null);
            }
            ret = values[0].value;
            for (var i = 1, l = values.length; i < l; i++) {
                if(values[i].isNull())
                    return common.value(null);
                ret /= values[i].value;
            }
        }
        return common.value(ret);
    },
    '|': function() {
      var e = arguments[0];
      var data = e.check(e.argList(arguments));
      var argTypes = data.map(function (item) { return item.type; });
      var common = e.findCommon(argTypes, [rexl.Boolean, rexl.List]);

      if (!common || common.is(rexl.Boolean)) {
        var ret = false;

        for(var i = 0, l = data.length; i < l; i++) {
          var v = rexl.Boolean.cast(data[i]);

          if (v.value === true) {
            ret = true;
            break;
          } else if (v.isNull()) {
            ret = null;
          }
        }

        return rexl.Boolean.value(ret);

      } else if (common.is(rexl.List)) {
        var length = 0;
        for (var i = 0; i < data.length; i++) {
          if (data[i].value.length > length) {
            length = data[i].value.length;
          }
        }

        var ret = Array(length);
        for (i = 0; i < length; i++) {
          ret[i] = rexl.Boolean.value(false);

          for (var d = 0; d < data.length; d++) {
            var v = rexl.Boolean.cast(data[d].value[i]);
            if (v.value === true) {
              ret[i] = rexl.Boolean.value(true);
              break;
            }
          }
        }

        return rexl.List.value(ret);
      }
    },
    'count_true': function () {
        var e = arguments[0];
        var args = e.check(e.argList(arguments));
        var c = 0;
        for (var i = 0, l = args.length; i < l; i++) {
            var v = rexl.Boolean.cast(args[i]);
            if (v.value == true)
                ++c;
        }
        return rexl.Number.value(c);
    },
    'if': function () {
        var e = arguments[0];
        var args = e.check(e.argList(arguments));
        if (rexl.Boolean.cast(args[0]).value)
            return args[1];
        if (args.length == 3)
            return args[2];
        return rexl.Untyped.value(null);
    },
    '&': function() {
      var e = arguments[0];
      var data = e.check(e.argList(arguments));
      var argTypes = data.map(function (item) { return item.type; });
      var common = e.findCommon(argTypes, [rexl.Boolean, rexl.List]);

      if (!common || common.is(rexl.Boolean)) {
        var ret = true;

        for(var i = 0, l = data.length; i < l; i++) {
          var v = rexl.Boolean.cast(data[i]);

          if (v.value === false) {
            ret = false;
            break;
          } else if (v.isNull()) {
            ret = null;
          }
        }

        return rexl.Boolean.value(ret);

      } else if (common.is(rexl.List)) {
        var length = 0;
        for (var i = 0; i < data.length; i++) {
          if (data[i].value.length > length) {
            length = data[i].value.length;
          }
        }

        var ret = Array(length);
        for (i = 0; i < length; i++) {
          ret[i] = rexl.Boolean.value(true);

          for (var d = 0; d < data.length; d++) {
            var v = rexl.Boolean.cast(data[d].value[i]);
            if (v.value === false) {
              ret[i] = rexl.Boolean.value(false);
              break;
            }
          }
        }

        return rexl.List.value(ret);
      }
    },
	'!()': function() {
		var e = arguments[0];
		var args = e.check(e.argList(arguments));
		var arg = args[0];
		if(arg.value == true)
			return rexl.Boolean.value(false);
		else if(arg.value == false)
			return rexl.Boolean.value(true);
		else
			return rexl.Boolean.value(null);
	},

	'true':function() {
		return rexl.Boolean.value(true);
	},
	'false':function() {
		return rexl.Boolean.value(false);
	},
	'null':function() {
		return rexl.Untyped.value(null);
	},

	'=':function() {
		return arguments[0].comp('=', arguments);
	},
	'!=':function() {
		return arguments[0].comp('!=', arguments);
	},
	'>':function() {
		return arguments[0].comp('>', arguments);
	},
	'<':function() {
		return arguments[0].comp('<', arguments);
	},
	'>=':function() {
		return arguments[0].comp('>=', arguments);
	},
	'<=':function() {
		return arguments[0].comp('<=', arguments);
	},
	'==':function() {
		return arguments[0].comp('==', arguments);
	},
	'!==':function() {
		return arguments[0].comp('!==', arguments);
	},

	'=~':function() {
		return arguments[0].re('=~', arguments);
	},
	'!=~':function() {
		return arguments[0].re('!=~', arguments);
	},
	'=~~':function() {
		return arguments[0].re('=~~', arguments);
	},
	'!=~~':function() {
		return arguments[0].re('!=~~', arguments);
	},

    // String functions
    'length':function() {
        // TODO: check args count and type
        // or probably leave this to validator?
        var e = arguments[0];
        var s = e.check(e.argList(arguments))[0];
        var value = s.isNull() ? 0 : s.value.length;
        return rexl.Number.value(value);
    },

    'trim': function() {
        var e = arguments[0];
        var s = e.check(e.argList(arguments))[0];
        if(s.value != null)
            var value = s.value.replace(/^\s*(.+?)\s*$/, "$1");
        else
            var value = null; // not sure if this is OK ?
        return rexl.String.value(value);
    },

    'today': function() {
        var today = new Date();
        var month = (today.getMonth() + 1);
        month = month < 10 ? '0' + month : month;
        var day = today.getDate();
        day = day < 10 ? '0' + day : day;
        return rexl.String.value(
                (today.getYear() + 1900) + '-'
                + month + '-'
                + day);
    },

    'date_diff': function() {
        var e = arguments[0];
        var d1 = e.check(e.argList(arguments))[0];
        var d2 = e.check(e.argList(arguments))[1];
        var num = (Date.parse(d1.value) - Date.parse(d2.value))/86400000;
        return rexl.Number.value(num);
    },

    // List functions
    'exists': function () {
        var e = arguments[0];
        var list = rexl.List.cast(e.check(e.argList(arguments))[0]);
        var len = list.isNull() ? 0 : list.value.length;
        var ret = false;
        for (var i = 0; i < len; i++) {
            var v = rexl.Boolean.cast(list.value[i]);
            if (v.value === true) {
              ret = true;
              break;
            }
        }
        return rexl.Boolean.value(ret);
    },
    'every': function () {
      var e = arguments[0];
      var list = rexl.List.cast(e.check(e.argList(arguments))[0]);
      var len = list.isNull() ? 0 : list.value.length;
      var ret = true;
      for (var i = 0; i < len; i++) {
        var v = rexl.Boolean.cast(list.value[i]);
        if (v.value === false) {
          ret = false;
          break;
        }
      }
      return rexl.Boolean.value(ret);
    },
    'count': function () {
      var e = arguments[0];
      var list = rexl.List.cast(e.check(e.argList(arguments))[0]);
      var len = list.isNull() ? 0 : list.value.length;
      var count = 0;
      for (var i = 0; i < len; i++) {
        var v = rexl.Boolean.cast(list.value[i]);
        if (v.value === true) {
          count += 1;
        }
      }
      return rexl.Number.value(count);
    },
    'min': function () {
      var e = arguments[0];
      var list = rexl.List.cast(e.check(e.argList(arguments))[0]);
      var min = null;

      if (!list.isNull()) {
        var listTypes = list.value.map(function (item) { return item.type; });
        var common = e.findCommon(listTypes, [rexl.Number])
        for (var i = 0; i < list.value.length; i++) {
          if ((min === null) || (list.value[i].value < min)) {
            min = list.value[i].value;
          }
        }
      }

      return rexl.Number.value(min);
    },
    'max': function () {
      var e = arguments[0];
      var list = rexl.List.cast(e.check(e.argList(arguments))[0]);
      var max = null;

      if (!list.isNull()) {
        var listTypes = list.value.map(function (item) { return item.type; });
        var common = e.findCommon(listTypes, [rexl.Number])
        for (var i = 0; i < list.value.length; i++) {
          if ((max === null) || (list.value[i].value > max)) {
            max = list.value[i].value;
          }
        }
      }

      return rexl.Number.value(max);
    },
    'sum': function () {
      var e = arguments[0];
      var list = rexl.List.cast(e.check(e.argList(arguments))[0]);
      var sum = 0;

      if (!list.isNull()) {
        var listTypes = list.value.map(function (item) { return item.type; });
        var common = e.findCommon(listTypes, [rexl.Number])
        for (var i = 0; i < list.value.length; i++) {
          if (!list.value[i].isNull()) {
            sum += list.value[i].value;
          }
        }
      }

      return rexl.Number.value(sum);
    },
    'avg': function () {
      var e = arguments[0];
      var list = rexl.List.cast(e.check(e.argList(arguments))[0]);
      var sum = 0, num = 0;

      if (!list.isNull()) {
        var listTypes = list.value.map(function (item) { return item.type; });
        var common = e.findCommon(listTypes, [rexl.Number])
        for (var i = 0; i < list.value.length; i++) {
          if (!list.value[i].isNull()) {
            sum += list.value[i].value;
            num += 1;
          }
        }
      }

      return rexl.Number.value(num > 0 ? sum/num : null);
    },

    // Math functions
    'pi':function() {
        return rexl.Number.value(Math.PI);
    }
}


rexl.EvalBase.prototype.f = function(arg) {
    if(arg == rexl._separator)
        return this.specifier;
	if(this._f[arg] !== undefined)
		return this._f[arg];
	rexl.evaluator.error(arg + ' operation/function/method/property is not implemented.');
}

rexl.EvalBase.prototype.specifier = function(e, left, right) {
    if(left.isIdentifier() && right.isIdentifier()) {
        left = left.getData();
        right = right.getData();
        for(var i = 0, l = right.length; i < l; i++)
            left.push(right[i]);
        return new rexl.Identifier(left);
    }
    else if(left.isValue() && right.isIdentifier()) {
        return e.p(left, right.getData());
    }
    else
        (this instanceof rexl.Evaluator ? rexl.evaluator:rexl.validator)
            .error("The right-most operand of '" + rexl._separator
                    + "' operation should be identifier");
}

rexl.EvalBase.prototype.pos = function(start, end) {
    this.start = start;
    this.end = end;
    return this;
}

rexl.Evaluator.prototype.error = function(message) {
    rexl._error('evaluator', message, this.start, this.end);
}

rexl.Evaluator.prototype.evaluate = function() {
    var r = this.eval();
    if (r.is(rexl.List) && !r.isNull()) {
      var ret = Array(r.value.length);
      for (var i = 0; i < r.value.length; i++) {
        ret[i] = r.value[i].value;
      }
      return ret;
    }
    return r.value;
}


rexl.Evaluator.prototype.str = function(s) {
	return rexl.Untyped.value(s);
}

rexl.Evaluator.prototype.num = function(n) {
	return rexl.Number.value(n);
}

rexl.Evaluator.prototype.p = function(obj, name) {
    var value = this.check([obj])[0];
    args = this.check(args);
    return value.property(name);
}

rexl.Evaluator.prototype.comp2 = function(op, jsOp, left, right) {
	if(op != '!==' && op != '==' && (left.isNull() || right.isNull()))
		return rexl.Boolean.value(null);

	if(left.is(rexl.Untyped) && right.is(rexl.Untyped)) {
		left = rexl.String.cast(left);
		right = rexl.String.cast(right);

	} else if(left.is(rexl.Untyped)) {
		left = right.getTypeClass().cast(left);

	} else if (left.is(rexl.List) && !right.is(rexl.List)) {
    if (left.isNull()) {
      return rexl.List.value(null);
    }
    var ret = Array(left.value.length);
    for (var i = 0; i < left.value.length; i++) {
      ret[i] = this.comp2(op, jsOp, left.value[i], right);
    }
    return rexl.List.value(ret);

  } else if(right.is(rexl.Untyped)) {
		right = left.getTypeClass().cast(right);
	}

	if (right.getTypeClass() != left.getTypeClass()) {
		rexl.evaluator.error('Operation: ' + op + '. Type mismatch: ' + left.getTypeClass() + ' and ' + right.getTypeClass());

  } else if (left.is(rexl.List)) {
    if (left.isNull() || right.isNull()) {
      return rexl.List.value(null);
    }
    var length = left.value.length > right.value.length ? left.value.length : right.value.length;
    var ret = Array(length);
    for (var i = 0; i < length; i++) {
      ret[i] = this.comp2(
        op,
        jsOp,
        left.value[i] || rexl.Untyped.value(null),
        right.value[i] || rexl.Untyped.value(null)
      );
    }
    return rexl.List.value(ret);

  } else {
    var value = eval("left.value" + jsOp + "right.value");
	  return rexl.Boolean.value(value);
  }
}

rexl.Evaluator.prototype.comp = function(op, args) {
	var jsOp = op;
	var func = '&';
	if(op == '=' || op == '==') {
		jsOp = '=' + op;
		func = '|';
	}
	func = this.f(func);
	
	args = this.check(this.argList(args));
	var ret = [];
	var left = args.shift();
	for(var i = 0, l = args.length; i < l; i++) {
		ret.push(this.comp2(op, jsOp, left, args[i]));
	}
	
	if(ret.length == 1)
		return ret[0];

	ret.splice(0, 0, this);
	return func.apply(null, ret);
}

rexl.Evaluator.prototype.re = function(op, args) {
  var e = args[0];
	args = this.check(this.argList(args));
	var left = args.shift();
	var right = args.shift();

	if(left.is(rexl.Untyped))
		left = rexl.String.cast(left);
	if(right.is(rexl.Untyped))
		right = rexl.String.cast(right);

	if(!(left.is(rexl.String) || left.is(rexl.List)) || !right.is(rexl.String))
		rexl.evaluator.error('Operation: ' + op + '. Type mismatch: ' + left.getTypeClass() + ' and ' + right.getTypeClass());

  if (left.is(rexl.List)) {
    var ret = Array(left.value.length);
    for (var i = 0; i < left.value.length; i++) {
      ret[i] = this.re(op, [e, left.value[i], right]);
    }
    return rexl.List.value(ret);
  }
	
	var not = (op[0] == '!');
	var flag = (op.substr(-2) == '~~' ? "":"i");
	var value = (new RegExp(right.value, flag)).test(left.value);
	if(not)
		value = !value;
    return rexl.Boolean.value(value);
}

rexl.Validator = rexl.Class(function(node, callback, obj) {
    rexl.EvalBase.call(this, rexl.TypeInstance, callback, obj);
	this.node = node;
}, rexl.EvalBase);

rexl.Validator.prototype.error = function(message) {
    rexl._error('evaluator', message, this.start, this.end);
}

rexl.Validator.prototype.str = function(s) {
	return rexl.type(rexl.Untyped);
}

rexl.Validator.prototype.num = function(n) {
	return rexl.type(rexl.Number);
}

rexl.Validator.prototype.evaluate = function() {
    return this.eval();
}

rexl.Validator.prototype.trueFalseBase = function(name, args) {
    var data = this.check(this.argList(args));
    if(data.length != 0)
        rexl._error('validator', name + ' doesn\'t expect any argument');
    return rexl.type(rexl.Boolean);
};

rexl.Validator.prototype.isTrueFalseBase = function(name, args) {
    var data = this.check(this.argList(args));
    if(data.length != 1)
        rexl._error('validator', name + ' expects exactly 1 argument');
    if(!data[0].cls.is(rexl.Boolean))
        rexl._error('validator', name + ' expects Boolean but got ' + data[0].cls);
    return rexl.type(rexl.Boolean);
};

rexl.Validator.prototype.andOrBase = function(name, args) {
    var data = this.check(this.argList(args));
    if(data.length < 2)
        rexl._error('validator', name + ' expects at least 2 arguments');
    return rexl.type(rexl.Boolean);
}

rexl.Validator.prototype.compBase = function(name, args) {
    var data = this.check(this.argList(args));
    if(data.length != 2)
        rexl._error('validator', name + ' expects exactly 2 arguments');
    var common = this.findCommon(data, [rexl.String, rexl.Number, rexl.Boolean, rexl.Binary,
            rexl.BitString, rexl.Date, rexl.Time, rexl.DateTime,
            rexl.TimeDelta, rexl.List]);
    if(common == null)
        rexl._error("Can't find common type for " + data[0].cls.toString() 
                    + " and " + data[1].cls.toString());
    data.map(function(item) {item.adapt(common)});
    return rexl.type(rexl.Boolean);
}

rexl.Validator.prototype._f = {
    'null': function() {
        var data = arguments[0].argList(arguments);
        if(data.length)
            rexl._error('validator', 'null() doesn\'t expect any argument'); 
        return rexl.type(rexl.Untyped); 
    },
    'is_null': function() {
        var v = arguments[0];
        var data = v.check(v.argList(arguments));
        if(data.length != 1)
            rexl._error('validator', 'is_null() expects exactly one argument'); 
        return rexl.type(rexl.Boolean); 
    },
    'count_true': function () {
        var v = arguments[0];
        var data = v.check(v.argList(arguments));
        if (!data.length)
            rexl._error('validator', 'count_true() expects at least one argument');
        return rex.type(rexl.Number);
    },
    'if': function() {
        var v = arguments[0];
        var data = v.check(v.argList(arguments));
        if(!data.length || data.length < 2 || data.length > 3)
            rexl._error('validator', 'if() expects 2 or 3 arguments');
        return rexl.type(rexl.Untyped);
    },
    'coalesce': function() {
        var v = arguments[0];
        var data = v.check(v.argList(arguments));
        if(!data.length)
            rexl._error('validator', 'coalesce() expects at least one argument'); 
        var common = v.findCommon(data, [rexl.String, rexl.Number, rexl.Boolean, rexl.Binary,
            rexl.BitString, rexl.Date, rexl.Time, rexl.DateTime,
            rexl.TimeDelta]);
        if(common == null)
            rexl._error("Can't find common type for coalesce arguments");
        data.map(function(item) {item.adapt(common)});
        return rexl.type(common); 
    },

    'true':function() {
        return arguments[0].trueFalseBase('true()', arguments);
    },
    'false':function() {
        return arguments[0].trueFalseBase('false()', arguments);
    },
    'is_true':function() {
        return arguments[0].isTrueFalseBase('is_true()', arguments);
    },
    'is_false':function() {
        return arguments[0].isTrueFalseBase('is_false()', arguments);
    },
    'boolean':function() {
        var v = arguments[0];
        var data = v.check(v.argList(arguments));
        if(data.length != 1)
            rexl._error('validator', 'boolean() expects exactly one argument'); 
        return rexl.type(rexl.Boolean);
    },

    '|':function() {
        return arguments[0].andOrBase('|', arguments);
    },
    '&':function() {
        return arguments[0].andOrBase('&', arguments);
    },
    '!()':function() {
        var v = arguments[0];
        var data = v.check(v.argList(arguments));
        if(data.length != 1)
            rexl._error('validator', '!() expects exactly 1 argument');
        return rexl.type(rexl.Boolean);
    },
    
    '=': function() {
        return arguments[0].compBase('=', arguments);
    },
    '!=': function() {
        return arguments[0].compBase('!=', arguments);
    },
    '==': function() {
        return arguments[0].compBase('==', arguments);
    },
    '!==': function() {
        return arguments[0].compBase('!==', arguments);
    },

    '>': function() {
        return arguments[0].compBase('>', arguments);
    },
    '>=': function() {
        return arguments[0].compBase('>=', arguments);
    },
    '<': function() {
        return arguments[0].compBase('<', arguments);
    },
    '<=': function() {
        return arguments[0].compBase('<=', arguments);
    }

};
