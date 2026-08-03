# Claude Code and Codex collaboration

## Goal

Claude Code and Codex collaborate through Git and GitHub instead of copying chat messages
between tools. The shared state is explicit, reviewable, and recoverable.

## Repository model

| Repository | Visibility | Canonical contents |
| --- | --- | --- |
| `fire-blog` | Public | Production site, public assets, tests, public-safe implementation docs |
| `sidework-orchestrator` | Private, local only (no GitHub remote) | Business/operational state: job queue (`queue/`), run artifacts (`runs/`), automation config (`config/`), human approvals (`approvals/`), audit logs (`logs/`) |
| `sidework-ai-handoffs` | Private (GitHub) | Cross-agent handoff coordination only: `handoff-ledger.json`, `handoffs/requests/`, `handoffs/results/` |

Do not create a second strategy store inside `fire-blog`. Business and operational state stays
in `sidework-orchestrator`, which intentionally has no GitHub remote — never connect it to a
remote or duplicate its contents elsewhere. Cross-agent handoff coordination (handoff ID,
status, PR/commit references, short result summaries) lives in the separate private
`sidework-ai-handoffs` repository. A handoff may point to `sidework-orchestrator` by name or
handoff ID only, never by pasting its file contents.

## Operating loop

1. ChatGPT records a prioritized request in `sidework-ai-handoffs` (`handoffs/requests/`).
2. Claude Code reads the request, checks `sidework-orchestrator` state as needed, and
   implements it on a branch in `fire-blog`.
3. Claude Code opens a draft pull request in `fire-blog` using the shared template.
4. Claude Code comments `@codex review` on the pull request. Codex reviews the diff,
   checks, risks, and alignment with the source request using `AGENTS.md`.
5. Claude Code addresses actionable review comments and updates the same pull request.
6. The user makes the final merge or publishing decision.
7. Claude Code records the result in `sidework-ai-handoffs` (`handoffs/results/`), without
   duplicating raw logs or `sidework-orchestrator` contents.

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

The status in `handoff-ledger.json` in the private `sidework-ai-handoffs` repository is
canonical. Pull request labels or comments are views of that state, not a competing source
of truth.

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

- If an agent stops, the next agent resumes from `sidework-ai-handoffs` and the open pull
  request.
- If the branch and ledger disagree, treat the ledger as task state and Git history as code state.
- If two agents edit the same file, pause automation and resolve the conflict in one pull request.
- Never recreate raw daily publication records outside the existing scheduled-task record.
