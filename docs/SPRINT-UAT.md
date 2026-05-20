## Volume — User Acceptance Test

Volume is a bouldering training planner. A user builds weekly training schedules, assigns each session a training Intent (a leaf in the Skill Tree), commits to up to five Goals, and reflects on coverage over a rolling four-week window. This document is the testable list of UAT criteria for the project.

### Status legend

- `[x]` — **Implemented.** Available in the current build.
- `[ ]` — **In development.** Specified, on the active build list, not yet released.
- Items under **Future work** are deliberately deferred and not planned for the current release.

### 1. Authentication and app shell

- [x] As a user, I can sign in by submitting my email address and clicking a single-use link delivered to that inbox.
- [x] As a user, once signed in, I land in the application with navigation visible.
- [x] As a user, I can navigate between the Schedule page and the Skill Tree page from the sidebar.
- [x] As a user, I can see at a glance which page I am currently on.
- [x] As a user, I can sign out of the application.
- [ ] As a user, I do not see any placeholder or "coming soon" destinations in the navigation.

### 2. Visual identity

- [x] As a user, I see the Volume brand mark in the sidebar and as the browser tab icon.
- [x] As a user, I see each Skill Tree category represented by a consistent colour everywhere it appears in the application.
- [ ] As a user, I see a visually coherent experience across every reachable surface of the application — no surface looks like it belongs to an older version.

### 3. Skill Tree and Goals

- [x] As a user, I can open the Skill Tree page and see the five training categories: Technique, Mobility, Mental, Longevity, and Strength.
- [x] As a user, I can drill into a category to see the leaves it contains, and collapse it again.
- [x] As a user, I can pan and zoom around the Skill Tree canvas to focus on any area of interest.
- [x] As a user, I can open a detail view for any leaf to read about it.
- [x] As a user, I can set any leaf as a Goal, and remove it as a Goal, from its detail view.
- [x] As a user, I can hold up to five Goals at a time, and I can see which leaves are my Goals by a marker on the leaf.
- [x] As a user, my Goals remain set across sessions until I remove them.

### 4. Weekly schedule

- [x] As a user, I can see the activities for a week laid out as a seven-day board, one column per day.
- [x] As a user, I can see which week I am viewing and the dates it spans.
- [x] As a user, I can navigate to any previous or future week.
- [x] As a user, when I am viewing a week other than the current one, I can return to the current week with a single click.
- [x] As a user, I can see the name and date of each day at the top of its column.
- [x] As a user, I can see which day corresponds to today at a glance.
- [x] As a user, I can see at a glance which days have no activities scheduled.
- [x] As a user, I can scroll the board horizontally when the seven columns do not fit on my screen.

### 5. Adding activities

Activities have three Kinds — Climb, Warmup, and Train — and each has its own flow.

#### 5.1 Choosing a Kind

- [x] As a user, I can add an activity to any day of the week.
- [x] As a user, when I add an activity, I am asked whether it is a Climb, a Warmup, or a Train session.

#### 5.2 Climb activities

- [x] As a user, when I add a Climb activity, I am asked to choose its Intent — the thing I am training in that session.
- [x] As a user, when choosing an Intent for a Climb, I can browse all eligible Skill Tree leaves, jump to my Goals, or reuse a recent Intent.
- [x] As a user, when choosing an Intent for a Climb, I can also choose "Just Climbing" — a Climb without a specific training intent (for fun, social, or recovery climbs).
- [x] As a user, my recent Intent picks are remembered so I can reuse them quickly on later sessions.

#### 5.3 Warmup activities

- [x] As a user, when I add a Warmup activity, I can pick from a small library of warmup templates.
- [x] As a user, when I pick a warmup template, I can adjust the prescription (sets, reps or seconds, rest) before the warmup is added to my day.
- [ ] As a user, I can author my own warmup templates and have them available for selection alongside the built-in ones.

#### 5.4 Train activities

- [x] As a user, when I add a Train activity, I must choose an Intent — Train sessions cannot be saved without one.
- [x] As a user, after choosing an Intent for a Train activity, I pick a Block (a named exercise prescription) from those available for that Intent.
- [x] As a user, I can adjust the Block's exercises — their sets, reps or seconds, and rest — before the Train activity is added to my day.
- [ ] As a user, I can add, remove, and reorder exercises within a Block when adding a Train activity.
- [ ] As a user, I can author entirely new Blocks under a leaf and reuse them on later Train sessions.

### 6. Activities on the board

- [x] As a user, I can see each activity on the board as a card carrying its Intent and its Kind, coloured according to the Intent's category.
- [x] As a user, I can drag a card from one day to another to reschedule it.
- [x] As a user, I can reorder cards within a single day.
- [x] As a user, my schedule changes persist across sessions and across devices.

### 7. Activity detail and logging

- [x] As a user, I can click an activity card to open its detail view.
- [x] As a user, in the detail view I can see the activity's Intent, Kind, and category at a glance.
- [x] As a user, for a Climb activity I can record how hard the session felt (Easy, Moderate, or Hard).
- [x] As a user, for a Train or Warmup activity I can see the Block's exercises along with their prescribed sets, reps or seconds, and rest.
- [x] As a user, I can record free-text notes on any activity.
- [x] As a user, I can mark an activity as logged once I have completed the session.
- [x] As a user, when I reopen a logged activity, it is shown in read-only mode by default, and I can return to editing if I need to.
- [x] As a user, I can delete an activity, with a confirmation step to prevent accidents.
- [ ] As a user, I can see at a glance on the board which activities I have already logged.

### 8. Weekly Goal coverage

- [x] As a user, I can see, for the week I am viewing, how many of that week's activities used each of my Goals as their Intent.
- [x] As a user, when I have not set any Goals, the Goal coverage area shows an empty state directing me to the Skill Tree where Goals are set.
- [x] As a user, my Goal coverage counts only training activities — Climbs and Train sessions with a real Intent. Warmups and "Just Climbing" sessions are not counted toward a Goal.
- [x] As a user, my Goal coverage updates immediately when I add, delete, or move activities in the current week.
- [x] As a user, I can jump to the Skill Tree to manage my Goals directly from the Goal coverage area.

### 9. Four-week training coverage on the Skill Tree

- [ ] As a user, on the Skill Tree page I can see how my training has been distributed across the categories and leaves over the last four weeks.
- [ ] As a user, the coverage rollup counts every scheduled training activity (Climb and Train) within the last four weeks. Warmups and "Just Climbing" sessions are excluded.
- [ ] As a user, on the top-level Skill Tree view I can see at a glance how heavily each of the five categories has been trained, by both a numeric count and the saturation of the category's colour — neglected categories visibly fade.
- [ ] As a user, when I drill into a category, I can see the same training-coverage signal for each individual leaf.
- [ ] As a user, my Goal markers remain clearly visible on leaves whose colour has been desaturated by the coverage view.

### 10. User-authored Block library

- [ ] As a user, I can author my own Block under any Skill Tree leaf, in addition to the ones that ship with the application.
- [ ] As a user, when I author a Block I can give it a name and define its exercises with their sets, reps or seconds, and rest.
- [ ] As a user, the Blocks I author appear in the Block picker for that leaf alongside the built-in Blocks, on subsequent Train activities.
- [ ] As a user, the Blocks and warmups I author remain available across sessions.

### 11. Future work

The following capabilities are intentionally deferred. They are recorded here to make the boundary of the current release explicit.

- **Information layer.** Tapping an Intent does not surface tips, technique cues, videos, or any educational content. The Skill Tree leaf detail view describes the leaf but does not link to external media.
- **Rich logging.** There is no per-exercise actual-versus-prescribed entry, no progression charts, no personal-record tracking, and no growth-over-time visualisation. Logging is limited to perceived intensity (Climb), notes (all Kinds), and a binary logged state.
- **Editing or deleting user-authored Blocks and warmups.** Once authored, a user-owned Block or warmup is append-only. A mistake is resolved by authoring a new one.
- **Mobile and responsive layout.** The application assumes a desktop viewport. Tablet- or phone-sized screens are not designed for and may render poorly.
- **Dark mode.** Not designed.
- **Multi-week views.** There is no monthly view and no comparison view across multiple weeks. The four-week coverage view is the only multi-week surface.
- **Sharing and social features.** No shared schedules, no team or coach roles, and no exports.
- **Variable coverage windows.** The four-week window is fixed. There is no seven-day or ninety-day toggle.
- **Counting Just-Climbing or Warmup activities toward coverage.** Just-Climbing intents and Warmup activities never count toward the weekly Goal coverage view or the four-week training-coverage view. This is by design — they are not training intent.
- **Onboarding and tutorial flow.** First-run experience is the empty schedule and an empty Skill Tree. There is no guided tour and no demo-data loader.
