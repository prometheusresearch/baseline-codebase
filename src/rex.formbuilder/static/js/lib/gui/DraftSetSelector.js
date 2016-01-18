/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var DraftSetList = require('./DraftSetList');
var MenuHeader = require('./MenuHeader');
var VersionList = require('./VersionList');
var _ = require('../i18n').gettext;
var {InstrumentVersionStore} = require('../stores');
var {format} = require('../util');


var DraftSetSelector = React.createClass({
  propTypes: {
    apiBaseUrl: React.PropTypes.string.isRequired,
    instrument: React.PropTypes.object.isRequired,
    onReturn: React.PropTypes.func,
    onDraftSelected: React.PropTypes.func,
    draftSetEditorUrlTemplate: React.PropTypes.string.isRequired,
    verticalView: React.PropTypes.bool,
    formPreviewerUrlTemplate: React.PropTypes.string.isRequired
  },

  getInitialState: function () {
    return {
      hasPublishedVersions: false
    };
  },

  getDefaultProps: function () {
    return {
      verticalView: false
    }
  },

  componentDidMount: function () {
    InstrumentVersionStore.addChangeListener(this._onInstrumentVersionsChange);
    this._onInstrumentVersionsChange();
  },

  componentWillUnmount: function () {
    InstrumentVersionStore.removeChangeListener(
      this._onInstrumentVersionsChange
    );
  },

  _onInstrumentVersionsChange: function () {
    var versions = InstrumentVersionStore.getAll();
    this.setState({
      hasPublishedVersions: versions && versions.length > 0
    });
  },

  onSelected: function (draft) {
    if (this.props.onDraftSelected) {
      this.props.onDraftSelected(draft);
    }
    if(this.props.draftSetEditorUrlTemplate) {
      var editorUrl = format(this.props.draftSetEditorUrlTemplate, draft);
      window.location = editorUrl;
    }
  },

  onPreview: function (uid, category) {
    window.open(format(
      this.props.formPreviewerUrlTemplate,
      {uid, category}
    ));
  },

  render: function () {
    let {verticalView} = this.props;
    let listStyle = !verticalView ? {} : {
      width: 'auto',
      display: 'block',
      marginTop: '15px',
      marginBottom: '15px'
    };
    return (
      <div className="rfb-draftset-selector">
        <MenuHeader
          title={this.props.instrument.title}>
          {this.props.onReturn &&
            <button
              className="rfb-button"
              onClick={this.props.onReturn}>
              <span className="rfb-icon icon-go-back" />
              {_('Go Back to Instruments')}
            </button>
          }
        </MenuHeader>
        <DraftSetList
          onDraftSelected={this.onSelected}
          onPreviewSelected={this.onPreview}
          allowNewDrafts={!this.state.hasPublishedVersions}
          style={listStyle}
          />
        <VersionList
          onPreviewSelected={this.onPreview}
          style={listStyle}
          />
      </div>
    );
  }
});


module.exports = DraftSetSelector;

