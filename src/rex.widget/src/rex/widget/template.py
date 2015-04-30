"""

    rex.widget.template
    ===================

    Widget templates is the mechanism of defining new widgets by composing
    already existent widgets. Such compositions can be parametrised by slots.

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple, OrderedDict

import yaml

from rex.core import get_packages, cached, autoreload, guard, Error
from rex.core import RecordVal, MapVal, SeqVal, OneOrSeqVal, StrVal, AnyVal

from .field import Field
from .widget import Widget
from .validate import WidgetVal
from .parse import WidgetDescVal, WidgetDesc, Slot
from .location import locate, strip_location
from .util import get_validator_for_key

__all__ = ('parse', 'load')


validate_widget_templates = RecordVal(
    ('include', OneOrSeqVal(StrVal(r'[/0-9A-Za-z:._-]+')), []),
    ('widgets', MapVal(StrVal(), WidgetDescVal(allow_slots=True)), {}),
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
        template = _fill_slots(self.template, self.values)
        return self.create_widget(template)

    @cached
    def descriptor(self):
        return self.underlying().descriptor()


WidgetTemplateDesc = namedtuple(
    'WidgetTemplateDesc', ['name', 'package', 'filename', 'template'])


def _widget_templates_from_packages(filename, open=open):
    """ Return all widget templates defined within the active Rex app.
    
    :param filename: Filename to load widget templates from
    :returns: Pairs of template name and widget object model
    """
    for package in get_packages():
        if not package.exists(filename):
            continue
        templates = _widget_templates_from_package(package, filename, open=open)
        for template in templates:
            yield template


def _widget_templates_from_package(package, filename, open=open):
    """ Return all widget templates defined within the package.

    :param package: Package to return widget templates from
    :param filename: Filename to load widget templates from
    :returns: Pairs of template name and widget object model
    """
    abs_filename = package.abspath(filename)
    stream = open(abs_filename)
    spec = validate_widget_templates.parse(stream)
    if spec.include:
        packages = get_packages()
        for include in spec.include:
            if not ':' in include:
                include = '%s:%s' % (package.name, include)
            include_package, include_path = include.split(':', 1)
            if not include_package in packages:
                raise Error(
                    "cannot include %s from %s" % (
                        spec.include, abs_filename),
                    "no %s package found" % (
                        include_package,))
            include_package = packages[include_package]
            if not include_package.exists(include_path):
                raise Error(
                    "cannot include %s from %s" % (
                        spec.include, abs_filename),
                    "file %s cannot be found inside %s package" % (
                        include_path, include_package.name))
            templates = _widget_templates_from_package(include_package, include_path, open=open)
            for template in templates:
                yield template
    for name, template in spec.widgets.items():
        yield WidgetTemplateDesc(
            name=name,
            package=package,
            filename=filename,
            template=template)


def _fill_slots(node, context):
    """ Fill slots in widget object model with values from ``context``.

    :param node: Widget object model
    :param context: Dictionary with values for slots
    """
    if isinstance(node, WidgetDesc):
        fields = OrderedDict([
            (k, _fill_slots(v, context))
            for k, v in node.fields.items()
        ])
        return node._replace(fields=fields)
    elif isinstance(node, dict):
        return {k: _fill_slots(v, context) for k, v in node.items()}
    elif isinstance(node, list):
        return [_fill_slots(v, context) for v in node]
    elif isinstance(node, Slot):
        return context[node.name]
    else:
        return node


def _make_fields(node, scope, _validator=AnyVal(), _default=NotImplemented):
    """ Construct fields by inspecting slot position in widget object model.

    :param node: Widget object model
    :param scope: Dictionary of already built widgets/widget templates.
    """
    fields = []
    if isinstance(node, WidgetDesc):
        if node.name not in scope:
            with guard("While parsing:", locate(node)):
                raise Error("Unknown widget", "<%s>" % node.name)
        # TODO: check if widget is built already
        widget_class = scope[node.name]
        if isinstance(widget_class, WidgetTemplateDesc):
            _build_widget_class(widget_class, scope)
            widget_class = scope[node.name]
        with guard("While constructing widget:", "<%s>" % widget_class.name):
            required_fields = [f.name for f in widget_class.fields.values() if not f.has_default]
            for n, v in node.fields.items():
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
                            new_field = fields.reassign(item.name)
                            if item.doc:
                                new_field.__doc__ = item.doc
                            fields.append(new_field)
                elif isinstance(v, WidgetDesc):
                    fields = fields + _make_fields(v, scope)
                else:
                    fields = fields + _make_fields(
                        v, scope,
                        _validator=field.validate, _default=field.default)
    elif isinstance(node, dict):
        for k, v in node.items():
            fields += _make_fields(v, scope, _validator=get_validator_for_key(_validator, k))
    elif isinstance(node, list):
        for k, v in enumerate(node):
            fields += _make_fields(v, scope, _validator=get_validator_for_key(_validator, k))
    elif isinstance(node, Slot):
        default = _default if node.default is NotImplemented else node.default
        field = Field(_validator, default=default, name=str(strip_location(node.name)))
        if node.doc:
            field.__doc__ = node.doc
        fields.append(field)
    return fields


def _build_widget_classes(iterator):
    items = list(iterator)
    scope = {}
    scope.update({d.name: d for d in items})
    scope.update(Widget.map_all())
    for desc in items:
        _build_widget_class(desc, scope)


def _build_widget_class(desc, scope):
    """ Build and register a widget class

    :param name: Widget name
    :param template: Widget template
    :param scope: Currently registered or to be registered widgets
    """
    # TODO: check for conflicts
    with guard("While processing widget template:", "<%s>" % desc.name):
        if not isinstance(desc.template, WidgetDesc):
            error = Error("template should define a widget")
            error.wrap("Got:", repr(desc.template))
            error.wrap("While parsing:", locate(desc.template))
            raise error

        fields = {field.name: field for field in _make_fields(desc.template, scope)}

    members = {
        'name': desc.name,
        'js_type': '__template__',
        'template': desc.template,
        'template_location': '%s:%s' % (desc.package.name, desc.filename)
    }
    members.update(fields)

    widget_class = Widget.__metaclass__.__new__(
        Widget.__metaclass__,
        str(desc.name),
        (WidgetTemplate,),
        members
    )

    scope[desc.name] = widget_class
    # FIXME: this is hacky, we need another solution
    Widget.map_all()[desc.name] = widget_class


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
