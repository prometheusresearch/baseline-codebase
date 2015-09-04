/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map, OrderedMap} = require('immutable');

var AudioSource = require('./AudioSource');
var Bool = require('./Bool');
var LocalizedText = require('./LocalizedText');
var _ = require('../i18n').gettext;


var RE_IDENTIFIER =
  /^(?:[a-z0-9]{1,2}|[a-z0-9](?:[a-z0-9]|[_-](?![_-]))+[a-z0-9])$/;


class Row extends ReactForms.schema.MappingNode {
  static create(props) {
    /*eslint new-cap:0 */

    props = props || {};

    var children = {
      id: ReactForms.schema.Scalar({
        label: _('ID'),
        required: true,
        validate: function (node, value) {
          if (!RE_IDENTIFIER.test(value)) {
            return new Error(
              _('Not a valid format for a row identifier.')
            );
          }
        }
      }),

      text: LocalizedText.create({
        label: _('Label'),
        required: true
      }),

      help: LocalizedText.create({
        label: _('Help Text'),
        required: false
      }),

      audio: AudioSource.create({
        label: _('Audio File URLs'),
        required: false
      }),

      required: Bool.create({
        label: _('Required')
      })
    };
    props.children = OrderedMap(children);

    delete props.label;

    return new this(Map(props));
  }
}


module.exports = Row;

