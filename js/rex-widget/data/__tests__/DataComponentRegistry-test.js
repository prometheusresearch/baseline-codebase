/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as Registry from "../DataComponentRegistry";

test("forceRefresh() every registered component", function() {
  let component = {
    refresh: jest.fn()
  };
  Registry.registerDataComponent(component);

  Registry.forceRefresh();
  expect(component.refresh).toBeCalledTimes(1);
  expect(component.refresh).toBeCalledWith(true);

  Registry.unregisterDataComponent(component);
});
