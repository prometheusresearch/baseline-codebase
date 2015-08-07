/**
 * @copyright 2015, Prometheus Research, LLC
 */

import resolveURL from '../resolveURL';

describe('resolveURL', function() {

  beforeAll(function() {
    window.__MOUNT_POINTS__ = {
      pkg: 'http://0.0.0.0/pkg'
    };
  });

  afterAll(function() {
    delete window.__MOUNT_POINTS__;
  });

  it('does not process absolute URLs', function() {
    expect(resolveURL('http://prometheusresearch.com')).toBe('http://prometheusresearch.com');
    expect(resolveURL('https://prometheusresearch.com')).toBe('https://prometheusresearch.com');
  });

  it('returns paths as is', function() {
    expect(resolveURL('/')).toBe('/');
    expect(resolveURL('/path')).toBe('/path');
  });

  it('resolves URL specs', function() {
    expect(resolveURL('pkg:/')).toBe('http://0.0.0.0/pkg/');
    expect(resolveURL('pkg:/path')).toBe('http://0.0.0.0/pkg/path');
  });

  it('fails if it cannot resolve URL spec', function() {
    expect(function() {
      resolveURL('x:/path')
    }).toThrowError('Invariant violation: Unable to resolve mount point for package x for URL /path');
  });

});
