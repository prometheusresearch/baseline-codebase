module("grid", {
    setup: function() {
        HTRAF.cache.individual = J.ind4;
        node().html('<div id="individual" data-widget="grid" style="width: 600; height: 200;"></div>'); 
    }
});

test('renders properly', function() {
    node('>div:eq(0)').widgetize().htrafProc('load');

    // check header
    size('thead', 1);
    size('thead>tr', 1);
    size('thead>tr>th', 8);
    text('thead>tr>th:eq(0)', 'id()');
    text('thead>tr>th:eq(2)', 'Family');
    text('thead>tr>th:last', 'Death Year-Mo');


    // check data
    size('tbody', 1);

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

    // check that there is no more data
    equal(node('>div').data('grid').hasMoreData, false, 'has no more data');
});

test('selection', function() {
    var g = node('>div').widgetize().htrafProc('load'),
        onlySelected = function(tr) {
            ok(tr.is('.htraf-selected') 
               && g.find('tbody>tr.htraf-selected').size() == 1, 
               'class is set to the selected row only');
        };

    // initial selection 
    equal(g.val(), 'test.01', 'initial selection value is ok');
    var tr = g.find('tbody>tr:eq(1)').click();
    onlySelected(tr);

    g.one('change', function() {
        ok(g.val() == 'test.02', 'correct value/change event');
    });
    var tr = g.find('tbody>tr:eq(1)').click();
    onlySelected(tr);


    g.one('change', function() {
        ok(g.val() == 'test.03', 'correct value/change event');
    });
    tr = g.find('tbody>tr:eq(2)').click();
    onlySelected(tr);


    g.val('test.04');
    equal(g.val(), 'test.04', 'grid value is ok');
    equal(g.find('table:eq(1)').val(), 'test.04', 'underlying table value is ok');
    onlySelected(g.find('tbody>tr:eq(3)'));
});

test('data-selectable="no"', function() {
    var g = node('>div').attr('data-selectable', 'no').widgetize().htrafProc('load');
    equal(g.val(), null, 'initial value is null');
    equal(g.find('tbody>tr.htraf-selected').size(), 0, 'no selected row');

    g.find('tbody>tr:eq(2)').click();
    equal(g.val(), null, 'value is null');
    equal(g.find('tbody>tr.htraf-selected').size(), 0, 'no selected row');
});

test('basic-width-check', function() {
    var g = node('>div').widgetize().htrafProc('load');
    equal(g.find('table:eq(0)').outerWidth(), 
          g.find('table:eq(1)').outerWidth(),
          'tables have equal width');
    ok(g.find('table:eq(0)').outerWidth() < g.innerWidth(),
       'place for scroll is ok');
});

module("grid-column-width", {
    setup: function() {
        HTRAF.cache.individual = J.ind4;
        node().html('<div id="individual" data-widget="grid" style="width: 600; height: 200;"></div>'); 

        $.htraf.util._getScrollWidth = $.htraf.util.getScrollWidth;
        $.htraf.util.getScrollWidth = function() {return 0};

        this.testWidth = function(attr, expect) {
            var g  = node('>div').attr('data-columns-width', attr)
                               .widgetize().htrafProc('load');
            var config = g.htrafFunc('getColumnConfig'),
                         thead = [], tbody = [];
            deepEqual(config, expect, 'getColumnConfig is ok');
            node('thead>tr>th').each(function() {
                thead.push($(this).outerWidth());
            });
            deepEqual(thead, expect, 'thead is ok');
            node('tbody>tr:eq(0)>td').each(function() {
                tbody.push($(this).outerWidth());
            });
            deepEqual(tbody, expect, 'tbody is ok');
        };

        this.testWidthNoFillSpace = function(attr, expect, colWidth) {
            if(colWidth)
                node('>div').attr('data-default-column-width', colWidth + '');
            node('>div').attr('data-fill-space', 'no');
            this.testWidth(attr, expect);
        }
    },

    teardown: function() {
        $.htraf.util.getScrollWidth = $.htraf.util._getScrollWidth;
        delete $.htraf.util['_getScrollWidth'];
    }
})

test('default configuration', function() {
    this.testWidth('', [75, 75, 75, 75, 75, 75, 75, 75]);
});

test('data-columns-width="*2 *2"', function() {
    this.testWidth('*2 *2', [120, 120, 60, 60, 60, 60, 60, 60]);
});

test('data-columns-width="* * *0.5"', function() {
    this.testWidth('* * *0.5', [80, 80, 40, 80, 80, 80, 80, 80]);
});

test('data-columns-width="100 * 50% *2 *2"', function() {
    this.testWidth('100 * 50% *2 *2', [100, 25, 300, 50, 50, 25, 25, 25]);
});

test('data-fill-space="no"', function() {
    this.testWidthNoFillSpace('', [80, 80, 80, 80, 80, 80, 80, 80]);
});

test('data-fill-space="no" data-default-column-width="50"', function() {
    this.testWidthNoFillSpace('', [50, 50, 50, 50, 50, 50, 50, 50], 50);
});

test('data-fill-space="no" data-columns-width="*2 *2"', function() {
    this.testWidthNoFillSpace('*2 *2', [160, 160, 80, 80, 80, 80, 80, 80]);
});

test('data-fill-space="no" data-columns-width="* * *0.25"', function() {
    this.testWidthNoFillSpace('* * *0.25', [80, 80, 20, 80, 80, 80, 80, 80]);
});

test('data-fill-space="no" data-columns-width="100 * 50% *2 *2"', function() {
    this.testWidthNoFillSpace('100 * 50% *2 *2', [100, 80, 300, 160, 160, 80, 80, 80]);
});

test('horizontal scroll check', function() {
    this.testWidthNoFillSpace('100 * 50% *2 *2', [100, 80, 300, 160, 160, 80, 80, 80]);
    var body = node('>div').children(':eq(1)'),
        header = node('>div').children(':eq(0)').find('table');

    equal(body.scrollLeft(), -header.css('marginLeft').replace('px',''), 
          'initial position is equal');
    body.scrollLeft(50);
    stop();
    setTimeout(function() {
        start(); 
        equal(body.scrollLeft(), -header.css('marginLeft').replace('px',''), 
              'position is equal');
    }, 700);
});

module("grid-partial-load", {
    setup: function() {
        node().html('<form id="individual"'
                  + ' data-htsql="/individual"'
                  + '></form>'); 
    }
});

/*
test('vertical scroll check', function() {
    node('form').widgetize().htrafProc('load');
    stop();
});
*/

