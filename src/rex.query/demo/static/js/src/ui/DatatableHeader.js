/**
 * @flow
 */

import invariant from 'invariant';
import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-dom-stylesheet';
import * as css from 'react-dom-stylesheet/css';

import * as qn from '../model/QueryNavigation';
import * as q from '../model/Query';

type DatatableHeaderProps = {
  query: q.Query;
};

export function DatatableHeader(props: DatatableHeaderProps) {
  let {query} = props;
  let navigation = qn.getQueryNavigation(query);
  return (
    <VBox width="100%">
      <Header nav={navigation} />
    </VBox>
  );
}

let Column = style(HBox, {
  textAlign: 'left',
  background: 'white',
  fontSize: '70%',
  fontWeight: 500,
  textTransform: 'uppercase',
  borderRight: css.border(1, '#aaa'),
  borderBottom: css.border(1, '#aaa'),
});

function Header({nav}: {nav: qn.QueryNavigation}) {
  if (nav.type === 'navigate') {
    return (
      <VBox grow={1}>
        {nav.navigate.map(nav => <Header nav={nav} />)}
      </VBox>
    );
  } else if (nav.type === 'select') {
    return (
      <HBox width="100%">
        {nav.select.map(nav => <Header nav={nav} />)}
      </HBox>
    );
  } else if (nav.type === 'column') {
    return <Column padding={10}>{nav.query.path}</Column>;
  } else {
    invariant(false, 'Unknown query nav: %s', nav.type);
  }
}
