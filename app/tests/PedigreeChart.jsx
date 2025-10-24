import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { computePedigreeLayout } from './pedigreeLayout'; // Your file
import PedigreeNode from './PedigreeNode'; // Custom node component
import ParentalEdge from './ParentalEdge'; // Custom edge component
import PartnerEdge from './PartnerEdge';   // Custom edge component

const PedigreeChart = ({ dataset }) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => computePedigreeLayout(dataset, { hSpacing: 100, vSpacing: 120 }),
    [dataset]
  );

  // Custom node types
  const nodeTypes = {
    pedigreeNode: PedigreeNode, // Implement: SVG square/circle based on sex, fill for disease
  };

  const edgeTypes = {
    parental: ParentalEdge, // Vertical line with horizontal bar for sibship
    partner: PartnerEdge,   // Horizontal line
    // consanguine: ConsanguineEdge, // Double line, routed around
  };

  return (
    <div style={{ height: 500, width: '100%' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        zoomOnScroll={false} // Optional: Disable zoom for fixed layout
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};



export default PedigreeChart;