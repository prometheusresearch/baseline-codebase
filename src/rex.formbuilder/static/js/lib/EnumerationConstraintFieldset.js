/**
 * @jsx React.DOM
 */
'use strict';

var Immutable   = require('immutable');
var React       = require('react');
var ReactForms  = require('react-forms');
var Button      = require('./Button');
var FormHelpers = require('./FormHelpers');
var cx          = React.addons.classSet;
var countKeys   = require('./countKeys');

var Enumeration = React.createClass({

  propTypes: {
    enumeration: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func,
    onDelete: React.PropTypes.func
  },

  render() {
    var id = this.props.enumeration.id;
    var idInvalid = (FormHelpers.validateIdentifier(id) instanceof Error);
    var idCls = {
      'rf-Field': true,
      'rfb-EnumerationsConstraint__enumeration__id': true,
      'rf-Field--invalid': idInvalid
    }
    return (
      <div className="rfb-EnumerationsConstraint__enumeration">
        <div className={cx(idCls)}>
          <input
            type="text"
            value={this.props.enumeration.id}
            placeholder="Code"
            onChange={this.handleIdChange}
            />
        </div>
        <div className="rf-Field rfb-EnumerationsConstraint__enumeration__description">
          <input
            type="text"
            value={this.props.enumeration.description}
            placeholder="Description"
            onChange={this.handleDescriptionChange}
            />
        </div>
        <div className="rf-Field rfb-EnumerationsConstraint__enumeration__delete">
          <Button onClick={this.triggerDelete}>&times;</Button>
        </div>
      </div>
    );
  },

  getInitialState() {
    return {
      id: null,
      description: null
    };
  },

  componentWillMount() {
    this.setState({
      id: this.props.enumeration.id || null,
      description: this.props.enumeration.description || null
    });
  },

  componentWillReceiveProps(nextProps) {
    this.setState({
      id: nextProps.enumeration.id || null,
      description: nextProps.enumeration.description || null
    });
  },

  triggerDelete() {
    if (this.props.onDelete) {
      this.props.onDelete();
    }
  },

  triggerChange() {
    if (this.props.onChange) {
      this.props.onChange({
        id: this.state.id,
        description: this.state.description
      });
    }
  },

  handleIdChange(ev) {
    this.setState({id: ev.target.value}, this.triggerChange);
  },

  handleDescriptionChange(ev) {
    this.setState({description: ev.target.value}, this.triggerChange);
  }
});


var EnumerationConstraintFieldset = React.createClass({

  render() {
    var label = this.props.label || this.props.value.schema.props.get('label');
    var total = countKeys(this.state.enumerations);
    var addButton = (
      <Button className="rfb-EnumerationsConstraint__add"
              onClick={this.add}>Add Enumeration</Button>
    );
    var listCls = {
      'rfb-EnumerationsConstraint__list': true,
      'rfb-EnumerationsConstraint__list--empty': total == 0
    };
    return (
      <div className="rfb-EnumerationsConstraint">
        <div className="rfb-EnumerationsConstraint__header">
          {(total == 0) &&
            <div className="rfb-EnumerationsConstraint__header__add">
              {addButton}
            </div>}
          <div className="rfb-EnumerationsConstraint__header__label">
            <label className="rf-Label rf-Field__label">{label}</label>
          </div>
        </div>
        <div className={cx(listCls)}>
          {total == 0 ?
            'No Enumerations' : <this.renderEnumerations />}
        </div>
        {(total != 0) &&
          <div className="rfb-EnumerationsConstraint__footer">
            {addButton}
          </div>}
      </div>
    );
  },

  renderEnumerations() {
    return this.state.enumerations.map((enumeration, idx) => {
      return (
        <Enumeration
          key={idx}
          enumeration={enumeration}
          onChange={this.handleChange.bind(this, idx)}
          onDelete={this.handleDelete.bind(this, idx)}
          />
      );
    });
  },

  getInitialState() {
    var value = this.props.value.value;
    var value = value ? value.toJS() : {};
    var enumerations = [];
    for (var name in value) {
      if (value.hasOwnProperty(name)) {
        enumerations.push({
          id: name,
          description: value[name].description
        });
      }
    }
    return {enumerations};
  },

  valueChanged() {
    var value = {};
    this.state.enumerations.forEach((enumeration) => {
      if (enumeration.id) {
        value[enumeration.id] = {};
        if (enumeration.description) {
          value[enumeration.id].description = enumeration.description;
        }
      }
    });
    value = Immutable.fromJS(value);
    this.props.value.update(value).notify();
  },

  handleChange(idx, enumeration) {
    var enumerations = this.state.enumerations.slice(0);
    enumerations[idx] = enumeration;
    this.setState({enumerations}, this.valueChanged);
  },

  handleDelete(idx) {
    var enumerations = this.state.enumerations.slice(0);
    delete enumerations[idx];
    this.setState({enumerations}, this.valueChanged);
  },

  add() {
    var enumerations = this.state.enumerations.slice(0);
    enumerations.push({});
    this.setState({enumerations});
  }
});


module.exports = EnumerationConstraintFieldset;
