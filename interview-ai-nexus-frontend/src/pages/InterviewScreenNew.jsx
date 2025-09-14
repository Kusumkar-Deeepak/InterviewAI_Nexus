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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 for introduction
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loadingState, setLoadingState] = useState("Starting up...");
  const [interviewPhase, setInterviewPhase] = useState("introduction"); // introduction, questions, conclusion
  const [questionRepeatCount, setQuestionRepeatCount] = useState(0);
  const [interviewFlow, setInterviewFlow] = useState([]);
  const [responses, setResponses] = useState([]); // Store Q&A pairs

  // Auto-scroll text areas
  useEffect(() => {
    const scrollToBottom = (element) => {
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    };
    scrollToBottom(aiResponseRef.current);
    scrollToBottom(userTranscriptRef.current);
  }, [aiResponse, transcript]);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        setLoadingState("Initializing services...");

        // Initialize Interview Service
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error(
            "API key not found. Please check your environment variables."
          );
        }

        interviewService.current = new InterviewService(apiKey);

        // Initialize Speech Service
        speechService.current = new SpeechService();
        await speechService.current.initializeVoices();

        setLoadingState("Services initialized");
      } catch (err) {
        console.error("Service initialization error:", err);
        setError(err.message);
      }
    };

    initServices();
  }, []);

  // Initialize interview flow with stored questions
  const initializeInterviewFlow = (data) => {
    console.log("Interview data received:", data);

    // Extract all questions from stored data
    const allQuestions = [
      ...(data.aiGeneratedQuestions || []),
      ...(data.customQuestions || []),
    ];

    console.log("Total questions found:", allQuestions.length);
    setQuestions(allQuestions);

    // Create interview flow
    const flow = [
      {
        type: "introduction",
        message: `Good ${InterviewService.getTimeOfDay()}! I'm your AI interviewer today. Welcome to your interview for the ${
          data.jobTitle
        } position at ${
          data.companyName
        }. I'm excited to learn more about you and your experience. Before we begin, please introduce yourself and tell me a bit about your background.`,
        waitForResponse: true,
        phase: "introduction",
      },
      {
        type: "instructions",
        message: `Thank you for that introduction! Now I'll ask you a series of ${allQuestions.length} questions about your experience, skills, and background. Take your time to answer each question thoughtfully. If you need me to repeat a question, just say "repeat question". Are you ready to begin with the questions?`,
        waitForResponse: true,
        phase: "instructions",
      },
      // Questions will be added dynamically
      {
        type: "conclusion",
        message: `Excellent! That completes our interview. Thank you for taking the time to speak with me today. You've shared some great insights about your experience and skills. The team will review your responses and get back to you soon. Have a wonderful day!`,
        waitForResponse: false,
        phase: "conclusion",
      },
    ];

    setInterviewFlow(flow);
    console.log(
      "Interview flow initialized with",
      allQuestions.length,
      "questions"
    );
  };

  // Handle candidate response processing
  const processCandidateResponse = async (responseText) => {
    try {
      if (!responseText.trim()) return;

      const currentTime = new Date().toISOString();

      // Generate AI feedback for the response
      let feedback = "";
      if (currentQuestionIndex >= 0 && questions[currentQuestionIndex]) {
        feedback = await interviewService.current.generateAIResponse(
          questions[currentQuestionIndex],
          responseText,
          interviewData
        );

        // Store the Q&A pair
        const qaEntry = {
          question: questions[currentQuestionIndex],
          answer: responseText,
          feedback: feedback,
          timestamp: currentTime,
          questionIndex: currentQuestionIndex,
        };

        setResponses((prev) => [...prev, qaEntry]);
      }

      // Move to next phase or question
      await moveToNextStep(feedback);
    } catch (error) {
      console.error("Error processing response:", error);
      await moveToNextStep("Thank you for your response.");
    }
  };

  // Move to next step in interview
  const moveToNextStep = async (feedback = "") => {
    try {
      setIsSpeaking(true);

      if (interviewPhase === "introduction") {
        // After introduction, move to instructions
        const instructionMessage = `Thank you for that introduction! Now I'll ask you a series of ${questions.length} questions about your experience, skills, and background. Take your time to answer each question thoughtfully. If you need me to repeat a question, just say "repeat question". Let's begin with the first question.`;

        setAiResponse(instructionMessage);
        await speechService.current.speak(instructionMessage);

        setInterviewPhase("questions");
        setCurrentQuestionIndex(0);

        // Ask first question
        setTimeout(async () => {
          await askQuestion(0);
        }, 2000);
      } else if (interviewPhase === "questions") {
        // Provide feedback first
        if (feedback) {
          setAiResponse(feedback);
          await speechService.current.speak(feedback);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // Move to next question or conclusion
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex);
          await askQuestion(nextIndex);
        } else {
          // All questions completed, move to conclusion
          setInterviewPhase("conclusion");
          const conclusionMessage = `Excellent! That completes our interview. Thank you for taking the time to speak with me today. You've shared some great insights about your experience and skills. The team will review your responses and get back to you soon. Have a wonderful day!`;

          setAiResponse(conclusionMessage);
          await speechService.current.speak(conclusionMessage);

          // Complete interview after conclusion
          setTimeout(() => {
            completeInterview();
          }, 3000);
        }
      }

      setIsSpeaking(false);
    } catch (error) {
      console.error("Error moving to next step:", error);
      setIsSpeaking(false);
    }
  };

  // Ask a specific question
  const askQuestion = async (questionIndex) => {
    try {
      if (questionIndex >= questions.length) return;

      const question = questions[questionIndex];
      const questionMessage = `Question ${questionIndex + 1} of ${
        questions.length
      }: ${question}`;

      setAiResponse(questionMessage);
      setIsSpeaking(true);

      await speechService.current.speak(questionMessage);

      setIsSpeaking(false);
      setQuestionRepeatCount(0);

      // Start listening for response
      startListening();
    } catch (error) {
      console.error("Error asking question:", error);
      setIsSpeaking(false);
    }
  };

  // Start listening for user response
  const startListening = () => {
    if (!speechService.current || isListening) return;

    finalTranscriptRef.current = "";
    setTranscript("");
    setIsListening(true);

    // Clear any existing timeout
    if (noResponseTimerRef.current) {
      clearTimeout(noResponseTimerRef.current);
    }

    speechService.current.startListening(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          finalTranscriptRef.current = text;
        }
      },
      (error) => {
        console.error("Speech recognition error:", error);
        setIsListening(false);
        handleNoResponse();
      },
      () => {
        setIsListening(false);
        if (finalTranscriptRef.current.trim()) {
          processCandidateResponse(finalTranscriptRef.current.trim());
        } else {
          handleNoResponse();
        }
      }
    );

    // Set timeout for no response
    noResponseTimerRef.current = setTimeout(() => {
      if (isListening) {
        speechService.current.stopListening();
        handleNoResponse();
      }
    }, 30000); // 30 seconds timeout
  };

  // Handle no response from candidate
  const handleNoResponse = async () => {
    try {
      setIsListening(false);

      if (noResponseTimerRef.current) {
        clearTimeout(noResponseTimerRef.current);
      }

      const noResponseMessage =
        "I didn't hear a response. Let me repeat the question for you.";
      setAiResponse(noResponseMessage);
      await speechService.current.speak(noResponseMessage);

      // Repeat current question
      if (interviewPhase === "questions" && currentQuestionIndex >= 0) {
        setTimeout(() => {
          askQuestion(currentQuestionIndex);
        }, 2000);
      } else if (interviewPhase === "introduction") {
        setTimeout(() => {
          startIntroduction();
        }, 2000);
      }
    } catch (error) {
      console.error("Error handling no response:", error);
    }
  };

  // Start the introduction phase
  const startIntroduction = async () => {
    try {
      const introMessage = `Good ${InterviewService.getTimeOfDay()}! I'm your AI interviewer today. Welcome to your interview for the ${
        interviewData.jobTitle
      } position at ${
        interviewData.companyName
      }. I'm excited to learn more about you and your experience. Please introduce yourself and tell me a bit about your background.`;

      setAiResponse(introMessage);
      setIsSpeaking(true);

      await speechService.current.speak(introMessage);

      setIsSpeaking(false);
      startListening();
    } catch (error) {
      console.error("Error starting introduction:", error);
      setIsSpeaking(false);
    }
  };

  // Repeat current question
  const repeatQuestion = async () => {
    if (interviewPhase === "questions" && currentQuestionIndex >= 0) {
      setQuestionRepeatCount((prev) => prev + 1);
      await askQuestion(currentQuestionIndex);
    } else if (interviewPhase === "introduction") {
      await startIntroduction();
    }
  };

  // Complete interview and save data
  const completeInterview = async () => {
    try {
      setInterviewStatus("completed");

      // Calculate final score based on responses
      const finalScore = Math.min(
        100,
        Math.max(0, responses.length * 10 + Math.random() * 20 + 60)
      );
      setScore(Math.round(finalScore));

      // Prepare interview completion data
      const completionData = {
        interviewLink: interviewLink,
        status: "completed",
        score: Math.round(finalScore),
        responses: responses,
        duration: interviewData
          ? Math.floor(
              (Date.now() - new Date(interviewData.createdAt).getTime()) /
                1000 /
                60
            )
          : 0,
        completedAt: new Date().toISOString(),
      };

      // Update interview status
      await interviewService.current.updateInterviewStatus(
        interviewLink,
        "completed",
        Math.round(finalScore)
      );

      // Save detailed interview record
      await interviewService.current.completeInterview(completionData);

      // Navigate to results or dashboard after a delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 5000);
    } catch (error) {
      console.error("Error completing interview:", error);
    }
  };

  // Handle leaving interview
  const handleLeaveInterview = () => {
    if (speechService.current) {
      speechService.current.cancelAll();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    navigate("/dashboard");
  };

  // Initialize interview
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        if (!interviewService.current) return;

        setLoadingState("Loading interview data...");

        // Fetch interview data
        const data = await interviewService.current.fetchInterviewData(
          interviewLink
        );
        setInterviewData(data);

        // Check if interview is scheduled for now
        const now = new Date();
        const interviewDate = new Date(data.interviewDate);
        const [startHour, startMinute] = data.startTime.split(":").map(Number);
        const [endHour, endMinute] = data.endTime.split(":").map(Number);

        const startTime = new Date(interviewDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(interviewDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        if (now < startTime) {
          setInterviewStatus("waiting");
          setAiResponse(
            `Your interview will start at ${startTime.toLocaleTimeString()}. Please wait...`
          );
          setTimeout(() => window.location.reload(), startTime - now);
          return;
        }

        if (now >= endTime) {
          setInterviewStatus("expired");
          setAiResponse("This interview session has expired.");
          return;
        }

        // Set remaining time
        const initialRemainingTime = Math.floor((endTime - now) / 1000);
        setRemainingTime(initialRemainingTime);

        // Initialize interview flow
        initializeInterviewFlow(data);

        // Start media stream
        setLoadingState("Starting camera...");
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);

        // Update interview status
        await interviewService.current.updateInterviewStatus(
          interviewLink,
          "in_progress"
        );
        setInterviewStatus("in_progress");

        // Start introduction after a short delay
        setTimeout(() => {
          startIntroduction();
        }, 2000);

        setLoadingState("Interview ready");
      } catch (err) {
        console.error("Interview initialization error:", err);
        setError(err.message || "Failed to initialize interview");
        setInterviewStatus("error");
      }
    };

    if (interviewService.current && interviewLink) {
      initializeInterview();
    }
  }, [interviewLink, interviewService.current]);

  // Timer for remaining time
  useEffect(() => {
    if (remainingTime > 0 && interviewStatus === "in_progress") {
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            completeInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [remainingTime, interviewStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechService.current) {
        speechService.current.cancelAll();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (noResponseTimerRef.current) {
        clearTimeout(noResponseTimerRef.current);
      }
    };
  }, [stream]);

  // Render loading state
  if (interviewStatus === "initializing") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">{loadingState}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <h2 className="text-2xl font-bold mb-4">Interview Error</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">
            {interviewData?.jobTitle} Interview - {interviewData?.companyName}
          </h1>
          <p className="text-gray-400">
            Phase: {interviewPhase} | Question: {currentQuestionIndex + 1}/
            {questions.length}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-lg">
            ⏱️ {InterviewService.formatTime(remainingTime)}
          </div>
          <div className="text-lg">📊 Score: {score}</div>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Leave Interview
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Video Section */}
        <div className="w-1/3 p-4">
          <div className="bg-gray-800 rounded-lg p-4 h-full">
            <h3 className="text-lg font-semibold mb-4">Your Video</h3>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 bg-gray-700 rounded"
            />

            {/* Controls */}
            <div className="mt-4 space-y-2">
              <button
                onClick={repeatQuestion}
                disabled={isSpeaking || isListening}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                🔄 Repeat Question
              </button>

              <div className="text-center">
                {isListening && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Listening...</span>
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span>AI Speaking...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Response Section */}
        <div className="w-1/3 p-4">
          <div className="bg-gray-800 rounded-lg p-4 h-full">
            <h3 className="text-lg font-semibold mb-4">AI Interviewer</h3>
            <div
              ref={aiResponseRef}
              className="h-96 overflow-y-auto bg-gray-700 p-4 rounded scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <p className="text-green-400 whitespace-pre-wrap">{aiResponse}</p>
            </div>

            {/* Interview Progress */}
            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">
                Interview Progress
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      questions.length > 0
                        ? ((currentQuestionIndex + 1) / questions.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-1 text-center">
                {currentQuestionIndex + 1} / {questions.length} questions
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Section */}
        <div className="w-1/3 p-4">
          <div className="bg-gray-800 rounded-lg p-4 h-full">
            <h3 className="text-lg font-semibold mb-4">Your Response</h3>
            <div
              ref={userTranscriptRef}
              className="h-96 overflow-y-auto bg-gray-700 p-4 rounded scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <p className="text-blue-400 whitespace-pre-wrap">
                {transcript || "Your speech will appear here..."}
              </p>
            </div>

            {/* Recent Responses */}
            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">
                Recent Responses: {responses.length}
              </div>
              <div className="text-xs text-gray-500 max-h-20 overflow-y-auto">
                {responses.slice(-3).map((response, idx) => (
                  <div key={idx} className="mb-1">
                    <div className="text-yellow-400">
                      Q: {response.question.substring(0, 50)}...
                    </div>
                    <div className="text-blue-400">
                      A: {response.answer.substring(0, 50)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-4">Leave Interview?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to leave the interview? Your progress will
              be lost.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Stay
              </button>
              <button
                onClick={handleLeaveInterview}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScreen;
