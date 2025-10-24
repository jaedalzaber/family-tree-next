/**
 * Computes pedigree layout for React Flow.
 * @param {Array<Object>} dataset - PedigreeJS-style array of individuals.
 * @param {Object} config - Layout config: { nodeWidth: 50, nodeHeight: 50, hSpacing: 80, vSpacing: 100, startX: 50, startY: 50 }.
 * @returns {Object} { nodes: Array, edges: Array } - React Flow elements.
 */
export function computePedigreeLayout(dataset, config = {}) {
  const {
    nodeWidth = 50,
    nodeHeight = 50,
    hSpacing = 80,  // Horizontal spacing between siblings/partners
    vSpacing = 100, // Vertical spacing between generations
    startX = 50,
    startY = 50
  } = config;

  // Step 1: Build graph adjacency list for traversal (children from parents)
  const childrenMap = new Map();
  const parentsMap = new Map(); // For quick lookups
  const individuals = new Map();
  dataset.forEach(ind => {
    const id = ind.name;
    individuals.set(id, { ...ind, children: [] });
    if (ind.mother) parentsMap.set(id, ind.mother);
    if (ind.father) parentsMap.set(id, ind.father);
    if (!ind.top_level) {
      // Infer partners later; for now, collect children
    }
  });

  // Build children lists
  individuals.forEach((ind, id) => {
    if (!childrenMap.has(id)) childrenMap.set(id, []);
  });
  dataset.forEach(ind => {
    if (ind.mother) {
      childrenMap.get(ind.mother).push(ind.name);
    }
    if (ind.father) {
      childrenMap.get(ind.father).push(ind.name);
    }
  });

  // Step 2: Assign generations (BFS from top_level, handling disconnected components)
  const generation = new Map();
  const queue = [];
  dataset.filter(ind => ind.top_level).forEach(ind => {
    const id = ind.name;
    generation.set(id, 0);
    queue.push(id);
  });

  while (queue.length > 0) {
    const parentId = queue.shift();
    const parentGen = generation.get(parentId);
    const parentChildren = childrenMap.get(parentId) || [];
    parentChildren.forEach(childId => {
      if (!generation.has(childId)) {
        generation.set(childId, parentGen + 1);
        queue.push(childId);
      }
    });
  }

  // Handle disconnected (warn in production)
  individuals.forEach((_, id) => {
    if (!generation.has(id)) {
      console.warn(`Disconnected individual: ${id}`);
      generation.set(id, 0); // Place at top
    }
  });

  // Step 3: Group nuclear families (unique parent pairs for siblings)
  const nuclearFamilies = new Map(); // gen -> List of { parents: [father?, mother?], children: [] }
  individuals.forEach(ind => {
    const id = ind.name;
    const gen = generation.get(id);
    if (ind.top_level) {
      // Top-level: Treat as potential partners; group by inferred couples
      // Simple heuristic: Group top-level if they share children (refine for complex cases)
    } else {
      const mom = ind.mother;
      const dad = ind.father;
      const key = `${mom || ''}-${dad || ''}`; // Unique nuclear key
      if (!nuclearFamilies.has(gen)) nuclearFamilies.set(gen, []);
      let family = nuclearFamilies.get(gen).find(f => f.key === key);
      if (!family) {
        family = { key, parents: [dad, mom].filter(Boolean), children: [] };
        nuclearFamilies.get(gen).push(family);
      }
      if (!family.children.includes(id)) family.children.push(id);
    }
  });

  // Step 4: Compute positions horizontally per generation
  const positions = new Map(); // id -> {x, y}
  let currentX = startX;

  // Process generations from 0 to max
  const maxGen = Math.max(...Array.from(generation.values()));
  for (let g = 0; g <= maxGen; g++) {
    const families = nuclearFamilies.get(g) || [];
    let genX = startX; // Reset X per generation for left-align, or center globally

    families.forEach(family => {
      // Position parents (if any)
      const numParents = family.parents.length;
      if (numParents > 0) {
        // Place male left, female right (convention)
        let parentX = genX;
        family.parents.forEach((parentId, i) => {
          if (parentId) {
            positions.set(parentId, { x: parentX, y: startY + g * vSpacing });
            parentX += hSpacing;
          }
        });
        // Center children under parent midpoint
        const parentMidX = genX + (numParents * hSpacing / 2);
        genX = parentMidX + (hSpacing / 2); // Advance for next family
      }

      // Position children (siblings)
      const numChildren = family.children.length;
      if (numChildren > 0) {
        const childY = startY + (g + 1) * vSpacing;
        const childStartX = genX - ((numChildren - 1) * hSpacing / 2); // Center under parents
        family.children.forEach((childId, i) => {
          positions.set(childId, { x: childStartX + i * hSpacing, y: childY });
        });
        genX += numChildren * hSpacing + hSpacing; // Advance for next
      }
    });

    // Update global currentX for centering if needed
    currentX = Math.max(currentX, genX + startX);
  }

  // Step 5: Infer and build edges
  const edges = [];
  // Parental edges
  dataset.forEach(ind => {
    if (ind.mother) {
      edges.push({
        id: `m-${ind.name}`,
        source: ind.mother,
        target: ind.name,
        type: 'parental', // Custom React Flow edge type for vertical drop lines
        data: { role: 'mother' }
      });
    }
    if (ind.father) {
      edges.push({
        id: `f-${ind.name}`,
        source: ind.father,
        target: ind.name,
        type: 'parental',
        data: { role: 'father' }
      });
    }
  });

  // Partner edges (horizontal between spouses; infer from shared children)
  const partners = new Set();
  dataset.forEach(ind => {
    if (ind.mother && ind.father && !partners.has(`${ind.mother}-${ind.father}`)) {
      partners.add(`${ind.mother}-${ind.father}`);
      partners.add(`${ind.father}-${ind.mother}`);
      edges.push({
        id: `p-${ind.mother}-${ind.father}`,
        source: Math.min(ind.mother, ind.father), // Arbitrary ordering
        target: Math.max(ind.mother, ind.father),
        type: 'partner', // Horizontal line
        data: { type: 'spouse' }
      });
    }
  });

  // Consanguinity: Placeholder; in full impl, add from dataset if flagged (e.g., ind.consanguineWith)

  // Step 6: Build nodes
  const nodes = Array.from(individuals.values()).map(ind => ({
    id: ind.name,
    position: positions.get(ind.name),
    data: {
      label: ind.name,
      sex: ind.sex,
      proband: ind.proband || false,
      disease: Object.keys(ind).filter(k => k.endsWith('_cancer') && ind[k]).join(', '), // e.g., 'breast'
      // Add more: age, yob, etc.
    },
    type: 'pedigreeNode', // Custom node for symbols (square/circle + shading)
    style: { width: nodeWidth, height: nodeHeight }
  }));

  return { nodes, edges };
}