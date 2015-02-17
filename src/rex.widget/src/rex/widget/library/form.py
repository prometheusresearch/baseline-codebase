"""

    rex.widget.library.form
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from functools import partial
from collections import OrderedDict
from logging import getLogger

from htsql.core import domain

from rex.core import Error, Validate, cached
from rex.core import OneOfVal, ChoiceVal, MaybeVal, ProxyVal, MapVal, SeqVal, RecordVal
from rex.core import IntVal, StrVal, BoolVal, AnyVal
from rex.db import get_db
from rex.web import url_for

from ..descriptors import StateRead, transform_ui, visit_ui
from ..widget import Widget, NullWidget, GroupWidget
from ..action import ActionVal
from ..field import Field, IDField, EntityField, CollectionField, undefined
from ..field.data import DataRefVal, DataSpecVal
from ..field.url import URLField
from ..field.state import StateFieldBase, StateField as _StateField
from ..validate import WidgetVal
from ..state import State, Reference
from ..json_encoder import register_adapter
from ..action import Action
from ..field.entity import EntitySpecVal
from ..util import get_validator_for_key, PropsContainer, measure_execution_time
from .layout import Box
from .base import Button


__all__ = ('Form', 'FormFieldBase', 'Field', 'Fieldset', 'RepeatingFieldset')


log = getLogger(__name__)


class SchemaNode(object):
    """ Schema node"""

    type = NotImplemented

    def __init__(self, **props):
        self.props = PropsContainer(props)

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
    def visitor(node, parent):
        if (
            isinstance(node.widget, FormWidget)
            and hasattr(node.widget, 'value_key')
            and not node is root_node
        ):
            items.append((
                tuple(node.widget.value_key),
                node.widget.form_schema(node)))
            return False
    items = []
    visit_ui(root_node, visitor, recurse=True)
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
        if isinstance(value, (list, tuple)):
            return tuple(value)
        value = self.underlying_validator(value)
        if '.' in value:
            return tuple(value.split('.'))
        else:
            return (value,)


class FormWidget(Box):
    """ Base class for form widgets."""

    name = None
    js_type = None

    label = Field(
        StrVal(), default=undefined,
        doc="""
        If no label is set then one will be autogenerated.
        """)

    hint = Field(
        StrVal(), default=undefined,
        doc="""
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
        BoolVal(), default=undefined,
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
        This can contain any widgets but those which are form elements (Field,
        Fieldset, RepeatingFieldset, ...) will be scoped under this widget's
        value key.
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

    @cached
    def state_refs(self):
        refs = {}
        root_node = self.descriptor().ui
        def visitor(node, parent):
            if isinstance(node.widget, StateField):
                refs[node.widget.value_key] = Reference(node.widget.ref)
                return False
            if isinstance(node.widget, FormContainerWidget) \
                    and not node is root_node:
                refs.update({
                    node.widget.value_key + k: v
                    for k, v in node.widget.state_refs().items()
                })
                return False
        visit_ui(root_node, visitor)
        return refs


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
    """
    Form field.
    """

    name = 'Field'
    js_type = 'rex-widget/lib/form/Field'

    disable_if = Field(
        StrVal(), default=undefined,
        doc="""
        Rex Expression expression which evaluates against form value.

        If it evaluates to ``True`` then form field will be disabled.
        """)


class ReadOnlyField(FormFieldBase):
    """
    Read only form field.
    """

    name = 'ReadOnlyField'
    js_type = 'rex-widget/lib/form/ReadOnlyField'


class CheckboxField(FormField):
    """
    Form field which renders into checkbox.
    """

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
    """
    Form field which renders into a selectbox.
    """

    name = 'SelectField'
    js_type = 'rex-widget/lib/form/SelectField'

    option_type = RecordVal(
        ('value', StrVal()),
        ('name', StrVal(), None)
    )

    id = IDField()

    options = Field(
        SeqVal(option_type),
        default=undefined,
        doc="""
        Manually specified set of options.
        """)

    data = CollectionField(
        default=undefined,
        doc="""
        Options loaded from a database.
        """)

    allow_empty = Field(
        BoolVal(), default=False,
        doc="""
        If widget allows an empty option.
        """)

    value_attribute = Field(
        StrVal(), default=undefined,
        doc="""
        The name of the attribute which is used as a value.

        If no value is set then id attribute is used.
        """)

    name_attribute = Field(
        StrVal(), default=undefined,
        doc="""
        The name of the attribute which is used as a title.

        If no value is set then title attribute is used.
        """)


class AutocompleteSpecVal(Validate):

    _validate_spec = RecordVal(
        ('data', StrVal()),
        ('refs', MapVal(StrVal(), DataRefVal()), {}),
    )

    _validate = OneOfVal(StrVal(), _validate_spec)

    def __call__(self, value):
        value = self._validate(value)
        if isinstance(value, basestring):
            value = self._validate_spec.record_type(data=value, refs={})
        return value

    def __getitem__(self, key):
        return get_validator_for_key(self._validate_spec, key)


class AutocompleteSpecField(StateFieldBase):

    _validate = AutocompleteSpecVal()

    def __init__(self, default=NotImplemented, doc=None, name=None):
        super(AutocompleteSpecField, self).__init__(
            self._validate, default=default, doc=doc, name=name)

    def compute(self, value, widget, state, graph, request):
        value = value.__clone__(data=url_for(request, value.data))
        return value


class AutocompleteField(FormField):
    """
    Form field which renders into an autocomplete.
    """

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
    """
    Form field which renders into a datepicker.
    """

    name = 'DatepickerField'
    js_type = 'rex-widget/lib/form/DatepickerField'

    start_view = Field(
        ChoiceVal('month', 'year', 'decade'), default='month',
        doc="""
        The start view of the datepicker.
        """)


class TextareaField(FormField):
    """
    Form field which renders into a textarea.
    """

    name = 'TextareaField'
    js_type = 'rex-widget/lib/form/TextareaField'

    autosize = Field(
        BoolVal(), default=False,
        doc="""
        Should the textarea resize as user adds more lines.
        """)


class FileUploadField(FormField):
    """
    Form field which handles file uploads.
    """

    name = 'FileUploadField'
    js_type = 'rex-widget/lib/form/FileUploadField'

    id = IDField()

    storage = URLField(
        doc="""
        URL for a file storage which handles file uploads.
        """)

    download = URLField(
        default=undefined,
        doc="""
        URL for a download entry point.
        """)


class FileDownloadField(FormField):
    """
    Form field which allows downloading files.

    Might be considered a read-only version of <FileUploadField />.
    """

    name = 'FileDownloadField'
    js_type = 'rex-widget/lib/form/FileDownloadField'

    download = URLField(
        doc="""
        URL for a download entry point.
        """)


class Fieldset(FormContainerWidget):
    """
    Groups a related set of fields.
    """

    name = 'Fieldset'
    js_type = 'rex-widget/lib/form/Fieldset'
    schema_type = MappingNode

    value_key = Field(
        ValueKeyVal(),
        doc="""
        The key of the value this form element should handle.
        """)


class RepeatingFieldset(FormContainerWidget):
    """
    Provides a way to manipulate a collection of records.
    """

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

        Used when adding a new child to a collection.
        """)

    min_children = Field(
        IntVal(), default=undefined,
        doc="""
        The minimum required number of children to be valid.
        """)

    remove_button_text = Field(
        StrVal(), default='Remove',
        doc="""
        Text that appears on the remove button to delete a row from the
        repeating group.
        """)

    add_button_text = Field(
        StrVal(), default='Add',
        doc="""
        Text that appears on the add button to add a row to the 
        repeating group.
        """)


    def form_schema(self, node):
        children = _build_schema(node)
        schema = ListNode(children=children)
        if self.default_value is not undefined:
            schema.props['defaultValue'] = self.default_value
        if self.default_child_value is not undefined:
            schema.props['defaultChildValue'] = self.default_child_value
        if self.min_children is not undefined:
            schema.props['min_children'] = self.min_children
        return schema

    @cached
    def state_refs(self):
        refs = super(RepeatingFieldset, self).state_refs()
        return {('*',) + k: v for k, v in refs.items()}


class StateField(Widget):
    """
    Form field which populates its value from an application state.
    """

    name = 'StateField'
    js_type = 'rex-widget/lib/Null'

    value_key = Field(
        ValueKeyVal(),
        doc="""
        The key of the value this form element should handle.
        """)

    ref = Field(
        StrVal(),
        doc="""
        The reference to appliation state from which this field's value should
        be popuated from.
        """)


class SubmitButton(Button):
    """
    Form submit button.
    """

    name = 'SubmitButton'
    js_type = 'rex-widget/lib/form/SubmitButton'

    on_submit = Field(
        ActionVal(), default=undefined)


class RemoveButton(Button):
    """
    Form remove button.
    """

    name = 'RemoveButton'
    js_type = 'rex-widget/lib/form/RemoveButton'

    on_remove = Field(
        ActionVal(), default=undefined)


class NotificationVal(Validate):

    _validate_notification = RecordVal(
        ('text', StrVal()),
        ('icon', StrVal(), None),
    )
    _validate = OneOfVal(StrVal(), _validate_notification)

    def __call__(self, value):
        value = self._validate(value)
        if isinstance(value, basestring):
            value = self._validate_notification(text=value, icon=None)
        return value


class SubmitForm(Action):

    name = 'submit-form'
    js_type = 'rex-widget/lib/actions/submitForm'

    validate = RecordVal(
        ('id', StrVal()),
        ('notification_on_complete', NotificationVal())
    )


class SubmitRemoveForm(Action):

    name = 'submit-remove-form'
    js_type = 'rex-widget/lib/actions/submitRemoveForm'

    validate = RecordVal(
        ('id', StrVal()),
    )


class ResetForm(Action):
    """ Action to reset page state."""

    name = 'reset-form'
    js_type = 'rex-widget/lib/actions/resetForm'

    validate = RecordVal(
        ('id', StrVal()),
    )


class Form(FormContainerWidget):
    """
    Form widget.
    """

    name = 'Form'
    js_type = 'rex-widget/lib/form/Form'
    schema_type = MappingNode

    id = IDField()

    value_data = EntityField(
        default=undefined,
        doc="""
        Form value loaded from database.
        """)

    save_to = Field(
        DataSpecVal(enable_refs=False), default=undefined,
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

    submitting = _StateField(
        BoolVal(), default=False,
        persistence=State.INVISIBLE,
        doc="""
        If form is currently submitting its value to server.
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
        for ref_key, ref in self.state_refs().items():
            value = update_value(value, ref_key, graph[ref])
        tag = spec.port.describe().meta.domain.fields[0].tag
        message = 'execution time %%f while persisting entity into %s' % (
            spec.route,)
        from pprint import pprint
        pprint(prev_value)
        pprint(value)
        with measure_execution_time(message=message, log=log):
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
                submitting=StateRead('%s/submitting' % self.id),
                value=StateRead('%s/value' % self.id),
                on_click=SubmitForm.make_call(id=self.id)
            )
        elif isinstance(ui.widget, RemoveButton):
            return ui._replace_props(
                on_click=SubmitRemoveForm.make_call(id=self.id)
            )
        else:
            return ui


def update_value(value, key_path, update):
    """ Update value by a keypath.

    :param value: Value to update
    :param key_path: Key path deep into value which specifies a focus in value
                     to update. If '*' specified then it asserts that that the
                     current focus is a list value and maps the remaining key
                     path.
    :param update: Update.
    """
    if not isinstance(key_path, (tuple, list)):
        key_path = key_path.split('.')
    k, ks = key_path[0], key_path[1:]
    if ks:
        if k == '*':
            if not isinstance(value, list):
                raise ValueError(
                    'attempting to process a non-list with the * key')
            value = [update_value(v, ks, update) for v in value]
        elif isinstance(value, list):
            value = value[:]
            try:
                k = int(k, 10)
            except ValueError:
                raise ValueError(
                    'found a non number key when trying to update a list value')
            value[k] = update_value(value[k], ks, update)
        else:
            value = dict(value)
            value[k] = update_value(value[k], ks, update)
    else:
        value = dict(value)
        value[k] = update
    return value
