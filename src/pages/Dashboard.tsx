import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Statistic, Table, Progress, Row, Col, Typography, Badge, Button } from 'antd';
import { 
  ProfileOutlined, 
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
const { Content } = Layout;
const { Title, Text } = Typography;

interface Shipment {
  key: string;
  shipmentId: string;
  origin: string;
  destination: string;
  status: '准备中' | '运输中' | '已送达' | '异常';
  estimatedArrival: string;
}

interface WarehouseItem {
  key: string;
  name: string;
  location: string;
  currentCapacity: number;
  maxCapacity: number;
  utilization: number;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
//   const [collapsed, setCollapsed] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const navigate = useNavigate();
//   const defaultOpenKeys = ['1', '2', '3', '4'];
  // 检查用户登录状态
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  
  // 模拟数据加载
  useEffect(() => {
    // 模拟API请求
    setTimeout(() => {
      const mockShipments: Shipment[] = [
        { key: '1', shipmentId: 'SH-20230001', origin: '上海仓库', destination: '广州配送中心', status: '准备中', estimatedArrival: '2023-05-15' },
        { key: '2', shipmentId: 'SH-20230002', origin: '深圳工厂', destination: '厦门零售店', status: '运输中', estimatedArrival: '2023-05-18' },
        { key: '3', shipmentId: 'SH-20230003', origin: '杭州仓库', destination: '南京配送中心', status: '已送达', estimatedArrival: '2023-05-12' },
        { key: '4', shipmentId: 'SH-20230004', origin: '宁波港', destination: '青岛仓库', status: '异常', estimatedArrival: '2023-05-20' },
        { key: '5', shipmentId: 'SH-20230005', origin: '郑州仓库', destination: '西安配送中心', status: '运输中', estimatedArrival: '2023-05-16' },
      ];
      
      const mockWarehouses: WarehouseItem[] = [
        { key: '1', name: '上海中央仓库', location: '上海', currentCapacity: 3500, maxCapacity: 5000, utilization: 70 },
        { key: '2', name: '广州南部分拣中心', location: '广州', currentCapacity: 1800, maxCapacity: 2500, utilization: 72 },
        { key: '3', name: '武汉中转仓库', location: '武汉', currentCapacity: 4200, maxCapacity: 6000, utilization: 70 },
        { key: '4', name: '成都西部分配中心', location: '成都', currentCapacity: 1200, maxCapacity: 2000, utilization: 60 },
      ];
      
      setShipments(mockShipments);
      setWarehouses(mockWarehouses);
    }, 800);
  }, []);

  const statusColors = {
    '准备中': '#1890ff',
    '运输中': '#faad14',
    '已送达': '#52c41a',
    '异常': '#f5222d'
  };

  const statusActions = {
    '准备中': <Button type="link" style={{ padding: '4px 0' }}>准备发货</Button>,
    '运输中': <Button type="link" style={{ padding: '4px 0' }}>追踪位置</Button>,
    '已送达': <Button type="link" style={{ padding: '4px 0' }}>确认签收</Button>,
    '异常': <Button type="link" style={{ padding: '4px 0' }}>查看详情</Button>
  };

  const shipmentColumns = [
    {
      title: '运单号',
      dataIndex: 'shipmentId',
      key: 'shipmentId',
    },
    {
      title: '发货地',
      dataIndex: 'origin',
      key: 'origin',
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Shipment['status']) => (
        <span className="status-badge">
          <span className="status-indicator" style={{ backgroundColor: statusColors[status] }} />
          <Text style={{ color: statusColors[status] }}>{status}</Text>
        </span>
      ),
    },
    {
      title: '预计到达时间',
      dataIndex: 'estimatedArrival',
      key: 'estimatedArrival',
    },
    {
      title: '操作',
      key: 'action',
      render: ( record: Shipment) => statusActions[record.status],
    },
  ];

  const warehouseColumns = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '使用率',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (utilization: number) => (
        <div style={{ width: 200 }}>
          <Progress 
            percent={utilization} 
            status={utilization > 85 ? 'exception' : utilization > 75 ? 'active' : 'normal'} 
            strokeColor={utilization > 85 ? '#f5222d' : utilization > 75 ? '#faad14' : '#52c41a'}
            trailColor="#f0f0f0"
          />
          <Text type="secondary">{utilization}%</Text>
        </div>
      ),
    },
    {
      title: '库存',
      key: 'stock',
      render: ( record: WarehouseItem) => (
        <Text>{record.currentCapacity.toLocaleString()}/{record.maxCapacity.toLocaleString()}</Text>
      ),
    },
  ];

  return (
    <MainLayout>
        <Content>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <Title level={4} className="mb-2">欢迎回来，{user?.name || '管理员'}！</Title>
            <Text type="secondary">这是您今天的物流运营概览，所有指标都在控制中</Text>
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable className="rounded-lg shadow-sm">
                <Statistic
                  title={<span className="text-gray-600 font-medium">今日运单量</span>}
                  value={46}
                  precision={0}
                  valueStyle={{ color: '#2563eb', fontSize: 28 }}
                  prefix={<BarChartOutlined style={{ color: '#93c5fd' }} />}
                />
                <div className="mt-2 flex items-center">
                  <Text type="secondary">较昨日</Text>
                  <Text type="success" className="ml-1 font-medium">+12%</Text>
                  <div className="ml-auto flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
                    <BarChartOutlined style={{ color: '#3b82f6' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable className="rounded-lg shadow-sm">
                <Statistic
                  title={<span className="text-gray-600 font-medium">准时送达率</span>}
                  value={92.5}
                  precision={1}
                  valueStyle={{ color: '#16a34a', fontSize: 28 }}
                  suffix="%"
                  prefix={<LineChartOutlined style={{ color: '#86efac' }} />}
                />
                <div className="mt-2 flex items-center">
                  <Text type="secondary">目标</Text>
                  <Text className="ml-1 font-medium" style={{ color: '#16a34a' }}>95%</Text>
                  <div className="ml-auto flex items-center justify-center w-8 h-8 bg-green-50 rounded-full">
                    <LineChartOutlined style={{ color: '#22c55e' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable className="rounded-lg shadow-sm">
                <Statistic
                  title={<span className="text-gray-600 font-medium">仓库平均使用率</span>}
                  value={78.3}
                  precision={1}
                  valueStyle={{ color: '#ca8a04', fontSize: 28 }}
                  suffix="%"
                  prefix={<PieChartOutlined style={{ color: '#fcd34d' }} />}
                />
                <div className="mt-2 flex items-center">
                  <Text type="secondary">2个仓库超限</Text>
                  <div className="ml-auto flex items-center justify-center w-8 h-8 bg-yellow-50 rounded-full">
                    <PieChartOutlined style={{ color: '#eab308' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable className="rounded-lg shadow-sm">
                <Statistic
                  title={<span className="text-gray-600 font-medium">异常运单</span>}
                  value={3}
                  precision={0}
                  valueStyle={{ color: '#dc2626', fontSize: 28 }}
                  prefix={<ProfileOutlined style={{ color: '#fecaca' }} />}
                />
                <div className="mt-2 flex items-center">
                  <Button type="link" size="small" className="p-0 text-red-500 hover:text-red-600">查看详情</Button>
                  <div className="ml-auto flex items-center justify-center w-8 h-8 bg-red-50 rounded-full">
                    <ProfileOutlined style={{ color: '#ef4444' }} />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
          
          <div className="mt-6">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Card 
                  title={<Text strong className="text-base">近期运单</Text>} 
                  extra={<Button type="primary" size="small">查看全部</Button>}
                  className="h-full rounded-lg shadow-sm"
                >
                  <Table 
                    columns={shipmentColumns} 
                    dataSource={shipments} 
                    pagination={{ pageSize: 5, hideOnSinglePage: true }} 
                    size="middle"
                    className="custom-table"
                  />
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card 
                  title={<Text strong className="text-base">仓库状态</Text>}
                  extra={<Button type="primary" size="small">管理仓库</Button>}
                  className="h-full rounded-lg shadow-sm"
                >
                  <Table 
                    columns={warehouseColumns} 
                    dataSource={warehouses} 
                    pagination={{ pageSize: 4, hideOnSinglePage: true }} 
                    size="middle"
                    className="custom-table"
                  />
                </Card>
              </Col>
            </Row>
          </div>
          
          <div className="mt-6">
            <Card
              title={<Text strong className="text-base">物流绩效指标</Text>}
              extra={<Button type="primary" size="small">生成报告</Button>}
              className="rounded-lg shadow-sm"
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                  <Card className="rounded-lg shadow-sm border-0">
                    <Title level={5} className="text-gray-700">运输距离</Title>
                    <div className="flex justify-center mt-3">
                      <Progress 
                        type="circle" 
                        percent={82} 
                        size={120}
                        strokeWidth={12}
                        strokeColor="#3b82f6"
                        trailColor="#dbeafe"
                        format={() => 
                          <div className="text-center">
                            <div className="font-bold text-2xl">4,258</div>
                            <div className="text-xs text-gray-500">公里</div>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-6">
                      <Text className="text-gray-600">平均每单 85.6 公里</Text>
                      <div className="mt-3">
                        <Button size="small" type="link" className="text-blue-500 font-medium">查看详情</Button>
                      </div>
                    </div>
                  </Card>
                </Col>
                
                <Col xs={24} md={8}>
                  <Card className="rounded-lg shadow-sm border-0">
                    <Title level={5} className="text-gray-700">运输成本</Title>
                    <div className="flex justify-center mt-3">
                      <Progress 
                        type="circle" 
                        percent={67} 
                        size={120}
                        strokeWidth={12}
                        strokeColor="#22c55e"
                        trailColor="#dcfce7"
                        format={() => 
                          <div className="text-center">
                            <div className="font-bold text-2xl">¥25,680</div>
                            <div className="text-xs text-gray-500">本月成本</div>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-6">
                      <Text className="text-gray-600">每单成本降低 4.2%</Text>
                      <div className="mt-3">
                        <Button size="small" type="link" className="text-green-500 font-medium">优化建议</Button>
                      </div>
                    </div>
                  </Card>
                </Col>
                
                <Col xs={24} md={8}>
                  <Card className="rounded-lg shadow-sm border-0">
                    <Title level={5} className="text-gray-700">运输时效</Title>
                    <div className="flex justify-center mt-3">
                      <Progress 
                        type="circle" 
                        percent={88} 
                        size={120}
                        strokeWidth={12}
                        strokeColor="#f59e0b"
                        trailColor="#fef3c7"
                        format={() => 
                          <div className="text-center">
                            <div className="font-bold text-2xl">18.5</div>
                            <div className="text-xs text-gray-500">平均小时</div>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-6">
                      <Text className="text-gray-600">较上月提升 1.2 小时</Text>
                      <div className="mt-3">
                        <Button size="small" type="link" className="text-yellow-500 font-medium">分析原因</Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </div>
        </Content>

      
      {/* <style global jsx>{`
        .status-badge {
          display: flex;
          align-items: center;
        }
        
        .status-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .ant-table-thead > tr > th {
          background-color: #f9fafb !important;
          font-weight: 600 !important;
        }
        
        .ant-card-head {
          border-bottom: 1px solid #f3f4f6 !important;
        }
        
        .ant-menu-item {
          border-radius: 8px !important;
          margin: 4px 8px !important;
        }
        
        .ant-menu-item-selected {
          background-color: #dbeafe !important;
        }
        
        .ant-menu-item:hover {
          background-color: #eff6ff !important;
        }
        
        .ant-menu-submenu-title:hover {
          background-color: #eff6ff !important;
        }
        
        .custom-table .ant-table-tbody > tr > td {
          padding: 12px 16px;
        }
        
        .custom-table .ant-table-thead > tr > th {
          padding: 12px 16px;
        }
      `}</style> */}
    </MainLayout>
  );
};

export default Dashboard;