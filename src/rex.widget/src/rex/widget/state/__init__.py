"""

    rex.widget.state
    ================

    :copyright: 2014, Prometheus Research, LLC

"""

from .fields import (
    StateDescriptor,
    StateVal, CollectionVal, EntityVal, PaginatedCollectionVal)
from .graph import (
    StateGraph, MutableStateGraph,
    State, Reference,
    Dep, Reset,
    compute, compute_update, unknown)
from .computator import (
    Data, Append,
    InitialValue, PaginatedCollectionComputator,
    CollectionComputator, EntityComputator)
