
(function () {

var builderNS = $.RexFormsBuilder = $.RexFormsBuilder || {};
var dialogNS = builderNS.dialog = {};

dialogNS.QuestionDialog = function () {

    var template =
            '<div>'
              + '<div class="rb-question-dialog-text"></div>'
          + '</div>';

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

    function setDialogButtons(buttons) {
        var optButtons = {};
        for (var btnName in buttons) {
            var f = function () {
                var callee = arguments.callee;
                retValue = buttons[callee.btnName]();
                closeDialog();
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

})();
