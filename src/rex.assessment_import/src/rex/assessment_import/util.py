import csv
from collections import OrderedDict

from rex.core import Error
from rex.instrument.util import get_implementation
from .interface import Instrument, Assessment


def get_assessment_templates(instrument_version,
                             additional_template_fields=None):
    additional_template_fields = additional_template_fields or OrderedDict()
    instrument = Instrument.create(instrument_version,
                                   additional_template_fields)
    return instrument.templates


def import_assessment_data(instrument_version,
                           obj_name,
                           assessment_data,
                           additional_template_fields=None,
                           additional_assessment_data=None):
    additional_template_fields = additional_template_fields or OrderedDict()
    instrument = Instrument.create(instrument_version,
                                   additional_template_fields)
    template = instrument.templates.get(obj_name)
    if not template:
        return
    try:
        reader = csv.DictReader(assessment_data)
    except Exception, exc:
        raise Error("Unable to read csv.", exc)
    for row in reader:
        try:
            assessment = Assessment.save(instrument,
                                         obj_name,
                                         row,
                                         additional_assessment_data)
        except Error, exc:
            print exc
            continue
