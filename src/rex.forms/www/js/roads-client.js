
function ROADS(o) {

    function findQuestion(page, questionName) {
        for (var idx in page.questions) {
            var question = page.questions[idx];
            if (question.name === questionName)
                return question;
        }
        return null;
    }

    function checkConstraints(questionData, val) {
        // console.log('checkConstraints: questionData=', questionData, 'val=', val);
        return true;
    }

    function clearScreen() {
        questions.contents().remove();
        screen.attr('class', initialScreenClasses);
    }

    var templates = {
        'progressBar':
            '<div class="survey-progress-bar-fill-wrap"><div class="rc-progress-bar-fill"></div></div><span class="rc-progress-bar-pct">30%</span>',
        'btnNext': '<button>Next Page</button>',
        'btnBack': '<button>Previous Page</button>',
        'btnFinish': '<button>Finish</button>',
        'btnAddRepGroup': '<button class="roads-add-rep-group">Add group of answers</button>',
        'btnClear': '<button class="btn-clear-answers">Clear</button>',
        'question':
            '<div class="question-item"><div><span class="rc-question-title" data-part="title"></span></div><span data-part="answers"></span></div>'
    };

    function getTemplate(type) {

        if (param.templates && 
            param.templates[type]) {

            return param.templates[type];
        }

        return templates[type];
    }

    var yesNoAnswers = [
        {
            code: 'yes',
            title: 'Yes'
        },
        {
            code: 'no',
            title: 'No'
        }
    ];

    function findSavedAnswer(question, answerCode, groupNum) {
        var questionName = question.parent ? question.parent.name : question.name;
        var savedAnswers = param.state.answers;

        console.log('findSavedAnswer', savedAnswers);

        if (savedAnswers &&
            savedAnswers[questionName] !== null &&
            savedAnswers[questionName] !== undefined) {

            var answers = null;

            if (question.parent && 
                groupNum !== null && 
                groupNum !== undefined) {

                if (groupNum >= 0) {
                    if (savedAnswers[questionName][groupNum]) {
                        savedAnswers = savedAnswers[questionName][groupNum];

                        if (savedAnswers[question.name] !== null &&
                            savedAnswers[question.name] !== undefined) {

                            answers = savedAnswers[question.name];
                        }
                    }
                }
            } else
                answers = savedAnswers[questionName];

            if (answers) {
                console.log('answers:', answers);
                if (answerCode) {
                    if (question.questionType === "radio" &&
                        answerCode === answers)
                        return answerCode;
                    else if (answers instanceof Object &&
                        answers[answerCode]) {
                        return answerCode;
                    }
                } else
                    return answers;
            }
        }
        return null;
    }

    function saveState(callback) {
      if (param.package) {
        var url = param.prefix + "/save_state";
        param.state['package'] = param.package;
        param.state['instrument'] = param.instrument_id;
        stateJSON = $.toJSON(param.state);

        console.log('saving state:', stateJSON);

        $.ajax({url : url,
              success : function(content) {
                  /* alert('state saved!'); */
                  if (callback)
                      callback()
              },
              data : 'data=' + stateJSON,
              type: 'POST'
        });
      }
      else
        if (callback)
          callback();
    }

    function getRandomStr(len) {
        var text = "";
        var possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for(var i = 0; i < len; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    function addGroupOfQuestions(groups, questionData, groupNum) {
        var group = $('<div class="rc-roads-rep-group"></div>');
        group.appendTo(groups);
        
        for (var idx in questionData.repeatingGroup) {
            var subQuestion = questionData.repeatingGroup[idx];
            var newItem = $(getTemplate('question'));
            newItem.attr('data-subquestion', '1');
            group.append(newItem);
            processQuestionItem(newItem, subQuestion, groupNum);
        }
        // group.append('<button>Remove group of answers</button>');
    }

    function renderAnswers(question, appendTo, groupNum) {
        var container = $(document.createElement('div'));
        var savedAnswers = param.state.answers;

        appendTo.append(container);
        var justOpened = true;

        switch(question.questionType) {
        case 'rep_group':
            container.append('<div class="rc-roads-rep-groups"></div>'
                + getTemplate('btnAddRepGroup'));

            var savedGroups = findSavedAnswer(question, null, groupNum);
            if (savedGroups && savedGroups.length) {
                var groups = container.find('.rc-roads-rep-groups');
                for (var idx = 0; idx < savedGroups.length; idx++) {
                    addGroupOfQuestions(groups, question, idx);
                }
            }

            var btn = container.find('.roads-add-rep-group');
            btn.click(function () {
                var jThis = $(this);
                var groups = jThis.siblings('.rc-roads-rep-groups');
                var qItem = jThis.parents('.question-item:first');
                var qName = qItem.attr('data-question');
                var questionData = findQuestion(currentPage, qName);

                addGroupOfQuestions(groups, questionData, -1);

                console.log('questionData', questionData);
            });
            break;
        case 'integer':
        case 'float':
            var val = '';
            var savedAnswer = findSavedAnswer(question, null, groupNum);
            
            console.log('findSavedAnswer(', question,',', null,',', groupNum, ')=', savedAnswer);
            
            if (savedAnswer !== null) {
                val += savedAnswer;
                justOpened = false;
            }
            container.append('<div class="answer-item">'
                + '<input type="text" class="rc-answer-variant" data-question="'
                + question.name + '" value="' + val + '"></div>');
            break;
        case 'radio':
        case 'list':
        case 'yes_no':
            var inputType =
                (question.questionType === 'radio' ||
                 question.questionType === 'yes_no') ?
                    'radio':
                    'checkbox';

            var inputName =
                (question.questionType === 'radio' || 
                 question.questionType === 'yes_no') ? 
                    'name="' + question.name + '_' + getRandomStr(10) +  '"': 
                    '';

            var answers = 
                (question.questionType === 'yes_no') ? 
                    yesNoAnswers : 
                    question.answers;

            container.append('<ul class="rc-answer-variants"></ul>');
            var ul = container.children('ul');

            for (var idx in answers) {
                var answer = answers[idx];
                // console.log('processing answer:', answer);

                ul.append('<li class="answer-item"></li>');
                var li = ul.children('li:last');
                var id = getRandomStr(10);

                var savedAnswer = findSavedAnswer(question, answer.code, groupNum);
                console.log('[*] findSavedAnswers(', question, ',', answer.code, ',', groupNum, ')=', savedAnswer);
                
                if (savedAnswer !== null) {
                    checked = 'checked="checked"';
                    justOpened = false;
                } else
                    checked = '';
                
                var label = $('<label for="' + id + '"></label>');

                label.append(renderCreole(answer.title || answer.code));

                li.append('<input class="rc-answer-variant" type="'
                            + inputType +'" id="' + id + '" data-question="'
                            + question.name + '" data-answer="'
                            + answer.code + '" ' + inputName + ' ' + checked + '>');
                li.append(label);
            }

            if (question.questionType === 'radio' || 
                question.questionType === 'yes_no') {
                ul.append('<li>' + getTemplate('btnClear') + '</li>');
            }

            break;
        case 'string':
            var ansItem = $('<div class="answer-item">'
                    + '<textarea class="rc-answer-variant" data-question="'
                    + question.name + '"></textarea></div>');
            var savedAnswer = findSavedAnswer(question, null, groupNum);
            if (savedAnswer !== null) {
                custOpened = false;
                ansItem.find('textarea.rc-answer-variant').val(savedAnswer);
            }

            container.append(ansItem);
            break;
        }

        if (justOpened)
            logPassing(question.name, 'OPENED');

        return container;
    }

    function renderCreole(srcText) {
        var tempDiv = $(document.createElement('div'));
        creoleParser.parse(tempDiv[0], srcText);
        var children = tempDiv.children();

        if (children.size() == 1 && children[0].tagName === 'P')
            return children.contents();

        return children;
    }

    function onAnswerSet() {
        var questionItem = $(this).parents('.question-item:first');
        
        if (questionItem.attr('data-subquestion') === "1")
            questionItem = questionItem.parents('.question-item:first');

        collectAnswersFromQuestion(questionItem);
        checkDisabledQuestions();
    }

    function processQuestionPart(span, part, question, groupNum) {
        switch(part) {
        case 'title':
            span.append(renderCreole(question.title));
            break;
        case 'answers':
            renderAnswers(question, span, groupNum);
            if (question.questionType !== "rep_group") {
                span.find('.btn-clear-answers').click(function () {
                    console.log('clearing answers:', this);
                    var questionDiv = $(this).parents('.question-item:first');
                    questionDiv.find('input.rc-answer-variant').removeAttr('checked');
                    collectAnswersFromQuestion(questionDiv);
                    checkDisabledQuestions();
                });
                span.find('input,textarea')
                    .change(onAnswerSet)
                    .focusout(onAnswerSet);
            }
            break;
        }
    }

    function isValidNumeric(val, condType) {
        return (
            (condType === 'integer' 
                && /^[0-9]+$/.test(val)) ||
            (condType === 'float' 
                && /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/.test(val))
        );
    }
    
    function findAnswer(questionData, answer) {
        for (var idx in questionData.answers) {
            if (questionData.answers[idx].code === answer)
                return questionData.answers[idx];
        }
        return null;
    }
    
    function isValidAnswer(questionData, answer) {
        if (questionData.questionType === 'yes_no') {
            return (answer === 'yes' || answer === 'no');
        }
        return (findAnswer(questionData, answer) !== null);
    }

    function processQuestionAnswer(jQItem, retAnswers) {
        var questionName = jQItem.attr('data-question');
        var isSubquestion = (jQItem.attr('data-subquestion') === "1");
        var questionData;
        
        if (isSubquestion) {
            var parentQItem = jQItem.parents('.question-item:first');
            var parentQName = parentQItem.attr('data-question');
            var parentQuestionData = findQuestion(currentPage, parentQName);
            for (var idx in parentQuestionData.repeatingGroup) {
                var repGroupItem = parentQuestionData.repeatingGroup[idx];
                if (repGroupItem.name === questionName) {
                    questionData = repGroupItem;
                    break;
                }
            }

            if (!questionData) {
                // TODO: implement error handler for this situation
            }
        } else
            questionData = findQuestion(currentPage, questionName);

        var collectedAnswers;
        var questionValid = true;
        if (questionData.questionType === 'rep_group') {
            collectedAnswers = [];
            var idx = 0;
            
            jQItem.find('.rc-roads-rep-group').each(function () {
                var groupItem = $(this);
                var procAnswers = {};
                var groupValid = true;

                groupItem.find('.question-item').each(function () {
                    if (!processQuestionAnswer($(this), procAnswers)) {
                        console.log('rep group not valid!', this);
                        groupValid = false;
                        questionValid = false;
                    }
                });

                collectedAnswers[idx] = (groupValid) ? procAnswers : null;
                                
                ++idx;
            });
            
        } else {

            var answerItems = jQItem.find('.answer-item');

            answerItems.each(function () {
                var answerValid = true;
                var jItem = $(this);
                var answerVariant = jItem.find('.rc-answer-variant');

                switch(questionData.questionType) {
                case 'radio':
                    var checked = answerVariant.is(':checked');
                    
                    if (checked) {
                        var answerValue = answerVariant.attr('data-answer');
                        if (!isValidAnswer(questionData, answerValue))
                            answerValid = false;
                        else
                            collectedAnswers = answerValue;
                    }

                    break;
                case 'list':
                case 'yes_no':

                    if (collectedAnswers === undefined)
                        collectedAnswers = {};
                    var answerValue = answerVariant.attr('data-answer');
                    var checked = answerVariant.is(':checked');

                    if (!isValidAnswer(questionData, answerValue))
                        answerValid = false;
                    else {
                        collectedAnswers[answerValue] = checked;
                    }

                    // TODO: check if required

                    break;
                case 'integer':
                case 'float':
                case 'string':

                    var valStr = jQuery.trim(answerVariant.val());
                    var res = null;

                    // console.log('valStr = ', valStr, "|", answerVariant);

                    if (questionData.questionType === 'string') {
                        res = valStr;
                    } else {
                        if (valStr === '')
                            res = null;
                        else if (isValidNumeric(valStr, questionData.questionType)) {
                            var valNumeric =
                                    (questionData.questionType === 'integer') ?
                                        parseInt(valStr):
                                        parseFloat(valStr);

                            if (checkConstraints(questionData, valNumeric)) {
                                res = valNumeric;
                            } else
                                answerValid = false;
                        } else {
                            console.log('not valid numeric:', valStr);
                            answerValid = false;
                        }
                    }

                    if (answerValid && res !== null)
                        collectedAnswers = res;

                    // TODO: check if required

                    break;
                }

                if (answerValid)
                    jItem.removeClass('rc-error');
                else {
                    jItem.addClass('rc-error');
                    questionValid = false;
                }
            });

        }

        if (!questionValid) {
            jQItem.addClass('rc-question-error');
            return false;
        }

        if (questionData.questionType === 'radio' &&
            collectedAnswers === undefined) {
            collectedAnswers = null;
        }

        retAnswers[questionData.name] = collectedAnswers;
        // console.log('current retAnswers:', retAnswers);
        jQItem.removeClass('rc-question-error');

        return true;
    }

    function processAnswers(answers) {
        var qItem = questions.find('.question-item');
        var validated = true;

        qItem.each(function () {
            if (qItem.attr('data-subquestion') !== "1") { // only first-level
                                                          // questions
                var retAnswers = {};
                if (processQuestionAnswer($(this), retAnswers)) {
                    for (var key in retAnswers) {
                        answers[key] = retAnswers[key];
                    }
                } else
                    validated = false;
            }
        });

        return validated;
    }

    function processQuestionItem(qItem, question, groupNum) {
        var customClassName = 'roads-question-' + question.name;
        qItem.addClass(customClassName);
        qItem.attr('data-question', question.name);
        qItem.find('span').each(function () {
            var span = $(this);
            var part = span.attr('data-part');
            if (part)
                processQuestionPart(span, part, question, groupNum);
        });
    }

    function toType(obj) {
      return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
    }

    function findAnswers(questionName) {
        if (param.state.answers) {
            if (param.state.answers[questionName] !== undefined) {
                return param.state.answers[questionName];
            }
        }

        return null;
    }

    function rexlCallbackWrapper(args) {
        var ret = rexlCallback(args);
        console.log('rexlCallback(', args, ')=', ret ? ret.value : null);
        return ret;
    }

    function rexlCallback(args) {
        // console.log('rexlCallback(', args, ')');
        var ans = findAnswers(args[0]);

        if (ans) {
            var ansType = toType(ans);
            console.log('ansType=', ansType);
            
            if (ansType === 'object') {
                if (args.length === 1)
                    return rexl.Boolean.value(true);
                else if (args.length > 1) {
                    var val = ans[args[1]];
                    var valType = toType(val);
                    if (val !== undefined) {
                        if (valType === 'number')
                            return rexl.Number.value(val);
                        else if (valType === 'string')
                            return rexl.String.value(val);
                        else if (valType === 'boolean')
                            return rexl.Boolean.value(val);
                        else {
                            // TODO: throw an exception
                            console.log('Wrong type of ' 
                                        + args[0] + '.' + args[1]
                                        + ': ' + valType);
                            return null;
                        }
                    } else
                        return rexl.String.value(null);
                }
            } else if (ansType === 'string')
                return rexl.String.value(ans);
            else if (ansType === 'number')
                return rexl.String.value(ans);
            else {
                console.log('Wrong type of ' + args[0] + ': ' + ansType);
                return null;
            }
        }
        
        return rexl.String.value(null);
    }

    function checkConditions(conditions, defaultValue) {
        var ret = defaultValue;
        if (conditions && conditions.length > 0) {
            var node = rexl.parse(conditions);
            
            try {
                var value = node['evaluate'](rexlCallbackWrapper);
                console.log('evaluated = ', value);
            } catch(err) {
                value = false;
                console.log('error evaluating rexl condition:', conditions);
            }

            return (value) ? true : false;
        }
        return ret;
    }

    function checkIfQuestionDisabled(questionDiv) {
        var questionName = questionDiv.attr('data-question');
        var questionData = findQuestion(currentPage, questionName);
        var disabled = checkConditions(questionData.disableIf, false);

        if (disabled) {
            questionDiv.addClass('disabled-question');
            questionDiv.find('input,textarea').attr('disabled', 'disabled');
        } else {
            questionDiv.removeClass('disabled-question');
            questionDiv.find('input,textarea').removeAttr('disabled');
        }
    }

    function collectAnswersFromQuestion(questionItem) {
        var processedAnswers = {};

        if (questionItem.attr('data-subquestion') === "1")
            questionItem = questionItem.parents('.question-item:first');

        processQuestionAnswer(questionItem, processedAnswers);
        mergeProcessedAnswers(processedAnswers);
    }

    function checkDisabledQuestions() {
        // console.log('-> check disabled questions');
        questions.find('.question-item').each(function () {
            var jThis = $(this);
            if (jThis.attr('data-subquestion') !== "1")
                checkIfQuestionDisabled(jThis);
        });
    }

    function updateProgressBar(page, forcePct) {
        var pages = param.instrument.pages;
        var pct = forcePct !== undefined ? 
                        forcePct: 
                        Math.floor(page.ord * 100 / totalPages);
        progressBar.find('.rc-progress-bar-fill').css('width', pct  + '%');
        
        console.log('progress', progressBar, 'pct', progressBar.find('.rc-progress-bar-pct'));
        
        progressBar.find('.rc-progress-bar-pct').html(pct + '%');
    }

    function showFinishPage() {
        
    }

    function renderPage() {
        clearScreen();
        var pages = param.instrument.pages;
        var page = currentPage;

        screen.addClass('roads-page-' + page.cId);
        console.log('***************',
            page.cId, ' [', page.ord,
            '] ***************');

        btnNext.unbind('click');
        btnNext.click(function () {
            stepNextPage(true);
        });

        btnBack.unbind('click');
        btnBack.click(function () {
            backwards();
        });

        btnBack.css('display', currentPage.ord > 0 ? '': 'none');
        updateProgressBar(page);

        var totalQuestions = page.questions.length;

        if (totalQuestions === 0) {
            screen
                .find('.question-item')
                .remove();
        } else {
            var processed = {};
            for (var idx = 0; idx < totalQuestions; idx++) {
                var question = page.questions[idx];
                if (!processed[question.name]) {
                    var newItem = $(getTemplate('question'));
                    questions.append(newItem);
                    processQuestionItem(newItem, question);
                }
            }
            checkDisabledQuestions();
        }
    }

    function loadInstrument(instrumentName) {
        var url = param.prefix + "/load_instrument(" + instrumentName + ")";
        $.ajax({url : url,
            success : function(content) {
                param.instrument = content;
            },
            type: 'GET'
        });
    }

    function getPackageId() {
        var fromURI = 
            decodeURI(
                (RegExp('package=(.+?)(&|$)').exec(location.search) || 
                    [,null])[1]
            );
        if (!fromURI)
            return param.package;
    }

    function backwards() {
        stepNextPage(false);
    }

    /*
        OPENED
        SKIPPED_BY_LOGIC
        SKIPPED_BY_USER
        ANSWERED
    */
    function logQuestionsAsSkipped(page) {
        if (page.type === 'page') {
            for (var idx in page.questions)
                logPassing(page.questions[idx].name, 'SKIPPED_BY_LOGIC');
        } else {
            for (var idx in page.pages)
                logQuestionsAsSkipped(page.pages[idx]);
        }
    }

    function getDateStr(d) {
        return d.getFullYear() + '-' + (d.getMonth() + 1) + d.getDate() + ' '
            + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    }

    function logPassing(questionName, state) {
        if (!param.state.passing)
            param.state.passing = {};

        var curDate = new Date();
        var formattedDate = getDateStr(curDate);

        if (!param.state.passing[questionName]) {
            param.state.passing[questionName] = {
                state: state,
                start: formattedDate,
                stop: null
            }
        }

        param.state.passing[questionName].state = state;
        if (state !== 'OPENED')
            param.state.passing[questionName].stop = formattedDate;
    }

    function mergeProcessedAnswers(processedAnswers) {
        if (!param.state.answers)
            param.state.answers = {};

        var allAnswers = param.state.answers;
        for (var questionName in processedAnswers) {
            var answers = processedAnswers[questionName];
            logPassing(questionName, answers ? 'ANSWERED' : 'SKIPPED_BY_USER');
            allAnswers[questionName] = answers;
        }
    }

    function finishSurvey() {
        param.state.finish = true;
        var message = param.package ? 'Survey finished!' : 
             'Survey finished (data is not being stored to db due to test mode)';

        saveState(function () {
            updateProgressBar(currentPage, 100);
            alert(message);
            clearScreen();
            btnNext.css('display','none');
            btnBack.css('display','none');
            
            if (param.finishURL) {
                window.location.href = param.finishURL;
            }
        });
    }

    function checkSkipConditions(page) {
        console.log('checking skip conditions:', page.skipIf);
        if (page.skipIf)
            return checkConditions(page.skipIf, false);
        return false;
    }

    function findFirstPage(item, fromEnd) {

        console.log('findFirstPage:', item, fromEnd);
    
        if (item.type === 'group') {
            var total = item.pages.length;

            if (total) {
                var idx;
                var step;

                if (fromEnd) {
                    step = -1;
                    idx = total - 1;
                } else {
                    step = 1;
                    idx = 0;
                }

                while (true) {
                    if (idx < 0 || idx >= total)
                        break;
                    
                    var subItem = item.pages[idx];
                    if (subItem.type === 'page')
                        return subItem;
                    else {
                        var page = findFirstPage(subItem, fromEnd);
                        if (page !== null)
                            return page;
                    }
                    
                    idx += step;
                }
            }
        }

        return null;
    }

    function findNextPage(current) {
        var ret = null;

        console.log('findNextPage');

        while (current !== null) {
            while (current !== null && current.next === null)
                current = current.parent;

            if (current === null)
                break;

            while (current.next !== null) {
                current = current.next;

                if (checkSkipConditions(current))
                    logQuestionsAsSkipped(current);
                else {

                    if (current.type === 'page') {
                        ret = current;
                        break;
                    } else {
                        var page = findFirstPage(current, false);
                        if (page) {
                            ret = page;
                            break;
                        }
                    }
                }
            }

            if (ret !== null)
                break;
        }

        return ret;
    }

    function findPreviousPage(current) {
        var ret = null;

        console.log('findPreviousPage');

        while (current !== null) {
            while (current !== null && current.prev === null)
                current = current.parent;

            if (current === null)
                break;

            while (current.prev !== null) {
                current = current.prev;

                if (!checkSkipConditions(current)) {
                    logQuestionsAsSkipped(current);

                    if (current.type === 'page') {
                        ret = current;
                        break;
                    } else {
                        var page = findFirstPage(current, true);
                        if (page) {
                            ret = page;
                            break;
                        }
                    }
                }
            }

            if (ret !== null)
                break;
        }

        return ret;
    }

    function makeConnectionsAndOrds(parent, curOrd) {
        var pages = (!parent) ? param.instrument.pages : parent.pages;

        var prev = null;
        for (var idx in pages) {
            var page = pages[idx];

            if (prev)
                prev.next = page;

            page.parent = parent;
            page.prev = prev;
            page.next = null;

            for (var qIdx in page.questions) {
                var question = page.questions[qIdx];
                if (question.repeatingGroup &&
                    question.repeatingGroup.length) {
                    for (var sIdx in question.repeatingGroup) {
                        question.repeatingGroup[sIdx].parent = question;
                    }
                }
            }

            if (page.type === 'group') {
                if (page.pages)
                    curOrd = makeConnectionsAndOrds(page, curOrd);
            } else
                page['ord'] = curOrd++;

            prev = page;
        }

        return curOrd;
    }

    function stepNextPage(isForward) {
        var pages = param.instrument.pages;
        var nextPage = null;

        console.log('stepNextPage', isForward);

        var processedAnswers = {};

        if (!currentPage) {
            if (isForward) {
                for (var idx in pages) {
                    var page = pages[idx];
                    if (page.type === 'page') {
                        nextPage = page;
                        break;
                    } else {
                        var foundPage = findFirstPage(page, false);
                        if (foundPage) {
                            nextPage = foundPage;
                            break;
                        }
                    }
                }
            }
        } else
            nextPage = isForward ?
                        findNextPage(currentPage):
                        findPreviousPage(currentPage);

        if (nextPage !== null) {
            mergeProcessedAnswers(processedAnswers);

            if (currentPage !== null) {
                var thisPageAnswers = {};
                processAnswers(thisPageAnswers);
                mergeProcessedAnswers(thisPageAnswers);
                saveState();
            }

            currentPage = nextPage;
            renderPage(currentPage);

        } else if (isForward) {
            console.log('Finishing survey!');
            finishSurvey();
        } else
            console.log('nextPageIdx is null!');
    }

    var initialScreenClasses = '';
    var pagesStack = [];
    var currentPage = null;
    var param = o;
    console.debug(param.extra);
    var creoleParser = new Parse.Simple.Creole({
        linkFormat: ''
    });

    // TODO: validate param

    var screen = $(param.place);

    var defaultSelectors = {
        'progressBar': '.rc-progress-bar',
        'btnNext': '.rc-btn-survey-next',
        'btnBack': '.rc-btn-survey-back',
        'questions': '.rc-questions'
    };

    var questions;
    if (param.questions)
        questions = $( param.questions );
    else
        questions = $( defaultSelectors['questions'] );

    function createElement(type) {
        var place;
        if (param[type])
            place = $( param[type] );
        else
            place = $( defaultSelectors[type] );
        var element = $( getTemplate(type) );
        place.append(element);
        return element;
    }

    var progressBar = createElement('progressBar');
    var btnBack = createElement('btnBack');
    var btnNext = createElement('btnNext');
    initialScreenClasses = screen.attr('class') || '';

    var totalPages = makeConnectionsAndOrds(null, 0);
    console.log('total pages = ', totalPages);
    stepNextPage(true);
}

