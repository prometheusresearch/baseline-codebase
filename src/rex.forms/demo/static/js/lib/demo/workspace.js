/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');
var {Form} = require('rex-forms');
var RexI18N = require('rex-i18n');

var JsonViewer = require('../jsonviewer');
var {MODE_EDITOR, MODE_REVIEWER, MODE_VIEWER} = require('./constants');


var Workspace = React.createClass({
  propTypes: {
    mountPoint: React.PropTypes.string.isRequired,
    lookupApiUrl: React.PropTypes.string.isRequired,
    demo: React.PropTypes.object.isRequired,
    options: React.PropTypes.object
  },

  getDefaultProps: function () {
    return {
      options: {}
    };
  },

  getInitialState: function () {
    return {
      assessment: {},
      isValid: false
    };
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.options.locale != nextProps.options.locale) {
      RexI18N.onLoad(nextProps.options.locale, () => {
        RexI18N.setDefaultLocale(nextProps.options.locale);
        this.refs.form.forceUpdate();
      });
    }
  },

  onFormReview: function (assessment) {
    if (this.props.options.logFormEvents) {
      console.log('onReview', assessment);
    }
  },

  onFormChange: function (assessment) {
    if (this.props.options.logFormEvents) {
      console.log('onChange', assessment);
    }
  },

  onFormPage: function (page, pageIndex) {
    if (this.props.options.logFormEvents) {
      console.log('onPage', page, pageIndex);
    }
  },

  onFormUpdate: function (assessment, isValid) {
    if (this.props.options.logFormEvents) {
      console.log('onUpdate', assessment, isValid);
    }
    this.setState({assessment, isValid});
  },

  onFormComplete: function (assessment) {
    if (this.props.options.logFormEvents) {
      console.log('onComplete', assessment);
    }
    this.setState({assessment, isValid: true});
  },

  render: function () {
    var showOverview = this.props.options.mode == MODE_REVIEWER || this.props.options.mode == MODE_VIEWER;
    var readOnly = this.props.options.mode == MODE_VIEWER;
    var showOverviewOnCompletion = this.props.options.mode == MODE_EDITOR;

    var direction = ['ar', 'fa', 'ps', 'he', 'ur'].indexOf(
        this.props.options.locale
      ) > -1 ? 'rtl' : 'ltr';

    return (
      <div className='rfd-Workspace'>
        <div className='rfd-Form' dir={direction}>
          <Form
            ref='form'
            instrument={this.props.demo.instrument}
            form={this.props.demo.form}
            parameters={this.props.demo.parameters}
            locale={this.props.options.locale}
            showOverviewOnCompletion={showOverviewOnCompletion}
            showOverview={showOverview}
            readOnly={readOnly}
            onChange={this.onFormChange}
            onUpdate={this.onFormUpdate}
            onPage={this.onFormPage}
            onReview={this.onFormReview}
            onComplete={this.onFormComplete}
            calculationApiPrefix={this.props.mountPoint + '/demo/' + this.props.demo.id + '/calculate'}
            lookupApiPrefix={this.props.lookupApiUrl}
            />
        </div>
        {this.props.options.showAssessment &&
          <JsonViewer
            object={this.state.assessment}
            isValid={this.state.isValid}
            />
        }
      </div>
    );
  }
});


module.exports = Workspace;

