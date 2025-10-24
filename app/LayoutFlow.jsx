import React, { useCallback, useState, useEffect } from "react";
import {
  Background,
  ReactFlow,
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SmartStepEdge } from "@tisoap/react-flow-smart-edge";

import CustomNode from "./CustomNode";
import { initialTree, treeRootId } from "./initialElements";
import { layoutElements } from "./layout-elements";

const LayoutFlow = () => {
  const [tree, setTree] = useState(initialTree);
  const [rootId, setRootId] = useState(treeRootId);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes/edges whenever tree changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = layoutElements(
      tree,
      rootId,
      "TB"
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [tree, rootId]);

  // Smart edge type for spouses
  const edgeTypes = {
    smart: (props) => (
      <SmartStepEdge
        {...props}
        style={{ strokeWidth: 2, stroke: "#555" }}
        options={{
          padding: 40,
          nodePadding: 50,
          gridRatio: 4,
          lineBend: 0.2,
        }}
      />
    ),
  };

  const nodeTypes = {
    custom: (props) => (
      <CustomNode
        {...props}
        addParent={addParent}
        addChild={addChild}
        addSpouse={addSpouse}
      />
    ),
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: "smart" }, eds)),
    []
  );

  /** Dynamic tree update functions **/
  const addParent = (nodeId) => {
    setTree((prev) => {
      const fId = `f${Date.now()}`;
      const mId = `m${Date.now()}`;
      const newTree = { ...prev };

      newTree[fId] = {
        id: fId,
        name: "New Father",
        children: [nodeId],
        spouses: [mId],
      };
      newTree[nodeId] = {
        ...newTree[nodeId],
        parents: [fId, mId],
      };
      newTree[mId] = {
        id: mId,
        name: "New Mother",
        isSpouse: true,
        children: [nodeId],
      };

      setRootId(fId);

      return newTree;
    });
  };

  const addChild = (nodeId) => {
    setTree((prev) => {
      const newId = `c${Date.now()}`;
      const newTree = { ...prev };
      if (newTree[nodeId].isSpouse) {
        const partner = Object.values(newTree).find((n) =>
          (n.spouses || []).includes(nodeId)
        );
        const partnerId = partner ? partner.id : null;

        newTree[newId] = {
          id: newId,
          name: "New Child",
          parents: [partnerId, nodeId],
        };

        if (partnerId) {
          newTree[partnerId] = {
            ...newTree[partnerId],
            children: [...(newTree[partnerId].children || []), newId],
          };
        }

        newTree[nodeId] = {
          ...newTree[nodeId],
          children: [...(newTree[nodeId].children || []), newId],
        };
      } else {
        let motherId = newTree[nodeId].spouses
          ? newTree[nodeId].spouses[0]
          : null;
        if (motherId === null) {
          motherId = `m${Date.now()}`;
          newTree[motherId] = {
            id: motherId,
            name: "New Mother",
            isSpouse: true,
            children: [newId],
          };
          newTree[nodeId] = {
            ...newTree[nodeId],
            spouses: [motherId],
          };
        }
        newTree[newId] = {
          id: newId,
          name: "New Child",
          parents: [nodeId, motherId],
        };
        newTree[nodeId] = {
          ...newTree[nodeId],
          children: [...(newTree[nodeId].children || []), newId],
        };
        newTree[motherId] = {
          ...newTree[motherId],
          children: [...(newTree[motherId].children || []), newId],
        };
      }
      return newTree;
    });
  };

  const addSpouse = (nodeId) => {
    setTree((prev) => {
      console.log("add spouse");

      const newId = `s${Date.now()}`;
      const newTree = { ...prev };
      newTree[newId] = { id: newId, name: "New Spouse", isSpouse: true };
      newTree[nodeId] = {
        ...newTree[nodeId],
        spouses: [...(newTree[nodeId].spouses || []), newId],
      };
      return newTree;
    });
  };

  return (
    <div className="text-black" style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default LayoutFlow;
