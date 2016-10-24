import * as q from '../Query';
import * as qp from '../QueryPointer';
import * as qo from '../QueryOperation';
import {stripContext} from './util';

const {def, here, pipeline, navigate, select, filter} = q;
const {normalize} = qo;
const individual = navigate('individual');
const study = navigate('study');
const name = navigate('name');

import * as jestMatchers from 'jest-matchers';
import * as matchers from 'jest-matchers/build/matchers';

let point = (q, ...keyPath) =>
  qp.select(qp.make(q), ...keyPath);

let pointerPath = pointer =>
  pointer
    ? pointer.path.map(item => item.join('.')).join(':')
    : null;

describe('addNavigation', function() {

  jestMatchers.addMatchers({
    toBeNavigatedAs(received, expected) {
      let {query, selected} = qo.addNavigation({
        loc: {
          pointer: received.pointer,
          selected: null,
        },
        path: received.path,
      });
      return matchers.toEqual(
        {
          query: stripContext(query),
          selected: pointerPath(selected),
        },
        {
          query: stripContext(expected.query),
          selected: expected.selected,
        }
      );
    }
  });

  it('here null a', function() {
    expect({
      pointer: point(here),
      path: ['a'],
    }).toBeNavigatedAs({
      query: q.select({a: q.navigate('a')}),
      selected: 'select.a'
    });
  });

  it('here null a.b', function() {
    expect({
      pointer: point(here),
      path: ['a', 'b'],
    }).toBeNavigatedAs({
      query: q.select({
        a: q.pipeline(q.navigate('a'), q.select({
          b: q.navigate('b')
        }))
      }),
      selected: 'select.a:pipeline.1:select.b'
    });
  });

  it('here null a.b.c', function() {
    expect({
      pointer: point(here),
      path: ['a', 'b', 'c'],
    }).toBeNavigatedAs({
      query: q.select({
        a: q.pipeline(q.navigate('a'), q.select({
          b: q.pipeline(q.navigate('b'), q.select({
            c: q.navigate('c')
          }))
        }))
      }),
      selected: 'select.a:pipeline.1:select.b:pipeline.1:select.c'
    });
  });

  it('here:select(a := a) null a.b', function() {
    expect({
      pointer: point(pipeline(here, select({a: navigate('a')}))),
      path: ['a', 'b'],
    }).toBeNavigatedAs({
      query: q.select({
        a: q.pipeline(q.navigate('a'), q.select({
          b: q.navigate('b')
        }))
      }),
      selected: 'select.a:pipeline.1:select.b'
    });
  });

  it('here:filter():select(a := a) null a.b', function() {
    expect({
      pointer: point(pipeline(here, filter(study), select({a: navigate('a')}))),
      path: ['a', 'b'],
    }).toBeNavigatedAs({
      query: pipeline(
        filter(study),
        select({
          a: pipeline(navigate('a'), select({
            b: navigate('b')
          }))
        })
      ),
      selected: 'pipeline.1:select.a:pipeline.1:select.b',
    });
  });

  it('here:select(a := a) null a.b.c', function() {
    expect({
      pointer: point(pipeline(here, select({a: navigate('a')}))),
      path: ['a', 'b', 'c'],
    }).toBeNavigatedAs({
      query: q.select({
        a: q.pipeline(q.navigate('a'), q.select({
          b: q.pipeline(q.navigate('b'), q.select({
            c: navigate('c'),
          }))
        }))
      }),
      selected: 'select.a:pipeline.1:select.b:pipeline.1:select.c'
    });
  });

  it('here:select(a := a) a b.c', function() {
    expect({
      pointer: point(
        pipeline(here, select({a: navigate('a')})),
        ['pipeline', 1],
        ['select', 'a']
      ),
      path: ['b', 'c'],
    }).toBeNavigatedAs({
      query: q.select({
        a: q.pipeline(q.navigate('a'), q.select({
          b: q.pipeline(q.navigate('b'), q.select({
            c: navigate('c'),
          }))
        }))
      }),
      selected: 'select.a:pipeline.1:select.b:pipeline.1:select.c'
    });
  });


});

describe('normalize()', function() {

  jestMatchers.addMatchers({
    toBeNormalizedAs(received, expected) {
      let result = stripped(normalize({
        query: received.query,
        selected: received.selected
      }));
      return matchers.toEqual(result, stripped(expected));
    }
  });

  function stripped({query, selected}) {
    query = stripContext(query);
    let path = selected
      ? pointerPath(selected)
      : null;
    return {query, path};
  }

  it('here', function() {
    let query = here;
    expect({
      query
    }).toBeNormalizedAs({
      query: stripContext(here),
      path: null
    });
    expect({
      query,
      selected: point(here)
    }).toBeNormalizedAs({
      query: here,
      selected: point(here)
    });
    expect({
      query,
      selected: qp.make(navigate('x'))
    }).toBeNormalizedAs({
      query: here,
      selected: point(here)
    });
  });

  it('individual null', function() {
    let query = individual;
    expect({
      query
    }).toBeNormalizedAs({
      query: individual,
      selected: null
    });
  });

  it('individual individual', function() {
    let query = individual;
    expect({
      query,
      selected: point(here)
    }).toBeNormalizedAs({
      query: individual,
      selected: point(here),
    });
  });

  it('individual.here null', function() {
    let query = pipeline(individual, here);
    expect({
      query
    }).toBeNormalizedAs({
      query: individual,
      selected: null
    });
  });

  it('individual.here pipeline.0', function() {
    let query = pipeline(individual, here);
    expect({
      query,
      selected: point(query, ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: individual,
      selected: point(individual),
    });
  });

  it('individual.here pipeline.1', function() {
    let query = pipeline(individual, here);
    expect({
      query,
      selected: point(query, ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: individual,
      selected: point(individual),
    });
  });

  it('individual.name.here null', function() {
    let query = pipeline(individual, name, here);
    let nextQuery = pipeline(individual, name);
    expect({
      query
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.here.name pipeline.0', function() {
    let query = pipeline(individual, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0]),
    });
  });

  it('individual.here.name pipeline.1', function() {
    let query = pipeline(individual, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0]),
    });
  });

  it('individual.here.name pipeline.2', function() {
    let query = pipeline(individual, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 2]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1]),
    });
  });

  it('individual.here.name null', function() {
    let query = pipeline(individual, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.here.name pipeline.0', function() {
    let query = pipeline(individual, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0]),
    });
  });

  it('individual.here.name pipeline.1', function() {
    let query = pipeline(individual, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0]),
    });
  });

  it('individual.here.name pipeline.2', function() {
    let query = pipeline(individual, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 2]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1]),
    });
  });

  it('individual.here.here.name null', function() {
    let query = pipeline(individual, here, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.here.here.name pipeline.0', function() {
    let query = pipeline(individual, here, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0]),
    });
  });

  it('individual.here.here.name pipeline.1', function() {
    let query = pipeline(individual, here, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0]),
    });
  });

  it('individual.here.here.name pipeline.2', function() {
    let query = pipeline(individual, here, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 2]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0]),
    });
  });

  it('individual.here.here.name pipeline.3', function() {
    let query = pipeline(individual, here, here, name);
    let nextQuery = pipeline(individual, name);
    expect({
      query,
      selected: point(query, ['pipeline', 3]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1]),
    });
  });

  it('individual.define(x := name) null', function() {
    let query = pipeline(individual, def('x', name));
    let nextQuery = query;
    expect({
      query,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.define(x := name) pipeline.0', function() {
    let query = pipeline(individual, def('x', name));
    let nextQuery = query;
    expect({
      query,
      selected: point(query, ['pipeline', 0])
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0])
    });
  });

  it('individual.define(x := name) pipeline.1', function() {
    let query = pipeline(individual, def('x', name));
    let nextQuery = query;
    expect({
      query,
      selected: point(query, ['pipeline', 1])
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1])
    });
  });

  it('individual.define(x := name) pipeline.1 binding.query', function() {
    let query = pipeline(individual, def('x', name));
    let nextQuery = query;
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query'])
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1], ['binding', 'query'])
    });
  });

  it('individual.define(x := here) null', function() {
    let query = pipeline(individual, def('x', here));
    let nextQuery = individual;
    expect({
      query,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.define(x := here) pipeline.0', function() {
    let query = pipeline(individual, def('x', here));
    let nextQuery = individual;
    expect({
      query,
      selected: point(query, ['pipeline', 0])
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery)
    });
  });

  it('individual.define(x := name) pipeline.1', function() {
    let query = pipeline(individual, def('x', here));
    let nextQuery = individual;
    expect({
      query,
      selected: point(query, ['pipeline', 1])
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery)
    });
  });

  it('individual.define(x := here) pipeline.1 binding.query', function() {
    let query = pipeline(individual, def('x', here));
    let nextQuery = individual;
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query'])
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery)
    });
  });

  it('individual.define(x := individual.here) null', function() {
    let query = pipeline(individual, def('x', pipeline(individual, here)));
    let nextQuery = pipeline(individual, def('x', individual));
    expect({
      query,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.define(x := individual.here) pipeline.0', function() {
    let query = pipeline(individual, def('x', pipeline(individual, here)));
    let nextQuery = pipeline(individual, def('x', individual));
    expect({
      query,
      selected: point(query, ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 0]),
    });
  });

  it('individual.define(x := individual.here) pipeline.1', function() {
    let query = pipeline(individual, def('x', pipeline(individual, here)));
    let nextQuery = pipeline(individual, def('x', individual));
    expect({
      query,
      selected: point(query, ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1]),
    });
  });

  it('individual.define(x := individual.here) pipeline.1 binding.query', function() {
    let query = pipeline(individual, def('x', pipeline(individual, here)));
    let nextQuery = pipeline(individual, def('x', individual));
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query']),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1], ['binding', 'query']),
    });
  });

  it('individual.define(x := individual.here) pipeline.1 binding.query', function() {
    let query = pipeline(individual, def('x', pipeline(individual, here)));
    let nextQuery = pipeline(individual, def('x', individual));
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query']),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1], ['binding', 'query']),
    });
  });

  it('individual.define(x := individual.here) pipeline.1 binding.query pipeline.0', function() {
    let query = pipeline(individual, def('x', pipeline(individual, here)));
    let nextQuery = pipeline(individual, def('x', individual));
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query'], ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1], ['binding', 'query']),
    });
  });

  it('individual.define(x := individual.here) pipeline.1 binding.query pipeline.1', function() {
    let query = pipeline(individual, def('x', pipeline(individual, here)));
    let nextQuery = pipeline(individual, def('x', individual));
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query'], ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1], ['binding', 'query']),
    });
  });

  it('individual.define(x := individual.name.here) pipeline.1 binding.query pipeline.0', function() {
    let query = pipeline(individual, def('x', pipeline(individual, name, here)));
    let nextQuery = pipeline(individual, def('x', pipeline(individual, name)));
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query'], ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1], ['binding', 'query'], ['pipeline', 0]),
    });
  });

  it('individual.define(x := individual.name.here) pipeline.1 binding.query pipeline.1', function() {
    let query = pipeline(individual, def('x', pipeline(individual, name, here)));
    let nextQuery = pipeline(individual, def('x', pipeline(individual, name)));
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query'], ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1], ['binding', 'query'], ['pipeline', 1]),
    });
  });

  it('individual.define(x := individual.name.here) pipeline.1 binding.query pipeline.2', function() {
    let query = pipeline(individual, def('x', pipeline(individual, name, here)));
    let nextQuery = pipeline(individual, def('x', pipeline(individual, name)));
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['binding', 'query'], ['pipeline', 2]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery, ['pipeline', 1], ['binding', 'query'], ['pipeline', 1]),
    });
  });

  it('individual:select(name := name) null', function() {
    let query = pipeline(individual, select({name}));
    let nextQuery = query;
    expect({
      query,
      selected: null,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null,
    });
  });

  it('individual:select(name := here) null', function() {
    let query = pipeline(individual, select({name: here}));
    let nextQuery = individual;
    expect({
      query,
      selected: null,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null,
    });
  });

  it('individual:select(name := here) pipeline.0', function() {
    let query = pipeline(individual, select({name: here}));
    let nextQuery = individual;
    expect({
      query,
      selected: point(query, ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery),
    });
  });

  it('individual:select(name := here) pipeline.1', function() {
    let query = pipeline(individual, select({name: here}));
    let nextQuery = individual;
    expect({
      query,
      selected: point(query, ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery),
    });
  });

  it('individual:select(name := here:select({name: name})) null', function() {
    let query = pipeline(individual, select({name: pipeline(here, select({name}))}));
    let nextQuery = pipeline(individual, select({name: select({name})}));
    expect({
      query,
      selected: null
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual:select(name := here:select({name: here})) null', function() {
    let query = pipeline(individual, select({name: pipeline(here, select({name: here}))}));
    let nextQuery = individual;
    expect({
      query,
      selected: null
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual:select(name := here:select({name: here})) pipeline.0', function() {
    let query = pipeline(individual, select({name: pipeline(here, select({name: here}))}));
    let nextQuery = individual;
    expect({
      query,
      selected: point(query, ['pipeline', 0])
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery),
    });
  });

  it('individual:select(name := here:select({name: here})) pipeline.1 select.name', function() {
    let query = pipeline(individual, select({name: pipeline(here, select({name: here}))}));
    let nextQuery = individual;
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['select', 'name']),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery),
    });
  });

  it('individual:select(name := here:select({name: here})) pipeline.1 select.name pipeline.1 select.name', function() {
    let query = pipeline(individual, select({name: pipeline(here, select({name: here}))}));
    let nextQuery = individual;
    expect({
      query,
      selected: point(query, ['pipeline', 1], ['select', 'name'], ['pipeline', 1], ['select', 'name']),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(nextQuery),
    });
  });

  it('individual:select(study := study:select({name: here})) null', function() {
    let query = pipeline(individual, select({study: pipeline(name, select({name: here}))}));
    let nextQuery = pipeline(individual, select({study: name}));
    expect({
      query,
      selected: null
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual:select(study := study:select({name: here})) pipeline.1 select.study pipeline.1 select.name', function() {
    let query = pipeline(
      individual,
      select({
        study: pipeline(
          study,
          select({name: here})
        )
      })
    );
    let nextQuery = pipeline(individual, select({study: study}));
    expect({
      query,
      selected: point(
        query,
        ['pipeline', 1],
        ['select', 'study'],
        ['pipeline', 1],
        ['select', 'name']
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: point(query, ['pipeline', 1], ['select', 'study']),
    });
  });

});

describe('insertAfter()', function() {

  it('individual!name', function() {
    let query = q.navigate('individual');
    let pointer = qp.make(query);
    let {query: nextQuery} = qo.insertAfter({pointer, selected: null}, q.navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('[individual]!name', function() {
    let query = q.pipeline(q.navigate('individual'));
    let pointer = qp.make(query);
    let {query: nextQuery} = qo.insertAfter({pointer, selected: null}, q.navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual.sample!name', function() {
    let query = q.pipeline(q.navigate('individual'), q.navigate('sample'));
    let pointer = qp.make(query);
    let {query: nextQuery} = qo.insertAfter({pointer, selected: null}, q.navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual!sample.name', function() {
    let query = q.pipeline(q.navigate('individual'), q.navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 0]);
    let {query: nextQuery} = qo.insertAfter({pointer, selected: null}, q.navigate('sample'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:define(a = sample!name)', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.def('a', q.navigate('sample'))
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['binding', 'query']
    );
    let {query: nextQuery} = qo.insertAfter({pointer, selected: null}, q.navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

});

describe('removeAt()', function() {

  it('individual.name!', function() {
    let query = q.pipeline(q.navigate('individual'), q.navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 1]);
    let {query: nextQuery} = qo.removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual!.name', function() {
    let query = q.pipeline(q.navigate('individual'), q.navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 0]);
    let {query: nextQuery} = qo.removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = sample.name!)', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.select({
        a: q.pipeline(q.navigate('sample'), q.navigate('name'))
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a']
    );
    let {query: nextQuery} = qo.removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = [sample!])', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.select({
        a: q.pipeline(q.navigate('sample')),
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a'],
      ['pipeline', 0]
    );
    let {query: nextQuery} = qo.removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = sample.name!, b = sample)', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.select({
        a: q.pipeline(q.navigate('sample'), q.navigate('name')),
        b: q.navigate('sample'),
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a']
    );
    let {query: nextQuery} = qo.removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:define(a := sample!)', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.def('a', q.pipeline(q.navigate('sample'))),
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['binding', 'query']
    );
    let {query: nextQuery} = qo.removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

});
