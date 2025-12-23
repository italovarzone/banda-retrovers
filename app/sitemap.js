export default function sitemap() {
  const baseUrl = 'https://retrovers.com.br'
  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ]
}
