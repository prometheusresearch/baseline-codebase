/**
 * @jsx React.DOM
 */
'use strict';

var React              = require('react');
var ReactForms         = require('react-forms');
var Value              = require('react-forms/lib/Value');
var {OrderedMap}       = require('immutable');
var Form               = ReactForms.Form;
var {Mapping, Dynamic} = ReactForms.schema;
var ButtonGroup        = require('./ButtonGroup');
var Button             = require('./Button');
var ChannelTabs        = require('./ChannelTabs');
var localization       = require('./localization');
var ViewSource         = require('./ViewSource');
var UndoStackMixin     = require('./UndoStackMixin');
var UndoControls       = require('./UndoControls');
var LoadingScreen      = require('./LoadingScreen');
var CommunicatingMixin = require('./CommunicatingMixin');
var InstrumentSchema   = require('./InstrumentSchema');
var ChannelSchema      = require('./ChannelSchema');
var InfoMessage        = require('./InfoMessage');
var mergeInto          = require('./mergeInto');
var buildRecordIndex   = require('./buildRecordIndex');

var FormFieldset = React.createClass({

  render() {
    var {value} = this.props;
    return (
      <div className="rfb-Form">
        <ReactForms.Element value={value.child("instrument")} />
        <div className="rfb-Form__channels">
          <ReactForms.Element value={value.child("channels")} />
        </div>
      </div>
    );
  }
});

var Editor = React.createClass({

  mixins: [UndoStackMixin, CommunicatingMixin],

  getDefaultProps() {
    return {
      localizations: localization.LOCALIZATIONS,
      uid: null,
      type: null,
    };
  },

  isInitialized() {
    return (
      this.state.channels && (
        !this.props.uid ||
        this.props.uid && this.state.serverConfig
      )
    );
  },

  getInitialState() {
    return {
      serverConfig: null,
      channels: null,
      activeChannel: null,
      visibleSource: false,
      infoMessage: null,
    };
  },

  showMessage(text, type) {
    this.setState({
      infoMessage: {
        text: text,
        type: type
      }
    },
    function () {
      if (this._messageTimeout)
        clearTimeout(this._messageTimeout);
      var sec = type === 'info' ? 5 : 10;
      this._messageTimeout = setTimeout(function () {
        this.setState({
          infoMessage: null
        });
      }.bind(this), sec * 1000);
    }.bind(this));
  },

  getFormUID(instrumentVersionUID, channel) {
    // TODO: This is not a right way to get the channel UID by instrument
    // version UID. This should be removed as the right way is found.
    return `(${instrumentVersionUID}).${channel}`;
  },

  getUIDType: function () {
    var ret = {
      uid: null,
      type: null
    };
    if (this.state.uid && this.state.type) {
      ret.uid = this.state.uid;
      ret.type = this.state.type;
    }
    else if (this.props.uid && this.props.type) {
      ret.uid = this.props.uid;
      ret.type = this.props.type;
    }
    return ret;
  },

  componentDidMount() {
    this.apiRequest({
      path: 'channel',
      success: function (data) {
        var channels = data;
        channels.forEach((channel) => {
          channel.enabled = false;
        });
        var newState = {
          activeChannel: channels.length ? channels[0].uid : null,
          channels: channels,
          serverConfig: null,
        };
        var {uid, type} = this.getUIDType();
        if (uid && type) {
          var path = type === 'published' ?
                        'instrumentversion': 'draftinstrumentversion';
          path += '/' + uid;
          this.apiRequest({
            path: path,
            success: function (instrumentData) {
              var uid = instrumentData.uid;
              this.instrumentDataToState(instrumentData, type, newState);
              var checked = 0;
              var checkFinish = function () {
                if (++checked == channels.length) {
                  this.setState(newState);
                }
              }.bind(this);

              // TODO: find the right way to get form configuration by instrument version
              //   instead of using manually created form identifiers
              channels.forEach(function (channel) {
                var { uid, type } = this.getUIDType();
                var path = type === 'published' ? 'form' : 'draftform';
                path += '/' + this.getFormUID(uid, channel.uid);
                this.apiRequest({
                  path: path,
                  success: function (formConfiguration) {
                    channel.enabled = true;
                    newState.serverConfig.forms[channel.uid] = formConfiguration;
                    console.log('formConfiguration', formConfiguration);
                    checkFinish();
                  }.bind(this),
                  error: function (xhr, status, err) {
                    if (xhr.status !== 404) {
                      this.setState({loadingError: 'Error loading channel configuration'});
                      return;
                    }
                    checkFinish();
                  }
                });
              }.bind(this));
            },
            error: 'Error loading instrument definition'
          });
        } else
          this.setState(newState);
      },
      error:'Error loading channels'
    });
  },

  toggleChannel: function (uid) {
    var newChannels = [];
    this.state.channels.forEach((channel) => {
      if (channel.uid === uid) {
        var newChannel = {};
        mergeInto(newChannel, channel);
        newChannel.enabled = !channel.enabled;
        newChannels.push(newChannel);
      }
      else
        newChannels.push(channel);
    });
    this.setState({
      channels: newChannels
    });
  },

  getStateSnapshot() {
    var value = this.refs.form.getValue();
    return {value};
  },

  setStateSnapshot({value}) {
    this.refs.form.setValue(value);
  },

  onFormChanged(value, result) {
    if (this.refs.btnPublish)
      this.refs.btnPublish.enable(false);
    if (this.props.undoRedo) {
      this.snapshot({value});
    }
  },

  onChannelSelected(activeChannel) {
    this.setState({activeChannel});
  },

  onViewSource() {
    this.setState({visibleSource: true});
  },

  onHideSource() {
    this.setState({visibleSource: false});
  },

  savedDataToState: function (instrumentData, channelsData, state) {
    this.instrumentDataToState(instrumentData, 'drafts', state);
    for (var name in channelsData) {
      if (channelsData.hasOwnProperty(name)) {
        var channel = channelsData[name];
        state.serverConfig.forms[channel.uid] = channel;
      }
    }
  },

  instrumentDataToState(instrumentData, type, state) {
    state.uid = instrumentData.uid;
    state.type = type;
    state.serverConfig = {
      instrument: instrumentData,
      forms: {},
      uid: instrumentData.uid
    };
  },

  rollbackSavedData(savedInstrument, savedChannels) {
    // TODO: ...
  },

  deleteChannelIfExist(ctx, ivUID, name, checkIfFinished) {
    var onSuccess = function (answer) {
      console.log('channel', name, 'does not exist');
      ++ctx.success;
      checkIfFinished(ctx);
    }.bind(this);

    var onError = function (xhr, status, err) {
      var message = xhr.responseJSON && xhr.responseJSON.error;
      this.showMessage(message || 'Unable to delete channel: ' + name, 'error');
      console.log('Unable to delete channel configuration:', name, '.', xhr, status, err);
      ++ctx.errors;
      checkIfFinished(ctx);
    }.bind(this);

    this.apiRequest({
      path: 'draftform/' + this.getFormUID(ivUID, name),
      type: 'DELETE',
      data: {},
      success: onSuccess,
      error: function (xhr, status, err) {
        if (xhr.status == 404) {
          onSuccess({});
          return;
        }
        onError(xhr, status, err);
      }
    });
  },

  saveChannel(ctx, ivUID, name, channelValue, checkIfFinished) {
    var onSuccess = function (answer) {
      console.log('channel', name, 'saved');
      ++ctx.success;
      ctx.savedChannels[name] = answer;
      checkIfFinished(ctx);
    }.bind(this);

    var onError = function (xhr, status, err) {
      var message = xhr.responseJSON && xhr.responseJSON.error;
      this.showMessage(message || 'Unable to save channel: ' + name, 'error');
      console.log('Unable to save channel:', name);
      ++ctx.errors;
      checkIfFinished(ctx);
    }.bind(this);

    this.apiRequest({
      path: 'draftform/' + this.getFormUID(ivUID, name),
      type: 'PUT',
      data: {
        configuration: channelValue,
      },
      success: onSuccess,
      error: function (xhr, status, err) {
        console.log('Channel configuration', name, 'doesn\'t exist. Trying to create.');
        console.log('arguments', arguments);
        if (xhr.status !== 404)
          onError(xhr, status, err);

        this.apiRequest({
          path: 'draftform',
          type: 'POST',
          data: {
            configuration: channelValue,
            channel: name,
            draft_instrument_version: ivUID,
          },
          success: onSuccess,
          error: onError,
        });
      }
    });
  },

  onInstrumentDataReceived: function (inInstrumentData, outChannelsData) {
    var ctx = {
      savedChannels: {},
      success: 0,
      errors: 0,
    };

    var checkIfFinished = function (ctx) {
      var total = this.state.channels.length;
      if (ctx.success + ctx.errors == total) {
        if (ctx.errors) {
          for (var name in ctx.savedChannels) {
            if (ctx.savedChannels.hasOwnProperty(name)) {
              this.rollbackSavedData(inInstrumentData, outChannelsData);
            }
          }
          // this.showMessage('An error occured during saving', 'error');
          return;
        }
        var newState = {};
        this.savedDataToState(inInstrumentData, ctx.savedChannels, newState);
        this.setState(newState, function () {
          window.history.replaceState('state', 'Formbuilder',
            this.getEditURL('drafts', inInstrumentData.uid));
          this.showMessage('Instrument saved successfully.', 'info');
          if (this.refs.btnPublish)
            this.refs.btnPublish.enable(true);
        }.bind(this));
      }
    }.bind(this);

    this.state.channels.forEach((channel) => {
      var ivUID = inInstrumentData.uid;
      if (channel.enabled)
        this.saveChannel(ctx, ivUID, channel.uid,
                         outChannelsData[channel.uid], checkIfFinished);
      else
        this.deleteChannelIfExist(ctx, ivUID, channel.uid, checkIfFinished);
    });
  },

  getValueStat: function (value) {
    var stat = {records: {  }};
    var channelUse = {};
    this.state.channels.forEach((channel) => {
      if (channel.enabled)
        channelUse[channel.uid] = 0;
    });
    var createRecordStat = function (defined, used) {
      var channels = {};
      mergeInto(channels, channelUse);
      return ({channels, defined, used});
    };
    for (var i in value.instrument.record) {
      var record = value.instrument.record[i];
      if (stat.records[record.id])
        ++stat.records[record.id].defined;
      else
        stat.records[record.id] = createRecordStat(1, 0);
    }
    for (var name in value.channels) {
      if (value.channels.hasOwnProperty(name)) {
        var channel = value.channels[name];
        if (!channel)
          continue;
        if (channel.unprompted) {
          for (var itemName in channel.unprompted) {
            if (channel.unprompted.hasOwnProperty(itemName)) {
              var record = stat.records[itemName];
              if (record) {
                ++record.used;
                ++record.channels[name];
              }
              else
                stat.records[itemName] = createRecordStat(0, 1);
            }
          }
        }
        if (!channel.pages)
          continue;
        for (var i in channel.pages) {
          var page = channel.pages[i];
          if (!page.elements)
            continue;
          for (var j in page.elements) {
            var element = page.elements[j];
            var options = element.options;
            if (!options)
              continue;
            if (options.fieldId) {
              var record = stat.records[options.fieldId];
              if (record) {
                ++record.used;
                ++record.channels[name];
              }
              else
                stat.records[options.fieldId] = createRecordStat(0, 1);
            }
          }
        }
      }
    }
    return stat;
  },

  getOutputValue: function () {
    var value = this.refs.form.getValue();
    for (var name in value.channels) {
      if (value.channels.hasOwnProperty(name)) {
        var channel = value.channels[name];
        if (!channel || !channel.pages)
          continue;
        for (var i in channel.pages) {
          var page = channel.pages[i];
          if (!page.elements)
            continue;
          for (var j in page.elements) {
            var element = page.elements[j];
            var options = element.options;
            if (!options)
              continue;
            var events = options.events;
            if (events === null ||
                events instanceof Array && events.length == 0) {
                delete options['events'];
            }
          }
        }
      }
    }
    return value;
  },

  onPublish() {
    var formValue = this.getOutputValue();
    var validation = this.refs.form.getValidation();
    var isSuccess = validation.isSuccess;
    if (!isSuccess) {
      this.showMessage('Please fix invalid fields and save before publishing', 'error');
      return;
    }

    var {uid, type} = this.getUIDType();
    if (type === 'published') {
      this.showMessage('Unable to publish already published instrument', 'error');
      return;
    }

    var totalChannelsPublished = 0;
    var totalToPublish = 0;
    this.state.channels.forEach((channel) => {
      if (channel.enabled)
        ++totalToPublish;
    });
    var checkIfFinished = function (newInstrumentUID) {
      if (totalChannelsPublished == totalToPublish) {
        this.showMessage('Instrument published successfully', 'info');
        if (this.refs.btnPublish)
          this.refs.btnPublish.enable(false);
        window.location.href = this.getEditURL('published', newInstrumentUID);
      }
    }.bind(this);

    var path = 'draftinstrumentversion/' + uid + '/publish';
    console.log('path', path);
    this.apiRequest({
      path: path,
      type: 'POST',
      data: {},
      success: function (answer) {
        if (answer.status !== 'SUCCESS') {
          this.showMessage('Error publishing instrument', 'error');
          return;
        }
        var publishedInstrumentUID = answer.instrument_version.uid;
        this.state.channels.forEach(function (channel) {
          if (!channel.enabled)
            return;
          var body = {
            instrument_version: answer.instrument_version.uid
          };
          this.apiRequest({
            path: 'draftform/' + this.getFormUID(uid, channel.uid) + '/publish',
            type: 'POST',
            data: body,
            success: function (answer) {
              ++totalChannelsPublished;
              checkIfFinished(publishedInstrumentUID);
            },
            error: function (xhr, status, err) {
              var message = xhr.responseJSON && xhr.responseJSON.error;
              this.showMessage(message || 'Error publishing instrument', 'error');
              console.log('unable to publish channel:', arguments);
            },
          });
        }.bind(this));
      }.bind(this),
      error: function (xhr, status, err) {
        var message = xhr.responseJSON && xhr.responseJSON.error;
        this.showMessage(message || 'Error publishing instrument', 'error');
        console.log('unable to publish instrument:', arguments);
      }
    });

  },

  countEnabledChannels() {
    var count = 0;
    this.state.channels.forEach((channel) => {
      if (channel.enabled)
        ++count;
    });
    return count;
  },

  onSave() {
    var serverConfig = this.state.serverConfig || {};
    var serverInstrument = serverConfig.instrument || {};
    var formValue = this.getOutputValue();
    var validation = this.refs.form.getValidation();
    var isSuccess = validation.isSuccess;
    console.log('Validation:', validation.toJS(), 'isSuccess:',
                validation.isSuccess, 'formValue', formValue);
    if (!isSuccess) {
      this.showMessage('Please fix invalid fields before saving', 'error');
      return;
    }

    var totalEnabled = this.countEnabledChannels();
    if (totalEnabled) {
      var stat = this.getValueStat(formValue);
      for (var name in stat.records) {
        if (stat.records.hasOwnProperty(name)) {
          var recordStat = stat.records[name];
          if (recordStat.used == 0) {
            this.showMessage(`Fix it: instrument field '${name}'` +
                             ' is never used', 'error');
            return;
          }
          var channelStat = recordStat.channels;
          for (var chanName in channelStat) {
            if (channelStat.hasOwnProperty(chanName)) {
              var used = channelStat[chanName];
              if (used == 0) {
                this.showMessage(`Fix it: instrument field '${name}'` +
                                 ` is never used in the '${chanName}' channel`, 'error');
                return;
              }
              else if (used > 1) {
                this.showMessage(`Fix it: instrument field '${name}' can not be` +
                                 ` used more than once in the '${chanName}' channel`, 'error');
                return;
              }
            }
          }
          if (recordStat.defined == 0) {
            this.showMessage(`Fix it: instrument field '${name}' is used but never defined`,
                             'error');
            return;
          }
        }
      }
      console.log('stat', stat);
    }

    var definition = formValue.instrument;
    var body, path, method;
    var {uid, type} = this.getUIDType();
    if (type === 'published') {
      body = this.instrumentVersionMeta(serverInstrument.instrument.uid,
                definition, this.props.user, this.props.user, null);
      path = 'draftinstrumentversion';
      method = 'POST';
    }
    else {
      body = {
        modified_by: this.props.user,
        definition: definition
      };
      path = 'draftinstrumentversion/' + uid;
      method = 'PUT';
    }
    console.log('body', body);
    this.apiRequest({
      path: path,
      type: method,
      data: body,
      success: function (answer) {
        this.onInstrumentDataReceived(answer, formValue.channels);
      }.bind(this),
      error: function (xhr, status, err) {
        var message = xhr.responseJSON && xhr.responseJSON.error;
        this.showMessage(message || 'Error saving instrument', 'error');
        console.log('unable to save:', arguments);
      }
    });
  },

  getInitialValue() {
    if (!this.props.uid) {
      return null;
    }
    var value = {
      instrument: this.state.serverConfig.instrument.definition,
      channels: {},
    };
    var forms = this.state.serverConfig.forms;
    var channels = this.state.channels;
    for (var i in channels) {
      var channel = channels[i];
      var uid = channel.uid;
      value.channels[uid] = forms[uid] ? forms[uid].configuration : undefined;
    }
    for (var key in forms) {
      if (forms.hasOwnProperty(key)) {
        value.channels[key] = forms[key].configuration;
      }
    }
    return value;
  },

  render() {
    var initialized = this.isInitialized();
    var {uid, type} = this.getUIDType();
    var isPublished = type === 'published';
    return (
      <div className="rfb-area">
        {initialized ?
          <div>
            <div className="rfb-head">
              <div className="rfb-head-actions">
                <a className="rfb-return" href={this.props.home}>Return to all instruments list</a>
                {this.undoUndo &&
                  <span className="rfb-undo-redo">
                    <UndoControls
                      hasUndo={this.hasUndo()}
                      hasRedo={this.hasRedo()}
                      onUndo={this.undo}
                      onRedo={this.redo} />
                  </span>
                }
                <ButtonGroup>
                  <Button onClick={this.onSave}>{isPublished ? 'Create Draft': 'Save'}</Button>
                  {/*<Button disabled={true}>Test</Button>*/}
                  <Button onClick={this.onViewSource}>Source</Button>
                </ButtonGroup>
                {!isPublished &&
                  <span className="rfb-publish">
                    <Button ref="btnPublish" onClick={this.onPublish}>Publish</Button>
                  </span>}
              </div>
            </div>
            <ChannelTabs channels={this.state.channels}
                         active={this.state.activeChannel}
                         onChannelSelected={this.onChannelSelected} />
            {this.renderForm()}
            {this.state.infoMessage &&
              <InfoMessage message={this.state.infoMessage.text}
                           type={this.state.infoMessage.type} />}
          </div>
          :
          <LoadingScreen error={this.state.loadingError} />
        }
      </div>
    );
  },

  renderForm() {
    var schema = EditorSchema({
      onToggleChannel: this.toggleChannel,
      instrument: this.state.serverConfig.instrument,
      channels: this.state.channels,
      activeChannel: this.state.activeChannel,
      localizations: this.props.localizations
    });
    var value = this.getInitialValue();
    return (
      <div>
        <Form
          schema={schema}
          ref="form"
          defaultValue={value}
          onUpdate={this.onFormChanged}
          />
        {this.state.visibleSource && this.renderSource()}
      </div>
    )
  },

  renderSource() {
    var value = this.getOutputValue();
    var tabs = [{
      id: 'instrument',
      title: 'Instrument',
      content: value.instrument ? JSON.stringify(value.instrument, null, '  ') : ''
    }];
    var valueChannels = value.channels || {};
    for (var i in this.state.channels) {
      var channel = this.state.channels[i];
      if (!channel.enabled)
        continue;
      var content = valueChannels[channel.uid] ?
        JSON.stringify(valueChannels[channel.uid], null, '  ') : '';
      tabs.push({
        'id': channel.uid,
        'title': channel.title,
        'content': content
      });
    }
    return (
      <ViewSource
        onClose={this.onHideSource}
        tabs={tabs}
        />
    );
  }

});

function EditorSchema(props) {
  return Dynamic(function(value) {
    var instrument = value.get('instrument');
    var instrumentDef = props.instrument.definition;
    var instrumentRef = {
      id: instrumentDef.id,
      version: instrumentDef.version
    };
    var records = buildRecordIndex(instrument.get('record'));
    var channels = {};
    props.channels.forEach((channel) => {
      var enabled = channel.enabled || false;
      var active = channel.uid === props.activeChannel;
      channels[channel.uid] = ChannelSchema({
        active,
        enabled,
        onToggleChannel: props.onToggleChannel.bind(null, channel.uid),
        localizations: props.localizations,
        instrumentRef,
        records
      });
    });
    return Mapping({component: FormFieldset}, {
      instrument: InstrumentSchema(),
      channels: Mapping({forceUpdate: false}, channels)
    });
  });
}

module.exports = Editor;
