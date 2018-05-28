/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Dispatcher = require('../Dispatcher');
var constants = require('../constants');


var DraftInstrumentVersionActions = {
  createSkeleton: function () {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTINSTRUMENTVERSION_CREATESKELETON
    });
  },

  cloneDraft: function (draft) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTINSTRUMENTVERSION_CLONE,
      draft: draft
    });
  },

  publishDraft: function (draft) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTINSTRUMENTVERSION_PUBLISH,
      draft: draft
    });
  },

  deleteDraft: function (draft) {
    Dispatcher.dispatch({
      actionType: constants.ACTION_DRAFTINSTRUMENTVERSION_DELETE,
      draft: draft
    });
  }
};


module.exports = DraftInstrumentVersionActions;

