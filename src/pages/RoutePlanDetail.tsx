import { Card, List, Descriptions, Typography, Button } from 'antd';
import { CarOutlined, CheckCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Item } = Descriptions;

const RoutePlanDetail = ({ routePlan }) => {
  if (!routePlan || !routePlan.nodes) {
    return (
      <Card 
        className="h-full shadow-sm" 
        styles={{
          body:{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '24px'
          }
        }}
      >
        <div className="text-center">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CarOutlined className="text-3xl text-blue-500" />
          </div>
          <Title level={5} className="mb-2">路线规划结果</Title>
          <Text type="secondary">
            添加配送点并计算路线后，将会在这里显示详细规划结果
          </Text>
        </div>
      </Card>
    );
  }

  const { nodes, distance, time } = routePlan;

  return (
    <Card 
      className="h-full shadow-sm" 
      bodyStyle={{ padding: '16px', height: '100%', overflow: 'auto' }}
    >
      <div className="sticky top-0 bg-white z-10 pb-4">
        <Title level={5} className="mb-4">配送路线详情</Title>
        
        <Descriptions 
          bordered 
          size="small" 
          column={1} 
          className="mb-4 bg-blue-50 rounded-lg"
        >
          <Item label="节点数量" className="font-medium">
            <span className="font-bold text-blue-600">{nodes.length} 个</span>
          </Item>
          <Item label="总距离" className="font-medium">
            <span className="font-bold text-blue-600">{distance} 公里</span>
          </Item>
          <Item label="预计耗时" className="font-medium">
            <span className="font-bold text-blue-600">{Math.floor(time/60)}小时{time%60}分钟</span>
          </Item>
        </Descriptions>
        
        <div className="flex mb-4 gap-2 mt-4">
          <Button type="primary" block icon={<CheckCircleOutlined />}>确认路线</Button>
          <Button block icon={<EnvironmentOutlined />}>分享位置</Button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <Title level={5} className="mb-3">配送顺序</Title>
        
        <List
          className="route-list"
          dataSource={nodes}
          renderItem={(item, index) => (
            <List.Item className="bg-white rounded-lg p-3 mb-2 border border-gray-200">
              <div className="flex items-center">
                <div className="mr-3 flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold ml-3">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {item.position[0].toFixed(4)}, {item.position[1].toFixed(4)}
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
};

export default RoutePlanDetail;