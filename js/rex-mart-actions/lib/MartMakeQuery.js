/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";
import * as ui from "rex-widget/ui";
import debounce from "debounce-promise";

import MartQueryEditor from "./MartQueryEditor";
import MartQueryAPI from "./MartQueryAPI";

export default class StudyMartMakeQuery extends React.Component {
  static defaultProps = {
    icon: "eye-open"
  };

  constructor(props) {
    super(props);
    this.martQueryAPI = new MartQueryAPI(props.insertQuery);
    this.state = {
      title: "Untitled Query",
      saving: false
    };
  }

  onState = ({ query, chartList }) => {
    this.query = query;
    this.chartList = chartList;
  };

  onSave = () => {
    let { query, chartList } = this;
    let { title } = this.state;
    let { mart } = this.props.context;
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

    let newEntity = Object.values(data)[0][0];
    let { onContext, entity, refetch } = this.props;
    onContext({
      [entity.name]: newEntity
    });
    refetch();
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
    this.setState({ saving: true });
    this._progress = ui.showNotification(
      <ui.Notification kind="info" text="Saving Query." icon="cog" />,
      Infinity
    );
  };

  removeProgress = () => {
    this.setState({ saving: false });
    ui.removeNotification(this._progress);
  };

  onChangeTitle = e => {
    let newTitle = e.target.value || null;
    this.setState({ title: newTitle });
  };

  render() {
    let {
      runQuery,
      filterRelationList,
      queryLimit,
      chartConfigs,
      exportFormats
    } = this.props;
    let { saving, title, query } = this.state;
    let { mart } = this.props.context;
    return (
      <MartQueryEditor
        exportFormats={exportFormats}
        chartConfigs={chartConfigs}
        queryLimit={queryLimit}
        runQuery={runQuery}
        mart={mart.id}
        filterRelationList={filterRelationList}
        onState={this.onState}
        title={title}
        saving={saving}
        saveDisabled={query === null}
        onChangeTitle={this.onChangeTitle}
        onSave={this.onSave}
      />
    );
  }
}
