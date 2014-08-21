'use strict';


var JedWrapper = require('../lib/jed');

var Jed = require('jed');


var MOCK_EN = require('json!./mocks/tx_en.json');
var MOCK_FR = require('json!./mocks/tx_fr.json');


/* global successfulPromise: true */


// Define the common setup/teardown routines for testing with.
function commonSetup() {
  jasmine.Ajax.install();

  jasmine.Ajax.stubRequest('/translations/en').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_EN)
  });

  jasmine.Ajax.stubRequest('/translations/fr').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_FR)
  });

  jasmine.Ajax.stubRequest('/translations/notreal').andReturn({
    'status': 404,
  });
}

function commonTeardown() {
  jasmine.Ajax.uninstall();
}


describe('DEFAULT', function () {
  it('exists', function () {
    expect(JedWrapper.DEFAULT).toBeDefined();
  });

  it('is a Jed instance', function () {
    expect(JedWrapper.DEFAULT instanceof Jed).toBe(true);
  });
});


describe('retrieve', function () {
  beforeEach(function () {
    commonSetup();
  });

  afterEach(function () {
    commonTeardown();
  });

  it('returns a Jed instance when given a good URL', function (done) {
    successfulPromise(
      JedWrapper.retrieve('/translations', 'en'),
      done,
      function (result) {
        expect(result instanceof Jed).toBe(true);
        expect(result).not.toBe(JedWrapper.DEFAULT);
        expect(jasmine.Ajax.requests.filter('/translations/en').length).toBe(1);
      }
    );
  });

  it('returns a Jed instance when given a good URL a second time', function (done) {
    successfulPromise(
      JedWrapper.retrieve('/translations', 'en'),
      done,
      function (result) {
        expect(result instanceof Jed).toBe(true);
        expect(result).not.toBe(JedWrapper.DEFAULT);
        // No request should go out because we cached it last time.
        expect(jasmine.Ajax.requests.filter('/translations/en').length).toBe(0);
      }
    );
  });

  it('returns a default Jed instance when given a bad URL', function (done) {
    successfulPromise(
      JedWrapper.retrieve('/translations', 'notreal'),
      done,
      function (result) {
        expect(result instanceof Jed).toBe(true);
        expect(result).toBe(JedWrapper.DEFAULT);
        expect(jasmine.Ajax.requests.filter('/translations/notreal').length).toBe(1);
      }
    );
  });

  it('returns a default Jed instance when given a bad URL a second time', function (done) {
    successfulPromise(
      JedWrapper.retrieve('/translations', 'notreal'),
      done,
      function (result) {
        expect(result instanceof Jed).toBe(true);
        expect(result).toBe(JedWrapper.DEFAULT);
        // No request should go out because we remembered it was bad.
        expect(jasmine.Ajax.requests.filter('/translations/notreal').length).toBe(0);
      }
    );
  });

  it('returns a default Jed instance when given a bad URL and forced', function (done) {
    successfulPromise(
      JedWrapper.retrieve('/translations', 'notreal', true),
      done,
      function (result) {
        expect(result instanceof Jed).toBe(true);
        expect(result).toBe(JedWrapper.DEFAULT);
        // The request should go out because we forced it to try again.
        expect(jasmine.Ajax.requests.filter('/translations/notreal').length).toBe(1);
      }
    );
  });
  
});

