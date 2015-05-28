"""

    rex.action.wizard
    =================

    This module provides :class:`Wizard` class which is used to describe
    wizards within an application.

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

__all__ = ('Wizard', 'WizardVal')


class WizardMeta(Widget.__metaclass__):

    def __new__(mcs, name, bases, attrs):
        if 'name' in attrs:
            attrs['name'] = _wizard_sig(attrs['name'])
        cls = Widget.__metaclass__.__new__(mcs, name, bases, attrs)
        return cls


class _wizard_sig(namedtuple('Wizard', ['name'])):

    def __hash__(self):
        return hash((self.__class__.__name__, self.name))


class Wizard(Widget):
    """ Base class for wizards.

    Wizard is a mechanism to compose actions together to provide a way for
    users to perform some task.
    
    To define a new wizard type one should subclass :class:`Wizard` and
    provide wizard name, JavaScript module which contains implementation and a
    configuration interface::

        from rex.widget import Field
        from rex.action import Wizard, ActionVal

        class WizardWizard(Wizard):

            name = 'wizard'
            js_type = 'my-package/lib/WizardWizard'

            actions = SeqVal(
                ActionVal(),
                doc='''
                A sequence of actions within the wizard wizard.
                ''')

    Then one can configure wizards of this type via URL mapping::

        paths:
          /make-study:
            wizard:
              type: wizard
              actions:
              - pick-lab
              - make-study

    """

    __metaclass__ = WizardMeta

    @classmethod
    def validate(cls, value):
        return WizardVal(wizard_cls=cls)(value)


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


class WizardVal(Validate):
    """ Validator for wizards."""

    _validate_pre = MapVal(StrVal(), AnyVal())
    _validate_type = StrVal()

    def __init__(self, default_wizard_type='paneled'):
        self.wizard_sig = _wizard_sig(default_wizard_type)

    def construct(self, loader, node):
        if not isinstance(node, yaml.MappingNode):
            value = super(WizardVal, self).construct(loader, node)
            return self(value)

        wizard_sig = None

        type_node, node = pop_mapping_key(node, 'type')
        if type_node:
            with guard("While parsing:", Location.from_node(type_node)):
                wizard_type = self._validate_type.construct(loader, type_node)
                wizard_sig = _wizard_sig(wizard_type)
                if wizard_sig not in Wizard.mapped():
                    raise Error('unknown wizard type specified:', wizard_type)

        wizard_sig = wizard_sig or self.wizard_sig
        wizard_cls = Wizard.mapped()[wizard_sig]

        validate = WidgetVal(widget_class=wizard_cls)
        value = validate.construct(loader, node)
        return value

    def __call__(self, value):
        if isinstance(value, Wizard):
            return value
        value = self._validate_pre(value)
        wizard_type = value.get('type', self.wizard_sig.name)
        wizard_sig = _wizard_sig(wizard_type)
        if wizard_sig not in Wizard.mapped():
            raise Error('unknown wizard type specified:', wizard_type)
        wizard_cls = Wizard.mapped()[wizard_sig]
        value = {k: v for (k, v) in value.items() if k != 'type'}
        wizard = wizard_cls(**value)
        return wizard


class MapWizard(Map):
    """ URL Mapping bindings to wizard."""

    fields = [
        ('wizard', WizardVal()),
        ('access', StrVal(), None),
    ]

    def __call__(self, spec, path, context):
        access = spec.access or self.package.name
        return WizardRenderer(spec.wizard, access)

    def override(self, spec, override_spec):
        if override_spec.wizard is not None:
            spec = spec.__clone__(wizard=override_spec.wizard)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        return spec


class WizardRenderer(object):
    """ Renderer for wizard."""

    def __init__(self, wizard, access):
        self.wizard = wizard
        self.access = access

    def __call__(self, req):
        if not authorize(req, self.access):
            raise HTTPUnauthorized()
        return render_widget(self.wizard, req)
