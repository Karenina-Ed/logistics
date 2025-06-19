// src/api/auth.ts
import axios from 'axios';

const API_BASE_URL = 'http://10.12.58.124:8080/api/auth';

// 类型定义
interface UserRegisterData {
  username: string;
  password: string;
  role: string;
  email: string;
  department: string;
  phone: string;
  fullName: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface ResetRequestData {
  username: string;
  email: string;
}

interface ResetPasswordData {
  username: string;
  token: string;
  newPassword: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

interface LoginResponse extends ApiResponse {
  token?: string;
}

// 配置axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      throw new Error(error.response.data.message || '请求失败');
    } else {
      throw new Error('网络错误，请检查网络连接');
    }
  }
);

/**
 * 用户注册接口
 * @param userData 用户注册信息
 */
export const register = async (userData: UserRegisterData): Promise<ApiResponse> => {
  try {
    const response = await api.post('/register', userData);
    return {
      success: true,
      message: response.message || '注册成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '注册失败'
    };
  }
};

/**
 * 用户登录接口
 * @param credentials 登录凭证
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/login', credentials);
    if (response.token) {
      return {
        success: true,
        message: response.message || '登录成功',
        token: response.token
      };
    }
    throw new Error('登录失败：未返回token');
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '登录失败'
    };
  }
};

/**
 * 请求密码重置链接
 * @param resetData 重置请求数据
 */
export const requestPasswordReset = async (
  resetData: ResetRequestData
): Promise<ApiResponse> => {
  try {
    const response = await api.post('/reset-request', resetData);
    return {
      success: true,
      message: response.message || '密码重置链接已发送到您的邮箱'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '请求重置密码失败'
    };
  }
};

/**
 * 提交新密码
 * @param resetData 密码重置数据
 */
export const resetPassword = async (
  resetData: ResetPasswordData
): Promise<ApiResponse> => {
  try {
    const response = await api.post('/reset-password', resetData);
    return {
      success: true,
      message: response.message || '密码重置成功'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '密码重置失败'
    };
  }
};

/**
 * 验证token有效性
 * @param token 待验证的token
 */
export const validateToken = async (token: string): Promise<ApiResponse> => {
  try {
    const response = await api.get('/validate', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return {
      success: true,
      message: 'Token验证通过'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Token验证失败'
    };
  }
};

export default {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  validateToken
};