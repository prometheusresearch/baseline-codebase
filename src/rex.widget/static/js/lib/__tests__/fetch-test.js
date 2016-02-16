/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import 'core-js/modules/es6.promise';

import {fetch} from '../fetch';

describe('fetch', function() {

  let origFetch = global.fetch;

  afterEach(function() {
    if (global.fetch !== origFetch) {
      global.fetch = origFetch;
    }
  });

  function mockFetch(response) {
    global.fetch = function fetchMock(url, options) {
      let promise = new Promise(function(resolve, reject) {
        resolve(response);
      });
      return promise;
    }
  }

  it('parses JSON', function(done) {
    mockFetch({
      status: 200,
      json() { return 'ok'; }
    });
    fetch('/path')
      .then(function(data) {
        assert(data === 'ok');
        done();
      })
      .catch(done);
  });

});
