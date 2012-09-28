
function ConditionEditor(initParams) {
    var dialogObj = null;
    var dialogParams = null;
    var conditionsTextInput = null;
    var logicVariants = null;
    var tabs = {};
    var switches = {};
    var currentTab = null;
    var currentSelection = [];
    var conditionBuilderList = null;
    var conditionItemProto = null;
    var conditionGroupProto = null;
    var prefix = '';
    var manualEditConditions = true;

    function removeConditionItem(link) {
        var conditionItem = $(link)
            .parents('.rb_condition_item,.rb_condition_group').first();
        conditionItem.slideUp(300, function () {
            conditionItem.remove();
        });
    }

    function closeDialog() {
        dialogObj.dialog('close');
    }

    var quoteRegExp = new RegExp('\'');
    function rexlQuote(str) {
        return "'" + str.replace(quoteRegExp, '\\\'') + "'";
    }

    function isValidDate(year, month, day) {
        --month;
        var d = new Date(year, month, day);
        return (d.getDate() == day &&
                d.getMonth() == month &&
                d.getFullYear() == year);
    }

    function isValidNumeric(val, condType) {
        return (
            (condType === 'integer' 
                && /^[0-9]+$/.test(val)) ||
            (condType === 'float' 
                && /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/.test(val))
        );
    }

    function processConditionItem(item, isFirst) {
        var thisStatement = '';
        var or = (item.attr('data-or') === "1");
        var neg = (item.attr('data-negative') === "1");

        var noErrors = true;

        if (item.hasClass('rb_condition_group')) {
        
            var isSubItemFirst = true;
            var list = $('.rb_conditions_list:first', item);
            
            list.children('.rb_condition_group,.rb_condition_item').each(
                function () {
                    if (noErrors) {
                        var result =
                            processConditionItem($(this), isSubItemFirst);
                        isSubItemFirst = false;

                        if (result)
                            thisStatement += result;
                        else
                            noErrors = true;
                    }
                }
            );

            if (noErrors) {
                thisStatement = (neg ? '!': '') 
                                    + '(' + thisStatement + ')';

                if (!isFirst)
                    thisStatement = (or ? ' | ' : ' & ') + thisStatement;
            }

        } else {

            var identifierInput =
                $('input.rb_identifier_input:first', item);
            var hidPart =
                $('.rb_condition_item_hidable:first', item);

            var identifier = hidPart.attr('data-identifier');

            if (!identifier ||
                identifier !== identifierInput.val()) {
                noErrors = false;
            } else {
                var identifierType = hidPart.attr('data-type');
                var notEmptyValue = $('.rb_not_empty_value:first', hidPart);
                var valueInput = notEmptyValue.find('select,input');
                var operand = jQuery.trim(valueInput.val());
                var operation = $('.rb_select_answer_is', hidPart).val();

                switch (identifierType) {
                case 'date':
                    if (operand) {
                        var matches = operand.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                        if (!matches ||
                            !isValidDate(matches[1], matches[2], matches[3])) {
                            noErrors = false;
                            break;
                        }
                    }
                case 'enum':
                case 'string':
                    operand = rexlQuote(operand);
                    break;
                case 'number':
                    if (operation !== '' && !isValidNumeric(operand, 'float'))
                        noErrors = false;
                    break;
                case 'list':
                    if (operation === '=' ) {
                        identifier += '.' + operand;
                        operand = 'true()';
                    }
                    break;
                }

                if (noErrors) {
                    valueInput.removeClass('rb_wrong');
                    console.log('before build statement or=', or, 'neg', neg); 
                    thisStatement =
                        buildStatement(isFirst,
                                or,
                                neg,
                                identifier,
                                operation,
                                operand);
                } else
                    valueInput.addClass('rb_wrong');
            }
        }

        if (noErrors)
            return thisStatement;

        return null;
    }

    function buildStatement(isFirst, or, neg, identifier, operation, operand) {
        var statement = '';
        var negUsed = false;

        switch(operation) {
        case '':
            if (neg) {
                rexlOp = '!=';
                negUsed = true;
            } else
                rexlOp = '==';
            operand = 'null()';
            break;
        case '=':
            if (neg) {
                rexlOp = '!=';
                negUsed = true;
            } else
                rexlOp = '=';
            break;
        case '>':
            if (neg) {
                rexlOp = '<=';
                negUsed = true;
            } else
                rexlOp = '>';
            break;
        case '>=':
            if (neg) {
                rexlOp = '<';
                negUsed = true;
            } else
                rexlOp = '>=';
            break;
        case '<':
            if (neg) {
                rexlOp = '>=';
                negUsed = true;
            } else
                rexlOp = '<';
            break;
        case '<=':
            if (neg) {
                rexlOp = '>';
                negUsed = true;
            } else
                rexlOp = '<=';
            break;
        default:
            return null;
        }

        statement += identifier
                    + rexlOp
                    + operand;

        if (neg & !negUsed)
            statement += '!(' + statement + ')';

        if (!isFirst)
            statement = ((or) ? ' | ' : ' & ') + statement;

        return statement;
    }

    function onDialogOk() {
        var conditionsStr = null;
        var noErrors = true;

        if (currentTab === 'manual') {
            conditionsStr =
                jQuery.trim(conditionsTextInput.val());

            if (conditionsStr !== '') {
                try {
                    var parsed = rexl.parse(conditionsStr);
                } catch(err) {
                    noErrors = false;
                    console.log('Error in REXL:', conditionsStr);
                    // TODO: show error message for user
                }
            } else
                conditionsStr = null;
        } else if (currentTab === 'builder') {
            var noErrors = true;
            var conditionsStr = '';
            var isFirst = true;

            conditionBuilderList
                .children('.rb_condition_item,.rb_condition_group')
                .each(function () {
                
                statement = processConditionItem($(this), isFirst);
                isFirst = false;
                if (statement === null)
                    noErrors = false;

                if (noErrors)
                    conditionsStr += statement;

                console.log('conditionsStr:', conditionsStr);
            });
        }

        if (noErrors) {
            console.log('no errors');
            dialogParams.callback(conditionsStr); 
            closeDialog();
        }
    }

    function getConditionItemsFromSelection() {
        var ret = [];
        for (var idx in currentSelection) {
            ret.push(
                currentSelection[idx].parents('.rb_condition_item:first')
            );
        }
        return ret;
    }

    function makeConditionGroupFromSelection() {
        var selectedItems = getConditionItemsFromSelection();
        processSelectedItems(selectedItems);
    }

    function getItemLevel(itemDiv) {
        var level = 0;
        var cls = 'rb_condition_group';

        var element = itemDiv.parents("." + cls + ":first");
        while (element.size()) {
            ++level;
            element = element.parents("." + cls + ":first");
        }

        return level;
    }

    function checkIfEdge(element, fromLeft) {
        var selector = '.rb_condition_item,.rb_condition_group';
        return (fromLeft && element.prev(selector).size() === 0) ||
                (!fromLeft && element.next(selector).size() === 0);
    }

    function getLowestAllowedLevel(element, level, fromLeft) {
        var cls = 'rb_condition_group';

        while (element.size() && level) {
            if (checkIfEdge(element, fromLeft)) {
                --level;
                element = element.parent('.' + cls + ':first');
            } else
                break;
        }
        return level;
    }

    function getCutoff (page) {
        var cutoff = [];
        var element = page;

        var chkId = 'rb_condition_builder_list';

        cutoff.push(element);

        do {
            element = element.parent();
            
            if (!element.hasClass(chkId))
                cutoff.unshift(element);
        } while (element.attr('class') !== chkId && element.size())

        return cutoff;
    }

    function interceptCutoff(cutoff1, cutoff2) {
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

    function processSelectedItems(selectedItems) {
        var firstItem = selectedItems[0];
        var lastItem = selectedItems[selectedItems.length - 1];
        var pushToGroup = [];

        if (firstItem === lastItem) {
            pushToGroup.push(firstItem);
        } else {
            var firstLevel = getItemLevel(firstItem);
            var secondLevel = getItemLevel(lastItem);

            var firstLowestAllowedLevel =
                getLowestAllowedLevel(firstItem, firstLevel, true);

            var lastLowestAllowedLevel =
                getLowestAllowedLevel(lastItem, secondLevel, false);

            var lowestAllowedLevel =
                    (firstLowestAllowedLevel < lastLowestAllowedLevel) ?
                                        lastLowestAllowedLevel:
                                        firstLowestAllowedLevel;

            if (lowestAllowedLevel > firstLevel ||
                lowestAllowedLevel > secondLevel)
                return;

            var firstCutoff = getCutoff(firstItem);
            var lastCutoff = null;
            var cutoff = firstCutoff;
            var total = selectedItems.length;
            
            for (var idx = 1; idx < total; idx++) {
                var currentCutoff = getCutoff(selectedItems[idx]);
                cutoff = interceptCutoff(cutoff, currentCutoff);
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
            var itemGroup = createGroup();
            var itemSublistDiv = itemGroup.find('.rb_conditions_list:first');

            pushToGroup[0].before(itemGroup);

            $('.rb_condition_item_logic:first', itemGroup).click(
                onConditionLogicClick
            );

            for (var idx in pushToGroup) {
                itemSublistDiv.append(pushToGroup[idx]);
            }
            setConditionListSortable(itemSublistDiv);
            updateConditionLogic(itemGroup);
        }
    }

    function createGroup() {
        if (!conditionGroupProto) {
            conditionGroupProto =
                $( '<li class="rb_condition_group">'
                    + '<div>'
                        + '<div class="rb_condition_item_logic">'
                            + '<span class="rb_logic_wrap">'
                                + '<span class="rb_operation"></span> <span class="negation"></span>'
                            + '</span>'
                            + '<div class="rb_condition_item_logic_arrow"> &darr; </div>'
                        + '</div>'
                        + '<div class="rb_condition_group_content">'
                            + '<div class="rb_condition_group_actions">'
                                + '<a href="javascript:void(0);" class="rb_condition_remove"><img src="' + prefix + '/img/close_small.png"></a>'
                            + '</div>'
                            + '<ul class="rb_conditions_list">'
                            + '</ul>'
                        + '</div>'
                    + '</div>'
                + '</li>' );
        }

        var ret = conditionGroupProto.clone();
        ret.find('a.rb_condition_remove:first').click(function () {
             removeConditionItem(this);
        });

        return ret;
    }

    function showTab(tab) {
        for (tabName in tabs) {
            tabs[tabName].css('display',
                (tabName === tab) ? '': 'none'
            );
            if (tabName === tab)
                switches[tabName].addClass('rb_cond_selected');
            else
                switches[tabName].removeClass('rb_cond_selected');
        }
        currentTab = tab;
    }

    function setConditionListSortable(list) {
        console.log('list:', list);
        list.sortable({
            cursor: 'move',
            toleranceElement: '> div',
            connectWith: '.rb_condition_builder_list,.rb_conditions_list'
        });
    }

    function hideAllVariantsMenu() {
        $('.rb_condition_item_logic_variants', dialogObj)
            .css('display', 'none');
    }

    function renderAnswerSelection(selectAnswerIs, 
                                    relations, 
                                    notEmptyValue, 
                                    notEmptyValueContent, data) {

        selectAnswerIs.append( $('<option>', {
            value: '',
            text: 'empty'
        }));
        
        for (var idx in relations) {
            var variant = relations[idx];
            $('<option>', {
                value: variant.value,
                text: variant.title
            }).appendTo(selectAnswerIs);
        }

        selectAnswerIs.unbind('change');
        selectAnswerIs.bind('change', function () {
            var jThis = $(this);
            var input = jThis.siblings('.rb_not_empty_value')
                             .find('input,select');
            if (!jThis.val())
                input.attr('disabled', 'disabled');
            else
                input.removeAttr('disabled');
        });

        if (data) {
            if (data.argValue !== null) {
                if (data.op === "==")
                    selectAnswerIs.val('=');
                else
                    selectAnswerIs.val(data.op);
            }
        }
    }

    function truncateText(text, len) {
        if (text.length > len)
            return text.slice(0, len - 3) + "...";
        return text;
    }

    function onIdentifierSet(input) {
        var jInput = $(input);
        var value = jInput.val();
        var found = false;

        var conditionItem = jInput.parents('.rb_condition_item');
        var hidablePart = $('.rb_condition_item_hidable:first',
                                                conditionItem);
        var currentItem = null;
        var data = hidablePart.data('data');

        if (data)
            hidablePart.data('data', null);

        var selectRelations = {
            'singleValue': [{
                'value': '=',
                'title': 'equal'
            }],
            'variant': [{
                'value': '=',
                'title': 'having'
            }],
            'numeric': [
                {
                    'value': '=',
                    'title': '='
                },
                {
                    'value': '>',
                    'title': '>',
                },
                {
                    'value': '>=',
                    'title': '>=',
                },
                {
                    'value': '<',
                    'title': '<',
                },
                {
                    'value': '<=',
                    'title': '<=',
                },
            ]
        }

        var desc = initParams.onDescribeId(value);

        if (desc) {
            if (hidablePart.attr('data-identifier') !== value) {
                var notEmptyValue = $('.rb_not_empty_value', hidablePart);
                var selectAnswerIs = $('.rb_select_answer_is', hidablePart);

                selectAnswerIs.contents().remove();
                notEmptyValue.contents().remove();
                var notEmptyValueContent = null;

                relations = selectRelations['singleValue'];

                switch(desc.type) {
                case 'string':
                    notEmptyValueContent = $('<input>');
                    break;
                case 'date':
                    notEmptyValueContent = $('<input>');
                    notEmptyValueContent.datepicker({
                        dateFormat: 'yy-mm-dd'
                    });
                    relations = selectRelations['numeric'];
                    break;
                case 'number':
                    notEmptyValueContent = $('<input>');
                    relations = selectRelations['numeric'];
                    break;
                case 'enum':
                case 'set':
                    notEmptyValueContent = $('<select>');
                    if (desc.type === 'list')
                        relations = selectRelations['variant'];
                    for (var idx in desc.variants) {
                        var variant = desc.variants[idx];

                        $('<option>', {
                            value: variant.code,
                            text: truncateText(variant.title || variant.code, 20)
                        }).appendTo(notEmptyValueContent);
                    }
                    break;
                }

                renderAnswerSelection(selectAnswerIs,
                                        relations,
                                        notEmptyValue,
                                        notEmptyValueContent, data);

                if (data && data.argValue !== null)
                    notEmptyValueContent.val( data.argValue );

                notEmptyValue.append(notEmptyValueContent);
                hidablePart.attr('data-identifier', value);
                hidablePart.attr('data-type', desc.type);

                selectAnswerIs.change();
            }

            jInput.removeClass('rb_wrong');
            hidablePart.css('display', 'block');
        } else {
            jInput.addClass('rb_wrong');
            hidablePart.css('display', '');
        }
    }

    function triggerChange(input) {
        if (input.triggerTimeout) {
            clearTimeout(this.triggerTimeout);
            input.triggerTimeout = undefined;
        }
        $(input).change();
    }

    function closeLogicVariants() {
        logicVariants.css('display', 'none');
        logicVariants.detach();
    }

    function showLogicVariants(overElem) {
        logicVariants.css('display', '');

        var conditionItem = overElem.parents('.rb_condition_item,.rb_condition_group').first();
        logicVariants.data('over', conditionItem);
        var isFirst = (conditionItem.prev('.rb_condition_item,.rb_condition_group').size() === 0);
        var list = conditionBuilderList;
        var editorTab = $('.rb_condition_editor_tab[data-tab="builder"]', dialogObj);
        var listOffset = editorTab.offset();

        logicVariants.find('.rb_condition_item_logic_first')
                     .css('display', isFirst ? 'block' : 'none');
        logicVariants.find('.rb_condition_item_logic_others')
                     .css('display', isFirst ? 'none' : 'block');

        var offset = overElem.offset();
        logicVariants.css('top', (offset.top - listOffset.top) + 'px');
        logicVariants.css('left', (offset.left - listOffset.left) + 'px');

        logicVariants.appendTo( editorTab );
        dialogObj.bind('click.hideLogicMenu', function (event) {
            closeLogicVariants();
            dialogObj.unbind('click.hideLogicMenu');
        });
    }

    function onConditionLogicClick(event) {
        var jThis = $(this);
        hideAllVariantsMenu();

        showLogicVariants(jThis);
        event.stopPropagation();
    }

    function escapeHTML(str) {
        return $(document.createElement('div')).text(str).html();
    }

    function addConditionItem(data, appendTo, defaultIdentifier) {
        var newItem;

        if (!conditionItemProto) {

            if (dialogParams.identifierTitle)
                identifierTitle = dialogParams.identifierTitle;
            else if (initParams.identifierTitle)
                identifierTitle = initParams.identifierTitle;
            else
                identifierTitle = 'Identifier';
        
            conditionItemProto =
                $( '<li class="rb_condition_item">'
                    + '<div>'
                        + '<div class="rb_condition_item_logic">'
                            + '<span class="rb_logic_wrap">'
                                + '<span class="rb_operation"></span> <span class="negation"></span>'
                            + '</span>'
                            + '<div class="rb_condition_item_logic_arrow"> &darr; </div>'
                        + '</div>'
                        + '<div class="rb_condition_item_content">'
                            + '<div class="rb_condition_item_actions">'
                                + '<a href="javascript:void(0);" class="rb_condition_remove"><img src="' + prefix + '/img/close_small.png"></a>'
                            + '</div>'
                            + '<div style="white-space: nowrap;">'
                                + '<span class="rb_condition_part_title">' + identifierTitle + ':</span> <input class="rb_identifier_input">'
                            + '</div>'
                            + '<div class="rb_condition_item_hidable">'
                                + '<span class="rb_condition_part_title">is</span> '
                                + '<select class="rb_select_answer_is"></select> '
                                + '<span class="rb_not_empty_value"></span>'
                            + '</div>'
                        + '</div>'
                    + '</div>'
                + '</li>' );
        }

        newItem = conditionItemProto.clone();
        newItem.find('a.rb_condition_remove:first').click(function () {
            removeConditionItem(this);
        });

        $('.rb_condition_item_logic:first', newItem).click(
            onConditionLogicClick
        );

        var dataOr = '0';
        var dataNeg = '0';
        if (data) {
            dataOr = (data.logicOp === "|") ? '1': '0';
            dataNeg = (data.neg) ? '1': '0';
        }

        newItem.attr('data-negative', dataNeg)
               .attr('data-or', dataOr);

        updateConditionLogic(newItem);
        
        if (appendTo)
            appendTo.append(newItem);
        else
            conditionBuilderList.append(newItem);

        $('.rb_condition_item_content:first', newItem).click(
            function (event) {
                var list = conditionBuilderList;
                if (event.shiftKey) {
                    document.getSelection().removeAllRanges();

                    if (currentItem) {
                        currentSelection = [];
                        var fromItem = currentItem;
                        var toItem = $(this);
                        var selectIt = false;
                        list.find('.rb_condition_item_content')
                            .each(function () {

                            var jThis = $(this);
                            if (jThis[0] === fromItem[0] ||
                                jThis[0] === toItem[0]) {

                                selectIt = !selectIt;
                                jThis.addClass('rb_cond_covered');
                                currentSelection.push(jThis);
                            } else if (selectIt) {
                                jThis.addClass('rb_cond_covered');
                                currentSelection.push(jThis);
                            } else {
                                jThis.removeClass('rb_cond_covered');
                            }
                        });
                    }
                } else {
                    list.find('.rb_cond_covered').removeClass('rb_cond_covered');
                    currentSelection = [ $(this) ];
                    currentItem = $(this);
                    currentItem.addClass('rb_cond_covered');
                }

                if (currentSelection && currentSelection.length) {
                    $('.rb_make_cond_group_btn:first', dialogObj).removeAttr('disabled');
                } else {
                    $('.rb_make_cond_group_btn:first', dialogObj).attr('disabled','disabled');
                }

                event.preventDefault();
            }
        );

        var identifierInput = $('input.rb_identifier_input', newItem);

        if (data) {
            identifierInput.val(data.argIdentifier);

            var hidablePart = $('.rb_condition_item_hidable:first', newItem);
            hidablePart.data('data', data);
        } else if (defaultIdentifier) {
            identifierInput.val(defaultIdentifier);
        }

        identifierInput.each(function () {
            $(this).autocomplete({
                source: function (request, response) {
                    ret = initParams.onSearchId(request.term) || [];
                    response(ret);
                },
                select: function (event, ui) {
                    $(this).val(ui.item.value).change();
                    return true;
                }
            }).data( "autocomplete" )._renderItem = function( ul, item ) {
                return $( "<li></li>" )
                    .data( "item.autocomplete", item )
                    .append( '<a class="rb_ac_item"><b>' 
                                + escapeHTML(item.value) + "</b><br>" 
                                + escapeHTML(item.title) + "</a>" )
                    .appendTo( ul );
            };
        })
        .change(function (event, ui) {
            if (this.triggerTimeout) {
                clearTimeout(this.triggerTimeout);
                this.triggerTimeout = undefined;
            }

            if (event.isTrigger)
                onIdentifierSet(this);
            else
                this.triggerTimeout = setTimeout(triggerChange, 200, this);
        });

        if (data || defaultIdentifier)
            identifierInput.change();
    }

    function updateConditionLogic(conditionItem) {
        var or = conditionItem.attr('data-or');
        var negation = conditionItem.attr('data-negative');

        $('.rb_operation:first', conditionItem)
            .html( (or === "1") ? "OR" : "AND" );

        $('.negation:first', conditionItem)
            .html( (negation === "1") ? "NOT" : "" );
    }

    function setItemLogic(variant) {
        var jVariant = $(variant);
        var conditionItem = logicVariants.data('over');
        var or = jVariant.attr('data-or');
        var neg = jVariant.attr('data-negative');

        if (or)
            conditionItem.attr('data-or', or);

        conditionItem.attr('data-negative', neg);
        updateConditionLogic(conditionItem);

        closeLogicVariants();
        dialogObj.unbind('click.hideLogicMenu');
    }
    
    var allowedOperations = {
        '&': {
            priority: 2
        },
        '|': {
            priority: 0
        },
        '>': {
            priority: 4,
            exactArgs: 2,
            endPoint: true
        },
        '>=': {
            priority: 4,
            exactArgs: 2,
            endPoint: true
        },
        '<': {
            priority: 4,
            exactArgs: 2,
            endPoint: true
        },
        '<=': {
            priority: 4,
            exactArgs: 2,
            endPoint: true
        },
        '=': {
            priority: 3,
            exactArgs: 2,
            endPoint: true
        },
        '==': {
            priority: 3,
            exactArgs: 2,
            endPoint: true
        },
        '!=': {
            priority: 3,
            exactArgs: 2,
            endPoint: true
        }
    };

    function toType(obj) {
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    }

    function getOperationDef(opName, totalArgs) {
        var op = allowedOperations[opName];
        
        if (!op)
            return null;
        
        if (op.maxArgs && op.maxArgs < totalArgs)
            return null;

        if (op.exactArgs && op.exactArgs !== totalArgs)
            return null;

        return op;
    }

    function buildIntermediateItems(node, prevOp, neg) {
        if (node.type === "OPERATION") {
            var valueType = toType(node.value);
            var opName = '';
            if (valueType === "object") {
                opName = node.value.value;
                if (toType(opName) !== "string") {
                    // this is unsupported
                    console.log('opName is not string:', opName)
                    return null;
                }
            } else
                opName = node.value;

            if (opName == '!()') {
                if (node.args.length == 1)
                    return buildIntermediateItems(node.args[0], prevOp, true);
                else
                    return null;
            }

            var opDef = getOperationDef(opName, node.args.length);
            if (!opDef) {
                console.log('Can not find operation definition for:', opName);
                return null;
            }

            if (!opDef.endPoint) {

                var thisUnion = {
                    type: ((prevOp
                            && prevOp.priority > opDef.priority) ||
                            neg) ?
                                'GROUP':
                                'UNION',
                    neg: (neg ? true: false),
                    items: []
                };

                for (var idx in node.args) {
                    var res = buildIntermediateItems(node.args[idx], opDef, false);
                    if (res === null)
                        return null;
                    if (res.type === 'ENDPOINT' ||
                        res.type === 'GROUP') {
                        res.logicOp = opName;
                        thisUnion.items.push(res);
                    } else if (res.type === 'UNION') {
                        for (var uIdx in res.items) {
                            var item = res.items[uIdx];
                            thisUnion.items.push(item);
                        }
                    }
                }

                return thisUnion;
            } else {
                var argIdentifier;
                var argValue;
                var forceArgValue;

                if (opName === "==")
                    opName = "=";
                else if (opName === "!=") {
                    opName = "=";
                    neg = !neg;
                }

                for (var idx in node.args) {
                    var arg = node.args[idx];
                    if (arg.type === "IDENTIFIER") {
                        argIdentifier = arg.value;
                    } else if (arg.type === "OPERATION") {
                        if (arg.value === ".") {
                            console.log('before arg', arg);

                            if (arg.args.length == 2 &&
                                arg.args[0].type === "IDENTIFIER" &&
                                arg.args[1].type === "IDENTIFIER") {

                                argIdentifier = arg.args[0].value;
                                forceArgValue = arg.args[1].value;
                            } else {
                                // unsupported identifier
                                return null;
                            }
                        } else if (toType(arg.value) === "object" &&
                                arg.value.type === "IDENTIFIER") {

                            switch(arg.value.value) {
                            case 'true':
                                argValue = true;
                                break;
                            case 'false':
                                argValue = true;
                                neg = !neg;
                                break;
                            case 'null':
                                argValue = null;
                                opName = '';
                                break;
                            default:
                                // unsupported function
                                console.log('unsupported function:', arg.value.value)
                                return null;
                            }
                        } else {
                            console.log('something else', arg);
                            return null;
                        }
                    } else if (arg.type === "QUOTED_LITERAL") {
                        argValue = arg.value;
                    } else if (arg.type === "NUMERIC_LITERAL") {
                        argValue = arg.value;
                    } else {
                        // unsupported type
                        return;
                    }
                }

                if (forceArgValue !== undefined)
                    argValue = forceArgValue;

                if (argIdentifier !== undefined &&
                    argValue !== undefined) {

                    var endPoint = {
                        type: 'ENDPOINT',
                        argIdentifier: argIdentifier,
                        argValue: argValue,
                        neg: (neg ? true: false),
                        op: opName
                    };

                    return endPoint;
                } else {
                    console.log('null param: argIdentifier:', argIdentifier, 'argValue:', argValue);
                    return null;
                }
            }
        }
        
        console.log('default null', node);
        return null;
    }

    function buildConditionItems(imItems, parentDiv) {
        switch (imItems.type) {
        case 'ENDPOINT':
            addConditionItem(imItems, parentDiv);
            break;
        case 'UNION':
            for (var idx in imItems.items) {
                buildConditionItems(imItems.items[idx],
                                    parentDiv);
            }
            break;
        case 'GROUP':
            var itemGroup = createGroup();
            var itemSublistDiv = itemGroup
                                    .find('.rb_conditions_list:first');

            parentDiv.append(itemGroup);

            $('.rb_condition_item_logic:first', itemGroup).click(
                onConditionLogicClick
            );

            setConditionListSortable(itemSublistDiv);

            var dataOr = (imItems.logicOp === "|") ? '1': '0';
            var dataNeg = (imItems.neg) ? '1': '0';

            itemGroup.attr('data-negative', dataNeg)
                     .attr('data-or', dataOr);

            updateConditionLogic(itemGroup);

            for (var idx in imItems.items) {
                buildConditionItems(imItems.items[idx],
                                    itemSublistDiv);
            }

            break;
        }
    }

    if (initParams) {
        if (initParams.manualEdit !== undefined)
            manualEditConditions = initParams.manualEdit;
        if (initParams.urlPrefix !== undefined)
            prefix = initParams.urlPrefix;
    }

    var condEditorTpl =
        '<div class="rb_condition_editor' + ((manualEditConditions) ? '': ' rb_without_manual_editor') + '">'
            + '<div class="rb_condition_editor_header">'
                + '<a href="javascript:void(0);" class="rb_condition_editor_switch" data-tab="builder">Condition Builder</a>'
                + (
                    (manualEditConditions) ?
                    ' | <a href="javascript:void(0);" class="rb_condition_editor_switch" data-tab="manual">Edit Manually</a>' : ''
                  )
            + '</div>'
            + '<div class="rb_condition_editor_body">'
                + (
                    (manualEditConditions) ?
                    '<div class="rb_condition_editor_tab" data-tab="manual" style="display: none;">'
                        + 'Please set conditions:<br>'
                        + '<input class="rb_condition_text" />'
                    + '</div>' : ''
                  )
                + '<div class="rb_condition_editor_tab" data-tab="builder" style="display: none;">'
                    + '<div class="rb_condition_builder_header">'
                        + '<button class="rb_add_condition">Add condition</button>'
                        + '<button class="rb_make_cond_group_btn" disabled="1">Make group</button>'
                    + '</div>'
                    + '<div class="rb_condition_item_logic_variants" style="display:none;">'
                        + '<div class="rb_condition_item_logic_first">'
                            + '<a href="javascript:void(0);" class="rb_set_logic" data-negative="0">&nbsp;</a>'
                            + '<a href="javascript:void(0);" class="rb_set_logic" data-negative="1">NOT</a>'
                        + '</div>'
                        + '<div class="rb_condition_item_logic_others">'
                            + '<a href="javascript:void(0);" class="rb_set_logic" data-or="0" data-negative="0">AND</a>'
                            + '<a href="javascript:void(0);" class="rb_set_logic" data-or="0" data-negative="1">AND NOT</a>'
                            + '<a href="javascript:void(0);" class="rb_set_logic" data-or="1" data-negative="0">OR</a>'
                            + '<a href="javascript:void(0);" class="rb_set_logic" data-or="1" data-negative="1">OR NOT</a>'
                        + '</div>'
                    + '</div>'
                    + '<ul class="rb_condition_builder_list"></ul>'
                + '</div>'
            + '</div>'
        + '</div>';

    var condEditor = $( condEditorTpl );
    
    dialogObj = condEditor.dialog({
        autoOpen: false,
        title: 'Set conditions',
        width: 500,
        height: 400,
        modal: true,
        buttons: {
            'Ok': onDialogOk,
            'Cancel': function () {
                closeDialog();
            }
        },
        close: function () {
            if (dialogParams.onClose)
                dialogParams.onClose();

            dialogParams = null;
            conditionBuilderList.contents().remove();
        }
    });

    conditionBuilderList = $('.rb_condition_builder_list', dialogObj);

    $('a.rb_condition_editor_switch[data-tab="builder"]', dialogObj).click(
        function () {
            showTab('builder');
        }
    );

    if (manualEditConditions) {
        $('a.rb_condition_editor_switch[data-tab="manual"]', dialogObj).click(
            function () {
                showTab('manual');
            }
        );
    }

    $('button.rb_add_condition', dialogObj).click(function () {
        addConditionItem(
            null, 
            null, 
            (dialogParams.defaultIdentifier ?
                dialogParams.defaultIdentifier : null)
        );
    });

    $('button.rb_make_cond_group_btn', dialogObj).click(
        makeConditionGroupFromSelection
    );

    conditionsTextInput = $('.rb_condition_text', dialogObj);
    logicVariants = $('.rb_condition_item_logic_variants', dialogObj);

    $('.rb_condition_editor_tab', dialogObj).each(function () {
        var jThis = $(this);
        tabs[jThis.attr('data-tab')] = jThis;
    });

    $('.rb_condition_editor_switch', dialogObj).each(function () {
        var jThis = $(this);
        switches[jThis.attr('data-tab')] = jThis;
    });

    $('.rb_set_logic', dialogObj).click(function (e) {
        setItemLogic(this);
        e.stopPropagation();
    });

    setConditionListSortable( conditionBuilderList );
    
    this.open = function (params) {
        dialogParams = params;
        var conditionsStr = '';
        $('.rb_make_cond_group_btn', dialogObj).attr('disabled', 'disabled');
        conditionBuilderList.contents().remove();

        var dialogTitle = (params.title) ? params.title : 'Set Conditions';

        dialogObj.dialog('option', 'title', dialogTitle);

        if (dialogParams.conditions &&
            !(dialogParams.conditions instanceof Object))
            conditionsStr = dialogParams.conditions;

        conditionsTextInput.val(conditionsStr);
        var parsable = true;

        if (conditionsStr) {
            var node;
            try {
                node = rexl.parse(conditionsStr);
            } catch(err) {
                console.log('error parsing rexl:', conditionsStr);
                parsable = false;
            }

            if (parsable) {
                console.log('Node', node);
                var imItems = buildIntermediateItems(node);
                if (!imItems) {
                    console.log('items are not parsable');
                    parsable = false;
                } else {
                    console.log('parsable items: ', imItems);
                    buildConditionItems(imItems,
                            conditionBuilderList);
                }
            }
        }

        if (parsable || manualEditConditions)
            showTab('builder');
        else
            showTab('manual');

        dialogObj.dialog('open');
    };

    this.addConditionItem = addConditionItem;
    this.makeConditionGroupFromSelection = makeConditionGroupFromSelection;
    this.removeConditionItem = removeConditionItem;
    this.setItemLogic = setItemLogic;
    this.close = close
}

