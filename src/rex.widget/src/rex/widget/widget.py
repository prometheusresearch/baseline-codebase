"""

    rex.widget.widget
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

import re
import yaml
from rex.core import (
    Extension, cached,
    MaybeVal, RecordField, ProxyVal, MapVal, StrVal, RecordVal)
from .state import (
    unknown, Dep,
    StateGraph, MutableStateGraph)
from .descriptor import (
    UIDescriptor, UIDescriptorChildren, WidgetDescriptor,
    StateReadWrite, StateRead)
from .fields import Field, StateField, BaseStateField
from .handle import handle


def state(validator, dependencies=None, default=NotImplemented):
    """ Decorator for defining :class:`StateField` instances with inline
    computator."""
    def register_computator(computator):
        return StateField(
            validator,
            default=default,
            computator=computator,
            dependencies=dependencies)
    return register_computator


state_configuration = RecordVal(RecordField('alias', StrVal()))
state_configuration_mapping = MapVal(StrVal(), state_configuration)


class Widget(Extension):
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

        <!Label>
        text: Hello, world!

    Also the React component counter part should be defined in
    `my-app/lib/Label` CommonJS module.
    """

    name = None
    js_type = NotImplemented

    fields = []
    fields_by_name = {}

    validate = ProxyVal()

    NON_PROP_NAMES = ('states',)

    class __metaclass__(Extension.__metaclass__):

        def __new__(mcls, name, bases, members):
            cls = Extension.__metaclass__.__new__(mcls, name, bases, members)

            fields = sorted((
                (name, field) for name, field in members.items()
                if isinstance(field, Field)),
                key=lambda (_, field): field.order)

            _fields = []
            _fields_by_name = {}

            for name, field in fields:
                _fields.append(field.to_record_field(name))
                _fields_by_name[name] = field

            _fields.append(
                RecordField('states', state_configuration_mapping, {}))

            cls.fields = _fields
            cls.fields_by_name = _fields_by_name
                
            return cls
    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    @cached
    def map_all(cls):
        mapping = {}
        for extension in cls.all():
            # FIXME: include full module path to already registered and to-be
            # registered module classes
            assert extension.name not in mapping, \
                "duplicate widget %r defined by '%r' and '%r'" % (
                    extension.name, mapping[extension.name], extension)
            mapping[extension.name] = extension
        return mapping

    @classmethod
    def parse(cls, stream):
        if isinstance(stream, (str, unicode)) or hasattr(stream, 'read'):
            return cls.validate.parse(stream)
        else:
            return cls.validate(stream)

    def __init__(self, *args, **kwds):
        # Convert any keywords to positional arguments.
        args_tail = []
        for field in self.fields[len(args):]:
            attribute = field.attribute
            if attribute in kwds:
                args_tail.append(kwds.pop(attribute))
            elif field.has_default:
                args_tail.append(field.default)
            else:
                raise TypeError("missing field %r" % attribute)
        args = args + tuple(args_tail)
        # Complain if there are any keywords left.
        if kwds:
            attr = sorted(kwds)[0]
            if any(field.attribute == attr for field in self.fields):
                raise TypeError("duplicate field %r" % attr)
            else:
                raise TypeError("unknown field %r" % attr)
        # Assign field values.
        if len(args) != len(self.fields):
            raise TypeError("expected %d arguments, got %d"
                            % (len(self.fields), len(args)))
        self.values = {}
        for arg, field in zip(args, self.fields):
            setattr(self, field.attribute, arg)
            if not field.attribute in self.NON_PROP_NAMES:
                self.values[field.attribute] = arg

    @cached
    def descriptor(self):
        props = {}
        state = MutableStateGraph()
        own_state = MutableStateGraph()

        for name, value in self.values.items():
            field = self.fields_by_name[name]

            name = to_camelcase(name)

            # XXX: we shouldn't make Widget and StateField to be mutually
            # exclusive
            if isinstance(value, Widget):
                self.on_widget(props, state, name, value)
            elif isinstance(field, BaseStateField):
                self.on_state(props, own_state, name, value, field)
            else:
                props[name] = value

        if own_state:
            own_state = assign_aliases(own_state, self.id)
            state.update(own_state)

        # override states from state configuration
        for state_id, conf in self.states.items():
            if state_id in state:
                state[state_id] = state[state_id]._replace(alias=conf.alias)

        return WidgetDescriptor(
            ui=UIDescriptor(self.js_type, props),
            state=state.immutable())

    def on_widget(self, props, state, name, widget):
        descriptor = widget.descriptor()
        props[name] = descriptor.ui
        state.update(descriptor.state)

    def on_state(self, props, state, name, value, field):
        for prop_name, descriptor in field.describe(name, value, self):
            state[descriptor.id] = descriptor
            if descriptor.is_writable:
                props[prop_name] = StateReadWrite(descriptor.id)
            else:
                props[prop_name] = StateRead(descriptor.id)

    __call__ = handle

    def __str__(self):
        text = yaml.dump(self, Dumper=WidgetYAMLDumper)
        return text.rstrip()

    def __repr__(self):
        args = []
        for field in self.fields:
            value = getattr(self, field.attribute)
            if field.has_default and field.default == value:
                continue
            args.append("%s=%r" % (field.attribute, value))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


def assign_aliases(state, widget_id):
    writable_state = [s for s in state.values() if s.is_writable]
    if len(writable_state) == 1:
        key = writable_state[0].id
        state[key] = state[key]._replace(alias=widget_id)
    return state


class GroupWidget(Widget):

    children = Field(Widget.validate)

    @cached
    def descriptor(self):
        state = MutableStateGraph()
        children = []

        for child in self.children:
            descriptor = child.descriptor()
            state.update(descriptor.state)
            children.append(descriptor.ui)

        return WidgetDescriptor(
            ui=UIDescriptorChildren(children),
            state=state.immutable())


class NullWidget(Widget):

    singleton = None

    def __new__(cls):
        if cls.singleton is None:
            cls.singleton = Widget.__new__(cls)
        return cls.singleton

    @cached
    def descriptor(self):
        return WidgetDescriptor(None, StateGraph())


def iterate(widget):
    """ Iterate widget or a group of widgets."""
    if isinstance(widget, GroupWidget):
        for child in widget.children:
            for grand_child in iterate(child):
                yield grand_child
    elif isinstance(widget, NullWidget):
        pass
    else:
        yield widget


class WidgetYAMLDumper(yaml.Dumper):

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
        for field in data.fields:
            value = getattr(data, field.attribute)
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


to_camelcase_re = re.compile(r'_([a-zA-Z])')

def to_camelcase(s):
    return to_camelcase_re.sub(lambda m: m.group(1).upper(), s)
