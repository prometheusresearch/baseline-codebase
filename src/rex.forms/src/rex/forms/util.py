#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.instrument import Assessment, Subject


__all__ = (
    'preview_calculation_results',
)


def preview_calculation_results(
        instrument_version,
        calculation_set,
        data,
        assessment=None):
    if not calculation_set:
        return {}

    # Validate the Assessment Data
    assessment_impl = Assessment.get_implementation()
    assessment_impl.validate_data(
        data,
        instrument_definition=instrument_version.definition,
    )

    # Make some temporary objects so we can execute the calcs.
    if not assessment:
        subject = Subject.get_implementation()('fake')
        assessment = assessment_impl(
            'fake',
            subject,
            instrument_version,
            data,
            status=assessment_impl.STATUS_COMPLETE,
        )
    else:
        assessment.data = data
        assessment.status = assessment_impl.STATUS_COMPLETE

    # Execute the calculations
    return calculation_set.execute(assessment=assessment)

