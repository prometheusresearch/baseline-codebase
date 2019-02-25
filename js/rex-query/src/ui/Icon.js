/**
 * @flow
 */

import React from 'react';

import IconCheck from 'react-icons/lib/fa/check';
import IconFilter from 'react-icons/lib/fa/filter';
import IconCogs from 'react-icons/lib/fa/cogs';
import IconRemove from 'react-icons/lib/fa/trash';
import IconClose from 'react-icons/lib/fa/close';
import IconArrowLeft from 'react-icons/lib/fa/arrow-left';
import IconArrowRight from 'react-icons/lib/fa/arrow-right';
import IconCircleO from 'react-icons/lib/fa/circle-o';
import IconCircle from 'react-icons/lib/fa/circle';
import IconEllipsis from 'react-icons/lib/fa/ellipsis-v';
import IconDownload from 'react-icons/lib/fa/cloud-download';
import IconSortAsc from 'react-icons/lib/fa/sort-amount-asc';
import IconSortDesc from 'react-icons/lib/fa/sort-amount-desc';
import IconBars from 'react-icons/lib/fa/bars';

export {
  IconFilter,
  IconCogs,
  IconRemove,
  IconClose,
  IconCheck,
  IconArrowLeft,
  IconArrowRight,
  IconCircleO,
  IconCircle,
  IconEllipsis,
  IconDownload,
  IconSortAsc,
  IconSortDesc,
  IconBars,
};

function makeIconFromUnicodeSymbol({displayName = 'Icon', symbol}) {
  let Icon = () => <span style={{verticalAlign: 'middle'}}>{symbol}</span>;
  Icon.displayName = displayName;
  return Icon;
}

export let IconPlus = makeIconFromUnicodeSymbol({displayName: 'IconPlus', symbol: '＋'});
export let IconSum = makeIconFromUnicodeSymbol({displayName: 'IconSum', symbol: '∑'});
export let IconDiv = makeIconFromUnicodeSymbol({displayName: 'IconDiv', symbol: '/'});
export let IconPencil = makeIconFromUnicodeSymbol({displayName: 'IconDiv', symbol: '✏'});
