from collections import OrderedDict
from copy import deepcopy
import json

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

    def blank_tpl_output(self, default_fields):
        output = OrderedDict()
        for (field_id, description) in default_fields.items():
            output[field_id] = description
        return output


class Instrument(FieldObjectAbstract):

    @classmethod
    def create(cls, instrument_version, default_tpl_fields):
        instrument = Instrument(instrument_version)
        templates = OrderedDict()
        templates[instrument.id] = instrument.blank_tpl_output(default_tpl_fields)
        for field_definition in instrument_version.definition['record']:
            field = instrument.add_field(instrument_version.definition,
                                         field_definition)
            templates = field.add_template(instrument.id,
                                           default_tpl_fields,
                                           templates)
        instrument.template.update(templates)
        return instrument

    def __init__(self, instrument_version):
        self.id = instrument_version.uid
        self.title = instrument_version.definition.get('title')
        self.instrument_version = instrument_version
        self.fields = OrderedDict()
        self.template = OrderedDict()


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
        self.template_names = OrderedDict()

    def add_row(self, id):
        self.rows.append(id)

    def add_column(self, id):
        self.columns.append(id)

    def add_enumeration(self, enumeration_id, description):
        self.enumerations[enumeration_id] = description

    def add_template(self, obj_tpl_id, default_tpl_fields, templates,
                     required=None):
        tpl_output = templates.get(obj_tpl_id)
        if not tpl_output:
            tpl_output = blank_tpl_output
        if self.base_type == 'recordList':
            rec_obj_id = obj_tpl_id + '.' + self.id
            self.template_names[rec_obj_id] = obj_tpl_id
            rec_tpl_output = self.blank_tpl_output(default_tpl_fields)
            templates[rec_obj_id] = rec_tpl_output
            for (_, record_field) in self.fields.items():
                templates = record_field.add_template(rec_obj_id,
                                                      default_tpl_fields,
                                                      templates)
        elif self.base_type == 'matrix':
            for (_, matrix_field) in self.fields.items():
                self.template_names[self.id] = obj_tpl_id
                templates = matrix_field.add_template(obj_tpl_id,
                                                      default_tpl_fields,
                                                      templates)
        elif self.base_type == 'enumerationSet':
            type = ['TRUE.FALSE']
            for id in self.enumerations:
                enum_name = self.id + '_' + id
                self.template_names[enum_name] = obj_tpl_id
                tpl_output[enum_name] = self.template_description(type=type)
        elif self.base_type == 'enumeration':
            type = self.enumerations.keys()
            tpl_output[self.id] = self.template_description(type=type)
        else:
            tpl_output[self.id] = self.template_description()
        templates[obj_tpl_id] = tpl_output
        return templates

    def template_description(self, description=None, type=None, required=None):
        description = description or self.description or ''
        type = json.dumps((type or [self.base_type]))
        required = self.required if required is None else required
        required = '(required)' if required else ''
        template_string = '\n'.join([description, type, required]).strip()
        return template_string


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
        return None
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
        record = data.get(instrument.id)
        if not record:
            return None
        assessment = cls.make_record_value(instrument, record)
        return None

    @classmethod
    def make_record_value(cls, record, data):
        for field_id, field in record.fields.items():
            pass

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


