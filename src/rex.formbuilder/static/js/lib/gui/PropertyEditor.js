/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {classSet} = React.addons;
var ReactForms = require('react-forms');
var deepMerge = require('n-deep-merge');


var PropertyEditor = React.createClass({
  propTypes: {
    element: React.PropTypes.object.isRequired
  },

  getInitialState: function () {
    return {
      tab: null,
      tabs: []
    };
  },

  setConfigState: function (config) {
    var tabs = config.categories
      .filter(c => config.properties[c.id].length > 0)
      .map(c => c.id);

    var defaultTab = config.defaultCategory;
    if (tabs.indexOf(defaultTab) === -1) {
      defaultTab = tabs[0];
    }

    this.setState({
      tab: defaultTab,
      tabs: tabs
    });
  },

  componentWillMount: function () {
    this.setConfigState(
      this.props.element.constructor.getPropertyConfiguration()
    );
  },

  componentWillReceiveProps: function (nextProps) {
    this.setConfigState(
      nextProps.element.constructor.getPropertyConfiguration()
    );
  },

  makeFormSchema: function (properties) {
    var cfg = {};

    properties.forEach((property) => {
      var {name, schema, ...props} = property;
      cfg[name] = schema.create(props);
      cfg[name].ELEMENT = this.props.element;
    });

    /*eslint new-cap:0 */
    return ReactForms.schema.Mapping(cfg);
  },

  getStartingValue: function (properties) {
    var value = {};

    properties.forEach((property) => {
      value[property.name] = this.props.element[property.name];
    });

    return value;
  },

  checkValid: function () {
    var allValid = true;

    this.state.tabs.forEach((category) => {
      var form = this.refs[category];
      var formValid = form.getValidation().isSuccess;

      allValid = allValid && formValid;

      if (!formValid) {
        form.makeDirty();
        this.setState({
          tab: category
        });
      }
    });

    return allValid;
  },

  marshalFormValue: function (form) {
    var value = form.getValue().toJS();

    function clean(v) {
      for (var key in v) {
        if (v[key] === undefined) {
          // If someone happens to click into an empty field, and then
          // click out of it, react-forms still could send us the key
          // with nothing in it. We don't want that.
          delete v[key];
        } else if (typeof v[key] === 'object') {
          clean(v[key]);
        }
      }
    }

    clean(value);

    return value;
  },

  getProperties: function () {
    var properties = {};

    this.state.tabs.forEach((category) => {
      properties = deepMerge(
        properties,
        this.marshalFormValue(this.refs[category])
      );
    });

    return properties;
  },

  reset: function () {
    var config = this.props.element.constructor.getPropertyConfiguration();

    this.setConfigState(config);

    this.state.tabs.forEach((category) => {
      this.refs[category].setValue(
        this.getStartingValue(config.properties[category])
      );
    });
  },

  onTab: function (tab) {
    this.setState({tab});
  },

  renderTabs: function (config) {
    var tabs = this.state.tabs.map((category) => {
      var classes = classSet({
        'rfb-tab': true,
        'rfb-tab__active': (this.state.tab === category)
      });

      var label = config.categories.filter(c => c.id === category)[0].label;
      return (
        <div
          key={category}
          onClick={this.onTab.bind(this, category)}
          className={classes}>
          {label}
        </div>
      );
    });

    return (
      <div
        key='tabset'
        className='rfb-tabset'>
        {tabs}
      </div>
    );
  },

  renderTabContent: function (config) {
    return this.state.tabs.map((category) => {
      var classes = classSet({
        'rfb-tab-content': true,
        'rfb-tab-content__active': (this.state.tab === category)
      });

      return (
        <div
          key={category}
          className={classes}>
          <ReactForms.Form
            ref={category}
            component='div'
            schema={this.makeFormSchema(config.properties[category])}
            defaultValue={this.getStartingValue(config.properties[category])}
            />
        </div>
      );
    });
  },

  render: function () {
    var config = this.props.element.constructor.getPropertyConfiguration();

    return (
      <div className='rfb-property-editor rfb-tabs'>
        {this.renderTabs(config)}
        {this.renderTabContent(config)}
      </div>
    );
  }
});


module.exports = PropertyEditor;

