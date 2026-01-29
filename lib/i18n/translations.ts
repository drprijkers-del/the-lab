export const translations = {
  nl: {
    // General
    pinkPollos: 'Pink Pollos',
    labTool: 'Lab Tool',
    pulse: 'Pulse',
    admin: 'Admin',
    error: 'Er ging iets mis in het lab',
    loading: 'Laden...',
    save: 'Opslaan',
    cancel: 'Annuleren',
    create: 'Aanmaken',

    // Homepage
    homeTitle: 'Pulse',
    homeSubtitle: 'Team signalen in één klik',
    homeDescription: 'Anonieme dagelijkse signalen voor agile teams. Geen accounts, geen gedoe.',
    homeFeature1: '2 seconden',
    homeFeature2: 'Anoniem',
    homeFeature3: 'Inzicht',
    homeAskTeamLead: 'Vraag je Scrum Master om een Pulse link',
    homeFooter: 'Lab tool',
    homeScrumMasterCTA: 'Ik ben Scrum Master',
    homeScrumMasterSubtext: 'Start in 30 seconden',
    homeAlreadyAccount: 'Al een account?',
    homeAdminLogin: 'Admin login',
    homeLabAccess: 'Lab toegang',

    // Login
    loginWelcome: 'Welkom in het lab',
    loginSubtitle: 'Vul je email in voor toegang',
    loginEmail: 'Email',
    loginEmailPlaceholder: 'jouw@email.nl',
    loginButton: 'Verstuur link',
    loginLoading: 'Even koken...',
    loginNoPassword: 'Geen wachtwoord nodig.',
    loginCheckInbox: 'Check je inbox',
    loginEmailSent: 'We hebben een login link gestuurd naar',
    loginClickLink: 'Klik op de link in de email om in te loggen.',
    loginOtherEmail: 'Andere email?',
    loginUnauthorized: 'Je email staat niet in de admin lijst.',
    loginForgotPassword: '',
    loginAdminAccess: 'Admin',

    // Team signal input
    checkinQuestion: "Wat is je purity level",
    checkinToday: 'vandaag',
    checkinName: 'Alias (optioneel)',
    checkinComment: 'Context (optioneel)',
    checkinButton: 'Verstuur',
    checkinLoading: 'Verwerken...',
    checkinAnonymous: 'Volledig anoniem',

    // Signal levels (neutral, no emotional labels)
    moodVeryBad: '1',
    moodBad: '2',
    moodOkay: '3',
    moodGood: '4',
    moodGreat: '5',

    // Success
    successTitle: 'Sample binnen',
    successRecorded: 'Genoteerd in het lab',
    successStreak: 'dagen op rij',
    successStreakSingular: 'dag actief',
    successKeepGoing: 'Blijf koken!',
    successFirstCheckin: 'Je eerste batch is binnen',
    successOnFire: 'Je bent on fire!',
    successTopPerformer: 'Top contributor',
    successTeamToday: 'Team vandaag',
    successAverage: 'gemiddeld',
    successCheckins: 'signalen',
    successSeeYouTomorrow: 'Tot morgen in het lab.',

    // Already submitted
    alreadyTitle: 'Al geregistreerd vandaag',
    alreadyMessage: 'Je volgende batch kan morgen.',
    alreadyCheckedToday: 'signalen vandaag',

    // Coaching tips
    coachingTipTitle: 'Lab advies',
    coachingTipLow: 'Lage score? Bespreek het in de retro of neem je Scrum Master even apart.',
    coachingTipContext: 'Voeg context toe aan je signaal. Dit helpt je team te begrijpen wat er speelt.',
    coachingTipRetro: 'Neem dit mee naar de retro. Jouw stem telt.',
    coachingTipFeedback: 'Heb je iets op je hart? Je Scrum Master staat open voor feedback.',
    coachingTipAnonymous: 'Je signaal is anoniem, maar je stem mag gehoord worden.',

    // Invalid link
    invalidTitle: 'Link niet geldig',
    invalidMessage: 'Deze link is niet geldig of verlopen. Vraag je Scrum Master om een nieuwe link.',
    invalidTip: 'Controleer of je de volledige link hebt gekopieerd',

    // Admin
    adminTeams: 'Teams',
    adminTeamsSubtitle: 'Beheer je lab experimenten',
    adminNewTeam: 'Nieuw experiment',
    adminNoTeams: 'Nog geen experimenten',
    adminNoTeamsMessage: 'Start je eerste Pulse experiment.',
    adminFirstTeam: 'Eerste experiment starten',
    adminBack: 'Terug',
    adminCreatedOn: 'Gestart',
    adminParticipants: 'contributors',
    adminToday: 'vandaag',
    adminActive: 'Actief',
    adminLogout: 'Uitloggen',

    // New Pulse form
    newTeamTitle: 'Nieuw experiment',
    newTeamName: 'Team naam',
    newTeamNamePlaceholder: 'bijv. Sprint Team Alpha',
    newTeamDescription: 'Beschrijving (optioneel)',
    newTeamDescriptionPlaceholder: 'Korte beschrijving',
    newTeamSize: 'Team grootte (optioneel)',
    newTeamSizePlaceholder: 'bijv. 8',
    newTeamSizeHelp: 'Voor nauwkeurige deelname %',
    newTeamCreate: 'Experiment starten',
    newTeamCreating: 'Opstarten...',

    // Stats
    statsTitle: 'Lab resultaten',
    statsToday: 'Vandaag',
    statsWeek: 'Deze week',
    statsAvgMood: 'Gem. purity',
    statsCheckins: 'Samples',
    statsParticipation: 'Deelname',
    statsNoData: 'Nog geen samples',

    // Share link
    shareTitle: 'Lab toegang',
    shareDescription: 'Deel deze link met je team.',
    shareOpen: 'Open Pulse',
    shareCopy: 'Kopieer',
    shareCopied: 'Gekopieerd!',
    shareAdvanced: 'Geavanceerd',
    shareResetTitle: 'Link resetten',
    shareResetInfo: 'Gebruik dit als de link met verkeerde mensen is gedeeld. De oude link werkt direct niet meer.',
    shareResetButton: 'Reset link',
    shareResetConfirm: 'Link resetten?',
    shareResetWarning: 'De huidige link werkt direct niet meer. Teamleden moeten de nieuwe link gebruiken.',
    shareResetCancel: 'Annuleren',
    shareResetYes: 'Ja, reset',
    shareResetSuccess: 'Nieuwe formule gegenereerd',
    shareNoLink: 'Geen actieve link',

    // Team actions
    teamDelete: 'Verwijderen',
    teamDeleteConfirm: 'Weet je zeker dat je dit experiment wilt stoppen?',
    teamReset: 'Data wissen',
    teamResetTitle: 'Lab resetten',
    teamResetMessage: 'Alle samples en contributors worden verwijderd. De toegangslink blijft werken.',
    teamResetButton: 'Wissen',
    teamDeleteTitle: 'Experiment stoppen',
    teamDeleteMessage: 'Weet je zeker dat je dit experiment wilt stoppen? Dit kan niet ongedaan worden.',
    teamDeleteButton: 'Stoppen',
    teamSettings: 'Instellingen',
    teamSettingsSaved: 'Opgeslagen',

    // Stats
    statsParticipants: 'Lab medewerkers',
    statsCheckinsToday: 'Samples vandaag',
    statsMoodScale: 'Purity schaal',
  },

  en: {
    // General
    pinkPollos: 'Pink Pollos',
    labTool: 'Lab Tool',
    pulse: 'Pulse',
    admin: 'Admin',
    error: 'Something went wrong in the lab',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',

    // Homepage
    homeTitle: 'Pulse',
    homeSubtitle: 'Team signals in one click',
    homeDescription: 'Anonymous daily signals for agile teams. No accounts, no friction.',
    homeFeature1: '2 seconds',
    homeFeature2: 'Anonymous',
    homeFeature3: 'Insight',
    homeAskTeamLead: 'Ask your Scrum Master for a Pulse link',
    homeFooter: 'Lab tool',
    homeScrumMasterCTA: "I'm a Scrum Master",
    homeScrumMasterSubtext: 'Start in 30 seconds',
    homeAlreadyAccount: 'Already have an account?',
    homeAdminLogin: 'Admin login',
    homeLabAccess: 'Lab access',

    // Login
    loginWelcome: 'Welcome to the lab',
    loginSubtitle: 'Enter your email for access',
    loginEmail: 'Email',
    loginEmailPlaceholder: 'your@email.com',
    loginButton: 'Send link',
    loginLoading: 'Cooking...',
    loginNoPassword: 'No password needed.',
    loginCheckInbox: 'Check your inbox',
    loginEmailSent: "We've sent a login link to",
    loginClickLink: 'Click the link in the email to log in.',
    loginOtherEmail: 'Different email?',
    loginUnauthorized: "Your email isn't in the admin list.",
    loginForgotPassword: '',
    loginAdminAccess: 'Admin',

    // Team signal input
    checkinQuestion: "What's your purity level",
    checkinToday: 'today',
    checkinName: 'Alias (optional)',
    checkinComment: 'Context (optional)',
    checkinButton: 'Submit',
    checkinLoading: 'Processing...',
    checkinAnonymous: 'Fully anonymous',

    // Signal levels (neutral, no emotional labels)
    moodVeryBad: '1',
    moodBad: '2',
    moodOkay: '3',
    moodGood: '4',
    moodGreat: '5',

    // Success
    successTitle: 'Sample received',
    successRecorded: 'Logged in the lab',
    successStreak: 'day streak',
    successStreakSingular: 'day active',
    successKeepGoing: 'Keep cooking!',
    successFirstCheckin: 'First batch is in',
    successOnFire: "You're on fire!",
    successTopPerformer: 'Top contributor',
    successTeamToday: 'Team today',
    successAverage: 'average',
    successCheckins: 'signals',
    successSeeYouTomorrow: 'See you tomorrow in the lab.',

    // Already submitted
    alreadyTitle: 'Already recorded today',
    alreadyMessage: 'Your next batch can be submitted tomorrow.',
    alreadyCheckedToday: 'signals today',

    // Coaching tips
    coachingTipTitle: 'Lab tip',
    coachingTipLow: 'Low score? Discuss it in the retro or have a quick chat with your Scrum Master.',
    coachingTipContext: 'Add context to your signal. It helps your team understand what\'s going on.',
    coachingTipRetro: 'Bring this to the retro. Your voice matters.',
    coachingTipFeedback: 'Got something on your mind? Your Scrum Master is open to feedback.',
    coachingTipAnonymous: 'Your signal is anonymous, but your voice deserves to be heard.',

    // Invalid link
    invalidTitle: 'Invalid link',
    invalidMessage: 'This link is invalid or expired. Ask your Scrum Master for a new link.',
    invalidTip: 'Make sure you copied the full link',

    // Admin
    adminTeams: 'Teams',
    adminTeamsSubtitle: 'Manage your lab experiments',
    adminNewTeam: 'New experiment',
    adminNoTeams: 'No experiments yet',
    adminNoTeamsMessage: 'Start your first Pulse experiment.',
    adminFirstTeam: 'Start first experiment',
    adminBack: 'Back',
    adminCreatedOn: 'Started',
    adminParticipants: 'contributors',
    adminToday: 'today',
    adminActive: 'Active',
    adminLogout: 'Log out',

    // New Pulse form
    newTeamTitle: 'New experiment',
    newTeamName: 'Team name',
    newTeamNamePlaceholder: 'e.g. Sprint Team Alpha',
    newTeamDescription: 'Description (optional)',
    newTeamDescriptionPlaceholder: 'Short description',
    newTeamSize: 'Team size (optional)',
    newTeamSizePlaceholder: 'e.g. 8',
    newTeamSizeHelp: 'For accurate participation %',
    newTeamCreate: 'Start experiment',
    newTeamCreating: 'Starting...',

    // Stats
    statsTitle: 'Lab results',
    statsToday: 'Today',
    statsWeek: 'This week',
    statsAvgMood: 'Avg. purity',
    statsCheckins: 'Samples',
    statsParticipation: 'Participation',
    statsNoData: 'No samples yet',

    // Share link
    shareTitle: 'Lab access',
    shareDescription: 'Share this link with your team.',
    shareOpen: 'Open Pulse',
    shareCopy: 'Copy',
    shareCopied: 'Copied!',
    shareAdvanced: 'Advanced',
    shareResetTitle: 'Reset link',
    shareResetInfo: 'Use this if the link was shared with the wrong people. The old link will stop working immediately.',
    shareResetButton: 'Reset link',
    shareResetConfirm: 'Reset link?',
    shareResetWarning: 'The current link will stop working immediately. Team members will need to use the new link.',
    shareResetCancel: 'Cancel',
    shareResetYes: 'Yes, reset',
    shareResetSuccess: 'New formula generated',
    shareNoLink: 'No active link',

    // Team actions
    teamDelete: 'Delete',
    teamDeleteConfirm: 'Are you sure you want to stop this experiment?',
    teamReset: 'Clear data',
    teamResetTitle: 'Reset lab',
    teamResetMessage: 'All samples and contributors will be removed. The access link will keep working.',
    teamResetButton: 'Clear',
    teamDeleteTitle: 'Stop experiment',
    teamDeleteMessage: 'Are you sure you want to stop this experiment? This cannot be undone.',
    teamDeleteButton: 'Stop',
    teamSettings: 'Settings',
    teamSettingsSaved: 'Saved',

    // Stats
    statsParticipants: 'Lab members',
    statsCheckinsToday: 'Samples today',
    statsMoodScale: 'Purity scale',
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.nl
