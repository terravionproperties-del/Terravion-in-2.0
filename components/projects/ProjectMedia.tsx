import Image from "next/image";
import {
  mediaUrl,
  formatBytes,
  type MediaImage,
  type MediaVideo,
  type MediaDocument,
} from "@/lib/data/project-media";

/**
 * Gallery, film, press coverage and documents for a project page.
 */

export function ProjectGallery({ images }: { images: MediaImage[] }) {
  if (!images.length) return null;

  return (
    <section aria-labelledby="gallery-heading" className="mt-20 border-t border-ink/10 pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-gold-ink">Visual Journey & 4K Renders</p>
          <h2 id="gallery-heading" className="display mt-3 text-3xl text-ink md:text-5xl">
            The Land & Masterplan in Focus
          </h2>
        </div>
        <p className="max-w-[45ch] text-sm leading-relaxed text-text-secondary">
          High-resolution 3D elevations, amenity renders, and real ground-level construction progress.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => (
          <figure
            key={img.src}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xs transition-all hover:shadow-lg"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
              <Image
                src={mediaUrl(img.src)}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading={i < 2 ? "eager" : "lazy"}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              {img.category && (
                <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                  {img.category === "render" ? "3D Render" : img.category === "site_photo" ? "Ground Photo" : "Masterplan"}
                </span>
              )}
            </div>
            {img.caption && (
              <figcaption className="p-4 bg-white">
                <p className="text-xs font-medium text-text-secondary leading-relaxed">{img.caption}</p>
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ProjectFilm({ videos }: { videos: MediaVideo[] }) {
  if (!videos.length) return null;

  const mainFilms = videos.filter((v) => !v.isShort);
  const shortReels = videos.filter((v) => v.isShort);

  return (
    <section aria-labelledby="film-heading" className="mt-20 border-t border-ink/10 pt-16">
      <div>
        <p className="label text-gold-ink">Drone Footage & Video Reels</p>
        <h2 id="film-heading" className="display mt-3 text-3xl text-ink md:text-5xl">
          Drive the Land Before You Visit
        </h2>
        <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-text-secondary">
          Aerial drone surveys, ground progress walkthroughs, and executive briefings. Click to play.
        </p>
      </div>

      {/* Main Feature Videos */}
      {mainFilms.length > 0 && (
        <div className="mt-10 grid items-start gap-6 sm:grid-cols-2">
          {mainFilms.map((v) => (
            <div key={v.src} className="overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 shadow-xs">
              <video
                controls
                preload="metadata"
                playsInline
                className="aspect-video w-full rounded-xl bg-slate-900 object-cover"
              >
                <source src={mediaUrl(v.src)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <h3 className="mt-3.5 text-base font-bold text-ink">{v.title}</h3>
              <p className="mt-1 text-xs text-text-muted">{formatBytes(v.bytes)} {v.duration ? `· ${v.duration}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* Video Shorts / Reels */}
      {shortReels.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gold-ink mb-4">
            ⚡ Quick Video Briefings & Site Shorts
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shortReels.map((v) => (
              <div key={v.src} className="rounded-xl border border-ink/10 bg-white p-3 shadow-xs">
                <video
                  controls
                  preload="none"
                  playsInline
                  className="aspect-[9/14] w-full rounded-lg bg-slate-900 object-cover"
                >
                  <source src={mediaUrl(v.src)} type="video/mp4" />
                  Your browser does not support video.
                </video>
                <p className="mt-2 text-xs font-bold text-ink line-clamp-2">{v.title}</p>
                <p className="mt-0.5 text-[10px] text-text-muted">{formatBytes(v.bytes)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function ProjectPress({ articles }: { articles: MediaImage[] }) {
  if (!articles?.length) return null;

  return (
    <section aria-labelledby="press-heading" className="mt-20 border-t border-ink/10 pt-16">
      <div>
        <p className="label text-gold-ink">In The News</p>
        <h2 id="press-heading" className="display mt-3 text-3xl text-ink md:text-5xl">
          Newspaper & Media Coverage
        </h2>
        <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-text-secondary">
          Published reports from leading national and regional dailies on Shankarpally&apos;s growth and Terravion&apos;s communities.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((art) => (
          <a
            key={art.src}
            href={mediaUrl(art.src)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xs transition-all hover:border-amber-400 hover:shadow-md"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
              <Image
                src={mediaUrl(art.src)}
                alt={art.alt}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-2 right-2 rounded bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                Click to Expand ↗
              </span>
            </div>
            <div className="p-3.5">
              <p className="text-xs font-bold text-ink leading-snug">{art.alt}</p>
              {art.caption && <p className="mt-1 text-[11px] text-text-secondary line-clamp-2">{art.caption}</p>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function ProjectDocuments({ documents }: { documents: MediaDocument[] }) {
  if (!documents.length) return null;

  return (
    <section aria-labelledby="documents-heading" className="mt-20 border-t border-ink/10 pt-16">
      <p className="label text-gold-ink">Official Verification</p>
      <h2 id="documents-heading" className="display mt-3 text-3xl text-ink md:text-5xl">
        Sanctioned Documents & Master Plans
      </h2>
      <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-text-secondary">
        Download layout approvals, brochures, and survey maps.
      </p>

      <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
        {documents.map((d) => (
          <li key={d.href}>
            <a
              href={mediaUrl(d.href)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline justify-between gap-6 py-5 transition-colors hover:text-gold-ink"
            >
              <span className="min-w-0">
                <span className="block text-lg font-semibold text-ink group-hover:text-gold-ink">
                  {d.label}
                </span>
                {d.note && (
                  <span className="mt-1 block text-sm text-text-secondary">{d.note}</span>
                )}
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-gold-ink bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Download · {formatBytes(d.bytes)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
