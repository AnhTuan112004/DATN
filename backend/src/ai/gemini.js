import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

let primaryClient = null;
let fallbackClient = null;

if (config.gemini.primaryKey) {
  primaryClient = new GoogleGenAI({ apiKey: config.gemini.primaryKey });
}

if (config.gemini.fallbackKey) {
  fallbackClient = new GoogleGenAI({ apiKey: config.gemini.fallbackKey });
}

export const getGeminiClient = () => {
  return primaryClient || fallbackClient;
};

export const getActiveModelName = () => {
  return config.gemini.model || 'gemini-3.0-flash';
};
