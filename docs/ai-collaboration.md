# Claude Code and Codex collaboration

## Goal

Claude Code and Codex collaborate through Git and GitHub instead of copying chat messages
between tools. The shared state is explicit, reviewable, and recoverable.

## Repository model

| Repository | Visibility | Canonical contents |
| --- | --- | --- |
| `fire-blog` | Public | Production site, public assets, tests, public-safe implementation docs |
| `sidework-orchestrator` | Private, local only (no GitHub remote) | Canonical business and operational state: task queue, workflow state, decisions, full agent results, and ledger |
| `sidework-ai-handoffs` | Private (GitHub) | Minimal cross-agent projection only: handoff ID, status, owner, PR/commit reference, and next action |

Do not create a second strategy store inside `fire-blog`. Business and operational state stays
in `sidework-orchestrator`, which intentionally has no GitHub remote — never connect it to a
remote or duplicate its contents elsewhere. Minimal cross-agent handoff metadata may be
projected to the separate private `sidework-ai-handoffs` repository, but that projection is
not a second task-state authority. A handoff may point to `sidework-orchestrator` by name or
handoff ID only, never by pasting its paths or file contents.

`Implementation owner` identifies the single agent accountable for the change and remains
stable for that change. `Next owner` identifies the actor responsible for the current
workflow step and changes as work moves from implementation to review to approval.

## Operating loop

1. ChatGPT records a prioritized request in the local `sidework-orchestrator` task queue;
   only minimal coordination metadata may be projected to `sidework-ai-handoffs`.
2. Claude Code reads the request, checks `sidework-orchestrator` state as needed, and
   implements it on a branch in `fire-blog`.
3. Claude Code opens a draft pull request in `fire-blog` using the shared template.
4. Claude Code comments `@codex review` on the pull request. Codex reviews the diff,
   checks, risks, and alignment with the source request using `AGENTS.md`.
5. Claude Code addresses actionable review comments and updates the same pull request.
6. The user makes the final merge or publishing decision.
7. Claude Code records the full result, decision, and next action in `sidework-orchestrator`.
   A minimal result projection may then update `sidework-ai-handoffs`, without duplicating
   raw logs, local paths, or other `sidework-orchestrator` contents.

For the first run, enable Codex code review for this repository in Codex settings. Automatic
reviews can replace the explicit `@codex review` comment after the workflow is stable.

For local continuity, the ChatGPT desktop app can import Claude Code projects and supported
setup. Importing does not replace the local canonical ledger or its minimal private
projection; it only makes the same local project folders and recent context available.

## Handoff status

Use one stable handoff ID such as `H-20260803-001` across the private request, branch,
pull request, result, and review. Valid states are:

- `proposed`
- `accepted`
- `in_progress`
- `needs_decision`
- `completed`
- `superseded`

The status in the local `sidework-orchestrator` ledger is canonical. The private
`sidework-ai-handoffs` ledger and pull request labels or comments are transport views of
that state, not competing sources of truth. On disagreement, stop and repair the projection
from the local canonical record; do not overwrite local state from the projection.

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
may fetch and report new entries in `sidework-ai-handoffs`, but it must not merge, publish,
send external messages, or change monetization without the existing approval rules.

## Failure recovery

- If an agent stops, the next agent resumes from the canonical local handoff ID and the open
  pull request; `sidework-ai-handoffs` supplies only the minimal locator metadata.
- If the branch and ledger disagree, treat the local orchestrator ledger as task state and
  Git history as code state.
- If two agents edit the same file, pause automation and resolve the conflict in one pull request.
- Never recreate raw daily publication records outside the existing scheduled-task record.
