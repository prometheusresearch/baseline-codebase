
module("require", {
    setup: function () {
        node().append(getPageTemplate('require'));
        window.rexFormsClient = createRexFormsClient({
        	formMeta: window.J['require'],
        	instrumentName: 'require',
        }, 'require');
        $(window.rexFormsClient).bind('rexforms:forwardError', function (event, eventRetData) {
        	eventRetData.cancel = true;
        	throw('ForwardError');
        });
    },
    teardown: function () {
		var questions = rexFormsClient.form.questions;
		$.each(questions, function (_, question) {
			question.setValue(null, false);
		});
        rexFormsClient.goToStart();
    }
});

function presetValues(val) {
	var questions = rexFormsClient.form.questions;

	if (val.testInteger === undefined)
		val.testInteger = 1;

	if (val.testFloat === undefined)
		val.testFloat = 1.1;

	if (val.testEnum === undefined)
		val.testEnum = 'var1';

	if (val.testString === undefined)
		val.testString = 'test';

	if (val.testDate === undefined)
		val.testDate = '2013-03-21';

	if (val.testDual === undefined)
		val.testDual = 25.1;

	if (val.testSet === undefined)
		val.testSet = {
			'var1':true,
			'var2':false,
			'var3':false
		};

	if (val.testRepGroup === undefined)
		val.testRepGroup = [
			{
				'non_required_item': 1,
				'required_item':2
			}
		];

	if (val.testReqRepGroup === undefined)
		val.testReqRepGroup = [
			{
				'non_required_item': 1,
				'required_item':2
			}
		];

	questions['test_integer'].setValue(val.testInteger, false);
	questions['test_float'].setValue(val.testFloat, false);
	questions['test_enum'].setValue(val.testEnum, false);
	questions['test_string'].setValue(val.testString, false);
	questions['test_date'].setValue(val.testDate, false);
	questions['test_dual'].setValue(val.testDual, false);
	questions['test_set'].setValue(val.testSet, false);
	questions['test_rep_group'].setValue(val.testRepGroup, false);
	questions['test_req_rep_group'].setValue(val.testReqRepGroup, false);
};

test('test integer', function () {
	var questions = rexFormsClient.form.questions;
	presetValues({
		testInteger: null
	});
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"empty required integer question blocks going forward"
	);

	questions['test_integer'].setValue(1, false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "Set integer question doesn't block to go forward");
});

test('test float', function () {
	var questions = rexFormsClient.form.questions;
	presetValues({
		testFloat: null
	});
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"empty required float question blocks going forward"
	);

	questions['test_float'].setValue(1, false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "Set float question doesn't block to go forward");
});

test('test enum', function () {
	var questions = rexFormsClient.form.questions;
	presetValues({
		testEnum: null
	});
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"empty required enum question blocks going forward"
	);

	questions['test_enum'].setValue('var2', false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "Set enum question doesn't block to go forward");
});

test('test string', function () {
	var questions = rexFormsClient.form.questions;
	presetValues({
		testString: null
	});
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"empty required string question blocks going forward"
	);

	questions['test_string'].setValue('test', false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "Set string question doesn't block to go forward");
});

test('test date', function () {
	var questions = rexFormsClient.form.questions;
	presetValues({
		testDate: null
	});
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"empty required date question blocks going forward"
	);

	questions['test_date'].setValue('2013-03-22', false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "Set date question doesn't block to go forward");
});

test('test dual', function () {
	var questions = rexFormsClient.form.questions;
	presetValues({
		testDual: null
	});
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"empty required dual question blocks going forward"
	);

	questions['test_dual'].setValue(25.1, false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "Set dual question doesn't block to go forward");
});

test('test repeating group', function () {
	var questions = rexFormsClient.form.questions;
	presetValues({
		testRepGroup: [
			{
				'non_required_item': 1,
				'required_item': null
			}
		]
	});
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"empty required attribute of non-required repeating group blocks going forward"
	);

	questions['test_rep_group'].setValue([
			{
				'non_required_item': 1,
				'required_item': 2
			}
		], false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "Set required attribute of non-required repeating group doesn't block to go forward");
});

test('test required repeating group', function () {
	var questions = rexFormsClient.form.questions;
	presetValues({
		testReqRepGroup: null
	});
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"null required repeating group blocks going forward"
	);

	questions['test_req_rep_group'].setValue([], false);
	throws(
		function () {
			rexFormsClient.nextPage();
		},
		/ForwardError/,
		"empty required repeating group still blocks going forward"
	);

	questions['test_req_rep_group'].setValue([
			{
				'non_required_item': 1,
				'required_item': 2
			}
		], false);
	rexFormsClient.nextPage();
	equal(rexFormsClient.currentPageIdx, 1, "Set required repeating group doesn't block to go forward");
});
