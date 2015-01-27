#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.instrument.output import DefinedOrderDict, SortedDict, dump_yaml, \
    dump_json


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


class Descriptor(DefinedOrderDict):
    order = [
        'id',
        'text',
        'help',
        'audio',
    ]

    def __init__(self, desc):
        super(Descriptor, self).__init__(desc)
        for field in ('text', 'help', 'audio'):
            if field in self:
                self[field] = SortedDict(self[field])


class Event(DefinedOrderDict):
    order = [
        'trigger',
        'action',
        'targets',
        'options',
    ]

    def __init__(self, event):
        super(Event, self).__init__(event)
        if 'options' in self:
            self['options'] = SortedDict(self['options'])


class Widget(DefinedOrderDict):
    order = [
        'type',
        'options',
    ]

    def __init__(self, widget):
        super(Widget, self).__init__(widget)
        if 'options' in self:
            self['options'] = SortedDict(self['options'])


class ElementOptions(DefinedOrderDict):
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

    def __init__(self, options):
        super(ElementOptions, self).__init__(options)
        for field in ('text', 'help', 'error', 'audio'):
            if field in self:
                self[field] = SortedDict(self[field])
        for field in ('enumerations', 'rows'):
            if field in self:
                self[field] = [
                    Descriptor(desc)
                    for desc in self[field]
                ]
        if 'widget' in self:
            self['widget'] = Widget(self['widget'])
        if 'questions' in self:
            self['questions'] = [
                ElementOptions(question)
                for question in self['questions']
            ]
        if 'events' in self:
            self['events'] = [
                Event(event)
                for event in self['events']
            ]


class Element(DefinedOrderDict):
    order = [
        'type',
        'tags',
        'options',
    ]

    def __init__(self, element):
        super(Element, self).__init__(element)
        if 'options' in self:
            self['options'] = ElementOptions(self['options'])


class Page(DefinedOrderDict):
    order = [
        'id',
        'elements',
    ]

    def __init__(self, page):
        super(Page, self).__init__(page)
        if 'elements' in self:
            self['elements'] = [
                Element(element)
                for element in self['elements']
            ]


class Unprompted(DefinedOrderDict):
    order = [
        'action',
        'options',
    ]

    def __init__(self, unprompted):
        super(Unprompted, self).__init__(unprompted)
        if 'options' in self:
            self['options'] = SortedDict(self['options'])


class UnpromptedCollection(SortedDict):
    def __init__(self, unprompted):
        super(UnpromptedCollection, self).__init__(unprompted)
        for name, defn in self.iteritems():
            self[name] = Unprompted(defn)


class Form(DefinedOrderDict):
    order = [
        'instrument',
        'defaultLocalization',
        'title',
        'pages',
        'unprompted',
    ]

    def __init__(self, form):
        super(Form, self).__init__(form)
        if 'instrument' in self:
            self['instrument'] = InstrumentDeclaration(self['instrument'])
        if 'title' in self:
            self['title'] = SortedDict(self['title'])
        if 'pages' in self:
            self['pages'] = [
                Page(page)
                for page in self['pages']
            ]
        if 'unprompted' in self:
            self['unprompted'] = UnpromptedCollection(self['unprompted'])


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

