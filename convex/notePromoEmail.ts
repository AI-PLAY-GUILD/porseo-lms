"use node";

import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

function getResend(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not set");
    }
    return new Resend(apiKey);
}

const FROM_EMAIL = "AI PLAY GUILD <noreply@aiplayguild.com>";
const JOIN_URL = "https://aiplayguild.com/join";

// 期限切れ時に送信するメール
export const sendTrialExpiredEmail = internalAction({
    args: {
        trialId: v.id("noteTrialUsers"),
    },
    handler: async (ctx, args) => {
        console.log("[notePromoEmail:sendTrialExpiredEmail] 開始", { trialId: args.trialId });

        const trial = await ctx.runQuery(internal.notePromo.getTrialWithUser, {
            trialId: args.trialId,
        });

        if (!trial) {
            console.log("[notePromoEmail:sendTrialExpiredEmail] トライアルまたはユーザー未検出");
            return;
        }

        if (trial.convertedToSubscription) {
            console.log("[notePromoEmail:sendTrialExpiredEmail] 既に有料転換済み、スキップ");
            return;
        }

        const resend = getResend();

        try {
            await resend.emails.send({
                from: FROM_EMAIL,
                to: trial.userEmail,
                subject: "【AI PLAY GUILD】無料体験期間が終了しました",
                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9;">
    <h1 style="font-size: 24px; font-weight: 200; letter-spacing: 0.1em; color: #0c1a2e; margin: 0;">AI PLAY GUILD</h1>
  </div>

  <div style="padding: 30px 0;">
    <p style="font-size: 16px;">${trial.userName} さん</p>

    <p>AI PLAY GUILDの無料体験期間が終了しました。</p>

    <p>体験期間中、AI PLAY GUILDをご利用いただきありがとうございました。</p>

    <p>引き続き学習を続けるには、有料メンバーシップへの登録をお勧めします。</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${JOIN_URL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #38bdf8, #06b6d4); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
        有料メンバーになる
      </a>
    </div>

    <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="font-weight: bold; margin-top: 0;">有料メンバーの特典：</p>
      <ul style="padding-left: 20px;">
        <li>超実践型ハンズオン（ライブ＆アーカイブ）</li>
        <li>独自学習管理システム利用権</li>
        <li>Discordコミュニティ参加権</li>
        <li>ハッカソンへの参加・フィードバック</li>
        <li>メンバー限定のソースコード共有</li>
      </ul>
    </div>

    <p style="color: #64748b; font-size: 14px;">ご不明な点がございましたら、お気軽にお問い合わせください。</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} AI PLAY GUILD</p>
    <p>このメールはAI PLAY GUILDの無料体験をご利用いただいた方にお送りしています。</p>
  </div>
</body>
</html>`,
            });

            console.log("[notePromoEmail:sendTrialExpiredEmail] メール送信成功", { email: trial.userEmail });

            // Schedule follow-up email 7 days later
            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
            await ctx.scheduler.runAt(Date.now() + SEVEN_DAYS, internal.notePromoEmail.sendTrialFollowUpEmail, {
                trialId: args.trialId,
            });
            console.log("[notePromoEmail:sendTrialExpiredEmail] フォローアップメールを7日後にスケジュール");
        } catch (error) {
            console.error("[notePromoEmail:sendTrialExpiredEmail] メール送信失敗:", error);
        }
    },
});

// 期限切れから7日後に送信するフォローアップメール
export const sendTrialFollowUpEmail = internalAction({
    args: {
        trialId: v.id("noteTrialUsers"),
    },
    handler: async (ctx, args) => {
        console.log("[notePromoEmail:sendTrialFollowUpEmail] 開始", { trialId: args.trialId });

        const trial = await ctx.runQuery(internal.notePromo.getTrialWithUser, {
            trialId: args.trialId,
        });

        if (!trial) {
            console.log("[notePromoEmail:sendTrialFollowUpEmail] トライアルまたはユーザー未検出");
            return;
        }

        if (trial.convertedToSubscription) {
            console.log("[notePromoEmail:sendTrialFollowUpEmail] 既に有料転換済み、スキップ");
            return;
        }

        const resend = getResend();

        try {
            await resend.emails.send({
                from: FROM_EMAIL,
                to: trial.userEmail,
                subject: "【AI PLAY GUILD】学習の続きはいかがですか？",
                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9;">
    <h1 style="font-size: 24px; font-weight: 200; letter-spacing: 0.1em; color: #0c1a2e; margin: 0;">AI PLAY GUILD</h1>
  </div>

  <div style="padding: 30px 0;">
    <p style="font-size: 16px;">${trial.userName} さん</p>

    <p>先日はAI PLAY GUILDの無料体験をご利用いただきありがとうございました。</p>

    <p>体験期間終了から1週間が経ちましたが、その後いかがでしょうか？</p>

    <p>AI PLAY GUILDでは、最新のAI技術を実践的に学べるコンテンツを日々更新しています。メンバーシップに登録いただければ、すべてのコンテンツにすぐにアクセスできます。</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${JOIN_URL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #38bdf8, #06b6d4); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
        今すぐメンバーになる
      </a>
    </div>

    <p style="text-align: center; color: #64748b; font-size: 14px;">月額&yen;4,000 &middot; 入会金/解約金なし &middot; いつでも解約可能</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} AI PLAY GUILD</p>
    <p>このメールはAI PLAY GUILDの無料体験をご利用いただいた方にお送りしています。</p>
  </div>
</body>
</html>`,
            });

            console.log("[notePromoEmail:sendTrialFollowUpEmail] フォローアップメール送信成功", {
                email: trial.userEmail,
            });
        } catch (error) {
            console.error("[notePromoEmail:sendTrialFollowUpEmail] メール送信失敗:", error);
        }
    },
});
