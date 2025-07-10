import React, { memo } from 'react';
import { Handle, Position } from 'react-flow-renderer';

const TRUNCATE_LENGTH = 30;
const truncate = (str, len) => {
  if (typeof str !== 'string' || str.length <= len) {
    return str;
  }
  return str.substring(0, len) + '...';
};

const nodeStyle = {
  background: '#2D3748',
  color: '#E2E8F0',
  border: '1px solid #4A5568',
  borderRadius: '8px',
  padding: '15px',
  fontSize: '14px',
  minWidth: '250px',
  textAlign: 'left',
};

const headerStyle = {
  fontWeight: 'bold',
  fontSize: '16px',
  marginBottom: '10px',
  color: '#A0AEC0',
  borderBottom: '1px solid #4A5568',
  paddingBottom: '5px',
  textAlign: 'center',
};

const contentWrapperStyle = {
  paddingTop: '10px',
};

const attributeStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '5px',
  fontFamily: 'monospace',
  fontSize: '12px',
};

const keyStyle = {
  color: '#9F7AEA', // Purple
  marginRight: '10px',
};

const valueStyle = {
  color: '#F6E05E', // Yellow
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  textAlign: 'right',
  flex: 1,
};

const AttributeNode = ({ data }) => {
  const hasAttributes = data.attributes && data.attributes.length > 0;
  const hasLeafValues = data.leafValues && data.leafValues.length > 0;

  return (
    <div style={nodeStyle}>
      <Handle type="target" position={Position.Left} style={{ background: '#4A5568' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#4A5568' }} />

      <div style={headerStyle}>{truncate(data.label, TRUNCATE_LENGTH)}</div>

      {(hasAttributes || hasLeafValues) && (
        <div style={contentWrapperStyle}>
          {hasAttributes && (
            <div className="attributes">
              {data.attributes.map((attr, index) => (
                <div key={index} style={attributeStyle}>
                  <span style={keyStyle}>{attr.key}:</span>
                  <span style={valueStyle}>"{truncate(attr.displayValue, TRUNCATE_LENGTH)}"</span>
                </div>
              ))}
            </div>
          )}
          {hasLeafValues && (
            <div className="leaf-values" style={{ marginTop: hasAttributes ? '10px' : '0' }}>
              {data.leafValues.map((item, index) => (
                <div key={index} style={attributeStyle}>
                  <span style={keyStyle}>{item.key}:</span>
                  <span style={valueStyle}>"{truncate(item.value, TRUNCATE_LENGTH) || 'N/A'}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(AttributeNode);
