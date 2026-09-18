import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ChevronLeft, Upload } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';
import { useState, useRef, useEffect } from 'react';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', '44', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', 'Free Size', 'One Size'];

const schema = z.object({
  name: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required'),
  description: z.string().min(10, 'Min 10 characters'),
  categoryId: z.string().min(1, 'Required'),
  brand: z.string().min(1),
  clothingType: z.string().min(1, 'Required'),
  basePrice: z.number().min(1),
  salePrice: z.number().optional().nullable(),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isActive: z.boolean(),
  tags: z.string().optional(),
  variants: z.array(z.object({
    size: z.string().min(1),
    color: z.string().min(1),
    colorHex: z.string().optional(),
    sku: z.string().min(1),
    stock: z.number().min(0),
  })).min(1, 'At least one variant'),
});

type FormData = z.infer<typeof schema>;

export default function AdminProductForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const { data: catData } = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => adminService.getCategories() });
  const categories = catData?.data?.data || [];

  const { data: typesData } = useQuery({ queryKey: ['admin', 'clothing-types'], queryFn: () => adminService.getClothingTypes() });
  const clothingTypes: string[] = typesData?.data?.data || ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Dresses', 'Skirts', 'Jackets', 'Hoodies', 'Accessories'];

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { brand: 'He & She', isFeatured: false, isNewArrival: false, isActive: true, variants: [{ size: 'M', color: 'Black', colorHex: '#000000', sku: '', stock: 10 }] },
  });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => adminService.getProduct(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (productData?.data?.data) {
      const p = productData.data.data;
      reset({
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: p.categoryId,
        brand: p.brand,
        clothingType: p.clothingType || '',
        basePrice: Number(p.basePrice),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        isFeatured: p.isFeatured,
        isNewArrival: p.isNewArrival,
        isActive: p.isActive,
        tags: p.tags || '',
        variants: p.variants?.length ? p.variants.map((v: any) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          sku: v.sku,
          stock: v.stock,
        })) : [{ size: 'M', color: 'Black', colorHex: '#000000', sku: '', stock: 10 }],
      });
      // Optionally handle existing images preview
    }
  }, [productData, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  const productName = watch('name');
  const generateSlug = () => {
    if (productName) setValue('slug', productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [] };
      const res = await adminService.createProduct(payload);
      if (imageFiles.length > 0) {
        await adminService.uploadImages(res.data.data.id, imageFiles);
      }
      return res;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); toast.success('Product created'); navigate('/admin/products'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => adminService.updateProduct(id!, { ...data, tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); toast.success('Product updated'); navigate('/admin/products'); },
    onError: () => toast.error('Failed to update product'),
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && productLoading) {
    return <div className="p-8 text-center text-velour-grey">Loading product...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/products" className="text-velour-grey hover:text-velour-black"><ChevronLeft size={20} /></Link>
        <h1 className="font-display text-2xl font-normal">{isEditing ? 'Edit Product' : 'Add Product'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">
        {/* Main Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-velour-ivory p-6 space-y-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Basic Information</h2>
            <div>
              <label className="form-label">Product Name *</label>
              <input {...register('name')} onBlur={generateSlug} className="form-input" placeholder="Classic Oxford Shirt" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Slug (URL) *</label>
              <input {...register('slug')} className="form-input" placeholder="classic-oxford-shirt" />
              {errors.slug && <p className="form-error">{errors.slug.message}</p>}
            </div>
            <div>
              <label className="form-label">Description *</label>
              <textarea {...register('description')} rows={4} className="form-input resize-none" placeholder="Product description..." />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>
            <div>
              <label className="form-label">Tags (comma-separated)</label>
              <input {...register('tags')} className="form-input" placeholder="cotton, casual, summer" />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-velour-ivory p-6 space-y-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Base Price (₹) *</label>
                <input type="number" {...register('basePrice', { valueAsNumber: true })} className="form-input" placeholder="1999" />
                {errors.basePrice && <p className="form-error">{errors.basePrice.message}</p>}
              </div>
              <div>
                <label className="form-label">Sale Price (₹)</label>
                <input type="number" {...register('salePrice', { valueAsNumber: true })} className="form-input" placeholder="Leave empty if no sale" />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white border border-velour-ivory p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Variants (Size + Colour + Stock)</h2>
              <button type="button" onClick={() => append({ size: 'M', color: '', colorHex: '#000000', sku: '', stock: 10 })} className="btn-ghost text-xs flex items-center gap-1">
                <Plus size={14} /> Add Variant
              </button>
            </div>
            {errors.variants && <p className="form-error mb-2">{(errors.variants as any)?.message}</p>}
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="form-label">Size</label>
                    <select {...register(`variants.${idx}.size`)} className="form-input py-2 text-sm">
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Colour</label>
                    <input {...register(`variants.${idx}.color`)} className="form-input py-2 text-sm" placeholder="Black" />
                  </div>
                  <div>
                    <label className="form-label">Hex</label>
                    <input type="color" {...register(`variants.${idx}.colorHex`)} className="form-input py-1 h-10 cursor-pointer" />
                  </div>
                  <div>
                    <label className="form-label">SKU</label>
                    <input {...register(`variants.${idx}.sku`)} className="form-input py-2 text-sm" placeholder="SKU-001" />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="form-label">Stock</label>
                      <input type="number" {...register(`variants.${idx}.stock`, { valueAsNumber: true })} className="form-input py-2 text-sm" placeholder="10" />
                    </div>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-velour-error p-2 mb-0.5">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white border border-velour-ivory p-6">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey mb-4">Product Images</h2>
            <div
              className="border-2 border-dashed border-velour-light-grey p-8 text-center cursor-pointer hover:border-velour-black transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={24} className="mx-auto text-velour-grey mb-2" />
              <p className="text-sm text-velour-grey">Click to upload or drag & drop</p>
              <p className="text-xs text-velour-grey mt-1">JPEG, PNG, WebP — max 5MB each</p>
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} />
            </div>
            
            {/* Show existing images when editing */}
            {isEditing && productData?.data?.data?.images?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-velour-grey mb-2">Current Images</p>
                <div className="flex gap-2 flex-wrap">
                  {productData?.data?.data?.images.map((img: any) => (
                    <div key={img.id} className="w-16 h-20 bg-velour-ivory overflow-hidden relative group border border-velour-ivory">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.isPrimary && (
                        <div className="absolute bottom-0 inset-x-0 bg-velour-black text-white text-[9px] text-center py-0.5">Primary</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show new uploads */}
            {imageFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-velour-grey mb-2">New Uploads</p>
                <div className="flex gap-2 flex-wrap">
                  {imageFiles.map((f, i) => (
                    <div key={i} className="w-16 h-20 bg-velour-ivory overflow-hidden relative border border-velour-ivory">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-white text-velour-error p-0.5 shadow-sm rounded-sm"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organisation */}
          <div className="bg-white border border-velour-ivory p-5 space-y-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Organisation</h2>
            <div>
              <label className="form-label">Category *</label>
              <select {...register('categoryId')} className="form-input">
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="form-error">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="form-label">Clothing Type *</label>
              <select {...register('clothingType')} className="form-input">
                <option value="">Select type</option>
                {clothingTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.clothingType && <p className="form-error">{errors.clothingType.message}</p>}
            </div>
            <div>
              <label className="form-label">Brand</label>
              <input {...register('brand')} className="form-input" defaultValue="He & She" />
            </div>
          </div>

          {/* Flags */}
          <div className="bg-white border border-velour-ivory p-5 space-y-3">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Flags</h2>
            {[
              { name: 'isActive', label: 'Active (visible on store)' },
              { name: 'isFeatured', label: 'Featured Product' },
              { name: 'isNewArrival', label: 'New Arrival' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" {...register(name as any)} className="w-4 h-4 accent-velour-black" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          {/* Submit */}
          <button type="submit" disabled={isPending} className="btn-primary w-full py-3.5">
            {isPending ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
}
