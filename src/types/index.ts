// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  groups: Group[];
  roles: Role[];
}

// 그룹 관련 타입
export interface Group {
  id: string;
  name: string;
  description?: string;
  purpose?: string;
  users: User[];
  permissions: Permission[];
  llmAgentAccess: string[];
  ragSetAccess: string[];
  navigationAccess: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 역할 및 권한 타입
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// LLM 에이전트 관련 타입
export interface LLMAgent {
  id: string;
  name: string;
  description?: string;
  model: string;
  version: string;
  status: 'active' | 'inactive' | 'testing' | 'deprecated';
  configuration: LLMConfiguration;
  ragSets: RAGSet[];
  deployment: DeploymentInfo;
  monitoring: MonitoringData;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMConfiguration {
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt?: string;
  customParameters?: Record<string, any>;
}

export interface DeploymentInfo {
  environment: 'development' | 'staging' | 'production';
  deployedAt: Date;
  deployedBy: string;
  endpoint?: string;
  apiKey?: string;
}

export interface MonitoringData {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  lastActiveAt?: Date;
  errorCount: number;
}

// RAG 관련 타입
export interface RAGSet {
  id: string;
  name: string;
  description?: string;
  files: RAGFile[];
  vectorDbLocation: string;
  indexedAt?: Date;
  status: 'ready' | 'indexing' | 'error';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RAGFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  indexed: boolean;
  chunks?: number;
}

// 채팅 관련 타입
export interface ChatSession {
  id: string;
  userId: string;
  agentId: string;
  title?: string;
  messages: ChatMessage[];
  settings: ChatSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    ragReferences?: RAGReference[];
    tokens?: number;
    processingTime?: number;
  };
  feedback?: MessageFeedback;
}

export interface ChatSettings {
  temperature: number;
  topP: number;
  ragEnabled: boolean;
  ragSetIds: string[];
  showReferences: boolean;
}

export interface RAGReference {
  documentId: string;
  documentName: string;
  snippet: string;
  score: number;
  pageNumber?: number;
}

export interface MessageFeedback {
  rating: 'positive' | 'negative';
  comment?: string;
  timestamp: Date;
}

// 시스템 설정 타입
export interface SystemSettings {
  id: string;
  siteName: string;
  maintenance: boolean;
  allowRegistration: boolean;
  mfaRequired: boolean;
  sessionTimeout: number;
  backupSchedule?: string;
  auditLogRetention: number;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  slackWebhook?: string;
  discordWebhook?: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 대시보드 통계 타입
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAgents: number;
  activeAgents: number;
  totalRAGSets: number;
  totalChatSessions: number;
  avgResponseTime: number;
  systemUptime: number;
}

// 감사 로그 타입
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// 네비게이션 메뉴 타입
export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: NavigationItem[];
  permissions?: string[];
  groups?: string[];
} 