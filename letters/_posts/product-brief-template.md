---
title: Product brief template (and the design brief questions that actually matter)
seoTitle: Product Brief and Design Brief Template
description: A free product brief template plus the design brief questions that matter, so design gets pulled in before the decisions are made, not after.
subtitle: The brief usually shows up as a Jira ticket with the decisions already baked in. Here's the template, and how to stop it arriving half-wrong.
slug: product-brief-template
date: 2026-07-01
updated: 2026-10-15
topic: kickoffs
cover: /assets/images/letters/product-brief-template.jpg
keyword: product brief template
cta: builder-kickoff
source: 24566874, 24752740
---

Most product projects start the same way.

A business problem shows up. People nod. A Jira ticket gets created. Two weeks later, the designer gets pulled in.

The decisions are already made.

The problem is already half-wrong.

And the designer's job becomes: make this shit look like it wasn't a bad call.

That's not a design problem. That's a first five minutes problem. The brief was written in the one window where everyone assumed they knew what "we should build X" meant, and nobody checked.

So yes, here's a product brief template. But the template is the easy part. The part that matters is who's in the room when it gets filled in.

## What a product brief is for

A product brief answers one question before anyone commits time:

**Is this problem worth solving, and what does solved look like?**

It's lighter than a [PRD](/letters/what-is-a-prd/). A brief decides whether to do the work. A [PRD](/letters/prd-template/) decides how the work gets done. If you're fuzzy on how those two relate to the business case doc, I broke that down in [PRD vs BRD](/letters/prd-vs-brd/).

## The product brief template (copy and paste)

```markdown product-brief.md
# [Initiative name] Product Brief

## Problem
- What's broken, in one sentence?
- Who has this problem? (be specific: role, segment, moment)
- How do we know? (data, tickets, calls, churn reasons)

## Why now
- What changes if we wait a quarter?

## Outcome
- What does solved look like?
- Success metric: baseline -> target, by when

## The bet
- "If we ship this, we expect ___ to move from ___ to ___ by ___."

## Constraints
- Time we actually have
- Team available
- Known technical or legal limits

## Not doing
- What this initiative explicitly won't touch

## Open questions
- What we still don't know, who owns it, by when
```

One page. If it runs longer, you're writing the PRD early, and locking in a solution before anyone's challenged the problem.

## Product brief example (filled in)

Here's the template filled in for Ledgerly, the fictional invoicing app from my Builder Kickoff™ demo. Fictional company, realistic numbers, so you can see the shape without anyone's confidential detail.

```markdown ledgerly-product-brief.md
# Self-serve card update: Product Brief

## Problem
- Customers lose their account when a card payment fails, and there's no way to fix it in the product.
- Who: account owners at small agencies and studios, at the moment a renewal fails.
- How we know: about $600K in ARR lost to involuntary churn last year. 30 to 40 support tickets a week asking how to update a card.

## Why now
- A Studio plan price increase lands in January. Broken billing right before a price change is how you lose people who wanted to stay.

## Outcome
- Solved = a customer fixes a failed payment in the product, before they get locked out.
- Success metric: failed payment recovery from 35% -> 60%.
- Also watching: involuntary churn from 1.4% a month to under 1%, billing tickets down by half.

## The bet
- If owners can update their card in the product, recovery moves from 35% to 60% before the January price change.

## Constraints
- Two sprints. One engineer full time, the engineering lead reviewing, plus design.
- Only account owners can change billing. Use the existing owner flag. No new roles.
- Stripe Elements already exists in signup.

## Not doing
- SMS reminders. PayPal or bank transfer. A redesign of the whole billing page. A billing role for non-owners.

## Open questions
- Magic link in the reminder email so people can update without logging in? Owner: engineering lead, after a security review.
- Fixing the card from the paywall after cancellation: in or out? Decide by end of sprint one.
```

Notice how much of that is constraints and not-doing. That's where the brief earns its keep. The problem section takes two minutes to write. The not-doing list is what saves you a month.

## The design brief questions that actually matter

A design brief sits on top of the product brief. It doesn't repeat the business case. It adds what design needs to do good work inside it:

- **Who exactly is using this, and in what moment?** Not a persona poster. The actual situation: what they were doing right before, what they're trying to get done, what happens if it fails.
- **What does the current experience look like?** Screenshots, recordings, support tickets. Design should start from what exists, not from a blank canvas.
- **What has to stay the same?** Design system, existing patterns, accessibility requirements, things users already rely on.
- **What's the smallest version that tests the bet?** If the answer is "the full redesign," push back.
- **How will we know the design worked?** Tie it to the outcome metric from the product brief. "Users like it" isn't a measure.
- **Who decides, and when?** Name the person who approves the direction and the date they'll do it.

That last one gets skipped constantly. Then you end up in a review where five people have opinions and nobody has the authority to pick one.

## Product brief vs design brief vs PRD

| Doc | Answers | Owner | When |
|---|---|---|---|
| Product brief | Should we solve this, and what does solved look like? | Product | Before committing a team |
| Design brief | What does design need to know to solve it well? | Design | At kickoff |
| PRD | What exactly are we building, and how will we know it worked? | Product (often drafted from the kickoff) | During and right after kickoff |

Three docs sounds like a lot. In practice, if you run the kickoff properly, they collapse into one living doc that starts as a brief and grows into a PRD.

<!-- newsletter -->

## Why a better template isn't the real fix

I spent fifteen years in product design before I figured this out.

Every sprint that went sideways, every handoff that came back wrong, every stakeholder who nodded in the meeting and then changed everything after, it all traced back to the same place. Not the design. The alignment that never happened before design started.

Here's what that looks like in practice. The business asks for a thing. Product writes half the context. Design starts hunting for answers. Engineering waits to see screens. Scope gets cut late.

And at the end, everyone realizes they were solving slightly different problems the whole time.

The fix is not a better brief template.

It's a facilitated conversation that extracts the real problem, defines the smallest thing worth building, and builds the business case before a single pixel moves. The template just gives that conversation somewhere to land.

If you want the agenda for that conversation, here's [how I run a project kickoff meeting that actually forces decisions](/letters/project-kickoff-meeting/).

## How to stop getting handed half-wrong briefs

You don't need permission to fix this. You need to show up earlier.

**Ask for the problem, not the ticket.** When a brief lands, reply with the four questions: what are we solving, what aren't we solving, how much time do we have, what tradeoffs are we willing to accept. If nobody can answer, you've found the real work.

**Offer to facilitate.** Most PMs are happy to hand off running the kickoff if you bring a structure. Whoever runs the room frames the problem.

**Write down the bet.** A brief without a "we expect ___ to move" sentence is a wish. Get the number on paper, even if it's rough. If you need help picking the right one, start with [these UX metrics](/letters/ux-metrics/).

**Make your reasoning visible.** When you push back on a brief, say why in one line, not one slide deck. I wrote about [explaining design decisions without defending them](/letters/design-rationale/).

That's the shift [Builder Kickoff™](/builder-kickoff/) is built around. You stop waiting to be handed a brief and start being the person who writes it.

## Product brief FAQ

### How long should a product brief be?

One page. Its job is to decide whether to commit a team, not to specify the solution.

### Who writes the product brief?

Usually product. But the strongest briefs get written live, with design and engineering in the room, so the constraints are in it from the start instead of discovered in week three.

### What's the difference between a creative brief and a design brief?

A creative brief usually comes from marketing and covers messaging, audience and tone for a campaign. A design brief in product work covers the user, the current experience, constraints and how success gets measured for a feature.

### Can I skip the brief and go straight to a PRD?

For small changes, sure. For anything that needs a team for more than a sprint, skipping the brief is how you end up building the wrong thing efficiently.

<!-- cta -->
