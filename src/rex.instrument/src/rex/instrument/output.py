#
# Copyright (c) 2015, Prometheus Research, LLC
#


from prismh.core import get_instrument_yaml, get_instrument_json, \
    get_assessment_yaml, get_assessment_json, \
    get_calculationset_yaml, get_calculationset_json


__all__ = (
    'dump_instrument_yaml',
    'dump_instrument_json',
    'dump_assessment_yaml',
    'dump_assessment_json',
    'dump_calculationset_yaml',
    'dump_calculationset_json'
)


def dump_instrument_yaml(instrument, **kwargs):
    """
    A function that will take a standard, dictionary-based Common Instrument
    Definition and encode it in a standard way, with keys outputted in a
    human-friendly way.

    :param instrument: the Instrument to encode in YAML
    :type instrument: dict
    :returns: a YAML-encoded version of the Instrument
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_instrument_yaml(instrument, **kwargs)


def dump_instrument_json(instrument, **kwargs):
    """
    A function that will take a standard, dictionary-based Common Instrument
    Definition and encode it in a standard way, with keys outputted in a
    human-friendly way.

    :param instrument: the Instrument to encode in JSON
    :type instrument: dict
    :returns: a JSON-encoded version of the Instrument
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_instrument_json(instrument, **kwargs)


def dump_assessment_yaml(assessment, **kwargs):
    """
    A function that will take a standard, dictionary-based Common Assessment
    Document and encode it in a standard way, with keys outputted in a
    human-friendly way.

    :param instrument: the Assessment to encode in YAML
    :type instrument: dict
    :returns: a YAML-encoded version of the Assessment
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_assessment_yaml(assessment, **kwargs)


def dump_assessment_json(assessment, **kwargs):
    """
    A function that will take a standard, dictionary-based Common Assessment
    Document and encode it in a standard way, with keys outputted in a
    human-friendly way.

    :param instrument: the Assessment to encode in JSON
    :type instrument: dict
    :returns: a JSON-encoded version of the Assessment
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_assessment_json(assessment, **kwargs)


def dump_calculationset_yaml(calculationset, **kwargs):
    """
    A function that will take a standard, dictionary-based Common
    Calculationset Document and encode it in a standard way, with keys
    outputted in a human-friendly way.

    :param calculationset: the CalculationSet to encode in YAML
    :type instrument: dict
    :returns: a YAML-encoded version of the CalculationSet
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_calculationset_yaml(calculationset, **kwargs)


def dump_calculationset_json(calculationset, **kwargs):
    """
    A function that will take a standard, dictionary-based Common
    CalculationSet Definition and encode it in a standard way, with keys
    outputted in a human-friendly way.

    :param calculationset: the CalculationSet to encode in JSON
    :type calculationset: dict
    :returns: a JSON-encoded version of the CalculationSet
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_calculationset_json(calculationset, **kwargs)

