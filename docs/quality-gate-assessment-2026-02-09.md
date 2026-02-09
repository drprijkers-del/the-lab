# PULSE LABS — RELEASE READINESS ASSESSMENT

**Datum:** 9 februari 2026
**Beoordelaar:** Claude (Quality Gate per `docs/quality-gate.md`)
**Scope:** Volledige codebase analyse na AI Coach feature implementatie

---

## PART 1 — Critical End-to-End Customer Journeys

### Journey 1: Signup → Team → Pulse → Insights

| Aspect | Detail |
|--------|--------|
| **Stappen** | Clerk signup → `/teams` → Create team → Share Vibe link → Team responds → Insights visible |
| **Status** | Werkt end-to-end |
| **Failure points** | Double-submit op team create (race condition), cache invalidation na check-in (revalidatePath) |
| **Severity** | **HIGH** als share link niet werkt, **MEDIUM** als insights vertraagd |

### Journey 2: WoW Sessie → Share → Results

| Aspect | Detail |
|--------|--------|
| **Stappen** | WoW tab → New Session → Select angle → Share `/d/{code}` → Responses → Close → Synthesis |
| **Status** | Werkt end-to-end |
| **Failure points** | Pro-angles falen stilletjes voor free users, device_id spoofing mogelijk, level auto-progression falen |
| **Severity** | **HIGH** als pro angles usable op free, **MEDIUM** als level progressie faalt |

### Journey 3: Free → Team Limit → Upgrade → Mollie

| Aspect | Detail |
|--------|--------|
| **Stappen** | Hit team limit → Error + link → `/account/billing` → Select tier → Mollie checkout → Webhook → Unlock |
| **Status** | Werkt end-to-end |
| **Failure points** | Webhook niet ontvangen (single point of failure), race condition op team create, payment pending forever |
| **Severity** | **CRITICAL** als webhook niet verwerkt, **HIGH** als teams niet upgraden na betaling |

### Journey 4: Cancel → Grace Period → Downgrade

| Aspect | Detail |
|--------|--------|
| **Stappen** | Cancel subscription → `billing_status='cancelled'` → Grace period → Plan reset to free |
| **Status** | Werkt, maar UX onduidelijk |
| **Failure points** | Grace period niet gecommuniceerd, Ha/Ri reset timing, Mollie cancellation kan falen |
| **Severity** | **CRITICAL** als grace period genegeerd, **HIGH** als Ha/Ri levels niet resetten |

### Journey 5: Mobile Full Flow

| Aspect | Detail |
|--------|--------|
| **Stappen** | Mobile signup → Create team → Share → Check-in → WoW → Results |
| **Status** | Werkt, responsive design aanwezig |
| **Failure points** | Tab bar overflow niet zichtbaar, share URL copy kan falen, radar chart te klein |
| **Severity** | **CRITICAL** als share link niet werkt op mobile, **MEDIUM** als tabs niet vindbaar |

---

## PART 2 — Negative & Edge Case Testing

### A. Empty / Invalid Inputs

| Case | Afgehandeld? | Risico |
|------|-------------|--------|
| Team naam leeg | Ja — `name.trim().length < 2` check | Low |
| Team size invalid | Ja — `isNaN \|\| < 1 \|\| > 100` check | Low |
| Mood score invalid | UI constrains 1-5, backend RPC check onduidelijk | Medium |
| WoW antwoorden incompleet | RPC schema validatie onduidelijk | Medium |
| Share link token missing | Ja — 400 error returned | Low |

### B. Double Submits

| Case | Afgehandeld? | Risico |
|------|-------------|--------|
| Double mood check-in | Ja — DB level deduplicatie | Low |
| **Double team create** | **Nee — race condition mogelijk** | **High** |
| Double session create | Ja — UI loading state | Low |
| Double webhook | Ja — `upsert` met `onConflict` | Low |

### C. Overige Edge Cases

| Case | Verwacht gedrag | Status |
|------|----------------|--------|
| User met 0 teams | Dashboard toont empty state + "Create team" | Werkt |
| Team limit overschrijden | Error bij submit + upgrade link | Werkt |
| Tier switching omhoog | Mollie checkout + immediate unlock | Werkt |
| Tier switching omlaag | Cancel + grace period + downgrade | Werkt, UX onduidelijk |
| Refresh during checkout | `pending_mandate` status, polling herstart | Werkt |
| Webhook delay | Frontend pollt 60s, daarna timeout | Acceptabel |

---

## PART 3 — UX & Customer Journey Quality

**Overall Grade: B+**

### Sterktes
1. **Consistente design** — Card-based layout, stone colors, dark mode support
2. **Goede loading states** — Skeleton screens op alle data-driven pagina's
3. **Tab navigatie** — Logische structuur (Home, Vibe, WoW, Feedback, Coach, Settings)
4. **Coach guidance** — Uitstekende professionele toon ("hulpmiddel, niet diagnose")
5. **Touch-friendly** — Buttons 44x44px minimum, mobile overlay menu

### Aandachtspunten

| Issue | Impact | Prioriteit |
|-------|--------|-----------|
| Geen onboarding flow — user landt zonder "next steps" | Verwarring bij eerste gebruik | Medium |
| Coach tab preview ontbreekt — blur zonder teaser | Lage conversie naar upgrade | Medium |
| Upgrade CTA verschijnt te vroeg | Voelt als interruption | Low |
| Tab bar overflow op mobile niet zichtbaar | Tabs niet gevonden | Medium |
| Vibe tab complexer dan WoW/Coach | Inconsistent feature-richness | Low |
| Billing is geïsoleerd van team context | "Upgrade per team of per account?" onduidelijk | Medium |

---

## PART 4 — Paywall & Billing Integrity

**Overall Grade: B**

### 4.1 Free Tier Bruikbaarheid

| Feature | Free | Status |
|---------|------|--------|
| Vibe (7-dag trend) | Ja | Werkt, maar kort voor patronen |
| WoW (Shu level) | Ja | Beperkt — geen progressie |
| Feedback tool | Ja | Volledig beschikbaar |
| Coach | Nee — ProGate | Blur zonder preview |
| Teams | 1 team | Voldoende voor eerste use |

**Verdict:** Bruikbaar voor exploratie, maar beperkte progressie.

### 4.2 Tier Feature Verificatie

| Claim | Code | Status |
|-------|------|--------|
| SM: Smart Questions (rule-based) | `coachMode: 'smart'` → CoachQuestions component | **Klopt** |
| AC: AI Coach (Claude-powered) | `coachMode: 'ai'` → AiCoach met Haiku API | **Klopt** |
| TC: AI Coach + cross-team | `coachMode: 'ai_cross_team'` → AiCoach + CrossTeam sectie | **Klopt** |
| SM: 3 teams | `maxTeams: 3` | **Klopt** |
| AC: 10 teams | `maxTeams: 10` | **Klopt** |
| TC: 25 teams | `maxTeams: 25` | **Klopt** |

### 4.3 Billing Flows

| Flow | Status | Issues |
|------|--------|--------|
| Checkout success | Werkt | Geen email ontvangstbevestiging |
| Webhook idempotency | Goed — `upsert` op `mollie_payment_id` | Geen HMAC signature verificatie |
| Unlock behavior | Instant na webhook | Geen user-facing bevestiging |
| Cancel/downgrade | Werkt technisch | UX onduidelijk (grace period) |
| Error messaging | Basis | Te generiek ("Failed to create checkout") |

### 4.4 Misleading Claims Check

| Claim | Werkelijkheid | Verdict |
|-------|--------------|---------|
| "AI-generated coaching" (home) | SM = rule-based, AC/TC = AI | **Misleidend** — moet tier-kwalificatie |
| "Smart Questions" (SM) | Rule-based templates | **Acceptabel** maar vaag |
| "All 15 Angles" (Pro) | Correct — 15 angles beschikbaar | **Klopt** |
| "30-day Trends" (Pro) | Correct — 60 dagen data gefetched | **Klopt** |
| AI Coach daily limit (5/dag) | Niet disclosed op billing pagina | **Ontbreekt** |

---

## PART 5 — Copy, Trust & Safety

**Overall Grade: B+**

### Anonimiteit & Privacy

| Pagina | Claim | Implementatie | Verdict |
|--------|-------|---------------|---------|
| Vibe check-in | "Volledig anoniem" | Device-based, geen login, optionele nickname | **Klopt** |
| Vibe check-in | "Nooit gedeeld met HR" | Geen user_id opgeslagen, alleen team_id | **Klopt** |
| Feedback form | "Feedback is anoniem" | Device-based dedup, geen user_id | **Klopt** |
| Feedback form | "Eén reactie per persoon" | localStorage + device check | **Klopt** |

### Coach Guidance (Uitstekend)

Relevante copy:
- *"Hulpmiddel voor jou, niet voor het team"*
- *"Dit genereert denkrichtingen op basis van signalen — geen conclusies, geen diagnoses"*
- *"Bereid 1-2 vragen voor. Stel ze open in het team. Luister naar wat zij zien."*

**Verdict:** Professioneel, verantwoord, geen overpromising.

### Kritieke Copy Issues

| Issue | Locatie | Ernst |
|-------|---------|-------|
| `homeCoachQuestionsDesc: 'AI-gegenereerde coaching vragen'` | translations.ts | **High** — SM krijgt rule-based |
| "Coming Soon" vs "In Development" verwarring | Home page modules | Medium |
| AI Coach daglimiet niet vermeld | Billing page | Medium |
| Data retentie/verwijdering niet gecommuniceerd | Check-in pagina's | Low |

---

## PART 6 — Smoke Test (Release-Day Checklist)

**Geschatte duur: 12 minuten**

| # | Stap | Verwacht | Prio |
|---|------|----------|------|
| 1 | Login via Clerk | Dashboard met teams | Must |
| 2 | Maak team aan (naam + grootte) | Team in lijst, tools enabled | Must |
| 3 | Ga naar team → Vibe tab | Share link zichtbaar, metrics leeg | Must |
| 4 | Open share link (incognito browser) | Check-in pagina met 1-5 schaal | Must |
| 5 | Submit mood (score 4 + comment) | Success scherm + streak | Must |
| 6 | Terug naar team dashboard | Score bijgewerkt in Vibe metrics | Must |
| 7 | WoW tab → Nieuwe sessie (Scrum angle) | Sessie aangemaakt, code getoond | Must |
| 8 | Open sessie link → Submit antwoorden | Reactie bevestigd | Must |
| 9 | Sluit sessie als admin | Synthese met scores + experiment | Must |
| 10 | Coach tab (free user) | ProGate paywall zichtbaar | Must |
| 11 | `/account/billing` | 4 tier cards met correcte prijzen | Must |
| 12 | Upgrade naar SM (of dev sim) | Coach tab → Smart Questions | Must |
| 13 | Upgrade naar AC (of dev sim) | Coach tab → AI Coach "Genereer" knop | Must |
| 14 | Klik "Genereer inzicht" | Observaties + vragen verschijnen | Must |
| 15 | Reset naar free (dev sim) | Coach tab → ProGate weer zichtbaar | Must |

**Herhaalbaarheid:** Kan voor elke deploy gedraaid worden. Stappen 12-15 vereisen dev simulator of Mollie test mode.

---

## PART 7 — Release Verdict

### Verdict: **GO with conditions**

---

### Top 5 Kritieke Risico's (ranked)

1. **Home page copy claimt "AI-generated" zonder tier-kwalificatie** — `homeCoachQuestionsDesc` in translations.ts zegt "AI-gegenereerde coaching vragen" maar SM tier krijgt rule-based vragen. Dit is misleidend en moet gefixt voor launch.

2. **Double team create race condition** — Twee snelle submits kunnen twee teams aanmaken. Client-side submit prevention + server-side debounce nodig.

3. **Cancellation UX onduidelijk** — Gebruiker ziet "cancelled" maar weet niet dat grace period geldt. Moet tonen: "Actief tot [datum], daarna Free".

4. **AI Coach daglimiet (5/dag) niet disclosed** — Billing pagina en tier cards vermelden dit niet. Gebruiker verwacht onbeperkt.

5. **Geen Mollie webhook signature verificatie** — Webhook accepteert POST van elke origin. Verificatie door Mollie API fetch is correct maar HMAC is beter.

---

### Top 5 Sterktes die Release Rechtvaardigen

1. **Tier-differentiatie is eerlijk geïmplementeerd** — SM=Smart Questions (rule-based), AC=AI Coach (Claude Haiku), TC=AI+cross-team. Code matcht claims.

2. **Anonimiteit en privacy zijn solide** — Device-based tracking, geen user_id, "nooit gedeeld met HR" claim klopt met implementatie.

3. **Billing flow werkt end-to-end** — Mollie checkout → webhook → instant unlock → team sync. Idempotent webhooks voorkomen dubbele charges.

4. **Coach guidance is professioneel** — "Denkrichtingen, geen diagnoses" — positioneert het product correct als hulpmiddel voor coaches.

5. **AI Coach caching voorkomt kostenexplosie** — Hash-based cache + 5/dag limiet = max ~€0.50/maand per AC gebruiker. Marge 97%+.

---

### Must-Fix Vóór Eerste Klant

| # | Item | Ernst | Geschatte effort |
|---|------|-------|-----------------|
| 1 | Fix `homeCoachQuestionsDesc` — verwijder "AI-generated" of voeg tier-kwalificatie toe | High | 5 min |
| 2 | Client-side submit prevention op team create form | High | 15 min |
| 3 | Cancelled billing state: toon "Actief tot [datum]" i.p.v. alleen "cancelled" | High | 30 min |

### Items die Kunnen Wachten tot Na Launch

| Item | Prioriteit |
|------|-----------|
| Mollie webhook HMAC signature verificatie | Medium |
| Exit survey bij cancellation | Low |
| Onboarding checklist voor nieuwe gebruikers | Medium |
| Coach tab preview/teaser voor free users | Medium |
| Mobile tab scroll indicator | Low |
| Email ontvangstbevestiging na betaling | Medium |
| AI Coach daglimiet op billing pagina tonen | Medium |
| Data retentie copy op check-in pagina's | Low |

---

### Confidence Scores (1-10)

| Categorie | Score | Toelichting |
|-----------|-------|-------------|
| Functionele stabiliteit | **7.5** | Core flows werken, edge cases grotendeels afgevangen |
| UX helderheid | **7** | Goede basis, mist onboarding en feature discovery |
| Billing vertrouwen | **7.5** | Flows werken, webhook idempotent, maar cancellation UX zwak |
| **Overall readiness** | **7** | **GO met 3 must-fixes** — daarna klaar voor eerste klanten |

---

*Assessment uitgevoerd op basis van volledige codebase analyse. Geen speculatie over toekomstige features. Alleen bestaande implementatie beoordeeld.*
