/**
 * @copyright 2015, Prometheus Research, LLC
 */

import styling from 'styling';
import {border, insetBoxShadow, rgba} from './StyleUtils';

export let input = styling({
  display: 'block',
  width: '100%',
  height: 34,
  padding: '6px 12px',
  fontSize: 14,
  color: '#555',
  backgroundColor: '#fff',
  backgroundImage: 'none',
  border: border(1, 'solid', '#ccc'),
  borderRadius: 2,
  boxShadow: insetBoxShadow(0, 1, 1, 0, rgba(0, 0, 0, 0.075)),
  focus: {
    borderColor: '#66afe9',
    outline: 0,
    boxShadow: insetBoxShadow(0, 1, 1, 0, rgba(0, 0, 0, 0.075))
  }
});

export let icon = styling({
  position: 'absolute',
  top: 10,
  right: 8,
});
