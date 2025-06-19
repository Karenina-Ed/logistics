import React, { useRef, useState, useCallback, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Spin, Button, Input, notification, Modal } from 'antd';
import { SearchOutlined, ClearOutlined, RocketOutlined, PlusOutlined } from '@ant-design/icons';
import { gcj02ToWgs84, wgs84ToGcj02 } from '../utils/coordTransform';
import 'mapbox-gl/dist/mapbox-gl.css'

// --- 配置 ---
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const AMAP_TOKEN = import.meta.env.VITE_AMAP_KEY;
const OPTIMIZE_API = "/api/path/optimize_path";
const nameCache = new Map();

// --- 工具函数 ---
async function reverseGeocode(lat, lng) {
  const key = `${lat},${lng}`;
  if (nameCache.has(key)) return nameCache.get(key);
  
  try {
    const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
    const res = await axios.get("https://restapi.amap.com/v3/geocode/regeo", {
      params: { key: AMAP_TOKEN, location: `${gcjLng},${gcjLat}`, extensions: "all" },
    });
    
    if (res.data.status !== "1") throw new Error(res.data.info || "逆地理编码失败");
    
    const name = res.data.regeocode.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    nameCache.set(key, name);
    return name;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function searchAmap(keyword) {
  if (!keyword) return [];
  
  try {
    const res = await axios.get("https://restapi.amap.com/v3/assistant/inputtips", {
      params: { key: AMAP_TOKEN, keywords: keyword, datatype: "all" }
    });
    
    if (res.data.status !== "1") return [];
    
    return res.data.tips
      .filter(t => t.location)
      .map(t => {
        const [lng, lat] = t.location.split(",").map(Number);
        return { 
          place_name: t.name + (t.district ? ` (${t.district})` : ""), 
          center: [lng, lat] 
        };
      });
  } catch {
    return [];
  }
}

function splitLoopsIntoSegments(fullLoopPts, maxPoints = 16) {
  const segments = [];
  let i = 0;
  
  while (i < fullLoopPts.length - 1) {
    if (fullLoopPts.length - i <= maxPoints) {
      segments.push(fullLoopPts.slice(i));
      break;
    }
    
    const sliceEnd = i + maxPoints - 1;
    segments.push(fullLoopPts.slice(i, sliceEnd + 1));
    i = sliceEnd;
  }
  
  return segments;
}

async function fetchSegmentRoute(segmentPts) {
  if (!segmentPts || segmentPts.length < 2) return [];
  
  const origin = segmentPts[0].join(",");
  const destination = segmentPts[segmentPts.length - 1].join(",");
  const waypoints = segmentPts.length > 2 
    ? segmentPts.slice(1, -1).map(p => p.join(",")).join(";") 
    : "";
    
  const res = await axios.get("https://restapi.amap.com/v3/direction/driving", {
    params: { key: AMAP_TOKEN, origin, destination, waypoints, extensions: "all" },
  });
  
  if (res.data.status !== "1") throw new Error(res.data.info || "未知错误");
  
  const steps = res.data.route.paths[0].steps;
  let coords = [];
  
  for (const step of steps) {
    const pts = step.polyline.split(";").map(str => {
      const [lng, lat] = str.split(",").map(Number);
      return gcj02ToWgs84(lng, lat);
    });
    coords = coords.concat(pts);
  }
  
  return coords;
}

async function fetchFullRouteByChunks(segments) {
  const fullCoords = [];
  
  for (let idx = 0; idx < segments.length; idx++) {
    const segment = segments[idx];
    const segCoords = await fetchSegmentRoute(segment);
    
    if (segCoords.length === 0) continue;
    
    if (idx === 0) fullCoords.push(...segCoords);
    else fullCoords.push(...segCoords.slice(1));
  }
  
  return fullCoords;
}

// --- 主组件 ---
const MapboxTSP = ({ onRouteCalculated }) => {
  const mapRoot = useRef(null);
  const mapRef = useRef(null);

  const [loaded, setLoaded] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [nodeNames, setNodeNames] = useState([]);
  const [error, setError] = useState("");
  const [planning, setPlanning] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // 地图初始化
  useEffect(() => {
    if (mapRef.current) return;
    
    if (!MAPBOX_TOKEN) {
      setError("未配置Mapbox访问令牌");
      return;
    }
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const map = new mapboxgl.Map({
      container: mapRoot.current,
      style: "mapbox://styles/yejiangtao/cmc0fwndc001g01sk5svsadei",
      center: [120.1551, 30.2741],
      zoom: 10,
      attributionControl: false
    });
    
    mapRef.current = map;

    map.on("load", () => {
      setLoaded(true);
      
      map.addControl(new mapboxgl.NavigationControl());
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.addControl(new mapboxgl.ScaleControl({ maxWidth: 80, unit: "metric" }), "bottom-left");
      
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true
        }),
        "top-right"
      );
    });
    
    map.on("error", e => setError(e.error?.message || "地图错误"));
    
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 渲染节点
  const renderMapNodes = useCallback(
    (nodes) => {
      if (!mapRef.current) return;
      
      const map = mapRef.current;
      const layerId = "nodes";
      
      const nodesData = {
        type: "FeatureCollection",
        features: nodes.map((n, i) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [n[1], n[0]] },
          properties: { id: i + 1 }
        }))
      };
      
      if (map.getSource("nodes")) {
        map.getSource("nodes").setData(nodesData);
      } else {
        map.addSource("nodes", { type: "geojson", data: nodesData });
        
        map.addLayer({
          id: layerId,
          type: "circle",
          source: "nodes",
          paint: {
            "circle-radius": 8,
            "circle-color": "#000FFF",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff"
          }
        });
        
        map.addLayer({
          id: "labels",
          type: "symbol",
          source: "nodes",
          layout: {
            "text-field": ["get", "id"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 14,
            "text-offset": [0, 1.5]
          },
          paint: {
            "text-color": "#fff",
            "text-halo-color": "#000",
            "text-halo-width": 0.8
          }
        });
      }
      
      if (map.__popupEventBound) return;
      map.__popupEventBound = true;
      
      map.on("mouseenter", layerId, (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features[0];
        const idx = feature.properties.id - 1;
        const coord = feature.geometry.coordinates;
        
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 24
        })
          .setLngLat(coord)
          .setHTML(`
            <div class="p-2 bg-white rounded-md shadow-lg">
              <div class="font-bold text-gray-700">${nodeNames[idx] || "位置名称"}</div>
              <div class="text-sm">
                <span class="text-gray-500">经度:</span> ${coord[0].toFixed(6)}<br>
                <span class="text-gray-500">纬度:</span> ${coord[1].toFixed(6)}
              </div>
            </div>
          `)
          .addTo(map);
      });
      
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
        document.querySelectorAll(".mapboxgl-popup").forEach(el => el.remove());
      });
    },
    [nodeNames]
  );

  // 渲染路线
  const renderRouteLine = useCallback(
    (coords) => {
      if (!mapRef.current) return;
      
      const map = mapRef.current;
      
      const routeGeoJSON = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords }
      };
      
      if (map.getLayer("line-background")) map.removeLayer("line-background");
      if (map.getLayer("line-dashed")) map.removeLayer("line-dashed");
      if (map.getSource("driving-route")) map.removeSource("driving-route");
      
      map.addSource("driving-route", { type: "geojson", data: routeGeoJSON });
      
      map.addLayer({
        id: "line-background",
        type: "line",
        source: "driving-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#3871c1",
          "line-width": 5,
          "line-opacity": 0.7
        }
      });
      
      map.addLayer({
        id: "line-dashed",
        type: "line",
        source: "driving-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#1a73e8",
          "line-dasharray": [2, 2],
          "line-width": 3
        }
      });
      
      // 自动适配视图到路线
      const bounds = coords.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
      
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        duration: 2000
      });
      
      // 计算总距离和总时间（简化的估算）
      const distance = coords.reduce((sum, coord, i, arr) => {
        if (i === 0) return 0;
        const prev = arr[i - 1];
        const dx = coord[0] - prev[0];
        const dy = coord[1] - prev[1];
        return sum + Math.sqrt(dx * dx + dy * dy);
      }, 0);
      
      setTotalDistance(parseFloat((distance * 100).toFixed(1))); // 假设1度≈111km
      setTotalTime(parseFloat((distance * 200).toFixed(0))); // 假设速度平均40km/h
      
      // 通知父组件路线已计算
      if (onRouteCalculated) {
        onRouteCalculated({
          nodes: nodes.map((node, i) => ({
            position: node,
            name: nodeNames[i],
            sequence: i + 1
          })),
          distance: parseFloat((distance * 100).toFixed(1)),
          time: parseFloat((distance * 200).toFixed(0)),
          path: coords
        });
      }
    },
    [nodes, nodeNames, onRouteCalculated]
  );

  // 更新节点名称
  const updateNodeNames = useCallback(
    async (nextNodes) => {
      try {
        const names = await Promise.all(
          nextNodes.map(([lat, lng]) => reverseGeocode(lat, lng))
        );
        setNodeNames(names);
      } catch (err) {
        console.error("节点名称更新失败:", err);
        setNodeNames(
          nextNodes.map(
            (_, i) => `节点 ${i + 1} [${nextNodes[i][0].toFixed(4)}, ${nextNodes[i][1].toFixed(4)}]`
          )
        );
      }
    },
    []
  );

  // 添加节点
  const handleAddNode = useCallback(
    async ([lat, lng]) => {
      const nextNodes = [...nodes, [lat, lng]];
      setNodes(nextNodes);
      await updateNodeNames(nextNodes);
      renderMapNodes(nextNodes);
    },
    [nodes, updateNodeNames, renderMapNodes]
  );

  // 删除节点
  const handleDeleteNode = useCallback(
    (idx) => {
      const nextNodes = nodes.filter((_, i) => i !== idx);
      setNodes(nextNodes);
      updateNodeNames(nextNodes);
      renderMapNodes(nextNodes);
      
      if (mapRef.current) {
        if (mapRef.current.getLayer("line-background")) {
          mapRef.current.removeLayer("line-background");
        }
        if (mapRef.current.getLayer("line-dashed")) {
          mapRef.current.removeLayer("line-dashed");
        }
        if (mapRef.current.getSource("driving-route")) {
          mapRef.current.removeSource("driving-route");
        }
      }
      
      setTotalDistance(0);
      setTotalTime(0);
    },
    [nodes, updateNodeNames, renderMapNodes]
  );

  // 优化路径
  const handleOptimizeAndPlanRoute = useCallback(async () => {
    if (nodes.length < 2) {
      setError("至少需要2个节点才能进行路径规划");
      return;
    }
    
    setPlanning(true);
    setError("");
    
    try {
      console.log("开始路径规划，节点:", nodes);
      // 1. 调用优化API
      const ptsGCJ = nodes.map(([lat, lng]) => wgs84ToGcj02(lng, lat));
      const { data } = await axios.post(OPTIMIZE_API, {
          xy: ptsGCJ, temperature: 1.0, sample: false
      });
      const tour = data.tour;
      const sortedNodes = tour.map(i => nodes[i]);
      console.log("优化后的节点顺序:", sortedNodes);
      // 处理节点名称
        
      
      // 2. 更新节点顺序
      setNodes(sortedNodes);
      await updateNodeNames(sortedNodes);
      renderMapNodes(sortedNodes);
      
      // 3. 渲染路径
      const currentNodes = sortedNodes.map(([lat, lng]) => wgs84ToGcj02(lng, lat));
      const loopPts = [...currentNodes, currentNodes[0]];
      const segments = splitLoopsIntoSegments(loopPts, 16);
      const path = await fetchFullRouteByChunks(segments);
      renderRouteLine(path);
      
      // 显示成功消息
      notification.success({
        message: '路径规划完成',
        description: `成功规划了一条包含${nodes.length}个节点的配送路线`,
      });
    } catch (err) {
      console.error("路径规划失败:", err);
      setError("路径规划失败: " + (err.message || "服务器错误"));
      notification.error({
        message: '路径规划失败',
        description: err.message || "服务器响应异常",
      });
    } finally {
      setPlanning(false);
    }
  }, [nodes, updateNodeNames, renderMapNodes, renderRouteLine]);

  // 拖拽排序
  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      
      const reordered = [...nodes];
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);
      
      setNodes(reordered);
      updateNodeNames(reordered);
      renderMapNodes(reordered);
      
      // 重新渲染路径
      if (reordered.length > 1) {
        fetchSegmentRoute(
          reordered.map(node => [node[0], node[1]])
        ).then(path => renderRouteLine(path));
      }
    },
    [nodes, updateNodeNames, renderMapNodes, renderRouteLine]
  );

  // 清除所有节点
  const handleClearNodes = useCallback(() => {
    setNodes([]);
    setNodeNames([]);
    setTotalDistance(0);
    setTotalTime(0);
    
    if (mapRef.current) {
      if (mapRef.current.getSource("nodes")) {
        mapRef.current.getSource("nodes").setData({
          type: "FeatureCollection",
          features: []
        });
      }
      
      if (mapRef.current.getLayer("line-background")) {
        mapRef.current.removeLayer("line-background");
      }
      if (mapRef.current.getLayer("line-dashed")) {
        mapRef.current.removeLayer("line-dashed");
      }
      if (mapRef.current.getSource("driving-route")) {
        mapRef.current.removeSource("driving-route");
      }
      
      // 重置视图
      mapRef.current.flyTo({
        center: [120.1551, 30.2741],
        zoom: 10,
        duration: 2000
      });
    }
  }, []);

  // 搜索处理
  const handleSearchInput = useCallback(
    async (e) => {
      const value = e.target.value;
      setSearchVal(value);
      setSearchLoading(true);
      setSearchResults([]);
      
      if (value) {
        const list = await searchAmap(value);
        setSearchResults(list);
      }
      
      setSearchLoading(false);
    },
    []
  );

  const handleSelectSearchResult = useCallback(
    async (item) => {
      setSearchVal("");
      setSearchResults([]);
      await handleAddNode([item.center[1], item.center[0]]);
      
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: item.center,
          zoom: 12,
          duration: 1500
        });
      }
    },
    [handleAddNode]
  );

  // 地图交互
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    
    const map = mapRef.current;
    
    const onMapClick = (e) => handleAddNode([e.lngLat.lat, e.lngLat.lng]);
    map.on("click", onMapClick);
    
    const onMapContextMenu = (e) => {
      // 禁用右键菜单
      e.preventDefault();
      
      // 检查是否点击了节点
      const features = map.queryRenderedFeatures(e.point, { layers: ["nodes"] });
      if (features.length > 0) {
        const idToRemove = features[0].properties.id - 1;
        handleDeleteNode(idToRemove);
      }
    };
    
    map.on("contextmenu", onMapContextMenu);
    
    return () => {
      map.off("click", onMapClick);
      map.off("contextmenu", onMapContextMenu);
    };
  }, [loaded, handleAddNode, handleDeleteNode]);

  return (
    <div className="h-full relative">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-600 text-white p-3 rounded shadow-xl min-w-60 text-center">
            {error}
          </div>
        </div>
      )}
      
      <div className="h-full w-full" ref={mapRoot} />
      
      {/* 左上角搜索框 */}
      <div className="absolute left-4 top-4 w-80 z-50">
        <div className="relative bg-white rounded-lg shadow-lg p-2">
          <Input
            prefix={<SearchOutlined />}
            value={searchVal}
            onChange={handleSearchInput}
            placeholder="搜索地点或输入地址"
            size="large"
          />
          
          {searchLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
              <Spin tip="搜索中..." />
            </div>
          )}
          
          {searchResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white rounded-lg shadow-lg mt-1 border border-gray-200 max-h-60 overflow-auto">
              {searchResults.map((r, i) => (
                <li
                  key={i}
                  className="p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-800 cursor-pointer text-sm"
                  onClick={() => handleSelectSearchResult(r)}
                >
                  {r.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* 控制按钮 */}
        <div className="mt-4 flex space-x-2">
          <Button 
            type="primary" 
            icon={<RocketOutlined />}
            onClick={handleOptimizeAndPlanRoute}
            loading={planning}
            disabled={nodes.length < 2}
            className="w-full"
          >
            计算最佳路线
          </Button>
          
          <Button 
            type="default" 
            icon={<ClearOutlined />}
            onClick={handleClearNodes}
            disabled={nodes.length === 0}
            className="w-full"
          >
            清除所有点
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapboxTSP;