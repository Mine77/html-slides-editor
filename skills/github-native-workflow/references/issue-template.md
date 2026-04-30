# Default Issue Template

Use this template when creating roadmap-backed implementation issues.

If the repo already has a canonical issue template, preserve that template and
map these sections into it.

## Required sections

```md
## Summary

Short statement of the implementation slice and why it exists now.

## Problem

What user-facing, product, or engineering problem this issue solves.

## Scope

- included change 1
- included change 2

## Non-goals

- explicitly excluded item 1
- explicitly excluded item 2

## Acceptance Criteria

- observable outcome 1
- observable outcome 2

## Tests

- required unit or integration coverage
- required regression or E2E coverage
- verification command or repo-standard validation step

## Context

- roadmap: <milestone link or file section>
- adr: <relevant ADR links>
- docs: <relevant context docs or architecture notes>

## Notes For Implementation

- package boundaries, constraints, rollout notes, or handoff details
```

## Rules

- Keep one issue scoped to one implementation slice.
- Make acceptance criteria observable, not aspirational.
- Use `Non-goals` to prevent silent scope creep.
- Link the milestone section that justified the work.
- Link ADRs whenever the task is constrained by an architecture decision.
- If the repo has a default verification command, include it unless the user explicitly narrows the contract.

## Session-start expectation

When a new implementation session starts from an issue created by this
workflow, the agent should be able to begin by reading only:

- the issue
- the linked roadmap milestone
- the linked ADRs
- the linked context docs

If that is not enough, the issue is under-specified and should be repaired
before coding starts.
