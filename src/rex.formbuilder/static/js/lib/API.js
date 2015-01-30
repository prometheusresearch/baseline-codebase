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
var {InvalidResponse} = require('./request');
var Promise = require('bluebird');
var format = require('./format');

var API = {

  home: '',
  editorURLTemplate: '',

  listInstruments(limit) {
    limit = limit || 1000000;
    return this
      .request('GET', `instrument?limit=${limit}`)
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

  saveInstrumentVersion(uid, groupName, definition) {
    var data = {
      definition: definition
    };
    var endpoint = `draftinstrumentversion/${uid}`;
    return this
      .request('PUT', endpoint)
      .send(data)
      .end();
  },

  draftInstrumentVersion(instrument, uid, group, definition) {
    var data = {
      instrument: instrument,
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

  getSet(uid, group) {
    uid = encodeURIComponent(uid);
    var segment = group === "drafts" ?
                  "draftset" : "set";
    var endpoint = `${segment}/${uid}?with_yaml=1`;
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

  _prepareDataToSave(instrument, forms) {
    var value = {
      instrument_version: {
        definition: instrument
      },
      forms: {}
    };
    for (var name in forms) {
      if (forms.hasOwnProperty(name)) {
        value.forms[name] = {
          configuration: forms[name]
        }
      }
    }
    return value;
  },

  _prepareDataToCreateDraft(instrumentName, parentUID, instrument, forms) {
    var data = this._prepareDataToSave(instrument, forms);
    var instrumentVersion = data.instrument_version;
    instrumentVersion.instrument = instrumentName;
    instrumentVersion.parent_instrument_version = parentUID;
    return data;
  },

  saveInstrumentAndForms(uid, instrument, forms) {
    var data = this._prepareDataToSave(instrument, forms);
    var endpoint = `draftset/${uid}?with_yaml=1`;
    return this
      .request('PUT', endpoint)
      .send(data)
      .end();
  },

  createDraftset(instrumentName, parentUID, instrument, forms) {
    var data = this._prepareDataToCreateDraft(instrumentName, parentUID,
                                              instrument, forms);
    var endpoint = `draftset?with_yaml=1`;
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

  createInstrumentVersion(uid, definition) {
    var data = {
      instrument: uid,
      definition
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

  makeURL(...segments) {
    var home = API.home;
    if (home.slice(-1) !== "/")
      home += "/";
    return `${home}${segments.join('/')}`;
  },

  editorURL(uid, group) {
    return format(this.editorURLTemplate, {
      uid: encodeURIComponent(uid),
      group: encodeURIComponent(group)
    });
  },

  request(method, ...endpoint) {
    endpoint = ['api'].concat(endpoint);
    var url  = API.makeURL.apply(this, endpoint);
    return request(method, url)
      .set('Accept', 'application/json; charset=utf8');
  }
};

module.exports = API;
