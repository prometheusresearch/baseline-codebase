from rex.core import Error
from rex.instrument.util import get_implementation

from .import_package import ImportPackage, ImportChunk
from .instrument import Instrument
from .template import Template
from .assessment import AssessmentCollection


__all__ = (
    'import_assessment',
    'export_template'
)

def import_assessment(instrument_uid, version=None, input=None, verbose=False):
    if not input:
        raise Error("input is expected.")
    if not isinstance(input, ImportPackage):
        raise Error("input is expected as an object of ImportPackage.")
    if not input.chunks:
        raise Error("No data to import.")
    assessment_impl = get_implementation('assessment')
    if verbose: print "Looking for instrument..."
    instrument = Instrument.find(instrument_uid, version)
    if verbose: print "Generating instrument template..."
    template_collection = Template(instrument)
    if verbose: print "Generating assessments collection for given input..."
    assessments = AssessmentCollection()
    for chunk in input:
        if verbose: print "Processing chunk `%s`..." % chunk.id
        template = template_collection[chunk.id]
        if not template:
            msg = ("Chunk `%s` not found in istrument `%s` template."
                   % (chunk.id, instrument.id))
            chunk.fail(msg)
            raise Error(msg)
        try:
            assessments.add_chunk(instrument, template, chunk)
        except Exception, exc:
            chunk.fail(exc)
            raise exc
    bulk_assessments = []
    for assessment in assessments:
        bulk_assessment = assessment_impl.BulkAssessment(
                            subject_uid=assessment.subject,
                            instrument_version_uid=instrument.id,
                            evaluation_date=assessment.date,
                            context=assessment.context,
                            data=assessment.data
                     )
        bulk_assessments.append(bulk_assessment)
    if verbose: print "Saving generated assessments to the data store..."
    try:
        assessment_impl.bulk_create(bulk_assessments)
    except Exception, exc:
        for chunk in input.chunks:
            chunk.fail(exc)
        raise exc


def export_template(instrument_uid, version=None, verbose=False, user=None):
    if verbose: print "Looking for instrument..."
    instrument = Instrument.find(instrument_uid, version)
    if verbose: print "Generating instrument template..."
    template = Template(instrument)
    chunks = [ImportChunk(id, [data], user) for (id, data) in template]
    output = ImportPackage(chunks=chunks)
    return output
