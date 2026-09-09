export type Paper = {
  title: string;
  subject: string;
  level: string;
  board: string;
  year: string;
  type: string;
  duration: string;
  marks: string;
  accent: string;
  description: string;
};

export const papers: Paper[] = [
  {
    title: "Mathematics Paper 1: Pure",
    subject: "Mathematics",
    level: "A Level",
    board: "AQA",
    year: "2025",
    type: "Past paper",
    duration: "2h",
    marks: "100 marks",
    accent: "coral",
    description:
      "Practice algebra, functions, coordinate geometry, and proof with exam-style questions.",
  },
  {
    title: "Physics Paper 2: Mechanics",
    subject: "Physics",
    level: "GCSE",
    board: "Edexcel",
    year: "2024",
    type: "Past paper",
    duration: "1h 45m",
    marks: "100 marks",
    accent: "mint",
    description:
      "Work through motion, forces, and energy problems that mirror real exam demands.",
  },
  {
    title: "English Literature: Modern Texts",
    subject: "English Literature",
    level: "GCSE",
    board: "OCR",
    year: "2024",
    type: "Mock paper",
    duration: "2h 15m",
    marks: "80 marks",
    accent: "lilac",
    description:
      "Build confidence with an unseen extract and guided modern prose practice.",
  },
  {
    title: "Biology Paper 1: Cell Biology",
    subject: "Biology",
    level: "A Level",
    board: "OCR",
    year: "2023",
    type: "Mark scheme",
    duration: "2h",
    marks: "100 marks",
    accent: "peach",
    description:
      "Use this mark scheme to see how answers are marked and where points are awarded.",
  },
  {
    title: "History: Britain 1930–1997",
    subject: "History",
    level: "A Level",
    board: "AQA",
    year: "2024",
    type: "Past paper",
    duration: "2h 30m",
    marks: "80 marks",
    accent: "coral",
    description:
      "Essay and source practice covering key twentieth-century turning points.",
  },
  {
    title: "Computer Science Paper 2",
    subject: "Computer Science",
    level: "GCSE",
    board: "Edexcel",
    year: "2025",
    type: "Practice set",
    duration: "1h 30m",
    marks: "75 marks",
    accent: "mint",
    description:
      "Targeted algorithm and programming questions to sharpen exam technique.",
  },
];

export const subjects = [
  "All subjects",
  "Mathematics",
  "Physics",
  "English Literature",
  "Biology",
  "History",
  "Computer Science",
];
export const levels = ["All levels", "GCSE", "A Level"];
export const boards = ["All boards", "AQA", "Edexcel", "OCR"];
export const types = [
  "All types",
  "Past paper",
  "Mock paper",
  "Practice set",
  "Mark scheme",
];
