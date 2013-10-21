module('list', {
    setup: function() {
        HTRAF.cache.individual = J.ind4;
        node().html('<ul id="individual"></ul>');
    }
});

test('basic', function() {
    var ul = node('ul').widgetize().htrafProc('load');
    size('ul', 1);
    size('ul.htraf', 1);
    size('ul.htraf>li', 4);
    text('ul>li:eq(0)', '01');
    text('ul>li:eq(1)', '02');
    text('ul>li:eq(2)', '03');
    text('ul>li:eq(3)', '04');
});

test('selection', 6, function() {
    var ul = node('ul').widgetize().htrafProc('load'),
        onlySelected = function(li) {
            ok(li.is('.htraf-selected') 
               && ul.find('>li.htraf-selected').size() == 1, 
               'class is set to the selected item only');
        };

    onlySelected(ul.find('>li:eq(0)'));
    equal(ul.val(), 'test.01', 'value initially set');

    ul.one('change', function() {
        ok(ul.val() == 'test.02', 'correct value/change event');
    });
    var li = ul.find('>li:eq(1)').click();
    onlySelected(li);

    ul.one('change', function() {
        ok(ul.val() == 'test.03', 'correct value/change event');
    });
    var li = ul.find('>li:eq(2)').click();
    onlySelected(li);
});

test('data-selectable="no"', function() {
    var ul = node('ul').attr('data-selectable', 'no').widgetize().htrafProc('load');
    equal(ul.val(), null, 'initial value is null');
    equal(ul.find('>li.htraf-selected').size(), 0, 'no selected row');

    ul.find('>li:eq(2)').click();
    equal(ul.val(), null, 'value is null');
    equal(ul.find('>li.htraf-selected').size(), 0, 'no selected row');
});

test('data-selection-class="selected"', function() {
    var ul = node('ul').attr('data-selection-class', 'selected')
                     .widgetize().htrafProc('load'),
        onlySelected = function(li) {
            ok(li.is('.selected') 
               && ul.find('>li.selected').size() == 1, 
               'class is set to the selected item only');
        };
    onlySelected(ul.find('li.selected'));

    ul.find('>li:eq(2)').click();
    ok(ul.children('.selected').index() == 2, 'selected item properly');
    onlySelected(ul.find('>li.selected'));
});

test('data-select-first="no"', function() {
    var ul = node('ul').attr('data-select-first', 'no')
                     .widgetize().htrafProc('load');

    equal(ul.val(), null, 'initial value is null');
    equal(ul.find('>li.htraf-selected').size(), 0, 'no selected class is set');
});

module('list-template', {
    setup: function() {
        HTRAF.cache.individual = J.ind4;
        node().html(
            '<ul id="individual">'
            + '<li data-iterate>'
            + '<b data-field="id()"></b>'
            + '<span data-field="1"></span>'
            + '<em data-field="family"></em>'
            + '<div data-calc1="value: <%= code+$row[1]+\'.\'+$index %>"'
            + '     class="<% if ($index % 2) { %>even<% }else{ %>odd<%}%>"'
            + '     data-set-disabled-if="!mother"'
            + '     data-set-data-set-if="sex == \'female\'"'
            + '     data-field="mother">'
            + '</li></ul>'
        );
    }
});

test('basic check', function() {
    var ul = node('ul').widgetize().htrafProc('load'),
        li = function(index) {return $(ul.children()[index])};

    size('ul', 1);
    size('ul.htraf', 1);
    size('ul.htraf>li', 4);

    attr('ul>li:eq(0) div:eq(0)', 'data-calc1', "value: 0101.0");
    attr('ul>li:eq(1) div:eq(0)', 'data-calc1', "value: 0202.1");
    attr('ul>li:eq(2) div:eq(0)', 'data-calc1', "value: 0303.2");
    attr('ul>li:eq(3) div:eq(0)', 'data-calc1', "value: 0404.3");

    attr('ul>li:eq(0) div:eq(0)', 'class', "odd");
    attr('ul>li:eq(1) div:eq(0)', 'class', "even");
    attr('ul>li:eq(2) div:eq(0)', 'class', "odd");
    attr('ul>li:eq(3) div:eq(0)', 'class', "even");

    text('ul>li:eq(0) div:eq(0)', '');
    text('ul>li:eq(1) div:eq(0)', 'test.01');
});

// TODO: test nested
