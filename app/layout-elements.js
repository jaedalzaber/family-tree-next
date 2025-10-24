import { Position } from '@xyflow/react';
import { layoutFromMap } from 'entitree-flex';

const nodeWidth = 150;
const nodeHeight = 60;

const Orientation = {
  Vertical: 'vertical',
  Horizontal: 'horizontal',
};

const entitreeSettings = {
  clone: true,
  enableFlex: true,
  firstDegreeSpacing: 100,
  nextAfterAccessor: 'spouses',
  nextAfterSpacing: 60,
  nextBeforeAccessor: 'siblings',
  nextBeforeSpacing: 100,
  nodeHeight,
  nodeWidth,
  orientation: Orientation.Vertical,
  rootX: 0,
  rootY: 0,
  secondDegreeSpacing: 100,
  sourcesAccessor: 'parents',
  sourceTargetSpacing: 100,
  targetsAccessor: 'children',
};

const { Top, Bottom, Left, Right } = Position;

/**
 * Reorders children of each node based on spouse order.
 */
function reorderChildren(tree) {
  const newTree = structuredClone(tree);

  Object.values(newTree).forEach((node) => {
    if (!node.children || !Array.isArray(node.children)) return;

    if (node.spouses && node.spouses.length > 0) {
      const spouseOrder = node.spouses;
      const children = [...node.children];

      const childrenNoMother = [];
      const childrenBySpouse = [];

      children.forEach((childId) => {
        const child = newTree[childId];
        if (!child || !child.parents) return;

        const spouseIndex = spouseOrder.findIndex((p) =>
          p == child.parents[1]
        );

        if (spouseIndex === -1) {
          childrenNoMother.push(childId);
        } else {
          if (!childrenBySpouse[spouseIndex]) {
            childrenBySpouse[spouseIndex] = [];
          }
          childrenBySpouse[spouseIndex].push(childId);
        }
      });

      node.children = [
        ...childrenNoMother,
        ...childrenBySpouse.flat(),
      ];
    }
  });

  return newTree;
}


export const layoutElements = (tree, rootId, direction = 'TB') => {
  const processedTree = reorderChildren(tree);

  const { nodes: entitreeNodes, rels: entitreeEdges } = layoutFromMap(
    rootId,
    processedTree,
    {
      ...entitreeSettings,
      orientation: Orientation.Vertical,
    }
  );

  const nodes = [];
  const edges = [];

  // 1️⃣ Spouse edges → smart edges
  entitreeEdges.forEach((edge) => {
    const sourceNode = edge.source.id;
    const targetNode = edge.target.id;

    const isTargetSpouse = !!edge.target.isSpouse;

    if (isTargetSpouse) {
      const newEdge = {
        id: `e${sourceNode}-${targetNode}`,
        source: sourceNode,
        target: targetNode,
        type: 'smart', // ✅ use smart edge only for spouses
        sourceHandle: `spouse-${targetNode}`,
        targetHandle: `target-${Left}`,
      };

      if (!edges.some((e) => e.id === newEdge.id)) {
        edges.push(newEdge);
      }
    }
  });

  // 2️⃣ Parent–child edges → normal step edges
  Object.entries(processedTree).forEach(([nodeId, node]) => {
    if (node.children) {
      node.children.forEach((childId) => {
        const childEdge = {
          id: `e${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          type: 'step', // normal edges stay step
          sourceHandle: `children-${Bottom}`,
          targetHandle: `target-${Top}`,
        };

        if (!edges.some((e) => e.id === childEdge.id)) {
          edges.push(childEdge);
        }
      });
    }
  });

  // 3️⃣ Create nodes for React Flow
  entitreeNodes.forEach((node) => {
    const isSpouse = !!node?.isSpouse;
    const isSibling = !!node?.isSibling;
    const isJunction = !!node?.isJunction;
    const isRoot = node?.id === rootId;

    let posX = node.x;
    let posY = node.y;

    if (isJunction) {
      posX += nodeWidth / 2 - 11;
      posY += nodeHeight / 2 - 11;
    }

    // Offset spouse nodes slightly below
    if (isSpouse) posY += .1;

    const newNode = {
      id: node.id,
      type: 'custom',
      data: { label: node.name, direction, isRoot, ...node },
      position: { x: posX, y: posY },
      width: isJunction ? 11 : nodeWidth,
      height: isJunction ? 11 : nodeHeight,
      draggable: false
    };

    if (isSpouse) {
      newNode.sourcePosition = Right;
      newNode.targetPosition = Left;
    } else if (isSibling) {
      newNode.sourcePosition = Left;
      newNode.targetPosition = Right;
    } else if (!isJunction) {
      newNode.sourcePosition = Bottom;
      newNode.targetPosition = Top;
    }

    nodes.push(newNode);
  });

  console.log('Nodes:', nodes);
  console.log('Edges:', edges);

  return { nodes, edges };
};
