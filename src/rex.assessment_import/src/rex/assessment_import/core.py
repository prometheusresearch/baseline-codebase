from rex.core import Error
from rex.instrument.util import get_implementation
from rex.instrument.interface import CalculationSet, ResultSet, Assessment, InstrumentVersion, Subject
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
    assessment_impl = Assessment.get_implementation()
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
            msg = ("Chunk `%s` not found in instrument `%s` template."
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

    instrument_version_impl = InstrumentVersion.get_implementation()
    subject_impl = Subject.get_implementation()
    calculationset_impl = CalculationSet.get_implementation()
    resultset_impl = ResultSet.get_implementation()
    calculationset = calculationset_impl.find(
        instrument_version=instrument.id,
        limit=1
    )
    if calculationset:
        if verbose: print "Running calculations..."
        if version is not None:
            instrument_version = instrument_version_impl.find(
                limit=1,
                instrument=instrument_uid,
                version=version
            )[0]
        else:
            instrument_version = instrument.latest_version()
        for assessment in assessments:
            subject = subject_impl.get_by_uid(assessment.subject)
            proper_assessment = assessment_impl.create(
                subject,
                instrument_version=instrument_version,
                data=assessment.data,
                evaluation_date=assessment.date)
            proper_assessment.status = 'completed'
            results = calculationset[0].execute(assessment=proper_assessment)
            proper_assessment.set_meta('calculations', results)
            resultset_impl.create(proper_assessment, results)
            proper_assessment.save()


def export_template(instrument_uid, version=None, verbose=False, user=None):
    if verbose: print "Looking for instrument..."
    instrument = Instrument.find(instrument_uid, version)
    if verbose: print "Generating instrument template..."
    template = Template(instrument)
    chunks = [ImportChunk(id, [data], user) for (id, data) in template]
    output = ImportPackage(chunks=chunks)
    return output
