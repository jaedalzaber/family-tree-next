import React from 'react';

// PartnerEdge component for React Flow pedigree chart
const PartnerEdge = ({ id, sourceX, sourceY, targetX, targetY, data, nodes }) => {
  // Extract edge data
  const { type } = data || {};

  // Find source and target nodes to check for consanguinity
  const sourceNode = nodes.find(node => node.id === id.split('-')[1]);
  const targetNode = nodes.find(node => node.id === id.split('-')[2]);
  const isConsanguineous = sourceNode?.data?.consanguineWith?.includes(targetNode?.id) ||
                          targetNode?.data?.consanguineWith?.includes(sourceNode?.id);

  // Define paths
  const singleLinePath = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  const doubleLineOffset = 4; // Vertical offset for double line
  const doubleLinePath1 = `M ${sourceX},${sourceY - doubleLineOffset/2} L ${targetX},${targetY - doubleLineOffset/2}`;
  const doubleLinePath2 = `M ${sourceX},${sourceY + doubleLineOffset/2} L ${targetX},${targetY + doubleLineOffset/2}`;

  return (
    <g>
      {isConsanguineous ? (
        <>
          <path
            d={doubleLinePath1}
            stroke="#000"
            strokeWidth={1}
            fill="none"
          />
          <path
            d={doubleLinePath2}
            stroke="#000"
            strokeWidth={1}
            fill="none"
          />
        </>
      ) : (
        <path
          d={singleLinePath}
          stroke="#000"
          strokeWidth={2}
          fill="none"
        />
      )}
    </g>
  );
};

export default PartnerEdge;