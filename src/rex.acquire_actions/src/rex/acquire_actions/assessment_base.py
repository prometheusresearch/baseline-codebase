#
# Copyright (c) 2016, Prometheus Research, LLC
#

from webob.exc import HTTPBadRequest, HTTPForbidden, HTTPNotFound

from rex.core import StrVal, MaybeVal
from rex.instrument import User, Assessment, ParameterSupplier
from rex.forms import PresentationAdaptor
from rex.web import authenticate
from rex.widget import responder, RequestURL, Field

from .base import AcquireAction


__all__ = (
    'AssessmentAction',
)


class AssessmentAction(AcquireAction):
    initial_channel = Field(
        MaybeVal(StrVal()),
        default=None,
        doc='The default channel to use when determining which Form to use to'
        ' display the Assessment.',
    )

    @responder(url_type=RequestURL)
    def display_data(self, request):
        user = self.get_user(request)
        data = {
            'assessment': {},
            'instrument': {},
            'forms': {},
            'parameters': {},
            'calculation_results': {},
        }

        # Get the Assessment
        assessment_id = request.GET.get('assessment_id')
        if not assessment_id:
            raise HTTPBadRequest('Must specify assessment_id')
        assessment = user.get_object_by_uid(assessment_id, 'assessment')
        if not assessment:
            data['error'] = 'ASSESSMENT_NOT_FOUND'
            return self.response_as_json(data)
        if not assessment.is_done:
            data['error'] = 'ASSESSMENT_NOT_COMPLETE'
            return self.response_as_json(data)
        data['assessment'] = assessment.data
        data['instrument'] = assessment.instrument_version.definition

        # Find any calculation results
        results = user.find_objects(
            'resultset',
            assessment=assessment.uid,
            limit=1,
        )
        if results and results[0].results:
            data['calculation_results'] = results[0].results

        # Determine any parameters
        tasks = user.find_objects(
            'task',
            assessment=assessment.uid,
        )
        if tasks:
            data['parameters'] = ParameterSupplier.get_task_parameters(
                tasks[0],
            )

        # Find the Forms that can be used
        forms = user.find_objects(
            'form',
            'forms',
            instrument_version=assessment.instrument_version,
        )
        if not forms:
            try:
                import rex.mobile
            except ImportError:
                pass
            else:
                try:
                    interactions = user.find_objects(
                        'interaction',
                        'mobile',
                        instrument_version=assessment.instrument_version,
                    )
                except NotImplementedError:
                    pass
                else:
                    for interaction in interactions:
                        # Forcefully duck-type the Interaction into a Form
                        interaction.adapted_configuration = \
                            PresentationAdaptor.adapt_form(
                                interaction.channel,
                                interaction.instrument_version.definition,
                                interaction.form_configuration,
                            )
                    forms = interactions
        if not forms:
            data['error'] = 'NO_FORMS'
        else:
            data['forms'] = dict(
                [(f.channel.uid, f.adapted_configuration) for f in forms]
            )

        return self.response_as_json(data)

