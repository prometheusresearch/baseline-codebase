/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as History from "./History";

let defaultMessage = "Changes that you made may not be saved.";

type Props = {|
  message?: string
|};

export type Instance = {|
  allow: () => void
|};

/**
 * Component which marks a UI as one which requires a confirm dialog before
 * navigating away.
 *
 * Example usage:
 *
 *    <ConfirmNavigation message="Form is not submitted" />
 *
 */
export let ConfirmNavigation = React.forwardRef<Props, Instance>(
  ({ message }, ref) => {
    let reason = useConfirmNavigation(message);
    React.useImperativeHandle(ref, () => ({
      allow: () => {
        History.allowNavigation(reason.current);
      }
    }));
    return null;
  }
);

/**
 * Marks current component as one which requires a confirm dialog before
 * navigating away.
 *
 * Example usage:
 *
 *    let reason = useConfirmNavigation("Form is not submitted")
 *
 */
export let useConfirmNavigation = (message?: string = defaultMessage) => {
  let reason = React.useRef<null | History.PreventReason>(null);
  React.useEffect(() => {
    reason.current = History.preventNavigation(message);
    return () => {
      if (reason.current != null) {
        History.allowNavigation(reason.current);
      }
    };
  }, [message]);
  return reason;
};

/**
 * Backward compat shim.
 *
 * @deprecated use import {confirmNavigation} from 'rex-ui/History'
 */
export function confirmNavigation() {
  return History.confirmNavigation();
}
