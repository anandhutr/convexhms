
import { GoogleGenAI } from "@google/genai";
import { Employee, Assignment, Client } from "../types";

const getAiClient = () => {
  const apiKey = (typeof process !== 'undefined' && (process.env?.API_KEY || process.env?.GEMINI_API_KEY)) || '';
  return new GoogleGenAI({ apiKey: apiKey || 'placeholder' });
};

export async function generateEmployeeReview(employee: Employee) {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a professional performance summary and future growth plan for the following employee:
      Name: ${employee.name}
      Role: ${employee.role}
      Department: ${employee.department}
      Performance Score: ${employee.performanceScore}/10
      Bio: ${employee.bio}
      Joined: ${employee.dateJoined}
      
      Provide the response in Markdown format. Focus on constructive feedback and career progression within an entertainment studio context.`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "Failed to generate review.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI insight. Please try again later.";
  }
}

export async function generateTeamInsights(employees: Employee[]) {
  try {
    const ai = getAiClient();
    const teamSummary = employees.map(e => `${e.name} (${e.role}, Score: ${e.performanceScore})`).join(', ');
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following team composition for Convex Entertainments Pvt Ltd and suggest optimization strategies:
      Team Members: ${teamSummary}
      
      Identify potential skill gaps, leadership potential, and overall team health. Provide actionable advice in Markdown.`,
      config: {
        temperature: 0.6,
      }
    });

    return response.text || "Failed to generate team insights.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating team insights.";
  }
}

export async function suggestAssignee(taskTitle: string, taskDescription: string, employees: Employee[]) {
  try {
    const ai = getAiClient();
    const context = employees.map(e => `ID: ${e.id}, Name: ${e.name}, Role: ${e.role}, Bio: ${e.bio}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an HR AI assistant for Convex Entertainments. Given this task:
      Title: ${taskTitle}
      Description: ${taskDescription}
      
      And these team members:
      ${context}
      
      Recommend the best person for this task and explain why in 2 sentences. Format your response exactly like this:
      RECOMMENDED_ID: [Employee ID]
      REASON: [Short Explanation]`,
      config: {
        temperature: 0.4,
      }
    });

    return response.text || "Could not suggest assignee.";
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return "Error suggesting assignee.";
  }
}

export async function generateEventCreativeBrief(client: Client) {
  try {
    const ai = getAiClient();
    const events = client.events.map(ev => `${ev.type} on ${ev.date} at ${ev.venue}`).join(', ');
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a creative director for a high-end events production studio (Convex Entertainments).
      Client Name: ${client.name}
      Religion/Culture: ${client.religion}
      Events: ${events}
      
      Generate a 3-paragraph creative theme suggestion for these events. 
      Consider cultural nuances of ${client.religion} traditions while suggesting a modern, cinematic entertainment approach.
      Provide in Markdown.`,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || "Failed to generate brief.";
  } catch (error) {
    console.error("Gemini Creative Brief Error:", error);
    return "Error generating creative brief.";
  }
}
