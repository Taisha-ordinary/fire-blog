# Claude Code and Codex collaboration

## Goal

Claude Code and Codex collaborate through Git and GitHub instead of copying chat messages
between tools. The shared state is explicit, reviewable, and recoverable.

## Two-repository model

| Repository | Visibility | Canonical contents |
| --- | --- | --- |
| `fire-blog` | Public | Production site, public assets, tests, public-safe implementation docs |
| `sidework-orchestrator` | Private | Strategy, KPI data, task queue, decisions, handoffs, agent results |

Do not create a second strategy store inside `fire-blog`. The private repository keeps the
existing canonical paths, including `media-os/state/current-strategy.json`,
`media-os/business/*.yaml`, `media-os/agents/*.md`, `decisions/`, `handoffs/results/`, and
`handoff-ledger.json`.

## Operating loop

1. ChatGPT records a prioritized request in the private control repository.
2. Claude Code pulls both repositories, claims the request, and implements it on a branch.
3. Claude Code opens a draft pull request in `fire-blog` using the shared template.
4. Claude Code comments `@codex review` on the pull request. Codex reviews the diff,
   checks, risks, and alignment with the source request using `AGENTS.md`.
5. Claude Code addresses actionable review comments and updates the same pull request.
6. The user makes the final merge or publishing decision.
7. Claude Code records the result in the private handoff ledger without duplicating raw logs.

For the first run, enable Codex code review for this repository in Codex settings. Automatic
reviews can replace the explicit `@codex review` comment after the workflow is stable.

For local continuity, the ChatGPT desktop app can import Claude Code projects and supported
setup. Importing does not replace the Git/GitHub handoff ledger; it makes the same local
project folders and recent context available when working locally.

## Handoff status

Use one stable handoff ID such as `H-20260803-001` across the private request, branch,
pull request, result, and review. Valid states are:

- `proposed`
- `accepted`
- `in_progress`
- `needs_decision`
- `completed`
- `superseded`

The status in the private `handoff-ledger.json` is canonical. Pull request labels or comments
are views of that state, not a competing source of truth.

## Agent review rules

Claude Code must stop and return the decision to ChatGPT or the user when the task changes
business strategy, publishing cadence, monetization, privacy posture, or external behavior.

Codex reviews evidence, not completion claims. A review checks:

- whether the diff satisfies the acceptance criteria;
- whether unrelated behavior changed;
- whether tests cover the material risk;
- whether public and private data stayed in the correct repository;
- whether the next owner and unresolved decisions are explicit.

## Triggering work

GitHub stores and transports the state; it does not wake Claude Code by itself. Recurring
polling, when enabled, belongs to the existing Claude Code scheduled-task layer. The poller
may fetch and report new private handoffs, but it must not merge, publish, send external
messages, or change monetization without the existing approval rules.

## Failure recovery

- If an agent stops, the next agent resumes from the private ledger and the open pull request.
- If the branch and ledger disagree, treat the ledger as task state and Git history as code state.
- If two agents edit the same file, pause automation and resolve the conflict in one pull request.
- Never recreate raw daily publication records outside the existing scheduled-task record.
