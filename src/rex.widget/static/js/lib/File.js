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
/**
 * Can be called in a variety of ways to
 * upload, download, or delete an uploaded file.
 *
 * Renders a Box containing an HBox which contains:
 *
 * - an icon
 *   if **icon** is provided it is displayed, otherwise
 *   if **progress** is not 0 the "repeat" icon is displayed, otherwise
 *   if **required** is true or **hover** is false 
 *   the "ok" icon is displayed, otherwise
 *   the "remove" icon is displayed. 
 * - children or the filename or 'Remove file'
 *   if **children** is provided it is displayed, otherwise
 *   if **file.name** exists it is displayed, otherwise
 *   "Remove file" is displayed.
 * - a <Progress> widget
 */
export default class File extends React.Component {

  static propTypes = {
    /**
     * **hover** controls aspects of the display.
     */
    hover: React.PropTypes.bool,

    /**
     * The file object.  The 'name' attribute contains the filename. 
     * When provided, **children** should not be. 
     */
    file: React.PropTypes.object,

    /**
     * If provided, the name of the icon to display.
     */
    icon: React.PropTypes.string,

    /**
     * **required** controls aspects of the display.
     */
    required: React.PropTypes.bool,

    /**
     * children to be rendered.
     * Rendered only when **progress** is not 0,
     * **required** is true, and **hover** is false.
     */
    children: React.PropTypes.element,

    /**
     * Function to call when the HBox is clicked.
     * Only enabled when **required** is false and **progress** is 0.
     */
    onRemove: React.PropTypes.func,

    /**
     * progress - a value between 0 and 1.
     * Default is 0.
     * 0 means no progress, 1 means completed. 
     */
    progress: React.PropTypes.number
  };

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
