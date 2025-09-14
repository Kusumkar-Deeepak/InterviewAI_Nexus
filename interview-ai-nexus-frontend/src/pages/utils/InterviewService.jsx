import axios from "../../services/axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class InterviewService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async fetchInterviewData(interviewLink) {
    try {
      const { data } = await axios.get(`/api/interviews/link/${interviewLink}`);
      return data?.data;
    } catch (error) {
      throw new Error("Failed to fetch interview data");
    }
  }

  async generateAIResponse(question, answer, context) {
    try {
      const prompt = `You are an AI interviewer conducting a professional interview. 
      
Previous question: "${question}"
Candidate's answer: "${answer}"
Interview context: ${context.jobTitle} position at ${context.companyName}

Generate a brief, professional response (1-2 sentences) that:
1. Acknowledges the candidate's answer positively
2. Provides encouraging feedback
3. Transitions naturally to the next part

Keep it conversational and supportive. Examples:
- "Great, that shows good problem-solving skills. Let's explore this further."
- "Excellent answer! Your experience clearly demonstrates that."
- "That's a solid approach. I can see you've thought about this carefully."
- "Perfect! Your technical knowledge really comes through."

Generate only the response, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Error generating AI response:", error);
      // Fallback responses
      const fallbackResponses = [
        "Great answer! That shows good understanding.",
        "Excellent! I can see you've got solid experience.",
        "That's a thoughtful response.",
        "Perfect! Your approach makes sense.",
        "Good insight! That demonstrates your skills well.",
        "Nice! That's exactly what we like to hear.",
        "Wonderful! Your experience really shows.",
      ];
      return fallbackResponses[
        Math.floor(Math.random() * fallbackResponses.length)
      ];
    }
  }

  async updateInterviewStatus(interviewId, status, score = 0) {
    try {
      await axios.put(`/api/interviews/${interviewId}/status`, {
        status,
        score,
      });
    } catch (error) {
      console.error("Error updating interview status:", error);
    }
  }

  async completeInterview(interviewData) {
    try {
      // Save detailed interview record
      const response = await axios.post(
        "/api/interview-records",
        interviewData
      );
      return response.data;
    } catch (error) {
      console.error("Error completing interview:", error);
      throw error;
    }
  }

  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  static getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }
}
