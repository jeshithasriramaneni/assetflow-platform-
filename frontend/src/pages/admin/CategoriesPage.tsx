import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Tag, Loader2 } from 'lucide-react';

const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#3b82f6', '#ef4444'];

export function CategoriesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: '' });

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => { toast.success('Category created'); qc.invalidateQueries({ queryKey: ['categories'] }); resetForm(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoriesApi.update(id, data),
    onSuccess: () => { toast.success('Category updated'); qc.invalidateQueries({ queryKey: ['categories'] }); resetForm(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const resetForm = () => { setShowForm(false); setEdit(null); setForm({ name: '', description: '', color: '#6366f1', icon: '' }); };
  const openEdit = (cat: any) => { setEdit(cat); setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#6366f1', icon: cat.icon || '' }); setShowForm(true); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (edit) updateMutation.mutate({ id: edit.id, data: form });
    else createMutation.mutate(form);
  };

  const categories = data?.data || [];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Categories</h1>
          <p className="text-sm text-[#555577]">Organize your asset inventory</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-[#e0e0ff] mb-4">{edit ? 'Edit Category' : 'New Category'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label">Icon (name)</label><input className="input" placeholder="camera, music, sun..." value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
            </div>
            <div><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <label className="label">Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-lg transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white/40' : ''}`}
                    style={{ background: c }} />
                ))}
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">
                {edit ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat: any) => (
            <div key={cat.id} className="card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cat.color}25` }}>
                    <Tag className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-[#e0e0ff] text-sm">{cat.name}</div>
                    <div className="text-xs text-[#555577]">{cat._count?.assets || 0} assets</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded hover:bg-blue-600/15 text-[#555577] hover:text-blue-400 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this category?')) deleteMutation.mutate(cat.id); }} className="p-1.5 rounded hover:bg-red-600/15 text-[#555577] hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {cat.description && <p className="text-xs text-[#8888aa] mt-3">{cat.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
