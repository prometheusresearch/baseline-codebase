/**
 * @copyright 2015, Prometheus Research, LLC
 */

let React               = require('react');
let {VBox}              = require('./Layout');
let Preloader           = require('./Preloader');
let FileDownload        = require('./FileDownload');
let ReadOnlyField       = require('./forms/ReadOnlyField');
let DeprecatedComponent = require('./DeprecatedComponent');

/**
 * @public
 * @deprecated
 */
let Info = React.createClass({

  propTypes: {
    fields: React.PropTypes.array,
    data: React.PropTypes.object,
  },

  render() {
    let {fields, data, ...props} = this.props;
    if (data.loading) {
      return <Preloader />;
    }
    if (!data.data) {
      return null;
    }
    return (
      <VBox {...props}>
        {fields.map(field => {
          let value = this.renderField(
            field,
            getByKeyPath(data.data, field.valueKey),
            data.data
          );
          return (
            <ReadOnlyField
              key={field.valueKey}
              label={field.label}
              formValue={{value}}
              style={{self: {marginTop: 5, marginBottom: 5}}}
              />
          );
        })}
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
      return <span>{renderValue(value)}</span>;
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
  for (let i = 0; i < keyPath.length; i++) {
    if (obj == null) {
      return obj;
    }
    obj = obj[keyPath[i]];
  }
  return obj;
}

module.exports = DeprecatedComponent(
  'Use <RexWidget.Forms.ConfigurableEntityForm readOnly /> instead',
  'RexWidget.Info')(Info);
