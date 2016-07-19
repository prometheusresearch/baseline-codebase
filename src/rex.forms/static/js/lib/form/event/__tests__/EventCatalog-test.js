/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import assert from 'assert';
import size from 'lodash/size';
import {atom} from 'derivable';
import * as Schema from '../../../instrument/schema';
import * as EventCatalog from '../EventCatalog';


let MOCK_ENV = {
  i18n: {
    gettext: (msg) => { return msg; }
  }
};


describe('rex-froms/form/event', function() {

  describe('EventCatalog', function() {

    describe('events for simple questions', function() {
      let instrument = {
        types: {
          action_enum: {
            base: 'enumeration',
            enumerations: {
              hidden: null,
              disabled: null,
              failed: null,
            }
          }
        },
        record: [
          {
            id: 'single',
            type: 'action_enum',
          },
          {
            id: 'single_target',
            type: 'text',
          }
        ]
      };

      let form = {
        pages: [
          {
            id: '1',
            elements: [
              {
                type: 'question',
                options: {
                  fieldId: 'single',
                  events: [
                    {
                      trigger: "single=='hidden'",
                      action: 'hide',
                      targets: ['single_target'],
                    },
                    {
                      trigger: "single=='disabled'",
                      action: 'disable',
                      targets: ['single_target'],
                    },
                    {
                      trigger: "single=='failed'",
                      action: 'fail',
                      targets: ['single_target'],
                      options: {
                        text: {en: 'This has been forcefully failed'},
                      }
                    }
                  ]
                }
              },
              {
                type: 'question',
                options: {
                  fieldId: 'single_target',
                }
              }
            ]
          }
        ]
      };

      let schema = Schema.fromInstrument(instrument, MOCK_ENV);

      it('discovers the events from form', function() {
        let cat = EventCatalog.create(form);

        assert(size(cat.tag.fail) === 0);
        assert(size(cat.tag.disable) === 0);
        assert(size(cat.tag.hide) === 0);
        assert(size(cat.tag.hideEnumeration) === 0);

        assert(size(cat.page.fail) === 0);
        assert(size(cat.page.disable) === 0);
        assert(size(cat.page.hide) === 0);
        assert(size(cat.page.hideEnumeration) === 0);


        assert(size(cat.field.fail) === 1);
        assert(cat.field.fail.single_target);
        assert(cat.field.fail.single_target.eventList.length === 1);

        assert(size(cat.field.disable) === 1);
        assert(cat.field.disable.single_target);
        assert(cat.field.disable.single_target.eventList.length === 1);

        assert(size(cat.field.hide) === 1);
        assert(cat.field.hide.single_target);
        assert(cat.field.hide.single_target.eventList.length === 1);

        assert(size(cat.field.hideEnumeration) === 0);

      });

      it('computes event values and reacts on changes', function() {
        let cat = EventCatalog.create(form);
        let value = atom({});
        let bound = EventCatalog.bind(cat, schema, value);

        assert(size(bound.tag.fail) === 0);
        assert(size(bound.tag.disable) === 0);
        assert(size(bound.tag.hide) === 0);
        assert(size(bound.tag.hideEnumeration) === 0);

        assert(size(bound.page.fail) === 0);
        assert(size(bound.page.disable) === 0);
        assert(size(bound.page.hide) === 0);
        assert(size(bound.page.hideEnumeration) === 0);


        assert(size(bound.field.fail) === 1);
        assert(bound.field.fail.single_target);

        assert(size(bound.field.disable) === 1);
        assert(bound.field.disable.single_target);
        assert(bound.field.disable.single_target.computation.get() === false);

        assert(size(bound.field.hide) === 1);
        assert(bound.field.hide.single_target);
        assert(bound.field.hide.single_target.computation.get() === false);

        assert(size(bound.field.hideEnumeration) === 0);
      });

      it('reacts on changes and recomputes', function() {
        let cat = EventCatalog.create(form);
        let value = atom({});
        let bound = EventCatalog.bind(cat, schema, value);

        let effects = [];

        bound.field.disable.single_target.computation.react(disable => {
          effects.push({disable});
        }, {skipFirst: true});

        bound.field.hide.single_target.computation.react(hide => {
          effects.push({hide});
        }, {skipFirst: true});

        assert(effects.length === 0);

        value.set({single: {value: 'failed'}});
        assert(bound.field.hide.single_target.computation.get() === false);
        assert(bound.field.disable.single_target.computation.get() === false);

        assert(effects.length === 0);

        value.set({single: {value: 'disabled'}});
        assert(bound.field.hide.single_target.computation.get() === false);
        assert(bound.field.disable.single_target.computation.get() === true);

        assert(effects.length === 1);
        assert.deepEqual(effects[0], {disable: true});

        value.set({single: {value: 'hidden'}});
        assert(bound.field.hide.single_target.computation.get() === true);
        assert(bound.field.disable.single_target.computation.get() === false);

        assert(effects.length === 3);
        assert.deepEqual(effects[0], {disable: true});
        assert.deepEqual(effects[1], {disable: false});
        assert.deepEqual(effects[2], {hide: true});
      });
    });

    describe('events for recordList questions', function() {

      let instrument = {
        types: {
          action_enum: {
            base: 'enumeration',
            enumerations: {
              hidden: null,
              disabled: null,
              failed: null,
            }
          },
          basic_enum: {
            base: 'enumeration',
            enumerations: {
              red: null,
              blue: null,
              green: null,
            }
          }
        },
        record: [
          {
            id: 'recordlist_subfield',
            type: 'action_enum',
          },
          {
            id: 'recordlist_target',
            type: {
              base: 'recordList',
              record: [
                { id: 'subfield1',
                  type: 'integer' },
                { id: 'subfield2',
                  type: 'text' },
                { id: 'subfield3',
                  type: 'basic_enum' },
              ]
            }
          }
        ]
      };

      let form = {
        pages: [
          {
            id: '1',
            elements: [
              {
                type: 'question',
                options: {
                  fieldId: 'recordlist_subfield',
                  events: [
                    {
                      trigger: "recordlist_subfield=='hidden'",
                      action: 'hide',
                      targets: ['recordlist_target.subfield1'],
                    },
                    {
                      trigger: "recordlist_subfield=='disabled'",
                      action: 'disable',
                      targets: ['recordlist_target.subfield1'],
                    },
                    {
                      trigger: "recordlist_subfield=='failed'",
                      action: 'fail',
                      targets: ['recordlist_target.subfield1'],
                    }
                  ]
                }
              },
              {
                type: 'question',
                options: {
                  fieldId: 'recordlist_target',
                  questions: [
                    {
                      fieldId: 'subfield1',
                      events: [
                        {
                          trigger: 'subfield1>5',
                          action: 'disable',
                          targets: ['subfield2'],
                        },
                      ],
                    },
                    {
                      fieldId: 'subfield2',
                    },
                    {
                      fieldId: 'subfield3',
                    }
                  ],
                }
              }
            ]
          }
        ]
      };

      let schema = Schema.fromInstrument(instrument, MOCK_ENV);

      it('discovers events by traversing form', function() {

        let cat = EventCatalog.create(form);

        assert(size(cat.tag.fail) === 0);
        assert(size(cat.tag.disable) === 0);
        assert(size(cat.tag.hide) === 0);
        assert(size(cat.tag.hideEnumeration) === 0);

        assert(size(cat.page.fail) === 0);
        assert(size(cat.page.disable) === 0);
        assert(size(cat.page.hide) === 0);
        assert(size(cat.page.hideEnumeration) === 0);

        assert(size(cat.field.fail) === 1);
        assert(cat.field.fail['recordlist_target.subfield1']);
        assert(cat.field.fail['recordlist_target.subfield1'].eventList.length === 1);


        assert(size(cat.field.disable) === 2);
        assert(cat.field.disable['recordlist_target.subfield1']);
        assert(cat.field.disable['recordlist_target.subfield1'].eventList.length === 1);
        assert(cat.field.disable['recordlist_target.subfield2']);
        assert(cat.field.disable['recordlist_target.subfield2'].eventList.length === 1);

        assert(size(cat.field.hide) === 1);
        assert(cat.field.hide['recordlist_target.subfield1']);
        assert(cat.field.hide['recordlist_target.subfield1'].eventList.length === 1);

        assert(size(cat.field.hideEnumeration) === 0);
      });

      it('computes event values', function() {

        let cat = EventCatalog.create(form);
        let value = atom({});
        let bound = EventCatalog.bind(cat, schema, value);

        assert(size(bound.tag.fail) === 0);
        assert(size(bound.tag.disable) === 0);
        assert(size(bound.tag.hide) === 0);
        assert(size(bound.tag.hideEnumeration) === 0);

        assert(size(bound.page.fail) === 0);
        assert(size(bound.page.disable) === 0);
        assert(size(bound.page.hide) === 0);
        assert(size(bound.page.hideEnumeration) === 0);

        assert(size(bound.field.fail) === 1);
        assert(bound.field.fail['recordlist_target.subfield1']);

        assert(size(bound.field.disable) === 2);
        assert(bound.field.disable['recordlist_target.subfield1']);
        assert(bound.field.disable['recordlist_target.subfield2']);

        assert(size(bound.field.hide) === 1);
        assert(bound.field.hide['recordlist_target.subfield1']);

        assert(size(bound.field.hideEnumeration) === 0);
      });

      it('reacts on value changes', function() {

        let cat = EventCatalog.create(form);
        let value = atom({});
        let bound = EventCatalog.bind(cat, schema, value);
        let effects = [];

        bound.field.disable['recordlist_target.subfield1'].computation.react(disable => {
          effects.push({target: 'recordlist_target.subfield1', disable});
        }, {skipFirst: true});

        bound.field.disable['recordlist_target.subfield2'].computation.react(disable => {
          effects.push({target: 'recordlist_target.subfield1', disable});
        }, {skipFirst: true});

        bound.field.hide['recordlist_target.subfield1'].computation.react(hide => {
          effects.push({target: 'recordlist_target.subfield1', hide});
        }, {skipFirst: true});

        assert(effects.length === 0);


        value.set({recordlist_subfield: {value: 'hidden'}});
        assert(bound.field.hide['recordlist_target.subfield1'].computation.get() === true);

        assert(effects.length === 1);
        assert.deepEqual(effects[0], {hide: true, target: 'recordlist_target.subfield1'});

        value.set({recordlist_subfield: {value: 'disabled'}});
        assert(bound.field.hide['recordlist_target.subfield1'].computation.get() === false);
        assert(bound.field.disable['recordlist_target.subfield1'].computation.get() === true);

        assert(effects.length === 3);
        assert.deepEqual(effects[0], {hide: true, target: 'recordlist_target.subfield1'});
        assert.deepEqual(effects[1], {disable: true, target: 'recordlist_target.subfield1'});
        assert.deepEqual(effects[2], {hide: false, target: 'recordlist_target.subfield1'});

        value.set({recordlist_subfield: {value: 'failed'}});
        assert(bound.field.hide['recordlist_target.subfield1'].computation.get() === false);
        assert(bound.field.disable['recordlist_target.subfield1'].computation.get() === false);

        assert(effects.length === 4);
        assert.deepEqual(effects[0], {hide: true, target: 'recordlist_target.subfield1'});
        assert.deepEqual(effects[1], {disable: true, target: 'recordlist_target.subfield1'});
        assert.deepEqual(effects[2], {hide: false, target: 'recordlist_target.subfield1'});
        assert.deepEqual(effects[3], {disable: false, target: 'recordlist_target.subfield1'});

      });

    });

    describe('events for matrix questions', function() {

      let form = {
        'pages': [
          {
            'id': 'page4',
            'elements': [
              {
                'type': 'question',
                'options': {
                  'fieldId': 'matrix_cell',
                  'enumerations': [
                    {
                      'id': 'hidden',
                    },
                    {
                      'id': 'disabled',
                    },
                    {
                      'id': 'failed',
                    }
                  ],
                  'events': [
                    {
                      'trigger': "matrix_cell=='hidden'",
                      'action': 'hide',
                      'targets': [
                        'matrix_target.row1.col1'
                      ]
                    },
                    {
                      'trigger': "matrix_cell=='disabled'",
                      'action': 'disable',
                      'targets': [
                        'matrix_target.row1.col1'
                      ]
                    },
                    {
                      'trigger': "matrix_cell=='failed'",
                      'action': 'fail',
                      'targets': [
                        'matrix_target.row1.col1'
                      ],
                      'options': {
                        'text': {
                          'en': 'This has been forcefully failed.'
                        }
                      }
                    }
                  ]
                }
              },
              {
                'type': 'question',
                'options': {
                  'fieldId': 'matrix_target',
                  'rows': [
                    {
                      'id': 'row1',
                    },
                    {
                      'id': 'row2',
                    }
                  ],
                  'questions': [
                    {
                      'fieldId': 'col1',
                      'text': {
                        'en': 'Column 1'
                      },
                      'events': [
                        {
                          'trigger': "matrix_target.row1.col2=='foo'|matrix_target.row2.col2=='foo'",
                          'action': 'disable'
                        }
                      ]
                    },
                    {
                      'fieldId': 'col2',
                      'events': [
                        {
                          'trigger': "!(matrix_target.row1.col2=='hello'|matrix_target.row2.col2=='hello')",
                          'action': 'hide',
                          'targets': [
                            'hello'
                          ]
                        }
                      ]
                    }
                  ]
                }
              },
              {
                'type': 'text',
                'options': {
                  'text': {
                    'en': 'Hello to you too!'
                  }
                },
                'tags': [
                  'hello'
                ]
              }
            ]
          },
        ]
      };

      it('discovers the events from form', function() {
        let cat = EventCatalog.create(form);

        assert(size(cat.tag.fail) === 0);
        assert(size(cat.tag.disable) === 0);

        assert(size(cat.tag.hide) === 1);
        assert(cat.tag.hide.hello);

        assert(size(cat.tag.hideEnumeration) === 0);

        assert(size(cat.page.fail) === 0);
        assert(size(cat.page.disable) === 0);
        assert(size(cat.page.hide) === 0);
        assert(size(cat.page.hideEnumeration) === 0);

        assert(size(cat.field.fail) === 1);
        assert(cat.field.fail['matrix_target.row1.col1']);
        assert(cat.field.fail['matrix_target.row1.col1'].eventList.length === 1);

        assert(size(cat.field.disable) === 2);
        assert(cat.field.disable['matrix_target.row1.col1']);
        assert(cat.field.disable['matrix_target.row1.col1'].eventList.length === 1);
        assert(cat.field.disable['matrix_target.row2.col1']);
        assert(cat.field.disable['matrix_target.row2.col1'].eventList.length === 2);

        assert(size(cat.field.hide) === 1);
        assert(cat.field.hide['matrix_target.row1.col1']);
        assert(cat.field.hide['matrix_target.row1.col1'].eventList.length === 1);

        assert(size(cat.field.hideEnumeration) === 0);

      });
    });

  });

});


