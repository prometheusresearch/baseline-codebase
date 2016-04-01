#
# Copyright (c) 2016, Prometheus Research, LLC
#


import hashlib

from copy import deepcopy

from ..interface import PresentationAdaptor


__all__ = (
    'LookupRegistry',
    'LookupPresentationAdaptor',
    'REGISTRY',
)


class LookupRegistry(object):
    def __init__(self):
        self._queries = {}

    def register(self, query):
        hasher = hashlib.sha256()
        hasher.update(query.strip())
        lookup_id = hasher.hexdigest()

        self._queries[lookup_id] = query
        return lookup_id

    def get_query(self, lookup_id):
        return self._queries.get(lookup_id, None)


#: The global registry of lookup queries.
REGISTRY = LookupRegistry()


class LookupPresentationAdaptor(PresentationAdaptor):
    """
    An adaptor the enables support for the query-based lookup widgets.
    """

    #:
    name = 'lookup'

    @classmethod
    def adapt(cls, instrument, configuration):
        config = deepcopy(configuration)

        for page in config['pages']:
            for element in page['elements']:
                if element['type'] != 'question':
                    continue

                widget = element.get('options', {}).get('widget', {})
                if widget.get('type') == 'lookupText':
                    opts = widget.get('options', {})
                    if opts.get('query'):
                        opts['lookup'] = REGISTRY.register(opts['query'])
                        del opts['query']

                elif element.get('options', {}).get('questions'):
                    for question in element['options']['questions']:
                        widget = question.get('widget', {})
                        if widget.get('type') == 'lookupText':
                            opts = widget.get('options', {})
                            if opts.get('query'):
                                opts['lookup'] = REGISTRY.register(
                                    opts['query']
                                )
                                del opts['query']

        return config

