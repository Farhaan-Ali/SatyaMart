import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'supplier' | 'vendor' | 'superadmin';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  company_name?: string;
  business_name?: string;
  business_type?: string;
  business_address?: string;
  contact_number?: string;
  fssai_license?: string;
  other_certifications?: string[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role and profile data
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (roleError) throw roleError;
      setUserRole(roleData);
      let profileData = null;
      if (roleData?.role === 'supplier') {
        const { data, error } = await supabase
          .from('supplier_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (error) throw error;
        profileData = data;
      } else if (roleData?.role === 'vendor') {
        const { data, error } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (error) throw error;
        profileData = data;
      }
      setUserProfile(profileData);
    } catch (error: any) {
      setErrorMsg('Failed to fetch user data. Please try again.');
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) setErrorMsg(error.message);
    setLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    setLoading(true);
    setErrorMsg(null);
    const redirectUrl = `${window.location.origin}/`;
    const isHardcodedSuperadmin = email.toLowerCase() === 'fieronrhys@gmail.com';
    // Check for existing user role/profile
    const { data: existingRole } = await supabase.from('user_roles').select('*').eq('user_id', userData.id).single();
    if (existingRole) {
      setErrorMsg('User role already exists.');
      setLoading(false);
      return { error: { message: 'User role already exists.' } };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const finalRole = isHardcodedSuperadmin ? 'superadmin' : userData.role;
        // Insert user role
        await supabase.from('user_roles').insert({
          user_id: user.id,
          role: finalRole,
          approval_status: (finalRole === 'supplier' && !isHardcodedSuperadmin) ? 'pending' : 'approved'
        });
        // Insert into the correct profile table
        if (finalRole === 'supplier') {
          await supabase.from('supplier_profiles').insert({
            user_id: user.id,
            full_name: userData.full_name,
            business_name: userData.business_name,
            business_type: userData.business_type,
            business_address: userData.business_address,
            contact_number: userData.contact_number,
            fssai_license: userData.fssai_license,
            other_certifications: userData.other_certifications,
            avatar_url: userData.avatar_url
          });
          
          // Also create a suppliers record for backward compatibility
          await supabase.from('suppliers').insert({
            user_id: user.id,
            name: userData.business_name,
            contact_email: userData.contact_number,
            address: userData.business_address,
            status: 'active'
          });
        } else if (finalRole === 'vendor') {
          await supabase.from('vendor_profiles').insert({
            user_id: user.id,
            full_name: userData.full_name,
            company_name: userData.company_name,
            contact_number: userData.contact_number,
            avatar_url: userData.avatar_url
          });
        }
      }
    } else {
      setErrorMsg(error.message);
    }
    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserRole(null);
      setUserProfile(null);
    } else {
      setErrorMsg(error.message);
    }
    setLoading(false);
    return { error };
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setErrorMsg(error.message);
    setLoading(false);
    return { error };
  };

  const verifyEmail = async () => {
    setLoading(true);
    setErrorMsg(null);
    // Supabase handles email verification automatically, but you can resend
    const { error } = await supabase.auth.resend({ type: 'signup' });
    if (error) setErrorMsg(error.message);
    setLoading(false);
    return { error };
  };

  const isAuthenticated = !!user;
  const isApproved = userRole?.approval_status === 'approved' || userRole?.role !== 'supplier';
  
  return {
    user,
    session,
    userRole,
    userProfile,
    loading,
    errorMsg,
    isAuthenticated,
    isApproved,
    signIn,
    signUp,
    signOut,
    fetchUserData,
    resetPassword,
    verifyEmail
  };
};