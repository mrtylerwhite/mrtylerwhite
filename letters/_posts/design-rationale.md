---
title: "Design rationale: how to explain design decisions without defending them"
seoTitle: Design Rationale: Explaining Design Decisions
description: How to write and present design rationale: which calls aren't up for debate, how to document the ones that are, and a decision record format to reuse.
subtitle: Engineers don't justify their linter in a design review. Some design calls deserve the same treatment. The rest need one clear line, not a slide deck.
slug: design-rationale
date: 2026-09-16
updated: 2026-10-15
topic: case-studies
cover: /assets/images/letters/design-rationale.jpg
keyword: design rationale
cta: case-study
source: 25878451, 24149534
---

A stakeholder pushes back on a design decision.

Nine times out of ten, you go into defense mode. Wireframes. Research. The whole case, laid out like you're in front of a judge.

I stopped doing that.

Not because rationale doesn't matter. It matters a lot. But most designers explain the wrong decisions, at the wrong length, at the wrong time. And it slowly teaches the room that every design call is up for a vote.

## Not every decision is up for debate

Engineering doesn't explain which linter they're using. Nobody asks a backend engineer to justify a database migration in a design review. They say "we're not doing that" and move on.

I treat design the same way now.

Too many clicks? Fix it. Not up for debate.

Accessibility gets cut for time? Not up for debate either.

I don't explain myself unless I'm pushed.

That's not arrogance. That's what happens when you stop treating your own expertise like it needs a permission slip from the room. (I first wrote about this in [the newsletter](/newsletter/).)

That "people don't scroll" bullshit gets the same treatment, like it's still 2012 and everyone's on a BlackBerry. They're gonna scroll. You don't need a slide deck to prove it. You need to stop pretending it's a debate.

## Two kinds of design decisions

The trick is knowing which kind you're dealing with.

| | Standards | Bets |
|---|---|---|
| What they are | Things good practice already settled | Calls where reasonable people could disagree |
| Examples | Accessibility, consistent patterns, clear error states, not hiding key actions | Which flow to build first, what to cut, how to trade speed for flexibility |
| How to handle them | State it once. Don't re-argue it. | Write down the rationale and what would change your mind |
| Where the rationale lives | Your design system and principles | The PRD and the case study |

Most design arguments go badly because a standard gets treated like a bet. You end up defending accessibility like it's a personal preference.

And sometimes it's the opposite: a genuine bet gets presented like a standard, and the room feels steamrolled. That's when you need real rationale.

## How to write design rationale for the bets

Keep it short enough that someone will actually read it. This format works:

```markdown
## Decision: [what we chose]

- Context: what problem this solves, in one sentence
- Options considered: 2-3, one line each
- Why this one: the tradeoff we accepted, and what we gave up
- Evidence: data, research, or constraint behind it
- What would change our mind: the signal that means we revisit
- Owner and date
```

That last field is the one that ends arguments. "We'll revisit if week-two usage is under 20%" turns a standoff into an experiment. Nobody has to win. You just have to agree on what you're watching.

If you need help picking that signal, start with [the UX metrics that actually make it into the exec deck](/letters/ux-metrics/).

<!-- newsletter -->

## Where design rationale should live

**In the PRD.** Decisions made at kickoff belong in the doc everyone reads. Here's [the PRD template I use](/letters/prd-template/), which has a decision table built into the ROI section.

**In the case study.** Rationale is the most interesting part of a case study, and the part most designers bury. Structure it around decisions, not the timeline. Here's [the UX case study template](/letters/ux-case-study-template/) that does exactly that.

**Not in Slack.** If the reasoning only exists in a thread, it doesn't fucking exist. Three weeks from now nobody will find it, and you'll have the same argument again.

## How to present design decisions in a review

**Lead with the decision, not the backstory.** "We're going with option B because it ships in half the time and we can add the rest later" beats ten minutes of context every time.

**Give one line of why.** If they want more, they'll ask. When they ask, you've got the decision record.

**Name the tradeoff out loud.** It tells people you saw the other options. Most pushback is really "did you think about X?" Answer it before they ask.

**Say what would change your mind.** It makes you look confident, not stubborn.

**Don't defend standards.** State them and move on.

## The real fix happens upstream

Most of the pushback you get in design reviews is a symptom. The decision should have been made earlier, with the right people in the room.

If constraints, scope and the success metric get agreed at kickoff, design reviews stop being trials. They become check-ins against decisions everyone already made.

That's how you earn your seat at the table. Not by winning the review. By making the argument unnecessary before the review starts. Here's [how I run a project kickoff meeting that actually forces those decisions](/letters/project-kickoff-meeting/).

## Turn your rationale into a case study

Your design decisions are the strongest material you have for a portfolio or a promotion packet. Most designers just never write them down.

[The 15 Minute Case Study](/roi-case-study-template/) is a free Claude Skill that pulls the rationale out of your rough notes and turns it into the business story: what you decided, what you traded off, and what changed because of it.

## Design rationale FAQ

### What is design rationale?

The reasoning behind a design decision: the problem, the options considered, why one was chosen, and the evidence behind it. Good rationale is short, written down, and says what would change the decision.

### How do I explain a design decision to a stakeholder who disagrees?

State the decision, give one line of reasoning, name the tradeoff, and offer a signal you'll watch. If it's a standard like accessibility, state it and don't re-argue it.

### Should designers document every decision?

No. Document the bets, the calls where reasonable people could disagree. Standards belong in your design principles once, not in every review.

### How long should design rationale be?

A few lines per decision. If it needs a page, you've bundled several decisions together. Split them.

<!-- cta -->
