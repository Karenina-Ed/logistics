import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import type { User } from '../types/User';
import { login as apiLogin } from '../api/auth';

// 更新接口类型定义
interface LoginResponse {
  message: string;
  token: string;
  // 如果有用户信息也在这里定义
  user?: {
    id: number;
    username: string;
    // 其他用户字段...
  };
}

// 认证上下文类型
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// 认证上下文提供者组件
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // 初始化检查本地存储中的认证状态
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          setLoading(true);
          // 这里模拟验证 token 的 API 请求
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 模拟返回的用户数据
          const mockUser: User = {
            id: 1,
            username: 'saved_user',
            email: 'saved@example.com',
            role: 'USER',
            fullName: 'Saved User',
            enabled: true
          };

          setUser(mockUser);
          message.success('自动登录成功！');
        } catch (err) {
          localStorage.removeItem('authToken');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadUser();
  }, []);

  // 登录方法
  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiLogin({username: username, password: password});
      
      if (response.success && response.token) {
        // 保存 token 到 localStorage
        localStorage.setItem('authToken', response.token);
        
        // 使用 API 返回的用户信息（如果有）或创建基本用户对象
        const loggedInUser: User = response.user || {
          id: 1,
          username,
          email: '',
          role: 'USER',
          fullName: username,
          enabled: true
        };
        
        setUser(loggedInUser);
        navigate('/dashboard');
        return; // 成功登录，直接返回
      } 
      
      // 如果登录不成功，抛出错误
      const errorMessage = response.message || '登录失败';
      throw new Error(errorMessage);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      
      // 重新抛出错误，让调用者可以处理
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 登出方法
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    message.success('您已成功登出');
    navigate('/login');
  };

  // 是否已认证
  const isAuthenticated = !!user && !!localStorage.getItem('authToken');
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      isAuthenticated,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的钩子
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};