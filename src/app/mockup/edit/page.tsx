'use client';

import React, { useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import Layout from '@/components/Layouts/DefaultLayout';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import Loader from '@/components/common/Loader';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/apiConfig';

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
  Black = "Black",
  White = "White",
  Color = "Color"
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
  designAreaId?: number;
}

interface MockupDesignArea {
  width: number;
  height: number;
  name: string;
  centerX: number;
  centerY: number;
  angle: number;
}

interface DesignAreaData {
  id: number;
  name: string;
}

interface MockupData {
  id: number;
  name: string;
  designAreas: DesignAreaData[];
  [key: string]: any; // for other properties
}

// Loader component'i için interface ekleyelim
interface LoaderProps {
  className?: string;
}

interface AreaState {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  angle: number;
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

// Result Modal Component
const ResultModal = ({ 
  isOpen, 
  message, 
  type,
  onClose,
  shouldRefresh = false
}: { 
  isOpen: boolean; 
  message: string; 
  type: 'success' | 'error';
  onClose: () => void;
  shouldRefresh?: boolean;
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && type === 'success' && shouldRefresh) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.reload();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, type, shouldRefresh]);

  if (!isOpen) return null;

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
          {type === 'success' && shouldRefresh && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Refreshing in {countdown} seconds...
            </p>
          )}
        </div>
        <div className="flex justify-center gap-4">
          {type === 'success' ? (
            shouldRefresh ? (
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-primary px-6 py-2 text-white transition hover:bg-opacity-90"
              >
                Refresh Now
              </button>
            ) : (
              <button
                onClick={onClose}
                className="rounded bg-primary px-6 py-2 text-white transition hover:bg-opacity-90"
              >
                OK
              </button>
            )
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
    designColor: DesignColor.Black,
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

  const [originalImageSize, setOriginalImageSize] = React.useState<{width: number, height: number} | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSavingArea, setIsSavingArea] = useState(false);
  const [isDeletingArea, setIsDeletingArea] = useState(false);
  const [isAddingArea, setIsAddingArea] = useState(false);

  const [mockupData, setMockupData] = useState<MockupData | null>(null);

  // Area değişikliklerini takip etmek için state
  const [hasUnsavedAreaChanges, setHasUnsavedAreaChanges] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<fabric.Group | null>(null);

  const [newAreaName, setNewAreaName] = useState('');

  const [isNewAreaPending, setIsNewAreaPending] = useState(false);

  const [areaStates, setAreaStates] = useState<Map<number, AreaState>>(new Map());

  const router = useRouter();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'error'
  });

  // Alanların mevcut durumunu kaydet
  const saveCurrentAreaStates = useCallback(() => {
    if (!canvas || !originalImageSize) return;

    const canvasImage = canvas.getObjects().find(obj => obj instanceof fabric.Image) as fabric.Image;
    if (!canvasImage) return;

    const imageScale = originalImageSize.width / (canvasImage.width! * canvasImage.scaleX!);
    const groups = canvas.getObjects().filter(obj => obj instanceof fabric.Group);
    
    const newStates = new Map<number, AreaState>();
    
    groups.forEach(group => {
      const rect = group.getObjects().find(obj => obj instanceof fabric.Rect) as DesignRect;
      if (!rect.designAreaId) return;

      const groupCenter = group.getCenterPoint();
      const relativeX = groupCenter.x - canvasImage.left!;
      const relativeY = groupCenter.y - canvasImage.top!;

      newStates.set(rect.designAreaId, {
        centerX: Math.round(relativeX * imageScale),
        centerY: Math.round(relativeY * imageScale),
        width: Math.round(group.width! * imageScale),
        height: Math.round(group.height! * imageScale),
        angle: group.angle || 0
      });
    });

    setAreaStates(newStates);
  }, [canvas, originalImageSize]);

  // Değişiklikleri kontrol et
  const checkForChanges = useCallback(() => {
    if (!canvas || !originalImageSize) return false;

    const canvasImage = canvas.getObjects().find(obj => obj instanceof fabric.Image) as fabric.Image;
    if (!canvasImage) return false;

    const imageScale = originalImageSize.width / (canvasImage.width! * canvasImage.scaleX!);
    const groups = canvas.getObjects().filter(obj => obj instanceof fabric.Group);
    
    let hasChanges = false;
    
    groups.forEach(group => {
      const rect = group.getObjects().find(obj => obj instanceof fabric.Rect) as DesignRect;
      if (!rect.designAreaId) return;

      const groupCenter = group.getCenterPoint();
      const relativeX = groupCenter.x - canvasImage.left!;
      const relativeY = groupCenter.y - canvasImage.top!;

      const currentState = areaStates.get(rect.designAreaId);
      if (!currentState) {
        hasChanges = true;
        return;
      }

      // Scale'li boyutları hesapla
      const scaledWidth = group.width! * (group.scaleX || 1);
      const scaledHeight = group.height! * (group.scaleY || 1);

      const newCenterX = Math.round(relativeX * imageScale);
      const newCenterY = Math.round(relativeY * imageScale);
      const newWidth = Math.round(scaledWidth * imageScale);
      const newHeight = Math.round(scaledHeight * imageScale);
      const newAngle = group.angle || 0;

      // Hassas değişiklik kontrolü
      const hasPositionChange = Math.abs(currentState.centerX - newCenterX) > 1 || 
                               Math.abs(currentState.centerY - newCenterY) > 1;
      const hasSizeChange = Math.abs(currentState.width - newWidth) > 1 || 
                           Math.abs(currentState.height - newHeight) > 1;
      const hasAngleChange = Math.abs(currentState.angle - newAngle) > 0.1;

      if (hasPositionChange || hasSizeChange || hasAngleChange) {
        hasChanges = true;
      }
    });

    return hasChanges;
  }, [canvas, originalImageSize, areaStates]);

  // Canvas event handler'ını güncelle
  useEffect(() => {
    if (canvas) {
      const handleObjectModification = (e: any) => {
        const target = e.target;
        if (target instanceof fabric.Group) {
          const hasChanges = checkForChanges();
          setHasUnsavedAreaChanges(hasChanges);
        }
      };

      type CanvasEventName = 'object:modified' | 'object:scaling' | 'object:rotating' | 'object:moving' | 'object:skewing';
      const events: CanvasEventName[] = [
        'object:modified',
        'object:scaling',
        'object:rotating',
        'object:moving',
        'object:skewing'
      ];

      events.forEach(eventName => {
        canvas.on(eventName, handleObjectModification);
      });

      canvas.on('object:added', (e: any) => {
        if (e.target instanceof fabric.Group && !isNewAreaPending) {
          setHasUnsavedAreaChanges(true);
        }
      });

      canvas.on('object:removed', (e: any) => {
        if (e.target instanceof fabric.Group && !isDeletingArea) {
          setHasUnsavedAreaChanges(true);
        }
      });

      return () => {
        events.forEach(eventName => {
          canvas.off(eventName, handleObjectModification);
        });
        canvas.off('object:added');
        canvas.off('object:removed');
      };
    }
  }, [canvas, isNewAreaPending, isDeletingArea, checkForChanges]);

  const fetchMockupData = useCallback(async (mockupId: string) => {
    setIsLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Önce mockup verilerini al
      const mockupResponse = await axios.get(`${API_URL}/Mockup/${mockupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (mockupResponse.data.success) {
        setMockupData(mockupResponse.data.data);
        setFormData(prev => ({
          ...prev,
          name: mockupResponse.data.data.name || '',
          category: mockupResponse.data.data.category || '',
          tshirtCategory: mockupResponse.data.data.tshirtCategory || TshirtCategory.TSHIRT,
          sizeCategory: mockupResponse.data.data.sizeCategory || SizeCategory.ADULT,
          genderCategory: mockupResponse.data.data.genderCategory || GenderCategory.UNISEX,
          designColor: mockupResponse.data.data.designColor || DesignColor.Black
        }));
        
        if (mockupResponse.data.data.backgroundImagePath && canvas) {
          const img = new (window.Image as { new(): HTMLImageElement })();
          img.onload = async () => {
            const fabricImage = new fabric.Image(img);
            
            // Orijinal görsel boyutlarını kaydet
            setOriginalImageSize({
              width: img.width,
              height: img.height
            });

            // Canvas'a sığacak şekilde ölçekle
            const scale = Math.min(
              canvas.width! / img.width,
              canvas.height! / img.height
            );
            
            fabricImage.scale(scale);
            fabricImage.set({
              left: (canvas.width! - img.width * scale) / 2,
              top: (canvas.height! - img.height * scale) / 2,
              selectable: false,
              evented: false
            });
            
            canvas.clear();
            canvas.add(fabricImage);

            // Design area'ları ayrı endpoint'ten al
            try {
              const areasResponse = await fetch(`${API_URL}/mockups/${mockupId}/design-areas`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!areasResponse.ok) {
                throw new Error('Failed to fetch design areas');
              }

              const areasData = await areasResponse.json();
              
              if (areasData.success && areasData.data) {
                areasData.data.forEach((area: any) => {
                  const rect = new fabric.Rect({
                    width: area.width * scale,
                    height: area.height * scale,
                    fill: 'black',
                    strokeWidth: 0,
                    originX: 'center',
                    originY: 'center'
                  }) as DesignRect;

                  rect.designAreaId = area.id;
                  rect.designAreaName = area.name;

                  const text = new fabric.Text(area.name, {
                    fontSize: 14,
                    fill: 'white',
                    originX: 'center',
                    originY: 'center'
                  });

                  const group = new fabric.Group([rect, text], {
                    left: area.centerX * scale + fabricImage.left!,
                    top: area.centerY * scale + fabricImage.top!,
                    originX: 'center',
                    originY: 'center',
                    angle: area.angle || 0,
                    selectable: true,
                    hasControls: true
                  });

                  canvas.add(group);
                });
              }
            } catch (error) {
              console.error('Error fetching design areas:', error);
            }

            canvas.renderAll();
          };
          img.src = mockupResponse.data.data.backgroundImagePath;
        }
      }
    } catch (error) {
      console.error('Error fetching mockup:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canvas]);

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
          const img = new (window.Image as { new(): HTMLImageElement })();
          img.src = event.target.result as string;
          img.onload = () => {
            // Orijinal boyutları sakla
            setOriginalImageSize({
              width: img.width,
              height: img.height
            });

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

  const handleSaveAreas = async () => {
    try {
      setIsLoading(true);
      if (!mockupId) {
        throw new Error('Mockup ID is required');
      }

      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const groups = canvas?.getObjects().filter(obj => obj instanceof fabric.Group);
      const canvasImage = canvas?.getObjects().find(obj => obj instanceof fabric.Image) as fabric.Image;
      
      if (!groups || !canvasImage || !originalImageSize) {
        throw new Error('Required data not available');
      }

      const imageScale = originalImageSize.width / (canvasImage.width! * canvasImage.scaleX!);

      const updatePromises = groups.map(async (group) => {
        const rect = group.getObjects().find(obj => obj instanceof fabric.Rect) as DesignRect;
        
        if (!rect.designAreaId) {
          console.warn('Design area has no ID:', rect);
          return;
        }

        const groupCenter = group.getCenterPoint();
        const relativeX = groupCenter.x - canvasImage.left!;
        const relativeY = groupCenter.y - canvasImage.top!;

        const scaledWidth = group.width! * (group.scaleX || 1);
        const scaledHeight = group.height! * (group.scaleY || 1);

        const originalCenterX = Math.round(relativeX * imageScale);
        const originalCenterY = Math.round(relativeY * imageScale);
        const originalWidth = Math.round(scaledWidth * imageScale);
        const originalHeight = Math.round(scaledHeight * imageScale);

        const areaData = {
          name: rect.designAreaName || 'Design Area',
          left: Math.max(0, originalCenterX - (originalWidth / 2)),
          top: Math.max(0, originalCenterY - (originalHeight / 2)),
          centerX: originalCenterX,
          centerY: originalCenterY,
          width: originalWidth,
          height: originalHeight,
          angle: group.angle || 0
        };

        const response = await fetch(`${API_URL}/mockups/${mockupId}/design-areas/${rect.designAreaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(areaData)
        });

        if (!response.ok) {
          throw new Error(`Failed to update design area ${rect.designAreaId}`);
        }
      });

      await Promise.all(updatePromises);
      
      saveCurrentAreaStates();
      setHasUnsavedAreaChanges(false);
      setModalState({
        isOpen: true,
        message: 'Design areas updated successfully!',
        type: 'success'
      });

    } catch (error) {
      console.error('Error updating design areas:', error);
      setModalState({
        isOpen: true,
        message: error instanceof Error ? error.message : 'Failed to update design areas',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = authService.getCurrentUser()?.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('Name', formData.name);
      formDataToSend.append('Category', formData.category);
      formDataToSend.append('GenderCategory', formData.genderCategory);
      formDataToSend.append('DesignColor', formData.designColor.toString());
      formDataToSend.append('TshirtCategory', formData.tshirtCategory);
      formDataToSend.append('SizeCategory', formData.sizeCategory);
      formDataToSend.append('UserId', userId);

      if (formData.imageFile) {
        formDataToSend.append('ImageFile', formData.imageFile);
      }

      setIsLoading(true);
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/Mockup/${mockupId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      });
      
      if (!response.ok) {
        throw new Error('Failed to update mockup');
      }

      const result = await response.json();

      if (result.success) {
        setModalState({
          isOpen: true,
          message: 'All changes saved successfully!',
          type: 'success'
        });
      }

    } catch (error) {
      console.error('Error updating mockup:', error);
      setModalState({
        isOpen: true,
        message: error instanceof Error ? error.message : 'Failed to update mockup',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArea = async () => {
    try {
      setIsLoading(true);
      if (!selectedGroup || !mockupId) return;

      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      
      const rect = selectedGroup.getObjects().find(obj => obj instanceof fabric.Rect) as DesignRect;
      if (!rect.designAreaId) {
        throw new Error('Selected area has no ID');
      }

      const response = await fetch(`${API_URL}/mockups/${mockupId}/design-areas/${rect.designAreaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete design area');
      }

      canvas?.remove(selectedGroup);
      setSelectedGroup(null);
      canvas?.renderAll();

      setModalState({
        isOpen: true,
        message: 'Design area deleted successfully!',
        type: 'success'
      });

    } catch (error) {
      console.error('Error deleting design area:', error);
      setModalState({
        isOpen: true,
        message: error instanceof Error ? error.message : 'Failed to delete design area',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArea = () => {
    if (!newAreaName.trim() || !canvas) return;

    const canvasImage = canvas.getObjects().find(obj => obj instanceof fabric.Image) as fabric.Image;
    if (!canvasImage) return;

    // Canvas'ın merkezinde yeni bir rectangle oluştur
    const rect = new fabric.Rect({
      width: 100,
      height: 100,
      fill: 'black',
      strokeWidth: 0,
      originX: 'center',
      originY: 'center'
    }) as DesignRect;

    rect.designAreaName = newAreaName;

    const text = new fabric.Text(newAreaName, {
      fontSize: 14,
      fill: 'white',
      originX: 'center',
      originY: 'center'
    });

    const group = new fabric.Group([rect, text], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      selectable: true,
      hasControls: true
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    
    setIsNewAreaPending(true);
    setNewAreaName('');
  };

  const handleSaveNewArea = async () => {
    try {
      setIsLoading(true);
      if (!mockupId || !canvas || !isNewAreaPending) return;

      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      
      const activeGroup = canvas.getActiveObject() as fabric.Group;
      if (!activeGroup) {
        throw new Error('No active area selected');
      }

      const canvasImage = canvas.getObjects().find(obj => obj instanceof fabric.Image) as fabric.Image;
      if (!canvasImage || !originalImageSize) {
        throw new Error('Required data not available');
      }

      const rect = activeGroup.getObjects().find(obj => obj instanceof fabric.Rect) as DesignRect;
      const groupCenter = activeGroup.getCenterPoint();

      const imageScale = originalImageSize.width / (canvasImage.width! * canvasImage.scaleX!);
      
      const relativeX = groupCenter.x - canvasImage.left!;
      const relativeY = groupCenter.y - canvasImage.top!;

      const originalCenterX = Math.round(relativeX * imageScale);
      const originalCenterY = Math.round(relativeY * imageScale);
      const originalWidth = Math.round(activeGroup.width! * imageScale);
      const originalHeight = Math.round(activeGroup.height! * imageScale);

      const areaData = {
        name: rect.designAreaName || 'Design Area',
        left: Math.max(0, originalCenterX - (originalWidth / 2)),
        top: Math.max(0, originalCenterY - (originalHeight / 2)),
        centerX: originalCenterX,
        centerY: originalCenterY,
        width: originalWidth,
        height: originalHeight,
        angle: activeGroup.angle || 0
      };

      const response = await fetch(`${API_URL}/mockups/${mockupId}/design-areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(areaData)
      });

      if (!response.ok) {
        throw new Error('Failed to add design area');
      }

      await fetchMockupData(mockupId);
      setIsNewAreaPending(false);

      setModalState({
        isOpen: true,
        message: 'Design area added successfully!',
        type: 'success'
      });

    } catch (error) {
      console.error('Error adding design area:', error);
      setModalState({
        isOpen: true,
        message: error instanceof Error ? error.message : 'Failed to add design area',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mockup verilerini yüklemek için useEffect
  useEffect(() => {
    if (mockupId) {
      fetchMockupData(mockupId);
    }
  }, [mockupId, fetchMockupData]);

  useEffect(() => {
    if (canvas) {
      canvas.on('selection:created', (e) => {
        if (e.selected && e.selected[0] instanceof fabric.Group) {
          setSelectedGroup(e.selected[0] as fabric.Group);
        }
      });

      canvas.on('selection:cleared', () => {
        setSelectedGroup(null);
      });
    }
  }, [canvas]);

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
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            Edit Mockup
          </h2>
          <nav className="mt-4">
            <ol className="flex items-center gap-2">
              <li>
                <a className="font-medium" href="/mockup">
                  Mockups
                </a>
              </li>
              <li className="text-primary">/</li>
              <li className="text-primary">Edit</li>
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
                
                {/* Add Area */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="New Area Name"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    disabled={isNewAreaPending}
                  />
                  {!isNewAreaPending ? (
                    <button
                      type="button"
                      onClick={handleAddArea}
                      disabled={!newAreaName.trim() || isLoading}
                      className={`whitespace-nowrap justify-center rounded px-4 py-3 font-medium text-white min-w-[120px] flex items-center gap-2
                        ${newAreaName.trim() && !isLoading
                          ? 'bg-primary hover:bg-opacity-90' 
                          : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      Add Area
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveNewArea}
                      disabled={isLoading}
                      className="whitespace-nowrap justify-center rounded px-4 py-3 font-medium text-white bg-success hover:bg-opacity-90 min-w-[120px]"
                    >
                      Save New Area
                    </button>
                  )}
                </div>

                {/* Area Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAreas}
                    disabled={!hasUnsavedAreaChanges || isLoading}
                    className={`flex-1 justify-center rounded p-3 font-medium text-white min-w-[150px]
                      ${hasUnsavedAreaChanges && !isLoading
                        ? 'bg-warning hover:bg-opacity-90' 
                        : 'bg-gray-400 cursor-not-allowed'}`}
                  >
                    {hasUnsavedAreaChanges ? 'Save Area Changes' : 'No Area Changes'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteArea}
                    disabled={!selectedGroup || isLoading}
                    className={`flex-1 justify-center rounded p-3 font-medium text-white min-w-[150px]
                      ${selectedGroup && !isLoading
                        ? 'bg-danger hover:bg-opacity-90' 
                        : 'bg-gray-400 cursor-not-allowed'}`}
                  >
                    Delete Selected Area
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
                    <option value={DesignColor.Black}>Black</option>
                    <option value={DesignColor.White}>White</option>
                    <option value={DesignColor.Color}>Color</option>
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
                  Save Mockup
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditMockupPage; 