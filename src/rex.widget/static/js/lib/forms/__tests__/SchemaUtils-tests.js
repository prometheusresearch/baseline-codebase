/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var SchemaUtils = require('../SchemaUtils');
var {validator} = require('../../_forms/SchemaUtils');
var Validation  = SchemaUtils.Validation;

describe('SchemaUtils', function() {

  describe('generateSchemaFromFields', function() {

    it('generates schema from a single field', function() {
      var fields = [
        {
          type: 'string',
          valueKey: 'a'
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {type : 'string', isRequired: false, format: Validation.string}
        },
        required: []
      });
    });

    it('generates schema from a single field (required field)', function() {
      var fields = [
        {
          type: 'string',
          valueKey: 'a',
          required: true
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {type : 'string', isRequired: true, format: Validation.string}
        },
        required: ['a']
      });
    });

    it('generates schema from multiple fields', function() {
      var fields = [
        {
          type: 'string',
          valueKey: 'a'
        },
        {
          type: 'string',
          valueKey: 'b'
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {type : 'string', isRequired: false, format: Validation.string},
          b: {type : 'string', isRequired: false, format: Validation.string}
        },
        required: []
      });
    });

    it('generates schema from a single nested field', function() {
      var fields = [
        {
          type: 'string',
          valueKey: ['a', 'b']
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: false, format: Validation.string}
            },
            required: []
          }
        },
        required: []
      });
    });

    it('generates schema from a single nested field (required field)', function() {
      var fields = [
        {
          type: 'string',
          valueKey: ['a', 'b'],
          required: true
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: true, format: Validation.string}
            },
            required: ['b']
          }
        },
        required: []
      });
    });

    it('generates schema from multiple nested fields (required fields)', function() {
      var fields = [
        {
          type: 'string',
          valueKey: ['a', 'b'],
          required: true
        },
        {
          type: 'string',
          valueKey: ['a', 'c'],
          required: true
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: true, format: Validation.string},
              c: {type : 'string', isRequired: true, format: Validation.string}
            },
            required: ['b', 'c']
          }
        },
        required: []
      });
    });

    it('generates schema from multiple nested fields (different roots)', function() {
      var fields = [
        {
          type: 'string',
          valueKey: ['a', 'b']
        },
        {
          type: 'string',
          valueKey: ['c', 'd']
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: false, format: Validation.string}
            },
            required: []
          },
          c: {
            type : 'object',
            properties: {
              d: {type : 'string', isRequired: false, format: Validation.string}
            },
            required: []
          }
        },
        required: []
      });
    });

    it('generates schema from a fieldset', function() {
      var fields = [
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['c']
            }
          ]
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              c: {type : 'string', isRequired: false, format: Validation.string}
            },
            isRequired: false,
            required: []
          }
        },
        required: []
      });
    });

    it('generates schema from a fieldset (required fieldset)', function() {
      var fields = [
        {
          type: 'fieldset',
          valueKey: ['a'],
          required: true,
          fields: [
            {
              type: 'string',
              valueKey: ['c']
            }
          ]
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              c: {type : 'string', isRequired: false, format: Validation.string}
            },
            isRequired: true,
            required: []
          }
        },
        required: ['a']
      });
    });

    it('generates schema from a nested field and a fieldset', function() {
      var fields = [
        {
          type: 'string',
          valueKey: ['a', 'b']
        },
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['c']
            }
          ]
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: false, format: Validation.string},
              c: {type : 'string', isRequired: false, format: Validation.string}
            },
            isRequired: false,
            required: []
          }
        },
        required: []
      });
    });

    it('generates schema from a nested field and a fieldset (required)', function() {
      var fields = [
        {
          type: 'string',
          valueKey: ['a', 'b'],
          required: true
        },
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['c'],
              required: true
            }
          ]
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: true, format: Validation.string},
              c: {type : 'string', isRequired: true, format: Validation.string}
            },
            isRequired: false,
            required: ['b', 'c']
          }
        },
        required: []
      });
    });

    it('generates schema from a fieldset and a nested field', function() {
      var fields = [
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['c']
            }
          ]
        },
        {
          type: 'string',
          valueKey: ['a', 'b']
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: false, format: Validation.string},
              c: {type : 'string', isRequired: false, format: Validation.string}
            },
            isRequired: false,
            required: []
          }
        },
        required: []
      });
    });

    it('generates schema from a fieldset and a nested field (required fields)', function() {
      var fields = [
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['c'],
              required: true
            }
          ]
        },
        {
          type: 'string',
          valueKey: ['a', 'b'],
          required: true
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: true, format: Validation.string},
              c: {type : 'string', isRequired: true, format: Validation.string}
            },
            isRequired: false,
            required: ['c', 'b']
          }
        },
        required: []
      });
    });

    it('generates schema from multiple fieldsets', function() {
      var fields = [
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['c']
            }
          ]
        },
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['b']
            }
          ]
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: false, format: Validation.string},
              c: {type : 'string', isRequired: false, format: Validation.string}
            },
            isRequired: false,
            required: []
          }
        },
        required: []
      });
    });

    it('generates schema from multiple fieldsets (required fields)', function() {
      var fields = [
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['c'],
              required: true
            }
          ]
        },
        {
          type: 'fieldset',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['b'],
              required: true
            }
          ]
        }
      ];
      expect(SchemaUtils.generateSchemaFromFields(fields)).toEqual({
        type: 'object',
        properties: {
          a: {
            type : 'object',
            properties: {
              b: {type : 'string', isRequired: true, format: Validation.string},
              c: {type : 'string', isRequired: true, format: Validation.string}
            },
            isRequired: false,
            required: ['c', 'b']
          }
        },
        required: []
      });
    });

  });

  describe('Validation', function() {

    describe('string', function() {

      it('plain node', function() {
        var v = validator({
          type: 'string',
          format: Validation.string
        });
        v('x');
        expect(v.errors).toEqual(null);
        v(42);
        expect(v.errors).toEqual([{field: 'data', message: 'is the wrong type'}]);
      });

      it('with pattern', function() {
        var v = validator({
          type: 'string',
          format: Validation.string,
          formatPattern: '[0-9]+'
        });
        v('x');
        expect(v.errors).toEqual([{ field : 'data', message : 'does not match the pattern' }]);
        v('42');
        expect(v.errors).toEqual(null);
      });

      it('with pattern and error message', function() {
        var v = validator({
          type: 'string',
          format: Validation.string,
          formatPattern: '[0-9]+',
          formatError: 'should be a number'
        });
        v('x');
        expect(v.errors).toEqual([{ field : 'data', message : 'should be a number' }]);
        v('42');
        expect(v.errors).toEqual(null);
      });

    });

  });
});
