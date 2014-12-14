/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React                     = require('react/addons');
var cx                        = React.addons.classSet;
var ReactForms                = require('react-forms');
var SortableRepeatingFieldset = require('./SortableRepeatingFieldset');
var Icon                      = require('./Icon');
var emptyFunction             = require('./emptyFunction');
var EditTransactionStore      = require('./editor/EditTransactionStore');

var RepeatingFieldset = React.createClass({

  render() {
    var {
      value, className, itemClassName,
      showTopButton, showBottomButton, buttonCaption,
      noLabel, shouldRenderRemoveButton,
      ...props
    } = this.props;
    return (
      <div {...props} className={cx("rfb-RepeatingFieldset", className)}>
        {showTopButton &&
          <button
            type="button"
            onClick={this.add}
            className="rfb-RepeatingFieldset__topButton">
            <Icon name="plus" /> {buttonCaption}
          </button>}
        <SortableRepeatingFieldset
          shouldRenderRemoveButton={shouldRenderRemoveButton}
          noAddButton
          noLabel={noLabel}
          itemClassName={cx("rfb-RepeatingFieldset__item", itemClassName)}
          value={value}
          />
        {showBottomButton &&
          <button
            type="button"
            onClick={this.add}
            className="rfb-RepeatingFieldset__bottomButton">
            <Icon name="plus" /> {buttonCaption}
          </button>}
      </div>
    );
  },

  getDefaultProps() {
    return {
      showTopButton: true,
      buttonCaption: 'Add new item',
      showBottomButton: true,
      onAdd: emptyFunction
    };
  },

  add(e) {
    e.stopPropagation();
    var newIdx = this.props.value.value.size;
    var newNode = this.props.value.node.get(newIdx);
    var newValue = ReactForms.defaultValue(newNode);
    this.props.value.transform(value => value.push(newValue));
    this.props.onAdd(newValue, newNode, newIdx, this.props.value);
  }

});

module.exports = RepeatingFieldset;
