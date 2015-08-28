/**
 * @copyright 2015, Prometheus Research, LLC
 */

import styling from 'styling';

export let self = styling({
  display: 'inline-block',
  marginBottom: 0,
  fontWeight: 'normal',
  textAlign: 'center',
  verticalAlign: 'middle',
  touchAction: 'manipulation',
  cursor: 'pointer',
  backgroundImage: 'none',
  whiteSpace: 'nowrap',
  padding: '6px 12px',
  fontSize: '14px',
  lineHeight: 1.428571429,
  borderRadius: '2px',
  userSelect: 'none',
  textOverflow: 'ellipsis',
  overflow: 'hidden',

  focus: {
    outline: ['thin dotted', '1px auto -webkit-focus-ring-color'],
    outlineOffset: -2,
    textDecoration: 'none',
  },

  active: {
    outline: ['thin dotted', '1px auto -webkit-focus-ring-color'],
    outlineOffset: -2,
    textDecoration: 'none',
  },

  hover: {
    textDecoration: 'none',
  },
});

export let onDefault = styling({
  color: '#333333',
  backgroundColor: '#ffffff',
  border: '1px solid #cccccc',

  hover: {
    color: '#333333',
    backgroundColor: '#e6e6e6',
    borderColor: '#adadad',
  },

  focus: {
    color: '#333333',
    backgroundColor: '#e6e6e6',
    borderColor: '#8c8c8c',
  },

  active: {
    color: '#333333',
    backgroundColor: '#d4d4d4',
    borderColor: '#8c8c8c',
    backgroundImage: 'none',
  },
});


export let onSuccess = styling({
  color: '#ffffff',
  backgroundColor: '#5cb85c',
  border: '1px solid #4cae4c',

  hover: {
    color: '#ffffff',
    backgroundColor: '#449d44',
    borderColor: '#398439',
  },

  focus: {
    color: '#ffffff',
    backgroundColor: '#449d44',
    borderColor: '#398439',
  },

  active: {
    color: '#ffffff',
    backgroundColor: '#398439',
    borderColor: '#255625',
  },
});

export let onDanger = styling({
  color: '#ffffff',
  backgroundColor: '#d9534f',
  border: '1px solid #d43f3a',

  hover: {
    color: '#ffffff',
    backgroundColor: '#c9302c',
    borderColor: '#ac2925',
  },

  focus: {
    color: '#ffffff',
    backgroundColor: '#c9302c',
    borderColor: '#761c19',
  },

  active: {
    color: '#ffffff',
    backgroundColor: '#ac2925',
    borderColor: '#761c19',
  },
});


export let onLink = styling({
  borderColor: 'transparent',
  backgroundColor: 'transparent',
  boxShadow: 'none',
  color: '#428bca',
  fontWeight: 'normal',
  borderRadius: 0,

  hover: {
    color: '#2a6496',
    textDecoration: 'underline',
  },
});

export let onQuiet = styling({
  background: 'transparent',
  color: '#888',
  border: '1px solid transparent',

  hover: {
    color: '#333333',
    backgroundColor: '#e6e6e6',
  },

  active: {
    color: '#333333',
    backgroundColor: '#d4d4d4',
  },
});

export let onSmall = styling({
  padding: '5px 10px',
  fontSize: '12px',
  lineHeight: 1.5,
  borderRadius: 2,
});

export let isExtraSmall = styling({
  padding: '1px 5px',
  fontSize: 12,
  lineHeight: 1.5,
  borderRadius: 2,
});
