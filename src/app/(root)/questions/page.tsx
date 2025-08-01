import QuestionManager from "@/components/QuestionManager";

export default function QuestionsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Questions Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage your coding interview questions
          </p>
        </div>
        <QuestionManager />
      </div>
    </div>
  );
} 