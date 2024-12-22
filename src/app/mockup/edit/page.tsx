'use client';

import React, { useEffect } from 'react';
import * as fabric from 'fabric';
import Layout from '@/components/Layouts/DefaultLayout';
import { useSearchParams } from 'next/navigation';

enum TshirtCategory {
  TSHIRT = 'Tshirt',
  SWEATSHIRT = 'Sweatshirt',
  HOODIE = 'Hoodie',
  RACERBACK = 'Racerback',
  LONGSLEEVE = 'Longsleeve'
}

enum SizeCategory {
  ADULT = 'Adult',
  TODDLER = 'Toddler',
  YOUTH = 'Youth',
  ONESIE = 'Onesie'
}

enum GenderCategory {
  MALE = 'Male',
  FEMALE = 'Female',
  UNISEX = 'Unisex'
}

enum DesignColor {
  BLACK = 'Black',
  WHITE = 'White',
  COLOR = 'Color'
}

interface DesignArea {
  name?: string;
  left: number;
  top: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  angle: number;
}

interface DesignRect extends fabric.Rect {
  designAreaName?: string;
}

const Alert = ({ message, type }: { message: string; type: string }) => {
  let alertStyle = '';
  let iconBg = '';
  let textColor = '';
  let icon = null;

  switch (type) {
    case 'error':
      alertStyle = 'border-[#F87171] bg-[#F87171] bg-opacity-[15%]';
      iconBg = 'bg-[#F87171]';
      textColor = 'text-[#B45454]';
      icon = (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.4917 7.65579L11.106 12.2645C11.2545 12.4128 11.4715 12.5 11.6738 12.5C11.8762 12.5 12.0931 12.4128 12.2416 12.2645C12.5621 11.9445 12.5623 11.4317 12.2423 11.1114C12.2422 11.1113 12.2422 11.1113 12.2422 11.1113C12.242 11.1111 12.2418 11.1109 12.2416 11.1107L7.64539 6.50351L12.2589 1.91221L12.2595 1.91158C12.5802 1.59132 12.5802 1.07805 12.2595 0.757793C11.9393 0.437994 11.4268 0.437869 11.1064 0.757418C11.1063 0.757543 11.1062 0.757668 11.106 0.757793L6.49234 5.34931L1.89459 0.740581L1.89396 0.739942C1.57364 0.420019 1.0608 0.420019 0.740487 0.739944C0.42005 1.05999 0.419837 1.57279 0.73985 1.89309L6.4917 7.65579ZM6.4917 7.65579L1.89459 12.2639L1.89395 12.2645C1.74546 12.4128 1.52854 12.5 1.32616 12.5C1.12377 12.5 0.906853 12.4128 0.758361 12.2645L1.1117 11.9108L0.758358 12.2645C0.437984 11.9445 0.437708 11.4319 0.757539 11.1116C0.757812 11.1113 0.758086 11.111 0.75836 11.1107L5.33864 6.50287L0.740487 1.89373L6.4917 7.65579Z" fill="#ffffff" stroke="#ffffff"></path>
        </svg>
      );
      break;
    case 'success':
      alertStyle = 'border-[#34D399] bg-[#34D399] bg-opacity-[15%]';
      iconBg = 'bg-[#34D399]';
      textColor = 'text-black dark:text-[#34D399]';
      icon = (
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.2984 0.826822L15.2868 0.811827L15.2741 0.797751C14.9173 0.401867 14.3238 0.400754 13.9657 0.794406L5.91888 9.45376L2.05667 5.2868C1.69856 4.89287 1.10487 4.89389 0.747996 5.28987C0.417335 5.65675 0.417335 6.22337 0.747996 6.59026L0.747959 6.59029L0.752701 6.59541L4.86742 11.0348C5.14445 11.3405 5.52858 11.5 5.89581 11.5C6.29242 11.5 6.65178 11.3355 6.92401 11.035L15.2162 2.11161C15.5833 1.74452 15.576 1.18615 15.2984 0.826822Z" fill="white" stroke="white"></path>
        </svg>
      );
      break;
    case 'warning':
      alertStyle = 'border-warning bg-warning bg-opacity-[15%]';
      iconBg = 'bg-warning';
      textColor = 'text-[#9D5425]';
      icon = (
        <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.50493 16H17.5023C18.6204 16 19.3413 14.9018 18.8354 13.9735L10.8367 0.770573C10.2852 -0.256858 8.70677 -0.256858 8.15528 0.770573L0.156617 13.9735C-0.334072 14.8998 0.386764 16 1.50493 16ZM10.7585 12.9298C10.7585 13.6155 10.2223 14.1433 9.45583 14.1433C8.6894 14.1433 8.15311 13.6155 8.15311 12.9298V12.9015C8.15311 12.2159 8.6894 11.688 9.45583 11.688C10.2223 11.688 10.7585 12.2159 10.7585 12.9015V12.9298ZM8.75236 4.01062H10.2548C10.6674 4.01062 10.9127 4.33826 10.8671 4.75288L10.2071 10.1186C10.1615 10.5049 9.88572 10.7455 9.50142 10.7455C9.11929 10.7455 8.84138 10.5028 8.79579 10.1186L8.13574 4.75288C8.09449 4.33826 8.33984 4.01062 8.75236 4.01062Z" fill="#FBBF24"></path>
        </svg>
      );
      break;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <div className={`flex w-full max-w-[400px] border-l-6 px-7 py-8 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30 md:p-9 ${alertStyle}`}>
        <div className={`mr-5 flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div className="w-full">
          <h5 className={`mb-3 font-semibold ${textColor}`}>
            {message}
          </h5>
        </div>
      </div>
    </div>
  );
};

const EditMockupPage = () => {
  const searchParams = useSearchParams();
  const mockupId = searchParams.get('mockupId');
  
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = React.useState<fabric.Canvas | null>(null);
  const [rectangle, setRectangle] = React.useState<fabric.Group | null>(null);

  const [formData, setFormData] = React.useState({
    name: '',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    angle: 0,
    category: '',
    tshirtCategory: TshirtCategory.TSHIRT,
    sizeCategory: SizeCategory.ADULT,
    genderCategory: GenderCategory.UNISEX,
    designColor: DesignColor.BLACK,
    imageFile: null as File | null
  });

  const [alertState, setAlertState] = React.useState<{
    show: boolean;
    message: string;
    type: 'error' | 'success' | 'warning';
  }>({
    show: false,
    message: '',
    type: 'error'
  });

  useEffect(() => {
    if (canvasRef.current) {
      if (canvas) {
        canvas.dispose();
      }

      const newCanvas = new fabric.Canvas(canvasRef.current, {
        width: 500,
        height: 500,
        backgroundColor: '#ffffff'
      });
      setCanvas(newCanvas);

      const rect = new fabric.Rect({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        fill: 'black',
        strokeWidth: 0,
        originX: 'center',
        originY: 'center'
      }) as DesignRect;

      rect.designAreaName = 'Default Area';

      const text = new fabric.Text('Default Area', {
        fontSize: 14,
        fill: 'white',
        originX: 'center',
        originY: 'center'
      });

      const group = new fabric.Group([rect, text], {
        left: 200,
        top: 200,
        width: rect.width,
        height: rect.height,
        originX: 'center',
        originY: 'center'
      });

      newCanvas.add(group);

      return () => {
        newCanvas.dispose();
      };
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvas) {
      setFormData(prev => ({
        ...prev,
        imageFile: file
      }));

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && canvas) {
          const img = new Image();
          img.src = event.target.result as string;
          img.onload = () => {
            const fabricImage = new fabric.Image(img);
            
            const scale = Math.min(
              canvas.width! / fabricImage.width!,
              canvas.height! / fabricImage.height!
            );
            
            fabricImage.scale(scale);
            fabricImage.set({
              left: (canvas.width! - fabricImage.width! * scale) / 2,
              top: (canvas.height! - fabricImage.height! * scale) / 2,
              selectable: false,
              evented: false
            });
            
            // Tüm mevcut grupları sakla
            const groups = canvas.getObjects().filter(obj => obj instanceof fabric.Group);
            
            // Canvas'ı temizle
            canvas.clear();
            
            // Önce resmi ekle
            canvas.add(fabricImage);
            
            // Sonra tüm grupları tekrar ekle
            groups.forEach(group => {
              canvas.add(group);
            });
            
            canvas.renderAll();
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addDesignArea = async (mockupId: number, rect: DesignRect) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      const response = await fetch(`${API_URL}/api/mockups/${mockupId}/design-areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: rect.designAreaName || `Design Area ${Date.now()}`,
          left: Math.round(rect.left || 0),
          top: Math.round(rect.top || 0),
          centerX: Math.round((rect.left || 0) + ((rect.width || 0) * (rect.scaleX || 1)) / 2),
          centerY: Math.round((rect.top || 0) + ((rect.height || 0) * (rect.scaleY || 1)) / 2),
          width: Math.round((rect.width || 0) * (rect.scaleX || 1)),
          height: Math.round((rect.height || 0) * (rect.scaleY || 1)),
          angle: Math.round(rect.angle || 0)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Design Area API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          sentData: {
            name: rect.designAreaName || `Design Area ${Date.now()}`,
            left: Math.round(rect.left || 0),
            top: Math.round(rect.top || 0),
            centerX: Math.round((rect.left || 0) + ((rect.width || 0) * (rect.scaleX || 1)) / 2),
            centerY: Math.round((rect.top || 0) + ((rect.height || 0) * (rect.scaleY || 1)) / 2),
            width: Math.round((rect.width || 0) * (rect.scaleX || 1)),
            height: Math.round((rect.height || 0) * (rect.scaleY || 1)),
            angle: Math.round(rect.angle || 0)
          }
        });
        throw new Error(`Failed to add design area: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Design area added:', result);
      return result;
    } catch (error) {
      console.error('Error adding design area:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Form validasyonu
      if (!formData.name || !formData.category || !formData.imageFile) {
        setAlertState({
          show: true,
          message: 'Please fill in all required fields and upload an image',
          type: 'error'
        });
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('Name', formData.name);
      formDataToSend.append('Category', formData.category);
      formDataToSend.append('GenderCategory', formData.genderCategory);
      formDataToSend.append('DesignColor', formData.designColor);
      formDataToSend.append('TshirtCategory', formData.tshirtCategory);
      formDataToSend.append('SizeCategory', formData.sizeCategory);
      formDataToSend.append('ImageFile', formData.imageFile);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      setAlertState({
        show: true,
        message: 'Creating mockup...',
        type: 'warning'
      });

      const response = await fetch(`${API_URL}/api/Mockup`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errors: errorData.errors,
        });
        throw new Error(errorData.message || 'Failed to create mockup');
      }

      const result = await response.json();
      console.log('Mockup created:', result);

      setAlertState({
        show: true,
        message: 'Mockup created successfully!',
        type: 'success'
      });

      // Design Areas ekleme
      if (result.data?.id) {
        const groups = canvas?.getObjects().filter(obj => obj instanceof fabric.Group);
        
        if (groups && groups.length > 0) {
          const shouldAddDesignAreas = window.confirm('Would you like to add design areas to this mockup?');
          if (shouldAddDesignAreas) {
            setAlertState({
              show: true,
              message: 'Adding design areas...',
              type: 'warning'
            });

            for (const group of groups) {
              const rect = (group as fabric.Group).getObjects().find(obj => obj instanceof fabric.Rect) as DesignRect;
              if (rect) {
                await addDesignArea(result.data.id, rect);
              }
            }

            setAlertState({
              show: true,
              message: 'All design areas added successfully!',
              type: 'success'
            });
          }
        }
      }

    } catch (error) {
      console.error('Error creating mockup:', error);
      setAlertState({
        show: true,
        message: error instanceof Error ? error.message : 'Failed to create mockup. Please try again.',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    if (canvas) {
      canvas.on('object:modified', (e) => {
        const rect = e.target;
        if (rect instanceof fabric.Rect) {
          console.log('Rectangle modified:', {
            left: rect.left,
            top: rect.top,
            width: rect.width! * rect.scaleX!,
            height: rect.height! * rect.scaleY!,
            angle: rect.angle
          });
        }
      });
    }
  }, [canvas]);

  return (
    <Layout>
      {alertState.show && (
        <Alert 
          message={alertState.message} 
          type={alertState.type} 
        />
      )}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Canvas Bölümü */}
          <div className="border p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Design Canvas</h2>
            <div className="w-full max-w-[500px] mx-auto space-y-4">
              <canvas ref={canvasRef} className="border" />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Design Area Name"
                  className="flex-1 p-2 border rounded"
                  id="designAreaName"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (canvas) {
                      const nameInput = document.getElementById('designAreaName') as HTMLInputElement;
                      const areaName = nameInput.value.trim();
                      
                      if (!areaName) {
                        setAlertState({
                          show: true,
                          message: 'Please enter a design area name',
                          type: 'error'
                        });
                        
                        setTimeout(() => {
                          setAlertState({ show: false, message: '', type: 'error' });
                        }, 3000);
                        
                        return;
                      }
                      
                      const rect = new fabric.Rect({
                        left: 0,
                        top: 0,
                        width: 100,
                        height: 100,
                        fill: 'black',
                        strokeWidth: 0,
                        originX: 'center',
                        originY: 'center'
                      }) as DesignRect;
                      
                      const text = new fabric.Text(areaName, {
                        fontSize: 14,
                        fill: 'white',
                        originX: 'center',
                        originY: 'center'
                      });
                      
                      const group = new fabric.Group([rect, text], {
                        left: 100,
                        top: 100,
                        width: rect.width,
                        height: rect.height,
                        originX: 'center',
                        originY: 'center'
                      });
                      
                      rect.designAreaName = areaName;
                      canvas.add(group);
                      canvas.renderAll();
                      
                      nameInput.value = '';
                      
                      setAlertState({
                        show: true,
                        message: 'Design area added successfully',
                        type: 'success'
                      });
                      
                      setTimeout(() => {
                        setAlertState({ show: false, message: '', type: 'success' });
                      }, 3000);
                    }
                  }}
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  Add New Design Area
                </button>
              </div>
              {/* Mevcut design area'ları listele */}
              <div className="mt-4 space-y-2">
                {canvas?.getObjects()
                  .filter(obj => obj instanceof fabric.Rect)
                  .map((rect, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {(rect as DesignRect).designAreaName || `Design Area ${index + 1}`}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Form Bölümü */}
          <div className="border p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Mockup Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block mb-2">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter category"
                />
              </div>

              <div>
                <label className="block mb-2">T-Shirt Category</label>
                <select
                  name="tshirtCategory"
                  value={formData.tshirtCategory}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  {Object.values(TshirtCategory).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Size</label>
                <select
                  name="sizeCategory"
                  value={formData.sizeCategory}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  {Object.values(SizeCategory).map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Gender</label>
                <select
                  name="genderCategory"
                  value={formData.genderCategory}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  {Object.values(GenderCategory).map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Design Color</label>
                <select
                  name="designColor"
                  value={formData.designColor}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  {Object.values(DesignColor).map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Save Mockup
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditMockupPage; 