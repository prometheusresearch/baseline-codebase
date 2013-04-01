
from webob import Response
from rexrunner.command import Command
from rexrunner.registry import register_command
from rex.validate import validate, make_assessment_schema, instrument_schema, meta_schema
import simplejson

@register_command
class ValidateAssessment(Command):

    name = '/validate_assessment'

    def render(self, req):
        instrument = simplejson.loads(req.POST.get('instrument'))
        assessment_schema = make_assessment_schema(instrument)
        assessment = simplejson.loads(req.POST.get('assessment'))
        validate(assessment_schema, assessment)
        return Response(body='OK')
