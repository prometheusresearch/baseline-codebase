from .interface import Instrument

def parse_instrument(structure):
    id = structure.get('id')
    version = structure.get('version')
    title = structure.get('title')
    instrument = Instrument(id, version, title)
    for field_structure in structure['record']:
        field = instrument.add_field(structure, field_structure)
    instrument.add_template(instrument.id, instrument.fields)
    return instrument

