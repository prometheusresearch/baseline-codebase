/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var WorkspaceElement = require('./WorkspaceElement');
var {DraftSetStore} = require('../stores');


var ElementWorkspace = React.createClass({
  getInitialState: function () {
    return {
      elements: DraftSetStore.getActiveElements()
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
      elements: DraftSetStore.getActiveElements()
    });
  },

  buildElements: function () {
    return this.state.elements.map((element, idx) => {
      return (
        <WorkspaceElement
          key={element.EID}
          element={element}
          fixed={idx === 0}
          />
      );
    });
  },

  render: function () {
    var elements = this.buildElements();

    return (
      <div className="rfb-workspace">
        {elements}
      </div>
    );
  }
});


module.exports = ElementWorkspace;

