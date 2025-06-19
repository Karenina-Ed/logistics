import { useState } from 'react';
import { Card, Button, Row, Col, Typography, Tabs, Space } from 'antd';
import { 
  SaveOutlined,
  ShareAltOutlined,
  ExportOutlined,
  PlusOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import MapboxTSP from '../components/MapboxTSP';
import RoutePlanDetail from './RoutePlanDetail';
import MainLayout from '../components/MainLayout';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const RoutePlanningPage = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [routePlan, setRoutePlan] = useState(null);
  
  const saveRoutePlan = () => {
    console.log('保存路线计划');
  };

  const shareRoutePlan = () => {
    console.log('分享路线计划');
  };

  const exportRoutePlan = () => {
    console.log('导出路线计划');
  };

  const handleRouteCalculated = (plan) => {
    setRoutePlan(plan);
  };

  return (
    <MainLayout pageTitle="配送路线规划">
      <div className="p-1">
        {/* 顶部标题和操作按钮 */}
        <Card className="mb-4 shadow-sm">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} className="mb-0">配送路线规划</Title>
              <Text type="secondary">在地图上添加配送点，优化最佳路线</Text>
            </Col>
            <Col>
              <Space.Compact>
                <Button type="primary" icon={<SaveOutlined />} onClick={saveRoutePlan}>
                  保存路线
                </Button>
                <Button icon={<ShareAltOutlined />} onClick={shareRoutePlan}>
                  分享路线
                </Button>
                <Button icon={<ExportOutlined />} onClick={exportRoutePlan}>
                  导出详情
                </Button>
              </Space.Compact>
            </Col>
          </Row>
        </Card>
        
        {/* 主内容区 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <Button type="primary" icon={<PlusOutlined />}>新建路线</Button>
          }
          className="route-planning-tabs"
        >
          {/* 地图规划选项卡 */}
          <TabPane tab="地图规划" key="1">
            <Row gutter={16} style={{ height: 'calc(100vh - 335px)' }}>
            {/* 地图区域 - 调整为更大的占比 */}
                <Col xs={24} md={19} style={{ height: '100%' }}>
                    
                    <MapboxTSP 
                        onRouteCalculated={handleRouteCalculated} 
                        style={{ height: '100%', width: '100%' }}
                    />

                </Col>
                
                {/* 路线规划结果面板 - 调整为更窄的宽度 */}
                <Col xs={24} md={5} style={{ height: '100%' }}>
                    <RoutePlanDetail routePlan={routePlan} />
                </Col>
            </Row>
          </TabPane>
          
          {/* 批量导入选项卡 */}
          <TabPane tab="批量导入" key="2">
            <Card style={{ height: 'calc(100vh - 335px)' }}>
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Title level={4} className="mb-4">批量导入配送点</Title>
                  <Button type="primary" size="large" className="mb-4">
                    下载模板
                  </Button>
                  <div className="mt-8">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                      <ProfileOutlined className="text-4xl text-gray-400 mb-3" />
                      <Text type="secondary">拖放 Excel 文件或点击上传</Text>
                      <Button className="mt-4">选择文件</Button>
                    </div>
                    <Text type="secondary">支持格式: .xlsx, .csv</Text>
                  </div>
                </div>
              </div>
            </Card>
          </TabPane>
          
          {/* 历史路线选项卡 */}
          <TabPane tab="历史路线" key="3">
            <Card style={{ height: 'calc(100vh - 335px)' }}>
              <div className="h-full p-4 overflow-auto">
                <Title level={4} className="mb-6">历史路线记录</Title>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(item => (
                    <div 
                      key={item} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer"
                    >
                      <div>
                        <Text strong className="block">配送路线 #{item}</Text>
                        <Text type="secondary">2023-06-1{item} | 12个配送点 | 总距离: 28{item}km</Text>
                      </div>
                      <div>
                        <Button type="link">查看详情</Button>
                        <Button type="link">加载到地图</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </div>

      <style jsx="true">{`
        .route-planning-tabs .ant-tabs-nav {
          margin-bottom: 16px;
        }
        
        .route-planning-tabs .ant-tabs-content {
          height: 100%;
        }
        
        .route-planning-tabs .ant-tabs-tabpane {
          height: 100%;
        }
        
        .ant-card-body {
          height: 100%;
        }
      `}</style>
    </MainLayout>
  );
};

export default RoutePlanningPage;