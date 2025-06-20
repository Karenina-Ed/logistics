import { Card, Form, Input, Button, Checkbox, Typography, message, Modal, Row, Col, Spin, Divider, Space } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  GoogleOutlined,
  WechatOutlined,
  AlipayOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const [showPasswordTips, setShowPasswordTips] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, navigate]);

  // 处理记住我功能
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

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const saveCredentials = (username: string, password: string) => {
    const credentials: SavedCredentials = { username, password };
    localStorage.setItem('savedCredentials', JSON.stringify(credentials));
  };

  const clearCredentials = () => {
    localStorage.removeItem('savedCredentials');
  };

  const onLoginFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await auth.login(values.username, values.password);
      
      if (values.remember) {
        saveCredentials(values.username, values.password);
      } else {
        clearCredentials();
      }
      
      // 登录成功后显示欢迎消息 - 这部分应该保留
      message.success(`欢迎回来，${values.username}！`);
    } catch (error) {
      // 从错误中提取消息
      const errorMessage = error instanceof Error ? error.message : '登录失败，请检查用户名和密码';
      message.error(errorMessage);
      
      loginForm.setFieldsValue({ password: '' });
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
        loginForm.setFieldsValue({
          username: values.username,
          password: values.password
        });
        setShowRegisterModal(false);
        
        // 自动登录
        await auth.login(values.username, values.password);
      } else {
        message.error(response.message || '注册失败，请稍后再试');
      }
    } catch (error) {
      message.error('注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 处理真实的密码重置请求
  const onResetPassword = async (values: ResetPasswordFormValues) => {
    try {
      setLoading(true);
      const response = await apiRequestPasswordReset(values.email);
      
      if (response.success) {
        message.success(`重置密码链接已发送至 ${values.email}，请查收邮箱`);
        setShowResetModal(false);
      } else {
        message.error(response.message || '发送重置邮件失败');
      }
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f0f7ff] to-[#e6f7ff] px-4">
      {/* 登录卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card 
          className="w-full rounded-2xl shadow-xl overflow-hidden border-none"
          styles={{
            body: { padding: '40px 30px' }
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <img 
                  src="/logo.svg" 
                  alt="物流管理" 
                  className="w-10 h-10"
                  onError={(e) => (e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%233189ff' d='M8 7l4-4m0 0l4 4m-4-4v18m6-18h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V7a2 2 0 012-2zM2 7h4a2 2 0 012 2v4a2 2 0 01-2 2H2a2 2 0 01-2-2V9a2 2 0 012-2zm14 8h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a2 2 0 012-2zM2 17h4a2 2 0 012 2v4a2 2 0 01-2 2H2a2 2 0 01-2-2v-4a2 2 0 012-2z'/%3E%3C/svg%3E")}
                />
              </div>
              <Title level={3} className="mb-1 text-2xl font-bold text-gray-800">欢迎登录物流管理系统</Title>
              <Text type="secondary" className="text-gray-500 text-sm">
                高效管理您的物流运营，提升运输效率
              </Text>
            </div>
          </motion.div>

          <Form
            form={loginForm}
            layout="vertical"
            onFinish={onLoginFinish}
            autoComplete="on"
            initialValues={{ remember: true }}
          >
            <Spin spinning={loading} tip="登录中..." size="small">
              <Form.Item
                label={<span className="text-gray-700 font-medium">用户名</span>}
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 4, message: '用户名至少4个字符' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined className="text-blue-500" />} 
                  placeholder="请输入用户名" 
                  size="large"
                  autoFocus
                  allowClear
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-gray-700 font-medium">密码</span>}
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 9, message: '密码至少9个字符' },
                  { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{9,}$/, message: '密码必须包含字母和数字' }
                ]}
                extra={
                  <Button 
                    type="link" 
                    onClick={() => setShowPasswordTips(!showPasswordTips)}
                    className="text-xs p-0"
                  >
                    {showPasswordTips ? '隐藏密码提示' : '显示密码提示'}
                  </Button>
                }
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-blue-500" />} 
                  placeholder="请输入密码" 
                  size="large"
                  allowClear
                  className="rounded-lg"
                  iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>
              
              {showPasswordTips && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4 text-xs text-blue-700">
                  <div className="font-medium mb-1">密码安全提示：</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>使用9位或以上字符的密码</li>
                    <li>结合字母（大小写）和数字</li>
                    <li>避免使用常见单词或个人信息</li>
                    <li>定期更换密码增强安全性</li>
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-gray-600">记住我的登录信息</Checkbox>
                </Form.Item>
                
                <Button 
                  type="link" 
                  onClick={openResetModal}
                  className="p-0 text-blue-500 font-medium"
                >
                  忘记密码?
                </Button>
              </div>

              <Form.Item className="mb-4">
                <Button 
                  type="primary" 
                  block
                  size="large"
                  htmlType="submit"
                  loading={loading}
                  className="h-11 font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 border-none hover:shadow-lg transition-all duration-300"
                >
                  登 录
                </Button>
              </Form.Item>
            </Spin>
          </Form>
          
          {/* 第三方登录 */}
          <div className="mb-6">
            <Divider plain className="text-xs text-gray-400">其他登录方式</Divider>
            <div className="flex justify-center gap-4">
              <Button 
                shape="circle" 
                icon={<GoogleOutlined className="text-lg" />} 
                className="w-10 h-10 flex items-center justify-center border-gray-200 hover:border-blue-300 bg-gray-50"
              />
              <Button 
                shape="circle" 
                icon={<WechatOutlined className="text-lg text-green-500" />} 
                className="w-10 h-10 flex items-center justify-center border-gray-200 hover:border-green-300 bg-gray-50"
              />
              <Button 
                shape="circle" 
                icon={<AlipayOutlined className="text-lg text-blue-500" />} 
                className="w-10 h-10 flex items-center justify-center border-gray-200 hover:border-blue-300 bg-gray-50"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <Text className="text-gray-600">还没有账号?</Text>
            <Button 
              type="link" 
              onClick={openRegisterModal}
              className="p-0 text-blue-500 font-medium"
            >
              立即注册
            </Button>
          </div>
          
          {/* 测试账户快速登录 */}
          <div className="mb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <Text className="px-4 text-gray-500 text-sm">或使用测试账户</Text>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                type="default"
                block
                size="large"
                onClick={() => quickLogin({ username: 'admin', password: 'password123' })}
                className="rounded-lg border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <UserOutlined className="text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">管理员账号</div>
                    <div className="text-xs text-gray-500">admin / password123</div>
                  </div>
                </div>
              </Button>
              
              <Button 
                type="default"
                block
                size="large"
                onClick={() => quickLogin({ username: 'operator', password: 'operator456' })}
                className="rounded-lg border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <UserOutlined className="text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">操作员账号</div>
                    <div className="text-xs text-gray-500">operator / operator456</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
          
          {/* 安全提示 */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
            <p className="mb-1">系统仅允许授权用户访问。未经授权的访问尝试可能构成犯罪。</p>
            <p>©{new Date().getFullYear()} 物流管理系统 - 保留所有权利</p>
          </div>
        </Card>
      </motion.div>
      
      {/* 注册账号弹窗 */}
      <Modal
        title={(
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <UserOutlined className="text-blue-500" />
            </div>
            <Title level={4} className="mb-0">注册新账号</Title>
          </div>
        )}
        open={showRegisterModal}
        onCancel={() => setShowRegisterModal(false)}
        footer={null}
        width={600}
        centered
        destroyOnClose
        styles={{
          header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' },
          body: { padding: '24px' }
        }}
      >
        <Form
          form={registerForm}
          layout="vertical"
          onFinish={onRegisterFinish}
          autoComplete="off"
          className="mt-2"
        >
          <Spin spinning={loading} tip="正在注册...">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 4, message: '用户名至少4个字符' }
                  ]}
                  tooltip="登录时使用的唯一标识"
                >
                  <Input 
                    prefix={<UserOutlined className="text-gray-400" />} 
                    placeholder="设置登录用户名" 
                    size="large"
                    className="rounded-lg"
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
                  tooltip="您的真实姓名（用于系统显示）"
                >
                  <Input 
                    placeholder="请输入真实姓名" 
                    size="large"
                    className="rounded-lg"
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
              tooltip="用于接收系统重要通知"
            >
              <Input 
                prefix={<MailOutlined className="text-gray-400" />} 
                placeholder="请输入常用邮箱" 
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
            
            <Form.Item
              label="手机号码"
              name="phone"
              rules={[
                { required: true, message: '请输入手机号码' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
              ]}
              tooltip="用于紧急情况联系"
            >
              <Input 
                prefix={<PhoneOutlined className="text-gray-400" />} 
                placeholder="请输入手机号码" 
                size="large"
                className="rounded-lg"
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
                    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{9,}$/, message: '密码必须包含字母和数字' }
                  ]}
                  tooltip="9位以上，包含字母和数字"
                >
                  <Input.Password 
                    prefix={<LockOutlined className="text-gray-400" />} 
                    placeholder="设置登录密码" 
                    size="large"
                    className="rounded-lg"
                    iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
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
                    prefix={<LockOutlined className="text-gray-400" />} 
                    placeholder="确认登录密码" 
                    size="large"
                    className="rounded-lg"
                    iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <Text className="text-blue-700 text-sm">
                点击"注册"即表示您同意我们的<Link href="#" className="font-medium">服务条款</Link>和<Link href="#" className="font-medium">隐私政策</Link>。
                我们承诺保护您的个人信息安全。
              </Text>
            </div>
            
            <Form.Item className="mb-0">
              <Button 
                type="primary" 
                block
                size="large"
                htmlType="submit"
                loading={loading}
                className="h-11 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 shadow-md border-none"
              >
                注册账号
              </Button>
            </Form.Item>
          </Spin>
        </Form>
        
        <div className="mt-4 text-center">
          <Text>已有账号? </Text>
          <Button 
            type="link" 
            onClick={() => {
              setShowRegisterModal(false);
              loginForm.getFieldInstance('username')?.focus();
            }}
            className="font-medium"
          >
            立即登录
          </Button>
        </div>
      </Modal>
      
      {/* 重置密码弹窗 */}
      <Modal
        title={(
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <LockOutlined className="text-blue-500" />
            </div>
            <Title level={4} className="mb-0">重置密码</Title>
          </div>
        )}
        open={showResetModal}
        onCancel={() => setShowResetModal(false)}
        footer={null}
        centered
        width={500}
        styles={{
          header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' },
          body: { padding: '24px' }
        }}
      >
        <Text className="text-gray-600 block mb-6">
          请输入注册时使用的电子邮箱地址，我们将发送重置密码链接到您的邮箱。
          链接将在15分钟后失效。
        </Text>
        
        <Form
          form={resetForm}
          layout="vertical"
          onFinish={onResetPassword}
        >
          <Spin spinning={loading} tip="发送请求中...">
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
                className="rounded-lg"
              />
            </Form.Item>
            
            <Form.Item className="mt-8 mb-0">
              <Button 
                type="primary" 
                block
                size="large"
                htmlType="submit"
                loading={loading}
                className="h-11 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 shadow-md border-none"
              >
                发送重置链接
              </Button>
            </Form.Item>
          </Spin>
        </Form>
        
        <div className="mt-6 bg-gray-50 rounded-lg p-3">
          <Title level={5} className="text-sm mb-2">没有收到邮件？</Title>
          <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
            <li>检查您的垃圾邮件或广告邮件文件夹</li>
            <li>确保您输入的邮箱地址与注册时相同</li>
            <li>请求后等待几分钟再尝试</li>
            <li>联系 <Link href="mailto:support@logistics.com">support@logistics.com</Link> 获取支持</li>
          </ul>
        </div>
        
        <div className="mt-6 text-center">
          <Text>需要其他帮助? </Text>
          <Button 
            type="link" 
            onClick={() => {
              setShowResetModal(false);
              setShowRegisterModal(true);
            }}
            className="font-medium"
          >
            注册新账号
          </Button>
        </div>
      </Modal>
    </div>
  );
}