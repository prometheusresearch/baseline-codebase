/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var MenuHeader = require('./MenuHeader');
var VersionTile = require('./VersionTile');
var _ = require('../i18n').gettext;
var {InstrumentVersionStore} = require('../stores');


var VersionList = React.createClass({
  propTypes: {
    onPreviewSelected: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      versions: []
    };
  },

  getVersions: function () {
    var versions = InstrumentVersionStore.getAll().slice();

    versions.sort(function (a, b) {
      return b.version - a.version;
    });

    return versions;
  },

  componentDidMount: function () {
    InstrumentVersionStore.addChangeListener(this._onInstrumentVersionsChange);
  },

  componentWillUnmount: function () {
    InstrumentVersionStore.removeChangeListener(
      this._onInstrumentVersionsChange
    );
  },

  _onInstrumentVersionsChange: function () {
    this.setState({
      versions: this.getVersions()
    });
  },

  onPreviewClick: function (version) {
    this.props.onPreviewSelected(version.uid, 'published');
  },

  onVersionClick: function (version) {
    if (this.props.onVersionSelected) {
      this.props.onVersionSelected(version);
    }
  },

  onViewCurrent: function () {
    this.props.onPreviewSelected(
      InstrumentVersionStore.getLatestVersion().uid,
      'published'
    );
  },

  buildVersions: function () {
    return this.state.versions.map((version) => {
      return (
        <VersionTile
          key={version.uid}
          version={version}
          onClick={this.onVersionClick.bind(this, version)}
          onPreview={this.onPreviewClick.bind(this, version)}
          />
      );
    });
  },

  render: function () {
    return (
      <div className="rfb-versions-list">
        <MenuHeader
          title={_('Published Revisions')}>
          {(this.state.versions.length > 0) &&
            <button
              onClick={this.onViewCurrent}
              className="rfb-button">
              <span className='rfb-icon icon-view' />
              {_('View Current Revision')}
            </button>
          }
        </MenuHeader>
        <table>
          <thead>
            <tr>
              <th>{_('ID')}</th>
              <th>{_('Published')}</th>
              <th>{_('Publisher')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {this.buildVersions()}
          </tbody>
        </table>
      </div>
    );
  }
});


module.exports = VersionList;

