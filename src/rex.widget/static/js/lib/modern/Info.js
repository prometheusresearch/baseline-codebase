/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react');
var {VBox}          = require('./Layout');
var Preloader       = require('./Preloader');
var FileDownload    = require('./FileDownload');

var InfoFieldStyle = {
  label: {
    fontWeight: 'bold',
    color: '#888888',
    marginRight: 5
  }
};

var InfoField = React.createClass({

  render() {
    var {label, children} = this.props;
    return (
      <div>
        {label && <span style={InfoFieldStyle.label}>{label}: </span>}
        {children}
      </div>
    );
  }
});

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
          <InfoField key={field.valueKey} label={field.label}>
            {this.renderField(field, data.data[field.valueKey], data.data)}
          </InfoField>)}
      </VBox>
    );
  },

  renderField(field, value, data) {
    switch (field.type) {
      case 'file':
        return (
          <FileDownload
            download={field.params.download}
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

module.exports = Info;
