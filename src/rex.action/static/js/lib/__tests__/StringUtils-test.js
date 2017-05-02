/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as StringUtils from '../StringUtils';

describe('StringUtils', function() {
  describe('makeEscape', function() {
    it('escapes character (,)', function() {
      let escapeComma = StringUtils.makeEscape(',');
      expect(escapeComma('a')).toEqual('a');
      expect(escapeComma('a,b')).toEqual('a\\,b');
      expect(escapeComma('a,b,c')).toEqual('a\\,b\\,c');
    });

    it('escapes character (/)', function() {
      let escapeSlash = StringUtils.makeEscape('/');
      expect(escapeSlash('a')).toEqual('a');
      expect(escapeSlash('a/b')).toEqual('a\\/b');
      expect(escapeSlash('a/b/c')).toEqual('a\\/b\\/c');
    });
  });

  describe('makeUnescape', function() {
    it('unescapes character (,)', function() {
      let unescapeComma = StringUtils.makeUnescape(',');
      expect(unescapeComma('a')).toEqual('a');
      expect(unescapeComma('a\\,b')).toEqual('a,b');
      expect(unescapeComma('a\\,b\\,c')).toEqual('a,b,c');
    });

    it('unescapes character (/)', function() {
      let unescapeSlash = StringUtils.makeUnescape('/');
      expect(unescapeSlash('a')).toEqual('a');
      expect(unescapeSlash('a\\/b')).toEqual('a/b');
      expect(unescapeSlash('a\\/b\\/c')).toEqual('a/b/c');
    });
  });

  describe('idempotence between makeEscape and makeUnescape', function() {
    it('is idempotent (,)', function() {
      let unescapeComma = StringUtils.makeUnescape(',');
      let escapeComma = StringUtils.makeEscape(',');
      let id = string => unescapeComma(escapeComma(string));

      expect(id('a')).toEqual('a');
      expect(id('a,b')).toEqual('a,b');
      expect(id(',a,b')).toEqual(',a,b');
      expect(id('a,b,')).toEqual('a,b,');
    });

    it('is idempotent (/)', function() {
      let unescapeSlash = StringUtils.makeUnescape('/');
      let escapeSlash = StringUtils.makeEscape('/');
      let id = string => unescapeSlash(escapeSlash(string));

      expect(id('a')).toEqual('a');
      expect(id('a/b')).toEqual('a/b');
      expect(id('/a/b')).toEqual('/a/b');
      expect(id('a/b/')).toEqual('a/b/');
    });
  });

  describe('makeJoinWith', function() {
    it('joins array with a character (,)', function() {
      let joinWithComma = StringUtils.makeJoinWith(',');
      expect(joinWithComma(['a', 'b'])).toEqual('a,b');
      expect(joinWithComma(['a,b', 'c'])).toEqual('a\\,b,c');
      expect(joinWithComma(['a,b,c', 'c'])).toEqual('a\\,b\\,c,c');
      expect(joinWithComma([',a,b,c', 'c'])).toEqual('\\,a\\,b\\,c,c');
      expect(joinWithComma(['a,b,c,', 'c'])).toEqual('a\\,b\\,c\\,,c');
    });

    it('joins array with a character (/)', function() {
      let joinWithSlash = StringUtils.makeJoinWith('/');
      expect(joinWithSlash(['a', 'b'])).toEqual('a/b');
      expect(joinWithSlash(['a/b', 'c'])).toEqual('a\\/b/c');
      expect(joinWithSlash(['a/b/c', 'c'])).toEqual('a\\/b\\/c/c');
      expect(joinWithSlash(['/a/b/c', 'c'])).toEqual('\\/a\\/b\\/c/c');
      expect(joinWithSlash(['a/b/c/', 'c'])).toEqual('a\\/b\\/c\\//c');
    });
  });

  describe('makeSplitBy', function() {
    it('splits string into an array by character (,)', function() {
      let splitByComma = StringUtils.makeSplitBy(',');
      expect(splitByComma('a,b')).toEqual(['a', 'b']);
      expect(splitByComma('a,b,c')).toEqual(['a', 'b', 'c']);
      expect(splitByComma('a,b,c,d')).toEqual(['a', 'b', 'c', 'd']);
      expect(splitByComma('a,b,c\\,d')).toEqual(['a', 'b', 'c,d']);
      expect(splitByComma('a,b\\,c,d')).toEqual(['a', 'b,c', 'd']);
      expect(splitByComma('a\\,b,c,d')).toEqual(['a,b', 'c', 'd']);
      expect(splitByComma('\\,a,b,c,d')).toEqual([',a', 'b', 'c', 'd']);
      expect(splitByComma('a,b,c,d\\,')).toEqual(['a', 'b', 'c', 'd,']);
      expect(splitByComma('a,b,c,d,')).toEqual(['a', 'b', 'c', 'd', '']);
      expect(splitByComma(',a,b,c,d')).toEqual(['', 'a', 'b', 'c', 'd']);
    });

    it('splits string into an array by character (/)', function() {
      let splitBySlash = StringUtils.makeSplitBy('/');
      expect(splitBySlash('a/b')).toEqual(['a', 'b']);
      expect(splitBySlash('a/b/c')).toEqual(['a', 'b', 'c']);
      expect(splitBySlash('a/b/c/d')).toEqual(['a', 'b', 'c', 'd']);
      expect(splitBySlash('a/b/c\\/d')).toEqual(['a', 'b', 'c/d']);
      expect(splitBySlash('a/b\\/c/d')).toEqual(['a', 'b/c', 'd']);
      expect(splitBySlash('a\\/b/c/d')).toEqual(['a/b', 'c', 'd']);
      expect(splitBySlash('\\/a/b/c/d')).toEqual(['/a', 'b', 'c', 'd']);
      expect(splitBySlash('a/b/c/d\\/')).toEqual(['a', 'b', 'c', 'd/']);
      expect(splitBySlash('a/b/c/d/')).toEqual(['a', 'b', 'c', 'd', '']);
      expect(splitBySlash('/a/b/c/d')).toEqual(['', 'a', 'b', 'c', 'd']);
    });
  });

  describe('idempotence of makeJoinWith and splitByComma', function() {
    it('is idempotent ->', function() {
      let splitByComma = StringUtils.makeSplitBy(',');
      let joinWithComma = StringUtils.makeJoinWith(',');
      let id = string => joinWithComma(splitByComma(string));

      expect(id('a')).toEqual('a');
      expect(id('a,b')).toEqual('a,b');
      expect(id(',a,b')).toEqual(',a,b');
      expect(id('a,b,')).toEqual('a,b,');
      expect(id('a,b,c')).toEqual('a,b,c');
    });

    it('is idempotent <-', function() {
      let splitByComma = StringUtils.makeSplitBy(',');
      let joinWithComma = StringUtils.makeJoinWith(',');
      let id = string => splitByComma(joinWithComma(string));

      expect(id(['a'])).toEqual(['a']);
      expect(id(['a', 'b'])).toEqual(['a', 'b']);
      expect(id(['', 'a', 'b'])).toEqual(['', 'a', 'b']);
      expect(id(['', 'a', 'b', ''])).toEqual(['', 'a', 'b', '']);
      expect(id(['', 'a,b', 'b', ''])).toEqual(['', 'a,b', 'b', '']);
    });
  });
});
