import React from 'react';

// ParentalEdge component for React Flow pedigree chart
const ParentalEdge = ({ id, sourceX, sourceY, targetX, targetY, data, nodes }) => {
  // Extract role (mother/father) from edge data
  const { role } = data || {};

  // Safely extract child ID from edge ID (format: m-childId or f-childId)
  const idParts = id.split('-');
  const childId = idParts.length > 1 ? idParts[1] : null;

  // Find the child node
  let childNode = null;
  if (childId && Array.isArray(nodes)) {
    childNode = nodes.find(node => node.id === childId);
  }
  const childY = childNode?.position?.y || targetY;

  // Find siblings (other nodes with same parents) to determine sibship bar
  const childData = childNode?.data || {};
  const motherId = childData.mother;
  const fatherId = childData.father;
  const siblings = Array.isArray(nodes)
    ? nodes.filter(
        node =>
          node.id !== childId &&
          node.data.mother === motherId &&
          node.data.father === fatherId
      )
    : [];

  // Calculate sibship bar coordinates
  const sibshipY = childY - 20; // Slightly above child for bar
  let sibshipStartX = targetX;
  let sibshipEndX = targetX;
  if (siblings.length > 0) {
    // Include all siblings for bar width
    const allChildrenX = [
      targetX,
      ...siblings.map(sib => sib.position?.x || targetX)
    ].sort((a, b) => a - b);
    sibshipStartX = allChildrenX[0];
    sibshipEndX = allChildrenX[allChildrenX.length - 1];
  }

  // Define path: vertical from parent to sibship bar, then to child
  const path = `
    M ${sourceX},${sourceY} 
    L ${sourceX},${sibshipY} 
    ${siblings.length > 0 ? `M ${sibshipStartX},${sibshipY} L ${sibshipEndX},${sibshipY}` : ''} 
    M ${targetX},${sibshipY} 
    L ${targetX},${targetY}
  `.trim();

  // Optional debug logging (comment out in production)
  // if (!childNode) console.warn(`Child node not found for edge ID: ${id}`);
  // if (!Array.isArray(nodes)) console.warn(`Nodes is not an array for edge ID: ${id}`);

  return (
    <g>
      <path
        d={path}
        stroke="#000"
        strokeWidth={1}
        fill="none"
      />
    </g>
  );
};

export default ParentalEdge;