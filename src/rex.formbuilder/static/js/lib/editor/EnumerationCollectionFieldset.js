'use strict';

var React = require('react/addons');
var {Map} = require('immutable');
var cx = React.addons.classSet;
var ReactForms = require('react-forms');
var Button = require('../Button');

var EnumerationCollectionFieldset = React.createClass({

  render() {
    var {value, className, ...props} = this.props;
    // we use field order as a key as original keys are editable
    var index = 0;
    var items = value.map((value, key) =>
      <div className="rfb-enumeration" key={index++}>
        <div className="rfb-enumeration__identifier">
          <input type="text"
                 value={key}
                 onChange={this.onKeyChange.bind(null, key)} />
        </div>
        <ReactForms.Element className="rfb-enumeration__description"
                            key={key}
                            value={value} />
        <Button
          className="rfb-enumeration__close"
          onClick={this.onRemove.bind(this, key)}>
          &times;
        </Button>
      </div>
    );
    return (
      <div {...props} className={cx('rfb-EnumerationCollectionFieldset', className)}>
        {items.length ?
          items : <div className="rfb-enumeration__emptyText">No Enumerations</div>}
        <Button className="rfb-EnumerationCollectionFieldset__add"
          onClick={this.onClick}>Add Enumeration</Button>
      </div>
    );
  },

  onKeyChange(key, e) {
    var nextKey = e.target.value;
    var item = this.props.value.value.get(key);
    var nextValue = this.props.value.value.remove(key).set(nextKey, item);
    this.props.value.set(nextValue);
  },

  onRemove(key, e) {
    var item = this.props.value.value.get(key);
    var nextValue = this.props.value.value.remove(key);
    this.props.value.set(nextValue);
  },

  onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.value
      .transform(value => value.set(`enum_${value.size}`, Map()));
  }
});

module.exports = EnumerationCollectionFieldset;
