import axios from "../../services/axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class InterviewService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async fetchInterviewData(interviewLink) {
    try {
      const { data } = await axios.get(`/api/interviews/${interviewLink}`);
      return data?.data;
    } catch (error) {
      throw new Error("Failed to fetch interview data");
    }
  }

  async updateInterviewStatus(interviewLink, status, score = 0) {
    try {
      await axios.put(`/api/interviews/${interviewLink}/status`, {
        status,
        score,
      });
    } catch (error) {
      console.error("Error updating interview status:", error);
    }
  }

  async generateAIQuestion(type, interviewData) {
    const systemPrompt = `
You are an expert AI interviewer conducting a job interview for ${
      interviewData.companyName
    }.
The candidate is applying for a ${interviewData.jobTitle} position.
Skills required: ${interviewData.skills.join(", ")}
Job description: ${interviewData.jobDescription.substring(0, 200)}...

Generate one ${type} interview question that is:
1. Relevant to the position
2. Clear and concise
3. Open-ended to encourage detailed response
4. Professional in tone

Return ONLY the question text, nothing else.
`;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();
      return text.split("\n")[0].trim();
    } catch (error) {
      console.error("Error generating question:", error);
      return `Tell me about your experience with ${
        interviewData.skills[0] || "this role"
      }`;
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
