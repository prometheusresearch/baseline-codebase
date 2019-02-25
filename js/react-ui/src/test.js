/**
 * @copyright 2016+, Prometheus Research, LLC
 */

export function findByType(tree, type) {
  if (typeof tree.toJSON === 'function') {
    tree = tree.toJSON();
  }
  if (tree.type === type) {
    return tree;
  } else if (tree.children) {
    for (let i = 0; i < tree.children.length; i++) {
      let found = findByType(tree.children[i], type);
      if (found !== null) {
        return found;
      }
    }
  }
  throw new Error(`Couldn't find an element of type: ${type}`);
}

export function findAllByType(tree, type) {
  if (typeof tree.toJSON === 'function') {
    tree = tree.toJSON();
  }
  let found = [];
  if (tree.type === type) {
    found.push(tree);
  }
  if (tree.children) {
    for (let i = 0; i < tree.children.length; i++) {
      found = found.concat(findAllByType(tree.children[i], type));
    }
  }
  return found;
}
