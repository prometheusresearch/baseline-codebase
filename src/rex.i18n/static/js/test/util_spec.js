'use strict';


var util = require('../lib/util');


/* global successfulPromise: true, failedPromise: true */


describe('asyncGet', function () {
  beforeEach(function () {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest('/test').andReturn({
      'status': 200,
      'contentType': 'text/plain',
      'responseText': 'hi mom'
    });

    jasmine.Ajax.stubRequest('/doesntexist').andReturn({
      'status': 404
    });

    jasmine.Ajax.stubRequest('/somejson').andReturn({
      'status': 200,
      'contentType': 'application/json',
      'responseText': '{"foo": "bar", "baz": 1}'
    });

    jasmine.Ajax.stubRequest('/badjson').andReturn({
      'status': 200,
      'contentType': 'application/json',
      'responseText': '{"foo" "bar" "baz": 1}'
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('returns a promise', function () {
    var val = util.asyncGet();
    expect(val.then).toBeDefined();
  });

  it('should fail if not given a URL', function (done) {
    failedPromise(
      util.asyncGet(),
      done,
      function (error) {
        expect(error.message).toMatch(/No URL specified/);
      }
    );
  });

  it('should resolve when request was successful', function (done) {
    successfulPromise(
      util.asyncGet({url: '/test'}),
      done,
      function (result) {
        expect(result).toBe('hi mom');
      }
    );
  });

  it('should reject when request failed', function (done) {
    failedPromise(
      util.asyncGet({url: '/doesntexist'}),
      done,
      function (error) {
        expect(error.message).toMatch(/404/);
      }
    );
  });

  it('should return an object when fetching JSON', function (done) {
    successfulPromise(
      util.asyncGet({url: '/somejson'}),
      done,
      function (result) {
        expect(result.foo).toBe('bar');
        expect(result.baz).toBe(1);
      }
    );
  });

  it('should reject when parsing JSON failed', function (done) {
    failedPromise(
      util.asyncGet({url: '/badjson'}),
      done,
      function (error) {
        expect(error).toBeTruthy();
      }
    );
  });
});

