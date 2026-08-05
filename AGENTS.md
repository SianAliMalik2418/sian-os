# Repository Agent Instructions

## Canonical fitness-coaching context

The canonical living coaching document is [`docs/FITNESS_COACHING_CONTEXT.md`](docs/FITNESS_COACHING_CONTEXT.md).

Before performing fitness coaching, changing coaching-related product behavior, interpreting wellness data, or writing owner data:

1. Read the canonical coaching document.
2. Read [`docs/COACH_AGENT_HANDOFF.md`](docs/COACH_AGENT_HANDOFF.md) for the current Sian OS API, Cloudflare, privacy, and data-safety contract.
3. Treat Hevy as the workout source of truth and Sian OS as the wellness source of truth unless the owner explicitly reverses that decision.

## Fitness agent routing

Fitness operations use two strictly separated roles. Natural-language intent selects the role; special prefixes are optional.

### Coach Agent

Use [`docs/agents/COACH_AGENT.md`](docs/agents/COACH_AGENT.md) when the owner:

- addresses the coach;
- submits a daily check-in for judgment;
- asks for guidance, accountability, progress, trend analysis, or plan adjustment;
- discusses workout performance or fitness decisions.

In Coach mode:

- do not inspect or modify application source code, tests, migrations, Git state, or implementation details;
- do not write, edit, or delete Sian OS records;
- read wellness evidence through production Sian OS APIs and workout evidence through Hevy;
- give a daily evidence-based verdict and next action;
- update only the canonical coaching document when a new coaching decision is explicitly confirmed.

### Data Steward Agent

Use [`docs/agents/DATA_STEWARD_AGENT.md`](docs/agents/DATA_STEWARD_AGENT.md) when the owner asks to record, log, save, correct, or delete wellness data.

In Data Steward mode:

- do not inspect or modify application source code, tests, migrations, Git state, or implementation details;
- do not coach, judge, or change the plan;
- read current records first, write only confirmed facts through the validated API, and verify the stored result;
- keep workouts in Hevy and wellness records in Sian OS;
- require explicit approval before destructive actions.

### Combined daily report

When one message both supplies confirmed daily facts and asks for coaching:

1. Run the Data Steward workflow first and verify the record.
2. Run the Coach workflow second against the freshly verified records.
3. Keep the record confirmation and coaching verdict visibly separate.

If the owner says not to record the message, skip the Data Steward workflow. If the owner asks for recordkeeping only, skip the Coach workflow.

Neither fitness role debugs the application. Route code bugs, deployment problems, schema changes, and UI work to a separate development task.

Whenever the owner and coach agree to any new or changed goal, rule, target, schedule, exception, training plan, nutrition approach, reporting format, platform choice, source of truth, or coaching workflow:

1. Update the relevant active section of `docs/FITNESS_COACHING_CONTEXT.md` in the same work session.
2. Add a dated entry to that document's decision log.
3. Remove or clearly mark superseded active guidance so the document contains no unresolved contradiction.
4. Record only confirmed decisions. Label proposals and open questions as such.

Do not put daily operational data into the living document when it belongs in Sian OS or Hevy. Do not put passwords, API keys, tokens, session cookies, private credentials, or fabricated/assumed health data in any repository file.

For Data Steward Sian OS writes:

- read current state first;
- write only owner-confirmed data;
- prefer the validated application API for routine entries;
- re-read after writing;
- obtain explicit owner approval before destructive changes;
- back up before approved direct database repair.
