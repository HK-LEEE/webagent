import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Tag, 
  Tooltip,
  Modal,
  Select,
  Row,
  Col,
  Divider,
  Alert,
  Dropdown,
  Menu,
  Badge
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  DatabaseOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  SearchOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/Layout/MainLayout';
import type { NextPage } from 'next';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  referencedDocs?: Array<{
    filename: string;
    snippet: string;
    relevance: number;
  }>;
}

interface RagSet {
  id: string;
  name: string;
  description?: string;
  status: string;
  documentCount: number;
}

interface Agent {
  id: string;
  name: string;
  description?: string;
  model: string;
}

const ChatPage: NextPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedRagSet, setSelectedRagSet] = useState<RagSet | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [ragSets, setRagSets] = useState<RagSet[]>([]);
  
  // RAG 선택 관련 상태
  const [showRagDropdown, setShowRagDropdown] = useState(false);
  const [ragSearchQuery, setRagSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const inputRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 에이전트 목록 조회
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        if (data.agents?.length > 0) {
          setSelectedAgent(data.agents[0].id);
        }
      }
    } catch (error) {
      console.error('에이전트 목록 조회 오류:', error);
    }
  };

  // RAG 세트 목록 조회
  const fetchRagSets = async () => {
    try {
      const response = await fetch('/api/rag/sets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRagSets(data.ragSets || []);
      }
    } catch (error) {
      console.error('RAG 세트 목록 조회 오류:', error);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchRagSets();
  }, []);

  // 입력 필드 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setInputValue(value);
    setCursorPosition(cursorPos);

    // @ 키워드 감지
    const atIndex = value.lastIndexOf('@', cursorPos - 1);
    if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === ' ')) {
      const searchTerm = value.substring(atIndex + 1, cursorPos);
      setRagSearchQuery(searchTerm);
      setShowRagDropdown(true);
    } else {
      setShowRagDropdown(false);
      setRagSearchQuery('');
    }
  };

  // RAG 세트 선택
  const selectRagSet = (ragSet: RagSet) => {
    setSelectedRagSet(ragSet);
    setShowRagDropdown(false);
    
    // 입력 필드에서 @키워드 부분 제거
    const atIndex = inputValue.lastIndexOf('@', cursorPosition - 1);
    if (atIndex !== -1) {
      const beforeAt = inputValue.substring(0, atIndex);
      const afterCursor = inputValue.substring(cursorPosition);
      setInputValue(beforeAt + afterCursor);
    }
    
    // 포커스 복원
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // RAG 세트 선택 해제
  const clearRagSet = () => {
    setSelectedRagSet(null);
  };

  // RAG 세트 필터링
  const filteredRagSets = ragSets.filter(ragSet =>
    ragSet.name.toLowerCase().includes(ragSearchQuery.toLowerCase()) ||
    (ragSet.description && ragSet.description.toLowerCase().includes(ragSearchQuery.toLowerCase()))
  );

  // 메시지 전송
  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedAgent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          agentId: selectedAgent,
          ragSetId: selectedRagSet?.id,
          sessionId: 'default' // 임시로 고정값 사용
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || '응답을 생성할 수 없습니다.',
          timestamp: new Date(),
          referencedDocs: data.referencedDocs || []
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showRagDropdown && filteredRagSets.length > 0) {
        selectRagSet(filteredRagSets[0]);
      } else {
        sendMessage();
      }
    } else if (e.key === 'Escape') {
      setShowRagDropdown(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* 채팅 헤더 */}
        <Card 
          size="small" 
          style={{ 
            borderRadius: 0, 
            borderBottom: '1px solid #f0f0f0',
            flexShrink: 0
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <RobotOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                <Title level={4} style={{ margin: 0 }}>
                  LLM 채팅
                </Title>
              </Space>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">에이전트:</Text>
                <Select
                  value={selectedAgent}
                  onChange={setSelectedAgent}
                  style={{ width: 200 }}
                  placeholder="에이전트 선택"
                >
                  {agents.map(agent => (
                    <Option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.model})
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>
          
          {/* 선택된 RAG 세트 표시 */}
          {selectedRagSet && (
            <div style={{ marginTop: '12px' }}>
              <Alert
                message={
                  <Space>
                    <DatabaseOutlined />
                    <Text strong>RAG 세트 연결됨:</Text>
                    <Tag color="blue">{selectedRagSet.name}</Tag>
                    <Text type="secondary">({selectedRagSet.documentCount}개 문서)</Text>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<CloseOutlined />}
                      onClick={clearRagSet}
                    />
                  </Space>
                }
                type="info"
                showIcon={false}
              />
            </div>
          )}
        </Card>

        {/* 메시지 영역 */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '16px',
          backgroundColor: '#fafafa'
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '50px',
              color: '#666'
            }}>
              <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <Title level={3} type="secondary">대화를 시작해보세요</Title>
              <Paragraph type="secondary">
                @ 키워드를 입력하여 RAG 세트를 선택할 수 있습니다.
              </Paragraph>
            </div>
          ) : (
            <List
              dataSource={messages}
              renderItem={(message) => (
                <List.Item
                  style={{
                    border: 'none',
                    padding: '12px 0',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <Avatar 
                      icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      style={{
                        backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a'
                      }}
                    />
                    <div style={{
                      background: message.role === 'user' ? '#1890ff' : '#fff',
                      color: message.role === 'user' ? '#fff' : '#000',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: message.role === 'assistant' ? '1px solid #f0f0f0' : 'none',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <div>{message.content}</div>
                      
                      {/* 참조 문서 표시 */}
                      {message.referencedDocs && message.referencedDocs.length > 0 && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e8e8e8' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <FileTextOutlined /> 참조 문서:
                          </Text>
                          {message.referencedDocs.map((doc, index) => (
                            <div key={index} style={{ marginTop: '4px' }}>
                              <Tag size="small" color="geekblue">
                                {doc.filename} (관련도: {(doc.relevance * 100).toFixed(1)}%)
                              </Tag>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div style={{ 
                        fontSize: '11px', 
                        opacity: 0.7, 
                        marginTop: '4px',
                        textAlign: message.role === 'user' ? 'right' : 'left'
                      }}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <Card 
          size="small" 
          style={{ 
            borderRadius: 0, 
            borderTop: '1px solid #f0f0f0',
            flexShrink: 0,
            position: 'relative'
          }}
        >
          {/* RAG 세트 드롭다운 */}
          {showRagDropdown && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '16px',
              right: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              maxHeight: '200px',
              overflow: 'auto',
              zIndex: 1000
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <DatabaseOutlined /> RAG 세트 선택 (검색: {ragSearchQuery})
                </Text>
              </div>
              
              {filteredRagSets.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center' }}>
                  <Text type="secondary">검색 결과가 없습니다</Text>
                </div>
              ) : (
                filteredRagSets.map(ragSet => (
                  <div
                    key={ragSet.id}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f5f5f5'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => selectRagSet(ragSet)}
                  >
                    <div>
                      <Text strong>{ragSet.name}</Text>
                      <Tag 
                        size="small" 
                        color={ragSet.status === 'READY' ? 'green' : 'orange'}
                        style={{ marginLeft: '8px' }}
                      >
                        {ragSet.status}
                      </Tag>
                    </div>
                    {ragSet.description && (
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {ragSet.description}
                        </Text>
                      </div>
                    )}
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {ragSet.documentCount}개 문서
                      </Text>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <Row gutter={8} align="middle">
            <Col flex={1}>
              <TextArea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="메시지를 입력하세요... (@를 입력하여 RAG 세트 선택)"
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ resize: 'none' }}
              />
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                onClick={sendMessage}
                disabled={!inputValue.trim() || !selectedAgent}
              >
                전송
              </Button>
            </Col>
          </Row>
          
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
            <Text type="secondary">
              💡 팁: Shift+Enter로 줄바꿈, @키워드로 RAG 세트 선택, Esc로 드롭다운 닫기
            </Text>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ChatPage; 