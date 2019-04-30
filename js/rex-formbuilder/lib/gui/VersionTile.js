/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactCreateClass = require('create-react-class');
var PropTypes = require('prop-types');

var ConfirmationModal = require('./ConfirmationModal');
var {InstrumentVersionActions} = require('../actions');
var {formatDateTime, gettext} = require('../i18n');
var _ = gettext;


var VersionTile = ReactCreateClass({
  propTypes: {
    version: PropTypes.object.isRequired,
    onPreview: PropTypes.func
  },

  getInitialState: function () {
    return {
      cloning: false
    };
  },

  onClone: function () {
    this.setState({
      cloning: true
    });
  },

  onCloneAccepted: function () {
    InstrumentVersionActions.clone(this.props.version);
    this.setState({
      cloning: false
    });
  },

  onCloneRejected: function () {
    this.setState({
      cloning: false
    });
  },

  render: function () {
    return (
      <tr className="rfb-version-tile">
        <td onClick={this.props.onClick}>
          {this.props.version.uid}
          </td>
        <td onClick={this.props.onClick}>
          {formatDateTime(this.props.version.date_published)}
        </td>
        <td onClick={this.props.onClick}>
          {this.props.version.published_by}
        </td>
        <td className="rfb-tile-actions">
          <button
            className="rfb-button rfb-icon-button"
            title={_('Preview this Revision')}
            onClick={this.props.onPreview}>
            <span className="rfb-icon icon-view" />
          </button>
          <button
            className="rfb-button rfb-icon-button"
            title={_('Clone this Revision into a New Draft')}
            onClick={this.onClone}>
            <span className="rfb-icon icon-clone" />
          </button>
          <ConfirmationModal
            visible={this.state.cloning}
            onAccept={this.onCloneAccepted}
            onReject={this.onCloneRejected}>
            <p>{_(
              'Are you sure you want to create a Draft copy of this Published'
              + ' Revision?'
            )}</p>
          </ConfirmationModal>
        </td>
      </tr>
    );
  }
});


module.exports = VersionTile;

