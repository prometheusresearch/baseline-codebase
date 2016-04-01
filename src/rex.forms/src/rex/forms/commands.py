#
# Copyright (c) 2016, Prometheus Research, LLC
#


import json

from webob import Response
from webob.exc import HTTPNotFound, HTTPBadRequest, HTTPUnauthorized

from rex.core import StrVal
from rex.db import get_db
from rex.instrument import User, Task, Assessment, InstrumentError, Subject
from rex.web import Command, Parameter, authenticate

from .implementation.lookup import REGISTRY


__all__ = (
    'LookupCommand',
    'PreviewCalculationCommand',
)


# pylint: disable=abstract-method


class LookupCommand(Command):
    path = '/lookup'
    parameters = (
        Parameter('lookup', StrVal()),
        Parameter('query', StrVal(), None),
    )

    def render(self, request, lookup, query):
        # pylint: disable=arguments-differ,unused-argument

        lookup_query = REGISTRY.get_query(lookup)
        if not lookup_query:
            raise HTTPNotFound('Unknown lookup ID "%s"' % (lookup,))

        data = get_db().produce(lookup_query, search=query)
        hits = []
        for rec in data:
            hits.append({
                'value': rec.value,
                'label': rec.label,
            })

        return Response(json={'values': hits})


class PreviewCalculationCommand(Command):
    path = '/calculate/instrument/{instrumentversion_id}'
    parameters = (
        Parameter('instrumentversion_id', StrVal()),
        Parameter('data', StrVal()),
    )

    def render(self, request, instrumentversion_id, data):
        # pylint: disable=arguments-differ

        # Get the User
        login = authenticate(request)
        user = User.get_implementation().get_by_login(login)
        if not user:
            raise HTTPUnauthorized()

        # Parse the Assessment Data
        try:
            data = json.loads(data)
        except ValueError as exc:
            raise HTTPBadRequest(exc.message)

        # Get the InstrumentVersion
        instrument_version = user.get_object_by_uid(
            instrumentversion_id,
            'instrumentversion',
        )
        if not instrument_version:
            raise HTTPNotFound()

        return Response(json={
            'results': self.get_results(
                instrument_version,
                instrument_version.calculation_set,
                data,
            ),
        })

    def get_results(self, instrument_version, calculation_set, data, assessment=None):
        if not calculation_set:
            return {}

        # Validate the Assessment Data
        assessment_impl = Assessment.get_implementation()
        try:
            assessment_impl.validate_data(
                data,
                instrument_definition=instrument_version.definition,
            )
        except InstrumentError as exc:
            raise HTTPBadRequest(exc.message)

        # Make some temporary objects so we can execute the calcs.
        subject = Subject.get_implementation()('fake')
        if not assessment:
            assessment = assessment_impl(
                'fake',
                subject,
                instrument_version,
                data,
                status=assessment_impl.STATUS_COMPLETE,
            )
        else:
            assessment.data = data
            assessment.status = assessment_impl.STATUS_COMPLETE

        # Execute the calculations
        return calculation_set.execute(assessment=assessment)


class PreviewCalculationAssessmentCommand(PreviewCalculationCommand):
    path = '/calculate/assessment/{assessment_id}'
    parameters = (
        Parameter('assessment_id', StrVal()),
        Parameter('data', StrVal()),
    )

    def render(self, request, assessment_id, data):
        # pylint: disable=arguments-differ

        # Get the User
        login = authenticate(request)
        user = User.get_implementation().get_by_login(login)
        if not user:
            raise HTTPUnauthorized()

        # Parse the Assessment Data
        try:
            data = json.loads(data)
        except ValueError as exc:
            raise HTTPBadRequest(exc.message)

        # Get the Assessment
        assessment = user.get_object_by_uid(assessment_id, 'assessment')
        if not assessment:
            raise HTTPNotFound()

        return Response(json={
            'results': self.get_results(
                assessment.instrument_version,
                assessment.instrument_version.calculation_set,
                data,
                assessment=assessment,
            ),
        })

