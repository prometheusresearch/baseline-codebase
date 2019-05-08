// @flow

import * as React from "react";
import { fromHash, toHash } from "./History";
import * as rexui from "rex-ui";
import * as History from "rex-ui/History";

let cache = {};

type Props = {
  rootWizard: React.Node,
  tableWizard: any
};

type State = {
  table: ?string,
  loading: boolean,
  wizard: React.Node
};

export default class DBGUI extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      table: null,
      loading: false,
      wizard: props.rootWizard
    };
  }

  render() {
    let { loading, wizard } = this.state;
    return loading ? <rexui.PreloaderScreen /> : wizard;
  }

  componentWillMount() {
    let location = History.getHashHistory().location;
    if (location.pathname != "") {
      let { table, remainder } = fromHash(location.pathname);
      if (table !== null) {
        this.setTable(table, remainder);
      }
    }
  }

  _stopListening: () => void;

  componentDidMount() {
    this._stopListening = History.getHashHistory().listen(this.onHashChange);
  }

  componentWillUnmount() {
    this._stopListening();
  }

  setTable = (table: string, remainder: ?string) => {
    let pathname = toHash(table, remainder);
    if (table && cache[table]) {
      this.setState(
        {
          ...this.state,
          table,
          wizard: cache[table],
          loading: false
        },
        () => {
          History.getHashHistory().push({ pathname: "/" + pathname });
        }
      );
    } else {
      let { tableWizard } = this.props;
      this.setState({ ...this.state, table, loading: true }, () => {
        History.getHashHistory().push({ pathname: "/" + pathname });
        let request = tableWizard.addPath("/" + table).asTransitionable();
        request.produce().then(wizard => {
          cache[table] = wizard;
          this.setState({ ...this.state, wizard, loading: false });
        });
      });
    }
  };

  onHashChange = (location: History.Location) => {
    let { table, remainder } = fromHash(location.pathname);
    if (table != this.state.table) {
      if (table === null) {
        this.setState({ ...this.state, table, wizard: this.props.rootWizard });
      } else {
        this.setTable(table, remainder);
      }
    }
  };
}
