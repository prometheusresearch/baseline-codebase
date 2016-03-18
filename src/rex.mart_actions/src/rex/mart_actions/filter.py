#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.action.typing import RecordTypeVal, RecordType
from rex.core import StrVal, Error
from rex.mart import get_all_definitions
from rex.widget import Field, RSTVal

from .base import MartAction
from .tool import MartTool


__all__ = (
    'MartFilteredAction',
    'MartIntroAction',
)


class DefinitionVal(StrVal):
    def __call__(self, data):
        value = super(DefinitionVal, self).__call__(data)

        if value not in [defn['id'] for defn in get_all_definitions()]:
            raise Error('Not a valid RexMart Definition ID')

        return value


class ToolVal(StrVal):
    def __call__(self, data):
        value = super(ToolVal, self).__call__(data)

        if value not in MartTool.mapped().keys():
            raise Error('Not a valid MartTool')

        return value


class MartFilteredAction(MartAction):
    """
    An abstract Action that implements the logic necessary to hide/show the
    derived Action based on the capabilities of the previously-selected Mart.
    """

    definition = Field(
        DefinitionVal(),
        default=None,
        doc='The RexMart definition ID that this Action is compatible with.',
    )

    tool = Field(
        ToolVal(),
        default=None,
        doc='The MartTool ID that this Action is compatible with.',
    )

    input = Field(
        RecordTypeVal(),
        default=RecordType.empty(),
    )

    #: A dictionary describing the required input context for this action
    #: (beyond the definition/tool context).
    additional_input = None

    #: A dictionary describing the output context this action will produce.
    additional_output = None

    def __init__(self, **values):
        super(MartFilteredAction, self).__init__(**values)

        if not self.input or not self.input.rows:
            rows = [{
                'mart': 'number',
            }]

            if self.definition:
                rows.append({
                    self.get_definition_context(self.definition): 'any',
                })
            if self.tool:
                rows.append({
                    self.get_tool_context(self.tool): 'any',
                })
            if self.additional_input:
                for key, value in self.additional_input.items():
                    rows.append({
                        key: value,
                    })

            self.input = RecordTypeVal()(rows)

        if self.additional_output:
            self.output = RecordTypeVal()([
                {key: value}
                for key, value in self.output.items()
            ])

        else:
            self.output = RecordType.empty()

    def context(self):
        return self.input, self.output


class MartIntroAction(MartFilteredAction):
    """
    A generic Action that functions like a basic Page Action which will only
    display if a Mart is selected that satisfies the definition and/or tool
    requirements specified on this Action.
    """

    name = 'mart-tool-intro'
    js_type = 'rex-action/lib/actions/Page'

    text = Field(
        RSTVal(),
        default=None,
        doc='The test to display on this page.'
    )

