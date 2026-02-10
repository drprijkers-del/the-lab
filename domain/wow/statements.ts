/**
 * Delta Statements
 *
 * Sharp, observable statements for each angle × level combination.
 *
 * Shu-Ha-Ri progression:
 * - Shu (守): Basic practices - "Are we doing the fundamentals?"
 * - Ha (破): Adaptive practices - "Are we improving intentionally?"
 * - Ri (離): Mastery practices - "Are we creating our own approach?"
 *
 * Design principles:
 * 1. Sharp, not soft - No "Do you feel..." language
 * 2. Observable behaviors - Things you can see, not feel
 * 3. Binary provable - Could be verified by observation
 * 4. No escape hatch - Avoid "sometimes" or "usually"
 * 5. Present tense - About now, not aspirational
 */

import { Statement, WowAngle, WowLevel } from './types'

// ============================================
// SHU LEVEL STATEMENTS (守) - Learn the basics
// ============================================

const shuStatements: Statement[] = [
  // Scrum - Shu
  { id: 'scrum_shu_1', angle: 'scrum', level: 'shu', text: 'The Sprint Goal was achieved last Sprint', textNL: 'Het Sprint Doel is vorige Sprint behaald' },
  { id: 'scrum_shu_2', angle: 'scrum', level: 'shu', text: 'The Daily Scrum takes less than 15 minutes', textNL: 'De Daily Scrum duurt minder dan 15 minuten' },
  { id: 'scrum_shu_3', angle: 'scrum', level: 'shu', text: 'The Product Owner was available for questions last Sprint', textNL: 'De Product Owner was beschikbaar voor vragen vorige Sprint' },
  { id: 'scrum_shu_4', angle: 'scrum', level: 'shu', text: 'Sprint scope did not change after Sprint Planning', textNL: 'De Sprint scope is niet veranderd na Sprint Planning' },
  { id: 'scrum_shu_5', angle: 'scrum', level: 'shu', text: 'The Retrospective produced at least one concrete action', textNL: 'De Retrospective leverde minstens één concrete actie op' },

  // Flow - Shu
  { id: 'flow_shu_1', angle: 'flow', level: 'shu', text: 'I worked on only one item at a time last week', textNL: 'Ik werkte afgelopen week aan maar één item tegelijk' },
  { id: 'flow_shu_2', angle: 'flow', level: 'shu', text: 'Items move from In Progress to Done within 3 days', textNL: 'Items gaan binnen 3 dagen van In Progress naar Done' },
  { id: 'flow_shu_3', angle: 'flow', level: 'shu', text: 'Code reviews happen within 4 hours', textNL: 'Code reviews gebeuren binnen 4 uur' },
  { id: 'flow_shu_4', angle: 'flow', level: 'shu', text: 'I know exactly what I should work on next', textNL: 'Ik weet precies waar ik als volgende aan moet werken' },
  { id: 'flow_shu_5', angle: 'flow', level: 'shu', text: 'The board reflects reality right now', textNL: 'Het bord weerspiegelt op dit moment de werkelijkheid' },

  // Ownership - Shu
  { id: 'own_shu_1', angle: 'ownership', level: 'shu', text: 'I know who is on-call and how to reach them', textNL: 'Ik weet wie bereikbaar is en hoe ik diegene kan bereiken' },
  { id: 'own_shu_2', angle: 'ownership', level: 'shu', text: 'I have access to production logs', textNL: 'Ik heb toegang tot productie logs' },
  { id: 'own_shu_3', angle: 'ownership', level: 'shu', text: 'The team decides how to do the work, not external leads', textNL: 'Het team bepaalt hoe het werk gedaan wordt, niet externe leads' },
  { id: 'own_shu_4', angle: 'ownership', level: 'shu', text: 'When something breaks, we fix it first and blame never', textNL: 'Als iets kapot gaat, fixen we het eerst en wijzen we nooit met de vinger' },
  { id: 'own_shu_5', angle: 'ownership', level: 'shu', text: 'I understand our team\'s main responsibilities', textNL: 'Ik begrijp de belangrijkste verantwoordelijkheden van ons team' },

  // Collaboration - Shu
  { id: 'collab_shu_1', angle: 'collaboration', level: 'shu', text: 'I asked for help when I was stuck', textNL: 'Ik vroeg om hulp toen ik vastzat' },
  { id: 'collab_shu_2', angle: 'collaboration', level: 'shu', text: 'Someone asked me for help this week', textNL: 'Iemand vroeg mij deze week om hulp' },
  { id: 'collab_shu_3', angle: 'collaboration', level: 'shu', text: 'I know what my teammates are working on right now', textNL: 'Ik weet waar mijn teamgenoten nu aan werken' },
  { id: 'collab_shu_4', angle: 'collaboration', level: 'shu', text: 'In the last Retro, everyone spoke at least once', textNL: 'In de laatste Retro sprak iedereen minstens één keer' },
  { id: 'collab_shu_5', angle: 'collaboration', level: 'shu', text: 'Knowledge is documented, not just in people\'s heads', textNL: 'Kennis is gedocumenteerd, niet alleen in hoofden van mensen' },

  // Technical Excellence - Shu
  { id: 'tech_shu_1', angle: 'technical_excellence', level: 'shu', text: 'All code changes have automated tests', textNL: 'Alle codewijzigingen hebben geautomatiseerde tests' },
  { id: 'tech_shu_2', angle: 'technical_excellence', level: 'shu', text: 'I can run the full system locally', textNL: 'Ik kan het volledige systeem lokaal draaien' },
  { id: 'tech_shu_3', angle: 'technical_excellence', level: 'shu', text: 'We have clear coding standards that we follow', textNL: 'We hebben duidelijke codestandaarden die we volgen' },
  { id: 'tech_shu_4', angle: 'technical_excellence', level: 'shu', text: 'Documentation is updated when code changes', textNL: 'Documentatie wordt bijgewerkt als code verandert' },
  { id: 'tech_shu_5', angle: 'technical_excellence', level: 'shu', text: 'The test suite runs in under 10 minutes', textNL: 'De test suite draait in minder dan 10 minuten' },

  // Refinement - Shu
  { id: 'ref_shu_1', angle: 'refinement', level: 'shu', text: 'Stories have clear acceptance criteria before entering the Sprint', textNL: 'Stories hebben duidelijke acceptatiecriteria vóór de Sprint' },
  { id: 'ref_shu_2', angle: 'refinement', level: 'shu', text: 'The team understands the "why" behind each story', textNL: 'Het team begrijpt het "waarom" achter elke story' },
  { id: 'ref_shu_3', angle: 'refinement', level: 'shu', text: 'Stories are small enough to complete in 2-3 days', textNL: 'Stories zijn klein genoeg om in 2-3 dagen af te ronden' },
  { id: 'ref_shu_4', angle: 'refinement', level: 'shu', text: 'Refinement sessions are timeboxed and productive', textNL: 'Refinement sessies zijn timeboxed en productief' },
  { id: 'ref_shu_5', angle: 'refinement', level: 'shu', text: 'The backlog has at least 2 Sprints worth of ready items', textNL: 'De backlog heeft minstens 2 Sprints aan ready items' },

  // Planning - Shu
  { id: 'plan_shu_1', angle: 'planning', level: 'shu', text: 'The Sprint Goal is clear and achievable', textNL: 'Het Sprint Doel is duidelijk en haalbaar' },
  { id: 'plan_shu_2', angle: 'planning', level: 'shu', text: 'The team committed to scope they believe in', textNL: 'Het team committeerde zich aan scope waar ze in geloven' },
  { id: 'plan_shu_3', angle: 'planning', level: 'shu', text: 'Capacity for planned absences was accounted for', textNL: 'Er is rekening gehouden met geplande afwezigheid' },
  { id: 'plan_shu_4', angle: 'planning', level: 'shu', text: 'Planning took less than 2 hours', textNL: 'Planning duurde minder dan 2 uur' },
  { id: 'plan_shu_5', angle: 'planning', level: 'shu', text: 'Everyone in the team participated in planning discussions', textNL: 'Iedereen in het team deed mee aan de planningsdiscussie' },

  // Retro - Shu
  { id: 'retro_shu_1', angle: 'retro', level: 'shu', text: 'The last Retro produced at least one concrete action', textNL: 'De laatste Retro leverde minstens één concrete actie op' },
  { id: 'retro_shu_2', angle: 'retro', level: 'shu', text: 'Retro actions from last Sprint were completed', textNL: 'Retro-acties van vorige Sprint zijn afgerond' },
  { id: 'retro_shu_3', angle: 'retro', level: 'shu', text: 'Everyone felt safe to speak up in the Retro', textNL: 'Iedereen voelde zich veilig om te spreken in de Retro' },
  { id: 'retro_shu_4', angle: 'retro', level: 'shu', text: 'Retro actions have clear owners', textNL: 'Retro-acties hebben duidelijke eigenaren' },
  { id: 'retro_shu_5', angle: 'retro', level: 'shu', text: 'Positive things were celebrated, not just problems', textNL: 'Positieve dingen werden gevierd, niet alleen problemen' },

  // Demo - Shu
  { id: 'demo_shu_1', angle: 'demo', level: 'shu', text: 'Stakeholders attended the last Sprint Review', textNL: 'Stakeholders waren aanwezig bij de laatste Sprint Review' },
  { id: 'demo_shu_2', angle: 'demo', level: 'shu', text: 'The demo showed working software, not slides', textNL: 'De demo toonde werkende software, geen slides' },
  { id: 'demo_shu_3', angle: 'demo', level: 'shu', text: 'The Sprint Goal was clearly demonstrated', textNL: 'Het Sprint Doel werd duidelijk gedemonstreerd' },
  { id: 'demo_shu_4', angle: 'demo', level: 'shu', text: 'Developers presented their own work', textNL: 'Developers presenteerden hun eigen werk' },
  { id: 'demo_shu_5', angle: 'demo', level: 'shu', text: 'The demo was timeboxed and focused', textNL: 'De demo was timeboxed en gefocust' },

  // Obeya - Shu
  { id: 'obeya_shu_1', angle: 'obeya', level: 'shu', text: 'Our team goals are visible to everyone in one place', textNL: 'Onze teamdoelen zijn zichtbaar voor iedereen op één plek' },
  { id: 'obeya_shu_2', angle: 'obeya', level: 'shu', text: 'Progress toward sprint goals is updated daily on a shared board', textNL: 'Voortgang richting sprintdoelen wordt dagelijks bijgewerkt op een gedeeld bord' },
  { id: 'obeya_shu_3', angle: 'obeya', level: 'shu', text: 'Impediments are made visible as soon as they arise', textNL: 'Impediments worden zichtbaar gemaakt zodra ze ontstaan' },
  { id: 'obeya_shu_4', angle: 'obeya', level: 'shu', text: 'Key metrics are displayed where the team can see them', textNL: 'Belangrijke metrics zijn zichtbaar voor het team' },
  { id: 'obeya_shu_5', angle: 'obeya', level: 'shu', text: 'We have a regular cadence where the team gathers around shared visuals', textNL: 'We komen regelmatig samen rondom gedeelde visuele overzichten' },

  // Dependencies - Shu
  { id: 'dep_shu_1', angle: 'dependencies', level: 'shu', text: 'We know which teams depend on us and which we depend on', textNL: 'We weten welke teams van ons afhankelijk zijn en andersom' },
  { id: 'dep_shu_2', angle: 'dependencies', level: 'shu', text: 'Dependencies are identified before work starts', textNL: 'Afhankelijkheden worden geïdentificeerd vóórdat het werk begint' },
  { id: 'dep_shu_3', angle: 'dependencies', level: 'shu', text: 'We communicate blockers to dependent teams within hours', textNL: 'We communiceren blockers naar afhankelijke teams binnen uren' },
  { id: 'dep_shu_4', angle: 'dependencies', level: 'shu', text: 'Cross-team handoffs have clear ownership', textNL: 'Cross-team overdrachten hebben duidelijk eigenaarschap' },
  { id: 'dep_shu_5', angle: 'dependencies', level: 'shu', text: 'We attend cross-team sync meetings when relevant', textNL: 'We nemen deel aan cross-team syncs wanneer relevant' },

  // Psychological Safety - Shu
  { id: 'psych_shu_1', angle: 'psychological_safety', level: 'shu', text: 'I can admit mistakes without fear of blame', textNL: 'Ik kan fouten toegeven zonder angst voor verwijten' },
  { id: 'psych_shu_2', angle: 'psychological_safety', level: 'shu', text: 'Disagreement is expressed openly in team meetings', textNL: 'Onenigheid wordt openlijk geuit in teamoverleggen' },
  { id: 'psych_shu_3', angle: 'psychological_safety', level: 'shu', text: 'Questions are welcomed, not dismissed', textNL: 'Vragen worden verwelkomd, niet afgewezen' },
  { id: 'psych_shu_4', angle: 'psychological_safety', level: 'shu', text: 'Team members speak up when they see a problem', textNL: 'Teamleden spreken zich uit als ze een probleem zien' },
  { id: 'psych_shu_5', angle: 'psychological_safety', level: 'shu', text: 'Nobody was interrupted or talked over in the last meeting', textNL: 'Niemand werd onderbroken of overstemd in het laatste overleg' },

  // DevOps - Shu
  { id: 'devops_shu_1', angle: 'devops', level: 'shu', text: 'We deploy to production at least once a week', textNL: 'We deployen minstens één keer per week naar productie' },
  { id: 'devops_shu_2', angle: 'devops', level: 'shu', text: 'Our CI pipeline runs on every pull request', textNL: 'Onze CI pipeline draait bij elk pull request' },
  { id: 'devops_shu_3', angle: 'devops', level: 'shu', text: 'Monitoring alerts go to the team, not just ops', textNL: 'Monitoring alerts gaan naar het team, niet alleen naar ops' },
  { id: 'devops_shu_4', angle: 'devops', level: 'shu', text: 'We have runbooks for common incidents', textNL: 'We hebben runbooks voor veelvoorkomende incidenten' },
  { id: 'devops_shu_5', angle: 'devops', level: 'shu', text: 'Deployments require no manual steps', textNL: 'Deployments vereisen geen handmatige stappen' },

  // Stakeholder - Shu
  { id: 'stake_shu_1', angle: 'stakeholder', level: 'shu', text: 'Stakeholders know when and how to reach the team', textNL: 'Stakeholders weten wanneer en hoe ze het team kunnen bereiken' },
  { id: 'stake_shu_2', angle: 'stakeholder', level: 'shu', text: 'We share progress updates at least once per sprint', textNL: 'We delen voortgangsupdates minstens één keer per sprint' },
  { id: 'stake_shu_3', angle: 'stakeholder', level: 'shu', text: 'Stakeholder feedback is captured and added to the backlog', textNL: 'Stakeholder feedback wordt vastgelegd en aan de backlog toegevoegd' },
  { id: 'stake_shu_4', angle: 'stakeholder', level: 'shu', text: 'The Product Owner represents stakeholder needs in planning', textNL: 'De Product Owner vertegenwoordigt stakeholderbehoeften in de planning' },
  { id: 'stake_shu_5', angle: 'stakeholder', level: 'shu', text: 'We know who our key stakeholders are and what they need', textNL: 'We weten wie onze belangrijkste stakeholders zijn en wat ze nodig hebben' },

  // Leadership - Shu
  { id: 'lead_shu_1', angle: 'leadership', level: 'shu', text: 'Leaders communicate clear priorities to their teams', textNL: 'Leiders communiceren duidelijke prioriteiten naar hun teams' },
  { id: 'lead_shu_2', angle: 'leadership', level: 'shu', text: 'One-on-ones happen regularly and are not cancelled', textNL: 'One-on-ones vinden regelmatig plaats en worden niet afgezegd' },
  { id: 'lead_shu_3', angle: 'leadership', level: 'shu', text: 'Leaders remove blockers when teams escalate', textNL: 'Leiders verwijderen blockers wanneer teams escaleren' },
  { id: 'lead_shu_4', angle: 'leadership', level: 'shu', text: 'Team members know the organizational direction', textNL: 'Teamleden kennen de richting van de organisatie' },
  { id: 'lead_shu_5', angle: 'leadership', level: 'shu', text: 'Leaders attend team demos and retrospectives', textNL: 'Leiders wonen teamdemo\'s en retrospectives bij' },
]

// ============================================
// HA LEVEL STATEMENTS (破) - Adapt intentionally
// ============================================

const haStatements: Statement[] = [
  // Scrum - Ha
  { id: 'scrum_ha_1', angle: 'scrum', level: 'ha', text: 'We adapted Scrum events to better fit our context', textNL: 'We hebben Scrum events aangepast aan onze context' },
  { id: 'scrum_ha_2', angle: 'scrum', level: 'ha', text: 'The team experiments with different meeting formats', textNL: 'Het team experimenteert met verschillende vergadervormen' },
  { id: 'scrum_ha_3', angle: 'scrum', level: 'ha', text: 'We measure and track our own velocity or throughput', textNL: 'We meten en volgen onze eigen velocity of throughput' },
  { id: 'scrum_ha_4', angle: 'scrum', level: 'ha', text: 'Sprint length was chosen based on our delivery needs', textNL: 'Sprintlengte is gekozen op basis van onze leverbehoeften' },
  { id: 'scrum_ha_5', angle: 'scrum', level: 'ha', text: 'We consciously break rules when it makes sense', textNL: 'We breken bewust regels als het zinvol is' },

  // Flow - Ha
  { id: 'flow_ha_1', angle: 'flow', level: 'ha', text: 'WIP limits are enforced, not ignored', textNL: 'WIP limieten worden gehandhaafd, niet genegeerd' },
  { id: 'flow_ha_2', angle: 'flow', level: 'ha', text: 'We track cycle time and act on the data', textNL: 'We meten cycle time en handelen op basis van de data' },
  { id: 'flow_ha_3', angle: 'flow', level: 'ha', text: 'Blockers are escalated within hours, not days', textNL: 'Blockers worden binnen uren geëscaleerd, niet dagen' },
  { id: 'flow_ha_4', angle: 'flow', level: 'ha', text: 'We visualize bottlenecks and address them systematically', textNL: 'We visualiseren bottlenecks en pakken ze systematisch aan' },
  { id: 'flow_ha_5', angle: 'flow', level: 'ha', text: 'Deployments happen at least weekly', textNL: 'Deployments vinden minstens wekelijks plaats' },

  // Ownership - Ha
  { id: 'own_ha_1', angle: 'ownership', level: 'ha', text: 'I can deploy my code to production without asking permission', textNL: 'Ik kan mijn code naar productie deployen zonder toestemming te vragen' },
  { id: 'own_ha_2', angle: 'ownership', level: 'ha', text: 'I fixed a bug last week without being assigned to it', textNL: 'Ik heb vorige week een bug gefixt zonder dat die aan mij was toegewezen' },
  { id: 'own_ha_3', angle: 'ownership', level: 'ha', text: 'The team owns the backlog prioritization, not just the PO', textNL: 'Het team is eigenaar van de backlog prioritering, niet alleen de PO' },
  { id: 'own_ha_4', angle: 'ownership', level: 'ha', text: 'I participated in an incident review this quarter', textNL: 'Ik heb dit kwartaal deelgenomen aan een incident review' },
  { id: 'own_ha_5', angle: 'ownership', level: 'ha', text: 'I refactored code this month that I did not originally write', textNL: 'Ik heb deze maand code gerefactord die ik niet oorspronkelijk schreef' },

  // Collaboration - Ha
  { id: 'collab_ha_1', angle: 'collaboration', level: 'ha', text: 'I paired with a teammate on a task this week', textNL: 'Ik heb deze week gepaird met een teamgenoot aan een taak' },
  { id: 'collab_ha_2', angle: 'collaboration', level: 'ha', text: 'I received specific feedback on my work this week', textNL: 'Ik heb deze week specifieke feedback op mijn werk gekregen' },
  { id: 'collab_ha_3', angle: 'collaboration', level: 'ha', text: 'Disagreements are discussed openly, not avoided', textNL: 'Meningsverschillen worden openlijk besproken, niet vermeden' },
  { id: 'collab_ha_4', angle: 'collaboration', level: 'ha', text: 'New team members can contribute within their first week', textNL: 'Nieuwe teamleden kunnen in hun eerste week bijdragen' },
  { id: 'collab_ha_5', angle: 'collaboration', level: 'ha', text: 'We celebrate wins together, not just individually', textNL: 'We vieren successen samen, niet alleen individueel' },

  // Technical Excellence - Ha
  { id: 'tech_ha_1', angle: 'technical_excellence', level: 'ha', text: 'I refactored something this week without being asked', textNL: 'Ik heb deze week iets gerefactord zonder dat het gevraagd werd' },
  { id: 'tech_ha_2', angle: 'technical_excellence', level: 'ha', text: 'Technical debt is tracked and prioritized', textNL: 'Technische schuld wordt bijgehouden en geprioriteerd' },
  { id: 'tech_ha_3', angle: 'technical_excellence', level: 'ha', text: 'We can roll back a bad deploy in under 5 minutes', textNL: 'We kunnen een slechte deploy terugdraaien in minder dan 5 minuten' },
  { id: 'tech_ha_4', angle: 'technical_excellence', level: 'ha', text: 'We review architecture decisions as a team', textNL: 'We reviewen architectuurbeslissingen als team' },
  { id: 'tech_ha_5', angle: 'technical_excellence', level: 'ha', text: 'Deployments are boring, not scary', textNL: 'Deployments zijn saai, niet spannend' },

  // Refinement - Ha
  { id: 'ref_ha_1', angle: 'refinement', level: 'ha', text: 'Technical dependencies are identified before Sprint Planning', textNL: 'Technische afhankelijkheden worden vóór Sprint Planning geïdentificeerd' },
  { id: 'ref_ha_2', angle: 'refinement', level: 'ha', text: 'The PO prioritizes based on value, not gut feeling', textNL: 'De PO prioriteert op basis van waarde, niet op onderbuikgevoel' },
  { id: 'ref_ha_3', angle: 'refinement', level: 'ha', text: 'Edge cases are discussed during refinement, not during development', textNL: 'Edge cases worden besproken tijdens refinement, niet tijdens development' },
  { id: 'ref_ha_4', angle: 'refinement', level: 'ha', text: 'Developers ask clarifying questions during refinement', textNL: 'Developers stellen verduidelijkende vragen tijdens refinement' },
  { id: 'ref_ha_5', angle: 'refinement', level: 'ha', text: 'Stories are estimated by the whole team, not one person', textNL: 'Stories worden geschat door het hele team, niet door één persoon' },

  // Planning - Ha
  { id: 'plan_ha_1', angle: 'planning', level: 'ha', text: 'Sprint Planning ends with a shared plan, not assigned tasks', textNL: 'Sprint Planning eindigt met een gedeeld plan, niet met toegewezen taken' },
  { id: 'plan_ha_2', angle: 'planning', level: 'ha', text: 'The Sprint Goal connects to a business outcome', textNL: 'Het Sprint Doel is gekoppeld aan een business outcome' },
  { id: 'plan_ha_3', angle: 'planning', level: 'ha', text: 'We discussed how we will achieve the goal, not just what', textNL: 'We bespraken hoe we het doel bereiken, niet alleen wat' },
  { id: 'plan_ha_4', angle: 'planning', level: 'ha', text: 'Dependencies on other teams were identified and addressed', textNL: 'Afhankelijkheden van andere teams zijn geïdentificeerd en aangepakt' },
  { id: 'plan_ha_5', angle: 'planning', level: 'ha', text: 'The Sprint Backlog is realistic, not aspirational', textNL: 'De Sprint Backlog is realistisch, niet aspirationeel' },

  // Retro - Ha
  { id: 'retro_ha_1', angle: 'retro', level: 'ha', text: 'We discussed root causes, not just symptoms', textNL: 'We bespraken oorzaken, niet alleen symptomen' },
  { id: 'retro_ha_2', angle: 'retro', level: 'ha', text: 'The Retro format varies to keep it fresh', textNL: 'Het Retro-format varieert om het fris te houden' },
  { id: 'retro_ha_3', angle: 'retro', level: 'ha', text: 'The Scrum Master facilitates, not dominates', textNL: 'De Scrum Master faciliteert, domineert niet' },
  { id: 'retro_ha_4', angle: 'retro', level: 'ha', text: 'We learn from what went well, not just what went wrong', textNL: 'We leren van wat goed ging, niet alleen van wat fout ging' },
  { id: 'retro_ha_5', angle: 'retro', level: 'ha', text: 'The team decided on actions, not the Scrum Master', textNL: 'Het team besloot over acties, niet de Scrum Master' },

  // Demo - Ha
  { id: 'demo_ha_1', angle: 'demo', level: 'ha', text: 'Stakeholder feedback was captured and added to the backlog', textNL: 'Stakeholder feedback is vastgelegd en aan de backlog toegevoegd' },
  { id: 'demo_ha_2', angle: 'demo', level: 'ha', text: 'Stakeholders asked questions during the demo', textNL: 'Stakeholders stelden vragen tijdens de demo' },
  { id: 'demo_ha_3', angle: 'demo', level: 'ha', text: 'The PO confirmed whether the Sprint Goal was met', textNL: 'De PO bevestigde of het Sprint Doel is behaald' },
  { id: 'demo_ha_4', angle: 'demo', level: 'ha', text: 'Future direction was discussed based on what was learned', textNL: 'Toekomstige richting werd besproken op basis van wat we leerden' },
  { id: 'demo_ha_5', angle: 'demo', level: 'ha', text: 'Incomplete work was shown transparently, not hidden', textNL: 'Onaf werk werd transparant getoond, niet verborgen' },

  // Obeya - Ha
  { id: 'obeya_ha_1', angle: 'obeya', level: 'ha', text: 'Our visual boards drive the conversation, not replace it', textNL: 'Onze visuele borden sturen het gesprek, niet vervangen het' },
  { id: 'obeya_ha_2', angle: 'obeya', level: 'ha', text: 'We update our metrics based on what we learn, not habit', textNL: 'We updaten onze metrics op basis van wat we leren, niet uit gewoonte' },
  { id: 'obeya_ha_3', angle: 'obeya', level: 'ha', text: 'Cross-team dependencies are visualized and actively managed', textNL: 'Cross-team afhankelijkheden zijn gevisualiseerd en actief gemanaged' },
  { id: 'obeya_ha_4', angle: 'obeya', level: 'ha', text: 'Our Obeya reflects current reality, not last week\'s truth', textNL: 'Onze Obeya weerspiegelt de huidige realiteit, niet de waarheid van vorige week' },
  { id: 'obeya_ha_5', angle: 'obeya', level: 'ha', text: 'Stakeholders visit our Obeya to understand our situation', textNL: 'Stakeholders bezoeken onze Obeya om onze situatie te begrijpen' },

  // Dependencies - Ha
  { id: 'dep_ha_1', angle: 'dependencies', level: 'ha', text: 'We proactively reduce dependencies through API contracts', textNL: 'We reduceren proactief afhankelijkheden via API contracts' },
  { id: 'dep_ha_2', angle: 'dependencies', level: 'ha', text: 'Dependency risks are tracked and mitigated before they block', textNL: 'Afhankelijkheidsrisico\'s worden gevolgd en gemitigeerd voordat ze blokkeren' },
  { id: 'dep_ha_3', angle: 'dependencies', level: 'ha', text: 'We negotiate delivery timelines directly with other teams', textNL: 'We onderhandelen leveringstijdlijnen direct met andere teams' },
  { id: 'dep_ha_4', angle: 'dependencies', level: 'ha', text: 'Integration testing with dependent teams happens regularly', textNL: 'Integratietesten met afhankelijke teams vinden regelmatig plaats' },
  { id: 'dep_ha_5', angle: 'dependencies', level: 'ha', text: 'We visualize our dependency map and keep it current', textNL: 'We visualiseren onze dependency map en houden deze actueel' },

  // Psychological Safety - Ha
  { id: 'psych_ha_1', angle: 'psychological_safety', level: 'ha', text: 'We give each other direct, honest feedback regularly', textNL: 'We geven elkaar regelmatig directe, eerlijke feedback' },
  { id: 'psych_ha_2', angle: 'psychological_safety', level: 'ha', text: 'Failed experiments are discussed as learning opportunities', textNL: 'Mislukte experimenten worden besproken als leermomenten' },
  { id: 'psych_ha_3', angle: 'psychological_safety', level: 'ha', text: 'Junior members challenge senior members\' ideas', textNL: 'Junior leden dagen ideeën van senior leden uit' },
  { id: 'psych_ha_4', angle: 'psychological_safety', level: 'ha', text: 'We discuss interpersonal tensions, not just technical problems', textNL: 'We bespreken interpersoonlijke spanningen, niet alleen technische problemen' },
  { id: 'psych_ha_5', angle: 'psychological_safety', level: 'ha', text: 'Vulnerability is treated as strength, not weakness', textNL: 'Kwetsbaarheid wordt gezien als kracht, niet als zwakte' },

  // DevOps - Ha
  { id: 'devops_ha_1', angle: 'devops', level: 'ha', text: 'We can deploy multiple times per day without coordination', textNL: 'We kunnen meerdere keren per dag deployen zonder coördinatie' },
  { id: 'devops_ha_2', angle: 'devops', level: 'ha', text: 'Feature flags separate deployment from release', textNL: 'Feature flags scheiden deployment van release' },
  { id: 'devops_ha_3', angle: 'devops', level: 'ha', text: 'We own our infrastructure configuration as code', textNL: 'We beheren onze infrastructuurconfiguratie als code' },
  { id: 'devops_ha_4', angle: 'devops', level: 'ha', text: 'Mean time to recovery is under one hour', textNL: 'Gemiddelde hersteltijd is minder dan één uur' },
  { id: 'devops_ha_5', angle: 'devops', level: 'ha', text: 'We review production metrics after every deployment', textNL: 'We reviewen productie metrics na elke deployment' },

  // Stakeholder - Ha
  { id: 'stake_ha_1', angle: 'stakeholder', level: 'ha', text: 'We invite stakeholders to give feedback on working software', textNL: 'We nodigen stakeholders uit om feedback te geven op werkende software' },
  { id: 'stake_ha_2', angle: 'stakeholder', level: 'ha', text: 'Stakeholder expectations are managed proactively, not reactively', textNL: 'Stakeholderverwachtingen worden proactief gemanaged, niet reactief' },
  { id: 'stake_ha_3', angle: 'stakeholder', level: 'ha', text: 'We say no to requests that conflict with the Sprint Goal', textNL: 'We zeggen nee tegen verzoeken die conflicteren met het Sprint Doel' },
  { id: 'stake_ha_4', angle: 'stakeholder', level: 'ha', text: 'We present trade-offs and options, not just solutions', textNL: 'We presenteren afwegingen en opties, niet alleen oplossingen' },
  { id: 'stake_ha_5', angle: 'stakeholder', level: 'ha', text: 'Stakeholders trust the team to make technical decisions', textNL: 'Stakeholders vertrouwen het team om technische beslissingen te nemen' },

  // Leadership - Ha
  { id: 'lead_ha_1', angle: 'leadership', level: 'ha', text: 'Leaders create space for teams to make their own decisions', textNL: 'Leiders creëren ruimte voor teams om eigen beslissingen te nemen' },
  { id: 'lead_ha_2', angle: 'leadership', level: 'ha', text: 'Feedback flows both ways between leaders and teams', textNL: 'Feedback stroomt twee kanten op tussen leiders en teams' },
  { id: 'lead_ha_3', angle: 'leadership', level: 'ha', text: 'Leaders experiment with different leadership styles', textNL: 'Leiders experimenteren met verschillende leiderschapsstijlen' },
  { id: 'lead_ha_4', angle: 'leadership', level: 'ha', text: 'Strategic trade-offs are communicated transparently', textNL: 'Strategische afwegingen worden transparant gecommuniceerd' },
  { id: 'lead_ha_5', angle: 'leadership', level: 'ha', text: 'Leaders actively coach, not just manage', textNL: 'Leiders coachen actief, niet alleen managen' },
]

// ============================================
// RI LEVEL STATEMENTS (離) - Mastery & own approach
// ============================================

const riStatements: Statement[] = [
  // Scrum - Ri
  { id: 'scrum_ri_1', angle: 'scrum', level: 'ri', text: 'We created our own cadence that transcends Scrum', textNL: 'We hebben een eigen cadans gecreëerd die Scrum overstijgt' },
  { id: 'scrum_ri_2', angle: 'scrum', level: 'ri', text: 'The team self-organizes without needing a Scrum Master', textNL: 'Het team organiseert zichzelf zonder Scrum Master nodig te hebben' },
  { id: 'scrum_ri_3', angle: 'scrum', level: 'ri', text: 'We coach other teams on effective practices', textNL: 'We coachen andere teams in effectieve werkwijzen' },
  { id: 'scrum_ri_4', angle: 'scrum', level: 'ri', text: 'Our process evolved from team experimentation', textNL: 'Ons proces is geëvolueerd uit team-experimentatie' },
  { id: 'scrum_ri_5', angle: 'scrum', level: 'ri', text: 'We deliver value continuously, not just at Sprint end', textNL: 'We leveren continu waarde, niet alleen aan het einde van de Sprint' },

  // Flow - Ri
  { id: 'flow_ri_1', angle: 'flow', level: 'ri', text: 'We optimize for flow across the entire value stream', textNL: 'We optimaliseren flow over de hele waardeketen' },
  { id: 'flow_ri_2', angle: 'flow', level: 'ri', text: 'We proactively identify and remove systemic bottlenecks', textNL: 'We identificeren en verwijderen proactief systemische bottlenecks' },
  { id: 'flow_ri_3', angle: 'flow', level: 'ri', text: 'Lead time is predictable within a narrow range', textNL: 'Lead time is voorspelbaar binnen een nauwe bandbreedte' },
  { id: 'flow_ri_4', angle: 'flow', level: 'ri', text: 'We help other teams improve their flow', textNL: 'We helpen andere teams hun flow te verbeteren' },
  { id: 'flow_ri_5', angle: 'flow', level: 'ri', text: 'Continuous deployment is the default, not the exception', textNL: 'Continuous deployment is de standaard, niet de uitzondering' },

  // Ownership - Ri
  { id: 'own_ri_1', angle: 'ownership', level: 'ri', text: 'I can create a new service without filing a ticket', textNL: 'Ik kan een nieuwe service opzetten zonder een ticket aan te maken' },
  { id: 'own_ri_2', angle: 'ownership', level: 'ri', text: 'The team decided on technical approach, not a lead or architect', textNL: 'Het team bepaalde de technische aanpak, niet een lead of architect' },
  { id: 'own_ri_3', angle: 'ownership', level: 'ri', text: 'We define our own success metrics', textNL: 'We definiëren onze eigen succesmetrics' },
  { id: 'own_ri_4', angle: 'ownership', level: 'ri', text: 'We proactively reach out to stakeholders before they ask', textNL: 'We benaderen proactief stakeholders voordat ze erom vragen' },
  { id: 'own_ri_5', angle: 'ownership', level: 'ri', text: 'We sunset our own features when they no longer serve users', textNL: 'We faseren eigen features uit als ze gebruikers niet meer dienen' },

  // Collaboration - Ri
  { id: 'collab_ri_1', angle: 'collaboration', level: 'ri', text: 'We actively mentor team members and others outside our team', textNL: 'We mentoren actief teamleden en anderen buiten ons team' },
  { id: 'collab_ri_2', angle: 'collaboration', level: 'ri', text: 'Our team is sought out for advice by other teams', textNL: 'Ons team wordt door andere teams opgezocht voor advies' },
  { id: 'collab_ri_3', angle: 'collaboration', level: 'ri', text: 'We have created cross-team communities of practice', textNL: 'We hebben cross-team communities of practice opgezet' },
  { id: 'collab_ri_4', angle: 'collaboration', level: 'ri', text: 'Psychological safety is something we actively cultivate', textNL: 'Psychologische veiligheid is iets dat we actief cultiveren' },
  { id: 'collab_ri_5', angle: 'collaboration', level: 'ri', text: 'We adapt our collaboration style based on the situation', textNL: 'We passen onze samenwerkingsstijl aan op basis van de situatie' },

  // Technical Excellence - Ri
  { id: 'tech_ri_1', angle: 'technical_excellence', level: 'ri', text: 'We contribute to our organization\'s technical standards', textNL: 'We dragen bij aan de technische standaarden van onze organisatie' },
  { id: 'tech_ri_2', angle: 'technical_excellence', level: 'ri', text: 'We build tools that other teams use', textNL: 'We bouwen tools die andere teams gebruiken' },
  { id: 'tech_ri_3', angle: 'technical_excellence', level: 'ri', text: 'Our codebase is an example others learn from', textNL: 'Onze codebase is een voorbeeld waar anderen van leren' },
  { id: 'tech_ri_4', angle: 'technical_excellence', level: 'ri', text: 'We experiment with new technologies and share learnings', textNL: 'We experimenteren met nieuwe technologieën en delen onze leerpunten' },
  { id: 'tech_ri_5', angle: 'technical_excellence', level: 'ri', text: 'We proactively improve the developer experience for everyone', textNL: 'We verbeteren proactief de developer experience voor iedereen' },

  // Refinement - Ri
  { id: 'ref_ri_1', angle: 'refinement', level: 'ri', text: 'We involve end users directly in refinement', textNL: 'We betrekken eindgebruikers direct bij refinement' },
  { id: 'ref_ri_2', angle: 'refinement', level: 'ri', text: 'We challenge whether a feature should be built at all', textNL: 'We stellen ter discussie of een feature überhaupt gebouwd moet worden' },
  { id: 'ref_ri_3', angle: 'refinement', level: 'ri', text: 'We define success metrics before starting work', textNL: 'We definiëren succesmetrics voordat we aan het werk beginnen' },
  { id: 'ref_ri_4', angle: 'refinement', level: 'ri', text: 'Our refinement practices are shared with other teams', textNL: 'Onze refinement-werkwijzen worden gedeeld met andere teams' },
  { id: 'ref_ri_5', angle: 'refinement', level: 'ri', text: 'We continuously experiment with better ways to refine', textNL: 'We experimenteren continu met betere manieren om te refinen' },

  // Planning - Ri
  { id: 'plan_ri_1', angle: 'planning', level: 'ri', text: 'Our planning connects to long-term product vision', textNL: 'Onze planning sluit aan bij de lange termijn productvisie' },
  { id: 'plan_ri_2', angle: 'planning', level: 'ri', text: 'We help shape the product roadmap, not just execute it', textNL: 'We helpen de productroadmap vormgeven, niet alleen uitvoeren' },
  { id: 'plan_ri_3', angle: 'planning', level: 'ri', text: 'We balance short-term delivery with long-term sustainability', textNL: 'We balanceren korte termijn levering met lange termijn duurzaamheid' },
  { id: 'plan_ri_4', angle: 'planning', level: 'ri', text: 'Our planning considers organizational constraints proactively', textNL: 'Onze planning houdt proactief rekening met organisatiebeperkingen' },
  { id: 'plan_ri_5', angle: 'planning', level: 'ri', text: 'We adapt our planning approach based on context', textNL: 'We passen onze planningsaanpak aan op basis van context' },

  // Retro - Ri
  { id: 'retro_ri_1', angle: 'retro', level: 'ri', text: 'Our retro insights lead to organizational improvements', textNL: 'Onze retro-inzichten leiden tot organisatieverbeteringen' },
  { id: 'retro_ri_2', angle: 'retro', level: 'ri', text: 'We facilitate retros for other teams', textNL: 'We faciliteren retro\'s voor andere teams' },
  { id: 'retro_ri_3', angle: 'retro', level: 'ri', text: 'We create new retrospective formats', textNL: 'We creëren nieuwe retrospective-formaten' },
  { id: 'retro_ri_4', angle: 'retro', level: 'ri', text: 'Continuous improvement is embedded in daily work, not just retros', textNL: 'Continue verbetering is ingebed in dagelijks werk, niet alleen in retro\'s' },
  { id: 'retro_ri_5', angle: 'retro', level: 'ri', text: 'We share our improvement journey with the organization', textNL: 'We delen onze verbeterreis met de organisatie' },

  // Demo - Ri
  { id: 'demo_ri_1', angle: 'demo', level: 'ri', text: 'Our demos influence product strategy', textNL: 'Onze demo\'s beïnvloeden productstrategie' },
  { id: 'demo_ri_2', angle: 'demo', level: 'ri', text: 'We demo to external customers, not just internal stakeholders', textNL: 'We demonstreren aan externe klanten, niet alleen interne stakeholders' },
  { id: 'demo_ri_3', angle: 'demo', level: 'ri', text: 'Our demo format has been adopted by other teams', textNL: 'Ons demo-format is overgenomen door andere teams' },
  { id: 'demo_ri_4', angle: 'demo', level: 'ri', text: 'We gather quantitative feedback, not just qualitative', textNL: 'We verzamelen kwantitatieve feedback, niet alleen kwalitatieve' },
  { id: 'demo_ri_5', angle: 'demo', level: 'ri', text: 'We demonstrate impact on business outcomes, not just features', textNL: 'We demonstreren impact op business outcomes, niet alleen features' },

  // Obeya - Ri
  { id: 'obeya_ri_1', angle: 'obeya', level: 'ri', text: 'Our visual management style has been adopted by other teams', textNL: 'Onze visuele managementstijl is overgenomen door andere teams' },
  { id: 'obeya_ri_2', angle: 'obeya', level: 'ri', text: 'We connect team-level visuals to organizational strategy', textNL: 'We verbinden team-level visuals met organisatiestrategie' },
  { id: 'obeya_ri_3', angle: 'obeya', level: 'ri', text: 'Our Obeya evolves as our team\'s needs change', textNL: 'Onze Obeya evolueert mee met de behoeften van het team' },
  { id: 'obeya_ri_4', angle: 'obeya', level: 'ri', text: 'We use our visual space to facilitate strategic conversations', textNL: 'We gebruiken onze visuele ruimte om strategische gesprekken te faciliteren' },
  { id: 'obeya_ri_5', angle: 'obeya', level: 'ri', text: 'We coach other teams on effective visual management', textNL: 'We coachen andere teams in effectief visueel management' },

  // Dependencies - Ri
  { id: 'dep_ri_1', angle: 'dependencies', level: 'ri', text: 'We have eliminated most hard dependencies through decoupling', textNL: 'We hebben de meeste harde afhankelijkheden geëlimineerd door ontkoppeling' },
  { id: 'dep_ri_2', angle: 'dependencies', level: 'ri', text: 'We help other teams become less dependent on us', textNL: 'We helpen andere teams minder afhankelijk van ons te worden' },
  { id: 'dep_ri_3', angle: 'dependencies', level: 'ri', text: 'Our architecture decisions consider cross-team impact', textNL: 'Onze architectuurbeslissingen houden rekening met cross-team impact' },
  { id: 'dep_ri_4', angle: 'dependencies', level: 'ri', text: 'We contribute to organization-wide dependency management', textNL: 'We dragen bij aan organisatiebrede dependency management' },
  { id: 'dep_ri_5', angle: 'dependencies', level: 'ri', text: 'We proactively refactor shared interfaces to reduce coupling', textNL: 'We refactoren proactief gedeelde interfaces om koppeling te verminderen' },

  // Psychological Safety - Ri
  { id: 'psych_ri_1', angle: 'psychological_safety', level: 'ri', text: 'We actively create space for dissenting opinions', textNL: 'We creëren actief ruimte voor afwijkende meningen' },
  { id: 'psych_ri_2', angle: 'psychological_safety', level: 'ri', text: 'Our team culture of safety has been adopted by other teams', textNL: 'Onze teamcultuur van veiligheid is overgenomen door andere teams' },
  { id: 'psych_ri_3', angle: 'psychological_safety', level: 'ri', text: 'We address systemic barriers to psychological safety', textNL: 'We pakken systemische barrières voor psychologische veiligheid aan' },
  { id: 'psych_ri_4', angle: 'psychological_safety', level: 'ri', text: 'We facilitate difficult conversations across the organization', textNL: 'We faciliteren moeilijke gesprekken door de hele organisatie' },
  { id: 'psych_ri_5', angle: 'psychological_safety', level: 'ri', text: 'Newcomers report feeling safe within their first week', textNL: 'Nieuwkomers geven aan zich veilig te voelen in hun eerste week' },

  // DevOps - Ri
  { id: 'devops_ri_1', angle: 'devops', level: 'ri', text: 'Continuous deployment is our default, not a goal', textNL: 'Continuous deployment is onze standaard, niet een doel' },
  { id: 'devops_ri_2', angle: 'devops', level: 'ri', text: 'We contribute to the organization\'s platform and tooling', textNL: 'We dragen bij aan het platform en de tooling van de organisatie' },
  { id: 'devops_ri_3', angle: 'devops', level: 'ri', text: 'Our deployment pipeline is a reference for other teams', textNL: 'Onze deployment pipeline is een referentie voor andere teams' },
  { id: 'devops_ri_4', angle: 'devops', level: 'ri', text: 'We proactively improve observability across services', textNL: 'We verbeteren proactief observability over alle services' },
  { id: 'devops_ri_5', angle: 'devops', level: 'ri', text: 'We experiment with chaos engineering or resilience testing', textNL: 'We experimenteren met chaos engineering of resilience testing' },

  // Stakeholder - Ri
  { id: 'stake_ri_1', angle: 'stakeholder', level: 'ri', text: 'We co-create the product roadmap with stakeholders', textNL: 'We creëren de productroadmap samen met stakeholders' },
  { id: 'stake_ri_2', angle: 'stakeholder', level: 'ri', text: 'Stakeholders advocate for the team\'s needs to leadership', textNL: 'Stakeholders bepleiten de behoeften van het team bij het leiderschap' },
  { id: 'stake_ri_3', angle: 'stakeholder', level: 'ri', text: 'We influence strategic decisions beyond our team boundary', textNL: 'We beïnvloeden strategische beslissingen buiten onze teamgrenzen' },
  { id: 'stake_ri_4', angle: 'stakeholder', level: 'ri', text: 'Our stakeholder communication model has been adopted by others', textNL: 'Ons stakeholder communicatiemodel is overgenomen door anderen' },
  { id: 'stake_ri_5', angle: 'stakeholder', level: 'ri', text: 'We actively seek out new stakeholders we should engage with', textNL: 'We zoeken actief nieuwe stakeholders op waarmee we moeten samenwerken' },

  // Leadership - Ri
  { id: 'lead_ri_1', angle: 'leadership', level: 'ri', text: 'Leaders develop other leaders within the organization', textNL: 'Leiders ontwikkelen andere leiders binnen de organisatie' },
  { id: 'lead_ri_2', angle: 'leadership', level: 'ri', text: 'Our leadership approach has been recognized outside the organization', textNL: 'Onze leiderschapsaanpak is erkend buiten de organisatie' },
  { id: 'lead_ri_3', angle: 'leadership', level: 'ri', text: 'Leaders facilitate cross-team collaboration at a systemic level', textNL: 'Leiders faciliteren cross-team samenwerking op systemisch niveau' },
  { id: 'lead_ri_4', angle: 'leadership', level: 'ri', text: 'Psychological safety is a leadership KPI, not just a value', textNL: 'Psychologische veiligheid is een leiderschap-KPI, niet alleen een waarde' },
  { id: 'lead_ri_5', angle: 'leadership', level: 'ri', text: 'Leaders question and adapt the organizational structure', textNL: 'Leiders bevragen en passen de organisatiestructuur aan' },
]

// All statements
const ALL_STATEMENTS: Statement[] = [...shuStatements, ...haStatements, ...riStatements]

/**
 * Get statements for a specific angle AND level.
 * Optional maxCount caps the number of statements (e.g. to match team size).
 * Minimum is 3 statements to ensure meaningful data.
 */
export function getStatements(angle: WowAngle, level: WowLevel = 'shu', maxCount?: number): Statement[] {
  const stmts = ALL_STATEMENTS.filter(s => s.angle === angle && s.level === level)
  if (maxCount && maxCount >= 3 && maxCount < stmts.length) {
    return stmts.slice(0, maxCount)
  }
  return stmts
}

/**
 * Get a single statement by ID
 */
export function getStatementById(id: string): Statement | null {
  return ALL_STATEMENTS.find(s => s.id === id) || null
}

/**
 * Get all statements (for validation)
 */
export function getAllStatements(): Statement[] {
  return ALL_STATEMENTS
}

/**
 * Get all statements for a specific level
 */
export function getStatementsForLevel(level: WowLevel): Statement[] {
  return ALL_STATEMENTS.filter(s => s.level === level)
}
