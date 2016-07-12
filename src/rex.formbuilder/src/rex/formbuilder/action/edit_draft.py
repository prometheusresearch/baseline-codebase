#
# Copyright (c) 2016, Prometheus Research, LLC
#

from rex.action import typing
from rex.widget import Field
from .base import FormBuilderAction


__all__ = (
    'EditDraftAction',
)


class EditDraftAction(FormBuilderAction):
    name = 'formbuilder-edit-draft'
    js_type = 'rex-formbuilder/lib/widget/action/EditDraft'

    entity = Field(lambda x: False, default=None)

    def context(self):
        return (
            self.domain.record(draft=typing.ValueType('text')),
            self.domain.record(),
        )

