
import simplejson
import copy

from rex.core import Error

from rex.validate import make_assessment_schema, ValidationError, validate, \
                         instrument_schema

from htsql.core.domain import (BooleanDomain, IntegerDomain, DecimalDomain,
        TextDomain, DateDomain, DateTimeDomain, EnumDomain)
from htsql.core.syn.parse import parse
from htsql.core.error import Error as HtsqlError

BASE_INSTRUMENT_JSON = """\
{"title": null, "pages":[]}
"""


class Instrument(object):

    def __init__(self, id, version, json=None, data=None):
        assert isinstance(id, (str, unicode))
        assert isinstance(version, int)
        assert json is None and data is not None \
               or json is not None and data is None, \
               "Only one of 'json' and 'data' parameters is expected"
        if json is not None:
            assert isinstance(json, (str, unicode))
            self.json = json
            self.data = simplejson.loads(json)
        if data is not None:
            assert isinstance(data, dict)
            self.data = data
            self.json = simplejson.dumps(data, sort_keys=True)
        self.id = id
        self.version = version
        try:
            validate(instrument_schema, self.data)
        except ValidationError:
            print 'Instrument %s of version %s is incorrect' % (id, version) 
            raise
        self.assessment_schema = make_assessment_schema(self.data)

    def validate(self, data):
        validate(self.assessment_schema, data)


class Calculation(object):

    def __init__(self, question, parameters):
        self.name = question['name']
        self.define = {}
        for name in parameters:
            self.define[name] = 'null()'
        self.calculation = question['calculation'].replace(' ', '')
        if question['type'] in ['string', 'text']:
            self.domain = TextDomain()
        elif question['type'] in ['integer', 'time_month', 'time_week',
                                  'time_days', 'time_hours', 'time_minutes']:
            self.domain = IntegerDomain()
        elif question['type'] in ['float', 'weight']:
            self.domain = DecimalDomain()
        elif question['type'] == 'date':
            self.domain = DateDomain()
        elif question['type'] == 'datetime':
            self.domain = DateTimeDomain()
        elif question['type'] == 'enum':
            choices = [answer['code'] for answer in question['answers']]
            self.domain = EnumDomain(choices)
        else:
            raise Error('Unexpected question type:', question['type'])
        self.query = '/define(%(define)s).' + \
                     ('{%(name)s:=%(calculation)s}'
                      % {'name': self.name,
                         'calculation': self.calculation})
        self.check_query()

    def check_query(self):
        query = self.query \
                % {'define': ', '.join(['%s:=%s' % (k, v)
                                        for (k, v) in self.define.items()])}
        try:
            query = parse(query)
        except Exception, exc:
            raise Error('unable to parse calculation %s query:' % self.name,
                        query)

    def get_query(self, data={}):
        define = copy.deepcopy(self.define)
        for name in data:
            value = data[name]
            if isinstance(value, list):
                value = len(value)
            if value is None:
                continue
            if isinstance(value, (str, unicode)):
                value = "'%s'" % value.replace("'", "''")
            define[name] = value
        query = self.query \
                % {'define': ', '.join(['%s:=%s' % (k, v)
                                        for (k, v) in define.items()])}
        return query


def get_calculations(data):

    calculate_questions = []
    parameters = []

    def process_page(page):

        for page in page['pages']:
            if page['type'] == 'page':
                process_questions(page['questions'])
            else:
                process_page(page)

    def process_questions(questions):
        for question in questions:
            parameters.append(question['name'])
            if question['type'] == 'rep_group':
                continue
            if question.get('calculation'):
                calculate_questions.append(question)
    process_page(data)

    calculations = []

    for question in calculate_questions:
        name = question['name']
        calculations.append(Calculation(question, parameters))
    return calculations
