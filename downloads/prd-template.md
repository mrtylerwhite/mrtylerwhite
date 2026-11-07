# [Feature name] PRD

> The PRD template from Tyler White (mrtylerwhite.com).
> Fill it in during the kickoff, while the room is still deciding. Not three days later, from memory.
> How to fill it from one kickoff call: https://www.mrtylerwhite.com/letters/prd-template/

## 1. Metadata
- Epic:
- Feature:
- Product owner:
- Designer:
- Tech lead:
- Status: Draft / In review / Approved
- Last updated:

## 2. Objective
- What problem are we solving, in one sentence?
- Who has this problem?
- How will we measure success? (metric, baseline, target, timeframe)

## 3. Problem and context
- Pain points (what users and the business feel today)
- Market context (what competitors or alternatives do)
- Value proposition (why this is worth building now)

## 4. ROI analysis
- The bet: what we believe will happen if we ship this
- Team cost: people x weeks
- Decision table: build / don't build / smaller version, with the tradeoff of each

## 5. Scope
- MVP requirements (must ship)
- Out of scope (explicitly not doing this time)
- Constraints (time, tech, legal, dependencies)

## 6. Open questions
- What we still don't know, who owns finding out, and by when

---

# Example: Saved report filters PRD (filled in)

Illustrative, not from a real team, so you can see the shape without anyone's confidential detail.

| Section | Example |
|---|---|
| Objective | Let account managers save report filters so they stop rebuilding the same view every Monday. Success: weekly active report users up from 38% to 50% within one quarter. |
| Pain points | Managers rebuild the same five filters every week. Support gets "where did my view go" tickets. |
| The bet | Saved filters cut time-to-report and pull managers back into the product weekly. |
| Team cost | 1 designer, 2 engineers, 3 weeks. |
| Decision table | Full saved views (5 weeks, highest impact) vs. saved filters only (3 weeks, most of the value) vs. do nothing (keep losing weekly usage). Chose saved filters only. |
| MVP requirements | Save, name, load and delete a filter set. Max 10 per user. |
| Out of scope | Sharing views with teammates. Scheduled email reports. |
| Open questions | Do saved filters need to survive a permissions change? Owner: tech lead, by Friday. |

Notice what's not in there. No pixel spec. No user flow diagrams. Those come later, inside the box this doc just drew.
