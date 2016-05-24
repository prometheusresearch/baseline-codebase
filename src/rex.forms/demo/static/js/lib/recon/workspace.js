/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');
var Reconciler = require('rex-forms').reconciler.Reconciler;
var RexI18N = require('rex-i18n');

var JsonViewer = require('../jsonviewer');


var Workspace = React.createClass({
  propTypes: {
    mountPoint: React.PropTypes.string.isRequired,
    recon: React.PropTypes.object.isRequired,
    options: React.PropTypes.object
  },

  getDefaultProps: function () {
    return {
      options: {}
    };
  },

  getInitialState: function () {
    return {
      solution: null
    };
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.options.locale != nextProps.options.locale) {
      RexI18N.onLoad(nextProps.options.locale, () => {
        RexI18N.setDefaultLocale(nextProps.options.locale);
        this.refs.reconciler.forceUpdate();
      });
    }
  },

  onReconcilerComplete: function (solution) {
    return new Promise((resolve, reject) => {
      this.setState({solution}, () => {
        resolve();
      });
    });
  },

  render: function () {
    var direction = ['ar', 'fa', 'ps', 'he', 'ur'].indexOf(
        this.props.options.locale
      ) > -1 ? 'rtl' : 'ltr';

    return (
      <div className='rfd-Workspace'>
        <div className='rfd-Reconciler' dir={direction}>
          <Reconciler
            ref='reconciler'
            instrument={this.props.recon.instrument}
            form={this.props.recon.form}
            parameters={this.props.recon.parameters}
            locale={this.props.options.locale}
            discrepancies={this.props.recon.discrepancies}
            entries={this.props.recon.entries}
            onComplete={this.onReconcilerComplete}
            />
        </div>
        {this.state.solution &&
          <JsonViewer
            object={this.state.solution}
            isValid={true}
            />
        }
      </div>
    );
  }
});


module.exports = Workspace;

