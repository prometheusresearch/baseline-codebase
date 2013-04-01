
var defaultAssessment = {
	answers: {
		'test_integer': 1,
		'test_float': 1.1,
		'test_enum': 'var1',
		'test_string': 'test string',
		'test_date': '2013-03-22',
		'test_dual': 25.1,
		'test_set_var1': true,
		'test_set_var2': false,
		'test_set_var3': true,
		'test_rep_group': [
			{
				'non_required_item': 1,
				'required_item':2
			},
			{
				'non_required_item': null,
				'required_item':3
			},
			{
				'non_required_item': 4,
				'required_item':null
			}
		]
	}
}

module("saving_loading", {
    setup: function () {
        node().append(getPageTemplate('saving_loading'));
        window.rexFormsClient = createRexFormsClient({
        	formMeta: window.J['save_load'],
        	instrumentName: 'save_load',
        	formData: defaultAssessment
        }, 'saving_loading');
    },
    teardown: function () {
		var questions = rexFormsClient.form.questions;
		$.each(questions, function (_, question) {
			question.setValue(null, false);
		});
        rexFormsClient.goToStart();
    }
});

test('test loading and saving', function () {
	var questions = rexFormsClient.form.questions;
	equal(questions['test_integer'].value, 1, 'value for the integer question is assigned correctly');
	equal(questions['test_float'].value, 1.1, 'value for the float question is assigned correctly');
	equal(questions['test_enum'].value, 'var1', 'value for the enum question is assigned correctly');
	equal(questions['test_string'].value, 'test string', 'value for the string question is assigned correctly');
	equal(questions['test_date'].value, '2013-03-22', 'value for the date question is assigned correctly');
	equal(questions['test_dual'].value, 25.1, 'value for the dual question is assigned correctly');
	var value = questions['test_set'].value;
	ok(value.var1 && !value.var2 && value.var3, 'value for the set question is assigned correctly')
	var value = questions['test_rep_group'].value;
	var hasThreeGroups = (value.length === 3);
	var firstIsCorrect = (value[0].non_required_item == 1 && value[0].required_item == 2);
	var secondIsCorrect = (value[1].non_required_item == null && value[1].required_item == 3);
	var thirdIsCorrect = (value[2].non_required_item == 4 && value[2].required_item == null);
	ok(hasThreeGroups && firstIsCorrect && secondIsCorrect && thirdIsCorrect, 'value for the repeating group question is assigned correctly');

	questions['test_integer'].setValue(2, false);
	questions['test_float'].setValue(2.1, false);
	questions['test_enum'].setValue('var2', false);
	questions['test_string'].setValue('new string', false);
	questions['test_date'].setValue('2013-03-23', false);
	questions['test_dual'].setValue(26.5, false);
	questions['test_set'].setValue({
		'var1': false,
		'var2': false,
		'var3': true
	}, false);
	questions['test_rep_group'].setValue([
		{
			'non_required_item': 6,
			'required_item':null
		},
		{
			'non_required_item': null,
			'required_item':7
		}
	], false);

	var answers = null;
	var validated = false;
	window.customSaveStateResponse = function (request, response) {
		var qs = parseQueryString(request.data);
		var data = $.parseJSON(qs['data']);
		answers = data.answers;

		var instrumentName = qs['form'];
		var instrument = $.toJSON(window.J[instrumentName]);
		var assessment = qs['data'];

		$.ajax({
			url: 'validate_assessment',
			data: 'instrument=' + encodeURIComponent(instrument) + '&'
				+ 'assessment=' + encodeURIComponent(assessment),
			dataType: 'text',
			success: function () {
				console.log('validation OK');
				validated = true;
			},
			error: function () {
				throw('validationError');
			},
			async: false,
			cache: false,
			type: 'POST'
		});

		response.responseText = '{"result":"true"}';
	}
	rexFormsClient.save(null, true);

	ok(validated, 'assessment passes schema validation');

	equal(answers['test_integer'], 2, 'value of the integer question was saved correctly');
	equal(answers['test_float'], 2.1, 'value of the float question was saved correctly');
	equal(answers['test_enum'], 'var2', 'value of the enum question was saved correctly');
	equal(answers['test_string'], 'new string', 'value of the string question was saved correctly');
	equal(answers['test_date'], '2013-03-23', 'value of the date question was saved correctly');
	ok(!answers['test_set_var1'] && !answers['test_set_var2'] && answers['test_set_var3'], 'value of the set question was saved correctly');

	value = answers['test_rep_group'];
	var hasTwoGroups = (value.length == 2);
	firstIsCorrect = (value[0].non_required_item == 6 && value[0].required_item == null);
	secondIsCorrect = (value[1].non_required_item == null && value[1].required_item == 7);
	ok(hasTwoGroups && firstIsCorrect && secondIsCorrect, 'value for the repeating group question was saved correctly');
});
