
(function () {

var builder = $.RexFormBuilder = $.RexFormBuilder || {};
var dialogNS = builder.dialog = {};

dialogNS.QuestionDialog = function (o) {

    var template =
            '<div>'
              + '<div class="rb-question-dialog-text"></div>'
          + '</div>';
    var parent = o.parent || null;
    var node = $(template).dialog({
        autoOpen: false,
        title: 'Question',
        width: 400,
        height: 200,
        modal: true,
        close: function () {
            if (options.onResult)
                options.onResult(retValue);
            options = null;
            retValue = null;
        }
    });
    var txtNode = node.find('.rb-question-dialog-text');
    var options = null;
    var retValue = null;
    var self = this;

    function setDialogButtons(buttons) {
        var optButtons = {};
        for (var btnName in buttons) {
            var f = function () {
                var callee = arguments.callee;
                retValue = buttons[callee.btnName]();
                self.close();
            }
            f.btnName = btnName;
            optButtons[btnName] = f;
        }
        node.dialog('option', 'buttons', optButtons);
    }

    this.open = function (o) {
        options = {};
        options.txt = o.txt || '';
        options.onResult = o.onResult || null;
        options.title = o.title || '';
        txtNode.text(options.txt);
        options.buttons = o.buttons || {
            'Ok': function () {
                return true;
            },
            'Cancel': function () {
                return false;
            }
        };
        setDialogButtons(options.buttons);
        node.dialog('option', 'title', options.title);
        node.dialog('open');
    }

    this.close = function () {
        node.dialog('close');
    }
}

dialogNS.AskDialog = function (o) {
    var self = this;
    var parent = o.parent || null;
    var template =
         '<div class="rb-ask-dialog">'
            + '<div>'
            +   '<h3></h3>'
            + '</div>'
        + '</div>';
    this.options = null;
    this.close = function () {
        self.options = null;
        node.dialog('close');
    };
    var node = $(template);
    var header = $('h3', node);

    node = node.dialog({
        autoOpen: false,
        title: 'Question',
        width: 400,
        height: 230,
        modal: true,
    });

    this.open = function (o) {
        self.options = {};
        self.options.onAnswer = o.onAnswer || null;
        self.options.title = o.title || 'Question';
        self.options.question = o.question;
        self.options.answers = o.answers || [ 'Ok', 'Cancel' ];
        node.dialog('option', 'title', self.options.title);
        header.text(self.options.question);
        var buttons = {};
        $.each(self.options.answers, function (_, title) {
            buttons[title] = function () {
                self.options.onAnswer(title);
                self.close();
            };
        });
        node.dialog('option', 'buttons', buttons);
        node.dialog('open');
    };
};

dialogNS.PublishDialog = function (o) {
    var self = this;
    var parent = o.parent || null;
    var template =
        '<div class="rb-publish-dialog">'
            + '<p><strong>Caution: This operation will affect the real data entry process.</strong></p>'
            + '<ul>'
            +   '<li><input type="radio" name="rb_publish_measure" value="existing"> <div class="rb-inline-block">Using existing measure type: <div class="rb-top-margin"><select name="exist_measure_type"></select></div></div></li>'
            +   '<li><input type="radio" name="rb_publish_measure" value="new"> <div class="rb-inline-block">Create a new new measure type: <div class="rb-top-margin"><input name="new_measure_type" /></div></div></li>'
            + '</ul>'
        + '</div>';
    this.options = null;

    var node = $(template);
    var inputsMode = $('input[name=rb_publish_measure]', node);
    var inputExistMeasure = $('select[name=exist_measure_type]', node);
    var inputNewMeasure = $('input[name=new_measure_type]', node);
    var mode;

    console.log('inputExistMeasure', inputExistMeasure[0]);
    console.log('inputNewMeasure', inputNewMeasure[0]);

    this.setMode = function (newMode) {
        mode = newMode;
        if (mode === "existing") {
            inputExistMeasure.removeAttr('disabled');
            inputNewMeasure.attr('disabled', 'disabled');
        } else {
            inputExistMeasure.attr('disabled', 'disabled');
            inputNewMeasure.removeAttr('disabled');
        }
    };
    this.close = function () {
        self.options = null;
        inputNewMeasure.val('');
        inputExistMeasure.val('');
        self.stopInterval();
        node.dialog('close');
    };

    inputsMode.click(function () {
        self.setMode($(this).val());
    });

    this.onOk = function () {
        var measureType = (mode === "existing") ?
                                inputExistMeasure.val():
                                inputNewMeasure.val();
        if (measureType) {
            if (self.options.onSubmit) {
                var onSuccess = function () {
                    alert('Successfully published');
                    self.close();
                };
                var onError = function () {
                    alert('Error publishing form');
                };
                self.options.onSubmit(measureType, onSuccess, onError);
            }
            self.close();
        }
    };

    this.setMeasureTypes = function () {
        inputExistMeasure.children().remove();
        inputExistMeasure.append(
            $('<option>', {
                'text': '',
                'value': ''
            })
        );
        $.each(self.options.measureTypes, function (_, measureType) {
            inputExistMeasure.append(
                $('<option>', {
                    'text': measureType.id,
                    'value': measureType.id,
                    'selected': measureType['default']
                })
            );
        });
    };

    node = node.dialog({
        autoOpen: false,
        title: 'Instrument Publishing',
        width: 400,
        height: 300,
        modal: true,
        buttons: {
            'Ok': self.onOk,
            'Cancel': self.close
        }
    });


    var okBtn = node.parent().find("button:contains('Ok')");
    var okBtnTitle = okBtn.find('.ui-button-text');
    this.setButtonState = function (enabled) {
        if (enabled)
            okBtn.removeAttr('disabled')
               .removeClass('ui-state-disabled');
        else
            okBtn.attr('disabled', 'disabled')
               .addClass('ui-state-disabled');
    };

    var intervalId = null;
    var downCounter = 0;
    this.stopInterval = function () {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        downCounter = 0;
    };
    this.temporaryDisableOk = function () {
        self.stopInterval();
        self.setButtonState(false);
        downCounter = 10;
        okBtnTitle.text('Ok (' + downCounter + ')');
        intervalId = setInterval(function () {
            if (downCounter > 1) {
                --downCounter;
                okBtnTitle.text('Ok (' + downCounter + ')');
            } else {
                downCounter = 0;
                okBtnTitle.text('Ok');
                self.stopInterval();
                self.setButtonState(true);
            }
        }, 1000);
    };

    this.open = function (o) {
        o = o || {};
        self.options = {};
        self.options.baseMeasureType = o.baseMeasureType || '';
        self.options.onSubmit = o.onSubmit || null;
        self.options.measureTypes = o.measureTypes || [];
        self.setMeasureTypes();
        inputsMode.filter('[value=existing]').click();
        this.temporaryDisableOk();
        node.dialog('open');
    };

}

dialogNS.PromptDialog = function (o) {

    var self = this;
    var parent = o.parent || null;
    var template =
         '<div class="rb-prompt-dialog">'
            + '<div>'
            +   '<h3></h3>'
            +   '<input type="text" class="rb-prompt-input" />'
            + '</div>'
        + '</div>';
    this.options = null;

    this.close = function () {
        self.options = null;
        node.dialog('close');
    };

    var node = $(template);
    var input = $('input.rb-prompt-input', node);
    var header = $('h3', node);

    this.validate = function (value) {
        if (self.options.validate && !self.options.validate(value))
            return false;
        return true;
    };

    this.onOk = function () {
        var newValue = jQuery.trim(input.val());
        if (!self.validate(newValue)) {
            alert("Wrong input value!");
            return;
        }
        if (self.options.onSet)
            self.options.onSet(newValue);
        self.close();
    };

    node = node.dialog({
        autoOpen: false,
        title: 'Edit Group',
        width: 300,
        height: 230,
        modal: true,
        buttons: {
            'Ok': self.onOk,
            'Cancel': self.close
        }
    });

    this.open = function (o) {
        self.options = {};
        self.options.initialValue = o.initialValue || '';
        self.options.onSet = o.onSet || null;
        self.options.validate = o.validate || null;
        self.options.title = o.title || 'Edit Value';
        self.options.question = o.question || 'Please input value:';
        node.dialog('option', 'title', self.options.title);
        header.text(self.options.question);
        input.val(self.options.initialValue);
        node.dialog('open');
    };
}

dialogNS.CustomTitleDialog = function (o) {

    var self = this;
    var parent = o.parent || null;
    var template =
         '<div class="rb-custom-title-dialog">'
            + '<div>'
            +   '<h3></h3>'
            +   '<p>For:<br>'
            +      '<select class="rb-custom-title-type"></select>'
            +   '</p>'
            +   '<p>Text:<br>'
            +       '<input type="text" class="rb-custom-title-input" />'
            +   '</p>'
            + '</div>'
        + '</div>';
    this.options = null;

    this.close = function () {
        self.options = null;
        node.dialog('close');
    };

    var node = $(template);
    var input = $('input.rb-custom-title-input', node);
    var select = $('select.rb-custom-title-type', node);
    var header = $('h3', node);

    $.each(o.customTitleTypes, function (type, typeTitle) {
        select.append(
            $('<option>')
                .text(typeTitle)
                .attr('value', type)
        );
    });

    this.validate = function (type, text) {
        if (self.options.validate && !self.options.validate(type, text))
            return false;
        return true;
    };

    this.onOk = function () {
        var newText = jQuery.trim(input.val());
        var newType = jQuery.trim(select.val());
        if (!self.validate(newType, newText)) {
            alert("Wrong input title or such title type is already set!");
            return;
        }
        if (self.options.onSet)
            self.options.onSet(newType, newText);
        self.close();
    };

    node = node.dialog({
        autoOpen: false,
        title: 'Edit Custom Title',
        width: 300,
        height: 230,
        modal: true,
        buttons: {
            'Ok': self.onOk,
            'Cancel': self.close
        }
    });

    this.open = function (o) {
        self.options = {};
        self.options.initialText = o.initialText || '';
        self.options.initialType = o.initialType || builder.keys(o.customTitleTypes)[0];
        self.options.onSet = o.onSet || null;
        self.options.validate = o.validate || null;
        self.options.title = o.title || 'Edit Custom Title';
        self.options.question = o.question || 'Please input custom title details:';
        node.dialog('option', 'title', self.options.title);
        header.text(self.options.question);
        select.val(self.options.initialType);
        input.val(self.options.initialText);
        node.dialog('open');
    };
}


dialogNS.EditParamDialog = function (o) {

    var self = this;
    var template =
        '<div class="rb_edit_param_dialog">'
          + '<div>'
          +     'Set variable name:<br><input type="text" class="rb_edit_param_name" />'
          + '</div>'
          + '<div style="margin-top: 20px;">'
          +     'Type:<br>'
          +     '<select class="rb_select_param_type" >'
          +         '<option value="NUMBER">Number</option>'
          +         '<option value="STRING">String</option>'
          +         '<option value="DATE">Date</option>'
          +     '</select>'
          + '</div>'
      + '</div>';

    var node = null;
    var options = null;

    this.close = function () {
        options = null;
        node.dialog('close');
    }

    node = $(template);
    var nameInput = $('input.rb_edit_param_name', node);
    var typeInput = $('select.rb_select_param_type', node);

    /*
    if (o.extTypes) {
        for (var typeName in o.extTypes) {
            var typeDesc = o.extTypes[typeName];
            $('<option>', {
                value: typeName,
                text: typeDesc.title || typeName
            }).appendTo(typeInput);
        }
    }
    */

    this.onOk = function () {
        var newName = jQuery.trim(nameInput.val());
        var newType = typeInput.val();
        if (newName) {
            options.onChange(newName, newType);
            self.close();
        }
    }

    node = node.dialog({
        autoOpen: false,
        title: 'Declare External Variable',
        width: 300,
        height: 230,
        modal: true,
        buttons: {
            'Ok': self.onOk,
            'Cancel': self.close
        }
    });

    var onChange = function () {
        var val = nameInput.val();
        var newVal = val.replace(builder.illegalIdChars, '');
        if (newVal !== val)
            nameInput.val(newVal);
    };

    nameInput.change(onChange);
    nameInput.keyup(onChange);

    this.open = function (o) {
        options = {};
        // options.extTypes = o.extTypes || null;
        options.onChange = o.onChange || null;
        options.paramName = o.paramName || '';
        options.paramType = o.paramType || 'NUMBER';
        options.dialogTitle = o.dialogTitle || 'Declare External Variable';
        nameInput.val(options.paramName);
        typeInput.val(options.paramType);
        node.dialog('option', 'title', options.dialogTitle);
        node.dialog('open');
    };
}

dialogNS.ShowJSONDialog = function (o) {
    var node = null;
    var outputNode = null;
    var parent = o.parent || null;
    var template =
        '<div>'
          + '<div class="rb_json_text_wrap">'
          +     '<textarea class="rb_json_text" wrap="off" readonly="readonly"></textarea>'
          + '</div>'
      + '</div>';

    this.close = function () {
        node.dialog('close');
    }
    node = $(template).dialog({
        autoOpen: false,
        title: "Instrument's source",
        width: 600,
        height: 300,
        modal: true,
    });
    outputNode = $('textarea', node);
    this.open = function (jsonTxt) {
        outputNode.val(jsonTxt);
        node.dialog('open');
    };
}


dialogNS.BeforeTestDialog = function (o) {

    var self = this;
    var options = null;
    var parent = o.parent || null;
    var template =
        '<div class="before_test_dialog">'
          + '<h1>Please, set values for parameters to start a test:</h1>'
          + '<table class="before_test_parameters"></table>'
      + '</div>';

    this.close = function () {
        options = null;
        node.dialog('close');
    };

    this.onOk = function () {
        var paramDict = {};
        var valid = true;

        paramTable.find('tr').each(function () {
            if (!valid)
                return;
            var jRow = $(this);
            var paramName = jRow.attr('data-param');
            var param = options.inputParameters.find(paramName);
            var input = jRow.find('input,select');
            var value = jQuery.trim(input.val());

            if (value) {
                var realType = param.type;
                switch(realType) {
                case 'DATE':
                    var m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                    if (!m || !builder.isValidDate(m[1], m[2], m[3])) {
                        valid = false;
                        alert('Wrong value: date should be in the following format: YYYY-MM-DD.');
                        input.focus();
                        break;
                    }
                    paramDict[paramName] = value;
                    break;
                case 'NUMBER':
                    if (!builder.isValidNumeric(value, 'float')) {
                        valid = false;
                        alert('Wrong value: not a number!');
                        input.focus();
                        break;
                    }
                    paramDict[paramName] = value;
                    break;
                default:
                    paramDict[paramName] = value;
                }
            } else
                paramDict[paramName] = null;
            param.setTestValue(paramDict[paramName]);
        });

        if (valid) {
            if (options.callback)
                options.callback(paramDict);
            self.close();
        }
    }

    var node = $(template);
    var paramTable = $('.before_test_parameters', node);
    node = node.dialog({
        autoOpen: false,
        title: 'Set Input Parameters',
        width: 300,
        height: 230,
        modal: true,
        buttons: {
            'Ok': self.onOk,
            'Cancel': self.close
        }
    });

    this.open = function (o) {
        options = {};
        options.callback = o.callback || null;
        var inputParameters = options.inputParameters = o.inputParameters;
        paramTable.contents().remove();
        for (var idx in inputParameters.parameters) {
            var param = inputParameters.parameters[idx];
            var rowHTML = '<tr><td>'
                            + builder.escapeHTML(param.name) + '</td>'
                            + '<td class="rb_test_param_value"></td></tr>';
            var row = $(rowHTML);
            row.attr('data-param', param.name);
            var realType = param.type;
            var typeDesc;
            /*
            if (param.type !== 'NUMBER' &&
                param.type !== 'STRING' &&
                param.type !== 'DATE') {
                if (extTypes) {
                    typeDesc =
                        extTypes[param.type];
                    if (typeDesc && typeDesc.type === 'ENUM')
                        isScalar = false;
                    realType = typeDesc;
                }
            }
            */

            var paramValuePlace = row.find('.rb_test_param_value:first');
            var input = $('<input type="text" />');
            paramValuePlace.append(input);
            if (realType === "DATE") {
                input.datepicker({
                    dateFormat: 'yy-mm-dd'
                });
            }
            var value = param.getTestValue();
            if (value !== null)
                input.val(value);
            paramTable.append(row);
        }
        node.dialog('open');
    };
};


})();
