/**
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React           = require('react');
var PropTypes       = require('prop-types');
var ReactCreateClass = require('create-react-class');
var cx              = require('classnames');
var Label           = require('./Label');
var Element         = require('./Element');
var FormPropTypes   = require('./PropTypes');
var emptyFunction   = require('./emptyFunction');
var defaultValue    = require('./defaultValue');

var Item = ReactCreateClass({

  render() {
    var {className, noRemoveButton, onRemove, value, ...props} = this.props;
    return (
      <div {...props} className={cx('rf-RepeatingFieldset__item', className)}>
        {this.props.children}
        {!noRemoveButton &&
          <button
            onClick={onRemove}
            type="button"
            className="rf-RepeatingFieldset__remove">
            &times;
          </button>}
      </div>
    );
  }
});

/**
 * A component which renders values which correspond to List schema node.
 */
var RepeatingFieldset = ReactCreateClass({

  render() {
    var {
      item: Item, value, className, noAddButton, noRemoveButton,
      dirtyOnChange, dirtyOnBlur,
      onAdd, onRemove, noLabel, label, hint, ...props
    } = this.props;
    return (
      <div {...props} className={cx('rf-RepeatingFieldset', className)}>
        {!noLabel &&
          <Label
            className="rf-RepeatingFieldset__label"
            label={label || value.node.props.get('label')}
            hint={hint || value.node.props.get('hint')}
            />}
        <div className="rf-RepeatingFieldset__items">
          {value.map((value, key) => {
            var props = {
              value,
              key,
              index: key,
              ref: key,
              noRemoveButton,
              onRemove: this.onRemove.bind(null, key),
              children: (
                <Element
                  className="rf-RepeatingFieldset__child"
                  value={value}
                  />
              )
            };
            return React.isValidElement(Item) ?
              React.cloneElement(Item, props) :
              <Item {...props} />;
          })}
        </div>
        {!noAddButton &&
          <button
            type="button"
            onClick={this.onAdd}
            className="rf-RepeatingFieldset__add">
            Add
          </button>}
      </div>
    );
  },

  getDefaultProps() {
    return {
      item: Item,
      onAdd: emptyFunction,
      onRemove: emptyFunction
    };
  },

  onAdd() {
    var newIdx = this.props.value.size;
    var valueToAdd = defaultValue(this.props.value.node.get(newIdx));
    this.props.value.transform(value => value.push(valueToAdd));
    this.props.onAdd();
  },

  onRemove(index) {
    this.props.value.transform(value => value.splice(index, 1));
    this.props.onRemove(index);
  },

  getItemByIndex(index) {
    return this.refs[index];
  }

});

module.exports = RepeatingFieldset;
module.exports.Item = Item;
