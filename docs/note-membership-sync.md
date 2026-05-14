# noteメンバー連携運用

## 方針

noteには公式APIがないため、非公開APIやスクレイピングは使わない。LMS側で本人申請を受け付け、申請時点でnote権限を有効化する。運営は後からnoteのメンバーCSVで監査し、不一致や不正があればnote権限だけを停止する。

## ユーザー導線

1. `/note-membership` でDiscord連携を行う。
2. note IDを入力する。会員番号、加入プラン、外部サービスアカウントは任意だがCSV照合に使える。
3. note IDが他ユーザーと重複していなければ、即時に `active` になる。
4. Discordサーバー参加とメンバーロール付与も同時に試行する。

## 管理者導線

1. note管理画面からメンバーCSVをダウンロードする。
2. `/admin/note-membership` でCSVを選択する。
3. note IDが一致した申請は `confirmed` になる。
4. 「CSVに存在しない有効申請を停止する」を有効にした場合、CSVにない `active` / `confirmed` 申請は `rejected` になる。
5. 個別に「確認済み」「有効」「停止」を押して手動レビューできる。

## アクセス判定

LMSの実効アクセスは、以下のいずれかで有効になる。

- Stripe/既存決済の `active` / `trialing` / `past_due`
- noteトライアルの `note_trial`
- noteメンバー申請の `active` / `confirmed`
- 管理者

note権限は `users.subscriptionStatus` を直接上書きしない。読み取り時に実効ステータスを合成するため、Stripe webhookのキャンセル/復帰処理と衝突しない。

## 注意

- note IDの重複申請は `review` になり、自動有効化しない。
- `rejected` はLMS上のnote権限を停止する。Stripeなど他の有効権限がある場合はアクセスを維持する。
- CSV取得は人間が行う。非公開API解析や画面スクレイピングは運用対象外。
