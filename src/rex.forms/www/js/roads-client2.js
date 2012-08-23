(function($) {


// {{{ domains
Domain = function(name) {
    this.name = name;
};

Domain.prototype.render = function() {
    alert('Implement in subclasses');
};

StringDomain = function() {
    Domain.call(this, 'string');
};
StringDomain.prototype.render = function() {
    return $('<textarea></textarea>');
};
StringDomain.prototype = new Domain();
StringDomain.prototype.constructor = Domain;

NumberDomain = function() {
    Domain.call(this, 'number');
};
NumberDomain.prototype.render = function() {
    //TODO: validate numbers
    return $('<input type="text">');
};
NumberDomain.prototype = new Domain();
NumberDomain.prototype.constructor = Domain;

domain = {
    'number': new NumberDomain(),
    'string': new StringDomain()
};

// }}}


Client = function(element, survey, saveUrl, finishCallback) {
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


Survey = function(config, data, paramDomains, paramValues) {
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
        $.each(list, function(item) {
            if(item.type == 'group') {
                var parts = $.grep([skipExpr, item.skipIf], function(item) {
                    return item;
                });

                var newSkipExpr = parts.length == 0 ? '':
                      parts.length == 1 ? parts[0]:
                      '(' + parts[0] + ')|(' + parts[1] + ')';

                    
                group(item.pages, newSkipExpr); 
            }
            else 
                page(item);
        });
    }

    function page(item) {
        var questions = $.map(item.questions, function(question) {
            var question = new Question(question.name, 
                                        question.title 
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


    var expr = {};
    // loop through all pages and questions and extract rexl expressions
    // as following
    // expr['a=1'].push({obj: page, ifTrue: 'skip', ifFalse: 'unskip'})
    // expr['a=1'].push({obj: question, ifTrue: 'disable', ifFalse: 'enable'})
    $.each(this.pages, function(page) {
        if(page.skipExpr) {
            e = expr[page.skipExpr] = expr[page.skipExpr] || [];
            e.push({
                obj: page,
                ifTrue: 'skip',
                ifFalse: 'unskip' 
            });
        }
    });

    $.each(this.questions, function(_, question) {
        if(question.disableExpr) {
            e = expr[question.disableExpr] = expr[question.disableExpr] || [];
            e.push({
                obj: question,
                ifTrue: 'disable',
                ifFalse: 'enable' 
            });
        }

        if(question.validateExpr) {
            e = expr[question.validateExpr] = expr[question.validateExpr] || [];
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
        $.each(parsed.getNames(), function(name) {
            name = name[0];
            self.change[name] = self.change[name] || [];
            self.change[name].push({
                expr: parsed,
                actions: actions
            });
        });
    });

    // bind the change event on each question
    $.each(this.change, function(key, value) {
        $(self.questions[key]).bind('change', function() {
            var result = self.calculate(value),
                methodKey = result ? 'ifTrue':'ifFalse';

            // apply needed method to needed entity
            $.each(value.actions, function(action) {
                var method = action[methodKey];
                action.obj[method]();
            });
        });
    });

    // finally trigger 'change' event on each question
    $.each(this.change, function(key) {
        $(self.questions[key]).trigger('change');
    });
};

Survey.prototype.calculate = function(expr) {
    var self = this;
    return expr.evaluate(function(name) {
        if(self.hasParam(name[0]))
            return self.getRexlParamValue(name[0]);
        var question = self.questions[name[0]];
        if(!question)
            alert("Something very wrong here");
        return question.getRexlValue(name.slice(1, name.length));
    });
};



Page = function(questions, skipExpr) {
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

Question = function(name, title, domain, disableExpr, validateExpr) {
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
};

Question.prototype.getValue = function() {
    return this.value;
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


})(jQuery);

// vim: set foldmethod=marker:
