---
title: "The ROI of design: how to calculate it for one feature, not the whole industry"
seoTitle: ROI of Design: How to Actually Calculate It
description: How to calculate the ROI of design for a real feature: the formula, worked examples for revenue, retention and cost, and the baseline to set first.
subtitle: Every article on design ROI quotes the same industry stats. Your CFO doesn't care about 300 other companies. Here's the math for the thing you actually shipped.
slug: roi-of-design
date: 2026-10-26
topic: case-studies
keyword: roi of design
cta: case-study
source: 24846454, 24742867, 23947769, 22627381
---

Every article about the ROI of design quotes the same stat.

Every $1 invested in UX returns $100.

Try finding the original study. I'll wait.

Even if it were true, it wouldn't help you. Nobody in a budget meeting is approving your project because of an industry average. They want to know what *this* feature did, or will do, for *this* business.

That's the only ROI of design that matters. And you can calculate it with a spreadsheet and some honesty.

## What the ROI of design actually means

The ROI of design is the return the business gets from a design decision, measured in money. Not "better experience." Not "users loved it." Money gained, money kept, or money saved.

The formula is the same one finance uses for everything else:

**ROI = (value created − cost of the work) ÷ cost of the work**

If a redesign costs $10,000 in design and engineering time and creates $30,000 in value over a year, the ROI is 200%.

That's it. The math is easy. The hard part is getting honest numbers for the two inputs, and having them before anyone asks.

## Why the industry stats don't help you

There is real research on this. [McKinsey tracked 300 companies over five years](https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-business-value-of-design) and found the top quartile on design grew revenue 32 percentage points faster than their industry peers.

Great. Put it on a poster.

It still doesn't answer the question your VP is actually asking, which is "should we spend two sprints on this?" A study about other companies is a reason to care about design in general. It's not a reason to fund your project in particular.

Here's the uncomfortable part. Most designers can *describe* the ROI of design. Very few can *produce* it for their own work. Describing it gets you a nod in the meeting. Producing it gets you the budget.

## The three places design ROI shows up

Every design decision that matters moves money in one of three ways.

| Lever | What changes | Metrics that show it | How to put a dollar value on it |
|---|---|---|---|
| **Revenue** | More people buy, upgrade or expand | Trial to paid, conversion rate, expansion, deals unblocked | New customers × average contract value |
| **Retention** | Fewer people leave | Churn rate, repeat usage, renewal rate | Customers kept × average contract value |
| **Cost** | It's cheaper to run | Support tickets, onboarding time, demo time, task time | Hours saved × loaded hourly cost |

If you can't put your project in one of those rows, it's worth asking whether the project matters.

## How to calculate the ROI of design: three worked examples

The numbers below are illustrative. Swap in yours. The structure is the part to steal.

### Example 1: cost (a confusing billing screen)

- Support gets **120 tickets a month** about the billing screen
- Each takes **12 minutes** to resolve
- That's **24 hours a month** of support time
- At a loaded cost of **$40 an hour**, that's **$960 a month**

The redesign cuts those tickets in half. That's **$480 a month**, or **$5,760 a year**, saved.

The work cost about **$8,000** in design and engineering time.

Year-one ROI: ($5,760 − $8,000) ÷ $8,000 = **−28%**.

Negative. Over two years it's **+44%**, and it pays for itself in about 17 months.

Say that out loud. Not every good redesign pays back in a quarter, and the designer who admits it is the one whose next number gets believed.

The same math works on your own time, by the way. I caught myself after a client call, scrubbing the recording and rewriting insights I'd already worked out in the room. Say that packaging takes **45 minutes** a call, two calls a week. That's **6 hours a month**. At a conservative **$75 an hour**, it's **$5,400 a year** of designer time spent turning thinking into a shareable format. One tiny repeated task.

### Example 2: revenue (a trial onboarding flow)

- **1,000 trials** start every month
- **8%** convert to paid
- Average contract value is **$1,200 a year**

The new onboarding flow moves conversion from 8% to 9%. One point.

That's **10 extra customers a month**, or **$12,000 in new annual recurring revenue** from every monthly cohort. Over a year of cohorts, that's **$144,000 in ARR**.

The work cost **$15,000**.

ROI: ($144,000 − $15,000) ÷ $15,000 = **860%**.

A one-point lift sounds boring in a design review. It doesn't sound boring in a revenue meeting.

### Example 3: retention (fixing the first week)

- **2,000 customers** at **$1,200 a year**
- Monthly churn is **2%**, so **40 customers** leave every month
- Exit surveys keep naming the same setup step

The fix drops churn to **1.8%**. That's **4 fewer customers lost a month**, or **$4,800 in ARR kept** every month. **$57,600 a year.**

Nobody throws a launch party for customers who didn't leave. Finance notices anyway.

## Set the baseline before you build

This is where most ROI of design calculations die.

I learned this one the expensive way.

I spent six weeks on a dashboard redesign. Stakeholder interviews. Competitive analysis. Three rounds of iteration. The handoff was the cleanest thing I'd ever shipped.

Six months later, nobody was using it.

The design wasn't the problem. Nobody had defined what success looked like before I started. We didn't have a problem statement. We had a feature request. So there was no baseline, no target, and no ROI to calculate. Just a very clean dashboard and a lot of silence.

That's what happens when you go looking for the "before" number after launch. You end up reverse-engineering it from memory and vibes.

That's not proof. That's a vibe.

The fix is boring and it works: agree on the metric, the baseline and the target **at kickoff**, before anyone opens Figma. Start with one sentence: *what would need to be true for this feature to matter?* Not ship. Not look good. Matter. Write them into the success metric section of the PRD. Here's [the PRD template I use](/letters/prd-template/), and [the kickoff agenda](/letters/project-kickoff-meeting/) that forces the room to pick a number.

If you only remember one thing from this letter, make it this one. **You can't calculate a return on something you never measured the start of.**

<!-- newsletter -->

## What if you don't have clean data?

Most teams think they don't. Usually the data is already there and nobody gave designers a fast way to get at it.

Before a recent redesign, I had Claude read our codebase and list the Mixpanel events already firing on that page. Then I gave those exact event names to Mixpanel's agent and asked, in plain English, where people were dropping off. Two back-and-forths. Under an hour.

My assumption about where the friction was? Wrong. The real drop-off was one step earlier in the flow. Skip that and I'd have spent two weeks polishing the wrong screen.

One path is two weeks of work in the wrong direction. The other is a 45-minute conversation with your own data. And now the baseline exists before the work starts.

When there truly is no tracking, you still have support logs, sales call notes, demo recordings and a calculator.

Use conservative math, show every assumption, and label it as **expected impact**, not results. Leadership trusts a modest number with visible math far more than a big number with none. I walk through that approach, plus which metrics to stop leading with, in [UX metrics that actually make it into the exec deck](/letters/ux-metrics/).

## How to present the ROI of design to leadership

One sentence. Then the math.

**"We changed [X], which moved [metric] from [baseline] to [result], worth about [$] a year."**

Then:

- **Show the math in one line.** 10 customers × $1,200 × 12 months.
- **Name the assumption that could be wrong.** It makes the rest of the number more believable, not less.
- **Say what it cost.** Skip the cost side and you've written a press release.

One version gets you "nice work." The other gets you the next project, and the budget to go with it.

## Put the number where it counts

Your ROI of design calculation is the strongest thing you can put in a case study, a portfolio or a promotion packet. Most designers have the raw material sitting in their project notes. They just never did the math.

[The 15 Minute Case Study](/roi-case-study-template/) is a free Claude Skill that walks you through it: what changed, from what baseline, worth how much. Or it shows you that you never measured it. Either way, you'll know before your manager asks.

If you want to set up the math before the next project instead of after, that's what [Builder Kickoff™](/builder-kickoff/) is for. The decision, the metric and the ROI case get locked in the first session.

## ROI of design FAQ

### What is the ROI of design?

The financial return a business gets from a design decision: revenue gained, customers kept or costs saved, compared with what the design and build work cost. It's calculated with the standard ROI formula: (value − cost) ÷ cost.

### How do you measure design ROI?

Pick the lever the work is supposed to move (revenue, retention or cost), record the baseline before you build, measure the same number after launch, and convert the difference to dollars using contract value or loaded hourly cost.

### Is the "$1 in UX returns $100" stat real?

It gets repeated constantly, usually without a source anyone can check. Don't use it in front of finance. A smaller number from your own product is far more persuasive than a big one from nowhere.

### What if the ROI of a design project is negative?

Say so, and show when it pays back. Plenty of good work, like accessibility or reducing support load, pays back over years, not months. Being honest about the slow ones is what makes your big numbers credible.

### How long does it take to see design ROI?

Cost savings and conversion changes often show up within a month or two. Retention takes longer, usually a full quarter, because you need enough time to see who didn't leave.

### Who should calculate the ROI of design, the designer or the PM?

Whoever wants credit for the outcome. If you're a designer and you leave it to the PM, the PM tells the story, and the story usually doesn't mention design.

<!-- cta -->
