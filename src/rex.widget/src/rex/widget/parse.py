"""

    rex.widget.parse
    ================

    :copyright: 2014, Prometheus Research, LLC

"""

import json
import yaml
from rex.core import Validate, StrVal, Location, Error, guard
from .widget import Widget, WidgetFactory, GroupWidget, NullWidget


class WidgetVal(Validate):

    def __call__(self, data):
        widget_classes = Widget.map_all()
        with guard("Got:", repr(data)):
            if data is None:
                return WidgetFactory(NullWidget)
            if isinstance(data, (str, unicode)) and data in widget_classes:
                widget_class = widget_classes[data]
                data = {}
            else:
                if isinstance(data, (str, unicode)):
                    try:
                        data = json.loads(data)
                    except ValueError:
                        raise Error("Expected a JSON object")
                if isinstance(data, list):
                    return WidgetFactory(GroupWidget, [self(item) for item in data])
                if not (isinstance(data, dict) and len(data) == 1 and
                        next(data.keys()) in widget_classes):
                    raise Error("Expected a widget mapping")
                name, data = next(data.items())
                widget_class = widget_classes[name]
                fields_with_no_defaults = [
                    f for f in widget_class.record_fields if not f.has_default]
                if not isinstance(data, dict):
                    if not len(fields_with_no_defaults) == 1:
                        raise Error("Expected a widget mapping")
                    data = {fields_with_no_defaults[0].name: data}
        field_by_name = dict((field.name, field)
                             for field in widget_class.record_fields)
        values = {}
        with guard("Of widget:", widget_class.name):
            for name in sorted(data):
                value = data[name]
                name = name.replace('-', '_').replace(' ', '_')
                if name not in field_by_name:
                    raise Error("Got unexpected field:", name)
                attribute = self.field_by_name[name].attribute
                values[attribute] = value
            for field in widget_class.record_fields:
                attribute = field.attribute
                if attribute in values:
                    validate = field.validate
                    with guard("While validating field:", field.name):
                        values[attribute] = validate(values[attribute])
                elif field.has_default:
                    values[attribute] = field.default
                else:
                    raise Error("Missing mandatory field:", field.name)
        return WidgetFactory(widget_class, **values)

    def construct(self, loader, node):
        widget_classes = Widget.map_all()
        location = Location.from_node(node)
        name = None
        pairs = []
        if isinstance(node, yaml.ScalarNode):
            if node.tag == u'tag:yaml.org,2002:null':
                return WidgetFactory(NullWidget)
            if node.tag.isalnum():
                name = node.tag
                if node.value:
                    value = yaml.ScalarNode(
                        u'tag:yaml.org,2002:str',
                        node.value, node.start_mark, node.end_mark,
                        node.style)
                    pairs = [(None, value)]
        elif isinstance(node, yaml.SequenceNode):
            if node.tag == u'tag:yaml.org,2002:seq':
                return WidgetFactory(GroupWidget, [
                    loader.construct_object(item, deep=True)
                    for item in node.value])
            if node.tag.isalnum():
                name = node.tag
                value = yaml.SequenceNode(
                    u'tag:yaml.org,2002:seq',
                    node.value, node.start_mark, node.end_mark,
                    node.flow_style)
                pairs = [(None, value)]
        elif isinstance(node, yaml.MappingNode):
            if node.tag.isalnum():
                name = node.tag
                pairs = node.value
        if not name:
            error = Error("Expected a widget")
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            error.wrap("While parsing:", location)
            raise error
        if name not in widget_classes:
            error = Error("Found unknown widget:", name)
            error.wrap("While parsing:", location)
            raise error
        widget_class = widget_classes[name]
        field_by_name = dict((field.name, field)
                             for field in widget_class.record_fields)
        fields_with_no_defaults = [
            f for f in widget_class.record_fields if not f.has_default]
        values = {}
        for key_node, value_node in pairs:
            if key_node is None:
                if len(fields_with_no_defaults) == 1:
                    name = fields_with_no_defaults[0].name
                    key_node = node
                else:
                    error = Error("Expected a mapping")
                    error.wrap("Got:", node.value
                                       if isinstance(node, yaml.ScalarNode)
                                       else "a %s" % node.id)
                    error.wrap("While parsing:", location)
                    raise error
            else:
                with loader.validating(StrVal()):
                    name = loader.construct_object(key_node, deep=True)
            name = name.replace('-', '_').replace(' ', '_')
            with guard("While parsing:", Location.from_node(key_node)):
                if name not in field_by_name:
                    raise Error("Got unexpected field:", name)
                if name in values:
                    raise Error("Got duplicate field:", name)
            field = field_by_name[name]
            with guard("Of widget:", widget_class.name), \
                 guard("While validating field:", name), \
                 loader.validating(field.validate):
                value = loader.construct_object(value_node, deep=True)
            values[field.attribute] = value
        for field in widget_class.record_fields:
            attribute = field.attribute
            if attribute not in values:
                if field.has_default:
                    values[attribute] = field.default
                else:
                    raise Error("Missing mandatory field:", field.name) \
                            .wrap("Of widget:", widget_class.name)
        factory = WidgetFactory(widget_class, **values)
        factory.location = location
        return factory


Widget.validate.set(WidgetVal())
