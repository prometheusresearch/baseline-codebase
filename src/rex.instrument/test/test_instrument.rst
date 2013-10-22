********************
  Instrument Tests
********************

.. contents:: Table of Contents

    >>> import simplejson
    >>> from rex.instrument import Instrument

create instrument object::

    >>> instrument_json = {"title": "Test Instrument",
    ...                    "pages": [
    ...                     {"type": "page",
    ...                      "id": "Pg1",
    ...                      "questions": [
    ...                         {"disableIf": None,
    ...                          "required": False,
    ...                          "type": "enum",
    ...                          "name": "1",
    ...                          "title": "This is a non-required enum.",
    ...                          "answers": [
    ...                               {
    ...                                "code": "0",
    ...                                "title": "No"
    ...                               },
    ...                               {
    ...                                "code": "1",
    ...                                "title": "Yes"
    ...                               }]
    ...                         }]
    ...                     }]}
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))

    >>> instrument_data = {"title": "Test Instrument",
    ...                    "pages": [
    ...                     {"type": "page",
    ...                      "id": "Pg1",
    ...                      "questions": [
    ...                         {"disableIf": None,
    ...                          "required": False,
    ...                          "type": "enum",
    ...                          "name": "1",
    ...                          "title": "This is a non-required enum.",
    ...                          "answers": [
    ...                               {
    ...                                "code": "0",
    ...                                "title": "No"
    ...                               },
    ...                               {
    ...                                "code": "1",
    ...                                "title": "Yes"
    ...                               }]
    ...                         }]
    ...                     }]}
    >>> instrument = Instrument(id="i", version=1,
    ...                         data=instrument_data)

create instrument with improper data::

    >>> instrument = Instrument(id=1, version=1)
    Traceback (most recent call last):
        ...
        assert isinstance(id, (str, unicode))
    AssertionError

    >>> instrument = Instrument(id='i', version='#1')
    Traceback (most recent call last):
        ...
        assert isinstance(version, int)
    AssertionError

    >>> instrument = Instrument(id='i', version=1)
    Traceback (most recent call last):
        ...
    AssertionError: Only one of 'json' and 'data' parameters is expected

    >>> instrument = Instrument(id="i", version=1, 
    ...                         json=instrument_json,
    ...                         data=instrument_data)
    Traceback (most recent call last):
        ...
    AssertionError: Only one of 'json' and 'data' parameters is expected

    >>> instrument_json = {}
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/required' failed on '#':
      object lacks property 'title'

    >>> instrument_json["title"] = "Test Instrument"
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/required' failed on '#':
      object lacks property 'pages'

    >>> instrument_json["pages"] = ''
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/properties/pages/type' failed on '#/pages':
      array is expected

    >>> instrument_json["pages"] = []
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/properties/pages/minItems' failed on '#/pages':
      array has not enough elements; expected >= 1

    >>> instrument_json["pages"].append('page')
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/page/type' failed on '#/pages/0':
      object is expected

    >>> instrument_json['pages'][0] = {}
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/page/required' failed on '#/pages/0':
      object lacks property 'type'

    >>> page = instrument_json['pages'][0]
    >>> page['type'] = 'p'
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/page/properties/type/enum' failed on '#/pages/0/type':
      value is not expected

    >>> page['type'] = 'page'
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    KeyError: 'questions'

    >>> page['questions'] = ''
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/page/properties/questions/type' failed on '#/pages/0/questions':
      array is expected

    >>> question = []
    >>> page['questions'] = [question]
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/question/type' failed on '#/pages/0/questions/0':
      object is expected

    >>> question = {}
    >>> page['questions'] = [question]
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/question/anyOf' failed on '#/pages/0/questions/0':
      value failed all tests:
      test '#/definitions/question/anyOf/0/required' failed on '#/pages/0/questions/0':
        object lacks property 'type'
      test '#/definitions/question/anyOf/1/required' failed on '#/pages/0/questions/0':
        object lacks property 'type'
      test '#/definitions/question/anyOf/2/required' failed on '#/pages/0/questions/0':
        object lacks property 'type'
      test '#/definitions/question/anyOf/3/required' failed on '#/pages/0/questions/0':
        object lacks property 'type'
      test '#/definitions/question/anyOf/4/required' failed on '#/pages/0/questions/0':
        object lacks property 'type'

proper question types: "integer",
                       "float",
                       "weight",
                       "time_month",
                       "time_week",
                       "time_days",
                       "time_hours",
                       "time_minutes",
                       "string",
                       "text",
                       "date",
                       "enum",
                       "set",
                       "rep_group"

example of improper question type::

    >>> question = page['questions'][0]
    >>> question['type'] = 't1'
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/anyType/anyOf' failed on '#/pages/0/questions/0/type':
      value failed all tests:
      test '#/definitions/numericType/enum' failed on '#/pages/0/questions/0/type':
        value is not expected
      test '#/definitions/textType/enum' failed on '#/pages/0/questions/0/type':
        value is not expected
      test '#/definitions/dateType/enum' failed on '#/pages/0/questions/0/type':
        value is not expected
      test '#/definitions/choiceType/enum' failed on '#/pages/0/questions/0/type':
        value is not expected
      test '#/definitions/groupType/enum' failed on '#/pages/0/questions/0/type':
        value is not expected

    >>> question['type'] = 'date'
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/question/anyOf' failed on '#/pages/0/questions/0':
      value failed all tests:
      test '#/definitions/question/anyOf/0/required' failed on '#/pages/0/questions/0':
        object lacks property 'name'
      test '#/definitions/question/anyOf/1/required' failed on '#/pages/0/questions/0':
        object lacks property 'name'
      test '#/definitions/question/anyOf/2/required' failed on '#/pages/0/questions/0':
        object lacks property 'name'
      test '#/definitions/question/anyOf/3/required' failed on '#/pages/0/questions/0':
        object lacks property 'name'
      test '#/definitions/question/anyOf/4/required' failed on '#/pages/0/questions/0':
        object lacks property 'name'

    >>> question['name'] = 1
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/question/properties/name/type' failed on '#/pages/0/questions/0/name':
      string is expected

    >>> question['name'] = 'date'
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/question/anyOf' failed on '#/pages/0/questions/0':
      value failed all tests:
      test '#/definitions/question/anyOf/0/required' failed on '#/pages/0/questions/0':
        object lacks property 'title'
      test '#/definitions/question/anyOf/1/required' failed on '#/pages/0/questions/0':
        object lacks property 'title'
      test '#/definitions/question/anyOf/2/required' failed on '#/pages/0/questions/0':
        object lacks property 'title'
      test '#/definitions/question/anyOf/3/required' failed on '#/pages/0/questions/0':
        object lacks property 'title'
      test '#/definitions/question/anyOf/4/required' failed on '#/pages/0/questions/0':
        object lacks property 'title'

    >>> question['title'] = 'Date'
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))
    Traceback (most recent call last):
        ...
    ValidationError: test '#/definitions/question/anyOf' failed on '#/pages/0/questions/0':
      value failed all tests:
      test '#/definitions/question/anyOf/0/required' failed on '#/pages/0/questions/0':
        object lacks property 'required'
      test '#/definitions/question/anyOf/1/required' failed on '#/pages/0/questions/0':
        object lacks property 'required'
      test '#/definitions/question/anyOf/2/required' failed on '#/pages/0/questions/0':
        object lacks property 'required'
      test '#/definitions/question/anyOf/3/required' failed on '#/pages/0/questions/0':
        object lacks property 'required'
      test '#/definitions/question/anyOf/4/required' failed on '#/pages/0/questions/0':
        object lacks property 'required'

    >>> question['required'] = True
    >>> instrument = Instrument(id="i", version=1,
    ...                         json=simplejson.dumps(instrument_json))

