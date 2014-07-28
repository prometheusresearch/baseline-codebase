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
        AnyVal, Error, Extension, RecordField,
        ProxyVal, StrVal, cached)
from .state import (
    State, StateDescriptor,
    StateGraph, MutableStateGraph, compute, compute_update)


# FIXME: XSS! via script_name
TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="%(script_name)s/bundle/bundle.css">
</head>
<body>
  <div id="__main__"></div>
  <script>
    var __MOUNT_PREFIX__ = "%(script_name)s";
  </script>
  <script src="%(script_name)s/bundle/bundle.js"></script>
  <script>
    var __REX_WIDGET__ = %(spec)s;
    if (window.Rex === undefined || window.Rex.Widget === undefined) {
      throw new Error('include rex-widget bower package in your application');
    }
    Rex.Widget.renderSpec(
      __REX_WIDGET__,
      document.getElementById('__main__')
    );
  </script>
</body>

"""

WidgetDescriptor = namedtuple(
        'WidgetDescriptor',
        ['ui', 'state'])


UIDescriptor = namedtuple(
        'UIDescriptor',
        ['type', 'props'])


UIDescriptorChildren = namedtuple(
        'UIDescriptorChildren',
        ['children'])

StateFieldDeclaration = namedtuple(
        'StateFieldDeclaration',
        ['name', 'field'])


class Widget(Extension):

    name = None
    fields = []

    validate = ProxyVal()

    class __metaclass__(Extension.__metaclass__):

        def __new__(mcls, name, bases, members):
            cls = Extension.__metaclass__.__new__(mcls, name, bases, members)
            if 'fields' in members:
                fields = []
                for field in cls.fields:
                    if len(field) == 3:
                        fields.append(RecordField(*field))
                    elif len(field) == 2:
                        name, validator = field
                        if hasattr(validator, 'default'):
                            fields.append(RecordField(
                                name, validator, validator.default))
                        else:
                            fields.append(RecordField(name, validator))

                cls.fields = fields

            return cls

    @staticmethod
    def state(dependencies=None):
        def decorator(computator):
            name = computator.__name__
        return decorator

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

    @property
    def fields_mapping(self):
        mapping = {}
        for field in self.fields:
            mapping[field.name] = field.validate
        return mapping

    @cached
    def descriptor(self):
        props = {}
        state = MutableStateGraph()

        for name, value in self.values.items():

            name = to_camelcase(name)

            if isinstance(value, Widget):
                descriptor = value.descriptor()
                props[name] = descriptor.ui
                state.update(descriptor.state)

            elif isinstance(value, StateDescriptor):
                value_state = value.describe_state(self.id, name)
                for prop_name, state_descriptor in value_state:
                    state[state_descriptor.id] = state_descriptor
                    if state_descriptor.rw:
                        props[prop_name] = {"__state_read_write__": state_descriptor.id}
                    else:
                        props[prop_name] = {"__state_read__": state_descriptor.id}

            else:
                props[name] = value

        return WidgetDescriptor(
                UIDescriptor(self.js_type, props),
                state.immutable())

    def __call__(self, req):
        accept = req.accept.best_match(['text/html', 'application/json'])
        if accept == 'application/json':
            spec = self.as_json(req)
            spec = to_json(spec)
            return Response(spec, content_type='application/json')
        else:
            return Response(self.as_html(req))

    def as_html(self, req):
        # XXX: The indent=2 is useful for debug/introspection but hurts bytesize,
        # can we turn it on only in dev mode?
        spec = self.as_json(req)
        spec = to_json(spec)
        return TEMPLATE % {"spec": spec, "script_name": req.script_name}

    def as_json(self, req):
        if req.method == 'GET':
            return self.produce(req)
        elif req.method == 'POST':
            return self.produce_update(req)
        else:
            raise HTTPMethodNotAllowed()

    def produce(self, req):
        widget, state = self.descriptor()
        state.show()
        state = compute(state)
        return {"ui": widget, "state": state}

    def produce_update(self, req):
        widget, state = self.descriptor()
        state.show()

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
            state, _ = compute(state)
        else:
            state, _ = compute_update(state, origins)

        return {"state": state}

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

    fields = [
            ('children', Widget.validate),
    ]

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
