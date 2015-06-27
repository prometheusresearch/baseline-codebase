from collections import OrderedDict
from copy import deepcopy

from rex.instrument import InstrumentVersion


class FieldObjectAbstract(object):


    def add_field(self, instrument_structure, field_structure):
        field = self.get_field(instrument_structure, field_structure)
        self.fields[field.id] = field
        return field

    def get_field(self, instrument_structure, field_structure):
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
                row_id = row_structure['id']
                required = row_structure.get('required', False)
                description = row_structure.get('description')
                for column_structure in field_type['columns']:
                    structure = deepcopy(column_structure)
                    column_id = structure['id']
                    structure['id'] = row_id + '_' + column_id
                    structure['description'] = description
                    structure['required'] = required
                    field.add_field(instrument_structure, structure)
                    field.add_row(row_id)
                    field.add_column(column_id)
        elif base_type in ('enumeration', 'enumerationSet'):
            for code, structure in field_type['enumerations'].items():
                field.add_enumeration(code, description)
        return field


class Instrument(FieldObjectAbstract):

    def __init__(self, id, version, title):
        self.id = id
        self.version = version
        self.title = title
        self.fields = OrderedDict()
        self.template = OrderedDict()
        self.template[self.id] = (self, OrderedDict())

    def add_template(self, obj_tpl_name, fields):
        (obj, output) = self.template[obj_tpl_name]
        tpl_string = '%(description)s\n%(type)s\n%(required)s'
        for field_id, field in fields.items():
            tpl_data = OrderedDict()
            tpl_data['name'] = field_id
            tpl_data['type'] = [field.base_type]
            tpl_data['required'] = '(required)' if field.required else ''
            tpl_data['description'] = field.description or ''
            if field.base_type == 'enumeration':
                tpl_data['type'] = field.enumerations.keys()
                field.add_template(**tpl_data)
                output[field_id] = (tpl_string % tpl_data).strip()
            elif field.base_type == 'enumerationSet':
                tpl_data['type'] = ['TRUE.FALSE']
                for id in field.enumerations:
                    tpl_data['name'] = enum_tpl_name = field.id + '_' + id
                    field.add_template(**tpl_data)
                    output[enum_tpl_name] = (tpl_string % tpl_data).strip()
            elif field.base_type == 'recordList':
                rec_tpl_name  = obj_tpl_name + '.' + field.id
                self.template[rec_tpl_name] = (field, OrderedDict())
                self.add_template(rec_tpl_name, field.fields)
            elif field.base_type == 'matrix':
                self.add_template(obj_tpl_name, field.fields)
            else:
                field.add_template(**tpl_data)
                output[field_id] = (tpl_string % tpl_data).strip()
        self.template[obj_tpl_name] = (obj, output)



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
        self.template = OrderedDict()

    def add_row(self, id):
        self.rows.append(id)

    def add_column(self, id):
        self.columns.append(id)

    def add_enumeration(self, enumeration_id, description):
        self.enumerations[enumeration_id] = description

    def add_template(self, name, type, required, description):
        self.template[name] = FieldTemplate(name, type, required, description)


class FieldTemplate(object):

    def __init__(self, name, type, required, description):
        self.name = name
        self.type = type
        self.required = required
        self.description = description


