*****************
CalculationMethod
*****************


Set up the environment::

    >>> from pprint import pprint
    >>> from rex.core import Rex
    >>> rex = Rex('rex.instrument_demo')
    >>> rex.on()
    >>> from rex.instrument.interface.calculationmethod import *
    >>> from rex.instrument.util import get_implementation
    >>> assessment_impl = get_implementation('assessment')
    >>> assessment = assessment_impl.get_by_uid('assessment8')
    >>> assessment
    DemoAssessment('assessment8', DemoSubject('subject1'), DemoInstrumentVersion('calculation2', DemoInstrument('calculation-complex', 'Calculation Instrument'), 1))


The base class has a method named ``flatten_assessment_data()`` that will
create a simple dictionary containing the Assessment's values so that they can
be easily delivered to the calculation method internals::

    >>> method = CalculationMethod()
    >>> pprint(method.flatten_assessment_data(assessment.data, assessment.instrument_version.definition))
    {'q_boolean': None,
     'q_date': datetime.date(2014, 5, 22),
     'q_enumeration': 'myenum',
     'q_enumerationset': ['white', 'black'],
     'q_float': 1.23,
     'q_integer': 1,
     'q_matrix': {'row1': {'column1': 42, 'column2': 'hello'},
                  'row2': {'column1': 63, 'column2': 'goodbye'}},
     'q_recordlist': [{'goodbye': 'see ya', 'hello': 'hi'},
                      {'goodbye': 'later', 'hello': 'yo'}],
     'q_text': 'foobar',
     'q_time': datetime.time(12, 34, 56)}


The HTSQL implementation extends this method by removing ``recordList`` fields
(they're not supported) and flattening ``matrix`` fields into a field for each
cell::

    >>> method = HtsqlCalculationMethod()
    >>> pprint(method.flatten_assessment_data(assessment.data, assessment.instrument_version.definition))
    {'q_boolean': None,
     'q_date': datetime.date(2014, 5, 22),
     'q_enumeration': 'myenum',
     'q_enumerationset': ['white', 'black'],
     'q_float': 1.23,
     'q_integer': 1,
     'q_matrix_row1_column1': 42,
     'q_matrix_row1_column2': 'hello',
     'q_matrix_row2_column1': 63,
     'q_matrix_row2_column2': 'goodbye',
     'q_text': 'foobar',
     'q_time': datetime.time(12, 34, 56)}



    >>> rex.off()

