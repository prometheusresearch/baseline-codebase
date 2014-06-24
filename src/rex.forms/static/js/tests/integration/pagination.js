/**
 * @jsx React.DOM
 */
'use strict';

var assert = require('assert');
var TestUtils = require('react').addons.TestUtils;
var RexForm = require('../../');
var merge = require('../../lib/utils').merge;

describe('pagination integration tests', function() {

  var INSTRUMENT = {
    "id": "urn:instrument",
    "version": "1.0",
    "title": "title",
    "record": [
      {
        "id": "q_number1",
        "type": "integer"
      },
      {
        "id": "q_text1",
        "type": "text"
      },
      {
        "id": "q_number2",
        "type": "integer"
      },
      {
        "id": "q_text2",
        "type": "text"
      },
      {
        "id": "q_number3",
        "type": "integer"
      },
      {
        "id": "q_text3",
        "type": "text"
      }
    ]
  };

  var FORM = {
    "instrument": {
      "id": "urn:instrument",
      "version": "1.0"
    },
    "defaultLocalization": "en",
    "pages": [
      {
        "id": "page1",
        "elements": [
          {
            "type": "question",
            "options": {
              "fieldId": "q_number1",
              "text": {"en": "Enter Number"}
            }
          },
          {
            "type": "question",
            "options": {
              "fieldId": "q_text1",
              "text": {"en": "Enter text"},
            }
          }
        ]
      },
      {
        "id": "page2",
        "elements": [
          {
            "type": "question",
            "options": {
              "fieldId": "q_number2",
              "text": {"en": "Enter Number"}
            }
          },
          {
            "type": "question",
            "options": {
              "fieldId": "q_text2",
              "text": {"en": "Enter text"},
            }
          }
        ]
      },
      {
        "id": "page3",
        "elements": [
          {
            "type": "question",
            "options": {
              "fieldId": "q_number3",
              "text": {"en": "Enter Number"}
            }
          },
          {
            "type": "question",
            "options": {
              "fieldId": "q_text3",
              "text": {"en": "Enter text"},
            }
          }
        ]
      }
    ]
  };

  it('renders first page initially');
  it('renders passed as a "pageId" prop');
  it('disallows moving onto page past invalid page');
  it('allows moving to page before invalid page');
  it('attempt to move past invalid page forces rendering validation errors');

});
