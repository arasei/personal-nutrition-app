import { prisma }from "@/lib/prisma";

export default async function QuestionsPage() {
  const questions = await prisma.diagnosisQuestion.findMany ({
    orderBy: { order: "asc" },
  });

  return (
    <main>
      <h1>質問一覧</h1>
      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            {q.order}, {q.questionText},
          </li>
        ))}
      </ul>
    </main>
  );
}