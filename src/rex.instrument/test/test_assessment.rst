********************
  Assessment Tests
********************

.. contents:: Table of Contents

    >>> import simplejson
    >>> from rex.instrument import Instrument, Assessment

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
    
    >>> assessment_data = {'instrument': 'i',
    ...                    'version': 1,
    ...                     'explanations': {},
    ...                     'annotations': {},
    ...                     'answers': {'1': '0'}}

    >>> assessment = Assessment(id="1", 
    ...                         instrument=instrument,
    ...                         data=assessment_data,
    ...                         status='in-progress',
    ...                         last_modified=None)

create assessment with improper data::

    >>> assessment = Assessment(id=1,
    ...                         instrument=instrument,
    ...                         data=assessment_data,
    ...                         status='in-progress',
    ...                         last_modified=None)
    Traceback (most recent call last):
        ...
        assert isinstance(id, (str, unicode))
    AssertionError

    >>> assessment = Assessment(id="1", 
    ...                         instrument='i',
    ...                         data=assessment_data,
    ...                         status='in-progress',
    ...                         last_modified=None)
    Traceback (most recent call last):
        ...
        assert isinstance(instrument, Instrument)
    AssertionError

    >>> assessment_data = {}
    >>> assessment = Assessment(id='1',
    ...                         instrument=instrument,
    ...                         data=assessment_data,
    ...                         status='in-progress',
    ...                         last_modified=None)
    Traceback (most recent call last):
        ...
    ValidationError: test '#/required' failed on '#':
      object lacks property 'annotations'


    >>> assessment_data['annotations'] = {}
    >>> assessment = Assessment(id='1',
    ...                         instrument=instrument,
    ...                         data=assessment_data,
    ...                         status='in-progress',
    ...                         last_modified=None)
    Traceback (most recent call last):
        ...
    ValidationError: test '#/required' failed on '#':
      object lacks property 'explanations'

    >>> assessment_data['explanations'] = {}
    >>> assessment = Assessment(id='1',
    ...                         instrument=instrument,
    ...                         data=assessment_data,
    ...                         status='in-progress',
    ...                         last_modified=None)
    Traceback (most recent call last):
        ...
    ValidationError: test '#/required' failed on '#':
      object lacks property 'answers'

    >>> assessment_data['answers'] = {'0': '2'}
    >>> assessment = Assessment(id='1',
    ...                         instrument=instrument,
    ...                         data=assessment_data,
    ...                         status='in-progress',
    ...                         last_modified=None)
    Traceback (most recent call last):
        ...
    ValidationError: test '#/properties/answers/additionalProperties' failed on '#/answers':
      object has unexpected property '0'

    >>> assessment_data['answers'] = {'1': '2'}
    >>> assessment = Assessment(id='1',
    ...                         instrument=instrument,
    ...                         data=assessment_data,
    ...                         status='in-progress',
    ...                         last_modified=None)
    Traceback (most recent call last):
        ...
    ValidationError: test '#/properties/answers/properties/1/enum' failed on '#/answers/1':
      value is not expected

    >>> assessment_data['answers'] = {'1': '0'}
    >>> assessment = Assessment(id='1',
    ...                         instrument=instrument,
    ...                         data=assessment_data,
    ...                         status='progressed',
    ...                         last_modified=None)

