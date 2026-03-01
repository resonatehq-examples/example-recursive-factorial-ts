---
name: skill-creation
description: Create new Resonate coding-agent skills from docs into agent-executable playbooks with steps, code patterns, verification, and guardrails.
---

# Skill Creation

## Overview

Author new coding-agent skills for Resonate that are clear, repeatable, and testable, producing a focused `skill.md` and minimal supporting assets.

## Purpose

This skill teaches an agent how to **author new coding-agent skills** for Resonate. A "skill" is a small, focused, repeatable playbook that lets an agent reliably implement a specific Resonate task (e.g., "Create a durable workflow", "Add a promise + poller", "Build an API endpoint that triggers a workflow").

The output of this skill is:

1. a new `skill.md` for the target capability, and
2. any supporting templates/snippets that the skill references.

## When to use

Use this skill when you need to convert Resonate documentation (or internal docs) into an **agent-executable implementation recipe**.

Examples:

- “Make a skill for building a Resonate Python workflow with retries and idempotency.”
- “Make a skill for wiring the CLI to register workflows and run a worker.”
- “Make a skill for ‘promise -> callback -> workflow continuation’ patterns.”
- “Make a skill for testing deterministic workflows.”

## Definition: What a "skill file" is

A skill file is a **single, self-contained markdown playbook** that:

- clearly defines the capability (“what the agent should do”),
- specifies _inputs/outputs_,
- provides an opinionated, step-by-step workflow,
- includes code patterns/snippets,
- includes verification steps (tests / commands / expected outputs),
- lists pitfalls + guardrails (what not to do),
- and is robust enough that a different agent can follow it without guessing.

Skills should be:

- **narrow** (one capability),
- **repeatable** (same steps work across projects),
- **testable** (has verification commands and acceptance criteria),
- **Resonate-correct** (uses official patterns and APIs).

---

# Inputs (to this authoring process)

The agent should gather:

1. **Target skill name**
   - Short verb phrase, e.g. “Implement a durable workflow (Python)”
2. **Target language/runtime**
   - e.g. Python, TypeScript/Node, Go
3. **Docs source(s)**
   - URLs, repo docs, READMEs, API reference, examples
4. **Constraints**
   - project layout assumptions, existing repo patterns, required versions
5. **Example goal**
   - one concrete example scenario (helps anchor the steps)

If any input is missing, make best reasonable assumptions and document them explicitly in the skill.

---

# Outputs (what you must produce)

You must produce:

## A) A new skill markdown file

Path suggestion:

- `skills/<area>/<skill-slug>/skill.md`

Where:

- `<area>` is like `python`, `typescript`, `server`, `patterns`, `testing`
- `<skill-slug>` is kebab-case, e.g. `durable-workflow-python`

## B) Optional supporting assets

Only if they materially help execution:

- code templates (small),
- example files,
- test scripts,
- command snippets.

Avoid large boilerplate. Keep it minimal and composable.

---

# Authoring workflow (do this every time)

## Step 1: Identify the “atomic capability”

Write a 1–2 sentence scope statement:

- “This skill enables an agent to **_ using Resonate _**.”
- List 3–6 non-goals (“this skill does NOT cover …”).

A skill should not require multiple major decisions.

## Step 2: Extract the canonical path from docs

From docs/examples, determine:

- the “happy path” API flow,
- required primitives (workflow, promise, task, scheduler, poller, etc.),
- lifecycle steps (register, run worker, trigger, observe),
- error/retry/idempotency guidance.

If docs show multiple options, choose one as the default and mention alternatives briefly.

## Step 3: Write the skill using the standard structure

Use the template in **“Skill Template”** below.

## Step 4: Add “acceptance criteria”

Every skill must have:

- at least 3 concrete checks an agent can run,
- expected outputs or behavior,
- a definition of “done”.

## Step 5: Add guardrails + pitfalls

Include:

- common failure modes,
- anti-patterns,
- “if you see X, do Y” troubleshooting.

## Step 6: Validate the skill is agent-executable

Before finalizing, verify:

- no missing steps,
- commands are copy/pastable,
- code blocks are complete enough to adapt,
- terminology matches Resonate docs.

---

# Skill quality checklist (must pass)

A skill is “good” if it satisfies:

- **Clarity:** A different agent can follow it start-to-finish with minimal guessing.
- **Atomicity:** One main capability; no hidden second project.
- **Correctness:** Uses Resonate APIs/patterns as documented.
- **Verification:** Has commands/tests and expected results.
- **Safety:** Avoids destructive commands by default; includes warnings when needed.
- **Portability:** Avoids hardcoding repo-specific paths unless stated.
- **Maintenance:** Mentions version assumptions or “as of” notes if relevant.

---

# Skill Template (copy this for every new skill)

Use this exact outline unless you have a strong reason not to.

## Title

Skill: <verb phrase> (<language/runtime>)

## Summary

- What it does (1–3 sentences)
- When to use
- What it outputs

## Preconditions / Assumptions

- Runtime versions (if known)
- Repo layout assumptions
- Required tools (CLI, SDK, docker, etc.)

## Inputs

- List required inputs (names, paths, config values, endpoints)

## Outputs

- Files created/modified
- Services started
- New commands available

## Core concepts (minimal)

- 3–8 bullet points that define only what’s necessary
- Link terminology to your docs naming

## Procedure

Provide numbered steps with headings.
Each step should include:

- intent (“why we do this” in 1 short line),
- command(s),
- code snippet(s),
- expected outcome.

Recommended structure:

1. Create/update project scaffolding
2. Add Resonate dependency + config
3. Implement core Resonate primitive(s)
4. Register/launch worker/runtime
5. Trigger the behavior
6. Observe outputs and handle failures

## Code patterns

Include small “known-good” snippets:

- workflow skeleton
- handler skeleton
- promise/task usage
- retries/idempotency pattern (if applicable)

## Verification

Provide at least 3 checks:

- unit test / deterministic test
- local run command
- log line / API output / state verification

## Troubleshooting

- Symptom → likely cause → fix
- Include “smoke checklist” if it helps

## Pitfalls / Anti-patterns

- concise bullets

## Extensions (optional)

- “If you need X, extend by doing Y”
- link to related skills

---

# Conventions for Resonate skill writing

## Code block rules

- Prefer complete functions/modules over fragments.
- Every snippet should compile with minimal wiring.
- Avoid placeholder names that hide meaning (“foo”, “bar”); use domain names.

## Command rules

- Use safe defaults.
- If a command is destructive (rm, drop db, etc.), add a warning line above it.
- Show expected output patterns (log lines, exit codes).

## Versioning

If the docs are versioned:

- note the version tested against.
  If unknown:
- add a line “Assumes a recent stable Resonate SDK and server.”

## Determinism + durable execution

When relevant, call out:

- idempotency requirements,
- how retries behave,
- what state is persisted,
- how to replay/test deterministically (if applicable in your stack).

---

# Example: Mini skill skeleton (authoring output illustration)

Below is a tiny illustration of what a finished skill might look like. Do not reuse verbatim—write a real one per topic.

- Skill: Implement a durable workflow (Python)
- Inputs: workflow name, handler fn, queue/worker config
- Outputs: `workflows.py`, `worker.py`, `tests/test_workflow.py`
- Verification: run worker, trigger workflow, assert deterministic replay

---

# What to do next

When asked to create a new skill:

1. Create a directory for it
2. Write `skill.md` using the template
3. Add minimal code snippets
4. Add verification commands
5. Ensure it passes the quality checklist

End.
