import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type StudentFormValues = {
  usn: string;
  password: string;
};

type AdminFormValues = {
  email: string;
  password: string;
};

type PasswordChangeFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const LoginForm = () => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [usnError, setUsnError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordUsn, setForgotPasswordUsn] = useState("");
  const navigate = useNavigate();

  const studentForm = useForm<StudentFormValues>({
    defaultValues: {
      usn: "",
      password: "",
    },
  });

  const adminForm = useForm<AdminFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const passwordChangeForm = useForm<PasswordChangeFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Check if this is first time admin login
  useEffect(() => {
    const adminLoginStatus = localStorage.getItem('adminCustomized');
    if (adminLoginStatus !== 'true') {
      setIsFirstTimeLogin(true);
    }
  }, []);

  // Validate USN length
  const validateUsn = (usn: string) => {
    if (usn.length > 11) {
      setUsnError("Warning: USN should not exceed 11 digits");
      return false;
    }
    setUsnError("");
    return true;
  };

  const handleStudentSubmit = async (data: StudentFormValues) => {
    try {
      setLoginAttempted(true);
      
      // Check if USN and password are provided
      if (!data.usn || !data.password) {
        toast.error("Please enter your USN and password");
        return;
      }
      
      // Validate USN length
      if (!validateUsn(data.usn)) {
        toast.warning("USN should not exceed 11 digits");
        return;
      }
      
      // Check if user exists and get their profile from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('usn', data.usn)
        .eq('role', 'student')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching student profile:', error);
        toast.error('Login failed. Please try again.');
        return;
      }
      
      if (!profile) {
        toast.error('Invalid USN or password');
        return;
      }
      
      // Check password (plain text storage)
      const storedPassword = profile.password || 'student123';
      if (data.password !== storedPassword) {
        toast.error('Invalid USN or password');
        return;
      }
      
      // Check if the account is approved
      if (profile.status === 'pending') {
        toast.error('Your account is pending admin approval. Please wait for approval.');
        return;
      }
      
      if (profile.status === 'declined') {
        toast.error('Your account has been declined. Please contact the administrator.');
        return;
      }
      
      if (profile.status !== 'approved') {
        toast.error('Your account is not approved. Please contact the administrator.');
        return;
      }
      
      // Create student session in localStorage
      const studentData = {
        id: profile.id,
        fullName: profile.full_name,
        usn: profile.usn,
        strandCourse: profile.strand_course || "",
        section: profile.section || "",
        level: profile.level || ""
      };
      
      // Store user data first, then navigate
      localStorage.setItem('studentUser', JSON.stringify(studentData));
      
      // Show welcome toast and navigate immediately
      toast.success(`Welcome back, ${profile.full_name}!`);
      
      // Use setTimeout to ensure navigation happens after state updates
      setTimeout(() => {
        navigate("/student-dashboard");
      }, 100);
    } catch (error) {
      console.error('Student login error:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const handleAdminSubmit = async (data: AdminFormValues) => {
    try {
      setLoginAttempted(true);
      console.log("Admin login attempt with:", data);
      
      // Check if email field is empty
      if (!data.email || data.email.trim() === "") {
        toast.error("Please enter your email address");
        return;
      }
      
      // Check if password field is empty  
      if (!data.password || data.password.trim() === "") {
        toast.error("Please enter your password");
        return;
      }
      
      // Fetch admin credentials from database
      const { data: adminCredentials, error } = await supabase
        .from('admin_credentials')
        .select('*')
        .eq('email', data.email.trim().toLowerCase())
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching admin credentials:", error);
        toast.error("Login failed. Please try again.");
        return;
      }
      
      if (!adminCredentials) {
        toast.error("Invalid email address. Please try again.");
        return;
      }
      
      // Compare password (plain text storage)
      if (data.password === adminCredentials.password_hash) {
        // Create a temporary admin profile in the profiles table for authentication
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: '00000000-0000-0000-0000-000000000000', // Fixed admin UUID
            full_name: 'JEROME SAMANTE',
            email: adminCredentials.email,
            role: 'admin',
            is_approved: true,
            usn: 'ADMIN001',
            level: 'admin',
            strand_course: 'Administration',
            section: 'Admin'
          }, { onConflict: 'user_id' });

        if (profileError) {
          console.error("Error creating admin profile:", profileError);
        }

        toast.success("Welcome, MR. JEROME SAMANTE!");
        localStorage.setItem('adminUser', JSON.stringify({
          name: "JEROME SAMANTE",
          email: adminCredentials.email,
          role: "Academic Head"
        }));
        navigate("/admin-dashboard");
      } else {
        toast.error("Invalid password. Please try again.");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const handlePasswordChange = (data: PasswordChangeFormValues) => {
    if (!data.email || !data.password || !data.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Store the new customized credentials
    localStorage.setItem('customizedAdminCredentials', JSON.stringify({
      email: data.email,
      password: data.password
    }));
    
    // Mark admin as customized
    localStorage.setItem('adminCustomized', 'true');
    
    toast.success("Credentials updated successfully!");
    navigate("/admin-dashboard");
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail || !forgotPasswordUsn) {
      toast.error("Please enter your email and USN");
      return;
    }

    try {
      // Find the user by email and USN
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', forgotPasswordEmail)
        .eq('usn', forgotPasswordUsn)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        toast.error("No user found with this email and USN combination");
        return;
      }

      // Create password reset request
      const { error: requestError } = await supabase
        .from('password_reset_requests')
        .insert({
          email: forgotPasswordEmail,
          usn: forgotPasswordUsn,
          full_name: user.full_name || 'Unknown',
          status: 'pending'
        });

      if (requestError) throw requestError;

      toast.success("Password reset request submitted! The admin will contact you soon.");
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
      setForgotPasswordUsn("");
    } catch (error) {
      console.error('Error submitting password reset request:', error);
      toast.error('Failed to submit password reset request');
    }
  };

  if (showForgotPassword) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
  
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email and USN to request a password reset
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@gmail.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="usn" className="block text-sm font-medium mb-1">USN</label>
              <Input
                id="usn"
                type="text"
                placeholder="Your USN"
                value={forgotPasswordUsn}
                onChange={(e) => setForgotPasswordUsn(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleForgotPassword} className="flex-1">
                Request Reset
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowForgotPassword(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showPasswordChange) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="aclc-logo">
              <img src="/lovable-uploads/c2ca72cb-3ab3-423b-95e0-80def32b3505.png" alt="ACLC Logo" className="w-24 h-24 object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Update Admin Credentials</CardTitle>
          <CardDescription className="text-center">
            For security reasons, please update your login credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordChangeForm}>
            <form onSubmit={passwordChangeForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordChangeForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="new.email@example.com" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordChangeForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordChangeForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full mt-2">Update Credentials</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-t-4 border-t-primary">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="aclc-logo">
            <img src="/lovable-uploads/logo.png" alt="ACLC Logo" className="w-24 h-24 object-contain" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Student Sign In</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...studentForm}>
          <form onSubmit={studentForm.handleSubmit(handleStudentSubmit)} className="space-y-4">
            <FormField
              control={studentForm.control}
              name="usn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>USN (University Student Number)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., S12345" 
                      {...field} 
                      required 
                      onChange={(e) => {
                        if (e.target.value.length <= 11) {
                          field.onChange(e);
                          validateUsn(e.target.value);
                        } else {
                          toast.warning("USN must be exactly 11 digits only");
                        }
                      }}
                    />
                  </FormControl>
                  {usnError && (
                    <div className="flex items-center text-amber-600 text-xs mt-1">
                      <AlertCircle size={12} className="mr-1" />
                      {usnError}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={studentForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password" 
                        {...field} 
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-2">Sign In as Student</Button>
          </form>
        </Form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/sign-up" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <a href="#" onClick={() => setShowForgotPassword(true)} className="text-primary hover:underline">
              Forgot password?
            </a>
          </p>
        </div>

        <div className="text-center mt-2 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Academic Head Login
          </p>
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => {
              // Show admin login form
              const adminLoginForm = document.getElementById('adminLoginForm');
              if (adminLoginForm) adminLoginForm.classList.toggle('hidden');
            }} 
            className="w-full"
          >
            Login as Academic Head
          </Button>
        </div>

        <div id="adminLoginForm" className="hidden mt-6 pt-4 border-t">
          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-4">
              <FormField
                control={adminForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email" 
                        {...field} 
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password" 
                          {...field} 
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full mt-2">Sign In as Academic Head</Button>
              
              {loginAttempted && (
                <p className="text-sm text-center mt-2 text-amber-600">
                  Please contact the administrator if you need assistance.
                </p>
              )}
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
