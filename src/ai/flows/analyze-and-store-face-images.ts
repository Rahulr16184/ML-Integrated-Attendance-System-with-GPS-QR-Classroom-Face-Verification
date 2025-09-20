'use server';
/**
 * @fileOverview Analyzes uploaded face images to ensure quality and correctness using facial recognition,
 * only storing suitable images for enrollment, which will improve facial recognition accuracy and reduce
 * storage of irrelevant images.
 *
 * @fileOverview A flow that analyzes and stores face images.
 * - analyzeAndStoreFaceImage - A function that handles the image analysis and storage process.
 * - AnalyzeAndStoreFaceImageInput - The input type for the analyzeAndStoreFaceImage function.
 * - AnalyzeAndStoreFaceImageOutput - The return type for the analyzeAndStoreFaceImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAndStoreFaceImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeAndStoreFaceImageInput = z.infer<typeof AnalyzeAndStoreFaceImageInputSchema>;

const AnalyzeAndStoreFaceImageOutputSchema = z.object({
  isSuitable: z.boolean().describe('Whether or not the face image is suitable for enrollment.'),
  reason: z.string().optional().describe('The reason why the image is not suitable, if applicable.'),
});
export type AnalyzeAndStoreFaceImageOutput = z.infer<typeof AnalyzeAndStoreFaceImageOutputSchema>;

export async function analyzeAndStoreFaceImage(
  input: AnalyzeAndStoreFaceImageInput
): Promise<AnalyzeAndStoreFaceImageOutput> {
  return analyzeAndStoreFaceImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAndStoreFaceImagePrompt',
  input: {schema: AnalyzeAndStoreFaceImageInputSchema},
  output: {schema: AnalyzeAndStoreFaceImageOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing face images for enrollment in a facial recognition system.

You will analyze the provided face image and determine if it is suitable for enrollment based on the following criteria:

*   The image must contain a clear and unobstructed view of a single face.
*   The face should be well-lit and in focus.
*   The face should be oriented upright.
*   The expression should be neutral.

Based on your analysis, you will determine whether the image is suitable for enrollment.

Photo: {{media url=photoDataUri}}
`,
});

const analyzeAndStoreFaceImageFlow = ai.defineFlow(
  {
    name: 'analyzeAndStoreFaceImageFlow',
    inputSchema: AnalyzeAndStoreFaceImageInputSchema,
    outputSchema: AnalyzeAndStoreFaceImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
