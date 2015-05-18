"""

    rex.workflow.workflow
    =====================

    This module provides :class:`Workflow` class which is used to describe
    workflows within an application.

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

from webob.exc import HTTPUnauthorized

from rex.core import Error, Validate, RecordVal, StrVal, MapVal, AnyVal
from rex.core import Extension, cached
from rex.urlmap import Map
from rex.web import authorize
from rex.widget import Widget, Field, render_widget

from .action_tree import ActionTreeVal

__all__ = ('Workflow', 'WorkflowVal')


class WorkflowMeta(Widget.__metaclass__):

    def __new__(mcs, name, bases, attrs):
        if 'name' in attrs:
            attrs['name'] = _workflow_sig(attrs['name'])
        cls = Widget.__metaclass__.__new__(mcs, name, bases, attrs)
        return cls


_workflow_sig = namedtuple('Workflow', ['name'])


class Workflow(Widget):

    __metaclass__ = WorkflowMeta

    @classmethod
    def validate(cls, value):
        return WorkflowVal(workflow_cls=cls)(value)

    actions = Field(
        ActionTreeVal(),
        doc="""
        Workflow configuration.
        """)


class WorkflowVal(Validate):
    """ Validator for workflows."""

    _validate_pre = MapVal(StrVal(), AnyVal())
    _validate_type = StrVal()

    def __init__(self, default_workflow_type='panels'):
        self.default_workflow_type = default_workflow_type

    def __call__(self, value):
        if isinstance(value, Workflow):
            return value
        value = self._validate_pre(value)
        workflow_type = value.get('type', self.default_workflow_type)
        workflow_sig = _workflow_sig(workflow_type)
        if workflow_sig not in Workflow.mapped():
            raise Error('unknown workflow type specified:', workflow_type)
        workflow_cls = Workflow.mapped()[workflow_sig]
        value = {k: v for (k, v) in value.items() if k != 'type'}
        return workflow_cls(**value)


class MapWorkflow(Map):
    """ URL Mapping bindings to workflow."""

    fields = [
        ('workflow', WorkflowVal()),
        ('access', StrVal(), None),
    ]

    def __call__(self, spec, path, context):
        access = spec.access or self.package.name
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
        return render_widget(self.workflow, req)
