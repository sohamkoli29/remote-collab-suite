import { useState } from 'react';
import { Loader2, Check, X, List } from 'lucide-react';

const CreateListForm = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName('');
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 animate-scale-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white flex items-center space-x-2">
            <List className="w-4 h-4 text-cyan-400" />
            <span>List Name</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., To Do, In Progress, Done..."
            className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-400/50 transition-all duration-300"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="group relative flex-1 overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Add List</span>
                </>
              )}
            </span>
            {!isSubmitting && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-white/5 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListForm;