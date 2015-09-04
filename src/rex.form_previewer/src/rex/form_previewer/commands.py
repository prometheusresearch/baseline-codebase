#
# Copyright (c) 2015, Prometheus Research, LLC
#


import json

from datetime import datetime

from webob import Response
from webob.exc import HTTPNotFound, HTTPBadRequest

from rex.core import StrVal, ChoiceVal, get_settings
from rex.instrument import DraftInstrumentVersion, InstrumentError, User, \
    CalculationSet, DraftCalculationSet, InstrumentVersion, Assessment, \
    Subject
from rex.instrument.util import to_json
from rex.web import Command, Parameter, render_to_response, authenticate


__all__ = (
    'ViewFormCommand',
    'RootViewFormCommand',
    'CompleteFormCommand',
)


def get_instrument_user(request):
    """
    Retrieves the User that is associated with the specified request.

    :param request: the web request to identify the User of
    :type request: Request
    :rtype: User
    """

    login = authenticate(request)
    if login:
        user = User.get_implementation().get_by_login(login)
    else:
        user = None
    return user


class BaseCommand(Command):
    """
    An abstract base class that contains a variety of utility methods used
    across a number of Commands that make up the Form Previewer.
    """

    def get_common_context(self, request):  # pylint: disable=no-self-use
        """
        Generates a dictionary filled with the context variables that are used
        across all Commands. This dictionary consists of:

        user
            The User associated with the request.

        :param request: the web request to generate the context variables for
        :type request: Request
        :rtype: dict
        """

        context = {}

        user = get_instrument_user(request)
        context['user'] = user

        return context

    def get_template_path(self, package=None, name=None):  # pragma: no cover
        """
        Returns the RexDB path to the Jinja template to use for this Command.

        The template chosen is based off the name of the Command. For example,
        if the Command is name ``HappyCommand``, this method would use the name
        ``happy`` to find the template in either the ``entry_templates``
        setting or the ``/template/`` directory in this package.

        :rtype: string
        """

        if not name:
            name = self.__class__.__name__.lower()
            if name.endswith('command'):
                name = name[:-7]
        config = get_settings().form_previewer_templates
        if name in config:
            return config[name]
        else:
            package = package or 'rex.form_previewer'
            return '%s:/template/%s.html' % (package, name)

    def template_response(self, request, context, name=None):
        """
        A convenience method for rendering this Command's template (as
        identified by ``get_template_path()``) using the specified context and
        generating an associated Response object.

        :param request: the request to generate the Response for
        :type request: Request
        :param context:
            the context variables to use when rendering the template
        :type context: dict
        :rtype: Response
        """

        return render_to_response(
            self.get_template_path(name=name),
            request,
            **context
        )


class BaseViewFormCommand(BaseCommand):
    parameters = (
        Parameter('form_id', StrVal(), None),
        Parameter('instrument_id', StrVal(), None),
        Parameter('return_url', StrVal(), None),
        Parameter('category', ChoiceVal('draft', 'published'), 'draft'),
    )

    def get_draft(self, user, form_id, instrument_id):
        # pylint: disable=no-self-use

        form = instrument = None
        if form_id:
            form = user.get_object_by_uid(
                form_id,
                'draftform',
                'forms',
            )
            instrument = form.draft_instrument_version if form else None

        elif instrument_id:
            instrument = user.get_object_by_uid(
                instrument_id,
                'draftinstrumentversion',
            )

        if (form_id and not form) or (not instrument):
            raise HTTPNotFound('Could not find a DraftForm for the given ID')

        all_forms = [
            frm
            for frm in user.find_objects(
                'draftform',
                'forms',
                draft_instrument_version=instrument,
            )
            if frm.configuration
        ]
        if not all_forms:
            raise HTTPNotFound('Could not find a DraftForm for the given ID')

        if not form:
            form = all_forms[0]

        return (instrument, form, all_forms)

    def get_published(self, user, form_id, instrument_id):
        # pylint: disable=no-self-use

        form = instrument = None
        if form_id:
            form = user.get_object_by_uid(
                form_id,
                'form',
                'forms',
            )
            instrument = form.instrument_version if form else None

        elif instrument_id:
            instrument = user.get_object_by_uid(
                instrument_id,
                'instrumentversion',
            )

        if (form_id and not form) or (not instrument):
            raise HTTPNotFound('Could not find a Form for the given ID')

        all_forms = [
            frm
            for frm in user.find_objects(
                'form',
                'forms',
                instrument_version=instrument,
            )
            if frm.configuration
        ]
        if not all_forms:
            raise HTTPNotFound('Could not find a Form for the given ID')

        if not form:
            form = all_forms[0]

        return (instrument, form, all_forms)

    def get_config(self, category, instrument_id, form_id, user):
        if category == 'draft':
            instrument, form, all_forms = self.get_draft(
                user,
                form_id,
                instrument_id,
            )
        elif category == 'published':
            instrument, form, all_forms = self.get_published(
                user,
                form_id,
                instrument_id,
            )

        return instrument, form, all_forms

    def render(self, request, form_id, instrument_id, return_url, category):
        context = self.get_common_context(request)
        context['return_url'] = return_url
        context['category'] = category
        context['instrument_id'] = instrument_id
        context['category'] = category

        instrument, form, all_forms = self.get_config(
            category,
            instrument_id,
            form_id,
            context['user'],
        )

        context['instrument_version'] = instrument
        context['forms'] = dict(
            [(f.channel.uid, f.adapted_configuration) for f in all_forms]
        )
        context['channels'] = [f.channel.as_dict() for f in all_forms]
        context['initial_channel'] = form.channel.uid

        return self.template_response(request, context, name='viewform')


class ViewFormCommand(BaseViewFormCommand):
    path = '/preview'


class RootViewFormCommand(BaseViewFormCommand):
    path = '/'


class CompleteFormCommand(BaseViewFormCommand):
    """
    Emulates the completion of a entry, executing the CalculationSet, if any is
    configured.
    """

    path = '/complete'
    parameters = (
        Parameter('data', StrVal()),
        Parameter('instrument_id', StrVal(), None),
        Parameter('category', ChoiceVal('draft', 'published'), 'draft'),
    )

    def render(self, request, data, instrument_id, category):
        user = get_instrument_user(request)

        try:
            data = json.loads(data)
        except ValueError as exc:
            raise HTTPBadRequest(exc.message)

        instrument_version, form, all_forms = self.get_config(
            category,
            instrument_id,
            None,
            user,
        )

        calculationset = None
        calculationset_impl = CalculationSet.get_implementation()
        if isinstance(instrument_version, DraftInstrumentVersion):
            calc = DraftCalculationSet.get_implementation().find(
                draft_instrument_version=instrument_version,
                limit=1,
            )

            instrument_version = InstrumentVersion.get_implementation()(
                'fake',
                instrument_version.instrument,
                instrument_version.definition,
                1,
                'fake',
                datetime.now(),
            )

            if calc:
                calculationset = calculationset_impl(
                    'fake',
                    instrument_version,
                    calc[0].definition,
                )
        else:
            calcs = calculationset_impl.find(
                instrument_version=instrument_version.uid,
                limit=1
            )
            if calcs:
                calculationset = calcs[0]

        assessment_impl = Assessment.get_implementation()
        try:
            assessment_impl.validate_data(
                data,
                instrument_definition=instrument_version.definition,
            )
        except InstrumentError as exc:
            raise HTTPBadRequest(exc.message)

        subject = Subject.get_implementation()('fake')
        assessment = assessment_impl(
            'fake',
            subject,
            instrument_version,
            data,
            status=assessment_impl.STATUS_COMPLETE,
        )

        response = {
            'status': 'SUCCESS',
        }
        if calculationset:
            try:
                results = calculationset.execute(assessment=assessment)
            except InstrumentError as exc:
                response = {
                    'status': 'ERROR',
                    'message': unicode(exc),
                }
            else:
                response['results'] = results

        return Response(
            to_json(response),
            headerlist=[
                ('Content-type', 'application/json'),
            ],
        )

