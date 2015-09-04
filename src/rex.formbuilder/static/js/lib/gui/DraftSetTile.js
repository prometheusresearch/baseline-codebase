/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var {DraftInstrumentVersionActions} = require('../actions');
var ConfirmationModal = require('./ConfirmationModal');
var {formatDateTime, gettext} = require('../i18n');
var _ = gettext;


var DraftSetTile = React.createClass({
  propTypes: {
    draft: React.PropTypes.object.isRequired,
    onPreview: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      deleting: false,
      cloning: false,
      publishing: false
    };
  },

  onDelete: function () {
    this.setState({
      deleting: true
    });
  },

  onDeleteAccepted: function () {
    DraftInstrumentVersionActions.deleteDraft(this.props.draft);
  },

  onClone: function () {
    this.setState({
      cloning: true
    });
  },

  onCloneAccepted: function () {
    DraftInstrumentVersionActions.cloneDraft(this.props.draft);
    this.setState({
      cloning: false
    });
  },

  onPublish: function () {
    this.setState({
      publishing: true
    });
  },

  onPublishAccepted: function () {
    DraftInstrumentVersionActions.publishDraft(this.props.draft);
    this.setState({
      publishing: false
    });
  },

  cancelConfirmations: function () {
    this.setState({
      deleting: false,
      cloning: false,
      publishing: false
    });
  },

  render: function () {
    return (
      <tr className='rfb-draftset-tile'>
        <td>
          {formatDateTime(this.props.draft.date_created)}
        </td>
        <td>
          {this.props.draft.created_by}
        </td>
        <td>
          {formatDateTime(this.props.draft.date_modified)}
        </td>
        <td>
          {this.props.draft.modified_by}
        </td>
        <td>
          {this.props.draft.parent_instrument_version &&
            this.props.draft.parent_instrument_version.uid}
        </td>
        <td className='rfb-tile-actions'>
          <button
            className='rfb-button rfb-icon-button'
            title={_('Edit this Draft')}
            onClick={this.props.onClick}>
            <span className='rfb-icon icon-edit' />
          </button>
          <button
            className='rfb-button rfb-icon-button'
            title={_('Preview this Draft')}
            onClick={this.props.onPreview}>
            <span className='rfb-icon icon-view' />
          </button>
          <button
            className='rfb-button rfb-icon-button'
            title={_('Clone this Draft')}
            onClick={this.onClone}>
            <span className='rfb-icon icon-clone' />
          </button>
          <ConfirmationModal
            visible={this.state.cloning}
            onAccept={this.onCloneAccepted}
            onReject={this.cancelConfirmations}>
            <p>{_('Are you sure you want to create a copy of this Draft?')}</p>
          </ConfirmationModal>
          <button
            className='rfb-button rfb-icon-button'
            title={_('Publish this Draft')}
            onClick={this.onPublish}>
            <span className='rfb-icon icon-publish' />
          </button>
          <ConfirmationModal
            visible={this.state.publishing}
            onAccept={this.onPublishAccepted}
            onReject={this.cancelConfirmations}>
            <p>{_(
              'Publishing this Draft will make it publicly available for use'
              + ' in data collection. Are you sure you want to publish this'
              + ' Draft?'
            )}</p>
          </ConfirmationModal>
          <button
            className='rfb-button rfb-icon-button'
            title={_('Delete this Draft')}
            onClick={this.onDelete}>
            <span className='rfb-icon icon-delete' />
          </button>
          <ConfirmationModal
            visible={this.state.deleting}
            onAccept={this.onDeleteAccepted}
            onReject={this.cancelConfirmations}>
            <p>{_('Are you sure you want to delete this Draft?')}</p>
          </ConfirmationModal>
        </td>
      </tr>
    );
  }
});


module.exports = DraftSetTile;

