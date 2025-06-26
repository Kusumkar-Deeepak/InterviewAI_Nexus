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

  async completeInterview(interviewData) {
    try {
      await axios.post(`/api/interviews/complete`, interviewData);
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
