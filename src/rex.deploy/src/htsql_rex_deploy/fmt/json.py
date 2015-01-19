#
# Copyright (c) 2015, Prometheus Research, LLC
#


from htsql.core.adapter import adapt
from htsql.core.fmt.json import ToRaw, JS_SEQ, JS_MAP, JS_END
from ..domain import JSONDomain


def json_to_json(value):
    if isinstance(value, list):
        yield JS_SEQ
        for item in value:
            for token in json_to_json(item):
                yield token
        yield JS_END
    elif isinstance(value, dict):
        yield JS_MAP
        for key in sorted(value):
            yield key
            for token in json_to_json(value[key]):
                yield token
        yield JS_END
    else:
        yield value


class JSONToRaw(ToRaw):

    adapt(JSONDomain)

    scatter = staticmethod(json_to_json)


