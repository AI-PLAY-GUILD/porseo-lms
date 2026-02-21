import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PORSEO LMS - プロフェッショナル学習管理システム',
    short_name: 'PORSEO LMS',
    description: '動画学習、Discord連携、AIによる学習サポートを提供するプロフェッショナル向け学習管理システム',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#667eea',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/logo-3d.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['education', 'productivity'],
    lang: 'ja-JP',
    dir: 'ltr',
  }
}
