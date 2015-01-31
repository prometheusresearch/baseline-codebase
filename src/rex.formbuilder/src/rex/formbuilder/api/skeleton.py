#
# Copyright (c) 2014, Prometheus Research, LLC
#

import simplejson
import tempfile

from webob.exc import HTTPBadRequest

from rex.core import Error, BoolVal
from rex.instrument import ValidationError as InstrumentValidationError
# from rex.instrument.ctl import open_and_validate
from rex.forms import Form, ValidationError as FormValidationError
from rex.forms.ctl import InstrumentFormSkeleton
from rex.restful import RestfulLocation
from rex.web import Parameter
from .base import dump_pretty_yaml, payload_without_yaml


__all__ = (
    'InstrumentSkeleton',
)


class InstrumentSkeleton(RestfulLocation):

    path = '/api/skeleton'

    parameters = (
        Parameter('with_yaml', BoolVal(), False),
    )

    def create(self, request, with_yaml, **kwargs):
        try:
            payload = payload_without_yaml(request.payload)
            instrument_version = payload.get('instrument_version', {})
            with tempfile.NamedTemporaryFile() as inputfile:
                with tempfile.NamedTemporaryFile() as outputfile:
                    inputfile.write(simplejson.dumps(instrument_version['definition']))
                    inputfile.flush()
                    InstrumentFormSkeleton(definition=inputfile.name,
                                           localization="en",
                                           format="JSON",
                                           output=outputfile.name,
                                           pretty=False)()
                    form = simplejson.loads(outputfile.read())
        except (Error, InstrumentValidationError, FormValidationError) as exc:
            raise HTTPBadRequest(unicode(exc))
        except IOError as exc:
            raise HTTPBadRequest("Unable to create temporary files")
        if with_yaml:
            form = dump_pretty_yaml(form)
        return {
            'form': form
        }

    def retrieve(self, request, with_yaml, **kwargs):
        return {}

