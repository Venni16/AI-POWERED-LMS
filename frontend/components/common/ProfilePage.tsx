'use client';

import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Mail, User, Briefcase, Calendar, Loader2, Edit, Save, X, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Label } from '../../src/components/ui/label';
import { Textarea } from '../../src/components/ui/textarea';

export default function ProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    specialization: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = () => {
    setFormData({
      name: user.name,
      email: user.email,
      bio: user.profile?.bio || '',
      specialization: user.profile?.specialization || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('bio', formData.bio);
      data.append('specialization', formData.specialization);
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      await updateProfile(data);
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const AvatarDisplay = ({ size = 'large' }: { size?: 'small' | 'large' }) => {
    const sizeClasses = size === 'large' ? 'w-16 h-16' : 'w-8 h-8';

    if (user.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className={`${sizeClasses} rounded-full object-cover border-2 border-gray-200`}
        />
      );
    }

    return (
      <div className={`${sizeClasses} bg-black rounded-full flex items-center justify-center shrink-0`}>
        <User className="w-8 h-8 text-white" />
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8 px-4 sm:px-0">
          <h1 className="text-4xl font-extrabold text-gray-900">My Profile</h1>
          {!isEditing && (
            <Button onClick={handleEdit} className="flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          )}
        </div>

        <Card className="shadow-lg border border-gray-200 mx-4 sm:mx-0">
          <CardHeader className="flex flex-row items-center space-x-4 p-6 border-b border-gray-100">
            {isEditing ? (
              <div className="flex flex-col items-center space-y-2">
                <AvatarDisplay />
                <div className="flex flex-col items-center space-y-1">
                  <Label htmlFor="avatar" className="cursor-pointer text-sm text-gray-600 hover:text-black">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Change Avatar
                  </Label>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  {avatarFile && (
                    <span className="text-xs text-green-600">{avatarFile.name}</span>
                  )}
                </div>
              </div>
            ) : (
              <AvatarDisplay />
            )}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full Name"
                  />
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                  />
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
                  <p className="text-sm text-gray-500 capitalize">{user.role} Account</p>
                </>
              )}
            </div>
            {isEditing && (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save</span>
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Mail className="w-5 h-5 text-black shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  {isEditing ? (
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-semibold text-gray-900">{user.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Briefcase className="w-5 h-5 text-black shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Role</p>
                  <p className="text-base font-semibold text-gray-900 capitalize">{user.role}</p>
                </div>
              </div>
              {user.profile?.specialization && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Briefcase className="w-5 h-5 text-black shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Specialization</p>
                    {isEditing ? (
                      <Input
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-base font-semibold text-gray-900">{user.profile.specialization}</p>
                    )}
                  </div>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Calendar className="w-5 h-5 text-black shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-2">Bio</p>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              ) : (
                <p className="text-gray-800 leading-relaxed">{user.profile?.bio || 'No bio provided.'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
