#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.action.typing import ValueType

from .base import MartAction


__all__ = (
    'HtsqlConsoleMartAction',
)


class HtsqlConsoleMartAction(MartAction):
    name = 'mart-htsql-console'
    js_type = 'rex-mart-actions/lib/HtsqlConsole'

    def context(self):
        return (
            self.domain.record(mart=ValueType('number')),
            self.domain.record(),
        )

