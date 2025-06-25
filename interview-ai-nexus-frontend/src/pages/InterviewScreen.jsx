  import { useState, useEffect, useRef } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { InterviewService } from './utils/InterviewService';
  import { SpeechService } from './utils/SpeechService';

  const InterviewScreen = () => {
    const { interviewLink } = useParams();
    const navigate = useNavigate();
    
    // Refs
    const videoRef = useRef(null);
    const speechService = useRef(null);
    const interviewService = useRef(null);
    const interviewFlow = useRef([]);
    const timerRef = useRef(null);
    const finalTranscriptRef = useRef('');
    
    // State
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [aiResponse, setAiResponse] = useState('Initializing interview...');
    const [interviewStatus, setInterviewStatus] = useState('initializing');
    const [score, setScore] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [interviewData, setInterviewData] = useState(null);
    const [remainingTime, setRemainingTime] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [currentFlowIndex, setCurrentFlowIndex] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [loadingState, setLoadingState] = useState('Starting up...');
    const [questionRepeatCount, setQuestionRepeatCount] = useState(0);
    const [activeTab, setActiveTab] = useState(true);
    const [manualSubmitMode, setManualSubmitMode] = useState(false);

    // Load saved state from localStorage
const loadSavedState = () => {
  try {
    const savedState = localStorage.getItem(`interviewState-${interviewLink}`);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed) {
        // Only load if the interview was in progress
        if (parsed.interviewStatus === 'in_progress') {
          setQuestions(parsed.questions || []);
          setScore(parsed.score || 0);
          setCurrentFlowIndex(parsed.currentFlowIndex || 0);
          setInterviewStatus(parsed.interviewStatus);
          setAiResponse(parsed.aiResponse || 'Resuming interview...');
          return true;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load saved state:', e);
  }
  return false;
};

// Updated saveState function
const saveState = () => {
  if (interviewStatus === 'in_progress') {
    const stateToSave = {
      questions,
      score,
      currentFlowIndex,
      interviewStatus,
      aiResponse,
      interviewLink,
      timestamp: Date.now()
    };
    localStorage.setItem(`interviewState-${interviewLink}`, JSON.stringify(stateToSave));
  }
};

    // Initialize services
    useEffect(() => {
      interviewService.current = new InterviewService(import.meta.env.VITE_GEMINI_API_KEY);
      speechService.current = new SpeechService();
      
      // Load any saved state
      const savedState = loadSavedState();
      
      return () => {
        if (speechService.current) {
          speechService.current.cancelAll();
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        saveState(); // Save state when component unmounts
      };
    }, []);

    // Save state when relevant values change
    useEffect(() => {
      if (interviewStatus !== 'initializing') {
        saveState();
      }
    }, [questions, score, currentFlowIndex, interviewStatus, aiResponse]);

    // Interview data storage for hiring manager
    const storeInterviewData = (question, answer, score) => {
      const prevSession = JSON.parse(localStorage.getItem('interviewSession')) || { questions: [] };
      const interviewSession = {
        interviewId: interviewLink,
        questions: [
          ...(prevSession.questions || []),
          { question, answer, score, timestamp: new Date().toISOString() }
        ]
      };
      localStorage.setItem('interviewSession', JSON.stringify(interviewSession));
    };

    // Tab visibility handler
    useEffect(() => {
      const handleVisibilityChange = () => {
        setActiveTab(!document.hidden);
        if (document.hidden) {
          setError('Please stay on the interview tab for best experience');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, []);

    // Initialize interview flow
    const initializeInterviewFlow = (data) => {
      interviewFlow.current = [
        {
          key: 'greeting',
          prompt: `Good ${InterviewService.getTimeOfDay()}, ${data.applicantName}. I'm your AI interviewer for ${data.companyName}. How are you today?`,
          action: 'listen'
        },
        {
          key: 'introduction',
          prompt: `We're looking for a ${data.jobTitle} to join our team. ${data.jobDescription.substring(0, 1550)}...`,
          action: 'speak'
        },
        {
          key: 'candidateIntroduction',
          prompt: "Now, I'd love to hear more about you. Could you please introduce yourself and tell us about your background?",
          action: 'listen'
        },
        {
          key: 'technicalQuestion',
          prompt: () => interviewService.current.generateAIQuestion('technical', data, data.interviewType),
          action: 'listen'
        },
        {
          key: 'behaviouralQuestion',
          prompt: () => interviewService.current.generateAIQuestion('behavioural', data, data.interviewType),
          action: 'listen'
        },
        {
          key: 'situationalQuestion',
          prompt: () => interviewService.current.generateAIQuestion('situational', data, data.interviewType),
          action: 'listen'
        },
        {
          key: 'closing',
          prompt: `Thank you ${data.applicantName}. Your interview is now complete. We'll be in touch soon.`,
          action: 'complete'
        }
      ];
    };

    // Process candidate response
    const processCandidateResponse = async (responseText) => {
      if (!responseText || responseText.trim().length < 5) {
        setError('Please provide a more detailed answer');
        return;
      }
      
      const wordCount = responseText.split(' ').length;
      const complexityScore = (responseText.match(/and|but|however|because/g) || []).length;
      const questionScore = Math.min(10, Math.floor((wordCount * 0.2) + (complexityScore * 0.5)));
      
      const newQuestion = {
        question: aiResponse,
        answer: responseText,
        score: questionScore,
        timestamp: new Date().toISOString()
      };

      const updatedQuestions = [...questions, newQuestion];
      setQuestions(updatedQuestions);
      setScore(prev => prev + questionScore);
      storeInterviewData(aiResponse, responseText, questionScore);
      setQuestionRepeatCount(0);
      setTranscript('');
      finalTranscriptRef.current = '';
      setError('');
      setManualSubmitMode(false);

      // Save the updated questions immediately
      const nextIndex = currentFlowIndex + 1;
      if (nextIndex < interviewFlow.current.length) {
        setCurrentFlowIndex(nextIndex);
      } else {
        completeInterview();
      }
    };

    // Submit answer manually
    const handleManualSubmit = () => {
      const answer = finalTranscriptRef.current || transcript;
      if (answer.trim().length < 5) {
        setError('Please provide a more detailed answer (minimum 5 characters)');
        return;
      }
      processCandidateResponse(answer);
    };

    // Handle interview flow progression
    // Updated handleInterviewFlow function
const handleInterviewFlow = async () => {
  if (!interviewData || currentFlowIndex >= interviewFlow.current.length) return;

  const currentFlow = interviewFlow.current[currentFlowIndex];
  let prompt = typeof currentFlow.prompt === 'function' 
    ? await currentFlow.prompt() 
    : currentFlow.prompt;

  setAiResponse(prompt);
  setError('');
  setTranscript('');
  finalTranscriptRef.current = '';

  if (currentFlow.action === 'speak') {
    setIsSpeaking(true);
    await speechService.current.speak(prompt);
    setIsSpeaking(false);
    
    const nextIndex = currentFlowIndex + 1;
    if (nextIndex < interviewFlow.current.length) {
      setCurrentFlowIndex(nextIndex);
    }
  } 
  else if (currentFlow.action === 'listen') {
    setIsSpeaking(true);
    await speechService.current.speak(prompt);
    setIsSpeaking(false);
    
    // Start timeout for no response
    const noResponseTimer = setTimeout(async () => {
      if (!isListening) return; // Skip if already listening
      
      await speechService.current.speak(
        "You haven't responded in 15 seconds. Moving to the next question."
      );
      setIsListening(false);
      speechService.current.cancelAll();
      
      const nextIndex = currentFlowIndex + 1;
      if (nextIndex < interviewFlow.current.length) {
        setCurrentFlowIndex(nextIndex);
      } else {
        completeInterview();
      }
    }, 15000); // 15 seconds timeout

    setIsListening(true);
    setManualSubmitMode(true);
    
    speechService.current.startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          clearTimeout(noResponseTimer);
          finalTranscriptRef.current = transcript;
        }
        setTranscript(transcript);
      },
      (event) => {
        clearTimeout(noResponseTimer);
        console.error('Recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        }
      },
      () => {
        clearTimeout(noResponseTimer);
        setIsListening(false);
      }
    );
  } 
  else if (currentFlow.action === 'complete') {
    completeInterview();
  }
};

    // Repeat question handler
    const repeatQuestion = async () => {
      if (questionRepeatCount >= 2) {
        setError('Maximum repeats reached. Moving to next question.');
        const nextIndex = currentFlowIndex + 1;
        if (nextIndex < interviewFlow.current.length) {
          setCurrentFlowIndex(nextIndex);
        } else {
          completeInterview();
        }
        return;
      }

      setQuestionRepeatCount(prev => prev + 1);
      setIsListening(false);
      speechService.current.cancelAll();
      await speechService.current.speak(aiResponse);
      setIsListening(true);
      setTranscript('');
      finalTranscriptRef.current = '';
      speechService.current.startListening(
        (transcript, isFinal) => {
          if (isFinal) {
            finalTranscriptRef.current = transcript;
          }
          setTranscript(transcript);
        },
        (event) => {
          console.error('Recognition error:', event.error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    };

    // Complete interview
    const completeInterview = async () => {
      try {
        speechService.current.cancelAll();
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        setInterviewStatus('completed');
        setAiResponse('Interview completed successfully. Thank you for your time!');
        
        // Calculate final score (average of all question scores)
        const finalScore = questions.length > 0 
          ? Math.min(100, Math.round((score / questions.length) * 10))
          : 0;

        // Send all data to backend
        await interviewService.current.completeInterview({
          interviewLink,
          status: 'completed',
          score: finalScore,
          questions,
          applicantName: interviewData?.applicantName,
          jobTitle: interviewData?.jobTitle
        });
        
        // Clear saved state after successful completion
        localStorage.removeItem(`interviewState-${interviewLink}`);
      } catch (err) {
        console.error('Error completing interview:', err);
        setError('Failed to complete interview. Data has been saved locally.');
      }
    };

    // Leave interview handler
    const handleLeaveInterview = async () => {
      if (interviewStatus !== 'completed') {
        await completeInterview();
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      speechService.current.cancelAll();
      navigate('/');
    };

    // Initialize interview
    useEffect(() => {
      const initializeInterview = async () => {
        try {
          setLoadingState('Initializing voice services...');
          await speechService.current.initializeVoices();
          
          setLoadingState('Fetching interview data...');
          const data = await interviewService.current.fetchInterviewData(interviewLink);
          if (!data) throw new Error('Invalid interview data');
          
          setInterviewData(data);
          initializeInterviewFlow(data);
          
          // Check if interview should start based on time
          const now = new Date();
          const interviewDate = new Date(data.interviewDate).toISOString().split('T')[0];
          const startTime = new Date(`${interviewDate}T${data.startTime}:00`);
          const endTime = new Date(`${interviewDate}T${data.endTime}:00`);
          
          if (now < startTime) {
            setInterviewStatus('waiting');
            setAiResponse(`Your interview will start at ${startTime.toLocaleTimeString()}. Please wait...`);
            
            // Set up timer to start interview when time comes
            const timeUntilStart = startTime - now;
            setTimeout(() => {
              window.location.reload();
            }, timeUntilStart);
            
            return;
          }
          
          if (now >= endTime) {
            setInterviewStatus('completed');
            setAiResponse('This interview session has already ended.');
            return;
          }

          // Calculate initial remaining time
          setRemainingTime(Math.floor((endTime - now) / 1000));
          
          // Start media stream only if not already started
          if (!stream) {
            setLoadingState('Starting media stream...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
              video: true, 
              audio: true 
            });
            
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
            
            setStream(mediaStream);
          }
          
          // Only update status if not already in progress
          if (interviewStatus !== 'in_progress') {
            setInterviewStatus('in_progress');
            await interviewService.current.updateInterviewStatus(interviewLink, 'in_progress');
          }
          
          setLoadingState('Interview started');
        } catch (err) {
          console.error('Interview initialization error:', err);
          setError(err.message || 'Failed to initialize interview');
          setInterviewStatus('error');
        }
      };

      initializeInterview();

      return () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        speechService.current.cancelAll();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, []);

    // Handle interview flow changes
    useEffect(() => {
      if (interviewStatus === 'in_progress') {
        handleInterviewFlow();
      }
    }, [currentFlowIndex, interviewStatus]);

    // Timer effect for remaining time
    useEffect(() => {
      if (!interviewData || interviewStatus !== 'in_progress') return;

      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
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
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [interviewData, interviewStatus]);

    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        {/* Debug panel */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-800 p-2 text-xs text-gray-400">
            Status: {interviewStatus} | Flow: {currentFlowIndex}/{interviewFlow.current.length} | 
            Listening: {isListening.toString()} | Speaking: {isSpeaking.toString()} |
            Active Tab: {activeTab.toString()} | Saved Qs: {questions.length}
          </div>
        )}
        
        <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
                <span className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                <span className="text-xs text-gray-300">
                  {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Ready'}
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-40 h-40 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-blue-500">
                <svg className="w-20 h-20 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="max-w-lg mx-auto">
                <p className="text-lg mb-6">
                  {error || aiResponse || 'Preparing your interview...'}
                </p>
                {isListening && (
                  <div className="flex justify-center mt-4 space-x-2">
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
                  </div>
                )}
                {interviewStatus === 'completed' && (
                  <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-xl font-bold text-green-500 mb-2">
                      Interview Complete
                    </h3>
                    <p className="text-sm mt-2">
                      Thank you for your time! Your responses have been saved.
                    </p>
                    <div className="mt-4">
                      <p className="text-sm">Your overall score: {questions.length > 0 ? Math.round((score / questions.length) * 10) : 0}/100</p>
                    </div>
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
                  <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
                      <p className="text-white text-sm min-h-6">
                        {isListening ? (transcript || "Listening... Speak now...") : "Waiting for question..."}
                      </p>
                      {isListening && (
                        <div className="flex justify-center mt-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                          <div className="text-xs text-red-400">LISTENING</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {interviewStatus === 'completed' && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                      <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center">
                        <h3 className="text-xl font-bold text-green-500 mb-2">Interview Complete</h3>
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-300 mb-6">
                {interviewStatus === 'completed'
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
                  {interviewStatus === 'completed' ? 'Exit' : 'Leave Interview'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default InterviewScreen;