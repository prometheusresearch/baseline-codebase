#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Extension, RecordField, ProxyVal, cached
from webob import Response
import yaml


TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hello, world!</title>
<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">
<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap-theme.min.css">
<!--[if lt IE 9]>
<script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
<script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
<![endif]-->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
</head>
<body>

%s
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
            assert extension.name not in mapping, \
                    "duplicate widget class: %r" % extension.name
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
        for arg, field in zip(args, self.fields):
            setattr(self, field.attribute, arg)

    def __call__(self, req):
        body = TEMPLATE % self.as_html(req)
        return Response(body)

    def as_html(self, req):
        raise NotImplementedError()

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


class GroupWidget(Widget):

    fields = [
            ('children', Widget.validate),
    ]

    def as_html(self, req):
        return u"".join(child.as_html(req) for child in self.children)


class NullWidget(Widget):

    singleton = None

    def __new__(cls):
        if cls.singleton is None:
            cls.singleton = Widget.__new__(cls)
        return cls.singleton

    def as_html(self, req):
        return u""


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


