/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React       from 'react';
import Hoverable   from './Hoverable';
import Icon        from './Icon';
import {Box, HBox} from './Layout';
import ProgressBar from './ProgressBar';
import Style       from './File.module.css';

@Hoverable
export default class File extends React.Component {

  render() {
    var {hover, file, icon, required, children, onRemove, progress, ...props} = this.props;
    return (
      <Box {...props}>
        <HBox
          size={1}
          className={Style.self}
          onClick={!required && !progress && onRemove}>
          <Box centerVertically className={Style.icon}>
            {icon ?
              <Icon name={icon} /> :
              progress ?
              <Icon name="repeat" /> :
              required || !hover ?
              <Icon name="ok" /> :
              <Icon name="remove" />}
          </Box>
          <Box centerVertically>
            {progress || required || !hover ?
              children || file.name :
              'Remove file'}
          </Box>
        </HBox>
        <ProgressBar progress={progress} />
      </Box>
    );
  }
}
