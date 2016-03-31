/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Action from './Action';
import {createEntity, isEntity, getEntityTitle} from './Entity';

import {command, Types as ArgTypes} from './execution/Command';

import Actions from './actions';
import Title from './actions/Title';

import './TransitionableHandlers';

export ConfirmNavigation from './ConfirmNavigation';

export {
  Action,
  Title,
  createEntity,
  isEntity,
  getEntityTitle,
  Actions,
  command,
  ArgTypes,
};

export default {
  Action,
  createEntity,
  isEntity,
  Actions,
  command,
  ArgTypes,
};
