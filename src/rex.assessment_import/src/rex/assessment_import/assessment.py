import re
import datetime
import time
from collections import OrderedDict
from copy import deepcopy


from rex.core import Error

__all__ = (
    'AssessmentCollection',
)


class Assessment(object):

    def __init__(self, instrument, id):
        self.id = id
        self.context = {}
        self.subject = None
        self.date = None
        self.data = deepcopy(instrument.blank_assessment)

    def make(self, instrument, field, data):
        self.subject = data.get('subject')
        if not self.subject:
            raise Error("subject is required.")
        self.date = self.make_date(data)
        self.context = self.make_context(instrument, data)
        record = self.make_record(field, data)
        for field_id, value in record.items():
            self.data['values'][field_id] = value

    def make_context(self, instrument, data):
        context = {}
        for field_id, field in instrument.context.items():
            value = data.get(field_id, None)
            if field['required'] and value in (None, ''):
                raise Error("%s value is required in %s."
                            % (field_id, instrument.id))
            if value not in (None,''):
                try:
                    field['validator'](value)
                except Error, exc:
                    raise Error("Got unexpected %s value in %s"
                                % (field_id, instrument.id), exc)
                context[field_id] = value
        return context

    def make_date(self, data):
        date = data.get('date')
        if isinstance(date, unicode):
            date = date.encode('utf-8', 'replace')
        if not date:
            date = datetime.datetime.today()
        elif isinstance(date, (int, float)):
            date = (datetime.datetime(1900, 01, 01) +
                    datetime.timedelta(days=date))
        elif (isinstance(date, basestring)
        and not re.match(r'^\d\d\d\d-\d\d-\d\d$', date)):
            raise Error("Unexpected value %s for date." % date)
        else:
            date = datetime.datetime.strptime(date, '%Y-%m-%d')
        return date.date()

    def make_record(self, record_field, data):
        record_value = {}
        for _, field in record_field.fields.items():
            field_value = self.make_value(field, data)
            record_value[field.id] = {'value': field_value}
        return record_value

    def make_record_list(self, field, data):
        value = self.make_record(field, data)
        record_values = self.data['values'].get(field.id, {}).get('value', [])
        if record_values is None and value:
            record_values = []
        record_values.append(value)
        self.data['values'][field.id] = {'value': record_values}

    def make_matrix(self, field, data):
        field_value = self.data['values'].get(field.id, {}).get('value', {})
        for row in field.rows:
            row_value = field_value.get(row, {})
            for column in field.columns:
                matrix_field = field.fields.get(row + '_' + column)
                matrix_value = self.make_value(matrix_field, data)
                row_value[column] = {'value': matrix_value}
            field_value[row] = row_value
            if field_value is None and matrix_value:
                field_value = {}
        self.data['values'][field.id] = {'value': field_value}

    def make_value(self, field, data):
        if field.base_type == 'enumerationSet':
            value = self.make_enumeration_set_value(field, data)
        else:
            value = self.make_simple_value(field, data)
        return value

    def make_enumeration_set_value(self, field, data):
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
        value = data.get(field.id)
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
                value = (datetime.datetime(1900, 01, 01) +
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
            and re.match(r'^\d?\d:\d\d:\d\d$', value, re.UNICODE):
                return value
            raise Error(" Got unexpected value %(value)s of"
                            " %(base_type)s type,"
                            " HH:MM:SS is expected for field %(id)s."
                            % {'value': value,
                               'base_type': field.base_type,
                               'id': field.id}
            )
        if field.base_type == 'dateTime':
            if isinstance(value, (int, float)):
                value = (datetime.datetime(1900, 01, 01, 00, 00, 01) +
                         datetime.timedelta(days=value)
                        ).strftime('%Y-%m-%dT%H:%M:%S')
                return value

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


class AssessmentCollection(object):

    def __init__(self):
        self.assessment_map = OrderedDict()

    def __iter__(self):
        return iter(self.assessment_map.values())

    def add_chunk(self, instrument, template, chunk):
        field = instrument[chunk.id]
        self.check_assessment_id(instrument, chunk)
        for (idx, row) in enumerate(chunk.data):
            try:
                self.check_with_template(template, row)
            except Error, exc:
                raise Error("Check chunk `%s` row # %s does not"
                            " match template" % (chunk.id, idx+1), exc)
            assessment_id = row.get('assessment_id')            
            assessment = self.assessment_map.get(assessment_id)
            if not assessment:
                assessment = Assessment(instrument, assessment_id)
                self.assessment_map[assessment_id] = assessment
            try:
                if field.base_type == 'record':
                    assessment.make(instrument, field, row)
                elif field.base_type == 'recordList':
                    assessment.make_record_list(field, row)
                elif field.base_type == 'matrix':
                    assessment.make_matrix(field, row)
            except Exception, exc:
                raise Error("Check chunk `%s` row #%s" % (chunk.id, idx+1), exc)

    def check_assessment_id(self, instrument, chunk):
        field = instrument[chunk.id]
        processed = []
        for (idx, row) in enumerate(chunk.data):
            assessment_id = row.get('assessment_id')
            if not assessment_id:
                raise Error("Check chunk `%s` row # %s, assessment_id not found."
                            % (chunk.id, idx+1))
            if field.base_type in ('matrix', 'record') \
            and assessment_id in processed:
                raise Error("Duplicated assessment_id `%s` chunk `%s` row # %s."
                            % (assessment_id, chunk.id, idx+1))
            processed.append(assessment_id)

    def check_with_template(self, template, record):
        record_header = set(record.keys())
        if None in record_header or '' in record_header:
            raise Error("nulls is not expected in data header.")
        template_header = set(template.keys())
        extra = record_header - template_header
        shortage = template_header - record_header
        if extra:
            raise Error("data header contains extra columns %s."
                        % ', '.join(extra))
        if shortage:
            raise Error("data header does not contain expected columns %s."
                        % ', '.join(shortage))
