
(function () {

var builder = $.RexFormBuilder = $.RexFormBuilder || {};

var Question = function (def, templates) {
    var self = this;
    this.type = def.type;
    this.name = def.name;
    this.title = def.title;
    this.templates = templates;
    this.hint = def.hint || null;
    this.help = def.help || null;
    this.customTitles = def.customTitles || {};
    this.required = def.required || false;
    this.slave = def.slave || null;
    this.disableIf = def.disableIf || null;
    this.constraints = def.constraints || null;
    this.annotation = def.annotation || null;
    this.explanation = def.explanation || null;

    this.getNode = function () {
        if (!self.node) {
            self.node = this.templates.create('question');
            self.node.data('owner', this);
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

var RepeatingGroupQuestion = function (def, templates) {
    Question.call(this, def, templates);
    var self = this;
    this.group = [];
    $.each(def.repeatingGroup, function (_, questionDef) {
        var type = questionDef.type;
        var cls = builder.questionTypes[type].cls;
        var question = new cls(questionDef, templates);
        self.group.push(question);
    });
};
builder.extend(RepeatingGroupQuestion, Question);

var Page = function (o) {
    var self = this;
    this.parent = null;
    this.questions = [];
    this.templates = o.templates;
    this.onSelectPage = o.onSelectPage || null;
    this.node = this.createNode();
    this.node.data('owner', this);
    $.each(o.def.questions || [], function (_, questionDef) {
        var cls = builder.questionTypes[questionDef.type].cls;
        var question = new cls(questionDef, self.templates);
        self.questions.push(question);
    });
    this.setTitle(o.def.title || null);
    this.cId = o.def.cId || null;
    this.setSkipIf(o.def.skipIf || null);
    this.bindEvents();
};
Page.prototype.bindEvents = function () {
    var self = this;
    self.node.click(function () {
        if (self.onSelectPage)
            self.onSelectPage(self);
    });
    self.node.find('.rb-page-add-next:first').click(function () {
        var page = new Page({
            def: {
                type: "page",
                title: null,
                questions: [],
                // TODO: generate unique cId
            },
            templates: self.templates
        });
        self.parent.append(page, self);
        page.node[0].scrollIntoView();
    });
    self.node.find('.rb-page-remove:first').click(function () {
        if (confirm("Are you sure you want to remove this item?"))
            self.remove();
    });
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
        var total = this.questions.length;
        if (total) {
            text = builder.truncateText(this.questions[0].title, 30);
            titleNode.text(text);
            if (total > 1)
                titleNode.append('<br><span class="rb-dark-text">And ' + (total - 1) + ' question(s)</span>');
            titleNode.removeClass('rb-not-set');
        } else {
            titleNode.text('Untitled page');
            titleNode.addClass('rb-not-set');
        }
    }
};
Page.prototype.createNode = function () {
    return this.templates.create('page');
};
Page.prototype.setSkipIf = function (skipIf) {
    this.skipIf = skipIf;
};
Page.prototype.remove = function () {
    this.parent.exclude(this);
    this.node.remove();
};

var PageContainer = function (pageList, pageDefs, onSelectPage) {
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
            def: def
        };
        if (def.type == "group")
            page = new Group(opts);
        else
            page = new Page(opts);
        self.append(page);
    });
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
    console.log('rearranged:', self.pages);
};
PageContainer.prototype.createEmptyPage = function () {
    return new Page({
        def: {
            type: "page",
            title: null,
            questions: []
            // TODO: generate unique cId
        },
        templates: this.templates
    });
};

var Group = function (o) {
    var self = this;
    Page.call(this, o);
    PageContainer.call(this, self.node.find('.rb-page-list:first'),
                        o.def.pages || [], o.onSelectPage);
    self.skipIfEditor = new EditableLogic({
        nodeText: self.node.find('.rb-group-skip-if:first'),
        nodeBtn: self.node.find('.rb-group-skip-if-change:first'),
        value: self.skipIf,
        maxVisibleTextLen: 30,
        emptyValueText: 'Never skipped',
        onChange: function (newValue) {
            self.skipIf = newValue;
        }
    });
};
builder.extend(Group, Page);
builder.extend(Group, PageContainer);
Group.prototype.createNode = function () {
    return this.templates.create('group');
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
Group.prototype.setSkipIf = function (skipIf) {
    this.skipIf = skipIf;
    if (this.skipIfEditor)
        this.skipIfEditor.setValue(this.skipIf);
    /*
    var skipIfNode = this.node.find('.rb-group-skip-if:first');
    if (this.skipIf) {
        var text = builder.truncateText(this.title, 30);
        skipIfNode.text(truncated);
        skipIfNode.removeClass('rb-not-set');
    } else {
        skipIfNode.text('Never skipped');
        skipIfNode.addClass('rb-not-set');
    }
    */
};
Group.prototype.bindEvents = function () {
    var self = this;
    self.node.find('.rb-group-remove:first').click(function () {
        if (confirm("Are you sure you want to remove this item?"))
            self.remove();
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
        title: 'Weigth',
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

var Context = function (name, extParamTypes, manualEditConditions, urlStartTest, urlSaveForm) {
    this.instrumentName = name;
    this.extParamTypes = extParamTypes;
    this.manualEditCondtions = manualEditConditions;
    this.urlStartTest = urlStartTest;
    this.urlSaveForm = urlSaveForm;
};

var Pages = function (o) {
    var self = this;
    this.templates = o.templates;
    this.addPageButton = o.addPageButton;
    this.makeGroupButton = o.makeGroupButton;
    PageContainer.call(this, o.pageList, o.pages, o.onSelectPage);
    this.addPageButton.click(function () {
        var page = self.createEmptyPage();
        self.append(page);
        page.node[0].scrollIntoView();
        // TODO: make this page as current
    });
};
builder.extend(Pages, PageContainer);

var InputParameter = function (def, parent, template, extParamTypes, onRemove) {
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

    this.update(def.name, def.type);
};

var InputParameters = function (o) {
    var self = this;
    self.parameters = [];
    self.template = o.template;
    self.listNode = o.listNode;
    self.addButton = o.addButton;
    self.extParamTypes = o.extParamTypes || {};

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
    this.isUnique = function (name, except) {
        var isUnique = true;
        $.each(self.parameters, function(_, parameter) {
            if (parameter.name === name && parameter !== except) {
                isUnique = false;
            }
        });
        return isUnique;
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
        var parameter = new InputParameter(paramDef, self, self.template,
                               self.extParamTypes);
        self.parameters.push(parameter);
        self.sort(); // also it will auto-append new parameter to the list node
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
    self.value = null;
    self.nodeText = o.nodeText;
    self.nodeBtn = o.nodeBtn;
    self.maxVisibleTextLen = o.maxVisibleTextLen || 30;
    self.emptyValueText = o.emptyValueText || 'Not set';
    self.onChange = o.onChange || null;

    self.setValue = function (value, internal) {
        self.value = value ? value : '';
        if (self.onChange)
            self.onChange(self.value);
        if (!internal) {
            if (self.value) {
                var text = builder.truncateText(self.value, 
                                                self.maxVisibleTextLen);
                self.nodeText.text(text)
                             .removeClass('rb-not-set');
            } else
                self.nodeText.text(self.emptyValueText)
                             .addClass('rb-not-set');
        }
    };

    self.getValue = function () {
        return self.value;
    };

    self.openEditor = function () {
        // TODO: open condition editor
        console.log('open condition editor');
    };

    self.nodeBtn.click(self.openEditor);
    self.setValue(o.value || null);
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
    };

    self.closeEditor = function () {
        self.nodeInput.css('display', 'none');
        self.nodeBtn.add(self.nodeText).css('display', '');
    };

    self.nodeInput.css('display', 'none');
    self.nodeInput.change(function () {
        var val = self.nodeInput.val();
        self.setTitle(val);
        self.closeEditor();
    });
    self.nodeBtn.click(self.showEditor);
    self.setTitle(o.title || null);
    self.closeEditor();
};

var Variant = function (code, title, parent, templates) {
    var self = this;
    self.title = title;
    self.code = code;
    self.node = templates.create('variant');
    self.node.data('owner', this);
    self.parent = parent;

    self.remove = function () {
        self.parent.exclude(self);
        self.node.remove();
    }

    var removeButton = self.node.find('.rb-variant-remove');
    removeButton.click(function () {
        self.remove();
    });

    var inputTitle = self.node.find('input[name=answer-title]:first');
    inputTitle.val(self.title || '');
    // TODO: check input value on keyup
    inputTitle.change(function () {
        self.title = $.trim(inputTitle.val());
    });

    var inputCode = self.node.find('input[name=answer-code]:first');
    inputCode.val(self.code || '');
    // TODO: check input value on keyup
    inputCode.change(function () {
        self.code = $.trim(inputCode.val());
    });
};

var VariantsEditor = function (o) {
    var self = this;
    var node = o.node;
    var nodeHeader = node.find(".rb-question-answers-header:first");
    var nodeList = node.find(".rb-question-answers-list:first");
    var nodeAddButton = node.find(".rb-question-answers-add:first");
    var nodeHint = node.find(".rb-question-answers-list-hint:first");
    self.variants = [];
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
    self.add = function (code, title) {
        var variant = new Variant(code, title, self, o.templates);
        self.variants.push(variant);
        nodeList.append(variant.node);
        self.updateHelpers();
    };
    nodeAddButton.click(function () {
        self.add(null, null);
    });
    $.each(o.answers, function (_, answer) {
        self.add(answer.code, answer.title);
    });
    self.updateHelpers();
};

var QuestionEditor = function (question, templates) {
    var self = this;
    self.question = question;
    self.templates = templates;
    self.node = self.templates.create('questionEditor');

    var nodeTitle = self.node.find('textarea[name=question-title]:first');
    var nodeName = self.node.find('input[name=question-name]:first');
    var nodeRequired = self.node.find('input[name=question-required]:first');
    var nodeType = self.node.find('select[name=question-type]:first');
    var nodeCancel = self.node.find('.rb-question-cancel:first');
    var constraintEditor = new EditableLogic({
        nodeText: self.node.find(".rb-question-constraint:first"),
        nodeBtn: $(".rb-question-constraint-change:first"),
        maxVisibleTextLen: 30,
        emptyValueText: 'No constraints',
        value: self.question ? self.question.constraints : null
    });
    var disableIfEditor = new EditableLogic({
        nodeText: self.node.find(".rb-question-disable-if:first"),
        nodeBtn: $(".rb-question-disable-if:first"),
        maxVisibleTextLen: 30,
        emptyValueText: 'Never disabled',
        value: self.question ? self.question.disableIf : null
    });
    var answerEditor = new VariantsEditor({
        node: self.node.find(".rb-question-answers:first"),
        answers: self.question && builder.isListType(self.question.type) ? 
                    self.question.answers: [],
        templates: self.templates
    });

    nodeType.change(function () {
        var type = nodeType.val();
        if (builder.isListType(type))
            answerEditor.show();
        else
            answerEditor.hide();
    });

    if (self.question) {
        nodeTitle.val(self.question.title || '');
        nodeName.val(self.question.name || '');
        if (self.question.required)
            nodeRequired.attr('checked', 'checked');
        nodeType.val(self.question.type).change();
    }
};

var PageEditor = function (o) {
    var self = this;
    self.templates = o.templates;
    self.editorNode = o.editorNode;
    self.listNode = o.listNode;
    self.listNode.sortable({
        cursor: 'move',
        toleranceElement: '> div',
        stop: function (event, ui) {
            self.rearrange();
        }
    });
    self.editors = [];
    self.rearrange = function () {
        if (self.page) {
            self.page.questions = [];
            self.listNode.children().each(function () {
                var item = $(this);
                var owner = item.data('owner');
                if (owner) {
                    if (owner instanceof QuestionEditor) {
                        var question = owner.question;
                        if (question.name)
                            owner = owner.question;
                    }
                    self.page.questions.push(owner);
                }
            });
        }
    }
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
            if (self.page)
                self.page.setSkipIf(newValue);
        }
    });
    this.openQuestionEditor = function (question) {
        var isNew = question ? true : false;
        var editor = new QuestionEditor(question, self.templates);
        self.editors.push(editor);
        if (isNew) {
            var questionNode = question.getNode();
            questionNode.before(editor.node);
            questionNode.detach();
        } else
            self.listNode.append(editor.node);
    };
    this.setPage = function (page) {
        self.page = page;
        self.pageTitle.setTitle(page ? page.title : null);
        self.skipIfEditor.setValue(page ? page.skipIf : null);
        self.listNode.children()
                     .unbind("click.question").detach();
        if (page) {
            $.each(page.questions, function (_, question) {
                var node = question.getNode();
                node.bind("click.question", function () {
                    var owner = $(this).data('owner');
                    self.openQuestionEditor(owner);
                });
                self.listNode.append(question.getNode());
            });
        }
        self.editors = [];
    };
    this.show = function (page) {
        self.setPage(page);
        self.editorNode.css('display', '');
    };
    this.hide = function () {
        self.setPage(null);
        self.editorNode.css('display', 'none');
    };
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

builder.initDialogs = function () {
    var commonOptions = {
        parent: builder
    };
    builder.showJSONDialog =
        new builder.dialog.ShowJSONDialog(commonOptions);
    builder.promptDialog =
        new builder.dialog.promptDialog(commonOptions);
    var dialogOptions = $.extend({
        extTypes: builder.context.extParamTypes
    }, commonOptions);
    builder.editParamDialog =
        new builder.dialog.EditParamDialog(dialogOptions);
    dialogOptions = $.extend({
        extTypes: builder.context.extParamTypes
    }, commonOptions);
    builder.beforeTestDialog =
        new builder.dialog.BeforeTestDialog(dialogOptions);
    builder.questionDialog =
        new builder.dialog.QuestionDialog(commonOptions);

    builder.progressDialog = $('.rb_progress_dialog').dialog({
        dialogClass: 'progress-dialog',
        modal: true,
        autoOpen: false,
        width: 350,
        open: function () { },
        close: function () { }, 
    });
}

builder.init = function (o) {
    builder.context =
        new Context(o.instrument, o.extParamTypes,
                    o.manualEditConditions || false,
                    o.urlStartTest || null, o.urlSaveForm || null);
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
        extParamTypes: o.extParamTypes,
        parameters: o.code.params || [], // [{type: "STRING", name: "abc"}],
    });
    builder.pages = new Pages({
        makeGroupButton: $("#rb_make_group"),
        addPageButton: $("#rb_add_new_page"),
        pageList: $("#rb_page_list"),
        pages: o.code.pages,
        templates: builder.templates,
        onSelectPage: function (page) {
            builder.pageEditor.show(page);
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
};

/* 
$.RexFormBuilder.namesWhichBreaksConsistency = function (names, exclude) {
    console.log('namesWhichBreaksConsistency(', names, ')');

    var badNames = {};
    var chkNames = {};
    $.each(names, function (_, name) {
        chkNames[name] = true;
    });

    questionIndex = $.RexFormBuilder.context.getIndexByType('question');

    for (var idx in questionIndex) {
        var question = questionIndex[idx];
        
        if (question === exclude)
            continue;
        
        if (chkNames[question.name]) {

            badNames[question.name] = true;
            delete chkNames[question.name];

        } else if (question.type === "set") {

            for (var idx in question.answers) {
                var fullName = question.name + '_'
                               + question.answers[idx].code;
                if (chkNames[fullName]) {
                    badNames[fullName] = true;
                    delete chkNames[fullName];
                }
            }
        }
    }

    return Object.keys(badNames);
}

$.RexFormBuilder.preparePageMeta = function(pageDiv, to) {
    var data = pageDiv.data('data');
    if (pageDiv.hasClass('rb_page_group')) {
        var groupData = pageDiv.data('data');
        var thisGroupMeta = {
            type: 'group',
            skipIf: data.skipIf ? data.skipIf : null,
            title: groupData.title,
            pages: []
        }

        to.push(thisGroupMeta);
        var innerItems = pageDiv.children('.rb_class_pages_list').children();
        var total = innerItems.size();
        for (var idx = 0; idx < total; idx++) {
            $.RexFormBuilder.preparePageMeta($(innerItems[idx]), thisGroupMeta.pages);
        }

    } else {

        var pageData = pageDiv.data('data');

        // console.log('page', pageDiv);
        // console.log('pageData', pageData);

        var thisPageMeta = {
            type: 'page',
            title: pageData.title,
            cId: data.cId,
            skipIf: data.skipIf ? data.skipIf : null,
            questions: []
        };
        to.push(thisPageMeta);

        for (var idx in pageData.questions) {
            var questionData = $.extend(true, {}, pageData.questions[idx]);

            delete questionData['changes'];
            delete questionData['cache'];

            if (questionData['repeatingGroup']) {
                for (var sIdx in questionData['repeatingGroup']) {
                    var subQuestion = questionData['repeatingGroup'][sIdx];

                    delete subQuestion['slave'];
                    delete subQuestion['cache'];
                }
            }

            thisPageMeta.questions.push( questionData );
        }
    }
}

$.RexFormBuilder.generateMetaJSON = function(instrumentName, doBeautify) {
    var instrumentMeta = $.RexFormBuilder.generateMeta(instrumentName);

    if (doBeautify && JSON && JSON.stringify)
        return JSON.stringify(instrumentMeta, null, 4);

    return $.toJSON(instrumentMeta);
}

$.RexFormBuilder.generateMeta = function(instrumentName) {
    var instrumentMeta = {
        pages: [],
        params: [],
        title: $.RexFormBuilder.instrumentTitle
    };

    var root = instrumentMeta['pages'];
    $.RexFormBuilder.pageListDiv.children().each(function () {
        var jThis = $(this);
        // console.log('checking', jThis);
        $.RexFormBuilder.preparePageMeta(jThis, root);
    });

    var root = instrumentMeta['params'];
    $.RexFormBuilder.paramListDiv.children().each(function () {
        var jThis = $(this);
        root.push(jThis.data('data'));
    });

    return instrumentMeta;
}

$.RexFormBuilder.saveInstrumentReal = function(callback) {
    var instrumentName = $.RexFormBuilder.instrumentName;

    if (!instrumentName)
        instrumentName = prompt("Please set instrument name:");

    if (instrumentName) {
        if ($.RexFormBuilder.context.getIndexByType('question').length == 0) {
            alert('A form should contain at least one question!');
            return;
        }
    
        var meta = $.RexFormBuilder.generateMeta(instrumentName);

        meta = $.toJSON(meta);
        var schema = 'instrument=' + encodeURIComponent(instrumentName) 
                    + '&data=' + encodeURIComponent( meta );

        var url = $.RexFormBuilder.context.urlSaveForm ||
                 ($.RexFormBuilder.basePrefix + "/add_instrument");
        $.ajax({url : url,
            success : function(content) {
                if (!$.RexFormBuilder.instrumentName)
                    $.RexFormBuilder.instrumentName = instrumentName;

                if (callback)
                    callback();
                else
                    alert('instrument saved!');
            },
            error: function() {
                $.RexFormBuilder.closeProgress();
                alert('Error of saving instrument!');
            },
            data : schema,
            type: 'POST'
        });
    }
};

$.RexFormBuilder.saveInstrument = function(callback) {
    $.RexFormBuilder.closeOpenedEditor(function () {
        $.RexFormBuilder.saveInstrumentReal();
    }, questionListDiv);
}

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

$.RexFormBuilder.updateQuestionDiv = function(questionDiv) {
    var questionData = questionDiv.data('data');
    $('.rb_question_title', questionDiv).text(questionData.title || '');
    $('.rb_question_name', questionDiv).text(questionData.name || '');
    $('.rb_question_descr', questionDiv)
                    .text($.RexFormBuilder.getQuestionDescription(questionData));
}

$.RexFormBuilder.updateQuestionOrders = function() {
    var newQuestionList = [];
    questionListDiv.children('.rb_question').each(function () {
        var questionData = $(this).data('data');
        newQuestionList.push(questionData);
    });
    var pageData = $.RexFormBuilder.currentPage.data('data');
    pageData.questions = newQuestionList;
}

$.RexFormBuilder.setQuestionsSortable = function(list) {
    list.sortable({
        cursor: 'move',
        // cancel: '.restrict-question-drag',
        toleranceElement: '> div',
        update: function () {
            $.RexFormBuilder.updateQuestionOrders();
        }
    });
}

$.RexFormBuilder.addQuestionDiv = function(questionData, listDiv) {
    var newQuestionDiv = $.RexFormBuilder.templates.createObject('question');
    newQuestionDiv.data('data', questionData);
    $.RexFormBuilder.updateQuestionDiv(newQuestionDiv);
    
    if (listDiv)
        listDiv.append(newQuestionDiv)
    else
        questionListDiv.append(newQuestionDiv);

    newQuestionDiv.click(function () {
        $.RexFormBuilder.showQuestionEditor(this);
    });

    return newQuestionDiv;
}

$.RexFormBuilder.closeOpenedEditor = function(callback, listDiv) {
    var errorSaving = false;
    listDiv.children('.rb_question').each(function () {
        if (!errorSaving) {
            var thisQuestion = $(this);
            if (thisQuestion.hasClass('rb_opened') && 
                !$.RexFormBuilder.saveQuestion(thisQuestion)) {

                errorSaving = true;

                var doHighlight = function () {
                    thisQuestion.effect("highlight", { color: '#f3c2c2' }, 1000);
                };

                if (listDiv[0] === questionListDiv[0]) {
                    if ($.RexFormBuilder.isScrolledIntoView(thisQuestion, questionListDiv))
                        doHighlight();
                    else {
                        var scrollOffset = thisQuestion.parent().scrollTop();
                        questionListDiv.animate({
                                scrollTop: thisQuestion.position().top + scrollOffset
                            },
                            200,
                            "linear",
                            doHighlight
                        );
                    }
                }
            }
        }
    });
    if (!errorSaving)
        callback();
}

$.RexFormBuilder.onPredefinedChoicesChange = function () {
    var val = $(this).val();
    if (val) {
        var choicesList =
                $(this).parents('.rb_choices:first')
                       .find('.choices-list-items');

        choicesList.children().remove();
        var choices = $.RexFormBuilder.predefinedLists[val];

        var isFirst = true;
        $.each(choices, function (_, choice) {
            $.RexFormBuilder.addChoiceReal(
                choicesList,
                choice['code'],
                choice['title'],
                isFirst,
                false
            );
            isFirst = false;
        });
    }
}

$.RexFormBuilder.showQuestionEditor = function(question) {
    var questionDiv = $(question);

    if (!questionDiv.hasClass('rb_opened')) {

        var parent = questionDiv.parent();
        $.RexFormBuilder.closeOpenedEditor(function () {
            questionDiv.addClass('rb_opened');
            var question = questionDiv.data('data');

            var editorPlace = questionDiv.find('.q_editor:first');
            var editor = $.RexFormBuilder.templates.createObject('questionEditor');

            editor.click(function (event) {
                // trap for event
                event.stopPropagation();
            });
            questionDiv.find('.btn-save-cancel:first').css('display', '');
            questionDiv.find('.q_caption:first').css('display', 'none');
            questionDiv.find('.btn-page-answer').css('display', 'none');

            $('select[name="predefined-choice-list"]', editor)
                .change($.RexFormBuilder.onPredefinedChoicesChange);

            var questionName = question['name'];
            var inputTitle = $('textarea[name="question-title"]', editor);
            var inputName = $('input[name="question-name"]', editor);
            var visible = $('input[name="question-visible"]', editor);
            var required = $('input[name="question-required"]', editor);

            var choicesList = $('.choices-list-items', editor);
            $.RexFormBuilder.setChoicesSortable(choicesList);

            if (question['title'])
                inputTitle.val(question['title']);
            if (question['name']) {
                inputName.val(question['name']);
                inputName.removeClass('slave');
            }

            var questionType = question.type;
            if (question['required'])
                required.attr('checked', 'checked');
            else
                required.removeAttr('checked');

            var isFirst = true;
            for (var aIdx in question['answers']) {
                var answer = question['answers'][aIdx];
                $.RexFormBuilder.addChoiceReal(choicesList, 
                            answer['code'],  
                            answer['title'],
                            isFirst, 
                            false);
                isFirst = false;
            }

            if (builder.isListType(question.type))
                $('.rb_choices', editor).css('display', 'block');

            inputTitle.change(function () {
                var title = $(this).val();
                if (inputName.hasClass('slave')) {
                    inputName.val(
                        builder.getReadableId(title, true, '_', 45)
                    );
                }
            })

            var fixInputIdentifier = function (input) {
                var val = input.val();
                var newVal = val.replace(builder.illegalIdChars, '');
                if (newVal !== val) {
                    input.val( newVal );
                    builder.putHint(jThis, 'wrongQuestionId');
                }
            }

            inputName.change(function () {
                var input = $(this);
                input.removeClass('slave');
                fixInputIdentifier(input);
            });
            inputName.keyup(function () {
                fixInputIdentifier( $(this) );
            });

            questionType = $('select[name="question-type"]', editor);

            if (parent[0] !== questionListDiv[0])
                // currently we don't support repeating 
                // groups inside repeating groups
                questionType.find('option[value="rep_group"]').remove();

            questionType.val(question.type);
            questionType.change($.RexFormBuilder.onChangeQuestionType);
            questionType.change();

            editor[0].disableIf = question['disableIf'];
            editor[0].constraints = question['constraints'];

            if (question['disableIf'])
                $.RexFormBuilder.makeREXLCache(editor[0], 'disableIf');

            if (question['constraints'])
                $.RexFormBuilder.makeREXLCache(editor[0], 'constraints');

            $.RexFormBuilder.updateDisableLogicDescription(editor);
            $.RexFormBuilder.updateConstraintsDescription(editor);
            
            editor.find('.rb_small_button:first').click(function () {
                $.RexFormBuilder.addNewSubQuestion(
                    editor.find('.rb_subquestion_list:first')
                );
            });

            editorPlace.append(editor);

            if (question.type === "rep_group" &&
                question['repeatingGroup'] &&
                question['repeatingGroup'].length) {

                var listDiv = editor.find('.rb_subquestion_list');

                for (var idx in question['repeatingGroup'])
                    $.RexFormBuilder.addQuestionDiv(
                        question['repeatingGroup'][idx], 
                        listDiv
                    );
            }

        }, parent);
    }
}

$.RexFormBuilder.addChoiceReal = function(choicesList, code, title,
                                        hideHeader, slave) {

    var newChoice = $.RexFormBuilder.templates.createObject('choicesItem');

    var answerTitle = $('input[name="answer-title"]', newChoice);
    var answerCode = $('input[name="answer-code"]', newChoice);
    newChoice.attr('data-code', code);

    if (!slave)
        answerCode.removeClass('slave');

    answerTitle.data('answerCode', answerCode);

    answerTitle.change(function () {
        var jThis = $(this);
        var title = jThis.val();
        var answerCode = jThis.data('answerCode');
        if (answerCode.hasClass('slave')) {
            answerCode.val(builder.getReadableId(title, false, '_', 45));
        }
    });

    var fixInputAnswerIdentifier = function (input) {
        var val = input.val();
        var newVal = val.replace(builder.illegalIdChars, '');
        if (newVal !== val)
            input.val( newVal );
    };
    answerCode.change(function () {
        var input = $(this);
        input.removeClass('slave');
        fixInputAnswerIdentifier(input);
    });
    answerCode.keyup(function () {
        fixInputAnswerIdentifier( $(this) );
    });

    if (code !== null) {
        answerTitle.val(title);
        answerCode.val(code);
    }

    if (hideHeader) {
        var parent = choicesList.parent();
        parent.children('.choice-hint').css('display', 'none');
        parent.siblings(".predefined-choices-div").css('display', 'none');
        parent.siblings('.rb_choices_header').css('display', 'block');
    }

    choicesList.append(newChoice);
    answerTitle.focus();
}

$.RexFormBuilder.addChoice = function(button) {
    var jButton = $(button);
    var choicesList = jButton.parent().siblings('.choices-list')
                                      .children('.choices-list-items');
    
    $.RexFormBuilder.addChoiceReal(choicesList, null, null, true, true);
}

$.RexFormBuilder.setChoicesSortable = function(c) {
    console.log('setChoicesSortable', c);
    c.sortable({
        cursor: 'move',
        toleranceElement: '> div'
        // cancel: '.restrict-drag',
    });
}

$.RexFormBuilder.removeChoicesItem = function (obj) {
    var choicesDiv = $(obj).parents('.rb_choices_item:first');
    choicesDiv.slideUp(300, function () {
        $(this).remove();
    });
}

$.RexFormBuilder.removeQuestion = function (obj) {
    var questionDiv = $(obj).parents('.rb_question:first');
    questionDiv.slideUp(300, function () {
        $.RexFormBuilder.removeQuestionReal(questionDiv);
    });
}

$.RexFormBuilder.removeQuestionReal = function(questionDiv) {
    var pageData = $.RexFormBuilder.currentPage.data('data');
    var questionData = questionDiv.data('data');
    for (var idx in pageData.questions) {
        if (pageData.questions[idx] === questionData) {
            pageData.questions.splice(idx, 1);
            break;
        }
    }
    $.RexFormBuilder.context.removeFromIndex('question', questionDiv.data('data'));
    questionDiv.remove();
}

$.RexFormBuilder.cancelQuestionEdit = function(button) {
    var questionDiv = $(button).parents('.rb_question:first');
    var data = questionDiv.data('data');

    blockRepaint = true;
    if (!data['name']) {
        $.RexFormBuilder.removeQuestionReal(questionDiv);
    } else {
        $.RexFormBuilder.closeQuestionEditor(questionDiv);
        $.RexFormBuilder.updateQuestionDiv(questionDiv);
    }
    blockRepaint = false;
}

$.RexFormBuilder.onChangeQuestionType = function() {
    var jThis = $(this);
    var editor = jThis.parents('.rb_question_editor:first');
    var presets = $('.preset-choices', editor);
    var choices = $('.rb_choices', editor);
    var subQListWrap = $('.rb_question_table_subquestions', editor);
    var subQList = $('.rb_subquestion_list', subQListWrap);

    var type = jThis.val();
    
    var answersDisplay = builder.isListType(type) ? 'block' : 'none';
    var subQListDisplay = (type === 'rep_group') ? '' : 'none';

    presets.css('display', answersDisplay);
    choices.css('display', answersDisplay);

    subQListWrap.css('display', subQListDisplay);

    if (!subQList.hasClass('ui-sortable')) {
        subQList.sortable({
            cursor: 'move',
            toleranceElement: '> div'
        });
    }
}


$.RexFormBuilder.changesCounter = 0;
$.RexFormBuilder.instrumentChanged = false;
$.RexFormBuilder.setGlobalChangesMark = function(hasChanges) {
    $.RexFormBuilder.instrumentChanged = hasChanges;
    // globalChangesMark.html(hasChanges ? '*' : '');
}

$.RexFormBuilder.getChangeStamp = function() {
    $.RexFormBuilder.setGlobalChangesMark(true);
    return $.RexFormBuilder.changesCounter++;
}

$.RexFormBuilder.findDuplicates = function(qName, origQuestionData) {
    var foundQuestionData = $.RexFormBuilder.context.findQuestionData(qName);
    return (!foundQuestionData ||
            foundQuestionData === origQuestionData) ? false : true;
}

$.RexFormBuilder.saveQuestion = function(obj) {
    var jObj = obj;
    var question = jObj.hasClass('rb_question') ?
                            jObj:
                            jObj.parents('.rb_question:first');
    var questionData = question.data('data');
    var questionDataUpdated = false;
    var inputTitle = $('textarea[name="question-title"]:first', question);
    var qTitle = jQuery.trim( inputTitle.val() );
    var qRequired = $('input[name="question-required"]:first', question)
                        .attr('checked') ? true: false;
    var qQuestionType =
            $('select[name="question-type"]:first', question).val();

    var validationError = false;

    if (!qTitle) {
        $.RexFormBuilder.putHint(inputTitle, 'emptyField');
        validationError = true;
    }

    var preloadedAnswers = {};
    // var changes = [];

    if (builder.isListType(qQuestionType)) {
        var choicesList = $('.choices-list:first', question)
                            .find('.choices-list-items:first');
        var items = $('.rb_choices_item', choicesList);
        if (items.size() == 0) {
            $.RexFormBuilder.putHint(choicesList, 'noAnswers');
            validationError = true;
        } else {
            for (var idx = 0; idx < items.size(); idx++) {
                var jItem = $(items[idx]);
                var bindedCode = jItem.attr('data-code');
                var answerCode = jQuery.trim(
                        $('input[name="answer-code"]', jItem).val()
                    );
                var answerTitle = jQuery.trim(
                        $('input[name="answer-title"]', jItem).val()
                    );
                var answerScore = '';

                if (answerCode === '' && answerTitle === '') {
                    continue;
                } else if (answerCode === '' ||
                    builder.illegalIdChars.test(answerCode)) {
                    $.RexFormBuilder.putHint(choicesList, 'wrongAnswerId');
                    validationError = true;
                    break;
                } else if (answerScore !== '' && 
                            !/^[0-9]+$/.test(answerScore)) {

                    $.RexFormBuilder.putHint(choicesList, 'wrongScore');
                    validationEerror = true;
                } else if (preloadedAnswers[answerCode] !== undefined) {

                    $.RexFormBuilder.putHint(choicesList, 'dupAnswerId');
                    validationError = true;
                    break;
                }

                preloadedAnswers[answerCode] = {
                    'bindedCode': bindedCode,
                    'title': answerTitle
                }
            }
        }
    }

    if (validationError) {
        console.log('validationError');
        return false;
    }

    validationError = false;

    var inputName = $('input[name="question-name"]:first', question);
    var qName = jQuery.trim( inputName.val() );

    if (qName === '' ||
        builder.illegalIdChars.test(qName)) {
        $.RexFormBuilder.putHint(inputName, 'wrongQuestionId');
        validationError = true;
    } else {
        var chkNames = { };

        chkNames[qName] = function (name) {
            $.RexFormBuilder.putHint(inputName, 'dupQuestionId');
        }

        if (qQuestionType === "set") {
            for (code in preloadedAnswers) {
                chkNames[qName + '_' + code] = function (name) {
                    alert('Choice name \'' + name + '\' didn\'t pass the name consistency check');
                }
            }
        }

        var badNames = $.RexFormBuilder
                            .namesWhichBreaksConsistency(
                                Object.keys(chkNames), 
                                questionData
                             );

        if (badNames.length) {
            validationError = true;
            $.each(badNames, function (_, badName) {
                console.log('badName:', badName);
                chkNames[badName](badName);
            });
        }
    }

    if (validationError)
        return false;

    if (qQuestionType === 'rep_group') {
        var subList = question.find('.rb_subquestion_list:first');
        var qDataArray = [];
        subList.children().each(function () {
            if (!validationError) {
                var jThis = $(this);
                
                if (jThis.hasClass('rb_opened') && 
                    !$.RexFormBuilder.saveQuestion(jThis))

                    validationError = true;
                else {
                    var thisData = jThis.data('data');
                    qDataArray.push(thisData);
                }
            }
        });

        if (validationError)
            return false;

        questionData.repeatingGroup = qDataArray;
    } else if (questionData['repeatingGroup'])
        delete questionData['repeatingGroup'];

    if (questionData['name'] !== qName) {
        questionData['name'] = qName;
        // changes.push('name');
    }

    if (questionData['title'] !== qTitle) {
        questionData['title'] = qTitle;
        // changes.push('title');
    }

    if (questionData['required'] !== qRequired) {
        questionData['required'] = qRequired;
        // changes.push('required');
    }

    if (questionData.type !== qQuestionType) {
        questionData.type = qQuestionType;
        // changes.push('type');
    }

    var qEditor = question.find('.rb_question_editor:first');

    questionData['disableIf'] = qEditor[0].disableIf || '';
    questionData['constraints'] = qEditor[0].constraints || '';

    $.RexFormBuilder.makeREXLCache(questionData, 'disableIf');
    $.RexFormBuilder.makeREXLCache(questionData, 'constraints');

    if (builder.isListType(qQuestionType)) {
        questionData['answers'] = [];
        for (var answerCode in preloadedAnswers) {
            var preAnswer = preloadedAnswers[answerCode];
            var answerTitle = preAnswer['title'];
            questionData['answers'].push({
                'code': answerCode,
                'title': answerTitle
            });
        }
    }

    if (builder.isListType(qQuestionType))
        $.RexFormBuilder.updatePredefinedChoices(questionData.answers);

    $.RexFormBuilder.closeQuestionEditor(question);
    $.RexFormBuilder.updateQuestionDiv(question);

    return true;
}

$.RexFormBuilder.updatePredefinedChoices = function(answers) {
    var titles = [];

    $.each(answers, function (_, answer) {
        titles.push(answer['title'] || answer['code']);
    });

    if (!titles.length)
        return;

    var preList = [];
    var titlesStr = titles.join(', ');

    if ($.RexFormBuilder.predefinedLists[titlesStr])
        // the same predefined set of choices exists already
        return;

    $.RexFormBuilder.predefinedLists[titlesStr] = preList;
    $.each(answers, function (_, answer) {
        preList.push({
            'code': answer['code'],
            'title': answer['title']
        });
    });

    var tpl = $.RexFormBuilder.templates.getTemplate('questionEditor');
    var selectChoiceList = tpl.find('select[name="predefined-choice-list"]:first');

    $('<option>', {
        value: titlesStr,
        text: $.RexFormBuilder.truncateText(titlesStr, 50)
    }).appendTo(selectChoiceList);
}

$.RexFormBuilder.closeQuestionEditor = function(questionDiv) {
    if (questionDiv.hasClass('rb_opened')) {
        var questionEditor =
                questionDiv.find('.rb_question_editor:first');
        if (questionEditor.size()) {
            questionDiv.find('.btn-save-cancel:first')
                        .css('display', 'none');
            questionDiv.find('.q_caption:first').css('display', '');
            questionEditor.remove();
        }
        questionDiv.removeClass('rb_opened');
    }
}

$.RexFormBuilder.updateDisableLogicDescription = function(questionEditor) {
    var targetSpan = questionEditor.find('.rb_disable_logic_descr:first');
    var disableIf = questionEditor[0].disableIf;
    
    if (disableIf) {
        targetSpan.removeClass('disable_logic_not_set')
                  .html('Disabled if:&nbsp;&nbsp;' 
                        + builder.escapeHTML(
                            $.RexFormBuilder.truncateText(disableIf, 30))
                          );
    } else {
        targetSpan.addClass('disable_logic_not_set')
                  .html('Never disabled');
    }
}

$.RexFormBuilder.updateGroupSkipSpan = function(groupDiv) {
    var groupSkipWhenSpan = groupDiv.find('.rb_page_group_skip:first');
    
    var data = groupDiv.data('data');
    if (data.skipIf) {
        groupSkipWhenSpan
            .removeClass('rb_group_skip_not_set')
            .text('Skipped if: ' + $.RexFormBuilder.truncateText(data.skipIf, 30))
            
            if (data.skipIf.length >= 30)
                groupSkipWhenSpan.attr('title', data.skipIf);
    }
    else
        groupSkipWhenSpan
            .addClass('rb_group_skip_not_set')
            .removeAttr('title')
            .html('Never skipped');
}

$.RexFormBuilder.updatePageWhenSpan = function(pageData) {
    if (pageData.skipIf)
        $.RexFormBuilder.pageSkipWhenSpan
            .removeClass('rb_page_skip_not_set')
            .html('Skipped if:&nbsp;&nbsp;' 
                        + builder.escapeHTML(pageData.skipIf));
    else
        $.RexFormBuilder.pageSkipWhenSpan
            .addClass('rb_page_skip_not_set')
            .html('Never skipped');
}

$.RexFormBuilder.updatePageTitleSpan = function(pageData) {
    if (pageData.title)
        $.RexFormBuilder.pageTitleSpan
            .removeClass('rb_page_title_not_set')
            .text(pageData.title);
    else
        $.RexFormBuilder.pageTitleSpan
            .addClass('rb_page_title_not_set')
            .html('Untitled page');
}

$.RexFormBuilder.isScrolledIntoView = function(elem, scrollable) {
    var docViewTop = scrollable.scrollTop();
    var docViewBottom = docViewTop + scrollable.height();

    var elemTop = elem.offset().top;
    var elemBottom = elemTop + elem.height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

$.RexFormBuilder.selectPage = function(pageDiv) {
    $.RexFormBuilder.closeOpenedEditor(function () {
        if ($.RexFormBuilder.pageTitleInput.is(':visible'))
            $.RexFormBuilder.pageTitleInput.focusout();

        $.RexFormBuilder.mainPartContent.css('display', 'block');
        if ($.RexFormBuilder.currentPage)
            $.RexFormBuilder.currentPage.removeClass('rb_covered');
        $.RexFormBuilder.currentPage = $(pageDiv);
        $.RexFormBuilder.currentPage.addClass('rb_covered');
        var pageData = $.RexFormBuilder.currentPage.data('data');
        $.RexFormBuilder.clearQuestions();
        $.RexFormBuilder.updatePageTitleSpan(pageData);
        $.RexFormBuilder.updatePageWhenSpan(pageData);
        for (var idx in pageData.questions) {
            var question = pageData.questions[idx];
            $.RexFormBuilder.addQuestionDiv(question);
        }
    }, questionListDiv);
}

$.RexFormBuilder.relativeTop = function(element, relativeTo) {
    var top = element[0].offsetTop;
    console.log('top', top);
    while (element.size() && element.parent()[0] !== relativeTo[0]) {
        element = element.parent();
        top += element[0].offsetTop;
        console.log('element.offsetTop', element[0].offsetTop, element);
        console.log('top', top);
    }

    return top;
}

$.RexFormBuilder.addNewSubQuestion = function(listDiv) {
    $.RexFormBuilder.closeOpenedEditor(function () {
        var parentQuestionDiv = listDiv.parents('.rb_question:first');
        var parentQData = parentQuestionDiv.data('data');
        var qData = $.RexFormBuilder.context.createNewQuestion();
        qData.slave = true;

        if (!parentQData.repeatingGroup)
            parentQData.repeatingGroup = [];
        parentQData.repeatingGroup.push(qData);

        var questionDiv = $.RexFormBuilder.addQuestionDiv(qData, listDiv);
        questionDiv.click();
    }, listDiv);
}

$.RexFormBuilder.addNewQuestion = function() {
    if (!$.RexFormBuilder.currentPage)
        return;

    $.RexFormBuilder.closeOpenedEditor(function () {
        var pageData = $.RexFormBuilder.currentPage.data('data');
        var questionData = $.RexFormBuilder.context.createNewQuestion();
        pageData.questions.push(questionData);
        var questionDiv = $.RexFormBuilder.addQuestionDiv(questionData);
        questionDiv.click();

        var doEffect = function () {
            questionDiv.effect("highlight", 
                                { color: '#bdecd0' }, 2000);
        };

        if ($.RexFormBuilder.isScrolledIntoView(questionDiv, questionListDiv))
            doEffect();
        else {
            var scrollOffset = questionListDiv.scrollTop();
            var scrollTop = questionDiv.offset().top
                            + scrollOffset
                            - questionListDiv.offset().top;

            questionListDiv.animate({
                    scrollTop: scrollTop
                },
                200,
                "linear",
                doEffect
            );
        }
    }, questionListDiv);
}

$.RexFormBuilder.processREXLObject = function (rexlObj, chCount, oldName, newName) {
    if (rexlObj.type === "IDENTIFIER") {
        if (rexlObj.value === oldName) {
            rexlObj.value = newName;
            ++chCount;
        }
    }

    if (rexlObj.args && rexlObj.args.length) {
    
        if (rexlObj.type === "OPERATION" &&
            rexlObj.value === "." && rexlObj.args.length > 0) {

            chCount += $.RexFormBuilder.processREXLObject(rexlObj.args[0],
                                                        chCount,
                                                        oldName,
                                                        newName);

        } else {

            for (var idx in rexlObj.args) {
                chCount += $.RexFormBuilder.processREXLObject(rexlObj.args[idx],
                                                            chCount,
                                                            oldName,
                                                            newName);
            }
        }
    }

    return chCount;
}

$.RexFormBuilder.renameREXLIdentifierIfExist = 
        function (obj, condName, oldName, newName) {

    var chCounter = 0;

    if (obj[condName] && obj.cache && obj.cache[condName]) {
        if (chCounter = $.RexFormBuilder.processREXLObject(obj.cache[condName], 
                                                         0, 
                                                         oldName, 
                                                         newName)) {

            obj[condName] = obj.cache[condName].toString();
            console.log('updated:', obj[condName]);
        }
    }
    return chCounter;
}

$.RexFormBuilder.renameREXLIdentifiers = function (oldName, newName) {
    var qIndex = $.RexFormBuilder.context.getIndexByType('question');
    for (var pos in qIndex) {
        $.RexFormBuilder.renameREXLIdentifierIfExist(qIndex[pos], 
                                                   'disableIf',
                                                   oldName,
                                                   newName);
        $.RexFormBuilder.renameREXLIdentifierIfExist(qIndex[pos],
                                                   'constraints', 
                                                   oldName, 
                                                   newName);
    }

    $('.rb_question_editor', questionListDiv).each(function () {
        var editor = $(this);

        if ($.RexFormBuilder.renameREXLIdentifierIfExist(this, 
                                                       'disableIf',
                                                       oldName,
                                                       newName)) {

            $.RexFormBuilder.updateDisableLogicDescription(editor);
        }

        if ($.RexFormBuilder.renameREXLIdentifierIfExist(this, 
                                                       'constraints',
                                                       oldName,
                                                       newName)) {

            $.RexFormBuilder.updateConstraintsDescription(editor);
        }
    });

    var pIndex = $.RexFormBuilder.context.getIndexByType('page');
    for (var pos in pIndex) {
        $.RexFormBuilder.renameREXLIdentifierIfExist(pIndex[pos],
                                                   'skipIf',
                                                   oldName,
                                                   newName);
    }

    var pIndex = $.RexFormBuilder.context.getIndexByType('group');
    for (var pos in pIndex) {
        $.RexFormBuilder.renameREXLIdentifierIfExist(pIndex[pos],
                                                   'skipIf',
                                                   oldName,
                                                   newName);
    }
}

$.RexFormBuilder.addNewPage = function(btn) {
    var pageDiv = btn ? $(btn).parents('.rb_page:first') : null;
    var newPageData = $.RexFormBuilder.context.createNewPage();
    var target = $.RexFormBuilder.addPage(newPageData);

    if (pageDiv)
        pageDiv.after(target);
    else
        $.RexFormBuilder.pageListDiv.append(target);

    var pagesScollable = $('.rb_pages_scrollable');
    var doEffect = function () {
        target.effect("highlight", { color: '#bdecd0' }, 2000);
    };

    if ($.RexFormBuilder.isScrolledIntoView(target, pagesScollable))
        doEffect();
    else {
        var scrollOffset = pagesScollable.scrollTop();
        var scrollTop = target.offset().top
                        + scrollOffset
                        - pagesScollable.offset().top;

        pagesScollable.animate({
                scrollTop: scrollTop
            },
            200,
            "linear",
            doEffect
        );
    }
}

$.RexFormBuilder.getPageSummary = function(data, targetDiv) {
    if (data.title)
        targetDiv.html('<strong>'
                        + builder.escapeHTML(data.title)
                        + '</strong>');
    else if (data.questions.length > 0) {
        var ret = '<strong>'
                + builder.escapeHTML(
                      $.RexFormBuilder.truncateText(data.questions[0].title, 40)
                  )
                + '</strong>';
        if (data.questions.length > 1)
            ret += "<BR>and " + (data.questions.length - 1)
                + " other question" 
                + (data.questions.length > 2 ? "s" : "");
        targetDiv.html(ret);
    }
    else
        targetDiv.html('No questions');
}

$.RexFormBuilder.updatePageDiv = function (pageDiv) {
    var data = pageDiv.data('data');
    
    var pageTitle = $('.rb_div_page_title:first', pageDiv);
    $.RexFormBuilder.getPageSummary(data, pageTitle);
}

$.RexFormBuilder.makeREXLCache = function (obj, condName) {
    if (obj[condName]) {
        try {
            var parsed = rexl.parse(obj[condName]);

            if (!obj['cache'])
                obj['cache'] = {};

            obj['cache'][condName] = parsed;
        } catch(err) {
            delete obj[condName];
        }
    }
}

$.RexFormBuilder.addPage = function(page, to) {

    if (page.type === 'group') {
        var newGroup = $.RexFormBuilder.createGroup('pageGroup');
        if (to) {
            to.append(newGroup);
            $.RexFormBuilder.setPageListSortable(
                newGroup.find('.rb_class_pages_list')
            );
        }

        $.RexFormBuilder.makeREXLCache(page, 'skipIf');

        newGroup.data('data', page);
        $.RexFormBuilder.updateGroupDiv(newGroup);
        for (var idx in page.pages) {
            var item = page.pages[idx];
            $.RexFormBuilder.context.putToIndex(item.type, item);
            $.RexFormBuilder.addPage(
                item, newGroup.children('.rb_class_pages_list')
            );
        }

        return newGroup;
    }

    // this is a page
    var newPageDiv = $.RexFormBuilder.templates.createObject('page');

    if (to)
        to.append(newPageDiv);

    $.RexFormBuilder.makeREXLCache(page, 'skipIf');
    newPageDiv.data('data', page);

    function fixQuestionData(qData) {
        if (qData['name'].length > 40) {
            qData['name'] = qData['name'].substring(0, 40);
            alert('truncated question name: ' + qData['name'])
        }

        if (qData['questionType']) {
            qData['type'] = qData['questionType'];
            delete qData['questionType'];
        }

        if (qData['isMandatory'] !== undefined) {
            qData['required'] = qData['isMandatory'];
            delete qData['isMandatory'];
        }

        if (qData.type === "list")
            qData.type = "set";
        else if (qData.type === "radio")
            qData.type = "enum";
        else if (qData.type === "yes_no") {
            qData.type = "enum";
            qData.answers = [
                {
                    "code": "yes",
                    "title": "Yes"
                },
                {
                    "code": "no",
                    "title": "No"
                }
            ];
        }

        if (qData['answers']) {
            $.each(qData['answers'], function (_, answer) {
                answer['code'] = answer['code'].replace(/\-/g, '_');
                if (answer['code'].length > 20) {
                    answer['code'] = answer['code'].substring(0, 20);
                    alert('truncated answer code: ' + answer['code']);
                }
            });
        }
    }

    for (var idx in page.questions) {
        var qData = page.questions[idx];

        fixQuestionData(qData);

        $.RexFormBuilder.makeREXLCache(qData, 'disableIf');
        $.RexFormBuilder.makeREXLCache(qData, 'constraints');

        $.RexFormBuilder.context.putToIndex('question', qData);
        if (qData.repeatingGroup && qData.type === "rep_group") {
            for (var sIdx in qData.repeatingGroup) {
                var subQuestion = qData.repeatingGroup[sIdx];
                fixQuestionData(subQuestion);

                subQuestion.slave = true;

                $.RexFormBuilder.makeREXLCache(subQuestion, 'disableIf');
                $.RexFormBuilder.makeREXLCache(subQuestion, 'constraints');

                $.RexFormBuilder.context.putToIndex('question', subQuestion);
            }
        } else if (builder.isListType(qData.type)) {
            $.RexFormBuilder.updatePredefinedChoices(qData.answers);
        }
    }

    if (!page.cId)
        page.cId = builder.getCId('page');

    $.RexFormBuilder.updatePageDiv(newPageDiv);

    newPageDiv.click(function (event) {
        if (event.shiftKey) {
            document.getSelection().removeAllRanges();
            if ($.RexFormBuilder.currentPage) {
                $.RexFormBuilder.currentSelection = [];
                var fromPage = $.RexFormBuilder.currentPage;
                var toPage = $(this);
                var selectIt = false;
                $.RexFormBuilder.pageListDiv.find('.rb_page').each(function () {
                    var jThis = $(this);
                    if (jThis[0] === fromPage[0] ||
                        jThis[0] === toPage[0]) {

                        selectIt = !selectIt;
                        jThis.addClass('rb_covered');
                        $.RexFormBuilder.currentSelection.push(jThis);
                    } else if (selectIt) {
                        jThis.addClass('rb_covered');
                        $.RexFormBuilder.currentSelection.push(jThis);
                    } else {
                        jThis.removeClass('rb_covered');
                    }
                });
            }
        } else {
            $.RexFormBuilder.pageListDiv.find('.rb_covered').removeClass('rb_covered');
            $.RexFormBuilder.currentSelection = [ $(this) ];
            $.RexFormBuilder.selectPage(this);
        }

        if ($.RexFormBuilder.currentSelection && $.RexFormBuilder.currentSelection.length) {
            $('#make_group_btn').removeAttr('disabled');
        } else {
            $('#make_group_btn').attr('disabled','disabled');
        }

        event.preventDefault();
    });
    
    return newPageDiv;
}

$.RexFormBuilder.updateConstraintsDescription = function(questionEditor) {
    var targetSpan = questionEditor.find('.rb_constraint_descr');
    var constraints = questionEditor[0].constraints;

    if (constraints && !(constraints instanceof Object)) {
        targetSpan.removeClass('constraints_not_set')
                  .html('Valid if: ' + builder.escapeHTML(
                            $.RexFormBuilder.truncateText(constraints, 30)));
    } else {
        targetSpan.addClass('constraints_not_set')
                  .html('No constraints');
    }
};

// TODO: rewrite this and saveQuestion functions to not repeat code 

$.RexFormBuilder.collectQuestionData = function (editor) {

    var inputTitle = $('textarea[name="question-title"]:first', editor);
    var qTitle = jQuery.trim( inputTitle.val() );
    var qRequired = $('input[name="question-required"]:first', editor)
                        .attr('checked') ? true: false;
    var qQuestionType =
            $('select[name="question-type"]:first', editor).val();

    var validationError = false;
    var preloadedAnswers = [];

    if (!qTitle) {
        validationError = true;
    }

    if (!validationError) {

        if (builder.isListType(qQuestionType)) {
            var choicesList = $('.choices-list:first', editor)
                                .find('.choices-list-items:first');
            var items = $('.rb_choices_item', choicesList);
            if (items.size() == 0)
                validationError = true;
            else {
                for (var idx = 0; idx < items.size(); idx++) {
                    var jItem = $(items[idx]);
                    var answerCode = jQuery.trim(
                            $('input[name="answer-code"]', jItem).val()
                        );
                    var answerTitle = jQuery.trim(
                            $('input[name="answer-title"]', jItem).val()
                        );
                    var answerScore = '';

                    if (answerCode === '' && answerTitle === '') {
                        continue;
                    } else if (answerCode === '' ||
                        builder.illegalIdChars.test(answerCode)) {
                        validationError = true;
                        break;
                    } else if (answerScore !== '' && 
                                !/^[0-9]+$/.test(answerScore)) {
                        validationEerror = true;
                    } else if (preloadedAnswers[answerCode] !== undefined) {
                        validationError = true;
                        break;
                    }

                    preloadedAnswers.push ({
                        'code': answerCode,
                        'title': answerTitle
                    });
                }
            }
        }
    }

    if (!validationError) {
        return {
            'title': qTitle,
            'questionType': qQuestionType,
            'answers': preloadedAnswers
        }
    } else {
        return null;
    }
}

$.RexFormBuilder.changeConstraints = function(btn) {
    var jButton = $(btn);
    var questionEditor = jButton.parents('.rb_question_editor:first');

    $.RexFormBuilder.constraintsThisQuestion =
        $.RexFormBuilder.collectQuestionData(questionEditor);

    if ($.RexFormBuilder.constraintsThisQuestion) {
        $.RexFormBuilder.conditionEditor.open({
            title: 'Edit Constraints',
            callback: function (newValue) {
                questionEditor[0].constraints = newValue;
                $.RexFormBuilder.makeREXLCache(questionEditor[0], 'constraints');
                $.RexFormBuilder.updateConstraintsDescription(questionEditor);
            },
            defaultIdentifier: 'this',
            onClose: function (newValue) {
                $.RexFormBuilder.constraintsThisQuestion = null;
            },
            conditions: questionEditor[0].constraints
        });
    } else {
        alert('Impossible: there are wrong values in the editor');
    }
}

$.RexFormBuilder.getAnswersString = function(questionData) {
    var titles = [];
    for (var idx in questionData['answers']) {
        var title = questionData['answers'][idx]['title'];

        if (!title)
            title = questionData['answers'][idx]['code']

        titles.push(title);
    }
    return titles.join(', ');
}

$.RexFormBuilder.getQuestionDescription = function(questionData) {
    var type = questionData.type;

    if (builder.isListType(type))
        return $.RexFormBuilder.getAnswersString(questionData);
    else
        return builder.questionTypes[type].title;
}

$.RexFormBuilder.newInstrument = function() {
    $.RexFormBuilder.clearWorkspace();
    $.RexFormBuilder.instrumentName = null;
    $.RexFormBuilder.instrumentTitle = '';
    $.RexFormBuilder.context.clearIndexes();
}

$.RexFormBuilder.clearQuestions = function() {
    questionListDiv.contents().remove();
}

$.RexFormBuilder.stopEvent = function(event) {
    if (!event)
        event = window.event;
    event.stopPropagation();
}

$.RexFormBuilder.changeDisableLogic = function(btn) {
    var jButton = $(btn);
    var questionEditor = jButton.parents('.rb_question_editor:first');

    $.RexFormBuilder.conditionEditor.open({
        title: 'Edit Disable-Logic Conditions',
        callback: function (newValue) {
            questionEditor[0].disableIf = newValue;
            $.RexFormBuilder.makeREXLCache(questionEditor[0], 'constraints');
            $.RexFormBuilder.updateDisableLogicDescription(questionEditor);
        },
        conditions: questionEditor[0].disableIf
    });
}

$.RexFormBuilder.showJSONDialog = null;
$.RexFormBuilder.editPageDialog = null;
$.RexFormBuilder.editParamDialog = null;
$.RexFormBuilder.beforeTestDialog = null;
$.RexFormBuilder.conditionEditor = null;
$.RexFormBuilder.questionDialog = null;
$.RexFormBuilder.progressDialog = null;
$.RexFormBuilder.pageListDiv = null;
$.RexFormBuilder.paramListDiv = null;
$.RexFormBuilder.context = null;
$.RexFormBuilder.templates = null;

$.RexFormBuilder.pageTitleSpan = null;
$.RexFormBuilder.pageTitleInput = null;
$.RexFormBuilder.pageSkipWhenSpan = null;
$.RexFormBuilder.mainPartContent = null;
$.RexFormBuilder.currentSelection = null;
$.RexFormBuilder.currentPositionIndex = null;

$.RexFormBuilder.currentPage = null;

$.RexFormBuilder.onPageTitleChanged = function () {
    var newTitle = $.RexFormBuilder.pageTitleInput.val();
    var data = $.RexFormBuilder.currentPage.data('data');
    data.title = newTitle;
    $.RexFormBuilder.updatePageDiv($.RexFormBuilder.currentPage);
    $.RexFormBuilder.updatePageTitleSpan(data);
    // $.RexFormBuilder.pageTitleSpan.text(newTitle);
    $.RexFormBuilder.pageTitleInput.css('display', 'none');
    $('.rb_page_title_wrap').css('display', '');
}

$.RexFormBuilder.editGroupSkipConditions = function(a) {
    var groupDiv = $(a).parents('.rb_page_group:first');
    var data = groupDiv.data('data');
    $.RexFormBuilder.conditionEditor.open({
        title: 'Edit Skip-Logic Conditions',
        callback: function (newValue) {
            data.skipIf = newValue;
            $.RexFormBuilder.makeREXLCache(data, 'skipIf');
            $.RexFormBuilder.updateGroupSkipSpan(groupDiv);
        },
        conditions: data.skipIf
    });
}

$.RexFormBuilder.editPageSkipConditions = function() {
    var data = $.RexFormBuilder.currentPage.data('data');
    $.RexFormBuilder.conditionEditor.open({
        title: 'Edit Skip-Logic Conditions',
        callback: function (newValue) {
            var data = $.RexFormBuilder.currentPage.data('data');
            data.skipIf = newValue;
            $.RexFormBuilder.makeREXLCache(data, 'skipIf');
            $.RexFormBuilder.updatePageWhenSpan(data);
        },
        conditions: data.skipIf
    });
}

$.RexFormBuilder.toType = function (obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

builder.initConditionEditor = function () {
    builder.conditionEditor = new ConditionEditor({
        urlPrefix: $.RexFormBuilder.basePrefix,
        manualEdit: builder.context.manualEditConditions,
        identifierTitle: 'Question or parameter',
        onDescribeId: function (identifier) {

            var ret = null;
            var questionData = null;

            if (identifier === "this") {
                if ($.RexFormBuilder.constraintsThisQuestion)
                    questionData = $.RexFormBuilder.constraintsThisQuestion;
            } else
                questionData = $.RexFormBuilder.context.findQuestionData(identifier);

            if (questionData) {
                ret = {};
                switch(questionData.type) {
                case 'float':
                case 'integer':
                    ret.type = 'number';
                    break;
                case 'set':
                case 'enum':
                case 'yes_no':

                    if (questionData.type === "set")
                        ret.type = "set";
                    else
                        ret.type = "enum";

                    if (questionData.type === "yes_no")
                        ret.variants = [
                            {
                                code: 'yes',
                                title: 'Yes'
                            },
                            {
                                code: 'no',
                                title: 'No'
                            }
                        ];
                    else
                        ret.variants = questionData.answers;

                    break;
                case 'date':
                    ret.type = 'date';
                    break;
                case 'string':
                case 'text':
                default:
                    ret.type = 'string';
                    break;
                }
            } else if (identifier !== "this") {
                var paramData = $.RexFormBuilder.context.findParamData(identifier);
                if (paramData) {
                    ret = {};

                    switch(paramData.type) {
                    case 'NUMBER':
                        ret.type = 'number';
                        break;
                    case 'STRING':
                    default:
                        if (builder.context.extParamTypes) {
                            var typeDesc = 
                                builder.context.extParamTypes[paramData.type];

                            console.log('typeDesc[' + paramData.type +']:', typeDesc);

                            if (typeDesc) {
                                switch(typeDesc.type) {
                                case 'NUMBER':
                                    ret.type = 'number';
                                    break;
                                case 'ENUM':
                                    ret.type = 'enum';
                                    ret.variants = typeDesc.variants;
                                    break;
                                case 'DATE':
                                    ret.type = 'date';
                                    break;
                                default:
                                case 'STRING':
                                    ret.type = 'string';
                                    break;
                                }
                            } else {
                                ret.type = 'string';
                            }
                        } else
                            ret.type = 'string';
                        break;
                    }
                }
            }

            console.log('onDescribeId[' + identifier + ']', ret);

            return ret;
        },
        onSearchId: function (term) {

            var ret = [];
            var matcher =
                new RegExp($.ui.autocomplete.escapeRegex(term), "i");

            if ($.RexFormBuilder.constraintsThisQuestion) {
                var item = $.RexFormBuilder.constraintsThisQuestion;
                if ("this".indexOf(term) != -1) {
                    ret.push({
                        "title": item.title ?
                            $.RexFormBuilder.truncateText(item.title, 80) : '',
                        "value": "this"
                    });
                }
            }

            var qIndex = $.RexFormBuilder.context.getIndexByType('question');
            for (var pos in qIndex) {
                var item = qIndex[pos];
                
                if (!item.slave && item.name) {
                    if (item.name.search(matcher) !== -1 ||
                        (item.title &&
                            item.title.search(matcher) !== -1)) {

                        ret.push({
                            "title": item.title ?
                                $.RexFormBuilder.truncateText(item.title, 80) : '',
                            "value": item.name
                        });
                    }
                }
            }

            var pIndex = $.RexFormBuilder.context.getIndexByType('parameter');

            for (var pos in pIndex) {
                var item = pIndex[pos];

                if (item.name.search(matcher) !== -1) {
                    ret.push({
                        "title": 'parameter ('
                                + builder.paramTypeTitle(item.type, builder.context.extParamTypes)
                                + ')',
                        "value": item.name
                    });
                }
            }

            console.log('onSearchId', ret);
            return ret;
        }
    });
}

builder.init = function (o) {
    builder.context =
        new Context(o.instrumentName, o.instrumentCode,
                    o.extParamTypes, o.manualEditConditions || false,
                    o.urlStartTest || null, o.urlSaveForm || null);

    builder.nodes = {};
    builder.nodes.paramListDiv = $('.rb_params_list');
    builder.nodes.pageListDiv = $('.rb_pages_list');
    builder.nodes.pageListDiv
        .data('normalOffset', builder.nodes.pageListDiv.offset());
    builder.setPageListSortable(builder.nodes.pageListDiv);
    builder.nodes.questionListDiv = $('.rb_question_list');
    builder.setQuestionsSortable(builder.nodes.questionListDiv);

    builder.nodes.pageTitleSpan =
        $('.rb_page_title').click(function () {
            builder.editPageTitle();
        });
    builder.nodes.pageSkipWhenSpan = $('#page_skip_when');
    builder.nodes.pageTitleInput =
        $('.rb_page_title_input')
            .change(builder.onPageTitleChanged)
            .focusout(builder.onPageTitleChanged)
            .keypress(function (e) {
                if (e.keyCode == 13)
                    builder.onPageTitleChanged(e);
            });
    builder.nodes.mainPartContent = $('.rb_main_part_content');
    builder.nodes.instrumentTitleInput =
        $('#rb_instrument_title_input')
            .change($.RexFormBuilder.onInstrumentTitleChanged)
            .focusout($.RexFormBuilder.onInstrumentTitleChanged);
    $('#rb_instrument_title_view')
        .children().click(builder.editInstrumentTitle);
    builder.templates = new Templates();

    builder.constraintsThisQuestion = null;
    builder.initDialogs();
    builder.initConditionEditor();

    $.RexFormBuilder.updatePredefinedChoices([
        {
            code: 'yes',
            title: 'Yes'
        },
        {
            code: 'no',
            title: 'No'
        }
    ]);

    builder.createInstrumentNodes();
};

$.RexFormBuilder.getItemLevel = function(pageDiv, objType) {
    var level = 0;
    var cls = (objType === 'page') ?
                'rb_page_group':
                'rb_condition_group';
    var element = pageDiv.parents("." + cls + ":first");
    while (element.size()) {
        ++level;
        element = element.parents("." + cls + ":first");
    }
    return level;
}

$.RexFormBuilder.checkIfEdge = function(element, fromLeft, objType) {
    var selector = (objType === 'page') ?
                        '.rb_page,.rb_page_group':
                        '.rb_condition_item,.rb_condition_group';
    return (fromLeft && element.prev(selector).size() === 0) ||
            (!fromLeft && element.next(selector).size() === 0);
}

$.RexFormBuilder.getLowestAllowedLevel = function(element, level, fromLeft, objType) {

    var cls = (objType === 'page') ?
                    'rb_page_group' : 'rb_condition_group';

    while (element.size() && level) {
        if ($.RexFormBuilder.checkIfEdge(element, fromLeft, objType)) {
            --level;
            element = element.parent('.' + cls + ':first');
        } else
            break;
    }
    return level;
}

$.RexFormBuilder.getCutoff = function(page, objType) {
    var cutoff = [];
    var element = page;

    var chkId = (objType === 'page') ?
                    'rb_pages_list':
                    'rb_condition_builder_list';

    cutoff.push(element);

    do {
        element = element.parent();
        
        if (!element.hasClass(chkId))
            cutoff.unshift(element);
    } while (element.attr('class') !== chkId && element.size())

    return cutoff;
}

$.RexFormBuilder.interceptCutoff = function(cutoff1, cutoff2) {
    var intercept = []
    var len = cutoff1.length < cutoff2.length ? 
                cutoff1.length:
                cutoff2.length;
                
    for (var idx = 0; idx < len; idx++) {
        if (cutoff1[idx][0] === cutoff2[idx][0])
            intercept.push(cutoff1[idx]);
    }
    return intercept;
}

$.RexFormBuilder.removePage = function(btn) {
    var pageDiv = $(btn).parents('.rb_page:first');
    var pageData = pageDiv.data('data');
    for (var idx in pageData.questions) {
        $.RexFormBuilder.context.removeFromIndex('question', pageData.questions[idx]);
    }
    $.RexFormBuilder.context.removeFromIndex('page', pageData);
    pageDiv.remove();
}

$.RexFormBuilder.removeGroup = function(link) {
    var groupDiv = $(link).parents('.rb_page_group:first');
    var hasInnerElements = groupDiv
                            .find('.rb_page,.rb_page_group').size() > 0;

    var buttons = {};
    var title = '';

    var groupData = groupDiv.data('data');
    if (hasInnerElements) {
        title = 'Do you really want to remove the "' 
                + groupData.title + '" group with ' 
                + 'all nested groups and pages?';
        buttons['Yes'] = function () {
            return 'REMOVE_ALL';
        }
        buttons['Yes, but preserve content'] = function () { 
            return 'REMOVE';
        }
    } else {
        title = 'Do you really want to remove the "' 
                + groupData.title + '" group?';
        buttons['Yes'] = function () { return 'REMOVE_ALL'; };
    }

    buttons['No'] = function () { return false; };
    $.RexFormBuilder.questionDialog.open({
        txt: title,
        title:'Confirm removing',
        buttons: buttons,
        onResult: function (res) {
            switch(res) {
            case 'REMOVE':
                groupDiv.before(groupDiv.find('.rb_page,.rb_page_group'));
            case 'REMOVE_ALL':
                groupDiv.remove();
                break;
            }
        }
    });
}

$.RexFormBuilder.editPage = function(link) {
    var pageDiv = $(link).parents('.rb_page:first');
    $.RexFormBuilder.editPageDialog.open({
        mode: 'page',
        target: pageDiv
    });
}

$.RexFormBuilder.editGroup = function(link) {
    var groupDiv = $(link).parents('.rb_page_group:first');
    $.RexFormBuilder.editPageDialog.open({
        mode: 'group',
        target: groupDiv
    });
}

$.RexFormBuilder.makePageGroupFromSelection = function() {
    $.RexFormBuilder.editPageDialog.open({
        mode: 'group'
    });
}

$.RexFormBuilder.processSelectedPages = function(newGroupName) {
    var firstPage = $.RexFormBuilder.currentSelection[0];
    var lastPage = 
        $.RexFormBuilder.currentSelection[$.RexFormBuilder.currentSelection.length - 1];
    var pushToGroup = [];

    if (firstPage === lastPage) {
        pushToGroup.push(firstPage);
    } else {
        var firstLevel = $.RexFormBuilder.getItemLevel(firstPage, 'page');
        var secondLevel = $.RexFormBuilder.getItemLevel(lastPage, 'page');

        var firstLowestAllowedLevel =
                $.RexFormBuilder.getLowestAllowedLevel(firstPage, firstLevel, true);

        var lastLowestAllowedLevel =
                $.RexFormBuilder.getLowestAllowedLevel(lastPage, secondLevel, false);

        var lowestAllowedLevel =
                (firstLowestAllowedLevel < lastLowestAllowedLevel) ?
                                    lastLowestAllowedLevel:
                                    firstLowestAllowedLevel;

        if (lowestAllowedLevel > firstLevel ||
            lowestAllowedLevel > secondLevel)
            return;

        var firstCutoff = $.RexFormBuilder.getCutoff(firstPage, 'page');
        var lastCutoff = null;
        var cutoff = firstCutoff;
        var total = $.RexFormBuilder.currentSelection.length;

        for (var idx = 1; idx < total; idx++) {
            var currentCutoff = 
                $.RexFormBuilder.getCutoff($.RexFormBuilder.currentSelection[idx], 
                                        'page');
            cutoff = $.RexFormBuilder.interceptCutoff(cutoff, currentCutoff);
            if (cutoff.length - 1 < lowestAllowedLevel) {
                return;
            }
            if (idx == total - 1)
                lastCutoff = currentCutoff;
        }

        if (lastCutoff) {
            var startFrom = firstCutoff[ cutoff.length ];
            var endOn = lastCutoff[ cutoff.length ];

            pushToGroup.push(startFrom);
            var element = startFrom;

            do {
                element = element.next();
                pushToGroup.push(element);
            } while (endOn[0] !== element[0] && element.size());
        }
    }

    if (pushToGroup.length) {
        var pageGroup = $.RexFormBuilder.createGroup('pageGroup');
        var pageSublistDiv = pageGroup.find('.rb_class_pages_list:first');

        var newGroupData = $.RexFormBuilder.context.createNewGroup();
        pushToGroup[0].before(pageGroup);
        newGroupData.title = newGroupName;
        pageGroup.data('data', newGroupData);

        for (var idx in pushToGroup) {
            pageSublistDiv.append(pushToGroup[idx]);
        }
        $.RexFormBuilder.setPageListSortable(pageSublistDiv);
        $.RexFormBuilder.updateGroupDiv(pageGroup);
    }
}

$.RexFormBuilder.showProgress = function(params) {
    $.RexFormBuilder.progressDialog.startParams = params;
    $.RexFormBuilder.progressDialog.dialog('option', 'buttons', params['buttons']);
    $('.rb_progress_text', $.RexFormBuilder.progressDialog).html(params['title']);
    $.RexFormBuilder.startPollingTimeout();
    $.RexFormBuilder.progressDialog.dialog("open");
}

$.RexFormBuilder.closeProgress = function() {
    $.RexFormBuilder.stopPollingTimeout();
    $.RexFormBuilder.progressDialog.startParams = null;
    $.RexFormBuilder.progressDialog.dialog("close");
}

$.RexFormBuilder.stopPollingTimeout = function() {
    if ($.RexFormBuilder.progressDialog.pollTimeout !== null) {
        clearTimeout($.RexFormBuilder.progressDialog.pollTimeout)
        $.RexFormBuilder.progressDialog.pollTimeout = null;
    }
}

$.RexFormBuilder.startPollingTimeout = function() {
    $.RexFormBuilder.progressDialog.pollTimeout =
        setTimeout("$.RexFormBuilder.progressDialogPolling()", 1000);
}

$.RexFormBuilder.progressDialogPolling = function() {
    var params = $.RexFormBuilder.progressDialog.startParams;
    params['pollCallback']();
}

$.RexFormBuilder.showInstrumentJSON = function() {
    
}

$.RexFormBuilder.testInstrument = function() {

    var params = $.RexFormBuilder.context.getIndexByType('parameter');
    var toBeContinued = function (paramDict) {
        $.RexFormBuilder.closeOpenedEditor(function () {
            $.RexFormBuilder.showProgress({
                title: '<center>Preparing the form for a test...</center>',
                pollCallback: function () { }
            });

            $.RexFormBuilder.savedParamValues = paramDict;
            $.RexFormBuilder.saveInstrumentReal($.RexFormBuilder.testInstrumentStage4);
        }, questionListDiv);
    }

    if (params.length) {
        $.RexFormBuilder.beforeTestDialog.open({
            paramValues: $.RexFormBuilder.savedParamValues || {},
            callback: toBeContinued
        });
    } else
        toBeContinued({});
}

$.RexFormBuilder.testInstrumentStage2 = function() {
    $.ajax({url : $.RexFormBuilder.basePrefix
                    + "/construct_instrument?code="
                    + $.RexFormBuilder.instrumentName
                    + '&schema=demo',
        success : function(content) {
            console.log('construct successful:', content);
            $.RexFormBuilder.testInstrumentStage4();
        },
        error: function() {
            $.RexFormBuilder.closeProgress();
            alert('Error of construct_instrument!');
        },
        type: 'GET'
    });
}

$.RexFormBuilder.testInstrumentStage4 = function() {
    $.RexFormBuilder.closeProgress();
    var paramStr = '';
    if ($.RexFormBuilder.savedParamValues) {
        for (var paramName in $.RexFormBuilder.savedParamValues) {
            paramValue = $.RexFormBuilder.savedParamValues[paramName];
            paramStr += '&' + 'p_' + encodeURIComponent(paramName) + '=' 
                        + (paramValue ? encodeURIComponent(paramValue) : '');
        }
    }
    var url = $.RexFormBuilder.context.urlStartTest || 
            ($.RexFormBuilder.formsPrefix + '/start_roads');

    var query = 'test=1&'
              + 'instrument=' + encodeURIComponent($.RexFormBuilder.instrumentName)
              + paramStr;

    window.open(url + '?' + query, '_blank');
}

*/

})();
