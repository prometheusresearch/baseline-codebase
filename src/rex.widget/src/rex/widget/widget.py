"""

    rex.widget.widget
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

import re
import simplejson as json
import yaml
from collections import namedtuple
from webob import Response
from webob.exc import HTTPBadRequest, HTTPMethodNotAllowed
from rex.core import (
        MaybeVal, AnyVal, Error, Extension, RecordField,
        ProxyVal, StrVal, cached)
from rex.web import render_to_response
from .state import (
    InitialValue, unknown,
    State, StateVal, StateDescriptor,
    StateGraph, MutableStateGraph, compute, compute_update)
from .jsval import JSValue


WidgetDescriptor = namedtuple(
        'WidgetDescriptor',
        ['ui', 'state'])


UIDescriptor = namedtuple(
        'UIDescriptor',
        ['type', 'props'])


UIDescriptorChildren = namedtuple(
        'UIDescriptorChildren',
        ['children'])


class Field(object):

    # we maintain order as a global counter which is used to assign ordering to
    # field instances
    order = 0

    def __new__(cls, *args, **kwargs):
        # increment global counter
        cls.order += 1
        self = object.__new__(cls, *args, **kwargs)
        # assign current order value on an instance to define ordering between
        # all Field instances
        self.order = cls.order
        return self

    def __init__(self, validator, default=RecordField.NODEFAULT):
        self.validator = validator
        self.default = default

        # TODO: remove lines below after state refactor
        if hasattr(validator, 'default'):
            self.default = validator.default

    def to_record_field(self, name):
        validator = self.validator
        if isinstance(validator, type):
            validator = validator()
        return RecordField(name, validator, self.default)


class StateField(Field):

    def __init__(self, validator, computator=None, dependencies=None, default=RecordField.NODEFAULT):
        super(StateField, self).__init__(validator, default=default)
        self.computator = computator
        self.dependencies = dependencies

    def to_record_field(self, name):
        default = unknown if self.default is RecordField.NODEFAULT else self.default

        validator = StateVal(
                MaybeVal(self.validator),
                self.computator or InitialValue(default),
                dependencies=self.dependencies)

        if default is not RecordField.NODEFAULT:
            default = validator(default)

        return RecordField(name, validator, default)

    def set_dependencies(self, dependencies):
        self.dependencies = dependencies


def state(validator, dependencies=None, default=RecordField.NODEFAULT):
    def register_computator(computator):
        return StateField(
                validator, computator,
                dependencies=dependencies,
                default=default)
    return register_computator


class Widget(Extension):

    name = None
    fields = []

    validate = ProxyVal()

    class __metaclass__(Extension.__metaclass__):

        def __new__(mcls, name, bases, members):
            cls = Extension.__metaclass__.__new__(mcls, name, bases, members)

            # collect all Field instances ordered by order attribute
            cls.fields = [
                field.to_record_field(name)
                for name, field in sorted((
                    (name, field)
                    for name, field in members.items()
                    if isinstance(field, Field)),
                    key=lambda (_, field): field.order)
            ]

            return cls

    @classmethod
    def enabled(cls):
        return (cls.name is not None)

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
            self.values[field.attribute] = arg

    @cached
    def descriptor(self):
        props = {}
        state = MutableStateGraph()

        for name, value in self.values.items():
            name = to_camelcase(name)
            if isinstance(value, Widget):
                self.on_widget(props, state, name, value)
            elif isinstance(value, JSValue):
                props[name] = {"__reference__": value.reference}
            elif isinstance(value, StateDescriptor):
                self.on_state_descriptor(props, state, name, value)
            else:
                props[name] = value

        return WidgetDescriptor(
                UIDescriptor(self.js_type, props),
                state.immutable())

    def on_widget(self, props, state, name, widget):
        descriptor = widget.descriptor()
        props[name] = descriptor.ui
        state.update(descriptor.state)

    def on_state_descriptor(self, props, state, name, state_descriptor):
        for prop_name, descriptor in state_descriptor.describe_state(self, name):
            state[descriptor.id] = descriptor
            if descriptor.rw:
                props[prop_name] = {"__state_read_write__": descriptor.id}
            else:
                props[prop_name] = {"__state_read__": descriptor.id}

    def request_to_spec(self, req):
        user = req.environ.get('rex.user')
        widget, state = self.descriptor()
        if req.method == 'GET':
            state = compute(state, user=user)
            return {"ui": widget, "state": state}
        elif req.method == 'POST':
            origins = []
            updates = {}

            for id, value in req.json.items():
                if id.startswith('update:'):
                    id = id[7:]
                    origins.append(id)

                if not id in state:
                    raise HTTPBadRequest("invalid state id: %s" % id)

                updates[id] = state[id]._replace(value=value)

            state = state.merge(updates)

            if not origins:
                state = compute(state, user=user)
            else:
                state = compute_update(state, origins, user=user)

            return {"state": state}
        else:
            raise HTTPMethodNotAllowed()

    def __call__(self, req):
        accept = req.accept.best_match(['text/html', 'application/json'])
        spec = self.request_to_spec(req)
        spec = to_json(spec)
        if accept == 'application/json':
            return Response(spec, content_type='application/json')
        else:
            return render_to_response(
                    'rex.widget:/templates/index.html', req, spec=spec)

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

        return WidgetDescriptor(UIDescriptorChildren(children), state.immutable())


class NullWidget(Widget):

    singleton = None

    def __new__(cls):
        if cls.singleton is None:
            cls.singleton = Widget.__new__(cls)
        return cls.singleton

    @cached
    def descriptor(self):
        return WidgetDescriptor(None, StateGraph())


def iterate_widget(widget):
    """ Iterate widget or a group of widgets."""
    if isinstance(widget, GroupWidget):
        for child in widget.children:
            for grand_child in iterate_widget(child):
                yield grand_child
    elif isinstance(widget, NullWidget):
        pass
    else:
        yield widget


def to_json(obj):
    encoder = WidgetJSONEncoder(
        indent=2,
        tuple_as_array=False,
        namedtuple_as_object=False
    )
    return encoder.encode(obj)


class WidgetJSONEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, UIDescriptor):
            return {"__type__": obj.type, "props": obj.props}
        if isinstance(obj, UIDescriptorChildren):
            return {"__children__": obj.children}
        if isinstance(obj, WidgetDescriptor):
            return {"ui": obj.ui, "state": obj.state}
        if isinstance(obj, StateGraph):
            return obj.storage
        if isinstance(obj, State):
            return {
                "id": obj.id,
                "value": obj.value,
                "dependencies": [dep.id
                    for dep in obj.dependencies
                    if not dep.reset_only],
                "rw": obj.rw
            }
        return super(WidgetJSONEncoder, self).default(obj)

    def encode(self, obj):
        # XXX: Check if we need more aggresive escape here!
        return super(WidgetJSONEncoder, self).encode(obj).replace('</', '<\\/')


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


def capitalize(s):
    return s[:1].upper() + s[1:]
