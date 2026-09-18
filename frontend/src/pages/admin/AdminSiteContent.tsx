import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';

export default function AdminSiteContent() {
  const qc = useQueryClient();
  const [formData, setFormData] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'site-content'],
    queryFn: () => adminService.getSiteContent(),
  });

  useEffect(() => {
    if (data?.data?.data) {
      setFormData(data.data.data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (newData: any) => adminService.saveSiteContent(newData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'site-content'] });
      qc.invalidateQueries({ queryKey: ['site-content'] });
      toast.success('Site content updated successfully');
    },
    onError: () => toast.error('Failed to update site content'),
  });

  if (isLoading || !formData) return <div className="p-8 text-center text-velour-grey text-sm">Loading CMS...</div>;

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const updateSection = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArrayItem = (section: string, index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const newArray = [...prev[section]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [section]: newArray };
    });
  };

  const addArrayItem = (section: string, emptyItem: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: [...prev[section], emptyItem]
    }));
  };

  const removeArrayItem = (section: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: prev[section].filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-normal">Site Content (CMS)</h1>
          <p className="text-sm text-velour-grey mt-1">Manage homepage text, images, and promotions</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="btn-primary flex items-center gap-2 px-6 py-2.5"
        >
          <Save size={16} />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Brand Statement */}
        <section className="bg-white border border-velour-ivory p-6">
          <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey mb-4">Brand Statement (Homepage Title)</h2>
          <div className="grid gap-4">
            <div>
              <label className="form-label">Tagline (Small text above)</label>
              <input
                value={formData.brandStatement.tagline}
                onChange={(e) => updateSection('brandStatement', 'tagline', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Main Heading</label>
              <textarea
                value={formData.brandStatement.heading}
                onChange={(e) => updateSection('brandStatement', 'heading', e.target.value)}
                rows={2}
                className="form-input resize-none"
              />
            </div>
            
            <div className="mt-2">
              <label className="form-label">Brand Perks (Below heading)</label>
              <div className="space-y-3">
                {formData.brandStatement.perks.map((perk: any, i: number) => (
                  <div key={i} className="flex gap-3 items-start bg-velour-off-white p-3 rounded-sm border border-velour-ivory">
                    <GripVertical size={16} className="text-velour-light-grey mt-2" />
                    <div className="flex-1 space-y-2">
                      <input
                        value={perk.label}
                        onChange={(e) => {
                          const newPerks = [...formData.brandStatement.perks];
                          newPerks[i].label = e.target.value;
                          updateSection('brandStatement', 'perks', newPerks);
                        }}
                        className="form-input text-sm"
                        placeholder="Label"
                      />
                      <input
                        value={perk.desc}
                        onChange={(e) => {
                          const newPerks = [...formData.brandStatement.perks];
                          newPerks[i].desc = e.target.value;
                          updateSection('brandStatement', 'perks', newPerks);
                        }}
                        className="form-input text-sm text-velour-grey"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Hero Banner (Sale) */}
        <section className="bg-white border border-velour-ivory p-6">
          <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey mb-4">Promotional Banner</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="form-label">Tag (e.g. Limited Time)</label>
                <input
                  value={formData.banner.tag}
                  onChange={(e) => updateSection('banner', 'tag', e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Title</label>
                <input
                  value={formData.banner.title}
                  onChange={(e) => updateSection('banner', 'title', e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Subtitle</label>
                <textarea
                  value={formData.banner.subtitle}
                  onChange={(e) => updateSection('banner', 'subtitle', e.target.value)}
                  rows={2}
                  className="form-input resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Button Text</label>
                  <input
                    value={formData.banner.cta}
                    onChange={(e) => updateSection('banner', 'cta', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Button Link</label>
                  <input
                    value={formData.banner.ctaHref}
                    onChange={(e) => updateSection('banner', 'ctaHref', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="form-label">Background Image URL</label>
              <div className="flex gap-2">
                <input
                  value={formData.banner.image}
                  onChange={(e) => updateSection('banner', 'image', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="mt-4 aspect-video bg-velour-ivory rounded-sm overflow-hidden flex items-center justify-center relative">
                {formData.banner.image ? (
                  <img src={formData.banner.image} alt="Banner preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-velour-grey opacity-50" size={32} />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-white">
                    <span className="text-[10px] tracking-widest uppercase block mb-2">{formData.banner.tag}</span>
                    <h3 className="font-display text-2xl">{formData.banner.title}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Collections */}
        <section className="bg-white border border-velour-ivory p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Hero Collections (Top)</h2>
            <button
              onClick={() => addArrayItem('hero', { id: `item-${Date.now()}`, title: 'New Collection', subtitle: '', href: '/shop', image: '', cta: 'Shop Now' })}
              className="text-xs text-velour-black flex items-center gap-1 hover:underline"
            >
              <Plus size={12} /> Add Hero Collection
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.hero.map((item: any, i: number) => (
              <div key={item.id || i} className="border border-velour-ivory p-4 relative bg-velour-off-white">
                <button
                  onClick={() => removeArrayItem('hero', i)}
                  className="absolute top-4 right-4 text-velour-grey hover:text-velour-error"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-velour-grey mb-1 block">Title</label>
                      <input
                        value={item.title}
                        onChange={(e) => updateArrayItem('hero', i, 'title', e.target.value)}
                        className="form-input text-sm py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-velour-grey mb-1 block">Subtitle</label>
                      <input
                        value={item.subtitle}
                        onChange={(e) => updateArrayItem('hero', i, 'subtitle', e.target.value)}
                        className="form-input text-sm py-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-velour-grey mb-1 block">Link URL</label>
                        <input
                          value={item.href}
                          onChange={(e) => updateArrayItem('hero', i, 'href', e.target.value)}
                          className="form-input text-sm py-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-velour-grey mb-1 block">Button Text</label>
                        <input
                          value={item.cta}
                          onChange={(e) => updateArrayItem('hero', i, 'cta', e.target.value)}
                          className="form-input text-sm py-1.5"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-velour-grey mb-1 block">Image URL</label>
                    <input
                      value={item.image}
                      onChange={(e) => updateArrayItem('hero', i, 'image', e.target.value)}
                      className="form-input text-sm py-1.5 mb-2"
                    />
                    {item.image && (
                      <div className="h-24 w-full bg-velour-ivory rounded-sm overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Category Tiles */}
        <section className="bg-white border border-velour-ivory p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Category Tiles</h2>
            <button
              onClick={() => addArrayItem('categoryTiles', { name: 'New Category', href: '/shop', image: '' })}
              className="text-xs text-velour-black flex items-center gap-1 hover:underline"
            >
              <Plus size={12} /> Add Tile
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {formData.categoryTiles.map((item: any, i: number) => (
              <div key={i} className="border border-velour-ivory p-3 relative">
                <button
                  onClick={() => removeArrayItem('categoryTiles', i)}
                  className="absolute top-2 right-2 text-velour-grey hover:text-velour-error z-10 bg-white rounded-sm p-1"
                >
                  <Trash2 size={14} />
                </button>
                
                <div className="aspect-[3/4] bg-velour-ivory mb-3 relative overflow-hidden group">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-velour-grey">No Image</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <input
                    value={item.name}
                    onChange={(e) => updateArrayItem('categoryTiles', i, 'name', e.target.value)}
                    className="form-input text-sm py-1"
                    placeholder="Tile Name"
                  />
                  <input
                    value={item.href}
                    onChange={(e) => updateArrayItem('categoryTiles', i, 'href', e.target.value)}
                    className="form-input text-xs py-1 font-mono text-velour-grey"
                    placeholder="/shop?category=..."
                  />
                  <input
                    value={item.image}
                    onChange={(e) => updateArrayItem('categoryTiles', i, 'image', e.target.value)}
                    className="form-input text-xs py-1 text-velour-grey"
                    placeholder="Image URL"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Global Perks */}
        <section className="bg-white border border-velour-ivory p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Footer Perks</h2>
            <button
              onClick={() => addArrayItem('perks', { icon: '✨', title: 'New Perk', sub: 'Description' })}
              className="text-xs text-velour-black flex items-center gap-1 hover:underline"
            >
              <Plus size={12} /> Add Perk
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {formData.perks.map((perk: any, i: number) => (
              <div key={i} className="flex gap-3 bg-velour-off-white p-3 border border-velour-ivory rounded-sm relative">
                <button
                  onClick={() => removeArrayItem('perks', i)}
                  className="absolute top-3 right-3 text-velour-grey hover:text-velour-error"
                >
                  <Trash2 size={14} />
                </button>
                
                <div>
                  <input
                    value={perk.icon}
                    onChange={(e) => updateArrayItem('perks', i, 'icon', e.target.value)}
                    className="form-input text-lg py-1 px-2 w-12 text-center"
                    title="Emoji Icon"
                  />
                </div>
                <div className="flex-1 space-y-2 pr-8">
                  <input
                    value={perk.title}
                    onChange={(e) => updateArrayItem('perks', i, 'title', e.target.value)}
                    className="form-input text-sm py-1 font-medium"
                    placeholder="Title"
                  />
                  <input
                    value={perk.sub}
                    onChange={(e) => updateArrayItem('perks', i, 'sub', e.target.value)}
                    className="form-input text-xs py-1 text-velour-grey"
                    placeholder="Subtitle"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
