# SESSION PROTOCOL

> **IMPORTANT: Follow this protocol at the start of EVERY conversation and after /clear**

## On Session Start

1. **State is auto-loaded** via SessionStart hook (`.state/state.json` + `.state/handoffs.json`; legacy `.claude/...` still loads during migration)

2. **Brief summary** (don't force handoff engagement):

   ```
   "Last session: [X]. [N] backlog items.
   [If handoffs exist: '1 active handoff: auth-system (Phase 2/3)']
   What would you like to work on?"
   ```

3. **Let user drive** — they might:
   - Say "continue auth" → pick up the handoff
   - Say "start the server" → do that, handoff stays pending
   - Say "what's the handoff about?" → explain it
   - Say anything else → do that

**Don't ask "Continue?" about handoffs** — just mention they exist. User decides.

## Resuming Handoffs

When user runs `/handoff --continue` or says "continue" and there's an active handoff:

1. **Read the handoff file** (`.state/handoffs/{id}.md`) for goal, phases, and learnings
2. **Check `lastTouched`** — if recent, warn about possible session conflict
3. **Update `handoffs.json`** as you complete phases (set `status: "complete"`, add `learnings`)
4. **Capture insights** — what worked, what didn't, for future sessions

**Principles:**

- **Context first** — review prior learnings before acting
- **No rushing** — thoroughness over speed
- **Validate before marking complete** — concrete evidence must exist
- **Clean handoffs** — if context runs low, update notes so next session continues seamlessly

**Parallel sessions:** Multiple handoffs = multiple sessions OK. Same handoff = one session only.

## Commands Available

- `/commit` - Commit changes (clean, no AI mentions)
- `/push` - Push + update local state + clean up completed handoffs
- `/backlog` - Review and manage backlog items
- `/handoff` - Create handoff (`--continue` to resume active one)

## Rules

- Only USER sets `currentFocus` - never assume or change it
- Add discoveries to backlog during `/push`, not randomly
- Keep backlog clean - resolve items when addressed
- **Never commit on your own** - wait for user to run `/commit`
- **Handoffs**: Update `handoffs.json` progress after completing phases

---

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **kclub-mvp** (5180 symbols, 12022 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/kclub-mvp/context` | Codebase overview, check index freshness |
| `gitnexus://repo/kclub-mvp/clusters` | All functional areas |
| `gitnexus://repo/kclub-mvp/processes` | All execution flows |
| `gitnexus://repo/kclub-mvp/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
