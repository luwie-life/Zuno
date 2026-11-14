import { Link, useOutletContext } from 'react-router-dom';
import { useApi } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { naira } from '../lib/format.js';
import {
  normalizeStorefrontConfig,
  getStorefrontPage,
  getBusinessCapabilities,
  isSectionAllowedForBusiness,
  isElementAllowedForBusiness,
} from '../lib/storefront.js';
import { useMemo } from 'react';
import './storefront-templates.css';

function SectionHeading({ title, subtitle }) {
  if (!title && !subtitle) return null;

  return (
    <div className="mb-6">
      {title && (
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function getResponsiveGridClass(type, columns) {
  const value = Number(columns);

  const layouts = {
    products: {
      2: 'grid-cols-2 md:grid-cols-2',
      3: 'grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    },
    services: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    },
    gallery: {
      2: 'grid-cols-2',
      3: 'grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    },
    portfolio: {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    },
  };

  return layouts[type]?.[value] || layouts[type]?.[3];
}

function getElementStyle(element, theme = {}) {
  const style = element.style || {};

  const weights = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };

  return {
    color: style.color || undefined,
    backgroundColor: style.backgroundColor || undefined,
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
    fontWeight: weights[style.fontWeight] || undefined,
    textAlign: style.textAlign || undefined,
    width: style.width && style.width !== 'auto' ? style.width : undefined,
    height: style.height && style.height !== 'auto' ? style.height : undefined,
    padding: style.padding || undefined,
    margin: style.margin || undefined,
    borderRadius: style.borderRadius || undefined,
    opacity: style.opacity ?? 1,
    objectFit: style.objectFit || 'cover',
  };
}

function getSectionCanvasMinHeight(section) {
  const elements = section.elements || [];

  const positionedElements = elements.filter(
    (element) => element.style?.positioned === true
  );

  if (!positionedElements.length) return undefined;

  const lowestPoint = positionedElements.reduce((maximum, element) => {
    const style = element.style || {};
    const y = Number(style.y) || 0;
    const height = Number.parseFloat(style.height) || 80;

    return Math.max(maximum, y + height);
  }, 0);

  return `${Math.max(160, lowestPoint + 40)}px`;
}

function getAnimationStyle(animation = {}) {
  const presets = {
    none: '',
    fade: 'zuno-animate-fade',
    fade_up: 'zuno-animate-fade-up',
    fade_down: 'zuno-animate-fade-down',
    slide_left: 'zuno-animate-slide-left',
    slide_right: 'zuno-animate-slide-right',
    zoom: 'zuno-animate-zoom',
  };

  return {
    className: presets[animation.preset] || '',
    style: {
      animationDuration: `${animation.duration || 500}ms`,
      animationDelay: `${animation.delay || 0}ms`,
    },
  };
}

function getActionDestination(action, context) {
  if (!action || !action.type || action.type === 'none') return null;

  const value = String(action.value || '').trim();

  switch (action.type) {
    case 'page': {
      if (!value) return context.storeBase || '/';

      const page = (context.storefront.pages || []).find(
        (item) => item.id === value || item.slug === value
      );

      if (!page) {
        return `${context.storeBase}/${value.replace(/^\/+/, '')}`;
      }

      return page.isHome
        ? context.storeBase || '/'
        : `${context.storeBase}/${page.slug}`;
    }

    case 'external':
    case 'url':
      return value;

    case 'whatsapp': {
      const phone = value.replace(/\D/g, '');
      return phone ? `https://wa.me/${phone}` : null;
    }

    case 'phone':
      return value ? `tel:${value.replace(/\s/g, '')}` : null;

    case 'email':
      return value ? `mailto:${value}` : null;

    case 'products':
      return `${context.storeBase}/products`;

    case 'services':
      return `${context.storeBase}/services`;

    case 'booking':
      return `${context.storeBase}/services`;

    case 'contact':
      return `${context.storeBase}/contact`;

    default:
      return null;
  }
}

function ActionLink({
  action,
  context,
  children,
  className = '',
  style = {},
}) {
  const destination = getActionDestination(action, context);

  if (!destination) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  const external = /^(https?:\/\/|mailto:|tel:)/i.test(destination);

  if (external) {
    return (
      <a
        href={destination}
        target={
          action?.target === '_blank' && /^https?:\/\//i.test(destination)
            ? '_blank'
            : undefined
        }
        rel="noreferrer"
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={destination} className={className} style={style}>
      {children}
    </Link>
  );
}

function ElementProducts({ element, context }) {
  const limit = Number(element.settings?.limit) || 8;

  const { data, loading } = useApi(
    () => api(`/store/${context.slug}/products?limit=${limit}`, { auth: false }),
    [context.slug, limit]
  );

  const products = data?.items || [];

  if (loading) {
    return <p className="py-5 text-sm text-muted">Loading products…</p>;
  }

  if (!products.length) {
    return (
      <p className="py-5 text-sm text-muted">
        Products will appear here when available.
      </p>
    );
  }

  return (
    <div
  className={`grid gap-4 ${getResponsiveGridClass(
    'products',
    element.settings?.columns || 4
  )}`}
>
      {products.map((product) => (
        <article
          key={product.id}
          className="overflow-hidden rounded-2xl border border-line bg-white"
        >
          <Link
            to={`${context.storeBase}/p/${product.id}`}
            className="block aspect-square bg-paper"
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

          <div className="p-3">
            <Link
              to={`${context.storeBase}/p/${product.id}`}
              className="text-sm font-medium"
            >
              {product.name}
            </Link>

            <p className="mt-2 font-bold">{naira(product.price)}</p>

            <button
              type="button"
              className="btn-secondary mt-3 w-full"
              disabled={
                !product.inStock ||
                !context.biz.acceptingOrders ||
                !context.cart?.add
              }
              onClick={() => context.cart?.add?.(product)}
            >
              {product.inStock ? 'Add to cart' : 'Out of stock'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ElementServices({ element, context }) {
  const limit = Number(element.settings?.limit) || 6;

  const { data, loading } = useApi(
    () => api(`/store/${context.slug}/services`, { auth: false }),
    [context.slug]
  );

  const services = (data?.items || []).slice(0, limit);

  if (loading) {
    return <p className="py-5 text-sm text-muted">Loading services…</p>;
  }

  if (!services.length) {
    return (
      <p className="py-5 text-sm text-muted">
        Services will appear here when available.
      </p>
    );
  }

  return (
    <div
  className={`grid gap-4 ${getResponsiveGridClass(
    'services',
    element.settings?.columns || 2
  )}`}
>
      {services.map((service) => (
        <article
          key={service.id}
          className="rounded-2xl border border-line bg-white p-5"
        >
          <p className="text-xs uppercase tracking-wider text-muted">
            {service.category || 'Service'}
          </p>

          <h3 className="mt-2 text-lg font-semibold">{service.name}</h3>

          {service.description && (
            <p className="mt-2 text-sm leading-6 text-muted">
              {service.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <strong>{naira(service.price)}</strong>

            <Link
              className="btn-primary"
              style={{ background: context.color }}
              to={`${context.storeBase}/services/${service.id}`}
            >
              Book now
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function ElementRenderer({
  element,
  context,
  editorMode,
  onSelectElement,
  selectedElementId,
}) {
  if (!element || element.visible === false) return null;

  if (!isElementAllowedForBusiness(element.type, context.biz.businessType)) {
    return null;
  }

  const style = getElementStyle(element, context.theme);
  const animation = getAnimationStyle(element.animation);
  const content = element.content || '';
  const children = element.children || [];

  const selectElement = (event) => {
    if (!editorMode) return;

    event.preventDefault();
    event.stopPropagation();

    onSelectElement?.(element.id);
  };

  const commonProps = {
    style: {
      ...style,
      ...animation.style,
    },
    className: `${animation.className} ${editorMode ? 'cursor-pointer' : ''}`,
    'data-editor-element': element.id,
  };

  let output = null;

  switch (element.type) {
    case 'heading':
      output = (
        <h2
          {...commonProps}
          className={`${commonProps.className} font-bold tracking-tight`}
        >
          {content}
        </h2>
      );
      break;

    case 'text':
      output = (
        <p
          {...commonProps}
          className={`${commonProps.className} whitespace-pre-line leading-7`}
        >
          {content}
        </p>
      );
      break;

    case 'button':
      output = (
        <ActionLink
          action={element.action}
          context={context}
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white"
          style={{
            ...style,
            background: style.backgroundColor || context.color,
          }}
        >
          {content || 'Learn more'}
        </ActionLink>
      );
      break;

    case 'image':
      output = element.src ? (
        <img
          {...commonProps}
          src={element.src}
          alt={element.settings?.alt || ''}
          loading="lazy"
          className={`${commonProps.className} max-w-full`}
        />
      ) : null;
      break;

    case 'spacer':
      output = (
        <div
          aria-hidden="true"
          style={{ height: element.settings?.height || 40 }}
        />
      );
      break;

    case 'divider':
      output = (
        <hr
          {...commonProps}
          className={`${commonProps.className} border-t border-line`}
        />
      );
      break;

    case 'columns':
    case 'grid':
      output = (
        <div
          {...commonProps}
          className={`${commonProps.className} grid gap-4`}
          style={{
            ...style,
            gridTemplateColumns: `repeat(${Math.max(
              1,
              Math.min(4, Number(element.settings?.columns) || 2)
            )}, minmax(0, 1fr))`,
          }}
        >
          {children.map((child) => (
            <ElementRenderer
              key={child.id}
              element={child}
              context={context}
              editorMode={editorMode}
              onSelectElement={onSelectElement}
              selectedElementId={selectedElementId}
            />
          ))}
        </div>
      );
      break;

    case 'gallery': {
      const images = element.settings?.images || [];

      output = (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((image, index) => {
            const src = typeof image === 'string' ? image : image?.url;

            if (!src) return null;

            return (
              <img
                key={`${src}-${index}`}
                src={src}
                alt={image?.alt || ''}
                className="aspect-square w-full rounded-2xl object-cover"
                loading="lazy"
              />
            );
          })}
        </div>
      );
      break;
    }

    case 'icon':
      output = (
        <span
          {...commonProps}
          aria-hidden="true"
          className={`${commonProps.className} inline-flex text-3xl`}
        >
          {element.settings?.icon || '✦'}
        </span>
      );
      break;

    case 'video':
      output = element.src ? (
        <video
          {...commonProps}
          src={element.src}
          controls
          playsInline
          className={`${commonProps.className} w-full rounded-2xl`}
        />
      ) : null;
      break;

    case 'product_list':
      output = <ElementProducts element={element} context={context} />;
      break;

    case 'service_list':
      output = <ElementServices element={element} context={context} />;
      break;

    case 'booking_button':
      output = (
        <Link
          to={`${context.storeBase}/services`}
          className="btn-primary inline-flex"
          style={{ background: context.color }}
        >
          {content || 'Book an appointment'}
        </Link>
      );
      break;

    case 'contact_form':
      output = (
        <ContactSection
          settings={{
            title: element.settings?.title || 'Get in touch',
            description: element.settings?.description || content,
            buttonText: element.settings?.buttonText || 'Contact us',
          }}
          context={context}
        />
      );
      break;

    default:
      output = null;
  }

  if (!output) return null;

  const elementStyle = element.style || {};
  const isPositioned = elementStyle.positioned === true;

  if (!editorMode && !isPositioned) return output;

  return (
    <div
      onClickCapture={editorMode ? selectElement : undefined}
      className={editorMode ? 'relative' : ''}
      style={{
        ...(isPositioned
          ? {
              position: 'fixed',
              left: `${Math.max(0, Number(elementStyle.x) || 0)}px`,
              top: `${Math.max(0, Number(elementStyle.y) || 0)}px`,
              width: 'fit-content',
              maxWidth: '100%',
              zIndex: 5,
            }
          : {}),
        ...(editorMode
          ? {
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }
          : {}),
      }}
      {...(editorMode
        ? {
            'data-editor-element-wrapper': element.id,
            'data-editor-element': element.id,
          }
        : {})}
    >
      {output}
    </div>
  );
}

function HeroSection({ settings, context, children }) {
  const image = settings.backgroundImage || settings.image;
  const buttonLink = settings.buttonLink || settings.ctaLink || '';
  const buttonText = settings.buttonText || settings.ctaText || '';
  const external = /^https?:\/\//i.test(buttonLink);

  const destination = external
    ? buttonLink
    : `${context.storeBase || ''}${
        buttonLink.startsWith('/') ? buttonLink : `/${buttonLink}`
      }`;

  return (
    <section
      className="relative mb-10 overflow-hidden rounded-3xl bg-gray-900 text-white"
      style={{
        minHeight:
          settings.height === 'small'
            ? 280
            : settings.height === 'large'
              ? 480
              : 360,

        backgroundColor: settings.backgroundColor || '#111827',

        backgroundImage: image
          ? `linear-gradient(90deg, rgba(0,0,0,.45), rgba(0,0,0,.12)), url("${image}")`
          : settings.backgroundColor
            ? 'none'
            : 'linear-gradient(120deg, #102f27, #111827)',

        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div
        className={`flex min-h-[280px] flex-col justify-center p-7 md:p-14 ${
          settings.alignment === 'center'
            ? 'items-center text-center'
            : 'items-start text-left'
        }`}
      >
        {children !== undefined ? (
          children
        ) : (
          <>
            {settings.eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                {settings.eyebrow}
              </p>
            )}

            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
              {settings.title || context.biz.name}
            </h1>

            {settings.subtitle && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-lg">
                {settings.subtitle}
              </p>
            )}

            {buttonText && buttonLink && (
              external ? (
                <a
                  href={destination}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900"
                >
                  {buttonText}
                </a>
              ) : (
                <Link
                  to={destination}
                  className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900"
                >
                  {buttonText}
                </Link>
              )
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ProductSection({ settings, context }) {
  return (
    <section className="py-10">
      <SectionHeading
        title={settings.title || 'Our products'}
        subtitle={settings.subtitle}
      />
      <ElementProducts element={{ settings }} context={context} />
    </section>
  );
}

function ServicesSection({ settings, context }) {
  return (
    <section className="py-10">
      <SectionHeading
        title={settings.title || 'Our services'}
        subtitle={settings.subtitle}
      />
      <ElementServices element={{ settings }} context={context} />
    </section>
  );
}

function PortfolioSection({ settings, context }) {
  const limit = Number(settings.limit) || 6;

  const { data, loading } = useApi(
    () => api(`/store/${context.slug}/portfolio`, { auth: false }),
    [context.slug]
  );

  const projects = (data?.items || []).slice(0, limit);

  return (
    <section className="py-10">
      <SectionHeading
        title={settings.title || 'Selected projects'}
        subtitle={settings.subtitle}
      />

      {loading ? (
        <p className="text-sm text-muted">Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted">
          Projects will appear here when available.
        </p>
      ) : (
        <div
  className={`grid gap-5 ${getResponsiveGridClass(
    'portfolio',
    settings.columns || 3
  )}`}
>
          {projects.map((project) => (
            <Link
              key={project._id || project.slug}
              to={`${context.storeBase}/portfolio/${project.slug}`}
              className="group overflow-hidden rounded-2xl border border-line bg-white"
            >
              {project.coverImage && (
                <img
                  src={project.coverImage}
                  alt={project.title}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
              )}

              <div className="p-4">
                <h3 className="font-semibold">{project.title}</h3>

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
    </section>
  );
}

function ContactSection({ settings, context }) {
  const phone = String(context.biz.phone || '').replace(/\D/g, '');

  const message = encodeURIComponent(
    settings.message ||
      `Hello ${context.biz.name}, I would like to make an enquiry.`
  );

  return (
    <section className="my-10 rounded-3xl bg-gray-950 px-6 py-10 text-white md:px-10">
      <h2 className="text-2xl font-bold">
        {settings.title || 'Let’s work together'}
      </h2>

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
          style={{ background: context.color }}
        >
          {settings.buttonText || 'Contact us'}
        </a>
      )}
    </section>
  );
}

function LegacySection({ section, context }) {
  const settings = section.settings || {};

  switch (section.type) {
    case 'hero':
      return <HeroSection settings={settings} context={context} />;

    case 'about':
      return (
        <section className="grid items-center gap-8 py-10 md:grid-cols-2">
          {settings.image && (
            <img
              src={settings.image}
              alt={settings.title || 'About us'}
              className={`max-h-[440px] w-full rounded-3xl object-cover ${
  settings.imagePosition === 'right' ? 'md:order-2' : 'md:order-1'
}`}
              loading="lazy"
            />
          )}

          <div
  className={
    settings.imagePosition === 'right' ? 'md:order-1' : 'md:order-2'
  }
>
            <SectionHeading
              title={settings.title || 'About us'}
              subtitle={settings.subtitle}
            />
            <p className="whitespace-pre-line text-sm leading-7 text-muted md:text-base">
              {settings.description}
            </p>
          </div>
        </section>
      );

    case 'image_text':
      return (
        <section className="grid items-center gap-8 py-10 md:grid-cols-2">
          <img
            src={settings.image}
            alt={settings.title || ''}
            className={`max-h-[440px] w-full rounded-3xl object-cover ${
  settings.imagePosition === 'right' ? 'md:order-2' : 'md:order-1'
}`}
            loading="lazy"
          />

          <div
  className={
    settings.imagePosition === 'right' ? 'md:order-1' : 'md:order-2'
  }
>
            <SectionHeading
              title={settings.title}
              subtitle={settings.subtitle}
            />
            <p className="whitespace-pre-line text-sm leading-7 text-muted">
              {settings.description}
            </p>
          </div>
        </section>
      );

    case 'rich_text':
    case 'custom_content':
      return (
        <section className="py-8">
          <SectionHeading
            title={settings.title}
            subtitle={settings.subtitle}
          />
          <div className="max-w-3xl whitespace-pre-line text-sm leading-7 text-muted">
            {settings.content || settings.description}
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section className="py-10">
          <SectionHeading
            title={settings.title || 'Gallery'}
            subtitle={settings.subtitle}
          />

         <div
  className={`grid gap-3 ${getResponsiveGridClass(
    'gallery',
    settings.columns || 3
  )}`}
>
            {(settings.images || []).map((image, index) => {
              const src = typeof image === 'string' ? image : image?.url;

              return src ? (
                <img
                  key={`${src}-${index}`}
                  src={src}
                  alt={image?.alt || ''}
                  className="aspect-square w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              ) : null;
            })}
          </div>
        </section>
      );

    case 'product_grid':
    case 'featured_products':
      return <ProductSection settings={settings} context={context} />;

    case 'services':
    case 'featured_services':
    case 'service_packages':
      return <ServicesSection settings={settings} context={context} />;

    case 'portfolio_grid':
    case 'featured_projects':
      return <PortfolioSection settings={settings} context={context} />;

    case 'contact':
      return <ContactSection settings={settings} context={context} />;

    case 'faq':
      return (
        <section className="py-10">
          <SectionHeading
            title={settings.title || 'Frequently asked questions'}
          />

          <div className="divide-y divide-line rounded-2xl border border-line bg-white px-5">
            {(settings.items || []).map((item, index) => (
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

    case 'social_links':
      return (
        <section className="flex flex-wrap gap-4 py-8">
          {(settings.links || []).map((item, index) => (
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

    case 'announcement':
      return settings.text ? (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-center text-sm font-medium text-white"
          style={{ background: context.color }}
        >
          {settings.text}
        </div>
      ) : null;

        case 'navigation': {
      const alignmentClasses = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      };

      const linkStyleClasses = {
        plain: 'hover:underline',
        underline: 'underline underline-offset-4',
        pill: 'rounded-full px-4 py-2 hover:bg-black/5',
      };

      return (
        <nav
          className={`mb-6 flex w-full flex-wrap items-center gap-3 border-b border-line pb-4 ${
            alignmentClasses[settings.alignment] || 'justify-start'
          }`}
          style={{
            backgroundColor: settings.backgroundColor || 'transparent',
          }}
        >
          {(context.storefront.pages || [])
            .filter((page) => page.visible)
            .map((page) => (
              <Link
                key={page.id}
                to={
                  page.isHome
                    ? context.storeBase || '/'
                    : `${context.storeBase}/${page.slug}`
                }
                className={`text-sm font-medium transition-colors ${
                  linkStyleClasses[settings.linkStyle] ||
                  linkStyleClasses.plain
                }`}
                style={{
                  color: settings.textColor || 'inherit',
                }}
              >
                {page.title}
              </Link>
            ))}
        </nav>
      );
    }

    case 'categories':
      return (
        <section className="py-8">
          <SectionHeading
            title={settings.title || 'Browse categories'}
          />

          <div className="flex flex-wrap gap-2">
            {context.categories.map((category) => (
              <span
                key={category._id}
                className="rounded-full border border-line px-4 py-2 text-sm"
              >
                {category.name}
              </span>
            ))}
          </div>
        </section>
      );

    case 'booking':
      return context.capabilities.services ? (
        <section className="py-8">
          <SectionHeading
            title={settings.title || 'Ready to book?'}
            subtitle={settings.subtitle}
          />

          <Link
            className="btn-primary"
            style={{ background: context.color }}
            to={`${context.storeBase}/services`}
          >
            {settings.buttonText || 'View available services'}
          </Link>
        </section>
      ) : null;

    case 'footer':
      return (
        <div className="border-t border-line py-8 text-center text-sm text-muted">
          {settings.text || context.biz.name}
        </div>
      );

    default:
      return null;
  }
}

function SectionRenderer({
  section,
  context,
  editorMode = false,
  selectedSectionId,
  onSelectSection,
  selectedElementId,
  onSelectElement,
}) {
  if (section.visible === false) return null;

  if (!isSectionAllowedForBusiness(section.type, context.biz.businessType)) {
    return null;
  }

  const legacyContent = section.settings?.editableContent
    ? null
    : (
        <LegacySection
          section={section}
          context={context}
        />
      );

  const renderElementList = (elements) =>
    (elements || []).map((element) => (
      <ElementRenderer
        key={element.id}
        element={element}
        context={context}
        editorMode={editorMode}
        onSelectElement={(elementId) =>
          onSelectElement?.(elementId, section.id)
        }
        selectedElementId={selectedElementId}
      />
    ));

  const editableElements = (
    <div
      className={`relative min-h-8 ${
        section.elements?.length ? 'space-y-4 py-6' : ''
      }`}
      data-editor-element-dropzone={section.id}
    >
      {renderElementList(section.elements)}

      {editorMode && !section.elements?.length && (
        <div className="pointer-events-none flex min-h-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3 text-[11px] text-slate-400">
          Drop elements into this section
        </div>
      )}
    </div>
  );

  const editableTemplateContent = (() => {
    if (!section.settings?.editableContent) return null;

    switch (section.type) {
      case 'hero':
        return (
          <HeroSection settings={section.settings} context={context}>
            {editableElements}
          </HeroSection>
        );

      case 'about':
      case 'image_text': {
        const images = (section.elements || []).filter(
          (element) => element.type === 'image'
        );

        const contentElements = (section.elements || []).filter(
          (element) => element.type !== 'image'
        );

        const imageOnRight = section.settings.imagePosition === 'right';

        return (
          <section
            className="grid items-center gap-8 py-10 md:grid-cols-2"
            data-editor-element-dropzone={section.id}
          >
            <div className={imageOnRight ? 'md:order-2' : 'md:order-1'}>
              {renderElementList(images)}
            </div>

            <div className={imageOnRight ? 'md:order-1' : 'md:order-2'}>
              {renderElementList(contentElements)}
            </div>

            {editorMode && !section.elements?.length && (
              <div className="col-span-full flex min-h-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3 text-[11px] text-slate-400">
                Drop elements into this section
              </div>
            )}
          </section>
        );
      }

      case 'rich_text':
      case 'custom_content':
        return (
          <section className="py-8">
            <div
              className="max-w-3xl"
              data-editor-element-dropzone={section.id}
            >
              {renderElementList(section.elements)}

              {editorMode && !section.elements?.length && (
                <div className="flex min-h-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3 text-[11px] text-slate-400">
                  Drop elements into this section
                </div>
              )}
            </div>
          </section>
        );

      case 'announcement':
        return (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-center text-sm font-medium text-white"
            style={{ background: context.color }}
            data-editor-element-dropzone={section.id}
          >
            {renderElementList(section.elements)}

            {editorMode && !section.elements?.length && (
              <div className="flex min-h-8 items-center justify-center text-[11px] text-white/70">
                Drop elements into this banner
              </div>
            )}
          </div>
        );

      case 'footer':
        return (
          <div
            className="border-t border-line py-8 text-center text-sm text-muted"
            data-editor-element-dropzone={section.id}
          >
            {renderElementList(section.elements)}

            {editorMode && !section.elements?.length && (
              <div className="flex min-h-8 items-center justify-center text-[11px] text-muted">
                Drop elements into this footer
              </div>
            )}
          </div>
        );

      default:
        return editableElements;
    }
  })();

  const content = section.settings?.editableContent
    ? editableTemplateContent
    : (
        <>
          {legacyContent}
          {editableElements}
        </>
      );

  // Positioned elements now belong to the page canvas,
  // not to an individual section's height.
  const sectionMinHeight = undefined;

  if (!editorMode) {
    return (
      <div
        className="relative"
        style={{
          minHeight: sectionMinHeight,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      onClickCapture={(event) => {
        const elementWrapper = event.target.closest(
          '[data-editor-element-wrapper]'
        );

        if (elementWrapper) {
          const elementId = elementWrapper.getAttribute(
            'data-editor-element-wrapper'
          );

          if (elementId) {
            event.preventDefault();
            event.stopPropagation();
            onSelectElement?.(elementId, section.id);
            return;
          }
        }

        event.preventDefault();
        event.stopPropagation();
        onSelectSection?.(section.id);
      }}
      className={`relative cursor-pointer transition ${
        selectedSectionId === section.id
          ? 'outline outline-2 outline-offset-2 outline-emerald-600'
          : 'hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-emerald-300'
      }`}
      data-editor-section={section.id}
      style={{
        minHeight: sectionMinHeight,
      }}
    >
      {selectedSectionId === section.id && (
        <div className="absolute right-2 top-2 z-30 rounded-md bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white shadow">
          Selected section
        </div>
      )}

      {content}
    </div>
  );
}

export function StorefrontRenderer({
  pageSlug = 'home',
  biz: suppliedBiz,
  categories: suppliedCategories,
  cart: suppliedCart,
  slug: suppliedSlug,
  color: suppliedColor,
  storeBase: suppliedStoreBase,
  storefront: suppliedStorefront,
  editorMode = false,
  selectedSectionId = '',
  onSelectSection,
  selectedElementId = '',
  onSelectElement,
}) {
  const outletContext = useOutletContext() || {};

  const biz = suppliedBiz || outletContext.biz || {};
  const categories = suppliedCategories || outletContext.categories || [];
  const cart = suppliedCart || outletContext.cart || null;
  const slug = suppliedSlug || outletContext.slug || biz.slug || '';
  const color =
    suppliedColor || outletContext.color || biz.brandColor || '#0B3D2E';

  const storeBase =
    suppliedStoreBase ?? outletContext.storeBase ?? `/store/${slug}`;

  const storefrontSource = suppliedStorefront || biz.storefront || {};

  const storefront = useMemo(
    () => normalizeStorefrontConfig(storefrontSource, biz.name),
    [storefrontSource, biz.name]
  );

  const page = getStorefrontPage(storefront, pageSlug);
  const capabilities = getBusinessCapabilities(biz.businessType);

  // Calculate the full page canvas height using globally positioned
  // elements so elements placed far down remain reachable.
  const pageCanvasMinHeight = (page?.sections || []).reduce(
    (maximum, section) =>
      (section.elements || []).reduce((sectionMaximum, element) => {
        const style = element.style || {};

        if (style.positioned !== true) {
          return sectionMaximum;
        }

        const y = Math.max(0, Number(style.y) || 0);
        const height = Number.parseFloat(style.height) || 80;

        return Math.max(sectionMaximum, y + height + 60);
      }, maximum),
    900
  );

  const theme = storefront.theme || {};

  const context = {
    biz,
    categories,
    cart,
    slug,
    color: theme.primaryColor || color,
    storeBase,
    storefront,
    theme,
    capabilities,
  };

  return (
    <div
      data-zuno-template={storefront.templateId || 'modern-business'}
      className={editorMode ? 'storefront-editor-renderer' : ''}
      style={{
        backgroundColor: theme.backgroundColor || '#FFFFFF',
        color: theme.textColor || '#111827',
        fontFamily: theme.fontBody || 'Inter, sans-serif',
        minHeight: `${pageCanvasMinHeight}px`,
        position: 'relative',
        transform: 'translateZ(0)',
      }}
    >
      {page?.sections?.length ? (
        page.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            context={context}
            editorMode={editorMode}
            selectedSectionId={selectedSectionId}
            onSelectSection={onSelectSection}
            selectedElementId={selectedElementId}
            onSelectElement={onSelectElement}
          />
        ))
      ) : (
        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold">
            {page?.title || biz.name}
          </h1>
          <p className="mt-3 text-muted">{biz.description}</p>
        </div>
      )}

      {pageSlug === 'home' && !editorMode && (
        <div className="mt-10 border-t border-line py-5 text-xs text-muted">
          <Link to={`${storeBase}/order`} className="underline">
            Track an order
          </Link>
        </div>
      )}
    </div>
  );
}

export function StorefrontHome({ pageSlug = 'home' }) {
  return <StorefrontRenderer pageSlug={pageSlug} />;
}
