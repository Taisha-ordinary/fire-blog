# AI collaboration rules

These rules apply to Codex and other coding agents working in this repository.

## Read first

1. Read `CLAUDE.md`.
2. Read `docs/ai-collaboration.md`.
3. Inspect the current branch, working tree, and relevant files before changing anything.

## Repository boundary

This is the public production repository for FIRE Notes. Keep only public site code,
public assets, tests, and public-safe engineering documentation here.

Never commit private business metrics, revenue, unpublished strategy, personal data,
credentials, API keys, tokens, analytics exports, or raw AI discussions. Those belong
in the private `sidework-orchestrator` repository.

## Roles

- The user is the final decision-maker and approves material product or publishing changes.
- ChatGPT owns strategy, priorities, and stop/go decisions.
- Claude Code owns recurring execution and the existing publication workflow.
- Codex owns implementation, technical audits, tests, and independent review.

## Change workflow

- Pull the latest default branch before starting.
- Use a dedicated branch. Do not commit directly to `main`.
- Do not alter scheduled publishing, analytics, monetization, or external posting unless
  the task explicitly authorizes it.
- Keep each pull request focused on one handoff.
- Run the relevant checks and record the exact commands and outcomes in the pull request.
- Open a draft pull request whenever a decision or review is still required.
- Never merge or publish merely because an AI agent marked the work complete.

## Handoff contract

Every pull request exchanged between Claude Code and Codex must include:

1. Handoff ID
2. Objective
3. Source decision or request
4. Files changed
5. Checks run and results
6. Risks or assumptions
7. Open decisions
8. Next owner: `claude-code`, `codex`, `chatgpt`, or `human`

Use `.github/pull_request_template.md`. Review discussion stays on the pull request;
private strategy and KPI context stays in `sidework-orchestrator`.

## Code Review Rules

- Flag any credential, personal data, private KPI, revenue data, or unpublished strategy
  added to this public repository. The safe path is to keep it in `sidework-orchestrator`
  and reference only a handoff ID.
- Flag changes to scheduled publishing, analytics, monetization, or external posting when
  the source handoff does not explicitly authorize that behavior.
- Flag diffs that do not satisfy the stated acceptance criteria or include unrelated
  product behavior. The safe path is one focused handoff per pull request.
- Require evidence for material behavior changes: relevant tests or a clear manual check
  with the exact command and outcome.
