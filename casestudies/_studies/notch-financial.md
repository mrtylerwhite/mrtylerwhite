---
order: 1
slug: notch-financial
title: "Cash flow, unstuck: the product decision behind a 30% jump in payment method capture"
seoTitle: "Notch Financial Customer Portal Case Study"
description: "How one access rule in Notch Financial's customer portal raised payment method capture 30% and made supplier cash flow predictable."
eyebrow: "Fintech · B2B AR/AP"
subtitle: "Notch had automation in place, but suppliers were still getting paid late. The fix was a rule the product had never enforced."
client: "Notch Financial"
clientDesc: "B2B AR/AP automation platform"
role: "Product Design Lead"
focus: "Customer portal"
heroVideo: "/wp-content/uploads/2024/08/Payment-Portal-Jul3-optimized.mp4"
poster: "/wp-content/uploads/2024/08/Case-Study-Copy-6-1.jpg"
stats: "+30%|Payment method capture ;; +25%|Cash flow predictability ;; 10–20%|Lower transaction costs ;; 3|Functions shipping one rule"
cta: "case-study"
---

## The real constraint

Notch Financial is an AP and AR automation platform. Suppliers use it to invoice their customers and collect payment.

On paper, the system worked. Invoices went out on time. Reminders were automated. Payments could be processed digitally.

In reality, cash flow was unpredictable.

Most suppliers didn't have a card or bank account on file for their customers. So payments still depended on follow-ups, checks and manual workarounds. The automation existed. Nothing made customers use it.

Late payments weren't caused by broken flows or missing features. They were caused by a decision the product allowed: **customers could see their invoices without ever committing a payment method.**

This was not an execution problem. It was a decision problem.

## What we found

We interviewed suppliers and went through support tickets to see why payments stayed late with automation in place. Three patterns pointed at the same gap.

- **No gate.** Customers could use the product without ever committing to pay.
- **No digital method on file.** Most customers had only ever paid by check, so suppliers had nothing to charge even when they wanted to.
- **No enforcement.** Automation handled invoicing. Nothing on the product side asked the customer for commitment.

## The decision

Customers could no longer view their invoices without registering a payment method first.

That's it. No new automation. Notch already had that. We closed the gap that let customers opt out of it.

## What shipped

A white-label customer portal that suppliers send to their customers through a branded invite. Every screen was built around that one rule.

1. **Branded invite.** Suppliers trigger it from their dashboard, so customers land in a controlled onboarding flow instead of a raw product signup.
2. **Welcome email.** Framed as access to your invoices, not a payment request. That lowers the barrier before the rule kicks in.
3. **Registration.** Adding a payment method is required to continue. A modal blocks invoice access until a card is on file. No workarounds, no partial access.
4. **Shared wallet.** Customers who pay several suppliers store every method in one place, so the second and third capture get easier.
5. **Autopay.** Once a method is on file, suppliers turn on autopay with one toggle. A one-time setup becomes standing collection.

![Notch customer portal registration page, where a payment method is required before invoice access](/wp-content/uploads/2024/08/Registration-page.webp)

[Open the Figma prototype](https://www.figma.com/proto/qrplPpZsiVdJ4VFRb8dIEY/Freemium-Email-Upsell-Funnel?node-id=14200-11353)

Shipping it took more than a design handoff. The invite, the email and the registration page all had to enforce the same rule, or customers would find the side door. I worked across product, engineering and go-to-market to land it everywhere at once. Support and customer success got the reasoning and a ready answer before launch, so the added friction read as a clear rule instead of a surprise.

## Results

- **Payment method capture up 30%** after the portal launched.
- **Cash flow predictability up 25%** for suppliers, with fewer outstanding invoices and fewer manual follow-ups.
- **Transaction costs down 10 to 20%** from moving payment infrastructure from Stripe to Adyen in the same cycle.

## What I'd do differently

I'd put a support-ticket and complaint metric in place before launch, not after. A rule that adds friction on purpose needs a counter-metric from day one. Otherwise you can't tell whether you removed a problem or moved it somewhere else.

## What I learned

The biggest fix was one access rule.

Automation without commitment is incomplete. Once payment method capture was enforced, the automation Notch had already built could finally do its job. Most of the attention goes to new features. The highest-leverage fix is usually a decision nobody has revisited.
