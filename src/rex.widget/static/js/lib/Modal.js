/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var LayeredComponentMixin = require('./LayeredComponentMixin');
var merge                 = require('./merge');

var expandStyle = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  position: 'fixed'
};

var Shim = React.createClass({

  render() {
    return this.transferPropsTo(
      <div className="rex-widget-Shim" style={merge(expandStyle, this.props.style)}>
        {this.props.children}
      </div>
    );
  }
});

var Modal = React.createClass({
  mixins: [LayeredComponentMixin],

  style: {
  },

  render() {
    return null;
  },

  renderLayer() {
    if (!this.props.open) {
      return <noscript />;
    }
    return (
      <div style={merge(expandStyle, {zIndex: 10000})}>
        <Shim onClick={this.props.onClose} />
        <div className={cx('rex-widget-Modal', this.props.className)} style={this.style}>
          <div className="rex-widget-Modal__content">
            {this.props.showTitle &&
              <div className="rex-widget-Modal__header">
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="close"><span aria-hidden="true">×</span><span className="sr-only">Close</span>
                </button>
                <h4 className="rex-widget-Modal__title">
                  {this.props.title}
                </h4>
              </div>}
            <div className="rex-widget-Modal__body">
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  },

  getDefaultProps() {
    return {showTitle: true};
  }
});

module.exports = Modal;
