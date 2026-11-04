import { Link, useOutletContext } from 'react-router-dom';
import { useApi } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { naira } from '../lib/format.js';
import { normalizeStorefrontConfig, getStorefrontPage } from '../lib/storefront.js';
import { useMemo } from 'react';

function SectionHeading({ title, subtitle }) {
  if (!title && !subtitle) return null;

  return (
    <div className="mb-6">
      {title && <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>}
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">{subtitle}</p>}
    </div>
  );
}

function HeroSection({ settings, biz, color, storeBase }) {
  const image = settings.backgroundImage || settings.image;

  const buttonLink = settings.buttonLink || settings.ctaLink || '';
  const buttonText = settings.buttonText || settings.ctaText || '';

  const destination = buttonLink.startsWith('http')
    ? buttonLink
    : `${storeBase || ''}${buttonLink.startsWith('/') ? buttonLink : `/${buttonLink}`}`;

  return (
    <section
      className="relative mb-10 overflow-hidden rounded-3xl bg-gray-900 text-white"
      style={{
        minHeight: settings.height === 'small' ? 280 : settings.height === 'large' ? 480 : 360,
        backgroundImage: image
          ? `linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.18)), url("${image}")`
          : 'linear-gradient(120deg, #102f27, #111827)',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className={`flex min-h-[280px] flex-col justify-center p-7 md:p-14 ${
        settings.alignment === 'center' ? 'items-center text-center' : 'items-start text-left'
      }`}>
        {settings.eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
            {settings.eyebrow}
          </p>
        )}

        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
          {settings.title || biz.name}
        </h1>

        {settings.subtitle && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-lg">
            {settings.subtitle}
          </p>
        )}

        {buttonText && buttonLink && (
          <Link
            to={destination}
            className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            {buttonText}
          </Link>
        )}
      </div>
    </section>
  );
}

function AboutSection({ settings }) {
  return (
    <section className="py-10">
      <div className="grid items-center gap-8 md:grid-cols-2">
        {settings.image && (
          <img
            src={settings.image}
            alt={settings.title || 'About us'}
            className="max-h-[440px] w-full rounded-3xl object-cover"
            loading="lazy"
          />
        )}

        <div>
          <SectionHeading title={settings.title || 'About us'} subtitle={settings.subtitle} />
          {settings.description && (
            <p className="whitespace-pre-line text-sm leading-7 text-muted md:text-base">
              {settings.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ImageTextSection({ settings }) {
  const reverse = settings.layout === 'image_right';

  return (
    <section className="grid items-center gap-8 py-10 md:grid-cols-2">
      <div className={reverse ? 'md:order-2' : ''}>
        {settings.image && (
          <img
            src={settings.image}
            alt={settings.title || ''}
            className="max-h-[440px] w-full rounded-3xl object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className={reverse ? 'md:order-1' : ''}>
        <SectionHeading title={settings.title} subtitle={settings.subtitle} />
        <p className="whitespace-pre-line text-sm leading-7 text-muted md:text-base">
          {settings.description}
        </p>
      </div>
    </section>
  );
}

function RichTextSection({ settings }) {
  return (
    <section className="py-8">
      <SectionHeading title={settings.title} subtitle={settings.subtitle} />
      <div className="max-w-3xl whitespace-pre-line text-sm leading-7 text-muted md:text-base">
        {settings.content || settings.description}
      </div>
    </section>
  );
}

function GallerySection({ settings }) {
  const images = Array.isArray(settings.images) ? settings.images : [];

  if (!images.length) return null;

  return (
    <section className="py-10">
      <SectionHeading title={settings.title || 'Gallery'} subtitle={settings.subtitle} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((image, index) => {
          const src = typeof image === 'string' ? image : image?.url;

          if (!src) return null;

          return (
            <img
              key={`${src}-${index}`}
              src={src}
              alt={typeof image === 'object' ? image.alt || '' : ''}
              className="aspect-square w-full rounded-2xl object-cover"
              loading="lazy"
            />
          );
        })}
      </div>
    </section>
  );
}

function ProductSection({ settings, slug, storeBase, cart, biz }) {
  const { data, loading } = useApi(
    () => api(`/store/${slug}/products?limit=${settings.limit || 8}`, { auth: false }),
    [slug, settings.limit]
  );

  const products = data?.items || [];

  return (
    <section className="py-10">
      <SectionHeading
        title={settings.title || 'Our products'}
        subtitle={settings.subtitle}
      />

      {loading ? (
        <p className="text-sm text-muted">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted">Products will appear here when available.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <article key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
              <Link
                to={`${storeBase}/p/${product.id}`}
                className="aspect-square bg-paper"
              >
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    No image
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col p-3">
                <Link to={`${storeBase}/p/${product.id}`} className="text-sm font-medium">
                  {product.name}
                </Link>

                <p className="mt-2 font-bold">{naira(product.price)}</p>

                <button
                  type="button"
                  className="btn-secondary mt-3 w-full"
                  disabled={!product.inStock || !biz.acceptingOrders}
                  onClick={() => cart.add(product)}
                >
                  {product.inStock ? 'Add to cart' : 'Out of stock'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ServicesSection({ settings, slug, storeBase, color }) {
  const { data, loading } = useApi(
    () => api(`/store/${slug}/services`, { auth: false }),
    [slug]
  );

  const services = (data?.items || []).slice(0, settings.limit || 6);

  return (
    <section className="py-10">
      <SectionHeading
        title={settings.title || 'Our services'}
        subtitle={settings.subtitle}
      />

      {loading ? (
        <p className="text-sm text-muted">Loading services…</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-muted">Services will appear here when available.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <article key={service.id} className="rounded-2xl border border-line bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-muted">
                {service.category || 'Service'}
              </p>

              <h3 className="mt-2 text-lg font-semibold">{service.name}</h3>

              <p className="mt-2 text-sm leading-6 text-muted">
                {service.description}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <strong>{naira(service.price)}</strong>
                <Link
                  className="btn-primary"
                  style={{ background: color }}
                  to={`${storeBase}/services/${service.id}`}
                >
                  Book now
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PortfolioSection({ settings, slug, storeBase }) {
  const { data, loading } = useApi(
    () => api(`/store/${slug}/portfolio`, { auth: false }),
    [slug]
  );

  const projects = (data?.items || []).slice(0, settings.limit || 6);

  return (
    <section className="py-10">
      <SectionHeading
        title={settings.title || 'Selected projects'}
        subtitle={settings.subtitle}
      />

      {loading ? (
        <p className="text-sm text-muted">Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted">Projects will appear here when available.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project._id || project.slug}
              to={`${storeBase}/portfolio/${project.slug}`}
              className="group overflow-hidden rounded-2xl border border-line bg-white"
            >
              {project.coverImage && (
                <img
                  src={project.coverImage}
                  alt={project.title}
                  className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              )}

              <div className="p-4">
                {project.category && (
                  <p className="text-xs uppercase tracking-wider text-muted">
                    {project.category}
                  </p>
                )}

                <h3 className="mt-2 font-semibold">{project.title}</h3>

                {project.summary && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted">
                    {project.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5">
        <Link className="text-sm font-semibold underline" to={`${storeBase}/portfolio`}>
          View all projects
        </Link>
      </div>
    </section>
  );
}

function ContactSection({ settings, biz, color }) {
  const phone = String(biz.phone || '').replace(/\D/g, '');
  const message = encodeURIComponent(
    settings.message || `Hello ${biz.name}, I would like to make an enquiry.`
  );

  return (
    <section className="my-10 rounded-3xl bg-gray-950 px-6 py-10 text-white md:px-10">
      <h2 className="text-2xl font-bold">{settings.title || 'Let’s work together'}</h2>

      {settings.description && (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
          {settings.description}
        </p>
      )}

      {phone && (
        <a
          href={`https://wa.me/${phone}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
          style={{ background: color }}
        >
          {settings.buttonText || 'Contact us'}
        </a>
      )}
    </section>
  );
}

function FAQSection({ settings }) {
  const items = Array.isArray(settings.items) ? settings.items : [];

  if (!items.length) return null;

  return (
    <section className="py-10">
      <SectionHeading title={settings.title || 'Frequently asked questions'} />

      <div className="divide-y divide-line rounded-2xl border border-line bg-white px-5">
        {items.map((item, index) => (
          <details key={index} className="py-4">
            <summary className="cursor-pointer font-medium">
              {item.question || item.title}
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
              {item.answer || item.description}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function SocialSection({ settings }) {
  const links = Array.isArray(settings.links) ? settings.links : [];

  if (!links.length) return null;

  return (
    <section className="flex flex-wrap gap-4 py-8">
      {links.map((item, index) => (
        <a
          key={index}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium underline"
        >
          {item.label || item.platform || 'Visit'}
        </a>
      ))}
    </section>
  );
}

function SectionRenderer({ section, context }) {
  if (section.visible === false) return null;

  const settings = section.settings || {};

  switch (section.type) {
    case 'hero':
      return <HeroSection settings={settings} {...context} />;

    case 'about':
      return <AboutSection settings={settings} />;

    case 'image_text':
      return <ImageTextSection settings={settings} />;

    case 'rich_text':
    case 'custom_content':
      return <RichTextSection settings={settings} />;

    case 'gallery':
      return <GallerySection settings={settings} />;

    case 'product_grid':
    case 'featured_products':
      return <ProductSection settings={settings} {...context} />;

    case 'services':
    case 'featured_services':
    case 'service_packages':
      return <ServicesSection settings={settings} {...context} />;

    case 'portfolio_grid':
    case 'featured_projects':
      return <PortfolioSection settings={settings} {...context} />;

    case 'contact':
      return <ContactSection settings={settings} {...context} />;

    case 'faq':
      return <FAQSection settings={settings} />;

    case 'social_links':
      return <SocialSection settings={settings} />;

    case 'announcement':
      return settings.text ? (
        <div className="mb-6 rounded-xl px-4 py-3 text-center text-sm font-medium text-white" style={{ background: context.color }}>
          {settings.text}
        </div>
      ) : null;

    case 'navigation':
      return (
        <nav className="mb-6 flex flex-wrap gap-4 border-b border-line pb-4">
          {(context.storefront.pages || [])
            .filter((page) => page.visible)
            .map((page) => (
              <Link
                key={page.id}
                to={page.isHome ? context.storeBase || '/' : `${context.storeBase}/${page.slug}`}
                className="text-sm font-medium hover:underline"
              >
                {page.title}
              </Link>
            ))}
        </nav>
      );

    case 'footer':
      return (
        <div className="border-t border-line py-8 text-center text-sm text-muted">
          {settings.text || context.biz.name}
        </div>
      );

    case 'categories':
      return (
        <div className="py-8">
          <SectionHeading title={settings.title || 'Browse categories'} />
          <div className="flex flex-wrap gap-2">
            {context.categories.map((category) => (
              <span key={category._id} className="rounded-full border border-line px-4 py-2 text-sm">
                {category.name}
              </span>
            ))}
          </div>
        </div>
      );

    case 'booking':
      return (
        <section className="py-8">
          <SectionHeading title={settings.title || 'Ready to book?'} subtitle={settings.subtitle} />
          <Link className="btn-primary" style={{ background: context.color }} to={`${context.storeBase}/services`}>
            View available services
          </Link>
        </section>
      );

    default:
      return null;
  }
}

export function StorefrontHome() {
  const { biz, categories, cart, slug, color, storeBase } = useOutletContext();

  const storefront = useMemo(
    () => normalizeStorefrontConfig(biz.storefront || {}, biz.name),
    [biz.storefront, biz.name]
  );

  const page = getStorefrontPage(storefront, 'home');

  const context = {
    biz,
    categories: categories || [],
    cart,
    slug,
    color: storefront.theme?.primaryColor || color,
    storeBase,
    storefront,
  };

  const theme = storefront.theme || {};

  return (
    <div
      style={{
        backgroundColor: theme.backgroundColor || '#FFFFFF',
        color: theme.textColor || '#111827',
        fontFamily: theme.fontBody || 'Inter, sans-serif',
      }}
    >
      {page?.sections?.length ? (
        page.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            context={context}
          />
        ))
      ) : (
        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold">{biz.name}</h1>
          <p className="mt-3 text-muted">{biz.description}</p>
        </div>
      )}

      <div className="mt-10 border-t border-line py-5 text-xs text-muted">
        <Link to={`${storeBase}/order`} className="underline">
          Track an order
        </Link>
      </div>
    </div>
  );
}
