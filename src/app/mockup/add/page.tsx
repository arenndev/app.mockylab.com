'use client';

import React, { useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import Layout from '@/components/Layouts/DefaultLayout';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiClient, handleApiError } from '@/utils/apiConfig';
import Loader from '@/components/common/Loader';
import { authService } from '@/services/authService';

// Enum tanımlamaları
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

// Alert component
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

interface DesignRect extends fabric.Rect {
  designAreaName?: string;
}

interface FormData {
  name: string;
  category: string;
  tshirtCategory: TshirtCategory;
  sizeCategory: SizeCategory;
  genderCategory: GenderCategory;
  designColor: DesignColor;
  imageFile: File | null;
}

interface DesignArea {
  name: string;
  width: number;
  height: number;
  angle: number;
  centerX: number;
  centerY: number;
}

// Result Modal Component
const ResultModal = ({ 
  isOpen, 
  message, 
  type,
  mockupId,
  onClose 
}: { 
  isOpen: boolean; 
  message: string; 
  type: 'success' | 'error';
  mockupId?: string;
  onClose: () => void;
}) => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && type === 'success') {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => {
              router.push(`/mockup/edit?mockupId=${mockupId}`);
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, type, mockupId, router]);

  if (!isOpen) return null;

  const handleRedirect = (path: string) => {
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
        <div className="mb-6 text-center">
          {type === 'success' ? (
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#34D399] bg-opacity-[15%]">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30.5968 1.65364L30.5736 1.62365L30.5482 1.5955C29.8346 0.803734 28.6476 0.801508 27.9314 1.58881L11.8378 18.9075L4.11334 10.5736C3.39712 9.78574 2.20974 9.78778 1.49599 10.5797C0.834671 11.3135 0.834671 12.4467 1.49599 13.1805L1.49592 13.1806L1.5054 13.1908L9.73484 22.0696C10.2889 22.681 11.0572 23 11.7916 23C12.5848 23 13.3036 22.671 13.848 22.07L30.4324 4.22322C31.1666 3.48904 31.152 2.37231 30.5968 1.65364Z" fill="#34D399"/>
              </svg>
            </div>
          ) : (
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#F87171] bg-opacity-[15%]">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C8.2 2 2 8.2 2 16C2 23.8 8.2 30 16 30C23.8 30 30 23.8 30 16C30 8.2 23.8 2 16 2ZM21.4 23L16 17.6L10.6 23L9 21.4L14.4 16L9 10.6L10.6 9L16 14.4L21.4 9L23 10.6L17.6 16L23 21.4L21.4 23Z" fill="#F87171"/>
              </svg>
            </div>
          )}
          <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
            {type === 'success' ? 'Success!' : 'Error!'}
          </h3>
          <p className="text-body-color dark:text-body-color-dark mb-6">
            {message}
          </p>
          {type === 'success' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting in {countdown} seconds...
            </p>
          )}
        </div>
        <div className="flex justify-center gap-4">
          {type === 'success' ? (
            <>
              <button
                onClick={() => handleRedirect('/mockup/list')}
                className="rounded bg-primary bg-opacity-90 px-6 py-2 text-white transition hover:bg-opacity-100"
              >
                Go to List
              </button>
              <button
                onClick={() => handleRedirect(`/mockup/edit?mockupId=${mockupId}`)}
                className="rounded bg-primary px-6 py-2 text-white transition hover:bg-opacity-90"
              >
                Edit Mockup
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="rounded bg-primary px-6 py-2 text-white transition hover:bg-opacity-90"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AddMockupPage = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = React.useState<fabric.Canvas | null>(null);
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    category: '',
    tshirtCategory: TshirtCategory.TSHIRT,
    sizeCategory: SizeCategory.ADULT,
    genderCategory: GenderCategory.UNISEX,
    designColor: DesignColor.BLACK,
    imageFile: null
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
    mockupId?: string;
  }>({
    isOpen: false,
    message: '',
    type: 'error',
    
  });

  const router = useRouter();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true
    });

    setCanvas(newCanvas);

    // Cleanup
    return () => {
      newCanvas.dispose();
    };
  }, []);

  // Add default design area
  useEffect(() => {
    if (!canvas) return;

    createNewDesignArea('Default Area', canvas);
  }, [canvas]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.imageFile) {
      newErrors.imageFile = 'Background image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createNewDesignArea = (areaName: string, targetCanvas: fabric.Canvas) => {
    const rect = new fabric.Rect({
      width: 100,
      height: 100,
      fill: 'rgba(0,0,0,0.5)',
      strokeWidth: 0,
      originX: 'center',
      originY: 'center'
    }) as DesignRect;

    rect.designAreaName = areaName;

    const text = new fabric.Text(areaName, {
      fontSize: 14,
      fill: 'white',
      originX: 'center',
      originY: 'center',
      selectable: false
    });

    const group = new fabric.Group([rect, text], {
      left: targetCanvas.width! / 2,
      top: targetCanvas.height! / 2,
      originX: 'center',
      originY: 'center',
      centeredRotation: true,
      hasControls: true,
      hasBorders: true
    });

    targetCanvas.add(group);
    targetCanvas.setActiveObject(group);
    targetCanvas.renderAll();

    // Add event listeners
    group.on('moving', () => targetCanvas.renderAll());
    group.on('scaling', () => targetCanvas.renderAll());
    group.on('rotating', () => targetCanvas.renderAll());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    try {
      setFormData(prev => ({ ...prev, imageFile: file }));

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && canvas) {
          const img = new window.Image();
          img.src = event.target.result as string;
          img.onload = () => {
            const fabricImage = new fabric.Image(img);
            
            // Scale image to fit canvas
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

            // Store all existing groups
            const groups = canvas.getObjects().filter(obj => obj instanceof fabric.Group);
            
            // Clear canvas
            canvas.clear();
            
            // Add image first (at the back)
            canvas.add(fabricImage);
            
            // Re-add all groups (on top)
            groups.forEach(group => {
              canvas.add(group);
            });
            
            canvas.renderAll();
          };
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setModalState({
        isOpen: true,
        message: error instanceof Error ? error.message : 'Failed to load image',
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      if (!validateForm()) {
        return;
      }

      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const userId = authService.getCurrentUser()?.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Get background image
      const backgroundImage = canvas.getObjects().find(obj => obj instanceof fabric.Image) as fabric.Image;
      if (!backgroundImage) {
        throw new Error('Background image not found');
      }

      // Calculate image scale
      const imageScale = backgroundImage.scaleX || 1;
      const imageLeft = backgroundImage.left || 0;
      const imageTop = backgroundImage.top || 0;

      // Get design areas from canvas
      const designAreas = canvas.getObjects()
        .filter((obj): obj is fabric.Group => obj instanceof fabric.Group)
        .map(group => {
          const rect = group.getObjects().find((obj): obj is DesignRect => 
            obj instanceof fabric.Rect
          ) as DesignRect;
          
          // Calculate relative position to image
          const relativeX = (group.left || 0) - imageLeft;
          const relativeY = (group.top || 0) - imageTop;

          // Convert to original image coordinates
          const originalX = Math.round(relativeX / imageScale);
          const originalY = Math.round(relativeY / imageScale);
          
          // Get dimensions directly from the rect
          const originalWidth = Math.round(rect.getScaledWidth() / imageScale);
          const originalHeight = Math.round(rect.getScaledHeight() / imageScale);

          // Log dimensions for debugging
          console.log('Design Area Dimensions:', {
            rectOriginalWidth: rect.width,
            rectOriginalHeight: rect.height,
            rectScaledWidth: rect.getScaledWidth(),
            rectScaledHeight: rect.getScaledHeight(),
            groupScaleX: group.scaleX,
            groupScaleY: group.scaleY,
            imageScale,
            calculatedWidth: originalWidth,
            calculatedHeight: originalHeight
          });

          return {
            name: rect.designAreaName || 'Unnamed Area',
            width: originalWidth,
            height: originalHeight,
            angle: Math.round(group.angle || 0),
            centerX: originalX,
            centerY: originalY
          };
        });

      // Create form data
      const formDataToSend = new FormData();
      formDataToSend.append('Name', formData.name);
      formDataToSend.append('Category', formData.category);
      formDataToSend.append('TshirtCategory', formData.tshirtCategory);
      formDataToSend.append('SizeCategory', formData.sizeCategory);
      formDataToSend.append('GenderCategory', formData.genderCategory);
      formDataToSend.append('DesignColor', formData.designColor);
      formDataToSend.append('ImageFile', formData.imageFile);
      formDataToSend.append('UserId', userId);

      // First create the mockup
      const mockupResponse = await apiClient.post('/Mockup', formDataToSend);

      if (mockupResponse.data.success) {
        const mockupId = mockupResponse.data.data.id;

        // Add design areas
        for (const designArea of designAreas) {
          await apiClient.post(`/mockups/${mockupId}/design-areas`, designArea);
        }

        setModalState({
          isOpen: true,
          message: 'Mockup and design areas created successfully',
          type: 'success',
          mockupId: mockupId
        });
      }
    } catch (error: any) {
      console.error('Error details:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      setModalState({
        isOpen: true,
        message: handleApiError(error),
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <Loader />
        </div>
      )}
      
      <ResultModal
        isOpen={modalState.isOpen}
        message={modalState.message}
        type={modalState.type}
        mockupId={modalState.mockupId}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            Add New Mockup
          </h2>
          <nav className="mt-4">
            <ol className="flex items-center gap-2">
              <li>
                <a className="font-medium" href="/mockup">
                  Mockups
                </a>
              </li>
              <li className="text-primary">/</li>
              <li className="text-primary">Add</li>
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Canvas Bölümü */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Design Canvas
              </h3>
            </div>
            <div className="p-6.5">
              <div className="w-full max-w-[500px] mx-auto space-y-4">
                <canvas ref={canvasRef} className="border rounded-sm" />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Design Area Name"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    id="designAreaName"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nameInput = document.getElementById('designAreaName') as HTMLInputElement;
                      const areaName = nameInput.value.trim();
                      if (areaName && canvas) {
                        createNewDesignArea(areaName, canvas);
                        nameInput.value = '';
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90"
                  >
                    Add New Design Area
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Bölümü */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Mockup Details
              </h3>
            </div>
            <div className="p-6.5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    placeholder="Enter category"
                  />
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    T-Shirt Category
                  </label>
                  <select
                    name="tshirtCategory"
                    value={formData.tshirtCategory}
                    onChange={handleInputChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  >
                    {Object.values(TshirtCategory).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Size
                  </label>
                  <select
                    name="sizeCategory"
                    value={formData.sizeCategory}
                    onChange={handleInputChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  >
                    {Object.values(SizeCategory).map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Gender
                  </label>
                  <select
                    name="genderCategory"
                    value={formData.genderCategory}
                    onChange={handleInputChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  >
                    {Object.values(GenderCategory).map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Design Color
                  </label>
                  <select
                    name="designColor"
                    value={formData.designColor}
                    onChange={handleInputChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  >
                    {Object.values(DesignColor).map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full justify-center rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90"
                >
                  Create Mockup
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddMockupPage; 