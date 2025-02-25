import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
// import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';

@Injectable()
export class QaService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

//   async generateTestCases(useCase: string, projectName: string) {
//     const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

//     const prompt = `Generate a well-defined QA test case document for the following use case:
    
//     "${useCase}"
    
//     Include:
//     - Positive and Negative test scenarios
//     - Expected results
//     - Priority (High, Medium, Low)
//     - Edge cases (e.g., long inputs, system failures)
//     - Post-conditions (state after test execution)
//     - A structured JSON output with fields:
//       {
//         "Test Case ID": "TTM-001",  
//         "Title": "",
//         "Module/Feature": "",
//         "Description": "",
//         "Pre-conditions": "",
//         "Test Steps": [],
//         "Expected Result": "",
//         "Actual Result": "N/A",
//         "Status": "Not Executed",
//         "Priority": "",
//         "Severity": "",
//         "Test Type": "",
//         "Test Data": {},
//         "Environment": "",
//         "Assigned To": "Unassigned",
//         "Created By": "QA Team",
//         "Date Created": "${currentDate}",
//         "Post-conditions": "",
//         "Comments/Notes": "N/A"
//       }
    
//     Format the response strictly as a JSON array.`;

//     try {
//         const response = await this.openai.chat.completions.create({
//             model: 'gpt-4o-mini',
//             messages: [{ role: 'system', content: prompt }],
//         });

//         console.log("OpenAI Response:", response); // Debugging line

//         if (!response.choices || response.choices.length === 0) {
//             throw new Error('No choices returned from OpenAI API');
//         }

//         let content = response.choices[0].message?.content;
//         if (!content) {
//             throw new Error('Response content is null or undefined');
//         }

//         // 🛠 Remove markdown JSON code block if present
//         content = content.trim().replace(/^```json\s*|```$/g, '');

//         return JSON.parse(content);
//     } catch (error) {
//         console.error('Error generating test cases:', error);
//         throw new Error('Failed to generate test cases. Please check the API response.');
//     }
//     }
    
async generateTestCases(type, url, useCase, projectName) {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    let extractedUseCase = useCase;

    if (type === 'file') {
        try {
            extractedUseCase = await this.extractTextFromFile(url);
        } catch (error) {
            console.error('Error extracting text from file:', error);
            throw new Error('Failed to extract text from the provided file.');
        }
    }

    const prompt = `Generate a well-defined QA test case document for the project: "${projectName}" based on the following use case:
    
    "${extractedUseCase}"
    
    Include:
    - Positive and Negative test scenarios
    - Expected results
    - Priority (High, Medium, Low)
    - Edge cases (e.g., long inputs, system failures)
    - Post-conditions (state after test execution)
    - A structured JSON output with fields:
      {
        "Test Case ID": "TTM-001",  
        "Title": "",
        "Module/Feature": "",
        "Description": "",
        "Pre-conditions": "",
        "Test Steps": [],
        "Expected Result": "",
        "Actual Result": "N/A",
        "Status": "Not Executed",
        "Priority": "",
        "Severity": "",
        "Test Type": "",
        "Test Data": {},
        "Environment": "",
        "Assigned To": "Unassigned",
        "Created By": "QA Team",
        "Date Created": "${currentDate}",
        "Post-conditions": "",
        "Comments/Notes": "N/A"
      }
    
    Format the response strictly as a JSON array.`;

    try {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: prompt }],
        });

        console.log("OpenAI Response:", response); // Debugging line

        if (!response.choices || response.choices.length === 0) {
            throw new Error('No choices returned from OpenAI API');
        }

        let content = response.choices[0].message?.content;
        if (!content) {
            throw new Error('Response content is null or undefined');
        }

        // 🛠 Remove markdown JSON code block if present
        content = content.trim().replace(/^```json\s*|```$/g, '');

        // Parse test cases from OpenAI response
        const testCases = JSON.parse(content);

        // Return structured object with projectName as key
        return {
            projectName: projectName,
            testCases: Array.isArray(testCases) ? testCases : []
        };
    } catch (error) {
        console.error('Error generating test cases:', error);
        throw new Error('Failed to generate test cases. Please check the API response.');
    }
}

async extractTextFromFile(fileUrl) {
    try {
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'arraybuffer',
        });

        const fileBuffer = Buffer.from(response.data);
        let extractedText = "";

        if (fileUrl.endsWith('.pdf')) {
            const data = await pdfParse(fileBuffer);
            extractedText = data.text;
        } else if (fileUrl.endsWith('.docx')) {
            const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = value;
        } else {
            throw new Error('Unsupported file format. Only PDF and DOCX are supported.');
        }

        // Extract the relevant details for JSON formatting
        const formattedJson = await this.formatExtractedText(extractedText, fileUrl);
        return formattedJson;

    } catch (error) {
        console.error('Error extracting text from file:', error);
        throw new Error('Failed to extract text from file.');
    }
}

async formatExtractedText(text, fileUrl) {
    // Extract the project name if explicitly mentioned
    const projectNameMatch = text.match(/Project Name: (.+)/i);
    const projectName = projectNameMatch ? projectNameMatch[1].trim() : "Add Project Name";

    // Extract use case from "Use Case X:" onward
    const useCaseMatch = text.match(/Use Case [\d\.]+ ?:([\s\S]*?)(?=\n*$)/);

    return {
        type: "file",
        url: fileUrl,
        useCase: useCaseMatch ? useCaseMatch[1].trim() : "N/A",
        projectName: projectName
    };
}
}