import { Card, Form, Input, Button, Checkbox, Typography, message, Modal, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    register as apiRegister,
    requestPasswordReset as apiRequestPasswordReset,
    resetPassword as apiResetPassword,
    validateToken
  } from '../api/auth';
const { Title, Text, Link } = Typography;
const { useForm } = Form;

type LoginFormValues = {
  username: string;
  password: string;
  remember: boolean;
};

type RegisterFormValues = {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  email: string;
  phone: string;
};

type ResetPasswordFormValues = {
  email: string;
};

// 用于存储登录凭据的数据结构
interface SavedCredentials {
  username: string;
  password: string;
}

export default function Login() {
  const [loginForm] = useForm<LoginFormValues>();
  const [registerForm] = useForm<RegisterFormValues>();
  const [resetForm] = useForm<ResetPasswordFormValues>();
  const auth = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // 检查用户是否已登录，如果是则重定向到仪表盘
    useEffect(() => {
        if (auth.isAuthenticated) {
        
        navigate('/dashboard');
        }
    }, [auth.isAuthenticated, navigate]);

  //   处理记住我功能
  const loadSavedCredentials = () => {
    try {
      const savedData = localStorage.getItem('savedCredentials');
      if (savedData) {
        const credentials = JSON.parse(savedData) as SavedCredentials;
        loginForm.setFieldsValue({
          username: credentials.username,
          password: credentials.password,
          remember: true
        });
      }
    } catch (error) {
      console.error("加载保存的凭据时出错:", error);
      localStorage.removeItem('savedCredentials');
    }
  };

  // 页面加载时尝试加载保存的凭据
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  // 保存凭据到本地存储
  const saveCredentials = (username: string, password: string) => {
    const credentials: SavedCredentials = {
      username,
      password
    };
    localStorage.setItem('savedCredentials', JSON.stringify(credentials));
  };

  // 清除保存的凭据
  const clearCredentials = () => {
    localStorage.removeItem('savedCredentials');
  };

  const onLoginFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await auth.login(values.username, values.password);
      
      // 处理记住我功能
      if (values.remember) {
        saveCredentials(values.username, values.password);
      } else {
        clearCredentials();
      }
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
      loginForm.setFieldsValue({ password: '' }); // 清空密码字段
    } finally {
      setLoading(false);
    }
  };

  // 处理注册表单提交
  const onRegisterFinish = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      const response = await apiRegister({
          username: values.username,
          password: values.password,
          fullName: values.name,
          email: values.email,
          phone: values.phone,
          role: '',
          department: ''
      });
      if (response.success) {
          message.success('注册成功，请登录');
          // 自动填充新账号到登录表单
          loginForm.setFieldsValue({
            username: values.username,
            password: values.password
          });
          setShowRegisterModal(false);
      } else {
          message.error(response.message || '注册失败，请稍后再试');
      }
      // 关闭注册弹窗

    } catch (error) {
      message.error('注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 处理密码重置请求
  const onResetPassword = async (values: ResetPasswordFormValues) => {
    try {
      // 模拟发送重置密码邮件
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`重置密码链接已发送至 ${values.email}，请查收邮箱`);
      setShowResetModal(false);
    } catch (error) {
      message.error('发送重置邮件失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 快速登录测试账户
  const quickLogin = (credentials: SavedCredentials) => {
    loginForm.setFieldsValue({
      ...credentials,
      remember: true
    });
    loginForm.submit();
  };

  // 打开注册弹窗
  const openRegisterModal = () => {
    registerForm.resetFields();
    setShowRegisterModal(true);
  };

  // 打开重置密码弹窗
  const openResetModal = () => {
    resetForm.resetFields();
    setShowResetModal(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <Card 
        title={
          <div className="text-center">
            <Title level={3} className="mb-0">物流管理系统登录</Title>
            <Text type="secondary" className="mt-1 text-sm">
              管理您的物流运营，提高运输效率
            </Text>
          </div>
        }
        className="w-full max-w-md shadow-sm rounded-xl overflow-hidden border-none"
        styles={{
            header: { 
              border: 'none', 
              padding: '30px 24px 10px',
              backgroundColor: '#f0f9ff',
            },
            body: { 
              padding: '30px' 
            }
          }}
      >
        <Form
          form={loginForm}
          layout="vertical"
          onFinish={onLoginFinish}
          autoComplete="on"
          initialValues={{ remember: true }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 4, message: '用户名至少4个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="text-blue-400" />} 
              placeholder="请输入用户名" 
              size="large"
              autoFocus
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 9, message: '密码至少9个字符' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, message: '密码必须包含字母和数字' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-blue-400" />} 
              placeholder="请输入密码" 
              size="large"
              allowClear
            />
          </Form.Item>

          <div className="flex items-center justify-between mb-4">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我的登录信息</Checkbox>
            </Form.Item>
            
            <Button 
              type="link" 
              onClick={openResetModal}
              className="p-0 text-blue-500"
            >
              忘记密码?
            </Button>
          </div>

          <Form.Item className="mb-6">
            <Button 
              type="primary" 
              block
              size="large"
              htmlType="submit"
              loading={loading}
              className="h-10 font-medium bg-blue-500 hover:bg-blue-600 border-none"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div className="text-center mb-6">
          <Text className="text-gray-600">还没有账号?</Text>
          <Button 
            type="link" 
            onClick={openRegisterModal}
            className="text-blue-500 font-medium"
          >
            立即注册
          </Button>
        </div>
        
        {/* 测试账户快速登录 */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="flex-grow border-t border-gray-300"></div>
            <Text className="px-4 text-gray-600">或使用测试账户</Text>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Button 
              type="default"
              block
              size="large"
              onClick={() => quickLogin({ username: 'admin', password: 'password123' })}
              className="border border-gray-300 bg-white hover:bg-gray-50"
            >
              <div className="flex items-center justify-center gap-2">
                <UserOutlined className="text-blue-500" />
                <div>
                  <div className="font-medium">管理员账号</div>
                  <div className="text-sm text-gray-500">admin / password123</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
        
        {/* 安全提示 */}
        <div className="text-xs text-gray-500 text-center">
          <p>选中"记住我的登录信息"将保存您的用户名和密码到浏览器本地存储。</p>
          <p className="mt-1">请不要在公共计算机上使用此功能。</p>
        </div>
      </Card>
      
      {/* 注册账号弹窗 */}
      <Modal
        title={<Title level={4}>注册新账号</Title>}
        open={showRegisterModal}
        onCancel={() => setShowRegisterModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={registerForm}
          layout="vertical"
          onFinish={onRegisterFinish}
          autoComplete="off"
          className="mt-6"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 4, message: '用户名至少4个字符' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="设置登录用户名" 
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[
                  { required: true, message: '请输入真实姓名' }
                ]}
              >
                <Input 
                  placeholder="请输入真实姓名" 
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="电子邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入电子邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入常用邮箱" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            label="手机号码"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号码' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="请输入手机号码" 
              size="large"
            />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 9, message: '密码至少9个字符' },
                  { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, message: '密码必须包含字母和数字' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="设置登录密码" 
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="确认密码"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="确认登录密码" 
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <Text className="text-blue-700 text-sm">
              点击"注册"即表示您同意我们的<Link href="#" className="font-medium">服务条款</Link>和<Link href="#" className="font-medium">隐私政策</Link>
            </Text>
          </div>
          
          <Form.Item className="mb-0">
            <Button 
              type="primary" 
              block
              size="large"
              htmlType="submit"
              loading={loading}
            >
              注册账号
            </Button>
          </Form.Item>
        </Form>
        
        <div className="mt-4 text-center">
          <Text>已有账号? </Text>
          <Button 
            type="link" 
            onClick={() => {
              setShowRegisterModal(false);
              loginForm.getFieldInstance('username')?.focus();
            }}
          >
            立即登录
          </Button>
        </div>
      </Modal>
      
      {/* 重置密码弹窗 */}
      <Modal
        title={<Title level={4}>重置密码</Title>}
        open={showResetModal}
        onCancel={() => setShowResetModal(false)}
        footer={null}
      >
        <Text className="text-gray-600 block mb-6">
          请输入注册时使用的电子邮箱地址，我们将发送重置密码链接到您的邮箱
        </Text>
        
        <Form
          form={resetForm}
          layout="vertical"
          onFinish={onResetPassword}
        >
          <Form.Item
            label="电子邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入电子邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入注册邮箱" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item className="mt-8 mb-0">
            <Button 
              type="primary" 
              block
              size="large"
              htmlType="submit"
              loading={loading}
            >
              发送重置链接
            </Button>
          </Form.Item>
        </Form>
        
        <div className="mt-4 text-center">
          <Text>需要帮助? </Text>
          <Button 
            type="link" 
            onClick={() => {
              setShowResetModal(false);
              setShowRegisterModal(true);
            }}
          >
            注册新账号
          </Button>
        </div>
      </Modal>
    </div>
  );
}