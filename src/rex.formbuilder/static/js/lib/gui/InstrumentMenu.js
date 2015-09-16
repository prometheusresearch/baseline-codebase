/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var InstrumentSelector = require('./InstrumentSelector');
var DraftSetSelector = require('./DraftSetSelector');
var ToasterMixin = require('./ToasterMixin');
var {SettingActions, InstrumentActions} = require('../actions');
var {InstrumentStore} = require('../stores');


var InstrumentMenu = React.createClass({
  mixins: [
    ToasterMixin
  ],

  propTypes: {
    apiBaseUrl: React.PropTypes.string.isRequired,
    instrumentMenuUrlTemplate: React.PropTypes.string,
    draftSetEditorUrlTemplate: React.PropTypes.string.isRequired,
    formPreviewerUrlTemplate: React.PropTypes.string.isRequired,
    uid: React.PropTypes.string,
    channels: React.PropTypes.arrayOf(React.PropTypes.string)
  },

  getInitialState: function () {
    return {
      instrument: null
    };
  },

  componentWillMount: function () {
    SettingActions.initialize(this.props);
    if (this.props.uid) {
      InstrumentActions.activate(this.props.uid);
    }
  },

  componentWillReceiveProps: function (nextProps) {
    SettingActions.initialize(nextProps);
    if (nextProps.uid) {
      InstrumentActions.activate(nextProps.uid);
    }
  },

  componentDidMount: function () {
    InstrumentStore.addChangeListener(this._onInstrumentsChange);
  },

  componentWillUnmount: function () {
    InstrumentStore.removeChangeListener(this._onInstrumentsChange);
  },

  _onInstrumentsChange: function () {
    this.setState({
      instrument: InstrumentStore.getActive()
    });
  },

  onInstrumentSelected: function (instrument) {
    InstrumentActions.activate(instrument.uid);
  },

  onReturn: function () {
    if (this.props.instrumentMenuUrlTemplate) {
      window.top.location.href = this.props.instrumentMenuUrlTemplate;
    } else {
      InstrumentActions.deactivate();
    }
  },

  render: function () {
    return (
      <div className="rfb-instrument-menu">
        {this.state.instrument ?
          <DraftSetSelector
            apiBaseUrl={this.props.apiBaseUrl}
            instrument={this.state.instrument}
            onReturn={this.onReturn}
            draftSetEditorUrlTemplate={this.props.draftSetEditorUrlTemplate}
            formPreviewerUrlTemplate={this.props.formPreviewerUrlTemplate}
            />
          :
          <InstrumentSelector
            onInstrumentSelected={this.onInstrumentSelected}
            />
        }
        {this.renderToaster()}
      </div>
    );
  }
});


module.exports = InstrumentMenu;

