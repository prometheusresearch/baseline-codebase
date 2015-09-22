/**
 * @copyright 2015, Prometheus Research, LLC
 */

import ActionButton from '../ActionButton';

export default ActionButton.style({

  Self: {
    width: '100%',
    cursor: 'pointer',
    padding: '8px 15px',
    color: '#888',
    fontSize: '90%',
    fontWeight: 'bold',
    hover: {
      textDecoration: 'none',
      background: '#f1f1f1',
      color: '#444',
    },
    active: {
      background: '#b1b1b1',
      color: '#f1f1f1',
    },
  },

  Icon: {
    marginRight: 10
  }
});
