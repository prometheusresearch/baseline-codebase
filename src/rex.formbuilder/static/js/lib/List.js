/**
 * @jsx React.DOM
 */
'use strict';

var React              = require('react');
var CommunicatingMixin = require('./CommunicatingMixin');
var LoadingScreen      = require('./LoadingScreen');
var cx                 = React.addons.classSet;
var mergeInto          = require('./mergeInto');
var NewInstrumentForm  = require('./NewInstrumentForm');
var Button             = require('./Button');

var List = React.createClass({

  mixins: [CommunicatingMixin],

  getInitialState: function () {
    return {
      instruments: null,
    };
  },

  isInitialized: function () {
    return this.state.instruments ? true : false;
  },

  componentDidMount: function () {
    this.apiRequest({
      path: 'instrument',
      success: function (data) {
        var instruments = data.map(function (item) {
          return {
            uid: item.uid,
            status: item.status,
            title: item.title,
            opened: false,
            drafts: {
              items: null,
              loadingError: null,
            },
            published: {
              items: null,
              loadingError: null,
            },
            activeTab: 'published'
          }
        });
        this.setState({
          instruments: instruments
        });
      },
      error: 'Error loading instruments'
    });
  },

  updateInstrumentProperties: function (row, newValues) {
    var newState = {};
    mergeInto(newState, this.state);
    newState.instruments = this.state.instruments.map(function (item, i) {
      if (i !== row)
        return item;
      var newItem = {};
      mergeInto(newItem, item);
      mergeInto(newItem, newValues);
      return newItem;
    });
    this.setState(newState);
  },

  checkIfNotLoaded: function (row, groupName) {
    var instrument = this.state.instruments[row];

    var group = instrument[groupName];
    if (!group.items) {
      var path = groupName === 'published' ?
                   'instrumentversion' : 'draftinstrumentversion';
      path += '?instrument=' + encodeURIComponent(instrument.uid);
      this.apiRequest({
        path: path,
        success: function (data) {
          var newGroup = {};
          mergeInto(newGroup, this.state.instruments[row][groupName]);
          newGroup.items = data.map(function (item) {
            var desc = null;
            if (item.published_by) 
              desc = 'Published by: ' + item.published_by;
            else if (item.modified_by)
              desc = 'Modified by: ' + item.modified_by;
            else if (item.created_by)
              desc = 'Created by: ' + item.created_by;
            return {
              'uid': item.uid,
              'desc': desc
            };
          });
          var newProps = {};
          newProps[groupName] = newGroup;
          this.updateInstrumentProperties(row, newProps);
        }.bind(this),
        error: function () {
          var newGroup = {};
          mergeInto(newGroup, this.state.instruments[row][groupName]);
          newGroup.loadingError = 'Loading error';
          var newProps = {};
          newProps[groupName] = newGroup;
          this.updateInstrumentProperties(row, newProps);
        }.bind(this)
      });
    }
  },

  onRowClicked: function (row, e) {
    var instrument = this.state.instruments[row];
    var opened = !instrument.opened;
    if (opened)
      this.checkIfNotLoaded(row, instrument.activeTab);
    this.updateInstrumentProperties(row, {opened: opened});
  },

  renderInstrumentVersions: function (instrument, groupName) {
    var items = instrument[groupName].items;
    var versions = items.map(function (item) {
      return (
        <div className="row rfb-instrument-version">
          <div className="col-md-4">{item.uid}</div>
          <div className="col-md-4">{item.desc}</div>
          <div className="col-md-4">
            <a className="btn btn-default"
               href={this.getEditURL(groupName, item.uid)}>
               {groupName === 'published' ? 'Open': 'Edit'}
            </a>
          </div>
        </div>
      );
    }.bind(this));
    var newInstrumentVersion = function () {
      this.createEmptyInstrumentVersion(instrument);
    }.bind(this);
    return (
      <div className="container-fluid">
        {versions.length ? versions:
          <div className="row rfb-instrument-version">
            <div className="col-md-11 rfb-empty-text">
              No items to display
            </div>
            <div className="col-md-1">
              {groupName === 'drafts' &&
                <Button onClick={newInstrumentVersion}>
                  Create
                </Button>}
            </div>
          </div>
        }
      </div>
    );
  },

  setInstrumentActive: function (i, isActive) {
    var uid = this.state.instruments[i].uid;
    this.updateInstrumentProperties(i, {updatingStatus: true});
    var data = {
      status: isActive ? 'active' : 'disabled'
    }

    this.apiRequest({
      path: 'instrument/' + uid,
      type: 'PUT',
      data: data,
      success: function (answer) {
        console.log('success', answer);
        this.updateInstrumentProperties(i, {
          status: answer.status,
          updatingStatus: false
        });
      }.bind(this),
      error: function () {
        console.log('error', arguments);
        this.updateInstrumentProperties(i, {
          updatingStatus: false
        });
      }.bind(this)
    });
  },

  renderInstrumentList: function () {
    var instruments = this.state.instruments.map((instrument, i) => {
      var onClick = this.onRowClicked.bind(this, i);
      var cls = {
        'panel-collapse': true,
        'collapse': true,
        'in': instrument.opened
      };
      var publishedCls = {
        'active': instrument.activeTab === 'published'
      };
      var draftsCls = {
        'active': instrument.activeTab === 'drafts'
      };
      var showPublished = function () {
        this.checkIfNotLoaded(i, 'published');
        this.updateInstrumentProperties(i, {activeTab: 'published'});
      }.bind(this);
      var showDrafts = function () {
        this.checkIfNotLoaded(i, 'drafts');
        this.updateInstrumentProperties(i, {activeTab: 'drafts'});
      }.bind(this);
      var isActive = instrument.status === 'active';
      var onChangeStatus = function (e) {
        this.setInstrumentActive(i, !isActive);
        e.stopPropagation();
      }.bind(this);
      return (
        <div className="panel panel-default">
          <div className="panel-heading" onClick={onClick}>
            <div className="row">
              <div className="col-md-3">{instrument.uid}</div>
              <div className="col-md-8">{instrument.title}</div>
              <div className="col-md-1">
                {instrument.updatingStatus ?
                  <span className={'glyphicon glyphicon-refresh ' +
                               'glyphicon-refresh-animate'}></span>
                  :
                  <input type="checkbox" checked={isActive}
                         onChange={onChangeStatus} />
                }
              </div>
            </div>
          </div>
          <div className={cx(cls)}>
            <div className="panel-body">
              <ul className="nav nav-tabs">
                <li className={cx(publishedCls)}>
                  <a href="#" onClick={showPublished}>Published</a>
                </li>
                <li className={cx(draftsCls)}>
                  <a href="#" onClick={showDrafts}>Drafts</a>
                </li>
              </ul>
              <ul className="rfb-tab-content">
                <li className={cx(publishedCls)}>
                  {instrument.published.items?
                    this.renderInstrumentVersions(instrument, 'published')
                    :
                    <LoadingScreen error={instrument.published.loadingError} />
                  }
                </li>
                <li className={cx(draftsCls)}>
                  {instrument.drafts.items?
                    this.renderInstrumentVersions(instrument, 'drafts')
                    :
                    <LoadingScreen error={instrument.drafts.loadingError} />
                  }
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    });
    return (
      <tbody>
        {instruments}
      </tbody>
    )
  },

  createEmptyInstrumentVersion: function (instrument) {
    console.log('creating empty instrument', instrument);
    var definition = {
      id: `urn:${instrument.uid}`,
      version: "1.0",
      title: instrument.title,
      record: [
        {
          id: "foo",
          type: "text",
        },
      ],
    };
    var body = this.instrumentVersionMeta(instrument.uid, definition, this.props.user,
                                          this.props.user, null);
    this.apiRequest({
      path: 'draftinstrumentversion',
      type: 'POST',
      data: body,
      success: function (data) {
        console.log('Response from POST draftinstrumentversion:', data);
        window.location.href = this.getEditURL('drafts', data.uid);
      }.bind(this),
      error: function (xhr, status, err) {
        console.log('error of creating a new instrumentversion', arguments);
      }.bind(this),
    });
  },

  onCreateInstrument: function (code, title) {
    var body = {
      code: code,
      title: title,
      status: 'disabled',
    };
    console.log('body', body);
    this.apiRequest({
      path: 'instrument',
      type: 'POST',
      data: body,
      success: function (instrument) {
        console.log('instrument created:', instrument);
        this.createEmptyInstrumentVersion(instrument);
      }.bind(this),
      error: function (xhr, status, err) {
        console.log('instrument didn not created', arguments);
      }
    });
  },

  render: function () {
    return (
      <div className="rfb-area">
        {this.isInitialized() ?
          <div className="rfb-list">
            <div className="rfb-list-head clearfix">
              <div className="pull-left">
                <h2>Instruments</h2>
              </div>
              <div className="pull-right">
                <NewInstrumentForm onCreateInstrument={this.onCreateInstrument}/>
              </div>
            </div>

            <div className="rfb-list-items container-fluid">
              <div className="row rfb-header">
                <div className="col-md-3">uid</div>
                <div className="col-md-8">title</div>
                <div className="col-md-1">active</div>
              </div>
            </div>

            <div className="panel-group" id="accordion">
              {this.renderInstrumentList()}
            </div>

          </div>
          :
          <LoadingScreen error={this.state.loadingError} />
        }
      </div>
    );
  }
});

module.exports = List;
