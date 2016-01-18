/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React            from 'react';
import autobind         from 'autobind-decorator';
import {createLocation, getHistory} from './History';

export default function HistoryAware(Component) {

  let displayName = Component.displayName || Component.name;

  return class extends React.Component {

    static displayName = displayName;

    constructor(props) {
      super(props);

      this._history = null;
      this._stopListening = null;

      this.state = {
        location: props.disableHistory ? createLocation('/') : null
      };

      if (!props.disableHistory) {
        this._history = getHistory();
      }
    }

    render() {
      return (
        <Component
          {...this.props}
          history={this._history}
          location={this.state.location}
          />
      );
    }

    componentDidMount() {
      if (!this.props.disableHistory) {
        this._stopListening = this._history.listen(this._onLocation);
      }
    }

    componentWillUnmount() {
      if (!this.props.disableHistory) {
        if (this._stopListening) {
          this._stopListening();
        }
        this._history = null;
        this._stopListening = null;
      }
    }

    @autobind
    _onLocation(location) {
      this.setState({location});
    }
  };
}
