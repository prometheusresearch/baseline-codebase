/**
 * @flow
 */

import React from 'react';
import {Element} from 'react-stylesheet';

type HeaderProps = {
  children: React.Element<*>,
};

export default function Header({children, ...props}: HeaderProps) {
  return (
    <Element
      margin={0}
      paddingTop={20}
      paddingBottom={10}
      paddingLeft={20}
      paddingRight={20}
      Component="h4"
      fontSize="11pt"
      fontWeight={300}
      {...props}
      >
      {children}
    </Element>
  );
}
