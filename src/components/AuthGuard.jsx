import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spin } from "antd";

const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // 显示全局加载状态
    return (
      <div className="h-screen flex items-center justify-center">
        <Spin size="large" tip="正在恢复会话..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // 保存原始路径用于登录后重定向
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AuthGuard;