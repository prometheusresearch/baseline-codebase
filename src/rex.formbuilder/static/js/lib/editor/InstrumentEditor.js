/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var cx            = React.addons.classSet;
var Button        = require('../Button');
var Icon          = require('../Icon');
var Section       = require('./Section');
var YAMLEditor    = require('./YAMLEditor');
var API           = require('../API');
var LoadingScreen = require('../LoadingScreen');
var ChannelTabs   = require('./ChannelTabs');
var format        = require('../format');
var PropTypes     = React.PropTypes;
var Applet        = require('rex-applet');

var Editor = React.createClass({

  propTypes: {
    home: PropTypes.string.isRequired,
    indexURL: PropTypes.string.isRequired,
    editorURLTemplate: PropTypes.string.isRequired,
    uid: PropTypes.string.isRequired,
    group: PropTypes.string.isRequired
  },

  getDefaultProps() {
    return {
      home: '',
      onSwitchInstrument: function () {},
    };
  },

  getInitialState() {
    return {
      changed: false,
      operationInProgress: false,
      activeChannel: null,
      channels: null,
      instrument: null,
      forms: {},
      instrumentName: null,
      version: null,
    };
  },

  componentDidMount() {
    API.home = this.props.home;
    this.loadData();
  },

  loadData() {
    var {uid, group} = this.props;
    API.listChannels().then(
      this.onChannelsLoaded.bind(this, uid, group),
      this.onLoadingError
    );
  },

  showMessage(message, type) {
    var kind = type || 'error';
    var icon = kind === 'error' ? 'exclamation-sign' : null;
    var ttl = Infinity;
    Applet.Actions.showNotification(message, {icon, kind, ttl});
  },

  showResponseError(response, text) {
    response = response.response;
    var details = 'Unknown error';
    if (response.body instanceof Object &&
        response.body.error) {
      details = response.body.error;
    } else if (response.text) {
      details = response.text;
    }
    var text = `${text}: ${details}`;
    this.showMessage(text, 'error');
  },

  redirectTo(uid, group) {
    var url = format(this.props.editorURLTemplate, {
      uid: encodeURIComponent(uid),
      group: encodeURIComponent(group)
    });
    window.location.href = url;
  },

  renderHead() {
    var {uid, group, indexURL} = this.props;
    var {changed, operationInProgress} = this.state;
    var isPublished = group === "published";
    return (
      <div className="rfb-Editor__head">
        <div className="rfb-Editor__title">
          {uid}
          <span className="rfb-dark-text">
            {isPublished ? '(Published)' : '(Draft)'}
          </span>
          {changed && '*'}
        </div>
        <div className="rfb-Editor__headActions">
          <a className="rfb-Editor__return" href={indexURL}>
            Return to all instruments list
          </a>
          <Button
            onClick={isPublished ? this.onCreateDraft : this.onSave}
            disabled={!(uid && group) || operationInProgress || !changed}>
            {isPublished ? 'Draft': 'Save'}
          </Button>
          {!isPublished && 
              <Button
                className="rfb-Editor__publish"
                onClick={this.onPublish}
                disabled={!uid || changed || operationInProgress}>
                Publish
              </Button>}
        </div>
      </div>
    );
  },

  renderLayout(instrumentEditor, formsArea) {
    return (
      <div className="rfb-Editor__layout">
        <div className="rfb-Editor__instrument">
          {instrumentEditor}
        </div>
        <div className="rfb-Editor__forms">
          {formsArea}
        </div>
      </div>
    )
  },

  render() {
    var {uid, group} = this.props;
    var {channels, activeChannel, instrument, forms,
         operationInProgress} = this.state;
    var initialized = channels && instrument;
    var isPublished = group === "published";
    var classSet = {
      'rfb-Editor': true,
      'rfb-Editor--loading': !initialized
    };
    var channelEditors = !initialized ? [] : channels.map(channel => {
      var form = forms[channel.uid] || '';
      return (
        <YAMLEditor onChange={this.onFormChanged.bind(this, channel.uid)}
                    hidden={channel.uid !== activeChannel}
                    readOnly={isPublished || operationInProgress}
                    value={form} />
      );
      if (configuration)
        channelsValid = channelsValid && configuration.isValid;
    });
    var instrumentArea = (
      <Section title="Instrument:">
        <YAMLEditor onChange={this.onInstrumentChanged}
                    readOnly={isPublished || operationInProgress}
                    value={instrument} />
      </Section>
    );
    var layout;
    var channelTabs = (
      <div className="rfb-Editor__formControls">
        <ChannelTabs
          channels={channels}
          onChannelSelected={this.onChannelSelected}
          active={activeChannel}
          />
        <Button disabled={operationInProgress}
           onClick={this.onEmptyFormTemplate}>
          Empty Template
        </Button>
      </div>
    );
    var formsArea = (
      <Section title="Forms:" head={channelTabs}>
        {channelEditors}
      </Section>
    );
    layout = this.renderLayout(instrumentArea, formsArea);
    return (
      <div className={cx(classSet)}>
        {!initialized ?
          <LoadingScreen
            error={this.state.loadingError}
            />:
          <div className="rfb-Editor__workarea">
            {this.renderHead()}
            <div className="rfb-Editor__body">
              {layout}
            </div>
          </div>
        }
      </div>
    );
  },

  onEmptyFormTemplate() {
    var {instrumentName, version, activeChannel, forms} = this.state;
    if (forms[activeChannel] &&
      !confirm("Do you really want to replace the form "
             + "configuration with an empty template?"))
      return;
    var template = "\
defaultLocalization: en\n\
instrument:\n\
  id: \"urn:${instrument}\"\n\
  version: '${version}'\n\
pages:\n\
- id: page1\n\
  elements:\n\
  - type: question\n\
    options:\n\
      fieldId: DUMMY\n\
      text:\n\
        en: TEXT\n\
";
    var value = format(template, {
      instrument: instrumentName,
      version
    });
    this.onFormChanged(activeChannel, value);
  },

  onInstrumentChanged(value) {
    this.setState({
      changed: true,
      instrument: value
    });
  },

  onFormChanged(uid, value) {
    var directive = {};
    directive[uid] = {
      $set: value
    };
    var forms = this.state.forms;
    var forms = React.addons.update(this.state.forms, directive);
    this.setState({
      changed: true,
      forms: forms
    });
  },

  onSetLoaded(uid, group, channelList, response) {
    var newState = {
      channels: channelList,
      activeChannel: channelList.length ? channelList[0].uid : null
    };
    var body = response.body;
    var instrumentVersion = body.instrument_version;
    newState.instrumentName = instrumentVersion.instrument.code;
    newState.instrument = instrumentVersion.definition;
    newState.version = instrumentVersion.version;
    newState.forms = {};
    for (var name in body.forms) {
      if (body.forms.hasOwnProperty(name)) {
        newState.forms[name] = body.forms[name].configuration;
      }
    }
    this.setState(newState);
  },

  onChannelsLoaded(uid, group, response) {
    var channels = response.body;
    API.getSet(uid, group).then(
      this.onSetLoaded.bind(this, uid, group, channels),
      this.onLoadingError
    );
  },

  onLoadingError(response) {
    this.showResponseError(response, "Loading error");
  },

  onChannelSelected(channel) {
    this.setState({
      activeChannel: channel
    });
  },

  _prepareData() {
    var {uid, group} = this.props;
    var {channels, instrument, forms} = this.state;
    var outForms = {};
    channels.forEach((channel) => {
      var value = forms[channel.uid];
      if (value && !/^\s*$/.test(value))
        outForms[channel.uid] = value;
    });
    return {instrument, forms};
  },

  onSave() {
    var {instrument, forms} = this._prepareData();
    this.setState({
      operationInProgress: true
    }, function () {
      API.saveInstrumentAndForms(this.props.uid, instrument, forms)
         .then(
           this.onSaved,
           this.onSaveError
         );
    });
  },

  onSaved() {
    this.setState({
      changed: false,
      operationInProgress: false
    })
  },

  onSaveError(response) {
    this.showResponseError(response, "Saving error");
    this.setState({
      operationInProgress: false
    });
  },

  onDraftCreationError(response) {
    this.showResponseError(response, "Draft creating error");
  },

  onDraftCreated(response) {
    var uid = response.body.instrument_version.uid;
    this.redirectTo(uid, 'drafts');
  },

  onCreateDraft() {
    if (!confirm("Do you really want to create a draft of this instrument?"))
      return;
    var {uid} = this.props;
    var {instrumentName} = this.state;
    var {instrument, forms} = this._prepareData();

    API.createDraftset(instrumentName, uid, instrument, forms)
      .then(
        this.onDraftCreated,
        this.onDraftCreationError
      );
  },

  onPublished(response) {
    var uid = response.body.instrument_version.uid;
    this.redirectTo(uid, 'published');
    this.setState({
      operationInProgress: false
    });
  },

  onPublishError(response) {
    this.showResponseError(response, "Publishing error");
    this.setState({
      operationInProgress: false
    });
  },

  onPublish() {
    if (!confirm("Do you really want to publish this instrument?"))
      return;
    this.setState({
      operationInProgress: true
    }, function () {
      var {uid} = this.props;
      API.publishInstrumentAndForms(uid).then(
        this.onPublished,
        this.onPublishError
      );
    });
  }

});

module.exports = Editor;
