/**
 * <RepeatingFieldset />
 */

var React             = require('react');
var ReactForms        = require('react-forms');
var defaultValue      = require('react-forms/lib/defaultValue');
var cloneWithProps    = React.addons.cloneWithProps;
var cx                = React.addons.classSet;
var FormContextMixin  = require('./FormContextMixin');
var Button            = require('../Button');
var Element           = require('../layout/Element');

var RepeatingFieldsetItem = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {fieldset} = this.props;
    return (
      <Element className="rw-RepeatingFieldsetItem">
        {fieldset()}
        <Button
          className="rw-RepeatingFieldset__removeButton"
          danger
          icon="remove"
          onClick={this.onRemove}>
          Remove
        </Button>
      </Element>
    );
  },

  onRemove() {
    this.props.onRemove(this.props.valueKey);
  }
});

var RepeatingFieldset = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {value, label, hint, fieldset, className, ...props} = this.props;
    value = value.getIn(this.getValueKey());
    className = cx('rw-RepeatingFieldset', className);
    return (
      <Element {...props} className={className}>
        <ReactForms.Label
          className="rw-RepeatingFieldset__label"
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        <div className="rw-RepeatingFieldset__fieldset">
          {value.map((value, idx) =>
            <RepeatingFieldsetItem
              onRemove={this.onRemove}
              key={idx}
              fieldset={fieldset}
              valueKey={idx}
              />
          )}
        </div>
        <div className="rw-RepeatingFieldset__controls">
          <Button
            icon="plus"
            onClick={this.onAdd}
            className="rw-RepeatingFieldset__addButton">
            Add
          </Button>
        </div>
      </Element>
    );
  },

  getDefaultProps() {
    return {
      valueKey: [],
      margin: 10,
      size: 1
    };
  },

  onAdd() {
    var value = this.getValue();
    var newIdx = value.size;
    var valueToAdd = defaultValue(value.node.get(newIdx));
    value.transform(value => value.push(valueToAdd));
  },
  
  onRemove(index) {
    var value = this.getValue();
    value.transform(value => value.splice(index, 1));
  }
});

module.exports = RepeatingFieldset;
