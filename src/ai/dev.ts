import { config } from 'dotenv';
config();

import '@/ai/flows/log-attendance-via-facial-recognition.ts';
import '@/ai/flows/analyze-and-store-face-images.ts';