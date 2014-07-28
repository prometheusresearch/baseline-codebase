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
    State, state,
    Dep, dep,
    compute, compute_update)
from .computator import (
    InitialValue, InRangeValue, AggregatedValue)
