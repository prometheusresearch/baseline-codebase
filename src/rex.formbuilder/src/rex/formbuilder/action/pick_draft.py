#
# Copyright (c) 2016, Prometheus Research, LLC
#

from rex.action import typing
from rex.widget import Field
from .base import FormBuilderAction


__all__ = (
    'PickDraftAction',
)


class PickDraftAction(FormBuilderAction):
    name = 'formbuilder-pick-draft'
    js_type = 'rex-formbuilder', 'PickDraft'

    entity = Field(typing.RowTypeVal())

    def context(self):
        return (
            self.domain.record(self.entity),
            self.domain.record(draft=typing.ValueType('text')),
        )

