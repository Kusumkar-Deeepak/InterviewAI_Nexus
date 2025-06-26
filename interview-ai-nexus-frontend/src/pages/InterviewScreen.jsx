import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InterviewService } from "./utils/InterviewService";
import { SpeechService } from "./utils/SpeechService";

const InterviewScreen = () => {
  const { interviewLink } = useParams();
  const navigate = useNavigate();

  // Refs
  const videoRef = useRef(null);
  const aiResponseRef = useRef(null);
  const userTranscriptRef = useRef(null);
  const speechService = useRef(null);
  const interviewService = useRef(null);
  const interviewFlow = useRef([]);
  const timerRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const noResponseTimerRef = useRef(null);

  // State
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [aiResponse, setAiResponse] = useState("Initializing interview...");
  const [interviewStatus, setInterviewStatus] = useState("initializing");
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentFlowIndex, setCurrentFlowIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loadingState, setLoadingState] = useState("Starting up...");
  const [questionRepeatCount, setQuestionRepeatCount] = useState(0);
  const [activeTab, setActiveTab] = useState(true);
  const [manualSubmitMode, setManualSubmitMode] = useState(false);
  const [answerRepeatCount, setAnswerRepeatCount] = useState(0);

  // Auto-scroll text areas
  useEffect(() => {
    if (aiResponseRef.current) {
      aiResponseRef.current.scrollTop = aiResponseRef.current.scrollHeight;
    }
    if (userTranscriptRef.current) {
      userTranscriptRef.current.scrollTop =
        userTranscriptRef.current.scrollHeight;
    }
  }, [aiResponse, transcript]);

  // Load saved state
  const loadSavedState = () => {
    try {
      const savedState = localStorage.getItem(
        `interviewState-${interviewLink}`
      );
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed?.interviewStatus === "in_progress") {
          setQuestions(parsed.questions || []);
          setScore(parsed.score || 0);
          setCurrentFlowIndex(parsed.currentFlowIndex || 0);
          setInterviewStatus(parsed.interviewStatus);
          setAiResponse(parsed.aiResponse || "Resuming interview...");
          return true;
        }
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
    return false;
  };

  const saveState = () => {
    if (interviewStatus === "in_progress") {
      const stateToSave = {
        questions,
        score,
        currentFlowIndex,
        interviewStatus,
        aiResponse,
        interviewLink,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        `interviewState-${interviewLink}`,
        JSON.stringify(stateToSave)
      );
    }
  };

  // Initialize services
  useEffect(() => {
    interviewService.current = new InterviewService(
      import.meta.env.VITE_GEMINI_API_KEY
    );
    speechService.current = new SpeechService();
    loadSavedState();

    return () => {
      speechService.current?.cancelAll();
      clearInterval(timerRef.current);
      clearTimeout(noResponseTimerRef.current);
      saveState();
    };
  }, []);

  useEffect(() => {
    if (interviewStatus !== "initializing") {
      saveState();
    }
  }, [questions, score, currentFlowIndex, interviewStatus, aiResponse]);

  const storeInterviewData = (question, answer, score) => {
    const prevSession = JSON.parse(
      localStorage.getItem("interviewSession")
    ) || { questions: [] };
    const interviewSession = {
      interviewId: interviewLink,
      questions: [
        ...(prevSession.questions || []),
        { question, answer, score, timestamp: new Date().toISOString() },
      ],
    };
    localStorage.setItem("interviewSession", JSON.stringify(interviewSession));
  };

  // Initialize interview flow
  const initializeInterviewFlow = (data) => {
    interviewFlow.current = [
      // Extended welcome (1 minute)
      {
        key: "welcome",
        prompt: `Good ${InterviewService.getTimeOfDay()}, ${
          data.applicantName
        }. Welcome to your interview with ${data.companyName} for the ${
          data.jobTitle
        } position. We're excited to learn more about you and your qualifications. Before we begin, please make sure you're in a quiet environment and ready to proceed. How are you feeling today?`,
        action: "listen",
        timeEstimate: 60,
      },
      {
        key: "introduction",
        prompt: `At ${
          data.companyName
        }, we're looking for someone who can ${data.jobDescription.substring(
          0,
          200
        )}... Our ideal candidate would have skills in ${data.skills
          .slice(0, 3)
          .join(
            ", "
          )}. This interview will help us understand your experience and fit for this role.`,
        action: "speak",
        timeEstimate: 45,
      },
      {
        key: "candidateIntroduction",
        prompt:
          "To begin, please introduce yourself and tell us about your professional background, focusing on experiences relevant to this position.",
        action: "listen",
        timeEstimate: 120,
      },
      // Dynamic questions will be added here
      // Extended closing (1 minute)
      {
        key: "closing",
        prompt: `Thank you ${
          data.applicantName
        }. We've reached the end of our interview. We appreciate the time you've taken to share your experiences with us today. Your insights about ${
          questions.slice(-1)[0]?.answer?.substring(0, 50) || "your background"
        } were particularly interesting. We'll review all candidates and be in touch within the next week. Do you have any final questions for us?`,
        action: "listen",
        timeEstimate: 60,
      },
      {
        key: "finalGreeting",
        prompt:
          "Once again, thank you for your time and thoughtful responses. We wish you all the best and will be in contact soon. Have a great day!",
        action: "complete",
        timeEstimate: 20,
      },
    ];

    // Add dynamic questions based on remaining time (after subtracting welcome/closing time)
    const timeForQuestions = Math.max(0, remainingTime - 245); // 245s = welcome + closing
    const questionCount = Math.min(
      5,
      Math.max(1, Math.floor(timeForQuestions / 90))
    ); // 90s per question

    if (questionCount > 0) {
      const questionTypes = ["technical", "behavioural", "situational"];
      const questionsToAdd = [];

      for (let i = 0; i < questionCount; i++) {
        const type = questionTypes[i % questionTypes.length];
        questionsToAdd.push({
          key: `${type}_${i}`,
          prompt: `As a ${data.jobTitle}, ${
            type === "technical"
              ? `how would you approach ${
                  data.skills[0] || "a technical challenge"
                }?`
              : type === "behavioural"
              ? "describe a time when you faced a work challenge and how you handled it."
              : "imagine a situation where... how would you respond?"
          }`,
          action: "listen",
          timeEstimate: 90,
        });
      }

      // Insert questions before closing
      interviewFlow.current.splice(-2, 0, ...questionsToAdd);
    }
  };

  const processCandidateResponse = async (responseText) => {
    if (!responseText || responseText.trim().length < 5) {
      setError("Please provide a more detailed answer");
      return;
    }

    const wordCount = responseText.split(" ").length;
    const complexityScore = (
      responseText.match(/and|but|however|because|therefore/g) || []
    ).length;
    const questionScore = Math.min(
      10,
      Math.floor(wordCount * 0.15 + complexityScore * 0.5)
    );

    const newQuestion = {
      question: aiResponse,
      answer: responseText,
      score: questionScore,
      timestamp: new Date().toISOString(),
    };

    setQuestions((prev) => [...prev, newQuestion]);
    setScore((prev) => prev + questionScore);
    storeInterviewData(aiResponse, responseText, questionScore);
    setQuestionRepeatCount(0);
    setAnswerRepeatCount(0);
    setTranscript("");
    finalTranscriptRef.current = "";
    setError("");
    setManualSubmitMode(false);

    const nextIndex = currentFlowIndex + 1;
    if (nextIndex < interviewFlow.current.length) {
      setCurrentFlowIndex(nextIndex);
    } else {
      await completeInterview();
    }
  };

  const handleManualSubmit = () => {
    const answer = finalTranscriptRef.current || transcript;
    if (answer.trim().length < 5) {
      setError("Please provide a more detailed answer (minimum 5 characters)");
      return;
    }
    processCandidateResponse(answer);
  };

  const repeatAnswer = () => {
    if (answerRepeatCount >= 1) {
      setError("You can only repeat your answer once");
      return;
    }
    setAnswerRepeatCount((prev) => prev + 1);
    setTranscript("");
    finalTranscriptRef.current = "";
    setIsListening(true);
    speechService.current.startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          finalTranscriptRef.current = transcript;
        }
        setTranscript(transcript);
      },
      (event) => {
        console.error("Recognition error:", event.error);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleInterviewFlow = async () => {
    if (!interviewData || currentFlowIndex >= interviewFlow.current.length)
      return;

    const currentFlow = interviewFlow.current[currentFlowIndex];
    let prompt = currentFlow.prompt;

    setAiResponse(prompt);
    setError("");
    setTranscript("");
    finalTranscriptRef.current = "";

    if (currentFlow.action === "speak") {
      setIsSpeaking(true);
      await speechService.current.speak(prompt);
      setIsSpeaking(false);

      const nextIndex = currentFlowIndex + 1;
      if (nextIndex < interviewFlow.current.length) {
        setCurrentFlowIndex(nextIndex);
      }
    } else if (currentFlow.action === "listen") {
      setIsSpeaking(true);
      await speechService.current.speak(prompt);
      setIsSpeaking(false);

      // Clear any existing timeout
      clearTimeout(noResponseTimerRef.current);

      // Start no-response timeout after AI finishes speaking
      noResponseTimerRef.current = setTimeout(async () => {
        if (!isListening) return;

        const newQuestion = {
          question: prompt,
          answer: "[No response]",
          score: 0,
          timestamp: new Date().toISOString(),
        };

        setQuestions((prev) => [...prev, newQuestion]);
        storeInterviewData(prompt, "[No response]", 0);

        await speechService.current.speak(
          "You haven't responded in 15 seconds. Moving to the next question."
        );

        speechService.current.stopListening();
        setIsListening(false);

        const nextIndex = currentFlowIndex + 1;
        if (nextIndex < interviewFlow.current.length) {
          setCurrentFlowIndex(nextIndex);
        } else {
          await completeInterview();
        }
      }, 15000);

      // Start listening
      setIsListening(true);
      setManualSubmitMode(true);

      speechService.current.startListening(
        (transcript, isFinal) => {
          if (isFinal) {
            clearTimeout(noResponseTimerRef.current);
            finalTranscriptRef.current = transcript;
          }
          setTranscript(transcript);
        },
        (event) => {
          clearTimeout(noResponseTimerRef.current);
          console.error("Recognition error:", event.error);
          setIsListening(false);
          if (event.error === "no-speech") {
            setError("No speech detected. Please try again.");
          }
        },
        () => {
          clearTimeout(noResponseTimerRef.current);
          setIsListening(false);
        }
      );
    } else if (currentFlow.action === "complete") {
      await completeInterview();
    }
  };

  const repeatQuestion = async () => {
    if (questionRepeatCount >= 2) {
      setError("Maximum repeats reached. Moving to next question.");
      const nextIndex = currentFlowIndex + 1;
      if (nextIndex < interviewFlow.current.length) {
        setCurrentFlowIndex(nextIndex);
      } else {
        await completeInterview();
      }
      return;
    }

    setQuestionRepeatCount((prev) => prev + 1);
    setIsListening(false);
    speechService.current.cancelAll();
    await speechService.current.speak(aiResponse);
    setIsListening(true);
    setTranscript("");
    finalTranscriptRef.current = "";

    setTimeout(() => {
      speechService.current.startListening(
        (transcript, isFinal) => {
          if (isFinal) {
            finalTranscriptRef.current = transcript;
          }
          setTranscript(transcript);
        },
        (event) => {
          console.error("Recognition error:", event.error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }, 1000);
  };

  const completeInterview = async () => {
    try {
      speechService.current.cancelAll();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setInterviewStatus("completed");
      setAiResponse(
        "Interview completed successfully. Thank you for your time!"
      );

      const finalScore =
        questions.length > 0
          ? Math.min(100, Math.round((score / questions.length) * 10))
          : 0;

      await interviewService.current.completeInterview({
        interviewLink,
        status: "completed",
        score: finalScore,
        questions,
        applicantName: interviewData?.applicantName,
        jobTitle: interviewData?.jobTitle,
      });

      localStorage.removeItem(`interviewState-${interviewLink}`);
    } catch (err) {
      console.error("Error completing interview:", err);
      setAiResponse("Interview completed. Thank you for your time!");
      setError("Your responses have been saved locally.");
    }
  };

  // Initialize interview
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setLoadingState("Initializing voice services...");
        await speechService.current.initializeVoices();

        setLoadingState("Fetching interview data...");
        const data = await interviewService.current.fetchInterviewData(
          interviewLink
        );
        if (!data) throw new Error("Invalid interview data");

        setInterviewData(data);

        // Check interview timing
        const now = new Date();
        const interviewDate = new Date(data.interviewDate)
          .toISOString()
          .split("T")[0];
        const startTime = new Date(`${interviewDate}T${data.startTime}:00`);
        const endTime = new Date(`${interviewDate}T${data.endTime}:00`);

        if (now < startTime) {
          setInterviewStatus("waiting");
          setAiResponse(
            `Your interview will start at ${startTime.toLocaleTimeString()}. Please wait...`
          );
          setTimeout(() => window.location.reload(), startTime - now);
          return;
        }

        if (now >= endTime) {
          setInterviewStatus("completed");
          setAiResponse("This interview session has already ended.");
          return;
        }

        // Set remaining time
        const initialRemainingTime = Math.floor((endTime - now) / 1000);
        setRemainingTime(initialRemainingTime);

        // Initialize flow based on time
        initializeInterviewFlow(data);

        // Start media stream
        if (!stream) {
          setLoadingState("Starting media stream...");
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setStream(mediaStream);
        }

        if (interviewStatus !== "in_progress") {
          setInterviewStatus("in_progress");
          await interviewService.current.updateInterviewStatus(
            interviewLink,
            "in_progress"
          );
        }

        setLoadingState("Interview started");
      } catch (err) {
        console.error("Interview initialization error:", err);
        setError(err.message || "Failed to initialize interview");
        setInterviewStatus("error");
      }
    };

    initializeInterview();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      speechService.current?.cancelAll();
      clearInterval(timerRef.current);
      clearTimeout(noResponseTimerRef.current);
    };
  }, []);

  // Handle interview flow changes
  useEffect(() => {
    if (interviewStatus === "in_progress") {
      handleInterviewFlow();
    }
  }, [currentFlowIndex, interviewStatus]);

  // Timer for remaining time
  useEffect(() => {
    if (!interviewData || interviewStatus !== "in_progress") return;

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current);
          completeInterview();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [interviewData, interviewStatus]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Debug panel */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-800 p-2 text-xs text-gray-400">
          Status: {interviewStatus} | Flow: {currentFlowIndex}/
          {interviewFlow.current.length} | Listening: {isListening.toString()} |
          Speaking: {isSpeaking.toString()} | Active Tab: {activeTab.toString()}{" "}
          | Saved Qs: {questions.length}
        </div>
      )}

      <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">AI Interview Session</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-gray-700 px-3 py-1 rounded-md">
            <span className="text-blue-400">
              Time Left: {InterviewService.formatTime(remainingTime)}
            </span>
          </div>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Leave</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        {/* AI Interviewer Panel */}
        <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden flex flex-col border border-gray-700">
          <div className="bg-gray-700 p-3 border-b border-gray-600 flex justify-between items-center">
            <h2 className="font-medium">AI Interviewer</h2>
            <div className="flex space-x-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isSpeaking ? "bg-green-500 animate-pulse" : "bg-gray-500"
                }`}
              ></span>
              <span className="text-xs text-gray-300">
                {isSpeaking ? "Speaking" : isListening ? "Listening" : "Ready"}
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-40 h-40 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-blue-500">
              <svg
                className="w-20 h-20 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="max-w-lg w-full">
              <div
                ref={aiResponseRef}
                className="text-lg mb-6 max-h-40 overflow-y-auto p-2 bg-gray-700 rounded-lg"
              >
                {error || aiResponse || "Preparing your interview..."}
              </div>
              {isListening && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <button
                    onClick={repeatQuestion}
                    disabled={questionRepeatCount >= 2}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    Repeat Question ({2 - questionRepeatCount} left)
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    disabled={!transcript.trim()}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    Submit Answer
                  </button>
                  <button
                    onClick={repeatAnswer}
                    disabled={answerRepeatCount >= 1 || !transcript.trim()}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    Repeat Answer (1 left)
                  </button>
                </div>
              )}
              {interviewStatus === "completed" && (
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-xl font-bold text-green-500 mb-2">
                    Interview Complete
                  </h3>
                  <p className="text-sm mt-2">
                    Thank you for your time! Your responses have been saved.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Camera Panel */}
        <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden flex flex-col border border-gray-700">
          <div className="bg-gray-700 p-3 border-b border-gray-600">
            <h2 className="font-medium">Your Camera</h2>
          </div>
          <div className="flex-1 relative">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <svg
                  className="w-12 h-12 text-red-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                >
                  Refresh & Try Again
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-0 right-0 p-4">
                  <div className="bg-black bg-opacity-70 p-3 rounded-lg max-w-md mx-auto">
                    <div
                      ref={userTranscriptRef}
                      className="text-white text-sm min-h-6 max-h-20 overflow-y-auto"
                    >
                      {isListening
                        ? transcript || "Listening... Speak now..."
                        : "Waiting for question..."}
                    </div>
                    {isListening && (
                      <div className="flex justify-center mt-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                        <div className="text-xs text-red-400">LISTENING</div>
                      </div>
                    )}
                  </div>
                </div>
                {interviewStatus === "completed" && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center">
                      <h3 className="text-xl font-bold text-green-500 mb-2">
                        Interview Complete
                      </h3>
                      <p className="mb-4">Thank you for your time!</p>
                      <button
                        onClick={handleLeaveInterview}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md"
                      >
                        Exit Interview
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Leave Interview?</h3>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              {interviewStatus === "completed"
                ? "The interview is complete. You can safely leave now."
                : "Are you sure you want to leave? This may affect your application."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveInterview}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors"
              >
                {interviewStatus === "completed" ? "Exit" : "Leave Interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScreen;
