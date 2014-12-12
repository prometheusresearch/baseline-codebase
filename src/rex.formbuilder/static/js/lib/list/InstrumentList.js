/**
 * @jsx React.DOM
 */
'use strict';

var React               = require('react/addons');
var PropTypes           = React.PropTypes;
var cx                  = React.addons.classSet;
var merge               = require('../merge');
var StoreListenerMixin  = require('../StoreListenerMixin');
var stopPropagation     = require('../stopPropagation');
var makeURL             = require('../makeURL');
var Button              = require('../Button');
var LoadingScreen       = require('../LoadingScreen');
var Icon                = require('../Icon');
var InstrumentListStore = require('./InstrumentListStore');
var NewInstrumentForm   = require('./NewInstrumentForm');

var TAB_NAMES = {
  PUBLISHED: 'published',
  DRAFTS: 'drafts'
};

var InstrumentVersions = React.createClass({

  propTypes: {
    onCreate: PropTypes.func.isRequired,
    instrument: PropTypes.object.isRequired,
    groupName: PropTypes.string.isRequired
  },

  render() {
    var {instrument, groupName} = this.props;
    var items = instrument[groupName].items;
    var versions = items.map((item) => (
      <div key={item.uid} className="row rfb-instrument-version">
        <div className="col-md-4">{item.uid}</div>
        <div className="col-md-4">{item.desc}</div>
        <div className="col-md-4">
          <a className="btn btn-default"
              href={makeURL('edit', groupName, item.uid)}>
              {groupName === 'published' ? 'Open': 'Edit'}
          </a>
        </div>
      </div>
    ));
    return (
      <div className="container-fluid">
        {versions.length ?
          versions :
          <div className="row rfb-instrument-version">
            <div className="col-md-11 rfb-empty-text">
              No items to display
            </div>
            <div className="col-md-1">
              {groupName === 'drafts' &&
                <Button onClick={this.props.onCreate}>
                  Create
                </Button>}
            </div>
          </div>}
      </div>
    );
  }
});

var Instrument = React.createClass({

  propTypes: {
    instrument: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    onTab: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
    onCreateVersion: PropTypes.func.isRequired
  },

  render() {
    var {instrument, expanded, activeTab, updatingStatus} = this.props;
    var className = cx({
      'panel-collapse': true,
      'collapse': true,
      'in': expanded
    });
    var publishedClassName = cx({active: activeTab === 'published'});
    var draftClassName = cx({active: activeTab === 'drafts'});
    var isActive = instrument.status === 'active';
    return (
      <div className="panel panel-default">
        <div className="panel-heading" onClick={this.toggle}>
          <div className="row">
            <div className="col-md-3">{instrument.uid}</div>
            <div className="col-md-8">{instrument.title}</div>
            <div className="col-md-1">
              {updatingStatus ?
                <Icon name="refresh" animate /> :
                <input
                  type="checkbox"
                  checked={isActive}
                  onClick={stopPropagation}
                  onChange={this.onStatus} />}
            </div>
          </div>
        </div>
        <div className={className}>
          <div className="panel-body">
            <ul className="nav nav-tabs">
              <li className={publishedClassName}>
                <a href="#" onClick={this.onTab.bind(null, TAB_NAMES.PUBLISHED)}>Published</a>
              </li>
              <li className={draftClassName}>
                <a href="#" onClick={this.onTab.bind(null, TAB_NAMES.DRAFTS)}>Drafts</a>
              </li>
            </ul>
            <ul className="rfb-tab-content">
              <li className={publishedClassName}>
                {instrument.published.items?
                  <InstrumentVersions
                    instrument={instrument}
                    groupName="published"
                    onCreate={this.onCreateVersion}
                    /> :
                  <LoadingScreen error={instrument.published.loadingError} />}
              </li>
              <li className={draftClassName}>
                {instrument.drafts.items?
                  <InstrumentVersions
                    instrument={instrument}
                    groupName="drafts"
                    onCreate={this.onCreateVersion}
                    /> :
                  <LoadingScreen error={instrument.drafts.loadingError} />}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  },

  toggle() {
    var {instrument, expanded} = this.props;
    this.props.onToggle(instrument, !expanded);
  },

  onTab(tabName) {
    this.props.onTab(this.props.instrument, tabName);
  },

  onStatus(e) {
    this.props.onStatus(this.props.instrument);
  },

  onCreateVersion() {
    this.props.onCreateVersion(this.props.instrument);
  }
});

var InstrumentList = React.createClass({
  mixins: [StoreListenerMixin(InstrumentListStore)],

  render() {
    if (!this.state.instruments) {
      return (
        <div className="rfb-area">
          <LoadingScreen error={this.state.loadingError} />
        </div>
      );
    }
    return (
      <div className="rfb-InstrumentList">
        <div className="rfb-InstrumentList__list">
          <div className="rfb-list-head clearfix">
            <div className="pull-left">
              <h2>Instruments</h2>
            </div>
            <div className="pull-right">
              <NewInstrumentForm onCreateInstrument={this.onCreateInstrument}/>
            </div>
          </div>

          <div className="rfb-InstrumentList__items">
            <div className="row rfb-header">
              <div className="col-md-3">uid</div>
              <div className="col-md-8">title</div>
              <div className="col-md-1">active</div>
            </div>
          </div>

          <div className="panel-group" id="accordion">
            {this.state.instruments.map((instrument) => (
              <Instrument 
                expanded={this.state.expanded[instrument.uid]}
                activeTab={this.state.activeTabs[instrument.uid]}
                updatingStatus={this.state.updatingStatus[instrument.uid]}
                key={instrument.uid}
                instrument={instrument}
                onToggle={this.onToggle}
                onTab={this.onTab}
                onStatus={this.onStatus}
                onCreateVersion={this.onCreateVersion}
                />
            ))}
          </div>
        </div>
      </div>
    );
  },

  getInitialState() {
    return {
      expanded: {},
      activeTabs: {}
    };
  },

  componentDidMount() {
    InstrumentListStore.loadInstruments();
  },

  onTab(instrument, tabName) {
    var nextState = {
      activeTabs: merge(this.state.activeTabs)
    };
    nextState.activeTabs[instrument.uid] = tabName;
    InstrumentListStore.loadInstrumentVersions(instrument.uid, tabName);
    this.setState(nextState);
  },

  onStatus(instrument) {
    var isActive = instrument.status === 'active';
    InstrumentListStore.setInstrumentStatus(instrument.uid, !isActive);
  },

  onToggle(instrument, expanded) {
    var nextState = {
      expanded: merge(this.state.expanded),
      activeTabs: merge(this.state.activeTabs)
    };
    nextState.expanded[instrument.uid] = expanded;
    if (nextState.activeTabs[instrument.uid] === undefined) {
      nextState.activeTabs[instrument.uid] = TAB_NAMES.PUBLISHED;
    }
    if (expanded) {
      InstrumentListStore.loadInstrumentVersions(
        instrument.uid,
        nextState.activeTabs[instrument.uid]
      );
    }
    this.setState(nextState);
  },

  onCreateVersion(instrument) {
    InstrumentListStore.createInstrumentVersion(instrument, this.props.user);
  },

  onCreateInstrument(code, title) {
    InstrumentListStore.createInstrument(code, title, this.props.user);
  }
});

module.exports = InstrumentList;
