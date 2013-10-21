from rex.web import Command, Parameter
from rex.core import MapVal
from webob import Response
from rex.validate import validate, make_assessment_schema, \
                         instrument_schema, meta_schema

class ValidateAssessment(Command):

    path = '/validate_assessment'

    parameters = [
        Parameter('instrument', MapVal()),
        Parameter('assessment', MapVal()),
    ]

    def render(self, req, instrument, assessment):
        assessment_schema = make_assessment_schema(instrument)
        validate(assessment_schema, assessment)
        return Response(body='OK')
