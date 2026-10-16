---
title: What is a PRD? The doc that decides what gets built
seoTitle: What Is a PRD? Product Requirements Document Explained
description: What a PRD (product requirements document) is, what goes in one, who writes it and when, and how it differs from a BRD, a product brief and a spec.
subtitle: A PRD is a record of decisions. Most teams treat it as a request for decisions, which is why theirs go stale by Thursday.
slug: what-is-a-prd
date: 2026-10-15
topic: kickoffs
cover: /assets/images/letters/what-is-a-prd.jpg
keyword: what is a prd
cta: builder-kickoff
---

A **PRD**, or **product requirements document**, is the doc that says what a team is building, why, and how they'll know it worked.

That's the textbook answer. Here's the useful one.

A good PRD is a record of decisions that were already made, with the people who made them in the room.

A bad PRD is a list of things somebody hopes will be true. It gets written after the meeting, from memory, by whoever lost the coin toss. Then engineering reads it, finds three things nobody agreed to, and the real decisions move into Slack.

Same document. Completely different outcome.

## What a PRD is for

Every PRD has to answer three questions for everyone who touches the work:

1. **What are we building, and for who?**
2. **Why is it worth building now?**
3. **How will we know it worked?**

If a doc answers those in a page, it's doing its job. If it takes twenty pages and still doesn't answer the third one, it's theater.

The third question is the one most PRDs skip. No metric, no baseline, no target. So when the feature ships, nobody can say whether it worked, and the designer's case study ends with users loved it.

## What goes in a PRD

Six sections cover almost every feature:

| Section | What it answers |
|---|---|
| **Objective** | What are we solving, and what number moves if we solve it? |
| **Problem and context** | Who has the problem, in what moment, and how do we know it's real? |
| **ROI and the bet** | If we ship this, what moves, from what to what, by when? What does it cost us in team time? |
| **Scope** | The smallest version worth building, and what's explicitly out |
| **Constraints** | Time, team, tech limits, dependencies |
| **Open questions** | What we still don't know, who finds out, by when |

Notice what's missing. Pixel specs. User flow diagrams. A wish list of nice-to-haves.

Those come later, inside the box the PRD draws.

If you want the sections ready to paste, here's [the PRD template I actually use](/letters/prd-template/), with a filled-in example.

<!-- newsletter -->

## PRD vs BRD vs product brief vs spec

Half the confusion about PRDs is that teams use four documents for overlapping jobs.

| Doc | Answers | Usually owned by |
|---|---|---|
| **Product brief** | Is this problem worth a team's time at all? | Product |
| **BRD** | Why does the business want this, and what's the return? | Business or product leadership |
| **PRD** | What exactly are we building, and how will we know it worked? | Product, ideally drafted with design and engineering |
| **Functional spec** | How exactly does each part behave? | Engineering or product |

Most teams don't need all four. A one-page brief that grows into a PRD covers it for nearly every feature.

I broke down the business-case side in [PRD vs BRD](/letters/prd-vs-brd/), and the brief in the [product brief template](/letters/product-brief-template/).

## Who writes the PRD?

Product owns it. That part's not up for debate.

But owning it and writing it alone are different jobs. The PRDs that survive contact with engineering get written with three roles in the room:

- **Product**, who owns the problem and the bet
- **Engineering**, who owns what's possible in the time you have
- **Design**, who owns how the user gets from problem to outcome

When product writes it alone, engineering finds the constraints in week two. When design writes it alone, it reads like a pitch deck. When nobody writes it, you get three different features built from three different memories of the same meeting.

## When does a PRD get written?

Before anyone builds. That sounds obvious.

Here's the part that isn't: the best time is during the kickoff, live, on the shared screen. Not after it.

Every decision the room makes goes straight into the doc while everyone is still there to correct it. Problem, bet, constraints, scope, open questions. By the end of the hour, the PRD is mostly done.

That's the whole idea behind running a [project kickoff meeting](/letters/project-kickoff-meeting/) that actually decides something. The PRD is what the meeting produces.

## Signs your PRD is a bad one

Check yours against this list:

- [ ] There's no success metric, or there's a metric with no baseline
- [ ] There's no out-of-scope list
- [ ] It was written after design or engineering started
- [ ] It describes screens instead of decisions
- [ ] Nobody outside product has read it
- [ ] It hasn't been touched since the kickoff, but the plan has changed twice

One box ticked is normal. Three or more and the PRD isn't steering anything. It's a souvenir.

## Do PRDs still matter with AI?

More than before.

The new tools can generate a screen before your coffee's cold. Which means the expensive part of product work moved. Building the wrong thing used to take a sprint. Now it takes an afternoon, and it looks finished, so people believe it.

A PRD is the cheapest way to make sure the fast thing is the right thing. Feed a tool a clear objective, constraints and scope, and you get something worth testing. Feed it a vibe, and you get a very convincing vibe.

I use the PRD as the input for the prototype, every time. Here's [the AI prototyping workflow](/letters/ai-prototyping-workflow/) that starts from it.

## What is a PRD FAQ

### What does PRD stand for?

Product requirements document. In some companies it's called a product spec or a feature brief. The name matters less than whether it answers what, why and how you'll measure it.

### How long should a PRD be?

One to three pages for most features. If it needs more, the scope is probably too big for one release, or the doc is trying to be a functional spec.

### Is a PRD the same as a functional spec?

No. A PRD says what to build and why. A functional spec says exactly how each part behaves. Many agile teams skip the spec and let the PRD, the design and the tickets cover it.

### Do designers need to care about PRDs?

Yes, because the PRD decides the box the design has to fit in. Designers who help write it get to shape the problem. Designers who only read it get handed someone else's decisions.

### Can AI write a PRD?

It can draft one, fast, from a kickoff transcript or notes. It can't make the decisions for you. If the meeting never agreed on scope, the AI will write a confident PRD about a scope nobody agreed to.

### Where can I see a PRD example?

There's a filled-in example in [the PRD template](/letters/prd-template/), for a saved-filters feature, so you can see the shape without anyone's confidential detail.

<!-- cta -->
