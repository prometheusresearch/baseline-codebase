/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var DraftSetTile = require('./DraftSetTile');
var MenuHeader = require('./MenuHeader');
var _ = require('../i18n').gettext;
var {DraftInstrumentVersionActions} = require('../actions');
var {DraftInstrumentVersionStore} = require('../stores');


var DraftSetList = React.createClass({
  propTypes: {
    onDraftSelected: React.PropTypes.func,
    onPreviewSelected: React.PropTypes.func,
    allowNewDrafts: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      onDraftSelected: function () {},
      allowNewDrafts: false
    };
  },

  getInitialState: function () {
    return {
      drafts: []
    };
  },

  getDrafts: function () {
    var drafts = DraftInstrumentVersionStore.getAll().slice();

    drafts.sort(function (a, b) {
      return b.date_created.localeCompare(a.date_created);
    });

    return drafts;
  },

  componentDidMount: function () {
    DraftInstrumentVersionStore.addChangeListener(
      this._onDraftInstrumentVersionsChange
    );
    DraftInstrumentVersionStore.addCreateListener(
      this._onDraftInstrumentVersionCreate
    );
    this._onDraftInstrumentVersionsChange();
  },

  componentWillUnmount: function () {
    DraftInstrumentVersionStore.removeCreateListener(
      this._onDraftInstrumentVersionCreate
    );
    DraftInstrumentVersionStore.removeChangeListener(
      this._onDraftInstrumentVersionsChange
    );
  },

  _onDraftInstrumentVersionsChange: function () {
    this.setState({
      drafts: this.getDrafts()
    });
  },

  _onDraftInstrumentVersionCreate: function (draft, originalDraft) {
    if (!originalDraft) {
      this.props.onDraftSelected(draft);
    }
  },

  buildDrafts: function () {
    return this.state.drafts.map((draft) => {
      return (
        <DraftSetTile
          key={draft.uid}
          draft={draft}
          onClick={this.onDraftClick.bind(this, draft)}
          onPreview={this.onPreviewClick.bind(this, draft, 'draft')}
          />
      );
    });
  },

  onDraftClick: function (draft, event) {
    event.preventDefault();
    this.props.onDraftSelected(draft);
  },

  onPreviewClick: function (draft, category, event) {
    event.preventDefault();
    this.props.onPreviewSelected(draft.uid, category);
  },

  onNewDraft: function () {
    DraftInstrumentVersionActions.createSkeleton();
  },

  render: function () {
    return (
      <div className="rfb-draftset-list">
        <MenuHeader
          title={_('Drafts')}>
          {this.props.allowNewDrafts &&
            <button
              className="rfb-button"
              onClick={this.onNewDraft}>
              <span className='rfb-icon icon-new' />
              {_('Create New Draft')}
            </button>
          }
        </MenuHeader>
        <table>
          <thead>
            <tr>
              <th>{_('Created')}</th>
              <th>{_('Created By')}</th>
              <th>{_('Modified')}</th>
              <th>{_('Modified By')}</th>
              <th>{_('Cloned From')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {this.buildDrafts()}
          </tbody>
        </table>
      </div>
    );
  }
});


module.exports = DraftSetList;

