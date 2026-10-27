---
title: How to run a project kickoff meeting that actually kicks something off
seoTitle: Project Kickoff Meeting Agenda and Template
description: A project kickoff meeting agenda that forces real decisions in 60 minutes: the four questions to ask, who should be in the room, and what you leave with.
subtitle: Most kickoffs are expensive brainstorms. Here's the agenda that makes the room decide, and the outputs you should have before anyone opens Figma.
answer: A project kickoff meeting has to answer four questions: what are we solving, what are we not solving, how much time do we really have, and which tradeoffs will we accept. Run it as a 60-minute, timeboxed agenda and leave with the decisions written down.
slug: project-kickoff-meeting
date: 2026-07-08
updated: 2026-10-15
topic: kickoffs
cover: /assets/images/letters/project-kickoff-meeting.jpg
keyword: project kickoff meeting
cta: builder-kickoff
source: 23000589, 24812604, 23657334
---

Four weeks of work. Three rounds of high fidelity. A prototype so polished you could see your reflection in it.

We walked into the room confident.

The PM opened with: "So what decision are we making today?"

Nobody answered.

The project got shelved two weeks later.

That wasn't a design failure. The design was fine. It was a framing failure, and it happened a month earlier, in the kickoff, when nobody forced the room to agree on what the work needed to prove.

So let's fix the kickoff.

## Why most project kickoff meetings don't kick anything off

Most kickoffs feel productive. Energy is high, ideas are flowing, everyone leaves feeling aligned.

And then the project drifts.

Not because anything is broken. Because the work starts before the decisions are actually made. Teams talk about solutions before agreeing on the goal. Constraints surface late. Scope grows quietly.

Nobody makes the hard call, because keeping options open feels safer in the moment.

So design moves forward. Engineering builds. And a few weeks later everyone's circling back to questions that should have been answered on day one.

**A kickoff that ends in "cool, we're aligned" usually means you agreed to keep talking.**

Even good kickoff templates lean this way. [Atlassian's project kickoff play](<https://www.atlassian.com/team-playbook/plays/project-kickoff>) gives 60 of its 90 minutes to refining the vision, mission and what "done" means. Useful for alignment. It still doesn't force the scope and tradeoff calls.

## The four questions every kickoff has to answer

Before anyone pitches a single solution, the room answers these:

1. **What are we actually solving?**
2. **What are we explicitly not solving?**
3. **How much time do we really have?**
4. **What tradeoffs are we willing to accept?**

That's it. No frameworks. No bullshit. Just decisions.

If you get those four right, everything downstream gets easier. If you don't, you spend the next three weeks paying for it in rework, confusion and slow delivery.

Notice that every one of them is a constraint, not an idea. That's the point. Ideas multiply. Constraints are what stop them from spiraling.

## A 60-minute project kickoff meeting agenda

Here's the agenda I'd run. Sixty minutes, timeboxed, with an owner for each block.

| Time | Block | What the room decides | Owner |
|---|---|---|---|
| 0–10 min | The problem | One sentence: what's broken, for who, and how we know | PM |
| 10–20 min | The bet | "If we ship this, ___ moves from ___ to ___ by ___" | PM + design |
| 20–30 min | Constraints | Time, team, tech limits, dependencies, legal | Engineering |
| 30–40 min | Not doing | The explicit out-of-scope list | Whoever facilitates |
| 40–50 min | Smallest version | The smallest thing worth building that still tests the bet | Design + engineering |
| 50–60 min | Open questions | What we still don't know, who finds out, by when | Everyone |

Two rules make this work.

**Rule one: no screens until minute 40.** The moment a mockup shows up, the conversation shifts to how it looks instead of whether it's the right thing, and you've lost the next twenty minutes to a goddamn debate about button colors. Keep pixels out of the room until the constraints are on the table.

**Rule two: someone writes it down live.** Not after. Not "I'll send notes." Live, in the doc, where everyone can see it. Better yet, record the whole thing.

<!-- video:jMFZon1zh4w -->

## Kickoff meeting template (copy and paste)

Open this doc on the shared screen and fill it in live. When the hour is up, it's done.

```markdown kickoff-notes.md
# [Project] Kickoff
Date · Facilitator · Recording link

## Problem (one sentence)
- What's broken, for who, and how we know

## The bet
- If we ship this, ___ moves from ___ to ___ by ___.

## Appetite
- Time: ___ · Team: ___

## Constraints
-

## In scope
-

## Maybe (decide by ___)
-

## Out
-

## Smallest version worth building
-

## Open questions
| Question | Owner | By when |
|---|---|---|
|  |  |  |
```

And the invite. Send it two days before, so people show up with answers instead of opinions.

```text kickoff-invite.txt
Subject: [Project] kickoff: 60 minutes, one decision

We're kicking off [project] on [date]. The goal is to leave with one agreed problem, a success metric, a scope list and an owner for every open question.

Before the call, bring:
- Product: the problem in one sentence, and how we know it's real
- Engineering: known constraints and dependencies
- Design: screenshots or recordings of the current experience

No mockups until the last 20 minutes. I'll record it and share the notes the same day.
```

## Who should be in the kickoff

Small room. Three roles, minimum:

- **Product**, who owns the problem and the business case
- **Engineering**, who owns what's actually possible in the time you have
- **Design**, who owns how the user gets from problem to outcome

Add a stakeholder only if they hold a constraint nobody else knows about. Every extra person adds opinions faster than they add decisions.

## What you should walk out with

A kickoff isn't done when the hour is up. It's done when you have these:

- A one-sentence problem statement everyone agreed to out loud
- A success metric with a baseline and a target (if you're stuck here, here's my list of [UX metrics that actually make it into the exec deck](/letters/ux-metrics/))
- A written out-of-scope list
- The smallest version worth building
- An owner and a date for every open question

That list is basically a [PRD](/letters/what-is-a-prd/). Which is why I stopped writing PRDs after kickoffs and started filling them in during them. Here's [the PRD template I actually use](/letters/prd-template/), section by section.

<!-- newsletter -->

## The kickoff mistakes that cost the most

**Pitching solutions in the first ten minutes.** The loudest idea wins, and now you're scoping a solution instead of a problem.

**Treating "we'll figure it out" as an answer.** That's not an answer. That's bullshit with a calendar invite. It's a decision you've deferred to the worst possible moment, which is week three, in a Slack thread, with half the context missing.

**Skipping the out-of-scope list.** Every line on it is an argument you won't have later. Every line you skip is scope creep with a head start.

**Letting the brief arrive pre-decided.** If the business problem showed up as a Jira ticket two weeks before design got pulled in, the kickoff is your one chance to reopen it. I wrote more about that in [how to write a product brief that doesn't arrive half-wrong](/letters/product-brief-template/).

**Ending without a recording or a doc.** Memory is not documentation. Three people will remember three different meetings.

## Record it, then let the transcript do the writing

This is the part that changed everything for me.

If you record the kickoff, the transcript already contains almost every decision your PRD asks for. The problem, the bet, the constraints, the out-of-scope list. It's all in there, in the team's own words.

I've been running a version of this I call [Builder Kickoff™](/builder-kickoff/) for a couple of years now. A structured facilitation session, not a brainstorm, where you bring together your PM and engineer and extract the actual problem before anyone starts building.

The transcript goes into a Claude skill that drafts the PRD and the prototype prompt the same day. From there, I build the risky part in code. Here's [why I use Cursor instead of Figma Make](/letters/cursor-for-designers/) for that step.

You walk out with documentation. You walk out with a business case. And you walk out as the person who made the project make sense.

## Project kickoff meeting FAQ

### How long should a project kickoff meeting be?

Sixty minutes is enough for most features if you run it as a decision meeting. If it needs a full day, the project is too big. Split it into smaller bets.

### What's the difference between a kickoff and discovery?

Discovery answers "is this worth solving?" The kickoff answers "given that it is, what exactly are we building, in what time, and what are we not doing?" Run discovery first if nobody can state the problem in one sentence.

### Should designers run the kickoff?

If nobody else is forcing decisions, yes. Whoever facilitates the kickoff frames the problem, and whoever frames the problem shapes the solution more than whoever designs it.

### What if a stakeholder won't commit to a constraint?

Write down "undecided" with their name and a date next to it. Public, owned uncertainty gets resolved. Private uncertainty becomes rework.

### What should a kickoff meeting agenda include?

Six blocks: the problem, the bet, constraints, what you're not doing, the smallest version, and open questions with owners. The 60-minute agenda above times each one, and the template gives you somewhere to write it down live.

<!-- cta -->
