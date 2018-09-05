"""

    rex.widget.widget
    =================

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import OrderedDict
import inspect

from rex.core import ProxyVal, SeqVal, RecordField
from rex.core import Extension, Error

from .transitionable import as_transitionable
from .field import FieldBase, Field, ComputedField, ResponderField
from .util import PropsContainer

__all__ = ('Widget', 'GroupWidget', 'NullWidget', 'RawWidget')

JS_IS_STRING_ERROR_MESSAGE = """
Expected "js_type" class atribute to be a tuple of ('<pkg name>', '<symbol>')

Previously "js_type" was used to specify a JS module which exports a React
component for a widget. Now it is changed to specify a pair of JS package and a
name of the symbol exported from package's entry point which points to a React
component.

If previously "js_type" was:

    js_type = "my-app/lib/Component"

Now it should be:

    js_type = ("my-app", "Component")

While "my-app" JS package entry point (usually "static/js/lib/index.js") should
contain:

    export Component from "./Component.js"

""".strip()

class WidgetMeta(type(Extension)): # pylint: disable=no-init

    def __new__(mcs, name, bases, members): # pylint: disable=bad-classmethod-argument
        fields = [(n, field.__clone__(name=n) if field.name is None else field)
                  for n, field in list(members.items())
                  if isinstance(field, FieldBase)]
        fields.sort(key=lambda __field: -__field[1].order)
        members.update(fields)
        cls = type(Extension).__new__(mcs, name, bases, members)
        # js_type validation
        if hasattr(cls, 'js_type') and cls.js_type is not None:
            if isinstance(cls.js_type, str):
                raise Error(
                    'Error while defining %s.%s widget:' % (
                        cls.__module__, cls.__name__),
                    JS_IS_STRING_ERROR_MESSAGE)
        cls._fields = OrderedDict()
        if not (name == 'Widget' and members['__module__'] == __name__):
            cls._fields.update([f for base in bases
                                if issubclass(base, Widget)
                                for f in list(base._fields.items())])
        cls._fields.update(fields)
        cls._configuration = cls.Configuration({
            field.name: field
            for field in list(cls._fields.values())
            if isinstance(field, Field)})
        return cls


_suppress_validation = False


class Widget(Extension, metaclass=WidgetMeta):
    """ Widget class is used to define configuration interface for React
    components.

    For each React component which is to be exposed through URL mapping there
    should be a :class:`Widget` subclass defined which describes the
    configuration interface::

        class MyWidget(Widget):

            name = 'MyWidget'
            js_type = 'my-package/my-widget'

            title = Field(
                StrVal()
                doc='Title')

            hint = Field(
                StrVal(), default='No hint',
                doc='Hint')

    The snippet above defines a new widget ``MyWidget``.

    Class attribute ``name`` is used to refer to widget type from URL Mapping
    configuration. Class attribute ``js_type`` points to a CommonJS module which
    exports a React component corresponding to a widget.

    Widget defines two fields, one of them, ``title`` is required because it
    doesn't have default value while ``hint`` is optional.

    Widgets can be instantiated through YAML::

        w = Widget.parse('''
        !<MyWidget>
        title: Title
        ''')

    or directly via its constructor::

        w = Widget(title='Title')

    """

    name = None
    js_type = None

    _validate = ProxyVal()
    _validate_values = ProxyVal()
    _fields = OrderedDict()

    class Configuration(object):

        def __init__(self, fields):
            self.fields = fields

        def __call__(self, widget_class, values):
            return widget_class.validated(**values)

    @classmethod
    def parse(cls, value):
        validate = cls._validate.validate.__class__(widget_class=cls)
        if isinstance(value, str) or hasattr(value, 'read'):
            return validate.parse(value)
        else:
            raise Error('Cannot parse a widget from:', repr(value))

    @classmethod
    def validated(cls, **values):
        global _suppress_validation # pylint: disable=global-statement
        _suppress_validation = True
        try:
            return cls(**values)
        finally:
            _suppress_validation = False

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    NOT_DOCUMENTED = 'Widget is not documented'

    @classmethod
    def document_header(cls):
        if isinstance(cls.name, str):
            return str(cls.name)
        return super(Widget, cls).document_header()

    @classmethod
    def document_all(cls, package=None):
        entries = [extension.document() for extension in cls.all(package)
                       if extension.name is not None]
        entries.sort(key=(lambda e: e.header))
        return entries

    @classmethod
    def document_fields(cls):
        fields = []
        template = '  * ``{name}``\n\n      {doc}'
        for field in sorted(list(cls._fields.values()), key=(lambda f: f.name)):
            if isinstance(field, (ComputedField, ResponderField)):
                continue
            fields.append(template.format(
                name=field.name,
                doc=(field.doc or 'Field is not documented')
            ))
        fields = '\n'.join(fields)
        if fields:
            fields = '\n\nFields:\n' + fields
        return fields

    @classmethod
    def document_content(cls):
        fields = cls.document_fields()
        doc = inspect.cleandoc(cls.__doc__ or cls.NOT_DOCUMENTED) + fields
        return inspect.cleandoc(doc)

    def __init__(self, package=None, **values):
        super(Widget, self).__init__()
        global _suppress_validation # pylint: disable=global-statement
        if not _suppress_validation:
            values = self._validate_values(self.__class__, values)
        else:
            _suppress_validation = False
        self.package = package
        self.values = values

    def __clone__(self, **values):
        next_values = {}
        next_values.update(self.values)
        next_values.update(values)
        next_values['package'] = self.package
        return self.__class__(**next_values)

    def __validated_clone__(self, **values):
        next_values = {}
        next_values.update(self.values)
        next_values.update(values)
        return self.__class__.validated(**next_values)

    def __repr__(self):
        return "%s(...)" % (self.__class__.__name__,)


@as_transitionable(Widget, tag='widget')
def _format_Widget(widget, req, path): # pylint: disable=invalid-name
    values = OrderedDict()
    values.update(widget.values)
    for name, field in list(widget._fields.items()):
        if field.transitionable:
            if field.as_transitionable:
                values[name] = field.as_transitionable(widget, field(widget))
            else:
                values[name] = field(widget)
        elif name in values:
            del values[name]
    pkg_name, symbol_name = widget.js_type
    return pkg_name, symbol_name, PropsContainer(values)


class WidgetComposition(Widget):

    def __init__(self, underlying=None, **values):
        super(WidgetComposition, self).__init__(**values)
        if underlying is None:
            underlying = self.render()
        self.underlying = underlying

    def render(self):
        raise NotImplementedError('%s.render() is not implemented' % \
                                  self.__class__.__name__)

@as_transitionable(WidgetComposition)
def _format_WidgetComposition(widget, req, path): # pylint: disable=invalid-name
    return widget.underlying


class GroupWidget(Widget):

    children = Field(SeqVal(Widget._validate))


@as_transitionable(GroupWidget, tag='array')
def _format_GroupWidget(widget, req, path): # pylint: disable=invalid-name
    return widget.children


class NullWidget(Widget):

    _singleton = None

    def __new__(cls, package=None):
        if cls._singleton is None:
            cls._singleton = Widget.__new__(cls)
        return cls._singleton


@as_transitionable(NullWidget, tag='_')
def _format_NullWidget(widget, req, path): # pylint: disable=invalid-name
    return None


class RawWidget(object):

    __slots__ = ('js_type', 'values')

    def __init__(self, js_type, values):
        self.js_type = js_type
        self.values = values

@as_transitionable(RawWidget, tag='widget')
def _format_RawWidget(widget, req, path): # pylint: disable=invalid-name
    pkg_name, symbol_name = widget.js_type
    return pkg_name, symbol_name, PropsContainer(widget.values)


def raw_widget(*args, **kwargs):
    if len(args) < 1:
        raise TypeError(
            "At least one position arg should be used to define "
            "'js_type'")
    elif len(args) == 1:
        js_type = args[0]
        values = {}
    elif len(args) == 2:
        js_type = args[0]
        values = dict(args[1])
    else:
        raise TypeError("Too many positional arguments provided")
    values.update(kwargs)
    return RawWidget(js_type, values)
