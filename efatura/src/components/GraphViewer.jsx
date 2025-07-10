import React, { memo } from 'react';
import ReactFlow, { Background, Controls,MiniMap } from 'react-flow-renderer';
import AttributeNode from './AttributeNode';

const nodeTypes = {
  attributeNode: AttributeNode,
};

const GraphViewer = ({ nodes, edges }) => {
  return (
    <div style={{ height: '100%', width: '100%', backgroundColor: '#1A202C' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        minZoom={0.1}
        maxZoom={2}
        defaultPosition={[0, 0]}
        defaultZoom={0.8}
        attributionPosition="bottom-left"
      >
        <Background color="#4A5568" gap={16} />
        <Controls style={{ left: '10px', bottom: '10px' }} />
        <MiniMap 
            nodeColor="#4A5568"
            nodeStrokeWidth={3}
            nodeBorderRadius={5}
            style={{ bottom: '10px', right: '10px' }}
        />
      </ReactFlow>
    </div>
  );
};

export default memo(GraphViewer);
