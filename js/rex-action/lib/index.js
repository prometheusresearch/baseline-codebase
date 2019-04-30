/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Action from './Action';

import {createEntity, isEntity, getEntityTitle} from './model/Entity';
import {command, Types as ArgTypes} from './model/Command';
import * as Command from './model/Command';
import * as Entity from './model/Entity';

import * as Actions from './actions';
import Title from './actions/Title';
import {TitleBase} from './actions/Title';

import './TransitionableHandlers';

import {Theme} from './ui';

export {default as ConfirmNavigation} from './ConfirmNavigation';
export {default as Wizard} from './wizard/Wizard';
export {ActionWizard} from './ActionWizard';
export {default as Page} from './actions/Page';
export {default as Drop} from './actions/Drop';
export {default as Form} from './actions/Form';
export {default as Pick} from './actions/Pick';
export {default as Edit} from './actions/Edit';
export {default as View} from './actions/View';
export {default as Make} from './actions/Make';
export {default as Plotly} from './actions/Plotly';

export {
  Action,
  Title,
  TitleBase,
  createEntity,
  isEntity,
  getEntityTitle,
  Actions,
  command,
  ArgTypes,
  Command,
  Entity,
  Theme,
};

export default {
  Action,
  createEntity,
  isEntity,
  Actions,
  command,
  ArgTypes,
};

window.RexAction = {
  Action,
  Title,
  TitleBase,
  createEntity,
  isEntity,
  getEntityTitle,
  Actions,
  command,
  ArgTypes,
  Command,
  Entity,
  Theme,
};
