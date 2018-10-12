from collections import OrderedDict

from rex.instrument.util import get_implementation

__all__ = (
    'Template',
)

class Template(object):

    def __init__(self, instrument):
        self.chunks = OrderedDict()
        self.make(instrument)

    def __getitem__(self, id):
        return self.chunks.get(id)

    def __iter__(self):
        return iter(list(self.chunks.items()))

    def make(self, instrument):
        for chunk_id, chunk_field in instrument:
            self.make_defaults(chunk_id, instrument.defaults)
            if chunk_field.base_type == 'record':
                self.make_defaults(chunk_id, instrument.context)
            for _, field in list(chunk_field.fields.items()):
                self.make_field(chunk_id, field)

    def make_defaults(self, chunk_id, fields):
        template = self.chunks.get(chunk_id) or OrderedDict()
        for field_id, field in list(fields.items()):
            required = field.get('required')
            type = field.get('type')
            description = field.get('description')
            template[field_id] = self.make_text(type, required, description)
        self.chunks[chunk_id] = template

    def make_field(self, chunk_id, field):
        template = self.chunks.get(chunk_id) or OrderedDict()
        type = field.base_type
        if field.base_type == 'enumeration':
            type = ','.join(field.enumerations)
        if field.base_type == 'enumerationSet':
            type = 'TRUE,FALSE'
            for id in field.enumerations:
                template[field.id + '_' + id] = self.make_text(type,
                                                               field.required,
                                                               field.description)
        else:
            template[field.id] = self.make_text(type,
                                                field.required,
                                                field.description)
        self.chunks[chunk_id] = template 

    def make_text(self, type=None, required=None, description=None):
        required = '(required)' if required else None
        return '; '.join([item.strip()
                            for item in [description, type, required] if item
                         ])
