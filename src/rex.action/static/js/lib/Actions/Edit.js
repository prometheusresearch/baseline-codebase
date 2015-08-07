/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import React          from 'react';
import RexWidget      from 'rex-widget';
import Action         from '../Action';
import buildValue     from '../buildValueFromContext';

let Style = {
  submitButton: {
    width: '25%'
  }
};

let Edit = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  propTypes: {
    context: React.PropTypes.object,
    onContext: React.PropTypes.func
  },

  dataSpecs: {
    data: RexWidget.DataSpecification.entity()
  },

  fetchDataSpecs: {
    data: true
  },

  render() {
    var {onClose, width} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <Action width={width} onClose={onClose} title={title} renderFooter={this.renderFooter}>
        {this.data.data.loaded ?
          this.renderForm() :
          <RexWidget.Preloader />}
      </Action>
    );
  },

  renderFooter() {
    var {submitButton} = this.props;
    return (
      <RexWidget.Button
        style={Style.submitButton}
        success
        icon="ok"
        size="small"
        onClick={this.onSubmit}
        align="center">
        {submitButton}
      </RexWidget.Button>
    );
  },

  renderForm() {
    var {entity, fields, value, context} = this.props;
    value = mergeDeepInto(this.data.data.data, buildValue(value, context));
    return (
      <RexWidget.Forms.ConfigurableEntityForm
        ref="form"
        submitTo={this.dataSpecs.data}
        submitButton={null}
        initialValue={this.data.data.data}
        value={value}
        entity={entity.type.name}
        fields={fields}
        />
    );
  },

  getDefaultProps() {
    return {
      width: 400,
      icon: 'pencil',
      submitButton: 'Submit'
    };
  },

  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.refs.form.submit();
  },

  statics: {
    getTitle(props) {
      return props.title || `Edit ${props.entity.name}`;
    }
  }
});

export default Edit;

function mergeDeepInto(a, b) {
  a = {...a};
  for (var k in b) {
    if (b.hasOwnProperty(k)) {
      if (typeof b[k] === 'object') {
        a[k] = mergeDeepInto(a[k], b[k]);
      } else {
        a[k] = b[k];
      }
    }
  }
  return a;
}
