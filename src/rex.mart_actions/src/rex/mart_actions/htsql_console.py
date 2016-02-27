#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import get_settings

from .filter import MartFilteredAction
from .tool import MartTool


__all__ = (
    'HtsqlMartTool',
    'HtsqlConsoleMartAction',
)


class HtsqlMartTool(MartTool):
    name = 'htsql'

    @classmethod
    def is_enabled_for_mart(cls, mart):
        return 'tweak.shell' in get_settings().mart_htsql_extensions


class HtsqlConsoleMartAction(MartFilteredAction):
    """
    A screen that provides the HTSQL Web Console attached to a Mart.
    """

    name = 'mart-htsql-console'
    js_type = 'rex-mart-actions/lib/HtsqlConsole'
    tool = 'htsql'
    additional_input = {'mart': 'number'}

