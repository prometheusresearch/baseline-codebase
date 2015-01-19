/**
 * @copyright 2015, Prometheus Research, LLC
 */

var React             = require('react/addons');
var cx                = React.addons.classSet;
var FieldBase         = require('./FieldBase');

var IntegerField = React.createClass({

  render() {
    var {className, ...props} = this.props;
    var input = <input type="number" />;
    return (
      <FieldBase
        {...props}
        className={cx('rw-IntegerField', className)}
        input={input}
        />
    );
  }
});

module.exports = IntegerField;
