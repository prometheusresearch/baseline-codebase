"""

    rex.widget.template
    ===================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple, OrderedDict

import yaml

from rex.core import (ValidatingLoader, get_packages, cached, autoreload,
                      guard, Error)
from rex.core import RecordVal, MapVal, SeqVal, StrVal, AnyVal

from .field import Field
from .undefined import undefined
from .widget import Widget
from .validate import WidgetVal
from .parse import WidgetDescVal, WidgetDesc, Slot
from .location import location_info_guard, locate, strip_location
from .util import get_validator_for_key


validate_widget_templates = RecordVal(
    ('widgets', MapVal(StrVal(), WidgetDescVal(allow_slots=True)))
)


class WidgetTemplate(Widget):

    template = NotImplemented

    create_widget = WidgetVal()

    @property
    def package(self):
        return self.underlying().package

    @package.setter
    def package(self, value):
        self.underlying().package = value

    def validate(self):
        self.underlying()

    @cached
    def underlying(self):
        template = fill_slots(self.template, self.values)
        return self.create_widget(template)

    @cached
    def descriptor(self):
        return self.underlying().descriptor()


def _widget_templates_from_packages(filename, open=open):
    for package in get_packages():
        if not package.exists(filename):
            continue
        stream = open(package.abspath(filename))
        spec = validate_widget_templates.parse(stream)
        for widget_name, widget_template in spec.widgets.items():
            yield widget_name, widget_template


def fill_slots(value, context):
    if isinstance(value, WidgetDesc):
        fields = OrderedDict([
            (k, fill_slots(v, context))
            for k, v in value.fields.items()
        ])
        return value._replace(fields=fields)
    elif isinstance(value, dict):
        return {k: fill_slots(v, context) for k, v in value.items()}
    elif isinstance(value, list):
        return [fill_slots(v, context) for v in value]
    elif isinstance(value, Slot):
        return context[value.name]
    else:
        return value


def _make_fields(value, scope, validator=AnyVal(), default=NotImplemented):
    fields = []
    if isinstance(value, WidgetDesc):
        if value.name not in scope:
            with guard("While parsing:", locate(value)):
                raise Error("Unknown widget", "<%s>" % value.name)
        # TODO: check if widget is built already
        widget_class = scope[value.name]
        if isinstance(widget_class, WidgetDesc):
            _build_widget_class(value.name, widget_class, scope)
            widget_class = scope[value.name]
        with guard("While constructing widget:", "<%s>" % widget_class.name):
            required_fields = [f.name for f in widget_class.fields.values() if not f.has_default]
            for n, v in value.fields.items():
                if n == None and len(required_fields) == 1:
                    n = required_fields[0]
                if not n in widget_class.fields:
                    with guard("While parsing:", locate(v)):
                        raise Error("Unknown field:", n)
                field = widget_class.fields[n]
                if isinstance(v, list):
                    for item in v:
                        if isinstance(item, WidgetDesc):
                            fields = fields + _make_fields(item, scope)
                        elif isinstance(item, Slot):
                            fields.append(field.reassign(item.name))
                elif isinstance(v, WidgetDesc):
                    fields = fields + _make_fields(v, scope)
                else:
                    fields = fields + _make_fields(v, scope, validator=field.validate, default=field.default)
    elif isinstance(value, dict):
        for k, v in value.items():
            fields += _make_fields(v, scope, validator=get_validator_for_key(validator, k))
    elif isinstance(value, list):
        for k, v in enumerate(value):
            fields += _make_fields(v, scope, validator=get_validator_for_key(validator, k))
    elif isinstance(value, Slot):
        default = default if value.default is NotImplemented else value.default
        fields.append(Field(validator, default=default, name=str(strip_location(value.name))))
    return fields


def _build_widget_classes(iterator):
    items = OrderedDict(iterator)
    scope = dict(items)
    scope.update(Widget.map_all())
    for name, template in items.items():
        _build_widget_class(name, template, scope)


def _build_widget_class(name, template, scope):
    """ Build and register a widget class

    :param name: Widget name
    :param template: Widget template
    :param scope: Currently registered or to be registered widgets
    """
    # TODO: check for conflicts
    with guard("While processing widget template:", "<%s>" % name):
        if not isinstance(template, WidgetDesc):
            error = Error("template should define a widget")
            error.wrap("Got:", repr(template))
            error.wrap("While parsing:", locate(template))
            raise error

        fields = {field.name: field for field in _make_fields(template, scope)}

    members = {
        'name': name,
        'js_type': '__template__',
        'template': template
    }
    members.update(fields)

    widget_class = Widget.__metaclass__.__new__(
        Widget.__metaclass__,
        str(name),
        (WidgetTemplate,),
        members
    )

    scope[name] = widget_class
    Widget.map_all()[name] = widget_class


def parse(stream):
    spec = validate_widget_templates.parse(stream)
    _build_widget_classes(spec.widgets.items())


@autoreload
def load(filename, open=open):
    """ Load widget templates from ``filename``.

    :keyword filename: Filename to load widget template from (relative to static
                       directory of a package)
    """
    _build_widget_classes(_widget_templates_from_packages(filename, open=open))
