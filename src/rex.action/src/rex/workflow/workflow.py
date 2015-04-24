"""

    rex.workflow.workflow
    =====================

    This module provides :class:`Workflow` class which is used to describe
    workflows within an application.

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Error, Validate, RecordVal, StrVal
from rex.core import Extension, cached

__all__ = ('Workflow', 'WorkflowVal')


class Workflow(Extension):

    type = NotImplemented

    fields = ()

    def __init__(self, **params):
        self.params = params

    def __call__(self, req):
        raise NotImplementedError('%s.render() is not implemented' % \
                                  self.__class__.__name__)

    def __str__(self):
        params = ', '.join('%s=%r' % kv for kv in self.params.items())
        return '%s(%s)' % (self.__class__.__name__, params)

    __unicode__ = __str__
    __repr__ = __str__

    @classmethod
    @cached
    def all_by_type(cls):
        return {cls.type: cls for cls in cls.all()}

    @classmethod
    def enabled(cls):
        return cls.type is not NotImplemented

    @classmethod
    def validate(cls, value):
        return WorkflowVal(workflow_cls=cls)(value)


class WorkflowVal(Validate):
    """ Validator for workflows."""

    _common_fields = (
        ('type', StrVal(), None),
    )

    def __init__(self, workflow_cls=Workflow):
        self.workflow_cls = workflow_cls
        self._validate = RecordVal(*(self._common_fields + workflow_cls.fields))

    def __call__(self, value):
        if isinstance(value, self.workflow_cls):
            return value

        value = self._validate(value)

        workflows_by_type = Workflow.all_by_type()

        if value.type not in workflows_by_type:
            raise Error('unknown workflow type specified:', value.type)

        params = value._asdict()
        params.pop('type')

        return workflows_by_type[value.type](**params)
