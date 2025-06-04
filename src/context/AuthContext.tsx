import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Group, Role } from '@/types';

// JWT 디코딩 함수
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  groups: Group[];
  roles: Role[];
}

interface AuthAction {
  type: 'LOGIN' | 'LOGOUT' | 'SET_LOADING' | 'SET_USER' | 'UPDATE_PERMISSIONS';
  payload?: any;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasGroupAccess: (groupId: string) => boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  permissions: [],
  groups: [],
  roles: []
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        permissions: action.payload.permissions || [],
        groups: action.payload.user?.groups || [],
        roles: action.payload.user?.roles || []
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        groups: action.payload?.groups || [],
        roles: action.payload?.roles || []
      };
    case 'UPDATE_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded: any = decodeJWT(token);
        if (decoded.exp * 1000 > Date.now()) {
          // 토큰이 유효한 경우 사용자 정보 가져오기
          fetchUserInfo(token);
        } else {
          // 토큰이 만료된 경우
          localStorage.removeItem('auth_token');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const permissions = extractPermissions(userData.user);
        dispatch({ 
          type: 'LOGIN', 
          payload: { 
            user: userData.user, 
            token,
            permissions 
          } 
        });
      } else {
        localStorage.removeItem('auth_token');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      localStorage.removeItem('auth_token');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const extractPermissions = (user: User): string[] => {
    const permissions = new Set<string>();
    
    // 역할에서 권한 추출
    user.roles?.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.add(`${permission.resource}:${permission.action}`);
      });
    });
    
    // 그룹에서 권한 추출
    user.groups?.forEach(group => {
      group.permissions?.forEach(permission => {
        permissions.add(`${permission.resource}:${permission.action}`);
      });
    });
    
    return Array.from(permissions);
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // API 응답에서 권한을 직접 가져옴
        const permissions = data.user.permissions || [];
        
        localStorage.setItem('auth_token', data.token);
        dispatch({ 
          type: 'LOGIN', 
          payload: { 
            user: data.user, 
            token: data.token,
            permissions 
          } 
        });
      } else {
        throw new Error(data.message || '로그인에 실패했습니다');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
  };

  const hasPermission = (permission: string): boolean => {
    return state.permissions.includes(permission);
  };

  const hasRole = (roleName: string): boolean => {
    return state.roles.some(role => role.name === roleName);
  };

  const hasGroupAccess = (groupId: string): boolean => {
    return state.groups.some(group => group.id === groupId);
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await fetchUserInfo(token);
    }
  };

  const value: AuthContextType = {
    state,
    login,
    logout,
    hasPermission,
    hasRole,
    hasGroupAccess,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 