"""

    rex.widget.library.form
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from functools import partial
from collections import OrderedDict

from htsql.core import domain

from rex.core import Error, Validate, cached
from rex.core import ChoiceVal, MaybeVal, ProxyVal, MapVal, SeqVal, RecordVal
from rex.core import StrVal, BoolVal, AnyVal
from rex.db import get_db
from rex.web import url_for

from ..descriptors import StateRead, transform_ui, visit_ui
from ..widget import Widget, NullWidget, GroupWidget
from ..action import ActionVal
from ..field import Field, IDField, EntityField, CollectionField, undefined
from ..field.data import DataRefVal, DataSpecVal
from ..field.state import StateFieldBase
from ..validate import WidgetVal
from ..state import State
from ..json_encoder import register_adapter
from ..action import Action
from ..field.entity import EntitySpecVal
from ..util import get_validator_for_key, PropsContainer
from .layout import Box
from .base import Button


class SchemaNode(object):
    """ Schema node"""

    type = NotImplemented

    def __init__(self, **props):
        self.props = props

    def __str__(self):
        return '<%s %r>' % (self.__class__.__name__, self.props)

    __unicode__ = __str__
    __repr__ = __str__


@register_adapter(SchemaNode)
def _encode_SchemaNode(node):
    data = {k: v for k, v in node.props.items() if v is not undefined}
    data['__type__'] = node.type
    return data


class ScalarNode(SchemaNode):
    """ Scalar node"""

    type = 'scalar'


class MappingNode(SchemaNode):
    """ Mapping node"""

    type = 'mapping'

    CHILDREN_KEY = 'children'

    def __init__(self, **props):
        props.setdefault(self.CHILDREN_KEY, OrderedDict())
        super(MappingNode, self).__init__(**props)

    @property
    def children(self):
        return self.props[self.CHILDREN_KEY]
    
    def __getitem__(self, key):
        return self.children[key]

    def __setitem__(self, key, value):
        self.children[key] = value

    def __contains__(self, key):
        return key in self.children

    def merge(self, node):
        if not isinstance(node, self.__class__):
            raise TypeError(
                'node must be of type %s, got %r instead' %
                (self.__class__.__name__, type(self)))

        children = OrderedDict()
        children.update(self.children)
        children.update(node.children)

        props = {}
        props.update(self.props)
        props.update(node.props)
        props[self.CHILDREN_KEY] = children


        return self.__class__(**props)

    __add__ = merge

    @classmethod
    def empty(cls):
        return cls()


class ListNode(SchemaNode):
    """ List node"""

    type = 'list'

    CHILDREN_KEY = 'children'

    @property
    def children(self):
        return self.props[self.CHILDREN_KEY]

    def __getitem__(self, key):
        return self.children[key]

    def __setitem__(self, key, value):
        self.children[key] = value

    def __contains__(self, key):
        return key in self.children

    @classmethod
    def empty(cls):
        return cls(children=MappingNode.empty())

    def merge(self, node):
        if not isinstance(node, self.__class__):
            raise TypeError(
                'node must be of type %s, got %r instead' %
                (self.__class__.__name__, type(self)))

        props = dict(self.props)
        props['children'] = self.children.merge(node.children)
        return self.__class__(**props)

    __add__ = merge


def _merge_deep(result, ks, v):
    k, ks = ks[0], ks[1:]
    while k.isdigit() and ks:
        k, ks = ks[0], ks[1:]
    if ks:
        if not k in result:
            if ks and ks[0].isdigit():
                result[k] = ListNode.empty()
            else:
                result[k] = MappingNode.empty()
        _merge_deep(result[k], ks, v)
    else:
        result[k] = v if k not in result else (result[k] + v)


def _build_schema(root_node):
    def visitor(node):
        if (
            isinstance(node.widget, FormWidget)
            and hasattr(node.widget, 'value_key')
            and not node is root_node
        ):
            items.append((
                tuple(node.widget.value_key),
                node.widget.form_schema(node)))
    items = []
    visit_ui(root_node, visitor, recurse=False)
    items = sorted(items, key=lambda (ks, v): len(ks))
    children = OrderedDict()
    for ks, v in items:
        if not ks:
            raise ValueError('composite key cannot be empty')
        if len(ks) == 1:
            k = ks[0]
            children[k] = v if k not in children else (children[k] + v)
        else:
            _merge_deep(children, ks, v)

    return MappingNode(children=children)


class ValueKeyVal(Validate):

    underlying_validator = StrVal()

    def __call__(self, value):
        if isinstance(value, list):
            return value
        value = self.underlying_validator(value)
        if '.' in value:
            return value.split('.')
        else:
            return [value]


class FormWidget(Box):
    """ Base class for form widgets."""

    name = None
    js_type = None

    label = Field(
        StrVal(), default=undefined,
        doc="""
        Label

        If no label is set then one will be autogenerated.
        """)

    hint = Field(
        StrVal(), default=undefined,
        doc="""
        Hint

        Can be used to provide a detailed descritption regarding form element.
        """)

    required = Field(
        BoolVal(), default=False,
        doc="""
        If the form element is requied or not.
        """)

    default_value = Field(
        AnyVal(), default=undefined,
        doc="""
        Default value.
        """)

    compact = Field(
        BoolVal(), default=False,
        doc="""
        If form widget should be rendered in "compact" style.

        This is up to widget to decide how to do so.
        """)

    no_label = Field(
        BoolVal(), default=False,
        doc="""
        Disable rendering label.
        """)

    def form_schema(self, node):
        """ Return form schema."""
        raise NotImplementedError()


class FormContainerWidget(FormWidget):
    """ Base class for form widgets which contain other form widgets."""

    schema_type = NotImplemented

    fieldset = Field(
        WidgetVal(),
        default=NullWidget(),
        doc="""
        Form fields.

        This should contain a single form widget or a list of form widgets.
        """)

    @cached
    def descriptor(self):
        descriptor = super(FormContainerWidget, self).descriptor()
        descriptor.ui.props.fieldset = descriptor.ui.props.fieldset._replace(defer=True)
        return descriptor

    def form_schema(self, node):
        schema = _build_schema(node)
        if self.default_value is not undefined:
            schema.props['defaultValue'] = self.default_value
        return schema


class FormFieldBase(FormWidget):
    """ Base class for form fields."""

    value_key = Field(
        ValueKeyVal(),
        doc="""
        The key of the value this form element should handle.
        """)

    def form_schema(self, node):
        schema = ScalarNode(
            label=self.label,
            hint=self.hint,
            required=self.required
        )
        if self.default_value is not None:
            schema.props['defaultValue'] = self.default_value
        return schema


class FormField(FormFieldBase):
    """ Form field widget."""

    name = 'Field'
    js_type = 'rex-widget/lib/form/Field'

    disable_if = Field(
        StrVal(), default=undefined)


class ReadOnlyField(FormFieldBase):
    """ Read only form field."""

    name = 'ReadOnlyField'
    js_type = 'rex-widget/lib/form/ReadOnlyField'


class CheckboxField(FormField):

    name = 'CheckboxField'
    js_type = 'rex-widget/lib/form/CheckboxField'

    def form_schema(self, node):
        schema = super(CheckboxField, self).form_schema(node)
        schema.props['type'] = 'bool'
        return schema


class IntegerField(FormField):

    name = 'IntegerField'
    js_type = 'rex-widget/lib/form/IntegerField'

    def form_schema(self, node):
        schema = super(IntegerField, self).form_schema(node)
        schema.props['type'] = 'number'
        return schema


class SelectField(FormField):
    """ Select form field.
    """

    name = 'SelectField'
    js_type = 'rex-widget/lib/form/SelectField'

    option_type = RecordVal(
        ('value', StrVal()),
        ('name', StrVal(), None)
    )

    options = Field(
        SeqVal(option_type),
        doc="""
        Manually specified options.
        """)

    allow_empty = Field(
        BoolVal(), default=False,
        doc="""
        If widget allows an empty option.
        """)


class AutocompleteSpecVal(Validate):

    _validate = RecordVal(
        ('data', StrVal()),
        ('filter', StrVal()),
        ('refs', MapVal(StrVal(), DataRefVal()), {}),
    )

    def __call__(self, value):
        return self._validate(value)

    def __getitem__(self, key):
        return get_validator_for_key(self._validate, key)


class AutocompleteSpecField(StateFieldBase):

    _validate = AutocompleteSpecVal()

    def __init__(self, default=NotImplemented, doc=None, name=None):
        super(AutocompleteSpecField, self).__init__(
            self._validate, default=default, doc=doc, name=name)

    def compute(self, value, widget, state, graph, request):
        value = value.__clone__(data=url_for(request, value.data))
        return value


class AutocompleteField(FormField):
    """ Field which renders into autocomplete."""

    name = 'AutocompleteField'
    js_type = 'rex-widget/lib/form/AutocompleteField'

    id = IDField()

    data = AutocompleteSpecField(
        doc="""
        A specification of an autocomplete dataset.
        """)

    value_attribute = Field(
        StrVal(), default=undefined,
        doc="""
        The name of the attribute which is used as a value.

        If no value is set then id attribute is used.
        """)

    title_attribute = Field(
        StrVal(), default=undefined,
        doc="""
        The name of the attribute which is used as a title.

        If no value is set then title attribute is used.
        """)


class DatepickerField(FormField):

    name = 'DatepickerField'
    js_type = 'rex-widget/lib/form/DatepickerField'

    start_view = Field(
        ChoiceVal('month', 'year', 'decade'), default='month')


class TextareaField(FormField):

    name = 'TextareaField'
    js_type = 'rex-widget/lib/form/TextareaField'

    autosize = Field(
        BoolVal(), default=False,
        doc="""
        Should the textarea resize as user adds more lines.
        """)


class Fieldset(FormContainerWidget):
    """ Fieldset form widget."""

    name = 'Fieldset'
    js_type = 'rex-widget/lib/form/Fieldset'
    schema_type = MappingNode

    value_key = Field(
        ValueKeyVal(),
        doc="""
        The key of the value this form element should handle.
        """)


class RepeatingFieldset(FormContainerWidget):
    """ Repeating fieldset form widget."""

    name = 'RepeatingFieldset'
    js_type = 'rex-widget/lib/form/RepeatingFieldset'
    schema_type = ListNode

    value_key = Field(
        ValueKeyVal(),
        doc="""
        The key of the value this form element should handle.
        """)

    default_child_value = Field(
        AnyVal(), default=undefined,
        doc="""
        Default child value.
        """)

    def form_schema(self, node):
        children = _build_schema(node)
        schema = ListNode(children=children)
        if self.default_value is not undefined:
            schema.props['defaultValue'] = self.default_value
        if self.default_child_value is not undefined:
            schema.props['defaultChildValue'] = self.default_child_value
        return schema


class SubmitButton(Button):
    """ Form submit button."""

    name = 'SubmitButton'
    js_type = 'rex-widget/lib/form/SubmitButton'

    on_submit = Field(
        ActionVal(), default=undefined)


class RemoveButton(Button):
    """ Form remove button."""

    name = 'RemoveButton'
    js_type = 'rex-widget/lib/form/RemoveButton'

    on_remove = Field(
        ActionVal(), default=undefined)


class SubmitForm(Action):

    name = 'submit-form'
    js_type = 'rex-widget/lib/actions/submitForm'


class SubmitRemoveForm(Action):

    name = 'submit-remove-form'
    js_type = 'rex-widget/lib/actions/submitRemoveForm'


class ResetForm(Action):
    """ Action to reset page state."""

    name = 'reset-form'
    js_type = 'rex-widget/lib/actions/resetForm'


class Form(FormContainerWidget):
    """ Form widget."""

    name = 'Form'
    js_type = 'rex-widget/lib/form/Form'
    schema_type = MappingNode

    id = Field(StrVal())

    value_data = EntityField(
        default=undefined,
        doc="""
        Form value loaded from database.
        """)

    save_to = Field(
        DataSpecVal(), default=undefined,
        doc="""
        Optional port/query which is used to save form value.
        """)

    class_name = Field(
        StrVal(), default=undefined,
        doc="""
        Extra CSS class name.
        """)

    _submit_button = SubmitButton(
        text='Submit',
        icon='plus',
        success=True
    )

    controls = Field(
        WidgetVal(), default=_submit_button,
        doc="""
        Widgets to render into controls.
        """)

    submit_on_change = Field(
        BoolVal(), default=False,
        doc="""
        If form should automatically submit its value on each change.
        """)

    @Widget.define_state(
        AnyVal(),
        manager='rex-widget/lib/form/FormStateManager',
        default=undefined,
        persistence=State.INVISIBLE,
        dependencies=['value_data'],
        doc="""
        Initial form value.
        """)
    def value(self, state, graph, request):
        if self.value_data:
            value = graph[self.id].value_data
            if value:
                return value.data

    @value.set_updater
    def update_value(self, state, graph, request):
        prev_value = graph[self.id].value_data.data if graph[self.id].get('value_data') else None
        spec = self.save_to if self.save_to else self.value_data
        value = state.value
        if value is not None:
            value = dict(value)
            # copy refs over to value
            for key, ref in spec.refs.items():
                for r in ref:
                    value[key] = graph[r]
        # determine tag of the entity
        tag = spec.port.describe().meta.domain.fields[0].tag
        if value is None:
            spec.port.delete([{'id': prev_value['id']}])
            return prev_value
        elif prev_value is None:
            spec.port.insert({tag: value})
        else:
            spec.port.replace({tag: prev_value}, {tag: value})
        return value

    @cached
    def descriptor(self):
        desc = super(Form, self).descriptor()
        desc = desc._replace(ui=transform_ui(desc.ui, self._transform_ui))
        schema = self.form_schema(desc.ui)
        params = PropsContainer({
            'schema': schema,
            'submit_on_change': self.submit_on_change,
        })
        value = desc.state[self.id].value._replace(params=params)
        return desc._replace(state=desc.state.add(value))

    def _transform_ui(self, ui):
        if ui.widget is not self and isinstance(ui.widget, FormWidget):
            return ui._replace_props(value=StateRead('%s/value' % self.id))
        elif isinstance(ui.widget, SubmitButton):
            return ui._replace_props(
                on_click=SubmitForm.make_call(id='%s/value' % self.id)
            )
        elif isinstance(ui.widget, RemoveButton):
            return ui._replace_props(
                on_click=SubmitRemoveForm.make_call(id='%s/value' % self.id)
            )
        else:
            return ui
