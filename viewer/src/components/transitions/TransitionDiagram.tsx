'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TransitionsData } from '@/types/design';

interface TransitionDiagramProps {
  data: TransitionsData;
  siteId: string;
}

export default function TransitionDiagram({
  data,
  siteId,
}: TransitionDiagramProps) {
  const router = useRouter();

  // ノードをReact Flow形式に変換
  const initialNodes: Node[] = useMemo(() => {
    return data.nodes.map((node, index) => {
      const isShared = node.screenId.startsWith('_shared/');
      return {
        id: node.id,
        type: 'default',
        position: { x: 150 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
        data: {
          label: (
            <div className="text-center">
              <div className="font-semibold">{node.label}</div>
              <div className="text-xs text-slate-500">
                {isShared ? '共通部品' : node.screenId}
              </div>
            </div>
          ),
          screenId: node.screenId,
          isShared,
        },
        style: {
          background: isShared ? '#e0e7ff' : '#f8fafc',
          border: isShared ? '2px solid #6366f1' : '2px solid #475569',
          borderRadius: '8px',
          padding: '10px 20px',
          minWidth: '120px',
          cursor: isShared ? 'default' : 'pointer',
        },
      };
    });
  }, [data.nodes]);

  // エッジをReact Flow形式に変換
  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: edge.isExternal,
      style: {
        stroke: edge.isExternal ? '#94a3b8' : '#475569',
        strokeDasharray: edge.isExternal ? '5,5' : 'none',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.isExternal ? '#94a3b8' : '#475569',
      },
      labelStyle: {
        fill: '#64748b',
        fontSize: 11,
      },
      labelBgStyle: {
        fill: '#f8fafc',
      },
    }));
  }, [data.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // 共通部品ノードはクリックイベントを無視
      if (node.data.isShared) return;

      const screenId = node.data.screenId as string;
      router.push(`/screens/${siteId}/${screenId}`);
    },
    [router, siteId]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
