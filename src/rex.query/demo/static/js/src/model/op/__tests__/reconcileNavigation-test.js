import * as jestMatchers from 'jest-matchers';
import * as matchers from 'jest-matchers/build/matchers';

import * as t from '../../Type';
import {
  here, pipeline, navigate, select, def,
  inferType
} from '../../Query';
import {stripContext} from '../../__tests__/util';
import reconcileNavigation from '../reconcileNavigation';

const domain = t.createDomain({
  entity: {
    individual: domain => ({
      attribute: {
        name: {
          type: t.textType(domain),
        },
        age: {
          type: t.numberType(domain),
        },
        study: {
          type: t.entityType(domain, 'study'),
        },
      }
    }),
    study: domain => ({
      attribute: {
        name: {
          type: t.textType(domain),
        },
      }
    }),
  },
  aggregate: {
  },
});

const individual = navigate('individual');
const name = navigate('name');
const age = navigate('age');

describe('reconcileNavigation()', function() {

  jestMatchers.expect.extend({
    toBeReconciledAs(received, expected) {
      let query = reconcileNavigation(inferType(domain, received.query));
      return matchers.toEqual(
        {
          query: stripContext(query),
        },
        {
          query: stripContext(expected.query),
        }
      );
    }
  });

  it('individual', function() {
    let queryState = {
      query: pipeline(
        here,
        individual
      ),
      selected: null
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name),
          age: pipeline(age)
        }),
      ),
      selected: null
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual', function() {
    let queryState = {
      query: pipeline(
        here,
        individual
      ),
      selected: null
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name),
          age: pipeline(age),
        }),
      ),
      selected: null
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:define(q := name)', function() {
    let queryState = {
      query: pipeline(
        here,
        def('q', pipeline(individual))
      ),
      selected: null
    };
    let expectation = {
      query: pipeline(
        here,
        def('q', pipeline(
          individual,
          select({
            age: pipeline(age),
            name: pipeline(name),
          })
        ))
      ),
      selected: null
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:define(q := name) pipeline.1', function() {
    let queryState = {
      query: pipeline(
        here,
        def('q', pipeline(
          individual,
        ))
      ),
      selected: [
        ['pipeline', 1],
      ]
    };
    let expectation = {
      query: pipeline(
        here,
        def('q', pipeline(
          individual,
          select({
            age: pipeline(age),
            name: pipeline(name),
          })
        ))
      ),
      selected: [
        ['pipeline', 1],
      ]
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual:define()', function() {
    let queryState = {
      query: pipeline(
        here,
        individual,
        def('q', pipeline(name)),
      ),
      selected: null
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        def('q', pipeline(name)),
        select({
          name: pipeline(name),
          age: pipeline(age),
        }),
      ),
      selected: null
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual:define() pipeline.2:binding.query', function() {
    let queryState = {
      query: pipeline(
        here,
        individual,
        def('q', pipeline(name)),
      ),
      selected: [
        ['pipeline', 2],
        ['binding', 'query'],
      ],
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        def('q', pipeline(name)),
        select({
          name: pipeline(name),
          age: pipeline(age),
        }),
      ),
      selected: [
        ['pipeline', 2],
        ['binding', 'query'],
      ],
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual:define() pipeline.1', function() {
    let queryState = {
      query: pipeline(
        here,
        individual,
        def('q', pipeline(name)),
      ),
      selected: [
        ['pipeline', 1],
      ],
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        def('q', pipeline(name)),
        select({
          name: pipeline(name),
          age: pipeline(age),
        }),
      ),
      selected: [
        ['pipeline', 1],
      ],
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual:select(name:define()) pipeline.1', function() {
    let queryState = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name, def('q', pipeline(name)))
        })
      ),
      selected: [
        ['pipeline', 1],
      ],
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name, def('q', pipeline(name))),
        })
      ),
      selected: [
        ['pipeline', 1],
      ],
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual:select(name:define()) pipeline.2 select.name pipeline.0', function() {
    let queryState = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name, def('q', pipeline(name)))
        })
      ),
      selected: [
        ['pipeline', 2],
        ['select', 'name'],
        ['pipeline', 0],
      ],
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name, def('q', pipeline(name))),
        })
      ),
      selected: [
        ['pipeline', 2],
        ['select', 'name'],
        ['pipeline', 0],
      ],
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual:select(name:define()) pipeline.2 select.name pipeline.1', function() {
    let queryState = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name, def('q', pipeline(name)))
        })
      ),
      selected: [
        ['pipeline', 2],
        ['select', 'name'],
        ['pipeline', 1],
      ],
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name, def('q', pipeline(name))),
        })
      ),
      selected: [
        ['pipeline', 2],
        ['select', 'name'],
        ['pipeline', 1],
      ],
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual:select(name:define()) pipeline.2 select.name pipeline.1 binding.query', function() {
    let queryState = {
      query: pipeline(
        here,
        individual,
        select({name: pipeline(name, def('q', pipeline(name)))})
      ),
      selected: [
        ['pipeline', 2],
        ['select', 'name'],
        ['pipeline', 1],
        ['binding', 'query'],
      ],
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name, def('q', pipeline(name))),
        })
      ),
      selected: [
        ['pipeline', 2],
        ['select', 'name'],
        ['pipeline', 1],
        ['binding', 'query'],
      ],
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:individual pipeline.1', function() {
    let queryState = {
      query: pipeline(
        here,
        individual
      ),
      selected: [
        ['pipeline', 1]
      ],
    };
    let expectation = {
      query: pipeline(
        here,
        individual,
        select({
          name: pipeline(name),
          age: pipeline(age),
        }),
      ),
      selected: [
        ['pipeline', 1]
      ],
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('individual:select(name)', function() {
    let queryState = {
      query: pipeline(
        here,
        select({individual: pipeline(individual)})
      ),
      selected: null
    };
    let expectation = {
      query: pipeline(
        here,
        select({
          individual: pipeline(
            individual,
          )
        })
      ),
      selected: null
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

  it('here:select(individual)', function() {
    let queryState = {
      query: pipeline(
        here,
        select({individual: pipeline(individual)})
      ),
      selected: null
    };
    let expectation = {
      query: pipeline(
        here,
        select({
          individual: pipeline(
            individual,
          )
        })
      ),
      selected: null
    };
    expect(queryState).toBeReconciledAs(expectation);
  });

});
