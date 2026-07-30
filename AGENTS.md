# Repository Agent Instructions

## Canonical fitness-coaching context

The canonical living coaching document is [`docs/FITNESS_COACHING_CONTEXT.md`](docs/FITNESS_COACHING_CONTEXT.md).

Before performing fitness coaching, changing coaching-related product behavior, interpreting wellness data, or writing owner data:

1. Read the canonical coaching document.
2. Read [`docs/COACH_AGENT_HANDOFF.md`](docs/COACH_AGENT_HANDOFF.md) for the current Sian OS API, Cloudflare, privacy, and data-safety contract.
3. Treat Hevy as the workout source of truth and Sian OS as the wellness source of truth unless the owner explicitly reverses that decision.

Whenever the owner and coach agree to any new or changed goal, rule, target, schedule, exception, training plan, nutrition approach, reporting format, platform choice, source of truth, or coaching workflow:

1. Update the relevant active section of `docs/FITNESS_COACHING_CONTEXT.md` in the same work session.
2. Add a dated entry to that document's decision log.
3. Remove or clearly mark superseded active guidance so the document contains no unresolved contradiction.
4. Record only confirmed decisions. Label proposals and open questions as such.

Do not put daily operational data into the living document when it belongs in Sian OS or Hevy. Do not put passwords, API keys, tokens, session cookies, private credentials, or fabricated/assumed health data in any repository file.

For Sian OS writes:

- read current state first;
- write only owner-confirmed data;
- prefer the validated application API for routine entries;
- re-read after writing;
- obtain explicit owner approval before destructive changes;
- back up before approved direct database repair.

