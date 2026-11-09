import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // AI training crawlers: keep out entirely.
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot'],
        disallow: '/',
      },
      // Everyone else: index the public landing only.
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/w/', '/admin/', '/login', '/signup'],
      },
    ],
  };
}
