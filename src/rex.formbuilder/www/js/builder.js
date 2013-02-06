
$.RoadsBuilder = {};

(function () {
    var scripts = document.getElementsByTagName( 'script' );
    var thisScriptTag = $(scripts[ scripts.length - 1 ]);
    $.RoadsBuilder.basePrefix =
        thisScriptTag.attr('data-prefix') || '';
    $.RoadsBuilder.formsPrefix = 
        thisScriptTag.attr('data-forms-prefix') || '';

    // Put other pre-init actions here
})();

$.RoadsBuilder.QTypes = {
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

$.RoadsBuilder.remCharsRegExp = new RegExp("[^a-zA-Z0-9\\s_\\-\\/]+", "g");
$.RoadsBuilder.nameRegExp = new RegExp("[^a-zA-Z0-9_]+", "g");
$.RoadsBuilder.nameBeginRegExp = new RegExp('^[^a-zA-Z]');
$.RoadsBuilder.nameEndRegExp   = new RegExp('[^a-zA-Z0-9]$');

$.RoadsBuilder.predefinedLists = {};

$.RoadsBuilder.QuestionDialogF = function () {
    var dialogObj = null;
    var dialogParams = null;
    var dialogQuestion = null;
    var retValue = null;

    function closeDialog() {
        dialogObj.dialog('close');
    }

    var Init = function () {
        dialogQuestion = $('#question_dialog_text');
        dialogObj = $('#question_dialog').dialog({
            autoOpen: false,
            title: 'Question',
            width: 400,
            height: 200,
            modal: true,
            close: function () {
                if (dialogParams.onResult)
                    dialogParams.onResult(retValue);
                dialogParams = null;
                retValue = null;
            }
        });
    }

    function setDialogButtons(buttons) {
        var optButtons = {};
        for (var btnName in buttons) {
            var f = function () {
                var callee = arguments.callee
                retValue = buttons[callee.btnName]();
                closeDialog();
            }
            f.btnName = btnName;
            optButtons[btnName] = f;
        }
        dialogObj.dialog('option', 'buttons', optButtons);
    }

    Init.prototype = {
        open: function (params) {
            dialogParams = params;
            dialogQuestion.text(dialogParams.text);
            
            if (dialogParams.buttons)
                setDialogButtons(dialogParams.buttons);
            else {
                setDialogButtons({
                    'Ok': function () {
                        return true;
                    },
                    'Cancel': function () {
                        return false;
                    }
                });
            }

            dialogObj.dialog('option', 'title', 
                dialogParams.title || '');
            dialogObj.dialog('open');
        },
        close: closeDialog
    }

    return Init;
}

$.RoadsBuilder.isValidNumeric = function(val, condType) {
    return (
        (condType === 'integer' 
            && /^[0-9]+$/.test(val)) ||
        (condType === 'float' 
            && /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/.test(val))
    );
}

$.RoadsBuilder.isValidDate = function (year, month, day) {
    --month;
    var d = new Date(year, month, day);
    return (d.getDate() == day &&
            d.getMonth() == month &&
            d.getFullYear() == year);
}

$.RoadsBuilder.EditPageDialogF = function () {
    var dialogObj = null;
    var dialogParams = null;
    var pageNameInput = null;
    var skipConditions = null;
    var skipConditionsText = null;

    function closeDialog() {
        dialogParams = null;
        dialogObj.dialog('close');
    }

    var Init = function () {
        pageNameInput = $('.rb_edit_page_name');

        dialogObj = $('.rb_edit_page_dialog').dialog({
            autoOpen: false,
            title: 'Edit group',
            width: 300,
            height: 230,
            modal: true,
            buttons: {
                'Ok': function () {
                    var newName = jQuery.trim(pageNameInput.val());

                    if (dialogParams.target) {
                        var data = dialogParams.target.data('data');
                        data.title = newName;
                        // data.skipIf = skipConditions;
                        if (dialogParams.mode === 'group')
                            $.RoadsBuilder.updateGroupDiv(dialogParams.target);
                        else
                            $.RoadsBuilder.updatePageDiv(dialogParams.target);
                    } else {

                        if (dialogParams.mode === 'group') {

                            $.RoadsBuilder.processSelectedPages(newName);
                            var except = [  ];
                            for (var idx in $.RoadsBuilder.currentSelection) {
                                var item = $($.RoadsBuilder.currentSelection[idx]);
                                if (item[0] !== $.RoadsBuilder.currentPage[0]) {
                                    item.removeClass('rb_covered');
                                } else
                                    except.push(item);
                            }
                            $.RoadsBuilder.currentSelection = except;

                        } else {

                            var newPageData = $.RoadsBuilder.context.createNewPage();
                            newPageData.title = newName;
                            var target = $.RoadsBuilder.addPage(newPageData);
                            if (dialogParams.after)
                                dialogParams.after.after(target);
                            else
                                $.RoadsBuilder.pageListDiv.append(target);
                        }

                    }

                    closeDialog();
                },
                'Cancel': function () {
                    closeDialog();
                }
            }
        });
    }

    Init.prototype = {
        open: function (params) {
            dialogParams = params;
            currentItem = null;

            var itemName = '';
            if (dialogParams.target) {
                var data = dialogParams.target.data('data');
                itemName = data.title;
            }

            pageNameInput.val(itemName);
            dialogObj.dialog('open');
        },
        close: close
    }

    return Init;
}

$.RoadsBuilder.BeforeTestDialog = function () {

    var dialogParams = null;

    function closeDialog() {
        dialogParams = null;
        dialogObj.dialog('close');
    }
    
    var dialogObj = $('#before_test_dialog').dialog({
        autoOpen: false,
        title: 'Set Input Parameters',
        width: 300,
        height: 230,
        modal: true,
        buttons: {
            'Ok': function () {

                var paramDict = {};
                var valid = true;

                paramTable.find('tr').each(function () {
                    var jRow = $(this);
                    var paramName = jRow.attr('data-param');
                    var param = $.RoadsBuilder.context.findParamData(paramName);
                    var value = jQuery.trim(jRow.find('input,select').val());

                    if (value) {
                        var realType = param.type;

                        if (param.type !== 'STRING' &&
                            param.type !== 'NUMBER' &&
                            param.type !== 'DATE') {
                            
                            if ($.RoadsBuilder.externalParamTypes) {
                                typeDesc =
                                    $.RoadsBuilder.externalParamTypes[param.type];
                                if (typeDesc)
                                    realType = typeDesc.type;
                            }
                        }

                        switch(realType) {
                        case 'DATE':
                            var matches = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                            if (!matches ||
                                !$.RoadsBuilder.isValidDate(matches[1], matches[2], matches[3])) {
                                valid = false;
                                break;
                            }
                            paramDict[paramName] = value;
                            break;
                        case 'NUMBER':
                            if (!$.RoadsBuilder.isValidNumeric(value, 'float')) {
                                valid = false;
                                break;
                            }
                            paramDict[paramName] = value;
                            break;
                        default:
                            paramDict[paramName] = value;
                        }

                    } else
                        paramDict[paramName] = null;
                });

                if (valid) {
                    if (dialogParams.callback)
                        dialogParams.callback(paramDict);
                    closeDialog();
                }
            },
            'Cancel': function () {
                closeDialog();
            }
        }
    });

    var paramTable = $('#before_test_parameters');

    this.open = function (initParams) {
        dialogParams = initParams || {};
        params = $.RoadsBuilder.context.getIndexByType('parameter');
        paramTable.contents().remove();
        for (var idx in params) {
            var param = params[idx];
            var rowHTML = '<tr><td>' 
                                + $.RoadsBuilder.escapeHTML(param.name) + '</td>' 
                                + '<td class="rb_test_param_value"></td></tr>';

            var row = $(rowHTML);
            row.attr('data-param', param.name);
            var isScalar = true;
            var realType = param.type;
            var typeDesc;

            if (param.type !== 'NUMBER' &&
                param.type !== 'STRING' &&
                param.type !== 'DATE') {
                if ($.RoadsBuilder.externalParamTypes) {
                    typeDesc =
                        $.RoadsBuilder.externalParamTypes[param.type];
                    console.log('typeDesc:', typeDesc);
                    if (typeDesc && typeDesc.type === 'ENUM') {
                        isScalar = false;
                    }
                    realType = typeDesc;
                }
            }

            var paramValuePlace = row.find('.rb_test_param_value:first');

            if (isScalar) {
                var input = $('<input type="text" />');
                paramValuePlace.append(input);
                if (realType === "DATE") {
                    input.datepicker({
                        dateFormat: 'yy-mm-dd'
                    });
                }
                if (dialogParams.paramValues && 
                    dialogParams.paramValues[param.name]) {

                    input.val(dialogParams.paramValues[param.name]);
                }
            } else {
                var select = $('<select>');
                $('<option>', {
                    value: '',
                    text: ''
                }).appendTo(select);

                for (var idx in typeDesc.variants) {
                    var variant = typeDesc.variants[idx];
                    $('<option>', {
                        value: variant.code,
                        text: variant.title || variant.code
                    }).appendTo(select);
                }
                paramValuePlace.append(select);

                if (dialogParams.paramValues && 
                    dialogParams.paramValues[param.name]) {

                    select.val(dialogParams.paramValues[param.name]);
                }
            }

            paramTable.append(row);
        }
        dialogObj.dialog('open');
    };
    
    this.closeDialog = closeDialog;
};

$.RoadsBuilder.EditParamDialogF = function () {
    var dialogObj = null;
    var dialogParams = null;
    var paramNameInput = null;
    var selectParamType = null;

    function closeDialog() {
        dialogParams = null;
        dialogObj.dialog('close');
    }

    var Init = function () {
        paramNameInput = $('.rb_edit_param_name');
        paramTypeSelect = $('.rb_select_param_type');

        if ($.RoadsBuilder.externalParamTypes) {
            for (var typeName in $.RoadsBuilder.externalParamTypes) {
                var typeDesc = $.RoadsBuilder.externalParamTypes[typeName];
                $('<option>', {
                    value: typeName,
                    text: typeDesc.title || typeName
                }).appendTo(paramTypeSelect);
            }
        }

        dialogObj = $('.rb_edit_param_dialog').dialog({
            autoOpen: false,
            title: 'Edit parameter',
            width: 300,
            height: 230,
            modal: true,
            buttons: {
                'Ok': function () {
                    var newName = jQuery.trim(paramNameInput.val());
                    var newType = paramTypeSelect.val();
                    if (newName) {
                        dialogParams.callback(newName, newType);
                        closeDialog();
                    }
                },
                'Cancel': function () {
                    closeDialog();
                }
            }
        });

        var onChange = function () {
            var jThis = $(this);
            var val = jThis.val();

            var newVal = val.replace($.RoadsBuilder.nameRegExp, '')
                            .replace($.RoadsBuilder.nameBeginRegExp, '');

            if (newVal !== val)
                jThis.val( newVal );
        }

        paramNameInput.change(onChange);
        paramNameInput.keyup(onChange);
    }

    Init.prototype = {
        open: function (params) {
            dialogParams = params;
            paramNameInput.val(params.paramName || '');
            paramTypeSelect.val(params.paramType || 'NUMBER');
            dialogObj.dialog('option', 'title',
                    dialogParams.dialogTitle || 'Edit Parameter');
            dialogObj.dialog('open');
        },
        close: close
    }

    return Init;
}

$.RoadsBuilder.loadInstrument = function (instrumentName) {
    var url = $.RoadsBuilder.basePrefix 
            + "/load_instrument?code=" + instrumentName;
    $.ajax({url : url,
        success : function(content) {
            $.RoadsBuilder.loadInstrumentSchema(instrumentName, content);
        },
        type: 'GET'
    });
}

$.RoadsBuilder.OpenDialogF = function () {
    var dialogObj = null;
    var instrumentList = null;

    function closeDialog() {
        dialogObj.dialog('close');
    }

    function loadInstrument(instrumentName) {
      var url = $.RoadsBuilder.basePrefix
              + "/load_instrument?code=" + instrumentName;
        $.ajax({url : url,
            success : function(content) {
                $.RoadsBuilder.loadInstrumentSchema(instrumentName, content);
            },
            type: 'GET'
        });
    }

    var Init = function () {
        dialogObj = $('#open_dialog').dialog({
            autoOpen: false,
            title: 'Open Instrument',
            width: 300,
            height: 200,
            modal: true,
            buttons: {
                'Ok': function () {
                    var instrumentName = instrumentList.val();
                    if (instrumentName) {
                        loadInstrument(instrumentName);
                        closeDialog();
                    }
                },
                'Cancel': function () {
                    closeDialog();
                }
            }
        });
        instrumentList = $('#open_dialog_list');
    }

    function preloadInstruments (callback) {
      var url = $.RoadsBuilder.basePrefix + "/instrument_list";
        $.ajax({
            url : url,
            success : function(content) {
                var c = eval("(" + content + ")");
                for (var idx in c) {
                    $('<option>', {
                        value: c[idx],
                        text: c[idx]
                    }).appendTo(instrumentList);
                }
                callback();
            },
            type: 'GET'
        });
    }

    Init.prototype = {
        open: function () {
            instrumentList.contents().remove();
            preloadInstruments(function () {
                dialogObj.dialog('open');
            });
        },
        close: close,
    }       
    
    return Init;
}

$.RoadsBuilder.ShowJSONDialogF = function () {
    var dialogObj = null;
    var jsonTextDiv = null;

    function closeDialog() {
        dialogObj.dialog('close');
    }

    var Init = function () {
        dialogObj = $('#rb_show_json_dialog').dialog({
            autoOpen: false,
            title: 'Instrument\'s JSON',
            width: 600,
            height: 300,
            modal: true,
        });
        jsonTextDiv = $('#rb_json_text');
    }

    Init.prototype = {
        open: function () {
            var jsonTxt =
                    $.RoadsBuilder.generateMetaJSON(
                        $.RoadsBuilder.instrumentName || '',
                        true
                    );

            jsonTextDiv.val(jsonTxt);
            dialogObj.dialog('open');
        },
        close: close,
    }

    return Init;
}


$.RoadsBuilder.TemplatesF = function () {
    var templates = {};

    var Init = function () {
        templates.questionEditor = $('#tpl_question_editor');
        templates.questionEditor.removeAttr('id');

        var selectQType = $('select[name="question-type"]',
                                    templates.questionEditor);
        if (selectQType) {
            for (type in $.RoadsBuilder.QTypes) {
                selectQType.append($('<option value="' + type 
                                + '">' + $.RoadsBuilder.QTypes[type]
                                + '</option>').text($.RoadsBuilder.QTypes[type]));
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

$.RoadsBuilder.getCId = function(prefix) {
    var cId = prefix + '_';
    cId += $.RoadsBuilder.getRandomStr(10);
    // TODO: check for uniqness inside current instrument
    return cId;
}

$.RoadsBuilder.getRandomStr = function(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" 
                 + "abcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < len; i++)
        text += possible.charAt(
                    Math.floor(Math.random() * possible.length)
                );

    return text;
}

$.RoadsBuilder.ContextF = function () {
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
                'cId': $.RoadsBuilder.getCId('page'),
                'title': null,
                'questions': []
            };
            $.RoadsBuilder.context.putToIndex('page', newPage);
            return newPage;
        },
        createNewParameter: function (id) {
            var newParam = {
                'name': id ? id : null, 
                'type': 'NUMBER'
            };
            $.RoadsBuilder.context.putToIndex('parameter', newParam);
            return newParam;
        },
        createNewGroup: function (title) {
            var newGroup = {
                'title': title ? title : null,
                'cId': $.RoadsBuilder.getCId('group'),
            };
            $.RoadsBuilder.context.putToIndex('group', newGroup);
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
            $.RoadsBuilder.context.putToIndex('question', newQuestion);
            return newQuestion;
        }
    }
    return Init;
}

$.RoadsBuilder.namesWhichBreaksConsistency = function (names, exclude) {
    console.log('namesWhichBreaksConsistency(', names, ')');

    var badNames = {};
    var chkNames = {};
    $.each(names, function (_, name) {
        chkNames[name] = true;
    });

    questionIndex = $.RoadsBuilder.context.getIndexByType('question');

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

$.RoadsBuilder.preparePageMeta = function(pageDiv, to) {
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
            $.RoadsBuilder.preparePageMeta($(innerItems[idx]), thisGroupMeta.pages);
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

$.RoadsBuilder.generateMetaJSON = function(instrumentName, doBeautify) {
    var instrumentMeta = $.RoadsBuilder.generateMeta(instrumentName);

    if (doBeautify && JSON && JSON.stringify)
        return JSON.stringify(instrumentMeta, null, 4);

    return $.toJSON(instrumentMeta);
}

$.RoadsBuilder.generateMeta = function(instrumentName) {
    var instrumentMeta = {
        pages: [],
        params: [],
        title: $.RoadsBuilder.instrumentTitle
    };

    var root = instrumentMeta['pages'];
    $.RoadsBuilder.pageListDiv.children().each(function () {
        var jThis = $(this);
        // console.log('checking', jThis);
        $.RoadsBuilder.preparePageMeta(jThis, root);
    });

    var root = instrumentMeta['params'];
    $.RoadsBuilder.paramListDiv.children().each(function () {
        var jThis = $(this);
        root.push(jThis.data('data'));
    });

    return instrumentMeta;
}

$.RoadsBuilder.saveInstrumentReal = function(callback) {
    var instrumentName = $.RoadsBuilder.instrumentName;

    if (!instrumentName)
        instrumentName = prompt("Please set instrument name:");

    if (instrumentName) {
        if ($.RoadsBuilder.context.getIndexByType('question').length == 0) {
            alert('A form should contain at least one question!');
            return;
        }
    
        var meta = $.RoadsBuilder.generateMeta(instrumentName);

        meta = $.toJSON(meta);
        var schema = 'instrument=' + encodeURIComponent(instrumentName) 
                    + '&data=' + encodeURIComponent( meta );

        var url = $.RoadsBuilder.urlSaveForm ||
                 ($.RoadsBuilder.basePrefix + "/add_instrument");
        $.ajax({url : url,
            success : function(content) {
                if (!$.RoadsBuilder.instrumentName)
                    $.RoadsBuilder.instrumentName = instrumentName;

                if (callback)
                    callback();
                else
                    alert('instrument saved!');
            },
            error: function() {
                $.RoadsBuilder.closeProgress();
                alert('Error of saving instrument!');
            },
            data : schema,
            type: 'POST'
        });
    }
};

$.RoadsBuilder.saveInstrument = function(callback) {
    $.RoadsBuilder.closeOpenedEditor(function () {
        $.RoadsBuilder.saveInstrumentReal();
    }, questionListDiv);
}

$.RoadsBuilder.evaluateMetaStr = function(metaStr) {
    var meta = $.parseJSON(metaStr);
    $.RoadsBuilder.evaluateMeta(meta);
}

$.RoadsBuilder.hints = {
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

$.RoadsBuilder.dismissIt = function(a) {
    var p = $(a).parents('div:first').remove();
}

$.RoadsBuilder.putHint = function(element, hintId) {
    var existentHint = element.next('.rb_hint');
    if (existentHint.size() == 0 ||
        existentHint.attr('data-hint-id') !== hintId) {

        existentHint.remove();
        var hint = $(document.createElement('div'))
                             .addClass('rb_hint')
                             .addClass('rb_red_hint')
                             .addClass('rb_question_input')
                             .attr('data-hint-id', hintId);
        hint.text($.RoadsBuilder.hints[hintId] + ' ');
        hint.append(' <a href="javascript:void(0)" onclick="$.RoadsBuilder.dismissIt(this);">Dismiss this message</a>');
        element.after(hint);
    }
}

$.RoadsBuilder.isNumericType = function(qType) {
    return (qType === 'integer' || qType == 'float')
}

$.RoadsBuilder.isListType = function(qType) {
    return (qType === 'set' || qType == 'enum'); 
}

$.RoadsBuilder.updateQuestionDiv = function(questionDiv) {
    var questionData = questionDiv.data('data');
    $('.rb_question_title', questionDiv).text(questionData.title || '');
    $('.rb_question_name', questionDiv).text(questionData.name || '');
    $('.rb_question_descr', questionDiv)
                    .text($.RoadsBuilder.getQuestionDescription(questionData));
}

$.RoadsBuilder.updateQuestionOrders = function() {
    var newQuestionList = [];
    questionListDiv.children('.rb_question').each(function () {
        var questionData = $(this).data('data');
        newQuestionList.push(questionData);
    });
    var pageData = $.RoadsBuilder.currentPage.data('data');
    pageData.questions = newQuestionList;
}

$.RoadsBuilder.setPageListSortable = function(list) {
    list.sortable({
        cursor: 'move',
        toleranceElement: '> div',
        connectWith: 'rb_pages_list,.rb_class_pages_list'
    });
}

$.RoadsBuilder.setQuestionsSortable = function(list) {
    list.sortable({
        cursor: 'move',
        // cancel: '.restrict-question-drag',
        toleranceElement: '> div',
        update: function () {
            $.RoadsBuilder.updateQuestionOrders();
        }
    });
}

$.RoadsBuilder.addQuestionDiv = function(questionData, listDiv) {
    var newQuestionDiv = $.RoadsBuilder.templates.createObject('question');
    newQuestionDiv.data('data', questionData);
    $.RoadsBuilder.updateQuestionDiv(newQuestionDiv);
    
    if (listDiv)
        listDiv.append(newQuestionDiv)
    else
        questionListDiv.append(newQuestionDiv);

    newQuestionDiv.click(function () {
        $.RoadsBuilder.showQuestionEditor(this);
    });

    return newQuestionDiv;
}

$.RoadsBuilder.closeOpenedEditor = function(callback, listDiv) {
    var errorSaving = false;
    listDiv.children('.rb_question').each(function () {
        if (!errorSaving) {
            var thisQuestion = $(this);
            if (thisQuestion.hasClass('rb_opened') && 
                !$.RoadsBuilder.saveQuestion(thisQuestion)) {

                errorSaving = true;

                var doHighlight = function () {
                    thisQuestion.effect("highlight", { color: '#f3c2c2' }, 1000);
                };

                if (listDiv[0] === questionListDiv[0]) {
                    if ($.RoadsBuilder.isScrolledIntoView(thisQuestion, questionListDiv))
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

$.RoadsBuilder.onPredefinedChoicesChange = function () {
    var val = $(this).val();
    if (val) {
        var choicesList =
                $(this).parents('.rb_choices:first')
                       .find('.choices-list-items');

        choicesList.children().remove();
        var choices = $.RoadsBuilder.predefinedLists[val];

        var isFirst = true;
        $.each(choices, function (_, choice) {
            $.RoadsBuilder.addChoiceReal(
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

$.RoadsBuilder.showQuestionEditor = function(question) {
    var questionDiv = $(question);

    if (!questionDiv.hasClass('rb_opened')) {

        var parent = questionDiv.parent();
        $.RoadsBuilder.closeOpenedEditor(function () {
            questionDiv.addClass('rb_opened');
            var question = questionDiv.data('data');

            var editorPlace = questionDiv.find('.q_editor:first');
            var editor = $.RoadsBuilder.templates.createObject('questionEditor');

            editor.click(function (event) {
                // trap for event
                event.stopPropagation();
            });
            questionDiv.find('.btn-save-cancel:first').css('display', '');
            questionDiv.find('.q_caption:first').css('display', 'none');
            questionDiv.find('.btn-page-answer').css('display', 'none');

            $('select[name="predefined-choice-list"]', editor)
                .change($.RoadsBuilder.onPredefinedChoicesChange);

            var questionName = question['name'];
            var inputTitle = $('textarea[name="question-title"]', editor);
            var inputName = $('input[name="question-name"]', editor);
            var visible = $('input[name="question-visible"]', editor);
            var required = $('input[name="question-required"]', editor);

            var choicesList = $('.choices-list-items', editor);
            $.RoadsBuilder.setChoicesSortable(choicesList);

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
                $.RoadsBuilder.addChoiceReal(choicesList, 
                            answer['code'],  
                            answer['title'],
                            isFirst, 
                            false);
                isFirst = false;
            }

            if ($.RoadsBuilder.isListType(question.type))
                $('.rb_choices', editor).css('display', 'block');

            inputTitle.change(function () {
                var title = $(this).val();
                if (inputName.hasClass('slave')) {
                    inputName.val(
                        $.RoadsBuilder.getReadableId(title, true, '_', 45)
                    );
                }
            })

            inputName.change(function () {
                var jThis = $(this);
                jThis.removeClass('slave');
                var val = jThis.val();

                var newVal = val.replace($.RoadsBuilder.nameEndRegExp, '');
                if (newVal !== val) {
                    jThis.val( newVal );
                    $.RoadsBuilder.putHint(jThis, 'wrongQuestionId');
                }
            });

            inputName.keyup(function () {
                var jThis = $(this);
                var val = jThis.val();

                var newVal = val.replace($.RoadsBuilder.nameRegExp, '')
                                .replace($.RoadsBuilder.nameBeginRegExp, '');

                if (newVal !== val) {
                    jThis.val( newVal );
                    $.RoadsBuilder.putHint(jThis, 'wrongQuestionId');
                }
            });

            questionType = $('select[name="question-type"]', editor);

            if (parent[0] !== questionListDiv[0])
                // currently we don't support repeating 
                // groups inside repeating groups
                questionType.find('option[value="rep_group"]').remove();

            questionType.val(question.type);
            questionType.change($.RoadsBuilder.onChangeQuestionType);
            questionType.change();

            editor[0].disableIf = question['disableIf'];
            editor[0].constraints = question['constraints'];

            if (question['disableIf'])
                $.RoadsBuilder.makeREXLCache(editor[0], 'disableIf');

            if (question['constraints'])
                $.RoadsBuilder.makeREXLCache(editor[0], 'constraints');

            $.RoadsBuilder.updateDisableLogicDescription(editor);
            $.RoadsBuilder.updateConstraintsDescription(editor);
            
            editor.find('.rb_small_button:first').click(function () {
                $.RoadsBuilder.addNewSubQuestion(
                    editor.find('.rb_subquestion_list:first')
                );
            });

            editorPlace.append(editor);

            if (question.type === "rep_group" &&
                question['repeatingGroup'] &&
                question['repeatingGroup'].length) {

                var listDiv = editor.find('.rb_subquestion_list');

                for (var idx in question['repeatingGroup'])
                    $.RoadsBuilder.addQuestionDiv(
                        question['repeatingGroup'][idx], 
                        listDiv
                    );
            }

        }, parent);
    }
}

$.RoadsBuilder.getConditionAnswersStr = function(answers) {
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

$.RoadsBuilder.escapeHTML = function(str) {
    return $(document.createElement('div')).text(str).html();
}

$.RoadsBuilder.getConnectionLabel = function(conditions, defLabel) {
    if (conditions && conditions.length) {
        var label = '';
        for (var idx in conditions) {
            var condition = conditions[idx];
            if (idx > 0)
                label += "<br>";
            label += '"' + $.RoadsBuilder.escapeHTML(condition['question']) + '": '
                  + $.RoadsBuilder.escapeHTML(
                        $.RoadsBuilder.getConditionAnswersStr(condition['answers'])
                    );
        }
        return label;
    } else
        return (defLabel ? defLabel : 'Default');
}

$.RoadsBuilder.addChoiceReal = function(choicesList, code, title,
                                        hideHeader, slave) {

    var newChoice = $.RoadsBuilder.templates.createObject('choicesItem');

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
            answerCode.val($.RoadsBuilder.getReadableId(title, false, '_', 45));
        }
    });

    answerCode.change(function () {
        var jThis = $(this);
        jThis.removeClass('slave');
        var val = jThis.val();

        var newVal = val.replace($.RoadsBuilder.nameEndRegExp, '');
        if (newVal !== val) {
            jThis.val( newVal );
        }
    });

    answerCode.keyup(function () {
        var jThis = $(this);
        var val = jThis.val();
        var newVal = val.replace($.RoadsBuilder.nameRegExp, '')
                        .replace($.RoadsBuilder.nameBeginRegExp, '');

        if (newVal !== val) {
            jThis.val( newVal );
        }
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

$.RoadsBuilder.addChoice = function(button) {
    var jButton = $(button);
    var choicesList = jButton.parent().siblings('.choices-list')
                                      .children('.choices-list-items');
    
    $.RoadsBuilder.addChoiceReal(choicesList, null, null, true, true);
}

$.RoadsBuilder.setChoicesSortable = function(c) {
    console.log('setChoicesSortable', c);
    c.sortable({
        cursor: 'move',
        toleranceElement: '> div'
        // cancel: '.restrict-drag',
    });
}

$.RoadsBuilder.removeChoicesItem = function (obj) {
    var choicesDiv = $(obj).parents('.rb_choices_item:first');
    choicesDiv.slideUp(300, function () {
        $(this).remove();
    });
}

$.RoadsBuilder.removeQuestion = function (obj) {
    var questionDiv = $(obj).parents('.rb_question:first');
    questionDiv.slideUp(300, function () {
        $.RoadsBuilder.removeQuestionReal(questionDiv);
    });
}

$.RoadsBuilder.removeQuestionReal = function(questionDiv) {
    var pageData = $.RoadsBuilder.currentPage.data('data');
    var questionData = questionDiv.data('data');
    for (var idx in pageData.questions) {
        if (pageData.questions[idx] === questionData) {
            pageData.questions.splice(idx, 1);
            break;
        }
    }
    $.RoadsBuilder.context.removeFromIndex('question', questionDiv.data('data'));
    questionDiv.remove();
}

$.RoadsBuilder.cancelQuestionEdit = function(button) {
    var questionDiv = $(button).parents('.rb_question:first');
    var data = questionDiv.data('data');

    blockRepaint = true;
    if (!data['name']) {
        $.RoadsBuilder.removeQuestionReal(questionDiv);
    } else {
        $.RoadsBuilder.closeQuestionEditor(questionDiv);
        $.RoadsBuilder.updateQuestionDiv(questionDiv);
    }
    blockRepaint = false;
}

$.RoadsBuilder.onChangeQuestionType = function() {
    var jThis = $(this);
    var editor = jThis.parents('.rb_question_editor:first');
    var presets = $('.preset-choices', editor);
    var choices = $('.rb_choices', editor);
    var subQListWrap = $('.rb_question_table_subquestions', editor);
    var subQList = $('.rb_subquestion_list', subQListWrap);

    var type = jThis.val();
    
    var answersDisplay = $.RoadsBuilder.isListType(type) ? 'block' : 'none';
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

$.RoadsBuilder.abbr = {
    diagnosis: 'dx',
    equivalent: 'equiv',
    confidence: 'conf',
    develop: 'dev',
    development: 'dev',
    developmental: 'dev',
    neurological: 'neuro',
    specify: 'spec',
    describe: 'desc',
    description: 'desc',
    positive: 'pos',
    negative: 'neg',
    seizure: 'seiz',
    seizures: 'seiz',
    unknown: 'unk',
    surgery: 'surg',
    medication: 'med',
    pregnancy: 'preg',
    pregnant: 'preg',
    functioning: 'func',
    functional: 'func',
    'function': 'func',
    communication: 'comm',
    communicate: 'comm',
    classification: 'class'
};

$.RoadsBuilder.stopWords = {
    'is': true,
    'the': true,
    'of': true,
    'and': true,
    'a': true,
    'an': true,
    'for': true,
    'in': true,
    'to': true
};

$.RoadsBuilder.getReadableId = function(str, handlePrefix,
                                        delim, maxlen) {
    str = str.replace($.RoadsBuilder.remCharsRegExp, '');
    var len = str.length;
    var result = '';
    var word = '';
    var begin = true;
    var ch;
    for (i = 0; i <= len; i++) {
        ch = str.charAt(i);
        if ((ch >= 'a' && ch <= 'z') ||
            (ch >= '0' && ch <= '9'))
            word += ch;
        else if (ch >= 'A' && ch <= 'Z')
            word += ch.toLowerCase();
        else if (word) {
            if (!$.RoadsBuilder.stopWords[word]) {
                if ($.RoadsBuilder.abbr[word])
                    word = $.RoadsBuilder.abbr[word];

                if (result)
                    result += delim + word;
                else {
                    if (handlePrefix) {
                        var matches = 
                                word.match(/^([a-z]{0,1})(\d+)(.*)$/);
                    
                        if (matches !== null) {
                            if (parseInt(matches[2]) + 0 < 10)
                                matches[2] = '0' + matches[2];
                            if (matches[1] === '')
                                matches[1] = 'q';
                            word = matches[1] 
                                    + matches[2]
                                    + matches[3];
                        }
                    }
                    result = word;
                    begin = false;
                }
            } else
                begin = false;
            word = '';
            if (result.length >= maxlen) {
                if (result.charAt(maxlen - 1) === delim)
                    --maxlen; 
                result = result.substr(0, maxlen);
                break;
            }
        }
    }

    return result;
}

$.RoadsBuilder.changesCounter = 0;
$.RoadsBuilder.instrumentChanged = false;
$.RoadsBuilder.setGlobalChangesMark = function(hasChanges) {
    $.RoadsBuilder.instrumentChanged = hasChanges;
    // globalChangesMark.html(hasChanges ? '*' : '');
}

$.RoadsBuilder.getChangeStamp = function() {
    $.RoadsBuilder.setGlobalChangesMark(true);
    return $.RoadsBuilder.changesCounter++;
}

$.RoadsBuilder.findDuplicates = function(qName, origQuestionData) {
    var foundQuestionData = $.RoadsBuilder.context.findQuestionData(qName);
    return (!foundQuestionData ||
            foundQuestionData === origQuestionData) ? false : true;
}

$.RoadsBuilder.writeChanges = function(obj, attrs) {
    if (obj['changes'] === undefined)
        obj['changes'] = {};
    for (var idx in attrs) {
        obj['changes'][attrs[idx]] = $.RoadsBuilder.getChangeStamp();
    }
}

$.RoadsBuilder.saveQuestion = function(obj) {
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
        $.RoadsBuilder.putHint(inputTitle, 'emptyField');
        validationError = true;
    }

    var preloadedAnswers = {};
    // var changes = [];

    if ($.RoadsBuilder.isListType(qQuestionType)) {
        var choicesList = $('.choices-list:first', question)
                            .find('.choices-list-items:first');
        var items = $('.rb_choices_item', choicesList);
        if (items.size() == 0) {
            $.RoadsBuilder.putHint(choicesList, 'noAnswers');
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
                            $.RoadsBuilder.nameRegExp.test(answerCode) ||

                    $.RoadsBuilder.nameBeginRegExp.test(answerCode) ||
                    $.RoadsBuilder.nameEndRegExp.test(answerCode)) {
                    $.RoadsBuilder.putHint(choicesList, 'wrongAnswerId');
                    validationError = true;
                    break;
                } else if (answerScore !== '' && 
                            !/^[0-9]+$/.test(answerScore)) {

                    $.RoadsBuilder.putHint(choicesList, 'wrongScore');
                    validationEerror = true;
                } else if (preloadedAnswers[answerCode] !== undefined) {

                    $.RoadsBuilder.putHint(choicesList, 'dupAnswerId');
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
        $.RoadsBuilder.nameRegExp.test(qName) ||
        $.RoadsBuilder.nameBeginRegExp.test(qName) ||
        $.RoadsBuilder.nameEndRegExp.test(qName) ) {
        $.RoadsBuilder.putHint(inputName, 'wrongQuestionId');
        validationError = true;
    } else {
        var chkNames = { };

        chkNames[qName] = function (name) {
            $.RoadsBuilder.putHint(inputName, 'dupQuestionId');
        }

        if (qQuestionType === "set") {
            for (code in preloadedAnswers) {
                chkNames[qName + '_' + code] = function (name) {
                    alert('Choice name \'' + name + '\' didn\'t pass the name consistency check');
                }
            }
        }

        var badNames = $.RoadsBuilder
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
                    !$.RoadsBuilder.saveQuestion(jThis))

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

    $.RoadsBuilder.makeREXLCache(questionData, 'disableIf');
    $.RoadsBuilder.makeREXLCache(questionData, 'constraints');

    if ($.RoadsBuilder.isListType(qQuestionType)) {
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

    // $.RoadsBuilder.writeChanges(questionData, changes);

    if ($.RoadsBuilder.isListType(qQuestionType))
        $.RoadsBuilder.updatePredefinedChoices(questionData.answers);

    $.RoadsBuilder.closeQuestionEditor(question);
    $.RoadsBuilder.updateQuestionDiv(question);

    return true;
}

$.RoadsBuilder.updatePredefinedChoices = function(answers) {
    var titles = [];

    $.each(answers, function (_, answer) {
        titles.push(answer['title'] || answer['code']);
    });

    if (!titles.length)
        return;

    var preList = [];
    var titlesStr = titles.join(', ');

    if ($.RoadsBuilder.predefinedLists[titlesStr])
        // the same predefined set of choices exists already
        return;

    $.RoadsBuilder.predefinedLists[titlesStr] = preList;
    $.each(answers, function (_, answer) {
        preList.push({
            'code': answer['code'],
            'title': answer['title']
        });
    });

    var tpl = $.RoadsBuilder.templates.getTemplate('questionEditor');
    var selectChoiceList = tpl.find('select[name="predefined-choice-list"]:first');

    $('<option>', {
        value: titlesStr,
        text: $.RoadsBuilder.truncateText(titlesStr, 50)
    }).appendTo(selectChoiceList);
}

$.RoadsBuilder.closeQuestionEditor = function(questionDiv) {
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

$.RoadsBuilder.updateDisableLogicDescription = function(questionEditor) {
    var targetSpan = questionEditor.find('.rb_disable_logic_descr:first');
    var disableIf = questionEditor[0].disableIf;
    
    if (disableIf) {
        targetSpan.removeClass('disable_logic_not_set')
                  .html('Disabled if:&nbsp;&nbsp;' 
                        + $.RoadsBuilder.escapeHTML(
                            $.RoadsBuilder.truncateText(disableIf, 30))
                          );
    } else {
        targetSpan.addClass('disable_logic_not_set')
                  .html('Never disabled');
    }
}

$.RoadsBuilder.updateGroupSkipSpan = function(groupDiv) {
    var groupSkipWhenSpan = groupDiv.find('.rb_page_group_skip:first');
    
    var data = groupDiv.data('data');
    if (data.skipIf) {
        groupSkipWhenSpan
            .removeClass('rb_group_skip_not_set')
            .text('Skipped if: ' + $.RoadsBuilder.truncateText(data.skipIf, 30))
            
            if (data.skipIf.length >= 30)
                groupSkipWhenSpan.attr('title', data.skipIf);
    }
    else
        groupSkipWhenSpan
            .addClass('rb_group_skip_not_set')
            .removeAttr('title')
            .html('Never skipped');
}

$.RoadsBuilder.updatePageWhenSpan = function(pageData) {
    if (pageData.skipIf)
        $.RoadsBuilder.pageSkipWhenSpan
            .removeClass('rb_page_skip_not_set')
            .html('Skipped if:&nbsp;&nbsp;' 
                        + $.RoadsBuilder.escapeHTML(pageData.skipIf));
    else
        $.RoadsBuilder.pageSkipWhenSpan
            .addClass('rb_page_skip_not_set')
            .html('Never skipped');
}

$.RoadsBuilder.updatePageTitleSpan = function(pageData) {
    if (pageData.title)
        $.RoadsBuilder.pageTitleSpan
            .removeClass('rb_page_title_not_set')
            .text(pageData.title);
    else
        $.RoadsBuilder.pageTitleSpan
            .addClass('rb_page_title_not_set')
            .html('Untitled page');
}

$.RoadsBuilder.isScrolledIntoView = function(elem, scrollable) {
    var docViewTop = scrollable.scrollTop();
    var docViewBottom = docViewTop + scrollable.height();

    var elemTop = elem.offset().top;
    var elemBottom = elemTop + elem.height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

$.RoadsBuilder.selectPage = function(pageDiv) {
    $.RoadsBuilder.closeOpenedEditor(function () {
        if ($.RoadsBuilder.pageTitleInput.is(':visible'))
            $.RoadsBuilder.pageTitleInput.focusout();

        $.RoadsBuilder.mainPartContent.css('display', 'block');
        if ($.RoadsBuilder.currentPage)
            $.RoadsBuilder.currentPage.removeClass('rb_covered');
        $.RoadsBuilder.currentPage = $(pageDiv);
        $.RoadsBuilder.currentPage.addClass('rb_covered');
        var pageData = $.RoadsBuilder.currentPage.data('data');
        $.RoadsBuilder.clearQuestions();
        $.RoadsBuilder.updatePageTitleSpan(pageData);
        $.RoadsBuilder.updatePageWhenSpan(pageData);
        for (var idx in pageData.questions) {
            var question = pageData.questions[idx];
            $.RoadsBuilder.addQuestionDiv(question);
        }
    }, questionListDiv);
}

$.RoadsBuilder.relativeTop = function(element, relativeTo) {
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

$.RoadsBuilder.addNewSubQuestion = function(listDiv) {
    $.RoadsBuilder.closeOpenedEditor(function () {
        var parentQuestionDiv = listDiv.parents('.rb_question:first');
        var parentQData = parentQuestionDiv.data('data');
        var qData = $.RoadsBuilder.context.createNewQuestion();
        qData.slave = true;

        if (!parentQData.repeatingGroup)
            parentQData.repeatingGroup = [];
        parentQData.repeatingGroup.push(qData);

        var questionDiv = $.RoadsBuilder.addQuestionDiv(qData, listDiv);
        questionDiv.click();
    }, listDiv);
}

$.RoadsBuilder.addNewQuestion = function() {
    if (!$.RoadsBuilder.currentPage)
        return;

    $.RoadsBuilder.closeOpenedEditor(function () {
        var pageData = $.RoadsBuilder.currentPage.data('data');
        var questionData = $.RoadsBuilder.context.createNewQuestion();
        pageData.questions.push(questionData);
        var questionDiv = $.RoadsBuilder.addQuestionDiv(questionData);
        questionDiv.click();

        var doEffect = function () {
            questionDiv.effect("highlight", 
                                { color: '#bdecd0' }, 2000);
        };

        if ($.RoadsBuilder.isScrolledIntoView(questionDiv, questionListDiv))
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

$.RoadsBuilder.getParamTitle = function(type) {
    switch (type) {
    case 'NUMBER':
        return 'Number';
    case 'STRING':
        return 'String';
    case 'DATE':
        return 'Date';
    default:
        if ($.RoadsBuilder.externalParamTypes &&
            $.RoadsBuilder.externalParamTypes[type]) {

            var typeDesc = $.RoadsBuilder.externalParamTypes[type];
            return typeDesc.title || type;
        }
    }
    return 'Unknown';
}

$.RoadsBuilder.updateParameterDiv = function(target) {
    var data = target.data('data');
    target.find('.param_name').text(data.name);
    target.find('.rb_param_type').text('(' 
                    + $.RoadsBuilder.getParamTitle(data.type) + ')');
}

$.RoadsBuilder.addParameterReal = function(data) {
    var target = $.RoadsBuilder.templates.createObject('parameter');
    target.data('data', data);
    var placeFound = false;
    $.RoadsBuilder.paramListDiv.children().each(function () {
        if (!placeFound) {
            var thisParamData = $(this).data('data');
            if (data.name < thisParamData.name) {
                $(this).before(target);
                placeFound = true;
            }
        }
    });
    if (!placeFound)
        $.RoadsBuilder.paramListDiv.append(target);
        
    target.click(function () {
        $.RoadsBuilder.editParameter(this);
    });
    $.RoadsBuilder.updateParameterDiv(target);
}

$.RoadsBuilder.processREXLObject = function (rexlObj, chCount, oldName, newName) {
    if (rexlObj.type === "IDENTIFIER") {
        if (rexlObj.value === oldName) {
            rexlObj.value = newName;
            ++chCount;
        }
    }

    if (rexlObj.args && rexlObj.args.length) {
    
        if (rexlObj.type === "OPERATION" &&
            rexlObj.value === "." && rexlObj.args.length > 0) {

            chCount += $.RoadsBuilder.processREXLObject(rexlObj.args[0],
                                                        chCount,
                                                        oldName,
                                                        newName);

        } else {

            for (var idx in rexlObj.args) {
                chCount += $.RoadsBuilder.processREXLObject(rexlObj.args[idx],
                                                            chCount,
                                                            oldName,
                                                            newName);
            }
        }
    }

    return chCount;
}

$.RoadsBuilder.renameREXLIdentifierIfExist = 
        function (obj, condName, oldName, newName) {

    var chCounter = 0;

    if (obj[condName] && obj.cache && obj.cache[condName]) {
        if (chCounter = $.RoadsBuilder.processREXLObject(obj.cache[condName], 
                                                         0, 
                                                         oldName, 
                                                         newName)) {

            obj[condName] = obj.cache[condName].toString();
            console.log('updated:', obj[condName]);
        }
    }
    return chCounter;
}

$.RoadsBuilder.renameREXLIdentifiers = function (oldName, newName) {
    var qIndex = $.RoadsBuilder.context.getIndexByType('question');
    for (var pos in qIndex) {
        $.RoadsBuilder.renameREXLIdentifierIfExist(qIndex[pos], 
                                                   'disableIf',
                                                   oldName,
                                                   newName);
        $.RoadsBuilder.renameREXLIdentifierIfExist(qIndex[pos],
                                                   'constraints', 
                                                   oldName, 
                                                   newName);
    }

    $('.rb_question_editor', questionListDiv).each(function () {
        var editor = $(this);

        if ($.RoadsBuilder.renameREXLIdentifierIfExist(this, 
                                                       'disableIf',
                                                       oldName,
                                                       newName)) {

            $.RoadsBuilder.updateDisableLogicDescription(editor);
        }

        if ($.RoadsBuilder.renameREXLIdentifierIfExist(this, 
                                                       'constraints',
                                                       oldName,
                                                       newName)) {

            $.RoadsBuilder.updateConstraintsDescription(editor);
        }
    });

    var pIndex = $.RoadsBuilder.context.getIndexByType('page');
    for (var pos in pIndex) {
        $.RoadsBuilder.renameREXLIdentifierIfExist(pIndex[pos],
                                                   'skipIf',
                                                   oldName,
                                                   newName);
    }

    var pIndex = $.RoadsBuilder.context.getIndexByType('group');
    for (var pos in pIndex) {
        $.RoadsBuilder.renameREXLIdentifierIfExist(pIndex[pos],
                                                   'skipIf',
                                                   oldName,
                                                   newName);
    }
}

$.RoadsBuilder.editParameter = function(link) {
    var jLink = $(link);
    var paramDiv = jLink.hasClass('rb_parameter') ? 
                        jLink:
                        jLink.parents('.rb_parameter:first');
    var data = paramDiv.data('data');
    $.RoadsBuilder.editParamDialog.open({
        paramName: data.name,
        paramType: data.type,
        callback: function (newValue, newType) {
            var oldName = data.name;
            data.name = newValue;
            data.type = newType;

            if (oldName !== newValue)
                $.RoadsBuilder.renameREXLIdentifiers(oldName, newValue);
            
            $.RoadsBuilder.updateParameterDiv(paramDiv);
        }
    });
}

$.RoadsBuilder.addParameter = function(data) {
    if (!data) {
        $.RoadsBuilder.editParamDialog.open({
            callback: function (newValue, newType) {
                var newParameter = $.RoadsBuilder.context.createNewParameter();
                newParameter.name = newValue;
                newParameter.type = newType;
                $.RoadsBuilder.addParameterReal(newParameter);
            }
        });
    } else {
        $.RoadsBuilder.addParameterReal(data);
        $.RoadsBuilder.context.putToIndex('parameter', data);
    }
}

$.RoadsBuilder.addNewPage = function(btn) {
    var pageDiv = btn ? $(btn).parents('.rb_page:first') : null;
    var newPageData = $.RoadsBuilder.context.createNewPage();
    var target = $.RoadsBuilder.addPage(newPageData);

    if (pageDiv)
        pageDiv.after(target);
    else
        $.RoadsBuilder.pageListDiv.append(target);

    var pagesScollable = $('.rb_pages_scrollable');
    var doEffect = function () {
        target.effect("highlight", { color: '#bdecd0' }, 2000);
    };

    if ($.RoadsBuilder.isScrolledIntoView(target, pagesScollable))
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

$.RoadsBuilder.truncateText = function(text, len) {
    if (text.length > len)
        return text.slice(0, len - 3) + "...";
    return text;
}

$.RoadsBuilder.getPageSummary = function(data, targetDiv) {
    if (data.title)
        targetDiv.html('<strong>' 
                        + $.RoadsBuilder.escapeHTML(data.title)
                        + '</strong>');
    else if (data.questions.length > 0) {
        var ret = '<strong>'
                + $.RoadsBuilder.escapeHTML(
                      $.RoadsBuilder.truncateText(data.questions[0].title, 40)
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

$.RoadsBuilder.updatePageDiv = function (pageDiv) {
    var data = pageDiv.data('data');
    
    var pageTitle = $('.rb_div_page_title:first', pageDiv);
    $.RoadsBuilder.getPageSummary(data, pageTitle);
}

$.RoadsBuilder.makeREXLCache = function (obj, condName) {
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

$.RoadsBuilder.addPage = function(page, to) {

    if (page.type === 'group') {
        var newGroup = $.RoadsBuilder.createGroup('pageGroup');
        if (to) {
            to.append(newGroup);
            $.RoadsBuilder.setPageListSortable(
                newGroup.find('.rb_class_pages_list')
            );
        }

        $.RoadsBuilder.makeREXLCache(page, 'skipIf');

        newGroup.data('data', page);
        $.RoadsBuilder.updateGroupDiv(newGroup);
        for (var idx in page.pages) {
            var item = page.pages[idx];
            $.RoadsBuilder.context.putToIndex(item.type, item);
            $.RoadsBuilder.addPage(
                item, newGroup.children('.rb_class_pages_list')
            );
        }

        return newGroup;
    }

    // this is a page
    var newPageDiv = $.RoadsBuilder.templates.createObject('page');

    if (to)
        to.append(newPageDiv);

    $.RoadsBuilder.makeREXLCache(page, 'skipIf');
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

        $.RoadsBuilder.makeREXLCache(qData, 'disableIf');
        $.RoadsBuilder.makeREXLCache(qData, 'constraints');

        $.RoadsBuilder.context.putToIndex('question', qData);
        if (qData.repeatingGroup && qData.type === "rep_group") {
            for (var sIdx in qData.repeatingGroup) {
                var subQuestion = qData.repeatingGroup[sIdx];
                fixQuestionData(subQuestion);

                subQuestion.slave = true;

                $.RoadsBuilder.makeREXLCache(subQuestion, 'disableIf');
                $.RoadsBuilder.makeREXLCache(subQuestion, 'constraints');

                $.RoadsBuilder.context.putToIndex('question', subQuestion);
            }
        } else if ($.RoadsBuilder.isListType(qData.type)) {
            $.RoadsBuilder.updatePredefinedChoices(qData.answers);
        }
    }

    if (!page.cId)
        page.cId = $.RoadsBuilder.getCId('page');

    $.RoadsBuilder.updatePageDiv(newPageDiv);

    newPageDiv.click(function (event) {
        if (event.shiftKey) {
            document.getSelection().removeAllRanges();
            if ($.RoadsBuilder.currentPage) {
                $.RoadsBuilder.currentSelection = [];
                var fromPage = $.RoadsBuilder.currentPage;
                var toPage = $(this);
                var selectIt = false;
                $.RoadsBuilder.pageListDiv.find('.rb_page').each(function () {
                    var jThis = $(this);
                    if (jThis[0] === fromPage[0] ||
                        jThis[0] === toPage[0]) {

                        selectIt = !selectIt;
                        jThis.addClass('rb_covered');
                        $.RoadsBuilder.currentSelection.push(jThis);
                    } else if (selectIt) {
                        jThis.addClass('rb_covered');
                        $.RoadsBuilder.currentSelection.push(jThis);
                    } else {
                        jThis.removeClass('rb_covered');
                    }
                });
            }
        } else {
            $.RoadsBuilder.pageListDiv.find('.rb_covered').removeClass('rb_covered');
            $.RoadsBuilder.currentSelection = [ $(this) ];
            $.RoadsBuilder.selectPage(this);
        }

        if ($.RoadsBuilder.currentSelection && $.RoadsBuilder.currentSelection.length) {
            $('#make_group_btn').removeAttr('disabled');
        } else {
            $('#make_group_btn').attr('disabled','disabled');
        }

        event.preventDefault();
    });
    
    return newPageDiv;
}

$.RoadsBuilder.evaluateMeta = function(meta) {
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
            page.cId = $.RoadsBuilder.getCId('page');

        $.RoadsBuilder.context.putToIndex(page.type, page);
        $.RoadsBuilder.addPage(page, $.RoadsBuilder.pageListDiv);
    }

    for (var idx in rel.params) {
        var param = rel.params[idx];
        $.RoadsBuilder.addParameter(param);
    }

    $.RoadsBuilder.setFormTitle( meta.title );
    $.RoadsBuilder.context.dumpIndexes();
}

$.RoadsBuilder.updateConstraintsDescription = function(questionEditor) {
    var targetSpan = questionEditor.find('.rb_constraint_descr');
    var constraints = questionEditor[0].constraints;

    if (constraints && !(constraints instanceof Object)) {
        targetSpan.removeClass('constraints_not_set')
                  .html('Valid if: ' + $.RoadsBuilder.escapeHTML(
                            $.RoadsBuilder.truncateText(constraints, 30)));
    } else {
        targetSpan.addClass('constraints_not_set')
                  .html('No constraints');
    }
};

/* TODO: rewrite this and saveQuestion functions to not repeat code */

$.RoadsBuilder.collectQuestionData = function (editor) {

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

        if ($.RoadsBuilder.isListType(qQuestionType)) {
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
                                $.RoadsBuilder.nameRegExp.test(answerCode) ||

                        $.RoadsBuilder.nameBeginRegExp.test(answerCode) ||
                        $.RoadsBuilder.nameEndRegExp.test(answerCode)) {
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

$.RoadsBuilder.changeConstraints = function(btn) {
    var jButton = $(btn);
    var questionEditor = jButton.parents('.rb_question_editor:first');

    $.RoadsBuilder.constraintsThisQuestion =
        $.RoadsBuilder.collectQuestionData(questionEditor);

    if ($.RoadsBuilder.constraintsThisQuestion) {
        $.RoadsBuilder.conditionsEditor.open({
            title: 'Edit Constraints',
            callback: function (newValue) {
                questionEditor[0].constraints = newValue;
                $.RoadsBuilder.makeREXLCache(questionEditor[0], 'constraints');
                $.RoadsBuilder.updateConstraintsDescription(questionEditor);
            },
            defaultIdentifier: 'this',
            onClose: function (newValue) {
                $.RoadsBuilder.constraintsThisQuestion = null;
            },
            conditions: questionEditor[0].constraints
        });
    } else {
        alert('Impossible: there are wrong values in the editor');
    }
}

$.RoadsBuilder.getAnswersString = function(questionData) {
    var titles = [];
    for (var idx in questionData['answers']) {
        var title = questionData['answers'][idx]['title'];

        if (!title)
            title = questionData['answers'][idx]['code']

        titles.push(title);
    }
    return titles.join(', ');
}

$.RoadsBuilder.getQuestionDescription = function(questionData) {
    var type = questionData.type;

    if ($.RoadsBuilder.isListType(type))
        return $.RoadsBuilder.getAnswersString(questionData);
    else
        return $.RoadsBuilder.QTypes[type];
}

$.RoadsBuilder.newInstrument = function() {
    $.RoadsBuilder.clearWorkspace();
    $.RoadsBuilder.instrumentName = null;
    $.RoadsBuilder.instrumentTitle = '';
    $.RoadsBuilder.context.clearIndexes();
}

$.RoadsBuilder.loadFromJSON = function() {
    var json = prompt('Please input schema json:');

    if (json) {
        $.RoadsBuilder.clearWorkspace();
        $.RoadsBuilder.evaluateMetaStr(json);
    }
}

$.RoadsBuilder.loadInstrumentSchema = function(instrumentName, schemaJSON) {
    //console.log('schemaJSON', schemaJSON);
    $.RoadsBuilder.newInstrument();
    $.RoadsBuilder.evaluateMetaStr(schemaJSON);
    $.RoadsBuilder.instrumentName = instrumentName;
}

$.RoadsBuilder.clearQuestions = function() {
    questionListDiv.contents().remove();
}

$.RoadsBuilder.stopEvent = function(event) {
    if (!event)
        event = window.event;
    event.stopPropagation();
}

$.RoadsBuilder.clearWorkspace = function() {
    $.RoadsBuilder.mainPartContent.css('display', 'none');
    $.RoadsBuilder.pageTitleSpan.text('');
    $.RoadsBuilder.pageListDiv.contents().remove();
    $.RoadsBuilder.paramListDiv.contents().remove();
    $.RoadsBuilder.clearQuestions();
}

$.RoadsBuilder.changeDisableLogic = function(btn) {
    var jButton = $(btn);
    var questionEditor = jButton.parents('.rb_question_editor:first');

    $.RoadsBuilder.conditionsEditor.open({
        title: 'Edit Disable-Logic Conditions',
        callback: function (newValue) {
            questionEditor[0].disableIf = newValue;
            $.RoadsBuilder.makeREXLCache(questionEditor[0], 'constraints');
            $.RoadsBuilder.updateDisableLogicDescription(questionEditor);
        },
        conditions: questionEditor[0].disableIf
    });
}

$.RoadsBuilder.showJSONDialog = null;
$.RoadsBuilder.openDialog = null;
$.RoadsBuilder.editPageDialog = null;
$.RoadsBuilder.editParamDialog = null;
$.RoadsBuilder.beforeTestDialog = null;
$.RoadsBuilder.conditionsEditor = null;
$.RoadsBuilder.questionDialog = null;
$.RoadsBuilder.progressDialog = null;
$.RoadsBuilder.pageListDiv = null;
$.RoadsBuilder.paramListDiv = null;
$.RoadsBuilder.context = null;
$.RoadsBuilder.templates = null;

$.RoadsBuilder.pageTitleSpan = null;
$.RoadsBuilder.pageTitleInput = null;
$.RoadsBuilder.pageSkipWhenSpan = null;
$.RoadsBuilder.mainPartContent = null;
$.RoadsBuilder.currentSelection = null;
$.RoadsBuilder.currentPositionIndex = null;

$.RoadsBuilder.currentPage = null;

$.RoadsBuilder.onPageTitleChanged = function () {
    var newTitle = $.RoadsBuilder.pageTitleInput.val();
    var data = $.RoadsBuilder.currentPage.data('data');
    data.title = newTitle;
    $.RoadsBuilder.updatePageDiv($.RoadsBuilder.currentPage);
    $.RoadsBuilder.updatePageTitleSpan(data);
    // $.RoadsBuilder.pageTitleSpan.text(newTitle);
    $.RoadsBuilder.pageTitleInput.css('display', 'none');
    $('.rb_page_title_wrap').css('display', '');
}

$.RoadsBuilder.setFormTitle = function (newTitle) {
    $.RoadsBuilder.instrumentTitle = newTitle;

    var titleHolder = $('#rb_instrument_title');
    if (newTitle) {
        titleHolder
            .removeClass('rb_instrument_title_not_set')
            .text($.RoadsBuilder.truncateText(newTitle, 30));
    } else {
        titleHolder
            .addClass('rb_instrument_title_not_set')
            .text('Untitled form')
    }
}

$.RoadsBuilder.onInstrumentTitleChanged = function() {
    var newTitle = $.trim($.RoadsBuilder.instrumentTitleInput.val());
    $.RoadsBuilder.setFormTitle(newTitle);
    $.RoadsBuilder.instrumentTitleInput.css('display', 'none');
    $('#rb_instrument_title_view').css('display', '');
}

$.RoadsBuilder.editGroupSkipConditions = function(a) {
    var groupDiv = $(a).parents('.rb_page_group:first');
    var data = groupDiv.data('data');
    $.RoadsBuilder.conditionsEditor.open({
        title: 'Edit Skip-Logic Conditions',
        callback: function (newValue) {
            data.skipIf = newValue;
            $.RoadsBuilder.makeREXLCache(data, 'skipIf');
            $.RoadsBuilder.updateGroupSkipSpan(groupDiv);
        },
        conditions: data.skipIf
    });
}

$.RoadsBuilder.editPageSkipConditions = function() {
    var data = $.RoadsBuilder.currentPage.data('data');
    $.RoadsBuilder.conditionsEditor.open({
        title: 'Edit Skip-Logic Conditions',
        callback: function (newValue) {
            var data = $.RoadsBuilder.currentPage.data('data');
            data.skipIf = newValue;
            $.RoadsBuilder.makeREXLCache(data, 'skipIf');
            $.RoadsBuilder.updatePageWhenSpan(data);
        },
        conditions: data.skipIf
    });
}

$.RoadsBuilder.editInstrumentTitle = function() {
    $('#rb_instrument_title_view').css('display', 'none');
    $.RoadsBuilder.instrumentTitleInput.val(
        $.RoadsBuilder.instrumentTitle
    );
    $.RoadsBuilder.instrumentTitleInput.css('display', '');
    $.RoadsBuilder.instrumentTitleInput.focus();
}

$.RoadsBuilder.editPageTitle = function() {
    $('.rb_page_title_wrap').css('display', 'none');

    var title = $.RoadsBuilder.currentPage.data('data').title;

    $.RoadsBuilder.pageTitleInput.val(title);
    $.RoadsBuilder.pageTitleInput.css('display', '');
    $.RoadsBuilder.pageTitleInput.focus();
}

$.RoadsBuilder.toType = function (obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

$(document).ready(function () {

    if ($.RoadsBuilder.externalParamTypes) {
        if ($.RoadsBuilder.toType($.RoadsBuilder.externalParamTypes) === "string")
            $.RoadsBuilder.externalParamTypes = 
                $.parseJSON($.RoadsBuilder.externalParamTypes);
        console.log('external parameter types:', $.RoadsBuilder.externalParamTypes);
    }

    $.RoadsBuilder.paramListDiv = $('.rb_params_list');
    $.RoadsBuilder.pageListDiv = $('.rb_pages_list');
    questionListDiv = $('.rb_question_list');
    $.RoadsBuilder.pageTitleSpan = $('.rb_page_title');
    $.RoadsBuilder.pageSkipWhenSpan = $('#page_skip_when');
    $.RoadsBuilder.pageTitleInput = $('.rb_page_title_input');
    $.RoadsBuilder.mainPartContent = $('.rb_main_part_content');
    $.RoadsBuilder.instrumentTitleInput = $('#rb_instrument_title_input');

    $.RoadsBuilder.pageTitleSpan.click(function () {
        $.RoadsBuilder.editPageTitle();
    });

    $.RoadsBuilder.pageTitleInput.change($.RoadsBuilder.onPageTitleChanged);
    $.RoadsBuilder.pageTitleInput.focusout($.RoadsBuilder.onPageTitleChanged);

    $.RoadsBuilder.instrumentTitleInput.change($.RoadsBuilder.onInstrumentTitleChanged);
    $.RoadsBuilder.instrumentTitleInput.focusout($.RoadsBuilder.onInstrumentTitleChanged);

    $('#rb_instrument_title_view').children().click(
        function () {
            $.RoadsBuilder.editInstrumentTitle();
        }
    );

    $.RoadsBuilder.pageTitleInput.keypress(function (e) {
        if (e.keyCode == 13)
            $.RoadsBuilder.onPageTitleChanged(e);
    });

    $.RoadsBuilder.setPageListSortable($.RoadsBuilder.pageListDiv);

    // $.RoadsBuilder.pageListDiv.on('mousedown', drawRectangleOnMouseDown);

    $.RoadsBuilder.pageListDiv.data('normalOffset', $.RoadsBuilder.pageListDiv.offset());
    $.RoadsBuilder.setQuestionsSortable(questionListDiv);

    function createObject(classFunc) {
        return new (classFunc())();
    }

    $.RoadsBuilder.context = createObject($.RoadsBuilder.ContextF);
    $.RoadsBuilder.templates = createObject($.RoadsBuilder.TemplatesF);
    $.RoadsBuilder.openDialog = createObject($.RoadsBuilder.OpenDialogF);
    $.RoadsBuilder.showJSONDialog = createObject($.RoadsBuilder.ShowJSONDialogF);
    $.RoadsBuilder.editPageDialog = createObject($.RoadsBuilder.EditPageDialogF);
    $.RoadsBuilder.editParamDialog = createObject($.RoadsBuilder.EditParamDialogF);
    $.RoadsBuilder.beforeTestDialog = new $.RoadsBuilder.BeforeTestDialog();
    $.RoadsBuilder.questionDialog = createObject($.RoadsBuilder.QuestionDialogF);

    $.RoadsBuilder.constraintsThisQuestion = null;

    $.RoadsBuilder.conditionsEditor = new ConditionEditor({
        urlPrefix: $.RoadsBuilder.basePrefix,
        manualEdit: $.RoadsBuilder.manualEditConditions,
        identifierTitle: 'Question or parameter',
        onDescribeId: function (identifier) {

            var ret = null;
            var questionData = null;

            if (identifier === "this") {
                if ($.RoadsBuilder.constraintsThisQuestion)
                    questionData = $.RoadsBuilder.constraintsThisQuestion;
            } else
                questionData = $.RoadsBuilder.context.findQuestionData(identifier);

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
                var paramData = $.RoadsBuilder.context.findParamData(identifier);
                if (paramData) {
                    ret = {};

                    switch(paramData.type) {
                    case 'NUMBER':
                        ret.type = 'number';
                        break;
                    case 'STRING':
                    default:
                        if ($.RoadsBuilder.externalParamTypes) {
                            var typeDesc = 
                                $.RoadsBuilder.externalParamTypes[paramData.type];

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

            if ($.RoadsBuilder.constraintsThisQuestion) {
                var item = $.RoadsBuilder.constraintsThisQuestion;
                if ("this".indexOf(term) != -1) {
                    ret.push({
                        "title": item.title ?
                            $.RoadsBuilder.truncateText(item.title, 80) : '',
                        "value": "this"
                    });
                }
            }

            var qIndex = $.RoadsBuilder.context.getIndexByType('question');
            for (var pos in qIndex) {
                var item = qIndex[pos];
                
                if (!item.slave && item.name) {
                    if (item.name.search(matcher) !== -1 ||
                        (item.title &&
                            item.title.search(matcher) !== -1)) {

                        ret.push({
                            "title": item.title ?
                                $.RoadsBuilder.truncateText(item.title, 80) : '',
                            "value": item.name
                        });
                    }
                }
            }

            var pIndex = $.RoadsBuilder.context.getIndexByType('parameter');

            for (var pos in pIndex) {
                var item = pIndex[pos];

                if (item.name.search(matcher) !== -1) {
                    ret.push({
                        "title": 'parameter ('
                                + $.RoadsBuilder.getParamTitle(item.type)
                                + ')',
                        "value": item.name
                    });
                }
            }

            console.log('onSearchId', ret);
            return ret;
        }
    });

    // createObject($.RoadsBuilder.ConditionsEditorF);

    $.RoadsBuilder.progressDialog = $('.rb_progress_dialog').dialog({
        dialogClass: 'progress-dialog',
        modal: true,
        autoOpen: false,
        width: 350,
        open: function () { },
        close: function () { }, 
    });

    $.RoadsBuilder.updatePredefinedChoices([
        {
            code: 'yes',
            title: 'Yes'
        },
        {
            code: 'no',
            title: 'No'
        }
    ]);

    if ($.RoadsBuilder.instrumentName)
        $.RoadsBuilder.loadInstrument($.RoadsBuilder.instrumentName);
});

$.RoadsBuilder.buildPositionIndex = function(deltaY) {
    var pages = $.RoadsBuilder.pageListDiv.find('.rb_page');
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

$.RoadsBuilder.getItemLevel = function(pageDiv, objType) {
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

$.RoadsBuilder.checkIfEdge = function(element, fromLeft, objType) {
    var selector = (objType === 'page') ?
                        '.rb_page,.rb_page_group':
                        '.rb_condition_item,.rb_condition_group';

    return (fromLeft && element.prev(selector).size() === 0) ||
            (!fromLeft && element.next(selector).size() === 0);
}

$.RoadsBuilder.getLowestAllowedLevel = function(element, level, fromLeft, objType) {

    var cls = (objType === 'page') ?
                    'rb_page_group' : 'rb_condition_group';

    while (element.size() && level) {
        if ($.RoadsBuilder.checkIfEdge(element, fromLeft, objType)) {
            --level;
            element = element.parent('.' + cls + ':first');
        } else
            break;
    }
    return level;
}

$.RoadsBuilder.getCutoff = function(page, objType) {
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

$.RoadsBuilder.interceptCutoff = function(cutoff1, cutoff2) {
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

$.RoadsBuilder.removeParameter = function(btn) {
    var paramDiv = $(btn).parents('.rb_parameter:first');
    var paramData = paramDiv.data('data');
    $.RoadsBuilder.context.removeFromIndex('parameter', paramData);
    paramDiv.remove();
}

$.RoadsBuilder.removePage = function(btn) {
    var pageDiv = $(btn).parents('.rb_page:first');
    var pageData = pageDiv.data('data');
    for (var idx in pageData.questions) {
        $.RoadsBuilder.context.removeFromIndex('question', pageData.questions[idx]);
    }
    $.RoadsBuilder.context.removeFromIndex('page', pageData);
    pageDiv.remove();
}

$.RoadsBuilder.removeGroup = function(link) {
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
    $.RoadsBuilder.questionDialog.open({
        text: title,
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

$.RoadsBuilder.editPage = function(link) {
    var pageDiv = $(link).parents('.rb_page:first');
    $.RoadsBuilder.editPageDialog.open({
        mode: 'page',
        target: pageDiv
    });
}

$.RoadsBuilder.editGroup = function(link) {
    var groupDiv = $(link).parents('.rb_page_group:first');
    $.RoadsBuilder.editPageDialog.open({
        mode: 'group',
        target: groupDiv
    });
}

$.RoadsBuilder.makePageGroupFromSelection = function() {
    $.RoadsBuilder.editPageDialog.open({
        mode: 'group'
    });
}

$.RoadsBuilder.updateGroupDiv = function(groupDiv) {
    var groupData = groupDiv.data('data');
    var groupNameDiv = groupDiv.find('.rb_page_group_name:first');
    
    if (groupData.title) {
        groupNameDiv
            .removeClass('rb_group_title_not_set')
            .text($.RoadsBuilder.truncateText(groupData.title, 30));
        if (groupData.title.length >= 30)
            groupNameDiv.attr('title', groupData.title);
    } else
        groupNameDiv
            .addClass('rb_group_title_not_set')
            .removeAttr('title')
            .text('Untitled group')
    

    $.RoadsBuilder.updateGroupSkipSpan(groupDiv);
}

$.RoadsBuilder.createGroup = function(groupType) {
    var pageGroup = $.RoadsBuilder.templates.createObject(groupType);
    return pageGroup;
}

$.RoadsBuilder.processSelectedPages = function(newGroupName) {
    var firstPage = $.RoadsBuilder.currentSelection[0];
    var lastPage = 
        $.RoadsBuilder.currentSelection[$.RoadsBuilder.currentSelection.length - 1];
    var pushToGroup = [];

    if (firstPage === lastPage) {
        pushToGroup.push(firstPage);
    } else {
        var firstLevel = $.RoadsBuilder.getItemLevel(firstPage, 'page');
        var secondLevel = $.RoadsBuilder.getItemLevel(lastPage, 'page');

        var firstLowestAllowedLevel =
                $.RoadsBuilder.getLowestAllowedLevel(firstPage, firstLevel, true);

        var lastLowestAllowedLevel =
                $.RoadsBuilder.getLowestAllowedLevel(lastPage, secondLevel, false);

        var lowestAllowedLevel =
                (firstLowestAllowedLevel < lastLowestAllowedLevel) ?
                                    lastLowestAllowedLevel:
                                    firstLowestAllowedLevel;

        if (lowestAllowedLevel > firstLevel ||
            lowestAllowedLevel > secondLevel)
            return;

        var firstCutoff = $.RoadsBuilder.getCutoff(firstPage, 'page');
        var lastCutoff = null;
        var cutoff = firstCutoff;
        var total = $.RoadsBuilder.currentSelection.length;

        for (var idx = 1; idx < total; idx++) {
            var currentCutoff = 
                $.RoadsBuilder.getCutoff($.RoadsBuilder.currentSelection[idx], 
                                        'page');
            cutoff = $.RoadsBuilder.interceptCutoff(cutoff, currentCutoff);
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
        var pageGroup = $.RoadsBuilder.createGroup('pageGroup');
        var pageSublistDiv = pageGroup.find('.rb_class_pages_list:first');

        var newGroupData = $.RoadsBuilder.context.createNewGroup();
        pushToGroup[0].before(pageGroup);
        newGroupData.title = newGroupName;
        pageGroup.data('data', newGroupData);

        for (var idx in pushToGroup) {
            pageSublistDiv.append(pushToGroup[idx]);
        }
        $.RoadsBuilder.setPageListSortable(pageSublistDiv);
        $.RoadsBuilder.updateGroupDiv(pageGroup);
    }
}

$.RoadsBuilder.showProgress = function(params) {
    $.RoadsBuilder.progressDialog.startParams = params;
    $.RoadsBuilder.progressDialog.dialog('option', 'buttons', params['buttons']);
    $('.rb_progress_text', $.RoadsBuilder.progressDialog).html(params['title']);
    $.RoadsBuilder.startPollingTimeout();
    $.RoadsBuilder.progressDialog.dialog("open");
}

$.RoadsBuilder.closeProgress = function() {
    $.RoadsBuilder.stopPollingTimeout();
    $.RoadsBuilder.progressDialog.startParams = null;
    $.RoadsBuilder.progressDialog.dialog("close");
}

$.RoadsBuilder.stopPollingTimeout = function() {
    if ($.RoadsBuilder.progressDialog.pollTimeout !== null) {
        clearTimeout($.RoadsBuilder.progressDialog.pollTimeout)
        $.RoadsBuilder.progressDialog.pollTimeout = null;
    }
}

$.RoadsBuilder.startPollingTimeout = function() {
    $.RoadsBuilder.progressDialog.pollTimeout =
        setTimeout("$.RoadsBuilder.progressDialogPolling()", 1000);
}

$.RoadsBuilder.progressDialogPolling = function() {
    var params = $.RoadsBuilder.progressDialog.startParams;
    params['pollCallback']();
}

$.RoadsBuilder.showInstrumentJSON = function() {
    
}

$.RoadsBuilder.testInstrument = function() {

    var params = $.RoadsBuilder.context.getIndexByType('parameter');
    var toBeContinued = function (paramDict) {
        $.RoadsBuilder.closeOpenedEditor(function () {
            $.RoadsBuilder.showProgress({
                title: '<center>Preparing the form for a test...</center>',
                pollCallback: function () { }
            });

            $.RoadsBuilder.savedParamValues = paramDict;
            $.RoadsBuilder.saveInstrumentReal($.RoadsBuilder.testInstrumentStage4);
        }, questionListDiv);
    }

    if (params.length) {
        $.RoadsBuilder.beforeTestDialog.open({
            paramValues: $.RoadsBuilder.savedParamValues || {},
            callback: toBeContinued
        });
    } else
        toBeContinued({});
}

$.RoadsBuilder.testInstrumentStage2 = function() {
    $.ajax({url : $.RoadsBuilder.basePrefix 
                    + "/construct_instrument?code=" 
                    + $.RoadsBuilder.instrumentName 
                    + '&schema=demo',
        success : function(content) {
            console.log('construct successful:', content);
            $.RoadsBuilder.testInstrumentStage4();
        },
        error: function() {
            $.RoadsBuilder.closeProgress();
            alert('Error of construct_instrument!');
        },
        type: 'GET'
    });
}

$.RoadsBuilder.testInstrumentStage4 = function() {
    $.RoadsBuilder.closeProgress();
    var paramStr = '';
    if ($.RoadsBuilder.savedParamValues) {
        for (var paramName in $.RoadsBuilder.savedParamValues) {
            paramValue = $.RoadsBuilder.savedParamValues[paramName];
            paramStr += '&' + 'p_' + encodeURIComponent(paramName) + '=' 
                        + (paramValue ? encodeURIComponent(paramValue) : '');
        }
    }
    var url = $.RoadsBuilder.urlStartTest || 
            ($.RoadsBuilder.formsPrefix + '/start_roads');

    var query = 'test=1&'
              + 'instrument=' + encodeURIComponent($.RoadsBuilder.instrumentName)
              + paramStr;

    window.open(url + '?' + query, '_blank');
}

