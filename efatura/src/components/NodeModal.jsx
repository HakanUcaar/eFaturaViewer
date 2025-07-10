import React from 'react';

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  background: '#2D3748',
  color: '#E2E8F0',
  border: '1px solid #4A5568',
  borderRadius: '8px',
  padding: '25px',
  width: '60%',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
};

const headerStyle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#A0AEC0',
  borderBottom: '1px solid #4A5568',
  paddingBottom: '10px',
  marginBottom: '15px',
};

const attributeStyle = {
  display: 'flex',
  marginBottom: '10px',
  fontFamily: 'monospace',
  fontSize: '14px',
  borderBottom: '1px solid #3a4150',
  paddingBottom: '10px',
};

const keyStyle = {
  color: '#9F7AEA',
  minWidth: '200px',
  paddingRight: '15px',
  fontWeight: 'bold',
};

const valueStyle = {
  color: '#F6E05E',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  flex: 1,
};

const closeButtonStyle = {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'transparent',
    border: 'none',
    color: '#A0AEC0',
    fontSize: '24px',
    cursor: 'pointer',
}

const NodeModal = ({ node, onClose }) => {
  if (!node) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose}>&times;</button>
        <div style={headerStyle}>{node.data.label}</div>
        <div>
          {node.data.attributes.map((attr, index) => (
            <div key={index} style={attributeStyle}>
              <span style={keyStyle}>{attr.key}:</span>
              <span style={valueStyle}>{attr.originalValue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NodeModal;
