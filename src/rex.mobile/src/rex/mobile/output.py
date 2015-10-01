#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rios.core import get_interaction_yaml, get_interaction_json


__all__ = (
    'dump_interaction_json',
    'dump_interaction_yaml',
)


def dump_interaction_yaml(interaction, **kwargs):
    """
    A function that will take a standard, dictionary-based SMS Interaction
    Configuration and encode it in a standard way, with keys outputted in a
    human-friendly way.

    :param instrument: the Interaction to encode in YAML
    :type instrument: dict
    :returns: a YAML-encoded version of the Interaction
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_interaction_yaml(interaction, **kwargs)


def dump_interaction_json(interaction, **kwargs):
    """
    A function that will take a standard, dictionary-based SMS Interaction
    Configuration and encode it in a standard way, with keys outputted in a
    human-friendly way.

    :param instrument: the Interaction to encode in JSON
    :type instrument: dict
    :returns: a JSON-encoded version of the Interaction
    """

    if 'pretty' not in kwargs:
        kwargs['pretty'] = False

    return get_interaction_json(interaction, **kwargs)

