import * as q from '../Query';

import {
  navigate, filter, limit,
  select, aggregate, pipeline, def
} from '../Query';
import {
  voidType, numberType, textType,
  entityType, recordType,
  seqType, optType
} from '../Type';

function stripDomain(query) {
  return q.map(query, query => {
    return {
      ...query,
      context: query.context ? {type: query.context.type} : null
    };
  });
}

describe('inferType()', function() {

  let domain = {
    aggregate: {
      count: {
        makeType: _ => numberType
      }
    },
    entity: {
      sample: {
        attribute: {
          title: {
            type: textType,
          }
        }
      },
      individual: {
        attribute: {
          name: {
            type: textType,
          },
          sample: {
            type: seqType(entityType('sample')),
          }
        }
      }
    }
  };

  let individual = navigate('individual');
  let sample = navigate('sample');
  let name = navigate('name');
  let title = navigate('title');
  let count = aggregate('count');

  it('infers type of query atoms', function() {
    expect(q.inferType(domain, individual).context.type)
      .toEqual(
        seqType(entityType('individual'))
      );
    expect(q.inferType(domain, navigate('unknown')).context.type)
      .toEqual(null);
    expect(q.inferType(domain, filter(individual)).context.type)
      .toEqual(voidType);
    expect(q.inferType(domain, limit(10)).context.type)
      .toEqual(voidType);
    expect(q.inferType(domain, select({a: individual})).context.type)
      .toEqual(recordType({
        a: seqType(entityType('individual'))
      }));
    expect(q.inferType(domain, select({a: navigate('unknown')})).context.type)
      .toEqual(recordType({
        a: null
      }));
    expect(q.inferType(domain, aggregate('count')).context.type)
      .toEqual(null);
  });

  it('fails on navigate to unknown attribute', function() {
    expect(q.inferType(domain, pipeline(
      individual,
      navigate('b'),
    )).context.type).toEqual(
      null
    );
  });

  it('fails on navigate to unknown record field', function() {
    expect(q.inferType(domain, pipeline(
      select({a: individual}),
      navigate('b'),
    )).context.type).toEqual(
      null
    );
  });

  it('individual.name', function() {
    let query = pipeline(
      individual,
      name
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual.name:count()', function() {
    let query = pipeline(
      individual,
      name,
      count
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });


  it('individual.sample', function() {
    let query = pipeline(
      individual,
      sample,
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual.sample.title', function() {
    let query = pipeline(
      individual,
      sample,
      title,
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:select(a := name, b := name)', function() {
    let query = pipeline(
      individual,
      select({
        a: name,
        b: name
      })
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:select(a := name, s := sample)', function() {
    let query = pipeline(
      individual,
      select({
        a: name,
        s: sample,
      })
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:select(a := name, s := sample:count())', function() {
    let query = pipeline(
      individual,
      select({
        a: name,
        s: pipeline(sample, count)
      })
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:select(a := name, s := sample.title)', function() {
    let query = pipeline(
      individual,
      select({
        a: name,
        s: pipeline(sample, title)
      })
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:select(a := name, b := name).a', function() {
    let query = pipeline(
      individual,
      select({a: name, b: name}),
      navigate('a'),
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:unknown() : fails on unknown aggregate', function() {
    let query = pipeline(
      individual,
      aggregate('unknown')
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:define(nickname := name)', function() {
    let query = pipeline(
      individual,
      def('nickname', navigate('name')),
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:define(nickname := name).nickname', function() {
    let query = pipeline(
      individual,
      def('nickname', navigate('name')),
      navigate('nickname'),
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

});
