import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Backend API'ye isteği yönlendir
    const backendResponse = await fetch('YOUR_BACKEND_API_URL/api/mockups', {
      method: 'POST',
      body: formData,
    });

    const data = await backendResponse.json();
    
    if (!backendResponse.ok) {
      throw new Error(data.message || 'Failed to create mockup');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in mockups API route:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 