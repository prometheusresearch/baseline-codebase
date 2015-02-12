#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.instrument.output import DefinedOrderDict, TypedDefinedOrderDict, \
    SortedDict, TypedSortedDict, dump_yaml, dump_json


__all__ = (
    'Form',
    'dump_form_yaml',
    'dump_form_json',
)


class InstrumentDeclaration(DefinedOrderDict):
    order = [
        'id',
        'version',
    ]


class Descriptor(TypedDefinedOrderDict):
    order = [
        'id',
        'text',
        'help',
        'audio',
    ]

    key_types = {
        'id': str,
        'text': SortedDict,
        'help': SortedDict,
        'audio': SortedDict,
    }


class Event(TypedDefinedOrderDict):
    order = [
        'trigger',
        'action',
        'targets',
        'options',
    ]

    key_types = {
        'options': SortedDict,
    }


class Widget(TypedDefinedOrderDict):
    order = [
        'type',
        'options',
    ]

    key_types = {
        'options': SortedDict,
    }


class ElementOptions(TypedDefinedOrderDict):
    order = [
        'fieldId',
        'text',
        'help',
        'error',
        'audio',
        'enumerations',
        'questions',
        'rows',
        'widget',
        'events',
    ]

    key_types = {
        'text': SortedDict,
        'help': SortedDict,
        'error': SortedDict,
        'audio': SortedDict,
        'enumerations': [Descriptor],
        'rows': [Descriptor],
        'widget': Widget,
        'events': [Event],
    }

ElementOptions.key_types['questions'] = [ElementOptions]


class Element(TypedDefinedOrderDict):
    order = [
        'type',
        'tags',
        'options',
    ]

    key_types = {
        'options': ElementOptions,
    }


class Page(TypedDefinedOrderDict):
    order = [
        'id',
        'elements',
    ]

    key_types = {
        'elements': [Element],
    }


class Unprompted(TypedDefinedOrderDict):
    order = [
        'action',
        'options',
    ]

    key_types = {
        'options': SortedDict,
    }


class UnpromptedCollection(TypedSortedDict):
    subtype = Unprompted


class Form(TypedDefinedOrderDict):
    order = [
        'instrument',
        'defaultLocalization',
        'title',
        'pages',
        'unprompted',
    ]

    key_types = {
        'instrument': InstrumentDeclaration,
        'title': SortedDict,
        'pages': [Page],
        'unprompted': UnpromptedCollection,
    }


def dump_form_yaml(form, **kwargs):
    """
    A convenience wrapper around ``dump_yaml`` that will take a standard,
    dictionary-based Web Form Configuration and encode it in a standard
    way, with keys outputted in a human-friendly way.

    :param instrument: the Form to encode in YAML
    :type instrument: dict
    :returns: a YAML-encoded version of the Form
    """

    return dump_yaml(Form(form), **kwargs)


def dump_form_json(form, **kwargs):
    """
    A convenience wrapper around ``dump_json`` that will take a standard,
    dictionary-based Web Form Configuration and encode it in a standard
    way, with keys outputted in a human-friendly way.

    :param instrument: the Form to encode in JSON
    :type instrument: dict
    :returns: a JSON-encoded version of the Form
    """

    return dump_json(Form(form), **kwargs)

