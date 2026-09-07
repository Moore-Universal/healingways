'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, Check } from 'lucide-react';
import { 
  getStoredUser, 
  getUserProfileByUid, 
  saveUserProfile, 
  logoutUser 
} from '@/app/lib/firebase/services';

export default function ProfileView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Personal Information State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Nigeria',
    preferredContact: 'Email',
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    whatsapp: false,
  });

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const stored = getStoredUser();
        const uid = stored?.uid;

        let name = stored?.fullName || '';
        let email = stored?.email || '';
        let phone = '';
        let country = 'Nigeria';

        if (uid) {
          const profile = await getUserProfileByUid(uid);
          if (profile) {
            name = profile.fullName || name;
            email = profile.email || email;
            phone = profile.phone || phone;
            country = profile.country || country;
          }
        }

        setFormData({
          fullName: name,
          email: email,
          phone: phone,
          country: country,
          preferredContact: 'Email',
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const stored = getStoredUser();
      const uid = stored?.uid;
      const email = stored?.email || 'user@example.com';

      if (uid) {
        await saveUserProfile({
          uid,
          email,
          fullName: formData.fullName,
          phone: formData.phone,
          country: formData.country,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    router.push('/login');
  };

  const initialLetter = formData.fullName ? formData.fullName.charAt(0).toUpperCase() : (formData.email ? formData.email.charAt(0).toUpperCase() : 'U');

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen p-6 sm:p-10 space-y-8 max-w-4xl">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-5">
        <h1 className="text-xl font-bold text-blue-900">Profile</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Website
          </Link>
          <button className="p-2 text-gray-500 hover:text-gray-700 relative rounded-full hover:bg-slate-100">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {initialLetter}
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">Profile</h2>
        <p className="text-xs sm:text-sm text-gray-500">
          Manage your personal information and communication preferences.
        </p>
      </div>

      {/* Main Form & Content Cards */}
      <div className="space-y-6 max-w-xl">
        
        {/* Personal Information Card */}
        <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-2">
            PERSONAL INFORMATION
          </span>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs"
            />
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs"
            />
          </div>

          {/* Preferred Contact Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Preferred Contact Method
            </label>
            <select
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs cursor-pointer"
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="SMS">SMS</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Profile updated successfully!
              </span>
            )}
          </div>
        </form>

        {/* Notification Preferences Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-2">
            NOTIFICATION PREFERENCES
          </span>

          <div className="space-y-4">
            {/* Email Notifications Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggle('email')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.email ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifications.email ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-slate-900 font-bold">
                Email notifications
              </span>
            </div>

            {/* SMS Notifications Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggle('sms')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.sms ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifications.sms ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-slate-900 font-bold">
                SMS notifications
              </span>
            </div>

            {/* WhatsApp Notifications Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggle('whatsapp')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.whatsapp ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifications.whatsapp ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-slate-900 font-bold">
                WhatsApp notifications
              </span>
            </div>
          </div>
        </div>

        {/* Log Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="px-6 py-2.5 bg-white hover:bg-emerald-50 border border-emerald-600 text-emerald-700 font-semibold text-xs sm:text-sm rounded-lg transition-colors"
          >
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
}