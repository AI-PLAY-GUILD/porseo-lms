# 🔍 日本語検閲の仕組み

このプロジェクトでは、コミットメッセージに日本語を必須とする仕組みを実装しています。

## 1️⃣ Husky - Git フックの設定

`.husky/commit-msg`

```bash
npx --no -- commitlint --edit $1
```

- **commit-msg フック** = コミット時に自動実行
- Commitlint を呼び出してメッセージを検証

## 2️⃣ Commitlint - 日本語検証ルール

`commitlint.config.cjs`

```javascript
plugins: [
  {
    rules: {
      "japanese-subject": (parsed, when) => {
        const { subject } = parsed;
        // 日本語文字（ひらがな、カタカナ、漢字）を含むかチェック
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(subject);

        if (!hasJapanese) {
          return [
            false,
            "コミットメッセージは日本語で記述してください（例: feat: 新機能を追加）",
          ];
        }
        return [true];
      },
    },
  },
],
rules: {
  "japanese-subject": [2, "always"], // ← 日本語を必須に！
}
```

## 🎯 検証ロジック

| Unicode範囲 | 文字種 |
|-------------|--------|
| `\u3040-\u309F` | ひらがな（あ-ん） |
| `\u30A0-\u30FF` | カタカナ（ア-ン） |
| `\u4E00-\u9FAF` | 漢字（一-龯） |

この正規表現で日本語文字が1文字でも含まれているかをチェック！

## ✅ 動作例

```bash
# ✅ OK（日本語が含まれている）
git commit -m "feat: 新機能を追加"
git commit -m "fix: バグ修正"

# ❌ NG（英語のみ - 拒否される）
git commit -m "feat: add new feature"
# → エラー: コミットメッセージは日本語で記述してください
```

## 📝 GitHub Issue への適用方法

同じ仕組みを GitHub Issue にも適用する場合は、GitHub Actions で実装できます：

### `.github/workflows/validate-issue-language.yml`

```yaml
name: Validate Issue Language

on:
  issues:
    types: [opened, edited]

jobs:
  check-japanese:
    runs-on: ubuntu-latest
    steps:
      - name: Check if issue contains Japanese
        uses: actions/github-script@v7
        with:
          script: |
            const issue = context.payload.issue;
            const body = issue.body || '';
            const title = issue.title || '';

            // 日本語チェック
            const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
            const hasJapanese = japaneseRegex.test(title + body);

            if (!hasJapanese) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: '⚠️ このIssueは日本語で記述してください。'
              });

              // ラベル追加
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                labels: ['needs-translation']
              });
            }
```

## 🔧 現在の適用範囲

- ✅ **コミットメッセージ**: 日本語強制（Husky + Commitlint）- **実装済み** 🎉
- ❌ **GitHub Issues**: 未実装（任意で英語も可）
- ❌ **Pull Request**: 未実装（任意で英語も可）

## ✅ 実装確認

以下のコマンドでテスト済み：

```bash
# ❌ 英語のみ（拒否される）
echo "feat: add new feature" | npx commitlint
# → エラー: コミットメッセージは日本語で記述してください

# ✅ 日本語を含む（承認される）
echo "feat: 新機能を追加" | npx commitlint
# → エラーなし
```

## 🚀 拡張の提案

同じ正規表現パターンを使用して、以下にも適用可能：

1. **GitHub Issues** - 新規作成・編集時に日本語チェック
2. **Pull Request タイトル** - PR作成時に日本語チェック
3. **コードコメント** - Linter で日本語コメントを推奨

## 📚 関連ファイル

- `.husky/commit-msg` - Git フック設定
- `commitlint.config.cjs` - 日本語検証ルール
- `package.json` - Husky/Commitlint 依存関係
