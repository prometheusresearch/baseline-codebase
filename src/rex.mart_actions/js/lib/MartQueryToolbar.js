import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {HBox} from '@prometheusresearch/react-box';

export default function MartQueryToolbar({
  saving,
  title,
  saveDisabled,
  onChangeTitle,
  onSave,
  onClone,
}) {
  let isValidTitle = title !== null && !!title.replace(/\s+$/, '').replace(/^\s+/, '');
  return (
    <HBox>
      <HBox padding={2}>
        <ReactUI.Input
          style={{marginRight: 2, height: 21, fontWeight: 200, padding: '0px 6px'}}
          disabled={saving}
          value={title}
          onChange={onChangeTitle}
        />
      </HBox>
      <ReactUI.QuietButton
        disabled={!isValidTitle || saving || saveDisabled}
        size="small"
        onClick={onSave}>
        Save
      </ReactUI.QuietButton>
      {onClone &&
        <ReactUI.QuietButton
          disabled={!isValidTitle || saving}
          size="small"
          onClick={onClone}>
          Clone
        </ReactUI.QuietButton>}
    </HBox>
  );
}
