/**
 * @copyright 2015, Prometheus Research, LLC
 */

import 'core-js/modules/es6.promise';
import fetchJSON from '../fetchJSON';

describe('fetchJSON', function() {

  let origFetch = window.fetch;

  afterEach(function() {
    if (window.fetch !== origFetch) {
      window.fetch = origFetch;
    }
  });

  function mockFetch(response) {
    window.fetch = function fetchMock(url, options) {
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
    fetchJSON('/path')
      .then(function(data) {
        expect(data).toBe('ok');
        done();
      })
      .catch(done);
  });

});
