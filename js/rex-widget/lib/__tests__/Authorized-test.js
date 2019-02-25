/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';
import React from 'react';
import * as TestUtils from '../../testutils';

import {delay} from '../../lang';
import Authorized from '../Authorized';

describe('<Authorized />', function() {

  let originalFetch;

  function stubFetch(returns) {
    let payload = Promise.resolve(returns);
    let response = Promise.resolve({
      status: 200,
      json() {
        return payload;
      }
    });
    let stub = global.fetch = Sinon.stub().returns(response);
    return stub;
  }

  beforeEach(function() {
    originalFetch = global.fetch;
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  it('renders children when check succeeds', async function() {
    let root;
    let fetch = stubFetch({authorized: true});
    let renderer = TestUtils.createRenderer();

    renderer.render(
      <Authorized access="pkg:/path" fallback={<div>fallback</div>}>
        <div>OK</div>
      </Authorized>
    );

    root = renderer.element;
    assert(root.props.children === 'fallback');

    renderer.instance.componentDidMount();

    await delay();
    root = renderer.element;

    assert(root.props.children === 'OK');
  });

  it('renders fallback when check does not succeed', async function() {
    let root;
    let fetch = stubFetch({authorized: false});
    let renderer = TestUtils.createRenderer();

    renderer.render(
      <Authorized access="pkg:/path2" fallback={<div>fallback</div>}>
        <div>OK</div>
      </Authorized>
    );

    root = renderer.element;
    assert(root.props.children === 'fallback');

    renderer.instance.componentDidMount();

    await delay();
    root = renderer.element;

    assert(root.props.children === 'fallback');
  });
});
