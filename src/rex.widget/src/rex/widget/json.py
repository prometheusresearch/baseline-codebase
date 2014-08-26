"""

    rex.widget.json
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import
import simplejson as json
from .state import Data, Append, State, StateGraph, unknown
from .descriptor import (
    UIDescriptor, UIDescriptorChildren, WidgetDescriptor,
    StateRead, StateReadWrite)
from .jsval import JSValue


def dumps(obj):
    encoder = WidgetJSONEncoder(
        indent=2,
        tuple_as_array=False,
        namedtuple_as_object=False
    )
    return encoder.encode(obj)


class WidgetJSONEncoder(json.JSONEncoder):

    def default(self, obj): # pylint: ignore
        if isinstance(obj, JSValue):
            return {"__reference__": obj.reference}
        if isinstance(obj, StateReadWrite):
            return {"__state_read_write__": obj.id}
        if isinstance(obj, StateRead):
            return {"__state_read__": obj.id}
        if isinstance(obj, UIDescriptor):
            return {"__type__": obj.type, "props": obj.props}
        if isinstance(obj, UIDescriptorChildren):
            return {"__children__": obj.children}
        if isinstance(obj, WidgetDescriptor):
            return {
                "ui": obj.ui,
                "state": obj.state
            }
        if isinstance(obj, StateGraph):
            return obj.storage
        if obj is unknown:
            return "__unknown__"
        if isinstance(obj, Data):
            return {
                "data": obj.data,
                "meta": obj.meta,
                "updating": obj.updating,
                "hasMore": obj.has_more
            }
        if isinstance(obj, Append):
            return {"__append__": obj.data}
        if isinstance(obj, State):
            return {
                "id": obj.id,
                "value": obj.value,
                "dependencies": [
                    dep.id
                    for dep in obj.dependencies
                    if not dep.reset_only],
                "persistence": obj.persistence,
                "isWritable": obj.is_writable,
                "defer": obj.defer,
                "alias": obj.alias,
            }
        return super(WidgetJSONEncoder, self).default(obj)

    def encode(self, obj):
        return super(WidgetJSONEncoder, self).encode(obj).replace('</', '<\\/')
