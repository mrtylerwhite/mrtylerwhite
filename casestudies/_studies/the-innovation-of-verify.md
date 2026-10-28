---
order: 3
slug: the-innovation-of-verify
title: "Document review from days to minutes, and $1M ARR in year one"
seoTitle: "Verify: AI Document Review Product Design Case Study"
description: "How Verify cut pharmaceutical document review from days to under 10 minutes and helped GlobalVision reach $1M ARR in its first year."
eyebrow: "Regulated SaaS · Pharma"
subtitle: "Verify is a document quality control platform for pharmaceutical teams, built from scratch. I was the founding product designer."
client: "GlobalVision"
clientDesc: "Document quality control software"
role: "Founding Product Designer"
focus: "Verify, 0 to 1"
heroImage: "/wp-content/uploads/2023/11/Frame-282-2.webp"
stats: "Days → <10 min|Average document review time ;; $1M ARR|GlobalVision, year one ;; 8 months|To a production release"
cta: "case-study"
---

## The real constraint

Pharmaceutical documents move through several review stages: Regulatory Affairs, Compliance and outside authorities.

Before Verify, that review was manual proofreading across departments. Every revision added review time, invited human error and pushed the release. As volume grew, release timelines stretched from hours into days. Teams couldn't scale quality control without adding headcount or accepting risk.

The problem wasn't accuracy. It was speed, trust and scale.

## My role

I was the founding product designer. That meant defining how document inspection would be automated in a regulated environment: shaping the inspection workflow, deciding where automation could safely replace manual review, and validating that results met the trust bar of compliance and regulatory teams.

The goal was lower release risk without losing regulatory confidence.

## What we found

We talked directly with pharmaceutical regulatory and compliance teams. Three findings shaped the product.

1. **Reviewers compared documents side by side by hand,** sometimes for hours. The bottleneck was tooling.
2. **Compliance teams had to trust the output before acting on it.** The tool had to show its work: not just flag differences, but categorize them so reviewers could prioritize.
3. **"Just make the software do it for me"** came up again and again. Reviewers didn't want to match graphics manually at all.

![Verify research and discovery overview](/wp-content/uploads/2023/11/Rectangle-36-2.png)

## The decision we had to reverse

Graphic inspection is a major use case. Documents come in different shapes and sizes and are rarely 1:1, which makes selecting and matching graphics hard.

Our first version shipped a manual tool for it. Depending on the user's comfort with software, it became a major source of frustration.

![First version: manual graphic selection](/wp-content/uploads/2023/11/Rectangle-36-1.webp)

The feedback was blunt: just make the software do it. So we scrapped the shipped feature and rebuilt it as fully automated matching that hands users the results directly.

![Rebuilt version: automated graphic matching](/wp-content/uploads/2023/11/Rectangle-37.png)

## What shipped

- **A linear inspection flow** that guides users through each stage.
- **A Prep step** that asks what the reviewer cares about, so results only highlight relevant errors.
- **Difference Types,** tags on every flagged difference that give reviewers the context to move faster.

![Verify inspection results](/wp-content/uploads/2023/11/Rectangle-38.png)
![Verify difference types](/wp-content/uploads/2023/11/Rectangle-39.png)
![Verify review flow](/wp-content/uploads/2023/11/Rectangle-40.png)

Behind it: double diamond to define the problem, several rounds of wireframes, Figma prototypes, small proofs of concept, and validation of every feature with end users.

## Results

- **Review time cut from days to under 10 minutes** on average.
- **Production release in 8 months.**
- **GlobalVision reached $1M ARR in year one,** with Verify a key part of that growth.

## What I learned

The most important design decision was making the output trustworthy enough for compliance teams to act on.

Being willing to scrap a shipped feature is what made the product credible in a regulated environment.
