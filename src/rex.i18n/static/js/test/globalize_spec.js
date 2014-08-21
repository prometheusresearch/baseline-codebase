'use strict';


var GlobalizeWrapper = require('../lib/globalize');

var Globalize = require('globalize');


var MOCK_LOCALE_COMMON = require('json!./mocks/locale_common.json');
var MOCK_LOCALE_EN = require('json!./mocks/locale_en.json');
var MOCK_LOCALE_FR = require('json!./mocks/locale_fr.json');


/* global successfulPromise: true, failedPromise: true */


// Define the common setup/teardown routines for testing with.
function commonSetup() {
  jasmine.Ajax.install();

  jasmine.Ajax.stubRequest('/locale').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_COMMON)
  });

  jasmine.Ajax.stubRequest('/locale/en').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_EN)
  });

  jasmine.Ajax.stubRequest('/locale/fr').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_FR)
  });

  jasmine.Ajax.stubRequest('/locale/notreal').andReturn({
    'status': 404
  });
}

function commonTeardown() {
  jasmine.Ajax.uninstall();
}


describe('retrieve', function () {
  beforeEach(function () {
    commonSetup();
  });

  afterEach(function () {
    commonTeardown();
  });

  it('returns a Globalize instance when given a good URL', function (done) {
    successfulPromise(
      GlobalizeWrapper.retrieve('/locale', 'en'),
      done,
      function (result) {
        expect(result instanceof Globalize).toBe(true);
        expect(jasmine.Ajax.requests.filter('/locale').length).toBe(1);
        expect(jasmine.Ajax.requests.filter('/locale/en').length).toBe(1);
      }
    );
  });

  it('returns a Globalize instance when given a good URL a second time', function (done) {
    successfulPromise(
      GlobalizeWrapper.retrieve('/locale', 'en'),
      done,
      function (result) {
        expect(result instanceof Globalize).toBe(true);
        // No requests should go out because we cached it last time.
        expect(jasmine.Ajax.requests.filter('/locale').length).toBe(0);
        expect(jasmine.Ajax.requests.filter('/locale/en').length).toBe(0);
      }
    );
  });

  it('returns an error when given a bad URL', function (done) {
    failedPromise(
      GlobalizeWrapper.retrieve('/locale', 'notreal'),
      done,
      function (error) {
        expect(error instanceof Error).toBe(true);
        // We already have the common components, so no request should go out
        // for that.
        expect(jasmine.Ajax.requests.filter('/locale').length).toBe(0);
        expect(jasmine.Ajax.requests.filter('/locale/notreal').length).toBe(1);
      }
    );
  });

  it('returns an error when given a bad URL a second time', function (done) {
    failedPromise(
      GlobalizeWrapper.retrieve('/locale', 'notreal'),
      done,
      function (error) {
        expect(error instanceof Error).toBe(true);
        // No request should go out because we remembered it was bad.
        expect(jasmine.Ajax.requests.filter('/locale').length).toBe(0);
        expect(jasmine.Ajax.requests.filter('/locale/notreal').length).toBe(0);
      }
    );
  });

  it('returns an error when given a bad URL and forced', function (done) {
    failedPromise(
      GlobalizeWrapper.retrieve('/locale', 'notreal', true),
      done,
      function (error) {
        expect(error instanceof Error).toBe(true);
        // The request should go out because we forced it to try again.
        expect(jasmine.Ajax.requests.filter('/locale').length).toBe(0);
        expect(jasmine.Ajax.requests.filter('/locale/notreal').length).toBe(1);
      }
    );
  });

});

