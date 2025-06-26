# InterviewAI_Nexus

The smart way to prepare for your next job interview

# Interview AI Nexus – Interview Flow & Implementation Overview

## 📋 Interview Flow

This project implements a modular, robust AI-powered interview system. Here’s how the interview flow works:

1. **Initialization**

   - The app loads interview data (job, candidate, timing, etc.) from the backend.
   - It checks the scheduled start time. If the interview hasn’t started, the user sees a waiting message.

2. **Welcome & Introduction**

   - The AI greets the candidate and introduces the company and role.
   - The candidate is prompted to introduce themselves.

3. **Dynamic Questioning**

   - The system generates a series of technical, behavioural, and situational questions based on the job and candidate data.
   - Each question is spoken aloud by the AI using the browser’s Speech Synthesis API.

4. **Listening & Answer Submission**

   - After the AI finishes speaking, the system listens for the candidate’s answer using the Speech Recognition API.
   - The candidate can:
     - **Repeat the question** (up to 2 times)
     - **Retry their answer** (once)
     - **Submit their answer** (manual submission required)
   - If the candidate does not respond within 15 seconds, the AI notifies them and moves to the next question, saving "[No response]" locally.

5. **Closing & Completion**

   - The AI thanks the candidate and asks for any final questions.
   - After the closing message, the interview is marked as complete and a final greeting is shown.

6. **State Management**
   - The interview state (questions, answers, progress) is saved to local storage, allowing for session recovery on refresh or accidental closure.

---

## 🗣️ Speech Functionality

- **Speech Synthesis (AI Speaking):**

  - Uses the browser’s `SpeechSynthesis` API to read questions and messages aloud.
  - Preferred voices are selected for a natural experience.

- **Speech Recognition (User Answering):**

  - Uses the browser’s `SpeechRecognition` API to capture spoken answers.
  - Listens for up to 15 seconds of silence after the AI finishes speaking.
  - Handles interim and final transcripts for a responsive UI.

- **Manual Controls:**
  - The user must click "Submit" to finalize their answer, ensuring accuracy and control.
  - Repeat and retry options are available for a user-friendly experience.

---

## 🆕 What I Learned & Implemented

- **Modular React Design:**  
  Broke down a large monolithic file into modular, maintainable components and hooks.

- **Robust Speech Handling:**  
  Learned to synchronize speech synthesis and recognition, handle silence detection, and manage edge cases (like browser quirks and user inaction).

- **State Persistence:**  
  Implemented local storage for seamless session recovery and resilience to page reloads.

- **Dynamic Interview Logic:**  
  Built a flexible flow system that adapts to timing, question types, and user actions.

- **Professional UI/UX:**  
  Improved scrollbars, auto-scrolling, and error handling for a polished, accessible interface.

- **Error Handling:**  
  Added clear error messages and fallback logic for network, audio, and browser issues.

---

## 🚀 How to Use

1. **Start the Interview:**  
   The AI will greet you and guide you through the process.

2. **Listen & Respond:**  
   Listen to each question, then answer aloud. Use the controls to repeat or retry as needed.

3. **Manual Submission:**  
   Click "Submit" after speaking to confirm your answer.

4. **Completion:**  
   At the end, you’ll see a thank you message. Your responses are saved and processed.

---

## 🛠️ Technologies Used

- React (functional components, hooks)
- Browser Speech APIs (SpeechSynthesis, SpeechRecognition)
- Local Storage for state persistence
- Modular service and utility classes

---

## 💡 Key Takeaways

- Building a voice-driven AI interview system requires careful timing and state management.
- Handling browser speech APIs robustly is non-trivial—resetting timers, managing user intent, and providing fallback UI are essential.
- Modular code and clear separation of concerns make complex flows maintainable and extensible.

---

\*\*Thank you for exploring the Interview
