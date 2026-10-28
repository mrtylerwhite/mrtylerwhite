---
order: 4
slug: keplers-prebuilt-workflows
title: "Cutting ML project timelines from weeks to days"
seoTitle: "Kepler Prebuilt Workflows: AI Product Design Case Study"
description: "How prebuilt, guided machine learning workflows let business analysts run models without data scientists and cut project time from weeks to days."
eyebrow: "AI/ML · No-code"
subtitle: "Machine learning was locked behind technical skill. Business analysts waited days or weeks on data science to run models they couldn't run themselves."
client: "Stradigi AI"
clientDesc: "Kepler, an ML platform"
role: "Director of UI & UX"
focus: "Prebuilt ML workflows"
heroImage: "/wp-content/uploads/2023/11/Rectangle-38-2.png"
stats: "Weeks → days|Typical ML project time ;; 0|Lines of code asked of analysts ;; 2|Research tracks: analysts and data scientists"
cta: "case-study"
---

## The real constraint

Kepler sat inside an organization with strong data science. Access to models wasn't the problem. Who could actually use them was.

Business analysts were expected to drive decisions with data. The tools required programming, long setup and constant help from data scientists. As demand for insights grew, data science became the bottleneck, and analysts waited days or weeks for a model to be trained, adjusted or rerun.

This was not a tooling gap. It was an access bottleneck.

## My role

As Director of UI and UX, I owned the decision to open machine learning workflows to non-technical users without giving up rigor or trust. That meant turning internal data science tools into a guided system analysts could run on their own: the workflow structure, which decisions needed user input, and what complexity to remove.

The goal: analysts run routine models without waiting on data science.

## What we found

We ran two research tracks in parallel.

- **Business analysts:** how they actually made decisions. They spent days waiting on models they couldn't run. The bottleneck was access.
- **Data scientists:** how their internal tools worked, which technical parts could be simplified for analysts, and what had to stay intact for the experts.

The phrase that came up most: "I just need the output. I don't need to understand how it works."

![Research synthesis for Kepler prebuilt workflows](/wp-content/uploads/2023/11/Rectangle-36-6.webp)

## The decision

Productize the existing internal ML pipelines into one linear, guided workflow.

Show analysts only the inputs that change the outcome. Let the platform handle training, validation and deployment. Machine learning moved from a specialist task to an operational one.

The design rule that followed: **every screen had to be answerable by an analyst with no ML background.** If a step needed technical knowledge, we automated it or removed it.

![Kepler workflow wireframes](/wp-content/uploads/2023/11/Frame-282-1-2.png)

## The hard part: waiting

Training a model on a large dataset could take hours. That was the biggest pain point in testing, and we handled it two ways.

1. **A transparent loading screen** that says what's happening at each step, so a long wait doesn't feel like a frozen product.
2. **Notifications, in-app and by email,** when a model finishes training, so analysts can get on with other work instead of watching a progress bar.

![Kepler training progress screen](/wp-content/uploads/2023/11/Rectangle-36-7.png)

## What shipped

A linear flow that takes an analyst through importing data, training, improving and deploying a model. Each stage is explained as they go, so they finish the process and understand what they did.

![Kepler import step](/wp-content/uploads/2023/11/Rectangle-38-2.png)
![Kepler training step](/wp-content/uploads/2023/11/Rectangle-39-2.png)
![Kepler deploy step](/wp-content/uploads/2023/11/Rectangle-40-2.png)

## Results

- **Project time cut from weeks to a few days** in typical cases.
- **Analysts ran models on their own,** without waiting on data science for routine work.
- **Data science got its time back** for the problems that actually needed it.

## What I learned

Analysts needed to drive outcomes, not understand models. The best design decision was deciding what to hide.
