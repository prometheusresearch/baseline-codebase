"""

    rex.workflow.workflow
    =====================

    This module provides :class:`Workflow` class which is used to describe
    workflows within an application.

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

import yaml
from webob.exc import HTTPUnauthorized

from rex.core import Error, Validate, RecordVal, StrVal, MapVal, AnyVal
from rex.core import Extension, cached, Location, guard
from rex.urlmap import Map
from rex.web import authorize
from rex.widget import Widget, WidgetVal, Field, render_widget

__all__ = ('Workflow', 'WorkflowVal')


class WorkflowMeta(Widget.__metaclass__):

    def __new__(mcs, name, bases, attrs):
        if 'name' in attrs:
            attrs['name'] = _workflow_sig(attrs['name'])
        cls = Widget.__metaclass__.__new__(mcs, name, bases, attrs)
        return cls


class _workflow_sig(namedtuple('Workflow', ['name'])):

    def __hash__(self):
        return hash((self.__class__.__name__, self.name))


class Workflow(Widget):
    """ Base class for workflows.

    Workflow is a mechanism to compose actions together to provide a way for
    users to perform some task.
    
    To define a new workflow type one should subclass :class:`Workflow` and
    provide workflow name, JavaScript module which contains implementation and a
    configuration interface::

        from rex.widget import Field
        from rex.workflow import Workflow, ActionVal

        class WizardWorkflow(Workflow):

            name = 'wizard'
            js_type = 'my-package/lib/WizardWorkflow'

            actions = SeqVal(
                ActionVal(),
                doc='''
                A sequence of actions within the wizard workflow.
                ''')

    Then one can configure workflows of this type via URL mapping::

        paths:
          /make-study:
            workflow:
              type: wizard
              actions:
              - pick-lab
              - make-study

    """

    __metaclass__ = WorkflowMeta

    @classmethod
    def validate(cls, value):
        return WorkflowVal(workflow_cls=cls)(value)


YAML_STR_TAG = u'tag:yaml.org,2002:str'

def pop_mapping_key(node, key):
    assert isinstance(node, yaml.MappingNode)
    value = []
    for n, (k, v) in enumerate(node.value):
        if isinstance(k, yaml.ScalarNode) and k.tag == YAML_STR_TAG and k.value == key:
            node = yaml.MappingNode(
                node.tag,
                node.value[:n] + node.value[n + 1:],
                start_mark=node.start_mark,
                end_mark=node.end_mark,
                flow_style=node.flow_style)
            return v, node
    return None, node


class WorkflowVal(Validate):
    """ Validator for workflows."""

    _validate_pre = MapVal(StrVal(), AnyVal())
    _validate_type = StrVal()

    def __init__(self, default_workflow_type='paneled'):
        self.workflow_sig = _workflow_sig(default_workflow_type)

    def construct(self, loader, node):
        if not isinstance(node, yaml.MappingNode):
            value = super(WorkflowVal, self).construct(loader, node)
            return self(value)

        workflow_sig = None

        type_node, node = pop_mapping_key(node, 'type')
        if type_node:
            with guard("While parsing:", Location.from_node(type_node)):
                workflow_type = self._validate_type.construct(loader, type_node)
                workflow_sig = _workflow_sig(workflow_type)
                if workflow_sig not in Workflow.mapped():
                    raise Error('unknown workflow type specified:', workflow_type)

        workflow_sig = workflow_sig or self.workflow_sig
        workflow_cls = Workflow.mapped()[workflow_sig]

        validate = WidgetVal(widget_class=workflow_cls)
        value = validate.construct(loader, node)
        return value

    def __call__(self, value):
        if isinstance(value, Workflow):
            return value
        value = self._validate_pre(value)
        workflow_type = value.get('type', self.workflow_sig.name)
        workflow_sig = _workflow_sig(workflow_type)
        if workflow_sig not in Workflow.mapped():
            raise Error('unknown workflow type specified:', workflow_type)
        workflow_cls = Workflow.mapped()[workflow_sig]
        value = {k: v for (k, v) in value.items() if k != 'type'}
        workflow = workflow_cls(**value)
        return workflow


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
