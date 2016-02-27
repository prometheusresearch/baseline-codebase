/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import {VBox} from 'rex-widget/layout';
import * as stylesheet from 'rex-widget/stylesheet';
import * as css from 'rex-widget/css';

export let style = stylesheet.create({
  Root: {
    Component: VBox,
    borderBottom: css.border(1, '#eee'),
    padding: css.padding(5, 0),
  },
  Title: {
    marginBottom: 5,
    fontWeight: 'bold',
    fontSize: '90%',
  },
  Children: {
    Component: VBox
  }
});

export default function Filter({title, children}) {
  return (
    <style.Root>
      {title && <style.Title>{title}</style.Title>}
      <style.Children>{children}</style.Children>
    </style.Root>
  );
}


