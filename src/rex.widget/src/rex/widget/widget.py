"""

    rex.widget.widget
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

import yaml
import warnings
from collections import OrderedDict, namedtuple

from rex.core import cached, set_location
from rex.core import ValidatingLoader, get_packages
from rex.core import Extension, Error, Validate, RecordVal, RecordField, MapVal
from rex.core import OneOfVal, ProxyVal, StrVal, IntVal

from .state import StateGraph, MutableStateGraph
from .field import Field
from .util import PropsContainer, cached_property
from .descriptors import WidgetDescriptor, UIDescriptor, UIDescriptorChildren


class WidgetBase(Extension):
    """ An abstract base class for widgets.
    
    Serves as a marker for Widget's metaclass.
    """


class Widget(WidgetBase):
    """ Base class for widgets.

    Widget definition in Rex Widget is consist of two parts.

    One part is a Python subclass of :class:`Widget` which defines field
    validation and widget state management (for stateful widgets).

    Another part is a React component which defines UI and models user
    interactions.

    A basic example of defining a new widget looks like::

        class Label(Widget):
            name = 'Label'
            js_type = 'my-app/lib/Label'
            text = Field(StrVal)

    This will allow to use widget from the URL mapping::

        !<Label>
        text: Hello, world!

    Also the React component counter part should be defined in
    `my-app/lib/Label` CommonJS module.
    """

    name = None
    js_type = NotImplemented

    fields = OrderedDict()

    _validate = ProxyVal()

    class __metaclass__(Extension.__metaclass__):

        def __new__(mcs, name, bases, members):
            cls = Extension.__metaclass__.__new__(mcs, name, bases, members)
            cls.fields = OrderedDict()

            if 'name' in members and not 'js_type' in members:
                raise Error("missing 'js_type' attribute of the conrete Widget class")

            fields = []

            for base in bases:
                if issubclass(base, WidgetBase) and not base is WidgetBase:
                    fields = base.fields.items() + fields

            own_fields = [
                (name, field) for name, field in members.items()
                if isinstance(field, Field)]
            own_fields = sorted(own_fields, key=lambda (_, field): field.order)

            for name, field in fields + own_fields:
                if field.name is None:
                    field.name = name
                cls.fields[name] = field

            return cls

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    @cached
    def map_all(cls):
        from .template import WidgetTemplate
        mapping = {}
        for extension in cls.all():
            # FIXME: remove WidgetTemplate check, this is done due to errorneous
            # widget re-registration somewhere
            assert extension.name not in mapping or issubclass(extension, WidgetTemplate), \
                "duplicate widget %r defined by '%r' and '%r'" % (
                    extension.name, mapping[extension.name], extension)
            mapping[extension.name] = extension
        return mapping

    def __init__(self, **values):
        for field in self.fields.values():
            if not field.name in values and field.has_default:
                values[field.name] = field.default
        self.values = values
        self.package = None

    @cached_property
    def widget_id(self):
        if 'id' in self.values:
            return self.id
        return '%s_%s' % (self.__class__.__name__, id(self))

    def validate(self):
        """ This method allows widgets to customize validation.
        
        The default implementation does nothing.
        """

    @cached
    def descriptor(self):
        props = PropsContainer()
        graph = MutableStateGraph()

        for name, field in self.fields.items():
            if not name in self.values:
                continue
            field_props, field_state = field.apply(self, self.values[name])
            graph.update({s.id: s for s in field_state})
            props.update(field_props)

        return WidgetDescriptor(
            ui=UIDescriptor(self.js_type, props, self, defer=False),
            state=graph.immutable())

    @staticmethod
    def define_state(validate, dependencies=None, default=NotImplemented, **params):
        """ Decorator for defining :class:`StateField` instances with inline
        computator."""
        from .field import StateField
        def register_computator(computator):
            return StateField(
                validate,
                default=default,
                computator=computator,
                dependencies=dependencies,
                **params)
        return register_computator

    def __str__(self):
        text = yaml.dump(self, Dumper=WidgetYAMLDumper)
        return text.rstrip()

    __unicode__ = __str__

    def __repr__(self):
        args = []
        for field in self.fields.values():
            if not field.name in self.values:
                continue
            value = getattr(self, field.name)
            if field.has_default and field.default == value:
                continue
            args.append("%s=%r" % (field.name, value))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class GroupWidget(Widget):

    name = 'GroupWidget'
    js_type = '__group__'

    children = Field(Widget._validate)

    @cached
    def descriptor(self):
        graph = MutableStateGraph()
        children = []

        for child in self.children:
            descriptor = child.descriptor()
            graph.update(descriptor.state)
            children.append(descriptor.ui)

        return WidgetDescriptor(
            ui=UIDescriptorChildren(children, defer=False),
            state=graph.immutable())


class NullWidget(Widget):

    singleton = None

    def __new__(cls):
        if cls.singleton is None:
            cls.singleton = Widget.__new__(cls)
        return cls.singleton

    def __init__(self):
        super(NullWidget, self).__init__()

    @cached
    def descriptor(self):
        return WidgetDescriptor(ui=None, state=StateGraph())


class WidgetYAMLDumper(yaml.Dumper): # pylint: disable=too-many-ancestors,too-many-public-methods

    def represent_unicode(self, data):
        return self.represent_scalar(u'tag:yaml.org,2002:str', data)

    def represent_widget(self, data):
        if isinstance(data, GroupWidget):
            return self.represent_sequence(u'tag:yaml.org,2002:seq',
                                           data.children)
        if isinstance(data, NullWidget):
            return self.represent_scalar(u'tag:yaml.org,2002:null', u'')
        tag = unicode(data.name)
        mapping = []
        for field in data.fields.values():
            value = getattr(data, field.name)
            if field.has_default and field.default == value:
                continue
            mapping.append((field.name, value))
        if mapping:
            return self.represent_mapping(tag, mapping, flow_style=False)
        else:
            return self.represent_scalar(tag, u"")


WidgetYAMLDumper.add_representer(
    unicode, WidgetYAMLDumper.represent_unicode)
WidgetYAMLDumper.add_multi_representer(
    Widget, WidgetYAMLDumper.represent_widget)
