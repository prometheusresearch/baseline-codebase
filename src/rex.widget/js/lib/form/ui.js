/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {style, VBox} from '@prometheusresearch/react-ui';

export let Hint = style('div', {
  base: {
    fontSize: '75%',
    textAlign: 'left',
    marginTop: '5px',
  },
});

export let FieldsetLabel = style('label', {
  base: {
    color: '#000',
    fontSize: '100%',
    fontWeight: 700,
  },
});

export let ErrorMessage = style('span', {
  base: {
    color: 'red',
    marginLeft: 3,
    marginRight: 3,
    display: 'inline-block',
  },
});

export let HeaderContainer = style(VBox, {
  base: {
    marginTop: 15,
    marginBottom: 15,
  },
});

export let RequiredSign = function() {
  return <ErrorMessage style={{width: 3}}>*</ErrorMessage>;
};

export let FieldsetHeader = function({label, hint, isRequired, ...props}) {
  if (!label && !hint) {
    return <noscript />;
  }
  return (
    <HeaderContainer {...props}>
      {label &&
        <FieldsetLabel>
          {label} {isRequired && <RequiredSign />}
        </FieldsetLabel>}
      {hint &&
        <Hint>
          {hint}
        </Hint>}
    </HeaderContainer>
  );
};
