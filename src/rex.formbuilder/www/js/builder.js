
(function () {

var builderNS = $.RexFormsBuilder = $.RexFormsBuilder || {};

(function () {
    var scripts = document.getElementsByTagName( 'script' );
    var thisScriptTag = $(scripts[ scripts.length - 1 ]);
    builderNS.basePrefix =
        thisScriptTag.attr('data-prefix') || '';
    builderNS.formsPrefix =
        thisScriptTag.attr('data-forms-prefix') || '';
})();

$.RexFormsBuilder.QTypes = {
    'integer': 'Integer',
    'float': 'Float',
    'enum': 'One-choice List',
    'set': 'Multi-select List',
    'string': 'Text String',
    'text': 'Text',
    'date': 'Date',
    'weight' : 'Weigth',
    'time_week' : 'Time (weeks)',
    'time_month' : 'Time (month)',
    'time_hours' : 'Time (hours)',
    'time_minutes' : 'Time (minutes)',
    'time_days' : 'Time (days)',
    'rep_group': 'Repeating Group of Questions'
};

$.RexFormsBuilder.predefinedLists = {};

$.RexFormsBuilder.loadInstrument = function (instrumentName) {
    var url = $.RexFormsBuilder.basePrefix 
            + "/load_instrument?code=" + instrumentName;
    $.ajax({url : url,
        success : function(content) {
            $.RexFormsBuilder.loadInstrumentSchema(instrumentName, content);
        },
        type: 'GET'
    });
}

$.RexFormsBuilder.TemplatesF = function () {
    var templates = {};

    var Init = function () {
        templates.questionEditor = $('#tpl_question_editor');
        templates.questionEditor.removeAttr('id');

        var selectQType = $('select[name="question-type"]',
                                    templates.questionEditor);
        if (selectQType) {
            for (type in $.RexFormsBuilder.QTypes) {
                selectQType.append($('<option value="' + type 
                                + '">' + $.RexFormsBuilder.QTypes[type]
                                + '</option>').text($.RexFormsBuilder.QTypes[type]));
            }
        }

        templates.choicesItem = $('#tpl_choices_item');
        templates.choicesItem.removeAttr('id');
        
        templates.question = $('#tpl_question');
        templates.question.removeAttr('id');

        templates.page = $('#tpl_page');
        templates.page.removeAttr('id');

        templates.pageGroup = $('#tpl_page_group');
        templates.pageGroup.removeAttr('id');

        templates.parameter = $('#tpl_parameter');
        templates.parameter.removeAttr('id');
    }

    function createObject(type) {
        if (templates[type])
            return templates[type].clone();
        return null;
    }

    function getTemplate(tplName) {
        if (templates[tplName])
            return templates[tplName];
        return null;
    }

    Init.prototype = {
        createObject: createObject,
        getTemplate: getTemplate
    }
    
    return Init;
}

$.RexFormsBuilder.ContextF = function () {
    var pages = {};
    var objectCounters = {};
    var questionIndex = [];
    var pageIndex = [];
    var groupIndex = [];
    var paramIndex = [];
    var Init = function () {
        
    }

    function getIndexByType(indexType) {
        switch(indexType) {
        case 'question':
            return questionIndex;
        case 'page':
            return pageIndex;
        case 'group':
            return groupIndex;
        case 'parameter':
            return paramIndex;
        }
        return null;
    }

    function inIndex(indexType, object) {
        var indexRef = getIndexByType(indexType);
        for (var posIdx = 0; posIdx < indexRef.length; posIdx++) {
            if (indexRef[posIdx] === object)
                return posIdx;
        }
        return null;
    }

    function sortIndexReal(indexType, indexRef) {
        var sortFunction;
        
        if (indexType === "parameter")
            sortFunction = function(a,b) {
                return (a.name < b.name)? -1: 1;
            };
        else if (indexType === "page" ||
                 indexType === "group")
            sortFunction = function (a,b) {
                return (a.cId < b.cId) ? -1: 1;
            };
        else
            sortFunction = function(a,b) {
                return (a.title < b.title)? -1: 1;
            };

        indexRef.sort(sortFunction);
    }

    function clearIndex(idxName) {
        var index = getIndexByType(idxName);
        index.length = 0;
    }

    Init.prototype = {
        clearIndexes: function () {
            clearIndex('question');
            clearIndex('page');
            clearIndex('group');
            clearIndex('parameter');
        },
        dumpIndexes: function () {
            var indexTypes = ['question', 'page', 'group', 'parameter' ];
            $.each(indexTypes, function (_, indexType) {
                var index = getIndexByType(indexType);
                // console.log(indexType, 'index:', index);
            });
        },
        clearIndex: clearIndex,
        inIndex: inIndex,
        findPageData: function (pageName) {
            var pageIndex = getIndexByType('page');
            for (var idx in pageIndex) {
                if (pageIndex[idx]['id'] === pageName)
                    return pageIndex[idx];
            }
            return null;
        },
        findParamData: function (paramName) {
            var paramIndex = getIndexByType('parameter');
            for (var idx in paramIndex) {
                if (paramIndex[idx]['name'] === paramName)
                    return paramIndex[idx];
            }
            return null;
        },
        findQuestionData: function (questionName) {
            var questionIndex = getIndexByType('question');
            for (var idx in questionIndex) {
                if (questionIndex[idx]['name'] === questionName)
                    return questionIndex[idx];
            }
            return null;
        },
        getIndexByType: getIndexByType,
        sortIndex: function (indexType) {
            sortIndexReal(indexType, getIndexByType(indexType));
        },
        putToIndex: function (indexType, object) {
            if (inIndex(indexType, object) === null) {
                var indexRef = getIndexByType(indexType);
                indexRef.push(object);
                sortIndexReal(indexType, indexRef);
            }
        },
        removeFromIndex: function (indexType, object) {
            var posIdx = inIndex(indexType, object);

            // console.log('removeFromIndex:', posIdx, object);

            /*
            var temp = null;
            if (posIdx === null)
                return temp['a'];
            */

            if (posIdx !== null) {
                var indexRef = getIndexByType(indexType);
                indexRef.splice(posIdx, 1);
            }
        },
        getNextObjectNum: function (objType) {
            if (objectCounters[objType] === undefined)
                objectCounters[objType] = 0;
            return objectCounters[objType]++;
        },
        getPage: function (id) {
            return pages[id];
        },
        createNewPage: function (id) {
            var newPage = {
                'cId': builderNS.getCId('page'),
                'title': null,
                'questions': []
            };
            $.RexFormsBuilder.context.putToIndex('page', newPage);
            return newPage;
        },
        createNewParameter: function (id) {
            var newParam = {
                'name': id ? id : null, 
                'type': 'NUMBER'
            };
            $.RexFormsBuilder.context.putToIndex('parameter', newParam);
            return newParam;
        },
        createNewGroup: function (title) {
            var newGroup = {
                'title': title ? title : null,
                'cId': builderNS.getCId('group'),
            };
            $.RexFormsBuilder.context.putToIndex('group', newGroup);
            return newGroup;
        },
        createNewQuestion: function () {
            var newQuestion = {
                'name': null,
                'title': null,
                'type': 'integer',
                'required': false,
                'annotation': false
            };
            $.RexFormsBuilder.context.putToIndex('question', newQuestion);
            return newQuestion;
        }
    }
    return Init;
}

$.RexFormsBuilder.namesWhichBreaksConsistency = function (names, exclude) {
    console.log('namesWhichBreaksConsistency(', names, ')');

    var badNames = {};
    var chkNames = {};
    $.each(names, function (_, name) {
        chkNames[name] = true;
    });

    questionIndex = $.RexFormsBuilder.context.getIndexByType('question');

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

$.RexFormsBuilder.preparePageMeta = function(pageDiv, to) {
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
            $.RexFormsBuilder.preparePageMeta($(innerItems[idx]), thisGroupMeta.pages);
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

$.RexFormsBuilder.generateMetaJSON = function(instrumentName, doBeautify) {
    var instrumentMeta = $.RexFormsBuilder.generateMeta(instrumentName);

    if (doBeautify && JSON && JSON.stringify)
        return JSON.stringify(instrumentMeta, null, 4);

    return $.toJSON(instrumentMeta);
}

$.RexFormsBuilder.generateMeta = function(instrumentName) {
    var instrumentMeta = {
        pages: [],
        params: [],
        title: $.RexFormsBuilder.instrumentTitle
    };

    var root = instrumentMeta['pages'];
    $.RexFormsBuilder.pageListDiv.children().each(function () {
        var jThis = $(this);
        // console.log('checking', jThis);
        $.RexFormsBuilder.preparePageMeta(jThis, root);
    });

    var root = instrumentMeta['params'];
    $.RexFormsBuilder.paramListDiv.children().each(function () {
        var jThis = $(this);
        root.push(jThis.data('data'));
    });

    return instrumentMeta;
}

$.RexFormsBuilder.saveInstrumentReal = function(callback) {
    var instrumentName = $.RexFormsBuilder.instrumentName;

    if (!instrumentName)
        instrumentName = prompt("Please set instrument name:");

    if (instrumentName) {
        if ($.RexFormsBuilder.context.getIndexByType('question').length == 0) {
            alert('A form should contain at least one question!');
            return;
        }
    
        var meta = $.RexFormsBuilder.generateMeta(instrumentName);

        meta = $.toJSON(meta);
        var schema = 'instrument=' + encodeURIComponent(instrumentName) 
                    + '&data=' + encodeURIComponent( meta );

        var url = $.RexFormsBuilder.urlSaveForm ||
                 ($.RexFormsBuilder.basePrefix + "/add_instrument");
        $.ajax({url : url,
            success : function(content) {
                if (!$.RexFormsBuilder.instrumentName)
                    $.RexFormsBuilder.instrumentName = instrumentName;

                if (callback)
                    callback();
                else
                    alert('instrument saved!');
            },
            error: function() {
                $.RexFormsBuilder.closeProgress();
                alert('Error of saving instrument!');
            },
            data : schema,
            type: 'POST'
        });
    }
};

$.RexFormsBuilder.saveInstrument = function(callback) {
    $.RexFormsBuilder.closeOpenedEditor(function () {
        $.RexFormsBuilder.saveInstrumentReal();
    }, questionListDiv);
}

$.RexFormsBuilder.evaluateMetaStr = function(metaStr) {
    var meta = $.parseJSON(metaStr);
    $.RexFormsBuilder.evaluateMeta(meta);
}

$.RexFormsBuilder.hints = {
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

$.RexFormsBuilder.dismissIt = function(a) {
    var p = $(a).parents('div:first').remove();
}

$.RexFormsBuilder.putHint = function(element, hintId) {
    var existentHint = element.next('.rb_hint');
    if (existentHint.size() == 0 ||
        existentHint.attr('data-hint-id') !== hintId) {

        existentHint.remove();
        var hint = $(document.createElement('div'))
                             .addClass('rb_hint')
                             .addClass('rb_red_hint')
                             .addClass('rb_question_input')
                             .attr('data-hint-id', hintId);
        hint.text($.RexFormsBuilder.hints[hintId] + ' ');
        hint.append(' <a href="javascript:void(0)" onclick="$.RexFormsBuilder.dismissIt(this);">Dismiss this message</a>');
        element.after(hint);
    }
}

$.RexFormsBuilder.updateQuestionDiv = function(questionDiv) {
    var questionData = questionDiv.data('data');
    $('.rb_question_title', questionDiv).text(questionData.title || '');
    $('.rb_question_name', questionDiv).text(questionData.name || '');
    $('.rb_question_descr', questionDiv)
                    .text($.RexFormsBuilder.getQuestionDescription(questionData));
}

$.RexFormsBuilder.updateQuestionOrders = function() {
    var newQuestionList = [];
    questionListDiv.children('.rb_question').each(function () {
        var questionData = $(this).data('data');
        newQuestionList.push(questionData);
    });
    var pageData = $.RexFormsBuilder.currentPage.data('data');
    pageData.questions = newQuestionList;
}

$.RexFormsBuilder.setPageListSortable = function(list) {
    list.sortable({
        cursor: 'move',
        toleranceElement: '> div',
        connectWith: 'rb_pages_list,.rb_class_pages_list'
    });
}

$.RexFormsBuilder.setQuestionsSortable = function(list) {
    list.sortable({
        cursor: 'move',
        // cancel: '.restrict-question-drag',
        toleranceElement: '> div',
        update: function () {
            $.RexFormsBuilder.updateQuestionOrders();
        }
    });
}

$.RexFormsBuilder.addQuestionDiv = function(questionData, listDiv) {
    var newQuestionDiv = $.RexFormsBuilder.templates.createObject('question');
    newQuestionDiv.data('data', questionData);
    $.RexFormsBuilder.updateQuestionDiv(newQuestionDiv);
    
    if (listDiv)
        listDiv.append(newQuestionDiv)
    else
        questionListDiv.append(newQuestionDiv);

    newQuestionDiv.click(function () {
        $.RexFormsBuilder.showQuestionEditor(this);
    });

    return newQuestionDiv;
}

$.RexFormsBuilder.closeOpenedEditor = function(callback, listDiv) {
    var errorSaving = false;
    listDiv.children('.rb_question').each(function () {
        if (!errorSaving) {
            var thisQuestion = $(this);
            if (thisQuestion.hasClass('rb_opened') && 
                !$.RexFormsBuilder.saveQuestion(thisQuestion)) {

                errorSaving = true;

                var doHighlight = function () {
                    thisQuestion.effect("highlight", { color: '#f3c2c2' }, 1000);
                };

                if (listDiv[0] === questionListDiv[0]) {
                    if ($.RexFormsBuilder.isScrolledIntoView(thisQuestion, questionListDiv))
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

$.RexFormsBuilder.onPredefinedChoicesChange = function () {
    var val = $(this).val();
    if (val) {
        var choicesList =
                $(this).parents('.rb_choices:first')
                       .find('.choices-list-items');

        choicesList.children().remove();
        var choices = $.RexFormsBuilder.predefinedLists[val];

        var isFirst = true;
        $.each(choices, function (_, choice) {
            $.RexFormsBuilder.addChoiceReal(
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

$.RexFormsBuilder.showQuestionEditor = function(question) {
    var questionDiv = $(question);

    if (!questionDiv.hasClass('rb_opened')) {

        var parent = questionDiv.parent();
        $.RexFormsBuilder.closeOpenedEditor(function () {
            questionDiv.addClass('rb_opened');
            var question = questionDiv.data('data');

            var editorPlace = questionDiv.find('.q_editor:first');
            var editor = $.RexFormsBuilder.templates.createObject('questionEditor');

            editor.click(function (event) {
                // trap for event
                event.stopPropagation();
            });
            questionDiv.find('.btn-save-cancel:first').css('display', '');
            questionDiv.find('.q_caption:first').css('display', 'none');
            questionDiv.find('.btn-page-answer').css('display', 'none');

            $('select[name="predefined-choice-list"]', editor)
                .change($.RexFormsBuilder.onPredefinedChoicesChange);

            var questionName = question['name'];
            var inputTitle = $('textarea[name="question-title"]', editor);
            var inputName = $('input[name="question-name"]', editor);
            var visible = $('input[name="question-visible"]', editor);
            var required = $('input[name="question-required"]', editor);

            var choicesList = $('.choices-list-items', editor);
            $.RexFormsBuilder.setChoicesSortable(choicesList);

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
                $.RexFormsBuilder.addChoiceReal(choicesList, 
                            answer['code'],  
                            answer['title'],
                            isFirst, 
                            false);
                isFirst = false;
            }

            if (builderNS.isListType(question.type))
                $('.rb_choices', editor).css('display', 'block');

            inputTitle.change(function () {
                var title = $(this).val();
                if (inputName.hasClass('slave')) {
                    inputName.val(
                        builderNS.getReadableId(title, true, '_', 45)
                    );
                }
            })

            var fixInputIdentifier = function (input) {
                var val = input.val();
                var newVal = val.replace(builderNS.illegalIdChars, '');
                if (newVal !== val) {
                    input.val( newVal );
                    builderNS.putHint(jThis, 'wrongQuestionId');
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
            questionType.change($.RexFormsBuilder.onChangeQuestionType);
            questionType.change();

            editor[0].disableIf = question['disableIf'];
            editor[0].constraints = question['constraints'];

            if (question['disableIf'])
                $.RexFormsBuilder.makeREXLCache(editor[0], 'disableIf');

            if (question['constraints'])
                $.RexFormsBuilder.makeREXLCache(editor[0], 'constraints');

            $.RexFormsBuilder.updateDisableLogicDescription(editor);
            $.RexFormsBuilder.updateConstraintsDescription(editor);
            
            editor.find('.rb_small_button:first').click(function () {
                $.RexFormsBuilder.addNewSubQuestion(
                    editor.find('.rb_subquestion_list:first')
                );
            });

            editorPlace.append(editor);

            if (question.type === "rep_group" &&
                question['repeatingGroup'] &&
                question['repeatingGroup'].length) {

                var listDiv = editor.find('.rb_subquestion_list');

                for (var idx in question['repeatingGroup'])
                    $.RexFormsBuilder.addQuestionDiv(
                        question['repeatingGroup'][idx], 
                        listDiv
                    );
            }

        }, parent);
    }
}

$.RexFormsBuilder.getConditionAnswersStr = function(answers) {
    var ret = '';
    for (var idx in answers) {
        if (idx > 0)
            ret += ','
        var answer = answers[idx];
        if (answer instanceof Array) {
            ret += '[' + answer[0] + '-'
                       + answer[1] + ']';
        } else
            ret += answer;
    }
    return ret;
}

$.RexFormsBuilder.addChoiceReal = function(choicesList, code, title,
                                        hideHeader, slave) {

    var newChoice = $.RexFormsBuilder.templates.createObject('choicesItem');

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
            answerCode.val(builderNS.getReadableId(title, false, '_', 45));
        }
    });

    var fixInputAnswerIdentifier = function (input) {
        var val = input.val();
        var newVal = val.replace(builderNS.illegalIdChars, '');
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

$.RexFormsBuilder.addChoice = function(button) {
    var jButton = $(button);
    var choicesList = jButton.parent().siblings('.choices-list')
                                      .children('.choices-list-items');
    
    $.RexFormsBuilder.addChoiceReal(choicesList, null, null, true, true);
}

$.RexFormsBuilder.setChoicesSortable = function(c) {
    console.log('setChoicesSortable', c);
    c.sortable({
        cursor: 'move',
        toleranceElement: '> div'
        // cancel: '.restrict-drag',
    });
}

$.RexFormsBuilder.removeChoicesItem = function (obj) {
    var choicesDiv = $(obj).parents('.rb_choices_item:first');
    choicesDiv.slideUp(300, function () {
        $(this).remove();
    });
}

$.RexFormsBuilder.removeQuestion = function (obj) {
    var questionDiv = $(obj).parents('.rb_question:first');
    questionDiv.slideUp(300, function () {
        $.RexFormsBuilder.removeQuestionReal(questionDiv);
    });
}

$.RexFormsBuilder.removeQuestionReal = function(questionDiv) {
    var pageData = $.RexFormsBuilder.currentPage.data('data');
    var questionData = questionDiv.data('data');
    for (var idx in pageData.questions) {
        if (pageData.questions[idx] === questionData) {
            pageData.questions.splice(idx, 1);
            break;
        }
    }
    $.RexFormsBuilder.context.removeFromIndex('question', questionDiv.data('data'));
    questionDiv.remove();
}

$.RexFormsBuilder.cancelQuestionEdit = function(button) {
    var questionDiv = $(button).parents('.rb_question:first');
    var data = questionDiv.data('data');

    blockRepaint = true;
    if (!data['name']) {
        $.RexFormsBuilder.removeQuestionReal(questionDiv);
    } else {
        $.RexFormsBuilder.closeQuestionEditor(questionDiv);
        $.RexFormsBuilder.updateQuestionDiv(questionDiv);
    }
    blockRepaint = false;
}

$.RexFormsBuilder.onChangeQuestionType = function() {
    var jThis = $(this);
    var editor = jThis.parents('.rb_question_editor:first');
    var presets = $('.preset-choices', editor);
    var choices = $('.rb_choices', editor);
    var subQListWrap = $('.rb_question_table_subquestions', editor);
    var subQList = $('.rb_subquestion_list', subQListWrap);

    var type = jThis.val();
    
    var answersDisplay = builderNS.isListType(type) ? 'block' : 'none';
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


$.RexFormsBuilder.changesCounter = 0;
$.RexFormsBuilder.instrumentChanged = false;
$.RexFormsBuilder.setGlobalChangesMark = function(hasChanges) {
    $.RexFormsBuilder.instrumentChanged = hasChanges;
    // globalChangesMark.html(hasChanges ? '*' : '');
}

$.RexFormsBuilder.getChangeStamp = function() {
    $.RexFormsBuilder.setGlobalChangesMark(true);
    return $.RexFormsBuilder.changesCounter++;
}

$.RexFormsBuilder.findDuplicates = function(qName, origQuestionData) {
    var foundQuestionData = $.RexFormsBuilder.context.findQuestionData(qName);
    return (!foundQuestionData ||
            foundQuestionData === origQuestionData) ? false : true;
}

$.RexFormsBuilder.saveQuestion = function(obj) {
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
        $.RexFormsBuilder.putHint(inputTitle, 'emptyField');
        validationError = true;
    }

    var preloadedAnswers = {};
    // var changes = [];

    if (builderNS.isListType(qQuestionType)) {
        var choicesList = $('.choices-list:first', question)
                            .find('.choices-list-items:first');
        var items = $('.rb_choices_item', choicesList);
        if (items.size() == 0) {
            $.RexFormsBuilder.putHint(choicesList, 'noAnswers');
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
                    builderNS.illegalIdChars.test(answerCode)) {
                    $.RexFormsBuilder.putHint(choicesList, 'wrongAnswerId');
                    validationError = true;
                    break;
                } else if (answerScore !== '' && 
                            !/^[0-9]+$/.test(answerScore)) {

                    $.RexFormsBuilder.putHint(choicesList, 'wrongScore');
                    validationEerror = true;
                } else if (preloadedAnswers[answerCode] !== undefined) {

                    $.RexFormsBuilder.putHint(choicesList, 'dupAnswerId');
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
        builderNS.illegalIdChars.test(qName)) {
        $.RexFormsBuilder.putHint(inputName, 'wrongQuestionId');
        validationError = true;
    } else {
        var chkNames = { };

        chkNames[qName] = function (name) {
            $.RexFormsBuilder.putHint(inputName, 'dupQuestionId');
        }

        if (qQuestionType === "set") {
            for (code in preloadedAnswers) {
                chkNames[qName + '_' + code] = function (name) {
                    alert('Choice name \'' + name + '\' didn\'t pass the name consistency check');
                }
            }
        }

        var badNames = $.RexFormsBuilder
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
                    !$.RexFormsBuilder.saveQuestion(jThis))

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

    $.RexFormsBuilder.makeREXLCache(questionData, 'disableIf');
    $.RexFormsBuilder.makeREXLCache(questionData, 'constraints');

    if (builderNS.isListType(qQuestionType)) {
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

    if (builderNS.isListType(qQuestionType))
        $.RexFormsBuilder.updatePredefinedChoices(questionData.answers);

    $.RexFormsBuilder.closeQuestionEditor(question);
    $.RexFormsBuilder.updateQuestionDiv(question);

    return true;
}

$.RexFormsBuilder.updatePredefinedChoices = function(answers) {
    var titles = [];

    $.each(answers, function (_, answer) {
        titles.push(answer['title'] || answer['code']);
    });

    if (!titles.length)
        return;

    var preList = [];
    var titlesStr = titles.join(', ');

    if ($.RexFormsBuilder.predefinedLists[titlesStr])
        // the same predefined set of choices exists already
        return;

    $.RexFormsBuilder.predefinedLists[titlesStr] = preList;
    $.each(answers, function (_, answer) {
        preList.push({
            'code': answer['code'],
            'title': answer['title']
        });
    });

    var tpl = $.RexFormsBuilder.templates.getTemplate('questionEditor');
    var selectChoiceList = tpl.find('select[name="predefined-choice-list"]:first');

    $('<option>', {
        value: titlesStr,
        text: $.RexFormsBuilder.truncateText(titlesStr, 50)
    }).appendTo(selectChoiceList);
}

$.RexFormsBuilder.closeQuestionEditor = function(questionDiv) {
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

$.RexFormsBuilder.updateDisableLogicDescription = function(questionEditor) {
    var targetSpan = questionEditor.find('.rb_disable_logic_descr:first');
    var disableIf = questionEditor[0].disableIf;
    
    if (disableIf) {
        targetSpan.removeClass('disable_logic_not_set')
                  .html('Disabled if:&nbsp;&nbsp;' 
                        + builderNS.escapeHTML(
                            $.RexFormsBuilder.truncateText(disableIf, 30))
                          );
    } else {
        targetSpan.addClass('disable_logic_not_set')
                  .html('Never disabled');
    }
}

$.RexFormsBuilder.updateGroupSkipSpan = function(groupDiv) {
    var groupSkipWhenSpan = groupDiv.find('.rb_page_group_skip:first');
    
    var data = groupDiv.data('data');
    if (data.skipIf) {
        groupSkipWhenSpan
            .removeClass('rb_group_skip_not_set')
            .text('Skipped if: ' + $.RexFormsBuilder.truncateText(data.skipIf, 30))
            
            if (data.skipIf.length >= 30)
                groupSkipWhenSpan.attr('title', data.skipIf);
    }
    else
        groupSkipWhenSpan
            .addClass('rb_group_skip_not_set')
            .removeAttr('title')
            .html('Never skipped');
}

$.RexFormsBuilder.updatePageWhenSpan = function(pageData) {
    if (pageData.skipIf)
        $.RexFormsBuilder.pageSkipWhenSpan
            .removeClass('rb_page_skip_not_set')
            .html('Skipped if:&nbsp;&nbsp;' 
                        + builderNS.escapeHTML(pageData.skipIf));
    else
        $.RexFormsBuilder.pageSkipWhenSpan
            .addClass('rb_page_skip_not_set')
            .html('Never skipped');
}

$.RexFormsBuilder.updatePageTitleSpan = function(pageData) {
    if (pageData.title)
        $.RexFormsBuilder.pageTitleSpan
            .removeClass('rb_page_title_not_set')
            .text(pageData.title);
    else
        $.RexFormsBuilder.pageTitleSpan
            .addClass('rb_page_title_not_set')
            .html('Untitled page');
}

$.RexFormsBuilder.isScrolledIntoView = function(elem, scrollable) {
    var docViewTop = scrollable.scrollTop();
    var docViewBottom = docViewTop + scrollable.height();

    var elemTop = elem.offset().top;
    var elemBottom = elemTop + elem.height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

$.RexFormsBuilder.selectPage = function(pageDiv) {
    $.RexFormsBuilder.closeOpenedEditor(function () {
        if ($.RexFormsBuilder.pageTitleInput.is(':visible'))
            $.RexFormsBuilder.pageTitleInput.focusout();

        $.RexFormsBuilder.mainPartContent.css('display', 'block');
        if ($.RexFormsBuilder.currentPage)
            $.RexFormsBuilder.currentPage.removeClass('rb_covered');
        $.RexFormsBuilder.currentPage = $(pageDiv);
        $.RexFormsBuilder.currentPage.addClass('rb_covered');
        var pageData = $.RexFormsBuilder.currentPage.data('data');
        $.RexFormsBuilder.clearQuestions();
        $.RexFormsBuilder.updatePageTitleSpan(pageData);
        $.RexFormsBuilder.updatePageWhenSpan(pageData);
        for (var idx in pageData.questions) {
            var question = pageData.questions[idx];
            $.RexFormsBuilder.addQuestionDiv(question);
        }
    }, questionListDiv);
}

$.RexFormsBuilder.relativeTop = function(element, relativeTo) {
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

$.RexFormsBuilder.addNewSubQuestion = function(listDiv) {
    $.RexFormsBuilder.closeOpenedEditor(function () {
        var parentQuestionDiv = listDiv.parents('.rb_question:first');
        var parentQData = parentQuestionDiv.data('data');
        var qData = $.RexFormsBuilder.context.createNewQuestion();
        qData.slave = true;

        if (!parentQData.repeatingGroup)
            parentQData.repeatingGroup = [];
        parentQData.repeatingGroup.push(qData);

        var questionDiv = $.RexFormsBuilder.addQuestionDiv(qData, listDiv);
        questionDiv.click();
    }, listDiv);
}

$.RexFormsBuilder.addNewQuestion = function() {
    if (!$.RexFormsBuilder.currentPage)
        return;

    $.RexFormsBuilder.closeOpenedEditor(function () {
        var pageData = $.RexFormsBuilder.currentPage.data('data');
        var questionData = $.RexFormsBuilder.context.createNewQuestion();
        pageData.questions.push(questionData);
        var questionDiv = $.RexFormsBuilder.addQuestionDiv(questionData);
        questionDiv.click();

        var doEffect = function () {
            questionDiv.effect("highlight", 
                                { color: '#bdecd0' }, 2000);
        };

        if ($.RexFormsBuilder.isScrolledIntoView(questionDiv, questionListDiv))
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

$.RexFormsBuilder.getParamTitle = function(type) {
    switch (type) {
    case 'NUMBER':
        return 'Number';
    case 'STRING':
        return 'String';
    case 'DATE':
        return 'Date';
    default:
        if ($.RexFormsBuilder.externalParamTypes &&
            $.RexFormsBuilder.externalParamTypes[type]) {

            var typeDesc = $.RexFormsBuilder.externalParamTypes[type];
            return typeDesc.title || type;
        }
    }
    return 'Unknown';
}

$.RexFormsBuilder.updateParameterDiv = function(target) {
    var data = target.data('data');
    target.find('.param_name').text(data.name);
    target.find('.rb_param_type').text('(' 
                    + $.RexFormsBuilder.getParamTitle(data.type) + ')');
}

$.RexFormsBuilder.addParameterReal = function(data) {
    var target = $.RexFormsBuilder.templates.createObject('parameter');
    target.data('data', data);
    var placeFound = false;
    $.RexFormsBuilder.paramListDiv.children().each(function () {
        if (!placeFound) {
            var thisParamData = $(this).data('data');
            if (data.name < thisParamData.name) {
                $(this).before(target);
                placeFound = true;
            }
        }
    });
    if (!placeFound)
        $.RexFormsBuilder.paramListDiv.append(target);
        
    target.click(function () {
        $.RexFormsBuilder.editParameter(this);
    });
    $.RexFormsBuilder.updateParameterDiv(target);
}

$.RexFormsBuilder.processREXLObject = function (rexlObj, chCount, oldName, newName) {
    if (rexlObj.type === "IDENTIFIER") {
        if (rexlObj.value === oldName) {
            rexlObj.value = newName;
            ++chCount;
        }
    }

    if (rexlObj.args && rexlObj.args.length) {
    
        if (rexlObj.type === "OPERATION" &&
            rexlObj.value === "." && rexlObj.args.length > 0) {

            chCount += $.RexFormsBuilder.processREXLObject(rexlObj.args[0],
                                                        chCount,
                                                        oldName,
                                                        newName);

        } else {

            for (var idx in rexlObj.args) {
                chCount += $.RexFormsBuilder.processREXLObject(rexlObj.args[idx],
                                                            chCount,
                                                            oldName,
                                                            newName);
            }
        }
    }

    return chCount;
}

$.RexFormsBuilder.renameREXLIdentifierIfExist = 
        function (obj, condName, oldName, newName) {

    var chCounter = 0;

    if (obj[condName] && obj.cache && obj.cache[condName]) {
        if (chCounter = $.RexFormsBuilder.processREXLObject(obj.cache[condName], 
                                                         0, 
                                                         oldName, 
                                                         newName)) {

            obj[condName] = obj.cache[condName].toString();
            console.log('updated:', obj[condName]);
        }
    }
    return chCounter;
}

$.RexFormsBuilder.renameREXLIdentifiers = function (oldName, newName) {
    var qIndex = $.RexFormsBuilder.context.getIndexByType('question');
    for (var pos in qIndex) {
        $.RexFormsBuilder.renameREXLIdentifierIfExist(qIndex[pos], 
                                                   'disableIf',
                                                   oldName,
                                                   newName);
        $.RexFormsBuilder.renameREXLIdentifierIfExist(qIndex[pos],
                                                   'constraints', 
                                                   oldName, 
                                                   newName);
    }

    $('.rb_question_editor', questionListDiv).each(function () {
        var editor = $(this);

        if ($.RexFormsBuilder.renameREXLIdentifierIfExist(this, 
                                                       'disableIf',
                                                       oldName,
                                                       newName)) {

            $.RexFormsBuilder.updateDisableLogicDescription(editor);
        }

        if ($.RexFormsBuilder.renameREXLIdentifierIfExist(this, 
                                                       'constraints',
                                                       oldName,
                                                       newName)) {

            $.RexFormsBuilder.updateConstraintsDescription(editor);
        }
    });

    var pIndex = $.RexFormsBuilder.context.getIndexByType('page');
    for (var pos in pIndex) {
        $.RexFormsBuilder.renameREXLIdentifierIfExist(pIndex[pos],
                                                   'skipIf',
                                                   oldName,
                                                   newName);
    }

    var pIndex = $.RexFormsBuilder.context.getIndexByType('group');
    for (var pos in pIndex) {
        $.RexFormsBuilder.renameREXLIdentifierIfExist(pIndex[pos],
                                                   'skipIf',
                                                   oldName,
                                                   newName);
    }
}

$.RexFormsBuilder.editParameter = function(link) {
    var jLink = $(link);
    var paramDiv = jLink.hasClass('rb_parameter') ? 
                        jLink:
                        jLink.parents('.rb_parameter:first');
    var data = paramDiv.data('data');
    $.RexFormsBuilder.editParamDialog.open({
        paramName: data.name,
        paramType: data.type,
        callback: function (newValue, newType) {
            var oldName = data.name;
            data.name = newValue;
            data.type = newType;

            if (oldName !== newValue)
                $.RexFormsBuilder.renameREXLIdentifiers(oldName, newValue);
            
            $.RexFormsBuilder.updateParameterDiv(paramDiv);
        }
    });
}

$.RexFormsBuilder.addParameter = function(data) {
    if (!data) {
        $.RexFormsBuilder.editParamDialog.open({
            callback: function (newValue, newType) {
                var newParameter = $.RexFormsBuilder.context.createNewParameter();
                newParameter.name = newValue;
                newParameter.type = newType;
                $.RexFormsBuilder.addParameterReal(newParameter);
            }
        });
    } else {
        $.RexFormsBuilder.addParameterReal(data);
        $.RexFormsBuilder.context.putToIndex('parameter', data);
    }
}

$.RexFormsBuilder.addNewPage = function(btn) {
    var pageDiv = btn ? $(btn).parents('.rb_page:first') : null;
    var newPageData = $.RexFormsBuilder.context.createNewPage();
    var target = $.RexFormsBuilder.addPage(newPageData);

    if (pageDiv)
        pageDiv.after(target);
    else
        $.RexFormsBuilder.pageListDiv.append(target);

    var pagesScollable = $('.rb_pages_scrollable');
    var doEffect = function () {
        target.effect("highlight", { color: '#bdecd0' }, 2000);
    };

    if ($.RexFormsBuilder.isScrolledIntoView(target, pagesScollable))
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

$.RexFormsBuilder.truncateText = function(text, len) {
    if (text.length > len)
        return text.slice(0, len - 3) + "...";
    return text;
}

$.RexFormsBuilder.getPageSummary = function(data, targetDiv) {
    if (data.title)
        targetDiv.html('<strong>'
                        + builderNS.escapeHTML(data.title)
                        + '</strong>');
    else if (data.questions.length > 0) {
        var ret = '<strong>'
                + builderNS.escapeHTML(
                      $.RexFormsBuilder.truncateText(data.questions[0].title, 40)
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

$.RexFormsBuilder.updatePageDiv = function (pageDiv) {
    var data = pageDiv.data('data');
    
    var pageTitle = $('.rb_div_page_title:first', pageDiv);
    $.RexFormsBuilder.getPageSummary(data, pageTitle);
}

$.RexFormsBuilder.makeREXLCache = function (obj, condName) {
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

$.RexFormsBuilder.addPage = function(page, to) {

    if (page.type === 'group') {
        var newGroup = $.RexFormsBuilder.createGroup('pageGroup');
        if (to) {
            to.append(newGroup);
            $.RexFormsBuilder.setPageListSortable(
                newGroup.find('.rb_class_pages_list')
            );
        }

        $.RexFormsBuilder.makeREXLCache(page, 'skipIf');

        newGroup.data('data', page);
        $.RexFormsBuilder.updateGroupDiv(newGroup);
        for (var idx in page.pages) {
            var item = page.pages[idx];
            $.RexFormsBuilder.context.putToIndex(item.type, item);
            $.RexFormsBuilder.addPage(
                item, newGroup.children('.rb_class_pages_list')
            );
        }

        return newGroup;
    }

    // this is a page
    var newPageDiv = $.RexFormsBuilder.templates.createObject('page');

    if (to)
        to.append(newPageDiv);

    $.RexFormsBuilder.makeREXLCache(page, 'skipIf');
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

        $.RexFormsBuilder.makeREXLCache(qData, 'disableIf');
        $.RexFormsBuilder.makeREXLCache(qData, 'constraints');

        $.RexFormsBuilder.context.putToIndex('question', qData);
        if (qData.repeatingGroup && qData.type === "rep_group") {
            for (var sIdx in qData.repeatingGroup) {
                var subQuestion = qData.repeatingGroup[sIdx];
                fixQuestionData(subQuestion);

                subQuestion.slave = true;

                $.RexFormsBuilder.makeREXLCache(subQuestion, 'disableIf');
                $.RexFormsBuilder.makeREXLCache(subQuestion, 'constraints');

                $.RexFormsBuilder.context.putToIndex('question', subQuestion);
            }
        } else if (builderNS.isListType(qData.type)) {
            $.RexFormsBuilder.updatePredefinedChoices(qData.answers);
        }
    }

    if (!page.cId)
        page.cId = builderNS.getCId('page');

    $.RexFormsBuilder.updatePageDiv(newPageDiv);

    newPageDiv.click(function (event) {
        if (event.shiftKey) {
            document.getSelection().removeAllRanges();
            if ($.RexFormsBuilder.currentPage) {
                $.RexFormsBuilder.currentSelection = [];
                var fromPage = $.RexFormsBuilder.currentPage;
                var toPage = $(this);
                var selectIt = false;
                $.RexFormsBuilder.pageListDiv.find('.rb_page').each(function () {
                    var jThis = $(this);
                    if (jThis[0] === fromPage[0] ||
                        jThis[0] === toPage[0]) {

                        selectIt = !selectIt;
                        jThis.addClass('rb_covered');
                        $.RexFormsBuilder.currentSelection.push(jThis);
                    } else if (selectIt) {
                        jThis.addClass('rb_covered');
                        $.RexFormsBuilder.currentSelection.push(jThis);
                    } else {
                        jThis.removeClass('rb_covered');
                    }
                });
            }
        } else {
            $.RexFormsBuilder.pageListDiv.find('.rb_covered').removeClass('rb_covered');
            $.RexFormsBuilder.currentSelection = [ $(this) ];
            $.RexFormsBuilder.selectPage(this);
        }

        if ($.RexFormsBuilder.currentSelection && $.RexFormsBuilder.currentSelection.length) {
            $('#make_group_btn').removeAttr('disabled');
        } else {
            $('#make_group_btn').attr('disabled','disabled');
        }

        event.preventDefault();
    });
    
    return newPageDiv;
}

$.RexFormsBuilder.evaluateMeta = function(meta) {
    var rel;

    if (meta && meta.content && meta.content.pages)
        rel = meta.content;
    else if (!meta || !meta.pages)
        return;
    else
        rel = meta;

    for (var idx in rel.pages) {
        var page = rel.pages[idx];

        if (!page.cId)
            page.cId = builderNS.getCId('page');

        $.RexFormsBuilder.context.putToIndex(page.type, page);
        $.RexFormsBuilder.addPage(page, $.RexFormsBuilder.pageListDiv);
    }

    for (var idx in rel.params) {
        var param = rel.params[idx];
        $.RexFormsBuilder.addParameter(param);
    }

    $.RexFormsBuilder.setFormTitle( meta.title );
    $.RexFormsBuilder.context.dumpIndexes();
}

$.RexFormsBuilder.updateConstraintsDescription = function(questionEditor) {
    var targetSpan = questionEditor.find('.rb_constraint_descr');
    var constraints = questionEditor[0].constraints;

    if (constraints && !(constraints instanceof Object)) {
        targetSpan.removeClass('constraints_not_set')
                  .html('Valid if: ' + builderNS.escapeHTML(
                            $.RexFormsBuilder.truncateText(constraints, 30)));
    } else {
        targetSpan.addClass('constraints_not_set')
                  .html('No constraints');
    }
};

/* TODO: rewrite this and saveQuestion functions to not repeat code */

$.RexFormsBuilder.collectQuestionData = function (editor) {

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

        if (builderNS.isListType(qQuestionType)) {
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
                        builderNS.illegalIdChars.test(answerCode)) {
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

$.RexFormsBuilder.changeConstraints = function(btn) {
    var jButton = $(btn);
    var questionEditor = jButton.parents('.rb_question_editor:first');

    $.RexFormsBuilder.constraintsThisQuestion =
        $.RexFormsBuilder.collectQuestionData(questionEditor);

    if ($.RexFormsBuilder.constraintsThisQuestion) {
        $.RexFormsBuilder.conditionsEditor.open({
            title: 'Edit Constraints',
            callback: function (newValue) {
                questionEditor[0].constraints = newValue;
                $.RexFormsBuilder.makeREXLCache(questionEditor[0], 'constraints');
                $.RexFormsBuilder.updateConstraintsDescription(questionEditor);
            },
            defaultIdentifier: 'this',
            onClose: function (newValue) {
                $.RexFormsBuilder.constraintsThisQuestion = null;
            },
            conditions: questionEditor[0].constraints
        });
    } else {
        alert('Impossible: there are wrong values in the editor');
    }
}

$.RexFormsBuilder.getAnswersString = function(questionData) {
    var titles = [];
    for (var idx in questionData['answers']) {
        var title = questionData['answers'][idx]['title'];

        if (!title)
            title = questionData['answers'][idx]['code']

        titles.push(title);
    }
    return titles.join(', ');
}

$.RexFormsBuilder.getQuestionDescription = function(questionData) {
    var type = questionData.type;

    if (builderNS.isListType(type))
        return $.RexFormsBuilder.getAnswersString(questionData);
    else
        return $.RexFormsBuilder.QTypes[type];
}

$.RexFormsBuilder.newInstrument = function() {
    $.RexFormsBuilder.clearWorkspace();
    $.RexFormsBuilder.instrumentName = null;
    $.RexFormsBuilder.instrumentTitle = '';
    $.RexFormsBuilder.context.clearIndexes();
}

$.RexFormsBuilder.loadFromJSON = function() {
    var json = prompt('Please input schema json:');

    if (json) {
        $.RexFormsBuilder.clearWorkspace();
        $.RexFormsBuilder.evaluateMetaStr(json);
    }
}

$.RexFormsBuilder.loadInstrumentSchema = function(instrumentName, schemaJSON) {
    //console.log('schemaJSON', schemaJSON);
    $.RexFormsBuilder.newInstrument();
    $.RexFormsBuilder.evaluateMetaStr(schemaJSON);
    $.RexFormsBuilder.instrumentName = instrumentName;
}

$.RexFormsBuilder.clearQuestions = function() {
    questionListDiv.contents().remove();
}

$.RexFormsBuilder.stopEvent = function(event) {
    if (!event)
        event = window.event;
    event.stopPropagation();
}

$.RexFormsBuilder.clearWorkspace = function() {
    $.RexFormsBuilder.mainPartContent.css('display', 'none');
    $.RexFormsBuilder.pageTitleSpan.text('');
    $.RexFormsBuilder.pageListDiv.contents().remove();
    $.RexFormsBuilder.paramListDiv.contents().remove();
    $.RexFormsBuilder.clearQuestions();
}

$.RexFormsBuilder.changeDisableLogic = function(btn) {
    var jButton = $(btn);
    var questionEditor = jButton.parents('.rb_question_editor:first');

    $.RexFormsBuilder.conditionsEditor.open({
        title: 'Edit Disable-Logic Conditions',
        callback: function (newValue) {
            questionEditor[0].disableIf = newValue;
            $.RexFormsBuilder.makeREXLCache(questionEditor[0], 'constraints');
            $.RexFormsBuilder.updateDisableLogicDescription(questionEditor);
        },
        conditions: questionEditor[0].disableIf
    });
}

$.RexFormsBuilder.showJSONDialog = null;
$.RexFormsBuilder.editPageDialog = null;
$.RexFormsBuilder.editParamDialog = null;
$.RexFormsBuilder.beforeTestDialog = null;
$.RexFormsBuilder.conditionsEditor = null;
$.RexFormsBuilder.questionDialog = null;
$.RexFormsBuilder.progressDialog = null;
$.RexFormsBuilder.pageListDiv = null;
$.RexFormsBuilder.paramListDiv = null;
$.RexFormsBuilder.context = null;
$.RexFormsBuilder.templates = null;

$.RexFormsBuilder.pageTitleSpan = null;
$.RexFormsBuilder.pageTitleInput = null;
$.RexFormsBuilder.pageSkipWhenSpan = null;
$.RexFormsBuilder.mainPartContent = null;
$.RexFormsBuilder.currentSelection = null;
$.RexFormsBuilder.currentPositionIndex = null;

$.RexFormsBuilder.currentPage = null;

$.RexFormsBuilder.onPageTitleChanged = function () {
    var newTitle = $.RexFormsBuilder.pageTitleInput.val();
    var data = $.RexFormsBuilder.currentPage.data('data');
    data.title = newTitle;
    $.RexFormsBuilder.updatePageDiv($.RexFormsBuilder.currentPage);
    $.RexFormsBuilder.updatePageTitleSpan(data);
    // $.RexFormsBuilder.pageTitleSpan.text(newTitle);
    $.RexFormsBuilder.pageTitleInput.css('display', 'none');
    $('.rb_page_title_wrap').css('display', '');
}

$.RexFormsBuilder.setFormTitle = function (newTitle) {
    $.RexFormsBuilder.instrumentTitle = newTitle;

    var titleHolder = $('#rb_instrument_title');
    if (newTitle) {
        titleHolder
            .removeClass('rb_instrument_title_not_set')
            .text($.RexFormsBuilder.truncateText(newTitle, 30));
    } else {
        titleHolder
            .addClass('rb_instrument_title_not_set')
            .text('Untitled form')
    }
}

$.RexFormsBuilder.onInstrumentTitleChanged = function() {
    var newTitle = $.trim($.RexFormsBuilder.instrumentTitleInput.val());
    $.RexFormsBuilder.setFormTitle(newTitle);
    $.RexFormsBuilder.instrumentTitleInput.css('display', 'none');
    $('#rb_instrument_title_view').css('display', '');
}

$.RexFormsBuilder.editGroupSkipConditions = function(a) {
    var groupDiv = $(a).parents('.rb_page_group:first');
    var data = groupDiv.data('data');
    $.RexFormsBuilder.conditionsEditor.open({
        title: 'Edit Skip-Logic Conditions',
        callback: function (newValue) {
            data.skipIf = newValue;
            $.RexFormsBuilder.makeREXLCache(data, 'skipIf');
            $.RexFormsBuilder.updateGroupSkipSpan(groupDiv);
        },
        conditions: data.skipIf
    });
}

$.RexFormsBuilder.editPageSkipConditions = function() {
    var data = $.RexFormsBuilder.currentPage.data('data');
    $.RexFormsBuilder.conditionsEditor.open({
        title: 'Edit Skip-Logic Conditions',
        callback: function (newValue) {
            var data = $.RexFormsBuilder.currentPage.data('data');
            data.skipIf = newValue;
            $.RexFormsBuilder.makeREXLCache(data, 'skipIf');
            $.RexFormsBuilder.updatePageWhenSpan(data);
        },
        conditions: data.skipIf
    });
}

$.RexFormsBuilder.editInstrumentTitle = function() {
    $('#rb_instrument_title_view').css('display', 'none');
    $.RexFormsBuilder.instrumentTitleInput.val(
        $.RexFormsBuilder.instrumentTitle
    );
    $.RexFormsBuilder.instrumentTitleInput.css('display', '');
    $.RexFormsBuilder.instrumentTitleInput.focus();
}

$.RexFormsBuilder.editPageTitle = function() {
    $('.rb_page_title_wrap').css('display', 'none');

    var title = $.RexFormsBuilder.currentPage.data('data').title;

    $.RexFormsBuilder.pageTitleInput.val(title);
    $.RexFormsBuilder.pageTitleInput.css('display', '');
    $.RexFormsBuilder.pageTitleInput.focus();
}

$.RexFormsBuilder.toType = function (obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

$(document).ready(function () {

    if ($.RexFormsBuilder.externalParamTypes) {
        if ($.RexFormsBuilder.toType($.RexFormsBuilder.externalParamTypes) === "string")
            $.RexFormsBuilder.externalParamTypes = 
                $.parseJSON($.RexFormsBuilder.externalParamTypes);
        console.log('external parameter types:', $.RexFormsBuilder.externalParamTypes);
    }

    $.RexFormsBuilder.paramListDiv = $('.rb_params_list');
    $.RexFormsBuilder.pageListDiv = $('.rb_pages_list');
    questionListDiv = $('.rb_question_list');
    $.RexFormsBuilder.pageTitleSpan = $('.rb_page_title');
    $.RexFormsBuilder.pageSkipWhenSpan = $('#page_skip_when');
    $.RexFormsBuilder.pageTitleInput = $('.rb_page_title_input');
    $.RexFormsBuilder.mainPartContent = $('.rb_main_part_content');
    $.RexFormsBuilder.instrumentTitleInput = $('#rb_instrument_title_input');

    $.RexFormsBuilder.pageTitleSpan.click(function () {
        $.RexFormsBuilder.editPageTitle();
    });

    $.RexFormsBuilder.pageTitleInput.change($.RexFormsBuilder.onPageTitleChanged);
    $.RexFormsBuilder.pageTitleInput.focusout($.RexFormsBuilder.onPageTitleChanged);

    $.RexFormsBuilder.instrumentTitleInput.change($.RexFormsBuilder.onInstrumentTitleChanged);
    $.RexFormsBuilder.instrumentTitleInput.focusout($.RexFormsBuilder.onInstrumentTitleChanged);

    $('#rb_instrument_title_view').children().click(
        function () {
            $.RexFormsBuilder.editInstrumentTitle();
        }
    );

    $.RexFormsBuilder.pageTitleInput.keypress(function (e) {
        if (e.keyCode == 13)
            $.RexFormsBuilder.onPageTitleChanged(e);
    });

    $.RexFormsBuilder.setPageListSortable($.RexFormsBuilder.pageListDiv);

    // $.RexFormsBuilder.pageListDiv.on('mousedown', drawRectangleOnMouseDown);

    $.RexFormsBuilder.pageListDiv.data('normalOffset', $.RexFormsBuilder.pageListDiv.offset());
    $.RexFormsBuilder.setQuestionsSortable(questionListDiv);

    function createObject(classFunc) {
        return new (classFunc())();
    }

    var commonOptions = {
        parent: $.RexFormsBuilder
    };

    $.RexFormsBuilder.context = createObject($.RexFormsBuilder.ContextF);
    $.RexFormsBuilder.templates = createObject($.RexFormsBuilder.TemplatesF);
    $.RexFormsBuilder.showJSONDialog =
        new builderNS.dialog.ShowJSONDialog(commonOptions);
    $.RexFormsBuilder.editPageDialog =
        new builderNS.dialog.EditPageDialog(commonOptions);

    var dialogOptions = $.extend({
        extTypes: $.RexFormsBuilder.externalParamTypes
    }, commonOptions);
    $.RexFormsBuilder.editParamDialog =
        new builderNS.dialog.EditParamDialog(dialogOptions);

    dialogOptions = $.extend({
        extTypes: $.RexFormsBuilder.externalParamTypes
    }, commonOptions);
    $.RexFormsBuilder.beforeTestDialog =
        new builderNS.dialog.BeforeTestDialog(dialogOptions);

    $.RexFormsBuilder.questionDialog =
        new builderNS.dialog.QuestionDialog(commonOptions);

    $.RexFormsBuilder.constraintsThisQuestion = null;

    $.RexFormsBuilder.conditionsEditor = new ConditionEditor({
        urlPrefix: $.RexFormsBuilder.basePrefix,
        manualEdit: $.RexFormsBuilder.manualEditConditions,
        identifierTitle: 'Question or parameter',
        onDescribeId: function (identifier) {

            var ret = null;
            var questionData = null;

            if (identifier === "this") {
                if ($.RexFormsBuilder.constraintsThisQuestion)
                    questionData = $.RexFormsBuilder.constraintsThisQuestion;
            } else
                questionData = $.RexFormsBuilder.context.findQuestionData(identifier);

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
                var paramData = $.RexFormsBuilder.context.findParamData(identifier);
                if (paramData) {
                    ret = {};

                    switch(paramData.type) {
                    case 'NUMBER':
                        ret.type = 'number';
                        break;
                    case 'STRING':
                    default:
                        if ($.RexFormsBuilder.externalParamTypes) {
                            var typeDesc = 
                                $.RexFormsBuilder.externalParamTypes[paramData.type];

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

            if ($.RexFormsBuilder.constraintsThisQuestion) {
                var item = $.RexFormsBuilder.constraintsThisQuestion;
                if ("this".indexOf(term) != -1) {
                    ret.push({
                        "title": item.title ?
                            $.RexFormsBuilder.truncateText(item.title, 80) : '',
                        "value": "this"
                    });
                }
            }

            var qIndex = $.RexFormsBuilder.context.getIndexByType('question');
            for (var pos in qIndex) {
                var item = qIndex[pos];
                
                if (!item.slave && item.name) {
                    if (item.name.search(matcher) !== -1 ||
                        (item.title &&
                            item.title.search(matcher) !== -1)) {

                        ret.push({
                            "title": item.title ?
                                $.RexFormsBuilder.truncateText(item.title, 80) : '',
                            "value": item.name
                        });
                    }
                }
            }

            var pIndex = $.RexFormsBuilder.context.getIndexByType('parameter');

            for (var pos in pIndex) {
                var item = pIndex[pos];

                if (item.name.search(matcher) !== -1) {
                    ret.push({
                        "title": 'parameter ('
                                + $.RexFormsBuilder.getParamTitle(item.type)
                                + ')',
                        "value": item.name
                    });
                }
            }

            console.log('onSearchId', ret);
            return ret;
        }
    });

    $.RexFormsBuilder.progressDialog = $('.rb_progress_dialog').dialog({
        dialogClass: 'progress-dialog',
        modal: true,
        autoOpen: false,
        width: 350,
        open: function () { },
        close: function () { }, 
    });

    $.RexFormsBuilder.updatePredefinedChoices([
        {
            code: 'yes',
            title: 'Yes'
        },
        {
            code: 'no',
            title: 'No'
        }
    ]);

    if ($.RexFormsBuilder.instrumentName)
        $.RexFormsBuilder.loadInstrument($.RexFormsBuilder.instrumentName);
});

$.RexFormsBuilder.buildPositionIndex = function(deltaY) {
    var pages = $.RexFormsBuilder.pageListDiv.find('.rb_page');
    var pagesIndex = [];
    pages.each(function () {
        var page = $(this);
        var position = page.position();
        pagesIndex.push({
            ref: this,
            y: position.top + deltaY,
            x: position.left,
            height: page.height(),
            width: page.width()
        });
    });

    console.log('pagesIndex:', pagesIndex);
    return pagesIndex;
}

$.RexFormsBuilder.getItemLevel = function(pageDiv, objType) {
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

$.RexFormsBuilder.checkIfEdge = function(element, fromLeft, objType) {
    var selector = (objType === 'page') ?
                        '.rb_page,.rb_page_group':
                        '.rb_condition_item,.rb_condition_group';

    return (fromLeft && element.prev(selector).size() === 0) ||
            (!fromLeft && element.next(selector).size() === 0);
}

$.RexFormsBuilder.getLowestAllowedLevel = function(element, level, fromLeft, objType) {

    var cls = (objType === 'page') ?
                    'rb_page_group' : 'rb_condition_group';

    while (element.size() && level) {
        if ($.RexFormsBuilder.checkIfEdge(element, fromLeft, objType)) {
            --level;
            element = element.parent('.' + cls + ':first');
        } else
            break;
    }
    return level;
}

$.RexFormsBuilder.getCutoff = function(page, objType) {
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

$.RexFormsBuilder.interceptCutoff = function(cutoff1, cutoff2) {
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

$.RexFormsBuilder.removeParameter = function(btn) {
    var paramDiv = $(btn).parents('.rb_parameter:first');
    var paramData = paramDiv.data('data');
    $.RexFormsBuilder.context.removeFromIndex('parameter', paramData);
    paramDiv.remove();
}

$.RexFormsBuilder.removePage = function(btn) {
    var pageDiv = $(btn).parents('.rb_page:first');
    var pageData = pageDiv.data('data');
    for (var idx in pageData.questions) {
        $.RexFormsBuilder.context.removeFromIndex('question', pageData.questions[idx]);
    }
    $.RexFormsBuilder.context.removeFromIndex('page', pageData);
    pageDiv.remove();
}

$.RexFormsBuilder.removeGroup = function(link) {
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
    $.RexFormsBuilder.questionDialog.open({
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

$.RexFormsBuilder.editPage = function(link) {
    var pageDiv = $(link).parents('.rb_page:first');
    $.RexFormsBuilder.editPageDialog.open({
        mode: 'page',
        target: pageDiv
    });
}

$.RexFormsBuilder.editGroup = function(link) {
    var groupDiv = $(link).parents('.rb_page_group:first');
    $.RexFormsBuilder.editPageDialog.open({
        mode: 'group',
        target: groupDiv
    });
}

$.RexFormsBuilder.makePageGroupFromSelection = function() {
    $.RexFormsBuilder.editPageDialog.open({
        mode: 'group'
    });
}

$.RexFormsBuilder.updateGroupDiv = function(groupDiv) {
    var groupData = groupDiv.data('data');
    var groupNameDiv = groupDiv.find('.rb_page_group_name:first');
    
    if (groupData.title) {
        groupNameDiv
            .removeClass('rb_group_title_not_set')
            .text($.RexFormsBuilder.truncateText(groupData.title, 30));
        if (groupData.title.length >= 30)
            groupNameDiv.attr('title', groupData.title);
    } else
        groupNameDiv
            .addClass('rb_group_title_not_set')
            .removeAttr('title')
            .text('Untitled group')
    

    $.RexFormsBuilder.updateGroupSkipSpan(groupDiv);
}

$.RexFormsBuilder.createGroup = function(groupType) {
    var pageGroup = $.RexFormsBuilder.templates.createObject(groupType);
    return pageGroup;
}

$.RexFormsBuilder.processSelectedPages = function(newGroupName) {
    var firstPage = $.RexFormsBuilder.currentSelection[0];
    var lastPage = 
        $.RexFormsBuilder.currentSelection[$.RexFormsBuilder.currentSelection.length - 1];
    var pushToGroup = [];

    if (firstPage === lastPage) {
        pushToGroup.push(firstPage);
    } else {
        var firstLevel = $.RexFormsBuilder.getItemLevel(firstPage, 'page');
        var secondLevel = $.RexFormsBuilder.getItemLevel(lastPage, 'page');

        var firstLowestAllowedLevel =
                $.RexFormsBuilder.getLowestAllowedLevel(firstPage, firstLevel, true);

        var lastLowestAllowedLevel =
                $.RexFormsBuilder.getLowestAllowedLevel(lastPage, secondLevel, false);

        var lowestAllowedLevel =
                (firstLowestAllowedLevel < lastLowestAllowedLevel) ?
                                    lastLowestAllowedLevel:
                                    firstLowestAllowedLevel;

        if (lowestAllowedLevel > firstLevel ||
            lowestAllowedLevel > secondLevel)
            return;

        var firstCutoff = $.RexFormsBuilder.getCutoff(firstPage, 'page');
        var lastCutoff = null;
        var cutoff = firstCutoff;
        var total = $.RexFormsBuilder.currentSelection.length;

        for (var idx = 1; idx < total; idx++) {
            var currentCutoff = 
                $.RexFormsBuilder.getCutoff($.RexFormsBuilder.currentSelection[idx], 
                                        'page');
            cutoff = $.RexFormsBuilder.interceptCutoff(cutoff, currentCutoff);
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
        var pageGroup = $.RexFormsBuilder.createGroup('pageGroup');
        var pageSublistDiv = pageGroup.find('.rb_class_pages_list:first');

        var newGroupData = $.RexFormsBuilder.context.createNewGroup();
        pushToGroup[0].before(pageGroup);
        newGroupData.title = newGroupName;
        pageGroup.data('data', newGroupData);

        for (var idx in pushToGroup) {
            pageSublistDiv.append(pushToGroup[idx]);
        }
        $.RexFormsBuilder.setPageListSortable(pageSublistDiv);
        $.RexFormsBuilder.updateGroupDiv(pageGroup);
    }
}

$.RexFormsBuilder.showProgress = function(params) {
    $.RexFormsBuilder.progressDialog.startParams = params;
    $.RexFormsBuilder.progressDialog.dialog('option', 'buttons', params['buttons']);
    $('.rb_progress_text', $.RexFormsBuilder.progressDialog).html(params['title']);
    $.RexFormsBuilder.startPollingTimeout();
    $.RexFormsBuilder.progressDialog.dialog("open");
}

$.RexFormsBuilder.closeProgress = function() {
    $.RexFormsBuilder.stopPollingTimeout();
    $.RexFormsBuilder.progressDialog.startParams = null;
    $.RexFormsBuilder.progressDialog.dialog("close");
}

$.RexFormsBuilder.stopPollingTimeout = function() {
    if ($.RexFormsBuilder.progressDialog.pollTimeout !== null) {
        clearTimeout($.RexFormsBuilder.progressDialog.pollTimeout)
        $.RexFormsBuilder.progressDialog.pollTimeout = null;
    }
}

$.RexFormsBuilder.startPollingTimeout = function() {
    $.RexFormsBuilder.progressDialog.pollTimeout =
        setTimeout("$.RexFormsBuilder.progressDialogPolling()", 1000);
}

$.RexFormsBuilder.progressDialogPolling = function() {
    var params = $.RexFormsBuilder.progressDialog.startParams;
    params['pollCallback']();
}

$.RexFormsBuilder.showInstrumentJSON = function() {
    
}

$.RexFormsBuilder.testInstrument = function() {

    var params = $.RexFormsBuilder.context.getIndexByType('parameter');
    var toBeContinued = function (paramDict) {
        $.RexFormsBuilder.closeOpenedEditor(function () {
            $.RexFormsBuilder.showProgress({
                title: '<center>Preparing the form for a test...</center>',
                pollCallback: function () { }
            });

            $.RexFormsBuilder.savedParamValues = paramDict;
            $.RexFormsBuilder.saveInstrumentReal($.RexFormsBuilder.testInstrumentStage4);
        }, questionListDiv);
    }

    if (params.length) {
        $.RexFormsBuilder.beforeTestDialog.open({
            paramValues: $.RexFormsBuilder.savedParamValues || {},
            callback: toBeContinued
        });
    } else
        toBeContinued({});
}

$.RexFormsBuilder.testInstrumentStage2 = function() {
    $.ajax({url : $.RexFormsBuilder.basePrefix 
                    + "/construct_instrument?code=" 
                    + $.RexFormsBuilder.instrumentName 
                    + '&schema=demo',
        success : function(content) {
            console.log('construct successful:', content);
            $.RexFormsBuilder.testInstrumentStage4();
        },
        error: function() {
            $.RexFormsBuilder.closeProgress();
            alert('Error of construct_instrument!');
        },
        type: 'GET'
    });
}

$.RexFormsBuilder.testInstrumentStage4 = function() {
    $.RexFormsBuilder.closeProgress();
    var paramStr = '';
    if ($.RexFormsBuilder.savedParamValues) {
        for (var paramName in $.RexFormsBuilder.savedParamValues) {
            paramValue = $.RexFormsBuilder.savedParamValues[paramName];
            paramStr += '&' + 'p_' + encodeURIComponent(paramName) + '=' 
                        + (paramValue ? encodeURIComponent(paramValue) : '');
        }
    }
    var url = $.RexFormsBuilder.urlStartTest || 
            ($.RexFormsBuilder.formsPrefix + '/start_roads');

    var query = 'test=1&'
              + 'instrument=' + encodeURIComponent($.RexFormsBuilder.instrumentName)
              + paramStr;

    window.open(url + '?' + query, '_blank');
}

})();
