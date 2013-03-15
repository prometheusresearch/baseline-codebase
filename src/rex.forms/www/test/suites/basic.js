module("basic", {
    setup: function () {
        node().append(getPageTemplate('basic'));
        console.log(node());
        window.rexFormsClient = createRexFormsClient({}, 'basic');
    },
    teardown: function () {
        rexFormsClient.goToPage(0);
    }
});

test('created properly', function () {
	equal(rexFormsClient.form.pages.length, 3, "all pages are created");
	equal(objSize(rexFormsClient.form.questions), 3, "all questions are created");
	equal(rexFormsClient.currentPageIdx, 0, "first page is current");
    text('#basic_form_title', 'Test Form');
    text('#basic_page_title', 'First Test Page');
    html('#basic_page_introduction', 'Test <strong>Creole</strong>');
});

test('moving through pages', function () {
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "step to next page succeeds");
	rexFormsClient.prevPage();
	equal(rexFormsClient.currentPageIdx, 0, "step back to previous page succeeds");
});
