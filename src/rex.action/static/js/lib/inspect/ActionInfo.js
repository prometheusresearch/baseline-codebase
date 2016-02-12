/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react'

import Action from '../Action';
import {autobind, emptyFunction} from 'rex-widget/lang';
import * as ui from 'rex-widget/ui';
import * as css from 'rex-widget/css';
import * as stylesheet from 'rex-widget/stylesheet';
import * as layout from 'rex-widget/layout';
import LockIcon from 'babel!react-icons/fa/lock';
import ActionPanel from './ui/ActionPanel';

export default class ActionInfo extends React.Component {

  static defaultProps = {
    onSelect: emptyFunction,
  };

  static stylesheet = stylesheet.create({
    Root: {
      Component: ActionPanel,
      Header: {
        selectable: {
          cursor: 'pointer',
          hover: {
            background: '#f1f1f1',
          },
        }
      },
      Root: {
        selected: {
          background: '#eaeaea',
        }
      }
    },
    Header: {
      Component: layout.HBox,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    Content: {
      Component: layout.VBox,
      padding: 10,
      overflow: 'auto',
    },
    Path: {
      fontSize: '70%',
      fontWeight: 'normal',
      fontFamily: 'Menlo, Monaco, monospace',
    },
    Title: {
      fontSize: '90%',
      marginBottom: 5,
    },
    Type: {
      fontSize: '80%',
      padding: css.padding(3, 5),
      color: '#fff',
      background: '#aaa',
    },
    IconWrapper: {
      fontSize: '70%',
      position: css.position.relative,
      marginRight: 3,
      top: -1,
    },
  });

  render() {
    let {
      info, selected, selectable,
      title = this.props.info.title, type, children
    } = this.props;
    let {
      Root, Content, Header,
      Path, Title, Doc,
      Type, IconWrapper, Source
    } = this.stylesheet;
    let routeTitle = info.location ?
      `${info.location.name}:${info.location.start.line}` :
      undefined;
    let header = (
      <Header variant={{selected, selectable}}>
        <layout.VBox marginRight={10}>
          {title &&
            <Title>{title}</Title>}
          <layout.HBox>
            {info.access === 'nobody' &&
              <IconWrapper title="Access set to 'nobody'"><LockIcon /></IconWrapper>}
            <Path title={routeTitle}>{info.path || info.id}</Path>
          </layout.HBox>
        </layout.VBox>
        <layout.HBox>
          <Type>{type || info.type}</Type>
        </layout.HBox>
      </Header>
    );
    return (
      <Root onClick={this.onClick} variant={{selected, selectable}} header={header}>
        {children}
      </Root>
    );
  }

  get stylesheet() {
    return this.props.stylesheet || this.constructor.stylesheet;
  }

  @autobind
  onClick() {
    this.props.onSelect(this.props.info.path, this.props.info);
  }
}

