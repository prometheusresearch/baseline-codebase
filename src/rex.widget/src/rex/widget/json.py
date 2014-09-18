"""

    rex.widget.json
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import
import simplejson as json
from rex.core import Record
from .state import State, StateGraph, unknown
from .computator import Data, Append
from .descriptor import (
    UIDescriptor, UIDescriptorChildren, WidgetDescriptor,
    DataRead, StateRead, StateReadWrite)
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
        if isinstance(obj, DataRead):
            return {"__data_read__": obj.id}
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
                "id": obj.id,
                "data": obj.data,
                "meta": obj.meta,
                "hasMore": obj.has_more
            }
        if isinstance(obj, Append):
            return {"__append__": obj.data}
        if isinstance(obj, State):
            return {
                "id": obj.id,
                "dependencies": [
                    dep.id
                    for dep in obj.dependencies
                    if not dep.reset_only],
                "persistence": obj.persistence,
                "isWritable": obj.is_writable,
                "defer": obj.defer,
                "alias": obj.alias,
            }
        if isinstance(obj, Record):
            return obj._asdict()
        return super(WidgetJSONEncoder, self).default(obj)

    def encode(self, obj):
        return super(WidgetJSONEncoder, self).encode(obj).replace('</', '<\\/')
