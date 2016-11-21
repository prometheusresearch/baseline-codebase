from collections import OrderedDict
from copy import deepcopy

from rex.instrument.util import get_implementation
from rex.core import Error, get_settings

__all__ = (
    'Instrument',
)

def get_field_type(instrument_version, field_definition):
    return instrument_version\
                .get_full_type_definition(instrument_version.definition,
                                          field_definition['type'])


class Field(object):

    def __init__(self, id, base_type, description=None, required=False):
        self.id = id
        self.base_type = base_type
        self.description = description
        self.required = required
        self.fields = OrderedDict()
        self.enumerations = []
        self.rows = []
        self.columns = []

    def add_field(self, instrument_version, field_definition):
        field_type = get_field_type(instrument_version, field_definition)
        base_type = field_type['base']
        field_id = field_definition['id']
        description = field_definition.get('field_definition', '')
        required = field_definition.get('required', False)
        field = Field(field_id, base_type, description, required)
        if base_type in ('enumeration', 'enumerationSet'):
            field.enumerations = field_type['enumerations'].keys()
        if base_type == 'matrix':
            self.add_matrix(instrument_version, field_definition)
        elif base_type == 'recordList':
            self.add_record(instrument_version, field_definition)
        else:
            self.fields[field_id] = field

    def add_matrix(self, instrument_version, field_definition):
        field_type = get_field_type(instrument_version, field_definition)
        for row_definition in field_type['rows']:
            row_id = row_definition['id']
            required = row_definition.get('required', False)
            description = row_definition.get('description', '')
            self.rows.append(row_id)
            for column_definition in field_type['columns']:
                matrix_definition = deepcopy(column_definition)
                column_id = matrix_definition['id']
                self.columns.append(column_id)
                matrix_definition['id'] = row_id + '_' + column_id
                matrix_definition['description'] = \
                    column_definition.get('description') or description
                matrix_definition['required'] = \
                    required or column_definition.get('required', False)
                self.add_field(instrument_version, matrix_definition)

    def add_record(self, instrument_version, field_definition):
        field_type = get_field_type(instrument_version, field_definition)
        for record_field_definition in field_type['record']:
            self.add_field(instrument_version, record_field_definition)


class Instrument(object):

    def __init__(self, instrument_version):
        self.id = instrument_version.uid
        self.chunks = OrderedDict()
        self.make_chunks(instrument_version)
        self.defaults = get_settings().assessment_template_defaults or {}
        assessment_impl = get_implementation('assessment')
        self.context = {}
        self.make_context()
        self.blank_assessment = assessment_impl.generate_empty_data(
                                                instrument_version.definition)

    def make_context(self):
        assessment_impl = get_implementation('assessment')
        action = assessment_impl.CONTEXT_ACTION_CREATE
        context = assessment_impl.get_implementation_context(action) or {}
        context_fields = get_settings().assessment_context_fields
        if not context_fields:
            self.context = context
        else:
            self.context = dict([(name, value)
                                 for (name, value) in context.items()
                                    if name in context_fields
                                ])

    def __iter__(self):
        return iter(self.chunks.items())

    def __getitem__(self, id):
        return self.chunks.get(id)

    def make_chunks(self, instrument_version):
        chunk = self.chunks[self.id] = Field(self.id, 'record')
        for field_definition in instrument_version.definition['record']:
            field_type = get_field_type(instrument_version, field_definition)
            base_type = field_type['base']
            field_id = field_definition['id']
            if base_type == 'recordList':
                chunk_id = self.id + '.' + field_id
                record_chunk = self.chunks[chunk_id] = Field(field_id, base_type)
                record_chunk.add_record(instrument_version, field_definition)
            elif base_type == 'matrix':
                chunk_id = self.id + '.' + field_id
                matrix_chunk = self.chunks[chunk_id] = Field(field_id, base_type)
                matrix_chunk.add_matrix(instrument_version, field_definition)
            else:
                chunk.add_field(instrument_version, field_definition)

    @classmethod
    def find(cls, instrument_uid, version):
        instrument_impl = get_implementation('instrument')
        instrument = instrument_impl.get_by_uid(instrument_uid)
        if not instrument:
            raise Error('Instrument "%s" does not exist.' % instrument_uid)
        if not version:
            instrument_version = instrument.latest_version
        else:
            instrument_version = instrument.get_version(version)
        if not instrument_version:
            raise Error('The desired version of "%s" does not exist.'
                        % instrument)
        return cls(instrument_version)

