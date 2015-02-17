/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var FormContextMixin  = require('./FormContextMixin');
var {StoredFile}      = require('./File');

var FileDownloadField = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {download, ...props} = this.props;
    var value = this.getValue();
    if (!value) {
      return null;
    }
    return (
      <StoredFile
        {...props}
        file={{name: value}}
        download={download}
        ownerRecordID={this._getOwnerRecordID()}
        />
    );
  },

  _getOwnerRecordID() {
    var valueKey = this.context && this.context.valueKey ?
      this.context.valueKey.concat(this.props.valueKey) :
      [];
    valueKey.pop();
    var record = this.props.value.value.getIn(valueKey);
    return record ? record.get('id') : undefined;
  }
});

function filename(file) {
  var result = unquote(file.name);
  return result.replace(/.*\/([^\/]+)$/i, '$1');
}

function unquote(str) {
  return str.replace(/^'/, '').replace(/'$/, '');
}

module.exports = FileDownloadField;
