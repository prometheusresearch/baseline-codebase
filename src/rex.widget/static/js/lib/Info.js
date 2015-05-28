/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react');
var {VBox}          = require('./Layout');
var Preloader       = require('./Preloader');
var FileDownload    = require('./FileDownload');
var ReadOnlyField   = require('./forms/ReadOnlyField');

var Info = React.createClass({

  render() {
    var {fields, data, ...props} = this.props;
    if (data.loading) {
      return <Preloader />;
    }
    if (!data.data) {
      return null;
    }
    return (
      <VBox {...props}>
        {fields.map(field =>
          <ReadOnlyField
            key={field.valueKey}
            label={field.label}
            formValue={{value: this.renderField(field, getByKeyPath(data.data, field.valueKey), data.data)}}
            style={{self: {marginTop: 5, marginBottom: 5}}}
            />)}
      </VBox>
    );
  },

  renderField(field, value, data) {
    switch (field.type) {
      case 'file':
        return (
          <FileDownload
            download={field.download}
            ownerRecordID={data.id}
            file={value}
            />
        );
      default:
        return <span>{renderValue(value)}</span>
    }
  }
});

function renderValue(value) {
  if (value == null) {
    return value;
  }
  return String(value);
}

function getByKeyPath(obj, keyPath) {
  if (!Array.isArray(keyPath)) {
    keyPath = [keyPath];
  }
  for (var i = 0; i < keyPath.length; i++) {
    if (obj == null) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}

module.exports = Info;
