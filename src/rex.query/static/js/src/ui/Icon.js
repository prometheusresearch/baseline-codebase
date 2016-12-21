/**
 * @flow
 */

import React from 'react';
import IconFilter from 'react-icons/lib/fa/filter';
import IconCogs from 'react-icons/lib/fa/cogs';
import IconRemove from 'react-icons/lib/fa/trash';

export {IconFilter, IconCogs, IconRemove};

function makeIconFromUnicodeSymbol({displayName = 'Icon', symbol}) {
  let Icon = () => <span style={{verticalAlign: 'middle'}}>{symbol}</span>;
  Icon.displayName = displayName;
  return Icon;
}

export let IconPlus = makeIconFromUnicodeSymbol({displayName: 'IconPlus', symbol: '＋'});
export let IconSum = makeIconFromUnicodeSymbol({displayName: 'IconSum', symbol: '∑'});
export let IconDiv = makeIconFromUnicodeSymbol({displayName: 'IconDiv', symbol: '/'});
