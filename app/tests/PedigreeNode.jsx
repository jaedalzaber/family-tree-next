import React from 'react';
import { Handle, Position } from 'reactflow';

// Custom PedigreeNode component for React Flow
const PedigreeNode = ({ data }) => {
  // Extract node properties
  const { label, sex, disease, proband } = data;

  // SVG dimensions and styling
  const size = 30; // Width/height of the shape
  const strokeWidth = 2;
  const isMale = sex === 'M';
  const hasDisease = !!disease;
  const isProband = proband;

  // Shape style
  const shapeStyle = {
    stroke: '#000',
    strokeWidth,
    fill: hasDisease ? '#000' : 'none', // Black fill for disease, none otherwise
  };

  // Highlight proband with a thicker border or color
  const probandStyle = isProband ? { stroke: '#FF0000', strokeWidth: 3 } : {};

  return (
    <div className="flex flex-col items-center">
      {/* Handles for edges: top for parents, bottom for children */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={false}
      />

      {/* SVG for pedigree symbol */}
      <svg width={size + strokeWidth} height={size + strokeWidth}>
        {isMale ? (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={size}
            height={size}
            {...shapeStyle}
            {...probandStyle}
          />
        ) : (
          <circle
            cx={size / 2 + strokeWidth / 2}
            cy={size / 2 + strokeWidth / 2}
            r={size / 2}
            {...shapeStyle}
            {...probandStyle}
          />
        )}
      </svg>

      {/* Label below the shape */}
      <div className="mt-1 text-xs text-center font-sans text-gray-800">
        {label}
        {hasDisease && (
          <div className="text-[10px] text-red-600">
            {disease}
          </div>
        )}
      </div>
    </div>
  );
};

export default PedigreeNode;