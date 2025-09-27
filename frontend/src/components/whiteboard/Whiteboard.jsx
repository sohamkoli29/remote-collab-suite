import React, { useRef, useEffect } from 'react';
import { useWhiteboard } from '../../hooks/useWhiteboard';
import { useAuth } from '../../contexts/AuthContext';

const Whiteboard = ({ workspaceId, isExpanded = false }) => {
  const { user: currentUser } = useAuth();
  const canvasContainerRef = useRef(null);
  
  const {
    canvas,
    tool,
    color,
    brushWidth,
    isDrawing,
    activeUsers,
    loading,
    error,
    connectionStatus,
    setTool,
    setColor,
    setBrushWidth,
    clearWhiteboard,
    exportWhiteboard,
    addShape,
    retryConnection
  } = useWhiteboard(workspaceId, currentUser);

  useEffect(() => {
    // Clean up existing canvas if it exists
    if (canvasContainerRef.current) {
      canvasContainerRef.current.innerHTML = '';
      
      if (canvas) {
        canvasContainerRef.current.appendChild(canvas.wrapperEl);
        canvas.renderAll(); // Force re-render
      }
    }
  }, [canvas]);

  const tools = [
    { id: 'select', name: 'Select', icon: '↖️', description: 'Select and move objects' },
    { id: 'pencil', name: 'Pencil', icon: '✏️', description: 'Freehand drawing' },
    { id: 'rectangle', name: 'Rectangle', icon: '⬜', description: 'Draw rectangles' },
    { id: 'circle', name: 'Circle', icon: '⭕', description: 'Draw circles' },
    { id: 'line', name: 'Line', icon: '📏', description: 'Draw straight lines' },
    { id: 'text', name: 'Text', icon: '📝', description: 'Add text' },
    { id: 'eraser', name: 'Eraser', icon: '🧹', description: 'Erase drawings' },
  ];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  const brushSizes = [1, 3, 5, 8, 12, 20];

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to whiteboard...';
      case 'connected':
        return 'Connected ✓';
      case 'error':
        return 'Connection failed';
      default:
        return 'Initializing...';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'text-yellow-600';
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (error) {
    return (
      <div className={`bg-white border rounded-lg flex flex-col ${isExpanded ? 'h-full' : 'h-96'}`}>
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900">Whiteboard</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Whiteboard Error</h4>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={retryConnection}
              className="btn-primary"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg flex flex-col ${isExpanded ? 'h-full' : 'h-96'}`}>
      {/* Toolbar */}
      <div className="p-3 border-b bg-gray-50 flex flex-wrap items-center gap-2">
        {/* Connection Status */}
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusMessage()}
        </div>

        {/* Tools */}
        <div className="flex items-center space-x-1">
          {tools.map((toolItem) => (
            <button
              key={toolItem.id}
              onClick={() => setTool(toolItem.id)}
              disabled={loading}
              className={`p-2 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 ${
                tool === toolItem.id
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              title={toolItem.description}
            >
              <span className="text-base">{toolItem.icon}</span>
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="flex items-center space-x-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={loading}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
            title="Select color"
          />
          {colors.map((colorOption) => (
            <button
              key={colorOption}
              onClick={() => setColor(colorOption)}
              disabled={loading}
              className="w-6 h-6 rounded border border-gray-300 disabled:opacity-50"
              style={{ backgroundColor: colorOption }}
              title={colorOption}
            />
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Size:</span>
          <select
            value={brushWidth}
            onChange={(e) => setBrushWidth(parseInt(e.target.value))}
            disabled={loading}
            className="text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
          >
            {brushSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={() => addShape('rectangle')}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Add Rectangle
          </button>
          <button
            onClick={() => addShape('circle')}
            disabled={loading}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
          >
            Add Circle
          </button>
          <button
            onClick={clearWhiteboard}
            disabled={loading}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
            title="Clear whiteboard"
          >
            Clear
          </button>
          <button
            onClick={() => exportWhiteboard('png')}
            disabled={loading}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
            title="Export as PNG"
          >
            Export
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center text-sm text-gray-600">
        <div>
          {loading ? 'Loading...' : (
            <>
              {isDrawing ? 'Drawing with ' : 'Using '}
              <span className="font-medium">{tools.find(t => t.id === tool)?.name}</span>
              {isDrawing && (
                <>
                  {' • Color: '}
                  <span 
                    className="inline-block w-3 h-3 rounded border border-gray-300 align-middle"
                    style={{ backgroundColor: color }}
                  ></span>
                  {' • Size: '}
                  <span className="font-medium">{brushWidth}px</span>
                </>
              )}
            </>
          )}
        </div>
        <div>
          {!loading && activeUsers.size > 0 ? (
            <span className="text-green-600">
              ● {activeUsers.size} user{activeUsers.size > 1 ? 's' : ''} active
            </span>
          ) : (
            <span className="text-gray-400">No other users active</span>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-gray-100 overflow-auto">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Initializing whiteboard...</p>
              <p className="text-sm text-gray-500 mt-1">{getStatusMessage()}</p>
            </div>
          </div>
        ) : (
          <>
            <div 
              ref={canvasContainerRef}
              className="w-full h-full flex items-center justify-center"
            >
              {/* Canvas will be inserted here by Fabric.js */}
              {!canvas && (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🖊️</div>
                  <p>Whiteboard ready</p>
                </div>
              )}
            </div>
            
            {/* Fallback if canvas fails to load */}
            {canvas && (
              <canvas 
                id="whiteboard-canvas" 
                style={{ display: 'none' }} // Hidden backup canvas
              />
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      {!loading && (
        <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
          <div className="flex justify-between">
            <span>
              💡 Tip: Use different tools to create your collaborative masterpiece!
            </span>
            <span>
              Real-time collaboration • Auto-save • {activeUsers.size} active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;