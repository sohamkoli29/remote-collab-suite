import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';
import { useWhiteboard } from '../../hooks/useWhiteboard';
import WhiteboardToolbar from './WhiteboardToolbar';

const WhiteboardCanvas = ({ workspaceId, currentUser, onClose }) => {
  const {
    elements,
    remoteCursors,
    isConnected,
    error,
    canUndo,
    canRedo,
    initialize,
    addElement,
    clearWhiteboard,
    undo,
    redo,
    updateCursor
  } = useWhiteboard(workspaceId, currentUser);

  const [tool, setTool] = useState('pen'); // pen, eraser, rectangle, circle, text
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);

  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });

  // Initialize whiteboard on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Mouse/Touch handlers
  const handleMouseDown = (e) => {
    if (!isConnected) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentLine({
        tool,
        points: [point.x, point.y],
        color: tool === 'eraser' ? '#FFFFFF' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 3 : strokeWidth
      });
    } else if (tool === 'rectangle' || tool === 'circle') {
      setCurrentLine({
        tool,
        startX: point.x,
        startY: point.y,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        color,
        strokeWidth
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isConnected) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    // Update cursor position for others
    updateCursor(point.x, point.y);

    if (!isDrawing) return;

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentLine(prev => ({
        ...prev,
        points: [...prev.points, point.x, point.y]
      }));
    } else if (tool === 'rectangle' || tool === 'circle') {
      setCurrentLine(prev => ({
        ...prev,
        x: prev.startX,
        y: prev.startY,
        width: point.x - prev.startX,
        height: point.y - prev.startY
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentLine) return;

    // Save the element
    addElement(currentLine);

    setIsDrawing(false);
    setCurrentLine(null);
  };

  // Export canvas as image
  const handleExport = (format = 'png') => {
    if (!stageRef.current) return;

    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.${format}`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render elements
  const renderElement = (element) => {
    const key = element.id;

    if (element.tool === 'pen' || element.tool === 'eraser') {
      return (
        <Line
          key={key}
          points={element.points}
          stroke={element.color}
          strokeWidth={element.strokeWidth}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={
            element.tool === 'eraser' ? 'destination-out' : 'source-over'
          }
        />
      );
    } else if (element.tool === 'rectangle') {
      return (
        <Rect
          key={key}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          stroke={element.color}
          strokeWidth={element.strokeWidth}
        />
      );
    } else if (element.tool === 'circle') {
      return (
        <Circle
          key={key}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          radius={Math.abs(element.width) / 2}
          stroke={element.color}
          strokeWidth={element.strokeWidth}
        />
      );
    }
    return null;
  };

  // Render remote cursors
  const renderRemoteCursors = () => {
    return Array.from(remoteCursors.entries()).map(([socketId, cursor]) => (
      <React.Fragment key={socketId}>
        <Circle
          x={cursor.x}
          y={cursor.y}
          radius={8}
          fill="#6366f1"
          opacity={0.7}
        />
        <Text
          x={cursor.x + 12}
          y={cursor.y - 8}
          text={cursor.userName || 'User'}
          fontSize={12}
          fill="#6366f1"
          fontStyle="bold"
        />
      </React.Fragment>
    ));
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Collaborative Whiteboard</h2>
          <p className="text-sm text-gray-600">
            {isConnected ? (
              <span className="text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="text-gray-500">Connecting...</span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <WhiteboardToolbar
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        canUndo={canUndo}
        canRedo={canRedo}
        onToolChange={setTool}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onClear={clearWhiteboard}
        onUndo={undo}
        onRedo={redo}
        onExport={handleExport}
      />

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 overflow-hidden bg-white relative">
        {isConnected ? (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <Layer>
              {/* Render saved elements */}
              {elements.map(renderElement)}

              {/* Render current drawing */}
              {currentLine && renderElement({ ...currentLine, id: 'current' })}

              {/* Render remote cursors */}
              {renderRemoteCursors()}
            </Layer>
          </Stage>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Connecting to whiteboard...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhiteboardCanvas;