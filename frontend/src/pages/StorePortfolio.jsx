import { useOutletContext, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api.js';
import { ErrorNote, Empty, Loading, useApi } from '../components/ui.jsx';

function PortfolioCard({ project, storeBase }) {
  return (
    <Link
      to={`${storeBase}/portfolio/${project.slug}`}
      className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="aspect-[4/3] overflow-hidden bg-paper">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="p-5">
        {project.category && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {project.category}
          </p>
        )}

        <h2 className="mt-2 text-lg font-semibold">
          {project.title}
        </h2>

        {project.summary && (
          <p className="mt-2 line-clamp-3 text-sm text-muted">
            {project.summary}
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
          View project
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function StorePortfolio() {
  const { slug: pathSlug } = useParams();
  const { slug: contextSlug, storeBase: contextBase, color } = useOutletContext();

  const slug = pathSlug || contextSlug;
  const storeBase = contextBase || `/store/${slug}`;

  const { data, loading, error } = useApi(
    () => api(`/store/${slug}/portfolio`, { auth: false }),
    [slug],
  );

  if (loading) return <Loading />;

  if (error) return <ErrorNote error={error} />;

  const business = data?.business;
  const projects = data?.items || [];

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to={storeBase || '/'}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to business
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Our work
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Portfolio
          </h1>

          <p className="mt-3 max-w-2xl text-muted">
            Explore selected projects and work from {business?.name || 'this business'}.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted">
          <BriefcaseBusiness className="h-4 w-4" />
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </div>
      </div>

      {projects.length === 0 ? (
        <Empty
          title="No projects published yet"
          hint="This business has not added any portfolio projects yet."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <PortfolioCard
              key={project._id || project.slug}
              project={project}
              storeBase={storeBase}
            />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-paper p-6 md:p-8">
        <h2 className="text-xl font-semibold">
          Interested in working together?
        </h2>

        <p className="mt-2 text-sm text-muted">
          Contact {business?.name || 'the business'} to discuss your project.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {business?.phone && (
            <a
              href={`https://wa.me/${business.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ background: color }}
            >
              Contact on WhatsApp
            </a>
          )}

          <Link to={`${storeBase}/services`} className="btn-secondary">
            View services
          </Link>
        </div>
      </div>
    </section>
  );
}

export function StorePortfolioProject() {
  const { slug: pathSlug, projectSlug } = useParams();
  const { slug: contextSlug, storeBase: contextBase } = useOutletContext();

  const slug = pathSlug || contextSlug;
  const storeBase = contextBase || `/store/${slug}`;

  const { data, loading, error } = useApi(
    () => api(`/store/${slug}/portfolio/${projectSlug}`, { auth: false }),
    [slug, projectSlug],
  );

  if (loading) return <Loading />;

  if (error) {
    return (
      <Empty
        title="Project not found"
        hint="This project may have been unpublished or removed."
        action={
          <Link className="btn-secondary" to={`${storeBase}/portfolio`}>
            Back to portfolio
          </Link>
        }
      />
    );
  }

  const project = data?.project;
  const business = data?.business;

  if (!project) return null;

  const images = [
    project.coverImage,
    ...(project.galleryImages || []),
  ].filter(Boolean);

  return (
    <article className="mx-auto max-w-4xl">
      <Link
        to={`${storeBase}/portfolio`}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to portfolio
      </Link>

      <header className="mt-6">
        {project.category && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {project.category}
          </p>
        )}

        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          {project.title}
        </h1>

        {project.summary && (
          <p className="mt-4 max-w-3xl text-lg text-muted">
            {project.summary}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted">
          {project.client && <span className="rounded-full bg-paper px-3 py-1">Client: {project.client}</span>}
          {project.projectDate && (
            <span className="rounded-full bg-paper px-3 py-1">
              {new Date(project.projectDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </header>

      {images.length > 0 && (
        <div className="mt-8 grid gap-4">
          {images.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`${project.title} — image ${index + 1}`}
              className="max-h-[680px] w-full rounded-2xl border border-line bg-paper object-cover"
            />
          ))}
        </div>
      )}

      {project.description && (
        <div className="mt-8 whitespace-pre-line text-base leading-8 text-muted">
          {project.description}
        </div>
      )}

      {project.servicesProvided?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold">Services provided</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.servicesProvided.map((item) => (
              <span key={item} className="rounded-full bg-paper px-4 py-2 text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {project.tags?.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="text-xs text-muted">#{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl bg-paper p-6 md:p-8">
        <h2 className="text-xl font-semibold">
          Have a project in mind?
        </h2>

        <p className="mt-2 text-sm text-muted">
          Get in touch with {business?.name || 'this business'} to discuss your requirements.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {business?.phone && (
            <a
              href={`https://wa.me/${business.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              Contact business
            </a>
          )}

          <Link to={`${storeBase}/services`} className="btn-secondary">
            Explore services
          </Link>
        </div>
      </div>
    </article>
  );
}
