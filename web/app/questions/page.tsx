async function getQuestions() {
  const res = await fetch("http://localhost:3000/api/questions",{
    cache: "no-store",
  });
  return res.json();
}

export default async function QuestionsPage() {
  const questions = await getQuestions();

  return (
    <main>
      <h1>質問一覧</h1>
      <ul>
        {questions.map((q: any) => (
          <li key={q.id}>
            {q.order}. {q.questionText}
          </li>
        ))}
      </ul>
    </main>
  );
}