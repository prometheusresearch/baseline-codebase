/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react/addons');
var PropTypes = React.PropTypes;
var cx        = React.addons.classSet;

var Panel = React.createClass({

  propTypes: {
    title: PropTypes.string,
    headerToolbar: PropTypes.renderable,
    footerToolbar: PropTypes.renderable,
    children: PropTypes.renderable
  },

  render: function() {
    return (
      <div className={cx('rex-widget-Panel', this.props.className)}>
        <div className="rex-widget-Panel__header">
          <div className="rex-widget-Panel__title">
            {this.props.title}
          </div>
          <div className="rex-widget-Panel__headerToolbar">
            {this.props.headerToolbar}
          </div>
        </div>
        <div className="rex-widget-Panel__children">
          {this.props.children}
        </div>
        <div className="rex-widget-Panel__footer">
          <div className="rex-widget-Panel__footerToolbar">
            {this.props.footerToolbar}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Panel;
