// Offer banner shown in the hero card on the home page.
//
// To publish an offer:
//   1. Put the banner image in public/images/offers/ (WebP or JPG, about 1200×900 px,
//      landscape 4:3 works best).
//   2. Set `image` below to its path, e.g. '/images/offers/new-year-sale.webp'.
//   3. Optionally fill in the text and button link, then commit and push.
// Leave `image` empty to show the "offers coming soon" placeholder.

export interface OfferBanner {
  image: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export const CURRENT_OFFER: OfferBanner = {
  image: '',
  title: '',
  subtitle: '',
  ctaLabel: 'Ask about this offer',
  ctaHref: '',
};
