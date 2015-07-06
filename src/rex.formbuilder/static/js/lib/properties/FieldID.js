/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var ReactForms = require('react-forms');
var {Map} = require('immutable');

var _ = require('../i18n').gettext;


var RE_IDENTIFIER = /^[a-z](?:[a-z0-9]|[_-](?![_-]))*[a-z0-9]$/;


function ensureUniqueAcrossConfig(ElementType, node, value) {
  var {DraftSetStore} = require('../stores');
  var existing = DraftSetStore.findElement(node.ELEMENT);

  var matches = existing.container.filter((element) => {
    return (element instanceof ElementType)
        && (element.id === value)
        && (element.EID !== node.ELEMENT.EID);
  });

  if (matches.length > 0) {
    return new Error(_(
      'This identifier is already in use.'
    ));
  }
}


class FieldID extends ReactForms.schema.ScalarNode {
  static create(props) {
    props = props || {};

    if (props.uniqueAcrossElementType) {
      props.validate = ensureUniqueAcrossConfig.bind(
        null,
        props.uniqueAcrossElementType
      );
    }

    /*eslint new-cap:0 */
    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    if (!RE_IDENTIFIER.test(value)) {
      return new Error(_('Not a valid format for a field identifier.'));
    }
  }
}


module.exports = FieldID;

