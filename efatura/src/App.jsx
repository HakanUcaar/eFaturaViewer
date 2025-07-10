import React, { useState, useEffect, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import Editor from './components/Editor';
import GraphViewer from './components/GraphViewer';
import { xmlToGraph } from './utils/xmlToGraph';
import sax from 'sax';
import NodeModal from './components/NodeModal';
import './App.css';

const App = () => {
  const [xmlContent, setXmlContent] = useState('');
  const [xsltContent, setXsltContent] = useState('');
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('iframe'); // 'graph' or 'iframe'
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const xmlEditorRef = useRef(null);

  useEffect(() => {
    // Load default XSLT from assets
    fetch('/src/assets/general.xslt')
      .then(response => response.text())
      .then(text => setXsltContent(text))
      .catch(err => console.error('Failed to load default XSLT:', err));
  }, []);

  const xmlInputRef = useRef(null);
  const xsltInputRef = useRef(null);

  // Effect for listening to messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Optional: Check event.origin for security
      // if (event.origin !== 'expected-origin') return;

      if (event.data && event.data.type === 'highlight-line') {
        const { line } = event.data;
        setHighlightedLine(line);
        if (isEditorReady && xmlEditorRef.current) {
          const editor = xmlEditorRef.current.getEditor();
          if (editor) {
            editor.gotoLine(line, 0, true);
            editor.focus();
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isEditorReady]); // Re-run if editor readiness changes

  // Effect for Graph Visualization
  useEffect(() => {
    if (xmlContent) {
      const processXml = async () => {
        try {
          const { nodes: newNodes, edges: newEdges } = await xmlToGraph(xmlContent);
          setAllNodes(newNodes);
          setAllEdges(newEdges);
        } catch (error) {
          console.error("XML Parsing Error for Graph:", error);
        }
      };
      processXml();
    }
  }, [xmlContent]);



  const handleNodeClick = (event, node) => {
    setSelectedNode(node); // Open modal for any clicked node
  };

  const handleCloseModal = () => {
    setSelectedNode(null);
  };

  // Effect for XSLT Transformation and line highlighting setup
  useEffect(() => {
    if (!xmlContent || !xsltContent) {
      setOutputUrl(null); // Clear iframe if no content
      return;
    }

    const processTransformation = async () => {
      try {
        // Step 1: Parse XML and XSLT and check for errors.
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
        const xsltDoc = parser.parseFromString(xsltContent, 'application/xml');

        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
          throw new Error('XML dosyasında format hatası var.');
        }
        if (xsltDoc.getElementsByTagName('parsererror').length > 0) {
          throw new Error('XSLT dosyasında format hatası var.');
        }

        // Step 2: Build the content map using sax-js.
        const buildContentMap = (xml) => {
          return new Promise((resolve) => {
            const saxParser = sax.parser(true);
            const map = new Map();
            saxParser.ontext = (text) => {
              const key = text.trim();
              if (key) {
                if (!map.has(key)) {
                  map.set(key, []);
                }
                const lines = map.get(key);
                const currentLine = saxParser.line + 1;
                if (!lines.includes(currentLine)) {
                  lines.push(currentLine);
                }
              }
            };
            saxParser.onerror = (err) => { saxParser.resume(); };
            saxParser.onend = () => { resolve(map); };
            saxParser.write(xml).close();
          });
        };

        const contentMap = await buildContentMap(xmlContent);

        // Step 3: Perform XSLT Transformation.
        const processor = new XSLTProcessor();
        processor.importStylesheet(xsltDoc);
        const resultDoc = processor.transformToDocument(xmlDoc);

        // Step 4: Inject data-line attributes.
        const allElements = resultDoc.getElementsByTagName('*');
        for (const element of allElements) {
          const content = element.textContent.trim();
          if (content && contentMap.has(content)) {
            const lineNumbers = contentMap.get(content);
            if (lineNumbers && lineNumbers.length > 0) {
              // Use shift() to consume the next available line number for this content.
              element.setAttribute('data-line', lineNumbers.shift());
            }
          }
        }

        // Step 5: Serialize and inject interaction script.
        const resultString = new XMLSerializer().serializeToString(resultDoc);
        const injectionScript = `
          <script>
            document.addEventListener('mouseover', (event) => {
              let target = event.target;
              if (window.highlightedElement) {
                window.highlightedElement.style.outline = '';
              }
              while(target && target !== document) {
                const line = target.getAttribute('data-line');
                if (line) {
                  target.style.outline = '2px solid #EF5350';
                  window.highlightedElement = target;
                  window.parent.postMessage({ type: 'highlight-line', line: parseInt(line, 10) }, '*');
                  return;
                }
                target = target.parentElement;
              }
            });
            document.addEventListener('mouseout', (event) => {
              if (window.highlightedElement) {
                window.highlightedElement.style.outline = '';
                window.highlightedElement = null;
              }
            });
          </script>
        `;
        const finalHtml = resultString.includes('</body>')
          ? resultString.replace('</body>', injectionScript + '</body>')
          : resultString + injectionScript;

        // Step 6: Create Blob and display in iframe.
        const blob = new Blob([finalHtml], { type: 'text/html' });
        if (outputUrl) {
          URL.revokeObjectURL(outputUrl);
        }
        setOutputUrl(URL.createObjectURL(blob));
        setError(null);

      } catch (err) {
        setError(`Dönüşüm hatası: ${err.message}`);
        setOutputUrl(null);
      }
    };

    processTransformation();

  }, [xmlContent, xsltContent]);

  const handleFileChange = (event, setter) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setter(e.target.result);
      reader.readAsText(file);
    }
  };

  return (
    <div className="app-container-dark">
      <header className="app-header">
        <div className="logo">E-FATURA VIEWER</div>
        <div className="file-controls">
          <button onClick={() => xmlInputRef.current.click()} className="file-select-button">
            XML Seç
          </button>
          <button onClick={() => xsltInputRef.current.click()} className="file-select-button">
            XSLT Seç
          </button>
        </div>
        <div className="view-switcher">
          <button onClick={() => setViewMode('iframe')} className={viewMode === 'iframe' ? 'active' : ''}>E-Fatura</button>
          <button onClick={() => setViewMode('graph')} className={viewMode === 'graph' ? 'active' : ''}>Graph</button>          
        </div>
      </header>
      <main className="main-content-split">
        <Allotment defaultSizes={[1, 2]} >
          <Allotment.Pane>
            <Editor 
              ref={xmlEditorRef}
              xmlContent={xmlContent} 
              xsltContent={xsltContent}
              onXmlChange={setXmlContent}
              onXsltChange={setXsltContent}
              highlightedLine={highlightedLine}
              onEditorReady={() => setIsEditorReady(true)}
            />
          </Allotment.Pane>
          <Allotment.Pane>
            <div className="right-pane">
              {viewMode === 'graph' ? (
                <ReactFlowProvider>
                  <GraphViewer nodes={allNodes} edges={allEdges}/>
                </ReactFlowProvider>
              ) : (
                error ? (
                  <div className="error-message">{error}</div>
                ) : outputUrl ? (
                  <iframe
                    title="e-fatura"
                    src={outputUrl}
                    className="result-iframe"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="initial-message">
                    Lütfen bir XML ve XSLT dosyası seçerek E-Fatura görünümünü oluşturun.
                  </div>
                )
              )}
            </div>
          </Allotment.Pane>
        </Allotment>
      </main>
      <NodeModal node={selectedNode} onClose={handleCloseModal} />
      <input type="file" ref={xmlInputRef} onChange={(e) => handleFileChange(e, setXmlContent)} style={{ display: 'none' }} accept=".xml" />
      <input type="file" ref={xsltInputRef} onChange={(e) => handleFileChange(e, setXsltContent)} style={{ display: 'none' }} accept=".xslt,.xsl" />
    </div>
  );
};

export default App;
