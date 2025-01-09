import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
    
    // Authorization header'ını al
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header is missing' },
        { status: 401 }
      );
    }
    
    // Backend API'ye isteği yönlendir
    const backendResponse = await fetch(`${API_URL}/api/Mockup`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: formData,
    });

    const responseText = await backendResponse.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid response from server');
    }
    
    if (!backendResponse.ok) {
      throw new Error(data.message || 'Failed to create mockup');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in mockups API route:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 