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
  },

  putCalculation: function (calculation, afterCalculation) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_PUTCALCULATION,
      calculation: calculation,
      afterCalculation: afterCalculation
    });
  },

  addCalculation: function (calculation) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_ADDCALCULATION,
      calculation: calculation
    });
  },

  editCalculation: function (calculation) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_EDITCALCULATION,
      calculation: calculation
    });
  },

  cloneCalculation: function (calculation) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_CLONECALCULATION,
      calculation: calculation
    });
  },

  updateCalculation: function (calculation) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_UPDATECALCULATION,
      calculation: calculation
    });
  },

  deleteCalculation: function (calculation) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTSET_DELETECALCULATION,
      calculation: calculation
    });
  }
};


module.exports = DraftSetActions;

