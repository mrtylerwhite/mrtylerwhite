#!/usr/bin/env python3
"""Generate newsletter-confirmation/index.html from newsletter/index.html shell."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

HERO = """
\t\t\t<section class="nl-conf-hero et_pb_section et_section_regular" aria-label="Newsletter confirmation">
\t\t\t\t<div class="nl-conf-hero__center">
\t\t\t\t\t<div class="nl-conf-hero__content email-success-hero">
\t\t\t\t\t\t<img src="/assets/newsletter/confirmation-envelope.png" width="226" height="177" alt="" class="nl-conf-hero__icon" loading="lazy" decoding="async">
\t\t\t\t\t\t<h1 class="nl-conf-hero__title heading-7 center"><strong>Check your email<br>to finish signing up</strong></h1>
\t\t\t\t\t\t<p class="nl-conf-hero__copy paragraph p-news-confirm"><em><br>A confirmation email is on its way.<br>Open it and click the button inside to finish signing up.<br>If you don\u2019t see it in the next minute, check spam or promotions.<br><br>It will come from </em><a href="mailto:tyler@saasifyos.com"><strong><em>tyler@saasifyos.com</em></strong></a><em>.</em></p>
\t\t\t\t\t</motion>
\t\t\t\t</motion>
\t\t\t</section>
""".strip().replace("</motion>", "</div>")


def main() -> None:
    src = (ROOT / "newsletter/index.html").read_text(encoding="utf-8")

    html, n = re.subn(
        r"\t\t\t<section class=\"nl-saasify-hero.*?</section>\s*",
        HERO + "\n\n",
        src,
        count=1,
        flags=re.DOTALL,
    )
    if n != 1:
        raise SystemExit(f"hero replace failed (count={n})")

    html = html.replace("post-newsletter", "post-newsletter-confirmation")
    html = html.replace(
        'href="/assets/css/system/pages/newsletter.css"',
        'href="/assets/css/system/pages/newsletter-confirmation.css"',
    )
    html = re.sub(
        r"<title>.*?</title>",
        "<title>Check your email | Tyler White</title>",
        html,
        count=1,
    )
    html = re.sub(
        r'<meta name="description" content="[^"]*"',
        '<meta name="description" content="A confirmation email is on its way. Open it to finish signing up for the newsletter."',
        html,
        count=1,
    )
    html = re.sub(
        r"<meta name='robots' content='[^']*'",
        "<meta name='robots' content='noindex'",
        html,
        count=1,
    )
    html = re.sub(
        r'<link rel="canonical" href="[^"]*"',
        '<link rel="canonical" href="https://mrtylerwhite.com/newsletter-confirmation/"',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta property="og:url" content="[^"]*"',
        '<meta property="og:url" content="https://mrtylerwhite.com/newsletter-confirmation/"',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta property="og:title" content="[^"]*"',
        '<meta property="og:title" content="Check your email | Tyler White"',
        html,
        count=1,
    )
    html = re.sub(
        r'<meta name="twitter:title" content="[^"]*"',
        '<meta name="twitter:title" content="Check your email | Tyler White"',
        html,
        count=1,
    )
    html = html.replace(
        'class="menu-item menu-item-type-custom menu-item-object-custom current-menu-item menu-item-3458"',
        'class="menu-item menu-item-type-custom menu-item-object-custom menu-item-3458"',
    )
    html = re.sub(
        r' aria-current="page"',
        "",
        html,
    )
    html = re.sub(
        r"<script>\s*\(function \(\) \{.*?wireNewsletterForm.*?</script>\s*",
        "",
        html,
        count=1,
        flags=re.DOTALL,
    )

    out = ROOT / "newsletter-confirmation/index.html"
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out} ({len(html)} bytes)")


if __name__ == "__main__":
    main()
