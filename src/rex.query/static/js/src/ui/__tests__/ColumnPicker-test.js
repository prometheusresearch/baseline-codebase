// @flow

import React from 'react';
import renderer from 'react-test-renderer';

import * as c from '../../model/RexQueryCatalog';
import * as q from '../../model/Query';
import * as qp from '../../model/QueryPointer';
import ColumnPicker from '../ColumnPicker';

import _catalog from '../../model/__tests__/catalog.json';

let catalog: c.Catalog = _catalog;
let domain = c.toDomain(catalog);

describe('<ColumnPicker />', function() {

  function expectRendersWithQuery({query}) {
    let pointer = qp.make(query);
    let component = renderer.create(
      <ColumnPicker
        pointer={pointer}
        />
    );
    expect(component.toJSON()).toMatchSnapshot();
  }

  it('renders: here', function() {
    let query = q.inferType(domain, q.pipeline(q.here));
    expectRendersWithQuery({query});
  });

  it('renders: here:customer', function() {
    let query = q.inferType(domain, q.pipeline(q.here, q.navigate('customer')));
    expectRendersWithQuery({query});
  });

  it('renders: here:customer:select(name)', function() {
    let query = q.inferType(domain, q.pipeline(
      q.here,
      q.navigate('customer'),
      q.select({name: q.pipeline(q.navigate('name'))}),
    ));
    expectRendersWithQuery({query});
  });

});
