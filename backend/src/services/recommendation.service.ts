import { ImportanceLevel, ProficiencyLevel } from "@prisma/client";
import * as recModel from "../models/recommendation.model";
import type { CandidateProject } from "../models/recommendation.model";

// SERVICE LAYER - the matching algorithm (Module 3 Feature 2).
// No AI: a transparent, weighted overlap of the researcher's portfolio
// against each published project's requirements, domain, and title.

// How much a project cares about a skill.
const IMPORTANCE_WEIGHT: Record<ImportanceLevel, number> = {
  REQUIRED: 3,
  PREFERRED: 2,
  OPTIONAL: 1,
};

// How strongly the researcher holds a skill. A declared EXPERT counts for
// full credit; a BEGINNER only partly covers a requirement.
const PROFICIENCY_STRENGTH: Record<ProficiencyLevel, number> = {
  EXPERT: 1,
  ADVANCED: 0.85,
  INTERMEDIATE: 0.7,
  BEGINNER: 0.5,
};

// A skill only inferred from projects they've worked on - real evidence, but
// weaker than a skill they explicitly put on their portfolio.
const INFERRED_SKILL_STRENGTH = 0.6;

// Interest signals, strongest first.
const INTEREST_WEIGHT = {
  declared: 1, // listed on their portfolio
  education: 0.8, // their field of study
  projectDomain: 0.7, // domain of a project they own/joined/applied to
  publication: 0.5, // venue or title terms from their publications
};

// Enough interest evidence to count as a full interest match.
const INTEREST_SATURATION = 3;

const norm = (s: string) => s.toLowerCase().trim();

// Very common words that would otherwise match almost any project.
const STOPWORDS = new Set([
  "using", "based", "towards", "approach", "approaches", "study", "studies",
  "analysis", "novel", "system", "systems", "method", "methods", "model",
  "models", "framework", "review", "survey", "paper", "research", "learning",
  "data", "with", "from", "into", "their", "this", "that", "these", "those",
  "about", "which", "where", "while", "under", "over", "between", "through",
]);

interface SkillSignal {
  strength: number;
  declared: boolean;
  proficiency?: ProficiencyLevel;
}

interface InterestSignal {
  label: string;
  weight: number;
}

interface Profile {
  skills: Map<number, SkillSignal>;
  interests: Map<string, InterestSignal>;
}

// Builds the researcher's profile from their portfolio (Module 1 Feature 4)
// plus taste inferred from the projects they already engage with.
const buildProfile = async (
  userId: number
): Promise<{ profile: Profile; excludeIds: number[] }> => {
  const [skills, interests, educations, publications, member, applied] =
    await Promise.all([
      recModel.getUserSkills(userId),
      recModel.getUserInterests(userId),
      recModel.getUserEducation(userId),
      recModel.getUserPublications(userId),
      recModel.getMemberProjects(userId),
      recModel.getAppliedProjects(userId),
    ]);

  /* ---- skills ---- */
  const skillMap = new Map<number, SkillSignal>();

  // Declared skills carry their proficiency.
  skills.forEach((s) =>
    skillMap.set(s.skillId, {
      strength: PROFICIENCY_STRENGTH[s.proficiencyLevel],
      declared: true,
      proficiency: s.proficiencyLevel,
    })
  );

  // Skills inferred from projects they've worked on - only used when the
  // skill isn't already declared (a declaration is always the better signal).
  [...member, ...applied].forEach((p) =>
    p.skillRequirements.forEach((r) => {
      if (!skillMap.has(r.skillId)) {
        skillMap.set(r.skillId, {
          strength: INFERRED_SKILL_STRENGTH,
          declared: false,
        });
      }
    })
  );

  /* ---- interests ---- */
  const interestMap = new Map<string, InterestSignal>();

  // Keeps the strongest weight when a phrase arrives from several sources.
  const addInterest = (label?: string | null, weight = 1) => {
    if (!label) return;
    const key = norm(label);
    if (key.length < 4 || STOPWORDS.has(key)) return;
    const existing = interestMap.get(key);
    if (!existing || existing.weight < weight) {
      interestMap.set(key, { label, weight });
    }
  };

  interests.forEach((i) => addInterest(i.interest.name, INTEREST_WEIGHT.declared));
  educations.forEach((e) => addInterest(e.fieldOfStudy, INTEREST_WEIGHT.education));

  publications.forEach((p) => {
    addInterest(p.venue, INTEREST_WEIGHT.publication);
    // Pull the meaningful terms out of the title; stopwords and short words
    // would otherwise match nearly every project.
    (p.title ?? "")
      .split(/[^a-zA-Z]+/)
      .filter((w) => w.length >= 5 && !STOPWORDS.has(w.toLowerCase()))
      .slice(0, 6)
      .forEach((w) => addInterest(w, INTEREST_WEIGHT.publication));
  });

  [...member, ...applied].forEach((p) =>
    addInterest(p.researchDomain, INTEREST_WEIGHT.projectDomain)
  );

  return {
    profile: { skills: skillMap, interests: interestMap },
    // Never recommend something they're already on, or have already asked to join.
    excludeIds: [
      ...member.map((p) => p.projectId),
      ...applied.map((p) => p.projectId),
    ],
  };
};

export interface Recommendation {
  matchPercent: number;
  matchScore: number;
  matchedSkills: {
    skillId: number;
    name: string;
    importanceLevel: ImportanceLevel;
    proficiencyLevel?: ProficiencyLevel;
    declared: boolean;
  }[];
  matchedInterests: string[];
}

const scoreProject = (
  project: CandidateProject,
  profile: Profile
): Recommendation => {
  /* ---- skill overlap, weighted by project importance AND their proficiency ---- */
  let totalWeight = 0;
  let matchedWeight = 0;
  const matchedSkills: Recommendation["matchedSkills"] = [];

  for (const req of project.skillRequirements) {
    const w = IMPORTANCE_WEIGHT[req.importanceLevel];
    totalWeight += w;

    const held = profile.skills.get(req.skillId);
    if (held) {
      // Partial credit: a BEGINNER only half-covers a REQUIRED skill.
      matchedWeight += w * held.strength;
      matchedSkills.push({
        skillId: req.skillId,
        name: req.skill.name,
        importanceLevel: req.importanceLevel,
        proficiencyLevel: held.proficiency,
        declared: held.declared,
      });
    }
  }
  const skillPart = totalWeight > 0 ? matchedWeight / totalWeight : 0;

  /* ---- interest / domain overlap ---- */
  const haystack = [
    project.researchDomain,
    project.title,
    project.skillRequirements.map((r) => r.skill.name).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  const domainHay = project.researchDomain.toLowerCase();

  const matchedInterests: string[] = [];
  let interestEvidence = 0;
  for (const [key, signal] of profile.interests) {
    if (!haystack.includes(key)) continue;
    matchedInterests.push(signal.label);
    // A hit on the research domain itself is worth more than one buried in
    // the title or a skill name.
    interestEvidence += signal.weight * (domainHay.includes(key) ? 2 : 1);
  }
  const interestPart = Math.min(1, interestEvidence / INTEREST_SATURATION);

  /* ---- blend into a 0-100% match ---- */
  const parts: { w: number; v: number }[] = [];
  if (totalWeight > 0) parts.push({ w: 0.65, v: skillPart });
  if (profile.interests.size > 0) parts.push({ w: 0.35, v: interestPart });
  const wSum = parts.reduce((a, p) => a + p.w, 0);
  const matchPercent =
    wSum > 0
      ? Math.round((100 * parts.reduce((a, p) => a + p.w * p.v, 0)) / wSum)
      : 0;

  // Raw score drives ranking; heavier skills and stronger interest evidence win.
  const matchScore = matchedWeight * 2 + interestEvidence;

  return {
    matchPercent,
    matchScore,
    // Show the skills the project cares about most first.
    matchedSkills: matchedSkills.sort(
      (a, b) =>
        IMPORTANCE_WEIGHT[b.importanceLevel] - IMPORTANCE_WEIGHT[a.importanceLevel]
    ),
    matchedInterests: matchedInterests.slice(0, 6),
  };
};

// Returns published projects the researcher is likely to want, best match first.
export const recommend = async (userId: number, limit = 12) => {
  const { profile, excludeIds } = await buildProfile(userId);

  // Nothing to match on yet - the caller shows an "add to your portfolio" hint.
  if (profile.skills.size === 0 && profile.interests.size === 0) {
    return [];
  }

  const candidates = await recModel.getCandidates(userId, excludeIds);

  return candidates
    .map((project) => ({ project, rec: scoreProject(project, profile) }))
    .filter((x) => x.rec.matchScore > 0)
    .sort(
      (a, b) =>
        b.rec.matchScore - a.rec.matchScore ||
        b.rec.matchPercent - a.rec.matchPercent ||
        new Date(b.project.publishedAt ?? 0).getTime() -
          new Date(a.project.publishedAt ?? 0).getTime()
    )
    .slice(0, limit)
    .map(({ project, rec }) => ({ ...project, recommendation: rec }));
};
