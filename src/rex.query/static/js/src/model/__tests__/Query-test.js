// @flow

import * as c from '../RexQueryCatalog';

import {
  here, navigate, filter, limit,
  select, aggregate, pipeline, def,
  value, group, or, and, not, exists,
  lessEqual, less, greater, greaterEqual,
  voidContext,
  genExpressionName, genQueryName, inferTypeAtPath,
  serializeQuery, deserializeQuery,
  inferQueryType, inferExpressionType
} from '../Query';
import {
  voidType, numberType, textType,
  entityType, recordType, invalidType,
  seqType, optType,
  createDomain
} from '../Type';
import {stripDomain} from './util';

import _catalog from './catalog.json';

let catalog: c.Catalog = _catalog;
let domain = c.toDomain(catalog);

describe('inferType()', function() {

  let domain = createDomain({
    aggregate: {
      count: {
        name: 'count',
        title: 'Count',
        isAllowed: _type => true,
        makeType: type => numberType(type.domain)
      }
    },
    entity: {
      sample: domain => ({
        title: 'Sample',
        attribute: {
          title: {
            title: 'Title',
            type: textType(domain),
          }
        }
      }),
      identity: domain => ({
        title: 'Identity',
        attribute: {
          name: {
            title: 'Name',
            type: textType(domain),
          },
        }
      }),
      individual: domain => ({
        title: 'Individual',
        attribute: {
          name: {
            title: 'Name',
            type: textType(domain),
          },
          age: {
            title: 'Age',
            type: optType(textType(domain)),
          },
          identity: {
            title: 'Identity',
            type: entityType(domain, 'identity'),
          },
          sample: {
            title: 'Sample',
            type: seqType(entityType(domain, 'sample')),
          }
        }
      })
    }
  });

  let individual = navigate('individual');
  let sample = navigate('sample');
  let name = navigate('name');
  let identity = navigate('identity');
  let age = navigate('age');
  let title = navigate('title');
  let count = aggregate('count');

  it('infers type of query atoms', function() {
    expect(inferQueryType(voidContext(domain), here).context.type)
      .toEqual(
        voidType(domain)
      );
    expect(inferQueryType(voidContext(domain), individual).context.type)
      .toEqual(
        seqType(entityType(domain, 'individual'))
      );
    expect(inferQueryType(voidContext(domain), navigate('unknown')).context.type)
      .toEqual(
        invalidType(domain)
      );
    expect(inferQueryType(voidContext(domain), filter(value(true))).context.type)
      .toEqual(voidType(domain));
    expect(inferQueryType(voidContext(domain), limit(10)).context.type)
      .toEqual(voidType(domain));
    expect(inferQueryType(voidContext(domain), select({a: pipeline(individual)})).context.type)
      .toEqual(recordType(domain, {
        a: {title: 'Individual', type: seqType(entityType(domain, 'individual'))}
      }));
    expect(inferQueryType(voidContext(domain), select({a: pipeline(navigate('unknown'))})).context.type)
      .toEqual(recordType(domain, {
        a: {title: 'unknown', type: invalidType(domain)}
      }));
    expect(inferQueryType(voidContext(domain), aggregate('count')).context.type)
      .toEqual(
        invalidType(domain)
      );
  });

  it('fails on navigate to unknown attribute', function() {
    expect(inferQueryType(voidContext(domain), pipeline(
      individual,
      navigate('b'),
    )).context.type).toEqual(
      invalidType(domain)
    );
  });

  it('fails on navigate to unknown record field', function() {
    expect(inferQueryType(voidContext(domain), pipeline(
      select({a: pipeline(individual)}),
      navigate('b'),
    )).context.type).toEqual(
      invalidType(domain)
    );
  });

  it('individual.name', function() {
    let query = pipeline(
      individual,
      name
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('here.individual', function() {
    let query = pipeline(
      here,
      individual,
    );
    expect(inferQueryType(voidContext(domain), query).context.type).toEqual(
      seqType(entityType(domain, 'individual'))
    );
  });

  it('here.individual.here', function() {
    let query = pipeline(
      here,
      individual,
      here,
    );
    expect(inferQueryType(voidContext(domain), query).context.type).toEqual(
      seqType(entityType(domain, 'individual'))
    );
  });

  it('here.individual.here.name', function() {
    let query = pipeline(
      here,
      individual,
      here,
      name,
    );
    expect(inferQueryType(voidContext(domain), query).context.type).toEqual(
      seqType(textType(domain))
    );
  });

  it('individual.name:count()', function() {
    let query = pipeline(
      individual,
      name,
      count
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });


  it('individual.sample', function() {
    let query = pipeline(
      individual,
      sample,
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual.sample.title', function() {
    let query = pipeline(
      individual,
      sample,
      title,
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:select(a := name, b := name)', function() {
    let query = pipeline(
      individual,
      select({
        a: pipeline(name),
        b: pipeline(name)
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:select(a := name, s := sample)', function() {
    let query = pipeline(
      individual,
      select({
        a: pipeline(name),
        s: pipeline(sample),
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:select(id := identity)', function() {
    let query = pipeline(
      individual,
      select({
        id: pipeline(identity)
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(id := identity).select(id := id)', function() {
    let query = pipeline(
      individual,
      def('id', pipeline(identity)),
      select({
        id: pipeline(navigate('id')),
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:select(id := identity.name)', function() {
    let query = pipeline(
      individual,
      select({
        id: pipeline(identity, name)
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(id := identity.name).select(id := id)', function() {
    let query = pipeline(
      individual,
      def('id', pipeline(identity, name)),
      select({
        id: pipeline(navigate('id')),
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(id := identity).select(id := id.name)', function() {
    let query = pipeline(
      individual,
      def('id', pipeline(identity)),
      select({
        id: pipeline(navigate('id'), name),
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(id := identity:select(name)).select(id := id)', function() {
    let query = pipeline(
      individual,
      def('id', pipeline(
        identity,
        select({name: pipeline(name)}),
      )),
      select({
        id: pipeline(navigate('id')),
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(newname := name):select(a := newname, b := name)', function() {
    let query = pipeline(
      individual,
      def('newname', pipeline(name)),
      select({
        a: pipeline(navigate('newname')),
        b: pipeline(name)
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:select(a := age)', function() {
    let query = pipeline(
      individual,
      select({
        a: pipeline(age),
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:select(a := name, s := sample:count())', function() {
    let query = pipeline(
      individual,
      select({
        a: pipeline(name),
        s: pipeline(sample, count)
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:select(a := name, s := sample.title)', function() {
    let query = pipeline(
      individual,
      select({
        a: pipeline(name),
        s: pipeline(sample, title)
      })
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:select(a := name, b := name).a', function() {
    let query = pipeline(
      individual,
      select({a: pipeline(name), b: pipeline(name)}),
      navigate('a'),
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:unknown() : fails on unknown aggregate', function() {
    let query = pipeline(
      individual,
      aggregate('unknown')
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(nickname := name)', function() {
    let query = pipeline(
      individual,
      def('nickname', pipeline(navigate('name'))),
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(nickname := name).nickname', function() {
    let query = pipeline(
      individual,
      def('nickname', pipeline(navigate('name'))),
      navigate('nickname'),
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(nickname := name):select(nickname)', function() {
    let query = pipeline(
      individual,
      def('nickname', pipeline(navigate('name'))),
      select({nickname: pipeline(navigate('nickname'))}),
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(nickname := name):select(nickname:select(code))', function() {
    let query = pipeline(
      individual,
      def('nickname', pipeline(navigate('name'))),
      select({
        nickname: pipeline(
          navigate('nickname'),
          select({code: pipeline(navigate('code'))})
        )
      }),
    );
    expect(stripDomain(inferQueryType(voidContext(domain), query))).toMatchSnapshot();
  });

  it('individual:define(s := sample:count()):select(s:select(title))', function() {
    let query = pipeline(
      individual,
      def('s', pipeline(sample, count)),
      select({
        s: pipeline(
          navigate('s'),
          select({title: pipeline(title)})
        )
      }),
    );
    expect(inferQueryType(voidContext(domain), query)).toMatchSnapshot();
  });

  it('individual:group(age))', function() {
    let query = pipeline(
      individual,
      group(['age']),
    );
    expect(inferQueryType(voidContext(domain), query)).toMatchSnapshot();
  });

  it('individual:group(age):name)', function() {
    let query = pipeline(
      individual,
      group(['age']),
      individual,
      name,
    );
    expect(inferQueryType(voidContext(domain), query)).toMatchSnapshot();
  });

  it('individual:group(age):select(name))', function() {
    let query = pipeline(
      individual,
      group(['age']),
      select({name: pipeline(individual, name)}),
    );
    expect(inferQueryType(voidContext(domain), query)).toMatchSnapshot();
  });

  it('individual:group(age):select(age, name))', function() {
    let query = pipeline(
      individual,
      group(['age']),
      select({
        age: pipeline(individual, age),
        name: pipeline(individual, name),
      }),
    );
    expect(inferQueryType(voidContext(domain), query)).toMatchSnapshot();
  });

  it('individual:define(id := identity.name):group(id))', function() {
    let query = pipeline(
      individual,
      def('id', pipeline(
        identity,
        name,
      )),
      group(['id']),
    );
    expect(inferQueryType(voidContext(domain), query)).toMatchSnapshot();
  });

});

describe('inferExpressionType(context, expression)', function() {
  it('customer', function() {
    expect(inferExpressionType(voidContext(domain),
      navigate('customer')
    )).toMatchSnapshot();
  });
  it('42', function() {
    expect(inferExpressionType(voidContext(domain),
      value(42)
    )).toMatchSnapshot();
  });
  it('"text!"', function() {
    expect(inferExpressionType(voidContext(domain),
      value('text!')
    )).toMatchSnapshot();
  });
  it('true', function() {
    expect(inferExpressionType(voidContext(domain),
      value(true)
    )).toMatchSnapshot();
  });
  it('customer < 42', function() {
    expect(inferExpressionType(voidContext(domain),
      less(
        navigate('customer'),
        value(42)
      )
    )).toMatchSnapshot();
  });
  it('customer <= 42', function() {
    expect(inferExpressionType(voidContext(domain),
      lessEqual(
        navigate('customer'),
        value(42)
      )
    )).toMatchSnapshot();
  });
  it('customer > 42', function() {
    expect(inferExpressionType(voidContext(domain),
      greater(
        navigate('customer'),
        value(42)
      )
    )).toMatchSnapshot();
  });
  it('customer >= 42', function() {
    expect(inferExpressionType(voidContext(domain),
      greaterEqual(
        navigate('customer'),
        value(42)
      )
    )).toMatchSnapshot();
  });
  it('customer and 42', function() {
    expect(inferExpressionType(voidContext(domain),
      and(
        navigate('customer'),
        value(42)
      )
    )).toMatchSnapshot();
  });
  it('customer or 42', function() {
    expect(inferExpressionType(voidContext(domain),
      or(
        navigate('customer'),
        value(42)
      )
    )).toMatchSnapshot();
  });
  it('not customer', function() {
    expect(inferExpressionType(voidContext(domain),
      not(
        navigate('customer'),
      )
    )).toMatchSnapshot();
  });
  it('exists customer', function() {
    expect(inferExpressionType(voidContext(domain),
      exists(
        navigate('customer'),
      )
    )).toMatchSnapshot();
  });
});

test('genQueryName (untyped)', function() {
  let genName = query => genQueryName(query);
  expect(genName(
    navigate('customer')
  )).toBe('customer');
  expect(genName(pipeline(
    navigate('customer')
  ))).toBe('customer');
  expect(genName(pipeline(
    navigate('customer'),
    navigate('name'),
  ))).toBe('customer name');
  expect(genName(pipeline(
    navigate('customer'),
    aggregate('count'),
  ))).toBe('customer count');
  expect(genName(pipeline(
    navigate('customer'),
    aggregate('count', 'name'),
  ))).toBe('customer name count');
});

test('genQueryName (typed)', function() {
  let genName = query => genQueryName(inferQueryType(voidContext(domain), query));
  expect(genName(pipeline(
    navigate('customer')
  ))).toBe('Customer');
  expect(genName(pipeline(
    navigate('customer'),
    navigate('name'),
  ))).toBe('Customer Name');
  expect(genName(pipeline(
    navigate('customer'),
    aggregate('count'),
  ))).toBe('Customer Count');
  expect(genName(pipeline(
    navigate('customer'),
    aggregate('count', 'name'),
  ))).toBe('Customer Name Count');
});

test('genExpressionName', function() {
  expect(genExpressionName(navigate('name'))).toBe(null);
  expect(genExpressionName(value(42))).toBe(null);
  expect(genExpressionName(or(
    lessEqual(navigate('name'), value(42))
  ))).toBe('name');
});

test('inferTypeAtPath', function() {
  let getContextAt = (...path) =>
    inferQueryType(voidContext(domain), pipeline(...path.map(item => navigate(item)))).context;

  expect(inferTypeAtPath(getContextAt(), [])).toEqual({
    name: 'void',
    card: null,
    domain
  });
  expect(inferTypeAtPath(getContextAt(), ['customer'])).toEqual({
    name: 'record',
    card: 'seq',
    entity: 'customer',
    attribute: null,
    domain
  });
  expect(inferTypeAtPath(getContextAt(), ['customer', 'name'])).toEqual({
    name: 'text',
    card: 'seq',
    domain
  });
  expect(inferTypeAtPath(getContextAt('customer'), ['name'])).toEqual({
    name: 'text',
    card: null,
    domain
  });
  expect(inferTypeAtPath(getContextAt('customer', 'name'), [])).toEqual({
    name: 'text',
    card: null,
    domain
  });
});

test('serializeQuery/deserializeQuery', function() {
  let expectIdentity = q =>
    expect(deserializeQuery(serializeQuery(q))).toEqual(q);
  expectIdentity(navigate('name'));
  expectIdentity(pipeline(navigate('name'), navigate('age')));
  expectIdentity(filter(or(lessEqual(navigate('name'), value(42)))));
});
