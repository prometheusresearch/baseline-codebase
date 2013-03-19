module("expressions", {
    setup: function () {
        node().append(getPageTemplate('basic'));
        window.rexFormsClient = createRexFormsClient({}, 'basic');
    },
    teardown: function () {
    	// cleanup questions
		var questions = rexFormsClient.form.questions;
		$.each(questions, function (_, question) {
			question.setValue(null, false);
		});
		rexFormsClient.goToPage(0);
    }
});

test('skip logic', function () {
	var questions = rexFormsClient.form.questions;
	var pages = rexFormsClient.form.pages;

	questions['test_integer'].setValue(null, false);
	questions['test_enum'].setValue(null, false);
	ok(!pages[3].skipped, "page unskip succeeds");

	questions['test_enum'].setValue('var1', false);
	ok(pages[3].skipped, "page skip succeeds");

	questions['test_enum'].setValue(null, false);
	questions['test_integer'].setValue(4, false);
	ok(pages[3].skipped, "nested page skip succeeds");
});

test('question expressions', function () {
	var questions = rexFormsClient.form.questions;

	questions['test_integer'].setValue(10, false);
	var isIncorrect = questions['test_integer'].isIncorrect();
	ok(isIncorrect, "question invalidating succeeds");
	questions['test_integer'].setValue(9, false);
	isIncorrect = questions['test_integer'].isIncorrect();
	ok(!isIncorrect, "question validating succeeds");

	questions['test_integer'].setValue(null, false);
	ok(!questions['test_integer_slave'].disabled, "enabled by integer succeeds");
	questions['test_integer'].setValue(6, false);
	ok(questions['test_integer_slave'].disabled, "disabled by integer succeeds");
});
