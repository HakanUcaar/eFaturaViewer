import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import AceEditor from 'react-ace';
import ace from 'ace-builds';

import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

const Editor = React.forwardRef(({ xmlContent, xsltContent, onXmlChange, onXsltChange, highlightedLine, onEditorReady }, ref) => {
  const [activeTab, setActiveTab] = useState('xml');
  const editorRef = useRef(null);
  const highlightMarker = useRef(null);

  const handleLoad = (editorInstance) => {
    editorRef.current = editorInstance;
    if (onEditorReady) {
      onEditorReady();
    }
  };

  useImperativeHandle(ref, () => ({
    getEditor: () => {
      return editorRef.current;
    }
  }));

  useEffect(() => {
    if (editorRef.current && activeTab === 'xml') {
      const editor = editorRef.current;
      const session = editor.getSession();

      // Clear previous marker
      if (highlightMarker.current) {
        session.removeMarker(highlightMarker.current);
      }

      if (highlightedLine !== null) {
        // Add new marker
        const Range = ace.require('ace/range').Range;
        highlightMarker.current = session.addMarker(
          new Range(highlightedLine - 1, 0, highlightedLine - 1, 1),
          'highlight-line',
          'fullLine'
        );
        editor.scrollToLine(highlightedLine, true, true, () => {});
      }
    }
  }, [highlightedLine, activeTab]);

  return (
    <div className="editor-container-tabs">
      <div className="editor-tabs">
        <button 
          onClick={() => setActiveTab('xml')} 
          className={activeTab === 'xml' ? 'active' : ''}
        >
          XML
        </button>
        <button 
          onClick={() => setActiveTab('xslt')} 
          className={activeTab === 'xslt' ? 'active' : ''}
        >
          XSLT
        </button>
      </div>
      <div className="editor-content">
        {activeTab === 'xml' && (
          <AceEditor
            mode="xml"
            theme="monokai"
            name="xml-editor"
            value={xmlContent}
            onChange={onXmlChange}
            width="100%"
            height="100%"
            onLoad={handleLoad}
            editorProps={{ $blockScrolling: true }}
            setOptions={{ 
              useWorker: false,
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true 
            }}
          />
        )}
        {activeTab === 'xslt' && (
          <AceEditor
            mode="xml" // XSLT is also XML
            theme="monokai"
            name="xslt-editor"
            value={xsltContent}
            onChange={onXsltChange}
            width="100%"
            height="100%"
            editorProps={{ $blockScrolling: true }}
            setOptions={{ useWorker: false }}
          />
        )}
      </div>
    </div>
  );
});

export default Editor;
