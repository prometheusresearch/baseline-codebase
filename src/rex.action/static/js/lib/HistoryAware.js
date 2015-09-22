/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind       from 'autobind-decorator';
import createHistory  from 'history/lib/createHashHistory';

export default function HistoryAware(Component) {

  let displayName = Component.displayName || Component.name;

  return class extends React.Component {

    constructor(props) {
      super(props);

      this._history = createHistory();
      this._stopListening = null;

      this.state = {
        location: null
      };
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
      this._stopListening = this._history.listen(this._onLocation);
    }

    componentWillUnmount() {
      if (this._stopListening) {
        this._stopListening();
      }
      this._history = null;
      this._stopListening = null;
    }

    @autobind
    _onLocation(location) {
      this.setState({location});
    }
  }
}
