/**
 * API
 *
 * This module implement low level Data Access Layer to server side API.
 * Functions in this module are thin wrappers on top of plain XHR calls which do
 * various sanitization and normalization routines.
 *
 * @jsx React.DOM
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var request = require('./request');
var makeURL = require('./makeURL');
var {InvalidResponse} = require('./request');
var Promise = require('bluebird');

var API = {

  listInstruments() {
    return this
      .request('GET', 'instrument')
      .end();
  },

  listChannels() {
    return this
      .request('GET', 'channel')
      .end();
  },

  publishInstrumentVersion(uid) {
    var endpoint = `draftinstrumentversion/${uid}/publish`;
    return this
      .request('POST', endpoint)
      .end();
  },

  publishForm(draftUID, publishedUID, channel) {
    var data = {
      instrument_version: publishedUID
    };
    var formUID = this.getFormUID(draftUID, channel);
    var endpoint = `draftform/${formUID}/publish`;
    return this
      .request('POST', endpoint)
      .send(data)
      .end();
  },

  publishForms(draftUID, publishedUID, channels) {
    var tasks = channels.map(
      channel =>
        this.publishForm(draftUID, publishedUID, channel)
    );
    return Promise.all(tasks);
  },

  saveInstrumentVersion(uid, groupName, definition, user) {
    var data = {
      modified_by: user,
      definition: definition
    };
    var endpoint = `draftinstrumentversion/${uid}`;
    return this
      .request('PUT', endpoint)
      .send(data)
      .end();
  },

  draftInstrumentVersion(instrument, uid, group, definition, user) {
    var data = {
      instrument: instrument,
      modified_by: user,
      created_by: user,
      definition: definition,
      parent_instrument_version: uid
    };
    return this
      .request('POST', 'draftinstrumentversion')
      .send(data)
      .end();
  },

  getFormUID(instrumentVersionUID, channel) {
    // TODO: This is not a right way to get the channel UID by instrument
    // version UID. This should be removed as the right way is found.
    return `(${instrumentVersionUID}).${channel}`;
  },

  postForm(uid, form) {
    var formUID = this.getFormUID(uid, form.channel);
    return this
      .request('POST', 'draftform')
      .send({
        configuration: form.data,
        channel: form.channel,
        draft_instrument_version: uid
      })
      .end()
  },

  putForm(uid, form) {
    var formUID = this.getFormUID(uid, form.channel);
    var endpoint = `draftform/${formUID}`;
    return this
      .request('PUT', endpoint)
      .send({configuration: form.data})
      .end()
      .catch(InvalidResponse, err => {
        if (err.response.status === 404) {
          return this.postForm(uid, form);
        } else {
          throw err;
        }
      });
  },

  deleteForm(uid, form) {
    var formUID = this.getFormUID(uid, form.channel);
    var endpoint = `draftform/${formUID}`;
    return this
      .request('DELETE', endpoint)
      .end()
      .catch(InvalidResponse, err => {
        if (err.response.status === 404) {
          return err.response;
        } else {
          throw err;
        }
      });
  },

  saveForms(uid, forms) {
    var tasks = forms.map(form =>
      form.data ?
        this.putForm(uid, form) :
        this.deleteForm(uid, form)
    );
    return Promise.all(tasks);
  },

  getDraftset(uid) {
    uid = encodeURIComponent(uid);
    var endpoint = `draftset/${uid}`;
    return this
      .request('GET', endpoint)
      .end();
  },

  _onInstrumentAndFormsReceived(arr) {
    var forms = {};
    var instrumentResponse = arr[0];
    var channelResponse = arr[1];
    channelResponse.body.forEach((item) => {
      var uid = item.channel.uid;
      forms[uid] = item;
    });
    return {
      body: {
        instrument_version: instrumentResponse.body,
        forms: forms
      }
    };
  },

  _prepareDataToSave(instrument, forms, forCreate) {
    var value = {
      instrument_version: {
        definition: instrument
      },
      forms: {}
    };
    for (var name in forms) {
      if (forms.hasOwnProperty(name)) {
        value.forms[name] = forCreate ? forms[name] : {
          configuration: forms[name]
        }
      }
    }
    return value;
  },

  _prepareDataToCreateDraft(instrumentName, parentUID, instrument, forms) {
    var data = this._prepareDataToSave(instrument, forms, true);
    var instrumentVersion = data.instrument_version;
    instrumentVersion.instrument = instrumentName;
    instrumentVersion.parent_instrument_version = parentUID;
    return data;
  },

  saveInstrumentAndForms(uid, instrument, forms) {
    var data = this._prepareDataToSave(instrument, forms, false);
    var endpoint = `draftset/${uid}`;
    return this
      .request('PUT', endpoint)
      .send(data)
      .end();
  },

  createDraftset(instrumentName, parentUID, instrument, forms) {
    var data = this._prepareDataToCreateDraft(instrumentName, parentUID,
                                              instrument, forms);
    var endpoint = `draftset`;
    return this
      .request('POST', endpoint)
      .send(data)
      .end()
  },

  publishInstrumentAndForms(uid) {
    var endpoint = `draftset/${uid}/publish`;
    return this
      .request('POST', endpoint)
      .end()
  },

  getInstrumentAndForms(uid, groupName) {
    if (groupName === "drafts")
      return this.getDraftset(uid);
    return Promise.all([
      this.getInstrumentVersion(uid, groupName),
      this.getForms(uid, groupName)
    ]).then(
      this._onInstrumentAndFormsReceived
    );
  },

  getInstrumentVersion(uid, groupName) {
    var command = groupName === 'published' ?
      'instrumentversion' :
      'draftinstrumentversion';
    uid = encodeURIComponent(uid);
    var endpoint = `${command}/${uid}`;
    return this
      .request('GET', endpoint)
      .end();
  },

  getForms(uid, groupName) {
    var endpoint;
    var query = {};
    if (groupName === 'published') {
      endpoint = 'form';
      query.instrument_version = uid;
    }
    else {
      endpoint = 'draftform';
      query.draft_instrument_version = uid;
    }
    return this
      .request('GET', endpoint)
      .query(query)
      .end();
  },

  listInstrumentVersions(uid, groupName) {
    var endpoint = groupName === 'published' ?
      'instrumentversion' :
      'draftinstrumentversion';
    return this
      .request('GET', endpoint)
      .query({instrument: uid})
      .end();
  },

  setInstrumentStatus(uid, isActive) {
    return this
      .request('PUT', 'instrument', uid)
      .send({status: isActive ? 'active' : 'disabled'})
      .end();
  },

  createInstrumentVersion(uid, definition, user) {
    var data = {
      instrument: uid,
      definition,
      modified_by: user,
      created_by: user
    };
    return this
      .request('POST', 'draftinstrumentversion')
      .send(data)
      .end();
  },

  createInstrument(code, title, status) {
    var data = {code, title, status};
    return this
      .request('POST', 'instrument')
      .send(data)
      .end();
  },

  request(method, ...endpoint) {
    endpoint = ['api'].concat(endpoint);
    var url  = makeURL.apply(this, endpoint);
    return request(method, url)
      .set('Accept', 'application/json; charset=utf8');
  }
};

module.exports = API;
