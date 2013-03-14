module("basic", {
    setup: function() {
        node().append(getPageTemplate('basic'));
        console.log(node());
        window.rexFormsClient = createRexFormsClient({}, 'basic');
    }
});

test('created properly', function () {
    text('#basic_form_title', 'Test Form');
    text('#basic_page_title', 'First Test Page');
    html('#basic_page_introduction', 'Test <strong>Creole</strong>');
})
