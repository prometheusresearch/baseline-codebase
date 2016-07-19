/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import REXL from 'rex-expression';
import assert from 'assert';
import {fromInstrument} from '../../../instrument/schema';
import resolve from '../resolve';


let MOCK_ENV = {
  i18n: {
    gettext: (msg) => { return msg; }
  }
};


describe('rex-forms/form/event', function() {

  describe('resolve(identifier, schema, value, parameters)', function() {

    let instrument = {
      record: [
        {id: 'simpleField', type: 'text'},
        {id: 'simpleFieldInteger', type: 'integer'},
        {id: 'simpleFieldFloat', type: 'float'},
        {id: 'simpleFieldBool', type: 'boolean'},
        {id: 'simpleFieldDate', type: 'date'},
        {id: 'simpleFieldDateTime', type: 'dateTime'},
        {id: 'simpleFieldTime', type: 'time'},
        {
          id: 'simpleFieldEnum',
          type: {
            base: 'enumeration',
            enumerations: {
              red: {description: 'Red'},
              blue: {description: 'Blue'},
            }
          }
        },
        {
          id: 'simpleFieldEnumSet',
          type: {
            base: 'enumerationSet',
            enumerations: {
              red: {description: 'Red'},
              blue: {description: 'Blue'},
            }
          }
        },
        {
          id: 'recordList',
          type: {
            base: 'recordList',
            record: [
              {id: 'item', type: 'text'}
            ]
          }
        },
        {
          id: 'matrix',
          type: {
            base: 'matrix',
            rows: [
              {id: 'row'}
            ],
            columns: [
              {id: 'col', type: 'text'}
            ]
          }
        },
      ]
    };

    let schema = fromInstrument(instrument, MOCK_ENV);

    it('resolves from simple form values (empty value)', function() {
      let ret = resolve('simpleField', schema, {});
      assert(ret.getTypeClass() === REXL.Untyped);
      assert(ret.value === null);
    });

    it('resolves from simple form values', function() {
      let ret = resolve('simpleField', schema, {simpleField: {value: 'ok'}});
      assert(ret.getTypeClass() === REXL.String);
      assert(ret.value === 'ok');
    });

    it('resolves from simple form values (integer)', function() {
      let ret = resolve('simpleFieldInteger', schema, {simpleFieldInteger: {value: 42}});
      assert(ret.getTypeClass() === REXL.Number);
      assert(ret.value === 42);
    });

    it('resolves from simple form values (float)', function() {
      let ret = resolve('simpleFieldFloat', schema, {simpleFieldFloat: {value: 42.4}});
      assert(ret.getTypeClass() === REXL.Number);
      assert(ret.value === 42.4);
    });

    it('resolves from simple form values (enumeration)', function() {
      let ret = resolve('simpleFieldEnum', schema, {simpleFieldEnum: {value: 'red'}});
      assert(ret.getTypeClass() === REXL.String);
      assert(ret.value === 'red');
    });

    it('resolves from simple form values (enumerationSet)', function() {
      let ret = resolve('simpleFieldEnumSet', schema, {simpleFieldEnumSet: {value: ['red']}});
      assert(ret.getTypeClass() === REXL.List);
      assert(ret.value.length === 1);
      assert(ret.value[0].value === 'red');
    });

    it('resolves from simple form values (boolean)', function() {
      let ret = resolve('simpleFieldBool', schema, {simpleFieldBool: {value: true}});
      assert(ret.getTypeClass() === REXL.Boolean);
      assert(ret.value === true);
    });

    it('resolves from simple form values (date)', function() {
      let ret = resolve('simpleFieldDate', schema, {simpleFieldDate: {value: 'ok'}});
      assert(ret.getTypeClass() === REXL.Date);
      assert(ret.value === 'ok');
    });

    it('resolves from simple form values (time)', function() {
      let ret = resolve('simpleFieldTime', schema, {simpleFieldTime: {value: 'ok'}});
      assert(ret.getTypeClass() === REXL.Time);
      assert(ret.value === 'ok');
    });

    it('resolves from simple form values (dateTime)', function() {
      let ret = resolve('simpleFieldDateTime', schema, {simpleFieldDateTime: {value: 'ok'}});
      assert(ret.getTypeClass() === REXL.DateTime);
      assert(ret.value === 'ok');
    });

    it('resolves from recordList form values', function() {
      let ret = resolve(
        ['recordList', 'item'],
        schema,
        {
          recordList: {
            value: [{item: {value: 'x'}}, {item: {value: 'y'}}]
          }
        }
      );
      assert(ret.getTypeClass() === REXL.List);
      assert(ret.value.length === 2);
      assert(ret.value[0].value === 'x');
      assert(ret.value[1].value === 'y');
    });

    it('resolves from matrix form values', function() {
      let ret = resolve(
        ['matrix', 'row', 'col'],
        schema,
        {matrix: {value: {row: {col: {value: 'ok'}}}}}
      );
      assert(ret.getTypeClass() === REXL.String);
      assert(ret.value === 'ok');
    });

    it('resolves from parameters', function() {
      let ret = resolve(
        ['param'],
        schema,
        {},
        {param: 'ok'}
      );
      assert(ret.getTypeClass() === REXL.String);
      assert(ret.value === 'ok');
    });

  });

});
