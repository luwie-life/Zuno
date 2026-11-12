export function publicStoreBusinessFields(b, accepting, acceptingServices) {
  return {
    name: b.name,
    slug: b.slug,
    businessType: ['product', 'service', 'both'].includes(b.businessType) ? b.businessType : 'product',
    description: b.description,
    category: b.category,
    phone: b.phone,
    email: b.email,
    address: b.address,
    logoUrl: b.logoUrl,
    brandColor: b.brandColor,
    deliveryFee: b.deliveryFee,
    timezone: b.timezone || 'Africa/Lagos',
    acceptingOrders: accepting,
    acceptingServices,
  };
}
