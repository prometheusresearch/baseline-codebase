/**
 * @flow
 */

import {rgb, rgba} from 'react-stylesheet/css';

export type QueryVisTheme = {
  backgroundColor: string,
  backgroundColorOnHover?: string,
  backgroundColorOnActive?: string,

  textColor: string,
  textColorActive: string,

  borderColor: string,
  borderStyle?: string,
};

export let placeholder: QueryVisTheme = {
  backgroundColor: '#fff',
  backgroundColorOnHover: rgba(187, 0.15),
  backgroundColorOnActive: rgb(187),
  borderColor: '#bbb',
  borderStyle: 'dashed',
  textColor: rgb(136),
  textColorActive: rgb(136),
};

export let def: QueryVisTheme = {
  backgroundColor: '#f1f1f1',
  borderColor: '#f1f1f1',
  textColor: rgb(136),
  textColorActive: rgb(136),
};

export let entity: QueryVisTheme = {
  backgroundColor: '#7FDBFF',
  borderColor: '#33a2ce',
  textColor: '#06688e',
  textColorActive: '#06688e',
};

export let select: QueryVisTheme = {
  backgroundColor: rgb(141, 127, 255),
  borderColor: rgb(141, 127, 255),
  textColor: '#fff',
  textColorActive: '#fff',
};

export let attribute: QueryVisTheme = {
  backgroundColor: '#7FDBFF',
  borderColor: '#7FDBFF',
  textColor: '#06688e',
  textColorActive: '#06688e',
};

export let traverse: QueryVisTheme = {
  backgroundColor: '#0074D9',
  borderColor: '#0074D9',
  textColor: 'hsla(208, 100%, 85%, 1.0)',
  textColorActive: 'hsla(208, 100%, 85%, 1.0)',
};

export let filter: QueryVisTheme = {
  backgroundColor: '#ffb16e',
  borderColor: '#ca8140',
  textColor: 'hsla(28, 100%, 20%, 1.0)',
  textColorActive: 'hsla(28, 100%, 20%, 1.0)',
};

export let aggregate: QueryVisTheme = {
  backgroundColor: '#39CCCC',
  borderColor: '#2a9898',
  textColor: '#06688e',
  textColorActive: '#06688e',
};

export let group: QueryVisTheme = {
  backgroundColor: '#b264e2',
  borderColor: '#6c17a0',
  textColor: '#3e1458',
  textColorActive: '#3e1458',
};

export let invalid: QueryVisTheme = {
  backgroundColor: '#ff8181',
  borderColor: '#d01e1e',
  textColor: '#981e1e',
  textColorActive: '#981e1e',
};
