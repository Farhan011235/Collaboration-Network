import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skills = [
  // Programming
  { name: "Python", category: "Programming" },
  { name: "JavaScript", category: "Programming" },
  { name: "TypeScript", category: "Programming" },
  { name: "Java", category: "Programming" },
  { name: "C++", category: "Programming" },
  { name: "R", category: "Programming" },
  { name: "MATLAB", category: "Programming" },
  { name: "SQL", category: "Programming" },

  // Data & ML
  { name: "Machine Learning", category: "Data Science" },
  { name: "Deep Learning", category: "Data Science" },
  { name: "Natural Language Processing", category: "Data Science" },
  { name: "Computer Vision", category: "Data Science" },
  { name: "Data Analysis", category: "Data Science" },
  { name: "Data Visualization", category: "Data Science" },
  { name: "Statistical Modeling", category: "Data Science" },

  // Research
  { name: "Academic Writing", category: "Research" },
  { name: "Literature Review", category: "Research" },
  { name: "Research Methodology", category: "Research" },
  { name: "Survey Design", category: "Research" },
  { name: "Qualitative Research", category: "Research" },
  { name: "Quantitative Research", category: "Research" },

  // Engineering
  { name: "Web Development", category: "Engineering" },
  { name: "Mobile Development", category: "Engineering" },
  { name: "Cloud Computing", category: "Engineering" },
  { name: "DevOps", category: "Engineering" },
  { name: "Embedded Systems", category: "Engineering" },
  { name: "Database Design", category: "Engineering" },

  // Design
  { name: "UI/UX Design", category: "Design" },
  { name: "Technical Documentation", category: "Design" },
  { name: "Project Management", category: "Design" },
];

const interests = [
  "Artificial Intelligence",
  "Machine Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Data Science",
  "Human-Computer Interaction",
  "Cybersecurity",
  "Software Engineering",
  "Networking",
  "Internet of Things",
  "Robotics",
  "Bioinformatics",
  "Health Informatics",
  "Climate Science",
  "Renewable Energy",
  "Educational Technology",
  "Computational Linguistics",
  "Blockchain",
  "Cloud Computing",
  "Quantum Computing",
  "Social Computing",
  "Public Health",
  "Economics",
  "Psychology",
];

async function main() {
  console.log("Seeding skills...");
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  console.log("Seeding interests...");
  for (const name of interests) {
    await prisma.interest.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Done. ${skills.length} skills, ${interests.length} interests.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
