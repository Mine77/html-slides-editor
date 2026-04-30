# Workflow Questions

Use these prompts to collect only the missing information needed to keep the
workflow disciplined.

## Roadmap normalization questions

Ask these when the roadmap file is missing, ambiguous, or too weak to support
issue creation.

Preferred order:

1. what is the canonical roadmap file for this repo
2. what are the next milestones this project must deliver
3. for the target milestone, what outcome should be true when it is done
4. what work is explicitly in scope and out of scope for that milestone
5. what observable exit criteria prove the milestone is complete
6. which issues already exist for this milestone, if any

## ADR gate questions

Ask these before drafting architecture-touching issues.

Preferred order:

1. does an ADR already govern this area
2. if yes, which ADR should the issue link to
3. if no, should we create or bootstrap ADR documentation first
4. what technical decision needs to be made durable before implementation starts

## Issue drafting questions

Ask the smallest useful set.

Required fields:

- milestone
- summary
- problem
- scope
- non-goals
- acceptance criteria
- tests
- roadmap link
- ADR links
- context links

Preferred order:

1. which milestone and which implementation slice is this for
2. what problem should this issue solve now
3. what is in scope and what is explicitly out of scope
4. what observable acceptance criteria should this issue meet
5. what tests are required
6. which roadmap, ADR, and context docs should the issue link to

## Implementation handoff questions

Ask these when starting a new delivery session from an existing issue.

1. is this issue still the right contract, or did scope drift since creation
2. which ADRs and context docs must the implementation session read first
3. does the issue need to be split before coding starts

## Closeout questions

Ask these when the work is merged and the workflow needs to be closed cleanly.

1. which PR landed this issue
2. should the issue be marked done now or is follow-up work still open
3. how should the roadmap milestone reflect this delivery

## Draft review

Before creating an issue, always show:

- issue title
- full issue body
- roadmap section to update
- ADR links that justify the issue

Wait for explicit confirmation before publishing.
