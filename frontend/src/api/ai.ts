import { apiClient } from './client';

export interface ChatApiResponseData {
  success: boolean;
  type: 'template';
  tool: string;
  usedModel: string;
  latencyMs: number;
  markdown: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  tool?: string;
  usedModel?: string;
  latencyMs?: number;
  isError?: boolean;
  attachment?: {
    name: string;
    size?: number;
    type?: string;
  };
}

export const sendChatMessage = async (
  message: string,
  history?: Array<{ sender: string; text: string }>
): Promise<ChatApiResponseData> => {
  const response = await apiClient.post<{ success: boolean; data: ChatApiResponseData }>(
    '/ai/chat',
    { message, history }
  );
  return response.data.data;
};

export const analyzeDocumentApi = async (
  data: FormData | { content: string; fileName?: string; question?: string }
): Promise<any> => {
  const isFormData = data instanceof FormData;
  const response = await apiClient.post<{ success: boolean; data: any }>(
    '/ai/analyze-document',
    data,
    isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
  );
  return response.data.data;
};

