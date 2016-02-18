/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert from 'power-assert';
import * as StringUtils from '../StringUtils';

describe('StringUtils', function() {

  describe('makeEscape', function() {

    it('escapes character (,)', function() {
      let escapeComma = StringUtils.makeEscape(',');
      assert(escapeComma('a') === 'a');
      assert(escapeComma('a,b') === 'a\\,b');
      assert(escapeComma('a,b,c') === 'a\\,b\\,c');
    });

    it('escapes character (/)', function() {
      let escapeSlash = StringUtils.makeEscape('/');
      assert(escapeSlash('a') === 'a');
      assert(escapeSlash('a/b') === 'a\\/b');
      assert(escapeSlash('a/b/c') === 'a\\/b\\/c');
    });

  });

  describe('makeUnescape', function() {

    it('unescapes character (,)', function() {
      let unescapeComma = StringUtils.makeUnescape(',');
      assert(unescapeComma('a') === 'a');
      assert(unescapeComma('a\\,b') === 'a,b');
      assert(unescapeComma('a\\,b\\,c') === 'a,b,c');
    });

    it('unescapes character (/)', function() {
      let unescapeSlash = StringUtils.makeUnescape('/');
      assert(unescapeSlash('a') === 'a');
      assert(unescapeSlash('a\\/b') === 'a/b');
      assert(unescapeSlash('a\\/b\\/c') === 'a/b/c');
    });

  });

  describe('idempotence between makeEscape and makeUnescape', function() {

    it('is idempotent (,)', function() {
      let unescapeComma = StringUtils.makeUnescape(',');
      let escapeComma = StringUtils.makeEscape(',');
      let id = (string) => unescapeComma(escapeComma(string));

      assert(id('a') === 'a');
      assert(id('a,b') === 'a,b');
      assert(id(',a,b') === ',a,b');
      assert(id('a,b,') === 'a,b,');
    });

    it('is idempotent (/)', function() {
      let unescapeSlash = StringUtils.makeUnescape('/');
      let escapeSlash = StringUtils.makeEscape('/');
      let id = (string) => unescapeSlash(escapeSlash(string));

      assert(id('a') === 'a');
      assert(id('a/b') === 'a/b');
      assert(id('/a/b') === '/a/b');
      assert(id('a/b/') === 'a/b/');
    });

  });

  describe('makeJoinWith', function() {

    it('joins array with a character (,)', function() {
      let joinWithComma = StringUtils.makeJoinWith(',');
      assert(joinWithComma(['a', 'b']) === 'a,b');
      assert(joinWithComma(['a,b', 'c']) === 'a\\,b,c');
      assert(joinWithComma(['a,b,c', 'c']) === 'a\\,b\\,c,c');
      assert(joinWithComma([',a,b,c', 'c']) === '\\,a\\,b\\,c,c');
      assert(joinWithComma(['a,b,c,', 'c']) === 'a\\,b\\,c\\,,c');
    });

    it('joins array with a character (/)', function() {
      let joinWithSlash = StringUtils.makeJoinWith('/');
      assert(joinWithSlash(['a', 'b']) === 'a/b');
      assert(joinWithSlash(['a/b', 'c']) === 'a\\/b/c');
      assert(joinWithSlash(['a/b/c', 'c']) === 'a\\/b\\/c/c');
      assert(joinWithSlash(['/a/b/c', 'c']) === '\\/a\\/b\\/c/c');
      assert(joinWithSlash(['a/b/c/', 'c']) === 'a\\/b\\/c\\//c');
    });

  });

  describe('makeSplitBy', function() {

    it('splits string into an array by character (,)', function() {
      let splitByComma = StringUtils.makeSplitBy(',');
      assert.deepEqual(splitByComma('a,b'),  ['a', 'b']);
      assert.deepEqual(splitByComma('a,b,c'),  ['a', 'b', 'c']);
      assert.deepEqual(splitByComma('a,b,c,d'),  ['a', 'b', 'c', 'd']);
      assert.deepEqual(splitByComma('a,b,c\\,d'),  ['a', 'b', 'c,d']);
      assert.deepEqual(splitByComma('a,b\\,c,d'),  ['a', 'b,c', 'd']);
      assert.deepEqual(splitByComma('a\\,b,c,d'),  ['a,b', 'c', 'd']);
      assert.deepEqual(splitByComma('\\,a,b,c,d'),  [',a', 'b', 'c', 'd']);
      assert.deepEqual(splitByComma('a,b,c,d\\,'),  ['a', 'b', 'c', 'd,']);
      assert.deepEqual(splitByComma('a,b,c,d,'),  ['a', 'b', 'c', 'd', '']);
      assert.deepEqual(splitByComma(',a,b,c,d'),  ['', 'a', 'b', 'c', 'd']);
    });

    it('splits string into an array by character (/)', function() {
      let splitBySlash = StringUtils.makeSplitBy('/');
      assert.deepEqual(splitBySlash('a/b'),  ['a', 'b']);
      assert.deepEqual(splitBySlash('a/b/c'),  ['a', 'b', 'c']);
      assert.deepEqual(splitBySlash('a/b/c/d'),  ['a', 'b', 'c', 'd']);
      assert.deepEqual(splitBySlash('a/b/c\\/d'),  ['a', 'b', 'c/d']);
      assert.deepEqual(splitBySlash('a/b\\/c/d'),  ['a', 'b/c', 'd']);
      assert.deepEqual(splitBySlash('a\\/b/c/d'),  ['a/b', 'c', 'd']);
      assert.deepEqual(splitBySlash('\\/a/b/c/d'),  ['/a', 'b', 'c', 'd']);
      assert.deepEqual(splitBySlash('a/b/c/d\\/'),  ['a', 'b', 'c', 'd/']);
      assert.deepEqual(splitBySlash('a/b/c/d/'),  ['a', 'b', 'c', 'd', '']);
      assert.deepEqual(splitBySlash('/a/b/c/d'),  ['', 'a', 'b', 'c', 'd']);
    });

  });

  describe('idempotence of makeJoinWith and splitByComma', function() {

    it('is idempotent ->', function() {
      let splitByComma = StringUtils.makeSplitBy(',');
      let joinWithComma = StringUtils.makeJoinWith(',');
      let id = (string) => joinWithComma(splitByComma(string));

      assert(id('a') === 'a');
      assert(id('a,b') === 'a,b');
      assert(id(',a,b') === ',a,b');
      assert(id('a,b,') === 'a,b,');
      assert(id('a,b,c') === 'a,b,c');
    });

    it('is idempotent <-', function() {
      let splitByComma = StringUtils.makeSplitBy(',');
      let joinWithComma = StringUtils.makeJoinWith(',');
      let id = (string) => splitByComma(joinWithComma(string));

      assert.deepEqual(id(['a']),  ['a']);
      assert.deepEqual(id(['a', 'b']),  ['a', 'b'])
      assert.deepEqual(id(['', 'a', 'b']),  ['', 'a', 'b']);
      assert.deepEqual(id(['', 'a', 'b', '']),  ['', 'a', 'b', '']);
      assert.deepEqual(id(['', 'a,b', 'b', '']),  ['', 'a,b', 'b', '']);
    });

  });

});
