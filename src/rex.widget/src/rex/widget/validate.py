"""

    rex.widget.validate
    ===================

    Validate widget object model produced by :mod:`rex.widget.parse` and turn it
    into a widget instance.

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

import yaml

from rex.core import Location
from rex.core import Validate, Error, guard, RecordVal, RecordField, StrVal

from .context import get_context
from .undefined import undefined
from .parse import WidgetDesc
from .widget import Widget, GroupWidget, NullWidget
from .location import locate, strip_location, location_info_guard


__all__ = ('validate', 'WidgetVal')


class WidgetVal(Validate):
    """ Validator for widgets."""

    def __init__(self, widget_class=None, single=False):
        self.widget_class = widget_class
        self.single = single
        super(WidgetVal, self).__init__()

    def _validate_widget(self, widget, _validate_single=True):
        if self.widget_class:
            if isinstance(widget, GroupWidget):
                for child in widget.children:
                    self._validate_widget(child, _validate_single=False)
            elif not isinstance(widget, self.widget_class):
                error = Error("Invalid widget:", "<%s>" % widget.__class__.name)
                error.wrap("Expected a widget of type:", "<%s>" % self.widget_class.name)
                raise error
        if _validate_single and self.single and isinstance(widget, GroupWidget):
            raise Error("Only single widget is allowed")
        widget.validate()
        return widget

    def _validate_widget_fields(self, widget):
        widget_class = widget.__class__
        values = {k: v for k, v in widget.values.items() if not v is undefined}

        validate = RecordVal([
            RecordField(f.name, f.validate, f.default)
            for f in widget_class.fields.values()
            if f.configurable
        ])
        validate(values)

    def _build_widget(self, value):
        # explicit widget instantiation
        if isinstance(value, WidgetDesc):
            with location_info_guard(value):
                widget_classes = Widget.map_all()
                if not value.name in widget_classes:
                    raise Error("Unknown widget found:", "<%s>" % value.name)
                widget_class = widget_classes[value.name]
                fields = value.fields.items()
        elif value == None:
            return NullWidget()
        # group widget, it's important to reuse validator so we can project
        # self.widget_class on each item
        elif isinstance(value, list):
            return GroupWidget(children=[self(v) for v in value])
        # implicit widget instantiation using self.widget_class as widget class
        elif isinstance(value, dict) and self.widget_class is not None:
            widget_class = self.widget_class
            fields = [(k, v) for k, v in value.items()]
        else:
            with location_info_guard(value):
                raise Error("Expected a widget but got:", "%r" % value)

        fields_with_no_defaults = [
            f.name for f in widget_class.fields.values()
            if not f.has_default and f.configurable]

        values = {}

        with guard("While constructing widget", "<%s>" % widget_class.name):

            for n, v in fields:
                n = strip_location(n)
                if n is None:
                    if len(fields_with_no_defaults) == 1:
                        n = fields_with_no_defaults[0]
                    else:
                        error = Error(
                            "Shorthand notation is not available for widgets",
                            "with more than a single mandatory field")
                        error.wrap("While parsing:", locate(v))
                        raise error
                with location_info_guard(v):
                    if n not in widget_class.fields:
                        raise Error("Got unexpected field:", n)
                    field = widget_class.fields[n]
                    if not field.configurable:
                        raise Error("Got unexpected field:", n)
                    field_value = field.validate(strip_location(v, recursive=True))
                values[n] = field_value

            missing_mandatory_fields = [
                f.name for f in widget_class.fields.values()
                if f.name not in values and not f.has_default]

            if missing_mandatory_fields:
                with location_info_guard(value):
                    raise Error(
                        "Missing mandatory fields:",
                        ", ".join(missing_mandatory_fields))

            for field in widget_class.fields.values():
                if not field.name in values and field.has_default:
                    values[field.name] = field.default

            context = get_context()

            if 'id' in widget_class.fields and not values.get('id'):
                values['id'] = context.generate_widget_id(widget_class)

            return widget_class(**values)

    def __call__(self, value):
        if isinstance(value, Widget):
            self._validate_widget(value)
            self._validate_widget_fields(value)
            return value
        widget = self._build_widget(value)
        with location_info_guard(value), guard("While constructing widget:", "<%s>" % widget.name):
            self._validate_widget(widget)
        return widget


def validate(obj):
    """ Validate widget object model and create and a widget instance."""
    return _validator(obj)


_validator = WidgetVal()
Widget._validate.set(_validator)
