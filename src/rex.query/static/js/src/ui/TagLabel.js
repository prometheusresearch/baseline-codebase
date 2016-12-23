/**
 * @flow
 */

import React from 'react';
import {css, Element} from 'react-stylesheet';

export default function TagLabel(props: Object) {
  return (
    <Element
      display="inline-block"
      background={css.rgb(136)}
      color={css.rgb(255)}
      borderRadius={2}
      fontSize="6pt"
      padding={3}
      {...props}
      />
  );
}
