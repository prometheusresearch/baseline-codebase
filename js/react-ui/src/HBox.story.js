/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import HBox from './HBox';

function Box(props) {
  return (
    <HBox {...props} border={{width: 1, style: 'solid', color: 'red'}} padding={10} />
  );
}

storiesOf('<HBox />', module)
  .add('Simple', () => (
    <Box>
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Box>
  ))
  .add('flexGrow prop', () => (
    <Box>
      <Box flexGrow={1}>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Box>
  ))
  .add('alignItems props', () => (
    <Box height={100} alignItems="center">
      <Box height={50}>1</Box>
      <Box height={50}>2</Box>
      <Box height={50}>3</Box>
    </Box>
  ))
  .add('justifyContent props', () => (
    <Box justifyContent="center">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Box>
  ));
