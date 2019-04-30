/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var PropTypes = require('prop-types');
var ReactCreateClass = require('create-react-class');

var InstrumentSelector = require('./InstrumentSelector');
var DraftSetSelector = require('./DraftSetSelector');
var ToasterMixin = require('./ToasterMixin');
var {SettingActions, InstrumentActions} = require('../actions');
var {InstrumentStore} = require('../stores');


var InstrumentMenu = ReactCreateClass({
  mixins: [
    ToasterMixin
  ],

  propTypes: {
    apiBaseUrl: PropTypes.string.isRequired,
    instrumentMenuUrlTemplate: PropTypes.string,
    draftSetEditorUrlTemplate: PropTypes.string,
    draftSetSelectorVerticalView: PropTypes.bool,
    formPreviewerUrlTemplate: PropTypes.string.isRequired,
    uid: PropTypes.string,
    onDraftSelected: PropTypes.func,
    channels: PropTypes.arrayOf(PropTypes.string),
  },

  getDefaultProps: function () {
    return {
      draftSetSelectorVerticalView: false
    };
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
    let {instrumentMenuUrlTemplate,
         draftSetSelectorVerticalView} = this.props;

    let display = null;
    if (this.state.instrument) {
      display = (
        <DraftSetSelector
          apiBaseUrl={this.props.apiBaseUrl}
          instrument={this.state.instrument}
          onReturn={instrumentMenuUrlTemplate ? this.onReturn:null}
          onDraftSelected={this.props.onDraftSelected}
          draftSetEditorUrlTemplate={this.props.draftSetEditorUrlTemplate}
          formPreviewerUrlTemplate={this.props.formPreviewerUrlTemplate}
          verticalView={draftSetSelectorVerticalView}
          />
      );
    } else if (!this.props.uid) {
      display = (
        <InstrumentSelector
          onInstrumentSelected={this.onInstrumentSelected}
          />
      );
    }

    return (
      <div className="rfb-instrument-menu">
        {display}
        {this.renderToaster()}
      </div>
    );
  }
});


module.exports = InstrumentMenu;

