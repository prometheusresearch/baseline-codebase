(function($) {

function getRandomStr(len) {
    var text = "";
    var possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < len; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

// {{{ domains
var Domain = function(name) {
    this.name = name;
};

Domain.prototype.render = function() {
    alert('Implement in subclasses');
};

var StringDomain = function() {
    Domain.call(this, 'string');
};
StringDomain.prototype.render = function() {
    return $('<textarea></textarea>');
};
StringDomain.prototype = new Domain();
StringDomain.prototype.constructor = Domain;

var NumberDomain = function() {
    Domain.call(this, 'number');
};
NumberDomain.prototype.render = function() {
    //TODO: validate numbers
    return $('<input type="text">');
};
NumberDomain.prototype = new Domain();
NumberDomain.prototype.constructor = Domain;


var EnumDomain = function (variants) {
    Domain.call(this, 'enum');
    this.variants = variants;
};
EnumDomain.prototype.render = function () {
    var html = '';
    var randName = getRandomStr(10);
    // TODO: check for uniqueness of randName
    $(this.variants, function (_, variant) {
        // TODO: do escaping 
        html += '<label>'
                + '<input type="radio" name="' + randName + '" ' 
                                    + 'value="' + variant.code + '">'
                                    + variant.title 
                + '</label>';
    });
    return $(html);
};
EnumDomain.prototype = new Domain();
EnumDomain.prototype.constructor = Domain;

var domain = {
    all: {
        'integer': NumberDomain,
        'float': NumberDomain,
        'string': StringDomain
    },

    get: function(type, options) {
        var cls = this.all[type];
        return new cls(options);
    }
};

// }}}


var Client = function(element, survey, saveUrl, finishCallback) {
    this.element = element;
    this.survey = survey;
    this.saveUrl = saveUrl;
    this.finishCallback = finishCallback;
    this.currentPage = -1;
};

Client.prototype.renderProgressBar = function() {

};

Client.prototype.nextPage = function() {
     
};

Client.prototype.prevPage = function() {
    
};

Client.prototype.save = function() {

};

Client.prototype.finish = function() {

};



var Survey = function(config, data) {
    var self = this;

    // TODO: build flat list of Page objects here 
    // if pages is in group, set group skip logic to each page
    // of this group
    // if page/group in this group has the own skip logic 
    // use += '<higher-level skip logic>' | (!<higher-level skip logic>) & own-skip-logic
    // while building pages list
    // loop through its questions on the each page and to this.questions[id] = question
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
                                        domain.get(question.questionType),
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

Question.prototype.edit = function() {
    if(!this.node) {
        var node = $('<div/>');
        $('<div>').text(title).appendTo(node);
        node.append(domain.render());
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

$.RexFormsClient = function (o) {
    if (!o || !o.config) {
        // TODO: throw an exception
    }

    var survey = new Survey(o.config, o.data || {});
    survey.initState();
    var client = new Client(o.element, survey);
    return client;
}

})(jQuery);

// vim: set foldmethod=marker:
