/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React     = require('react');
var {VBox}    = require('./Layout');
var Preloader = require('./Preloader');

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
        <span>{children}</span>
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
            {data.data[field.valueKey]}
          </InfoField>)}
      </VBox>
    );
  }
});

module.exports = Info;
