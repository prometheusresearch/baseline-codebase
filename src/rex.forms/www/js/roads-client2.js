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
// }}}

// {{{ domains
var Domain = function(name) {
    this.name = name;
};

Domain.prototype.render = function() {
    alert('Implement in subclasses');
};
Domain.prototype.extractValue = function (node) {
    alert('Implement in subclasses');
};


var StringDomain = function() {
    Domain.call(this, 'string');
};
extend(StringDomain, Domain);
StringDomain.prototype.render = function () {
    return $('<textarea></textarea>');
};
StringDomain.prototype.extractValue = function (node) {
    return $.trim( node.find('textarea').val() ) || null;
}


var NumberDomain = function() {
    Domain.call(this, 'number');
};
extend(NumberDomain, Domain);
NumberDomain.prototype.render = function() {
    return $('<input type="text">');
};
NumberDomain.prototype.extractValue = function (node) {
    var rawValue = node.find('input[type="text"]').val();
    var value = $.trim( rawValue ) || null;

    if (value !== null) {
        if (isValidNumeric(value, 'float'))
            value = parseFloat(value);
        else
            throw("InvalidNumeric");
    }
    return value;
}


var EnumDomain = function (variants) {
    Domain.call(this, 'enum');
    this.variants = variants;
};
extend(EnumDomain, Domain);
EnumDomain.prototype.render = function () {
    var ret = $();
    var randName = getRandomStr(10);

    // TODO: check for uniqueness of randName
    $.each(this.variants, function (_, variant) {
        var label = $('<label>').text(variant.title);
        label.prepend( 
            $('<input type="radio">')
                .attr('name', randName)
                .attr('value', variant.code)
        );
        ret = ret.add(label);
    });
    return ret;
};
EnumDomain.prototype.extractValue = function (node) {
    var input = node.find('input[type="radio"]:checked');
    if (input.size())
        return input.value();
    return null;
}


var SetDomain = function (variants) {
    Domain.call(this, 'set');
    this.variants = variants;
};
extend(SetDomain, Domain);
SetDomain.prototype.render = function () {
    var ret = $();
    $.each(this.variants, function (_, variant) {
        var label = $('<label>').text(variant.title);
        label.prepend(
            $('<input type="checkbox">')
                .attr('value', variant.code)
        );
        ret = ret.add(label);
    });
    return ret;
};
SetDomain.prototype.extractValue = function (node) {
    var inputs = node.find('input[type="checkbox"]:checked');
    var values = [];
    inputs.each(function (_, input) {
        values.push( $(input).val() );
    });
    return values.length ? values : null;
}


var domain = {
    all: {
        'integer': NumberDomain,
        'float': NumberDomain,
        'string': StringDomain,
        'enum': EnumDomain,
        'set': SetDomain
    },

    get: function(type, options) {
        var cls = this.all[type];
        return new cls(options);
    },

    getFromDef: function(def) {
        if (def.questionType === "enum" ||
            def.questionType === "set") {

            return this.get(def.questionType, def.answers);
        }

        return this.get(def.questionType);
    }
};
// }}}

var Survey = function(config, data) {
    var self = this;

    // TODO: build flat list of Page objects here 
    // if pages is in group, set group skip logic to each page
    // of this group
    // if page/group in this group has the own skip logic 
    // use += '<higher-level skip logic>' | (!<higher-level skip logic>) & own-skip-logic
    // while building pages list
    // loop through its questions on the each page and to this.questions[id] = question

    this.finished = false;

    this.finish = function () {
        self.finished = true;
    }

    this.pages = [];
    this.questions = {};
    
    function group(list, skipExpr) {
        skipExpr = skipExpr || '';
        $.each(list, function(_, item) {
            if(item.type == 'group') {
                var parts = $.grep([skipExpr, item.skipIf], function(item) {
                    return item;
                });
                
                var newSkipExpr;

                if (0 == parts.length)
                    newSkipExpr = '';
                else if (1 == parts.length)
                    newSkipExpr = parts[0];
                else
                    newSkipExpr = '(' + parts[0] + ')|(' + parts[1] + ')';
                    
                group(item.pages, newSkipExpr); 
            }
            else 
                page(item);
        });
    }

    function page(item) {
        var questions = $.map(item.questions, function(question) {
            var question = new Question(question.name,
                                        question.title,
                                        domain.getFromDef(question),
                                        question.disableIf || null,
                                        question.constraints || null
                                       );

            if(self.questions[question.name])
                alert('duplicate question id'); // TODO: throw error here
            else
                self.questions[question.name] = question;
            return question;
        });
        var page = new Page(questions, item.skipIf || null);
        self.pages.push(page);
    }

    group(config.pages);


    // TODO: set initial values for questions


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

    $.each(this.questions, function(_, question) {
        if(question.disableExpr) {
            var e = expr[question.disableExpr] = expr[question.disableExpr] || [];
            e.push({
                obj: question,
                ifTrue: 'disable',
                ifFalse: 'enable'
            });
        }

        if(question.validateExpr) {
            var e = expr[question.validateExpr] = expr[question.validateExpr] || [];
            e.push({
                obj: question,
                ifTrue: 'validate',
                ifFalse: 'invalidate'
            });
        }
    });

    // building the change graph
    this.change = {};
    $.each(expr, function(expr, actions) {
        var parsed = rexl.parse(expr);
        $.each(parsed.getNames(), function(_, name) {
            name = name[0];
            self.change[name] = self.change[name] || [];
            self.change[name].push({
                expr: parsed,
                actions: actions
            });
        });
    });

};

Survey.prototype.initState = function() {
    var self = this;

    // bind the change event on each question
    // and calculate the initial survey state
    $.each(this.change, function(key, list) {
        function changeQuestion() {
            $.each(list, function(_, value) {
                var result = self.calculate(value.expr),
                    methodKey = result ? 'ifTrue':'ifFalse';

                // apply needed method to needed entity
                $.each(value.actions, function(_, action) {
                    var method = action[methodKey];
                    action.obj[method]();
                });
            });
        }
        changeQuestion();
        $(self.questions[key]).bind('change', changeQuestion);
    });
};

Survey.prototype.calculate = function(expr) {
    var self = this;
    return expr.evaluate(function(name) {
        // TODO: add params handling
        //if(self.hasParam(name[0]))
        //    return self.getRexlParamValue(name[0]);
        var question = self.questions[name[0]];
        if(!question)
            alert("Something very wrong here");
        return question.getRexlValue(name.slice(1, name.length));
    });
};


var Page = function(questions, skipExpr) {
    var self = this;
    this.questions = questions;
    this.skipExpr = skipExpr;
};

Page.prototype.skip = function() {
    this.skipped = true;
};

Page.prototype.unskip = function() {
    this.skipped = false;
};


var Question = function(name, title, domain, disableExpr, validateExpr) {
    this.name = name;
    this.title = title;
    this.domain = domain;

    this.disableExpr = disableExpr;
    this.validateExpr = validateExpr;
    // TODO: convert validate expr to use this.id instead of 'this';
};

Question.prototype.edit = function(template) {
    if (!this.node) {
        var node = template.clone();
        node.find('.rf-question-title')
                .text(this.title)
        node.find('.rf-question-answers')
                .append(this.domain.render());
        this.node = node;        
        this.update();
    }
    return this.node;
};

Question.prototype.view = function() {
    // read-only mode
};

Question.prototype.update = function() {
    if(!this.node)
        return;
    // update value visiblity, disable/enable inputs, show/hide error messages here
};

Question.prototype.setValue = function(value) {
    this.value = value;
    this.update();

    $(this).trigger('change');
};

Question.prototype.getValue = function() {
    return this.value || null;
};

Question.prototype.getRexlValue = function(name) {
    if(this.domain instanceof NumberDomain)
        return rexl.Number.value(this.value);
    if(this.domain instanceof StringDomain)
        return rexl.String.value(this.value);
};

Question.prototype.disable = function() {
    this.disabled = true;
    this.update();
};

Question.prototype.enable = function() {
    this.disabled = false;
    this.update();
};

Question.prototype.invalidate = function() {
    this.invalid = true;
    this.update();
};

Question.prototype.validate = function() {
    this.invalid = false;
    this.update();
};

var defaultTemplates = {
    'progressBar':
          '<div class="survey-progress-bar-fill-wrap">' 
            + '<div class="rc-progress-bar-fill"></div>' 
            + '<span class="rc-progress-bar-pct">30%</span>'
        + '</div>',
    'btnAddRepGroup':
        '<button class="roads-add-rep-group">Add group of answers</button>',
    'btnClear':
        '<button class="btn-clear-answers">Clear</button>',
    'question':
          '<div class="rf-question">'
            + '<div class="rf-question-title"></div>'
            + '<div class="rf-question-answers"></div>'
        + '</div>'
};

$.RexFormsClient = function (o) {
    var self = this;

    if (!o)
        throw("RexFormsClient got no parameters");

    var mandatoryParams = [
        'instrumentData',
        'instrumentName',
        'saveURL'
    ];

    $.each(mandatoryParams, function (_, paramName) {
        if (!o[paramName])
            throw("Mandatory parameter '" + paramName + "' is not set");
    });

    // creating mandatory survey elements
    function createSurveyElement (elemName, target) {
        self[elemName] = $( target );
        if (self[elemName].size() == 0)
            throw("Couldn't create mandatory element '" + elemName + "'" );
    }

    createSurveyElement( 'surveyArea', o.surveyArea || '#rf_survey_area' );
    createSurveyElement( 'questionArea', o.questionArea || '#rf_question_area' );
    createSurveyElement( 'btnNext', o.btnNext || '#rf_button_next' );
    createSurveyElement( 'btnPrev', o.btnPrev || '#rf_button_prev' );

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

    // creating optional survey elements
    var progressBar = null;
    var progressBarArea = $( o.progressBarArea ) || null;
    if (progressBarArea) {
        progressBar = this.templates['progressBar'];
        progressBar.appendTo(progressBarArea);
    }
    this.progressBar = progressBar;

    this.saveURL = o.saveURL;
    this.finishCallback = o.finishCallback || null;
    this.events = o.events || {};
    this.survey = new Survey(o.instrumentData, o.instrumentState || {});
    this.survey.initState();
    this.currentPageIdx = -1;

    var validateAndGo = function (step) {
        if (self.survey.finished)
            return;

        // TODO: do validation

        var idx = self.currentPageIdx + step;
        var pages = self.survey.pages;
        var total = pages.length;

        while (idx >= 0 && idx < total) {
            if (!pages[idx].skipped) {
                self.renderPage(idx);
                return;
            }

            self.raiseEvent('skipPage', idx);
            idx += step;
        }
        if (step > 0)
            self.finish();
    };

    this.clearQuestions = function () {
        self.questionArea.children().detach();
    }

    this.renderPage = function (pageIdx) {

        if (!self.raiseEvent('pageRendering', pageIdx)) {
            // stop rendering if aborted
            return;
        }

        self.currentPageIdx = pageIdx;
        self.clearQuestions();
        var page = self.survey.pages[pageIdx];

        $.each(page.questions, function (_, question) {
            console.log('question', question);
            self.questionArea.append(
                question.edit( self.templates['question'] )
            );
        });

        self.raiseEvent('pageRendered', pageIdx);
    };

    this.raiseEvent = function(eventName, eventData) {
        console.debug("event '" + eventName + "' (", eventData, ")" );
        if (self.events[eventName])
            return this.events[eventName](eventData);
        return true;
    };

    this.nextPage = function() {
        validateAndGo(1);
    };

    this.prevPage = function() {
        validateAndGo(-1);
    };

    this.save = function() {
        if (!self.raiseEvent('saving')) {
            // stop if aborted
            return;
        }

        // TODO

        self.raiseEvent('saved');
    };

    this.finish = function() {
        if (!self.raiseEvent('finishing')) {
            // stop if aborted
            return;
        }

        self.survey.finish();

        // TODO

        self.raiseEvent('finished');
    };

    this.renderProgressBar = function() {
        // TODO
    };

    this.nextPage();
}

})(jQuery);

// vim: set foldmethod=marker:
