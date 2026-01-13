import { createClient } from '@/lib/supabase/client'

export async function getUserLanguage(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('language')
    .eq('id', userId);

  if (error) {
    console.error('Error fetching user language:', error);
    return 'en';
  }

  return data.length > 0 ? data[0].language : 'en';
}
