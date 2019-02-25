/**
 * @flow
 */

import type {Manager} from './createManager';

type ManagerRegistry = {
  [id: string]: Manager,
};

const registeredManagers: ManagerRegistry = {};

const errorCommon = 'a menu outside a mounted Wrapper with an id, or a menu that does not exist';

export function registerManager(menuId: string, manager: Manager) {
  registeredManagers[menuId] = manager;
}

export function unregisterManager(menuId: string) {
  delete registeredManagers[menuId];
}

export function openMenu(menuId: string, openOptions: any) {
  let manager = registeredManagers[menuId];
  if (!manager) throw new Error('Cannot open ' + errorCommon);
  manager.openMenu(openOptions);
}

export function closeMenu(menuId: string, closeOptions: any) {
  let manager = registeredManagers[menuId];
  if (!manager) throw new Error('Cannot close ' + errorCommon);
  manager.closeMenu(closeOptions);
}
