/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react/lib/ReactTestUtils';
import Link from '../Link';
import {mockMountPoints, unmockMountPoints} from '../resolveURL';

function render(element) {
  let renderer = TestUtils.createRenderer();
  renderer.render(element);
  return renderer.getRenderOutput();
}

describe('Link', function() {

  before(function() {
    mockMountPoints({
      pkg: '/pkgpath'
    });
  });

  after(function() {
    unmockMountPoints();
  });

  it('renders an anchor element with an absolute URL', function() {
    let element = render(<Link href="http://rexdb.com" />);
    assert(element.type === 'a');
    assert(element.props.href === 'http://rexdb.com');
  });

  it('renders an anchor element with a relative path', function() {
    let element = render(<Link href="./" />);
    assert(element.type === 'a');
    assert(element.props.href === './');
  });

  it('renders an anchor element with a path with params', function() {
    let element = render(<Link href="./" params={{a: 'b'}} />);
    assert(element.type === 'a');
    assert(element.props.href === './?a=b');
  });

  it('renders an anchor element with an absolute path', function() {
    let element = render(<Link href="/path" />);
    assert(element.type === 'a');
    assert(element.props.href === '/path');
  });

  it('renders an anchor element with a package spec', function() {
    let element = render(<Link href="pkg:/path" />);
    assert(element.type === 'a');
    assert(element.props.href === '/pkgpath/path');
  });

  it('throws if it cannot resolve URL from a package spec', function() {
    assert.throws(
      () => render(<Link href="pkgx:/path" />),
      'Invariant violation: Unable to resolve mount point for package pkgx for URL /path');
  });
});
