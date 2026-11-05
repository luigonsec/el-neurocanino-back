import path from 'node:path';

// Matches frontend/src/config/branding.ts and the public site's corporate palette.
// CID keeps the original logo available without an HTTP request to localhost.
export const brandLogo = {
  filename: 'ac-blanco-dorado.png',
  path: path.resolve(__dirname, '../../assets/email/ac-blanco-dorado.png'),
  cid: 'ac-brand-logo@adiestracaninos.es',
  contentType: 'image/png',
  contentDisposition: 'inline' as const,
};
export const htmlEscape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export const paragraph = (text: string) =>
  `<p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#474943;">${htmlEscape(text).replace(/\n/g, '<br>')}</p>`;
export function detailRow(label: string, value: string, featured = false, wrap = false) {
  return `<tr><td style="padding:16px 0;border-bottom:1px solid #e8e6de;font-size:14px;line-height:1.6;color:#575a53;">${htmlEscape(label)}</td><td align="right" style="padding:16px 0 16px 20px;border-bottom:1px solid #e8e6de;font-size:${featured ? '28' : '17'}px;line-height:1.4;font-weight:700;white-space:${wrap ? 'normal' : 'nowrap'};${wrap ? 'overflow-wrap:anywhere;word-break:break-word;' : ''}color:#171915;">${htmlEscape(value)}</td></tr>`;
}
export function blockTitle(title: string) {
  return `<h2 style="margin:0 0 14px;font-size:19px;line-height:1.4;font-weight:700;letter-spacing:-.3px;color:#171915;">${htmlEscape(title)}</h2>`;
}
export function brandedEmail({
  preheader,
  eyebrow,
  title,
  content,
  test = false,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  content: string;
  test?: boolean;
}) {
  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${htmlEscape(title)} · AC by El Neurocanino</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}table{border-collapse:collapse}img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}body{margin:0;padding:0;width:100%!important}a{color:#806211}a:focus-visible{outline:2px solid #d4af37;outline-offset:4px}
@media only screen and (max-width:600px){.outer-cell{padding:16px 8px!important}.email-content,.email-header,.email-footer{padding-left:24px!important;padding-right:24px!important}.email-header{padding-top:30px!important;padding-bottom:30px!important}.email-title{font-size:29px!important}.email-logo{width:150px!important;height:100px!important}.email-content{padding-top:30px!important;padding-bottom:30px!important}}
</style></head>
<body bgcolor="#f1f0eb" style="margin:0;padding:0;background-color:#f1f0eb;font-family:'Montserrat',Arial,Helvetica,sans-serif;color:#171915;">
<div style="display:none;font-size:1px;color:#f1f0eb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${htmlEscape(preheader)}</div>
<table role="presentation" width="100%" bgcolor="#f1f0eb" style="background-color:#f1f0eb;"><tr><td class="outer-cell" align="center" style="padding:36px 16px;">
<!--[if mso]><table role="presentation" align="center" width="640"><tr><td><![endif]-->
<table role="presentation" width="100%" style="max-width:640px;background-color:#ffffff;border:1px solid #e3e1d7;">
<tr><td class="email-header" bgcolor="#0a0a0a" style="padding:36px 40px 34px;background-color:#0a0a0a;border-top:3px solid #d4af37;">
<img class="email-logo" src="cid:${brandLogo.cid}" alt="AC · Adiestracaninos.es · by El Neurocanino" width="172" height="115" style="display:block;width:172px;height:115px;max-width:100%;color:#ffffff;font-size:14px;">
<p style="margin:26px 0 12px;font-size:11px;line-height:1.5;font-weight:700;letter-spacing:2px;color:#d4af37;">${htmlEscape(eyebrow.toUpperCase())}</p>
<h1 class="email-title" style="margin:0;font-family:'Bebas Neue','Arial Narrow',Arial,sans-serif;font-size:36px;line-height:1.15;font-weight:700;letter-spacing:-.8px;color:#ffffff;">${htmlEscape(title)}</h1>
</td></tr>
${test ? '<tr><td align="center" bgcolor="#f7f2df" style="padding:11px 24px;background-color:#f7f2df;border-bottom:1px solid #e8dfbf;font-size:11px;line-height:1.6;font-weight:700;letter-spacing:.8px;color:#6b5515;">ENTORNO DE PRUEBAS · SIN COBRO REAL</td></tr>' : ''}
<tr><td class="email-content" bgcolor="#ffffff" style="padding:36px 40px 40px;background-color:#ffffff;">${content}</td></tr>
<tr><td class="email-footer" bgcolor="#151515" style="padding:28px 40px;background-color:#151515;border-top:2px solid #d4af37;">
<p style="margin:0 0 6px;font-size:14px;line-height:1.6;font-weight:700;color:#ffffff;">AC · Adiestracaninos.es</p>
<p style="margin:0 0 20px;font-size:12px;line-height:1.7;color:#d4af37;">Comprende. Conecta. Transforma.</p>
<p style="margin:0;font-size:12px;line-height:1.8;color:#b3b3b3;"><a href="https://www.instagram.com/elneurocanino/" style="color:#d9d8d0;text-decoration:underline;">Instagram</a><span aria-hidden="true">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="https://www.youtube.com/@elneurocanino" style="color:#d9d8d0;text-decoration:underline;">YouTube</a></p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}
