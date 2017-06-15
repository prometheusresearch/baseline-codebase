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

export ConfirmNavigation from './ConfirmNavigation';
export Wizard from './wizard/Wizard';
export ActionWizard from './ActionWizard';
export Page from './actions/Page';
export Drop from './actions/Drop';
export Form from './actions/Form';
export Pick from './actions/Pick';
export Edit from './actions/Edit';
export View from './actions/View';
export Make from './actions/Make';
export Plotly from './actions/Plotly';

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
