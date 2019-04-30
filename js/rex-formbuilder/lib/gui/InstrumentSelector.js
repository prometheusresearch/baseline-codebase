/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var PropTypes = require('prop-types');
var ReactCreateClass = require('create-react-class');

var InstrumentTile = require('./InstrumentTile');
var MenuHeader = require('./MenuHeader');
var _ = require('../i18n').gettext;
var CreateInstrumentModal = require('./CreateInstrumentModal');
var {InstrumentActions} = require('../actions');
var {InstrumentStore} = require('../stores');


var InstrumentSelector = ReactCreateClass({
  propTypes: {
    onInstrumentSelected: PropTypes.func
  },

  getInitialState: function () {
    return {
      instruments: this.getInstruments(),
      creating: false
    };
  },

  getInstruments: function () {
    var instruments = InstrumentStore.getAll().slice();

    instruments.sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });

    return instruments;
  },

  componentDidMount: function () {
    InstrumentStore.addChangeListener(this._onInstrumentsChange);
    InstrumentStore.addCreateListener(this._onInstrumentCreate);
  },

  componentWillUnmount: function () {
    InstrumentStore.removeCreateListener(this._onInstrumentCreate);
    InstrumentStore.removeChangeListener(this._onInstrumentsChange);
  },

  _onInstrumentsChange: function () {
    if (this.isMounted()) {
      this.setState({
        instruments: this.getInstruments()
      });
    }
  },

  _onInstrumentCreate: function (instrument) {
    if (this.props.onInstrumentSelected) {
      this.props.onInstrumentSelected(instrument);
    }
  },

  onInstrumentClick: function (instrument) {
    if (this.props.onInstrumentSelected) {
      this.props.onInstrumentSelected(instrument);
    }
  },

  onCreateNew: function () {
    this.setState({
      creating: true
    });
  },

  onCreateComplete: function (instrument) {
    InstrumentActions.create(instrument);
    this.setState({
      creating: false
    });
  },

  onCreateCancel: function () {
    this.setState({
      creating: false
    }, () => {
      this.refs.modal.reset();
    });
  },

  buildInstruments: function () {
    return this.state.instruments.map((instrument) => {
      return (
        <InstrumentTile
          key={instrument.uid}
          instrument={instrument}
          onClick={this.onInstrumentClick.bind(this, instrument)}
          />
      );
    });
  },

  render: function () {
    return (
      <div className="rfb-instrument-selector">
        <MenuHeader
          title={_('Select an Instrument')}>
          <button
            className="rfb-button"
            onClick={this.onCreateNew}>
            <span className="rfb-icon icon-new" />
            <span>{_('Create New Instrument')}</span>
          </button>
        </MenuHeader>
        <CreateInstrumentModal
          ref="modal"
          visible={this.state.creating}
          onComplete={this.onCreateComplete}
          onCancel={this.onCreateCancel}
          />
        <div className="rfb-instrument-container">
          {this.buildInstruments()}
        </div>
      </div>
    );
  }
});

module.exports = InstrumentSelector;

