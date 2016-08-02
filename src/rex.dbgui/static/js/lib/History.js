

export function toActionName(actionType, table) {
  return `${actionType}-${table.replace(/_/g, '-')}`;
}

export function fromHash() {
  let path = window.location.hash.substr(1);
  let table = null;
  let remainder = null;
  let re = /^\/dbgui\.context\[table=(.+?)\]/;
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
      if (remainder.substr(0, s.length) == s) {
        remainderAllowed = true;
      }
    });

    if (!remainderAllowed) {
      remainder = defaultRemainder;
    }
  }
  return {table, remainder};
}

export function toHash(table, remainder) {
  return `/dbgui.context[table=${table}]${remainder || ''}`;
}

export function recordLink(table, id) {
  let pick = toActionName('pick', table);
  let view = toActionName('view', table);
  return toHash(table, `/${pick}[${id}]/${view}`);
}
