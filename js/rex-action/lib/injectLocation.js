/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as History from "rex-ui/History";

export default function injectLocation<
  P: { location: History.Location, locationAction: ?History.Action },
>(
  Component: React.AbstractComponent<P>,
): React.AbstractComponent<
  $Diff<P, { location: History.Location, locationAction: ?History.Action }>,
> {
  let history = History.getHashHistory();
  let browserHistory = History.getBrowserHistory();
  function getHashLocation(location) {
    return History.createLocation("/" + location.hash.slice(1));
  }
  return function WrappedComponent(props) {
    let [location, setLocation] = React.useState<History.Location>(() =>
      getHashLocation(browserHistory.location),
    );

    let [action, setAction] = React.useState<?History.Action>(null);

    React.useEffect(() => {
      let stopListening = browserHistory.listen(
        (location: History.Location, action: History.Action) => {
          setLocation(getHashLocation(location));
          setAction(action);
        },
      );
      return () => stopListening();
    }, []);

    return (
      <Component
        {...props}
        key={browserHistory.location.pathname}
        location={location}
        locationAction={action}
        history={history}
      />
    );
  };
}
