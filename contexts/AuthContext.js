import { createContext, useContext, useEffect, useState } from 'react';
import { auth, api } from '../lib/supabase';

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

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { session: currentSession, error: sessionError } = await auth.getCurrentSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch user profile
          const { data: profile, error: profileError } = await api.getUserProfile();
          if (!profileError && profile?.user) {
            setUserProfile(profile.user);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      console.log('Previous user state:', user?.id);
      console.log('New session:', session);
      
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        console.log('User authenticated, fetching profile...');
        // Fetch user profile when user logs in
        const { data: profile, error: profileError } = await api.getUserProfile();
        if (!profileError && profile?.user) {
          console.log('Profile fetched successfully:', profile.user);
          setUserProfile(profile.user);
        } else {
          console.log('Profile fetch error:', profileError);
        }
      } else {
        console.log('User logged out, clearing profile');
        setUserProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      const { data, error } = await auth.signUp(email, password, userData);
      
      if (error) {
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
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
      const { data, error } = await auth.signIn(email, password);
      
      console.log('AuthContext: Sign in response:', { data, error });
      
      if (error) {
        console.log('AuthContext: Sign in failed:', error);
        return { success: false, error };
      }

      console.log('AuthContext: Sign in successful, user:', data?.user);
      return { success: true, data };
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await auth.signOut();
      
      if (error) {
        return { success: false, error };
      }

      setUser(null);
      setSession(null);
      setUserProfile(null);

      return { success: true };
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const { data, error } = await api.updateUserProfile(profileData);
      
      if (error) {
        return { success: false, error };
      }

      if (data?.user) {
        setUserProfile(data.user);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    try {
      const { data, error } = await api.getUserProfile();
      
      if (error) {
        console.error('Profile refresh error:', error);
        return;
      }

      if (data?.user) {
        setUserProfile(data.user);
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
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
    isAdmin: user?.user_metadata?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 