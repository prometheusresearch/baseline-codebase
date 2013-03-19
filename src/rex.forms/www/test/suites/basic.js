module("basic", {
    setup: function () {
        node().append(getPageTemplate('basic'));
        window.rexFormsClient = createRexFormsClient({}, 'basic');
    },
    teardown: function () {
		var questions = rexFormsClient.form.questions;
		$.each(questions, function (_, question) {
			question.setValue(null, false);
		});
        rexFormsClient.goToPage(0);
    }
});

test('created properly', function () {
	equal(rexFormsClient.form.pages.length, 4, "all pages are created");
	equal(objSize(rexFormsClient.form.questions), 7, "all questions are created");
	equal(rexFormsClient.currentPageIdx, 0, "first page is current");
    text('#basic_form_title', 'Test Form');
    text('#basic_page_title', 'First Test Page');
    html('#basic_page_introduction', 'Test <strong>Creole</strong>');
});

test('moving through pages', function () {
	var questions = rexFormsClient.form.questions;

	questions['test_required'].setValue(null, false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 0, "step to next page is blocked due to missed required question");

	questions['test_required'].setValue(1, false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "step to next page succeeds");

	rexFormsClient.prevPage();
	equal(rexFormsClient.currentPageIdx, 0, "step back to previous page succeeds");
});

test('test integer question', function () {
	var questions = rexFormsClient.form.questions;

	throws(
		function () {
			questions['test_integer'].setValue(5.1, false);
		},
		/InvalidValue/,
		"setting float is not allowed"
	);

	throws(
		function () {
			questions['test_integer'].setValue('abc', false);
		},
		/InvalidValue/,
		"setting non-numeric value is not allowed"
	);

	questions['test_integer'].setValue(5, false);
	equal(questions['test_integer'].getValue(), 5, 'setting and getting value');

	var rexlValue = questions['test_integer'].getRexlValue();
	equal(rexlValue.value, 5, "right rexl value");

	ok(!questions['test_integer'].isIncorrect(), 'is correct');

	var editNode = questions['test_integer'].edit();
	var input = editNode.find('.rf-question-answers input');
	equal(input.size(), 1, 'edit node of integer has input element');

	input.val('1.1');
	input.change();
	ok(questions['test_integer'].isIncorrect(), 'floats are not allowed');

	input.val('a');
	input.change();
	ok(questions['test_integer'].isIncorrect(), 'non-numeric numbers are not allowed');

	input.val('9');
	input.change();
	ok(!questions['test_integer'].isIncorrect(), 'numeric numbers are acceptable');

    equal(questions['test_integer'].getValue(), 9, 'extracting value succeeds');
});

test('test float question', function () {
	var questions = rexFormsClient.form.questions;

	throws(
		function () {
			questions['test_float'].setValue('abc', false);
		},
		/InvalidValue/,
		"setting non-numeric value is not allowed"
	);

	questions['test_float'].setValue(5.1, false);
	equal(questions['test_float'].getValue(), 5.1, 'setting and getting value');

	var rexlValue = questions['test_float'].getRexlValue();
	equal(rexlValue.value, 5.1, "right rexl value");

	ok(!questions['test_float'].isIncorrect(), 'is correct');

	var editNode = questions['test_float'].edit();
	var input = editNode.find('.rf-question-answers input');
	equal(input.size(), 1, 'edit node of float has input element');

	input.val('a');
	input.change();
	ok(questions['test_float'].isIncorrect(), 'non-numeric numbers are not allowed');

	input.val('9');
	input.change();
	ok(!questions['test_float'].isIncorrect(), 'intger numbers are acceptable');

	input.val('1.1');
	input.change();
	ok(!questions['test_float'].isIncorrect(), 'floats are acceptable');

    equal(questions['test_float'].getValue(), 1.1, 'extracting value succeeds');
});

test('test string question', function () {
	var questions = rexFormsClient.form.questions;

	throws(
		function () {
			questions['test_string'].setValue(1, false);
		},
		/InvalidValue/,
		"setting non-string value is not allowed"
	);

	questions['test_string'].setValue('Test string', false);
	equal(questions['test_string'].getValue(), 'Test string', 'setting and getting value');

	var rexlValue = questions['test_string'].getRexlValue();
	equal(rexlValue.value, 'Test string', "right rexl value");

	ok(!questions['test_string'].isIncorrect(), 'is correct');

	var editNode = questions['test_string'].edit();
	var input = editNode.find('.rf-question-answers input').add('.rf-question-answers textarea');
	equal(input.size(), 1, 'edit node of string has input element');

	input.val('  should be trimmed   ');
	input.change();
	ok(!questions['test_string'].isIncorrect(), 'string is acceptable');

    equal(questions['test_string'].getValue(), 'should be trimmed', 'extracting and trimming value succeeds');
});

test('test enum question', function () {
	var questions = rexFormsClient.form.questions;

	throws(
		function () {
			questions['test_enum'].setValue('var4', false);
		},
		/InvalidValue/,
		"enum should accept only valid variant as its value"
	);

	questions['test_enum'].setValue('var1', false);
	equal(questions['test_enum'].getValue(), 'var1', 'setting and getting value');

	var rexlValue = questions['test_enum'].getRexlValue();
	equal(rexlValue.value, 'var1', "right rexl value");
	ok(!questions['test_enum'].isIncorrect(), 'is correct');

	var editNode = questions['test_enum'].edit();
	var input = editNode.find('.rf-question-answers input[type=radio]');
	equal(input.size(), 3, 'edit node of enum has input elements: one for each variant');

	input.removeAttr('checked');
	input.filter('[value=var3]').attr('checked', 'checked').change();
	ok(!questions['test_enum'].isIncorrect(), 'another variant is acceptable');

    equal(questions['test_enum'].getValue(), 'var3', 'extracting value succeeds');
});

test('test set question', function () {
	var questions = rexFormsClient.form.questions;

	throws(
		function () {
			questions['test_set'].setValue({'var4':true}, false);
		},
		/InvalidValue/,
		"set should accept only valid variants"
	);

	questions['test_set'].setValue({'var1':false, 'var2':true, 'var3':true}, false);
	var value = questions['test_set'].getValue();
	ok(!value.var1 && value.var2 && value.var3, 'setting and getting value');

	var rexlValue = questions['test_set'].getRexlValue();
	equal(rexlValue.value, 2, "right common rexl value");

	rexlValue = questions['test_set'].getRexlValue(['var2']);
	equal(rexlValue.value, true, "right attribute rexl value");

	ok(!questions['test_set'].isIncorrect(), 'is correct');

	var editNode = questions['test_set'].edit();
	var input = editNode.find('.rf-question-answers input[type=checkbox]');
	questions['test_set'].setValue(null, false);
	equal(input.size(), 3, 'edit node of set has input elements: one for each variant');

	input.filter('[value=var1]').attr('checked', 'checked');
	input.filter('[value=var3]').attr('checked', 'checked').change();
	ok(!questions['test_string'].isIncorrect(), 'choosing variants is acceptable');

	var value = questions['test_set'].getValue();
	ok(value.var1 && !value.var2 && value.var3, 'extracting value succeeds');
});
