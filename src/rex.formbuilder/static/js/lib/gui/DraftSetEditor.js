/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var ConfirmationModal = require('./ConfirmationModal');
var TotalFailureModal = require('./TotalFailureModal');
var {format} = require('../util');
var ElementToolbox = require('./ElementToolbox');
var Workspace = require('./Workspace');
var MenuHeader = require('./MenuHeader');
var EditTitleModal = require('./EditTitleModal');
var ToasterMixin = require('./ToasterMixin');
var {DraftSetActions, SettingActions} = require('../actions');
var {DraftSetStore} = require('../stores');
var {ConfigurationError} = require('../errors');
var i18n = require('../i18n');
var _ = i18n.gettext;


var DraftSetEditor = React.createClass({
  mixins: [
    ToasterMixin
  ],

  propTypes: {
    apiBaseUrl: React.PropTypes.string.isRequired,
    uid: React.PropTypes.string,
    channels: React.PropTypes.arrayOf(React.PropTypes.string),
    instrumentMenuUrlTemplate: React.PropTypes.string,
    formPreviewerUrlTemplate: React.PropTypes.string
  },

  getInitialState: function () {
    return {
      configuration: null,
      instrumentVersion: null,
      editingTitle: false,
      publishing: false,
      modified: false,
      valid: false,
      validityError: null,
      configFailure: null
    };
  },

  componentWillMount: function () {
    SettingActions.initialize(this.props);
    if (this.props.uid) {
      DraftSetActions.activate(this.props.uid);
    }
  },

  componentWillReceiveProps: function (nextProps) {
    SettingActions.initialize(nextProps);
    if (this.props.uid) {
      DraftSetActions.activate(nextProps.uid);
    }
  },

  componentDidMount: function () {
    DraftSetStore.addChangeListener(this._onDraftSetChange);
    DraftSetStore.addConfigurationFailureListener(this._onConfigFailure);
  },

  componentWillUnmount: function () {
    DraftSetStore.removeConfigurationFailureListener(this._onConfigFailure);
    DraftSetStore.removeChangeListener(this._onDraftSetChange);
  },

  _onDraftSetChange: function () {
    var draftSet = DraftSetStore.getActive();
    var cfg = DraftSetStore.getActiveConfiguration();

    var valid = true;
    var validityError = null;
    try {
      cfg.checkValidity();
    } catch (exc) {
      if (exc instanceof ConfigurationError) {
        valid = false;
        validityError = exc.message;
      } else {
        throw exc;
      }
    }

    this.setState({
      instrumentVersion: draftSet.instrument_version,
      configuration: cfg,
      modified: DraftSetStore.activeIsModified(),
      valid: valid,
      validityError: validityError
    });
  },

  _onConfigFailure: function (error) {
    this.setState({
      configFailure: error.message
    });
  },

  onReturn: function () {
    window.location = format(
      this.props.instrumentMenuUrlTemplate,
      {uid: this.state.instrumentVersion.instrument.uid}
    );
  },

  onSave: function () {
    DraftSetActions.saveActive();
  },

  onPreview: function () {
    window.open(format(
      this.props.formPreviewerUrlTemplate,
      {
        uid: this.props.uid,
        category: 'draft'
      }
    ));
  },

  onElementsChanged: function (elements) {
    this.state.configuration.elements = elements;
    this.setState({
      configuration: this.state.configuration
    });
  },

  onChangeTitle: function () {
    this.setState({
      editingTitle: true
    });
  },

  onTitleEdit: function (newTitle) {
    DraftSetActions.setAttributes({
      title: newTitle
    });
    this.setState({
      editingTitle: false
    });
  },

  onTitleCancel: function () {
    this.setState({
      editingTitle: false
    }, () => {
      this.refs.modalTitle.reset();
    });
  },

  onPublish: function () {
    this.setState({
      publishing: true
    });
  },

  onPublishAccepted: function () {
    DraftSetActions.publish();
    this.setState({
      publishing: false
    });
  },

  onPublishRejected: function () {
    this.setState({
      publishing: false
    });
  },

  render: function () {
    return (
      <div className="rfb-draftset-editor">
        <MenuHeader
          onClick={this.onChangeTitle}
          title={this.state.configuration && this.state.configuration.title}>
          {this.props.instrumentMenuUrlTemplate &&
            this.state.instrumentVersion &&
            <button
              className='rfb-button'
              onClick={this.onReturn}>
              <span className='rfb-icon icon-go-back' />
              {_('Return to Menu')}
            </button>
          }
          <button
            disabled={!this.state.modified || !this.state.valid}
            className='rfb-button'
            title={
              this.state.validityError
              || _('Save the current state of this Draft to the database')
            }
            onClick={this.onSave}>
            <span className='rfb-icon icon-save' />
            {_('Save')}
          </button>
          <button
            disabled={this.state.modified}
            className='rfb-button'
            title={
              _('Publish the current state of this Draft for use by end-users')
            }
            onClick={this.onPublish}>
            <span className='rfb-icon icon-publish' />
            {_('Publish')}
          </button>
          <ConfirmationModal
            visible={this.state.publishing}
            onAccept={this.onPublishAccepted}
            onReject={this.onPublishRejected}>
            <p>{_(
              'Publishing this Draft will make it publicly available for use'
              + ' in data collection. Are you sure you want to publish this'
              + ' Draft?'
            )}</p>
          </ConfirmationModal>
          {this.props.formPreviewerUrlTemplate &&
            <button
              disabled={this.state.modified}
              className='rfb-button'
              title={_('Explore a rendered, interactive view of this Draft')}
              onClick={this.onPreview}>
              <span className='rfb-icon icon-view' />
              {_('Preview Form')}
            </button>
          }
        </MenuHeader>
        <EditTitleModal
          ref='modalTitle'
          visible={this.state.editingTitle}
          title={this.state.configuration && this.state.configuration.title}
          onComplete={this.onTitleEdit}
          onCancel={this.onTitleCancel}
          />
        {this.state.configFailure ?
          <div className="rfb-draftset-container">
            <TotalFailureModal visible={true}>
              <h4>This Draft Cannot Be Managed Using FormBuilder</h4>
              <p>{this.state.configFailure}</p>
            </TotalFailureModal>
          </div>
          :
          <div className="rfb-draftset-container">
            <ElementToolbox
              />
            <Workspace
              onElementsChanged={this.onElementsChanged}
              />
          </div>
        }
        {this.renderToaster()}
      </div>
    );
  }
});


module.exports = DraftSetEditor;

