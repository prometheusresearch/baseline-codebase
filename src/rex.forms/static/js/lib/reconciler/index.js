/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';


var React = require('react/addons');
var RexI18N = require('rex-i18n');

var FormLocalizerMixin = require('../form/FormLocalizerMixin');
var WidgetConfiguration = require('../form/WidgetConfiguration');
var merge = require('../utils').merge;
var components = require('./components');
var Header = components.Header;
var DiscrepancyList = components.DiscrepancyList;
var SchemaBuilder = require('./schema').SchemaBuilder;
var l10n = require('../localization');
var _ = l10n._;


var Reconciler = React.createClass({
  mixins: [
    FormLocalizerMixin,
    WidgetConfiguration.ContextMixin
  ],

  getDefaultProps: function () {
    return {
      parameters: {}
    };
  },

  getInitialState: function () {
    return {
      complete: false,
      processingComplete: false
    };
  },

  propTypes: {
    discrepancies: React.PropTypes.object.isRequired,
    entries: React.PropTypes.array.isRequired,
    instrument: React.PropTypes.object.isRequired,
    form: React.PropTypes.object.isRequired,
    locale: React.PropTypes.string.isRequired,
    onComplete: React.PropTypes.func.isRequired,
    parameters: React.PropTypes.object
  },

  onComplete: function () {
    this.setState({
      processingComplete: true
    }, () => {
      this.props.onComplete(
        this.refs.discrepancyForm.getReconciledDiscrepancies(),
        this.refs.discrepancyForm.isValid()
      ).then(
        null,
        (err) => {
          this.setState({
            processingComplete: false
          });
        }
      );
    });
  },

  onChildStatus: function (isComplete) {
    this.setState({
      complete: isComplete
    });
  },

  render: function () {
    var sb = new SchemaBuilder(
      this.props.discrepancies,
      this.props.instrument,
      this.props.form
    );
    var schema = sb.build();

    var canComplete = this.state.complete && !this.state.processingComplete;

    return (
      <div className='rex-forms-Reconciler'>
        <Header
          entries={this.props.entries}
          />
        <DiscrepancyList
          ref='discrepancyForm'
          schema={schema}
          onStatus={this.onChildStatus}
          />
        <div className='rex-forms-ReconcilerControls'>
          <button
            className='rex-forms-ReconcilerComplete'
            disabled={!canComplete}
            onClick={this.onComplete}>
            {_('Complete Reconciliation')}
          </button>
        </div>
      </div>
    );
  }
});


var render = function (options) {
  var defaults = {
    component: Reconciler,
    locale: 'en'
  };

  options = merge(defaults, options);

  var Component = options.component;
  var element = options.element;

  delete options.component;
  delete options.element;

  var reconciler = React.renderComponent(Component(options), element);

  reconciler.unmount = function () {
    if (reconciler.isMounted()) {
      React.unmountComponentAtNode(element);
    }
  };

  RexI18N.onLoad(options.locale, function () {
    reconciler.forceUpdate();
  });

  return reconciler;
};


module.exports = {
  Reconciler: Reconciler,
  render: render
};

