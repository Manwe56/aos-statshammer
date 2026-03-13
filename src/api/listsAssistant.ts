export type TAssistantRole = 'user' | 'assistant';

export interface IAssistantChatMessage {
  role: TAssistantRole;
  content: string;
}

export type TAssistantPlayerContext = 'Self' | 'Opponent';

interface IRequestListAssistantReply {
  analysisText: string;
  userMessage: string;
  messages: IAssistantChatMessage[];
  idToken: string;
  playerContext: TAssistantPlayerContext;
  selfAnalysisText?: string;
  opponentAnalysisText?: string;
}

interface IAssistantReplyPayload {
  reply?: string;
  error?: string;
}

const CHAT_ENDPOINT = process.env.REACT_APP_LISTS_CHAT_ENDPOINT || '/.netlify/functions/gemini-chat';

export const requestListAssistantReply = async (request: IRequestListAssistantReply): Promise<string> => {
  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json().catch(() => ({}))) as IAssistantReplyPayload;
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to contact list assistant');
  }

  const reply = typeof payload.reply === 'string' ? payload.reply.trim() : '';
  if (!reply) {
    throw new Error('List assistant returned an empty response');
  }

  return reply;
};
