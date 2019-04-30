/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";
import * as ui from "rex-widget/ui";
import { VBox } from "@prometheusresearch/react-box";
import { Fetch, forceRefreshData } from "rex-widget/data";
import { deserializeQuery, serializeQuery } from "rex-query/api";
import MartQueryEditor from "./MartQueryEditor";
import MartQueryAPI from "./MartQueryAPI";
import * as rexui from "rex-ui";

class MartEditQuery extends React.Component {
  static defaultProps = {
    icon: "eye-open"
  };

  constructor(props) {
    super(props);

    this.martQueryAPI = new MartQueryAPI(props.insertQuery, props.updateQuery);
    this.query = null;
    this.chartList = null;

    this.state = {
      title: null,
      query: null,
      chartList: null,
      saving: false
    };
  }

  componentWillReceiveProps(nextProps) {
    let { title, query } = this.state;
    if (title === null && query === null) {
      let { data } = nextProps.fetched.query;
      if (data && data.title) {
        let { chartList, query } = getQueryFromData(data.data);
        this.query = query;
        this.chartList = chartList;
        this.setState({
          title: data.title,
          query: deserializeQuery(query),
          chartList
        });
      }
    }
  }

  onState = ({ query, chartList }) => {
    this.query = query;
    this.chartList = chartList;
  };

  onSave = () => {
    let { query, chartList } = this;
    let { title } = this.state;
    let { context, entity } = this.props;
    let { id } = context[entity.name];
    this.showProgress();
    this.martQueryAPI
      .update({ id, title, query, chartList })
      .then(this.onSaved, this.onError);
  };

  onClone = () => {
    let { query, chartList } = this;
    let { title } = this.state;
    let {
      context: { mart }
    } = this.props;
    this.showProgress();
    this.martQueryAPI
      .insert({
        martID: mart.id,
        title,
        query,
        chartList
      })
      .then(this.onSaved, this.onError);
  };

  onSaved = data => {
    this.removeProgress();
    ui.showNotification(
      <ui.Notification
        kind="success"
        text="Query saved successfully"
        icon="ok"
      />
    );

    this.setState({ query: this.query, chartList: this.chartList });

    let newEntity = Object.values(data)[0][0];
    let { context, entity } = this.props;
    // this is needed so that we reset query builder state
    this.props.onEntityUpdate(context[entity.name], newEntity);
    forceRefreshData();
  };

  onError = () => {
    this.removeProgress();
    ui.showNotification(
      <ui.Notification
        kind="danger"
        text="There was an error while saving the query"
        icon="remove"
      />,
      Infinity
    );
  };

  showProgress = () => {
    this.setState({ ...this.state, saving: true });
    this._progress = ui.showNotification(
      <ui.Notification kind="info" text="Saving Query." icon="cog" />,
      Infinity
    );
  };

  removeProgress = () => {
    this.setState({ ...this.state, saving: false });
    ui.removeNotification(this._progress);
  };

  onChangeTitle = e => {
    let newTitle = e.target.value || null;
    this.setState({ ...this.state, title: newTitle });
  };

  render() {
    let {
      runQuery,
      queryLimit,
      filterRelationList,
      exportFormats,
      chartConfigs,
      context: { mart },
      fetched: {
        query: { updating, data }
      }
    } = this.props;
    let { title, query, saving, chartList } = this.state;

    if (saving || updating) {
      return <rexui.PreloaderScreen />;
    }

    return (
      <MartQueryEditor
        runQuery={runQuery}
        queryLimit={queryLimit}
        mart={mart.id}
        initialQuery={query}
        initialChartList={chartList}
        filterRelationList={filterRelationList}
        query={query}
        onState={this.onState}
        title={title}
        saving={saving}
        saveDisabled={!data.own}
        onChangeTitle={this.onChangeTitle}
        onSave={this.onSave}
        chartConfigs={chartConfigs}
        exportFormats={exportFormats}
      />
    );
  }
}

/**
 * Get {query, chartList} from fetched data.
 */
function getQueryFromData(data) {
  let query;
  let chartList;
  if ("query" in data && "chartList" in data) {
    query = data.query;
    chartList = data.chartList;
  } else {
    query = JSON.stringify(data);
    chartList = [];
  }
  return { query, chartList };
}

export default Fetch(MartEditQuery, ({ entity, data, context }) => {
  let id = context[entity.name].id;
  return {
    query: data.params({ "*": id }).getSingleEntity()
  };
});
