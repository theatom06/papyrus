export type Paper = {
  id: string;
  title: string;
  subject: string;
  board: string;
  classLevel: string;
  year: string;
  type: string;
  description: string;
  duration: number;
  boardId: number;
  classLevelId: number;
  subjectId: number;
  resourceTypeId: number;
  status: "review" | "approved" | "soft_delete" | "hidden";
  downloads: number;
  upvotes: number;
  downvotes: number;
  contributorEmail: string;
  contributorComments: string;
};

export type BoardOption = {
  id: number;
  name: string;
  code: string;
  class_count: number;
  paper_count: number;
};

export type PaperReport = {
  id: number;
  paper_id: string;
  reason: string;
  details: string | null;
  reporter_email: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  paper_title: string;
  paper_year: number;
  board_code: string;
  board_name: string;
  subject_name: string;
  class_level: string;
};

export type PoorPerformingPaper = {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  type: string;
  status: string;
  upvotes: number;
  downvotes: number;
  pending_reports?: number;
};
