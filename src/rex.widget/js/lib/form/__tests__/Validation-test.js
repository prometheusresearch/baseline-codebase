/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import moment from 'moment';
import * as Validation from '../Validation';
import {Schema as RFSchema} from 'react-forms';

describe('Validation', function() {

  describe('string', function() {

    it('plain node', function() {
      let schema = {
        type: 'string',
        format: Validation.string
      };
      let validate = RFSchema.Schema(schema);
      assert.deepEqual(
        validate('x'),
        []
      );
      assert.deepEqual(
        validate(42),
        [{field: 'data', message: 'is the wrong type', schema}]
      );
    });

    it('with pattern', function() {
      let schema = {
        type: 'string',
        format: Validation.string,
        formatPattern: '[0-9]+'
      };
      let validate = RFSchema.Schema(schema);
      assert.deepEqual(
        validate('x'),
        [{ field : 'data', message : 'does not match the pattern', schema }]
      );
      assert.deepEqual(
        validate('42'),
        []
      );
    });

    it('with pattern and error message', function() {
      let schema = {
        type: 'string',
        format: Validation.string,
        formatPattern: '[0-9]+',
        formatError: 'should be a number',
      };
      let validate = RFSchema.Schema(schema);
      assert.deepEqual(
        validate('x'),
        [{ field : 'data', message : 'should be a number', schema }]
      );
      assert.deepEqual(
        validate('42'),
        []
      );
    });

  });

  describe('datetime', function() {

    it('validates', function() {
      let schema = {
        type: 'string',
        format: Validation.datetime,
        datetimeFormat: 'YYYY-mm-DD:HH',
      };
      let validate = RFSchema.Schema(schema);
      assert.deepEqual(
        validate('x'),
        [{ field : 'data', message : 'should be in YYYY-mm-DD:HH format', schema }]
      );
      assert.deepEqual(
        validate('2012-12-12 12:12:12'),
        []
      );
    });

  });

  describe('date', function() {

    it('validates', function() {
      let schema = {
        type: 'string',
        format: Validation.date,
        datetimeFormat: 'YYYY-mm-DD',
      };
      let validate = RFSchema.Schema(schema);
      assert.deepEqual(
        validate('x'),
        [{ field : 'data', message : 'should be in YYYY-mm-DD format', schema }]
      );
      assert.deepEqual(
        validate('2012-12-12'),
        []
      );
    });

    it('validates with maxDate', function() {
      let schema = {
        type: 'string',
        format: Validation.date,
        datetimeFormat: 'YYYY-mm-DD',
        maxDate: moment('2013-12-12'),
      };
      let validate = RFSchema.Schema(schema);
      assert.deepEqual(
        validate('2011-12-12'),
        []
      );
      assert(validate('2014-12-12')[0].message === 'should not be after 2013-00-12');
    });

    it('validates with minDate', function() {
      let schema = {
        type: 'string',
        format: Validation.date,
        datetimeFormat: 'YYYY-mm-DD',
        minDate: moment('2013-12-12'),
      };
      let validate = RFSchema.Schema(schema);
      assert.deepEqual(
        validate('2014-12-12'),
        []
      );
      assert(validate('2011-12-12')[0].message === 'should not be before 2013-00-12');
    });

  });

  describe('array', function() {

    it('validates', function() {
      let schema = {
        type: 'array',
        format: Validation.array,
        uniqueBy: 'x',
      };
      let validate = RFSchema.Schema(schema);
      assert.deepEqual(
        validate([{x: 1}, {x: 2}]),
        []
      );
      assert(validate([{x: 1}, {x: 1}])[0].message === '"x" field is not unique');
    });

  });

});

