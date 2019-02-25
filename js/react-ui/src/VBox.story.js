/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import VBox from './VBox';

function Box(props) {
  return (
    <VBox {...props} border={{width: 1, style: 'solid', color: 'red'}} padding={10} />
  );
}

storiesOf('<VBox />', module)
  .add('Simple', () => (
    <Box>
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Box>
  ))
  .add('flexGrow prop', () => (
    <Box height={200}>
      <Box flexGrow={1}>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Box>
  ))
  .add('alignItems props', () => (
    <Box alignItems="center">
      <Box width={50} height={50}>1</Box>
      <Box width={50} height={50}>2</Box>
      <Box width={50} height={50}>3</Box>
    </Box>
  ))
  .add('justifyContent props', () => (
    <Box height={200} justifyContent="center">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Box>
  ));
