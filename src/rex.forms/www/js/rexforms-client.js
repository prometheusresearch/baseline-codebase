(function($) {

// {{{ helper functions
function getRandomStr(len) {
    var text = "";
    var possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < len; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function extend(Child, Parent) {
    var F = function() { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
}

function isValidNumeric(val, condType) {
    return (
        (condType === 'integer'
            && /^[0-9]+$/.test(val)) ||
        (condType === 'float'
            && /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/.test(val))
    );
}

function isInt(n) {
   return typeof n === 'number' && parseFloat(n) == parseInt(n, 10) && !isNaN(n);
}

function objSize (obj) {
    var size = 0, key;
    for (key in obj)
        if (obj.hasOwnProperty(key))
            size++;
    return size;
};

function isValidDate(year, month, day) {
    --month;
    var d = new Date(year, month, day);
    return (d.getDate() == day &&
            d.getMonth() == month &&
            d.getFullYear() == year);
}

function objSize(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key))
            ++size;
    }
    return size;
}

function findParentWithClass(obj, cls) {
    var form = null;
    while (obj) {
        if (obj instanceof cls) {
            form = obj;
            break;
        }
        obj = obj.parent;
    }
    return form;
}

function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function calculateRexlExpr(expr, context, params) {
    var ret = expr.evaluate(function(name) {
        if (undefined !== params[name[0]])
            return params[name[0]];

        var question = context[name[0]];
        if(!question) {
            alert("No such question: " + name[0]);
        }
        var rexlValue = question.getRexlValue(name.slice(1, name.length));
        return rexlValue;
    });
    return ret;
};

function getChangeGraph(questions, params, context, initExpr) {
    var expr = initExpr || {};

    $.each(questions, function(_, question) {
        if(question.disableExpr) {
            var e = expr[question.disableExpr] = expr[question.disableExpr] || [];
            e.push({
                obj: question,
                ifTrue: 'disable',
                ifFalse: 'enable'
            });
        }

        if(question.validateExpr) {
            // validate expression should not affect question until it is answered
            question.validateExpr = question.name
                                    + '==null()|(' + question.validateExpr + ')';
            var e = expr[question.validateExpr] = expr[question.validateExpr]
                                                  || [];
            e.push({
                obj: question,
                ifTrue: 'setValidByExpr',
                ifFalse: 'setInvalidByExpr'
            });
        }
    });

    // building the change graph
    var change = {};
    $.each(expr, function(expr, actions) {
        var parsed = rexl.parse(expr);
        $.each(parsed.getNames(), function(_, name) {
            name = name[0];
            // form external parameters will not change their value
            // so we can exclude them from the change graph
            if (undefined === params[name]) {
                change[name] = change[name] || [];
                change[name].push({
                    expr: parsed,
                    actions: actions,
                    context: context
                });
            }
        });
    });

    return change;
};

function initGraphState(questions, params, changeGraph) {
    // bind the change event on each question
    // and calculate the initial graph state
    $.each(changeGraph, function(key, list) {
        function changeQuestion() {
            $.each(list, function(_, value) {
                var result = calculateRexlExpr(value.expr, value.context, params);
                methodKey = result ? 'ifTrue':'ifFalse';
                // apply needed method to needed entity
                $.each(value.actions, function(_, action) {
                    var method = action[methodKey];
                    action.obj[method]();
                });
            });
        }
        changeQuestion();
        $(questions[key]).bind('change', changeQuestion);
    });
};

function rexlize(val) {
    if (null === val)
        return rexl.String.value(null);

    type = toType(val);

    if ('number' === type)
        return rexl.Number.value(val);
    else if ('string' === type)
        return rexl.String.value(val);
    else if ('boolean' === type)
        return rexl.Boolean.value(val);

    throw('RexlTypeError');
}

function collectAnswers (questions) {
    var answers = {};
    $.each(questions, function (_, question) {
        var value = question.getValue();
        if (value instanceof Object && !(value instanceof Array)) {
            $.each(value, function (key, value) {
                answers[question.name + '_' + key] = value;
            });
        } else
            answers[question.name] = value;
    });
    return answers;
}

var creoleParser = new Parse.Simple.Creole({
    linkFormat: ''
});

function renderCreole(srcText) {
    var tempDiv = $(document.createElement('div'));
    creoleParser.parse(tempDiv[0], srcText);
    var children = tempDiv.children();

    if (children.size() == 1 &&
        children[0].tagName === 'P') {
        // exclude paragraph wrapper if it's only one
        return children.contents();
    }

    return children;
}
// }}}

// {{{ domains
var Domain = function(name) {
    this.name = name;
};
Domain.prototype.renderEdit = function(templates, value, onChange, customTitles) {
    alert('Implement in subclasses');
};
Domain.prototype.renderView = function(templates, value, onChange, customTitles) {
    var node = $('<div>');
    this.setViewValue(node, value);
    return node;
};
Domain.prototype.setEditValue = function (node, value, options) {
    alert('Implement in subclasses');
};
Domain.prototype.setViewValue = function (node, value) {
    alert('Implement in subclasses');
};
Domain.prototype.extractValue = function (node) {
    alert('Implement in subclasses');
};
Domain.prototype.conforming = function() {
    return true; // default
};
Domain.prototype.isValidValue = function(value) {
    alert('Implement in subclasses');
    return false;
};

var TextDomain = function(multiLine) {
    Domain.call(this, 'text');
    this.multiLine = multiLine;
};
extend(TextDomain, Domain);
TextDomain.prototype.renderEdit = function (templates, value, onChange, customTitles) {
    var input;

    if (this.multiLine) {
        input = $('<textarea></textarea>');
        if (onChange) {
            input.focusin(function () {
                this.initialValue = $(this).val();
            });
            input.focusout(function () {
                var value = $(this).val();
                if (value !== this.initialValue)
                    onChange();
            });
        }
    } else {
        input = $('<input type="text">')
        if (onChange)
            input.change(onChange);
    }

    this.setEditValue(input, value, null);
    return input;
};
TextDomain.prototype.setEditValue = function (node, value, options) {
    node.val( (value !== null && value !== undefined) ? value : '' );
};
TextDomain.prototype.setViewValue = function (node, value) {
    node.text( (value !== null && value !== undefined) ? value : '' );
};
TextDomain.prototype.extractValue = function (node) {
    return $.trim( node.val() ) || null;
};
TextDomain.prototype.isValidValue = function(value) {
    return (value === null || (typeof value === 'string'));
};

var DateDomain = function() {
    Domain.call(this, 'date');
};
extend(DateDomain, Domain);
DateDomain.prototype.renderEdit = function (templates, value, onChange, customTitles) {
    var input = $('<input type="text">');
    this.setEditValue(input, value, null);

    if (onChange)
        input.change(onChange);

    input.datepicker({
        dateFormat: 'yy-mm-dd',
        changeYear: true,
        yearRange: "c-90:c+10",
    });

    return input;
};
DateDomain.prototype.setEditValue = function (node, value, options) {
    node.val( (value !== null && value !== undefined) ? value : '' );
};
DateDomain.prototype.setViewValue = function (node, value) {
    node.text( (value !== null && value !== undefined) ? value : '' );
};
DateDomain.prototype.extractValue = function (node) {
    var value = $.trim( node.val() ) || null;
    if (!this.isValidValue(value))
        throw("InvalidDate");
    return value;
};
DateDomain.prototype.isValidValue = function(value) {
    if (value === null)
        return true;
    if (typeof value !== "string")
        return false;
    var matches = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!matches)
        return false;
    if (!isValidDate(matches[1], matches[2], matches[3]))
        return false;
    return true;
};

var NumberDomain = function(isFloat) {
    Domain.call(this, 'number');
    this.isFloat = isFloat;
};
extend(NumberDomain, Domain);
NumberDomain.prototype.renderEdit = function (templates, value, onChange, customTitles) {
    var input = $('<input type="text">');
    this.setEditValue(input, value, null);

    if (onChange)
        input.change(onChange);

    return input;
};
NumberDomain.prototype.setEditValue = function (node, value, options) {
    node.val( (value !== null && value !== undefined) ? value : '' );
};
NumberDomain.prototype.setViewValue = function (node, value) {
    node.text( (value !== null && value !== undefined) ? value : '' );
};
NumberDomain.prototype.extractValue = function (node) {
    var value = $.trim( node.val() ) || null;

    if (value !== null) {
        if (this.isFloat && isValidNumeric(value, 'float'))
            value = parseFloat(value);
        else if (!this.isFloat && isValidNumeric(value, 'integer'))
            value = parseInt(value);
        else
            throw("InvalidNumeric");
    }

    return value;
};
NumberDomain.prototype.isValidValue = function (value) {
    if (value === null)
        return true;
    if (typeof value !== 'number' ||
        !this.isFloat && !isInt(value))
        return false;
    return true;
};

var EnumCodeRegExp = new RegExp("^[a-z0-9\\-]+$", "");
var EnumDomain = function (options) {
    Domain.call(this, 'enum');
    this.variants = options.variants;
    $.each(this.variants, function (_, variant) {
        if (!EnumCodeRegExp.test(variant.code)) {
            alert('Invalid enum-answer identifier: "' + variant.code + '"');
            throw("InvalidIdentifier");
        }
    });
    this.dropDown = options.dropDown;
    this.allowClear = options.allowClear;
};
extend(EnumDomain, Domain);
var alreadyUsedNames = {};
EnumDomain.prototype.renderEdit = function (templates, value, onChange, customTitles) {
    var ret;
    var thisDomain = this;

    if (this.dropDown) {
        ret = $('<select>').addClass('rf-answer-select');
        var option = $('<option>');
        ret.append(option);

        $.each(this.variants, function (_, variant) {
            var option = $('<option>');
            option.text(variant.title);
            option.attr('value', variant.code);
            ret.append(option);
        });

        ret.change(onChange);
    } else {
        ret = $('<ul>').addClass('rf-answer-list');
        var randName = getRandomStr(10);
        while(alreadyUsedNames[randName])
            randName = getRandomStr(10);
        alreadyUsedNames[randName] = true;

        $.each(this.variants, function (_, variant) {
            var li = $('<li>');
            var label = $('<label>');
            var span = $('<span>');

            label.append(span);

            if (variant.title)
                span.append( renderCreole(variant.title) );
            else 
                span.text(variant.code);

            li.append(label);

            var input =
                $('<input type="radio">')
                    .attr('name', randName)
                    .attr('value', variant.code)
                    .change(onChange);

            label.prepend(input);
            ret.append(li);
        });

        if (this.allowClear) {
            var btnClear = templates['btnClear'].clone();
            btnClear.click(function () {
                if ($(this).parents('.rf-disabled').size() == 0) {
                    $(this).parents('.rf-answer-list:first')
                                .find('input[type="radio"]')
                                .removeAttr('checked');
                    onChange();
                }
            });
            ret = ret.append( $('<li>').append(btnClear) );
        }
    }

    this.setEditValue(ret, value, null);
    return ret;
};
EnumDomain.prototype.setViewValue = function (node, value) {
    var title = null;
    for (var idx in this.variants) {
        var variant = this.variants[idx];
        if (variant.code === value) {
            title = variant.title || variant.code;
            break;
        }
    }
    node.text( (title !== null) ? title : '' );
};
EnumDomain.prototype.setEditValue = function (node, value, options) {
    if (!this.dropDown) {
        node.find('input[type="radio"]').each(function (idx, element) {
            var input = $(element);
            if (input.val() === value)
                input.attr('checked', 'checked');
            else
                input.removeAttr('checked');
        });
    } else
        node.val(value);
};
EnumDomain.prototype.extractValue = function (node) {
    if (!this.dropDown) {
        var input = node.find('input[type="radio"]:checked');
        if (input.size()) {
            return input.val();
        }
    } else {
        var value = node.val();
        if (value)
            return value;
    }
    return null;
};
EnumDomain.prototype.isValidValue = function (value) {
    if (value === null)
        return true;
    if (typeof value === "string") {
        var found = false;
        for (var idx in this.variants) {
            var variant = this.variants[idx];
            if (variant.code === value) {
                found = true;
                break;
            }
        }
        return found;
    }
    return false;
};

var SetCodeRegExp = new RegExp("^[a-z0-9_]+$", "");
var SetDomain = function (variants) {
    Domain.call(this, 'set');
    this.variants = variants;
    $.each(this.variants, function (_, variant) {
        if (!SetCodeRegExp.test(variant.code)) {
            alert('Invalid set-answer identifier: ' + variant.code);
            throw("InvalidIdentifier");
        }
    });
};
extend(SetDomain, Domain);
SetDomain.prototype.renderEdit = function (templates, value, onChange, customTitles) {
    var ret = $('<ul>').addClass('rf-answer-list');
    var thisDomain = this;

    $.each(this.variants, function (_, variant) {
        var li = $('<li>');
        var label = $('<label>').text(variant.title);
        li.append(label);

        label.prepend(
            $('<input type="checkbox">')
                .attr('value', variant.code)
                .change(onChange)
        );

        ret.append(li);
    });

    this.setEditValue(ret, value, null);
    return ret;
};
SetDomain.prototype.setEditValue = function (node, value, options) {
    node.find('input[type="checkbox"]').each(function (idx, element) {
        var input = $(element);
        if (value && value[input.val()])
            input.attr('checked', 'checked');
        else
            input.removeAttr('checked');
    });
};
SetDomain.prototype.setViewValue = function (node, value) {
    var answers = [];
    for (var idx in this.variants) {
        var variant = this.variants[idx];
        if (value[variant.code]) {
            var answer = variant.title || variant.code;
            answers.push(answer);
        }
    }
    node.text(answers.join(', '));
};
SetDomain.prototype.extractValue = function (node) {
    var inputs = node.find('input[type="checkbox"]');
    var values = {};
    var total = 0;
    inputs.each(function (_, input) {
        values[$(input).val()] = $(input).is(':checked');
        ++total;
    });
    return total ? values : null;
};
SetDomain.prototype.getEmptyValue = function () {
    var values = {};
    for (var idx in this.variants) {
        var variant = this.variants[idx];
        values[variant.code] = false;
    }
    return values;
};
SetDomain.prototype.isValidValue = function (value) {
    if (value === null || value instanceof Object) {
        var ok = true;
        var self = this;
        var names = {};
        $.each(this.variants, function (idx, variant) {
            names[variant.code] = true;
        });
        $.each(value, function (name, checked) {
            if (checked !== true && checked !== false || !names[name])
                ok = false;
        });
        return ok;
    }
    return false;
};


var DualNumberDomain = function(firstName, secondName, size) {
    this.firstName = firstName;
    this.secondName = secondName;
    this.size = size;
};
extend(DualNumberDomain, Domain);
DualNumberDomain.prototype.renderEdit = function (templates, value, onChange, customTitles) {
    var ret = $('<div></div>');
    var span = $('<span></span>');
    span.html(this.firstName);
    ret.append(span);
    var input = $('<input type="text">');
    input.attr("size", 10);
    input.attr("name", "first");

    if (onChange)
        input.change(onChange);

    ret.append(input);
    span = $('<span></span>');
    span.html(this.secondName);
    ret.append(span);
    input = $('<input type="text">');
    input.attr("size", 10);
    input.attr("name", "second");
    ret.append(input);

    if (value)
        this.setEditValue(ret, value, null);

    if (onChange)
        input.change(onChange);

    return ret;
};
DualNumberDomain.prototype.setViewValue = function (node, value) {
    var displayValue = '';
    if (value !== null) {
        var first = Math.floor(value / this.size);
        var second = value % this.size;
        
        displayValue = this.firstName + ': ' + first + ', ' +
                       this.secondName + ': ' + second;
    } else
        displayValue = '';
    node.text(displayValue);
};
DualNumberDomain.prototype.setEditValue = function (node, value, options) {
    var first = ''; 
    var second = ''; 
    if (value !== null) {
        first = Math.floor(value / this.size);
        second = value % this.size;
    }

    $(node).children("input[name='first']").val(first);
    $(node).children("input[name='second']").val(second);
};
DualNumberDomain.prototype.extractValue = function (node) {
    var first = $.trim( $( node ).children("input[name='first']").val() ) || null;
    var second = $.trim( $( node ).children("input[name='second']").val() ) || null;
    var value = null;

    if (first !== null || second !== null) {
        if (first !== null) {
            if (isValidNumeric(first, 'integer')) 
                lbs = parseInt(first);
            else
                throw("InvalidNumeric");
        } else
            first = 0;

        if (second !== null) { 
            if (isValidNumeric(second, 'float')) 
                second = parseFloat(second);
            else
                throw("InvalidNumeric");
        } else
            second = 0;

        value = first * this.size + second;
    }

    return value;
};
DualNumberDomain.prototype.isValidValue = function (value) {
    if (value === null)
        return true;
    if (typeof value !== 'number')
        return false;
    return true;
};


var WeightDomain = function() {
    Domain.call(this, 'weight');
    DualNumberDomain.call(this, 'Lbs', 'Ounces', 16);
};
extend(WeightDomain, DualNumberDomain);

var TimeWDomain = function() {
    Domain.call(this, 'time_week');
    DualNumberDomain.call(this, 'Months', 'Weeks', 4);
};
extend(TimeWDomain, DualNumberDomain);

var TimeDomain = function() {
    Domain.call(this, 'time_month');
    DualNumberDomain.call(this, 'Years', 'Months', 12);
};
extend(TimeDomain, DualNumberDomain);

var TimeHDomain = function() {
    Domain.call(this, 'time_hours');
    DualNumberDomain.call(this, 'Days', 'Hours', 24);
};
extend(TimeHDomain, DualNumberDomain);

var TimeMDomain = function() {
    Domain.call(this, 'time_minutes');
    DualNumberDomain.call(this, 'Hours', 'Minutes', 60);
};
extend(TimeMDomain, DualNumberDomain);

var TimeDDomain = function() {
    Domain.call(this, 'time_days');
    DualNumberDomain.call(this, 'Weeks', 'Days', 7);
};
extend(TimeDDomain, DualNumberDomain);

var domain = {
    all: {
        'integer': NumberDomain,
        'float': NumberDomain,
        'string': TextDomain,
        'text': TextDomain,
        'enum': EnumDomain,
        'set': SetDomain,
        'date': DateDomain,
        'weight' : WeightDomain,
        'time_week' : TimeWDomain,
        'time_hours' : TimeHDomain,
        'time_month' : TimeDomain,
        'time_minutes' : TimeMDomain,
        'time_days' : TimeDDomain,
    },

    get: function(type, options) {
        var cls = this.all[type];
        return new cls(options);
    },

    valueFromData: function(def, data) {
        var questionType = def.type;

        switch(questionType) {
        case "set":
            var value = {};
            $.each(def.answers, function (_, answer) {
                var property = def.name + '_' + answer.code;
                if (data.hasOwnProperty(property)) {
                    value[answer.code] = data[property];
                }
            });
            // return value if it's not empty
            for (item in value)
                return value;
            break;

        default:
            if (data.hasOwnProperty(def.name))
                return data[def.name];
        }

        return null;
    },

    getFromDef: function(def) {
        var questionType = def.type;

        switch(questionType) {
        case "enum":
            return this.get(questionType, {
                'variants': def.answers,
                'dropDown': def.dropDown || false,
                'allowClear': def.required /* & !def.annotation */ ? false : true
            });
        case "set":
            return this.get(questionType, def.answers);
        case "integer":
        case "float":
            return this.get(questionType,
                            "float" === questionType);
        case "string":
        case "text":
            return this.get(questionType,
                            "text" === questionType);
        }

        return this.get(questionType);
    }
};




// }}}

var Form = function(config, data, paramValues, templates, showNumbers) {
    var self = this;

    // if pages are in group, set group skip logic to each page
    // of this group
    // if page/group in this group has the own skip logic 
    // use += '<higher-level skip logic>' | (!<higher-level skip logic>) & own-skip-logic
    // while building pages list
    // loop through its questions on the each page and to this.questions[id] = question

    this.completed = false;
    this.templates = templates;

    this.complete = function () {
        self.completed = true;
    }

    this.title = config.title || '';

    this.pages = [];
    this.questions = {};
    this.params = {};
    this.changeStamp = 0;
    this.nextQuestionIndex = 1;

    $.each(config.params || {}, function (_, param) {
        var forRexlize = null;
        if (paramValues[param.name]) {
            // TODO: consider a way to provide info about external param types
            //  to do more accurate conversion here

            if (paramValues[param.name] instanceof Array ||
                paramValues[param.name] instanceof Object)

                throw('ComplexParamsNotSupported');
            else if (param.type === "NUMBER")
                forRexlize = parseFloat(paramValues[param.name]);
            else
                forRexlize = paramValues[param.name];
        }
        self.params[param.name] = rexlize(forRexlize);
    });

    function mergeSkipExpr(first, second) {
        var parts = $.grep([first, second], function(item) {
            return item;
        });

        var newSkipExpr;

        if (0 == parts.length)
            newSkipExpr = '';
        else if (1 == parts.length)
            newSkipExpr = parts[0];
        else
            newSkipExpr = '(' + parts[0] + ')|(' + parts[1] + ')';

        return newSkipExpr;
    }

    function group(list, skipExpr, data, onFormChange) {
        skipExpr = skipExpr || '';
        $.each(list, function(_, item) {
            if(item.type == 'group')
                group(item.pages, mergeSkipExpr(skipExpr, item.skipIf), data, onFormChange);
            else
                page(item, data, skipExpr, onFormChange);
        });
    }

    function page(item, data, skipExpr, onFormChange) {
        var questions = $.map(item.questions, function(questionDef) {
            var slave = questionDef.slave || false;
            var questionName = questionDef.name;
            var params = {
                slave: slave,
                index: (showNumbers && !slave) ? self.nextQuestionIndex++ : null,
                name: questionName,
                title: questionDef.title,
                disableExpr: questionDef.disableIf || null,
                validateExpr: questionDef.constraints || null,
                required: questionDef.required || false,
                askAnnotation: questionDef.annotation || false,
                annotation: data.annotations ?
                                data.annotations[questionName] || null:
                                null,
                explanation: data.explanations ?
                                data.explanations[questionName] || null:
                                null,
                askExplanation: questionDef.explanation || false,
                onFormChange: onFormChange,
                templates: templates,
                customTitles: questionDef.customTitles || null,
                parent: self,
                help: questionDef.help || null
            };
            // TODO: set data[value, annotation, explanation]
            var question = null;
            if (questionDef.type === "rep_group") {
                if (data.answers && data.answers.hasOwnProperty(questionDef.name))
                    params['value'] = data.answers[questionDef.name];
                else
                    params['value'] = null;
                question = new RecordListQuestion(params, 
                                                  questionDef.repeatingGroup);
            } else {
                var answers = data.answers || {};
                params['value'] = domain.valueFromData(questionDef, answers);
                question = new DomainQuestion(params,
                                              domain.getFromDef(questionDef));
            }
            if(self.questions[question.name]) {
                alert('duplicated question id:' + question.name); 
                // TODO: throw error here
            } else
                self.questions[question.name] = question;
            return question;
        });
        var page = new Page(questions, 
                            item.title,
                            item.introduction || null,
                            mergeSkipExpr(skipExpr, item.skipIf) || null);
        self.pages.push(page);
    }

    group(config.pages, null, data, function () {
        ++self.changeStamp;
    });


    var expr = {};
    // loop through all pages and questions and extract rexl expressions
    // as following
    // expr['a=1'].push({obj: page, ifTrue: 'skip', ifFalse: 'unskip'})
    // expr['a=1'].push({obj: question, ifTrue: 'disable', ifFalse: 'enable'})
    $.each(this.pages, function(_, page) {
        if(page.skipExpr) {
            var e = expr[page.skipExpr] = expr[page.skipExpr] || [];
            e.push({
                obj: page,
                ifTrue: 'skip',
                ifFalse: 'unskip'
            });
        }
    });

    this.change = getChangeGraph(this.questions, this.params,
                                 this.questions, expr);
};

var Page = function(questions, title, introduction, skipExpr) {
    var self = this;
    this.questions = questions;
    this.title = title;
    this.skipExpr = skipExpr;
    this.introduction = introduction;
    this.renderedPage = null;
};

Page.prototype.findWrongQuestion = function () {
    var ret = null;
    $.each(this.questions, function (_, question) {
        if (ret === null && question.isIncorrect()) {
            if (question instanceof RecordListQuestion) {
                ret = question.findWrongItem() || question;
            } else
                ret = question;
        }
    });
    return ret;
}

Page.prototype.update = function () {
    if (this.renderedPage)
        this.renderedPage.css('display', this.skipped ? 'none' : 'block');
}

Page.prototype.isIncorrect = function () {
    var self = this;
    var isIncorrect = false;

    $.each(self.questions, function (_, question) {
        if (!self.skipped && question.isIncorrect()) {
            isIncorrect = true;
        }
    });

    return isIncorrect;
}

Page.prototype.skip = function() {
    this.skipped = true;
    this.update();
};

Page.prototype.unskip = function () {
    this.skipped = false;
    this.update();
};

Page.prototype.render = function(templates, mode) {
    var self = this;

    if (self.renderedPage)
        return self.renderedPage;

    var page = $('<div>').addClass('rf-page');
    $.each(self.questions, function (_, question) {
        var questionNode = null;
        if (mode === "edit")
            questionNode = question.edit();
        else
            questionNode = question.view();
        page.append(questionNode);
    });

    self.renderedPage = page;
    self.update();
    return page;
};

// TODO: rename BaseQuestion -> Question
var BaseQuestion = function(params) {
    this.name = params.name;
    this.title = params.title;
    this.required = params.required;
    this.slave = params.slave;
    if (params.index !== null && params.index !== undefined)
        this.title = params.index + '. ' + this.title;
    this.value = params.value;
    this.disableExpr = params.disableExpr || null;
    this.validateExpr = params.validateExpr || null;
    this.askAnnotation = params.askAnnotation || false;
    this.askExplanation = params.askExplanation || false;
    this.explanation = params.explanation || null;
    this.initAnnotation(params.annotation || null);
    this.invalidByExpr = false;
    this.invalidByType = false;
    this.viewNode = null;
    this.editNode = null;
    this.typeName = null;
    this.onFormChange = params.onFormChange || null;
    this.onValueError = params.onValueError || null;
    this.disabled = false;
    this.parent = params.parent || null;
    var self = this;
    this.onChange =
        function () {
            try {
                var extractedValue =
                        self.extractValue();
                self.setValue(extractedValue, true);
                self.setValidByType();
                self.specificOnChange();
                if (self.onFormChange)
                    self.onFormChange();
            } catch(err) {
                self.setInvalidByType();
                if (self.onValueError)
                    self.onValueError();
            }
            self.update();
        };
    this.templates = params.templates || defaultTemplates;
    this.customTitles = params.customTitles || {};
    this.help = params.help || null;
}

BaseQuestion.prototype.initAnnotation = function (annotation) {
    this.annotation = (this.value === null) ? annotation: null;
}

BaseQuestion.prototype.specificOnChange = function () {
    if (this.value !== null)
        this.setAnnotation(null, true);
}

BaseQuestion.prototype.setAnnotation = function (annotation, internal) {
    this.annotation = annotation;
    if (this.annotation)
        this.setValue(null, internal);
    else if (!internal && this.onChange)
        this.onChange();
}

BaseQuestion.prototype.renderAnnotations = function (questionNode, enable) {
    var self = this;

    var annotationContainer = questionNode.find('.rf-question-annotation');
    if (enable && this.askAnnotation) {
        var annotationNode = self.templates['annotation'].clone();
        annotationNode
            .find('.rf-annotation-variants')
            .val(self.annotation ? self.annotation : '')
            .change(function () {
                var annotation = $(this).val() || null;
                self.setAnnotation(annotation, false);
            });
            annotationContainer.append(annotationNode);
    } else
        annotationContainer.css('display', 'none');

    var explanationContainer = questionNode.find('.rf-question-explanation');
    if (enable && this.askExplanation) {
        var explanationNode = self.templates['explanation'].clone();
        var hideBtn = explanationNode.find('.rf-explanation-hide');
        var showBtn = explanationNode.find('.rf-explanation-show');
        var text = explanationNode.find('.rf-explanation-text');
        self.showExplanation = function () {
            hideBtn.css('display', '');
            showBtn.css('display', 'none');
            explanationNode.find('.rf-explanation-block').css('display', '');
        };
        self.hideExplanation = function (skipChangeAction) {
            self.explanation = null;
            text.val('');
            hideBtn.css('display', 'none');
            showBtn.css('display', '');
            explanationNode.find('.rf-explanation-block').css('display', 'none');
            if (!skipChangeAction && self.onFormChange)
                self.onFormChange();
        };
        showBtn.click(function () {
            if ($(this).parents('.rf-disabled').size() == 0)
                self.showExplanation();
        });
        hideBtn.click(function () {
            if ($(this).parents('.rf-disabled').size() == 0)
                self.hideExplanation();
        });
        if (self.explanation) {
            text.val(self.explanation);
            self.showExplanation();
        } else
            self.hideExplanation(true);
        text.change(function () {
            self.explanation = $(this).val() || null;
            if (self.onFormChange)
                self.onFormChange();
        });
        explanationContainer.append(explanationNode)
    } else
        explanationContainer.css('display', 'none');
};

BaseQuestion.prototype.renderCommonPart = function (templateName) {
    var questionNode = this.templates[templateName].clone();
    questionNode.attr('data-question-name', this.name);
    if (this.typeName)
        questionNode.addClass('rf-type-' + this.typeName);
    if (this.slave)
        questionNode.addClass('rf-question-slave');
    questionNode.find('.rf-question-title')
            .append(renderCreole(this.title))
            .end()
            .find('.rf-question-help')
            .append(this.help ? renderCreole(this.help) : null)
            .end()
            .find('.rf-question-required')
            .css('display', this.required ? '' : 'none')
            .end();
    if (this.required)
        questionNode.addClass('rf-required');
    return questionNode;
};

BaseQuestion.prototype.view = function () {
    if (!this.viewNode) {
        this.viewNode = this.renderCommonPart('viewQuestion');
        this.renderAnnotations(this.viewNode, /* enable= */ false);
    }
    return this.viewNode;
};

BaseQuestion.prototype.edit = function () {
    if (!this.editNode) {
        this.editNode = this.renderCommonPart('editQuestion');
        this.renderAnnotations(this.editNode, /* enable= */ true);
    }
    return this.editNode;
};

BaseQuestion.prototype.extractValue = function () {
    return this.value;
};

BaseQuestion.prototype.getAnnotation = function () {
    return this.annotation;
};

BaseQuestion.prototype.getExplanation = function () {
    return this.explanation;
};

BaseQuestion.prototype.setExplanation = function (explanation) {
    this.explanation = explanation;
};

BaseQuestion.prototype.setValue = function (value, internal) {
    this.value = value;
    if (!internal) {
        this.onChange.call(this);
    }
    $(this).trigger('change');
};

BaseQuestion.prototype.getValue = function (value) {
    return this.value;
};

BaseQuestion.prototype.isIncorrect = function () {
    return (!this.disabled && ((this.required && this.annotation === null && this.value === null) ||
                               (this.invalidByExpr || this.invalidByType)));
};

BaseQuestion.prototype.updateActiveElements = function (node, disable) {
    var activeElements = node.find('input,textarea,select,button');
    activeElements.filter('.rf-annotation-variants').val(this.annotation);
    if (disable)
        activeElements.attr('disabled', 'disabled');
    else
        activeElements.removeAttr('disabled');
};

BaseQuestion.prototype.update = function () {
    var nodes = [this.editNode, this.viewNode];
    var self = this;
    var disabled = self.disabled;
    if (this.parent && this.parent.disabled)
        disabled = true;
    $.each(nodes, function(_, node) {
        if(node) {
            if (disabled)
                node.addClass('rf-disabled');
            else
                node.removeClass('rf-disabled');
            self.updateActiveElements(node, disabled);
            if (self.isIncorrect())
                node.addClass('rf-error');
            else
                node.removeClass('rf-error');
        }
    });
};

BaseQuestion.prototype.getRexlValue = function (itemName) {
    return rexlize(this.value);
};

BaseQuestion.prototype.disable = function() {
    if (this.value !== null) {
        this.explanation = null;
        if (this.hideExplanation)
            this.hideExplanation();
        this.setValue(null, false);
    }
    this.disabled = true;
    this.update();
};

BaseQuestion.prototype.enable = function() {
    this.disabled = false;
    this.update();
};

BaseQuestion.prototype.setInvalidByExpr = function () {
    if (!this.invalidByExpr) {
        this.invalidByExpr = true;
        this.update();
    }
};

BaseQuestion.prototype.setValidByExpr = function () {
    if (this.invalidByExpr) {
        this.invalidByExpr = false;
        this.update();
    }
};

BaseQuestion.prototype.setInvalidByType = function() {
    if (!this.invalidByType) {
        this.invalidByType = true;
    }
};

BaseQuestion.prototype.setValidByType = function() {
    if (this.invalidByType) {
        this.invalidByType = false;
    }
};

var DomainQuestion = function (params, domain) {
    if (params.value === null &&
        domain instanceof SetDomain) {
        params.value = domain.getEmptyValue();
    }

    BaseQuestion.call(this, params);
    this.domain = domain;
    this.typeName = domain.name;
};
extend(DomainQuestion, BaseQuestion);

DomainQuestion.prototype.getAnswerPreview = function () {
    return this.domain.renderView(this.templates,
                                  this.value,
                                  this.onChange,
                                  this.customTitles);
};

DomainQuestion.prototype.edit = function () {
    if (!this.editNode) {
        this.editNode = BaseQuestion.prototype.edit.call(this);
        var domainNode = this.domain.renderEdit(this.templates,
                                                this.value,
                                                this.onChange,
                                                this.customTitles);
        this.editNode.find('.rf-question-answers:first')
                     .append(domainNode);
        this.update();
    }
    return this.editNode;
};

DomainQuestion.prototype.getRexlValue = function (itemName) {
    if (this.domain instanceof SetDomain) {
        if (null === this.value)
            return rexlize(null);
        else if (itemName && itemName.length) {
            return rexlize(this.value[itemName[0]]);
        }
        var totalAnswered = 0;
        $.each(this.value, function (_, value) {
            if (value)
                ++totalAnswered;
        });
        return rexlize(totalAnswered);
    } else
        return rexlize(this.value);
};

DomainQuestion.prototype.extractValue = function () {
    if (!this.editNode)
        return this.value;
    var domainNode = this.editNode.find('.rf-question-answers:first').children();
    return this.domain.extractValue(domainNode);
};

DomainQuestion.prototype.initAnnotation = function (annotation) {
    var isEmpty = (this.value === null);
    if (!isEmpty) {
        var hasAnswer = false;
        $.each(this.value, function (_, value) {
            if (value)
                hasAnswer = true;
        });
        isEmpty = !hasAnswer;
    }
    this.annotation = isEmpty ? annotation: null;
};

DomainQuestion.prototype.specificOnChange = function () {
    if (this.domain instanceof SetDomain) {
        if (this.value !== null) {
            var hasAnswer = false;
            $.each(this.value, function (_, value) {
                if (value)
                    hasAnswer = true;
            });
            if (hasAnswer)
                this.setAnnotation(null, true);
                // this.annotation = null;
        }
    } else if (this.value !== null)
        this.setAnnotation(null, true);
        // this.annotation = null;
};

DomainQuestion.prototype.setValue = function (value, internal) {
    if (value === null && 
        this.domain instanceof SetDomain)
        this.value = this.domain.getEmptyValue();
    else {
        if (this.domain.isValidValue(value)) {
            this.value = value;
        } else {
            throw('InvalidValue');
        }
    }
    if (!internal) {
        if (this.editNode) {
            var domainNode = this.editNode.find('.rf-question-answers:first')
                                          .children();
            this.domain.setEditValue(
                            domainNode, this.value, {
                                customTitles: this.customTitles,
                                templates: this.templates,
                                onChange: this.onChange
                            });
        }
        if (this.viewNode) {
            var domainNode = this.viewNode.find('.rf-question-answers:first')
                                          .children();
            this.domain.setViewValue(domainNode, this.value);
        }
        this.onChange.call(this);
    }
    $(this).trigger('change');
};

var Record = function (recordDef, values, options) {
    this.node = null;
    this.questions = [];
    this.customTitles = options.customTitles;
    this.templates = options.templates;
    this.viewNode = null;
    this.editNode = null;
    this.parent = options.parent;
    this.onRemove = options.onRemove;
    this.collapsed = false;
    this.disabled = false;
    var self = this;
    $.each(recordDef, function (_, questionDef) {
        var slave = questionDef.slave || false;
        var questionName = questionDef.name;
        var params = {
            slave: slave,
            index: null,
            name: questionName,
            title: questionDef.title,
            disableExpr: questionDef.disableIf || null,
            validateExpr: questionDef.constraints || null,
            required: questionDef.required || false,
            /*
            askAnnotation: questionDef.annotation || false,
            annotation: data.annotation ?
                            data.annotations[questionName] || null:
                            null,
            explanation: data.explanations ?
                            data.explanations[questionName] || null:
                            null,
            askExplanation: questionDef.explanation || false,
            */
            onFormChange: options.onChange,
            onValueError: options.onValueError,
            templates: options.templates,
            customTitles: questionDef.customTitles || null,
            value: values !== null ? domain.valueFromData(questionDef, values): null,
            parent: self,
            help: questionDef.help || null
        };
        question = new DomainQuestion(params, domain.getFromDef(questionDef));
        if(self.questions[question.name]) {
            alert('duplicated question id="' + question.name + '" inside a group');
            // TODO: throw error here
        } else
            self.questions.push(question);
    });
    var form = findParentWithClass(this.parent, Form);

    var context = {};
    $.each(this.questions, function (_, question) {
        context[question.name] = question;
    });
    $.each(form.questions, function (_, question) {
        if (!context[question.name])
            context[question.name] = question;
    });
    this.change = getChangeGraph(this.questions, form.params, context, null);
    initGraphState(context, form.params, this.change);
};

Record.prototype.findWrongQuestion = function () {
    var ret = null;
    $.each(this.questions, function (_, question) {
        if (!ret && question.isIncorrect())
            ret = question;
    });
    return ret;
};

Record.prototype.isIncorrect = function () {
    var isIncorrect = false;
    $.each(this.questions, function (_, question) {
        if (!isIncorrect && question.isIncorrect())
            isIncorrect = true;
    });
    return isIncorrect;
};

Record.prototype.renderPreview = function () {
    var content = $('<div>').addClass('rf-preview-content');
    var self = this;

    if (this.questions.length) {
        var question = this.questions[0];
        if (question instanceof DomainQuestion) {
            var domainPreview =
                    question.domain.renderView(question.templates,
                                  question.value,
                                  question.onChange,
                                  question.customTitles);
            content.append(domainPreview);
        }
    }

    var rest = $('<div>').addClass('rf-collapsed-record-rest');
    var expandHint = this.templates['expandHint'].clone();
    rest.append(expandHint)
    content.append(rest);
    return content;
};

Record.prototype.renderCollapsed = function () {
    var previewNode = this.editNode.find('.rf-record-preview:first');
    previewNode.contents().remove();
    previewNode.append(this.renderPreview());
    var questionNode = this.editNode.find('.rf-questions:first');
    questionNode.css('display', 'none');
    var btnCollapse = this.editNode.find('.rf-collapse-record:first');
    btnCollapse.css('display', 'none');
    this.editNode.addClass('rf-collapsed');
    var self = this;
    this.editNode.bind('click.rfExpand', function () {
        self.expand();
    });
}

Record.prototype.collapse = function (silent) {
    if (this.collapsed)
        return;
    if (this.isIncorrect()) {
        if (!silent && this.editNode) {
            alert("Can't collapse the group because it consists of wrong values");
            var wrongQuestion = this.findWrongQuestion();
            if (wrongQuestion && wrongQuestion.editNode)
                wrongQuestion.editNode[0].scrollIntoView();
        }
        return;
    }
    if (this.editNode)
        this.renderCollapsed(silent);
    this.collapsed = true;
};

Record.prototype.expand = function () {
    if (!this.collapsed)
        return;
    var previewNode = this.editNode.find('.rf-record-preview:first');
    previewNode.contents().remove();
    var questionNode = this.editNode.find('.rf-questions:first');
    questionNode.css('display', '');
    var btnCollapse = this.editNode.find('.rf-collapse-record:first');
    btnCollapse.css('display', '');
    this.editNode.removeClass('rf-collapsed');
    this.editNode.unbind('click.rfExpand');

    this.collapsed = false;
}

Record.prototype.renderEdit = function () {
    if (!this.editNode) {
        this.editNode = $('<div>').addClass('rf-record');
        var preview = $('<div>').addClass('rf-record-preview');
        var questions = $('<div>').addClass('rf-questions');
        this.editNode.append(preview);
        this.editNode.append(questions);
        var self = this;
        $.each(this.questions, function (_, question) {
            questions.append(question.edit());
        });
        var btnCollapseRecord = this.templates['btnCollapseRecord'].clone();
        if (!btnCollapseRecord.hasClass('rf-collapse-record'))
            btnCollapseRecord.addClass('rf-collapse-record');
        btnCollapseRecord.click(function (event) {
            self.collapse(false);
            event.stopPropagation();
        });
        this.editNode.append(btnCollapseRecord);
        var btnRemoveRecord = this.templates['btnRemoveRecord'].clone();
        var titleNode = btnRemoveRecord.filter('.rf-remove-record-title') 
        if (!titleNode.size())
            titleNode = btnRemoveRecord.find('.rf-remove-record-title');
        if (titleNode.size()) {
            var title = this.customTitles.removeRecord ?
                        this.customTitles.removeRecord: 'Remove Group of Answers';
            if (titleNode.prop("tagName") === 'A')
                titleNode.attr('title', title);
            else
                titleNode.text(title);
        }
        btnRemoveRecord.click(function () {
            if ($(this).parents('.rf-disabled:first').size() == 0) {
                if (self.editNode)
                    self.editNode.remove();
                if (self.viewNode)
                    self.viewNode.remove();
                if (self.onRemove)
                    self.onRemove(self);
            }
        });
        this.editNode.append(btnRemoveRecord);
        if (this.collapsed)
            this.renderCollapsed();
    }
    return this.editNode;
};

Record.prototype.renderView = function () {
    if (!this.editNode) {
        this.editNode = templates['editRecord'].clone();
        var container = this.editNode.find('.rf-questions');
        $.each(this.questions, function (_, question) {
            container.append(question.edit());
        });
    }
    return this.editNode;
};

Record.prototype.extractValue = function () {
    var hasAnswer = false;
    var collectedAnswers = collectAnswers(this.questions);
    $.each(collectedAnswers, function (_, answer) {
        if (answer !== null)
            hasAnswer = true;
    });
    return hasAnswer ? collectedAnswers : null;
};

Record.prototype.update = function () {
    $.each(this.questions, function (_, question) {
        question.update();
    });
};

Record.prototype.enable = function () {
    this.disabled = false;
    this.update();
};

Record.prototype.disable = function () {
    this.disabled = true;
    this.update();
};

Record.prototype.release = function () {
    $.each(this.questions, function(_, question) {
        $(question).off();
    });
    this.questions = [];
    this.change = null;
    this.editNode = null;
    this.viewNode = null;
};

var RecordListQuestion = function (params, recordDef) {
    BaseQuestion.call(this, params);
    this.typeName = 'rep_group';
    this.records = [];
    this.recordDef = recordDef;
    this.createRecordsFromValue(this.value);
};
extend(RecordListQuestion, BaseQuestion);

RecordListQuestion.prototype.findWrongItem = function () {
    var ret = null;
    $.each(this.records, function (_, record) {
        if (!ret)
            ret = record.findWrongQuestion();
    });
    return ret;
};

RecordListQuestion.prototype.recordsAreIncorrect = function () {
    var isIncorrect = false;
    if (!isIncorrect && this.value !== null) {
        $.each(this.records, function (_, record) {
            if (!isIncorrect && record.extractValue() !== null &&
                                record.isIncorrect()) {
                isIncorrect = true;
            }
        });
    }
    return isIncorrect;
};

RecordListQuestion.prototype.isIncorrect = function () {
    return (!this.disabled && ((this.required && this.annotation === null && this.value === null) ||
                               (this.invalidByExpr || this.invalidByType) ||
                               (this.value !== null && this.recordsAreIncorrect() )));
};

RecordListQuestion.prototype.createRecord = function (values) {
    var self = this;
    var options = {
        customTitles: this.customTitles,
        templates: this.templates,
        onFormChange: this.onFormChange,
        onRemove: function (removedRecord) {
            // remove this record from the record list
            self.records = $.grep(self.records, function (record) {
                return (record != removedRecord);
            });
            if (self.onChange)
                self.onChange.call(self);
        },
        onChange: function () {
            if (self.onChange)
                self.onChange.call(self);
        },
        onValueError: function () {
            self.setInvalidByType();
        },
        parent: this
    };
    var record = new Record(this.recordDef, values || null, options);
    return record;
};

RecordListQuestion.prototype.createRecordsFromValue = function (value) {
    $.each(this.records, function (i, record) {
        record.release();
    });
    this.records = [];
    var self = this;
    var editRecords = this.editNode ?
                        this.editNode.find('.rf-records-list:first') : null;
    var viewRecords = this.viewNode ?
                        this.viewNode.find('.rf-records-list:first') : null;
    if (editRecords)
        editRecords.contents().remove();
    if (viewRecords)
        viewRecords.contents().remove();
    if (value == null)
        value = [ null ]; // to create one empty record
    var lastRecord = null;
    $.each(value, function (_, recordValue) {
        var record = self.createRecord(recordValue);
        self.records.push(record);
        if (editRecords)
            editRecords.append(record.renderEdit());
        if (viewRecords)
            viewRecords.append(record.renderView());
        lastRecord = record;
    });
    self.collapseRecords(lastRecord);
}

RecordListQuestion.prototype.setValue = function (value, internal) {
    this.value = value;
    if (!internal) {
        this.createRecordsFromValue(value);
        this.onChange.call(this);
    }
    $(this).trigger('change');
};

RecordListQuestion.prototype.extractValue = function () {
    var ret = [];
    $.each(this.records, function (_, record) {
        var value = record.extractValue();
        if (value)
            ret.push(value);
    });
    return ret.length ? ret : null;
};

RecordListQuestion.prototype.getRexlValue = function (itemName) {
    if (null === this.value)
        return rexlize(null);
    return rexlize(this.value.length);
};

RecordListQuestion.prototype.updateActiveElements = function (node, disable) {
    // nothing to do, since sub-questions should 
    //  disable their active elements themselves
};

RecordListQuestion.prototype.disable = function() {
    BaseQuestion.prototype.disable.call(this);
    $.each(this.records, function (_, record) {
        record.disable();
    });
};

RecordListQuestion.prototype.enable = function() {
    BaseQuestion.prototype.enable.call(this);
    $.each(this.records, function (_, record) {
        record.enable();
    });
};

RecordListQuestion.prototype.collapseRecords = function (except) {
    $.each(this.records, function (_, record) {
        if (record !== except) {
            record.collapse(true);
        }
    });
};

RecordListQuestion.prototype.edit = function () {
    if (!this.editNode) {
        this.editNode = BaseQuestion.prototype.edit.call(this);
        var node = $('<div>').addClass('rf-records');
        var recordList = $('<div>').addClass('rf-records-list');
        node.append(recordList);

        var btnAddRecord = this.templates['btnAddRecord'].clone();
        var titleNode = btnAddRecord.filter('.rf-add-record-title');
        if (!titleNode.size())
            titleNode = btnAddRecord.find('.rf-add-record-title');
        if (titleNode.size()) {
            var title = this.customTitles.addRecord ?
                        this.customTitles.addRecord: 'Add Group of Answers';
            if (titleNode.prop('tagName') === 'A')
                titleNode.attr('title', title);
            else
                titleNode.text(title);
        }
        $.each(this.records, function (_, record) {
            var recordNode = record.renderEdit();
            recordList.append(recordNode);
        });
        var self = this;
        btnAddRecord.click(function () {
            if ($(this).parents('.rf-disabled').size() == 0) {
                var record = self.createRecord(null);
                self.records.push(record);
                var recordNode = record.renderEdit();
                self.collapseRecords(record);
                recordList.append(recordNode);
                recordNode[0].scrollIntoView();
            }
        });

        node.append(btnAddRecord);
        this.editNode.find('.rf-question-answers')
                     .append(node);
        this.update();
    }
    return this.editNode;
};

var defaultTemplates = {
    'progressBar':
          '<div class="rf-progress-bar-fill-wrap">'
            + '<div class="rf-progress-bar-fill"></div>'
            + '<span class="rf-progress-bar-pct">30%</span>'
        + '</div>',
    'btnRemoveRecord':
        '<button class="rf-remove-record"><span class="rf-remove-record-title">Remove this group</span></button>',
    'btnCollapseRecord':
        '<button class="rf-collapse-record"><span class="rf-collapse-record-title">Collapse</span></button>',
    'btnAddRecord':
        '<button class="rf-add-record"><span class="rf-add-record-title">Add group of answers</span></button>',
    'btnClear':
        '<button class="rf-clear-answers">Clear</button>',
    'expandHint':
        '<span class="rf-expand-hint">(Click to expand)</span>',
    'editQuestion':
          '<div class="rf-question rf-question-edit">'
            + '<div class="rf-question-required"><abbr title="This question is mandatory">*</abbr></div>'
            + '<div class="rf-question-title"></div>'
            + '<div class="rf-question-answers"></div>'
            + '<div class="rf-question-annotation"></div>'
            + '<div class="rf-question-explanation"></div>'
        + '</div>',
    'viewQuestion':
          '<div class="rf-question rf-question-view">'
            + '<div class="rf-question-required"><abbr title="This question is mandatory">*</abbr></div>'
            + '<div class="rf-question-title"></div>'
            + '<div class="rf-question-answers"></div>'
            + '<div class="rf-question-annotation"></div>'
            + '<div class="rf-question-explanation"></div>'
        + '</div>',
    'errorDialog':
          '<div class="rf-error-dialog">'
            + '<div class="rf-error-message"></div>'
            + '<div class="rf-error-content"></div>'
        + '</div>',
    'explanation':
          '<div class="rf-explanation">'
            + '<div class="rf-explanation-show">I want to explain my answer</div>'
            + '<div class="rf-explanation-hide">I don\'t want to explain my answer</div>'
            + '<div class="rf-explanation-block">'
                + '<div class="rf-explanation-title">Please explain your answer:</div>'
                + '<textarea class="rf-explanation-text"></textarea>'
            + '</div>'
        + '</div>',
    'annotation':
          '<div class="rf-annotation">'
            + '<span class="rf-annotation-title">I can\'t answer because:</span>'
            + '<select class="rf-annotation-variants">'
                + '<option value=""></option>'
                + '<option value="do_not_know">I don\'t know the answer.</option>'
                + '<option value="do_not_want">I don\'t want to answer.</option>'
            + '</select>'
        + '</div>'
};

$.RexFormsClient = function (o) {
    var self = this;

    this.mode = o.mode ? o.mode : 'normal';
    this.saveBeforeComplete = o.saveBeforeComplete || false;

    if (!o)
        throw("RexFormsClient got no parameters");

    var mandatoryParams = [
        'formMeta',
        'instrumentName'
    ];

    if (o.assessment)
        mandatoryParams.push('saveURL');

    $.each(mandatoryParams, function (_, paramName) {
        if (!o[paramName])
            throw("Mandatory parameter '" + paramName + "' is not set");
    });

    // creating mandatory form elements
    function createFormElement (elemName, target) {
        self[elemName] = $( target );
        if (self[elemName].size() == 0)
            throw("Couldn't create mandatory element '" + elemName + "'" );
    }

    createFormElement( 'formArea', o.formArea || '#rf_form_area' );
    createFormElement( 'questionArea', o.questionArea || '#rf_question_area' );
    createFormElement( 'btnNext', o.btnNext || '#rf_button_next' );
    createFormElement( 'btnPrev', o.btnPrev || '#rf_button_prev' );

    this.pageTitleArea = $( o.pageTitleArea || '#rf_page_title' );
    this.formTitleArea = $( o.formTitleArea || '#rf_form_title' );
    this.pageIntroductionArea = $( o.pageIntroductionArea || '#rf_page_introduction' );

    this.btnNext.click(function () {
        self.nextPage();
    });

    this.btnPrev.click(function () {
        self.prevPage();
    });

    // building template objects
    var templates = this.templates = {};
    $.each(defaultTemplates, function (key, value) {
        var target;
        if (o.templates && o.templates[key])
            target = o.templates[key];
        else
            target = defaultTemplates[key];
        templates[key] = $( target );
    });

    // creating optional form elements
    var progressBar = null;
    var progressBarArea = $( o.progressBarArea ) || null;
    if (progressBarArea) {
        progressBar = this.templates['progressBar'].clone();
        progressBar.appendTo(progressBarArea);
    }
    this.progressBar = progressBar;


    if (this.mode !== 'normal' &&
        this.mode !== 'preview') {
        throw("Wrong mode: " + this.mode);
    }

    this.previewURL = o.previewURL || null;
    this.saveURL = o.saveURL;
    this.completeCallback = o.completeCallback || null;
    this.events = o.events || {};

    this.formData = o.formData || {};
    this.form = new Form(o.formMeta,
                         o.formData || {},
                         o.paramValues || {},
                         templates,
                         o.showNumbers || false);
    initGraphState(this.form.questions, this.form.params, this.form.change);
    this.currentPageIdx = -1;
    this.assessment = o.assessment || null;
    this.instrumentName = o.instrumentName;
    this.savedChangeStamp = 0;

    var updateProgress = function (forcePct) {
        var current = self.currentPageIdx;
        var total = self.form.pages.length;
        var completed = current >= 0 ? current: 0;
        var pct;

        if (forcePct)
            pct = forcePct;
        else
            pct = (total > 0) ? Math.floor(100 * completed/total) : 0;

        self.raiseEvent('updateProgress', {
            pct: pct,
            completed: completed,
            total: total
        });
    };

    var updateButtons = function () {
        // TODO: think how to do it better
        var showButton = self.mode !== 'preview' && self.currentPageIdx;
        self.btnPrev.css('display', showButton ? '':'none');
    }

    var validateAndGo = function (step, startFrom, skipValidation) {
        if (self.form.completed)
            return;

        var validateAndScroll = function (page) {
            if (page.isIncorrect()) {
                var eventRetData = { 
                    'cancel': false
                };
                self.raiseEvent('forwardError', eventRetData);
                if (!eventRetData.cancel) {
                    var onDialogClose = function () {
                        var wrongQuestion = page.findWrongQuestion();
                        if (wrongQuestion) {
                            var scrollTo = null;
                            if (wrongQuestion.editNode)
                                scrollTo = wrongQuestion.editNode;
                            else if (wrongQuestion.viewNode)
                                scrollTo = wrongQuestion.viewNode;
                            if (scrollTo)
                                scrollTo[0].scrollIntoView();
                        }
                    }
                    self.showError(
                        null,
                        "There are missed required questions or wrong answers on "
                      + "this page. Please correct the information you provided.",
                        null,
                        onDialogClose);
                }
                return false;
            }
            return true;
        }

        var pages = self.form.pages;

        if (!skipValidation) {
            if (self.mode === "preview") {
                for (var idx in pages)
                    if (!validateAndScroll(pages[idx]))
                        return;
            } else if (self.currentPageIdx >= 0 & step > 0) {
                if (!validateAndScroll(pages[self.currentPageIdx]))
                    return;
            }
        }

        var idx = (startFrom !== undefined && startFrom !== null) ?
                    startFrom : self.currentPageIdx + step;
        var total = pages.length;

        while (idx >= 0 && idx < total) {
            if (!pages[idx].skipped) {
                if (self.currentPageIdx != -1)
                    self.save(null, false);
                self.renderPage(idx, true);
                updateProgress();
                updateButtons();
                window.scrollTo(0, 0);
                self.saveLastVisitPage(idx);
                return;
            }
            self.raiseEvent('skipPage', idx);
            idx += step;
        }

        if (step > 0) {
            updateProgress(100);
            updateButtons();

            self.complete();
        }
    };

    this.clearQuestions = function () {
        self.questionArea.children().detach();
    }

    this.renderPreview = function () {
        var self = this;
        if (!self.raiseEvent('beforePreviewRender')) {
            // stop rendering if aborted
            return;
        }

        $.each(self.form.pages, function (idx, _) {
            var renderedPage = self.renderPage(idx, false);
            self.questionArea.append(renderedPage);
            updateButtons();
        });
    }

    this.renderPage = function (pageIdx, clear) {
        if (!self.raiseEvent('beforePageRender', pageIdx)) {
            // stop rendering if aborted
            return;
        }

        self.currentPageIdx = pageIdx;

        if (clear)
            self.clearQuestions();

        var page = self.form.pages[pageIdx];

        self.pageTitleArea.contents().remove();
        if (page.title)
            self.pageTitleArea.append( renderCreole(page.title) );
        else
            self.pageTitleArea.contents().remove();

        if (self.mode !== "preview") {
            self.pageIntroductionArea.contents().remove();
            if (page.introduction)
                self.pageIntroductionArea.append( renderCreole(page.introduction) );
        }

        var renderedPage = page.render(self.templates, 'edit');
        self.questionArea.append(renderedPage);
        self.raiseEvent('pageRendered', pageIdx);
    };

    this.raiseEvent = function(eventName, eventData) {
        $(self).trigger('rexforms:' + eventName, eventData);
        if (self.events[eventName])
            return this.events[eventName](eventData);
        return true;
    };

    this.goToStart = function (pageIdx) {
        validateAndGo(1, 0, true);
    };

    this.nextPage = function () {
        validateAndGo(1);
    };

    this.prevPage = function () {
        validateAndGo(-1);
    };

    this.collectAnnotations = function () {
        var annotations = {};
        $.each(this.form.questions, function (_, question) {
            var annotation = question.getAnnotation();
            if (annotation)
                annotations[question.name] = annotation;
        });
        return annotations;
    }

    this.collectExplanations = function () {
        var explanations = {};
        $.each(this.form.questions, function (_, question) {
            var explanation = question.getExplanation();
            if (explanation)
                explanations[question.name] = explanation;
        });
        return explanations;
    }

    this.save = function (callback, sync) {
        if (null === self.assessment)
            return;

        this.formData.answers = collectAnswers(self.form.questions);
        this.formData.annotations = self.collectAnnotations();
        this.formData.explanations = self.collectExplanations();

        // var changeStamp = self.changeStamp;
        collectedData = $.toJSON(this.formData);

        if (!self.raiseEvent('beforeSave', collectedData))
            // stop if aborted
            return;

        new function () {
            var changeStamp = self.form.changeStamp;
            var onError = function (req, result) {
                var eventRetData = { 
                    'req': req,
                    'result': result,
                    'cancel': false
                };
                self.raiseEvent('saveError', eventRetData);
                if (eventRetData.cancel)
                    return;
                self.showError(
                    null,
                    'Error saving your answers!',
                    req ? req.responseText : null
                );
            };
            $.ajax({
                url: self.saveURL,
                dataType: 'text',
                success: function(content, textStatus, req) {
                    var result = null;
                    try {
                        var result = $.parseJSON(content);
                    } catch(err) {
                        onError(req, null);
                        return;
                    }
                    if (!result.result)
                        onError(req, result);
                    else {
                        self.savedChangeStamp = self.form.changeStamp;
                        self.raiseEvent('saved');
                        if (callback)
                            callback();
                    }
                },
                error: function(req) {
                    onError(req, null);
                },
                async: sync ? false : true,
                cache: false,
                data: 'data=' + encodeURIComponent(collectedData)
                    + '&form=' + encodeURIComponent(self.instrumentName)
                    + '&assessment=' + encodeURIComponent(self.assessment)
                    + (self.form.completed ? '&completed=1' : ''),
                type: 'POST'
            });
        }
    };

    this.preview = function () {
        if (!self.raiseEvent('preview'))
            return true;
        if (this.previewURL)
            window.location.href = this.previewURL;
        return false;
    }

    this.complete = function () {
        var realComplete = function () {
            var eventRetData = {};
            var retValue = self.raiseEvent('beforeComplete', eventRetData);
            if (!retValue || eventRetData.cancel)
                return;

            self.btnNext.add(this.btnPrev).css('display', 'none');
            self.clearQuestions();

            self.form.complete();
            self.save(function () {
                self.raiseEvent('completed');
            }, false);
        }

        if (self.saveBeforeComplete) {
            self.save(function () {
                realComplete();
            }, false);
        } else
            realComplete();
    };

    this.getBookmarkName = function () {
        return 'rf_' + this.instrumentName + '_' + this.assessment + '_bookmark';
    }

    this.getLastVisitPage = function () {
        if (this.assessment) {
            value = localStorage.getItem(this.getBookmarkName());
            if (value !== null && value !== undefined)
                value = parseInt(value);
            return value;
        }
        return null;
    }

    this.saveLastVisitPage = function (value) {
        if (this.assessment)
            localStorage.setItem(this.getBookmarkName(), value);
    }


    this.showError = function (title, message, iframeContent, onClose) {
        var node = templates['errorDialog'].clone();
        node.find('.rf-error-message:first').text(message);
        node.dialog({
            width: 500,
            height: 150,
            modal: true,
            title: title || 'Error',
            buttons: {
                Ok: function () {
                    $(this).dialog('close');
                }
            },
            close: function () {
                node.detach();
                if (onClose)
                    onClose();
            }
        });
        if (iframeContent) {
            var iframeContainer = node.find('.rf-error-content:first');
            var iframe = $('<iframe></iframe>');
            iframeContainer.append(iframe);
            var doc = iframe[0].contentWindow.document;
            doc.write(iframeContent);
            doc.close();
            node.dialog('option', 'height', 300);
        }
    }

    this.formTitleArea.append( renderCreole(this.form.title) );

    window.onbeforeunload = function (e) {
        if (self.savedChangeStamp < self.form.changeStamp) {
            // There are unsaved changes.
            // Saving synchrounously.
            self.save(null, true);
        }
    };

    if (this.mode === 'preview')
        this.renderPreview();
    else {
        // 'normal' mode
        var lastVisitPage = null;
        if (!o.ignoreBookmark &&
            o.formData &&
            o.formData.answers &&
            objSize(o.formData.answers)) {

            lastVisitPage = this.getLastVisitPage();
            if (lastVisitPage >= this.form.pages.length)
                lastVisitPage = null;
        }
        validateAndGo(1, lastVisitPage);
        // this.validateAndGo(1, lastVisitPage);
        // this.goToPage(lastVisitPage);
    }
}

})(jQuery);

// vim: set foldmethod=marker:
