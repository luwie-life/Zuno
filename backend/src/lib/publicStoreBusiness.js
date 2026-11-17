const displayValue = (value, fallback) => typeof value === 'string' && value.trim() ? value.trim() : fallback;
export function publicStoreBusinessFields(b, accepting, acceptingServices) {
  const identity = b.storefront?.identity || {};
  const contact = b.storefront?.contact || {};
  const addressLine = displayValue(contact.address, '');
  const city = displayValue(contact.city, '');
  return {
    name: displayValue(identity.displayName, b.name),
    slug: b.slug,
    businessType: ['product', 'service', 'both'].includes(b.businessType) ? b.businessType : 'product',
    description: displayValue(identity.description, b.description),
    category: b.category,
    phone: displayValue(contact.phone, b.phone),
    email: displayValue(contact.email, b.email),
    address: addressLine || city ? { line: addressLine || b.address?.line, city: city || b.address?.city, state: b.address?.state } : b.address,
    logoUrl: displayValue(identity.logo, b.logoUrl),
    brandColor: displayValue(b.storefront?.theme?.primaryColor, b.brandColor),
    deliveryFee: b.deliveryFee,
    timezone: b.timezone || 'Africa/Lagos',
    acceptingOrders: accepting,
    acceptingServices,
  };
}
