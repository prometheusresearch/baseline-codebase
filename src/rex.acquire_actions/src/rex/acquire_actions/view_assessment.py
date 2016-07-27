#
# Copyright (c) 2016, Prometheus Research, LLC
#

from rex.action import typing
from rex.core import StrVal, MaybeVal
from rex.widget import Field

from .assessment_base import AssessmentAction


__all__ = (
    'ViewAssessmentAction',
)


class ViewAssessmentAction(AssessmentAction):
    name = 'assessment-view'
    js_type = 'rex-acquire-actions/lib/ViewAssessment'

    entity = Field(
        typing.RowTypeVal(),
        doc='The record containing the Assessment.',
    )

    def context(self):
        return (
            self.domain.record(self.entity),
            self.domain.record(),
        )

