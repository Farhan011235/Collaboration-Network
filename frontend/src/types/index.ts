export interface User {
  userId: number;
  fullName: string;
  email: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
  institution?: string | null;
  designation?: string | null;
  orcidId?: string | null;
  websiteUrl?: string | null;
  openToCollaboration: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  details?: Record<string, string>;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  institution?: string;
  designation?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/* ---------- Projects ---------- */

export type ProjectStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "COMPLETED";
export type CollaborationType = "REMOTE" | "ONSITE" | "HYBRID";
export type ImportanceLevel = "REQUIRED" | "PREFERRED" | "OPTIONAL";
export type ProficiencyLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT";
export type MemberRole =
  | "OWNER"
  | "RESEARCH_LEAD"
  | "DEVELOPER"
  | "DATA_ANALYST"
  | "WRITER"
  | "MEMBER";

export interface Skill {
  skillId: number;
  name: string;
  category?: string | null;
}

export interface SkillRequirement {
  projectId: number;
  skillId: number;
  importanceLevel: ImportanceLevel;
  skill: Skill;
}

export interface ProjectOwner {
  userId: number;
  fullName: string;
  institution?: string | null;
  designation?: string | null;
  profilePictureUrl?: string | null;
}

export interface Project {
  projectId: number;
  ownerId: number;
  title: string;
  description: string;
  objectives?: string | null;
  expectedOutcomes?: string | null;
  researchDomain: string;
  collaborationType: CollaborationType;
  status: ProjectStatus;
  durationMonths?: number | null;
  teamSizeLimit?: number | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: ProjectOwner;
  skillRequirements: SkillRequirement[];
  _count: { applications: number; members: number };
}

export interface ProjectFormValues {
  title: string;
  description: string;
  objectives?: string;
  expectedOutcomes?: string;
  researchDomain: string;
  collaborationType: CollaborationType;
  durationMonths?: number | null;
  teamSizeLimit?: number | null;
  skills: { skillId: number; importanceLevel: ImportanceLevel }[];
}

/* ---------- Search & Discovery (Feature 2) ---------- */

export type ProjectSortOption = "recent" | "oldest" | "team";

export interface ProjectSearchFilters {
  keyword?: string;
  researchDomain?: string;
  collaborationType?: CollaborationType;
  skillIds?: number[];
  minDuration?: number;
  maxDuration?: number;
  sort?: ProjectSortOption;
  page?: number;
  pageSize?: number;
}

export interface ProjectSearchResult {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ---------- Applications (request to collaborate) ---------- */

export type ApplicationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface Application {
  applicationId: number;
  projectId: number;
  applicantId: number;
  status: ApplicationStatus;
  message?: string | null;
  reviewNote?: string | null;
  appliedAt: string;
  reviewedAt?: string | null;
  project: {
    projectId: number;
    title: string;
    status: ProjectStatus;
    researchDomain: string;
    collaborationType: CollaborationType;
    ownerId: number;
    owner: { userId: number; fullName: string; institution?: string | null };
  };
}

/* ---------- Review & Team Formation (Feature 3) ---------- */

export type ApplicationDecision = "ACCEPT" | "REJECT";

export interface UserSkillEntry {
  skillId: number;
  proficiencyLevel: ProficiencyLevel;
  skill: Skill;
}

export interface UserInterestEntry {
  interestId: number;
  interest: { interestId: number; name: string };
}

// An applicant as seen by a project owner reviewing their request.
export interface ApplicantProfile {
  userId: number;
  fullName: string;
  email: string;
  institution?: string | null;
  designation?: string | null;
  bio?: string | null;
  profilePictureUrl?: string | null;
  orcidId?: string | null;
  websiteUrl?: string | null;
  skills: UserSkillEntry[];
  interests: UserInterestEntry[];
}

export interface ProjectApplication {
  applicationId: number;
  projectId: number;
  applicantId: number;
  status: ApplicationStatus;
  message?: string | null;
  reviewNote?: string | null;
  appliedAt: string;
  reviewedAt?: string | null;
  applicant: ApplicantProfile;
}

/* ---------- Tasks & Milestones (Module 2, Feature 1) ---------- */

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type MilestoneStatus = "PENDING" | "COMPLETED";

export interface Milestone {
  milestoneId: number;
  projectId: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: MilestoneStatus;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  _count: { tasks: number };
}

export interface Task {
  taskId: number;
  projectId: number;
  milestoneId?: number | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assigneeId?: number | null;
  createdById: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    userId: number;
    fullName: string;
    profilePictureUrl?: string | null;
  } | null;
  createdBy: { userId: number; fullName: string };
  milestone?: {
    milestoneId: number;
    title: string;
    status: MilestoneStatus;
  } | null;
}

export interface ProjectMemberEntry {
  projectId: number;
  userId: number;
  role: MemberRole;
  joinedAt: string;
  user: {
    userId: number;
    fullName: string;
    profilePictureUrl?: string | null;
    institution?: string | null;
    designation?: string | null;
  };
}

export interface WorkspaceOverview {
  tasks: { TODO: number; IN_PROGRESS: number; DONE: number };
  totalTasks: number;
  completionPercent: number;
  milestones: { total: number; completed: number };
}

export interface JoinedProject {
  projectId: number;
  title: string;
  researchDomain: string;
  status: ProjectStatus;
  collaborationType: CollaborationType;
  owner: { userId: number; fullName: string; institution?: string | null };
  _count: { members: number; tasks: number };
}

export interface TaskFormValues {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assigneeId?: number | null;
  milestoneId?: number | null;
}

export interface MilestoneFormValues {
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: MilestoneStatus;
}

/* ---------- Discussion & Notifications (Module 2, Feature 2) ---------- */

export interface DiscussionAuthor {
  userId: number;
  fullName: string;
  profilePictureUrl?: string | null;
}

export interface DiscussionThread {
  threadId: number;
  projectId: number;
  authorId: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: DiscussionAuthor;
  _count: { comments: number };
}

export interface DiscussionComment {
  commentId: number;
  threadId: number;
  authorId: number;
  body: string;
  createdAt: string;
  author: DiscussionAuthor;
}

export interface DiscussionThreadDetail {
  threadId: number;
  projectId: number;
  authorId: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: DiscussionAuthor;
  comments: DiscussionComment[];
}

export type NotificationType =
  | "DISCUSSION_THREAD"
  | "DISCUSSION_REPLY"
  | "APPLICATION_RECEIVED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "TASK_ASSIGNED"
  | "TASK_UPDATED"
  | "MEETING_SCHEDULED"
  | "MEETING_UPDATED"
  | "MEETING_CANCELLED"
  | "ROLE_ASSIGNED"
  | "CONTRIBUTION_EVALUATED";

export interface Notification {
  notificationId: number;
  userId: number;
  actorId?: number | null;
  projectId?: number | null;
  type: NotificationType;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: DiscussionAuthor | null;
}

/* ---------- Documents (Module 2, Feature 3) ---------- */

export interface ProjectDocument {
  documentId: number;
  projectId: number;
  uploaderId: number;
  title: string;
  description?: string | null;
  category?: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  uploader: {
    userId: number;
    fullName: string;
    profilePictureUrl?: string | null;
  };
}

export interface DocumentPayload {
  title?: string;
  description?: string;
  category?: string;
  file?: File | null;
}

/* ---------- Meetings + Google Calendar (Module 3, Feature 1) ---------- */

export interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  googleEmail?: string | null;
}

export interface MeetingAttendee {
  meetingId: number;
  userId: number;
  googleEventId?: string | null;
  syncedAt?: string | null;
  user: { userId: number; fullName: string };
}

export interface Meeting {
  meetingId: number;
  projectId: number;
  organizerId: number;
  title: string;
  description?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  organizer: {
    userId: number;
    fullName: string;
    profilePictureUrl?: string | null;
  };
  attendees: MeetingAttendee[];
}

export interface MeetingFormValues {
  title: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
}

/* ---------- Project Recommendations (Module 3, Feature 2) ---------- */

export interface ProjectRecommendationMeta {
  matchPercent: number;
  matchScore: number;
  matchedSkills: {
    skillId: number;
    name: string;
    importanceLevel: ImportanceLevel;
    // Present when the skill is declared on the researcher's portfolio.
    proficiencyLevel?: ProficiencyLevel;
    declared: boolean;
  }[];
  matchedInterests: string[];
}

export interface RecommendedProject extends Project {
  recommendation: ProjectRecommendationMeta;
}

/* ---------- Proposal Quality Assistant (Module 3, Feature 3) ---------- */

export interface ProposalDimension {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface ProposalAnalysis {
  overallScore: number;
  summary: string;
  clarity: ProposalDimension;
  completeness: ProposalDimension;
  structure: ProposalDimension;
  strengths: string[];
}

/* ---------- Project Analytics (Module 3, Feature 4) ---------- */

export interface AnalyticsProgress {
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  overdueTasks: number;
  tasks: { TODO: number; IN_PROGRESS: number; DONE: number };
  priorities: { LOW: number; MEDIUM: number; HIGH: number };
}

export interface AnalyticsMilestone {
  milestoneId: number;
  title: string;
  status: MilestoneStatus;
  dueDate?: string | null;
  isOverdue: boolean;
  taskTotal: number;
  taskDone: number;
  completionPercent: number;
}

export interface AnalyticsContribution {
  userId: number;
  fullName: string;
  role: MemberRole;
  joinedAt: string;
  tasksAssigned: number;
  tasksCompleted: number;
  threads: number;
  comments: number;
  documents: number;
  meetings: number;
  score: number;
  sharePercent: number;
}

export interface ProjectAnalytics {
  progress: AnalyticsProgress;
  milestones: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    breakdown: AnalyticsMilestone[];
  };
  timeline: { date: string; completed: number; cumulative: number }[];
  collaboration: {
    threads: number;
    comments: number;
    documents: number;
    meetings: number;
    applications: number;
    members: number;
  };
  contributions: AnalyticsContribution[];
}

/* ---------- Academic Publication Search (Module 3, Feature 5) ---------- */

export type PublicationSort = "relevance" | "citations" | "newest";

export interface PublicationAuthor {
  name: string;
  institution?: string | null;
}

export interface Publication {
  openAlexId: string;
  title: string;
  doi?: string | null;
  doiUrl?: string | null;
  year?: number | null;
  publicationDate?: string | null;
  citationCount: number;
  authors: PublicationAuthor[];
  venue?: string | null;
  type?: string | null;
  isOpenAccess: boolean;
  openAccessUrl?: string | null;
  landingPageUrl?: string | null;
  abstract?: string | null;
}

export interface PublicationSearchFilters {
  query: string;
  fromYear?: number;
  toYear?: number;
  openAccessOnly?: boolean;
  sort?: PublicationSort;
  page?: number;
  perPage?: number;
}

export interface PublicationSearchResult {
  publications: Publication[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/* ---------- Research Portfolio (Module 1, Feature 4) ---------- */

export interface Interest {
  interestId: number;
  name: string;
}

export interface EducationEntry {
  educationId: number;
  userId: number;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startYear?: number | null;
  endYear?: number | null;
}

export interface PublicationEntry {
  publicationId: number;
  userId: number;
  title: string;
  doi?: string | null;
  externalId?: string | null;
  authors?: string | null;
  venue?: string | null;
  year?: number | null;
  citationCount: number;
  sourceApi: string;
  createdAt: string;
}

export interface ExperienceEntry {
  experienceId: number;
  userId: number;
  title: string;
  description?: string | null;
  role?: string | null;
  organization?: string | null;
  startYear?: number | null;
  endYear?: number | null;
}

export interface Portfolio {
  userId: number;
  fullName: string;
  email: string;
  bio?: string | null;
  institution?: string | null;
  designation?: string | null;
  orcidId?: string | null;
  websiteUrl?: string | null;
  openToCollaboration: boolean;
  profilePictureUrl?: string | null;
  createdAt: string;
  skills: UserSkillEntry[];
  interests: UserInterestEntry[];
  educations: EducationEntry[];
  publications: PublicationEntry[];
  projectExperiences: ExperienceEntry[];
}

export interface ProfileFormValues {
  fullName?: string;
  bio?: string;
  institution?: string;
  designation?: string;
  orcidId?: string;
  websiteUrl?: string;
  openToCollaboration?: boolean;
}

export interface EducationFormValues {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startYear?: number | null;
  endYear?: number | null;
}

export interface PublicationFormValues {
  title: string;
  authors?: string;
  venue?: string;
  doi?: string;
  year?: number | null;
  citationCount?: number;
}

export interface ExperienceFormValues {
  title: string;
  description?: string;
  role?: string;
  organization?: string;
  startYear?: number | null;
  endYear?: number | null;
}

/* ---------- Team Responsibility Management (Module 2, Feature 4) ---------- */

export interface TeamActivity {
  tasksAssigned: number;
  tasksCompleted: number;
  threads: number;
  comments: number;
  documents: number;
  meetings: number;
  activityScore: number;
  sharePercent: number;
}

export interface TeamEvaluation {
  contributionScore?: number | null;
  contributionNotes?: string | null;
  evaluatedAt?: string | null;
}

export interface TeamMember {
  projectId: number;
  userId: number;
  role: MemberRole;
  roleLabel: string;
  responsibilities?: string | null;
  joinedAt: string;
  user: {
    userId: number;
    fullName: string;
    email: string;
    institution?: string | null;
    designation?: string | null;
    profilePictureUrl?: string | null;
  };
  activity: TeamActivity;
  // Null when the viewer isn't allowed to see this member's evaluation.
  evaluation: TeamEvaluation | null;
}

export interface TeamResponse {
  team: TeamMember[];
  isOwner: boolean;
}

// OWNER is not assignable - it's who created the project.
export type AssignableRole = Exclude<MemberRole, "OWNER">;
