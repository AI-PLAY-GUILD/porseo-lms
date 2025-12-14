# Discord-First Premium Video LMS

Discordコミュニティを中心とした、高品質な動画学習体験を提供するLMS（Learning Management System）です。

## 特徴

- **プレミアムな動画視聴体験**: Muxを使用した高品質な動画ストリーミング。
- **Discordファースト**: コミュニティへのオンボーディングをスムーズに行う設計。
- **モダンなUI/UX**: shadcn/ui と Tailwind CSS を採用した、美しく使いやすいインターフェース。
- **AI機能**: Google Generative AI を活用した機能（予定）。
- **管理画面**: 動画コンテンツやタグを管理するための管理者用ダッシュボード。

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (App Router)
- **バックエンド/データベース**: [Convex](https://www.convex.dev/)
- **認証**: [Clerk](https://clerk.com/)
- **動画配信**: [Mux](https://www.mux.com/)
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/)
- **UIコンポーネント**: [shadcn/ui](https://ui.shadcn.com/)
- **AI**: [Google Generative AI SDK](https://ai.google.dev/)

## セットアップ

### 前提条件

- Node.js
- npm

### インストール

```bash
npm install
```

### 環境変数の設定

`.env.local` ファイルを作成し、必要な環境変数を設定してください。
(Convex, Clerk, Mux, Google AI などのAPIキーが必要です)

### 開発サーバーの起動

```bash
npm run dev
```

これとは別に、Convexの開発サーバーも起動する必要があります。

```bash
npx convex dev
```

## デプロイ

Vercel などのプラットフォームへのデプロイを推奨します。
Convex のデプロイ設定も合わせて行ってください。
