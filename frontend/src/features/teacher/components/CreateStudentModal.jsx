// frontend/src/features/teacher/components/quizzes/CreateQuizModal.jsx
import { useEffect, useState } from "react";
import { 
  Sparkles, FileText, Plus, Trash2, Settings, AlertCircle, CheckCircle2, ChevronRight, X
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { 
  useGetClassesQuery, 
  useGetGradesQuery, 
  useCreateQuizMutation 
} from "../../../store/api/realApi";
const STEPS = [
  { id: 1, label: "Quiz Type" },
  { id: 2, label: "Select Source" },
  { id: 3, label: "Define Questions" },
  { id: 4, label: "Publish" },
];

const COUNTS = [5, 10, 15, 20];

export default function CreateQuizModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [creationType, setCreationType] = useState(null); // ai | bank | manual
  
  // Data State
  const [gradeId, setGradeId] = useState("");
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("English");
  const [topic, setTopic] = useState("Recap");
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [questionCount, setQuestionCount] = useState(10);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];
  const { data: classesData } = useGetClassesQuery();
  const allClasses = classesData?.results ?? classesData ?? [];

  // Reset on open
  useEffect(() => {
    if (!open) {
      setStep(1); 
      setCreationType(null); 
      setQuestions([]); 
      setFile(null); 
      setTitle(""); 
      setError(""); 
      setIsGenerating(false);
      setQuestionCount(10);
    }
  }, [open]);

  // Auto-select class based on grade
  useEffect(() => {
    if (gradeId) {
      const c = allClasses.find((cls) => cls.grade?.id === gradeId);
      if (c) setClassId(c.id);
    }
  }, [gradeId, allClasses]);

  // --- ACTIONS ---

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setTimeout(() => {
        setSubject("Physics");
        setTopic("Newton's Laws (detected)");
      }, 800);
    }
  };

  const runAiGeneration = async () => {
    if (!file || !title) {
      setError("Please upload a PDF and enter a quiz title first.");
      return;
    }
    setError("");
    setIsGenerating(true);

    try {
      // 1. Prepare the data to send to your Django backend
      const formData = new FormData();
      formData.append("pdf", file); // Ensure this matches Django's GenerateFromPdfSerializer
      formData.append("class_course", classId); // Django requires class_course
      formData.append("title", title);
      formData.append("question_count", questionCount);
      formData.append("duration_minutes", 30);
      formData.append("passing_score", 60);
      formData.append("difficulty", "mixed");

      // 2. Call your actual backend API endpoint
      const response = await fetch("http://localhost:8000/api/v1/quizzes/generate-from-pdf/", {
        method: "POST",
        headers: {
          // DO NOT set Content-Type here, the browser sets it automatically for FormData
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`, 
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate questions.");
      }

      const data = await response.json();
      
      // 3. Format the backend's response into the frontend's expected structure
      const formattedQuestions = data.questions.map((q, i) => {
        // Find the index of the correct choice
        const correctIndex = q.choices.findIndex(c => c.is_correct);
        
        return {
          id: i,
          type: "Multiple Choice", // Gemini currently only generates Multiple Choice
          text: q.question_text || q.question || "",
          options: q.choices.map(c => c.choice_text), // Map backend 'choice_text' to frontend 'options'
          correct: correctIndex >= 0 ? correctIndex : 0,
          explanation: q.explanation || "",
          selected: true
        };
      });

      setQuestions(formattedQuestions);
      setActiveQuestionIdx(0);
    } catch (err) {
      setError(err.message || "AI generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAndProceedToReview = () => {
    setStep(3);
  };

  const handlePublish = async () => {
    try {
      // In a real app, you would call your createQuiz API here
      // const payload = {
      //   title, 
      //   class_course: classId, 
      //   duration_minutes: 30,
      //   passing_score: 60,
      //   questions: questions.map(q => ({
      //     question_text: q.text,
      //     points: 1,
      //     choices: q.options.map((opt, i) => ({
      //       choice_text: opt,
      //       is_correct: i === q.correct
      //     }))
      //   }))
      // };
      // await createQuiz(payload).unwrap();
      
      onCreated?.();
      onClose();
    } catch (err) {
      setError("Failed to publish quiz.");
    }
  };

  // --- RENDER HELPERS ---

  const renderStepper = () => (
    <div className="flex items-center gap-2 mb-6 bg-slate-900 rounded-lg p-1.5 overflow-x-auto">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center shrink-0">
          <button 
            className={`px-4 py-2 rounded-md text-xs md:text-sm font-bold flex items-center gap-2 transition ${step === s.id ? "bg-purple-600 text-white" : step > s.id ? "text-purple-400" : "text-slate-500"}`}
            onClick={() => { if (s.id < step) setStep(s.id); }}
          >
            {step > s.id ? <CheckCircle2 size={16} /> : <span>{s.id}</span>}
            {s.label}
          </button>
          {i < STEPS.length - 1 && <ChevronRight size={16} className="text-slate-600 mx-1" />}
        </div>
      ))}
    </div>
  );

  // --- STEP 1: SELECT TYPE ---
  const Step1Selection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onClick={() => { setCreationType("ai"); }}
          className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center text-center transition ${creationType === "ai" ? "border-purple-500 bg-purple-500/10" : "border-slate-700 hover:border-slate-500"}`}>
          <div className="text-5xl mb-4">📄</div>
          <h3 className="font-bold text-lg mb-2 text-white">AI-Powered from PDF</h3>
          <p className="text-xs text-slate-400 mb-6 flex-1">Quickly create a quiz from a study PDF or material.</p>
          <button className={`w-full py-2 rounded-lg font-bold ${creationType === "ai" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300"}`}>Select</button>
        </div>

        <div onClick={() => { setCreationType("bank"); }}
          className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center text-center transition ${creationType === "bank" ? "border-purple-500 bg-purple-500/10" : "border-slate-700 hover:border-slate-500"}`}>
          <div className="text-5xl mb-4">🗂️</div>
          <h3 className="font-bold text-lg mb-2 text-white">Select from Bank</h3>
          <p className="text-xs text-slate-400 mb-6 flex-1">Search and import questions from your previously created quizzes.</p>
          <button className={`w-full py-2 rounded-lg font-bold ${creationType === "bank" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300"}`}>Select</button>
        </div>

        <div onClick={() => { setCreationType("manual"); }}
          className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center text-center transition ${creationType === "manual" ? "border-purple-500 bg-purple-500/10" : "border-slate-700 hover:border-slate-500"}`}>
          <div className="text-5xl mb-4">✍️</div>
          <h3 className="font-bold text-lg mb-2 text-white">Manual Quiz Creation</h3>
          <p className="text-xs text-slate-400 mb-6 flex-1">Build your quiz question by question with a robust editor.</p>
          <button className={`w-full py-2 rounded-lg font-bold ${creationType === "manual" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300"}`}>Select</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-700 pt-4">
        <label className="block">
          <span className="text-xs font-bold text-slate-400 mb-1">Select Class</span>
          <select value={gradeId} onChange={e => setGradeId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm">
            <option value="">Select Grade...</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-400 mb-1">Quiz Title</span>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Unit 1 Midterm Review" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
        </label>
      </div>
    </div>
  );

  // --- STEP 2: GENERATE / PREVIEW ---
  const Step2Source = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full max-h-[500px]">
      
      {/* Left: Document Preview */}
      <div className="md:col-span-5 bg-slate-800 rounded-xl p-4 flex flex-col border border-slate-700 h-full">
        <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><FileText size={16} /> Document Preview</h4>
        
        <div className="flex-1 bg-slate-900 rounded border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
          {file ? (
             <div className="text-center">
                <FileText size={64} className="text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold">{file.name}</p>
                <p className="text-xs text-slate-500">PDF Document Loaded</p>
             </div>
          ) : (
            <div className="text-center p-6 border-2 border-dashed border-slate-600 rounded-xl hover:bg-slate-800 transition cursor-pointer" onClick={() => document.getElementById('pdf-upload').click()}>
               <input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
               <Plus size={32} className="text-slate-500 mx-auto mb-2" />
               <p className="text-sm font-bold text-slate-300">Upload PDF</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Config & Status */}
      <div className="md:col-span-7 flex flex-col gap-4 overflow-y-auto h-full pr-2">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400">Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-sm" />
            </div>
          </div>

          {/* Number of Questions Selector */}
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-400 mb-2 block">Number of Questions</label>
            <div className="flex gap-2">
              {COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${questionCount === n ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-700"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* AI Generation State */}
          {isGenerating ? (
            <div className="text-center py-8">
               <Sparkles size={32} className="text-purple-500 mx-auto animate-bounce mb-3" />
               <p className="text-white font-bold">AI is generating {questionCount} questions...</p>
               <div className="w-48 h-2 bg-slate-700 rounded-full mx-auto mt-4 overflow-hidden">
                 <div className="h-full bg-purple-500 w-1/2 animate-pulse"></div>
               </div>
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {questions.map((q, idx) => (
                <div key={idx} className={`p-3 rounded border ${q.selected ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-900 border-slate-700'}`}>
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-slate-500">Question {idx + 1}</span>
                     <button onClick={() => {}}><Settings size={14} className="text-slate-500"/></button>
                   </div>
                   <p className="text-sm text-white mb-2">{q.text}</p>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-purple-400 font-semibold">{q.type}</span>
                     <div className="flex items-center gap-2">
                       <span className="text-slate-400">Include</span>
                       <input type="checkbox" defaultChecked className="accent-purple-500" />
                     </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">Click "Generate with AI" to create questions.</p>
          )}
        </div>
      </div>
    </div>
  );

  // --- STEP 3: DEFINE QUESTIONS / EDITOR ---
  const Step3Define = () => (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full max-h-[500px]">
        <div className="md:col-span-4 bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col h-full">
           <h4 className="font-bold text-white mb-3">Current Questions ({questions.length})</h4>
           <div className="flex-1 overflow-y-auto space-y-2 pr-2">
             {questions.map((q, idx) => (
               <div key={idx} onClick={() => setActiveQuestionIdx(idx)}
                 className={`p-3 rounded-lg cursor-pointer border ${activeQuestionIdx === idx ? 'bg-purple-600/20 border-purple-500' : 'bg-slate-900 border-slate-700'}`}>
                 <p className="text-sm font-semibold text-white line-clamp-2">{idx + 1}. {q.text || "New Question"}</p>
                 <p className="text-xs text-slate-400 mt-2">{q.type}</p>
               </div>
             ))}
           </div>
           <button onClick={() => { setQuestions([...questions, { type: "Multiple Choice", text: "", options: ["", "", "", ""], correct: 0 }]); setActiveQuestionIdx(questions.length); }}
             className="mt-3 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded flex justify-center items-center gap-2 text-sm font-bold shrink-0">
             <Plus size={14}/> Add Question
           </button>
        </div>

        <div className="md:col-span-8 bg-slate-800 rounded-xl p-5 border border-slate-700 overflow-y-auto h-full">
           {questions[activeQuestionIdx] ? (
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <h4 className="font-bold text-white">Edit Question {activeQuestionIdx + 1}</h4>
                   <button className="text-xs font-bold text-red-400 flex items-center gap-1 hover:text-red-300" 
                     onClick={() => { setQuestions(questions.filter((_,i)=>i!==activeQuestionIdx)); setActiveQuestionIdx(0); }}>
                     <Trash2 size={14}/> Delete
                   </button>
                </div>

                <textarea 
                  value={questions[activeQuestionIdx].text} 
                  onChange={(e) => {
                    const newQ = [...questions];
                    newQ[activeQuestionIdx].text = e.target.value;
                    setQuestions(newQ);
                  }}
                  placeholder="Type your question here..." 
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm h-24" 
                />

                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-xs font-bold text-slate-400 mb-1 block">Question Type</label>
                     <select className="w-full bg-slate-900 border border-slate-700 text-white rounded px-3 py-2 text-sm">
                        <option>Multiple Choice</option>
                        <option>Short Answer</option>
                     </select>
                   </div>
                </div>

                {/* Safely render options if they exist */}
                {questions[activeQuestionIdx].options && questions[activeQuestionIdx].options.length > 0 && (
                  <div className="space-y-2 mt-4">
                     <label className="text-xs font-bold text-slate-400 block mb-2">Options / Answers</label>
                     {["A", "B", "C", "D"].map((letter, idx) => (
                       <div key={letter} className="flex items-center gap-3">
                         <button 
                           onClick={() => {
                             const newQ = [...questions];
                             newQ[activeQuestionIdx].correct = idx;
                             setQuestions(newQ);
                           }}
                           className={`h-6 w-6 shrink-0 rounded-full font-bold flex items-center justify-center text-xs ${questions[activeQuestionIdx].correct === idx ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                         >{letter}</button>
                         <input 
                           value={questions[activeQuestionIdx].options?.[idx] || ""}
                           onChange={(e) => {
                             const newQ = [...questions];
                             if (!newQ[activeQuestionIdx].options) newQ[activeQuestionIdx].options = ["", "", "", ""];
                             newQ[activeQuestionIdx].options[idx] = e.target.value;
                             setQuestions(newQ);
                           }}
                           placeholder={`Option ${letter}`} 
                           className="flex-1 bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 text-sm" 
                         />
                       </div>
                     ))}
                  </div>
                )}
             </div>
           ) : (
             <div className="flex h-full items-center justify-center text-slate-500 text-sm">Select or add a question to edit.</div>
           )}
        </div>
      </div>
  );

  // --- MAIN RENDER ---
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6">
      
      <div className="w-full max-w-5xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
           <h2 className="text-xl font-bold text-white">Create New Quiz</h2>
           <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800 shrink-0">
          {renderStepper()}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
           {error && (
             <div className="mb-4 p-3 bg-red-900 border border-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-lg animate-pulse">
               <AlertCircle size={16}/> {error}
             </div>
           )}
           
           {step === 1 && Step1Selection()}
           {step === 2 && Step2Source()}
           {step === 3 && Step3Define()}
           
           {step === 4 && (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="h-20 w-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                   <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white">Ready to Publish</h3>
                <p className="text-slate-400 text-sm max-w-md">Your quiz "{title}" is ready with {questions.length} questions. Click Publish to make it available to students.</p>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
           <Button variant="secondary" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
              {step === 1 ? "Cancel" : "Previous"}
           </Button>
           
           <div className="flex gap-3">
              {step === 1 && (
                <Button variant="primary" onClick={() => {
                  if (creationType === "ai") setStep(2);
                  if (creationType === "bank") setStep(3);
                  if (creationType === "manual") { setQuestions([{ type: "Multiple Choice", text: "", options: ["", "", "", ""], correct: 0 }]); setStep(3); }
                }} disabled={!creationType || !title || !gradeId}>Next</Button>
              )}

              {step === 2 && creationType === "ai" && (
                <Button variant="primary" onClick={runAiGeneration} disabled={isGenerating || !file}>
                   {isGenerating ? "Generating..." : "Generate with AI"}
                </Button>
              )}

              {step === 2 && !isGenerating && questions.length > 0 && (
                <Button variant="primary" onClick={saveAndProceedToReview}>Review & Refine</Button>
              )}

              {step === 3 && (
                <Button variant="primary" onClick={() => setStep(4)} disabled={questions.length === 0}>Create Quiz</Button>
              )}

              {step === 4 && (
                <Button variant="primary" onClick={handlePublish} className="bg-emerald-600 hover:bg-emerald-500">Publish Quiz</Button>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}