---
title: I tried to quit Figma. Here's where it broke.
description: I spent two and a half months trying to design my website without Figma, using Claude and vibe coding instead. Here's what I tried, where it broke, and the workflow that actually works.
slug: designing-without-figma
date: 2026-11-21
topic: ai-workflow
cover: /assets/images/letters/designing-without-figma.jpg
coverAlt: "A person draws one glowing amber curve across a blank stone canvas, his back to a towering heap of scribbled paper slips"
cta: builder-kickoff
---

If you've been on LinkedIn lately, you'd think Figma is already dead.

"I don't need designers anymore." "I don't need Figma anymore."

Everyone's ditching it. Or at least posting like they are.

I wanted to know how much of that was bullshit. So for the last two and a half months, I tried it myself. No Figma. Just me, Claude, and a website I wanted to redesign.

## Why I tried to design without Figma

I've been a designer since I was a kid. Painting, drawing, typography, all of it. I like Figma fine.

But I think designers, and product people in general, are about to become art directors of the stuff we build. How well you think is going to matter more than how well you execute.

I'd rather learn what that looks like now than get dragged into it in two years.

So the challenge was simple. Redesign my personal site so I can vibe code new pages and funnels with Claude. Skip Figma completely.

## What I tried

First I bought a marketing design system built on Tailwind. Great components. Great sections. One problem: it's built in React, and my site is plain HTML.

I wasn't about to rebuild my whole website just to use a design system. So I had Claude look at the pages and recreate them.

It did a pretty mediocre job.

Then I found design.md files. One doc that sits on top of your codebase and holds your brand: the colors, the sections you're allowed to use, the rules for spinning up a new page. A mini art director living in your code that Claude checks before it builds anything.

I'm still wrapping my head around it. It's still the most promising thing I've found.

Here's the skeleton of mine. Swap the brackets for your own rules.

```markdown design.md
# DESIGN.md

[Reference site] is the layout. This site keeps [number] overrides.

Before building a new page, find the closest existing template. Use the sections and components that already exist. Don't invent a new visual style unless the system can't support it.

## Overrides
- Headings: [font, case, colour]
- Buttons: [shape]. Don't restyle them.
- Accent: [colour]. Never on a headline.

## Tokens
Spacing, radius, type sizes and colours live in [tokens file]. Change values there only.

## Components
The registry is [components file]. Reuse before you add.

## Page recipe
1. Pick the closest template.
2. List existing components and pass content. Don't copy their HTML.
3. Real copy only. No fake numbers, no client logos.
4. Two buttons at most.

## Good and bad
Good: [a page built the right way]
Bad: [the stuff Claude keeps inventing]

## QA
Check desktop and a 375px phone. Click every button and link.
```

Then came the late nights. Me typing "this is what I want" over and over. Asking ChatGPT to write the prompt so I could hand it to Claude.

Running out of Claude tokens in the middle of the night and switching to [Cursor](/letters/cursor-for-designers/), because Cursor slows you down when you hit the limit instead of cutting you off.

I spent a lot of those nights yelling at a thing with no feelings. It did not give a shit.

Here's what I figured out. Getting Claude to make a website is easy. Getting it to hit the bar of craft I actually care about is a different job.

And I'm not hitting it.

## Where it broke

The annoying part is I know this can work.

At my 9 to 5, we have a tool that vibe codes client presentations against any company's brand. Point it at their website, give it a persona and a scenario, and it spits out a white-labeled presentation.

It's damn good.

But it's good because everything underneath it was finished first. The design system lives in code. Every module is documented down to the last detail. And all of that was designed in Figma, handed to engineering, and built properly.

My website has none of that.

I was trying to skip the step that makes the magic possible. So far, that step is required.

## Why you can't describe good design in a prompt

I talked this through with Nick Groeneveld, my co-host on [The Design Table Podcast](https://www.designtablepodcast.com/). He put it best: we're trying to do visual thinking expressed in words.

Try telling a machine "move that a little to the left, and the corner doesn't need to be that round." That's a literal language barrier.

And it's not only the wording. Nick asked me to write down the rules of good design. I couldn't.

Take something as basic as font size. Most designers will tell you body text shouldn't go below 16 pixels. Then come the exceptions: mobile, fine print, the little Easter egg you don't really want people to read.

Teaching that judgment to a junior designer takes forever. Teaching it to a machine with zero context is starting from scratch.

Then there's the wow moment. You look at a screen, something clicks, and you feel it before you can explain it. I chased that feeling this whole experiment. I honestly don't think I can describe it to Claude.

That part might be ours.

Nick had a perfect example. He had Claude study which of our podcast thumbnails got the best click-through. One of the winners had a single capitalized word on it: TRAP.

Now every time he uses that skill, Claude tries to shove the word "trap" in somewhere.

Nick reads that data and thinks "emotional word, big, capitalized." Claude reads it and thinks "trap."

It looks like it gets it. It doesn't.

<!-- figure:trap-read -->

## What actually works: the 70/30 loop

The closest thing to Figma-less that either of us has found still has Figma in it. Nick's loop runs about 70% Claude and 30% Figma:

1. Sketch a few directions in Figma by hand and talk them through with stakeholders and the developer. Same idea as a [good kickoff](/letters/project-kickoff-meeting/): decide before anyone builds.
2. Take the direction that has legs into Claude and [start prototyping](/letters/ai-prototyping-workflow/).
3. When you hit something you can't describe, have Claude put it back into Figma as a frame next to the original.
4. Design the variation yourself. Draw the thing you actually meant.
5. Point Claude at that frame and keep prototyping from there.

<!-- figure:seventy-thirty -->

Claude builds the frames. You paint the picture. That's where your craft and taste come back in.

Steps 3 and 5 are where most people give up and go back to typing. Here's what to paste when you hit that wall.

```text stuck.txt
I can't describe what I want here, so I'm going to draw it.

1. Put the current [screen name] into Figma as a new frame, right next to the original. Name it "[screen name] / mine".
2. Don't change anything else. Tell me when it's there.
```

```text build-from-frame.txt
I drew the version I meant in the frame "[screen name] / mine": [Figma link]

1. Match its layout, spacing, type and corner radius exactly.
2. Rebuild the screen in code from that frame. Don't "improve" it.
3. List anything you couldn't match instead of guessing.
```

## Figma or prototype: how my team decides

We're testing this at work right now. Designers can hand off to engineering two ways: a Figma file or a prototype. Either is fine. What matters is picking the right one for the problem.

| If the work is… | Use | Why |
|---|---|---|
| High craft: polish, illustrations, how the experience feels | Figma | You need a canvas to think visually |
| Logic-heavy: lots of states and edge cases | Prototype | Easier to cover every case and hand to engineering |

Our prototypes pull in the real production components without the logic or the backend. What designers build looks one-to-one with production, just lighter. New screens still start in Figma.

It works especially well for stuff that's a nightmare to mock up. Like the natural language search we're building, where typing "apples" should also find the apple pie.

The prototype route has a bonus too. When design owns the edge cases, engineering stops pinging you about what happens when a loading state errors out.

You spend your time with engineering on the product. Not on the error states.

## So should you quit Figma?

No. And don't cling to it either.

We used to have one tool, so we used it for everything. Even the projects that never needed it.

Now we have a whole kit. Your job is to pick the right tool for the job, like any decent craftsperson would.

Experiment. Push on the edges. Just don't torch what works today while you do it.

One question for your next project. When you're stuck going back and forth with AI, is it the tool? Or is it that you can't put what you want into words?

If it's the words, stop typing. Open a canvas, draw it, and hand it back.
