import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PORSEO LMS - プロフェッショナル学習管理システム'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 80,
            fontWeight: 'bold',
            marginBottom: 20,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          PORSEO LMS
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            fontWeight: 'normal',
            opacity: 0.9,
          }}
        >
          プロフェッショナル学習管理システム
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
