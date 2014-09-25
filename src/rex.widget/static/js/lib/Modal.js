/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react');
var cx                    = require('react/lib/cx');
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
      <div className="rw-Shim" style={merge(expandStyle, this.props.style)}>
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
        <div className={cx('rw-Modal', this.props.className)} style={this.style}>
          <div className="rw-Modal__content">
            {this.props.showTitle &&
              <div className="rw-Modal__header">
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="close"><span aria-hidden="true">×</span><span className="sr-only">Close</span>
                </button>
                <h4 className="rw-Modal__title">
                  {this.props.title}
                </h4>
              </div>}
            <div className="rw-Modal__body">
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
