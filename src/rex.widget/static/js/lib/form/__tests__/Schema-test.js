/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import * as Schema from '../Schema';
import * as Validation from '../Validation';

describe('Schema', function() {

  describe('fromFields', function() {

    it('generates schema from a single field', function() {
      let fields = [
        {
          type: 'string',
          valueKey: 'a'
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type: 'string',
              isRequired: false,
              hideIf: undefined,
              hideIfList: [],
              format: Validation.string,
              formatError: undefined,
              formatPattern: undefined,
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from a single field (required field)', function() {
      let fields = [
        {
          type: 'string',
          valueKey: 'a',
          required: true
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type: 'string',
              isRequired: true,
              hideIf: undefined,
              hideIfList: [],
              format: Validation.string,
              formatError: undefined,
              formatPattern: undefined,
            }
          },
          required: ['a'],
          hideIfList: [],
        });
    });

    it('generates schema from a single field (hideIf expression)', function() {
      let fields = [
        {
          type: 'string',
          valueKey: 'a',
          required: true,
          hideIf: '$value == 1',
          hideIfList: [],
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type: 'string',
              isRequired: true,
              format: Validation.string,
              formatError: undefined,
              formatPattern: undefined,
              hideIf: '$value == 1',
              hideIfList: [{
                hideIf: '$value == 1',
                keyPathPattern: [],
              }],
            }
          },
          required: ['a'],
          hideIfList: [{
            hideIf: '$value == 1',
            keyPathPattern: ['a'],
          }],
        });
    });

    it('generates schema from multiple fields', function() {
      let fields = [
        {
          type: 'string',
          valueKey: 'a'
        },
        {
          type: 'string',
          valueKey: 'b'
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'string',
              isRequired: false,
              hideIf: undefined,
              hideIfList: [],
              format: Validation.string,
              formatError: undefined,
              formatPattern: undefined,
            },
            b: {
              type : 'string',
              isRequired: false,
              hideIf: undefined,
              hideIfList: [],
              format: Validation.string,
              formatError: undefined,
              formatPattern: undefined,
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from a single nested field', function() {
      let fields = [
        {
          type: 'string',
          hideIf: 'xxx',
          valueKey: ['a', 'b']
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type: 'string',
                  isRequired: false,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: 'xxx',
                  hideIfList: [{
                    hideIf: 'xxx',
                    keyPathPattern: [],
                  }],
                }
              },
              required: [],
              hideIfList: [{
                hideIf: 'xxx',
                keyPathPattern: ['b'],
              }],
            }
          },
          required: [],
          hideIfList: [{
            hideIf: 'xxx',
            keyPathPattern: ['a', 'b'],
          }],
        });
    });

    it('generates schema from a single nested field (with array)', function() {
      let fields = [
        {
          type: 'string',
          hideIf: 'xxx',
          valueKey: ['a', '0', 'b']
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'array',
              items: {
                type: 'object',
                properties: {
                  b: {
                    type: 'string',
                    isRequired: false,
                    format: Validation.string,
                    formatError: undefined,
                    formatPattern: undefined,
                    hideIf: 'xxx',
                    hideIfList: [{
                      hideIf: 'xxx',
                      keyPathPattern: [],
                    }],
                  }
                },
                hideIfList: [{
                  hideIf: 'xxx',
                  keyPathPattern: ['b'],
                }],
                required: [],
              },
              hideIfList: [{
                hideIf: 'xxx',
                keyPathPattern: ['*', 'b'],
              }],
            }
          },
          required: [],
          hideIfList: [{
            hideIf: 'xxx',
            keyPathPattern: ['a', '*', 'b'],
          }],
        });
    });

    it('generates schema from a single nested field (required field)', function() {
      let fields = [
        {
          type: 'string',
          valueKey: ['a', 'b'],
          required: true
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type: 'string',
                  isRequired: true,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              required: ['b'],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from multiple nested fields (required fields)', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type : 'string',
                  isRequired: true,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                },
                c: {
                  type : 'string',
                  isRequired: true,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              required: ['b', 'c'],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from multiple nested fields (hideIf)', function() {
      let fields = [
        {
          type: 'string',
          valueKey: ['a', 'b'],
          hideIf: 'ab',
        },
        {
          type: 'string',
          valueKey: ['a', 'c'],
          hideIf: 'ac',
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type : 'string',
                  isRequired: false,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: 'ab',
                  hideIfList: [{hideIf: 'ab', keyPathPattern: []}],
                },
                c: {
                  type : 'string',
                  isRequired: false,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: 'ac',
                  hideIfList: [{hideIf: 'ac', keyPathPattern: []}],
                }
              },
              required: [],
              hideIfList: [
                {hideIf: 'ab', keyPathPattern: ['b']},
                {hideIf: 'ac', keyPathPattern: ['c']},
              ]
            }
          },
          required: [],
          hideIfList: [
            {hideIf: 'ab', keyPathPattern: ['a', 'b']},
            {hideIf: 'ac', keyPathPattern: ['a', 'c']},
          ]
        });
    });

    it('generates schema from multiple nested fields (different roots)', function() {
      let fields = [
        {
          type: 'string',
          valueKey: ['a', 'b']
        },
        {
          type: 'string',
          valueKey: ['c', 'd']
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type : 'string', isRequired: false, format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              required: [],
              hideIfList: [],
            },
            c: {
              type : 'object',
              properties: {
                d: {
                  type : 'string', isRequired: false, format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              required: [],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from a fieldset', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                c: {
                  type : 'string', isRequired: false, format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              isRequired: false,
              required: [],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from a fieldset (required fieldset)', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                c: {
                  type : 'string', isRequired: false, format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              isRequired: true,
              required: [],
              hideIfList: [],
            }
          },
          required: ['a'],
          hideIfList: [],
        });
    });

    it('generates schema from a list fieldset', function() {
      let fields = [
        {
          type: 'list',
          valueKey: ['a'],
          fields: [
            {
              type: 'string',
              valueKey: ['c'],
              hideIf: 'xxx',
            }
          ]
        }
      ];
      assert.deepEqual(
        Schema.fromFields(fields), {
          hideIfList: [
            {
              hideIf: 'xxx',
              keyPathPattern: ['a', '*', 'c'],
            }
          ],
          properties: {
            a: {
              format: Validation.array,
              hideIf: undefined,
              hideIfList: [
                {
                  hideIf: 'xxx',
                  keyPathPattern: ['*', 'c'],
                }
              ],
              isRequired: false,
              items: {
                hideIfList: [
                  {
                    hideIf: 'xxx',
                    keyPathPattern: ['c'],
                  }
                ],
                properties: {
                  c: {
                    format: Validation.string,
                    formatError: undefined,
                    formatPattern: undefined,
                    hideIf: 'xxx',
                    hideIfList: [
                      {
                        hideIf: 'xxx',
                        keyPathPattern: [],
                      }
                    ],
                    isRequired: false,
                    type: 'string',
                  }
                },
                required: [],
                type: 'object',
              },
              minItems: 0,
              type: 'array',
              uniqueBy: undefined,
              uniqueByError: undefined,
            },
          },
          required: [],
          type: 'object'
        });
    });

    it('generates schema from a nested field and a fieldset', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type : 'string', isRequired: false, format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                },
                c: {
                  type : 'string', isRequired: false, format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              isRequired: false,
              required: [],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from a nested field and a fieldset (required)', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type : 'string', isRequired: true, format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                },
                c: {
                  type : 'string', isRequired: true, format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              isRequired: false,
              required: ['b', 'c'],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from a fieldset and a nested field', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type: 'string',
                  isRequired: false,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                },
                c: {
                  type: 'string',
                  isRequired: false,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              isRequired: false,
              required: [],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from a fieldset and a nested field (required fields)', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type: 'string',
                  isRequired: true,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                },
                c: {
                  type: 'string',
                  isRequired: true,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              isRequired: false,
              required: ['c', 'b'],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from multiple fieldsets', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type: 'string',
                  isRequired: false,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                },
                c: {
                  type: 'string',
                  isRequired: false,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              isRequired: false,
              required: [],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

    it('generates schema from multiple fieldsets (required fields)', function() {
      let fields = [
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
      assert.deepEqual(
        Schema.fromFields(fields), {
          type: 'object',
          properties: {
            a: {
              type : 'object',
              properties: {
                b: {
                  type: 'string',
                  isRequired: true,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                },
                c: {
                  type: 'string',
                  isRequired: true,
                  format: Validation.string,
                  formatError: undefined,
                  formatPattern: undefined,
                  hideIf: undefined,
                  hideIfList: [],
                }
              },
              isRequired: false,
              required: ['c', 'b'],
              hideIfList: [],
            }
          },
          required: [],
          hideIfList: [],
        });
    });

  });

});
