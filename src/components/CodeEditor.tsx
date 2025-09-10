import { LANGUAGES } from "@/constants";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertCircleIcon, BookIcon, LightbulbIcon } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useParams } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";

function CodeEditor() {
  const params = useParams();
  const { isInterviewer } = useUserRole();
  const interview = useQuery(api.interviews.getInterviewByStreamCallId, {
    streamCallId: params.id as string,
  });
  
  // Fetch questions for interviewer and for the owner (interviewer) separately
  const interviewerId = interview?.interviewerIds?.[0];
  const myQuestions = useQuery(api.questions.getQuestions);
  const ownerQuestions = useQuery(
    api.questions.getQuestionsByUser,
    interviewerId ? { userId: interviewerId } : "skip"
  );

  // Pick which question list to use
  const questions = useMemo(() => {
    if (isInterviewer) {
      return myQuestions;
    } else {
      // For candidates, if we don't have interview data yet, show loading
      if (!interview) return undefined;
      return ownerQuestions;
    }
  }, [isInterviewer, myQuestions, ownerQuestions, interview]);
  
  const setCurrentQuestion = useMutation(api.interviews.setInterviewCurrentQuestion);
  const updateInterviewCode = useMutation(api.interviews.updateInterviewCode);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [language, setLanguage] = useState<"javascript" | "python" | "java" | "cpp">(LANGUAGES[0].id);
  const [code, setCode] = useState("");
  const isTypingRef = useRef(false);
  const lastLocalChangeRef = useRef(0);

  // Sync to interview.currentQuestionId when present
  useEffect(() => {
    if (!questions || !interview?.currentQuestionId) return;
    const q = questions.find((qq: any) => qq._id === interview.currentQuestionId);
    if (q && (!selectedQuestion || selectedQuestion._id !== q._id)) {
      setSelectedQuestion(q);
      // Always use starter code when question changes to ensure clean slate
      setCode(q.starterCode[language]);
    }
  }, [questions, interview?.currentQuestionId, language, selectedQuestion]);

  // Sync code and language from interview record
  useEffect(() => {
    if (!interview) return;
    
    // Update language if interview has a different one
    if (interview.currentLanguage && interview.currentLanguage !== language) {
      setLanguage(interview.currentLanguage as "javascript" | "python" | "java" | "cpp");
    }
    
    // Only update code if:
    // 1. Interview has code
    // 2. It's different from current code
    // 3. User is not currently typing
    // 4. The change didn't come from this user recently
    // 5. We have a selected question (to avoid syncing before question is loaded)
    const now = Date.now();
    if (interview.currentCode && 
        interview.currentCode !== code && 
        !isTypingRef.current && 
        (now - lastLocalChangeRef.current) > 1000 &&
        selectedQuestion) {
      setCode(interview.currentCode);
    }
  }, [interview?.currentCode, interview?.currentLanguage, code, selectedQuestion]);


  // Ensure interviewer sees the first question immediately; broadcast when interview is ready
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    if (selectedQuestion) return;

    // Always select first locally
    const first = questions[0];
    setSelectedQuestion(first);
    const starterCode = first.starterCode[language];
    setCode(starterCode);

    // If interviewer and interview is ready with no current question, broadcast selection
    if (isInterviewer && interview?._id && !interview.currentQuestionId) {
      void setCurrentQuestion({ interviewId: interview._id, questionId: first._id });
      // Also set the starter code in the interview record
      void updateInterviewCode({
        interviewId: interview._id,
        code: starterCode,
        language: language,
      });
    }
  }, [questions, isInterviewer, interview?._id, interview?.currentQuestionId, language, selectedQuestion, setCurrentQuestion, updateInterviewCode]);

  const handleQuestionChange = async (questionId: string) => {
    const question = questions?.find((q) => q._id === questionId);
    if (question) {
      setSelectedQuestion(question);
      const newStarterCode = question.starterCode[language];
      setCode(newStarterCode);
      
      if (isInterviewer && interview?._id) {
        // Update the question and reset the code in the interview record
        await setCurrentQuestion({ interviewId: interview._id, questionId: question._id });
        // Also update the code to the new starter code
        await updateInterviewCode({
          interviewId: interview._id,
          code: newStarterCode,
          language: language,
        });
      }
    }
  };

  const handleLanguageChange = (newLanguage: "javascript" | "python" | "java" | "cpp") => {
    setLanguage(newLanguage);
    if (selectedQuestion) {
      const newCode = selectedQuestion.starterCode[newLanguage];
      setCode(newCode);
      // Update interview with new language and code
      if (interview?._id) {
        updateInterviewCode({
          interviewId: interview._id,
          code: newCode,
          language: newLanguage,
        });
      }
    }
  };

  // Debounced function to update interview code
  const debouncedUpdateCode = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newCode: string, newLanguage: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (interview?._id) {
            updateInterviewCode({
              interviewId: interview._id,
              code: newCode,
              language: newLanguage,
            }).catch((error) => {
              console.error("Failed to update interview code:", error);
            });
          }
        }, 300); // 300ms debounce for better responsiveness
      };
    })(),
    [interview?._id, updateInterviewCode]
  );

  const handleCodeChange = (newCode: string | undefined) => {
    const codeValue = newCode || "";
    setCode(codeValue);
    
    // Mark that user is typing and record the timestamp
    isTypingRef.current = true;
    lastLocalChangeRef.current = Date.now();
    
    // Clear typing flag after a short delay
    setTimeout(() => {
      isTypingRef.current = false;
    }, 500);
    
    debouncedUpdateCode(codeValue, language);
  };

  if (questions === undefined) {
    if (isInterviewer) {
      return <div className="flex items-center justify-center h-64">Loading your questions...</div>;
    } else {
      if (!interview) {
        return <div className="flex items-center justify-center h-64">Loading interview data...</div>;
      }
      return <div className="flex items-center justify-center h-64">Loading questions...</div>;
    }
  }
  if (!selectedQuestion) {
    if (isInterviewer) {
      return <div className="flex items-center justify-center h-64">No questions available. Create one in Questions, then select it here.</div>;
    }
    return <div className="flex items-center justify-center h-64">Waiting for interviewer to select a question…</div>;
  }

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[calc-100vh-4rem-1px]">
      {/* QUESTION SECTION */}
      <ResizablePanel>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {selectedQuestion.title}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose your language and solve the problem
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select 
                    value={selectedQuestion?._id ?? ""} 
                    onValueChange={handleQuestionChange}
                    disabled={!isInterviewer}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select question" />
                    </SelectTrigger>
                    <SelectContent>
                      {questions?.map((q) => (
                        <SelectItem key={q._id} value={q._id}>
                          {q.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[150px]">
                      {/* SELECT VALUE */}
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <img
                            src={`/${language}.png`}
                            alt={language}
                            className="w-5 h-5 object-contain"
                          />
                          {LANGUAGES.find((l) => l.id === language)?.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    {/* SELECT CONTENT */}
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id}>
                          <div className="flex items-center gap-2">
                            <img
                              src={`/${lang.id}.png`}
                              alt={lang.name}
                              className="w-5 h-5 object-contain"
                            />
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PROBLEM DESC. */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <BookIcon className="h-5 w-5 text-primary/80" />
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line">{selectedQuestion.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* PROBLEM EXAMPLES */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <LightbulbIcon className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-full w-full rounded-md border">
                    <div className="p-4 space-y-4">
                      {selectedQuestion.examples.map((example: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <p className="font-medium text-sm">Example {index + 1}:</p>
                          <ScrollArea className="h-full w-full rounded-md">
                            <pre className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                              <div>Input: {example.input}</div>
                              <div>Output: {example.output}</div>
                              {example.explanation && (
                                <div className="pt-2 text-muted-foreground">
                                  Explanation: {example.explanation}
                                </div>
                              )}
                            </pre>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        </div>
                      ))}
                    </div>
                    <ScrollBar />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* CONSTRAINTS */}
              {selectedQuestion.constraints && selectedQuestion.constraints.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <AlertCircleIcon className="h-5 w-5 text-blue-500" />
                    <CardTitle>Constraints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1.5 text-sm marker:text-muted-foreground">
                      {selectedQuestion.constraints.map((constraint: string, index: number) => (
                        <li key={index} className="text-muted-foreground">
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <ScrollBar />
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* CODE EDITOR */}
      <ResizablePanel defaultSize={60} maxSize={100}>
        <div className="h-full relative">
          <Editor
            key={`${interview?._id}-${language}`}
            height={"100%"}
            defaultLanguage={language}
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 18,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              wordWrap: "on",
              wrappingIndent: "indent",
            }}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
export default CodeEditor;