import json
import re
import datetime
import time
import traceback

from collections import OrderedDict
from copy import deepcopy

from rex.core import Error, get_settings
from rex.instrument import InstrumentVersion
from rex.instrument.util import get_implementation
from rios.core.output import Instrument as InstrumentOutput, _get_struct
from rios.core.output.common import get_json

from .error import AssessmentImportError


__all__ = (
    'Instrument',
    'TemplateCollection',
    'collect_assessment_data',
    'Assessment',
)

class Field(object):

    def __init__(self, id, base_type, required, description):
        self.id = id
        self.base_type = base_type
        self.required = required
        self.description = description
        self.fields = OrderedDict()
        self.rows = []
        self.columns = []
        self.enumerations = OrderedDict()

    def add_field(self, version_definition, field_definition):
        field_type = InstrumentVersion.get_full_type_definition(
                                            version_definition,
                                            field_definition['type'])
        field_id = field_definition['id']
        base_type = field_type['base']
        description = field_definition.get('description', '')
        required = field_definition.get('required', False)
        field = Field(field_id, base_type, required, description)
        if base_type == 'recordList':
            for branch_field_definition in field_type['record']:
                branch_field = field.add_field(version_definition,
                                               branch_field_definition)
                field.fields[branch_field.id] = branch_field
        elif base_type == 'matrix':
            for row_definition in field_type['rows']:
                row_id = row_definition['id']
                required = row_definition.get('required', False)
                description = row_definition.get('description', '')
                field.rows.append(row_id)
                for column_definition in field_type['columns']:
                    matrix_definition = deepcopy(column_definition)
                    column_id = matrix_definition['id']
                    field.columns.append(column_id)
                    matrix_definition['id'] = row_id + '_' + column_id
                    matrix_definition['description'] = \
                        column_definition.get('description') or description
                    matrix_definition['required'] = \
                        required or column_definition.get('required', False)
                    matrix_field = field.add_field(version_definition,
                                                   matrix_definition)
                    field.fields[matrix_field.id] = matrix_field
        elif base_type in ('enumeration', 'enumerationSet'):
            for code, description in field_type['enumerations'].items():
                field.enumerations[code] = description
        return field


class Instrument(Field):

    def __init__(self, id, instrument_definition):
        self.id = id
        self.fields = OrderedDict()
        self.default_fields = get_settings().assessment_template_defaults
        assessment_impl = get_implementation('assessment')
        action = assessment_impl.CONTEXT_ACTION_CREATE
        self.context_fields = assessment_impl.get_implementation_context(action)
        for field_definition in instrument_definition['record']:
            field = self.add_field(instrument_definition, field_definition)
            self.fields[field.id] = field
        self.blank_assessment = assessment_impl.generate_empty_data(
                                                    instrument_definition)


class TemplateCollection(object):

    def __init__(self, instrument):
        self.instrument = instrument
        self.template_map = OrderedDict()
        self.add_fields(instrument.id, instrument.fields)

    def __iter__(self):
        return iter(self.template_map.items())

    def add_fields(self, id, fields):
        template = self.template_map.get(id, OrderedDict())
        self.template_map[id] = template
        default_fields = self.instrument.default_fields
        if id == self.instrument.id:
            default_fields = OrderedDict(
                    default_fields.items() +
                    self.instrument.context_fields.items())
        for (name, parameter) in default_fields.items():
            self.add_field(id,
                           name,
                           parameter.get('required', False),
                           parameter.get('type', ''),
                           parameter.get('description', ''))
        for field_id, field in fields.items():
            type = field.base_type
            if field.base_type in ('recordList', 'matrix'):
                self.add_fields(id+'.'+field.id, field.fields)
                continue
            elif field.base_type == 'enumeration':
                type = ','.join(field.enumerations.keys())
            elif field.base_type == 'enumerationSet':
                type = 'TRUE,FALSE'
                for key in field.enumerations:
                    self.add_field(id, field_id+'_'+key,
                                   field.required,
                                   type,
                                   field.description)
                continue
            self.add_field(id, field_id, field.required, type, field.description)

    def add_field(self, id, name, required, type, description):
        template = self.template_map.get(id)
        required = '(required)' if required else ''
        template[name] = '; '.join(
            [item.strip() for item in [description, type, required] if item])
        self.template_map[id] = template


def collect_assessment_data(data, templates):
    assessments = OrderedDict()
    for template_id, template in templates:
        records = data.get(template_id)
        if not records:
            continue
        data_header = set(records[0].keys())
        template_header = set(template.keys())
        extra = data_header - template_header
        shortage = template_header - data_header
        if extra:
            raise Error("%s data header contains extra columns %s."
                        % (template_id, ', '.join(extra)))
        if shortage:
            raise Error("%s data header does not contain expected columns %s."
                        % (template_id, ', '.join(shortage)))
        for rec in records:
            assessment_id = rec['assessment_id']
            assessment = assessments.get(assessment_id, OrderedDict())
            assessment_values = assessment.get(template_id, [])
            assessment_values.append(rec)
            assessment[template_id] = assessment_values
            assessments[assessment_id] = assessment
    return assessments


class Assessment(object):

    def __init__(self,instrument, id, data):
        self.instrument = instrument
        self.id = id
        self.data = data

    def create_bulk_assessment(self):
        instrument_data = self.data.get(self.instrument.id)
        if not instrument_data:
            raise Error("Instrument %s record not found in import data."
                        % self.instrument.id)
        instrument_data = instrument_data[0]
        context = self.get_context(instrument_data)
        evaluation_date = self.get_evaluation_date(instrument_data)
        data = self.instrument.blank_assessment
        values = OrderedDict()
        for _, field in self.instrument.fields.items():
            value = self.make_value(field, instrument_data)
            values[field.id] = {'value': value}
        data['values'] = values
        assessment_impl = get_implementation('assessment')
        assessment = assessment_impl.BulkAssessment(
                            subject_uid=instrument_data['subject'],
                            instrument_version_uid=self.instrument.id,
                            evaluation_date=evaluation_date,
                            context=context,
                            data=data
                     )
        return assessment

    def get_context(self, data):
        context = {}
        for field_id, field in self.instrument.context_fields.items():
            value = data.get(field_id)
            if field['required'] and value is None:
                raise Error("%s value is required in %s."
                            % (field.id, self.instrument.id))
            if value not in (None,''):
                try:
                    field['validator'](value)
                except Error, exc:
                    raise Error("Got unexpected %s value in %s"
                                % (field.id, self.instrument.id), exc)
                context[field_id] = value
        return context

    def get_evaluation_date(self, data):
        evaluation_date = data.get('date')
        if isinstance(evaluation_date, unicode):
            evaluation_date = evaluation_date.encode('utf-8', 'replace')
        if not evaluation_date:
            evaluation_date = datetime.datetime.today()
        elif isinstance(evaluation_date, (int, float)):
            evaluation_date = (datetime.datetime(1899, 12, 30) +
                               datetime.timedelta(days=evaluation_date))
        elif (isinstance(evaluation_date, basestring)
        and not re.match(r'^\d\d\d\d-\d\d-\d\d$', evaluation_date)):
            raise Error("Unexpected value %s for evaluation_date."
                        % evaluation_date)
        else:
            evaluation_date = datetime.datetime.strptime(evaluation_date,
                                                         '%Y-%m-%d')
        return evaluation_date.date()

    def make_value(self, field, data):
        if field.base_type == 'recordList':
            record_id = self.instrument.id + '.' + field.id
            record_data = self.data.get(record_id)
            try:
                value = self.make_record_value(field, record_data)
            except Exception, exc:
                raise AssessmentImportError(exc, template_id=record_id)
        elif field.base_type == 'matrix':
            matrix_id = self.instrument.id + '.' + field.id
            matrix_data = self.data.get(matrix_id)
            if matrix_data: matrix_data = matrix_data[0]
            try:
                value = self.make_matrix_value(field, matrix_data)
            except Exception, exc:
                raise AssessmentImportError(exc, template_id=matrix_id)
        elif field.base_type == 'enumerationSet':
            if len(data) == 1: data = data[0]
            value = self.make_enumerationset_value(field, data)
        else:
            if len(data) == 1: data = data[0]
            value = self.make_simple_value(field, data.get(field.id))
        return value

    def make_record_value(self, field, data):
        if not data: return None
        recordList = []
        for record_data in data:
            record = OrderedDict()
            for _, record_field in field.fields.items():
                record_field_value = self.make_value(record_field, record_data)
                record[record_field.id] = {'value': record_field_value}
            recordList.append(record)
        return recordList or None

    def make_matrix_value(self, field, data):
        if not data: return None
        value = OrderedDict()
        for row_id in field.rows:
            row_columns = OrderedDict()
            for column_id in field.columns:
                matrix_field = field.fields[row_id + '_' + column_id]
                matrix_value = self.make_value(matrix_field, data)
                row_columns[column_id] = {'value': matrix_value}
            value[row_id] = row_columns
        return value or None

    def make_enumerationset_value(self, field, data):
        value = []
        for id in field.enumerations:
            enum_id = field.id + '_' + id
            enum_value = data[enum_id]
            if isinstance(enum_value, str):
                enum_value = enum_value.decode('utf-8', 'replace')
            if enum_value in (None, ''):
                continue
            if unicode(enum_value).lower() in ('1', 'true'):
                enum_value = 'TRUE'
            if unicode(enum_value).lower() in ('0', 'false'):
                enum_value = 'FALSE'
            if enum_value not in ('TRUE', 'FALSE'):
                raise Error("Got unexpected value %s for %s."
                            % (enum_value, enum_id),
                            "TRUE or FALSE is expected for enumerationSet field")
            if enum_value == 'TRUE':
                value.append(id)
        if field.required and not value:
            raise Error("Not found value of required field %s" % field.id)
        return value or None

    def make_simple_value(self, field, data):
        value = self.validate(field, data)
        return value

    def validate(self, field, value):
        if isinstance(value, basestring):
            value = value.strip()
        if isinstance(value, str):
            value = value.decode('utf-8', 'replace')
        if value in (None, ''):
            if field.required:
                raise Error("Got null for required field %s." % field.id)
            return None
        if field.base_type == 'integer':
            if not re.match(r'^\-?\d+(\.0)?$', unicode(value), re.UNICODE):
                raise Error(" Got unexpected value %(value)s for field %(id)s"
                            " of %(base_type)s type."
                            % {'value': value,
                               'base_type': field.base_type,
                               'id': field.id}
                )
            return int(value)
        if field.base_type == 'float':
            if not re.match(r'^-?\d+(\.\d+)?$', unicode(value), re.UNICODE):
                raise Error(" Got unexpected value %(value)s for"
                            " %(base_type)s type field %(id)s."
                            % {'value': value,
                               'base_type': field.base_type,
                               'id': field.id}
                )
            return float(value)
        if field.base_type == 'boolean':
            if unicode(value).lower() in ('true', '1'):
                return True
            elif unicode(value).lower() in ('false', '0'):
                return False
            else:
                raise Error(" Got unexpected value %(value)s of"
                            " %(base_type)s type field %(id)s."
                            % {'value': value,
                               'base_type': field.base_type,
                               'id': field.id}
                )
        if field.base_type == 'date':
            if isinstance(value, (datetime.datetime, datetime.date)):
                return value.strftime('%Y-%m-%d')
            if isinstance(value, basestring) \
            and re.match(r'^\d\d\d\d-\d\d-\d\d$', value, re.UNICODE):
                return value
            if isinstance(value, (int, float)):
                value = (datetime.datetime(1899, 12, 30) +
                         datetime.timedelta(days=value)).strftime('%Y-%m-%d')
                return value
            raise Error(" Got unexpected value %(value)s of"
                        " %(base_type)s type,"
                        " YYYY-MM-DD is expected for field %(id)s."
                        % {'value': value,
                           'base_type': field.base_type,
                           'id': field.id}
            )
        if field.base_type == 'time':
            if isinstance(value, (datetime.datetime, datetime.time)):
                return value.strftime('%H:%M:%S')
            elif isinstance(value, (int, float)):
                delta = datetime.timedelta(days=value)
                return time.strftime("%H:%M:%S",time.gmtime(delta.seconds))
            if isinstance(value, basestring) \
            and re.match(r'^\d\d:\d\d:\d\d$', value, re.UNICODE):
                return value
            raise Error(" Got unexpected value %(value)s of"
                            " %(base_type)s type,"
                            " HH:MM:SS is expected for field %(id)s."
                            % {'value': value,
                               'base_type': field.base_type,
                               'id': field.id}
            )
        if field.base_type == 'dateTime':
            if isinstance(value, datetime.datetime):
                return value.strftime('%Y-%m-%dT%H:%M:%S')
            if isinstance(value, basestring) \
            and re.match(r'^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d$',
                         value,
                         re.UNICODE):
                return value
            raise Error("Got unexpected value %(value)s of"
                        " %(base_type)s type,"
                        " YYYY-MM-DDTHH:MM:SS is expected for field %(id)s."
                        % {'value': value,
                           'base_type': field.base_type,
                           'id': field.id}
            )
        if field.base_type == 'enumeration':
            if unicode(value) not in field.enumerations:
                raise Error("Got unexpected value %(value)s of"
                    " %(base_type)s type, one of %(enumeration)s is expected"
                    " for field %(id)s."
                    % {'value': value, 'base_type': field.base_type,
                       'enumeration': [id for id in field.enumerations],
                       'id': field.id
                    }
                )
            return unicode(value)
        if field.base_type == 'text':
            return unicode(value)
        else:
            raise Error("Got a value %(value)s of unknown %(base_type)s type"
                       " for field %(id)s."
                        % {'value': value,
                           'base_type': field.base_type,
                           'id': field.id}
            )
        return value
