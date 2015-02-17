/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var LayeredComponentMixin = require('./LayeredComponentMixin');
var {Box}                 = require('./layout');

var ExpandStyle = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  position: 'fixed'
};

var ModalStyle = {
  self: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    overflow: 'hidden'
  },
  body: {
    overflow: 'auto'
  }
};

var Modal = React.createClass({
  mixins: [LayeredComponentMixin],

  render() {
    return null;
  },

  renderLayer() {
    var {
      open, children, showTitle, title, className,
      width, height, minWidth, minHeight, maxWidth, maxHeight,
      ...props
    } = this.props;
    if (!open || open === 'false') {
      return <noscript />;
    }
    return (
      <div style={{...ExpandStyle, zIndex: 10000}}>
        <Box
          onClick={this.onClose}
          centerHorizontally
          centerVertically
          style={ModalStyle.self}
          className={cx('rw-Modal', className)}>
          <Box
            className="rw-Modal__content"
            style={{
              ...ModalStyle.content,
              width, height,
              minWidth, minHeight,
              maxWidth, maxHeight
            }}
            onScroll={preventDefault}
            onClick={stopPropagation}>
            {showTitle &&
              <div className="rw-Modal__header">
                <button
                  type="button"
                  onClick={this.onClose}
                  className="close"><span aria-hidden="true">×</span><span className="sr-only">Close</span>
                </button>
                <h4 className="rw-Modal__title">
                  {title}
                </h4>
              </div>}
            <div className="rw-Modal__body" style={ModalStyle.body}>
              {children}
            </div>
          </Box>
        </Box>
      </div>
    );
  },

  getDefaultProps() {
    return {showTitle: true};
  },

  onClose() {
    this.props.onOpen(false);
  }
});

function preventDefault(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }
}

function stopPropagation(e) {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
}

module.exports = Modal;
