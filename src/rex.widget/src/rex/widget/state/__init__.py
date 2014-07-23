"""

    rex.widget.state
    ================

    :copyright: 2014, Prometheus Research, LLC

"""

from .fields import (
    StateField, State,
    StateVal, CollectionVal, EntityVal, PaginatedCollectionVal)
from .graph import (
    StateGraph, StateDescriptor,
    compute_state_graph, compute_state_graph_update)
from .computator import UpdatedValue
