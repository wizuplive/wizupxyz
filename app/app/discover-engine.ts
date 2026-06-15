export type OpportunityFilter = 'All Ideas' | 'High Momentum' | 'Fast Growing' | 'Low Competition' | 'Evergreen';

export type DiscoverOpportunity = {
  id: string;
  title: string;
  signal: string;
  copy: string;
  category: string;
  score: number;
  growth: number;
  competition: 'Low' | 'Medium' | 'High';
  revenue: string;
  buyer: string;
  format: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: OpportunityFilter[];
  confidence: string;
  velocity: string;
  insight: string;
  positioning: string;
  monetization: string;
};

type MarketBlueprint = {
  category: string;
  terms: string[];
  audience: string;
  formats: string[];
  opportunities: Array<{
    title: string;
    copy: string;
    angle: string;
    competition: DiscoverOpportunity['competition'];
    price: string;
  }>;
};

const blueprints: MarketBlueprint[] = [
  {
    category: 'Parenting',
    terms: ['parenting', 'parent', 'mom', 'dad', 'toddler', 'baby', 'kids', 'family', 'homeschool'],
    audience: 'busy parents',
    formats: ['Toolkit', 'Planner', 'Printable system', 'Guide'],
    opportunities: [
      { title: 'Toddler Sleep Toolkit', copy: 'A calm bedtime system for parents who need better nights.', angle: 'simple routines for tired parents', competition: 'Medium', price: '$19 - $39' },
      { title: 'Gentle Parenting Planner', copy: 'Daily prompts and scripts that make calmer parenting easier.', angle: 'beginner-friendly behavior support', competition: 'Low', price: '$15 - $29' },
      { title: 'Kids Routine Charts', copy: 'Printable morning and bedtime charts families can use right away.', angle: 'visual routines for young kids', competition: 'Low', price: '$9 - $19' },
      { title: 'ADHD Parenting Guide', copy: 'Practical home systems for parents supporting kids with ADHD.', angle: 'specific help for overwhelmed families', competition: 'Medium', price: '$24 - $49' },
      { title: 'New Mom Organization Kit', copy: 'Simple trackers for feeding, sleep, appointments, and home tasks.', angle: 'reduce early parent mental load', competition: 'Low', price: '$17 - $34' },
      { title: 'Family Meal Planning System', copy: 'A weekly meal plan and grocery workflow for busy households.', angle: 'family systems that save time', competition: 'Medium', price: '$12 - $27' },
    ],
  },
  {
    category: 'Fitness',
    terms: ['fitness', 'workout', 'gym', 'strength', 'running', 'wellness', 'health'],
    audience: 'beginners building healthy routines',
    formats: ['Workout plan', 'Tracker', 'Challenge kit', 'Coaching template'],
    opportunities: [
      { title: 'Beginner Strength Tracker', copy: 'A simple plan for people who want to get stronger without confusion.', angle: 'less intimidating strength training', competition: 'Medium', price: '$19 - $39' },
      { title: 'Home Workout Reset Plan', copy: 'Short workouts for busy people restarting fitness at home.', angle: 'restart-friendly movement', competition: 'Low', price: '$15 - $29' },
      { title: 'Walking Habit Challenge', copy: 'A 30-day walking system with prompts, logs, and small rewards.', angle: 'low-pressure health progress', competition: 'Low', price: '$9 - $19' },
    ],
  },
  {
    category: 'Productivity',
    terms: ['adhd', 'productivity', 'focus', 'planning', 'planner', 'organization', 'routine'],
    audience: 'people who want calmer systems',
    formats: ['Notion system', 'Planner kit', 'Template bundle', 'Digital guide'],
    opportunities: [
      { title: 'ADHD Planner System', copy: 'Simple planning tools for people who struggle to stay organized.', angle: 'low-friction daily resets', competition: 'Low', price: '$19 - $39' },
      { title: 'Focus Reset Toolkit', copy: 'Short reset scripts and checklists for people who lose momentum.', angle: 'recover quickly after distraction', competition: 'Low', price: '$15 - $29' },
      { title: 'Weekly Planning Board', copy: 'A clean visual planning board for busy creators and students.', angle: 'see the week without overwhelm', competition: 'Medium', price: '$12 - $24' },
    ],
  },
  {
    category: 'Budgeting',
    terms: ['budgeting', 'money', 'finance', 'saving', 'debt', 'college budget'],
    audience: 'people trying to control spending',
    formats: ['Spreadsheet', 'Planner', 'Calculator', 'Guide'],
    opportunities: [
      { title: 'Simple Budget Planner', copy: 'A monthly money system for people who hate complex spreadsheets.', angle: 'easy money visibility', competition: 'Medium', price: '$15 - $25' },
      { title: 'Debt Payoff Tracker', copy: 'A motivating tracker for paying down balances step by step.', angle: 'visible progress and small wins', competition: 'Low', price: '$12 - $29' },
      { title: 'College Budget Kit', copy: 'A student-friendly budget and spending tracker for campus life.', angle: 'money help for students', competition: 'Low', price: '$9 - $19' },
    ],
  },
  {
    category: 'Creator Business',
    terms: ['coaching', 'freelance', 'creator', 'consulting', 'course', 'client'],
    audience: 'solo creators and service providers',
    formats: ['Template bundle', 'Offer kit', 'Sales page', 'Workbook'],
    opportunities: [
      { title: 'Freelance Proposal Kit', copy: 'New freelancers want faster ways to win better clients.', angle: 'better client replies', competition: 'Low', price: '$29 - $59' },
      { title: 'Coaching Offer Builder', copy: 'A workbook for turning expertise into a clear paid offer.', angle: 'package a service simply', competition: 'Medium', price: '$39 - $79' },
      { title: 'Client Onboarding System', copy: 'Forms, emails, and checklists for a smoother first client week.', angle: 'premium client delivery', competition: 'Low', price: '$24 - $49' },
    ],
  },
  {
    category: 'Lifestyle',
    terms: ['journaling', 'wedding', 'skincare', 'beauty', 'travel', 'meal planning'],
    audience: 'people organizing personal routines',
    formats: ['Planner', 'Checklist', 'Printable kit', 'Guide'],
    opportunities: [
      { title: 'Guided Journaling Kit', copy: 'Simple prompts for people who want reflection without blank pages.', angle: 'easy emotional clarity', competition: 'Low', price: '$12 - $24' },
      { title: 'Wedding Planning Command Kit', copy: 'A calm planning system for couples managing details and deadlines.', angle: 'reduce wedding overwhelm', competition: 'Medium', price: '$29 - $59' },
      { title: 'Skincare Routine Tracker', copy: 'A visual tracker for routines, products, reactions, and progress.', angle: 'learn what actually works', competition: 'Low', price: '$9 - $19' },
    ],
  },
];

const fallbackIdeas = ['Starter Toolkit', 'Beginner Planner', 'Weekly Routine System', 'Quick Win Workbook', 'Resource Library', 'Decision Checklist'];

export function generateOpportunities(input: string, filter: OpportunityFilter): DiscoverOpportunity[] {
  const query = normalize(input);
  const matched = findBlueprints(query);
  const sourceBlueprints = matched.length ? matched : [synthesizeBlueprint(query || 'digital product')];
  const generated = sourceBlueprints.flatMap((blueprint, blueprintIndex) =>
    blueprint.opportunities.map((opportunity, index) => scoreOpportunity(blueprint, opportunity, query, blueprintIndex, index))
  );
  const expanded = generated.length < 4 ? [...generated, ...expandAdjacent(query, sourceBlueprints[0], generated.length)] : generated;
  const deduped = Array.from(new Map(expanded.map((item) => [item.title, item])).values());

  return deduped
    .filter((item) => filter === 'All Ideas' || item.tags.includes(filter))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function findBlueprints(query: string) {
  if (!query) return [blueprints[2], blueprints[0]];

  return blueprints.filter((blueprint) =>
    blueprint.terms.some((term) => query.includes(term) || term.includes(query)) ||
    normalize(blueprint.category).includes(query)
  );
}

function expandAdjacent(query: string, blueprint: MarketBlueprint, offset: number): DiscoverOpportunity[] {
  return fallbackIdeas.slice(0, 4).map((idea, index) => {
    const title = `${titleCase(query || blueprint.category)} ${idea}`;
    return scoreOpportunity(
      blueprint,
      {
        title,
        copy: `A simple ${blueprint.category.toLowerCase()} product for ${blueprint.audience}.`,
        angle: `focused help for ${blueprint.audience}`,
        competition: index % 2 === 0 ? 'Low' : 'Medium',
        price: index % 2 === 0 ? '$15 - $29' : '$19 - $39',
      },
      query,
      1,
      offset + index
    );
  });
}

function scoreOpportunity(
  blueprint: MarketBlueprint,
  opportunity: MarketBlueprint['opportunities'][number],
  query: string,
  blueprintIndex: number,
  index: number
): DiscoverOpportunity {
  const base = 92 - blueprintIndex * 4 - index * 3;
  const queryBoost = query && normalize(opportunity.title).includes(query) ? 3 : 0;
  const score = clamp(base + queryBoost, 72, 94);
  const growth = clamp(72 + score + index * 17 + blueprint.category.length, 96, 340);
  const signal = score >= 88 ? 'High Momentum' : growth >= 170 ? 'Fast Growing' : opportunity.competition === 'Low' ? 'Emerging Demand' : 'Buyer Demand Rising';
  const tags: OpportunityFilter[] = ['All Ideas'];

  if (score >= 86) tags.push('High Momentum');
  if (growth >= 135) tags.push('Fast Growing');
  if (opportunity.competition === 'Low') tags.push('Low Competition');
  if (['Parenting', 'Productivity', 'Budgeting', 'Lifestyle'].includes(blueprint.category)) tags.push('Evergreen');

  return {
    id: slugify(`${blueprint.category}-${opportunity.title}`),
    title: opportunity.title,
    signal,
    copy: opportunity.copy,
    category: blueprint.category,
    score,
    growth,
    competition: opportunity.competition,
    revenue: opportunity.price,
    buyer: titleCase(blueprint.audience),
    format: blueprint.formats[index % blueprint.formats.length],
    difficulty: opportunity.competition === 'High' ? 'Hard' : opportunity.competition === 'Medium' ? 'Medium' : 'Easy',
    tags,
    confidence: score >= 88 ? 'Very strong' : score >= 82 ? 'Strong' : 'Good',
    velocity: growth >= 220 ? 'Rising fast' : growth >= 150 ? 'Steady rise' : 'Climbing',
    insight: `Search interest is up ${Math.round(growth / 5)}% this month for ${opportunity.angle}.`,
    positioning: opportunity.angle,
    monetization: `Low-ticket ${blueprint.formats[index % blueprint.formats.length].toLowerCase()} with bundle potential.`,
  };
}

function synthesizeBlueprint(query: string): MarketBlueprint {
  const topic = titleCase(query);
  const audience = `${query} beginners`;

  return {
    category: topic,
    terms: [query],
    audience,
    formats: ['Toolkit', 'Planner', 'Guide', 'Template bundle'],
    opportunities: [
      { title: `${topic} Starter Toolkit`, copy: `A simple first-step system for people trying to make progress with ${query}.`, angle: `beginner help for ${query}`, competition: 'Low', price: '$15 - $29' },
      { title: `${topic} Weekly Planner`, copy: `A practical weekly planning kit for staying consistent with ${query}.`, angle: `consistent routines for ${query}`, competition: 'Medium', price: '$12 - $24' },
      { title: `${topic} Checklist Library`, copy: `Ready-to-use checklists that make ${query} easier to start and repeat.`, angle: `quick wins for ${query}`, competition: 'Low', price: '$9 - $19' },
      { title: `${topic} Coaching Mini Kit`, copy: `Scripts, prompts, and worksheets for people who want guided support with ${query}.`, angle: `guided support for ${query}`, competition: 'Medium', price: '$29 - $59' },
    ],
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
