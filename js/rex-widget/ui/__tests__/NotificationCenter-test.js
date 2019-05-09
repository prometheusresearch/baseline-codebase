/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactTesting from "react-testing-library";
import * as NotificationCenter from "../NotificationCenter";
import * as lang from "../../lang";

afterEach(ReactTesting.cleanup);
afterEach(NotificationCenter.disposeLayer);

test("shows/removes a notification", function() {
  expect(NotificationCenter.getLayer()).toMatchInlineSnapshot(`<div />`);
  let notificationId = NotificationCenter.showNotification(<div>HI</div>);
  expect(NotificationCenter.getLayer()).toMatchInlineSnapshot(`
<div>
  <div
    style="position: fixed; z-index: 10000; top: 0px; right: 0px; width: 30%; padding: 15px;"
  >
    <div
      style="margin-bottom: 24px;"
    >
      <div>
        HI
      </div>
    </div>
  </div>
</div>
`);
  NotificationCenter.removeNotification(notificationId);
  expect(NotificationCenter.getLayer()).toMatchInlineSnapshot(`
<div>
  <div
    style="position: fixed; z-index: 10000; top: 0px; right: 0px; width: 30%; padding: 15px;"
  />
</div>
`);
});

test("shows and removes a notification after timeout", async function() {
  expect(NotificationCenter.getLayer()).toMatchInlineSnapshot(`<div />`);
  NotificationCenter.showNotification(<div>HI</div>, 10);
  expect(NotificationCenter.getLayer()).toMatchInlineSnapshot(`
<div>
  <div
    style="position: fixed; z-index: 10000; top: 0px; right: 0px; width: 30%; padding: 15px;"
  >
    <div
      style="margin-bottom: 24px;"
    >
      <div>
        HI
      </div>
    </div>
  </div>
</div>
`);
  await lang.delay(20);
  expect(NotificationCenter.getLayer()).toMatchInlineSnapshot(`
<div>
  <div
    style="position: fixed; z-index: 10000; top: 0px; right: 0px; width: 30%; padding: 15px;"
  />
</div>
`);
});
