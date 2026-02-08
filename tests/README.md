# Pulse Labs — Test Suite

Automated UAT (User Acceptance Testing) met [Playwright](https://playwright.dev/).

## Snel starten

```bash
# Publieke tests (geen login nodig, draait ook in pre-push hook):
npm run test:public

# Alle tests (inclusief authenticated):
TEST_ADMIN_EMAIL=jouw@email.com TEST_ADMIN_PASSWORD=wachtwoord npm test

# Visueel debuggen:
npm run test:ui
```

## Quality Gates

### Pre-push hook (automatisch bij `git push`)

| Stap | Check | Blokkerend |
|------|-------|------------|
| 1 | `tsc --noEmit` — TypeScript type check | Ja |
| 2 | `eslint` — Lint check | Nee (warning) |
| 3 | `playwright test` — 10 publieke UAT tests | Ja |

Als stap 1 of 3 faalt, wordt de push geweigerd.

### Vercel deploy (automatisch bij deploy)

`npm run build` draait `tsc --noEmit` voor `next build`. Bij type errors faalt de build en deployt Vercel niet.

## Testbestanden

### Publieke tests (geen auth nodig)

| Bestand | Tests | Wat wordt getest |
|---------|-------|------------------|
| `home.spec.ts` | 5 | Homepage branding, core tools sectie, "Way of Work" label, CTA navigatie, taalwissel |
| `login.spec.ts` | 3 | Login formulier rendering, foutmelding bij foute credentials, redirect bij ongeauthenticeerde toegang |
| `participation.spec.ts` | 2 | Foutmelding bij ongeldige sessiecode, geen "Ceremonies" tekst |

### Authenticated tests (admin login vereist)

| Bestand | Tests | Wat wordt getest |
|---------|-------|------------------|
| `teams.spec.ts` | 3 | Teams lijst laden, team detail met tool cards (Vibe + Way of Work), settings tab met tool toggles |
| `wow-session.spec.ts` | 2 | Nieuwe WoW sessie pagina met angle grid (9 angles), angle selectie activeert start knop |
| `rename-verification.spec.ts` | 5 | Verificatie dat "Ceremonies" nergens meer in de UI voorkomt (homepage, login, teams lijst, team detail, wow pagina) |

**Totaal: 20 tests**

## Wat is gedekt

- Homepage content en navigatie
- Login flow (formulier, foutafhandeling, redirect)
- Teams lijst en team detail pagina (alle tabs)
- Way of Work sessie aanmaken (angle selectie, Shu-Ha-Ri level)
- Participatie pagina (publiek, sessie code validatie)
- Rename verificatie ("Ceremonies" -> "Way of Work") op alle pagina's

## Wat mist nog (backlog)

De volgende tests zijn nog niet geimplementeerd en kunnen later toegevoegd worden:

### Hoge prioriteit

| Test | Beschrijving | Auth |
|------|-------------|------|
| Vibe tab flow | Share link genereren, kopieer knop, metrics weergave | Ja |
| WoW sessie detail | Sessie openen, responses bekijken, sessie sluiten, experiment invullen | Ja |
| Participatie flow (happy path) | Volledige flow: intro -> statements beantwoorden -> bedankpagina | Nee* |
| Team aanmaken | Formulier invullen, team verschijnt in lijst | Ja |

*\*Vereist een actieve sessie met geldige code*

### Medium prioriteit

| Test | Beschrijving | Auth |
|------|-------------|------|
| Results pagina | Publieke resultaten met radar chart, Shu-Ha-Ri banner, scores | Cookie |
| Tool enable/disable | Vibe en WoW aan/uitzetten in settings, UI update check | Ja |
| Team verwijderen | Danger zone, confirm dialog, redirect na delete | Ja |
| Coach vragen | Coach tab openen, vragen worden gegenereerd op basis van data | Ja |
| Feedback tool | Feedback tab, share link, feedback items weergave | Ja |

### Lage prioriteit

| Test | Beschrijving | Auth |
|------|-------------|------|
| Dark mode | Theme toggle, kleuren check | Nee |
| Mobile responsive | Viewport tests, hamburger menu, touch targets | Nee |
| CSV export | Export knop in settings, bestand download | Ja |
| Backlog pagina | Feature requests en release notes weergave | Ja |
| Session vergelijking | Twee sessies naast elkaar vergelijken | Ja |
| Taalwissel diepte | NL/EN toggle op alle pagina's, vertalingen correct | Mix |

## Authenticated tests draaien

Stel environment variabelen in met je admin account:

```bash
# Eenmalig:
export TEST_ADMIN_EMAIL="jouw@email.com"
export TEST_ADMIN_PASSWORD="jouw-wachtwoord"

# Dan:
npm test
```

Of in een `.env.test` bestand (voeg toe aan `.gitignore`!):

```
TEST_ADMIN_EMAIL=jouw@email.com
TEST_ADMIN_PASSWORD=jouw-wachtwoord
```

## Structuur

```
tests/
  helpers/
    auth.ts              # Login helper (API-based, zet session cookie)
  home.spec.ts           # Homepage tests
  login.spec.ts          # Login pagina tests
  participation.spec.ts  # Publieke participatie pagina tests
  teams.spec.ts          # Teams lijst en detail tests (auth)
  wow-session.spec.ts    # Way of Work sessie aanmaken (auth)
  rename-verification.spec.ts  # "Ceremonies" -> "Way of Work" check
  README.md              # Dit bestand
```
