/**
 * Sortable repeating fieldset.
 *
 * @jsx React.DOM
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var ReactForms        = require('react-forms');
var Draggable         = require('./Draggable');
var SyntheticScroller = require('./SyntheticScroller');
var emptyFunction     = require('./emptyFunction');

var SortableItem = React.createClass({

  render() {
    var {sorting, shouldRenderRemoveButton, value} = this.props;
    var className = cx(
      'rfb-SortableRepeatingFieldset__item',
      this.props.className
    );
    var noRemoveButton = !shouldRenderRemoveButton({value});
    return (
      <Draggable
        onDragStart={this.onSortStart}
        onDrag={this.props.onSort}
        onDragEnd={this.props.onSortEnd}
        onMouseMove={sorting !== null && this.onMouseMove}
        className={className}>
        {sorting && sorting.index === this.props.index ?
          <div className="rfb-SortableRepeatingFieldset__placeholder" /> :
          <div>
            <div ref="handle" className="rfb-SortableRepeatingFieldset__handle" />
            <ReactForms.RepeatingFieldset.Item
              noRemoveButton={noRemoveButton}
              onRemove={this.props.onRemove}>
              {this.props.children}
            </ReactForms.RepeatingFieldset.Item>
          </div>}
      </Draggable>
    );
  },

  getDefaultProps() {
    return {shouldRenderRemoveButton: emptyFunction.thatReturnsTrue};
  },

  onSortStart(e) {
    if (e.target !== this.refs.handle.getDOMNode()) {
      return null;
    }
    var {index} = this.props;
    var {width, height} = this.getDOMNode().getBoundingClientRect();
    this.props.onSortStart(e, {index, width, height});
    return true;
  },

  onMouseMove(e) {
    var {index, sorting} = this.props;
    if (index !== sorting.index) {
      var node = this.getDOMNode();
      var {top} = node.getBoundingClientRect();
      var offsetY = e.clientY - top;
      var topSide = offsetY <= node.offsetHeight / 2;
      this.props.onSortOver(e, {index, topSide})
    }
  }
});

var SortableRepeatingFieldset = React.createClass({
  render() {
    var {sorting} = this.state;
    var {
      value, itemClassName, noAddButton, noLabel,
      shouldRenderRemoveButton, ...props
    } = this.props;
    var item = (
      <SortableItem
        shouldRenderRemoveButton={shouldRenderRemoveButton}
        className={itemClassName}
        sorting={sorting}
        onSortStart={this.onSortStart}
        onSort={this.onSort}
        onSortEnd={this.onSortEnd}
        onSortOver={this.onSortOver}
        />
    );
    var className = cx({
      'rfb-SortableRepeatingFieldset': true,
      'rfb-SortableRepeatingFieldset--sorting': this.state.sorting !== null
    });
    return (
      <SyntheticScroller {...props}
        className={className}
        ref="scroller"
        active={sorting !== null}>
        <ReactForms.RepeatingFieldset
          noLabel={noLabel}
          noAddButton={noAddButton}
          className="rfb-SortableRepeatingFieldset__fieldset"
          item={item}
          value={value}
          />
      </SyntheticScroller>
    );
  },

  getDefaultProps() {
    return {
      scrollOnDragDelta: 30,
      scrollOnDragInterval: 100,
      scrollOnDragThreshold: 50
    };
  },

  getInitialState() {
    return {sorting: null};
  },

  getItemByIndex(index) {
    return this.refs.scroller.refs.underlying.getItemByIndex(index);
  },

  onSortStart(e, {index, width, height}) {
    this._sortImage = createAndAppendSortImage({width, height}, e);
    document.body.appendChild(this._sortImage);
    this.setState({sorting: {index}});
  },

  onSortEnd(e) {
    document.body.removeChild(this._sortImage);
    this.setState({sorting: null});
  },

  onSort(e) {
    setElementPosition(this._sortImage, e);
  },

  onSortOver(e, {index: newIndex, topSide}) {
    var {value} = this.props;
    var {index} = this.state.sorting;
    if (index < newIndex && !topSide || index > newIndex && topSide) {
      var focus = value.value.get(index);
      var over = value.value.get(newIndex);
      value.transform(value => value
        .splice(newIndex, 1, focus)
        .splice(index, 1, over));
      this.setState({sorting: {index: newIndex}});
    }
  }
});

function createAndAppendSortImage(size, position) {
  var node = document.createElement('div');
  node.classList.add('rfb-SortableRepeatingFieldset__image');
  node.style.position = 'absolute';
  node.style.width = `${size.width}px`;
  node.style.height = `${Math.min(size.height, 50)}px`;
  node.style.left = `${position.pageX + 10}px`;
  node.style.top = `${position.pageY + 10}px`;
  return node;
}

function setElementPosition(node, position) {
  node.style.left = `${position.pageX + 10}px`;
  node.style.top = `${position.pageY + 10}px`;
}

module.exports = SortableRepeatingFieldset;
module.exports.Item = SortableItem;
