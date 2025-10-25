import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';
import { useWhiteboard } from '../../hooks/useWhiteboard';
import WhiteboardToolbar from './WhiteboardToolbar';
import { 
  X, Users, Loader2, 
  AlertCircle, CheckCircle2, ZoomIn, ZoomOut,
  Move, Hand, Maximize2, Smartphone, Monitor
} from 'lucide-react';

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

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState(null);
  const [viewMode, setViewMode] = useState('desktop');

  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  // Initialize whiteboard on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle window resize - Full screen
  useEffect(() => {
    const updateSize = () => {
      // Always use full viewport size
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Tool shortcuts
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool('pen');
      } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool('eraser');
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool('rectangle');
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool('circle');
      } else if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool('select');
        setIsDragging(true);
      } else if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool('hand');
        setIsDragging(true);
      }
      // Zoom shortcuts
      else if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
      // Undo/Redo shortcuts
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, tool]);

  // Zoom functions
  const handleZoomIn = () => {
    setStageScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setStageScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleZoomReset = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  // Panning functionality - only when hand tool or select tool is active
  const handleStageMouseDown = (e) => {
    // Only allow panning when hand tool or select tool is active and not drawing
    if ((tool === 'hand' || tool === 'select') && !isDrawing) {
      setIsDragging(true);
      setLastPointerPosition(e.target.getPointerPosition());
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isDragging || isDrawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (lastPointerPosition) {
      const deltaX = point.x - lastPointerPosition.x;
      const deltaY = point.y - lastPointerPosition.y;

      setStagePosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }

    setLastPointerPosition(point);
  };

  const handleStageMouseUp = () => {
    setIsDragging(false);
    setLastPointerPosition(null);
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointerPosition.x - stagePosition.x) / stageScale,
      y: (pointerPosition.y - stagePosition.y) / stageScale,
    };

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? stageScale / scaleBy : stageScale * scaleBy;
    const boundedScale = Math.max(0.1, Math.min(5, newScale));

    setStageScale(boundedScale);

    const newPos = {
      x: pointerPosition.x - mousePointTo.x * boundedScale,
      y: pointerPosition.y - mousePointTo.y * boundedScale,
    };
    setStagePosition(newPos);
  };

  // Mouse/Touch handlers for drawing
  const handleMouseDown = (e) => {
    if (!isConnected || isDragging || tool === 'hand' || tool === 'select') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    // Convert point to stage coordinates considering scale and position
    const scaledPoint = {
      x: (point.x - stagePosition.x) / stageScale,
      y: (point.y - stagePosition.y) / stageScale
    };

    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentLine({
        tool,
        points: [scaledPoint.x, scaledPoint.y],
        color: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 3 : strokeWidth
      });
    } else if (tool === 'rectangle' || tool === 'circle') {
      setCurrentLine({
        tool,
        startX: scaledPoint.x,
        startY: scaledPoint.y,
        x: scaledPoint.x,
        y: scaledPoint.y,
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

    // Update cursor position for others (in stage coordinates)
    const scaledPoint = {
      x: (point.x - stagePosition.x) / stageScale,
      y: (point.y - stagePosition.y) / stageScale
    };
    updateCursor(scaledPoint.x, scaledPoint.y);

    if (!isDrawing || !currentLine) return;

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentLine(prev => ({
        ...prev,
        points: [...prev.points, scaledPoint.x, scaledPoint.y]
      }));
    } else if (tool === 'rectangle' || tool === 'circle') {
      setCurrentLine(prev => ({
        ...prev,
        x: prev.startX,
        y: prev.startY,
        width: scaledPoint.x - prev.startX,
        height: scaledPoint.y - prev.startY
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

    const uri = stageRef.current.toDataURL({ 
      pixelRatio: 2,
      mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      quality: 0.9
    });
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
          perfectDrawEnabled={false}
          listening={false}
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
          listening={false}
        />
      );
    } else if (element.tool === 'circle') {
      const radius = Math.max(Math.abs(element.width), Math.abs(element.height)) / 2;
      return (
        <Circle
          key={key}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          radius={radius}
          stroke={element.color}
          strokeWidth={element.strokeWidth}
          listening={false}
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
          radius={6 / stageScale}
          fill="#6366f1"
          opacity={0.8}
          listening={false}
        />
        <Text
          x={cursor.x + 8 / stageScale}
          y={cursor.y - 12 / stageScale}
          text={cursor.userName || 'User'}
          fontSize={12 / stageScale}
          fill="#6366f1"
          fontStyle="bold"
          listening={false}
        />
      </React.Fragment>
    ));
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header - Transparent overlay */}
      <div className="glass-panel backdrop-blur-2xl bg-white/10 border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-neon flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">Collaborative Whiteboard</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isConnected ? (
                  <span className="text-green-400 text-sm flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="text-yellow-400 text-sm flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </span>
                )}
                {remoteCursors.size > 0 && (
                  <span className="text-cyan-400 text-sm flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{remoteCursors.size} user{remoteCursors.size !== 1 ? 's' : ''} online</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === 'desktop' 
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === 'mobile' 
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
              <button
                onClick={handleZoomOut}
                className="p-2 rounded text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomReset}
                className="px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors min-w-[40px]"
                title="Reset Zoom"
              >
                {Math.round(stageScale * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border-y border-red-500/50 text-red-300 px-4 sm:px-6 py-3 flex items-center gap-3 animate-slide-in-down">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="leading-tight flex-1">{error}</span>
        </div>
      )}

      {/* Toolbar - Transparent overlay */}
      <WhiteboardToolbar
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        canUndo={canUndo}
        canRedo={canRedo}
        onToolChange={(newTool) => {
          setTool(newTool);
          // Auto-enable dragging for hand and select tools
          if (newTool === 'hand' || newTool === 'select') {
            setIsDragging(true);
          } else {
            setIsDragging(false);
          }
        }}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onClear={clearWhiteboard}
        onUndo={undo}
        onRedo={redo}
        onExport={handleExport}
      />

      {/* Full Screen Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden bg-white relative"
        style={{
          width: '100vw',
          height: 'calc(100vh - 140px)' // Adjust based on header + toolbar height
        }}
      >
        {isConnected ? (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onWheel={handleWheel}
            onMouseDown={(e) => {
              handleStageMouseDown(e);
              handleMouseDown(e);
            }}
            onMousemove={(e) => {
              handleStageMouseMove(e);
              handleMouseMove(e);
            }}
            onMouseup={() => {
              handleStageMouseUp();
              handleMouseUp();
            }}
            onTouchStart={(e) => {
              handleStageMouseDown(e);
              handleMouseDown(e);
            }}
            onTouchMove={(e) => {
              handleStageMouseMove(e);
              handleMouseMove(e);
            }}
            onTouchEnd={() => {
              handleStageMouseUp();
              handleMouseUp();
            }}
            draggable={(tool === 'hand' || tool === 'select') && !isDrawing}
            onDragMove={(e) => {
              const newPos = e.target.position();
              setStagePosition(newPos);
            }}
            onDragEnd={(e) => {
              const newPos = e.target.position();
              setStagePosition(newPos);
            }}
          >
            <Layer>
              {/* Full Screen White Background */}
              <Rect
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
                fill="#ffffff"
                listening={false}
              />
              
              {/* Render saved elements */}
              {elements.map(renderElement)}

              {/* Render current drawing */}
              {currentLine && renderElement({ ...currentLine, id: 'current' })}

              {/* Render remote cursors */}
              {renderRemoteCursors()}
            </Layer>
          </Stage>
        ) : (
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center space-y-4 animate-scale-in">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-neon animate-pulse-glow">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-white" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-lg sm:text-xl">Connecting to whiteboard...</p>
                <p className="text-gray-600 text-sm sm:text-base">Please wait while we establish connection</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Floating Controls */}
        {isMobile && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            {/* Zoom Controls */}
            <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 rounded-xl p-2 flex flex-col gap-1">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
              <div className="text-center text-xs text-gray-700 px-2 py-1">
                {Math.round(stageScale * 100)}%
              </div>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
              >
                <ZoomOut className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Hand Tool */}
            <button
              onClick={() => {
                setTool('hand');
                setIsDragging(true);
              }}
              className={`glass-panel backdrop-blur-2xl border-2 rounded-xl p-3 transition-all duration-200 ${
                tool === 'hand' 
                  ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-cyan-300/50' 
                  : 'bg-white/10 border-white/20 hover:border-white/30'
              }`}
            >
              <Hand className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        )}

        {/* Connection Status Overlay */}
        {!isConnected && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
              <p className="text-white text-sm">Reconnecting...</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar - Transparent overlay */}
      <div className="glass-panel backdrop-blur-2xl bg-white/5 border-t border-white/10 px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-300">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded border border-white/20"
                style={{ backgroundColor: color }}
              ></div>
              <span>Tool: {tool}</span>
            </span>
            <span>Size: {strokeWidth}px</span>
            <span>Zoom: {Math.round(stageScale * 100)}%</span>
            <span>Users: {remoteCursors.size + 1}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {isMobile && (
              <span className="text-cyan-400">📱 Mobile Mode</span>
            )}
            {tool === 'hand' && <span>🖐️ Pan Mode</span>}
            {tool === 'select' && <span>🔍 Select Mode</span>}
            {canUndo && <span>Undo (Ctrl+Z)</span>}
            {canRedo && <span>Redo (Ctrl+Y)</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardCanvas;