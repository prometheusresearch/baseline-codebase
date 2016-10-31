/**
 * @flow
 */

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';
import IconRemove from 'react-icons/lib/fa/trash';
import IconCircleO from 'react-icons/lib/fa/circle-o'
import IconCircle from 'react-icons/lib/fa/circle'

type QueryVisButtonHeaderProps = {
  stylesheet: {
    Root: typeof VBox;
    Button: typeof VBox;
  };
  label: string;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  disableRemove: boolean;
  disableToggle: boolean;
};

export default class QueryVisButtonHeader
  extends React.Component<*, QueryVisButtonHeaderProps, *> {

  state: {
    active: boolean;
    hover: boolean;
  };

  state = {
    active: true,
    hover: false,
  };

  onMouseEnter = () => {
    this.setState({hover: true});
  };

  onMouseLeave = () => {
    this.setState({hover: false});
  };

  toggleActive = (e: UIEvent) => {
    e.stopPropagation();
    let active = !this.state.active;
    this.setState({active});
  };

  onSelect = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onSelect();
  };

  onRemove = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onRemove();
  };

  render() {
    let {
      label, selected, disableRemove, disableToggle,
      stylesheet: {Root, Button},
    } = this.props;
    let {
      active, hover
    } = this.state;

    let buttonLabel = (
      <QueryVisButtonLabel>
        <HBox grow={1} alignItems="center">
          <VBox
            paddingRight={5}
            style={{
              visibility: !disableToggle && (!active || selected || hover)
                ? 'visible'
                : 'hidden'
            }}>
            <Button disableActive onClick={this.toggleActive}>
              {active ? <IconCircle /> : <IconCircleO />}
            </Button>
          </VBox>
          <VBox grow={1}>{label}</VBox>
          {!disableRemove &&
            <HBox
              style={{visibility: selected || hover ? 'visible' : 'hidden'}}>
              <Button onClick={this.onRemove}>
                <IconRemove />
              </Button>
            </HBox>}
        </HBox>
      </QueryVisButtonLabel>
    );

    let stripe = selected && (
      <Root
        position="absolute"
        top={0}
        right={-6}
        width={6}
        grow={1}
        />
    );

    return (
      <Root
        variant={{selected}}
        onClick={this.onSelect}
        onMouseOver={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}>
        {buttonLabel}
        {stripe}
      </Root>
    );
  }
}

export let QueryVisButtonLabel = style(HBox, {
  displayName: 'QueryVisButtonLabel',
  base: {
    userSelect: 'none',
    cursor: 'default',
    fontSize: '9pt',
    fontWeight: 400,
    padding: 6,
    width: '100%',
    height: 32,
  }
});
