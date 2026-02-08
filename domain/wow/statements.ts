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
  { id: 'scrum_shu_1', angle: 'scrum', level: 'shu', text: 'The Sprint Goal was achieved last Sprint' },
  { id: 'scrum_shu_2', angle: 'scrum', level: 'shu', text: 'The Daily Scrum takes less than 15 minutes' },
  { id: 'scrum_shu_3', angle: 'scrum', level: 'shu', text: 'The Product Owner was available for questions last Sprint' },
  { id: 'scrum_shu_4', angle: 'scrum', level: 'shu', text: 'Sprint scope did not change after Sprint Planning' },
  { id: 'scrum_shu_5', angle: 'scrum', level: 'shu', text: 'The Retrospective produced at least one concrete action' },

  // Flow - Shu
  { id: 'flow_shu_1', angle: 'flow', level: 'shu', text: 'I worked on only one item at a time last week' },
  { id: 'flow_shu_2', angle: 'flow', level: 'shu', text: 'Items move from In Progress to Done within 3 days' },
  { id: 'flow_shu_3', angle: 'flow', level: 'shu', text: 'Code reviews happen within 4 hours' },
  { id: 'flow_shu_4', angle: 'flow', level: 'shu', text: 'I know exactly what I should work on next' },
  { id: 'flow_shu_5', angle: 'flow', level: 'shu', text: 'The board reflects reality right now' },

  // Ownership - Shu
  { id: 'own_shu_1', angle: 'ownership', level: 'shu', text: 'I know who is on-call and how to reach them' },
  { id: 'own_shu_2', angle: 'ownership', level: 'shu', text: 'I have access to production logs' },
  { id: 'own_shu_3', angle: 'ownership', level: 'shu', text: 'The team decides how to do the work, not external leads' },
  { id: 'own_shu_4', angle: 'ownership', level: 'shu', text: 'When something breaks, we fix it first and blame never' },
  { id: 'own_shu_5', angle: 'ownership', level: 'shu', text: 'I understand our team\'s main responsibilities' },

  // Collaboration - Shu
  { id: 'collab_shu_1', angle: 'collaboration', level: 'shu', text: 'I asked for help when I was stuck' },
  { id: 'collab_shu_2', angle: 'collaboration', level: 'shu', text: 'Someone asked me for help this week' },
  { id: 'collab_shu_3', angle: 'collaboration', level: 'shu', text: 'I know what my teammates are working on right now' },
  { id: 'collab_shu_4', angle: 'collaboration', level: 'shu', text: 'In the last Retro, everyone spoke at least once' },
  { id: 'collab_shu_5', angle: 'collaboration', level: 'shu', text: 'Knowledge is documented, not just in people\'s heads' },

  // Technical Excellence - Shu
  { id: 'tech_shu_1', angle: 'technical_excellence', level: 'shu', text: 'All code changes have automated tests' },
  { id: 'tech_shu_2', angle: 'technical_excellence', level: 'shu', text: 'I can run the full system locally' },
  { id: 'tech_shu_3', angle: 'technical_excellence', level: 'shu', text: 'We have clear coding standards that we follow' },
  { id: 'tech_shu_4', angle: 'technical_excellence', level: 'shu', text: 'Documentation is updated when code changes' },
  { id: 'tech_shu_5', angle: 'technical_excellence', level: 'shu', text: 'The test suite runs in under 10 minutes' },

  // Refinement - Shu
  { id: 'ref_shu_1', angle: 'refinement', level: 'shu', text: 'Stories have clear acceptance criteria before entering the Sprint' },
  { id: 'ref_shu_2', angle: 'refinement', level: 'shu', text: 'The team understands the "why" behind each story' },
  { id: 'ref_shu_3', angle: 'refinement', level: 'shu', text: 'Stories are small enough to complete in 2-3 days' },
  { id: 'ref_shu_4', angle: 'refinement', level: 'shu', text: 'Refinement sessions are timeboxed and productive' },
  { id: 'ref_shu_5', angle: 'refinement', level: 'shu', text: 'The backlog has at least 2 Sprints worth of ready items' },

  // Planning - Shu
  { id: 'plan_shu_1', angle: 'planning', level: 'shu', text: 'The Sprint Goal is clear and achievable' },
  { id: 'plan_shu_2', angle: 'planning', level: 'shu', text: 'The team committed to scope they believe in' },
  { id: 'plan_shu_3', angle: 'planning', level: 'shu', text: 'Capacity for planned absences was accounted for' },
  { id: 'plan_shu_4', angle: 'planning', level: 'shu', text: 'Planning took less than 2 hours' },
  { id: 'plan_shu_5', angle: 'planning', level: 'shu', text: 'Everyone in the team participated in planning discussions' },

  // Retro - Shu
  { id: 'retro_shu_1', angle: 'retro', level: 'shu', text: 'The last Retro produced at least one concrete action' },
  { id: 'retro_shu_2', angle: 'retro', level: 'shu', text: 'Retro actions from last Sprint were completed' },
  { id: 'retro_shu_3', angle: 'retro', level: 'shu', text: 'Everyone felt safe to speak up in the Retro' },
  { id: 'retro_shu_4', angle: 'retro', level: 'shu', text: 'Retro actions have clear owners' },
  { id: 'retro_shu_5', angle: 'retro', level: 'shu', text: 'Positive things were celebrated, not just problems' },

  // Demo - Shu
  { id: 'demo_shu_1', angle: 'demo', level: 'shu', text: 'Stakeholders attended the last Sprint Review' },
  { id: 'demo_shu_2', angle: 'demo', level: 'shu', text: 'The demo showed working software, not slides' },
  { id: 'demo_shu_3', angle: 'demo', level: 'shu', text: 'The Sprint Goal was clearly demonstrated' },
  { id: 'demo_shu_4', angle: 'demo', level: 'shu', text: 'Developers presented their own work' },
  { id: 'demo_shu_5', angle: 'demo', level: 'shu', text: 'The demo was timeboxed and focused' },
]

// ============================================
// HA LEVEL STATEMENTS (破) - Adapt intentionally
// ============================================

const haStatements: Statement[] = [
  // Scrum - Ha
  { id: 'scrum_ha_1', angle: 'scrum', level: 'ha', text: 'We adapted Scrum events to better fit our context' },
  { id: 'scrum_ha_2', angle: 'scrum', level: 'ha', text: 'The team experiments with different meeting formats' },
  { id: 'scrum_ha_3', angle: 'scrum', level: 'ha', text: 'We measure and track our own velocity or throughput' },
  { id: 'scrum_ha_4', angle: 'scrum', level: 'ha', text: 'Sprint length was chosen based on our delivery needs' },
  { id: 'scrum_ha_5', angle: 'scrum', level: 'ha', text: 'We consciously break rules when it makes sense' },

  // Flow - Ha
  { id: 'flow_ha_1', angle: 'flow', level: 'ha', text: 'WIP limits are enforced, not ignored' },
  { id: 'flow_ha_2', angle: 'flow', level: 'ha', text: 'We track cycle time and act on the data' },
  { id: 'flow_ha_3', angle: 'flow', level: 'ha', text: 'Blockers are escalated within hours, not days' },
  { id: 'flow_ha_4', angle: 'flow', level: 'ha', text: 'We visualize bottlenecks and address them systematically' },
  { id: 'flow_ha_5', angle: 'flow', level: 'ha', text: 'Deployments happen at least weekly' },

  // Ownership - Ha
  { id: 'own_ha_1', angle: 'ownership', level: 'ha', text: 'I can deploy my code to production without asking permission' },
  { id: 'own_ha_2', angle: 'ownership', level: 'ha', text: 'I fixed a bug last week without being assigned to it' },
  { id: 'own_ha_3', angle: 'ownership', level: 'ha', text: 'The team owns the backlog prioritization, not just the PO' },
  { id: 'own_ha_4', angle: 'ownership', level: 'ha', text: 'I participated in an incident review this quarter' },
  { id: 'own_ha_5', angle: 'ownership', level: 'ha', text: 'I refactored code this month that I did not originally write' },

  // Collaboration - Ha
  { id: 'collab_ha_1', angle: 'collaboration', level: 'ha', text: 'I paired with a teammate on a task this week' },
  { id: 'collab_ha_2', angle: 'collaboration', level: 'ha', text: 'I received specific feedback on my work this week' },
  { id: 'collab_ha_3', angle: 'collaboration', level: 'ha', text: 'Disagreements are discussed openly, not avoided' },
  { id: 'collab_ha_4', angle: 'collaboration', level: 'ha', text: 'New team members can contribute within their first week' },
  { id: 'collab_ha_5', angle: 'collaboration', level: 'ha', text: 'We celebrate wins together, not just individually' },

  // Technical Excellence - Ha
  { id: 'tech_ha_1', angle: 'technical_excellence', level: 'ha', text: 'I refactored something this week without being asked' },
  { id: 'tech_ha_2', angle: 'technical_excellence', level: 'ha', text: 'Technical debt is tracked and prioritized' },
  { id: 'tech_ha_3', angle: 'technical_excellence', level: 'ha', text: 'We can roll back a bad deploy in under 5 minutes' },
  { id: 'tech_ha_4', angle: 'technical_excellence', level: 'ha', text: 'We review architecture decisions as a team' },
  { id: 'tech_ha_5', angle: 'technical_excellence', level: 'ha', text: 'Deployments are boring, not scary' },

  // Refinement - Ha
  { id: 'ref_ha_1', angle: 'refinement', level: 'ha', text: 'Technical dependencies are identified before Sprint Planning' },
  { id: 'ref_ha_2', angle: 'refinement', level: 'ha', text: 'The PO prioritizes based on value, not gut feeling' },
  { id: 'ref_ha_3', angle: 'refinement', level: 'ha', text: 'Edge cases are discussed during refinement, not during development' },
  { id: 'ref_ha_4', angle: 'refinement', level: 'ha', text: 'Developers ask clarifying questions during refinement' },
  { id: 'ref_ha_5', angle: 'refinement', level: 'ha', text: 'Stories are estimated by the whole team, not one person' },

  // Planning - Ha
  { id: 'plan_ha_1', angle: 'planning', level: 'ha', text: 'Sprint Planning ends with a shared plan, not assigned tasks' },
  { id: 'plan_ha_2', angle: 'planning', level: 'ha', text: 'The Sprint Goal connects to a business outcome' },
  { id: 'plan_ha_3', angle: 'planning', level: 'ha', text: 'We discussed how we will achieve the goal, not just what' },
  { id: 'plan_ha_4', angle: 'planning', level: 'ha', text: 'Dependencies on other teams were identified and addressed' },
  { id: 'plan_ha_5', angle: 'planning', level: 'ha', text: 'The Sprint Backlog is realistic, not aspirational' },

  // Retro - Ha
  { id: 'retro_ha_1', angle: 'retro', level: 'ha', text: 'We discussed root causes, not just symptoms' },
  { id: 'retro_ha_2', angle: 'retro', level: 'ha', text: 'The Retro format varies to keep it fresh' },
  { id: 'retro_ha_3', angle: 'retro', level: 'ha', text: 'The Scrum Master facilitates, not dominates' },
  { id: 'retro_ha_4', angle: 'retro', level: 'ha', text: 'We learn from what went well, not just what went wrong' },
  { id: 'retro_ha_5', angle: 'retro', level: 'ha', text: 'The team decided on actions, not the Scrum Master' },

  // Demo - Ha
  { id: 'demo_ha_1', angle: 'demo', level: 'ha', text: 'Stakeholder feedback was captured and added to the backlog' },
  { id: 'demo_ha_2', angle: 'demo', level: 'ha', text: 'Stakeholders asked questions during the demo' },
  { id: 'demo_ha_3', angle: 'demo', level: 'ha', text: 'The PO confirmed whether the Sprint Goal was met' },
  { id: 'demo_ha_4', angle: 'demo', level: 'ha', text: 'Future direction was discussed based on what was learned' },
  { id: 'demo_ha_5', angle: 'demo', level: 'ha', text: 'Incomplete work was shown transparently, not hidden' },
]

// ============================================
// RI LEVEL STATEMENTS (離) - Mastery & own approach
// ============================================

const riStatements: Statement[] = [
  // Scrum - Ri
  { id: 'scrum_ri_1', angle: 'scrum', level: 'ri', text: 'We created our own cadence that transcends Scrum' },
  { id: 'scrum_ri_2', angle: 'scrum', level: 'ri', text: 'The team self-organizes without needing a Scrum Master' },
  { id: 'scrum_ri_3', angle: 'scrum', level: 'ri', text: 'We coach other teams on effective practices' },
  { id: 'scrum_ri_4', angle: 'scrum', level: 'ri', text: 'Our process evolved from team experimentation' },
  { id: 'scrum_ri_5', angle: 'scrum', level: 'ri', text: 'We deliver value continuously, not just at Sprint end' },

  // Flow - Ri
  { id: 'flow_ri_1', angle: 'flow', level: 'ri', text: 'We optimize for flow across the entire value stream' },
  { id: 'flow_ri_2', angle: 'flow', level: 'ri', text: 'We proactively identify and remove systemic bottlenecks' },
  { id: 'flow_ri_3', angle: 'flow', level: 'ri', text: 'Lead time is predictable within a narrow range' },
  { id: 'flow_ri_4', angle: 'flow', level: 'ri', text: 'We help other teams improve their flow' },
  { id: 'flow_ri_5', angle: 'flow', level: 'ri', text: 'Continuous deployment is the default, not the exception' },

  // Ownership - Ri
  { id: 'own_ri_1', angle: 'ownership', level: 'ri', text: 'I can create a new service without filing a ticket' },
  { id: 'own_ri_2', angle: 'ownership', level: 'ri', text: 'The team decided on technical approach, not a lead or architect' },
  { id: 'own_ri_3', angle: 'ownership', level: 'ri', text: 'We define our own success metrics' },
  { id: 'own_ri_4', angle: 'ownership', level: 'ri', text: 'We proactively reach out to stakeholders before they ask' },
  { id: 'own_ri_5', angle: 'ownership', level: 'ri', text: 'We sunset our own features when they no longer serve users' },

  // Collaboration - Ri
  { id: 'collab_ri_1', angle: 'collaboration', level: 'ri', text: 'We actively mentor team members and others outside our team' },
  { id: 'collab_ri_2', angle: 'collaboration', level: 'ri', text: 'Our team is sought out for advice by other teams' },
  { id: 'collab_ri_3', angle: 'collaboration', level: 'ri', text: 'We have created cross-team communities of practice' },
  { id: 'collab_ri_4', angle: 'collaboration', level: 'ri', text: 'Psychological safety is something we actively cultivate' },
  { id: 'collab_ri_5', angle: 'collaboration', level: 'ri', text: 'We adapt our collaboration style based on the situation' },

  // Technical Excellence - Ri
  { id: 'tech_ri_1', angle: 'technical_excellence', level: 'ri', text: 'We contribute to our organization\'s technical standards' },
  { id: 'tech_ri_2', angle: 'technical_excellence', level: 'ri', text: 'We build tools that other teams use' },
  { id: 'tech_ri_3', angle: 'technical_excellence', level: 'ri', text: 'Our codebase is an example others learn from' },
  { id: 'tech_ri_4', angle: 'technical_excellence', level: 'ri', text: 'We experiment with new technologies and share learnings' },
  { id: 'tech_ri_5', angle: 'technical_excellence', level: 'ri', text: 'We proactively improve the developer experience for everyone' },

  // Refinement - Ri
  { id: 'ref_ri_1', angle: 'refinement', level: 'ri', text: 'We involve end users directly in refinement' },
  { id: 'ref_ri_2', angle: 'refinement', level: 'ri', text: 'We challenge whether a feature should be built at all' },
  { id: 'ref_ri_3', angle: 'refinement', level: 'ri', text: 'We define success metrics before starting work' },
  { id: 'ref_ri_4', angle: 'refinement', level: 'ri', text: 'Our refinement practices are shared with other teams' },
  { id: 'ref_ri_5', angle: 'refinement', level: 'ri', text: 'We continuously experiment with better ways to refine' },

  // Planning - Ri
  { id: 'plan_ri_1', angle: 'planning', level: 'ri', text: 'Our planning connects to long-term product vision' },
  { id: 'plan_ri_2', angle: 'planning', level: 'ri', text: 'We help shape the product roadmap, not just execute it' },
  { id: 'plan_ri_3', angle: 'planning', level: 'ri', text: 'We balance short-term delivery with long-term sustainability' },
  { id: 'plan_ri_4', angle: 'planning', level: 'ri', text: 'Our planning considers organizational constraints proactively' },
  { id: 'plan_ri_5', angle: 'planning', level: 'ri', text: 'We adapt our planning approach based on context' },

  // Retro - Ri
  { id: 'retro_ri_1', angle: 'retro', level: 'ri', text: 'Our retro insights lead to organizational improvements' },
  { id: 'retro_ri_2', angle: 'retro', level: 'ri', text: 'We facilitate retros for other teams' },
  { id: 'retro_ri_3', angle: 'retro', level: 'ri', text: 'We create new retrospective formats' },
  { id: 'retro_ri_4', angle: 'retro', level: 'ri', text: 'Continuous improvement is embedded in daily work, not just retros' },
  { id: 'retro_ri_5', angle: 'retro', level: 'ri', text: 'We share our improvement journey with the organization' },

  // Demo - Ri
  { id: 'demo_ri_1', angle: 'demo', level: 'ri', text: 'Our demos influence product strategy' },
  { id: 'demo_ri_2', angle: 'demo', level: 'ri', text: 'We demo to external customers, not just internal stakeholders' },
  { id: 'demo_ri_3', angle: 'demo', level: 'ri', text: 'Our demo format has been adopted by other teams' },
  { id: 'demo_ri_4', angle: 'demo', level: 'ri', text: 'We gather quantitative feedback, not just qualitative' },
  { id: 'demo_ri_5', angle: 'demo', level: 'ri', text: 'We demonstrate impact on business outcomes, not just features' },
]

// All statements
const ALL_STATEMENTS: Statement[] = [...shuStatements, ...haStatements, ...riStatements]

/**
 * Get statements for a specific angle AND level
 */
export function getStatements(angle: WowAngle, level: WowLevel = 'shu'): Statement[] {
  return ALL_STATEMENTS.filter(s => s.angle === angle && s.level === level)
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
