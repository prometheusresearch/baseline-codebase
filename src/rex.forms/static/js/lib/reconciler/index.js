/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';


var React = require('react/addons');
var Forms = require('react-forms');

var FormLocalizerMixin = require('../form/FormLocalizerMixin');
var merge = require('../utils').merge;
var components = require('./components')
var Header = components.Header;
var DiscrepancyList = components.DiscrepancyList;
var SchemaBuilder = require('./schema').SchemaBuilder;
var l10n = require('../localization');
var _ = l10n._;


var Reconciler = React.createClass({
  mixins: [
    FormLocalizerMixin
  ],

  getInitialState: function () {
    return {
      processingComplete: false
    };
  },

  propTypes: {
    discrepancies: React.PropTypes.object.isRequired,
    entries: React.PropTypes.array.isRequired,
    instrument: React.PropTypes.object.isRequired,
    form: React.PropTypes.object.isRequired,
    locale: React.PropTypes.string.isRequired,
    onComplete: React.PropTypes.func.isRequired
  },

  onComplete: function (event) {
    var reconciledDiscrepancies = this.refs.discrepancyForm.getReconciledDiscrepancies(),
      isValid = this.refs.discrepancyForm.isValid();

    this.setState({
      processingComplete: true
    });

    this.props.onComplete(
      reconciledDiscrepancies,
      isValid
    ).then(
      null,
      (err) => {
        this.setState({
          processingComplete: false
        });
      }
    );
  },

  render: function () {
    var sb = new SchemaBuilder(
      this.props.discrepancies,
      this.props.instrument,
      this.props.form
    );
    var schema = sb.build();

    return (
      <div className='rex-forms-Reconciler'>
        <Header
          entries={this.props.entries} />
        <DiscrepancyList
          ref='discrepancyForm'
          schema={schema} />
        <div className='rex-forms-ReconcilerControls'>
          {!this.state.processingComplete &&
            <button
              className='rex-forms-ReconcilerComplete'
              onClick={this.onComplete}>
              {_('Complete Reconciliation')}
            </button>
          }
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

  var options = merge(defaults, options);

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

  return reconciler;
};


module.exports = {
  Reconciler: Reconciler,
  render: render
};

