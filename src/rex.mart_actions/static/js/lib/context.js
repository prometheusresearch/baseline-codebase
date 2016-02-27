/**
 * @copyright 2016, Prometheus Research, LLC
 */


export function getDefinitionContext(currentContext, definitionId) {
  let defKey = 'mart_defn:' + definitionId;

  let ctx = {
    [defKey]: 'yes'
  };

  Object.keys(currentContext).forEach((key) => {
    if (key.startsWith('mart_defn:') && (key !== defKey)) {
      ctx[key] = null;
    }
  });

  return ctx;
}


export function getToolContext(currentContext, tools = []) {
  let ctx = {};
  tools.forEach((tool) => {
    ctx['mart_tool:' + tool] = 'yes';
  });

  Object.keys(currentContext).forEach((key) => {
    if (key.startsWith('mart_tool:') && !(key in ctx)) {
      ctx[key] = null;
    }
  });

  return ctx;
}

