/**
 * @flow
 */

import * as React from 'react';
import {Element, HBox} from 'react-stylesheet';
import * as Dropdown from './dropdown';

export default class SwatchColorPicker extends React.Component {
  props: {
    value: ?string,
    onChange: (string) => *,
    colorList: Array<string>,
    menuSize: number,
    swatchWidth: number,
    swatchHeight: number,
    menuPosition: 'left' | 'right',
  };

  static defaultProps = {
    swatchWidth: 25,
    swatchHeight: 25,
    menuSize: 8,
    menuPosition: 'left',
  };

  onSelection = (value: string) => {
    this.props.onChange(value);
  };

  render() {
    const {
      value,
      colorList,
      menuSize,
      menuPosition,
      swatchWidth,
      swatchHeight,
    } = this.props;
    return (
      <Dropdown.Wrapper onSelection={this.onSelection} tag={Element} position="relative">
        <Dropdown.Button
          tag={ColorSwatch}
          width={swatchWidth}
          height={swatchHeight}
          color={value ? value : '#000'}
        />
        <Dropdown.Menu>
          <ColorMenu
            size={menuSize}
            position={menuPosition}
            colorList={colorList}
            swatchWidth={swatchWidth}
            swatchHeight={swatchHeight}
          />
        </Dropdown.Menu>
      </Dropdown.Wrapper>
    );
  }
}

class ColorMenu extends React.Component {
  render() {
    const {colorList, size, position, swatchWidth, swatchHeight} = this.props;
    const menu = colorList.map(color => (
      <Dropdown.MenuItem
        tag={ColorSwatch}
        key={color}
        value={color}
        color={color}
        width={swatchWidth}
        height={swatchHeight}
      />
    ));
    const borderWidth = 1;
    const padding = 5;
    const width = swatchWidth * size + 2 * borderWidth + 2 * padding;
    return (
      <HBox
        overflow="visible"
        flexWrap="wrap"
        lineHeight={0}
        boxShadow="rgba(0, 0, 0, 0.14902) 0px 3px 12px"
        borderRadius={2}
        padding={padding}
        border={{
          width: borderWidth,
          style: 'solid',
          color: 'rgba(0, 0, 0, 0.2)',
        }}
        background="#fff"
        position="absolute"
        left={position === 'right' ? -width + 31 : -5}
        zIndex={100}
        width={width}>
        <Element
          position="absolute"
          borderTop={{width: 8, style: 'solid', color: 'transparent'}}
          borderLeft={{width: 8, style: 'solid', color: 'transparent'}}
          borderRight={{width: 8, style: 'solid', color: 'transparent'}}
          borderBottom={{
            width: 8,
            style: 'solid',
            color: 'rgba(0, 0, 0, 0.14902)',
          }}
          top={-16}
          right={position === 'right' ? 9 : undefined}
          left={position === 'left' ? 9 : undefined}
        />
        <Element
          position="absolute"
          borderTop={{width: 7, style: 'solid', color: 'transparent'}}
          borderLeft={{width: 7, style: 'solid', color: 'transparent'}}
          borderRight={{width: 7, style: 'solid', color: 'transparent'}}
          borderBottom={{
            width: 7,
            style: 'solid',
            color: 'rgb(255, 255, 255)',
          }}
          top={-14}
          right={position === 'right' ? 10 : undefined}
          left={position === 'left' ? 10 : undefined}
        />
        {menu}
      </HBox>
    );
  }
}

class ColorSwatch extends React.Component {
  static defaultProps = {
    width: 25,
    height: 25,
  };

  render() {
    const {color, width, height, ...props} = this.props;
    return (
      <Element
        {...props}
        display="inline-block"
        width={width}
        height={height}
        zIndexOnHover={10}
        boxShadowOnHover="rgba(0, 0, 0, 0.25) 0px 0px 5px 2px"
        positionOnHover="relative"
        outlineOnHover="rgb(255, 255, 255) solid 2px"
        outlineOnActive="rgb(255, 255, 255) solid 2px"
        outlineOnFocus="rgb(255, 255, 255) solid 2px">
        <Element background={color ? color : '#000'} width="100%" height="100%" />
      </Element>
    );
  }
}
