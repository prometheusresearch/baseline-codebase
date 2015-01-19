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
var {Box, HBox}       = require('../layout');

var RepeatingFieldsetItem = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {fieldset} = this.props;
    return (
      <Box className="rw-RepeatingFieldsetItem" style={{padding: '5px 0px'}}>
        <Box>
          <div>
          <Button
            className="rw-RepeatingFieldset__removeButton"
            danger quiet
            icon="remove"
            onClick={this.onRemove}>
            Remove
          </Button>
          </div>
        </Box>
        {fieldset()}
      </Box>
    );
  },

  onRemove() {
    this.props.onRemove(this.props.valueKey);
  }
});

var RepeatingFieldsetPlaceholder = React.createClass({

  render() {
    return (
      <Box centerHorizontally centerVertically style={{minHeight: 50}}>
        <HBox style={{fontSize: '90%', color: '#AAA'}}>
          <Box centerVertically style={{marginRight: 5}}>
            There are no items in the list, press
          </Box>
          <Button
            size="small"
            icon="plus"
            onClick={this.props.onAdd}
            className="rw-RepeatingFieldset__addButton">
            Add
          </Button>
          <Box centerVertically style={{marginLeft: 5}}>
            button to add one.
          </Box>
        </HBox>
      </Box>
    );
  }
});

var RepeatingFieldset = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {value, label, hint, fieldset, className, ...props} = this.props;
    value = value.getIn(this.getValueKey());
    className = cx('rw-RepeatingFieldset', className);
    var hasItems = value.value.size > 0;
    return (
      <Box {...props} className={className}>
        <ReactForms.Label
          className="rw-RepeatingFieldset__label"
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        {hasItems ?
          <Box>
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
                size="small"
                icon="plus"
                onClick={this.onAdd}
                className="rw-RepeatingFieldset__addButton">
                Add
              </Button>
            </div>
          </Box> :
          <RepeatingFieldsetPlaceholder
            onAdd={this.onAdd}
            />}
      </Box>
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
    var valueToAdd = value.node.props.get('defaultChildValue');
    if (valueToAdd === undefined) {
      valueToAdd = defaultValue(value.node.get(newIdx));
    }
    value.transform(value => value.push(valueToAdd));
  },
  
  onRemove(index) {
    var value = this.getValue();
    value.transform(value => value.splice(index, 1));
  }
});

module.exports = RepeatingFieldset;
