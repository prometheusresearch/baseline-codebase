import React from "react";
import { Action, Title, Command } from "rex-action";
import { SuccessButton, Notification, Preloader } from "rex-widget/ui";
import { VBox, HBox } from "rex-widget/layout";
import { forceRefreshData } from "rex-widget/data";

function Tables({ perRow = 2, tables, checked = {}, onCheckTable }) {
  let rows = tables.reduce(
    (acc, table) =>
      acc[0].length < perRow
        ? [].concat([[].concat(acc[0], [table])], acc.slice(1))
        : [].concat([[table]], acc),
    [[]]
  );
  rows[0] = [].concat(rows[0], new Array(perRow - rows[0].length).fill(""));
  return (
    <VBox>
      {rows.reverse().map((row, i) => (
        <HBox key={i}>
          {row.map((table, j) => (
            <VBox
              key={`${table}-${i}-${j}`}
              flex="1"
              style={{ padding: "5px" }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={checked[table]}
                  onChange={() => onCheckTable(table)}
                />
                <span style={{ marginLeft: "10px" }}>{table}</span>
              </label>
            </VBox>
          ))}
        </HBox>
      ))}
    </VBox>
  );
}

export default class BuildTableMart extends React.Component {
  state = {
    checked: {}
  };

  render() {
    let { context, tables } = this.props;
    let title = this.constructor.renderTitle(this.props, this.props.context);
    return (
      <Action title={title} renderFooter={this.renderFooter}>
        <Tables
          tables={tables}
          checked={this.state.checked}
          onCheckTable={this.onCheckTable}
        />
      </Action>
    );
  }

  onCheckTable = table => {
    let checked = { ...this.state.checked };
    if (checked[table]) {
      delete checked[table];
    } else {
      checked[table] = true;
    }
    this.setState({ checked });
  };

  onBuildMart = () => {
    this.props.produceMart
      .data(JSON.stringify(Object.keys(this.state.checked)))
      .produce()
      .then(this.onJobRequestSubmitted);
  };

  onJobRequestSubmitted = data => {
    this.props.onCommand("default", data.job[0]);
    this.props.refetch();
  };

  renderFooter = () => {
    return (
      <SuccessButton
        onClick={() => this.onBuildMart()}
        disabled={Object.keys(this.state.checked).length === 0}
      >
        Build Mart
      </SuccessButton>
    );
  };

  static renderTitle({ title = "Build Mart" }, context) {
    return <Title title={title} context={context} entity={{}} />;
  }
}

Command.defineCommand(BuildTableMart, {
  argumentTypes: [Command.Types.ConfigurableEntity()],
  execute(props, context, entity) {
    console.log(entity, props);
    if (entity != null) {
      return { ...context, job: entity };
    } else {
      return context;
    }
  }
});
