from collections import OrderedDict
from rex.instrument import InstrumentVersion


def parse_instrument(structure):
    id = structure.get('id')
    version = structure.get('version')
    title = structure.get('title')
    instrument = Instrument(id, version, title)
    for field_structure in structure['record']:
        field = instrument.add_field(structure, field_structure)
    return instrument


def get_field(instrument_structure, field_structure):
    field_type = field_structure['type']
    field_type = InstrumentVersion\
                    .get_full_type_definition(instrument_structure,
                                              field_type)
    field_id = field_structure['id']
    base_type = field_type['base']
    description = field_structure.get('description')
    required = field_structure.get('required', False)
    field = Field(field_id, base_type, description, required)
    if base_type == 'recordList':
        for branch_field_structure in field_type['record']:
            field.add_field(instrument_structure, branch_field_structure)
    elif base_type == 'matrix':
        for row_structure in field_type['rows']:
            row_id = field_structure['id']
            required = row_structure.get('required', False)
            description = row_structure.get('description')
            row = Row(row_id, description, required)
            field.rows[row_id] = row
            for column_structure in field_type['columns']:
                column_id = column_structure['id']
                column = Column(column_id)
                column.add_field(instrument_structure, column_structure)
                row.columns[column_id] = column
    elif base_type in ('enumeration', 'enumerationSet'):
        for code, structure in field_type['enumerations'].items():
            field.enumerations[code] = structure.get('description')
    return field

def make_template(obj, obj_output_name, required=None, output={}):
    template = output.get(obj_output_name, OrderedDict())
    tpl_string = '%(description)s\n%(type)s\n%(required)s'
    tpl_data = {}
    for _, field in obj.fields.items():
        tpl_data['description'] = field.description or ''
        tpl_data['type'] = [field.base_type]
        tpl_data['required'] = ''
        required = field.required if required is None else required
        if required:
            tpl_data['required'] = '(required)'
        if field.base_type == 'enumeration':
            tpl_data['type'] = field.enumerations.keys()
            template[field.id] = (tpl_string % tpl_data).strip()
        elif field.base_type == 'enumerationSet':
            tpl_data['type'] = ['TRUE.FALSE']
            for id in field.enumerations:
                enum_tpl_name = field.id + '_' + id
                template[enum_tpl_name] = (tpl_string % tpl_data).strip()
        elif field.base_type == 'recordList':
            output[obj_output_name + '.' + field.id] = OrderedDict()
            output = make_template(field, obj_output_name, output=output)
        elif field.base_type == 'matrix':
            for _, row in field.rows.items():
                required = row.required
                for _, column in row.columns.items():
                    output = make_template(column.field, obj_output_name,
                                           required, output)
        else:
            template[field.id] = (tpl_string % tpl_data).strip()
    output[obj_output_name] = template
    return output


class Instrument(object):

    def __init__(self, id, version, title):
        self.id = id
        self.version = version
        self.title = title
        self.fields = OrderedDict()

    def add_field(self, instrument_structure, field_structure):
        field_id = field_structure['id']
        field = get_field(instrument_structure, field_structure)
        self.fields[field_id] = field
        return field


class Field(object):

    def __init__(self, id, base_type, description, required):
        self.id = id
        self.base_type = base_type
        self.description = description
        self.required = required
        self.fields = OrderedDict()
        self.rows = OrderedDict()
        self.enumerations = OrderedDict()
        self.template = OrderedDict()

    def add_field(self, instrument_structure, structure):
        field_id = structure['id']
        field = get_field(instrument_structure, structure)
        self.fields[field_id] = field
        return field


class Row(object):

    def __init__(self, id, description, required):
        self.id = id
        self.description = description
        self.required = required
        self.columns = OrderedDict()


class Column(object):

    def __init__(self, id):
        self.id = id
        self.field = None

    def add_field(self, instrument_structure, structure):
        self.field = get_field(instrument_structure, structure)
