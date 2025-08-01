"use client"
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Plus, Edit, Trash2, Code2 } from "lucide-react";
import toast from "react-hot-toast";

interface QuestionFormData {
  title: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
  constraints: string[];
}

const defaultFormData: QuestionFormData = {
  title: "",
  description: "",
  examples: [{ input: "", output: "", explanation: "" }],
  starterCode: {
    javascript: `function solution() {
  // Write your solution here
  
}`,
    python: `def solution():
    # Write your solution here
    pass`,
    java: `class Solution {
    public void solution() {
        // Write your solution here
        
    }
}`,
    cpp: `class Solution {
public:
    void solution() {
        // Write your solution here
        
    }
};`,
  },
  constraints: [""],
};

export default function QuestionManager() {
  const questions = useQuery(api.questions.getQuestions);
  const createQuestion = useMutation(api.questions.createQuestion);
  const updateQuestion = useMutation(api.questions.updateQuestion);
  const deleteQuestion = useMutation(api.questions.deleteQuestion);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [formData, setFormData] = useState<QuestionFormData>(defaultFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingQuestion) {
        await updateQuestion({
          questionId: editingQuestion._id,
          ...formData,
        });
        toast.success("Question updated successfully!");
      } else {
        await createQuestion(formData);
        toast.success("Question created successfully!");
      }
      
      setIsDialogOpen(false);
      setEditingQuestion(null);
      setFormData(defaultFormData);
    } catch (error) {
      toast.error("Failed to save question");
    }
  };

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setFormData({
      title: question.title,
      description: question.description,
      examples: question.examples,
      starterCode: {
        javascript: question.starterCode.javascript || "",
        python: question.starterCode.python || "",
        java: question.starterCode.java || "",
        cpp: question.starterCode.cpp || `class Solution {
public:
    void solution() {
        // Write your solution here
        
    }
};`,
      },
      constraints: question.constraints || [""],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteQuestion({ questionId: questionId as any });
        toast.success("Question deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete question");
      }
    }
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { input: "", output: "", explanation: "" }],
    }));
  };

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  const updateExample = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((example, i) =>
        i === index ? { ...example, [field]: value } : example
      ),
    }));
  };

  const addConstraint = () => {
    setFormData(prev => ({
      ...prev,
      constraints: [...prev.constraints, ""],
    }));
  };

  const removeConstraint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      constraints: prev.constraints.filter((_, i) => i !== index),
    }));
  };

  const updateConstraint = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      constraints: prev.constraints.map((constraint, i) =>
        i === index ? value : constraint
      ),
    }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingQuestion(null);
  };

  if (questions === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Questions</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "Create New Question"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter question title"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter question description"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Examples</label>
                  {formData.examples.map((example, index) => (
                    <Card key={index} className="mt-2">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Example {index + 1}</span>
                            {formData.examples.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeExample(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <Input
                            value={example.input}
                            onChange={(e) => updateExample(index, "input", e.target.value)}
                            placeholder="Input"
                            required
                          />
                          <Input
                            value={example.output}
                            onChange={(e) => updateExample(index, "output", e.target.value)}
                            placeholder="Output"
                            required
                          />
                          <Input
                            value={example.explanation || ""}
                            onChange={(e) => updateExample(index, "explanation", e.target.value)}
                            placeholder="Explanation (optional)"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={addExample} className="mt-2">
                    Add Example
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium">Starter Code</label>
                  <div className="space-y-2">
                    {["javascript", "python", "java", "cpp"].map((lang) => (
                      <div key={lang}>
                        <label className="text-xs text-muted-foreground capitalize">{lang}</label>
                        <Textarea
                          value={formData.starterCode[lang as keyof typeof formData.starterCode]}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            starterCode: {
                              ...prev.starterCode,
                              [lang]: e.target.value,
                            },
                          }))}
                          rows={6}
                          className="font-mono text-sm"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Constraints</label>
                  {formData.constraints.map((constraint, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={constraint}
                        onChange={(e) => updateConstraint(index, e.target.value)}
                        placeholder="Enter constraint"
                      />
                      {formData.constraints.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeConstraint(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addConstraint} className="mt-2">
                    Add Constraint
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingQuestion ? "Update Question" : "Create Question"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {questions.map((question) => (
          <Card key={question._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  <CardTitle className="text-lg">{question.title}</CardTitle>
                  {question.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                {!question.isDefault && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(question)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(question._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {question.description}
              </p>
              <div className="mt-2 flex gap-2">
                <Badge variant="outline">{question.examples.length} examples</Badge>
                {question.constraints && question.constraints.length > 0 && (
                  <Badge variant="outline">{question.constraints.length} constraints</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 