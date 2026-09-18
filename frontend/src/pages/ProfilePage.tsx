import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { userService } from '../services';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const addressSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().min(10, 'Valid phone required'),
  line1: z.string().min(1, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  pincode: z.string().min(6, 'Valid pincode required'),
  isDefault: z.boolean().optional(),
});

export default function ProfilePage() {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: addressData } = useQuery({ queryKey: ['addresses'], queryFn: () => userService.getAddresses() });
  const addresses = addressData?.data?.data || [];

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { firstName: user?.firstName, lastName: user?.lastName } });
  const addressForm = useForm({ resolver: zodResolver(addressSchema) });

  const pincode = addressForm.watch('pincode');

  useEffect(() => {
    if (pincode?.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data[0]?.Status === 'Success') {
            const details = data[0].PostOffice[0];
            addressForm.setValue('city', details.District, { shouldValidate: true });
            addressForm.setValue('state', details.State, { shouldValidate: true });
          }
        })
        .catch(() => {
          // ignore network errors silently for auto-fill
        });
    }
  }, [pincode, addressForm]);

  const profileMutation = useMutation({
    mutationFn: (d: any) => userService.updateProfile(d),
    onSuccess: (res) => { updateUser(res.data.data); toast.success('Profile updated'); },
    onError: () => toast.error('Failed to update profile'),
  });

  const addAddressMutation = useMutation({
    mutationFn: (d: any) => userService.addAddress(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setShowAddressForm(false); toast.success('Address added'); addressForm.reset(); },
    onError: () => toast.error('Failed to add address'),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => userService.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-3xl font-normal text-velour-black mb-8">My Profile</h1>

      {/* Profile Details */}
      <section className="border border-velour-ivory p-6 mb-8">
        <h2 className="text-sm font-medium tracking-wider uppercase mb-5">Personal Information</h2>
        <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input {...profileForm.register('firstName')} className="form-input" />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input {...profileForm.register('lastName')} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input value={user?.email} disabled className="form-input bg-velour-off-white text-velour-grey cursor-not-allowed" />
          </div>
          <div>
            <label className="form-label">Phone (optional)</label>
            <input {...profileForm.register('phone')} className="form-input" placeholder="+91 00000 00000" />
          </div>
          <button type="submit" disabled={profileMutation.isPending} className="btn-primary px-8 py-2.5">
            {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* Addresses */}
      <section className="border border-velour-ivory p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium tracking-wider uppercase">Saved Addresses</h2>
          <button onClick={() => setShowAddressForm((v) => !v)} className="btn-ghost text-xs flex items-center gap-1.5">
            <Plus size={14} /> Add Address
          </button>
        </div>

        {showAddressForm && (
          <form onSubmit={addressForm.handleSubmit(d => addAddressMutation.mutate(d))} className="border border-velour-ivory p-4 mb-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="form-label">First Name</label><input {...addressForm.register('firstName')} className="form-input" />{addressForm.formState.errors.firstName && <p className="form-error">{addressForm.formState.errors.firstName.message}</p>}</div>
              <div><label className="form-label">Last Name</label><input {...addressForm.register('lastName')} className="form-input" /></div>
            </div>
            <div><label className="form-label">Phone</label><input {...addressForm.register('phone')} className="form-input" /></div>
            <div><label className="form-label">Address Line 1</label><input {...addressForm.register('line1')} className="form-input" /></div>
            <div><label className="form-label">Address Line 2 (optional)</label><input {...addressForm.register('line2')} className="form-input" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="form-label">City</label><input {...addressForm.register('city')} className="form-input" /></div>
              <div><label className="form-label">State</label><input {...addressForm.register('state')} className="form-input" /></div>
              <div><label className="form-label">Pincode</label><input {...addressForm.register('pincode')} className="form-input" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...addressForm.register('isDefault')} className="accent-velour-black" />
              Set as default address
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={addAddressMutation.isPending} className="btn-primary px-6 py-2">
                {addAddressMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowAddressForm(false)} className="btn-secondary px-6 py-2">Cancel</button>
            </div>
          </form>
        )}

        {addresses.length === 0 ? (
          <p className="text-sm text-velour-grey">No saved addresses yet.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr: any) => (
              <div key={addr.id} className={`p-4 border ${addr.isDefault ? 'border-velour-black' : 'border-velour-ivory'}`}>
                <div className="flex justify-between">
                  <div className="text-sm">
                    {addr.isDefault && <span className="badge-black text-2xs mb-2 mr-2">Default</span>}
                    <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                    <p className="text-velour-grey">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-velour-grey">{addr.city}, {addr.state} — {addr.pincode}</p>
                    <p className="text-velour-grey">{addr.phone}</p>
                  </div>
                  <button onClick={() => deleteAddressMutation.mutate(addr.id)} className="text-velour-grey hover:text-velour-error transition-colors p-1 h-fit">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
