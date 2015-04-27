"""

    rex.workflow.workflow
    =====================

    This module provides :class:`Workflow` class which is used to describe
    workflows within an application.

    :copyright: 2015, Prometheus Research, LLC

"""

from webob.exc import HTTPUnauthorized

from rex.core import Error, Validate, RecordVal, StrVal, MapVal, AnyVal
from rex.core import Extension, cached
from rex.urlmap import Map
from rex.web import authorize

__all__ = ('Workflow', 'WorkflowVal')


class Workflow(Extension):

    type = NotImplemented

    fields = ()

    def __init__(self, params):
        self.params = params

    def __call__(self, req):
        raise NotImplementedError('%s.__call__() is not implemented' % \
                                  self.__class__.__name__)

    def __str__(self):
        params = ', '.join('%s=%r' % kv for kv in self.params.items())
        return '%s(%s)' % (self.__class__.__name__, params)

    __unicode__ = __str__
    __repr__ = __str__

    @classmethod
    def signature(cls):
        return cls.type

    @classmethod
    def enabled(cls):
        return cls.type is not NotImplemented

    @classmethod
    def validate(cls, value):
        return WorkflowVal(workflow_cls=cls)(value)


class WorkflowVal(Validate):
    """ Validator for workflows."""

    _validate_pre = MapVal(StrVal(), AnyVal())
    _validate_type = StrVal()

    def __call__(self, value):
        if isinstance(value, Workflow):
            return value
        value = self._validate_pre(value)
        workflow_type = value.get('type', None)
        if workflow_type not in Workflow.mapped():
            raise Error('unknown workflow type specified:', workflow_type)
        workflow_cls = Workflow.mapped()[workflow_type]
        validate = RecordVal(*workflow_cls.fields)
        value = {k: v for (k, v) in value.items() if k != 'type'}
        params = validate(value)._asdict()
        return workflow_cls(params)


class MapWorkflow(Map):
    """ URL Mapping bindings to workflow."""

    fields = [
        ('workflow', WorkflowVal()),
        ('access', StrVal(), None),
    ]

    def __call__(self, spec, path, context):
        access = spec.access or self.package.name
        spec.workflow.package = self.package
        return WorkflowRenderer(spec.workflow, access)

    def override(self, spec, override_spec):
        if override_spec.workflow is not None:
            spec = spec.__clone__(workflow=override_spec.workflow)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        return spec


class WorkflowRenderer(object):
    """ Renderer for workflow."""

    def __init__(self, workflow, access):
        self.workflow = workflow
        self.access = access

    def __call__(self, req):
        if not authorize(req, self.access):
            raise HTTPUnauthorized()
        return self.workflow(req)
