#
# Copyright (c) 2015, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound

from rex.core import StrVal, get_settings
from rex.instrument.util import get_implementation
from rex.web import Command, Parameter, render_to_response, authenticate


__all__ = (
    'ViewFormCommand',
    'RootViewFormCommand',
)


# pylint: disable=W0223


class BaseCommand(Command):
    """
    An abstract base class that contains a variety of utility methods used
    across a number of Commands that make up the Form Previewer.
    """

    def get_instrument_user(self, request):
        """
        Retrieves the User that is associated with the specified request.

        :param request: the web request to identify the User of
        :type request: Request
        :rtype: User
        """

        login = authenticate(request)
        if login:
            user_impl = get_implementation('user')
            user = user_impl.get_by_login(login)
        else:
            user = None
        return user

    def get_common_context(self, request):
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

        user = self.get_instrument_user(request)
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
        # pylint: disable=E1101
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
    )

    # pylint: disable=W0221
    def render(self, request, form_id, instrument_id, return_url):
        context = self.get_common_context(request)

        context['return_url'] = return_url

        form = instrument = None
        if form_id:
            form = context['user'].get_object_by_uid(
                form_id,
                'draftform',
                'forms',
            )
            instrument = form.draft_instrument_version if form else None

        elif instrument_id:
            instrument = context['user'].get_object_by_uid(
                instrument_id,
                'draftinstrumentversion',
            )

        if (form_id and not form) or (not instrument):
            raise HTTPNotFound('Could not find a DraftForm for the given ID')

        all_forms = context['user'].find_objects(
            'draftform',
            'forms',
            draft_instrument_version=instrument,
        )
        if not all_forms:
            raise HTTPNotFound('Could not find a DraftForm for the given ID')

        if not form:
            form = all_forms[0]

        context['instrument_version'] = instrument
        context['forms'] = dict(
            [(f.channel.uid, f.configuration) for f in all_forms]
        )
        context['channels'] = [f.channel.as_dict() for f in all_forms]
        context['initial_channel'] = form.channel.uid

        return self.template_response(request, context, name='viewform')


class ViewFormCommand(BaseViewFormCommand):
    path = '/preview'


class RootViewFormCommand(BaseViewFormCommand):
    path = '/'

