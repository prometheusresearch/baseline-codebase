/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var DraftSetActions = {
  activate: function (uid) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_ACTIVATE,
      uid: uid
    });
  },

  setAttributes: function (attributes) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_EDITATTRIBUTES,
      attributes: attributes
    });
  },

  addElement: function (element) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_ADDELEMENT,
      element: element
    });
  },

  editElement: function (element) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_EDITELEMENT,
      element: element
    });
  },

  cloneElement: function (element) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_CLONEELEMENT,
      element: element
    });
  },

  updateElement: function (element) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_UPDATEELEMENT,
      element: element
    });
  },

  deleteElement: function (element) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_DELETEELEMENT,
      element: element
    });
  },

  putElement: function (element, afterElement, container) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_PUTELEMENT,
      element: element,
      afterElement: afterElement,
      container: container
    });
  },

  checkNewHome: function (element) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_CHECKNEWHOME,
      element: element
    });
  },

  publish: function () {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_PUBLISH
    });
  },

  saveActive: function () {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_SAVE
    });
  }
};


module.exports = DraftSetActions;

