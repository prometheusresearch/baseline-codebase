import React from 'react';
import {Preloader} from 'rex-widget/ui';
import {fromHash, toHash} from './History';

let cache = {};

export default class DBGUI extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      table: null,
      loading: false,
      wizard: props.rootWizard
    };
  }

  render() {
    let {loading, wizard} = this.state;
    return loading ? <Preloader/> : wizard;
  }

  componentWillMount() {
    if (window.location.hash) {
      let {table, remainder} = fromHash();
      if (table !== null) {
        this.setTable(table, remainder);
      }
    }
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.onHashChange);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.onHashChange);
  }

  setTable = (table, remainder) => {
    window.location.hash = toHash(table, remainder);
    if (table && cache[table]) {
      this.setState({...this.state,
        table,
        wizard: cache[table],
        loading: false
      });
    }
    else {
      let {tableWizard} = this.props;
      this.setState({...this.state, table, loading: true}, () => {
        let request = tableWizard.addPath('/' + table).asTransitionable();
        request.produce().then((wizard) => {
          cache[table] = wizard;
          this.setState({...this.state, wizard, loading: false});
        });
      });
    }
  }

  onHashChange = () => {
    let {table, remainder} = fromHash();
    if (table != this.state.table) {
      if (table === null) {
        this.setState({...this.state, table, wizard: this.props.rootWizard});
      }
      else {
        this.setTable(table, remainder);
      }
    }
  }
}
