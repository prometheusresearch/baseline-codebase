#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rios.core import get_form_yaml, get_form_json


__all__ = (
    'dump_form_yaml',
    'dump_form_json',
)


def dump_form_yaml(form, **kwargs):
    """
    A function that will take a standard, dictionary-based Web Form
    Configuration and encode it in a standard way, with keys outputted in a
    human-friendly way.

    :param instrument: the Form to encode in YAML
    :type instrument: dict
    :returns: a YAML-encoded version of the Form
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_form_yaml(form, **kwargs)


def dump_form_json(form, **kwargs):
    """
    A function that will take a standard, dictionary-based Web Form
    Configuration and encode it in a standard way, with keys outputted in a
    human-friendly way.

    :param instrument: the Form to encode in JSON
    :type instrument: dict
    :returns: a JSON-encoded version of the Form
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_form_json(form, **kwargs)

