import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom'; // 添加useLocation
import { Layout, Menu, Typography, Button, Badge } from 'antd';
import { 
  HomeOutlined, 
  DashboardOutlined, 
  CarOutlined, 
  ProfileOutlined, 
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  AreaChartOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // 获取当前路由位置
  const defaultOpenKeys = ['1', '2', '3', '4'];

  // 根据当前路由确定选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return ['1'];
    if (path.startsWith('/shipments')) return ['2-1'];
    if (path.startsWith('/shipment-tracking')) return ['2-2'];
    if (path.startsWith('/route-planning')) return ['2-3'];
    if (path.startsWith('/inventory')) return ['3-1'];
    if (path.startsWith('/inbound')) return ['3-2'];
    if (path.startsWith('/outbound')) return ['3-3'];
    if (path.startsWith('/transport-analytics')) return ['4-1'];
    if (path.startsWith('/inventory-analytics')) return ['4-2'];
    if (path.startsWith('/settings')) return ['5'];
    return ['1']; // 默认选中仪表盘
  };

  // 获取当前页面标题
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return '仪表盘';
    if (path.startsWith('/shipments')) return '运单管理';
    if (path.startsWith('/shipment-tracking')) return '运单追踪';
    if (path.startsWith('/route-planning')) return '路线规划';
    if (path.startsWith('/inventory')) return '库存管理';
    if (path.startsWith('/inbound')) return '入库管理';
    if (path.startsWith('/outbound')) return '出库管理';
    if (path.startsWith('/transport-analytics')) return '运输分析';
    if (path.startsWith('/inventory-analytics')) return '库存分析';
    if (path.startsWith('/settings')) return '系统设置';
    return '仪表盘';
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        style={{ background: '#fff' }}
      >
        <div className="flex items-center justify-center p-4 border-b border-gray-100">
          <div className={`${collapsed ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>
            {collapsed ? 'LMS' : '物流管理系统'}
          </div>
        </div>
        
        <Menu 
          theme="light" 
          selectedKeys={getSelectedKeys()} // 使用动态选中的key
          defaultOpenKeys={defaultOpenKeys}
          mode="inline"
          style={{ background: '#fff', borderRight: 0 }}
          items={[
            {
              key: '1',
              icon: <DashboardOutlined className="text-blue-500" />,
              label: <span className="font-medium">仪表盘</span>,
              onClick: () => navigate('/dashboard'),
            },
            {
              key: '2',
              icon: <CarOutlined className="text-blue-500" />,
              label: <span className="font-medium">运输管理</span>,
              children: [
                { key: '2-1', label: '运单管理', onClick: () => navigate('/shipments') },
                { key: '2-2', label: '​​运单追踪', onClick: () => navigate('/shipment-tracking') },
                { key: '2-3', label: '路线规划', onClick: () => navigate('/route-planning') },
              ],
            },
            {
              key: '3',
              icon: <ProfileOutlined className="text-blue-500" />,
              label: <span className="font-medium">仓库管理</span>,
              children: [
                { key: '3-1', label: '库存管理', onClick: () => navigate('/inventory') },
                { key: '3-2', label: '入库管理', onClick: () => navigate('/inbound') },
                { key: '3-3', label: '出库管理', onClick: () => navigate('/outbound') },
              ],
            },
            {
              key: '4',
              icon: <AreaChartOutlined className="text-blue-500" />,
              label: <span className="font-medium">报表分析</span>,
              children: [
                { key: '4-1', icon: <LineChartOutlined />, label: '运输分析', onClick: () => navigate('/transport-analytics') },
                { key: '4-2', icon: <BarChartOutlined />, label: '库存分析', onClick: () => navigate('/inventory-analytics') },
              ],
            },
            {
              key: '5',
              icon: <SettingOutlined className="text-blue-500" />,
              label: <span className="font-medium">系统设置</span>,
              onClick: () => navigate('/settings'),
            },
          ]}
        />
      </Sider>
      
      {/* 主内容区 */}
      <Layout>
        {/* 顶部导航栏 */}
        <Header 
          style={{ 
            background: 'linear-gradient(to right, #1a56db, #2563eb)', 
            padding: '0 24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <HomeOutlined className="text-white opacity-90" />
              <span className="text-white font-medium opacity-90">首页 / {getPageTitle()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Badge count={5} size="small" offset={[0, 0]}>
              <Button 
                type="text" 
                icon={<BellOutlined className="text-white opacity-90" />} 
                className="flex items-center justify-center"
              />
            </Badge>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-400 rounded-full w-9 h-9 flex items-center justify-center">
                <UserOutlined className="text-white text-lg" />
              </div>
              <div>
                <div className="text-white font-medium">{user?.name || '管理员'}</div>
              </div>
            </div>
            
            <Button 
              type="text" 
              icon={<LogoutOutlined className="text-white opacity-80" />} 
              className="text-white hover:bg-blue-500"
              onClick={handleLogout}
            >
              <span className="text-white font-medium">退出</span>
            </Button>
          </div>
        </Header>
        
        {/* 页面内容 */}
        <Content className="m-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;