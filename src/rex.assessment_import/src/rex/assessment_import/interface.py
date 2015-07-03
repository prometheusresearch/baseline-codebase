from collections import OrderedDict
from copy import deepcopy

from rex.core import Error
from rex.instrument import InstrumentVersion
from rex.instrument.util import get_implementation


class FieldObjectAbstract(object):


    def add_field(self, instrument_definition, field_definition):
        field = self.get_field(instrument_definition, field_definition)
        self.fields[field.id] = field
        return field

    def get_field(self, instrument_definition, field_definition):
        field_type = field_definition['type']
        field_type = InstrumentVersion\
                        .get_full_type_definition(instrument_definition,
                                                  field_type)
        field_id = field_definition['id']
        base_type = field_type['base']
        description = field_definition.get('description')
        required = field_definition.get('required', False)
        field = Field(field_id, base_type, description, required)
        if base_type == 'recordList':
            for branch_field_definition in field_type['record']:
                field.add_field(instrument_definition, branch_field_definition)
        elif base_type == 'matrix':
            for row_definition in field_type['rows']:
                row_id = row_definition['id']
                required = row_definition.get('required', False)
                description = row_definition.get('description')
                for column_definition in field_type['columns']:
                    definition = deepcopy(column_definition)
                    column_id = definition['id']
                    definition['id'] = row_id + '_' + column_id
                    definition['description'] = description
                    definition['required'] = required
                    field.add_field(instrument_definition, definition)
                    field.add_row(row_id)
                    field.add_column(column_id)
        elif base_type in ('enumeration', 'enumerationSet'):
            for code, definition in field_type['enumerations'].items():
                field.add_enumeration(code, description)
        return field


class Instrument(FieldObjectAbstract):

    @classmethod
    def create(cls, instrument_version, default_tpl_fields):
        instrument = Instrument(instrument_version)
        for field_definition in instrument_version.definition['record']:
            field = instrument.add_field(instrument_version.definition,
                                         field_definition)
        instrument.add_template(instrument.id, instrument.fields,
                                default_tpl_fields)
        return instrument

    def __init__(self, instrument_version):
        self.id = instrument_version.uid
        self.title = instrument_version.definition.get('title')
        self.instrument_version = instrument_version
        self.fields = OrderedDict()
        self.templates = OrderedDict()

    def add_template(self, obj_tpl_name, fields, default_tpl_fields):
        template = self.templates.get(obj_tpl_name)
        if not template:
            template = ObjectTemplate(obj_tpl_name, self, [],
                                      default_tpl_fields)
        parent_name_list = template.parent_name_list
        for field_id, field in fields.items():
            data = OrderedDict()
            data['name'] = field_id
            data['type'] = [field.base_type]
            data['required'] = '(required)' if field.required else ''
            data['description'] = field.description or ''
            if field.base_type == 'enumeration':
                data['type'] = field.enumerations.keys()
                field.add_template(**data)
            elif field.base_type == 'enumerationSet':
                data['type'] = ['TRUE.FALSE']
                for id in field.enumerations:
                    data['name'] = enum_tpl_name = field.id + '_' + id
                    field.add_template(**data)
            elif field.base_type == 'recordList':
                rec_tpl_name  = obj_tpl_name + '.' + field.id
                rec_parent_name_list = parent_name_list + [field.id]
                rec_obj_template = ObjectTemplate(rec_tpl_name,
                                                  field,
                                                  rec_parent_name_list,
                                                  default_tpl_fields)
                self.templates[rec_tpl_name] = rec_obj_template
                self.add_template(rec_tpl_name, field.fields,
                                  default_tpl_fields)
            elif field.base_type == 'matrix':
                self.templates[obj_tpl_name] = template
                self.add_template(obj_tpl_name, field.fields,
                                  default_tpl_fields)
            else:
                field.add_template(**data)
            if field.base_type != 'recordList':
                template.add_field_output(field)
        self.templates[obj_tpl_name] = template


class Field(FieldObjectAbstract):

    def __init__(self, id, base_type, description, required):
        self.id = id
        self.base_type = base_type
        self.description = description
        self.required = required
        self.fields = OrderedDict()
        self.rows = []
        self.columns = []
        self.enumerations = OrderedDict()
        self.templates = OrderedDict()

    def add_row(self, id):
        self.rows.append(id)

    def add_column(self, id):
        self.columns.append(id)

    def add_enumeration(self, enumeration_id, description):
        self.enumerations[enumeration_id] = description

    def add_template(self, name, type, required, description):
        self.templates[name] = \
            template = FieldTemplate(name, type, required, description)
        return template


class FieldTemplate(object):

    def __init__(self, name, type, required, description):
        self.name = name
        self.type = type
        self.required = required
        self.description = description or ''
        formatted_string = '%(description)s\n%(type)s\n%(required)s' \
                           % {'description': description,
                              'type': type,
                              'required': required}
        self.formatted_string = formatted_string.strip()


class ObjectTemplate(object):

    def __init__(self, obj_tpl_name, obj, parent_name_list=[],
                 default_fields=OrderedDict()):
        self.obj_tpl_name = obj_tpl_name
        self.obj = obj
        self.output = self.blank_output(default_fields)
        self.parent_name_list = parent_name_list

    def blank_output(self, default_fields):
        output = OrderedDict()
        for (field_id, description) in default_fields.items():
            output[field_id] = description
        return output

    def add_field_output(self, field):
        for name, template in field.templates.items():
            self.output[name] = template.formatted_string


class Assessment(object):

    @classmethod
    def save(cls, instrument, data, import_context):
        root_record = data.get(instrument.id)[0]
        context = {}
        for context_type in ('subject', 'assessment'):
            validated_context = cls.validate_context(context_type,
                                                     root_record,
                                                     import_context)
            context[context_type] = validated_context
        data = cls.make_assessment_data(instrument, data)
        subject = root_record.get('subject')
        date = root_record.get('date')
        assessment = cls.create(subject, instrument.instrument_version,
                                date, data, context)
        return assessment

    @classmethod
    def validate_context(cls, context_type, record, context):
        validated = {}
        impl = get_implementation(context_type)
        context_action = impl.CONTEXT_ACTION_CREATE
        context_impl = impl.get_implementation_context(context_action)
        for param_name in context_impl:
            parameter = context_impl[param_name]
            param_value = record.get(param_name)
            if param_value is None:
                param_value = context.get(param_name)
            if parameter['required'] and ((param_value or None) is None):
                raise Error("Required `%(context_type)s` context parameter"
                            " `%(param_name)s` is not defined."
                            % {'context_type': context_type.title(),
                               'param_name': param_name
                            }
                )
            validate = parameter['validator']
            try:
                validate(param_value)
            except Exception, exc:
                raise Error("`%(context_type)s` context parameter"
                    " `%(param_name)s` got unexpected value `%(param_value)s`."
                    % {'context_type': context_type.title(),
                       'param_name': param_name,
                       'param_value': param_value
                    }, exc
                )
            validated[param_name] = param_value
        return validated

    @classmethod
    def make_assessment_data(cls, instrument, data):
        return None

    @classmethod
    def make_field_value(cls):
        pass

    @classmethod
    def create(cls, subject_id, instrument_version, date, data, context):
        subject_impl = get_implementation('subject')
        subject = None
        if subject_id:
            subject = subject_impl.get_by_uid(subject_id)
        if not subject:
            subject = subject_impl.create(subject_id,
                                    implementation_context=context['subject'])
        assessment_impl = get_implementation('assessment')
        assessment = assessment_impl.create(subject=subject,
                                instrument_version=instrument_version,
                                data=data,
                                evaluation_date=date,
                                implementation_context=context['assessment'])
        return assessment


