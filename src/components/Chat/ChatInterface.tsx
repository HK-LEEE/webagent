import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, ChatMessage, LLMAgent, RAGReference, ChatSettings } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface ChatInterfaceProps {
  sessionId?: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const { state: authState } = useAuth();
  const [agents, setAgents] = useState<LLMAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    temperature: 0.7,
    topP: 0.9,
    ragEnabled: false,
    ragSetIds: [],
    showReferences: true
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 메시지 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 사용 가능한 에이전트 목록 로드
  useEffect(() => {
    loadAvailableAgents();
  }, []);

  const loadAvailableAgents = async () => {
    try {
      const response = await fetch('/api/agents/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents);
        if (data.agents.length > 0 && !selectedAgent) {
          setSelectedAgent(data.agents[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedAgent || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          agentId: selectedAgent,
          message: currentMessage,
          settings: chatSettings,
          sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: data.messageId,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: {
            ragReferences: data.ragReferences,
            tokens: data.tokens,
            processingTime: data.processingTime
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '죄송합니다. 메시지 전송 중 오류가 발생했습니다.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative', comment?: string) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          messageId,
          rating,
          comment
        })
      });

      // 메시지 업데이트
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback: { rating, comment, timestamp: new Date() }}
          : msg
      ));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const renderRAGReferences = (references: RAGReference[] | undefined) => {
    if (!references || references.length === 0 || !chatSettings.showReferences) return null;

    return (
      <div className="rag-references">
        <div className="rag-references-header">📚 참조된 문서</div>
        {references.map((ref, index) => (
          <div key={index} className="rag-reference">
            <div className="reference-title">{ref.documentName}</div>
            <div className="reference-snippet">{ref.snippet}</div>
            <div className="reference-score">관련도: {(ref.score * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`message ${isUser ? 'user' : 'assistant'}`}>
        <div className="message-content">
          <div className="message-text">{message.content}</div>
          {!isUser && renderRAGReferences(message.metadata?.ragReferences)}
          
          {!isUser && (
            <div className="message-actions">
              <button 
                className={`feedback-btn ${message.feedback?.rating === 'positive' ? 'active' : ''}`}
                onClick={() => handleFeedback(message.id, 'positive')}
              >
                👍
              </button>
              <button 
                className={`feedback-btn ${message.feedback?.rating === 'negative' ? 'active' : ''}`}
                onClick={() => handleFeedback(message.id, 'negative')}
              >
                👎
              </button>
              {message.metadata?.processingTime && (
                <span className="processing-time">
                  {message.metadata.processingTime}ms
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="message-timestamp">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-interface">
      {/* Header */}
      <div className="chat-header">
        <div className="agent-selector">
          <label htmlFor="agent-select">LLM 에이전트 선택:</label>
          <select 
            id="agent-select"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="agent-select"
          >
            <option value="">에이전트를 선택하세요</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.model})
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ 설정
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="setting-item">
            <label>Temperature: {chatSettings.temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={chatSettings.temperature}
              onChange={(e) => setChatSettings(prev => ({
                ...prev,
                temperature: parseFloat(e.target.value)
              }))}
            />
          </div>
          
          <div className="setting-item">
            <label>Top-P: {chatSettings.topP}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={chatSettings.topP}
              onChange={(e) => setChatSettings(prev => ({
                ...prev,
                topP: parseFloat(e.target.value)
              }))}
            />
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={chatSettings.ragEnabled}
                onChange={(e) => setChatSettings(prev => ({
                  ...prev,
                  ragEnabled: e.target.checked
                }))}
              />
              RAG 활성화
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={chatSettings.showReferences}
                onChange={(e) => setChatSettings(prev => ({
                  ...prev,
                  showReferences: e.target.checked
                }))}
              />
              참고 문서 표시
            </label>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-text">대화를 시작해보세요!</div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="chat-input"
            rows={1}
            disabled={!selectedAgent || isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || !selectedAgent || isLoading}
            className="send-button"
          >
            📤
          </button>
        </div>
      </div>

      <style jsx>{`
        .chat-interface {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: calc(100vh - 120px);
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          background: white;
        }

        .agent-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .agent-selector label {
          font-weight: 500;
          color: #333;
        }

        .agent-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          min-width: 200px;
        }

        .settings-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .settings-btn:hover {
          background-color: #f5f5f5;
        }

        .settings-panel {
          background: #f8f9fa;
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .setting-item {
          margin-bottom: 12px;
        }

        .setting-item label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          color: #555;
        }

        .setting-item input[type="range"] {
          width: 100%;
          max-width: 200px;
        }

        .setting-item input[type="checkbox"] {
          margin-right: 8px;
        }

        .messages-container {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: #f8f9fa;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 18px;
        }

        .message {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }

        .message.user {
          align-items: flex-end;
        }

        .message.assistant {
          align-items: flex-start;
        }

        .message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
        }

        .message.user .message-content {
          background-color: #1976d2;
          color: white;
        }

        .message.assistant .message-content {
          background-color: white;
          border: 1px solid #e0e0e0;
        }

        .message-text {
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .message-timestamp {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
          margin-left: 16px;
          margin-right: 16px;
        }

        .message-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
        }

        .feedback-btn {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .feedback-btn:hover,
        .feedback-btn.active {
          opacity: 1;
        }

        .processing-time {
          font-size: 12px;
          color: #999;
          margin-left: auto;
        }

        .rag-references {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .rag-references-header {
          font-size: 12px;
          font-weight: 500;
          color: #666;
          margin-bottom: 8px;
        }

        .rag-reference {
          background: #f8f9fa;
          padding: 8px;
          margin-bottom: 4px;
          border-radius: 4px;
          border-left: 3px solid #1976d2;
        }

        .reference-title {
          font-weight: 500;
          font-size: 12px;
          color: #333;
          margin-bottom: 4px;
        }

        .reference-snippet {
          font-size: 11px;
          color: #666;
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .reference-score {
          font-size: 10px;
          color: #999;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ddd;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }

        .chat-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid #e0e0e0;
        }

        .input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 100%;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 20px;
          resize: none;
          min-height: 20px;
          max-height: 120px;
          font-family: inherit;
          font-size: 14px;
          outline: none;
        }

        .chat-input:focus {
          border-color: #1976d2;
        }

        .chat-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .send-button {
          padding: 12px;
          border: none;
          border-radius: 50%;
          background-color: #1976d2;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-button:hover:not(:disabled) {
          background-color: #1565c0;
        }

        .send-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 