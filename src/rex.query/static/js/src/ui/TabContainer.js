/**
 * @flow
 */

import invariant from 'invariant';
import React from 'react';
import {Element, VBox, HBox} from 'react-stylesheet';

type TabSpec = {
  id: string,
  label?: string,
  children: ?React.Element<mixed>,
};

type TabContainerProps = {
  tabList: Array<TabSpec>,
  tabListAlt: Array<TabSpec>,
  activeTab: string,
  onActiveTab: string => void,
};

export default class TabContainer extends React.Component {

  props: TabContainerProps;

  render() {
    const {tabList, tabListAlt, activeTab, onActiveTab} = this.props;
    const tabListAll = tabList.concat(tabListAlt);
    const found = tabListAll.find(tab => tab.id === activeTab);
    invariant(found, 'Cannot find active tab');
    return (
      <VBox
        flexGrow={1}>
        <HBox
          justifyContent="space-between"
          borderBottom="1px solid #BBBBBB">
          <HBox>
            {tabList.map(tab => (
              <TabButton
                label={tab.label || tab.id}
                active={activeTab === tab.id}
                key={tab.id}
                onClick={() => onActiveTab(tab.id)}
                />
            ))}
          </HBox>
          {tabListAlt.length > 0 &&
            <HBox>
              {tabListAlt.map(tab => (
                <TabButton
                  label={tab.label || tab.id}
                  active={activeTab === tab.id}
                  key={tab.id}
                  onClick={() => onActiveTab(tab.id)}
                  />
              ))}
            </HBox>}
        </HBox>
        {found.children}
      </VBox>
    );
  }
}

function TabButton({label, active, onClick}) {
  return (
    <Element
      Component="button"
      background="#FFF"
      padding={{horizontal: 12, vertical: 7}}
      outline="none"
      color={active ? '#1f85f5' : '#444444'}
      border="none"
      borderBottom={active ? '2px solid #1f85f5' : '2px solid transparent'}
      borderBottomOnHover={active ? '2px solid #1f85f5' : '2px solid #bbbbbb'}
      fontSize="10pt"
      fontWeight={200}
      onClick={onClick}>
      {label}
    </Element>
  );
}
