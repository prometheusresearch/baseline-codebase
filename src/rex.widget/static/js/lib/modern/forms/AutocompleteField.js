/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React        = require('react');
var Autocomplete = require('../Autocomplete');
var Field        = require('./Field');

var AutocompleteField = React.createClass({

  render() {
    var {dataSpec, valueAttribute, titleAttribute, style, ...props} = this.props;
    return (
      <Field {...props} data={undefined}>
        <Autocomplete
          style={{resultList: style && style.resultList}}
          dataSpec={dataSpec}
          valueAttribute={valueAttribute}
          titleAttribute={titleAttribute}
          />
      </Field>
    );
  }
});

module.exports = AutocompleteField;

