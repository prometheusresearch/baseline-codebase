/**
 * @flow
 */

import type { QueryNavigation, QueryPipeline } from "../model/types";
import type { Actions } from "../state";
import type { SearchCallback } from "../ui/Search";

import React from "react";
import PropTypes from "prop-types";
import { VBox, HBox } from "react-stylesheet";

import { Icon, TagLabel, Label, Menu, NavigationMenu } from "../ui";
import * as feature from "../feature";
import { getInsertionPoint } from "../model/QueryOperation";

type ColumnPickerProps = {
  query: QueryPipeline,
  onSelect: (payload: { path: string }) => *,
  onSelectRemove: (payload: { path: string, query: QueryPipeline }) => *,
  onSelectAll: () => void,
  onSearch?: SearchCallback
};

export default class ColumnPicker extends React.Component<ColumnPickerProps> {
  context: {
    actions: Actions
  };

  static contextTypes = {
    actions: PropTypes.object
  };

  render() {
    let { query, onSearch } = this.props;
    let context =
      query.context.type.name === "invalid"
        ? query.context.prev
        : getInsertionPoint(query).context;
    const NavigationMenuContents = this.NavigationMenuContents;
    return (
      <NavigationMenu onSearch={onSearch} context={context}>
        {navigation => (
          <NavigationMenuContents {...this.props} navigation={navigation} />
        )}
      </NavigationMenu>
    );
  }

  NavigationMenuContents = (
    props: ColumnPickerProps & { navigation: Map<string, QueryNavigation> }
  ) => {
    let { query, navigation, onSelect, onSelectRemove } = props;

    let { type } = query.context;
    let active = getNavigationIndex(query);
    let entityList = [];
    let queryList = [];
    let attributeList = [];
    let groupByAttributeList = [];

    navigation.forEach(column => {
      let query = active[column.value];
      let button = (
        <ColumnPickerButton
          key={column.value}
          disabled={column.groupBy}
          column={column}
          query={query}
          onSelect={onSelect}
          onSelectRemove={onSelectRemove}
          onNavigate={this.onNavigate}
          onAddQuery={this.onAddQuery}
          onAggregate={this.onAggregate}
          onFocusSelection={this.onFocusSelection}
          actions={this.context.actions}
        />
      );
      if (column.groupBy) {
        groupByAttributeList.push(button);
      } else if (column.type === "record") {
        queryList.push(button);
        entityList.push(column);
      } else {
        attributeList.push(button);
      }
    });
    return (
      <VBox paddingBottom={10}>
        <VBox>
          <Menu.MenuGroup>
            <Menu.MenuButton onClick={this.props.onSelectAll}>
              Select all
            </Menu.MenuButton>
          </Menu.MenuGroup>
        </VBox>
        {groupByAttributeList.length > 0 && (
          <VBox paddingBottom={10}>
            <Menu.MenuGroup title="Group by columns">
              {groupByAttributeList}
            </Menu.MenuGroup>
          </VBox>
        )}
        {queryList.length > 0 && (
          <VBox paddingBottom={10}>
            <Menu.MenuGroup
              title={
                type.name === "invalid" || type.name === "void"
                  ? "Entities"
                  : "Relationships"
              }
            >
              {queryList}
            </Menu.MenuGroup>
          </VBox>
        )}
        {attributeList.length > 0 && (
          <VBox paddingBottom={10}>
            <Menu.MenuGroup title="Attributes">{attributeList}</Menu.MenuGroup>
          </VBox>
        )}
      </VBox>
    );
  };

  onDefine = (nav: QueryNavigation) => {
    this.context.actions.appendDefine({
      at: this.props.query,
      select: true,
      path: [nav.value]
    });
  };

  onAggregate = (payload: { path: string }) => {
    let domain = this.props.query.context.domain;
    this.context.actions.appendDefineAndAggregate({
      at: this.props.query,
      path: [payload.path],
      aggregate: domain.aggregate.count
    });
  };

  onFocusSelection = (payload: { path: string }) => {
    this.context.actions.selectFocus({
      at: this.props.query,
      path: [payload.path]
    });
  };

  onFilter = () => {
    this.context.actions.appendFilter({ at: this.props.query });
  };

  onNavigate = (payload: { path: string }) => {
    this.context.actions.appendNavigate({
      at: this.props.query,
      path: [payload.path]
    });
  };

  onAddQuery = (payload: { path: string }) => {
    this.context.actions.appendDefine({
      at: this.props.query,
      select: true,
      path: [payload.path]
    });
  };
}

type ColumnPickerButtonProps = {
  query?: QueryPipeline,
  column: QueryNavigation,
  onSelect: (payload: { path: string }) => *,
  onNavigate: (payload: { path: string }) => *,
  onAggregate: (payload: { path: string }) => *,
  onAddQuery: (payload: { path: string }) => *,
  onFocusSelection: (payload: { path: string }) => *,
  onSelectRemove: (payload: { path: string, query: QueryPipeline }) => *,
  disabled?: boolean,
  actions: Actions
};

class ColumnPickerButton extends React.Component<ColumnPickerButtonProps> {
  button: ?Menu.MenuButton = null;

  onSelect = (e: UIEvent) => {
    e.stopPropagation();
    let { onSelect, onSelectRemove, column, query } = this.props;
    if (query != null) {
      onSelectRemove({ path: column.value, query });
    } else {
      onSelect({ path: column.value });
    }
  };

  onNavigate = () => {
    let { onNavigate, column } = this.props;
    onNavigate({ path: column.value });
  };

  onAddQuery = () => {
    let { onAddQuery, column } = this.props;
    onAddQuery({ path: column.value });
  };

  onAggregate = () => {
    let { onAggregate, column } = this.props;
    onAggregate({ path: column.value });
  };

  onFocusSelection = () => {
    let { onFocusSelection, column } = this.props;
    if (this.button != null) {
      this.button.toggleMenuOpen();
    }
    onFocusSelection({ path: column.value });
  };

  onButton = button => {
    this.button = button;
  };

  render() {
    let { column, query, disabled } = this.props;
    let title;
    if (query != null) {
      title = `Hide "${column.label}" in the output`;
    } else if (column.card === "seq") {
      title = `Show "${
        column.label
      }" in the output. The count will be shown because the attribute is plural`;
    } else {
      title = `Show "${column.label}" in the output.`;
    }
    return (
      <Menu.MenuButton
        disabled={disabled}
        ref={this.onButton}
        title={title}
        selected={query != null}
        icon={query != null ? "✓" : null}
        menu={
          feature.ENABLE_ATTRIBUTE_CONTEXT_MENU &&
          !disabled && [
            <Menu.MenuButtonSecondary
              icon={<Icon.IconPlus />}
              title={`Link "${column.label}" query`}
              onClick={this.onAddQuery}
              key="define"
            >
              Link {column.label}
            </Menu.MenuButtonSecondary>,
            <Menu.MenuButtonSecondary
              icon="⇩"
              title={`Follow "${
                column.label
              }" and discard all other attributes`}
              onClick={this.onNavigate}
              key="navigate"
            >
              Follow {column.label}
            </Menu.MenuButtonSecondary>,
            column.card === "seq" && (
              <Menu.MenuButtonSecondary
                icon="∑"
                title={`Compute summarizations for "${column.label}"`}
                onClick={this.onAggregate}
                key="summarize"
              >
                Summarize {column.label}
              </Menu.MenuButtonSecondary>
            ),
            <Menu.MenuButtonSecondary
              icon="•"
              title={`Deselect all columns but "${column.label}"`}
              onClick={this.onFocusSelection}
              key="focus-selection"
            >
              Select only {column.label}
            </Menu.MenuButtonSecondary>
          ]
        }
        onClick={this.onSelect}
      >
        <HBox flexShrink={1} flexGrow={1} alignItems="center">
          <Label
            label={
              column.card === "seq" && !column.fromQuery
                ? `# ${column.label}`
                : column.label
            }
          />
          {column.fromQuery && <TagLabel marginLeft="auto">Query</TagLabel>}
        </HBox>
      </Menu.MenuButton>
    );
  }
}

function getNavigationIndex(
  query: QueryPipeline
): { [key: string]: QueryPipeline } {
  const noNavigation = {};
  if (query.pipeline.length === 0) {
    return noNavigation;
  }
  const lastIndex = query.pipeline.length - 1;
  const last = query.pipeline[lastIndex];
  const navigation = {};
  if (last.name === "navigate") {
    navigation[last.path] = query;
  } else if (last.name === "select") {
    for (let name in last.select) {
      if (!last.select.hasOwnProperty(name)) {
        continue;
      }
      navigation[name] = last.select[name];
    }
  }
  return navigation;
}
