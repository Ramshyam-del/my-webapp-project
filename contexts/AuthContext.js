import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setError(null);
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (!isMounted) return;
        
        setSession(currentSession || null);
        setUser(currentSession?.user || null);
        
        if (currentSession?.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
            
            if (!isMounted) return;
            
            if (profileError) {
              console.warn('Profile fetch error:', profileError);
              // Don't set error for profile issues, just continue without profile
            } else if (profile) {
              setUserProfile(profile);
            }
          } catch (profileError) {
            console.warn('Profile error:', profileError);
            // Continue without profile
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      
      try {
        setError(null);
        setSession(nextSession || null);
        setUser(nextSession?.user || null);
        
        if (nextSession?.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', nextSession.user.id)
              .single();
            
            if (!isMounted) return;
            
            if (profileError) {
              console.warn('Profile fetch error:', profileError);
            } else if (profile) {
              setUserProfile(profile);
            }
          } catch (profileError) {
            console.warn('Profile error:', profileError);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError(error.message);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      console.log('AuthContext: Starting sign in process...');
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('AuthContext: Sign in response:', { data, error });
      
      if (error) {
        console.log('AuthContext: Sign in failed:', error);
        setError(error.message);
        return { success: false, error };
      }

      console.log('AuthContext: Sign in successful, user:', data?.user);
      return { success: true, data };
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      setUser(null);
      setSession(null);
      setUserProfile(null);

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user?.id)
        .select()
        .single();
      
      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      if (data) {
        setUserProfile(data);
      }

      return { success: true, data };
    } catch (error) {
      setError(error.message);
      return { success: false, error };
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        console.error('Profile refresh error:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 