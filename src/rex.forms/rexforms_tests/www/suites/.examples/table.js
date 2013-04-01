module("table", {
    setup: function() {
        HTRAF.cache.individual = J.ind4;
        node().html('<table id="individual"></table>'); 
    }
});

test('basic', function() {
    node('table').widgetize().htrafProc('load');

    // check header
    size('table>thead', 1);
    size('table>thead>tr', 1);
    size('table>thead>tr>th', 8);

    text('table>thead>tr>th:eq(0)', 'id()');
    text('table>thead>tr>th:eq(2)', 'Family');
    text('table>thead>tr>th:last', 'Death Year-Mo');

    // check data
    var data = [
        [0, 0, 'test.01'],
        [0, 1, '01'],
        [0, 2, 'test'],
        [0, 3, 'Female'],
        [0, 4, ''],
        [0, 5, ''],
        [0, 6, ''],
        [0, 7, ''],
        [3, 0, 'test.04'],
        [3, 1, '04'],
        [3, 2, 'test'],
        [3, 3, 'Female'],
        [3, 4, 'test.01'],
        [3, 5, ''],
        [3, 6, ''],
        [3, 7, '']
    ]

    for(var i = 0, l = data.length; i < l; i++) {
        var s = 'table>tbody>tr:eq(' + data[i][0] + ')>td:eq(' + data[i][1] + ')';
        text(s, data[i][2]);
    }

    // check footer
    size('table>tfoot', 1);
});

test('selection', function() {
    var t = node('table').widgetize().htrafProc('load'),
        onlySelected = function(tr) {
            ok(tr.is('.htraf-selected') 
               && t.find('>tbody>tr.htraf-selected').size() == 1, 
               'class is set to the selected row only');
        };

    // initial selection 
    equal(t.val(), 'test.01', 'initial selection value is ok');
    var tr = t.find('>tbody>tr:eq(1)').click();
    onlySelected(tr);


    t.one('change', function() {
        ok(t.val() == 'test.02', 'correct value/change event');
    });
    var tr = t.find('>tbody>tr:eq(1)').click();
    onlySelected(tr);


    t.one('change', function() {
        ok(t.val() == 'test.03', 'correct value/change event');
    });
    tr = t.find('>tbody>tr:eq(2)').click();
    onlySelected(tr);
});

test('data-selectable="no"', function() {
    var t = node('table').attr('data-selectable', 'no').widgetize().htrafProc('load');
    equal(t.val(), null, 'initial value is null');
    equal(t.find('>tbody>tr.htraf-selected').size(), 0, 'no selected row');

    t.find('>tbody>tr:eq(2)').click();
    equal(t.val(), null, 'value is null');
    equal(t.find('>tbody>tr.htraf-selected').size(), 0, 'no selected row');
});

test('data-selection-class="selected"', function() {
    var t = node('table').attr('data-selection-class', 'selected')
                     .widgetize().htrafProc('load'),
        onlySelected = function(tr) {
            ok(tr.is('.selected') 
               && t.find('>tbody>tr.selected').size() == 1, 
               'class is set to the selected row only');
        };
    onlySelected(t.find('tbody>tr.selected'));

    t.find('>tbody>tr:eq(2)').click();
    ok(t.find('tbody>tr.selected').index() == 2, 'selected row properly');
    onlySelected(t.find('tbody>tr.selected'));
});

test('data-select-first="no"', function() {
    var t = node('table').attr('data-select-first', 'no')
                       .widgetize().htrafProc('load');

    equal(t.val(), null, 'initial value is null');
    equal(t.find('>tbody>tr.htraf-selected').size(), 0, 'no selected class is set');
});

test('data-hide-columns="0 2 7"', function() {
    var t = node('table').attr('data-hide-columns', '0 2 7')
                       .widgetize().htrafProc('load');
    equal(t.find('>thead>tr>th').size(), 5, '<thead> has 5 headers');
    equal(t.find('>tbody>tr:eq(0)>td').size(), 5, '<tbody> has 5 columns');

    var headers = ['Code', 'Sex', 'Mother', 'Father', 'Birth Year-Mo'];
    for(var i = 0, l = headers.length; i < l; i++)
        equal(t.find('>thead>tr>th:eq(' + i + ')').text(), headers[i], 
              'column #' + i + ', header is "' + headers[i] + '"');


    ok(t.find('>thead>tr>th:first').hasClass('first'), 'first header has "first" class');
    ok(t.find('>thead>tr>th:last').hasClass('last'), 'last header has "last" class');
    ok(t.find('>tbody>tr>td:first').hasClass('first'), 'first cell has "first" class');
    ok(t.find('>tbody>tr>td:last').hasClass('last'), 'last cell has "last" class');
    ok(t.find('>tfoot>tr>td:first').hasClass('first'), 'first cell has "first" class');
    ok(t.find('>tfoot>tr>td:last').hasClass('last'), 'last cell has "last" class');

});

test('data-extra-column="yes"', function() {
    var t = node('table').attr('data-extra-column', 'yes')
                       .widgetize().htrafProc('load');
    equal(t.find('>thead>tr>th').size(), 9, '<thead> has 5 headers');
    equal(t.find('>tbody>tr:eq(0)>td').size(), 9, '<tbody> has 5 columns');
    equal(t.find('>tfoot>tr>td').size(), 9, '<tfoot> has 5 columns');
});

