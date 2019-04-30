/**
 * @flow
 */

import type { NavigateQuery, QueryNavigation } from "../model/types";
import type { Actions } from "../state";
import type { SearchCallback } from "../ui/Search";

import React from "react";
import PropTypes from "prop-types";
import { VBox } from "react-stylesheet";

import { Menu, Theme, NavigationMenu } from "../ui";
import QueryPanelBase from "./QueryPanelBase";

type NavigateQueryPanelProps = {
  query: NavigateQuery,
  onClose: Function,
  onSearch: SearchCallback
};

export default class NavigateQueryPanel extends React.Component<NavigateQueryPanelProps> {
  context: {
    actions: Actions
  };

  static contextTypes = { actions: PropTypes.object };

  onClick = (path: string) => {
    this.context.actions.setNavigate({
      at: this.props.query,
      path
    });
  };

  render() {
    let { query, onClose, onSearch, ...rest } = this.props;
    const { NavigationMenuContents } = this;
    return (
      <QueryPanelBase
        {...rest}
        onClose={onClose}
        title={query.path}
        theme={Theme.entity}
        query={query}
      >
        <NavigationMenu onSearch={onSearch} context={query.context.prev}>
          {navigation => (
            <NavigationMenuContents {...this.props} navigation={navigation} />
          )}
        </NavigationMenu>
      </QueryPanelBase>
    );
  }

  NavigationMenuContents = (
    props: NavigateQueryPanelProps & {
      navigation: Map<string, QueryNavigation>
    }
  ) => {
    let { navigation, query } = props;
    return (
      <VBox>
        <Menu.MenuGroup>
          {Array.from(navigation.values()).map(nav => {
            let isSelected = nav.value === query.path;
            return (
              <Menu.MenuButton
                key={nav.value}
                onClick={this.onClick.bind(null, nav.value)}
                icon={isSelected ? "✓" : null}
                selected={isSelected}
              >
                {nav.label}
              </Menu.MenuButton>
            );
          })}
        </Menu.MenuGroup>
        <Menu.MenuHelp>
          Edit current query combinator by selecting another relationship to
          navigate to.
        </Menu.MenuHelp>
      </VBox>
    );
  };
}
