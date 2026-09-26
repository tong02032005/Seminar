/**
 * Chatbot service – câu trả lời được tạo ở backend (POST /api/chat).
 */
import { http } from './httpClient';

/** @returns {Promise<{ text: string, link?: { label: string, to: string } }>} */
export const sendChatMessage = (message, history = []) => http.post('/api/chat', { message, history });

/** GET /api/chat/suggestions – câu hỏi gợi ý */
export const getChatSuggestions = () => http.get('/api/chat/suggestions');
