import  { useState } from 'react';

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
    <div className="bg-gray-50 rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter list name..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="btn-primary text-sm px-3 py-1 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add List'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-sm px-3 py-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListForm;