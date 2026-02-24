// Site configuration and SEO-related constants

export const SITE_CONFIG = {
  name: 'Five Clover Hotels Group',
  url: 'https://fivecloverhotels.com',
  description: 'Five Clover Hotels Group offers premium hospitality across Lagos, Nigeria. Book your stay at Five Clover, Caritas Inn, Ring Ruby, or The Cordis hotels.',
  locale: 'en_NG',
  twitter: '@fivecloverhotels',
  email: 'info@fivecloverhotels.com',
  phone: '+234-XXX-XXX-XXXX',
};

export const HOTELS = [
  {
    id: 'five-clover',
    name: 'Five Clover Hotel',
    description: 'Luxury accommodation in the heart of Lagos with world-class amenities and exceptional service',
    address: '123 Victoria Island, Lagos, Nigeria',
    phone: '+234-XXX-XXX-XXXX',
    priceRange: '$$$',
    rating: 4.5,
    image: '/hotels/five-clover.jpg',
    amenities: ['Free WiFi', 'Restaurant', 'Pool', 'Gym', 'Spa'],
  },
  {
    id: 'caritas-inn',
    name: 'Caritas Inn',
    description: 'Comfortable and affordable hotel with modern facilities and warm hospitality',
    address: '456 Ikeja, Lagos, Nigeria',
    phone: '+234-XXX-XXX-XXXX',
    priceRange: '$$',
    rating: 4.2,
    image: '/hotels/caritas-inn.jpg',
    amenities: ['Free WiFi', 'Restaurant', 'Conference Room', 'Parking'],
  },
  {
    id: 'ring-ruby',
    name: 'Ring Ruby Hotel',
    description: 'Boutique hotel offering personalized service and elegant accommodations',
    address: '789 Lekki, Lagos, Nigeria',
    phone: '+234-XXX-XXX-XXXX',
    priceRange: '$$$',
    rating: 4.4,
    image: '/hotels/ring-ruby.jpg',
    amenities: ['Free WiFi', 'Restaurant', 'Bar', 'Pool', 'Business Center'],
  },
  {
    id: 'the-cordis',
    name: 'The Cordis Hotel',
    description: 'Contemporary hotel with sophisticated design and premium amenities',
    address: '321 Surulere, Lagos, Nigeria',
    phone: '+234-XXX-XXX-XXXX',
    priceRange: '$$',
    rating: 4.3,
    image: '/hotels/the-cordis.jpg',
    amenities: ['Free WiFi', 'Restaurant', 'Gym', 'Meeting Rooms', 'Parking'],
  },
];

export const SEO_KEYWORDS = {
  homepage: [
    'hotels in Lagos',
    'Lagos hotels',
    'Nigeria hotels',
    'Five Clover',
    'Caritas Inn',
    'Ring Ruby',
    'The Cordis',
    'hotel booking Lagos',
    'luxury hotels Lagos',
    'business hotels Lagos',
  ],
  blog: [
    'hotel news Lagos',
    'travel tips Nigeria',
    'Lagos tourism',
    'hotel industry news',
    'hospitality Nigeria',
  ],
};

export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/fivecloverhotels',
  instagram: 'https://instagram.com/fivecloverhotels',
  twitter: 'https://twitter.com/fivecloverhotels',
  linkedin: 'https://linkedin.com/company/fivecloverhotels',
};

export const DEFAULT_OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
};

export const LOGO_IMAGE = {
  url: '/logo.png',
  width: 512,
  height: 512,
  alt: 'Five Clover Hotels Group Logo',
};
