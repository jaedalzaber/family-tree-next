'use client';

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomNode from './CustomNode';
import { treeRootId, initialTree } from './initialElements';
import { layoutElements } from './layout-elements';

const nodeTypes = { custom: CustomNode };

export default function FamilyTreeFlow() {
  // Default layout: Top → Bottom
  const { nodes: initialNodes, edges: initialEdges } = layoutElements(initialTree, treeRootId, 'TB');

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, type: ConnectionLineType.Step, animated: true }, eds)
      ),
    []
  );

  const onLayout = useCallback(
    (direction) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = layoutElements(initialTree, treeRootId, direction);
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    []
  );

  return (
    <div className="w-full h-screen bg-gray-50 text-black">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.Step}
        fitView
      >
        <Panel position="top-right">
          <button
            className="px-3 py-1 mr-2 rounded bg-gray-800 text-white"
            onClick={() => onLayout('TB')}
          >
            Vertical Layout
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-800 text-white"
            onClick={() => onLayout('LR')}
          >
            Horizontal Layout
          </button>
        </Panel>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
