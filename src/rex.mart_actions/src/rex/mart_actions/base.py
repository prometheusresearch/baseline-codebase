#
# Copyright (c) 2016, Prometheus Research, LLC
#


from functools import partial

from cachetools import LRUCache

from rex.action import Action, typing
from rex.core import get_rex, get_settings
from rex.mart import get_mart_db, MartAccessPermissions, get_all_definitions
from rex.web import authenticate

from .tool import MartTool


__all__ = (
    'MartAction',
)


class MartAction(Action):
    """
    An abstract Action that serves as the base for all Mart-oriented Actions.
    """

    # pylint: disable=no-self-use

    def get_mart(self, request, mart_id=None):
        """
        Retrieves the Mart for the specified request.

        :param request: the request to retrieve the Mart for
        :type request: webob.Request
        :param mart_id:
            the ID of the Mart to retrieve; if not specified, then the Mart ID
            will be retrieved from the ``mart`` querystring parameter in the
            request
        :type mart_id: int
        :rtype: Mart
        """

        access = MartAccessPermissions.top()
        user = authenticate(request)
        if mart_id is None:
            mart_id = request.GET.pop('mart', None)
        if mart_id is None:
            return None
        return access.get_mart(mart_id, user)

    def get_mart_dictionary(self, mart):
        """
        Retrieves the Data Dictionary configuraiton for a Mart.

        :param mart: the Mart to get the configuration for
        :type mart: Mart
        :rtype: dict
        """

        for proc in mart.definition['processors']:
            if proc['id'] == 'datadictionary':
                return proc['options']
        return None

    def get_mart_db(self, mart):
        """
        Retrieves an HTSQL instance connected to the specified Mart.

        :param mart: the Mart to connect to
        :type mart: Mart
        :rtype: rex.db.RexHTSQL
        """

        rex = get_rex()
        if not hasattr(rex, 'mart_action_databases'):
            rex.mart_action_databases = LRUCache(
                maxsize=get_settings().mart_htsql_cache_depth,
                missing=partial(get_mart_db, extensions={'tweak.etl': {}}),
            )

        return rex.mart_action_databases[str(mart.name)]

    def get_tool_context(self, tool_id):
        """
        Retrieves the name of the context variable that represents the
        specified Tool.

        :param tool_id: the ID of Tool
        :type tool_id: str
        :rtype: str
        """

        return 'mart_tool:%s' % (tool_id,)

    def get_all_tool_context_types(self):
        """
        Retrieves the context type declarations representing all Mart Tools
        in the system.

        :rtype: dict
        """

        context = {}

        for tool in MartTool.mapped().keys():
            context[self.get_tool_context(tool)] = typing.anytype

        return context

    def get_definition_context(self, definition):
        """
        Retrieves the name of the context variable that represents the
        specified Mart Definition.

        :param definition: the Definition (or ID of the Definition)
        :type definition: dict or str
        :rtype: str
        """

        return 'mart_defn:%s' % (
            definition['id'] if isinstance(definition, dict) else definition,
        )

    def get_all_definition_context_types(self):  # pylint: disable=invalid-name
        """
        Retrieves the context type declarations representing all Mart
        Definitions in the system.

        :rtype: dict
        """

        context = {}

        for defn in get_all_definitions():
            context[self.get_definition_context(defn)] = typing.anytype

        return context

