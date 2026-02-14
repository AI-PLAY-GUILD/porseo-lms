module.exports = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "japanese-subject": (parsed, when) => {
          const { subject } = parsed;

          if (!subject) {
            return [false, "コミットメッセージにサブジェクトが必要です"];
          }

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
    "japanese-subject": [2, "always"], // エラーレベル: 2 (エラー), 必須
    "type-enum": [
      2,
      "always",
      [
        "feat",     // 新機能
        "fix",      // バグ修正
        "docs",     // ドキュメント変更
        "style",    // コードスタイル変更（フォーマットなど）
        "refactor", // リファクタリング
        "perf",     // パフォーマンス改善
        "test",     // テスト追加・修正
        "build",    // ビルドシステム変更
        "ci",       // CI設定変更
        "chore",    // その他の変更
        "revert",   // コミットの取り消し
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "subject-case": [0], // 日本語と固有名詞を許可するため無効化
    "header-max-length": [2, "always", 100],
  },
};
