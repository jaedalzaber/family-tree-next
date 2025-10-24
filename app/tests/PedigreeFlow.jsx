import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import * as d3 from 'd3';
import $ from 'jquery'; // Add jQuery

// Set jQuery globally
window.jQuery = window.$ = $;

const loadPedigreeJS = () => {
  return import('./pedigree.js'); // Adjust path
};

const dataset = [
  { name: 'm21', display_name: 'Father', sex: 'M', top_level: true },
  { name: 'f21', display_name: 'Mother', sex: 'F', top_level: true },
  { name: 'ch1', display_name: 'Me', sex: 'F', mother: 'f21', father: 'm21', proband: true },
  { name: 'sib1', display_name: 'Sibling', sex: 'M', mother: 'f21', father: 'm21' },
  { name: 'spouse', display_name: 'Spouse', sex: 'M', noparents: true },
  { name: 'child1', display_name: 'Child', sex: 'F', mother: 'ch1', father: 'spouse' },
];

const PedigreeFlow = ({ dataset: inputDataset = dataset }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const containerRef = useRef(null);
  const [pedigreeInstance, setPedigreeInstance] = useState(null);

  useEffect(() => {
    const initPedigree = async () => {
      try {
        const { default: pedigreejs } = await loadPedigreeJS();
        console.log('jQuery available:', !!window.$); // Debug
        console.log('D3 available:', !!d3); // Debug

        const opts = {
          targetDiv: 'pedigree-hidden',
          btn_target: 'buttons-hidden',
          width: 800,
          height: 600,
          symbol_size: 35,
          store_type: 'array',
          diseases: [{ type: 'breast_cancer', colour: '#F68F35' }],
          labels: ['age', 'yob'],
          font_size: '.75em',
          font_family: 'Helvetica',
          font_weight: 700,
          DEBUG: false,
          dataset: inputDataset,
        };

        // Create hidden container
        const hiddenDiv = document.createElement('div');
        hiddenDiv.id = 'pedigree-hidden';
        hiddenDiv.style.position = 'absolute';
        hiddenDiv.style.left = '-9999px';
        hiddenDiv.style.top = '-9999px';
        hiddenDiv.style.width = '800px';
        hiddenDiv.style.height = '600px';
        containerRef.current.appendChild(hiddenDiv);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.id = 'buttons-hidden';
        hiddenDiv.appendChild(buttonsDiv);

        // Build pedigree
        const instance = pedigreejs.build(opts);

        // Extract nodes and edges
        const svg = d3.select('#pedigree-hidden svg');
        const diagram = svg.select('.diagram');
        const extractedNodes = [];
        const extractedEdges = [];

        diagram.selectAll('g.node').each(function (d) {
          const transform = d3.select(this).attr('transform');
          const match = /translate\(([^,]+), ([^)]+)\)/.exec(transform);
          if (match) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            extractedNodes.push({
              id: d.data.name,
              type: 'input',
              data: { label: d.data.display_name || d.data.name, sex: d.data.sex, ...d.data },
              position: { x, y },
              style: { width: 150, height: 50 },
            });
          }
        });

        diagram.selectAll('.link').each(function (d) {
          if (d.target && d.source) {
            extractedEdges.push({
              id: `edge-${d.source.data.name}-${d.target.data.name}`,
              source: d.source.data.name,
              target: d.target.data.name,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#000', strokeWidth: 2 },
            });
          }
        });

        diagram.selectAll('.partner').each(function (d) {
          if (d.mother && d.father) {
            extractedEdges.push({
              id: `spouse-${d.mother.data.name}-${d.father.data.name}`,
              source: d.mother.data.name,
              target: d.father.data.name,
              type: 'straight',
              style: { stroke: '#666', strokeWidth: 1, strokeDasharray: '5,5' },
            });
          }
        });

        setNodes(extractedNodes);
        setEdges(extractedEdges);
        setPedigreeInstance(instance);

        // Cleanup
        return () => containerRef.current?.removeChild(hiddenDiv);
      } catch (error) {
        console.error('PedigreeJS init failed:', error);
      }
    };

    initPedigree();
  }, [inputDataset]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: 600 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView attributionPosition="top-right">
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default PedigreeFlow;