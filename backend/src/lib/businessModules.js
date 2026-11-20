const MODULES_BY_TYPE = Object.freeze({
  product: ['commerce'],
  service: ['services'],
  restaurant: ['menu'],
  hybrid: ['commerce', 'services', 'menu'],
});

export function businessModulesFor(type = 'product') {
  return [...(MODULES_BY_TYPE[type] || MODULES_BY_TYPE.product)];
}