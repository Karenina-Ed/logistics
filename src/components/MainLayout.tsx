import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Badge, Avatar, Dropdown, theme, Space } from 'antd';
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
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useToken } = theme;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { token } = useToken();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['1']);
  const navigate = useNavigate();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('仪表盘');
  const [openKeys, setOpenKeys] = useState<string[]>(['1', '2']);
  // 动态计算侧边栏宽度
  const siderWidth = collapsed ? 80 : 230;

  // 更新选中菜单和页面标题
  useEffect(() => {
    const path = location.pathname;
    let keys = ['1'];
    let title = '仪表盘';
    
    if (path.startsWith('/dashboard')) {
      keys = ['1'];
      title = '仪表盘';
    } else if (path.startsWith('/shipments')) {
      keys = ['2-1'];
      title = '运单管理';
    } else if (path.startsWith('/shipment-tracking')) {
      keys = ['2-2'];
      title = '运单追踪';
    } else if (path.startsWith('/route-planning')) {
      keys = ['2-3'];
      title = '路线规划';
    } else if (path.startsWith('/inventory')) {
      keys = ['3-1'];
      title = '库存管理';
    } else if (path.startsWith('/inbound')) {
      keys = ['3-2'];
      title = '入库管理';
    } else if (path.startsWith('/outbound')) {
      keys = ['3-3'];
      title = '出库管理';
    } else if (path.startsWith('/transport-analytics')) {
      keys = ['4-1'];
      title = '运输分析';
    } else if (path.startsWith('/inventory-analytics')) {
      keys = ['4-2'];
      title = '库存分析';
    } else if (path.startsWith('/settings')) {
      keys = ['5'];
      title = '系统设置';
    }

    setSelectedKeys(keys);
    setPageTitle(title);
  }, [location]);

  const handleLogout = () => {
    logout();
  };

  // 用户下拉菜单
  const userMenu = (
    <Menu
      items={[
        { key: 'profile', label: '个人资料', icon: <UserOutlined /> },
        { key: 'team', label: '团队管理', icon: <TeamOutlined /> },
        { type: 'divider' },
        { 
          key: 'logout', 
          label: '退出登录', 
          icon: <LogoutOutlined />,
          onClick: handleLogout 
        },
      ]}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: token.colorBgContainer }}>
      {/* 侧边栏 - 使用更现代的配色方案 */}
      <Sider 
        collapsible 
        collapsed={collapsed}
        width={siderWidth}
        trigger={null}
        style={{ 
          background: token.colorBgElevated,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
          zIndex: 10
        }}
      >
        {/* 品牌区域 */}
        <div className="flex flex-col items-center justify-center p-4 border-b border-gray-100">
          <div 
            className={`transition-all ${collapsed ? 'text-xl' : 'text-2xl'} font-bold`}
            style={{ color: token.colorPrimary }}
          >
            {collapsed ? 'LMS' : '物流管理系统'}
          </div>
          <div 
            className={`overflow-hidden transition-all ${collapsed ? 'h-0 opacity-0 mt-0' : 'h-6 opacity-100 mt-2'}`}
            style={{ color: token.colorTextSecondary, fontSize: 12 }}
          >
            v2.0.1
          </div>
        </div>
        
        <Menu 
          theme="light"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={keys => setOpenKeys(keys)}
          mode="inline"
          style={{ background: token.colorBgElevated, padding: '8px 0' }}
          inlineCollapsed={collapsed}
          items={[
            {
              key: '1',
              icon: <DashboardOutlined style={{ color: selectedKeys.includes('1') ? token.colorPrimary : token.colorIcon }} />,
              label: <span className="font-medium">仪表盘</span>,
              onClick: () => navigate('/dashboard'),
              className: selectedKeys.includes('1') ? 'ant-menu-item-selected' : '',
            },
            {
              key: '2',
              icon: <CarOutlined style={{ color: selectedKeys.includes('2') ? token.colorPrimary : token.colorIcon }} />,
              label: <span className="font-medium">运输管理</span>,
              children: [
                { 
                  key: '2-1', 
                  label: '运单管理', 
                  onClick: () => navigate('/shipments'),
                  icon: <div className="w-3 h-3 rounded-full" style={{ background: selectedKeys.includes('2-1') ? token.colorPrimary : '#bfbfbf' }} />
                },
                { 
                  key: '2-2', 
                  label: '运单追踪', 
                  onClick: () => navigate('/shipment-tracking'),
                  icon: <div className="w-3 h-3 rounded-full" style={{ background: selectedKeys.includes('2-2') ? token.colorPrimary : '#bfbfbf' }} />
                },
                { 
                  key: '2-3', 
                  label: '路线规划', 
                  onClick: () => navigate('/route-planning'),
                  icon: <div className="w-3 h-3 rounded-full" style={{ background: selectedKeys.includes('2-3') ? token.colorPrimary : '#bfbfbf' }} />
                },
              ],
            },
            {
              key: '3',
              icon: <ProfileOutlined style={{ color: selectedKeys.includes('3') ? token.colorPrimary : token.colorIcon }} />,
              label: <span className="font-medium">仓库管理</span>,
              children: [
                { 
                  key: '3-1', 
                  label: '库存管理', 
                  onClick: () => navigate('/inventory'),
                  icon: <div className="w-3 h-3 rounded-full" style={{ background: selectedKeys.includes('3-1') ? token.colorPrimary : '#bfbfbf' }} />
                },
                { 
                  key: '3-2', 
                  label: '入库管理', 
                  onClick: () => navigate('/inbound'),
                  icon: <div className="w-3 h-3 rounded-full" style={{ background: selectedKeys.includes('3-2') ? token.colorPrimary : '#bfbfbf' }} />
                },
                { 
                  key: '3-3', 
                  label: '出库管理', 
                  onClick: () => navigate('/outbound'),
                  icon: <div className="w-3 h-3 rounded-full" style={{ background: selectedKeys.includes('3-3') ? token.colorPrimary : '#bfbfbf' }} />
                },
              ],
            },
            {
              key: '4',
              icon: <AreaChartOutlined style={{ color: selectedKeys.includes('4') ? token.colorPrimary : token.colorIcon }} />,
              label: <span className="font-medium">报表分析</span>,
              children: [
                { 
                  key: '4-1', 
                  label: '运输分析', 
                  icon: <LineChartOutlined style={{ color: selectedKeys.includes('4-1') ? token.colorPrimary : token.colorIcon }} />,
                  onClick: () => navigate('/transport-analytics')
                },
                { 
                  key: '4-2', 
                  label: '库存分析', 
                  icon: <BarChartOutlined style={{ color: selectedKeys.includes('4-2') ? token.colorPrimary : token.colorIcon }} />,
                  onClick: () => navigate('/inventory-analytics')
                },
              ],
            },
            {
              key: '5',
              icon: <SettingOutlined style={{ color: selectedKeys.includes('5') ? token.colorPrimary : token.colorIcon }} />,
              label: <span className="font-medium">系统设置</span>,
              onClick: () => navigate('/settings'),
              className: selectedKeys.includes('5') ? 'ant-menu-item-selected' : '',
            },
          ]}
        />
      </Sider>
      
      {/* 主内容区 */}
      <Layout>
        {/* 顶部导航栏 - 更柔和的渐变和阴影 */}
        <Header 
          style={{ 
            background: token.colorBgContainer,
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: 64,
            zIndex: 9
          }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center gap-4">
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            
            <Space size={4}>
              <HomeOutlined style={{ color: token.colorTextSecondary }} />
              <Text style={{ color: token.colorTextSecondary }}>/</Text>
              <Text strong style={{ color: token.colorPrimary }}>{pageTitle}</Text>
            </Space>
          </div>
          
          <div className="flex items-center gap-5">
            <Badge 
              count={5} 
              size="small" 
              offset={[-5, 5]}
              style={{ boxShadow: 'none' }}
            >
              <Button 
                type="text" 
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                style={{ color: token.colorText }}
              />
            </Badge>
            
            <Dropdown overlay={userMenu} trigger={['click']}>
              <Space 
                className="cursor-pointer px-2 py-1 hover:bg-gray-100 rounded-lg"
                style={{ transition: 'all 0.3s' }}
              >
                <Avatar 
                  style={{ 
                    background: token.colorPrimaryActive,
                    verticalAlign: 'middle',
                  }}
                  size="default"
                  gap={1}
                >
                  {user?.name?.charAt(0) || 'A'}
                </Avatar>
                {!collapsed && (
                  <Space direction="vertical" size={0} className="max-w-36">
                    <Text strong style={{ fontSize: 13, lineHeight: 'normal' }}>
                      {user?.name || '管理员'}
                    </Text>

                  </Space>
                )}
              </Space>
            </Dropdown>
          </div>
        </Header>
        
        {/* 页面内容 - 添加现代化的卡片布局 */}
        <Content 
          style={{ 
            padding: 24, 
            minHeight: 360,
            margin: '16px 16px 0',
            borderRadius: token.borderRadius,
            background: token.colorBgContainer,
            boxShadow: token.boxShadowTertiary
          }}
        >
          {children}
        </Content>
        
        {/* 底部页脚 */}
        <div 
          className="text-center py-4 text-xs"
          style={{ 
            color: token.colorTextDescription,
            borderTop: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          物流管理系统 ©{new Date().getFullYear()} 由物流科技提供技术支持
        </div>
      </Layout>
    </Layout>
  );
};

export default MainLayout;