(function(QUnit) {

QUnit.extend(QUnit, {
    node: function(selector) {
        var node = $('#qunit-fixture');
        return selector ? node.find(selector):node;
    },

    size: function(selector, s, message) {
        var nodeSize = node(selector).size();
        return QUnit.equal(nodeSize, s, 
            message || '[size] ' + selector + '  =>  ' + nodeSize);
    },

    html: function(selector, s, message) {
        var nodeHtml = node(selector).html();
        return QUnit.equal(nodeHtml, s, 
            message || '[html] ' + selector + '  =>  ' + nodeHtml);
    },

    text: function(selector, s, message) {
        var nodeText = node(selector).text();
        return QUnit.equal(nodeText, s, 
            message || '[text] ' + selector + '  =>  ' + nodeText);
    },

    attr: function(selector, attr, value, message) {
        var node = QUnit.node(selector);

        return QUnit.equal(node.attr(attr), value, 
            message || '[attr] ' + selector + ' [@' + attr + ']  =>  ' + value);
    }
});

window.node = QUnit.node;
window.size = QUnit.size;
window.text = QUnit.text;
window.attr = QUnit.attr;
window.html = QUnit.html;

})(QUnit);
