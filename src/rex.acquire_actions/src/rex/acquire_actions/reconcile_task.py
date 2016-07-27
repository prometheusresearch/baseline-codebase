#
# Copyright (c) 2016, Prometheus Research, LLC
#

from webob.exc import HTTPBadRequest

from rex.action import typing
from rex.core import StrVal, MaybeVal
from rex.instrument import Entry, ParameterSupplier, InstrumentError
from rex.forms import PresentationAdaptor
from rex.widget import Field, responder, RequestURL

from .base import AcquireAction


__all__ = (
    'ReconcileTaskAction',
)


class ReconcileTaskAction(AcquireAction):
    name = 'task-reconcile'
    js_type = 'rex-acquire-actions/lib/ReconcileTask'

    entity = Field(
        typing.RowTypeVal(),
        doc='The record containing the Assessment.',
    )

    initial_channel = Field(
        MaybeVal(StrVal()),
        default=None,
        doc='The default channel to use when determining which Form to use to'
        ' display the Reconciler.',
    )

    def context(self):
        return (
            self.domain.record(self.entity),
            self.domain.record(),
        )

    @responder(url_type=RequestURL)
    def display_data(self, request):
        user = self.get_user(request)
        data = {
            'task': {},
            'instrument': {},
            'forms': {},
            'discrepancies': {},
            'entries': [],
            'parameters': {},
        }

        # Get the Task
        task_id = request.GET.get('task_id')
        if not task_id:
            raise HTTPBadRequest('Must specify task_id')
        task = user.get_object_by_uid(task_id, 'task')
        if not task:
            data['error'] = 'TASK_NOT_FOUND'
            return self.response_as_json(data)
        if not task.can_reconcile:
            data['error'] = 'CANT_RECONCILE'
            return self.response_as_json(data)
        data['task'] = task.as_dict()

        data['discrepancies'] = task.get_discrepancies()
        if not data['discrepancies']:
            data['error'] = 'NO_DISCREPANCIES'
            return self.response_as_json(data)

        data['instrument'] = task.assessment.instrument_version.definition
        data['parameters'] = ParameterSupplier.get_task_parameters(task)
        data['entries'] = [
            entry.as_dict()
            for entry in
            task.get_entries(type=Entry.TYPE_PRELIMINARY)
        ]

        # Find the Forms that can be used
        forms = user.find_objects(
            'form',
            'forms',
            instrument_version=task.assessment.instrument_version,
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
                        instrument_version=task.assessment.instrument_version,
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

    @responder(url_type=RequestURL)
    def reconcile_task(self, request):
        task_id = request.json.get('task_id')
        solution = request.json.get('data')
        if not task_id or not solution:
            raise HTTPBadRequest(
                'Must specify both task_id and data',
            )

        user = self.get_user(request)
        task = user.get_object_by_uid(task_id, 'task')
        if not task:
            raise HTTPBadRequest(
                'Specified task_id does not exist',
            )
        if not task.can_reconcile:
            response = {
                'status': 'ERROR',
                'details': 'Cannot reconcile specified task_id',
            }

        else:
            try:
                task.reconcile(user, solution)
            except InstrumentError as exc:
                response = {
                    'status': 'ERROR',
                    'details': exc.message,
                }
            else:
                response = {
                    'status': 'SUCCESS',
                }

        return self.response_as_json(response)

