/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                                from 'react';
import TestUtils                            from 'react/lib/ReactTestUtils';
import Link                                 from '../Link';
import {mockMountPoints, unmockMountPoints} from '../resolveURL';

function render(element) {
  let renderer = TestUtils.createRenderer();
  renderer.render(element);
  return renderer.getRenderOutput();
}

describe('Link', function() {

  beforeAll(function() {
    mockMountPoints({
      pkg: '/pkgpath'
    });
  });

  afterAll(function() {
    unmockMountPoints();
  });

  it('renders an anchor element with an absolute URL', function() {
    let element = render(<Link href="http://rexdb.com" />);
    expect(element.type).toBe('a');
    expect(element.props.href).toBe('http://rexdb.com');
  });

  it('renders an anchor element with a relative path', function() {
    let element = render(<Link href="./" />);
    expect(element.type).toBe('a');
    expect(element.props.href).toBe('./');
  });

  it('renders an anchor element with an absolute path', function() {
    let element = render(<Link href="/path" />);
    expect(element.type).toBe('a');
    expect(element.props.href).toBe('/path');
  });

  it('renders an anchor element with a package spec', function() {
    let element = render(<Link href="pkg:/path" />);
    expect(element.type).toBe('a');
    expect(element.props.href).toBe('/pkgpath/path');
  });

  it('throws if it cannot resolve URL from a package spec', function() {
    expect(() => render(<Link href="pkgx:/path" />))
      .toThrowError('Invariant violation: Unable to resolve mount point for package pkgx for URL /path');
  });
});
