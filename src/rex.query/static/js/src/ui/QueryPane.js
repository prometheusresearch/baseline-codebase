/**
 * @flow
 */

import React from 'react';

import {style, VBox} from 'react-stylesheet';
import * as Theme from './Theme';

type ShapeProps = {
  children?: React$Element<*>;
  first?: boolean;
  variant: {selected?: boolean, invalid?: boolean};
};

function createPane({displayName, theme, noActiveBorder, strokeDasharray}: {
  displayName: string;
  theme: Theme.QueryVisTheme;
  noActiveBorder?: boolean;
  strokeDasharray?: string;
}) {

  function Shape({children, first, variant, ...props}: ShapeProps) {
    let selected = variant && variant.selected;
    let invalid = variant && variant.invalid;
    return (
      <VBox {...props}
        left={1}
        style={{zIndex: selected ? 1 : 0}}>
        <PaneShape
          fill={theme.backgroundColor}
          stroke={!invalid ? theme.borderColor : Theme.invalid.borderColor}
          strokeWidth={!invalid ? 1 : 2}
          strokeDasharray={strokeDasharray}
          selected={selected && !noActiveBorder}
          topTriangle={first}
          />
        <Overlay>
          <PaneChildrenWrapper style={{color: theme.textColor}}>
            {children}
          </PaneChildrenWrapper>
        </Overlay>
      </VBox>
    );
  }

  Shape.displayName = displayName;

  return Shape;
}

function PaneShape({
  fill,
  stroke,
  strokeWidth = 1,
  strokeDasharray,
  selected,
  topTriangle
}) {
  let top = topTriangle ? '' : '20,0 15,5 10,0';
  let bottom = '10,35 15,40 20,35';
  let end = open ? '' : '300,0';
  let points = `300,0 ${top} 0,0 0,35 ${bottom} 300,35 ${end}`;
  return (
    <svg
      style={{padding: 1}}
      viewBox="0 0 300 40"
      width="100%"
      height="40px">
      <polyline
        fill={fill}
        stroke={stroke}
        strokeDasharray={strokeDasharray}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="miter"
        points={points}
        />
      {selected &&
        <polyline
          stroke={stroke}
          strokeWidth={6}
          strokeLinecap="square"
          strokeLinejoin="miter"
          points="0,3 0,32"
          />}
    </svg>
  );
}

class Overlay extends React.Component {

  static style = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  };

  render() {
    let {children} = this.props;
    return (
      <div style={this.constructor.style}>
        {children}
      </div>
    );
  }

}

let PaneChildrenWrapper = style('div', {
  base: {
    zIndex: 100,
    paddingTop: 3,
  }
});

export let NavigatePane = createPane({
  displayName: 'NavigatePane',
  theme: Theme.entity
});

export let AggregatePane = createPane({
  displayName: 'AggregatePane',
  theme: Theme.aggregate
});

export let GroupPane = createPane({
  displayName: 'GroupPane',
  theme: Theme.group,
});

export let DefinePane = createPane({
  displayName: 'DefinePane',
  theme: Theme.traverse
});

export let FilterPane = createPane({
  displayName: 'FilterPane',
  theme: Theme.filter
});

export let SelectPane = createPane({
  displayName: 'SelectPane',
  theme: Theme.select
});

export let DefaultPane = createPane({
  displayName: 'SelectPane',
  theme: Theme.placeholder,
  noActiveBorder: true,
  strokeDasharray: '2, 2',
});

export let PlainPane = createPane({
  displayName: 'PlainPane',
  theme: Theme.placeholder,
});
