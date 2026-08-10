# Sian Fitness Coaching Context

> Canonical living document
>
> Owner: Sian Malik
>
> Last updated: 2026-08-10
>
> Status: Active

This document is the durable source of truth for Sian's fitness-coaching relationship, goals, constraints, rules, platform choices, and confirmed decisions. It complements the technical [`COACH_AGENT_HANDOFF.md`](./COACH_AGENT_HANDOFF.md), which documents Sian OS APIs and Cloudflare operations.

This file contains personal routine and wellness context. Its presence in a public repository should remain an intentional choice.

## Authority and maintenance

Use the following precedence when information conflicts:

1. Sian's newest explicit statement or correction.
2. Confirmed decisions recorded in this document.
3. Current measured data in Sian OS or completed workout data in Hevy.
4. Historical baselines in this document.
5. Coach suggestions, which are not decisions until Sian agrees.

When Sian and the coach agree to a new plan, exception, target, schedule, tool, source of truth, reporting rule, or coaching rule:

1. Update the relevant section of this document during the same work session.
2. Add a dated entry to the decision log.
3. Mark replaced guidance as superseded rather than leaving conflicting active rules.
4. Separate confirmed facts from proposals and open questions.
5. Never record passwords, API keys, authentication tokens, session cookies, or guessed health data here.

Routine measurements and daily logs belong in Sian OS or Hevy, not in this document. This document records the rules and meaning of those systems.

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
- The normal weekly split makes Friday a Lower session.
- The first ten completed gym sessions form the re-entry phase.
- Re-entry sessions use approximately 60–70% of previous working loads.
- Re-entry sets should normally finish with about 3–4 reps in reserve.
- No training to failure and no ego lifting during re-entry.
- Sessions remain 30–45 minutes.

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

Hevy is the authoritative source for:

- completed workouts;
- exercises;
- sets, repetitions, and loads;
- RPE/RIR when recorded;
- routines;
- exercise history and strength progression.

Sian OS is not the detailed workout tracker. Structured workout features have been removed from Sian OS and must not be reintroduced or used to duplicate Hevy data unless Sian explicitly reverses this decision.

Sian OS may store brief workout status or summary text in a daily check-in. That text exists for coaching context only and never replaces Hevy as the record for exercises, sets, reps, loads, RPE/RIR, routines, or strength progression.

The coach currently has access to an authenticated Hevy session in the shared browser. That session may expire or be cleared. If it does, Sian must log in personally again; Sian must never send the coach a password.

An automatic Hevy API integration has not been approved or implemented. If considered later, verify current Hevy API availability and subscription requirements, and store any API key only as a secure secret—not in chat, source control, Sian OS payloads, or this document.

### Weekly structure

- Monday: Upper.
- Tuesday: Lower.
- Wednesday: light/accessory/recovery.
- Thursday: Upper.
- Friday: Lower.
- Saturday: rest.
- Sunday: rest.
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

Machine stacks, bar weights, equipment setup, and technique can differ. Hevy history plus current execution determine progression; these historical numbers do not justify forcing a load.

## Nutrition system

### Constraints

- Meals are mainly Pakistani home or office food.
- Family and office meals are shared.
- Food generally cannot be weighed reliably.
- Coaching must use portions and meal descriptions rather than pretending calorie estimates are exact.

### Active targets

- Protein: approximately 95–110 g per day.
- Calories: optional estimate when Sian reports enough food context; do not pretend estimates are exact.
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
8. Compliance is evaluated from evidence: completed Hevy workouts, Sian OS wellness records, and honest reports.
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
| Workout sessions, exercises, sets, reps, load, RPE/RIR | Hevy |
| Sleep and wake time | Sian OS daily check-in |
| Daily body weight when measured | Sian OS daily check-in |
| Water and protein | Sian OS daily check-in |
| Estimated calories | Sian OS daily check-in |
| Breakfast, lunch, dinner, and food summary | Sian OS daily check-in nutrition textarea |
| Brief daily workout status or summary | Sian OS daily check-in workout textarea |
| Progress photos | Sian OS check-in dialog/R2 |
| Derived daily/weekly/monthly wellness reports | Sian OS Reports page |
| Coaching rules, platform decisions, exceptions, and long-term context | This document |
| Subjective explanation for the current day | Coaching conversation, then Data Steward records a confirmed summary in Sian OS when appropriate |

Do not duplicate detailed individual workouts into Sian OS. A short workout status or summary may be stored in the daily check-in for coaching context, but Hevy remains authoritative for exercises, sets, reps, loads, RPE/RIR, routines, and progression.

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
- reads Sian OS wellness records and Hevy workout records;
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
- never copies detailed Hevy workouts into Sian OS.

The detailed role contract is [`agents/DATA_STEWARD_AGENT.md`](./agents/DATA_STEWARD_AGENT.md).

### Daily sequence

When Sian submits daily facts and asks for coaching in one message:

1. The Data Steward records and verifies the confirmed facts.
2. The Coach rereads the fresh records.
3. The Coach checks relevant Hevy workout evidence.
4. The Coach compares the day with the currently applicable rules and recent trends.
5. The Coach gives one verdict: `On Track`, `Needs Correction`, `Off Plan`, or `Insufficient Data`.
6. The Coach states the evidence, progress, main correction, and next required action.

This sequence runs when Sian initiates a daily check-in. No autonomous background schedule is currently configured.

Never infer a workout from a scheduled day. Never infer that no workout occurred merely because Sian OS has no workout note; Hevy is the detailed workout source of truth.

## Daily reporting format

Sian may report naturally. The coach should extract only what is explicitly stated and ask about material gaps.

```text
Date:
Sleep time / wake time:
Morning weight, if measured:
Workout: completed / scheduled rest / approved break / missed
Hevy workout name or link, if applicable:
Muscle soreness:
Any joint pain:
Breakfast:
Lunch:
Dinner:
Snacks and drinks:
Estimated protein:
Estimated calories:
Water:
Creatine:
Biggest deviation:
Tomorrow's preparation:
```

During the approved exam break, the workout field should be recorded as `approved break`, not `missed`.

## Review cadence

### Daily

- sleep and wake time;
- body weight when measured;
- water;
- protein;
- calories when estimated;
- food summary;
- creatine;
- workout status when training is active;
- soreness, pain, and relevant notes.

### Weekly

- body-weight trend rather than one reading;
- completed versus scheduled Hevy workouts;
- exercise progression and execution;
- protein consistency;
- calorie direction when enough estimates exist;
- hydration consistency;
- sleep consistency;
- the main obstacle and one focus for the next week.

### Monthly

- progress photos;
- strength trends from Hevy;
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
- Hevy was selected as the workout source of truth;
- Sian personally logged in to Hevy in the shared coaching browser, and the authenticated session persisted when reopened.

Operational data changes over time. Verify current Sian OS and Hevy state rather than treating this section as a live dashboard.

## Open questions

- The exact exercise selection and set scheme for the 2026-08-07 Lower re-entry workout has not yet been finalized.
- The approximate 60 kg baseline still needs a current morning weigh-in when Sian chooses to measure.
- Browser-based Hevy access is active, but automatic API integration has not been approved.
- Targets may need adjustment after several weeks of real sleep, weight, food, and workout data.

## Evidence anchors

These references support the standing targets but do not replace individualized medical advice:

- [American Academy of Sleep Medicine and Sleep Research Society adult sleep consensus](https://aasm.org/resources/pdf/adultsleepdurationconsensus.pdf) — adults should regularly obtain at least seven hours of sleep.
- [International Society of Sports Nutrition position stand on protein and exercise](https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/) — 1.4–2.0 g/kg/day is sufficient for most exercising people; the 95–110 g target is approximately 1.6–1.8 g/kg at a 60 kg baseline.
- [Hevy public API documentation](https://api.hevyapp.com/docs/) — consult this at implementation time if automatic workout retrieval is later approved.

## Decision log

| Date | Confirmed decision | Consequence |
| --- | --- | --- |
| 2026-07-30 | The coach will be strict, direct, evidence-based, and non-insulting. | Excuses and inconsistency are challenged; unsafe punishment and all-or-nothing behavior are rejected. |
| 2026-07-30 | The goal is controlled lean gain with strength, health, energy, focus, and long-term discipline. | Trends and sustainable progress outrank rapid bulking. |
| 2026-07-30 | Sian OS remains the wellness source of truth. | Confirmed sleep, weight, water, protein, meal notes, and photos are recorded there; reports are derived from daily check-ins. |
| 2026-07-30 | The false API smoke-test check-in may be removed. | It was backed up, deleted, audited, and verified absent. |
| 2026-07-30 | Exams justify a planned gym break through 2026-08-06. | No gym sessions in that period count as missed. |
| 2026-07-30 | Gym training restarts on Friday, 2026-08-07. | Re-entry begins at 60–70% loads, 3–4 RIR, no failure, for the first ten completed sessions. |
| 2026-07-30 | Hevy is the workout source of truth. | Detailed workouts are logged in Hevy, not duplicated in Sian OS; Sian OS structured workout tracking has been removed. |
| 2026-07-30 | Replace Sian OS weekly-review journaling with derived reports. | One Reports page provides daily, weekly, and monthly intervals, preset/custom date ranges, Dither Kit charts, summaries, and detail tables without storing separate report records. |
| 2026-07-30 | Retire the standalone Progress flow and consolidate daily data entry. | Body-measurement and separate nutrition-log systems are removed; meal text and progress photos move into Check-in, Profile gets its own page, and daily reports can edit/delete check-ins. |
| 2026-07-30 | The coach may use Sian's authenticated shared-browser Hevy session for read-only coaching review. | Sian logs in personally; credentials are never shared or recorded. |
| 2026-07-30 | The earlier 9:30 pm bedtime target is too late for a 4:25 am wake time. | Active target is 8:45 pm lights out, with 9:00 pm as the normal hard ceiling. |
| 2026-08-05 | Split fitness operations into a Coach Agent and a Data Steward Agent. | The Data Steward records and verifies confirmed facts first; the Coach then rereads the records, checks Hevy, judges the day, analyzes progress, and guides Sian. Neither role inspects application code during fitness operations. |
| 2026-08-10 | Sian OS daily check-ins may include estimated calories and brief workout-summary text. | Calories become a structured check-in field; workout text is allowed only as a short daily status/summary, while Hevy remains authoritative for detailed workout records and progression. |
