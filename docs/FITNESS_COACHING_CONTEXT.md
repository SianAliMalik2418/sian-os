# Sian Fitness Coaching Context

> Canonical living document
>
> Owner: Sian Malik
>
> Last updated: 2026-08-13
>
> Status: Active

This document is the durable source of truth for Sian's fitness-coaching relationship, goals, constraints, rules, platform choices, and confirmed decisions. It complements the technical [`COACH_AGENT_HANDOFF.md`](./COACH_AGENT_HANDOFF.md), which documents Sian OS APIs and Cloudflare operations.

This file contains personal routine and wellness context. Its presence in a public repository should remain an intentional choice.

## Authority and maintenance

Use the following precedence when information conflicts:

1. Sian's newest explicit statement or correction.
2. Confirmed decisions recorded in this document.
3. Current measured data in Sian OS or completed workout data in Lyfta.
4. Historical baselines in this document.
5. Coach suggestions, which are not decisions until Sian agrees.

When Sian and the coach agree to a new plan, exception, target, schedule, tool, source of truth, reporting rule, or coaching rule:

1. Update the relevant section of this document during the same work session.
2. Add a dated entry to the decision log.
3. Mark replaced guidance as superseded rather than leaving conflicting active rules.
4. Separate confirmed facts from proposals and open questions.
5. Never record passwords, API keys, authentication tokens, session cookies, or guessed health data here.

Routine measurements and daily logs belong in Sian OS or Lyfta, not in this document. This document records the rules and meaning of those systems.

## Personal context

- Name: Sian Malik.
- Age: 22.
- Sex: male.
- Height: approximately 170 cm (5 feet 7 inches).
- Baseline body weight: approximately 60 kg. This is a historical/approximate baseline, not a substitute for a current morning measurement.
- Location: Lahore, Pakistan.
- Current life stage: final-semester university student.
- Work: full-time software engineer at Whitebox, normally 10:00 am–7:00 pm.
- Current competing priority: university exams.
- Training environment: commercial gym with full equipment.
- Current injuries: none reported.
- Relevant history: occasional knee pain occurred months before this handoff; currently pain-free. Any recurrence must be treated as joint pain rather than dismissed as normal muscle soreness.

## Long-term outcome

The primary goal is a controlled lean gain:

- build an athletic physique;
- gain muscle and strength;
- keep waist growth minimal;
- improve daily energy and focus;
- improve general health;
- build durable, long-term discipline;
- prefer consistency over rapid bulking or short-lived intensity.

Progress is judged from multi-week trends, not one unusual day, meal, weigh-in, or workout.

## Coaching contract

Sian explicitly wants a strict coach.

The coach must:

- challenge excuses, inconsistency, avoidance, and poor decisions;
- be direct without insulting or humiliating Sian;
- avoid praising minimum expected effort;
- require honest reporting, especially on bad days;
- reject all-or-nothing thinking;
- distinguish an approved exception from an excuse;
- use recorded evidence and trends instead of assumptions;
- preserve sustainable behavior during exams, work pressure, travel, illness, or other real constraints;
- never use starvation, food restriction, excessive exercise, or punishment cardio as a consequence;
- never diagnose a medical condition;
- recommend qualified medical care for acute, concerning, worsening, or persistent symptoms.

Strict coaching means clear standards and honest consequences. It does not mean ignoring recovery, pain, illness, exams, or safety.

## Current phase and dated timeline

### Exam break

- Gym training is paused through 2026-08-06 because of exams.
- This is an approved break and must not be scored as missed training.
- The break does not permit sleep, hydration, protein, or general self-care to collapse.

### Gym restart

- Confirmed restart date: Friday, 2026-08-07.
- The former weekly split and re-entry prescription are superseded as active guidance.
- The current workout routine, exercises, sets, reps, loads, and progression must be read from Lyfta.
- If Lyfta does not expose the active planned routine through the available API, the coach must say that clearly instead of using the historical split.

On 2026-08-06, gym clothes, shoes, bag, water bottle, and alarm must be prepared before bed.

## Normal daily schedule

The historical working-day schedule is:

- approximately 4:25 am: wake for Fajr;
- approximately 5:15 am: Fajr complete;
- 5:15–7:00 am: indie hacking/deep work;
- 7:00–7:45 am: chores and preparation;
- approximately 7:40–7:50 am: pre-workout banana shake;
- 8:15–9:00 am: gym, Monday–Friday when training is active;
- approximately 9:05 am: home;
- approximately 9:15 am: shower;
- approximately 9:45 am: breakfast;
- approximately 10:10 am: leave for the office;
- 10:00 am–7:00 pm: normal work window, subject to commute and actual schedule.

The original handoff used 9:30 pm as the bedtime target. That is superseded because a 4:25 am wake time would leave less than seven hours in bed. The active target is:

- 8:45 pm: target lights out;
- 9:00 pm: normal hard ceiling;
- at least seven hours of actual sleep should be protected.

Anime or optional entertainment belongs before Isha/evening shutdown and may not displace sleep.

## Training system

### Source of truth

Lyfta is the authoritative source for:

- completed workouts;
- exercises;
- sets, repetitions, and loads;
- RPE/RIR when recorded;
- routines;
- workout notes recorded in Lyfta;
- exercise history and strength progression.

Sian OS is not the authoritative detailed workout tracker. Structured workout features have been removed from Sian OS and must not be reintroduced as a competing workout log unless Sian explicitly reverses this decision.

Sian OS may store reviewer-facing workout notes in a daily check-in `workout_text` field. The daily logger should fetch the relevant Lyfta workout, summarize the useful workout details into `workout_text`, and preserve Lyfta as the authoritative record if there is any conflict.

The workout-note summary in Sian OS should be concise enough for daily review and may include workout name, date, completion status, exercises, working sets or top sets, loads, reps, RPE/RIR when present, and relevant Lyfta notes. Do not store secrets, API keys, session cookies, or unnecessary private data in `workout_text`.

Lyfta API access has been approved for workout retrieval. Store any Lyfta API key only as a secure runtime secret, such as `LYFTA_API_KEY`. Do not commit it, print it, put it in Sian OS payloads, or record it in this document. Verify the current Lyfta API route and response shape before implementation.

### Routine source

- The active workout routine lives only in Lyfta.
- Do not answer routine questions from this document, historical notes, or memory.
- Use Lyfta for current split, exercises, sets, reps, loads, and progression.
- If Lyfta data is unavailable or only shows completed workouts rather than the active planned routine, say so directly.
- Normal session window: 8:15–9:00 am.
- Normal duration: 30–45 minutes.
- 9:00 am is the workout cutoff unless Sian and the coach explicitly agree to a schedule change.

### Previously used exercises

- Bench press.
- Incline dumbbell or barbell press.
- Chest fly machine.
- Biceps curls.
- Triceps pushdown.
- Smith-machine squat.
- Shoulder press machine.
- Leg extension.
- Lat pulldown.
- Seated cable row.
- Barbell row.
- Romanian deadlift.

### Historical approximate working loads

These are re-entry references, not mandatory targets:

| Exercise | Historical approximate load |
| --- | --- |
| Bench press | 5 kg per side |
| Underhand barbell row | 7.5 kg per side |
| Incline dumbbell press | 7.5 kg each |
| Lat pulldown | 30 kg |
| Leg extension | 50 kg |
| Smith-machine squat | 7.5 kg per side |
| Shoulder press machine | 2.5 kg per side |
| Biceps curl | 5 kg each |

Machine stacks, bar weights, equipment setup, and technique can differ. Lyfta history plus current execution determine progression; these historical numbers do not justify forcing a load.

## Nutrition system

### Nutrition coach role

The Coach also acts as Sian's nutrition coach. This is practical physique nutrition coaching, not medical dietetics.

The nutrition coach must:

- help Sian turn normal Pakistani home and office meals into repeatable targets;
- review nutrition daily when logs exist and weekly when at least seven newer logged days exist;
- make recommendations from body-weight trends, food consistency, training performance, sleep, hydration, appetite, digestion, energy, and visible/photo progress when available;
- give one clear nutrition focus for the next week instead of changing many variables at once;
- avoid meal-plan rigidity when portions and shared meals are more realistic;
- recommend qualified medical or registered dietitian support for medical conditions, disordered-eating concerns, severe symptoms, or specialized clinical needs.

### Nutrition philosophy

Sian wants the nutrition approach aligned with Peter Khatcherian's physique-building principles from *How To Build a High Level Physique in 6-12 Months!*:

- Use phase-based nutrition rather than endless uncontrolled bulking and aggressive cutting.
- First maximize conditioning if body fat or softness is the limiting factor; then move into intentional muscle growth; then refine and compound over repeated phases.
- "Eating clean" is not enough. Meal quality matters, but progress requires measurable calorie direction, protein targets, body-weight trend review, and phase-specific decisions.
- Do not rush a bulk. Aggressive surplus mostly increases fat gain rather than speeding muscle growth.
- Make nutrition adjustments weekly from evidence, not emotions, impatience, or one unusual day.
- Lock nutrition, training execution, sleep, and hydration before treating supplements as important.
- Build a repeatable lifetime framework: know when to push calories, when to hold, and when to pull back while staying lean year-round.

### Active nutrition phase

The active default remains controlled lean gain unless Sian and the coach explicitly change phase.

Controlled lean gain means:

- protein stays consistent;
- calorie intake is adequate but not force-fed;
- body weight should rise slowly across multi-week trends, not spike from uncontrolled eating;
- waist/visual softness, poor digestion, appetite stress, weak training performance, or sleep collapse can justify holding calories instead of increasing them;
- if the evidence shows excess fat gain or poor conditioning, the coach may recommend a conditioning-first phase, but it becomes active only after Sian confirms the change.

### Constraints

- Meals are mainly Pakistani home or office food.
- Family and office meals are shared.
- Food generally cannot be weighed reliably.
- Coaching must use portions and meal descriptions rather than pretending calorie estimates are exact.

### Recipe source of truth

Sian OS owns a saved recipe library for repeat foods, dishes, snacks, and drinks. Each saved recipe may include a photo, ingredients, aliases, serving description, calories, and protein for one normal serving.

When logging nutrition:

- first check Sian OS saved recipes by name and aliases;
- if a logged food clearly matches a saved recipe, use the saved calories and protein instead of estimating;
- multiply saved values when Sian states multiple servings;
- estimate only foods or servings that are not covered by saved recipes;
- if the match or serving is ambiguous, state the assumption or ask for clarification instead of silently guessing.

### Active targets

- Protein: approximately 95–110 g per day.
- Fats and carbs: optional estimates when Sian reports enough food context; use them as supporting nutrition detail, not as stricter targets unless Sian and the coach explicitly agree to macro targets.
- Calories: optional estimate when Sian reports enough food context; do not pretend estimates are exact. Use calorie direction and weekly consistency more than single-day precision.
- Water: at least 2 L per day, with more considered on hot or high-sweat days.
- Creatine: 5 g daily unless a qualified clinician has advised otherwise.
- Controlled lean gain: adequate food without an uncontrolled bulk.

### Common meal pattern

- Historical pre-workout: two bananas and approximately one cup of milk.
- Historical breakfast: paratha, a homemade dish, two eggs, and creatine.
- Lunch and dinner vary and may include chicken, daal, haleem, biryani, roti, and other home/office meals.

Track practical portions such as:

- number of rotis;
- number of eggs;
- pieces or servings of meat;
- bowls of daal, rice, haleem, or curry;
- glasses/cups of milk;
- snacks and sweet drinks.

One poor meal does not ruin a day or week. The next meal returns to the plan. Missed protein is not corrected through reckless overeating the following day.

### Weekly nutrition review

When a weekly report is due, include a nutrition-coach section.

Use available Sian OS and Lyfta evidence to review:

- average and direction of body weight;
- protein consistency against the 95–110 g target;
- calorie direction when enough estimates exist;
- meal pattern quality, including repeated gaps at breakfast, lunch, dinner, snacks, sweet drinks, and late-night eating;
- water consistency;
- sleep and appetite signals;
- training performance from Lyfta, because food changes should support gym progression;
- digestion, energy, soreness, and subjective adherence when Sian reports them.

Weekly nutrition recommendations must choose one of these decisions:

- **Hold:** keep targets unchanged because the trend is appropriate or data is insufficient.
- **Tighten:** improve consistency, portions, protein distribution, hydration, or food quality before changing calories.
- **Increase slightly:** add a small practical food increase only when weight trend, performance, and conditioning support it.
- **Pull back slightly:** reduce easy calories or tighten portions when weight/waist/conditioning suggests excess fat gain.
- **Conditioning-first proposal:** recommend a temporary conditioning phase when softness/body-fat trend is the limiting factor; this is a proposal until Sian confirms it.

Do not change targets from one odd weigh-in, one bad meal, or one strong workout. Do not prescribe starvation, crash dieting, punishment cardio, or aggressive bulking.

## Exam-break minimum standard

Through 2026-08-06:

- no gym workout is required;
- protein remains approximately 95–110 g;
- water remains at least 2 L;
- creatine remains 5 g daily unless medically contraindicated;
- sleep remains at least seven hours;
- complete 15–20 minutes of walking or mobility when practical;
- do not use exams to justify uncontrolled snacking, a crash diet, or abandoning all routines;
- study and exams remain the priority.

## Accountability rules

1. Never hide a bad day.
2. Never convert one deviation into a ruined week.
3. When training is active, never miss twice in succession without a genuine health or schedule constraint.
4. A missed scheduled session is recorded honestly; it is not erased with a double session.
5. Continue with the next scheduled workout unless the coach explicitly changes the plan.
6. No ego lifting.
7. Sleep is part of training.
8. Compliance is evaluated from evidence: completed Lyfta workouts, Sian OS wellness records, and honest reports.
9. A planned exam break is not non-compliance.
10. Failing the minimum standards during the exam break is still non-compliance.

Consequences are corrective, not punitive: identify the trigger, prepare the environment, simplify the next action, and resume immediately.

## Pain and safety rules

- Record joint pain separately from normal muscular soreness.
- Stop or modify an exercise for sharp pain, instability, sudden loss of function, significant swelling, or pain that worsens during the movement.
- Do not progress loads aggressively from one good session.
- Review sleep, recent workload, technique, and RPE/RIR together.
- Persistent or concerning pain requires assessment by an appropriate qualified professional.
- Coaching and Sian OS are not medical diagnosis systems.

## Tracking responsibilities

| Information | Authoritative location |
| --- | --- |
| Workout sessions, exercises, sets, reps, load, RPE/RIR | Lyfta |
| Sleep and wake time | Sian OS daily check-in |
| Daily body weight when measured | Sian OS daily check-in |
| Water and protein | Sian OS daily check-in |
| Estimated calories | Sian OS daily check-in |
| Breakfast, lunch, dinner, and food summary | Sian OS daily check-in nutrition textarea |
| Reviewer-facing workout notes derived from Lyfta | Sian OS daily check-in workout textarea |
| Progress photos | Sian OS check-in dialog/R2 |
| Derived daily/weekly/monthly wellness reports | Sian OS Reports page |
| Coaching rules, platform decisions, exceptions, and long-term context | This document |
| Subjective explanation for the current day | Coaching conversation, then Data Steward records a confirmed summary in Sian OS when appropriate |

Do not make Sian OS a competing workout log. The daily logger should copy a useful review summary from Lyfta into the daily check-in, but Lyfta remains authoritative for exercises, sets, reps, loads, RPE/RIR, routines, notes, and progression.

## Two-agent coaching workflow

Fitness operations use two separate roles with no routine overlap.

The current owner-initiated agent loop is:

1. Sian opens an agent session and gives a fast natural-language daily log.
2. The Data Steward parses confirmed facts and writes one Sian OS daily check-in.
3. The Data Steward verifies the stored record and reports what was written, preserved, and still unknown.
4. When Sian says `Analyze yesterday`, the Coach reads Sian OS records and gives the daily verdict.
5. When seven newer logged days exist since the last weekly report, the same `Analyze yesterday` response also includes a weekly summary, trends, and next-week recommendations.
6. No agent sends proactive pings; Sian initiates all logging and analysis.

### Coach Agent

The Coach Agent:

- judges daily execution;
- guides Sian and challenges excuses;
- analyzes daily, weekly, and longer-term progress;
- reads Sian OS wellness records and Lyfta workout records;
- gives one evidence-based daily verdict and the next non-negotiable action;
- does not inspect application code or debug Sian OS;
- does not write, edit, or delete operational records;
- may update this canonical document only after a coaching decision is explicitly confirmed.

The detailed role contract is [`agents/COACH_AGENT.md`](./agents/COACH_AGENT.md).

### Data Steward Agent

The Data Steward Agent:

- records only facts Sian explicitly confirms;
- reads the existing record before an update;
- writes routine wellness data through the validated Sian OS API;
- verifies every stored result;
- reports what was written, preserved, and left unknown;
- does not coach, judge, change the plan, or inspect application code;
- writes only reviewer-facing workout notes from Lyfta into Sian OS and preserves Lyfta as the detailed source of truth.

The detailed role contract is [`agents/DATA_STEWARD_AGENT.md`](./agents/DATA_STEWARD_AGENT.md).

### Daily sequence

When Sian submits daily facts and asks for coaching in one message:

1. The Data Steward records and verifies the confirmed facts.
2. The Coach rereads the fresh records.
3. The Coach checks relevant Lyfta workout evidence and the Lyfta-derived `workout_text` stored in Sian OS.
4. The Coach compares the day with the currently applicable rules and recent trends.
5. The Coach gives one verdict: `On Track`, `Needs Correction`, `Off Plan`, or `Insufficient Data`.
6. The Coach states the evidence, progress, main correction, and next required action.

This sequence runs when Sian initiates a daily check-in. No autonomous background schedule is currently configured.

Never infer a workout from a scheduled day. Never infer that no workout occurred merely because Sian OS has no workout note; Lyfta is the detailed workout source of truth.

## Daily reporting format

Sian may report naturally. The coach should extract only what is explicitly stated and ask about material gaps.

```text
Date:
Sleep hours:
Morning weight, if measured:
Workout: completed / scheduled rest / approved break / missed
Lyfta workout name or link, if applicable:
Muscle soreness:
Any joint pain:
Breakfast:
Lunch:
Dinner:
Snacks and drinks:
Estimated protein:
Estimated fats:
Estimated carbs:
Estimated calories:
Water:
Creatine:
Biggest deviation:
Tomorrow's preparation:
```

During the approved exam break, the workout field should be recorded as `approved break`, not `missed`.

## Review cadence

### Daily

- sleep hours;
- body weight when measured;
- water;
- protein;
- fats and carbs when estimated;
- calories when estimated;
- food summary;
- creatine;
- workout status when training is active;
- soreness, pain, and relevant notes.

### Weekly

- body-weight trend rather than one reading;
- completed versus scheduled Lyfta workouts;
- exercise progression and execution;
- nutrition-coach review: phase, protein consistency, calorie direction, meal quality, appetite/energy, and one next-week nutrition decision;
- hydration consistency;
- sleep consistency;
- the main obstacle and one focus for the next week.

### Monthly

- progress photos;
- strength trends from Lyfta;
- body-weight direction;
- whether the lean-gain rate remains controlled;
- whether the current plan remains compatible with university and work.

## Current operational state

As last verified on 2026-07-30:

- the production Sian OS profile records Sian as 22 years old, 170 cm, and approximately 60 kg;
- the profile records the approved exam break and 2026-08-07 restart;
- an API smoke-test check-in containing false 80 kg/150 g values was deleted with Sian's explicit approval;
- an R2 JSON backup was created before that deletion;
- the direct repair and profile update were audit logged;
- after cleanup, Sian OS contained no real daily check-ins or workouts;
- Hevy was selected as the workout source of truth at that time. This is superseded by the 2026-08-11 Lyfta decision.
- Sian personally logged in to Hevy in the shared coaching browser at that time. This is no longer the active workout-source workflow.

Operational data changes over time. Verify current Sian OS and Lyfta state rather than treating this section as a live dashboard.

## Open questions

- Lyfta API access currently supports workout evidence; verify whether the configured API exposes active planned routines/templates before answering routine questions from automation.
- The approximate 60 kg baseline still needs a current morning weigh-in when Sian chooses to measure.
- Lyfta API route and response details need implementation-time verification before automatic workout import is built.
- Targets may need adjustment after several weeks of real sleep, weight, food, and workout data.

## Evidence anchors

These references support the standing targets but do not replace individualized medical advice:

- [American Academy of Sleep Medicine and Sleep Research Society adult sleep consensus](https://aasm.org/resources/pdf/adultsleepdurationconsensus.pdf) — adults should regularly obtain at least seven hours of sleep.
- [International Society of Sports Nutrition position stand on protein and exercise](https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/) — 1.4–2.0 g/kg/day is sufficient for most exercising people; the 95–110 g target is approximately 1.6–1.8 g/kg at a 60 kg baseline.
- [Lyfta website](https://www.lyfta.app/) — Lyfta is the selected workout tracker; verify current API documentation and app behavior at implementation time.
- Peter Khatcherian, *How To Build a High Level Physique in 6-12 Months!* — Sian-provided nutrition principles: phase-based nutrition, measurable targets beyond "clean eating," controlled surpluses, weekly evidence-based adjustments, fundamentals before supplements, and a sustainable lifetime framework.

## Decision log

| Date | Confirmed decision | Consequence |
| --- | --- | --- |
| 2026-07-30 | The coach will be strict, direct, evidence-based, and non-insulting. | Excuses and inconsistency are challenged; unsafe punishment and all-or-nothing behavior are rejected. |
| 2026-07-30 | The goal is controlled lean gain with strength, health, energy, focus, and long-term discipline. | Trends and sustainable progress outrank rapid bulking. |
| 2026-07-30 | Sian OS remains the wellness source of truth. | Confirmed sleep, weight, water, protein, meal notes, and photos are recorded there; reports are derived from daily check-ins. |
| 2026-07-30 | The false API smoke-test check-in may be removed. | It was backed up, deleted, audited, and verified absent. |
| 2026-07-30 | Exams justify a planned gym break through 2026-08-06. | No gym sessions in that period count as missed. |
| 2026-07-30 | Gym training restarts on Friday, 2026-08-07. | Superseded as active routine guidance on 2026-08-11; current routine and progression must come from Lyfta. |
| 2026-07-30 | Hevy is the workout source of truth. | Superseded on 2026-08-11 by the Lyfta decision. Sian OS structured workout tracking remains removed. |
| 2026-07-30 | Replace Sian OS weekly-review journaling with derived reports. | One Reports page provides daily, weekly, and monthly intervals, preset/custom date ranges, Dither Kit charts, summaries, and detail tables without storing separate report records. |
| 2026-07-30 | Retire the standalone Progress flow and consolidate daily data entry. | Body-measurement and separate nutrition-log systems are removed; meal text and progress photos move into Check-in, Profile gets its own page, and daily reports can edit/delete check-ins. |
| 2026-07-30 | The coach may use Sian's authenticated shared-browser Hevy session for read-only coaching review. | Superseded on 2026-08-11 by API-based Lyfta retrieval. Credentials and secrets are still never shared or recorded in repo files. |
| 2026-07-30 | The earlier 9:30 pm bedtime target is too late for a 4:25 am wake time. | Active target is 8:45 pm lights out, with 9:00 pm as the normal hard ceiling. |
| 2026-08-05 | Split fitness operations into a Coach Agent and a Data Steward Agent. | The Data Steward records and verifies confirmed facts first; the Coach then rereads the records, checks the active workout source, judges the day, analyzes progress, and guides Sian. Neither role inspects application code during fitness operations. |
| 2026-08-10 | Sian OS daily check-ins may include estimated calories and workout-summary text. | Calories become a structured check-in field; workout text is allowed for daily review context, while the active workout tracker remains authoritative for detailed workout records and progression. |
| 2026-08-11 | Lyfta replaces Hevy as the workout source of truth, and API-based Lyfta workout retrieval is approved. | The daily logger should fetch Lyfta workout details and store reviewer-facing workout notes in Sian OS `workout_text`; Lyfta remains authoritative for detailed workout records and progression. The Lyfta API key must be stored only as a secure runtime secret and never committed or written into docs. |
| 2026-08-11 | Workout routine answers must come only from Lyfta. | The old Upper/Lower split and re-entry plan must not be used as the current routine. If Lyfta does not expose the active routine/template through available Actions, the coach must say it cannot verify the current routine instead of guessing. |
| 2026-08-12 | Sian OS adds a saved recipe library for repeat nutrition items. | The Data Steward must check saved recipes before estimating calories and protein from nutrition notes; saved recipe values override estimates when the logged food clearly matches. |
| 2026-08-13 | Sian OS check-ins record sleep as numeric hours instead of sleep and wake times. | The Data Steward should send `sleep_hours` directly when stated; the app no longer calculates sleep from separate time fields. |
| 2026-08-13 | Sian OS daily check-ins may include estimated fats and carbs. | Fats and carbs become optional structured check-in fields for nutrition detail; they are not active macro targets unless separately confirmed. |
| 2026-08-11 | Add a nutrition-coach workflow based on Peter Khatcherian's phase-based physique nutrition principles. | Weekly analysis must include a nutrition decision from evidence: hold, tighten, increase slightly, pull back slightly, or propose conditioning-first. The coach must reject vague "clean eating," aggressive bulking, crash dieting, and emotional changes. |
