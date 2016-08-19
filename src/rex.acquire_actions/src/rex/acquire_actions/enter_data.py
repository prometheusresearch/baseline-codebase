#
# Copyright (c) 2016, Prometheus Research, LLC
#

import json

from webob.exc import HTTPBadRequest, HTTPNotFound

from rex.core import StrVal, BoolVal
from rex.instrument import Entry, ParameterSupplier, CalculationSet
from rex.forms import Form
from rex.forms.util import preview_calculation_results
from rex.widget import Field, responder, RequestURL, FormFieldsetVal

from .base import AcquireEntityAction


__all__ = (
    'EnterDataAction',
)


class EnterDataAction(AcquireEntityAction):
    name = 'task-enter-data'
    js_type = 'rex-acquire-actions/lib/EnterData'

    channel = Field(
        StrVal(),
        doc='The RexAcquire Channel to use when deciding which Form to display'
        ' to the User.',
    )

    entry_fields = Field(
        FormFieldsetVal(),
        default=None,
        doc='The fields of the Entry object to display'
    )

    show_calculations = Field(
        BoolVal(),
        default=True,
        doc='Whether or not to allow calculation previews.',
    )

    allow_concurrent_entries = Field(
        BoolVal(),
        default=True,
        doc='Whether or not to allow the user to start a new Entry while a'
        ' previous entry is still in-progress.',
    )

    def __init__(self, **values):
        super(AcquireEntityAction, self).__init__(**values)
        if not self.entry_fields:
            self.entry_fields = FormFieldsetVal().parse("""
            - value_key: ordinal
              label: 'Entry #'
            - value_key: status
              label: Status
            - value_key: created_by
              label: Started By
            - value_key: date_modified
              label: Last Modified
            """)

    def context(self):
        return (
            self.domain.record(self.entity),
            self.domain.record(),
        )

    def get_task(self, request):
        user = self.get_user(request)
        task_id = request.GET.get('task_id') or request.json.get('task_id')
        if not task_id:
            raise HTTPBadRequest('Must specify task_id')
        return user.get_object_by_uid(task_id, 'task')

    def get_entry(self, request, task):
        entry_id = request.GET.get('entry_id') or request.json.get('entry_id')
        if not entry_id:
            raise HTTPBadRequest('Must specify entry_id')
        entries = [
            entry
            for entry in task.get_entries(type=Entry.TYPE_PRELIMINARY)
            if entry.uid == entry_id
        ]
        return entries[0] if entries else None

    @responder(url_type=RequestURL)
    def entry_selection(self, request):
        data = {}

        # Get the Task
        task = self.get_task(request)
        if not task:
            data['error'] = 'TASK_NOT_FOUND'
            return self.response_as_json(data)

        # Get the Entries
        data['entries'] = [
            entry.as_dict()
            for entry in
            task.get_entries(type=Entry.TYPE_PRELIMINARY)
        ]
        data['num_required_entries'] = task.num_required_entries

        return self.response_as_json(data)

    @responder(url_type=RequestURL)
    def retrieve_entry(self, request):
        user = self.get_user(request)
        data = {}

        # Get the Channel
        channel = user.get_object_by_uid(self.channel, 'channel')
        if not channel:
            data['error'] = 'CHANNEL_NOT_FOUND'
            return self.response_as_json(data)

        # Get the Task
        task = self.get_task(request)
        if not task:
            data['error'] = 'TASK_NOT_FOUND'
            return self.response_as_json(data)
        data['task'] = task.as_dict()

        # Get the Entry
        entry = None
        entry_id = request.json.get('entry_id')
        if entry_id == 'NEW':
            if task.can_enter_data:
                entry = task.start_entry(user)
            else:
                data['error'] = 'CANNOT_START_ENTRY'
                return self.response_as_json(data)
        else:
            entry = self.get_entry(request, task)
        if not entry:
            data['error'] = 'ENTRY_NOT_FOUND'
            return self.response_as_json(data)
        data['entry'] = entry.as_dict()

        # Get the Form
        form = Form.get_implementation().get_for_task(
            task,
            channel,
            user=user,
        )
        if not form:
            data['error'] = 'FORM_NOT_FOUND'
            return self.response_as_json(data)
        data['form'] = form.adapted_configuration

        # Check for Calculations
        calculationset = CalculationSet.get_implementation().find(
            instrument_version=entry.assessment.instrument_version.uid,
            limit=1,
        )
        data['has_calculations'] = len(calculationset) > 0

        data['assessment'] = entry.data or {}
        data['instrument'] = entry.assessment.instrument_version.definition
        data['parameters'] = ParameterSupplier.get_task_parameters(task)

        return self.response_as_json(data)

    @responder(url_type=RequestURL)
    def save_entry(self, request):
        user = self.get_user(request)
        data = {}

        # Get the Task
        task = self.get_task(request)
        if not task:
            data['error'] = 'TASK_NOT_FOUND'
            return self.response_as_json(data)

        # Get the Entry
        entry = self.get_entry(request, task)
        if not entry:
            data['error'] = 'ENTRY_NOT_FOUND'
            return self.response_as_json(data)

        entry_data = request.json.get('data')
        if not entry_data:
            raise HTTPBadRequest('Must specify data')

        if task.is_done or entry.is_done:
            data['error'] = 'ALREADY_DONE'
            return self.response_as_json(data)

        # Update the Entry
        entry.data = entry_data
        entry.modify(user)
        entry.set_application_token('rex.acquire_actions')
        entry.save()

        # Complete the Task if possible
        is_complete = request.json.get('complete', False)
        if is_complete:
            task.complete_entry(entry, user)
            if task.can_reconcile:
                if not task.get_discrepancies():
                    task.reconcile(user)

        return self.response_as_json(data)

    @responder(url_type=RequestURL)
    def execute_calculations(self, request):
        # Get the Task
        task = self.get_task(request)
        if not task:
            raise HTTPNotFound()

        # Parse the Assessment Data
        try:
            assessment_data = json.loads(request.POST.get('data', '{}'))
        except ValueError as exc:
            raise HTTPBadRequest(exc.message)

        if task.assessment:
            assessment = task.assessment
            instrument_version = task.assessment.instrument_version
        else:
            assessment = None
            instrument_version = task.instrument_version

        data = {}
        data['results'] = preview_calculation_results(
            instrument_version,
            instrument_version.calculation_set,
            assessment_data,
            assessment=assessment,
        )

        return self.response_as_json(data)

