import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag, Layers, X, Check, GripVertical } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

const EMPTY_CAT = { name: '', slug: '', description: '', image: '', sortOrder: 0 };

// ── Helpers ──────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'categories' | 'clothing-types'>('categories');

  // ── Category state ───────────────────────────────────────
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);

  // ── Clothing type state ──────────────────────────────────
  const [newType, setNewType] = useState('');
  const [editingType, setEditingType] = useState<{ index: number; value: string } | null>(null);

  // ── Queries ──────────────────────────────────────────────
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminService.getCategories(),
  });
  const categories: Category[] = catData?.data?.data || [];

  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['admin', 'clothing-types'],
    queryFn: () => adminService.getClothingTypes(),
  });
  const clothingTypes: string[] = typesData?.data?.data || [];

  // ── Category mutations ───────────────────────────────────
  const createCat = useMutation({
    mutationFn: (d: typeof EMPTY_CAT) => adminService.createCategory(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Category created'); closeCatModal(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create category'),
  });

  const updateCat = useMutation({
    mutationFn: (d: typeof EMPTY_CAT) => adminService.updateCategory(editingCat!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Category updated'); closeCatModal(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update category'),
  });

  const deleteCat = useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Category removed'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  // ── Clothing type mutation ───────────────────────────────
  const saveTypes = useMutation({
    mutationFn: (types: string[]) => adminService.saveClothingTypes(types),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'clothing-types'] }); toast.success('Clothing types saved'); },
    onError: () => toast.error('Failed to save clothing types'),
  });

  // ── Helpers ──────────────────────────────────────────────
  const openAddCat = () => { setEditingCat(null); setCatForm(EMPTY_CAT); setCatModal(true); };
  const openEditCat = (c: Category) => {
    setEditingCat(c);
    setCatForm({ name: c.name, slug: c.slug, description: c.description || '', image: c.image || '', sortOrder: c.sortOrder });
    setCatModal(true);
  };
  const closeCatModal = () => { setCatModal(false); setEditingCat(null); setCatForm(EMPTY_CAT); };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) updateCat.mutate(catForm);
    else createCat.mutate(catForm);
  };

  const handleAddType = () => {
    const trimmed = newType.trim();
    if (!trimmed) return;
    if (clothingTypes.includes(trimmed)) { toast.error('Already exists'); return; }
    saveTypes.mutate([...clothingTypes, trimmed]);
    setNewType('');
  };

  const handleDeleteType = (index: number) => {
    const updated = clothingTypes.filter((_, i) => i !== index);
    saveTypes.mutate(updated);
  };

  const handleSaveTypeEdit = () => {
    if (!editingType) return;
    const trimmed = editingType.value.trim();
    if (!trimmed) return;
    const updated = clothingTypes.map((t, i) => (i === editingType.index ? trimmed : t));
    saveTypes.mutate(updated);
    setEditingType(null);
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-normal">Catalogue Setup</h1>
          <p className="text-sm text-velour-grey mt-1">Manage categories and clothing types used across the store</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-velour-ivory border border-velour-ivory p-1 w-fit mb-6 rounded-sm">
        {(['categories', 'clothing-types'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors flex items-center gap-2 ${
              tab === t ? 'bg-white text-velour-black shadow-sm' : 'text-velour-grey hover:text-velour-black'
            }`}
          >
            {t === 'categories' ? <Tag size={14} /> : <Layers size={14} />}
            {t === 'categories' ? 'Categories' : 'Clothing Types'}
          </button>
        ))}
      </div>

      {/* ── CATEGORIES TAB ─────────────────────────────── */}
      {tab === 'categories' && (
        <div className="bg-white border border-velour-ivory">
          <div className="flex items-center justify-between px-5 py-4 border-b border-velour-ivory">
            <p className="text-sm font-medium">{categories.length} categories</p>
            <button onClick={openAddCat} className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2">
              <Plus size={14} /> Add Category
            </button>
          </div>

          {catLoading ? (
            <div className="p-8 text-center text-velour-grey text-sm">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-velour-grey text-sm">No categories yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-velour-ivory text-xs text-velour-grey uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Slug</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Description</th>
                  <th className="text-center px-5 py-3">Products</th>
                  <th className="text-center px-5 py-3">Order</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-velour-ivory last:border-0 hover:bg-velour-off-white transition-colors">
                    <td className="px-5 py-3.5 font-medium text-velour-black">
                      <div className="flex items-center gap-2">
                        {cat.image && (
                          <img src={cat.image} alt={cat.name} className="w-8 h-8 object-cover rounded-sm flex-shrink-0" />
                        )}
                        {cat.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-velour-grey hidden md:table-cell font-mono text-xs">{cat.slug}</td>
                    <td className="px-5 py-3.5 text-velour-grey hidden lg:table-cell max-w-xs truncate">{cat.description || '—'}</td>
                    <td className="px-5 py-3.5 text-center text-velour-grey">{cat._count?.products ?? 0}</td>
                    <td className="px-5 py-3.5 text-center text-velour-grey">{cat.sortOrder}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEditCat(cat)} className="p-1.5 text-velour-grey hover:text-velour-black hover:bg-velour-ivory rounded-sm transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteCat.mutate(cat.id); }}
                          className="p-1.5 text-velour-grey hover:text-velour-error hover:bg-red-50 rounded-sm transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── CLOTHING TYPES TAB ─────────────────────────── */}
      {tab === 'clothing-types' && (
        <div className="bg-white border border-velour-ivory">
          <div className="px-5 py-4 border-b border-velour-ivory">
            <p className="text-sm text-velour-grey mb-3">
              These types appear in the product form dropdown. Types already used by products are included automatically.
            </p>
            <div className="flex gap-2">
              <input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddType())}
                placeholder="e.g. Blazers"
                className="form-input flex-1 max-w-xs"
              />
              <button onClick={handleAddType} className="btn-primary flex items-center gap-1.5 px-3 py-2 text-xs">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {typesLoading ? (
            <div className="p-8 text-center text-velour-grey text-sm">Loading…</div>
          ) : clothingTypes.length === 0 ? (
            <div className="p-8 text-center text-velour-grey text-sm">No clothing types yet</div>
          ) : (
            <ul className="divide-y divide-velour-ivory">
              {clothingTypes.map((type, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-velour-off-white transition-colors">
                  <GripVertical size={14} className="text-velour-light-grey flex-shrink-0" />
                  {editingType?.index === i ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        autoFocus
                        value={editingType.value}
                        onChange={(e) => setEditingType({ index: i, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTypeEdit(); if (e.key === 'Escape') setEditingType(null); }}
                        className="form-input py-1 text-sm flex-1 max-w-xs"
                      />
                      <button onClick={handleSaveTypeEdit} className="p-1.5 text-velour-success hover:bg-green-50 rounded-sm transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingType(null)} className="p-1.5 text-velour-grey hover:bg-velour-ivory rounded-sm transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-velour-black flex-1">{type}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingType({ index: i, value: type })} className="p-1.5 text-velour-grey hover:text-velour-black hover:bg-velour-ivory rounded-sm transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDeleteType(i)} className="p-1.5 text-velour-grey hover:text-velour-error hover:bg-red-50 rounded-sm transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── CATEGORY MODAL ─────────────────────────────── */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeCatModal} />
          <div className="relative bg-white w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-velour-ivory">
              <h2 className="font-display text-lg font-normal">{editingCat ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={closeCatModal} className="text-velour-grey hover:text-velour-black"><X size={18} /></button>
            </div>
            <form onSubmit={handleCatSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Name *</label>
                <input
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm((f) => ({
                    ...f, name: e.target.value,
                    slug: editingCat ? f.slug : slugify(e.target.value),
                  }))}
                  className="form-input"
                  placeholder="Men's Wear"
                />
              </div>
              <div>
                <label className="form-label">Slug * <span className="text-velour-grey font-normal normal-case">(URL-safe, lowercase)</span></label>
                <input
                  required
                  value={catForm.slug}
                  onChange={(e) => setCatForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  className="form-input font-mono text-sm"
                  placeholder="mens-wear"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={catForm.description}
                  onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="form-input resize-none"
                  placeholder="Short category description…"
                />
              </div>
              <div>
                <label className="form-label">Image URL</label>
                <input
                  value={catForm.image}
                  onChange={(e) => setCatForm((f) => ({ ...f, image: e.target.value }))}
                  className="form-input"
                  placeholder="https://images.unsplash.com/…"
                />
                {catForm.image && (
                  <img src={catForm.image} alt="preview" className="mt-2 h-20 w-full object-cover rounded-sm" onError={(e) => (e.currentTarget.hidden = true)} />
                )}
              </div>
              <div>
                <label className="form-label">Sort Order</label>
                <input
                  type="number"
                  value={catForm.sortOrder}
                  onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="form-input"
                  min={0}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeCatModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createCat.isPending || updateCat.isPending} className="btn-primary flex-1">
                  {createCat.isPending || updateCat.isPending ? 'Saving…' : editingCat ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
