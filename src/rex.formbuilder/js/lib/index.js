/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import * as errors from './errors';
import * as GUI from './gui';
import * as widget from './widget';
import PickDraft from './widget/action/PickDraft';
import EditDraft from './widget/action/EditDraft';
import DraftSetEditor from './gui/DraftSetEditor';
import InstrumentMenu from './gui/InstrumentMenu';
import I18NWidget from './widget/I18NWidget';

export {
  GUI,
  widget,
  errors,
  PickDraft,
  EditDraft,
  DraftSetEditor,
  InstrumentMenu,
  I18NWidget,
};

global.Rex = global.Rex || {};
global.Rex.FormBuilder = module.exports;

