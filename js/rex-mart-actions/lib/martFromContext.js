export default function martFromContext({mart}) {
  // Currently it relies on the variable name
  // Probably it would be better if we look through all entities and
  // find out the one of type 'rexmart_inventory'
  return mart && mart.id ? mart.id : mart;
}
