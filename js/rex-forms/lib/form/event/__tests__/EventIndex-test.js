/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import assert from 'assert';
import size from 'lodash/size';
import {atom} from 'derivable';
import * as Schema from '../../../instrument/schema';
import * as EventIndex from '../EventIndex';


let MOCK_ENV = {
  i18n: {
    gettext: (msg) => { return msg; }
  }
};


describe('rex-froms/form/event', function() {

  describe('EventIndex', function() {

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
        let cat = EventIndex.createEventIndex(form);

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

        let cat = EventIndex.createEventIndex(form);

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
        let cat = EventIndex.createEventIndex(form);

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
        assert(cat.field.disable['matrix_target.row1.col1'].eventList.length === 5);
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


