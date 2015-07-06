/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                 = require('react');
var cx                    = require('classnames');
var LayeredComponentMixin = require('./LayeredComponentMixin');
var {VBox}                = require('./Layout');
var Cell                  = require('./Cell');
var valueOf               = require('./valueOf');

var ExpandStyle = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  position: 'fixed'
};

var ModalStyle = {
  self: {
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    overflow: 'hidden'
  },
  content: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    borderRadius: '2px',
    boxShadow: '0 3px 9px rgba(0, 0, 0, 0.5)',
    backgroundClip: 'padding-box',
    outline: 0
  },
  header: {
    padding: '15px',
    borderBottom: '1px solid #e5e5e5',
    minHeight: '16.42857143px',
    whiteSpace: 'nowrap'
  },
  title: {
    margin: 0,
    lineHeight: '1.42857143',
    marginRight: '35px'
  },
  body: {
    overflow: 'auto',
    position: 'relative',
    padding: '15px'
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
    open = valueOf(open);
    if (!open || open === 'false') {
      return <noscript />;
    }
    return (
      <div style={{...ExpandStyle, zIndex: 10000}}>
        <VBox
          onClick={this.onClose}
          centerHorizontally
          centerVertically
          size={1}
          style={ModalStyle.self}>
          <VBox
            style={{
              ...ModalStyle.content,
              width, height,
              minWidth, minHeight,
              maxWidth, maxHeight
            }}
            onScroll={preventDefault}
            onClick={stopPropagation}>
            {showTitle &&
              <div style={ModalStyle.header}>
                <button
                  type="button"
                  onClick={this.onClose}
                  className="close">
                  <span aria-hidden="true">×</span>
                </button>
                <h4 style={ModalStyle.title}>
                  {title}
                </h4>
              </div>}
            <div style={{...ModalStyle.body, height: this.props.forceHeight ? '100%' : undefined}}>
              {children}
            </div>
          </VBox>
        </VBox>
      </div>
    );
  },

  getDefaultProps() {
    return {showTitle: true};
  },

  componentWillMount() {
    if (Cell.isCell(this.props.open) && this.props.onClose) {
      console.warning(
        '<Modal /> component received both onClose prop while open prop passed a cell,' +
        ' onClose prop is ignored in this case as <Modal /> state can be controlled via a cell'
      );
    }
  },

  onClose() {
    if (Cell.isCell(this.props.open)) {
      this.props.open.update(false);
    } else {
      this.props.onClose();
    }
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
