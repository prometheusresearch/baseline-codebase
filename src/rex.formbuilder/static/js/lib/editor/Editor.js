/**
 * @jsx React.DOM
 */
'use strict';

var Reflux           = require('reflux');
var React            = require('react/addons');
var cx               = React.addons.classSet;
var ButtonGroup      = require('../ButtonGroup');
var Button           = require('../Button');
var ViewSource       = require('../ViewSource');
var UndoControls     = require('../UndoControls');
var LoadingScreen    = require('../LoadingScreen');
var API              = require('../API');
var InstrumentStore  = require('./InstrumentStore');
var ChannelStore     = require('./ChannelStore');
var InstrumentEditor = require('./InstrumentEditor');
var ChannelEditor    = require('./ChannelEditor');
var UndoStore        = require('./UndoStore');
var Actions          = require('./Actions');
var {OrderedMap}     = require('immutable');

var Editor = React.createClass({

  mixins: [
    Reflux.connect(InstrumentStore, 'instrument'),
    Reflux.connect(ChannelStore, 'channels'),
    Reflux.connect(UndoStore, 'undo')
  ],

  render() {
    var {uid, group} = this.props;
    var {channels, instrument, visibleSource} = this.state;
    var initialized = channels.isInitialized && instrument.isInitialized;
    var isPublished = group === 'published';
    var className = cx({
      'rfb-Editor': true,
      'rfb-Editor--loading': !initialized
    });
    return (
      <div className={className}>
        {!initialized &&
          <LoadingScreen
            type="dark"
            error={this.state.loadingError}
            />}
        <div className="rfb-Editor__workarea">
          <div className="rfb-Editor__head">
            <div className="rfb-Editor__headActions">
              <a className="rfb-Editor__return" href={this.props.home}>
                Return to all instruments list
              </a>
              <span className="rfb-Editor__undoRedo">
                <UndoControls
                  hasUndo={this.state.undo.undo.size > 0}
                  hasRedo={this.state.undo.redo.size > 0}
                  onUndo={this.onUndo}
                  onRedo={this.onRedo}
                  />
              </span>
              <ButtonGroup>
                <Button
                  onClick={isPublished ? this.onCreateDraft : this.onSave}
                  disabled={!(uid && group)}>
                  {isPublished ? 'Draft': 'Save'}
                </Button>
                <Button
                  onClick={this.showSource}
                  disabled={!(uid && group)}>
                  Source
                </Button>
              </ButtonGroup>
              {!isPublished && 
                <span className="rfb-Editor__publish">
                  <Button
                    onClick={this.onPublish}
                    disabled={!uid}>
                    Publish
                  </Button>
                </span>}
            </div>
          </div>
          <div className="rfb-Editor__tools">
            <InstrumentEditor
              className="rfb-Editor__instrument"
              instrument={instrument}
              />
            <ChannelEditor
              className="rfb-Editor__channel"
              channels={channels}
              />
            {visibleSource &&
              <ViewSource
                instrumentDefinition={instrument.definition}
                channelConfigurations={channels.channels.map(chan => chan.configuration)}
                onClose={this.hideSource}
                />}
          </div>
        </div>
      </div>
    );
  },

  getInitialState() {
    return {
      visibleSource: false
    };
  },

  componentDidMount() {
    var {uid, group, localizations} = this.props;
    if (localizations)
      Actions.setLocalizations(OrderedMap(localizations));
    Actions.dataLoad(uid, group);
  },

  onUndo() {
    if (this.state.undo.undo.size === 0) {
      return;
    }
    Actions.undo();
  },

  onRedo() {
    if (this.state.undo.redo.size === 0) {
      return;
    }
    Actions.redo();
  },

  showSource() {
    this.setState({visibleSource: true});
  },

  hideSource() {
    this.setState({visibleSource: false});
  },

  onPublish() {
    var {uid, home} = this.props;
    Actions.publish(home, uid);
  },

  _prepareData() {
    var {uid, group} = this.props;
    var {channels, instrument} = this.state;
    var instrumentName = instrument.instrumentName;
    var instrumentDefinition = instrument.definition.value.toJS();
    var channels = channels.channels.map(chan => chan.configuration);
    var channelConfiguration = {};
    channels.forEach((value, name) => {
      if (value)
        channelConfiguration[name] = value.value.toJS();
    });
    return {instrumentName, uid, instrumentDefinition, channelConfiguration};
  },

  onCreateDraft() {
    var {
      uid,
      instrumentName,
      instrumentDefinition,
      channelConfiguration
    } = this._prepareData();
    Actions.createDraft(this.props.home, instrumentName, uid,
                        instrumentDefinition, channelConfiguration);
  },

  onSave() {
    var {uid, instrumentDefinition, channelConfiguration} = this._prepareData();
    Actions.dataSave(uid, instrumentDefinition, channelConfiguration);
  }

});

module.exports = Editor;
