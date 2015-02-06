/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var Draggable             = require('../Draggable');
var Hoverable             = require('../Hoverable');
var merge                 = require('../merge');
var StyleUtils            = require('../StyleUtils');
var Icon                  = require('../Icon');
var HBox                  = require('./HBox');
var VBox                  = require('./VBox');
var PersistentStateMixin  = require('../PersistentStateMixin');

var ResizeHandle = React.createClass({
  mixins: [Hoverable],

  style: {
    width: '8px',
    background: 'none',
    boxShadow: StyleUtils.boxShadow(2, 0, 1, 0, '#FAFAFA'),
    justifyContent: 'flex-end'
  },

  styleOnHover: {
    cursor: 'ew-resize',
    boxShadow: StyleUtils.boxShadow(2, 0, 1, 0, '#EEEEEE'),
  },

  styleToggle: {
    padding: 5,
    boxShadow: StyleUtils.boxShadow(2, 0, 1, 0, '#FAFAFA'),
    width: 24,
    height: 24,
    cursor: 'pointer',
    background: 'white',
    color: '#EEE'
  },

  styleToggleOnHover: {
    color: '#000',
    boxShadow: StyleUtils.boxShadow(2, 0, 1, 0, '#EEEEEE'),
  },
  
  render() {
    var {forceHover, resizable, style, styleOnHover, ...props} = this.props;
    var {hover} = this.state;
    hover = hover || forceHover;
    style = merge(
      this.style, style,
      hover && resizable && merge(this.styleOnHover, styleOnHover));
    return (
      <VBox
        {...props}
        {...this.hoverable}
        style={style}>
        <VBox
          style={merge(this.styleToggle, hover && this.styleToggleOnHover)}
          onClick={this.props.onToggleClick}>
          <Icon name="th" />
        </VBox>
      </VBox>
    );
  }
});

var MasterDetail = React.createClass({
  mixins: [PersistentStateMixin],

  persistentStateKeys: {
    masterSize: true,
    detailSize: true
  },

  styleMaster: {
    overflow: 'hidden'
  },
  
  styleDetail: {
    overflow: 'hidden'
  },

  render() {
    var {
      master, detail, resizable, mode,
      ...props
    } = this.props;
    var {masterSize, detailSize, resize} = this.state;
    var showMaster = mode === 'master' || mode === null;
    var showDetail = mode === 'detail' || mode === null;
    return (
      <HBox {...props}>
        {showMaster &&
          <VBox style={this.styleMaster} size={masterSize}>
            {master}
          </VBox>}
        {resizable && showDetail &&
          <Draggable
            Component={ResizeHandle}
            forceHover={resize}
            resizable={showMaster}
            onToggleClick={this._onToggleClick}
            onDragStart={this._onResizeStart}
            onDrag={this._onResize}
            onDragEnd={this._onResizeEnd}
            />}
        {showDetail &&
          <VBox style={this.styleDetail} size={detailSize}>
            {detail}
          </VBox>}
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      childrenMargin: 10,
      size: 1,
      resizable: true,
      mode: null
    };
  },

  getInitialState() {
    return {
      resize: false
    };
  },

  getInitialPersistentState() {
    var masterSize = this.props.masterSize * 100;
    return {
      masterSize,
      detailSize: 100 - masterSize
    };
  },

  _onToggleClick() {
    var {mode, onMode} = this.props;
    if (mode === 'detail') {
      onMode(null);
    } else if (mode === null) {
      onMode('detail');
    }
  },

  _onResizeStart(e) {
    this.setState({resize: true});
    return this.getDOMNode().getBoundingClientRect();
  },

  _onResize(e, box) {
    var detailSize = box.width - e.clientX + box.left;
    var masterSize = box.width - detailSize;
    this.setPersistentState({masterSize, detailSize});
  },

  _onResizeEnd(e, box) {
    this.setState({resize: false});
  },

  _getHandleDOMNode() {
    return this.getDOMNode().childNodes[1];
  }
});

module.exports = MasterDetail;
