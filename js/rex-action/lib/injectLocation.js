/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @noflow
 */

import * as React from "react";
import * as History from "rex-ui/History";

export default function injectLocation<C: ReactClass<*>>(Component: C): C {
  let WrappedComponent: any = class HistoryAware extends React.Component {
    _history: Object = History.getHashHistory();
    _historyStopListening: ?() => void = null;

    state: { location: History.Location } = {
      location: History.getCurrentLocation()
    };

    render() {
      return (
        <Component
          {...this.props}
          location={this.state.location}
          history={this._history}
        />
      );
    }

    componentDidMount() {
      this._historyStopListening = this._history.listen(this._onLocationPop);
    }

    componentWillUnmount() {
      if (this._historyStopListening) {
        this._historyStopListening();
        this._historyStopListening = null;
      }
    }

    _onLocationPop = (location: History.Location, action: History.Action) => {
      if (action !== "POP") {
        return;
      }
      this.setState({ location });
    };
  };
  return (WrappedComponent: C);
}
