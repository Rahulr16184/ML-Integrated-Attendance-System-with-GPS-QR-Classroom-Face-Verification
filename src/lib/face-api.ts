
import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model';

let modelsLoaded: Promise<void> | boolean = false;

export async function loadModels() {
  if (modelsLoaded instanceof Promise) {
    await modelsLoaded;
    return;
  }
  if (modelsLoaded) {
    return;
  }
  
  modelsLoaded = (async () => {
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Use ssdMobilenetv1 for better detection
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        // These are not strictly required for the current flow but good to have
        // faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        // faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      ]);
      console.log('Face-api models loaded successfully');
      modelsLoaded = true; // Set to true after promise resolves
    } catch (error) {
      console.error('Error loading face-api models:', error);
      modelsLoaded = false; // Reset on error
      throw error; // Re-throw to allow callers to handle it
    }
  })();
  
  await modelsLoaded;
}

export function areModelsLoaded(): boolean {
    return modelsLoaded === true;
}

export async function getFaceApi() {
    await loadModels();
    return faceapi;
}

    