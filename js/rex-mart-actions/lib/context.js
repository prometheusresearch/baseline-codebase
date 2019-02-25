/**
 * @copyright 2016, Prometheus Research, LLC
 */


export function getDefinitionContext(currentContext, definitionId) {
  let defKey = 'mart_defn__' + definitionId;

  let ctx = {
    [defKey]: 'yes'
  };

  Object.keys(currentContext).forEach((key) => {
    if (key.startsWith('mart_defn__') && (key !== defKey)) {
      ctx[key] = null;
    }
  });

  return ctx;
}


export function getToolContext(currentContext, tools = []) {
  let ctx = {};
  tools.forEach((tool) => {
    ctx['mart_tool__' + tool] = 'yes';
  });

  Object.keys(currentContext).forEach((key) => {
    if (key.startsWith('mart_tool__') && !(key in ctx)) {
      ctx[key] = null;
    }
  });

  return ctx;
}

