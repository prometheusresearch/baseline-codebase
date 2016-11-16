import * as q from '../Query';

import {
  here, navigate, filter, limit,
  select, aggregate, pipeline, def,
  value, group,
} from '../Query';
import {
  voidType, numberType, textType,
  entityType, recordType, invalidType,
  seqType, optType,
  createDomain
} from '../Type';
import {stripDomain} from './util';

describe('inferType()', function() {

  let domain = createDomain({
    aggregate: {
      count: {
        makeType: type => numberType(type.domain)
      }
    },
    entity: {
      sample: domain => ({
        attribute: {
          title: {
            type: textType(domain),
          }
        }
      }),
      individual: domain => ({
        attribute: {
          name: {
            type: textType(domain),
          },
          age: {
            type: optType(textType(domain)),
          },
          sample: {
            type: seqType(entityType(domain, 'sample')),
          }
        }
      })
    }
  });

  let individual = navigate('individual');
  let sample = navigate('sample');
  let name = navigate('name');
  let age = navigate('age');
  let title = navigate('title');
  let count = aggregate('count');

  it('infers type of query atoms', function() {
    expect(q.inferType(domain, here).context.type)
      .toEqual(
        voidType(domain)
      );
    expect(q.inferType(domain, individual).context.type)
      .toEqual(
        seqType(entityType(domain, 'individual'))
      );
    expect(q.inferType(domain, navigate('unknown')).context.type)
      .toEqual(
        invalidType(domain)
      );
    expect(q.inferType(domain, filter(value(true))).context.type)
      .toEqual(voidType(domain));
    expect(q.inferType(domain, limit(10)).context.type)
      .toEqual(voidType(domain));
    expect(q.inferType(domain, select({a: individual})).context.type)
      .toEqual(recordType(domain, {
        a: {type: seqType(entityType(domain, 'individual'))}
      }));
    expect(q.inferType(domain, select({a: navigate('unknown')})).context.type)
      .toEqual(recordType(domain, {
        a: {type: invalidType(domain)}
      }));
    expect(q.inferType(domain, aggregate('count')).context.type)
      .toEqual(
        invalidType(domain)
      );
  });

  it('fails on navigate to unknown attribute', function() {
    expect(q.inferType(domain, pipeline(
      individual,
      navigate('b'),
    )).context.type).toEqual(
      invalidType(domain)
    );
  });

  it('fails on navigate to unknown record field', function() {
    expect(q.inferType(domain, pipeline(
      select({a: individual}),
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
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('here.individual', function() {
    let query = pipeline(
      here,
      individual,
    );
    expect(q.inferType(domain, query).context.type).toEqual(
      seqType(entityType(domain, 'individual'))
    );
  });

  it('here.individual.here', function() {
    let query = pipeline(
      here,
      individual,
      here,
    );
    expect(q.inferType(domain, query).context.type).toEqual(
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
    expect(q.inferType(domain, query).context.type).toEqual(
      seqType(textType(domain))
    );
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

  it('individual:define(newname := name):select(a := newname, b := name)', function() {
    let query = pipeline(
      individual,
      def('newname', pipeline(name)),
      select({
        a: pipeline(q.navigate('newname')),
        b: pipeline(name)
      })
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:select(a := age)', function() {
    let query = pipeline(
      individual,
      select({
        a: age,
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
      def('nickname', pipeline(navigate('name'))),
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:define(nickname := name).nickname', function() {
    let query = pipeline(
      individual,
      def('nickname', pipeline(navigate('name'))),
      navigate('nickname'),
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
  });

  it('individual:define(nickname := name):select(nickname)', function() {
    let query = pipeline(
      individual,
      def('nickname', pipeline(navigate('name'))),
      select({nickname: pipeline(navigate('nickname'))}),
    );
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
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
    expect(stripDomain(q.inferType(domain, query))).toMatchSnapshot();
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
    expect(q.inferType(domain, query)).toMatchSnapshot();
  });

  it('individual:group(age))', function() {
    let query = pipeline(
      individual,
      group(['age']),
    );
    expect(q.inferType(domain, query)).toMatchSnapshot();
  });

  it('individual:group(age):name)', function() {
    let query = pipeline(
      individual,
      group(['age']),
      individual,
      name,
    );
    expect(q.inferType(domain, query)).toMatchSnapshot();
  });

  it('individual:group(age):select(name))', function() {
    let query = pipeline(
      individual,
      group(['age']),
      select({name: pipeline(individual, name)}),
    );
    expect(q.inferType(domain, query)).toMatchSnapshot();
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
    expect(q.inferType(domain, query)).toMatchSnapshot();
  });

});
