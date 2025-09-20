'use server';
/**
 * @fileOverview Automatically logs attendance by recognizing faces in real-time using GenAI.
 *
 * - logAttendanceViaFacialRecognition - A function that handles the attendance logging process.
 * - LogAttendanceViaFacialRecognitionInput - The input type for the logAttendanceViaFacialRecognition function.
 * - LogAttendanceViaFacialRecognitionOutput - The return type for the logAttendanceViaFacialRecognition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LogAttendanceViaFacialRecognitionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  timestamp: z.string().describe('The timestamp of when the photo was taken.'),
});
export type LogAttendanceViaFacialRecognitionInput = z.infer<
  typeof LogAttendanceViaFacialRecognitionInputSchema
>;

const LogAttendanceViaFacialRecognitionOutputSchema = z.object({
  employeeId: z.string().describe('The employee ID of the recognized person.'),
  attendanceStatus: z
    .string()
    .describe('The attendance status (e.g., present, absent).'),
  confidence: z
    .number()
    .describe(
      'The confidence level of the facial recognition (0 to 1, higher is better).'
    ),
});
export type LogAttendanceViaFacialRecognitionOutput = z.infer<
  typeof LogAttendanceViaFacialRecognitionOutputSchema
>;

export async function logAttendanceViaFacialRecognition(
  input: LogAttendanceViaFacialRecognitionInput
): Promise<LogAttendanceViaFacialRecognitionOutput> {
  return logAttendanceViaFacialRecognitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'logAttendanceViaFacialRecognitionPrompt',
  input: {schema: LogAttendanceViaFacialRecognitionInputSchema},
  output: {schema: LogAttendanceViaFacialRecognitionOutputSchema},
  prompt: `You are an AI attendance logging system.

You will use the provided image to identify the employee and log their attendance.

Analyze the image and return the employeeId, attendanceStatus (present if a face is detected, absent otherwise), and the confidence level of the facial recognition.

Photo: {{media url=photoDataUri}}
Timestamp: {{{timestamp}}}`,
});

const logAttendanceViaFacialRecognitionFlow = ai.defineFlow(
  {
    name: 'logAttendanceViaFacialRecognitionFlow',
    inputSchema: LogAttendanceViaFacialRecognitionInputSchema,
    outputSchema: LogAttendanceViaFacialRecognitionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
