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

If you've been on LinkedIn lately, you'd think Figma is already dead. "I don't need designers anymore." "I don't need Figma anymore." Everyone's ditching it, or at least posting like they are. I wanted to know if any of it was real, so for the last two and a half months I tried it myself. No Figma. Just me, Claude, and a website I wanted to redesign.

## Why I tried to design without Figma

I've been a designer since I was a kid. Painting, drawing, typography, all of it. I like Figma fine. But I think designers, and product people in general, are about to become art directors of the stuff we build. How well you think is going to matter more than how well you execute, and I'd rather learn what that looks like now than get dragged into it in two years. So the challenge was simple: redesign my personal site in a way where I can vibe code new pages and funnels with Claude, and skip Figma completely.

## What I tried

First I bought a marketing design system built on Tailwind. Great components, great sections, one problem: it's built in React, and my site is plain HTML. I wasn't about to rebuild my whole website just to use a design system, so I had Claude look at the pages and recreate them. It did a pretty mediocre job.

Then I found design.md files. The idea is a single doc that sits on top of your codebase and holds your brand: the colors, the sections you're allowed to use, the rules for spinning up a new page. Think of it as a mini art director living in your code that Claude checks before it builds anything. I'm still wrapping my head around it, but it's the most promising thing I've found so far.

And then there were the late nights. Me typing "this is what I want" over and over. Asking ChatGPT to write the prompt so I could hand it to Claude. Running out of Claude tokens in the middle of the night and switching to Cursor, because Cursor slows you down when you hit the limit instead of cutting you off. I spent a lot of those nights yelling at a thing with no feelings.

Here's what I figured out. Getting Claude to make a website is easy. Getting it to hit the bar of craft I actually care about is a different job entirely, and I'm not hitting it.

## Where it broke

The annoying part is I know this can work. At my 9 to 5, we have a tool that vibe codes client presentations against any company's brand. You point it at their website, give it a persona and a scenario, and it spits out a white-labeled presentation. It's damn good.

But it's good because everything underneath it was finished first. The design system lives in code. Every module is documented down to the last detail. And all of that was designed in Figma, handed to engineering, and built properly. My website has none of that foundation. I was trying to skip the step that makes the magic possible, and so far that step is required.

## Why you can't describe good design in a prompt

My co-host Nick put it best when we talked about this on the podcast: we're trying to do visual thinking expressed in words. Try telling a machine "move that a little to the left, and the corner doesn't need to be that round." There's a literal language barrier.

It goes deeper than wording, though. Nick asked me to write down the rules of good design, and I couldn't. Take something as basic as font size. Most designers will tell you body text shouldn't go below 16 pixels. Then come the exceptions: mobile, fine print, the little Easter egg you don't really want people to read. Teaching that judgment to a junior designer takes forever. Teaching it to a machine with zero context is starting from scratch.

And then there's the wow moment. You know the one. You look at a screen and something just clicks, and you feel it before you can explain it. I've been chasing that feeling this whole experiment, and I honestly don't think I can describe it to Claude. That part might be ours.

Nick had a perfect example. He had Claude study which of our podcast thumbnails got the best click-through. One of the winners had a single capitalized word on it: TRAP. Now every time he uses that skill, Claude tries to shove the word "trap" in somewhere. Nick reads that same data and thinks "emotional word, big, capitalized." Claude reads it and thinks "trap." It looks like it gets it. It doesn't.

## What actually works: the 70/30 loop

The closest thing to Figma-less that either of us has found still has Figma in it. Nick's loop runs about 70% Claude and 30% Figma:

1. Sketch a few directions in Figma by hand and talk them through with stakeholders and the developer.
2. Take the direction that has legs into Claude and start prototyping.
3. When you hit something you can't describe, have Claude put it back into Figma as a frame next to the original.
4. Design the variation yourself. Draw the thing you actually meant.
5. Point Claude at that frame and keep prototyping from there.

Claude builds the frames. You paint the picture. That's where your craft and taste come back in, and honestly, it's where they belong.

## Figma or prototype: how my team decides

We're testing this at work right now. Designers can hand off to engineering in one of two ways, a Figma file or a prototype, and either is fine. What matters is picking the right one for the problem.

| If the work is… | Use | Why |
|---|---|---|
| High craft: polish, illustrations, how the experience feels | Figma | You need a canvas to think visually |
| Logic-heavy: lots of states and edge cases | Prototype | Easier to cover every case and hand to engineering |

Our prototypes pull in the real production components without the logic or the backend, so what designers build looks one-to-one with production, just lighter. New screens still start in Figma. It works especially well for stuff that's a nightmare to mock up, like the natural language search we're building, where typing "apples" should also find the apple pie.

The prototype route has a bonus too. When design owns the edge cases, engineering stops pinging you about what happens when a loading state errors out, and the conversations between design and engineering get about the stuff that actually matters.

## So should you quit Figma?

No. And you shouldn't cling to it either. We used to have one tool, so we used it for everything, even the projects that never needed it. Now we have a whole kit, and your job is to pick the right tool for the job like any decent craftsperson would. Experiment. Push on the edges. Just don't torch what works today while you do it.

One question to take into your next project: when you're stuck going back and forth with AI, are you stuck because of the tool, or because you can't put what you want into words? If it's the words, stop typing. Open a canvas, draw it, and hand it back.
