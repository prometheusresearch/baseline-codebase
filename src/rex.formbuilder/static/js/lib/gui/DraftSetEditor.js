/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');

var ConfirmationModal = require('./ConfirmationModal');
var TotalFailureModal = require('./TotalFailureModal');
var {format} = require('../util');
var ElementToolbox = require('./ElementToolbox');
var ElementWorkspace = require('./ElementWorkspace');
var CalculationToolbox = require('./CalculationToolbox');
var CalculationWorkspace = require('./CalculationWorkspace');
var MenuHeader = require('./MenuHeader');
var FormSettingsModal = require('./FormSettingsModal');
var ToasterMixin = require('./ToasterMixin');
var {DraftSetActions, SettingActions, ErrorActions, I18NActions} = require('../actions');
var {DraftSetStore} = require('../stores');
var {ConfigurationError} = require('../errors');
var i18n = require('../i18n');
var _ = i18n.gettext;


var MODE_CALCULATIONS = 'CALC';
var MODE_FORM = 'FORM';


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
      editMode: MODE_FORM,
      configuration: null,
      instrumentVersion: null,
      editingSettings: false,
      publishing: false,
      modified: false,
      valid: false,
      validityError: null,
      configFailure: null
    };
  },

  componentWillMount: function () {
    SettingActions.initialize(this.props);
    I18NActions.initialize();
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
    DraftSetStore.addPublishListener(this._onPublish);
    window.addEventListener('beforeunload', this._onWindowUnload);
  },

  componentWillUnmount: function () {
    window.removeEventListener('beforeunload', this._onWindowUnload);
    DraftSetStore.removePublishListener(this._onPublish);
    DraftSetStore.removeConfigurationFailureListener(this._onConfigFailure);
    DraftSetStore.removeChangeListener(this._onDraftSetChange);
  },

  _onWindowUnload: function (event) {
    if (this.state.modified) {
      var msg = _(
        'You\'ve made changes to this Draft, but haven\'t saved them yet.'
      );
      event.returnValue = msg;
      return msg;
    }
  },

  _onDraftSetChange: function () {
    var draftSet = DraftSetStore.getActive();
    var cfg = DraftSetStore.getActiveConfiguration();

    var valid = true;
    var validityError = null;
    if (cfg) {
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

  _onPublish: function () {
    this.onReturn();
  },

  onReturn: function () {
    window.location = format(
      this.props.instrumentMenuUrlTemplate,
      {uid: this.state.instrumentVersion.instrument.uid}
    );
  },

  onModeSwitch: function () {
    if (this.state.editMode === MODE_FORM) {
      this.setState({
        editMode: MODE_CALCULATIONS
      });
    } else {
      this.setState({
        editMode: MODE_FORM
      });
    }
  },

  onSave: function () {
    if (this.state.modified && this.state.valid) {
      DraftSetActions.saveActive();
    } else if (!this.state.valid) {
      ErrorActions.report(
        _('Cannot save this Draft in its current state'),
        null,
        this.state.validityError
      );
    }
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

  onFormSettings: function () {
    this.setState({
      editingSettings: true
    });
  },

  onSettingsDone: function () {
    this.setState({
      editingSettings: false
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
    var workspace, toggleTitle, toggleLabel;
    var toggleClasses = {'rfb-icon': true};
    if (this.state.editMode === MODE_FORM) {
      toggleTitle = _('Switch to the Calculations Editor');
      toggleLabel = _('Edit Calculations');
      toggleClasses = classNames(toggleClasses, 'icon-mode-calculations');

      workspace = (
        <div className="rfb-draftset-container">
          <ElementToolbox />
          <ElementWorkspace />
        </div>
      );
    } else if (this.state.editMode === MODE_CALCULATIONS) {
      toggleTitle = _('Switch to the Form Editor');
      toggleLabel = _('Edit Form');
      toggleClasses = classNames(toggleClasses, 'icon-mode-form');

      workspace = (
        <div className="rfb-draftset-container">
          <CalculationToolbox />
          <CalculationWorkspace />
        </div>
      );
    }

    var saveButtonClasses = classNames('rfb-button', {
      'rfb-button__disabled': !this.state.modified || !this.state.valid
    });

    var formTitle = null;
    if (this.state.configuration) {
      formTitle = this.state.configuration.title[
        this.state.configuration.locale
      ];
    }

    return (
      <div className="rfb-draftset-editor">
        <MenuHeader
          title={formTitle}>
          {this.props.instrumentMenuUrlTemplate &&
            this.state.instrumentVersion &&
            <button
              className="rfb-button"
              onClick={this.onReturn}>
              <span className="rfb-icon icon-go-back" />
              {_('Return to Menu')}
            </button>
          }
          {this.state.editMode === MODE_FORM &&
            <button
              disabled={!this.state.configuration}
              className="rfb-button"
              title={_('Edit the high-level Form settings')}
              onClick={this.onFormSettings}>
              <span className="rfb-icon icon-edit" />
              {_('Form Settings')}
            </button>
          }
          <button
            className="rfb-button"
            title={toggleTitle}
            onClick={this.onModeSwitch}>
            <span className={toggleClasses} />
            {toggleLabel}
          </button>
          <button
            className={saveButtonClasses}
            title={
              this.state.validityError
              || _('Save the current state of this Draft to the database')
            }
            onClick={this.onSave}>
            <span className="rfb-icon icon-save" />
            {_('Save')}
          </button>
          {this.props.formPreviewerUrlTemplate &&
            <button
              disabled={this.state.modified || !this.state.valid}
              className="rfb-button"
              title={_('Explore a rendered, interactive view of this Draft')}
              onClick={this.onPreview}>
              <span className="rfb-icon icon-view" />
              {_('Preview Form')}
            </button>
          }
          <button
            disabled={this.state.modified || !this.state.valid}
            className="rfb-button"
            title={
              _('Publish the current state of this Draft for use by end-users')
            }
            onClick={this.onPublish}>
            <span className="rfb-icon icon-publish" />
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
        </MenuHeader>
        {this.state.configuration && this.state.editingSettings &&
          <FormSettingsModal
            ref="modalSettings"
            visible={this.state.editingSettings}
            onComplete={this.onSettingsDone}
            onCancel={this.onSettingsDone}
            />
        }
        {this.state.configFailure ?
          <div className="rfb-draftset-container">
            <TotalFailureModal visible={true}>
              <h4>This Draft Cannot Be Managed Using FormBuilder</h4>
              <p>{this.state.configFailure}</p>
              <button
                className="rfb-button"
                onClick={this.onReturn}>
                {_('Go Back')}
              </button>
            </TotalFailureModal>
          </div>
          :
          workspace
        }
        {this.renderToaster()}
      </div>
    );
  }
});


module.exports = DraftSetEditor;

