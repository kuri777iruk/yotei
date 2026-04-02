// Vercel Serverless Function: 主催者への期限通知メール送信
// 環境変数: RESEND_API_KEY（Vercel Dashboard > Settings > Environment Variables で設定）

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, eventTitle, responseCount, summaryUrl } = req.body || {};

  if (!to || !eventTitle) {
    return res.status(400).json({ error: 'Missing required fields: to, eventTitle' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #007AFF, #5856D6); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">📅 YOTEI</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 13px;">回答期限のお知らせ</p>
      </div>
      <div style="background: #f9f9fb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e5ea; border-top: none;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #1c1c1e;">
          <strong>「${eventTitle}」</strong>の回答期限になりました。
        </p>
        <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e5ea; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #007AFF; text-align: center;">
            ${responseCount || 0}人
          </p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #8e8e93; text-align: center;">が回答しました</p>
        </div>
        ${summaryUrl ? `
        <a href="${summaryUrl}" style="display: block; background: #007AFF; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
          集計結果を確認する →
        </a>` : ''}
        <p style="margin: 16px 0 0; font-size: 11px; color: #8e8e93; text-align: center;">
          このメールは YOTEI 日程調整ツールから自動送信されました。
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'YOTEI <onboarding@resend.dev>',
        to: [to],
        subject: `【YOTEI】「${eventTitle}」の回答期限になりました`,
        html: htmlBody,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(response.status).json({ error: 'Failed to send email', detail: data });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
