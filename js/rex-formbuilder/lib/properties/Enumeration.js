/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms-old');
var {Map, OrderedMap} = require('immutable');

var {RE_ENUMERATION_ID, RE_HOTKEY} = require('../constants');
var AudioSource = require('./AudioSource');
var LocalizedText = require('./LocalizedText');
var _ = require('../i18n').gettext;


class Enumeration extends ReactForms.schema.MappingNode {
  static create(props) {
    /*eslint new-cap:0 */

    props = props || {};

    var children = {
      id: ReactForms.schema.Scalar({
        label: _('ID'),
        required: true,
        validate: function (node, value) {
          if (!RE_ENUMERATION_ID.test(value)) {
            return new Error(
              _('Not a valid format for an enumeration identifier.')
            );
          }
        }
      }),

      text: LocalizedText.create({
        label: _('Label'),
        required: true
      })
    };

    if (!props.simple) {
      children.hotkey = ReactForms.schema.Scalar({
        label: _('Hotkey'),
        required: false,
        validate: function (node, value) {
          if (!RE_HOTKEY.test(value)) {
            return new Error(
              _('Hotkeys can only be single numeric digits.')
            );
          }
        }
      });

      children.help = LocalizedText.create({
        label: _('Help Text'),
        required: false
      });

      children.audio = AudioSource.create({
        label: _('Audio File URLs'),
        required: false
      });
    }

    props.children = OrderedMap(children);

    delete props.label;

    return new this(Map(props));
  }
}


module.exports = Enumeration;

