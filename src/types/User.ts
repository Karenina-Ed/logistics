// src/types/User.ts
export interface User {
    id: number;
    username: string;
    email?: string; // 可选字段
    role: string;
    enabled: boolean;
    fullName: string;
  }
