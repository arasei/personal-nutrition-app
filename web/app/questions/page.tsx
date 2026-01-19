export default async function Questionspage() {
  const res = await fetch("/api/questions",{
    cache: "no-store",
  });
  const questions = await res.json();
  return (
    <main>
      <h1>質問一覧</h1>
      <ul>
        {questions.map((q: any) => (
          <li key={q.id}>
            {q.order}, {q.questionText}
          </li>
        ))}
      </ul>
    </main>
  )
}
