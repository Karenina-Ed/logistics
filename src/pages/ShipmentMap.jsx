import React, { useRef, useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { Spin, Card, Tag, Space, Button, Timeline, message } from 'antd';
import { SearchOutlined, EnvironmentOutlined, CarOutlined, ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import 'mapbox-gl/dist/mapbox-gl.css';
import MainLayout from '../components/MainLayout';
import { gcj02ToWgs84, wgs84ToGcj02 } from '../utils/coordTransform';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// 环境变量配置
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;

// 状态类型映射
const statusColors = {
  '待分配': 'default',
  '已分配': 'processing',
  '运输中': 'blue',
  '已到达': 'orange',
  '已完成': 'green',
  '异常': 'red'
};

// 主组件
const ShipmentMap = () => {
  const mapRoot = useRef(null);
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [activeStatus, setActiveStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [searchVal, setSearchVal] = useState("");
  const [mapCenter, setMapCenter] = useState([120.1551, 30.2741]);
  const [calculatingRoute, setCalculatingRoute] = useState(null);
  const routeCache = useRef({});
  const popupRef = useRef(null);
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // 调用高德API计算路径和ETA
  const calculateRoute = async (origin, destination, shipmentId) => {
    // 检查缓存
    if (routeCache.current[shipmentId]) {
      return routeCache.current[shipmentId];
    }
    
    setRouteLoading(true);
    setCalculatingRoute(shipmentId);
    
    try {
      const originStr = `${origin[0]},${origin[1]}`;
      const destinationStr = `${destination[0]},${destination[1]}`;
      
      const response = await fetch(
        `https://restapi.amap.com/v3/direction/driving?key=${AMAP_KEY}&origin=${originStr}&destination=${destinationStr}&strategy=0`
      );
      
      const data = await response.json();
      
      if (data.status !== '1' || !data.route || !data.route.paths || data.route.paths.length === 0) {
        throw new Error('路径规划失败: ' + (data.info || '未知错误'));
      }
      
      const path = data.route.paths[0];
      const distance = path.distance;
      const duration = path.duration;
      
      let coords = [];
      const steps = path.steps;
      for (const step of steps) {
        const pts = step.polyline.split(";").map(str => {
          const [lng, lat] = str.split(",").map(Number);
          return gcj02ToWgs84(lng, lat); 
        });
        coords = coords.concat(pts);
      }
      
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + duration * 1000);
      
      const formattedArrivalTime = arrivalTime.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const result = {
        route: coords,
        distance: (distance / 1000).toFixed(1) + '公里',
        duration: Math.round(duration / 60) + '分钟',
        estimatedArrival: formattedArrivalTime,
        remainingTime: formatRemainingTime(duration)
      };
      
      // 添加到缓存
      routeCache.current[shipmentId] = result;
      
      return result;
    } catch (err) {
      console.error('路径计算失败:', err);
      message.error('路径计算失败: ' + err.message);
      return null;
    } finally {
      setRouteLoading(false);
      setCalculatingRoute(null);
    }
  };

  // 格式化剩余时间
  const formatRemainingTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  // 模拟后端数据
  const fetchShipments = async () => {
    setLoading(true);
    try {
      // 使用更丰富的基础数据
      const mockData = [
        { 
          id: "ORD001", 
          number: "WB0001", 
          status: "待分配", 
          sender: "杭州仓库", 
          receiver: "上海客户中心", 
          position: [120.2115, 30.2741], 
          createdAt: "2025-06-01", 
          weight: 12.5, 
          volume: 0.8, 
          driver: "未分配",
          origin: "杭州", 
          destination: "上海" 
        },
        { 
          id: "ORD002", 
          number: "WB0002", 
          status: "已分配", 
          sender: "宁波分中心", 
          receiver: "杭州下沙仓", 
          position: [121.5500, 29.8600], 
          createdAt: "2025-06-01", 
          weight: 8.2, 
          volume: 1.2, 
          driver: "李师傅",
          origin: "宁波", 
          destination: "杭州" 
        },
        { 
          id: "ORD003", 
          number: "WB0003", 
          status: "运输中", 
          sender: "金华集散中心", 
          receiver: "台州配送站", 
          position: [120.0750, 29.2900], 
          createdAt: "2025-06-02", 
          weight: 15.0, 
          volume: 2.1, 
          driver: "王师傅",
          origin: "金华", 
          destination: "台州",
          originPosition: [120.0750, 29.2900], // 新增起点坐标
          destinationPosition: [121.0850, 29.9800], // 新增目的地坐标
          progress: [
            { time: "09:00", location: "金华集散中心出发" },
            { time: "11:30", location: "义乌东收费站" },
            { time: "14:00", location: "永康服务区" }
          ]
        },
        { 
          id: "ORD004", 
          number: "WB0004", 
          status: "已到达", 
          sender: "杭州余杭仓", 
          receiver: "嘉兴电商园", 
          position: [120.7550, 30.7540], 
          createdAt: "2025-06-03", 
          weight: 5.5, 
          volume: 0.5, 
          driver: "张师傅",
          origin: "杭州", 
          destination: "嘉兴" 
        },
        { 
          id: "ORD005", 
          number: "WB0005", 
          status: "已完成", 
          sender: "绍兴分拨中心", 
          receiver: "杭州滨江仓", 
          position: [120.2115, 30.2020], 
          createdAt: "2025-06-04", 
          weight: 18.0, 
          volume: 3.0, 
          driver: "赵师傅",
          origin: "绍兴", 
          destination: "杭州" 
        },
        { 
          id: "ORD006", 
          number: "WB0006", 
          status: "异常", 
          sender: "温州配送站", 
          receiver: "宁波北仑港", 
          position: [121.5500, 29.9400], 
          createdAt: "2025-06-05", 
          weight: 9.8, 
          volume: 1.5, 
          driver: "陈师傅",
          origin: "温州", 
          destination: "宁波",
          issue: "车辆故障，停靠检修"
        }
      ];
      
      setShipments(mockData);
      setFilteredShipments(mockData);
      
      // 获取所有运输中订单并自动计算路线
      const transportingShipments = mockData.filter(s => s.status === '运输中');
      for (const shipment of transportingShipments) {
        // 确保有目的地坐标
        if (shipment.destinationPosition) {
          const routeInfo = await calculateRoute(shipment.originPosition, shipment.destinationPosition, shipment.id);
          if (routeInfo) {
            // 更新运单数据
            const updatedShipments = mockData.map(s => 
              s.id === shipment.id ? {
                ...s,
                route: routeInfo.route,
                estimatedArrival: routeInfo.estimatedArrival,
                remainingTime: routeInfo.remainingTime,
                distance: routeInfo.distance
              } : s
            );
            setShipments(updatedShipments);
            setFilteredShipments(updatedShipments);
          }
        }
      }
      
      // 如果地图已加载，更新路线图层
      if (mapRef.current) {
        updateRouteLayer();
      }
    } catch (err) {
      setError("运单数据加载失败: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // 更新路线图层
  const updateRouteLayer = () => {
    const map = mapRef.current;
    if (!map || !map.getSource('shipments-routes')) return;
    
    // 创建路线特征 - 仅使用已缓存的路线
    const routeFeatures = shipments
      .filter(shipment => shipment.status === '运输中' && routeCache.current[shipment.id])
      .map(shipment => ({
        type: 'Feature',
        properties: {
          id: shipment.id,
          number: shipment.number,
          estimatedArrival: routeCache.current[shipment.id].estimatedArrival,
          distance: routeCache.current[shipment.id].distance,
          active: selectedShipment?.id === shipment.id
        },
        geometry: {
          type: 'LineString',
          coordinates: routeCache.current[shipment.id].route
        }
      }));
    
    // 更新路线数据源
    const routesSource = map.getSource('shipments-routes');
    routesSource.setData({
      type: 'FeatureCollection',
      features: routeFeatures
    });
  };

  // 地图初始化
  useEffect(() => {
    if (mapRef.current || !MAPBOX_TOKEN) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const map = new mapboxgl.Map({
      container: mapRoot.current,
      style: "mapbox://styles/yejiangtao/cmc0fwndc001g01sk5svsadei",
      center: mapCenter,
      zoom: 7,
      attributionControl: false
    });
    
    mapRef.current = map;

    map.on("load", () => {
      setLoaded(true);
      
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      
      // 提前创建路线数据源（可能为空）
      map.addSource('shipments-routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      // 添加路线图层
      map.addLayer({
        id: 'routes-lines',
        type: 'line',
        source: 'shipments-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'active'], true],
            '#1890ff',   // 选中路线使用亮蓝色
            '#096dd9'    // 其他路线使用深蓝色
          ],
          'line-width': [
            'case',
            ['==', ['get', 'active'], true],
            5,   // 选中路线宽度
            3    // 普通路线宽度
          ],
          'line-opacity': 0.8
        }
      });
      
      // 为路线添加交互事件
      map.on('mouseenter', 'routes-lines', (e) => {
        // 添加鼠标效果
        map.getCanvas().style.cursor = 'pointer';
        
        const feature = e.features?.[0];
        if (!feature) return;
        
        // 移除现有的Popup
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
        
        // 创建新Popup
        popupRef.current = new mapboxgl.Popup({ 
            offset: [0, -10],
            closeButton: false,
            className: 'custom-map-popup' // 添加自定义类名
          })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <div class="font-medium text-sm">${feature.properties.number}</div>
              </div>
              <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#1890FF"/>
                  </svg>
                  <span>距离:</span>
                </div>
                <div class="font-medium">${feature.properties.distance}</div>
                
                <div class="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#1890FF"/>
                    <path d="M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="#1890FF"/>
                  </svg>
                  <span>到达:</span>
                </div>
                <div class="font-medium">${feature.properties.estimatedArrival}</div>
              </div>
            </div>
          `)
          .addTo(map);
      });
      
      map.on('mousemove', 'routes-lines', (e) => {
        // 移动Popup位置
        if (popupRef.current) {
          popupRef.current.setLngLat(e.lngLat);
        }
      });
      
      map.on('mouseleave', 'routes-lines', () => {
        // 移除鼠标效果
        map.getCanvas().style.cursor = '';
        
        // 移除Popup
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });
      
      map.on('click', 'routes-lines', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        
        const shipmentId = feature.properties.id;
        const clickedShipment = shipments.find(s => s.id === shipmentId);
        
        if (clickedShipment) {
          setSelectedShipment(clickedShipment);
        }
      });
    });
    
    map.on("error", e => setError(e.error?.message || "地图错误"));
    
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 加载运单数据
  useEffect(() => {
    fetchShipments();
  }, []);

  // 渲染运单标记和路线
  useEffect(() => {
    if (!loaded || !mapRef.current || shipments.length === 0) return;
    
    const map = mapRef.current;
    
    // 只显示运输中的订单
    const transportingShipments = shipments.filter(s => s.status === '运输中');
    
    // 创建起点标记的GeoJSON数据源
    const startPointFeatures = transportingShipments.map(shipment => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: shipment.position },
      properties: {
        id: shipment.id,
        type: 'start',
        status: shipment.status,
        number: shipment.number,
        driver: shipment.driver
      }
    }));
    
    // 创建终点标记的GeoJSON数据源
    const endPointFeatures = transportingShipments
      .filter(shipment => shipment.destinationPosition)
      .map(shipment => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: shipment.destinationPosition },
        properties: {
          id: shipment.id,
          type: 'end',
          status: shipment.status,
          number: shipment.number,
          driver: shipment.driver
        }
      }));
    
    const pointSourceName = 'shipments-points';
    
    // 更新或添加点标记源（合并起点和终点）
    if (map.getSource(pointSourceName)) {
      map.getSource(pointSourceName).setData({
        type: 'FeatureCollection',
        features: [...startPointFeatures, ...endPointFeatures]
      });
    } else {
      map.addSource(pointSourceName, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [...startPointFeatures, ...endPointFeatures]
        }
      });
    }
    
    // 移除旧的点图层
    if (map.getLayer('shipment-markers')) map.removeLayer('shipment-markers');
    if (map.getLayer('marker-labels')) map.removeLayer('marker-labels');
    
    // 添加新的点标记图层
    map.addLayer({
      id: 'shipment-markers',
      type: 'circle',
      source: pointSourceName,
      paint: {
        'circle-color': [
          'match',
          ['get', 'type'],
          'start', '#096dd9',  // 起点用蓝色
          'end', '#52c41a',    // 终点用绿色
          '#bfbfbf'
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
    
    // 添加文字标签
    map.addLayer({
      id: 'marker-labels',
      type: 'symbol',
      source: pointSourceName,
      filter: ['==', ['get', 'type'], 'start'], // 只在起点显示标签
      layout: {
        'text-field': ['get', 'number'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 0.8],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    });
  
    // 添加终点图标
    if (!map.getLayer('destination-icons')) {
      map.addLayer({
        id: 'destination-icons',
        type: 'symbol',
        source: pointSourceName,
        filter: ['==', ['get', 'type'], 'end'], // 只在终点显示图标
        layout: {
          'icon-image': 'destination-icon',
          'icon-size': 0.8,
          'icon-allow-overlap': true
        }
      });
    }
  
    // 更新路线图层
    updateRouteLayer();
    
    // 添加点点击事件
    if (!map.__shipmentMarkerEventBound) {
      map.on('click', 'shipment-markers', async (e) => {
        const shipmentId = e.features[0].properties.id;
        const clickedShipment = shipments.find(s => s.id === shipmentId);
        if (clickedShipment) {
          // 停止任何可能的弹跳动画
          setSelectedShipment(null);
          
          setTimeout(() => {
            setSelectedShipment(clickedShipment);
          }, 50);
        }
      });
      
      map.on('mouseenter', 'shipment-markers', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      
      map.on('mouseleave', 'shipment-markers', () => {
        map.getCanvas().style.cursor = '';
      });
      
      map.__shipmentMarkerEventBound = true;
    }
    
    // 初始加载时居中到所有运单
    if (shipments.length > 0 && !selectedShipment) {
      const positions = shipments.map(s => s.position);
      const bounds = positions.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(positions[0], positions[0]));
      
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 8,
        duration: 2000
      });
    }
  }, [loaded, shipments, filteredShipments, selectedShipment]);

  // 过滤运单
  useEffect(() => {
    if (activeStatus === 'all') {
      setFilteredShipments(shipments);
    } else {
      setFilteredShipments(shipments.filter(s => s.status === activeStatus));
    }
  }, [activeStatus, shipments]);

  // 处理搜索
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchVal(value);
    
    if (!value) {
      setFilteredShipments(shipments);
      return;
    }
    
    const results = shipments.filter(shipment => 
      shipment.number.toLowerCase().includes(value) ||
      shipment.sender.toLowerCase().includes(value) ||
      shipment.receiver.toLowerCase().includes(value) ||
      shipment.driver.toLowerCase().includes(value)
    );
    
    setFilteredShipments(results);
  };

  // 状态筛选
  const statusFilters = [
    { key: 'all', label: '全部运单' },
    { key: '待分配', label: '待分配' },
    { key: '已分配', label: '已分配' },
    { key: '运输中', label: '运输中' },
    { key: '已到达', label: '已到达' },
    { key: '已完成', label: '已完成' },
    { key: '异常', label: '异常' }
  ];

  // 渲染运输时间线
  const renderProgressTimeline = (shipment) => {
    if (!shipment.progress || shipment.status !== '运输中') return null;
    
    return (
      <div className="mt-4">
        <h4 className="font-medium mb-3">运输进度</h4>
        <Timeline>
          {shipment.progress.map((item, index) => (
            <Timeline.Item 
              key={index} 
              dot={index === 0 ? <EnvironmentOutlined style={{ fontSize: '16px' }} /> : null}
            >
              <div className="font-medium">{item.time}</div>
              <div>{item.location}</div>
            </Timeline.Item>
          ))}
          {shipment.estimatedArrival && (
            <Timeline.Item color="green">
              <div className="font-medium text-green-600">预计到达: {shipment.estimatedArrival}</div>
              <div>{shipment.receiver}</div>
            </Timeline.Item>
          )}
        </Timeline>
      </div>
    );
  };
  
  // 渲染运输路径信息
  const renderRouteInfo = (shipment) => {
    if (shipment.status !== '运输中') return null;
    
    const routeInfo = routeCache.current[shipment.id];
    
    return (
      <div className="mt-4 bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <CarOutlined className="text-blue-600 text-lg" />
          <span className="font-medium">运输路径信息</span>
        </div>
        
        {routeInfo ? (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <EnvironmentOutlined className="text-green-600" />
              <span className="font-medium">路线:</span> 
              {shipment.origin} <ArrowRightOutlined className="mx-2" /> {shipment.destination}
            </div>
            
            {routeInfo.distance && (
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-blue-100 p-1 rounded">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM12 19C8.13 19 5 15.87 5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19ZM16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" fill="#1890FF"/>
                  </svg>
                </div>
                <span>距离: {routeInfo.distance}</span>
              </div>
            )}
            
            {routeInfo.remainingTime && (
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-green-100 p-1 rounded">
                  <ClockCircleOutlined className="text-green-600 text-base" />
                </div>
                <span>剩余时间: {routeInfo.remainingTime}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <Spin tip="计算运输路径中..." />
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout pageTitle="运单追踪">
      <div className="p-1">
        {/* 顶部控制栏 */}
        <Card className="mb-4 shadow-md" bodyStyle={{ padding: '16px' }}>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <input
                  type="text"
                  value={searchVal}
                  onChange={handleSearch}
                  placeholder="搜索运单号、发货方、收货方或司机..."
                  className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <SearchOutlined className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-600 font-medium">状态筛选：</span>
              <Space wrap>
                {statusFilters.map(filter => (
                  <Button
                    key={filter.key}
                    type={activeStatus === filter.key ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setActiveStatus(filter.key)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </Space>
            </div>
            
            <div className="flex items-center">
              <Button 
                type="primary" 
                onClick={fetchShipments} 
                loading={loading}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>}
              >
                刷新数据
              </Button>
            </div>
          </div>
        </Card>
        
        {/* 主要内容区 */}
        <div className="flex gap-4 mt-4 shadow-sm" style={{ height: 'calc(100vh - 250px)' }}>
          {/* 左侧地图区域 */}
          <div className="flex-1 flex flex-col h-full bg-white rounded-lg overflow-hidden shadow relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
                <Spin tip="加载运单数据..." size="large" />
              </div>
            )}
            
            {(routeLoading || loading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
                <Spin 
                  tip={routeLoading ? `计算 ${calculatingRoute} 的运输路径中...` : "加载运单数据..."} 
                  size="large" 
                />
              </div>
            )}
            
            {error && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-md text-sm">
                {error}
              </div>
            )}
            
            <div ref={mapRoot} className="flex-1" />
            
            {/* 图例说明 */}
            <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-sm z-10 max-w-xs">
              <div className="font-medium mb-2">图例说明</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#096dd9] flex items-center justify-center"></div>
                <span className="text-sm">起点位置</span>
                </div>
                <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#52c41a] flex items-center justify-center"></div>
                <span className="text-sm">终点位置</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                <div className="w-5 h-1 bg-[#096dd9]" />
                <span className="text-sm">运输路径</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧运单详情区域 */}
          <div className="w-96 bg-white rounded-lg shadow-inner overflow-hidden flex flex-col">
            <div className="p-4 absolute bg-gradient-to-r from-transparent via-blue-100 to-transparent sticky top-0 bg-white z-10 shadow-sm">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 17H13V11H11V17ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 13C9.33 13 4 14.34 4 17V20H20V17C20 14.34 14.67 13 12 13Z" fill="#1890FF"/>
                </svg>
                {selectedShipment ? '运单详情' : '运单列表'}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedShipment 
                  ? `查看 ${selectedShipment.number} 详情` 
                  : `共 ${filteredShipments.length} 条运单`}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {selectedShipment ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <Tag 
                          color={statusColors[selectedShipment.status]} 
                          className="font-medium"
                        >
                          {selectedShipment.status}
                        </Tag>
                        <span className="ml-2 text-sm text-gray-500">
                          {selectedShipment.createdAt}
                        </span>
                      </div>
                      <Button 
                        size="small" 
                        onClick={() => setSelectedShipment(null)}
                        className="flex items-center"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                          <path d="M15.41 16.59L10.83 12L15.41 7.41L14 6L8 12L14 18L15.41 16.59Z" fill="currentColor"/>
                        </svg>
                        返回列表
                      </Button>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-end">
                      <div>
                        <h3 className="font-bold text-xl">{selectedShipment.number}</h3>
                        <p className="text-gray-700">{selectedShipment.sender} → {selectedShipment.receiver}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 text-sm">总重量</span>
                        <div className="font-bold">{selectedShipment.weight} kg</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="border border-gray-100 rounded-lg p-3">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8H20V18ZM20 6H4V8H20V6Z" fill="#1890FF"/>
                          <path d="M6 10H8V14H6V10ZM10 10H18V12H10V10ZM10 14H14V16H10V14Z" fill="#1890FF"/>
                        </svg>
                        物流信息
                      </h4>
                      <div className="text-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="text-gray-500 min-w-[70px]">发货方：</div>
                          <div className="font-medium">{selectedShipment.sender}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-gray-500 min-w-[70px]">收货方：</div>
                          <div className="font-medium">{selectedShipment.receiver}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-gray-500 min-w-[70px]">司机：</div>
                          <Tag 
                            color={selectedShipment.driver === '未分配' ? 'default' : 'blue'} 
                            className="font-medium"
                          >
                            {selectedShipment.driver}
                          </Tag>
                        </div>
                        {selectedShipment.issue && (
                          <div className="bg-red-50 p-2 rounded flex items-start gap-2 mt-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#F5222D"/>
                            </svg>
                            <div className="text-red-700 text-sm">
                              <div className="font-medium">异常原因</div>
                              <div>{selectedShipment.issue}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border border-gray-100 rounded-lg p-3">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20C7.66 20 9 18.66 9 17H15C15 18.66 16.34 20 18 20C19.66 20 21 18.66 21 17H23V12L20 8ZM6 18.5C5.17 18.5 4.5 17.83 4.5 17C4.5 16.17 5.17 15.5 6 15.5C6.83 15.5 7.5 16.17 7.5 17C7.5 17.83 6.83 18.5 6 18.5ZM17 10H19.5L20.5 12H17V10ZM18 18.5C17.17 18.5 16.5 17.83 16.5 17C16.5 16.17 17.17 15.5 18 15.5C18.83 15.5 19.5 16.17 19.5 17C19.5 17.83 18.83 18.5 18 18.5Z" fill="#1890FF"/>
                        </svg>
                        货物信息
                      </h4>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded flex-1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 22C4.9 22 4 21.1 4 20C4 18.9 4.9 18 6 18C7.1 18 8 18.9 8 20C8 21.1 7.1 22 6 22ZM18 22C16.9 22 16 21.1 16 20C16 18.9 16.9 18 18 18C19.1 18 20 18.9 20 20C20 21.1 19.1 22 18 22ZM20 17H7V11H20V17ZM18.94 4H16L14.25 2H9.75L8 4H5.06C4.77 4 4.5 4.19 4.42 4.47L3.05 9.4C2.99 9.61 2.98 9.8 3.02 10H6V20H17V10H21.02C21.05 9.82 21.02 9.62 20.95 9.41L19.58 4.47C19.5 4.19 19.23 4 18.94 4ZM15 4H13.25L12 2.74L10.75 4H9L8.17 5H15.83L15 4Z" fill="#1890FF"/>
                          </svg>
                          <div>
                            <div className="text-gray-500 text-xs">重量</div>
                            <div className="font-medium">{selectedShipment.weight} kg</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 p-2 rounded flex-1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 4H3C1.9 4 2 4.9 2 6V18C2 19.1 2.9 20 3 20H21C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 21 4ZM21 18H3V8H21V18ZM21 6H3V8H21V6Z" fill="#52C41A"/>
                          </svg>
                          <div>
                            <div className="text-gray-500 text-xs">体积</div>
                            <div className="font-medium">{selectedShipment.volume} m³</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 渲染运输路径信息 */}
                    {renderRouteInfo(selectedShipment)}
                    
                    {/* 渲染运输时间线 */}
                    {renderProgressTimeline(selectedShipment)}
                    
                    <div className="flex justify-between gap-2 mt-6">
                      {selectedShipment.status === '待分配' && (
                        <Button type="primary" className="flex-1">分配司机</Button>
                      )}
                      
                      {selectedShipment.status === '已分配' && (
                        <Button type="primary" className="flex-1">启动物流</Button>
                      )}
                      
                      {selectedShipment.status === '运输中' && (
                        <Button type="primary" className="flex-1">更新位置</Button>
                      )}
                      
                      {selectedShipment.status === '已到达' && (
                        <Button type="primary" className="flex-1">完成签收</Button>
                      )}
                      
                      {selectedShipment.status === '异常' && (
                        <Button danger className="flex-1">处理异常</Button>
                      )}
                      
                      <Button className="flex-1 flex items-center justify-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C21.1 21 22 20.1 22 19V12H19ZM13 12.67L15.59 10.09L17 11.5L13 15.5L9 11.5L10.41 10.09L13 12.67ZM13 5V11H11V5H6V11H3L8 16L13 11H10V5H13Z" fill="currentColor"/>
                        </svg>
                        导出
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 ">
                  {filteredShipments.length > 0 ? filteredShipments.map(shipment => (
                    <Card 
                      key={shipment.id} 
                      size="small"
                      hoverable
                      onClick={() => setSelectedShipment(shipment)}
                      className="cursor-pointer transition-shadow border hover:z-10"
                    >
                      <div className="flex items-start">
                        <Tag color={statusColors[shipment.status]} className="mr-2">
                          {shipment.status}
                        </Tag>
                        <div className="flex-1">
                          <h3 className="font-medium">{shipment.number}</h3>
                          <p className="text-xs text-gray-500 truncate">
                            {shipment.sender} → {shipment.receiver}
                          </p>
                          {shipment.status === '运输中' && shipment.estimatedArrival && (
                            <p className="text-xs text-green-600 mt-1 flex items-center">
                              <ClockCircleOutlined className="mr-1" />
                              预计到达: {shipment.estimatedArrival}
                              {shipment.remainingTime && (
                                <span className="ml-1">({shipment.remainingTime})</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">{shipment.createdAt}</span>
                        <span className="text-xs">
                          {shipment.weight}kg / {shipment.volume}m³
                        </span>
                      </div>
                    </Card>
                  )) : (
                    <div className="text-center py-10 text-gray-500">
                      <svg className="mx-auto mb-3" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5.9C13.16 5.9 14.1 6.84 14.1 8C14.1 9.16 13.16 10.1 12 10.1C10.84 10.1 9.9 9.16 9.9 8C9.9 6.84 10.84 5.9 12 5.9ZM12 14.9C14.97 14.9 18.1 16.36 18.1 17V18.1H5.9V17C5.9 16.36 9.03 14.9 12 14.9ZM12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4ZM12 13C9.33 13 4 14.34 4 17V20H20V17C20 14.34 14.67 13 12 13Z" fill="#BFBFBF"/>
                      </svg>
                      没有找到匹配的运单
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ShipmentMap;