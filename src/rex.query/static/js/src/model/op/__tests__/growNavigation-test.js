import * as jestMatchers from 'jest-matchers';
import * as matchers from 'jest-matchers/build/matchers';

import {value, here, pipeline, navigate, select, filter, def} from '../../Query';
import * as qp from '../../QueryPointer';
import {stripContext} from '../../__tests__/util';
import growNavigation from '../growNavigation';

let pointerPath = pointer =>
  pointer
    ? pointer.path.map(item => item.join('.')).join(':')
    : null;

describe('growNavigation', function() {

  jestMatchers.expect.extend({
    toBeNavigatedAs(received, expected) {
      let {query, selected} = growNavigation({
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
      pointer: qp.make(pipeline(here)),
      path: ['a'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        select({
          a: pipeline(navigate('a'))
        }),
      ),
      selected: 'pipeline.1:select.a:pipeline.0'
    });
  });

  it('here null a.b', function() {
    expect({
      pointer: qp.make(pipeline(here)),
      path: ['a', 'b'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        select({
          a: pipeline(navigate('a'), select({
            b: pipeline(navigate('b'))
          }))
        }),
      ),
      selected: 'pipeline.1:select.a:pipeline.1:select.b:pipeline.0'
    });
  });

  it('here null a.b.c', function() {
    expect({
      pointer: qp.make(pipeline(here)),
      path: ['a', 'b', 'c'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        select({
          a: pipeline(navigate('a'), select({
            b: pipeline(navigate('b'), select({
              c: pipeline(navigate('c')),
            }))
          }))
        }),
      ),
      selected: 'pipeline.1:select.a:pipeline.1:select.b:pipeline.1:select.c:pipeline.0'
    });
  });

  it('here:select(a := a) null a.b', function() {
    expect({
      pointer: qp.make(pipeline(
        here,
        select({
          a: pipeline(navigate('a')),
        })
      )),
      path: ['a', 'b'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        select({
          a: pipeline(navigate('a'), select({
            b: pipeline(navigate('b'))
          }))
        }),
      ),
      selected: 'pipeline.1:select.a:pipeline.1:select.b:pipeline.0'
    });
  });

  it('here:filter():select(a := a) null a.b', function() {
    expect({
      pointer: qp.make(pipeline(
        here,
        filter(value(true)),
        select({a: pipeline(navigate('a'))}),
      )),
      path: ['a', 'b'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        filter(value(true)),
        select({
          a: pipeline(navigate('a'), select({
            b: pipeline(navigate('b'))
          }))
        })
      ),
      selected: 'pipeline.2:select.a:pipeline.1:select.b:pipeline.0',
    });
  });

  it('here:select(a := a) null a.b.c', function() {
    expect({
      pointer: qp.make(pipeline(
        here,
        select({a: pipeline(navigate('a'))})
      )),
      path: ['a', 'b', 'c'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        select({
          a: pipeline(navigate('a'), select({
            b: pipeline(navigate('b'), select({
              c: pipeline(navigate('c')),
            }))
          }))
        }),
      ),
      selected: 'pipeline.1:select.a:pipeline.1:select.b:pipeline.1:select.c:pipeline.0'
    });
  });

  it('here:select(a := a) a b.c', function() {
    expect({
      pointer: qp.make(
        pipeline(here, select({a: pipeline(navigate('a'))})),
        ['pipeline', 1],
        ['select', 'a']
      ),
      path: ['b', 'c'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        select({
          a: pipeline(navigate('a'), select({
            b: pipeline(navigate('b'), select({
              c: pipeline(navigate('c')),
            }))
          }))
        }),
      ),
      selected: 'pipeline.1:select.a:pipeline.1:select.b:pipeline.1:select.c:pipeline.0'
    });
  });

  it('here:define(a := a) a b', function() {
    expect({
      pointer: qp.make(
        pipeline(
          here,
          def('a', pipeline(navigate('a')))
        ),
        ['pipeline', 1],
        ['binding', 'query'],
      ),
      path: ['b'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        def('a', pipeline(
          navigate('a'),
          select({b: pipeline(navigate('b'))})
        )),
      ),
      selected: 'pipeline.1:binding.query:pipeline.1:select.b:pipeline.0'
    });
  });

  it('here:define(a := a) -a b', function() {
    expect({
      pointer: qp.make(
        pipeline(
          here,
          def('a', pipeline(navigate('a')))
        ),
        ['pipeline', 1],
        ['binding', 'query'],
        ['pipeline', '0'],
      ),
      path: ['b'],
    }).toBeNavigatedAs({
      query: pipeline(
        here,
        def('a', pipeline(
          navigate('a'),
          select({b: pipeline(navigate('b'))})
        )),
      ),
      selected: 'pipeline.1:binding.query:pipeline.1:select.b:pipeline.0'
    });
  });

});
