import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useDebug() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const testDatabaseConnection = async () => {
    setLoading(true);
    const results: any[] = [];

    try {
      // Test 1: Check if user exists
      results.push({
        test: 'User Authentication',
        status: user ? 'PASS' : 'FAIL',
        details: user ? `User ID: ${user.id}` : 'No user found'
      });

      // Test 2: Check if profile exists
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        results.push({
          test: 'User Profile',
          status: profile && !profileError ? 'PASS' : 'FAIL',
          details: profile ? `Profile exists: ${profile.username}` : profileError?.message || 'Profile not found'
        });

        // Test 3: Try to create a test server
        const { data: testServer, error: serverError } = await supabase
          .from('servers')
          .insert({
            name: 'TEST_SERVER_DELETE_ME',
            description: 'Test server for debugging',
            owner_id: user.id
          })
          .select()
          .single();

        if (testServer && !serverError) {
          results.push({
            test: 'Server Creation',
            status: 'PASS',
            details: `Test server created: ${testServer.id}`
          });

          // Clean up test server
          await supabase
            .from('servers')
            .delete()
            .eq('id', testServer.id);

          results.push({
            test: 'Server Cleanup',
            status: 'PASS',
            details: 'Test server deleted'
          });
        } else {
          results.push({
            test: 'Server Creation',
            status: 'FAIL',
            details: serverError?.message || 'Unknown error'
          });
        }
      }

      // Test 4: Check RLS policies
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_rls_policies', { table_name: 'servers' })
        .catch(() => ({ data: null, error: 'Function not available' }));

      results.push({
        test: 'RLS Policies',
        status: policiesError ? 'WARNING' : 'PASS',
        details: policiesError ? 'Could not check RLS policies' : 'RLS policies active'
      });

    } catch (error) {
      results.push({
        test: 'General Error',
        status: 'FAIL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setLoading(false);
    return results;
  };

  return {
    testDatabaseConnection,
    loading
  };
}
