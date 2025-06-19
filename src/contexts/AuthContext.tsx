// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import type { User } from '../types/User';
import axios from 'axios';
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
        if (response.success) {
          // 保存 token 到 localStorage
          localStorage.setItem('authToken', response.token);
          setUser({
            id: 1,
            username,
            email: '',
            role: 'USER',
            fullName: '',
            enabled: true
          });
          message.success(response.message);
          navigate('/dashboard');
        } else {
          message.error(response.message || '登录失败');
          throw new Error(response.message || '登录失败');
        }
          
        // 模拟 API 调用延迟
        // await new Promise(resolve => setTimeout(resolve, 100));
  
        // --- 模拟登录验证逻辑 ---
        // if (username === 'test' && password === '123456') {

        //   await new Promise(resolve => setTimeout(resolve, 100));
        //   const mockUser: User = {
        //     id: 1,
        //     username: 'test_user',
        //     email: 'test@example.com',
        //     role: 'USER',
        //     fullName: 'Saved User',
        //     enabled: true
        //   };
          
        //   // 保存 token 到 localStorage
        //   localStorage.setItem('authToken', 'fake-jwt-token');
        //   setUser(mockUser);
          
        //   // 登录成功后导航到 dashboard 页面
        //   message.success('登录成功！');
        //   navigate('/dashboard');
        // } else {
        //   message.error('用户名或密码错误');
        //   throw new Error('用户名或密码错误');
        // }
      } catch (err) {
        setError(err instanceof Error ? err.message : '登录失败');
      } finally {
        setLoading(false);
      }
    };
  
    // 登出方法
    const logout = () => {
      localStorage.removeItem('authToken');
      setUser(null);
      // 登出后导航到登录页面
      navigate('/login');
    };
  
    // 是否已认证
    const isAuthenticated = !!user;
    
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