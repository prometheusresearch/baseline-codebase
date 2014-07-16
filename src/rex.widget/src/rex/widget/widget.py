#
# Copyright (c) 2014, Prometheus Research, LLC
#


import re
import json
import yaml
from webob import Response
from rex.core import Extension, RecordField, ProxyVal, cached


TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/bundle/bundle.css">
</head>
<body>
  <div id="__main__"></div>
  <script src="/bundle/bundle.js"></script>
  <script>
    var __REX_WIDGET_DESCRIPTOR__ = %s;
    if (window.Rex === undefined || window.Rex.Widget === undefined) {
      throw new Error('include rex-widget bower package in your application');
    }
    Rex.Widget.renderDescriptor(
      __REX_WIDGET_DESCRIPTOR__,
      document.getElementById('__main__')
    );
  </script>
</body>
</html>
"""


class Widget(Extension):

    name = None
    fields = []

    validate = ProxyVal()

    class __metaclass__(Extension.__metaclass__):

        def __new__(mcls, name, bases, members):
            cls = Extension.__metaclass__.__new__(mcls, name, bases, members)
            if 'fields' in members:
                cls.fields = [
                        RecordField(*field)
                            if isinstance(field, tuple) else field
                        for field in cls.fields]
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

    def __call__(self, req):
        accept = req.accept.best_match(['text/html', 'application/json'])
        if accept == 'application/json':
            return Response(json=self.as_json(req))
        else:
            return Response(self.as_html(req))

    def as_html(self, req):
        descriptor = self.as_json(req)
        # XXX: The indent=2 is useful for debug/introspection but hurts bytesize,
        # can we turn it on only in dev mode?
        # XXX: Check if we need more aggresive escape here!
        return TEMPLATE % json.dumps(descriptor, indent=2).replace('</', '<\\/')

    def as_json(self, req):
        props = {
            to_camelcase(name): value.as_json(req) if isinstance(value, Widget) else value
            for name, value in self.values.items()
        }
        return {
            "__type__": self.js_type,
            "props": props
        }

    def __str__(self):
        text = yaml.dump(self, Dumper=WidgetDumper)
        return text.rstrip()

    def __repr__(self):
        args = []
        for field in self.fields:
            value = getattr(self, field.attribute)
            if field.has_default and field.default == value:
                continue
            args.append("%s=%r" % (field.attribute, value))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


to_camelcase_re = re.compile(r'_([a-zA-Z])')

def to_camelcase(s):
    return to_camelcase_re.sub(lambda m: m.group(1).upper(), s)


class GroupWidget(Widget):

    fields = [
            ('children', Widget.validate),
    ]

    def as_json(self, req):
        return {
            "__children__": [child.as_json(req) for child in self.children]
        }


class NullWidget(Widget):

    singleton = None

    def __new__(cls):
        if cls.singleton is None:
            cls.singleton = Widget.__new__(cls)
        return cls.singleton

    def as_json(self, req):
        return None


class WidgetDumper(yaml.Dumper):

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


WidgetDumper.add_representer(
        unicode, WidgetDumper.represent_unicode)
WidgetDumper.add_multi_representer(
        Widget, WidgetDumper.represent_widget)


