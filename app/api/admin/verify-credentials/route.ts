import { NextRequest, NextResponse } from 'next/server';
import { verifySupabaseAdminAuth } from '@/lib/verifyAdminAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const result = await verifySupabaseAdminAuth(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Verification error' },
      { status: 500 }
    );
  }
}
