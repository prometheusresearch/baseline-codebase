/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import * as Nav from '@prometheusresearch/react-ui-0.21/topNav';

import {style} from 'react-dom-stylesheet';


let Container = style('div', {
  display: 'flex',
  maxWidth: 1024,
  margin: '0 auto',
});

let Section = style('div', {
  flex: 1,
  padding: '10px'
});

function menuItems(items, mountPoint) {
  let hasSelected = false;
  items = sortedItems(items).map(item => {
    let href = mountPoint + item.id;
    let selected = href === (window.location.origin + window.location.pathname);
    hasSelected = hasSelected || selected;
    return (
      <Nav.PrimaryMenuItem
        variant={{selected}}
        key={item.id}
        href={href}>
        {String(item.title)}
      </Nav.PrimaryMenuItem>
    );
  });
  return {items, hasSelected};
}

export function TopNav({demos, recons, mountPoint}) {
  let {items: entryItems, hasSelected: entrySelected} = menuItems(
    demos, mountPoint + '/demo/');
  let {items: reconItems, hasSelected: reconSelected} = menuItems(
    recons, mountPoint + '/recon/');
  let home = (
    <Nav.PrimaryButton
      key="home"
      href={mountPoint}
      variant={{selected: mountPoint + '/' === window.location.origin + window.location.pathname}}>
      Home
    </Nav.PrimaryButton>
  );
  let entry = (
    <Nav.PrimaryMenu
      key="entry"
      items={entryItems}
      variant={{selected: entrySelected}}>
      Entry
    </Nav.PrimaryMenu>
  );
  let recon = (
    <Nav.PrimaryMenu
      key="recon"
      items={reconItems}
      variant={{selected: reconSelected}}>
      Reconciliation
    </Nav.PrimaryMenu>
  );
  return (
    <Nav.Navigation
      title="Rex Forms Demo"
      menu={[home, entry, recon]}
      />
  );
}

export default class Menu extends React.Component {

  static propTypes = {
    mountPoint: PropTypes.string.isRequired,
    demos: PropTypes.object.isRequired,
    recons: PropTypes.object.isRequired
  };


  render() {
    return (
      <div>
        <TopNav
          mountPoint={this.props.mountPoint}
          demos={this.props.demos}
          recons={this.props.recons}
          />
        <Container>
          <Section>
            <MenuItems
              title="Entry demos"
              items={this.props.demos}
              urlPrefix={this.props.mountPoint + '/demo/'}
              />
          </Section>
          <Section>
            <MenuItems
              title="Reconciliation demos"
              items={this.props.recons}
              urlPrefix={this.props.mountPoint + '/recon/'}
              />
          </Section>
        </Container>
      </div>
    );
  }
}

function MenuItems({title, items, urlPrefix}) {
  let buttons = sortedItems(items).map(item =>
    <ReactUI.QuietButton
      key={item.id}
      attach={{left: true, right: true}}
      textAlign="left"
      width="100%"
      href={urlPrefix + item.id}>
      {item.title}
      {item.validation_errors &&
        <ReactUI.Block inline marginLeft="small">
          <ReactUI.ErrorText title={item.validation_errors}>
            INVALID CONFIGURATION
          </ReactUI.ErrorText>
        </ReactUI.Block>
      }
    </ReactUI.QuietButton>
  );
  return (
    <ReactUI.Card>
      <ReactUI.Block margin="small">
        <ReactUI.LabelText>{title}</ReactUI.LabelText>
      </ReactUI.Block>
      <ReactUI.Block marginV="small">
        {buttons}
      </ReactUI.Block>
    </ReactUI.Card>
  );
}

function sortedItems(items) {
  return Object.keys(items)
    .sort((a, b) => {
      let titleA = items[a].title.toUpperCase();
      let titleB = items[b].title.toUpperCase();
      if (titleA < titleB) {
        return -1;
      } else if (titleA > titleB) {
        return 1;
      } else {
        return 0;
      }
    })
    .map(id => items[id]);
}
