"""

    test_state_compute
    ==================

    Tests for state recomputations.

"""

import pytest

from rex.widget.state import (
        MutableStateGraph, dep,
        compute, compute_update,
        InRangeValue, AggregatedValue)

class DummyData(object):
    """ Mimics DataComputator but does nothing except returning params."""

    def __init__(self, refs=None):
        self.refs = refs or {}

    def __call__(self, state, graph, dirty):
        params = {name: graph.deref(ref) for name, ref in self.refs.items()}
        return {"params": params}


class ReviewerData(object):
    """ Mimics DataComputator but does nothing except returning params."""

    def __call__(self, state, graph, dirty):
        return [
            {"id": 1},
            {"id": 2},
        ]

class ReviewerYearData(object):
    """ Mimics DataComputator but does nothing except returning params."""

    reviewer1 = [2001, 2002]
    reviewer2 = [2002, 2003]

    def __call__(self, state, graph, dirty):
        reviewer = graph.deref('reviewer.value')
        if reviewer == 1:
            return [{"id": year} for year in self.reviewer1]
        elif reviewer == 2:
            return [{"id": year} for year in self.reviewer2]
        else:
            return [{"id": year}
                    for year in set(self.reviewer1 + self.reviewer2)]

def prepare_state():
    g = MutableStateGraph()

    # select box
    g.add('reviewer.data',
        ReviewerData())
    g.add('reviewer.value',
        InRangeValue(None, source='reviewer.data'),
        dependencies=['reviewer.data'],
        rw=True)

    # select box which depends on reviewer.value
    g.add('reviewerYear.data',
        ReviewerYearData(),
        dependencies=['reviewer.value'])
    g.add('reviewerYear.value',
        InRangeValue(None, source='reviewerYear.data'),
        dependencies=['reviewerYear.data'],
        rw=True)

    # filter which depends on both select boxes
    g.add('reviewerFilter.value',
        AggregatedValue({
            'reviewer': 'reviewer.value',
            'reviewerYear': 'reviewerYear.value'
        }),
        dependencies=[
            dep('reviewer.value', reset_only=True),
            dep('reviewerYear.value', reset_only=True)
        ],
        rw=True)

    # dataset which depends on filter
    g.add('reviewerStatistics.data',
        DummyData({
            'reviewer': 'reviewerFilter.value:reviewer',
            'reviewerYear': 'reviewerFilter.value:reviewerYear'
        }),
        dependencies=[
            'reviewerFilter.value'
        ])

    return g


def test_graph_construction():
    state = prepare_state()

    assert 'reviewer.data' in state
    assert 'reviewer.value' in state

    assert 'reviewerYear.data' in state
    assert 'reviewerYear.value' in state

    assert 'reviewerFilter.value' in state

    assert 'reviewerStatistics.data' in state


def test_initial_computation():
    state = prepare_state()
    computed = compute(state)

    assert 'reviewer.data' in computed
    assert computed['reviewer.data'].value == [
        {'id': 1},
        {'id': 2}
    ]

    assert 'reviewer.value' in computed
    assert computed['reviewer.value'].value == None

    assert 'reviewerYear.data' in computed
    assert computed['reviewerYear.data'].value == [
        {'id': 2001},
        {'id': 2002},
        {'id': 2003}
    ]

    assert 'reviewerYear.value' in computed
    assert computed['reviewerYear.value'].value == None

    assert 'reviewerFilter.value' in computed
    assert computed['reviewerFilter.value'].value == {
        'reviewer': None,
        'reviewerYear': None,
    }

    assert 'reviewerStatistics.data' in computed
    assert computed['reviewerStatistics.data'].value == {
        'params': {
            'reviewer': None,
            'reviewerYear': None,
        }
    }


def test_simple_update_reviewer():
    state = prepare_state()

    state.set_many({
        'reviewerYear.value': None,
        'reviewer.value': 1,
        'reviewerFilter.value': {
            'reviewer': None,
            'reviewerYear': None,
        }
    })

    computed, visited = compute_update(state, ['reviewer.value'])

    assert computed['reviewer.value'].value == 1
    assert computed['reviewerYear.data'].value == [
        {'id': 2001},
        {'id': 2002}
    ]
    assert computed['reviewerYear.value'].value == None
    assert 'reviewerFilter.value' not in computed
    assert 'reviewerStatistics.data' not in computed

def test_update_reviewer_keep_value():
    state = prepare_state()

    state.set_many({
        'reviewerYear.value': 2001,
        'reviewer.value': 1,
    })

    computed, visited = compute_update(state, ['reviewer.value'])

    assert computed['reviewer.value'].value == 1
    assert computed['reviewerYear.data'].value == [
        {'id': 2001},
        {'id': 2002}
    ]
    assert computed['reviewerYear.value'].value == 2001
    assert 'reviewerFilter.value' not in computed
    assert 'reviewerStatistics.data' not in computed


def test_update_reviewer_reset_value():
    state = prepare_state()

    state.set_many({
        'reviewerYear.value': 2001,
        'reviewer.value': 2,
    })

    computed, visited = compute_update(state, ['reviewer.value'])

    assert computed['reviewer.value'].value == 2
    assert computed['reviewerYear.data'].value == [
        {'id': 2002},
        {'id': 2003}
    ]
    assert computed['reviewerYear.value'].value == None
    assert 'reviewerFilter.value' not in computed
    assert 'reviewerStatistics.data' not in computed


def test_update_reviewer_and_filter_only():
    state = prepare_state()

    state.set_many({
        'reviewerYear.value': None,
        'reviewer.value': 1,
        'reviewerFilter.value': {
            'reviewer': 1,
            'reviewerYear': None,
        }
    })

    computed, visited = compute_update(state, ['reviewerFilter.value', 'reviewer.value'])

    assert computed['reviewer.value'].value == 1
    assert computed['reviewerYear.data'].value == [
        {'id': 2001},
        {'id': 2002}
    ]
    assert computed['reviewerYear.value'].value == None
    assert computed['reviewerFilter.value'].value == {
        'reviewer': 1,
        'reviewerYear': None,
    }
    assert computed['reviewerStatistics.data'].value == {
        'params': {
            'reviewer': 1,
            'reviewerYear': None
        }
    }


def test_update_reviewer_and_filter_keep_value():
    state = prepare_state()

    state.set_many({
        'reviewerYear.value': 2001,
        'reviewer.value': 1,
        'reviewerFilter.value': {
            'reviewer': 1,
            'reviewerYear': 2001,
        }
    })

    computed, visited = compute_update(state, [
        'reviewer.value',
        'reviewerFilter.value',
    ])

    assert computed['reviewer.value'].value == 1
    assert computed['reviewerYear.data'].value == [
        {'id': 2001},
        {'id': 2002}
    ]
    assert computed['reviewerYear.value'].value == 2001
    assert computed['reviewerFilter.value'].value == {
        'reviewer': 1,
        'reviewerYear': 2001,
    }
    assert computed['reviewerStatistics.data'].value == {
        'params': {
            'reviewer': 1,
            'reviewerYear': 2001,
        }
    }


def test_update_reviewer_and_filter_reset_value():
    state = prepare_state()

    state.set_many({
        'reviewerYear.value': 2001,
        'reviewer.value': 2,
        'reviewerFilter.value': {
            'reviewer': 2,
            'reviewerYear': 2001,
        }
    })

    computed, visited = compute_update(state, [
        'reviewerFilter.value',
        'reviewer.value',
    ])

    assert computed['reviewer.value'].value == 2
    assert computed['reviewerYear.data'].value == [
        {'id': 2002},
        {'id': 2003}
    ]
    assert computed['reviewerYear.value'].value == None
    assert computed['reviewerFilter.value'].value == {
        'reviewer': 2,
        'reviewerYear': None,
    }
    assert computed['reviewerStatistics.data'].value == {
        'params': {
            'reviewer': 2,
            'reviewerYear': None,
        }
    }
