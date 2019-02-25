/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import Jed from 'jed';

import {expect, enableFetchMocking, disableFetchMocking} from './tools';
import {ENGLISH} from './translations';

import * as JedWrapper from '../lib/jed';


describe('DEFAULT', function () {
  it('exists', function () {
    expect(JedWrapper.DEFAULT).to.exist;
  });

  it('is a Jed instance', function () {
    expect(JedWrapper.DEFAULT instanceof Jed).to.equal(true);
  });
});


describe('retrieve()', function () {
  describe('when given a good URL', function () {
    beforeEach(function () {
      enableFetchMocking({
        '/translations/en': {
          status: 200,
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify(ENGLISH)
        }
      });
    });

    afterEach(function() {
      disableFetchMocking();
    });

    it('returns a Jed instance', function () {
      return expect(
        JedWrapper.retrieve('/translations', 'en')
      ).to.eventually.be.instanceof(Jed);
    });

    it('returns a non-DEFAULT Jed instance', function () {
      return expect(
        JedWrapper.retrieve('/translations', 'en')
      ).to.eventually.not.equal(JedWrapper.DEFAULT);
    });
  });

  describe('when given a bad URL', function () {
    beforeEach(function () {
      enableFetchMocking();
    });

    afterEach(function() {
      disableFetchMocking();
    });

    it('returns a DEFAULT Jed instance', function () {
      return expect(
        JedWrapper.retrieve('/translations', 'fr')
      ).to.eventually.equal(JedWrapper.DEFAULT);
    });

    it('returns a DEFAULT Jed instance, even when retried', function () {
      return expect(
        JedWrapper.retrieve('/translations', 'fr')
      ).to.eventually.equal(JedWrapper.DEFAULT);
    });

    it('returns a DEFAULT Jed instance, even when forced', function () {
      return expect(
        JedWrapper.retrieve('/translations', 'fr', true)
      ).to.eventually.equal(JedWrapper.DEFAULT);
    });
  });

});

