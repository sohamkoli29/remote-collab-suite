import { useState } from 'react';
import { 
  PenTool, Eraser, Square, Circle, 
  Palette, Undo2, Redo2, Trash2, 
  Download, Minus, ChevronDown,
  MousePointer, Type, Hand // Added Hand import
} from 'lucide-react';

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
    { id: 'pen', name: 'Pen', icon: PenTool, shortcut: 'P' },
    { id: 'eraser', name: 'Eraser', icon: Eraser, shortcut: 'E' },
    { id: 'rectangle', name: 'Rectangle', icon: Square, shortcut: 'R' },
    { id: 'circle', name: 'Circle', icon: Circle, shortcut: 'C' },
    { id: 'select', name: 'Select', icon: MousePointer, shortcut: 'V' },
    { id: 'hand', name: 'Hand', icon: Hand, shortcut: 'H' }, // Added Hand tool
  ];

  const colors = [
    '#000000', '#FFFFFF', '#EF4444', '#10B981', '#3B82F6',
    '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899',
    '#84CC16', '#6366F1', '#14B8A6', '#F43F5E'
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

  const ToolbarButton = ({ onClick, isActive, children, title, disabled, shortcut }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${title} (${shortcut})`}
      className={`relative p-2 sm:p-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border border-purple-500/30 shadow-lg' 
          : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {shortcut}
      </span>
    </button>
  );

  return (
    <div className="glass-panel backdrop-blur-2xl bg-white/10 border-b border-white/10 px-3 sm:px-6 py-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        {/* Left Section - Drawing Tools */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* Tool Selector */}
          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <ToolbarButton
                  key={t.id}
                  onClick={() => onToolChange(t.id)}
                  isActive={tool === t.id}
                  title={t.name}
                  shortcut={t.shortcut}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </ToolbarButton>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all duration-300 group"
              title="Choose color"
            >
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-white/20 shadow-sm"
                style={{ backgroundColor: color }}
              ></div>
              <Palette className="w-4 h-4 text-gray-300 group-hover:text-white" />
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {/* Color Palette Dropdown */}
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 glass-panel backdrop-blur-2xl bg-white/10 border-white/20 rounded-xl shadow-2xl p-3 sm:p-4 z-10 min-w-[200px]">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onColorChange(c);
                        setShowColorPicker(false);
                      }}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded border-2 transition-all hover:scale-110 ${
                        color === c ? 'border-cyan-400 ring-2 ring-cyan-300/50' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                
                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <label className="text-xs text-gray-300 font-medium">Custom:</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="w-12 h-8 border border-white/20 rounded-lg cursor-pointer bg-white/5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            {strokeWidths.map((width) => (
              <button
                key={width}
                onClick={() => onStrokeWidthChange(width)}
                className={`p-2 rounded transition-all duration-200 ${
                  strokeWidth === width
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title={`${width}px`}
              >
                <div
                  className="rounded-full bg-current transition-all"
                  style={{
                    width: `${Math.min(width * 1.5, 12)}px`,
                    height: `${Math.min(width * 1.5, 12)}px`
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded transition-all duration-200 ${
                canUndo
                  ? 'text-gray-300 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded transition-all duration-200 ${
                canRedo
                  ? 'text-gray-300 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

          {/* Clear & Export */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearWithConfirm}
              className="group relative overflow-hidden bg-red-500/10 backdrop-blur-sm text-red-300 px-3 py-2 rounded-lg font-medium border-2 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20 transition-all duration-300 flex items-center gap-1 sm:gap-2 text-sm"
              title="Clear whiteboard"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={handleExportMenu}
              className="group relative overflow-hidden bg-green-500/10 backdrop-blur-sm text-green-300 px-3 py-2 rounded-lg font-medium border-2 border-green-500/20 hover:border-green-500/50 hover:bg-green-500/20 transition-all duration-300 flex items-center gap-1 sm:gap-2 text-sm"
              title="Export as image"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 text-xs text-gray-400 flex items-center gap-3 sm:gap-4 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          💡 Tips:
        </span>
        <span>Pen (P)</span>
        <span>Eraser (E)</span>
        <span>Rectangle (R)</span>
        <span>Circle (C)</span>
        <span>Select (V)</span>
        <span>Hand (H)</span>
        <span>Undo (Ctrl+Z)</span>
        <span>Redo (Ctrl+Y)</span>
      </div>

      {/* Close dropdown when clicking outside */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
};

export default WhiteboardToolbar;