import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminProfile = () => {
  const [profile, setProfile] = useState({
    name: "JEROME SAMANTE",
    email: "",
    position: "Academic Head"
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdminCredentials();
  }, []);

  const loadAdminCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_credentials')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading admin credentials:', error);
        return;
      }

      if (data) {
        setProfile(prev => ({
          ...prev,
          email: data.email
        }));
      }
    } catch (error) {
      console.error('Error loading admin credentials:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, get the current admin record
      const { data: currentAdmin, error: fetchError } = await supabase
        .from('admin_credentials')
        .select('id, email')
        .single();

      if (fetchError) {
        console.error('Error fetching admin:', fetchError);
        toast.error('Failed to fetch admin data');
        return;
      }

      // Update email in database using the admin record
      const { error } = await supabase
        .from('admin_credentials')
        .update({ 
          email: profile.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAdmin.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return;
      }

      // Update localStorage admin user data
      localStorage.setItem('adminUser', JSON.stringify({
        name: profile.name,
        email: profile.email,
        role: "Academic Head"
      }));

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (password.new !== password.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (password.current === "") {
      toast.error("Please enter your current password");
      return;
    }

    if (password.new.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // First, get the current admin record to verify current password
      const { data: currentAdmin, error: fetchError } = await supabase
        .from('admin_credentials')
        .select('*')
        .single();

      if (fetchError || !currentAdmin) {
        toast.error("Failed to verify current password");
        setLoading(false);
        return;
      }

      // Check if current password matches
      if (password.current !== currentAdmin.password_hash) {
        toast.error("Current password is incorrect");
        setLoading(false);
        return;
      }

      // Update password in database
      const { error } = await supabase
        .from('admin_credentials')
        .update({ 
          password_hash: password.new,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAdmin.id);

      if (error) {
        console.error('Error updating password:', error);
        toast.error('Failed to update password');
        return;
      }

      // Reset password fields
      setPassword({ current: "", new: "", confirm: "" });
      toast.success("Password updated successfully");
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleProfileUpdate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                readOnly
              />
              <p className="text-xs text-muted-foreground">Your name cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input 
                id="position" 
                value={profile.position}
                onChange={(e) => setProfile({...profile, position: e.target.value})}
                readOnly
              />
              <p className="text-xs text-muted-foreground">Your position cannot be changed</p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to maintain account security</CardDescription>
        </CardHeader>
        
        <form onSubmit={handlePasswordUpdate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password" 
                type="password"
                value={password.current}
                onChange={(e) => setPassword({...password, current: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password"
                value={password.new}
                onChange={(e) => setPassword({...password, new: e.target.value})}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password" 
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({...password, confirm: e.target.value})}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminProfile;