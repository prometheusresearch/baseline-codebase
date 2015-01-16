/**
 * @copyright Prometheus Research, LLC 2014
 */

var React             = require('react/addons');
var cx                = React.addons.classSet;
var Checkbox          = require('react-forms/lib/Checkbox');
var FieldBase         = require('./FieldBase');

var CheckboxField = React.createClass({

  render() {
    var {className, ...props} = this.props;
    var input = (
      <Checkbox
        className="rw-CheckboxField__checkbox"
        style={{marginTop: 11}}
        />
    );
    return (
      <FieldBase
        {...props}
        className={cx('rw-CheckboxField', className)}
        input={input}
        />
    );
  }
});

module.exports = CheckboxField;
