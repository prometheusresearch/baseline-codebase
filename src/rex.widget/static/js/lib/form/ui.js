/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';

import {style} from '../../stylesheet';
import {VBox} from '../../layout';

export let Hint = style('div', {
  fontSize: '75%',
  textAlign: 'left',
  marginTop: '5px',
});

export let FieldsetLabel = style('label', {
  color: '#000',
  fontSize: '100%',
  fontWeight: 700,
});

export let ErrorMessage = style('span', {
  color: 'red',
  marginLeft: 3,
  marginRight: 3,
  display: 'inline-block',
});

export let HeaderContainer = style(VBox, {
  marginTop: 15,
  marginBottom: 15,
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
