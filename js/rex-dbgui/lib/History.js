// @flow

export function toActionName(actionType: string, table: string) {
  return `${actionType}-${table.replace(/_/g, '-')}`;
}

export function fromHash(pathname: string) {
  let path = decodeURIComponent(pathname.slice(1));
  let table = null;
  let remainder = null;
  let re = /^dbgui\.context\[table=(.+?)\]/;
  let match = path.match(re);
  if (match) {
    table = match[1];
    remainder = path.substr(match[0].length);

    let defaultRemainder = `/${toActionName('pick', table)}`;
    let remainderAllowed = false;
    [
      defaultRemainder,
      '/view-source',
    ].map((s) => {
      [s + '/', s + '?', s + '['].map((start) => {
        // $FlowFixMe: ...
        if (remainder.substr(0, start.length) == start) {
          remainderAllowed = true;
        }
      });
      if (!remainderAllowed && remainder == s) {
        remainderAllowed = true;
      }
    });

    if (!remainderAllowed) {
      remainder = defaultRemainder;
    }
  }
  return {table, remainder};
}

export function toHash(table: string, remainder: ?string) {
  return table === null ? '' : `dbgui.context[table=${table}]${remainder || ''}`;
}

export function recordLink(table: string, id: string) {
  let pick = toActionName('pick', table);
  let view = toActionName('view', table);
  return toHash(table, `/${pick}[${id}]/${view}`);
}
