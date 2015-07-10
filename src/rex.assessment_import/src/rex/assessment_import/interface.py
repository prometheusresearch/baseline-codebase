import json
import re
import datetime

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
        templates = OrderedDict()
        templates[instrument.id] = instrument\
                                     .get_root_template(default_tpl_fields)
        for field_definition in instrument_version.definition['record']:
            field = instrument.add_field(instrument_version.definition,
                                         field_definition)
            templates = field.add_template(instrument.id,
                                           default_tpl_fields,
                                           templates)
        instrument.template.update(templates)
        assessment_impl = get_implementation('assessment')
        assessment_data = assessment_impl.generate_empty_data(instrument
                                                            .instrument_version
                                                            .definition)
        instrument.blank_assessment = assessment_data
        return instrument

    def get_root_template(self, default_tpl_fields):
        context_template = OrderedDict()
        context_template.update(default_tpl_fields)
        impl = get_implementation('assessment')
        context_action = impl.CONTEXT_ACTION_CREATE
        context_impl = impl.get_implementation_context(context_action)
        for param_name in context_impl:
            parameter = context_impl[param_name]
            context_template[param_name] = {'required': parameter['required'],
                                            'description': ''
                                           }
        return context_template

    def __init__(self, instrument_version):
        self.id = instrument_version.uid
        self.title = instrument_version.definition.get('title')
        self.instrument_version = instrument_version
        self.fields = OrderedDict()
        self.template = OrderedDict()
        self.blank_assessment = OrderedDict()


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
        self.obj_tpl_id = None

    def add_row(self, id):
        self.rows.append(id)

    def add_column(self, id):
        self.columns.append(id)

    def add_enumeration(self, enumeration_id, description):
        self.enumerations[enumeration_id] = description

    def add_template(self, obj_tpl_id, blank, templates):
        self.obj_tpl_id = obj_tpl_id
        tpl_output = templates.get(obj_tpl_id)
        if not tpl_output:
            tpl_output = deepcopy(blank)
        if self.base_type == 'recordList':
            rec_obj_id = obj_tpl_id + '.' + self.id
            self.obj_tpl_id = rec_obj_id
            templates[rec_obj_id] = deepcopy(blank)
            for (_, record_field) in self.fields.items():
                templates = record_field.add_template(rec_obj_id,
                                                      blank,
                                                      templates)
        elif self.base_type == 'matrix':
            for (_, matrix_field) in self.fields.items():
                templates = matrix_field.add_template(obj_tpl_id,
                                                      blank,
                                                      templates)
        elif self.base_type == 'enumerationSet':
            type = ['TRUE.FALSE']
            for id in self.enumerations:
                enum_name = self.id + '_' + id
                tpl_output[enum_name] = {
                    'description': self.template_description(type=type),
                    'required': self.required
                }
        elif self.base_type == 'enumeration':
            type = self.enumerations.keys()
            tpl_output[self.id] = {
                'description': self.template_description(type=type),
                'required': self.required
            }
        else:
            tpl_output[self.id] = {
                'description': self.template_description(),
                'required': self.required
            }
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


    def __init__(self, instrument):
        self.instrument = instrument
        self.data = instrument.blank_assessment

    @classmethod
    def create(cls, instrument, import_data):
        assessment = Assessment(instrument)
        row = import_data.get(instrument.id)
        assessment.validate_with_template(instrument.id, row)
        subject = assessment.get_subject(row)
        assessment_context = assessment.get_context(row)
        evaluation_date = assessment.get_date(row)
        assessment.add_values(instrument, import_data)
        assessment_impl = get_implementation('assessment')
        assessment = assessment_impl.create(
                                subject=subject,
                                instrument_version=instrument.instrument_version,
                                data=assessment.data,
                                evaluation_date=evaluation_date,
                                implementation_context=assessment_context
                    )
        return assessment

    def validate_with_template(self, tpl_obj_id, data):
        template = self.instrument.template.get(tpl_obj_id)
        notfound = []
        data_fields = deepcopy(data)
        for name in template:
            if name in data:
                data_fields.pop(name)
            else:
                notfound.append(name)
        if data_fields:
            raise Error("Assessment data related to the `%(tpl_id)s`"
                " template contains unknown field names `%(names)s`."
                % {'names': data_fields.keys(), 'tpl_id': tpl_obj_id}
            )
        if notfound:
            raise Error("Assessment data related to the `%(tpl_id)s` template"
                " does not contain expected fields `%(names)s`."
                % {'names': notfound, 'tpl_id': tpl_obj_id}
            )

    def get_subject(self, data):
        subject_id = data.get('subject')
        if not subject_id:
            raise Error("`subject` is expected.")
        subject_impl = get_implementation('subject')
        subject = subject_impl.get_by_uid(subject_id)
        if not subject:
            raise Error("Subject `%(subject_id)s` not found in the data storage."
                        % {'subject_id': subject_id}
            )
        return subject

    def get_context(self, row):
        context = {}
        impl = get_implementation('assessment')
        context_action = impl.CONTEXT_ACTION_CREATE
        context_impl = impl.get_implementation_context(context_action)
        for param_name in context_impl:
            parameter = context_impl[param_name]
            param_value = row.get(param_name)
            if parameter['required'] and param_value in ('', None):
                raise Error("Parameter `%(param_name)s` required for Assessment"
                            " creation is undefined trough the import data."
                            % {'param_name': param_name}
                )
            validate = parameter['validator']
            try:
                validate(param_value)
            except Exception, exc:
                raise Error("Assessment parameter"
                    " `%(param_name)s` got unexpected value `%(param_value)s`."
                    % {'param_name': param_name,
                       'param_value': param_value
                    }, exc
                )
            context[param_name] = param_value
        return context

    def get_date(self, row):
        evaluation_date = row.get('date')
        if not evaluation_date:
            evaluation_date = datetime.datetime.today()
        else:
            try:
                evaluation_date = self.validate_value(evaluation_date, 'date')
                evaluation_date = datetime.datetime.strptime(evaluation_date,
                                                             '%Y-%m-%d'
                                                    )
            except Exception, exc:
                raise Error("Got unexpected value `%(value)s` of the assessment"
                        " `date`" % {'value': evaluation_date}, exc)
        return evaluation_date

    def add_values(self, instrument, data):
        values = OrderedDict()
        for field_id, field in instrument.fields.items():
            value = self.add_field_value(field, data)
            values[field.id] = {'value': value}
        self.data['values'] = values

    def add_field_value(self, field, data):
        if field.base_type == 'recordList':
            value = []
            record_data = data.get(field.obj_tpl_id, [])
            for row_data in record_data:
                self.validate_with_template(field.obj_tpl_id, row_data)
                row_value = OrderedDict()
                data[field.obj_tpl_id] = row_data
                for _, record_field in field.fields.items():
                    record_field_value = self.add_field_value(record_field,
                                                              data)
                    row_value[record_field.id] = {'value': record_field_value}
                value.append(row_value)
        elif field.base_type == 'matrix':
            value = OrderedDict()
            for row_id in field.rows:
                columns = OrderedDict()
                for column_id in field.columns:
                    matrix_field_id = row_id + '_' + column_id
                    matrix_field = field.fields[matrix_field_id]
                    matrix_field_value = self.add_field_value(matrix_field,
                                                             data)
                    columns[column_id] = {'value': matrix_field_value}
                value[row_id] = columns
        elif field.base_type == 'enumerationSet':
            value = []
            for id in field.enumerations:
                enum_id = field.id + '_' + id
                enum_value = data.get(field.obj_tpl_id, {}).get(enum_id)
                if not enum_value:
                    continue
                if str(enum_value).lower() == 'true':
                    value.append(id)
                elif str(enum_value).lower() not in ('true', 'false'):
                    raise Error("Unable to define a value of field %(field)s."
                                % {'field': field.id},
                    "Got unexpected value %(value)s of enumerationSet field"
                    " %(field)s, one of [TRUE, FALSE] is expected."
                )
            if field.required and not value:
                raise Error("Unable to define a value of field %(field)s."
                    % {'field': field.id}, "Got no value for required field."
                )
        else:
            value = data.get(field.obj_tpl_id, {}).get(field.id)
            try:
                value = self.validate_value(value=value,
                                            base_type=field.base_type,
                                            required=field.required,
                                            enumerations=field.enumerations)
            except Exception, exc:
                raise Error("Unable to define a value of field %(field)s."
                    % {'field': field.id}, exc
                )
        return value

    def validate_value(self, value, base_type, required=False, enumerations=[]):
        if isinstance(value, basestring):
            value = value.strip()
        if value in (None, ''):
            if required:
                raise Error("Got null for required field.")
            return None
        if base_type == 'integer':
            if not re.match(r'^\d+', str(value)):
                raise Error(" Got unexpected value %(value)s for"
                            " %(base_type)s type."
                            % {'value': value, 'base_type': field.base_type}
                )
            return int(value)
        if base_type == 'float':
            if not re.match(r'^-?\d+\.(\d+)', str(value)):
                raise Error(" Got unexpected value %(value)s of"
                            " %(base_type)s type."
                            % {'value': value, 'base_type': base_type}
                )
            return float(value)
        if base_type == 'boolean':
            if str(value).lower() in ('true', '1'):
                return True
            elif str(value).lower() in ('false', '0'):
                return False
            else:
                raise Error(" Got unexpected value %(value)s of"
                            " %(base_type)s type."
                            % {'value': value, 'base_type': base_type}
                )
        if base_type == 'date':
            if isinstance(value, (datetime.datetime, datetime.date)):
                return value.strftime('%Y-%m-%d')
            if isinstance(value, basestring) \
            and re.match(r'^\d\d\d\d-\d\d-\d\d$', value):
                return value
            raise Error(" Got unexpected value %(value)s of"
                        " %(base_type)s type, YYYY-MM-DD is expected."
                        % {'value': value, 'base_type': base_type}
            )
        if base_type == 'time':
            if isinstance(value, (datetime.datetime, datetime.time)):
                return value.strftime('%H:%M:%S')
            if isinstance(value, basestring) \
            and re.match(r'^\d\d:\d\d:\d\d$', value):
                return value
            raise Error(" Got unexpected value %(value)s of"
                            " %(base_type)s type, HH:MM:SS is expected."
                            % {'value': value, 'base_type': base_type}
            )
        if base_type == 'dateTime':
            if isinstance(value, datetime.datetime):
                return value.strftime('%Y-%m-%dT%H:%M:%S')
            if isinstance(value, basestring) \
            and re.match(r'^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d$', value):
                return value
            raise Error("Got unexpected value %(value)s of"
                        " %(base_type)s type, YYYY-MM-DDTHH:MM:SS is expected."
                        % {'value': value, 'base_type': base_type}
            )
        if base_type == 'enumeration':
            if unicode(value) not in enumerations:
                raise Error("Got unexpected value %(value)s of"
                    " %(base_type)s type, one of %(enumeration)s is expected."
                    % {'value': value, 'base_type': base_type,
                       'enumeration': [id for id in enumerations]
                    }
                )
            return unicode(value)
        if base_type == 'text':
            return unicode(value)
        else:
            raise Error("Got a value %(value)s of unknown %(base_type)s type."
                        % {'value': value, 'base_type': base_type}
            )
        return value
