import { XMLParser } from 'fast-xml-parser';

const makeNodeId = (path) => path.join('__');

const truncate = (str, maxLength = 35) => {
  if (typeof str !== 'string' || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

export const xmlToGraph = (xmlString) => {
  if (!xmlString) return { nodes: [], edges: [] };

  const parser = new XMLParser({ 
    ignoreAttributes: false, 
    attributeNamePrefix: '@_',
    parseTagValue: false, // Keep values as strings
    trimValues: true,
  });
  const jsonObj = parser.parse(xmlString);

  const rootKey = Object.keys(jsonObj)[0];
  const rootObj = jsonObj[rootKey];

  const nodes = [];
  const edges = [];

  function walk(obj, key, path, siblingIdx, parentId) {
    const id = makeNodeId([...path, key + `[${siblingIdx}]`]);

    const xmlAttributes = Object.entries(obj)
      .filter(([k]) => k.startsWith('@_'))
      .map(([k, v]) => ({ key: `$${k.substring(2)}`, value: String(v) }));

    const textContent = obj['#text'] ? [{ key: '#text', value: String(obj['#text']) }] : [];

    const children = Object.entries(obj)
      .filter(([k, v]) => !k.startsWith('@_') && k !== '#text' && v && typeof v === 'object');

    const nodeData = {
      label: key,
      attributes: [],
      leafValues: [...xmlAttributes, ...textContent].map(item => ({...item, value: truncate(item.value)})),
    };

    const node = {
      id,
      data: nodeData,
      type: 'attributeNode',
      position: { x: 0, y: 0 }, // Will be set by layout
    };
    nodes.push(node);

    if (parentId) {
      edges.push({ 
        id: `e-${parentId}-${id}`,
        source: parentId, 
        target: id, 
        type: 'smoothstep',
        style: { stroke: '#888', strokeWidth: 1.5 },
        data: { borderRadius: 15 },
      });
    }

    const groupedChildren = children.reduce((acc, [key, value]) => {
      if (!acc[key]) acc[key] = [];
      if (Array.isArray(value)) acc[key].push(...value);
      else acc[key].push(value);
      return acc;
    }, {});

    Object.entries(groupedChildren).forEach(([childKey, childItems]) => {
      if (childItems.length > 1) { // Group any repeating tags
        const groupNodeId = makeNodeId([...path, key + `[${siblingIdx}]`, childKey + `[group]`]);
        const allLeafValues = childItems.flatMap(item => {
          const xmlAttrs = Object.entries(item).filter(([k]) => k.startsWith('@_')).map(([k, v]) => ({ key: `$${k.substring(2)}`, value: String(v) }));
          const text = item['#text'] ? [{ key: '#text', value: String(item['#text']) }] : [];
          return [...xmlAttrs, ...text];
        });

        nodes.push({
          id: groupNodeId,
          type: 'attributeNode',
          position: { x: 0, y: 0 },
          data: {
            label: `${childKey} (${childItems.length})`,
            attributes: [],
            leafValues: allLeafValues.map(item => ({...item, value: truncate(item.value)})),
          },
        });
        edges.push({
          id: `e-${id}-${groupNodeId}`, source: id, target: groupNodeId, type: 'smoothstep',
          style: { stroke: '#888', strokeWidth: 1.5 }, data: { borderRadius: 15 },
        });
      } else {
        childItems.forEach((item, i) => {
           if (item && typeof item === 'object') {
             walk(item, childKey, [...path, key + `[${siblingIdx}]`], i, id);
           }
        });
      }
    });
  }

  walk(rootObj, rootKey, [], 0, null);

  // --- Layouting Logic ---
  const nodeWidth = 300, verticalGap = 20, horizontalGap = 150, baseNodeHeight = 40, lineHeight = 18;

  const getNodeHeight = (node) => {
    const lines = (node.data.leafValues?.length || 0);
    const padding = 25 + (lines > 0 ? 15 : 0);
    return baseNodeHeight + (lines * lineHeight) + padding;
  };

  const childrenMap = new Map();
  nodes.forEach(n => childrenMap.set(n.id, []));
  edges.forEach(e => {
    if (childrenMap.has(e.source)) {
      const childNode = nodes.find(n => n.id === e.target);
      if (childNode) childrenMap.get(e.source).push(childNode);
    }
  });

  function calculateSubtreeHeight(node) {
    const nodeHeight = getNodeHeight(node);
    const children = childrenMap.get(node.id) || [];
    if (children.length === 0) {
      node.subtreeHeight = nodeHeight;
      return nodeHeight;
    }
    let childrenHeight = 0;
    children.forEach(child => { childrenHeight += calculateSubtreeHeight(child); });
    const totalChildrenHeight = childrenHeight + (children.length - 1) * verticalGap;
    node.subtreeHeight = Math.max(nodeHeight, totalChildrenHeight);
    return node.subtreeHeight;
  }

  function assignPositions(node, x, y) {
    if (!node) return;
    const nodeHeight = getNodeHeight(node);
    node.position = { x, y: y - nodeHeight / 2 };
    const children = childrenMap.get(node.id) || [];
    if (children.length === 0) return;
    let startY = y - node.subtreeHeight / 2;
    children.forEach(child => {
      const childCenterY = startY + child.subtreeHeight / 2;
      assignPositions(child, x + nodeWidth + horizontalGap, childCenterY);
      startY += child.subtreeHeight + verticalGap;
    });
  }

  const rootNode = nodes.find(n => !edges.some(e => e.target === n.id));
  if (rootNode) {
    calculateSubtreeHeight(rootNode);
    assignPositions(rootNode, 0, 0);
  }

  return { nodes, edges };
};
