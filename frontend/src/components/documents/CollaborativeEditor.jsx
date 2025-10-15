import  { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { 
  Bold, Italic, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, ChevronDown, Type, WifiOff, Loader2
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import { useAuth } from '../../contexts/AuthContext';

// Custom extension to handle both fontFamily and fontSize
const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontFamily: {
        default: null,
        parseHTML: element => element.style.fontFamily?.replace(/['"]+/g, ''),
        renderHTML: attributes => {
          if (!attributes.fontFamily) {
            return {};
          }
          return {
            style: `font-family: ${attributes.fontFamily}`,
          };
        },
      },
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
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
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px] p-12',
        style: 'font-family: Calibri, sans-serif; font-size: 12pt; line-height: 1.5;',
      },
    },
  });

  // Sync editor content with Yjs
  useEffect(() => {
    if (!editor || !ydoc) return;

    const yText = ydoc.getText('content');
    let isUpdating = false;

    // Load initial content from Yjs
    const initialContent = yText.toString();
    if (initialContent) {
      editor.commands.setContent(initialContent);
    }

    // Listen to Yjs updates and apply to editor
    const handleYjsUpdate = () => {
      if (isUpdating) return;
      
      isUpdating = true;
      const content = yText.toString();
      
      // Only update if content is different
      const currentContent = editor.getText();
      if (content !== currentContent) {
        const { from } = editor.state.selection;
        editor.commands.setContent(content, false);
        // Restore cursor position
        editor.commands.focus();
        editor.commands.setTextSelection(Math.min(from, content.length));
      }
      isUpdating = false;
    };

    yText.observe(handleYjsUpdate);

    // Listen to editor updates and sync to Yjs
    const handleEditorUpdate = ({ editor: updatedEditor }) => {
      if (isUpdating) return;
      
      isUpdating = true;
      setIsSyncing(true);
      
      const content = updatedEditor.getText();
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

  // Handle font family change for selected text
  const handleFontFamilyChange = (newFontFamily) => {
    setFontFamily(newFontFamily);
    if (editor && !editor.state.selection.empty) {
      editor.chain().focus().setMark('textStyle', { fontFamily: newFontFamily }).run();
    }
  };

  // Handle font size change for selected text
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

  const ToolbarButton = ({ onClick, isActive, children, title, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gray-100 h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !connected) {
    return (
      <div className="bg-gray-100 h-screen flex items-center justify-center">
        <div className="text-center">
          <WifiOff className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={reconnect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 h-screen flex flex-col">
      {/* Top Bar with Title */}
      <div className="bg-blue-600 text-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center space-x-3">
            <Type className="w-5 h-5" />
            {isEditingTitle ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-sm bg-blue-700 px-2 py-1 rounded border-none outline-none text-white"
                autoFocus
              />
            ) : (
              <span
                className="text-sm cursor-pointer hover:bg-blue-700 px-2 py-1 rounded"
                onClick={() => setIsEditingTitle(true)}
              >
                {documentTitle}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {isSyncing && <Loader2 className="w-3 h-3 animate-spin" />}
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Ribbon - Microsoft Word Style */}
      <div className="bg-white border-b border-gray-300 shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-start space-x-6">
            
            {/* Font Group */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Font</span>
              <div className="flex items-center space-x-1 border-r border-gray-300 pr-4">
                <div className="relative">
                  <select 
                    value={fontFamily}
                    onChange={(e) => handleFontFamilyChange(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 pr-6 bg-white appearance-none cursor-pointer hover:bg-gray-50"
                  >
                    <option value="Calibri">Calibri</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select 
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 pr-6 bg-white w-16 appearance-none cursor-pointer hover:bg-gray-50"
                  >
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                    <option value="18">18</option>
                    <option value="20">20</option>
                    <option value="24">24</option>
                    <option value="36">36</option>
                    <option value="48">48</option>
                    <option value="70">70</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  isActive={editor?.isActive('bold')}
                  disabled={!editor}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  isActive={editor?.isActive('italic')}
                  disabled={!editor}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  isActive={editor?.isActive('strike')}
                  disabled={!editor}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
              </div>
            </div>

            {/* Paragraph Group */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Paragraph</span>
              <div className="flex items-center space-x-1">
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  isActive={editor?.isActive('bulletList')}
                  disabled={!editor}
                  title="Bullets"
                >
                  <List className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  isActive={editor?.isActive('orderedList')}
                  disabled={!editor}
                  title="Numbering"
                >
                  <ListOrdered className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  isActive={editor?.isActive({ textAlign: 'left' })}
                  disabled={!editor}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  isActive={editor?.isActive({ textAlign: 'center' })}
                  disabled={!editor}
                  title="Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  isActive={editor?.isActive({ textAlign: 'right' })}
                  disabled={!editor}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                  onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                  isActive={editor?.isActive({ textAlign: 'justify' })}
                  disabled={!editor}
                  title="Justify"
                >
                  <AlignJustify className="w-4 h-4" />
                </ToolbarButton>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Editor Content Area - Paper-like */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg" style={{ minHeight: '11in' }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-blue-600 text-white px-4 py-1 text-xs flex justify-between items-center">
        <span>Changes saved automatically</span>
        <span>{connected ? 'Real-time collaboration enabled' : 'Offline - changes will sync when reconnected'}</span>
      </div>
    </div>
  );
};

export default CollaborativeEditor;