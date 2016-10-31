import * as jestMatchers from 'jest-matchers';
import * as matchers from 'jest-matchers/build/matchers';

import {def, here, pipeline, navigate, select} from '../../Query';
import {make as pointer} from '../../QueryPointer';
import {stripContext} from '../../__tests__/util';
import normalize from '../normalize';

const individual = navigate('individual');
const study = navigate('study');
const name = navigate('name');

let pointerPath = pointer =>
  pointer
    ? pointer.path.map(item => item.join('.')).join(':')
    : null;

function stripped({query, selected}) {
  query = stripContext(query);
  let path = selected
    ? pointerPath(selected)
    : null;
  return {query, path};
}

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

  it('here', function() {
    let query = pipeline(here);
    expect({
      query
    }).toBeNormalizedAs({
      query: pipeline(here),
      path: null
    });
    expect({
      query,
      selected: pointer(here)
    }).toBeNormalizedAs({
      query: pipeline(here),
      selected: pointer(here)
    });
    expect({
      query,
      selected: pointer(navigate('x'))
    }).toBeNormalizedAs({
      query: pipeline(here),
      selected: pointer(here)
    });
  });

  it('individual null', function() {
    let query = pipeline(
      here,
      individual
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual individual', function() {
    let query = pipeline(
      here,
      individual
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1]
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.here null', function() {
    let query = pipeline(
      individual,
      here
    );
    let nextQuery = pipeline(
      here,
      individual,
    );
    expect({
      query
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.here pipeline.0', function() {
    let query = pipeline(
      individual,
      here
    );
    let nextQuery = pipeline(
      here,
      individual,
    );
    expect({
      query,
      selected: pointer(query, ['pipeline', 0]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.here pipeline.1', function() {
    let query = pipeline(
      individual,
      here
    );
    let nextQuery = pipeline(
      here,
      individual,
    );
    expect({
      query,
      selected: pointer(query, ['pipeline', 1]),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1],
      ),
    });
  });

  it('individual.name.here null', function() {
    let query = pipeline(
      here,
      individual,
      name,
      here
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.here.name pipeline.0', function() {
    let query = pipeline(
      individual,
      name,
      here
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 0],
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1],
      ),
    });
  });

  it('individual.here.name pipeline.1', function() {
    let query = pipeline(
      individual,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.here.name pipeline.2', function() {
    let query = pipeline(
      individual,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 2]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2]
      ),
    });
  });

  it('individual.here.name null', function() {
    let query = pipeline(
      individual,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.here.name pipeline.0', function() {
    let query = pipeline(
      individual,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 0]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.here.name pipeline.1', function() {
    let query = pipeline(
      individual,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.here.name pipeline.2', function() {
    let query = pipeline(
      individual,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 2]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2]
      ),
    });
  });

  it('individual.here.here.name null', function() {
    let query = pipeline(
      individual,
      here,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.here.here.name pipeline.0', function() {
    let query = pipeline(
      individual,
      here,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 0]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.here.here.name pipeline.1', function() {
    let query = pipeline(
      individual,
      here,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.here.here.name pipeline.2', function() {
    let query = pipeline(
      individual,
      here,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 2]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.here.here.name pipeline.3', function() {
    let query = pipeline(
      individual,
      here,
      here,
      name
    );
    let nextQuery = pipeline(
      here,
      individual,
      name
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 3]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2]
      ),
    });
  });

  it('individual.define(x := name) null', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(name))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(name))
    );
    expect({
      query,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.define(x := name) pipeline.0', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(name))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(name))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 0]
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      )
    });
  });

  it('individual.define(x := name) pipeline.1', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(name))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(name))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1]
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2]
      )
    });
  });

  it('individual.define(x := name) pipeline.1 binding.query', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(name))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(name))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query']
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['binding', 'query']
      )
    });
  });

  it('individual.define(x := here) null', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(here))
    );
    let nextQuery = pipeline(
      here,
      individual,
    );
    expect({
      query,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.define(x := here) pipeline.0', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(here))
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 0],
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1],
      ),
    });
  });

  it('individual.define(x := name) pipeline.1', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(here))
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1]
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1],
      )
    });
  });

  it('individual.define(x := here) pipeline.1 binding.query', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(here))
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query'],
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1],
      ),
    });
  });

  it('individual.define(x := individual.here) null', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual))
    );
    expect({
      query,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual.define(x := individual.here) pipeline.0', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 0]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual.define(x := individual.here) pipeline.1', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2]
      ),
    });
  });

  it('individual.define(x := individual.here) pipeline.1 binding.query', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query']
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['binding', 'query']
      ),
    });
  });

  it('individual.define(x := individual.here) pipeline.1 binding.query', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query']
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['binding', 'query']
      ),
    });
  });

  it('individual.define(x := individual.here) pipeline.1 binding.query pipeline.0', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query'],
        ['pipeline', 0]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['binding', 'query'],
        ['pipeline', 0],
      ),
    });
  });

  it('individual.define(x := individual.here) pipeline.1 binding.query pipeline.1', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query'],
        ['pipeline', 1]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['binding', 'query'],
        ['pipeline', 0],
      ),
    });
  });

  it('individual.define(x := individual.name.here) pipeline.1 binding.query pipeline.0', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, name, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual, name))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query'],
        ['pipeline', 0]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['binding', 'query'],
        ['pipeline', 0]
      ),
    });
  });

  it('individual.define(x := individual.name.here) pipeline.1 binding.query pipeline.1', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, name, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual, name))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query'],
        ['pipeline', 1]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['binding', 'query'],
        ['pipeline', 1]
      ),
    });
  });

  it('individual.define(x := individual.name.here) pipeline.1 binding.query pipeline.2', function() {
    let query = pipeline(
      individual,
      def('x', pipeline(individual, name, here))
    );
    let nextQuery = pipeline(
      here,
      individual,
      def('x', pipeline(individual, name))
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['binding', 'query'],
        ['pipeline', 2]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['binding', 'query'],
        ['pipeline', 1]
      ),
    });
  });

  it('individual:select(name := name) null', function() {
    let query = pipeline(
      individual,
      select({name})
    );
    let nextQuery = pipeline(
      here,
      individual,
      select({name})
    );
    expect({
      query,
      selected: null,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null,
    });
  });

  it('individual:select(name := here) null', function() {
    let query = pipeline(
      individual,
      select({name: pipeline(here)})
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: null,
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null,
    });
  });

  it('individual:select(name := here) pipeline.0', function() {
    let query = pipeline(
      individual,
      select({name: pipeline(here)})
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 0]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1],
      ),
    });
  });

  it('individual:select(name := here) pipeline.1', function() {
    let query = pipeline(
      individual,
      select({name: pipeline(here)})
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1]
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual:select(name := here:select({name: name})) null', function() {
    let query = pipeline(
      individual,
      select({name: pipeline(here, select({name: pipeline(name)}))})
    );
    let nextQuery = pipeline(
      here,
      individual,
      select({name: pipeline(select({name: pipeline(name)}))})
    );
    expect({
      query,
      selected: null
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual:select(name := here:select({name: here})) null', function() {
    let query = pipeline(
      individual,
      select({name: pipeline(here, select({name: pipeline(here)}))})
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: null
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: null
    });
  });

  it('individual:select(name := here:select({name: here})) pipeline.0', function() {
    let query = pipeline(
      individual,
      select({name: pipeline(here, select({name: pipeline(here)}))})
    );
    let nextQuery = pipeline(
      here,
      individual,
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 0]
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual:select(name := here:select({name: here})) pipeline.1 select.name', function() {
    let query = pipeline(
      individual,
      select({name: pipeline(here, select({name: pipeline(here)}))})
    );
    let nextQuery = pipeline(
      here,
      individual,
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1], ['select', 'name']
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual:select(name := here:select({name: here})) pipeline.1 select.name pipeline.1 select.name', function() {
    let query = pipeline(
      individual,
      select({name: pipeline(here, select({name: pipeline(here)}))})
    );
    let nextQuery = pipeline(
      here,
      individual
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['select', 'name'],
        ['pipeline', 1],
        ['select', 'name']
      ),
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 1]
      ),
    });
  });

  it('individual:select(study := study:select({name: here})) null', function() {
    let query = pipeline(
      individual,
      select({study: pipeline(name, select({name: pipeline(here)}))})
    );
    let nextQuery = pipeline(
      here,
      individual,
      select({study: pipeline(name)})
    );
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
          select({name: pipeline(here)})
        )
      })
    );
    let nextQuery = pipeline(
      here,
      individual,
      select({study: pipeline(study)})
    );
    expect({
      query,
      selected: pointer(
        query,
        ['pipeline', 1],
        ['select', 'study'],
        ['pipeline', 1],
        ['select', 'name']
      )
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(
        nextQuery,
        ['pipeline', 2],
        ['select', 'study'],
        ['pipeline', 0],
      ),
    });
  });

  it('here:(individual:select(name)) pipeline.1:pipeline:0', function() {
    let query = pipeline(
      here,
      pipeline(
        individual,
        select({name}),
      )
    );
    let nextQuery = pipeline(
      here,
      individual,
      select({name}),
    );
    expect({
      query,
      selected: pointer(query, ['pipeline', 1], ['pipeline', 0])
    }).toBeNormalizedAs({
      query: nextQuery,
      selected: pointer(nextQuery, ['pipeline', 1])
    });
  });
});

