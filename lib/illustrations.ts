/**
 * Illustration & Media helper for Terravion Guides and Journal essays.
 * Maps every article slug to its own dedicated 3D Pixar-quality editorial illustration.
 */

export function getArticleIllustration(slug: string): string {
  // Check if it's a guide slug
  if (
    [
      "construction-guide",
      "documentation-guide",
      "dtcp-guide",
      "hmda-guide",
      "how-to-buy-villa-plots",
      "investment-checklist",
      "legal-verification",
      "loan-process",
      "plot-buying-mistakes",
      "registration-process",
      "rera-guide",
      "tax-benefits",
    ].includes(slug)
  ) {
    return `/illustrations/guide-${slug}.png?v=3d_v3`;
  }

  // Otherwise it's a blog slug
  return `/illustrations/blog-${slug}.png?v=3d_v3`;
}

/** Hash helper for slug seed offset */
function slugHash(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Get a distinct 3D story scene image for mid-article chapter breaks */
export function getChapterIllustration(slug: string, chapterIndex: number): string {
  if (chapterIndex === 0) {
    return getArticleIllustration(slug);
  }
  const sceneNum = ((chapterIndex - 1 + slugHash(slug)) % 7) + 1;
  return `/illustrations/scenes/scene-${sceneNum}.png`;
}
