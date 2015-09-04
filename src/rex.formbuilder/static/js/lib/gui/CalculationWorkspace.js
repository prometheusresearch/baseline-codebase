/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var WorkspaceCalculation = require('./WorkspaceCalculation');
var {DraftSetStore} = require('../stores');


var CalculationWorkspace = React.createClass({
  getInitialState: function () {
    return {
      calculations: DraftSetStore.getActiveCalculations()
    };
  },

  componentDidMount: function () {
    DraftSetStore.addChangeListener(this._onDraftSetChange);
  },

  componentWillUnmount: function () {
    DraftSetStore.removeChangeListener(this._onDraftSetChange);
  },

  _onDraftSetChange: function () {
    this.setState({
      calculations: DraftSetStore.getActiveCalculations()
    });
  },

  buildCalculations: function () {
    return this.state.calculations.map((calculation) => {
      return (
        <WorkspaceCalculation
          key={calculation.CID}
          calculation={calculation}
          />
      );
    });
  },

  render: function () {
    var calculations = this.buildCalculations();

    return (
      <div className="rfb-workspace">
        {calculations}
      </div>
    );
  }
});


module.exports = CalculationWorkspace;

