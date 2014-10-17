/**
 * @jsx React.DOM
 */
'use strict';

var React                     = require('react');
var Button                    = require('./Button');
var SortableRepeatingFieldset = require('./SortableRepeatingFieldset');
var cx                        = React.addons.classSet;

var CustomRepFieldset = React.createClass({

  render() {
    var {value} = this.props;
    var total = value.value.length;
    var topButton = !this.props.floatAddButton || this.props.floatAddButton && total === 0;
    var button = (
      <div className="rfb-CustomRepFieldset__add">
        <Button onClick={this.onAdd}>{this.props.addTitle}</Button>
      </div>
    );
    return this.transferPropsTo(
      <div className={cx('rfb-CustomRepFieldset',this.props.className)}>
        {this.props.renderHead ?
          this.props.renderHead() :
          <div className="rfb-CustomRepFieldset__head">
            {topButton && button}
            <div className="rfb-CustomRepFieldset__elementsTitle">
              {this.props.elementsTitle}
            </div>
          </div>}
        <div className="rfb-CustomRepFieldset__items">
          {total === 0 ?
            <div className="rfb-CustomRepFieldset__noItems">
              {this.props.noItemsTitle}
            </div> :
            <SortableRepeatingFieldset
              ref="fieldset"
              noAddButton
              value={value}
              />}
        </div>
        {(!topButton || this.props.renderFooter)  &&
          <div className="rfb-CustomRepFieldset__footer">
            {!topButton && button}
            {this.props.renderFooter && this.props.renderFooter()}
          </div>}
      </div>
    );
  },

  getDefaultProps() {
    return {
      addTitle: 'Add',
      elementsTitle: null,
      noItemsTitle: 'No Items',
      floatAddButton: false
    };
  },

  componentDidUpdate() {
    if (this._scrollTo !== undefined) {
      var item = this.refs.fieldset.getItemByIndex(this._scrollTo);
      item.getDOMNode().scrollIntoView();
      this._scrollTo = undefined;
    }
  },

  add(itemValue) {
    var value = this.props.value;
    if (itemValue === undefined) {
      itemValue = value.emptyChild();
    }
    value = value.push(itemValue);
    value.notify();
    if (this.props.onAdd) {
      this.props.onAdd(value.value.last());
    }
  },

  addAndScroll(value) {
    this.add(value);
    this._scrollTo = this.props.value.value.length;
  },

  remove(index) {
    this.props.value
      .splice(index, 1)
      .notify();
    if (this.props.onRemove) {
      this.props.onRemove(index);
    }
  },

  onAdd() {
    this.addAndScroll();
  }

});

module.exports = CustomRepFieldset;
