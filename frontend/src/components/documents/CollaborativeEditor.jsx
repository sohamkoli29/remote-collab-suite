import { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { 
  Bold, Italic, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, ChevronDown, Type, WifiOff, Loader2,
  Save, Users as UsersIcon, Check, Menu, MoreVertical
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import { useAuth } from '../../contexts/AuthContext';

const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontFamily: {
        default: null,
        parseHTML: element => element.style.fontFamily?.replace(/['"]+/g, ''),
        renderHTML: attributes => {
          if (!attributes.fontFamily) return {};
          return { style: `font-family: ${attributes.fontFamily}` };
        },
      },
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

const CollaborativeEditor = ({ documentId, workspaceId, documentTitle, onTitleChange }) => {
  const { user } = useAuth();
  const { ydoc, connected, loading, error, reconnect } = useDocument(documentId, workspaceId);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(documentTitle);
  const [fontSize, setFontSize] = useState('12');
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  const editor = useEditor({
    extensions: [
      Color,
      CustomTextStyle,
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] sm:min-h-[600px] p-4 sm:p-8 md:p-12 text-gray-900 text-sm sm:text-base',
        style: 'font-family: Calibri, sans-serif; font-size: 12pt; line-height: 1.5;',
      },
    },
  });

  useEffect(() => {
    if (!editor || !ydoc) return;

    const yText = ydoc.getText('content');
    let isUpdating = false;

    const initialContent = yText.toString();
    if (initialContent) {
      editor.commands.setContent(initialContent);
    }

    const handleYjsUpdate = () => {
      if (isUpdating) return;
      isUpdating = true;
      const content = yText.toString();
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        const { from } = editor.state.selection;
        editor.commands.setContent(content, false);
        editor.commands.focus();
        editor.commands.setTextSelection(Math.min(from, editor.state.doc.content.size));
      }
      isUpdating = false;
    };

    yText.observe(handleYjsUpdate);

    const handleEditorUpdate = ({ editor: updatedEditor }) => {
      if (isUpdating) return;
      isUpdating = true;
      setIsSyncing(true);
      
      const content = updatedEditor.getHTML();
      const yjsContent = yText.toString();
      
      if (content !== yjsContent) {
        ydoc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, content);
        });
      }
      
      setTimeout(() => setIsSyncing(false), 500);
      isUpdating = false;
    };

    editor.on('update', handleEditorUpdate);

    return () => {
      yText.unobserve(handleYjsUpdate);
      editor.off('update', handleEditorUpdate);
    };
  }, [editor, ydoc]);

  useEffect(() => {
    if (!ydoc || !connected) return;

    const awareness = {
      user: {
        name: `${user?.first_name} ${user?.last_name}`,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        id: user?.id
      }
    };

    setActiveUsers([awareness.user]);

    return () => setActiveUsers([]);
  }, [ydoc, connected, user]);

  const handleFontFamilyChange = (newFontFamily) => {
    setFontFamily(newFontFamily);
    if (editor && !editor.state.selection.empty) {
      editor.chain().focus().setMark('textStyle', { fontFamily: newFontFamily }).run();
    }
  };

  const handleFontSizeChange = (newFontSize) => {
    setFontSize(newFontSize);
    if (editor && !editor.state.selection.empty) {
      editor.chain().focus().setMark('textStyle', { fontSize: `${newFontSize}pt` }).run();
    }
  };

  const handleTitleSave = useCallback(() => {
    if (localTitle.trim() && localTitle !== documentTitle) {
      onTitleChange?.(localTitle);
    }
    setIsEditingTitle(false);
  }, [localTitle, documentTitle, onTitleChange]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setLocalTitle(documentTitle);
      setIsEditingTitle(false);
    }
  }, [handleTitleSave, documentTitle]);

  const ToolbarButton = ({ onClick, isActive, children, title, disabled, mobile = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`transition-all duration-200 ${
        mobile 
          ? `p-2 rounded-lg ${
              isActive 
                ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border border-purple-500/30' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`
          : `p-1.5 sm:p-2 rounded ${
              isActive 
                ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border border-purple-500/30' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3 sm:space-y-4 animate-scale-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-neon animate-pulse-glow">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg sm:text-xl">Loading document...</p>
            <p className="text-gray-400 text-sm sm:text-base">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4 sm:space-y-6 animate-scale-in max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-neon">
            <WifiOff className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg sm:text-xl mb-2">Connection Error</p>
            <p className="text-gray-400 text-sm sm:text-base">{error}</p>
          </div>
          <button
            onClick={reconnect}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm sm:text-base"
          >
            <span className="relative z-10">Retry Connection</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Top Bar with Title */}
      <div className="flex-shrink-0 glass-panel backdrop-blur-2xl bg-white/10 border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-neon flex-shrink-0">
              <Type className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            {isEditingTitle ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border-2 border-white/10 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 text-sm sm:text-base"
                autoFocus
              />
            ) : (
              <span
                className="text-white font-display font-bold cursor-pointer hover:text-cyan-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5 truncate text-sm sm:text-base"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
              >
                {documentTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Active Users - Desktop */}
            {activeUsers.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-gray-400" />
                {activeUsers.slice(0, 2).map((u, i) => (
                  <div
                    key={u.id || i}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded border border-white/20"
                    title={u.name}
                  >
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: u.color }}
                    />
                    <span className="text-xs text-white font-medium">{u.name.split(' ')[0]}</span>
                  </div>
                ))}
                {activeUsers.length > 2 && (
                  <div className="px-2 py-1 bg-white/10 rounded border border-white/20">
                    <span className="text-xs text-white font-medium">+{activeUsers.length - 2}</span>
                  </div>
                )}
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-white/5 rounded border border-white/10">
              {isSyncing ? (
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
              ) : connected ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-white font-medium hidden sm:inline">
                {connected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Mobile Toolbar Toggle */}
            <button
              onClick={() => setShowMobileToolbar(!showMobileToolbar)}
              className="sm:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Toolbar - Ribbon Style */}
      <div className="hidden sm:flex flex-shrink-0 glass-panel backdrop-blur-2xl bg-white/5 border-b border-white/10">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start gap-4 sm:gap-6 lg:gap-8 flex-wrap">
            
            {/* Font Group */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <span className="text-xs text-gray-400 font-medium">Font</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <select 
                    value={fontFamily}
                    onChange={(e) => handleFontFamilyChange(e.target.value)}
                    className="px-2 sm:px-3 py-1.5 pr-6 sm:pr-8 bg-white/5 border-2 border-white/10 rounded text-white text-xs sm:text-sm font-medium appearance-none cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300"
                  >
                    <option value="Calibri" className="bg-slate-800">Calibri</option>
                    <option value="Arial" className="bg-slate-800">Arial</option>
                    <option value="Times New Roman" className="bg-slate-800">Times New Roman</option>
                    <option value="Georgia" className="bg-slate-800">Georgia</option>
                    <option value="Verdana" className="bg-slate-800">Verdana</option>
                  </select>
                  <ChevronDown className="w-3 h-3 sm:w-4 h-4 absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select 
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                    className="px-2 sm:px-3 py-1.5 pr-6 sm:pr-8 bg-white/5 border-2 border-white/10 rounded text-white text-xs sm:text-sm font-medium w-16 sm:w-20 appearance-none cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300"
                  >
                    <option value="8" className="bg-slate-800">8</option>
                    <option value="9" className="bg-slate-800">9</option>
                    <option value="10" className="bg-slate-800">10</option>
                    <option value="11" className="bg-slate-800">11</option>
                    <option value="12" className="bg-slate-800">12</option>
                    <option value="14" className="bg-slate-800">14</option>
                    <option value="16" className="bg-slate-800">16</option>
                    <option value="18" className="bg-slate-800">18</option>
                    <option value="20" className="bg-slate-800">20</option>
                    <option value="24" className="bg-slate-800">24</option>
                    <option value="36" className="bg-slate-800">36</option>
                  </select>
                  <ChevronDown className="w-3 h-3 sm:w-4 h-4 absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="w-px h-6 sm:h-8 bg-white/10 mx-1" />

                <div className="flex items-center gap-0.5 sm:gap-1">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    isActive={editor?.isActive('bold')}
                    disabled={!editor}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5 sm:w-4 h-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    isActive={editor?.isActive('italic')}
                    disabled={!editor}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5 sm:w-4 h-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    isActive={editor?.isActive('strike')}
                    disabled={!editor}
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-3.5 h-3.5 sm:w-4 h-4" />
                  </ToolbarButton>
                </div>
              </div>
            </div>

            {/* Paragraph Group */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <span className="text-xs text-gray-400 font-medium">Paragraph</span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  isActive={editor?.isActive('bulletList')}
                  disabled={!editor}
                  title="Bullets"
                >
                  <List className="w-3.5 h-3.5 sm:w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  isActive={editor?.isActive('orderedList')}
                  disabled={!editor}
                  title="Numbering"
                >
                  <ListOrdered className="w-3.5 h-3.5 sm:w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 sm:h-8 bg-white/10 mx-1" />

                <ToolbarButton
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  isActive={editor?.isActive({ textAlign: 'left' })}
                  disabled={!editor}
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5 sm:w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  isActive={editor?.isActive({ textAlign: 'center' })}
                  disabled={!editor}
                  title="Center"
                >
                  <AlignCenter className="w-3.5 h-3.5 sm:w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  isActive={editor?.isActive({ textAlign: 'right' })}
                  disabled={!editor}
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5 sm:w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                  isActive={editor?.isActive({ textAlign: 'justify' })}
                  disabled={!editor}
                  title="Justify"
                >
                  <AlignJustify className="w-3.5 h-3.5 sm:w-4 h-4" />
                </ToolbarButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Toolbar Overlay */}
      {showMobileToolbar && (
        <div className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40">
          <div className="absolute bottom-0 left-0 right-0 glass-panel backdrop-blur-2xl bg-white/10 border-t border-white/20 animate-slide-in-up">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Formatting Tools</h3>
                <button
                  onClick={() => setShowMobileToolbar(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <ToolbarButton mobile onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold')}>
                  <Bold className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton mobile onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic')}>
                  <Italic className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton mobile onClick={() => editor?.chain().focus().toggleStrike().run()} isActive={editor?.isActive('strike')}>
                  <Strikethrough className="w-5 h-5" />
                </ToolbarButton>
                <ToolbarButton mobile onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList')}>
                  <List className="w-5 h-5" />
                </ToolbarButton>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={fontFamily}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="px-3 py-2 bg-white/5 border-2 border-white/10 rounded-lg text-white text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="Calibri" className="bg-slate-800">Calibri</option>
                  <option value="Arial" className="bg-slate-800">Arial</option>
                  <option value="Times New Roman" className="bg-slate-800">Times New Roman</option>
                </select>
                
                <select 
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="px-3 py-2 bg-white/5 border-2 border-white/10 rounded-lg text-white text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content Area - Paper-like */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg sm:shadow-2xl rounded-lg" style={{ minHeight: '8in' }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 glass-panel backdrop-blur-2xl bg-white/5 border-t border-white/10 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="flex justify-between items-center text-xs text-gray-300">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Save className="w-3 h-3 text-green-400" />
            <span className="hidden sm:inline">Changes saved automatically</span>
            <span className="sm:hidden">Auto-save</span>
          </div>
          <span className="text-xs hidden sm:inline">
            {connected ? 'Real-time collaboration enabled' : 'Offline - changes will sync when reconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;