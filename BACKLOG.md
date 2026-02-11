# PulseLabs Backlog

## 🔄 Weekly Check-ins (High Priority)

**Current state:** Daily vibe check-ins
**Proposed:** Weekly check-ins with 6-week progression

### Rationale
- Team members don't want to check in every day
- Not much changes day-to-day
- Weekly cadence (e.g., Friday reflections) is more sustainable
- 6-week progression table/chart is PowerPoint-ready

### Key Changes Required
1. **Database schema**: Change from daily uniqueness to weekly (week_id constraint)
2. **Metrics**: Replace Live/Yesterday/This Week → 6-week progression view
3. **Check-in validation**: Allow one check-in per week (not per day)
4. **UI components**: Show 6 weeks of data instead of live/day/week tabs
5. **Translations**: 50+ strings from "daily/today/tomorrow" → "weekly/this week/next week"
6. **Data maturity**: Change thresholds from days (7/14/30) → weeks (2/4/6)
7. **Participation metrics**: "Today's participation" → "This week's participation"

### Effort Estimate
- 2-3 days focused refactoring
- Touches: database, backend, UI, translations

### Decision Needed
- Full migration (replace daily entirely) vs. add weekly mode as option
- How to handle existing daily historical data

### Reference
- Full analysis stored in context: agent a522efc
- Comprehensive map created: 2026-02-11

---

## ✅ Completed

### Elegant Design Patterns (2026-02-11)
- Ghost tiles with dashed borders
- Pill-style buttons
- Row-based layouts with icons
- Step guides with numbered circles
- Applied across Feedback, Coach, AI Coach, and Vibe sections

### "The Flow" Branding (2026-02-11)
- Added vibeFlowTitle to translations
- Updated vibe-section to display title
- Improved link descriptions (team check-in link, public results)
- Emphasized PowerPoint-ready results
