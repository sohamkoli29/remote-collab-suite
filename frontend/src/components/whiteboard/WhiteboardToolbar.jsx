import React, { useState } from 'react';

const WhiteboardToolbar = ({
  tool,
  color,
  strokeWidth,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onClear,
  onUndo,
  onRedo,
  onExport
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools = [
    { id: 'pen', name: 'Pen', icon: '✏️' },
    { id: 'eraser', name: 'Eraser', icon: '🧹' },
    { id: 'rectangle', name: 'Rectangle', icon: '⬜' },
    { id: 'circle', name: 'Circle', icon: '⭕' },
  ];

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0'
  ];

  const strokeWidths = [1, 2, 3, 5, 8, 12];

  const handleClearWithConfirm = () => {
    if (window.confirm('Are you sure you want to clear the whiteboard? This cannot be undone.')) {
      onClear();
    }
  };

  const handleExportMenu = () => {
    const format = window.confirm('Export as PNG? (Cancel for JPG)') ? 'png' : 'jpg';
    onExport(format);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Drawing Tools */}
        <div className="flex items-center space-x-2">
          {/* Tool Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {tools.map((t) => (
              <button
                key={t.id}
                onClick={() => onToolChange(t.id)}
                className={`px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  tool === t.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                title={t.name}
              >
                <span className="text-lg">{t.icon}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300"></div>

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Choose color"
            >
              <div
                className="w-6 h-6 rounded border-2 border-gray-300"
                style={{ backgroundColor: color }}
              ></div>
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Color Palette Dropdown */}
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10">
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onColorChange(c);
                        setShowColorPicker(false);
                      }}
                      className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                        color === c ? 'border-purple-600 ring-2 ring-purple-300' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                
                {/* Custom Color Input */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                  <label className="text-xs text-gray-600 font-medium">Custom:</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {strokeWidths.map((width) => (
              <button
                key={width}
                onClick={() => onStrokeWidthChange(width)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  strokeWidth === width
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                title={`${width}px`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{
                    width: `${Math.min(width * 2, 16)}px`,
                    height: `${Math.min(width * 2, 16)}px`
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${
              canUndo
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${
              canRedo
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300"></div>

          {/* Clear */}
          <button
            onClick={handleClearWithConfirm}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-sm transition-colors flex items-center space-x-1"
            title="Clear whiteboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear</span>
          </button>

          {/* Export */}
          <button
            onClick={handleExportMenu}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-sm transition-colors flex items-center space-x-1"
            title="Export as image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4">
        <span>💡 Tips:</span>
        <span>Pen (P)</span>
        <span>Eraser (E)</span>
        <span>Rectangle (R)</span>
        <span>Circle (C)</span>
        <span>Undo (Ctrl+Z)</span>
        <span>Redo (Ctrl+Y)</span>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;