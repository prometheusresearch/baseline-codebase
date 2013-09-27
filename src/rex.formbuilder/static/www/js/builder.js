
(function ($) {

var builder = $.RexFormBuilder = $.RexFormBuilder || {};

var RexlExpression = function (value) {
    var self = this;
    self.value = null;
    self.parsed = null;
    self.setValue(value);
};
RexlExpression.prototype.setValue = function (value) {
    this.value = value ? value : '';
    this.parsed = this.value ? rexl.parse(this.value) : null;
};
RexlExpression.prototype.getValue = function () {
    return this.value;
};
RexlExpression.prototype.processREXLObject = function (rexlObj, chCount, oldName, newName) {
    var self = this;

    if (rexlObj.type === "IDENTIFIER") {
        if (rexlObj.value === oldName) {
            rexlObj.value = newName;
            ++chCount;
        }
    }
    if (rexlObj.args && rexlObj.args.length) {
        if (rexlObj.type === "OPERATION" &&
            rexlObj.value === "." && rexlObj.args.length > 0) {

            chCount += self.processREXLObject(rexlObj.args[0], chCount,
                                              oldName, newName);
        } else {
            for (var idx in rexlObj.args) {
                chCount += self.processREXLObject(rexlObj.args[idx], chCount,
                                                  oldName, newName);
            }
        }
    }
    return chCount;
};
RexlExpression.prototype.renameIdentifier = function (oldName, newName) {
    var chCounter = 0;
    if (this.parsed) {
        if (chCounter = this.processREXLObject(this.parsed, 0,
                                               oldName, newName)) {
            this.setValue(this.parsed.toString());
        }
    }
    return chCounter;
};

var Question = function (def, templates) {
    var self = this;
    this.type = def.type;
    this.name = def.name;
    this.title = def.title;
    this.templates = templates;
    // this.hint = def.hint || null;
    this.help = def.help || null;
    this.customTitles = def.customTitles || {};
    this.required = def.required || false;
    this.slave = def.slave || false;
    this.annotation = def.annotation || false;
    this.explanation = def.explanation || false;
    this.slave = def.slave || false;
    this.disableIf = new RexlExpression(def.disableIf);
    this.hideIf = new RexlExpression(def.hideIf);
    this.constraints = new RexlExpression(def.constraints);
    this.annotation = def.annotation || null;
    this.explanation = def.explanation || null;

    this.remove = function () {
        self.node.trigger("rb:remove");
        self.node.remove();
    };

    this.duplicate = function () {
        self.node.trigger("rb:duplicate");
    };

    this.getNode = function () {
        if (!self.node) {
            self.node = this.templates.create('question');
            self.node.data('owner', this);
            self.node.find('.rb-question-remove:first').click(function (event) {
                event.stopPropagation();
                if (confirm("Are you sure you want to remove this item?"))
                    self.remove();
            });
            self.node.find('.rb-question-duplicate:first').click(function (event) {
                event.stopPropagation();
                self.duplicate();
            });
            self.updateNode();
        }
        return self.node;
    };

    this.updateNode = function() {
        if (self.node) {
            var title = builder.truncateText(self.title || '', 100);
            self.node.find('.rb-question-title').text(title);
            self.node.find('.rb-question-name').text(self.name);
            self.node.find('.rb-question-descr').text(self.description())
        }
    };
};
Question.prototype.description = function () {
    return builder.questionTypes[this.type].title;
};
Question.prototype.getDef = function () {
    var def = {
        type: this.type,
        name: this.name,
        title: this.title,
        required: this.required,
        slave: this.slave,
    };
    if (this.help)
        def.help = this.help;
    if (!builder.isEmpty(this.customTitles))
        def.customTitles = $.extend(true, {}, this.customTitles);
    if (this.slave)
        def.slave = this.slave;
    if (this.disableIf.value)
        def.disableIf = this.disableIf.value;
    if (this.hideIf.value)
        def.hideIf = this.hideIf.value;
    if (this.constraints.value)
        def.constraints = this.constraints.value;
    if (this.annotation)
        def.annotation = this.annotation;
    if (this.explanation)
        def.explanation = this.explanation;
    return def;
};
Question.prototype.renameIdentifier = function (oldName, newName) {
    this.constraints.renameIdentifier(oldName, newName);
    this.disableIf.renameIdentifier(oldName, newName);
    this.hideIf.renameIdentifier(oldName, newName);
};

var VariantQuestion = function (def, templates) {
    Question.call(this, def, templates);
    this.dropDown = def.dropDown || false;
    this.answers = def.answers || [];
};
builder.extend(VariantQuestion, Question);
VariantQuestion.prototype.description = function () {
    var self = this;
    var titles = [];
    var titles = $.map(self.answers, function(answer, _) {
        return answer.title || answer.code;
    });
    return titles.join(', ');
};
VariantQuestion.prototype.getDef = function () {
    var def = Question.prototype.getDef.call(this);
    if (this.dropDown)
        def.dropDown = this.dropDown;
    def.answers = $.extend(true, [], this.answers);
    return def;
}

var RepeatingGroupQuestion = function (def, templates) {
    Question.call(this, def, templates);
    var self = this;
    this.group = [];
    $.each(def.repeatingGroup, function (_, questionDef) {
        var question = builder.createQuestion(questionDef, templates);
        self.group.push(question);
    });
};
builder.extend(RepeatingGroupQuestion, Question);
RepeatingGroupQuestion.prototype.getDef = function () {
    var def = Question.prototype.getDef.call(this);
    def.repeatingGroup = [];
    $.each(this.group, function (_, question) {
        def.repeatingGroup.push(question.getDef());
    });
    return def;
};
RepeatingGroupQuestion.prototype.renameIdentifier = function (oldName, newName) {
    var hasSameIdentifier = false;
    $.each(this.group, function (_, question) {
        if (question.name === oldName)
            hasSameIdentifier = true;
    });
    if (!hasSameIdentifier) {
        $.each(this.group, function (_, question) {
            question.renameIdentifier(oldName, newName);
        });
    }
};

var Page = function (o) {
    var self = this;
    this.parent = null;
    this.selected = false;
    this.current = false;
	this.receiver = false;
    this.questions = [];
    this.templates = o.templates;
    this.onSelectPage = o.onSelectPage || null;
    this.beforeChange = o.beforeChange;
    this.node = this.createNode();
    this.node.data('owner', this);
    $.each(o.def.questions || [], function (_, questionDef) {
        var question = builder.createQuestion(questionDef, self.templates);
        self.questions.push(question);
    });
    this.setTitle(o.def.title || null);
    this.updateDescription();
    this.cId = o.def.cId || null;
    this.createSkipIf(o.def.skipIf || null);
    this.bindEvents();
    // this.updateHighlight();
};
Page.prototype.getCutoff = function () {
    var cutoff = [this];
    var level = this;
    while (level.parent) {
        cutoff.unshift(level.parent);
        level = level.parent;
    }
    return cutoff;
};
Page.prototype.setCurrent = function (state) {
    this.current = state ? true : false;
    this.updateHighlight();
};
Page.prototype.setSelected = function (state) {
    this.current = state ? true : false;
    this.updateHighlight();
};
Page.prototype.setReceiver = function (state) {
	this.receiver = state ? true: false;
	this.updateHighlight();
}
Page.prototype.updateHighlight = function () {
    if (this.node) {
        if (this.current || this.selected)
            this.node.addClass('rb-highlighted');
        else
            this.node.removeClass('rb-highlighted');
		if (this.receiver)
			this.node.addClass('rb-receiver');
		else
			this.node.removeClass('rb-receiver');
    }
};
Page.prototype.createSkipIf = function (value) {
    this.skipIf = new RexlExpression(value);
};
Page.prototype.bindEvents = function () {
    var self = this;
    self.node.click(function (event) {
        if (self.onSelectPage)
            self.onSelectPage(self, event.shiftKey);
    });
    self.node.find("> div").droppable({
		accept: "#rb_question_list > .rb-question",
		drop: function (event, ui) {
			self.setReceiver(false);
			var node = ui.draggable;
			if (node.hasClass('rb-question')) {
				var question = node.data('owner');
				if (self.questions.indexOf(question) == -1) {
                    builder.pageEditor.removeNodeEvents(question.node);
					question.node.detach();
					self.questions.push(question);
                    self.updateDescription();
					builder.pageEditor.rearrange();
				}
			}
		},
		over: function (event, ui) {
			self.setReceiver(true);
		},
		out: function (event, ui) {
			self.setReceiver(false);
		},
        tolerance: 'pointer'
    });
    self.node.find('.rb-page-add-next:first').click(function () {
        if (!self.beforeChange())
            return;
        var page = new Page({
            def: {
                type: "page",
                title: null,
                questions: [],
                cId: builder.getCId('page')
            },
            beforeChange: self.beforeChange,
            onSelectPage: self.onSelectPage,
            templates: self.templates
        });
        self.parent.append(page, self);
        page.node[0].scrollIntoView();
        self.onSelectPage(page);
    });
    self.node.find('.rb-page-remove:first').click(function () {
        if (confirm("Are you sure you want to remove this item?"))
            self.remove();
    });
};
Page.prototype.updateDescription = function () {
    var descriptionNode = this.node.find('.rb-page-description:first');
    descriptionNode.contents().remove();
    var total = this.questions.length;
    if (total) {
        var text = 'Question "' + builder.truncateText(this.questions[0].title, 40) + '"';
        descriptionNode.text(text);
        if (total > 1) {
            var other = total - 1;
            descriptionNode.append('<br><span class="rb-dark-text">and ' + other + ' other question' + (other > 1 ? 's': '') + '</span>');
        }
    }
};
Page.prototype.setTitle = function (title) {
    this.title = title;
    var titleNode = this.node.find('.rb-page-title:first');
    var text;
    if (this.title) {
        text = builder.truncateText(this.title, 30);
        titleNode.text(text);
        titleNode.removeClass('rb-not-set');
    } else {
        titleNode.text('Untitled page');
        titleNode.addClass('rb-not-set');
    }
};
Page.prototype.createNode = function () {
    return this.templates.create('page');
};
Page.prototype.setSkipIf = function (skipIf) {
    this.skipIf.setValue(skipIf);
};
Page.prototype.remove = function () {
    this.parent.exclude(this);
    this.node.remove();
};
Page.prototype.getDef = function () {
    var def = {
        type: 'page',
        questions: []
    };
    if (this.skipIf.value)
        def.skipIf = this.skipIf.value;
    if (this.cId)
        def.cId = this.cId;
    if (this.title)
        def.title = this.title;
    $.each(this.questions, function (_, question) {
        def.questions.push(question.getDef());
    });
    return def;
};
Page.prototype.findQuestion = function (identifier, except) {
    var found = null;
    $.each(this.questions, function (_, question) {
        if (!found &&
            question.name === identifier &&
            question !== except)
            found = question;
    });
    return found;
};
Page.prototype.findQuestionsByRegExp = function (regExp) {
    var found = [];
    $.each(this.questions, function (_, question) {
        if (regExp.test(question.name)) {
            found.push(question);
        }
    });
    return found;
};
Page.prototype.renameIdentifier = function (oldName, newName) {
    this.skipIf.renameIdentifier(oldName, newName);
    $.each(this.questions, function (_, question) {
        question.renameIdentifier(oldName, newName);
    });
};

var PageContainer = function (pageList, pageDefs, onSelectPage, beforeChange) {
    var self = this;
    this.pages = [];
    this.pageList = pageList;
    this.pageList.data('owner', this);
    this.pageList.sortable({
        cursor: 'move',
        toleranceElement: '> div',
        connectWith: '.rb-page-list',
        stop: function (event, ui) {
            var element = ui.item.data('owner');
            var receiverNode = ui.item.parent();
            var receiver = receiverNode.data('owner');
            if (element.parent !== receiver)
                element.parent.exclude(element);
            receiver.rearrange();
        }
    });
    $.each(pageDefs, function (_, def) {
        var page;
        var opts = {
            templates: self.templates,
            onSelectPage: onSelectPage,
            beforeChange: beforeChange,
            def: def
        };
        if (def.type == "group")
            page = new Group(opts);
        else
            page = new Page(opts);
        self.append(page);
    });
    this.onSelectPage = onSelectPage;
    this.beforeChange = beforeChange;
};
PageContainer.prototype.append = function (page, after) {
    if (after) {
        var idx = this.pages.indexOf(after);
        this.pages.splice(idx + 1, 0, page);
        after.node.after(page.node);
    } else {
        this.pages.push(page);
        this.pageList.append(page.node);
    }
    page.parent = this;
};
PageContainer.prototype.exclude = function (page) {
    var idx = this.pages.indexOf(page);
    this.pages.splice(idx, 1);
};
PageContainer.prototype.rearrange = function () {
    var self = this;
    self.pages = [];
    self.pageList.children().each(function (_, item) {
        item = $(item);
        var itemOwner = item.data('owner');
        self.pages.push(itemOwner);
    });
    // console.log('result of rearrange:', self.pages);
};
PageContainer.prototype.createEmptyPage = function () {
    return new Page({
        def: {
            type: "page",
            title: null,
            questions: [],
            cId: builder.getCId('page')
        },
        beforeChange: this.beforeChange,
        onSelectPage: this.onSelectPage,
        templates: this.templates
    });
};
PageContainer.prototype.createEmptyGroup = function () {
    return new Group({
        def: {
            type: "group",
            title: null,
            pages: [],
            cId: builder.getCId('group')
        },
        onSelectPage: this.onSelectPage,
        beforeChange: this.beforeChange,
        templates: this.templates
    });
}
PageContainer.prototype.findPagesBetween = function (context) {
    if (!context.found)
        context.found = [];
    $.each(this.pages, function (_, page) {
        if (context.bounds.length) {
            if (page instanceof Group)
                page.findPagesBetween(context);
            else {
                if (context.include) {
                    context.found.push(page);
                }
                if (context.bounds.indexOf(page) != -1) {
                    if (!context.include) {
                        context.include = true;
                        context.found.push(page);
                    }
                    context.bounds = builder.removeFromArray(page, context.bounds);
                }
            }
        }
    });
    return context.found;
};


var Group = function (o) {
    var self = this;
    Page.call(this, o);
    PageContainer.call(this, self.node.find('.rb-page-list:first'),
                        o.def.pages || [], o.onSelectPage, o.beforeChange);
};
builder.extend(Group, Page);
builder.extend(Group, PageContainer);
Group.prototype.createSkipIf = function (value) {
    this.skipIf = new EditableLogic({
        nodeText: this.node.find('.rb-group-skip-if:first'),
        nodeBtn: this.node.find('.rb-group-skip-if-change:first'),
        value: value,
        maxVisibleTextLen: 30,
        emptyValueText: 'Never skipped'
    });
};
Group.prototype.createNode = function () {
    return this.templates.create('group');
};
Group.prototype.updateDescription = function () {

};
Group.prototype.setTitle = function (title) {
    this.title = title;
    var titleNode = this.node.find('.rb-group-title:first');
    if (this.title) {
        var text = builder.truncateText(this.title, 30);
        titleNode.text(text);
        titleNode.removeClass('rb-not-set');
    } else {
        titleNode.text('Untitled group');
        titleNode.addClass('rb-not-set');
    }
};
Group.prototype.bindEvents = function () {
    var self = this;
    self.node.find('.rb-group-remove:first').click(function () {
        builder.askDialog.open({
            title: 'Please confirm',
            question: 'Are you sure you want to remove this group?',
            answers: [ 'Yes, but save its contents', 'Yes', 'No' ],
            onAnswer: function (answer) {
                if (answer !== 'No') {
                    var saveContents = (answer === 'Yes, but save its contents');
                    self.remove(saveContents);
                }
            }
        });
    });
    self.node.find('.rb-group-title:first')
        .add(self.node.find('.rb-group-title-change:first'))
            .click(function () {
                builder.promptDialog.open({
                    title: 'Edit Group Title',
                    question: 'Please provide a new group title:',
                    initialValue: self.title,
                    onSet: function (newValue) {
                        self.setTitle(newValue);
                    }
                })
            });
};
Group.prototype.getDef = function () {
    var def = Page.prototype.getDef.call(this);
    def.type = 'group';
    def.pages = [];
    if (def['questions'])
        delete def['questions'];
    $.each(this.pages, function (_, page) {
        def.pages.push(page.getDef());
    });
    return def;
};
Group.prototype.findQuestion = function (identifier, except) {
    var found = null;
    $.each(this.pages, function (_, page) {
        if (!found)
            found = page.findQuestion(identifier, except);
    });
    return found;
};
Group.prototype.findQuestionsByRegExp = function (regExp) {
    var found = [];
    $.each(this.pages, function (_, page) {
        found = found.concat(page.findQuestionsByRegExp(regExp));
    });
    return found;
};
Group.prototype.renameIdentifier = function (oldName, newName) {
    Page.prototype.renameIdentifier.call(this, oldName, newName);
    $.each(this.pages, function (_, page) {
        page.renameIdentifier(oldName, newName);
    });
};
Group.prototype.remove = function (saveContents) {
    var self = this;
    var parent = self.parent;
    if (saveContents) {
        $.each(this.pages, function (_, item) {
            item.parent = parent;
            // console.log('owner', item.node.data('owner'));
            self.node.before(item.node);
        });
    }
    parent.exclude(this);
    this.node.remove();
    parent.rearrange();
};

(function () {
    var scripts = document.getElementsByTagName( 'script' );
    var thisScriptTag = $(scripts[ scripts.length - 1 ]);
    builder.basePrefix =
        thisScriptTag.attr('data-prefix') || '';
    builder.formsPrefix =
        thisScriptTag.attr('data-forms-prefix') || '';
})();

builder.questionTypes = {
    'integer': { 
        title: 'Integer',
        cls: Question
    },
    'float': { 
        title: 'Float',
        cls: Question
    },
    'enum': { 
        title: 'One-choice List',
        cls: VariantQuestion
    },
    'set': { 
        title: 'Multi-select List',
        cls: VariantQuestion
    },
    'string': { 
        title: 'Text String',
        cls: Question
    },
    'text': { 
        title: 'Text',
        cls: Question
    },
    'date': { 
        title: 'Date',
        cls: Question
    },
    'weight': {
        title: 'Weight',
        cls: Question
    },
    'time_week': { 
        title: 'Time (weeks)',
        cls: Question
    },
    'time_month': { 
        title: 'Time (month)',
        cls: Question
    },
    'time_hours': { 
        title: 'Time (hours)',
        cls: Question
    },
    'time_minutes': { 
        title: 'Time (minutes)',
        cls: Question
    },
    'time_days': { 
        title: 'Time (days)',
        cls: Question
    },
    'rep_group': { 
        title: 'Repeating Group of Questions',
        cls: RepeatingGroupQuestion
    }
};
builder.createQuestion = function (def, templates) {
    var cls = builder.questionTypes[def.type].cls;
    return new cls(def, templates);
};
builder.copyQuestion = function (question) {
    return builder.createQuestion(question.getDef(), question.templates);
};

$.RexFormBuilder.predefinedLists = {};

var Templates = function () {
    var self = this;
    var templates = {
        'questionEditor': $('#tpl_question_editor').removeAttr('id'),
        'variant': $('#tpl_variant').removeAttr('id'),
        'question': $('#tpl_question').removeAttr('id'),
        'page': $('#tpl_page').removeAttr('id'),
        'group': $('#tpl_page_group').removeAttr('id'),
        'parameter': $('#tpl_parameter').removeAttr('id'),
        'customTitle': $('#tpl_custom_title').removeAttr('id'),
		'dragHelper': $('#tpl_drag_helper').removeAttr('id')
    };

    var selectQType = $('select[name="question-type"]',
                                templates['questionEditor']);
    if (selectQType) {
        for (type in builder.questionTypes) {
            var title = builder.questionTypes[type].title;
            selectQType.append($('<option value="' + type
                                    + '"></option>').text(title));
        }
    }

    this.get = function (tplName) {
        if (templates[tplName])
            return templates[tplName];
        return null;
    }

    this.create = function (tplName) {
        return self.get(tplName).clone();
    }
};

var Context = function (name, manualEditConditions, urlStartTest,
                        urlSaveForm, urlPublishForm, urlMeasureTypes) {
    this.instrumentName = name;
    this.manualEditCondtions = manualEditConditions;
    this.urlStartTest = urlStartTest;
    this.urlSaveForm = urlSaveForm;
    this.urlPublishForm = urlPublishForm;
    this.urlMeasureTypes = urlMeasureTypes;
};

var Pages = function (o) {
    var self = this;
    this.selection = [];
    this.templates = o.templates;
    this.addPageButton = o.addPageButton;
    this.makeGroupButton = o.makeGroupButton;
    this.beforeChange = o.beforeChange;
    PageContainer.call(this, o.pageList, o.pages, o.onSelectPage, o.beforeChange);
    this.addPageButton.click(function () {
        if (!self.beforeChange())
            return;
        var page = self.createEmptyPage();
        self.append(page);
        page.node[0].scrollIntoView();
        o.onSelectPage(page);
    });
    this.makeGroupButton.click(function () {
        self.groupFromSelection();
    });
    this.updateGroupButton();
};
builder.extend(Pages, PageContainer);
Pages.prototype.getDef = function () {
    var self = this;
    var def = [];
    $.each(self.pages, function (_, page) {
        def.push(page.getDef());
    });
    return def;
};
Pages.prototype.findQuestion = function (identifier, except) {
    var question = null;
    $.each(this.pages, function (_, page) {
        if (!question)
            question = page.findQuestion(identifier, except);
    });
    return question;
};
Pages.prototype.findQuestionsByRegExp = function (regExp) {
    var found = [];
    $.each(this.pages, function (_, page) {
        found = found.concat(page.findQuestionsByRegExp(regExp));
    });
    return found;
};
Pages.prototype.updateGroupButton = function () {
    if (this.selection.length)
        this.makeGroupButton.removeAttr('disabled');
    else
        this.makeGroupButton.attr('disabled', 'disabled');
};
Pages.prototype.setSelection = function (selection) {
    $.each(this.selection, function (_, page) {
        page.setSelected(false);
    });
    this.selection = selection;
    $.each(this.selection, function (_, page) {
        page.setSelected(true);
    });
    this.updateGroupButton();
};
Pages.prototype.addToSelection = function (page) {
    var total = this.selection.length;
    if (total) {
        var bounds = [this.selection[0]];
        if (total > 1)
            bounds.push(this.selection[total - 1]);
        bounds.push(page);
        bounds = builder.removeDuplicates(bounds);
        this.setSelection(this.findPagesBetween({
            bounds: bounds
        }));
    } else
        this.setSelection([page]);
};
Pages.prototype.groupFromSelection = function () {
    var self = this;
    if (!self.beforeChange())
        return;
    // var cutoff = self.selection[0].getCutoff();
    if (self.selection.length == 0)
        return;
    else if (self.selection.length > 1) {
        var first = self.selection[0];
        var firstSiblings = first.parent.pages;
        var last = self.selection[self.selection.length - 1];
        var lastSiblings = last.parent.pages;
        var first = {
            siblingBefore: (firstSiblings[0] != first),
            siblingAfter: (firstSiblings[firstSiblings.length - 1] != first),
            cutoff: first.getCutoff()
        };
        var last = {
            siblingBefore: (lastSiblings[0] != last),

            siblingAfter: (lastSiblings[lastSiblings.length - 1] != last),
            cutoff: last.getCutoff()
        };
        var common = builder.interceptArrays(first.cutoff, last.cutoff);
        var commonNearestParent = common[common.length - 1];
        var canCreateGroup = true;
        var startFrom = common.indexOf(commonNearestParent) + 1;
        if (first.parent != commonNearestParent) {
            for (var i = startFrom; i < first.cutoff.length - 1; i++) {
                var current = first.cutoff[i];
                var next = first.cutoff[i + 1];
                if (current.pages[0] != next) {
                    canCreateGroup = false;
                    break;
                }
            }
        }
        if (canCreateGroup && last.parent != commonNearestParent) {
            for (var i = startFrom; i < last.cutoff.length - 1; i++) {
                var current = last.cutoff[i];
                var next = last.cutoff[i + 1];
                if (current.pages[current.pages.length - 1] != next) {
                    canCreateGroup = false;
                    break;
                }
            }
        }

        if (!canCreateGroup) {
            alert("Can't create a group from the current selection!");
            return;
        }
        var group = self.createEmptyGroup();
        var beforeElement = first.cutoff[startFrom];
        beforeElement.parent.append(group);
        beforeElement.node.before(group.node);
        $.each(self.selection, function (_, page) {
            var item = page.getCutoff()[startFrom];
            group.append(item);
        });
        commonNearestParent.rearrange();
    } else {
        var group = self.createEmptyGroup();
        var page = this.selection[0];
        var parent = page.parent;
        parent.append(group);
        page.node.before(group.node);
        group.append(page);
        parent.rearrange();
    }
    self.setSelection([]);
};

var InputParameter = function (def, parent, template, /* extParamTypes, */ onRemove) {
    var self = this;
    self.parent = parent;
    self.node = template.clone();
    var removeBtn = self.node.find('a.rb-param-remove');
    var editBtn = self.node.find('a.rb-param-edit');
    removeBtn.click(function () {
        self.parent.exclude(self);
        self.node.remove();
    });
    editBtn.click(function () {
        builder.editParamDialog.open({
            paramName: self.name,
            paramType: self.type,
            onChange: function (newName, newType) {
                if (builder.inputParameters.updateParameter(self, newName,
                                                            newType)) {
                    var oldName = self.name;
                    /*
                    if (oldName !== newName)
                        $.RexFormBuilder.renameREXLIdentifiers(oldName, newName);
                    */
                }
            }
        });
    });
    this.remove = function () {
        self.node.remove();
    };
    this.update = function (name, type) {
        self.name = name;
        self.type = type;
        self.node.find('.rb-param-name').text(self.name);
        var typeTitle = builder.paramTypeTitle(self.type);
        self.node.find('.rb-param-type').text(typeTitle);
    };
    this.getDef = function () {
        return {
            type: self.type,
            name: self.name
        };
    };
    this.setTestValue = function (value) {
        self.testValue = value;
    };
    this.getTestValue = function () {
        return self.testValue;
    };

    this.setTestValue(null);
    this.update(def.name, def.type);
};

var InputParameters = function (o) {
    var self = this;
    self.parameters = [];
    self.template = o.template;
    self.listNode = o.listNode;
    self.addButton = o.addButton;
    // self.extParamTypes = o.extParamTypes || {};

    this.sort = function() {
        self.parameters.sort(function (a, b) {
            if (a.name === b.name)
                return 0;
            return (a.name < b.name) ? -1: 1;
        });
        $.each(self.parameters, function (_, parameter) {
            self.listNode.append(parameter.node);
        });
    };
    this.find = function (name, except) {
        var found = null;
        $.each(self.parameters, function(_, parameter) {
            if (!found &&
                parameter.name === name &&
                parameter !== except)
                found = parameter;
        });
        return found;
    };
    this.findByRegExp = function (regExp) {
        var found = [];
        $.each(self.parameters, function (_, parameter) {
            if (regExp.test(parameter.name))
                found.push(parameter);
        });
        return found;
    };
    this.isUnique = function (name, except) {
        return (self.find(name, except) === null);
    };
    this.exclude = function (parameter) {
        var idx = self.parameters.indexOf(parameter);
        self.parameters.splice(idx, 1);
        parameter.node.detach();
    };
    this.add = function (paramDef) {
        if (!self.isUnique(paramDef.name)) {
            alert("Could not add parameter '" + paramDef.name
                    + "': parameter already exists");
            return;
        }
        var parameter = new InputParameter(paramDef, self, self.template /*,
                               self.extParamTypes */);
        self.parameters.push(parameter);
        self.sort(); // also it will auto-append new parameter to the list node
    };
    this.getDef = function () {
        var def = [];
        $.each(self.parameters, function (_, parameter) {
            def.push(parameter.getDef());
        });
        return def;
    };
    this.updateParameter = function (parameter, newName, newType) {
        if (!self.isUnique(newName, parameter)) {
            alert("Could not change parameter: parameter '" + newName
                    + "' already exists");
            return;
        };
        parameter.update(newName, newType);
    };

    $.each(o.parameters, function (_, paramDef) {
        self.add(paramDef);
    });

    self.addButton.click(function () {
        builder.editParamDialog.open({
            onChange: function (newName, newType) {
                var paramDef = {
                    name: newName,
                    type: newType
                };
                builder.inputParameters.add(paramDef);
            }
        });
    });
};

var EditableLogic = function (o) {
    var self = this;
    RexlExpression.call(this, null);
    this.nodeText = o.nodeText;
    this.nodeBtn = o.nodeBtn;
    this.maxVisibleTextLen = o.maxVisibleTextLen || 30;
    this.emptyValueText = o.emptyValueText || 'Not set';
    this.onChange = o.onChange || null;
    this.beforeOpen = o.beforeOpen || null;
    this.getDefaultIdentifier = o.getDefaultIdentifier || null;
    this.onSearchId = o.onSearchId || null;
    this.onDescribeId = o.onDescribeId || null;
    this.nodeBtn.click(function () {
        self.openEditor();
    });
    this.setValue(o.value);
};
builder.extend(EditableLogic, RexlExpression);
EditableLogic.prototype.setValue = function (value, internal) {
    RexlExpression.prototype.setValue.call(this, value);
    if (!internal && this.nodeText) {
        if (this.value) {
            var text = builder.truncateText(this.value,
                                            this.maxVisibleTextLen);
            this.nodeText.text(text)
                         .removeClass('rb-not-set');
        } else
            this.nodeText.text(this.emptyValueText)
                         .addClass('rb-not-set');
    }
};
EditableLogic.prototype.openEditor = function () {
    var self = this;
    if (this.beforeOpen && !this.beforeOpen())
        return;
    builder.conditionEditor.open({
        callback: function (newValue) {
            self.setValue(newValue);
            if (self.onChange)
                self.onChange(newValue);
        },
        getDefaultIdentifier: this.getDefaultIdentifier || null,
        conditions: self.value,
        onSearchId: self.onSearchId,
        onDescribeId: self.onDescribeId
    });
};

var EditableTitle = function (o) {
    var self = this;
    self.value = null;
    self.nodeText = o.nodeText;
    self.nodeBtn = o.nodeBtn;
    self.nodeInput = o.nodeInput;
    self.maxVisibleTextLen = o.maxVisibleTextLen || 30;
    self.emptyTitleText = o.emptyTitleText || 'Untitled';
    self.onChange = o.onChange || null;

    self.setTitle = function (title, internal) {
        self.value = title ? title : '';
        if (self.onChange)
            self.onChange(self.value);
        if (!internal) {
            if (self.value) {
                var text = builder.truncateText(self.value, 
                                                self.maxVisibleTextLen);
                self.nodeText.text(text)
                             .removeClass('rb-not-set');
            } else
                self.nodeText.text(self.emptyTitleText)
                             .addClass('rb-not-set');
            self.nodeInput.val(self.value);
        }
    };

    self.getTitle = function () {
        return self.value;
    };

    self.showEditor = function () {
        self.nodeInput.css('display', '');
        self.nodeBtn.add(self.nodeText).css('display', 'none');
        self.nodeInput.focus().select();
    };

    self.closeEditor = function () {
        self.nodeInput.css('display', 'none');
        self.nodeBtn.add(self.nodeText).css('display', '');
    };

    self.nodeInput.css('display', 'none');
    self.nodeInput.change(function () {
        var val = self.nodeInput.val();
        self.setTitle(val);
        // self.closeEditor();
    });
    self.nodeInput.focusout(function () {
        self.closeEditor();
    });
    self.nodeInput.keyup(function (e) {
        switch(e.keyCode) {
        case 27: // esc
            self.nodeInput.val(self.value);
        case 13: // enter
            self.closeEditor();
            break;
        }
    });
    self.nodeBtn.click(self.showEditor);
    self.nodeText.click(self.showEditor);
    self.setTitle(o.title || null);
    self.closeEditor();
};

builder.customTitleTypes = {
    'removeRecord': 'Remove Group of Answers',
    'addRecord': 'Add Group of Answers'
};

var CustomTitle = function (type, text, parent, templates) {
    var self = this;
    self.type = null;
    self.text = null;
    self.parent = parent;
    self.node = templates.create('customTitle');

    self.nodeFor = self.node.find('.rb-custom-title-for:first');
    self.nodeText = self.node.find('.rb-custom-title-text:first');
    self.nodeEdit = self.node.find('.rb-custom-title-edit:first');
    self.nodeRemove = self.node.find('.rb-custom-title-remove:first');

    self.nodeEdit.click(function () {
        builder.customTitleDialog.open({
            initialType: self.type,
            initialText: self.text,
            validate: function (type, text) {
                if (!text)
                    return false;
                return self.parent.isUnique(type, self);
            },
            onSet: function (newType, newText) {
                self.setText(newText);
                self.setType(newType);
                self.parent.sort();
            }
        });
    });

    self.nodeRemove.click(function () {
        self.remove();
    });

    self.setText = function (text) {
        self.text = text;
        self.nodeText.text(self.text);
    };
    self.setType = function (type) {
        self.type = type;
        self.nodeFor.text(builder.customTitleTypes[self.type]);
    };
    self.remove = function (type) {
        self.parent.exclude(self);
        self.node.remove();
    };

    self.setType(type);
    self.setText(text);
};

var CustomTitleEditor = function (o) {
    var self = this;
    self.titles = [];
    self.node = o.node;
    self.nodeList = self.node.find(".rb-custom-titles:first");
    self.nodeAddButton = self.node.find(".rb-custom-title-add:first");
    self.templates = o.templates;

    self.nodeAddButton.click(function () {
        builder.customTitleDialog.open({
            validate: function (type, text) {
                if (!text)
                    return false;
                return self.isUnique(type);
            },
            onSet: function (newType, newText) {
                self.add(newType, newText)
            }
        });
    });

    self.exclude = function (item) {
        var idx = self.titles.indexOf(item);
        self.titles.splice(idx, 1);
    };
    self.sort = function() {
        self.titles.sort(function (a, b) {
            var a = builder.customTitleTypes[a.type];
            var b = builder.customTitleTypes[b.type];
            if (a === b)
                return 0;
            return (a < b) ? -1: 1;
        });
        $.each(self.titles, function (_, title) {
            self.nodeList.append(title.node);
        });
    };
    self.isUnique = function (type, except) {
        var isUnique = true;
        $.each(self.titles, function(_, title) {
            if (title.type === type && title !== except)
                isUnique = false;
        });
        return isUnique;
    };
    self.add = function (type, text) {
        var title = new CustomTitle(type, text, self, self.templates);
        self.titles.push(title);
        self.sort(); // it will also append the new title to the list node
    };
    self.getDef = function () {
        var def = {};
        $.each(self.titles, function (_, title) {
            def[title.type] = title.text;
        });
        return def;
    };

    $.each(o.customTitles, function (type, text) {
        self.add(type, text);
    });
};

var Variant = function (code, title, separator, parent, templates) {
    var self = this;
    self.title = title;
    self.code = code;
    self.node = templates.create('variant');
    self.node.data('owner', this);
    self.parent = parent;
    self.autoGenerateId = !code;
    self.separator = '_'; // default
    self.illegalIdChars = builder.illegalIdChars;

    var inputCode = self.node.find('input[name=answer-code]:first');
    var inputTitle = self.node.find('input[name=answer-title]:first');
    var removeButton = self.node.find('.rb-variant-remove:first');

    self.getDef = function () {
        if (!self.code) {
            if (!self.title)
                return null;
            // console.log('self', self);
            throw new builder.ValidationError("Answer code could not empty", self);
        }
        return {
            code: self.code,
            title: self.title
        };
    }
    self.remove = function () {
        self.parent.exclude(self);
        self.node.remove();
    };
    self.setSeparator = function (separator) {
        var previous = self.separator;
        if (previous === separator)
            return;
        self.illegalIdChars = builder.getIllegalIdChars(separator);
        self.separator = separator;
        if (self.code) {
            self.code = self.code.replace(previous, self.separator);
            inputCode.val(self.code);
        }
    };

    removeButton.click(function () {
        self.remove();
    });

    inputTitle.val(self.title || '');
    inputTitle.change(function () {
        self.title = $.trim(inputTitle.val());
        if (self.autoGenerateId) {
            var code = builder.getReadableId(self.title, false, self.separator, 45);
            inputCode.val(code);
            self.code = code;
        }
    });

    var fixInputAnswerIdentifier = function (input) {
        var val = input.val();
        var newVal = val.replace(self.illegalIdChars, '');
        if (newVal !== val)
            input.val( newVal );
    };

    self.setSeparator(separator);
    inputCode.val(self.code || '');
    inputCode.keyup(function () {
        fixInputAnswerIdentifier( inputCode );
    });
    inputCode.change(function () {
        self.autoGenerateId = false;
        fixInputAnswerIdentifier( inputCode );
        var val = $.trim(inputCode.val());
        self.code = val;
    });
};

var VariantsEditor = function (o) {
    var self = this;
    var node = o.node;
    var parent = o.parent;
    var nodeHeader = node.find(".rb-question-answers-header:first");
    var nodeList = node.find(".rb-question-answers-list:first");
    var nodeAddButton = node.find(".rb-question-answers-add:first");
    var nodeHint = node.find(".rb-question-answers-list-hint:first");
    self.variants = [];

    nodeList.sortable({
        cursor: 'move',
        toleranceElement: '> div',
        stop: function (event, ui) {
            self.rearrange();
        }
    });

    self.show = function () {
        node.css('display', '');
    };
    self.hide = function () {
        node.css('display', 'none');
    };
    self.updateHelpers = function () {
        var empty = (self.variants.length == 0);
        nodeHeader.css('display', empty ? 'none': '');
        nodeHint.css('display', empty ? '': 'none');
    };
    self.rearrange = function () {
        self.variants = [];
        nodeList.children().each(function (_, item) {
            var item = $(item);
            var owner = item.data('owner');
            self.variants.push(owner);
        });
    };
    self.exclude = function (variant) {
        var idx = self.variants.indexOf(variant);
        self.variants.splice(idx, 1);
        self.updateHelpers();
    };
    self.setSeparator = function (separator) {
        self.separator = separator;
        $.each(self.variants, function (_, variant) {
            variant.setSeparator(separator);
        });
    };
    self.add = function (code, title) {
        var variant = new Variant(code, title, self.separator, self, o.templates);
        self.variants.push(variant);
        nodeList.append(variant.node);
        self.updateHelpers();
    };
    self.getDef = function (code, title) {
        var def = [];
        var busyCodes = {};
        $.each(self.variants, function (_, variant) {
            var answerDef = variant.getDef();
            if (answerDef) {
                if (busyCodes[answerDef.code])
                    throw new builder.ValidationError(
                        "There are duplicated answer variants", self.parent);
                busyCodes[answerDef.code] = true;
                def.push(answerDef);
            }
        });
        if (builder.isEmpty(def))
            throw new builder.ValidationError(
                "At least one answer variant should exist", self.parent);
        return def;
    };
    nodeAddButton.click(function () {
        self.add(null, null);
    });
    self.setSeparator(o.separator);
    $.each(o.answers, function (_, answer) {
        self.add(answer.code, answer.title);
    });
    self.updateHelpers();
};

var QuestionContainer = function (o) {
    var self = this;
    self.editor = null;
    self.questions = [];
    self.listNode = o.listNode;
    self.templates = o.templates;
    self.listNode.sortable({
        cursor: 'move',
		helper: function () {
			var helper = self.templates.create('dragHelper');
			return helper;
		},
        scroll: false,
        forceHelperSize: false,
        toleranceElement: '> div',
        stop: function (event, ui) {
            self.rearrange();
        }
    });
    self.onRename = o.onRename || null;
    self.addButton = o.addButton;
    self.addButton.click(function () {
        self.openQuestionEditor(null, 'new');
    });
    self.rearrange = function () {
        self.questions.length = 0;
        self.listNode.children().each(function () {
            var item = $(this);
            var owner = item.data('owner');
            if (owner) {
                if (owner instanceof QuestionEditor) {
                    var question = owner.question;
                    if (question.name)
                        owner = owner.question;
                }
                self.questions.push(owner);
            }
        });
        self.updateDescription();
    };
    self.replace = function (oldQuestion, newQuestion) {
        var idx = self.questions.indexOf(oldQuestion);
        self.questions[idx] = newQuestion;
    };
    self.exclude = function (question) {
        var idx = self.questions.indexOf(question);
        self.questions.splice(idx, 1);
    };
    self.closeQuestionEditor = function (cancel) {
        var ret = true;
        if (self.editor) {
            try {
                if (!self.editor.empty()) {
                    var question = null;
                    if (cancel) {
                        if (self.editor.question)
                            question = self.editor.question;
                    } else {
                        question = builder.createQuestion(self.editor.getDef(),
                                                          self.templates);
                        self.makeClickable(question);
                        if (self.editor.question) {
                            var oldName = self.editor.question.name;
                            var newName = question.name;
                            self.replace(self.editor.question, question);
                            if (self.onRename && oldName !== newName)
                                self.onRename(oldName, newName);
                        }
                    }
                    if (question)
                        self.editor.node.before(question.getNode());
                }
                self.updateDescription();
                self.editor.remove();
                self.editor = null;
                self.rearrange();
            } catch (e) {
                ret = false;
                if (e.name === "ValidationError") {
                    alert(e.message);
                    if (e.obj)
                        e.obj.node[0].scrollIntoView();
                } else
                    throw e;
            }
        }
        return ret;
    };
    self.openQuestionEditor = function (question, mode) {
        // console.log('openQuestionEditor 1', question);
        if (!self.closeQuestionEditor())
            return;
        // console.log('openQuestionEditor 2', question);
        var isNew = (question && mode !== "copy") ? true : false;
        var onCancel = function () {
            self.closeQuestionEditor(true);
        };
        self.editor = new QuestionEditor(question, mode, self, 
                                         onCancel, self.templates);
        if (isNew) {
            var questionNode = question.getNode();
            questionNode.before(self.editor.node);
            questionNode.detach();
        } else
            self.listNode.append(self.editor.node);
        self.editor.node[0].scrollIntoView();
    };
    self.removeNodeEvents = function (node) {
        node.unbind("click.question")
            .unbind("rb:remove")
            .unbind("rb:duplicate");
    };
    self.emptyListNode = function () {
        self.listNode.children().each(function (_, node) {
            node = $(node);
            self.removeNodeEvents(node);
            node.detach();
        });
    };
    self.makeClickable = function (question) {
        var node = question.getNode();
        node.bind("click.question", function () {
            var owner = $(this).data('owner');
            self.openQuestionEditor(owner, 'edit');
        });
        node.bind("rb:duplicate", function () {
            var owner = $(this).data('owner');
            self.openQuestionEditor(owner, 'copy');
        });
        node.bind("rb:remove", function () {
            var owner = $(this).data('owner');
            self.exclude(owner);
        });
    };
    self.findQuestion = function (name, except) {
        var found = null;
        $.each(self.questions, function (_, question) {
            if (!found &&
                question.name === name &&
                question !== except)
                found = question;
        });
        return found;
    };
    self.findQuestionsByRegExp = function (regExp) {
        var found = [];
        $.each(self.questions, function (_, question) {
            if (regExp.test(question.name))
                found.push(question);
        });
        return found;
    };
    self.syncListNode = function () {
        $.each(self.questions, function (_, question) {
            self.makeClickable(question);
            self.listNode.append(question.getNode());
        });
    };
    self.updateDescription = function () {

    };
};

var QuestionEditor = function (question, mode, parent, onCancel, templates) {
    var self = this;
    self.parent = parent;
    self.question = mode === "copy" ? null : question;
    self.mode = mode;
    self.templates = templates;
    self.node = self.templates.create('questionEditor');

    QuestionContainer.call(self, {
        listNode: self.node.find('.rb-subquestions:first'),
        addButton: self.node.find('.rb-subquestion-add:first'),
        templates: self.templates,
        onRename: function (oldName, newName) {
            $.each(self.questions, function (_, question) {
                question.constraints.renameIdentifier(oldName, newName);
                question.disableIf.renameIdentifier(oldName, newName);
                question.hideIf.renameIdentifier(oldName, newName);
            });
        }
    });
    if (question && question.type === "rep_group") {
        $.each(question.group, function (_, question) {
            var copy = builder.copyQuestion(question);
            self.questions.push(copy);
        });
        self.syncListNode();
    }

    self.autoGenerateId = !(question && question.name);

    var nodeTitle = self.node.find('textarea[name=question-title]:first');
    var nodeHelp = self.node.find('textarea[name=question-help]:first');
    var nodeName = self.node.find('input[name=question-name]:first');
    var nodeNameHint = nodeName.next('.hint');
    var nodeRequired = self.node.find('input[name=question-required]:first');
    var nodeSlave = self.node.find('input[name=question-slave]:first');
    var labelDropDown = self.node.find('label.rb-question-dropdown:first');
    var nodeDropDown = labelDropDown.find('input');
    var nodeAnnotation = self.node.find('input[name=question-annotation]:first');
    var nodeExplanation = self.node.find('input[name=question-explanation]:first');
    var nodeType = self.node.find('select[name=question-type]:first');
    var nodeCancel = self.node.find('.rb-question-cancel:first');
    var nodeSubquestions = self.node.find('.rb-subquestions-wrap:first');
    var nodeRemove = self.node.find('.rb-question-editor-remove:first');

    self.showNameHint = function () {
        nodeNameHint.css('display', '');
    }
    self.hideNameHint = function () {
        nodeNameHint.css('display', 'none');
    }
    nodeNameHint.find('a.hint-dismiss').click(function () {
        self.hideNameHint();
    });
    self.hideNameHint();

    self.getName = function () {
        return $.trim(nodeName.val());
    };
    self.getTitle = function () {
        return $.trim(nodeTitle.val());
    };
    self.getHelp = function () {
        return $.trim(nodeHelp.val());
    };

    nodeCancel.click(function () {
        onCancel();
    });

    nodeRemove.click(function () {
        var doRemove = false;
        if (!self.empty()) {
            if (confirm("Are you sure you want to remove this question?"))
                doRemove = true;
        } else
            doRemove = true;
        if (doRemove) {
            if (self.question) {
                self.question.remove();
                self.question = null;
            }
            onCancel();
        }
    });

    if (self.parent instanceof QuestionEditor)
        // nested repeating groups are not allowed
        nodeType.find("option[value=rep_group]").remove();

    var fixInputIdentifier = function (input, onFixed) {
        var val = input.val();
        var newVal = val.replace(builder.illegalIdChars, '');
        if (newVal !== val) {
            input.val( newVal );
            if (onFixed)
                onFixed();
        }
    }

    nodeTitle.change(function () {
        if (self.autoGenerateId) {
            var titleVal = self.getTitle();
            nodeName.val(
                builder.getReadableId(titleVal, true, '_', 45)
            );
        }
    });

    var answerEditor = new VariantsEditor({
        node: self.node.find(".rb-question-answers:first"),
        answers: question && builder.isListType(question.type) ? 
                    question.answers: [],
        templates: self.templates,
        separator: question && question.type === "enum" ? '-' : '_',
        parent: self
    });

    self.onDescribeId = function (identifier) {
        var name = self.getName();
        if (identifier === name) {
            var type = nodeType.val();
            var def = {
                name: name,
                type: type
            };
            if (builder.isListType(type)) {
                try {
                    def.answers = answerEditor.getDef();
                } catch (e) {
                    def.variants = [];
                }
            }
            return builder.describeQuestion(def);
        }
        if (self.parent instanceof QuestionEditor) {
            var found = self.parent.findQuestion(identifier);
            if (found) {
                try {
                    return builder.describeQuestion(found.getDef());
                } catch (e) {
                    return NULL;
                }
            }
        }
        return builder.onDescribeId(identifier);
    };
    self.onSearchId = function (term) {
        var ret = [];
        var matcher =
            new RegExp($.ui.autocomplete.escapeRegex(term), "i");
        name = self.getName();
        var busyNames = {};
        if (matcher.test(name)) {
            busyNames[name] = true;
            var title = self.getTitle();
            if (title.length > 80)
                title = builder.truncateText(title);
            ret.push({
                title: title,
                value: name
            });
        }
        if (self.question)
            busyNames[self.question.name] = true;
        if (self.parent instanceof QuestionEditor) {
            var found = self.parent.findQuestionsByRegExp(matcher);
            $.each(found, function (_, question) {
                if (!busyNames[question.name]) {
                    busyNames[question.name] = true;
                    ret.push({
                        title: question.title.length > 80 ?
                                    builder.truncateText(question.title, 80):
                                    question.title,
                        value: question.name
                    });
                }
            });
        }
        $.each(builder.onSearchId(term), function (_, item) {
            if (!busyNames[item.value]) {
                ret.push(item);
            }
        });
        return ret;
    };

    var constraintEditor = new EditableLogic({
        nodeText: self.node.find(".rb-question-constraint:first"),
        nodeBtn: self.node.find(".rb-question-constraint-change:first"),
        maxVisibleTextLen: 30,
        emptyValueText: 'No constraints',
        value: question ? question.constraints.value : null,
        beforeOpen: function () {
            var name = self.getName();
            if (!name) {
                alert("Please specify question name first");
                return false;
            }
            return true;
        },
        getDefaultIdentifier: function () {
            return self.getName();
        },
        onSearchId: self.onSearchId,
        onDescribeId: self.onDescribeId
    });
    var disableIfEditor = new EditableLogic({
        nodeText: self.node.find(".rb-question-disable-if:first"),
        nodeBtn: self.node.find(".rb-question-disable-if-change:first"),
        maxVisibleTextLen: 30,
        emptyValueText: 'Never disabled',
        value: question ? question.disableIf.value : null,
        onSearchId: self.onSearchId,
        onDescribeId: self.onDescribeId
    });
    var hideIfEditor = new EditableLogic({
        nodeText: self.node.find(".rb-question-hide-if:first"),
        nodeBtn: self.node.find(".rb-question-hide-if-change:first"),
        maxVisibleTextLen: 30,
        emptyValueText: 'Always visible',
        value: question ? question.hideIf.value : null,
        onSearchId: self.onSearchId,
        onDescribeId: self.onDescribeId
    });

    var previousName = self.getName();
    nodeName.change(function () {
        self.autoGenerateId = false;
        fixInputIdentifier($(this), function () {
            self.showNameHint();
        });
        var newName = self.getName();
        if (previousName !== newName) {
            if (newName) {
                if (previousName)
                    constraintEditor.renameIdentifier(previousName, newName);
                previousName = newName;
            }
        }
    });
    nodeName.keyup(function () {
        fixInputIdentifier($(this), function () {
            self.showNameHint();
        });
    });

    var customTitleEditor = new CustomTitleEditor({
        node: self.node.find(".rb-custom-titles-wrap:first"),
        templates: self.templates,
        customTitles: question ? question.customTitles : {}
    });

    nodeType.change(function () {
        var type = nodeType.val();
        if (builder.isListType(type)) {
            answerEditor.show();
            nodeSubquestions.css('display', 'none');
            answerEditor.setSeparator( type === "enum" ? '-': '_' );
            labelDropDown.css('display', (type === "enum") ? '': 'none' );
        } else {
            labelDropDown.css('display', 'none');
            answerEditor.hide();
            nodeSubquestions.css('display', (type === "rep_group") ?
                                                '': 'none');
        }
    });

    if (question) {
        nodeTitle.val(question.title || '');
        if (self.mode !== "copy")
            nodeName.val(question.name || '');
        nodeHelp.val(question.help || '');
        if (question.required)
            nodeRequired.attr('checked', 'checked');
        if (question.slave)
            nodeSlave.attr('checked', 'checked');
        if (question.annotation)
            nodeAnnotation.attr('checked', 'checked');
        if (question.explanation)
            nodeExplanation.attr('checked', 'checked');
        if (question.type === "enum" && question.dropDown)
            nodeDropDown.attr('checked', 'checked');
        nodeType.val(question.type).change();
    }
    self.empty = function () {
        var name = self.getName();
        var title = self.getTitle();
        return (!self.question && !name && !title);
    };
    self.remove = function () {
        self.node.remove();
    };
    self.isNameUnique = function (name, except) {
        if (self.parent instanceof QuestionEditor) {
            if (!builder.isParameterUnique(name) ||
                self.parent.findQuestion(name, except))
                return false;
            return true;
        }
        return builder.isUnique(name, except);
    };
    self.getDef = function () {
        self.closeQuestionEditor();
        var def = {
            name: self.getName(),
            title: self.getTitle(),
            required: nodeRequired.is(":checked"),
            slave: nodeSlave.is(":checked"),
            type: nodeType.val()
        };
        var annotation = nodeAnnotation.is(":checked");
        var explanation = nodeExplanation.is(":checked");
        var customTitles = customTitleEditor.getDef();
        var constraints = constraintEditor.getValue();
        var disableIf = disableIfEditor.getValue();
        var hideIf = hideIfEditor.getValue();
        var help = self.getHelp();
        if (!def.name)
            throw new builder.ValidationError(
                "Question name could not be empty", self);
        if (!self.isNameUnique(def.name, self.question))
            throw new builder.ValidationError(
                "Identifier '" + def.name +
                "' is already in use by another question or parameter", self);
        if (!def.title)
            throw new builder.ValidationError(
                "Question title could not be empty", self);
        if (help)
            def.help = help;
        if (annotation)
            def.annotation = annotation;
        if (explanation)
            def.explanation = explanation;
        if (builder.isListType(def.type)) {
            def.answers = answerEditor.getDef();
            if (def.type === "enum" && nodeDropDown.is(":checked"))
                def.dropDown = true;
        }
        if (!builder.isEmpty(customTitles))
            def.customTitles = customTitles;
        if (constraints)
            def.constraints = constraints;
        if (disableIf)
            def.disableIf = disableIf;
        if (hideIf)
            def.hideIf = hideIf;
        if (def.type === "rep_group") {
            var repeatingGroup = [];
            $.each(self.questions, function (_, question) {
                repeatingGroup.push(question.getDef());
            });
            if (builder.isEmpty(repeatingGroup))
                throw new builder.ValidationError(
                    "Repeating group should have at least one question", self);
            def.repeatingGroup = repeatingGroup;
        }
        return def;
    };
};
builder.extend(QuestionEditor, QuestionContainer);

builder.renameIdentifier = function (oldName, newName) {
    $.each(builder.pages.pages, function (_, page) {
        page.renameIdentifier(oldName, newName);
    });
};

var PageEditor = function (o) {
    var self = this;
    self.templates = o.templates;
    self.editorNode = o.editorNode;
    QuestionContainer.call(self, {
        listNode: o.listNode,
        addButton: self.editorNode.find('.rb-question-add:first'),
        templates: self.templates,
        onRename: function (oldName, newName) {
            builder.renameIdentifier(oldName, newName);
        }
    });
    self.updateDescription = function () {
        if (self.page)
            self.page.updateDescription();
    };
	self.listNode.sortable("option", "appendTo", $('#rb_helper_home'));
    self.pageTitle = new EditableTitle({
        nodeText: $("#rb_page_title"),
        nodeBtn: $("#rb_page_title_change"),
        nodeInput: $("#rb_page_title_input"),
        maxVisibleTextLen: 60,
        emptyTitleText: 'Untitled page',
        onChange: function (newValue) {
            if (self.page)
                self.page.setTitle(newValue);
        }
    });
    self.page = null;
    self.skipIfEditor = new EditableLogic({
        nodeText: $("#rb_page_skip_if"),
        nodeBtn: $("#rb_page_skip_if_change"),
        maxVisibleTextLen: 60,
        emptyValueText: 'Never skipped',
        onChange: function (newValue) {
            console.log('self.page', self.page);
            console.log('setting new value', newValue);
            if (self.page)
                self.page.setSkipIf(newValue);
        }
    });
    this.setPage = function (page) {
        if (self.page)
            self.page.setCurrent(false);
        self.page = page;
        self.pageTitle.setTitle(page ? page.title : null);
        self.skipIfEditor.setValue(page ? page.skipIf.getValue() : null);
        self.emptyListNode();
        self.questions = self.page ? self.page.questions : [];
        self.syncListNode();
        self.editor = null;
        if (self.page)
            self.page.setCurrent(true);
    };
    this.show = function (page) {
        if (!self.closeQuestionEditor())
            return false;
        self.setPage(page);
        self.editorNode.css('display', page ? '' : 'none');
        return true;
    };
    /*
    this.hide = function () {
        self.setPage(null);
        self.editorNode.css('display', 'none');
    };
    */
    this.setSkipIf = function (skipIf) {
        this.skipIf = skipIf;
        var skipIfNode = this.node.find('.rb-group-skip-if:first');
        if (this.skipIf) {
            var text = builder.truncateText(this.title, 30);
            skipIfNode.text(truncated);
            skipIfNode.removeClass('rb-not-set');
        } else {
            skipIfNode.text('Never skipped');
            skipIfNode.addClass('rb-not-set');
        }
    };
    this.setPage(null);
};
builder.extend(PageEditor, QuestionContainer);

builder.initDialogs = function () {
    var commonOptions = {
        parent: builder
    };
    builder.showJSONDialog =
        new builder.dialog.ShowJSONDialog(commonOptions);
    builder.publishDialog =
        new builder.dialog.PublishDialog(commonOptions);
    builder.askDialog =
        new builder.dialog.AskDialog(commonOptions);
    builder.promptDialog =
        new builder.dialog.PromptDialog(commonOptions);
    var dialogOptions = $.extend({
        /* extTypes: builder.context.extParamTypes */
    }, commonOptions);
    builder.editParamDialog =
        new builder.dialog.EditParamDialog(dialogOptions);
    dialogOptions = $.extend({
        /* extTypes: builder.context.extParamTypes */
    }, commonOptions);
    builder.beforeTestDialog =
        new builder.dialog.BeforeTestDialog(dialogOptions);
    builder.questionDialog =
        new builder.dialog.QuestionDialog(commonOptions);
    dialogOptions = $.extend({
        customTitleTypes: builder.customTitleTypes
    }, commonOptions);
    builder.customTitleDialog =
        new builder.dialog.CustomTitleDialog(dialogOptions);
    builder.progressDialog = $('.rb_progress_dialog').dialog({
        dialogClass: 'progress-dialog',
        modal: true,
        autoOpen: false,
        width: 350,
        open: function () { },
        close: function () { }, 
    });
    builder.initConditionEditor();
}

builder.getInstrumentData = function () {
    return {
        params: builder.inputParameters.getDef(),
        pages: builder.pages.getDef(),
        title: builder.instrumentTitle.getTitle()
    };
};

builder.isParameterUnique = function (identifier, except) {
    if (builder.inputParameters.find(identifier, except))
        return false;
    return true;
}

builder.isUnique = function (identifier, except) {
    if (!builder.isParameterUnique(identifier, except) ||
        builder.pages.findQuestion(identifier, except))
        return false;
    return true;
};

builder.describeParameter = function (parameter) {
    var ret = {};
    switch(parameter.type) {
    case 'NUMBER':
        ret.type = 'number';
        break;
    case 'STRING':
        ret.type = 'string';
        break;
    case 'DATE':
        ret.type = 'date';
        break;
    /*
    default:
        ret = builder.context.extParamTypes[parameter.type] || null;
    */
    }
    return ret;
};

builder.describeQuestion = function (question) {
    var ret = {};
    switch (question.type) {
    case 'integer':
    case 'float':
    case 'weight':
    case 'time_week':
    case 'time_month':
    case 'time_hours':
    case 'time_minutes':
    case 'time_days':
        ret.type = 'number';
        break;
    case 'string':
    case 'text':
        ret.type = 'string';
        break;
    case 'enum':
    case 'set':
        ret.type = question.type;
        ret.variants = question.answers;
        break;
    default:
        ret = null;
    }
    return ret;
};

builder.onSearchId = function (term) {
    var ret = [];
    var matcher =
        new RegExp($.ui.autocomplete.escapeRegex(term), "i");

    var found = builder.pages.findQuestionsByRegExp(matcher);
    $.each(found, function (_, question) {
        ret.push({
            title: question.title.length > 80 ?
                        builder.truncateText(question.title, 80):
                        question.title,
            value: question.name
        });
    });

    found = builder.inputParameters.findByRegExp(matcher);
    $.each(found, function (_, parameter) {
        var title = builder.paramTypeTitle(parameter /* ,
                                         builder.context.extParamTypes */);
        ret.push({
            title: 'parameter (' + title + ')',
            value: parameter.name
        });
    });
    return ret;
};

builder.onDescribeId = function (identifier) {
    var ret = null;
    var question;
    var parameter;
    if (question = builder.pages.findQuestion(identifier))
        ret = builder.describeQuestion(question);
    else if (parameter = builder.inputParameters.find(identifier))
        ret = builder.describeParameter(parameter);
    return ret;
};

builder.initConditionEditor = function () {
    builder.conditionEditor = new ConditionEditor({
        urlPrefix: builder.basePrefix,
        manualEdit: builder.context.manualEditConditions,
        identifierTitle: 'Question or parameter',
        onDescribeId: builder.onDescribeId,
        onSearchId: builder.onSearchId
    });
};

builder.init = function (o) {
    builder.context =
        new Context(o.instrument, /* o.extParamTypes, */
                    o.manualEditConditions || false,
                    o.baseUrl + '/test',
                    o.baseUrl + '/save',
                    o.baseUrl + '/publish',
                    o.baseUrl + '/measure_types');
    builder.templates = new Templates();
    builder.initDialogs();
    builder.instrumentTitle = new EditableTitle({
        nodeText: $('#rb_instrument_title'),
        nodeBtn: $('#rb_instrument_title_button'),
        nodeInput: $('#rb_instrument_title_input'),
        title: o.code.title,
        maxVisibleTextLen: 30,
        emptyTitleText: 'Untitled instrument'
    });
    builder.inputParameters = new InputParameters({
        listNode: $("#rb_params_list"),
        addButton: $("#rb_params_add"),
        template: builder.templates.get('parameter'),
        /* extParamTypes: o.extParamTypes, */
        parameters: o.code.params || [], // [{type: "STRING", name: "abc"}],
    });
    builder.pages = new Pages({
        makeGroupButton: $("#rb_make_group"),
        addPageButton: $("#rb_add_new_page"),
        pageList: $("#rb_page_list"),
        pages: o.code.pages,
        templates: builder.templates,
        beforeChange: function () {
            return builder.pageEditor.show(null);
        },
        onSelectPage: function (page, addToSelection) {
            if (addToSelection)
                builder.pages.addToSelection(page);
            else {
                builder.pages.setSelection([page]);
                builder.pageEditor.show(page);
            }
        }
    });
    builder.pageEditor = new PageEditor({
        editorNode: $("#rb_page_editor"),
        pageTitleNode: $("#rb_page_title"),
        pageTitleButton: $("#rb_page_title_change"),
        pageTitleInput: $("#rb_page_title_input"),
        skipIfNode: $("#rb_page_skip_if"),
        skipIfButton: $("#rb_page_skip_if_change"),
        listNode: $("#rb_question_list"),
        templates: builder.templates
    });

    $("#rb_show_json").click(function () {
        builder.showJSON();
    });

    $("#rb_publish").click(function () {
        builder.publish();
    });

    $("#rb_save_instrument").click(function () {
        builder.save({});
    });

    var testButton = $("#rb_test");
    if (builder.context.urlStartTest) {
        testButton.click(function () {
            builder.test();
        });
    } else
        testButton.attr('disabled', 'disabled');
};

builder.test = function () {


    if (!builder.pageEditor.closeQuestionEditor())
        return;

    var json = $.toJSON(builder.getInstrumentData());
    var onValuesSet = function (paramValues) {
        var form = $('#rb_form_test');
        form.find('input[name=json]').val(json);
        form.find('input[name=params]').val($.toJSON(paramValues));
        form.submit();
    };

    if (builder.inputParameters.parameters.length) {
        builder.beforeTestDialog.open({
            inputParameters: builder.inputParameters,
            callback: onValuesSet
        });
    } else
        onValuesSet({});
}

builder.getMeasureTypes = function (onSuccess) {
    $.ajax({
        url: builder.context.urlMeasureTypes
                + '?instrument_id='
                + encodeURIComponent(builder.context.instrumentName),
        async: true,
        success: function (content, textStatus, req) {
            onSuccess($.parseJSON(content));
        }
    });
};

builder.publish = function () {
    var onPublishSubmitted = function (measureType, onSuccess, onError) {
        $.ajax({
            url: builder.context.urlPublishForm,
            async: false,
            data: {
                instrument_id: builder.context.instrumentName,
                measure_type_id: measureType
            },
            success: function (content, textStatus, req) {
                onSuccess();
            },
            cache: false,
            error: function (req) {
                onError();
            },
            type: 'POST'
        });
    }

    builder.save({
        success: function () {
            builder.getMeasureTypes(function (measureTypes) {
                builder.publishDialog.open({
                    measureTypes: measureTypes,
                    onSubmit: onPublishSubmitted
                });
            });
        }
    });

}

builder.showJSON = function () {
    var data = builder.getInstrumentData();
    var json = JSON.stringify(data, null, 4);
    builder.showJSONDialog.open(json);
};

builder.findCircularObject = function(node, parents, tree){
    parents = parents || [];
    tree = tree || [];

    if (!node || typeof node != "object")
        return false;

    var keys = Object.keys(node), i, value;

    parents.push(node); // add self to current path
    for (i = keys.length - 1; i >= 0; i--){
        value = node[keys[i]];
        if (value && typeof value == "object") {
            tree.push(keys[i]);
            if (parents.indexOf(value) >= 0)
                return true;
            // check child nodes
            if (arguments.callee(value, parents, tree))
                return tree.join('.');
            tree.pop();
        }
    }
    parents.pop();
    return false;
}

builder.save = function (o) {
    if (!builder.pageEditor.closeQuestionEditor())
        return;

    var data = $.toJSON(builder.getInstrumentData());
    var postData = 'instrument_id='
                    + encodeURIComponent(builder.context.instrumentName)
                    + '&data=' + encodeURIComponent(data);
    $.ajax({
        url: builder.context.urlSaveForm,
        data: postData,
        success: function (content, textStatus, req) {
            if (o.success)
                o.success();
            else
                alert("Instrument saved successfully");
        },
        cache: false,
        error: function (req) {
            var text = req ? req.responseText : 'connection error';
            if (o.error)
                o.error(text);
            else
                alert("Save error: " + text);
        },
        type: 'POST'
    });
};

/*
$.RexFormBuilder.hints = {
    emptyField: 'This field could not be empty!',
    wrongQuestionId: 'Question names must begin with a letter. '
                      + 'They may contain letters, numbers, and '
                      + 'underscores, e.g. "q01_test".',
    dupQuestionId: 'There is another question with the same name. Question names should be unique in each group.',
    wrongAnswerId: 'Choice identifiers are required. They may contain letters, numbers and dashes, e.g. "yes_1".',
    dupAnswerId: 'There are several answers with the same code. Answer codes should be unique in each question.',
    emptyAnswerId: 'Answer Id could not be empty!',
    noAnswers: 'Please add at least one choice',
    wrongScore: 'Scores should be numerical'
}

$.RexFormBuilder.dismissIt = function(a) {
    var p = $(a).parents('div:first').remove();
}

$.RexFormBuilder.putHint = function(element, hintId) {
    var existentHint = element.next('.rb_hint');
    if (existentHint.size() == 0 ||
        existentHint.attr('data-hint-id') !== hintId) {

        existentHint.remove();
        var hint = $(document.createElement('div'))
                             .addClass('rb_hint')
                             .addClass('rb_red_hint')
                             .addClass('rb_question_input')
                             .attr('data-hint-id', hintId);
        hint.text($.RexFormBuilder.hints[hintId] + ' ');
        hint.append(' <a href="javascript:void(0)" onclick="$.RexFormBuilder.dismissIt(this);">Dismiss this message</a>');
        element.after(hint);
    }
}
*/
})(jQuery);
