import { Language, Scenario } from './types';

export const LANGUAGES: Language[] = [
  { id: 'es', name: 'Spanish', voiceName: 'Puck', flag: '🇪🇸' },
  { id: 'fr', name: 'French', voiceName: 'Kore', flag: '🇫🇷' },
  { id: 'de', name: 'German', voiceName: 'Fenrir', flag: '🇩🇪' },
  { id: 'ja', name: 'Japanese', voiceName: 'Zephyr', flag: '🇯🇵' },
  { id: 'en', name: 'English', voiceName: 'Charon', flag: '🇺🇸' },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'cafe',
    title: 'Ordering Coffee',
    description: 'Practice ordering drinks and snacks at a busy cafe.',
    icon: '☕',
    promptContext: 'You are a barista at a cafe. The user is a customer. Ask them what they would like to order, offer recommendations, and ask about size/milk preferences.'
  },
  {
    id: 'directions',
    title: 'Asking Directions',
    description: 'Learn how to ask for and understand directions in the city.',
    icon: '🗺️',
    promptContext: 'You are a friendly local. The user is lost and asking for directions. Give clear but slightly complex directions to test their understanding. Correct them if they misunderstand.'
  },
  {
    id: 'interview',
    title: 'Job Interview',
    description: 'Prepare for a professional interview with common questions.',
    icon: '💼',
    promptContext: 'You are a hiring manager conducting a job interview. Ask the user about their experience, strengths, and why they want this job. Keep the tone professional but encouraging.'
  },
  {
    id: 'casual',
    title: 'Casual Chat',
    description: 'Just a friendly conversation about hobbies and daily life.',
    icon: '👋',
    promptContext: 'You are a friendly acquaintance meeting the user at a park. Ask them about their day, their hobbies, and what they do for fun. Keep the conversation light and natural.'
  },
];

export const GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
