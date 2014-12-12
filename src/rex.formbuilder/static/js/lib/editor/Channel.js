/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react/addons');
var cx          = React.addons.classSet;
var ReactForms  = require('react-forms');

var Channel = React.createClass({

  render() {
    var {value, className, ...props} = this.props;
    return (
      <div {...props} className={cx("rfb-Channel", className)}>
        <ReactForms.Element
          className="rfb-Channel__defaultLocalization"
          value={value.get('defaultLocalization')}
          />
        <ReactForms.Element
          className="rfb-Channel__title"
          value={value.get('title')}
          />
        <ReactForms.Element
          className="rfb-Channels__pages"
          value={value.get('pages')}
          />
      </div>
    );
  }
});

module.exports = Channel;
