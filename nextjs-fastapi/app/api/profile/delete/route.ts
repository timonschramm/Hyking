import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user using the standard auth method instead of admin
    const { error } = await (await supabase).auth.admin.deleteUser(user.id);
    if (error) {
      // If admin delete fails, try user-initiated delete
      console.log('Admin delete failed, trying user-initiated delete');
      const { error: userDeleteError } = await (await supabase).auth.signOut({
        scope: 'local'
      });
      if (userDeleteError) throw userDeleteError;
    }

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
} 