
import sys
import yaml
import json
import re

class FancyDumper(yaml.SafeDumper):

    yaml_implicit_resolvers = {}
    key_order = ['id', 'fieldid', 'version', 'type', 'required', 
                 'title', 'annotation', 'explanation', 'identifiable',
                 'description', 'types', 'enumerations',
                 'record', 'columns', 'rows']
    key_order = dict((key, order) for order, key in enumerate(key_order))

    def represent_str(self, data):
        # Overriden to force literal block style for multi-line strings.
        if isinstance(data, str):
            data = data.encode('utf-8')
        style = None
        if '\n' in data or len(data) > 32:
            style = '>'
        elif ':' in data or data.endswith(':'):
            style = '"'
        return self.represent_scalar(u'tag:yaml.org,2002:str', 
                data, style=style)

    def represent_dict(self, data):
        keys = data.keys()
        keys.sort(key=(lambda k: (self.key_order.get(k.lower(), 
                                            len(self.key_order)), k)))
        items = [(key, data[key]) for key in keys]
        return self.represent_mapping(
                u'tag:yaml.org,2002:map', items, flow_style=False)


FancyDumper.add_representer(
        str,
        FancyDumper.represent_str)
FancyDumper.add_representer(
        unicode,
        FancyDumper.represent_str)
FancyDumper.add_representer(
        dict,
        FancyDumper.represent_dict)
FancyDumper.add_implicit_resolver(
        u'tag:yaml.org,2002:bool',
        re.compile(ur'''^(?:true|True|TRUE|false|False|FALSE)$''', re.X),
        list(u'tTfF'))
FancyDumper.add_implicit_resolver(
        u'tag:yaml.org,2002:float',
        re.compile(ur'''^(?:[-+]?(?:[0-9][0-9]*)\.[0-9]*(?:[eE][-+][0-9]+)?
                    |\.[0-9]+(?:[eE][-+][0-9]+)?
                    |[-+]?\.(?:inf|Inf|INF)
                    |\.(?:nan|NaN|NAN))$''', re.X),
        list(u'-+0123456789.'))
FancyDumper.add_implicit_resolver(
        u'tag:yaml.org,2002:int',
        re.compile(ur'''^(?:[-+]?0b[0-1_]+
                    |[-+]?(?:[0-9]+)
                    |[-+]?0x[0-9a-fA-F]+)$''', re.X),
        list(u'-+0123456789'))
FancyDumper.add_implicit_resolver(
        u'tag:yaml.org,2002:null',
        re.compile(ur'''^(?: ~
                    |null|Null|NULL
                    | )$''', re.X),
        [u'~', u'n', u'N', u''])
