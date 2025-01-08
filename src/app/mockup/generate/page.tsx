"use client";
import { useEffect, useState, useCallback } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter } from 'next/navigation';
import { authService } from "@/services/authService";
import axios from 'axios';
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Image from "next/image";

enum DesignColor {
  Black = "Black",
  White = "White",
  Color = "Color"
}

interface FavoriteList {
  id: number;
  name: string;
  category?: string;
  Category?: string;
  mockups: Mockup[];
}

interface Mockup {
  id: number;
  name: string;
  backgroundImagePreviewPath: string;
  designAreas: DesignArea[];
  category?: string;
  genderCategory?: string;
  sizeCategory?: string;
  designColor?: string;
}

interface DesignArea {
  id: number;
  name: string;
  width: number;
  height: number;
  angle: number;
  centerX: number;
  centerY: number;
}

interface DesignFile {
  designAreaId: number;
  designFile: File | null;
  mockupId: number;
  designColor: string;
}

interface QuickSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mockups: Mockup[]) => void;
  mockups: Mockup[];
}

interface DesignAreaUploadProps {
  area: DesignArea;
  mockupId: number;
  file: File | null;
  onChange: (designAreaId: number, mockupId: number, file: File | null) => void;
}

interface DesignFileWithPreview extends DesignFile {
  previewUrl?: string;
}

interface SingleImageUpload {
  mockupId: number;
  file: File | null;
  previewUrl?: string;
  designColor: string;
}

const formatImagePath = (path: string) => {
  if (!path) return '';
  return path;
};

const QuickSelectModal = ({ isOpen, onClose, onSelect, mockups }: QuickSelectModalProps) => {
  const [selectedMockups, setSelectedMockups] = useState<Mockup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");

  // Get unique filter options
  const categories = Array.from(new Set(mockups.map(m => m.category).filter(Boolean)));
  const genders = Array.from(new Set(mockups.map(m => m.genderCategory).filter(Boolean)));
  const sizes = Array.from(new Set(mockups.map(m => m.sizeCategory).filter(Boolean)));

  const filteredMockups = mockups.filter(mockup => {
    const matchesSearch = mockup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mockup.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mockup.genderCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mockup.sizeCategory?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || mockup.category === categoryFilter;
    const matchesGender = !genderFilter || mockup.genderCategory === genderFilter;
    const matchesSize = !sizeFilter || mockup.sizeCategory === sizeFilter;

    return matchesSearch && matchesCategory && matchesGender && matchesSize;
  });

  const toggleMockup = (mockup: Mockup) => {
    setSelectedMockups(prev => {
      const exists = prev.find(m => m.id === mockup.id);
      if (exists) {
        return prev.filter(m => m.id !== mockup.id);
      }
      return [...prev, mockup];
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-4xl h-[90vh] rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="sticky top-0 z-10 border-b border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Quick Select Mockups
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Selected: {selectedMockups.length} mockups
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search mockups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">All Genders</option>
              {genders.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">All Sizes</option>
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ height: 'calc(90vh - 250px)' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMockups.map((mockup) => (
              <div
                key={mockup.id}
                onClick={() => toggleMockup(mockup)}
                className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-lg
                  ${selectedMockups.some(m => m.id === mockup.id)
                    ? 'border-primary bg-primary bg-opacity-10' 
                    : 'border-stroke dark:border-strokedark'
                  }`}
              >
                {selectedMockups.some(m => m.id === mockup.id) && (
                  <div className="absolute top-4 right-4 z-10 bg-primary text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                )}
                <div className="relative aspect-square w-full mb-2 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={formatImagePath(mockup.backgroundImagePreviewPath)}
                    alt={mockup.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <h4 className="font-medium text-black dark:text-white truncate">
                  {mockup.name}
                </h4>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                  {mockup.category && (
                    <p className="truncate">{mockup.category}</p>
                  )}
                  {mockup.genderCategory && (
                    <p className="truncate">{mockup.genderCategory}</p>
                  )}
                  {mockup.sizeCategory && (
                    <p className="truncate">{mockup.sizeCategory}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-2.5 text-center font-medium hover:bg-opacity-90"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedMockups.length > 0) {
                  onSelect(selectedMockups);
                  onClose();
                }
              }}
              disabled={selectedMockups.length === 0}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
            >
              Select ({selectedMockups.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DesignAreaUpload = ({ area, mockupId, file, onChange }: DesignAreaUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [file]);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-4 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          {area.name}
        </h3>
        <p className="text-sm text-gray-500">
          Required size: {area.width}x{area.height}px
        </p>
      </div>
      <div className="p-4">
        <div>
          <label className="mb-3 block text-sm font-medium text-black dark:text-white">
            Upload design
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onChange(area.id, mockupId, e.target.files?.[0] || null)}
            className="w-full rounded-md border border-stroke p-3 outline-none transition file:mr-4 file:rounded file:border-[0.5px] file:border-stroke file:bg-[#EEEEEE] file:px-2.5 file:py-1 file:text-sm focus:border-primary file:focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-strokedark dark:file:bg-white/30 dark:file:text-white"
          />
        </div>

        {preview && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-black dark:text-white">
                Preview
              </label>
              <button
                onClick={() => onChange(area.id, mockupId, null)}
                className="text-sm text-meta-1 hover:text-meta-1"
              >
                Remove
              </button>
            </div>
            <div className="relative h-[150px] rounded-lg overflow-hidden bg-black/5">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ColorSelect = ({ value, onChange, mockupColor }: { value: string, onChange: (value: string) => void, mockupColor?: string }) => {
  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
      >
        <option value={DesignColor.Black}>Black</option>
        <option value={DesignColor.White}>White</option>
        <option value={DesignColor.Color}>Color</option>
      </select>
    </div>
  );
};

const MockupCard = ({ mockup, singleImageUpload, onSingleImageUpload, designFiles, onDesignFileChange }: {
  mockup: Mockup;
  singleImageUpload?: SingleImageUpload;
  onSingleImageUpload: (mockupId: number, file: File | null, designColor: string) => void;
  designFiles: DesignFileWithPreview[];
  onDesignFileChange: (designAreaId: number, mockupId: number, file: File | null, designColor: string) => void;
}) => {
  const [showIndividualUploads, setShowIndividualUploads] = useState(false);

  return (
    <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden">
          <Image
            src={formatImagePath(mockup.backgroundImagePreviewPath)}
            alt={mockup.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="font-medium text-black dark:text-white">
            {mockup.name}
          </h4>
          <p className="text-sm text-gray-500">
            {mockup.designAreas?.length} design areas
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            Design Color: {mockup.designColor}
            {singleImageUpload?.file && ((mockup.designColor === DesignColor.Black && singleImageUpload?.designColor !== DesignColor.Black) ||
              (mockup.designColor === DesignColor.White && singleImageUpload?.designColor !== DesignColor.White) ||
              (mockup.designColor === DesignColor.Color && singleImageUpload?.designColor !== DesignColor.Color)) && (
              <div className="tooltip" title="Warning: Design color does not match mockup color">
                <svg className="w-4 h-4 text-meta-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
          </div>
        </div>
        {mockup.designAreas.length > 1 && (
          <button
            onClick={() => setShowIndividualUploads(!showIndividualUploads)}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-primary bg-opacity-10 text-primary rounded-lg hover:bg-opacity-20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">
              {showIndividualUploads ? 'Use single design' : 'Upload individual designs'}
            </span>
          </button>
        )}
      </div>

      {showIndividualUploads ? (
        // Design Area Based Upload
        <div className="grid grid-cols-2 gap-4">
          {mockup.designAreas.map((area, index) => {
            const designFile = designFiles.find(df => df.designAreaId === area.id && df.mockupId === mockup.id);
            return (
              <div key={area.id} className="space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      const currentColor = designFile?.designColor || DesignColor.Color;
                      onDesignFileChange(area.id, mockup.id, file, currentColor);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-[120px] rounded-lg border-2 border-dashed border-stroke bg-transparent p-4 font-medium outline-none transition hover:border-primary focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary flex flex-col items-center justify-center gap-2">
                    {designFile?.previewUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={designFile.previewUrl}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDesignFileChange(area.id, mockup.id, null, designFile.designColor);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-meta-1 text-white rounded-full hover:bg-opacity-90"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-xs text-gray-500">{area.width}x{area.height}px</span>
                      </>
                    )}
                  </div>
                </div>
                {designFile?.designFile && (
                  <div>
                    <ColorSelect
                      value={designFile.designColor}
                      onChange={(color) => onDesignFileChange(area.id, mockup.id, designFile.designFile, color)}
                      mockupColor={mockup.designColor}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Single Design Upload
        <>
          {/* Design Preview */}
          {singleImageUpload?.previewUrl && (
            <div className="relative h-[200px] rounded-lg overflow-hidden bg-black/5">
              <Image
                src={singleImageUpload.previewUrl}
                alt="Design Preview"
                fill
                className="object-contain"
              />
              <button
                onClick={() => onSingleImageUpload(mockup.id, null, singleImageUpload.designColor)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-meta-1 text-white rounded-full hover:bg-opacity-90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Color Selection */}
          <div className="mt-4">
            <ColorSelect
              value={singleImageUpload?.designColor || mockup.designColor || DesignColor.Color}
              onChange={(color) => {
                if (singleImageUpload?.file) {
                  onSingleImageUpload(mockup.id, singleImageUpload.file, color);
                }
              }}
              mockupColor={mockup.designColor}
            />
          </div>
        </>
      )}
    </div>
  );
};

const GeneratePage = () => {
  const router = useRouter();
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [designFiles, setDesignFiles] = useState<DesignFileWithPreview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [selectedMockups, setSelectedMockups] = useState<Mockup[]>([]);
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);
  const [singleImageUploads, setSingleImageUploads] = useState<SingleImageUpload[]>([]);

  const fetchLists = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error("No token found in fetchLists");
        router.push('/login');
        return;
      }

      const user = authService.getCurrentUser();
      if (!user?.userId) {
        console.error("User ID not found in fetchLists");
        router.push('/login');
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      console.log('Fetching lists for user:', user.userId); // Debug log
      const response = await axios.get(`${API_URL}/api/Favorite/${user.userId}/lists`);
      console.log('Lists response:', response.data); // Debug log

      let newLists: FavoriteList[] = [];
      
      if (Array.isArray(response.data)) {
        newLists = response.data;
      } else if (response.data.success && Array.isArray(response.data.data)) {
        newLists = response.data.data;
      }

      // Mockup bilgilerini güncelle
      if (mockups.length > 0) {
        newLists = newLists.map(list => ({
          ...list,
          mockups: list.mockups.map(mockup => {
            const fullMockup = mockups.find(m => m.id === mockup.id);
            return {
              ...mockup,
              ...fullMockup, // Tüm mockup bilgilerini birleştir
              backgroundImagePreviewPath: fullMockup?.backgroundImagePreviewPath || mockup.backgroundImagePreviewPath || ''
            };
          })
        }));
      }

      console.log('Processed lists:', newLists); // Debug log
      setLists(newLists);
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  };

  const fetchMockups = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await axios.get(`${API_URL}/api/Mockup`);
      if (response.data.success) {
        setMockups(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching mockups:", error);
    }
  };

  const handleFileChange = (designAreaId: number, mockupId: number, file: File | null, designColor: string) => {
    setDesignFiles(prev => {
      // Clean up old preview URL if exists
      const existingFile = prev.find(df => df.designAreaId === designAreaId && df.mockupId === mockupId);
      if (existingFile?.previewUrl) {
        URL.revokeObjectURL(existingFile.previewUrl);
      }

      // Create new preview URL if file exists
      const previewUrl = file ? URL.createObjectURL(file) : undefined;

      if (existingFile) {
        return prev.map(df =>
          df.designAreaId === designAreaId && df.mockupId === mockupId
            ? { ...df, designFile: file, previewUrl, designColor }
            : df
        );
      }
      return [...prev, { designAreaId, mockupId, designFile: file, previewUrl, designColor }];
    });
  };

  // Update single image upload handler
  const handleSingleImageUpload = (mockupId: number, file: File | null, designColor: string) => {
    setSingleImageUploads(prev => {
      // Clean up old preview URL if exists
      const existingUpload = prev.find(u => u.mockupId === mockupId);
      if (existingUpload?.previewUrl) {
        URL.revokeObjectURL(existingUpload.previewUrl);
      }

      // Create new preview URL if file exists
      const previewUrl = file ? URL.createObjectURL(file) : undefined;

      if (existingUpload) {
        return prev.map(u =>
          u.mockupId === mockupId
            ? { ...u, file, previewUrl, designColor }
            : u
        );
      }
      return [...prev, { mockupId, file, previewUrl, designColor }];
    });

    // Clear individual design area uploads for this mockup
    setDesignFiles(prev => prev.filter(df => df.mockupId !== mockupId));
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      designFiles.forEach(df => {
        if (df.previewUrl) {
          URL.revokeObjectURL(df.previewUrl);
        }
      });
      singleImageUploads.forEach(upload => {
        if (upload.previewUrl) {
          URL.revokeObjectURL(upload.previewUrl);
        }
      });
    };
  }, [designFiles, singleImageUploads]);

  const handleGenerate = async () => {
    try {
      // Token kontrolü
      const token = authService.getToken();
      if (!token) {
        alert("Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.");
        router.push('/login');
        return;
      }

      // Kontrolleri yapalım
      if (!mocksToShow.length) {
        alert("Lütfen mockup seçin veya bir liste seçin.");
        return;
      }

      // Debug için mockup sayılarını loglayalım
      console.log('Toplam seçili mockup sayısı:', mocksToShow.length);
      let mockupsWithDesigns = 0;

      const hasAnyDesignFile = mocksToShow.some(mockup => {
        // Tek resim yükleme kontrolü
        const hasSingleUpload = singleImageUploads.some(u => u.mockupId === mockup.id && u.file);
        // Design area bazlı yükleme kontrolü
        const hasDesignAreaUploads = mockup.designAreas.every(area => 
          designFiles.some(df => df.designAreaId === area.id && df.mockupId === mockup.id && df.designFile)
        );
        return hasSingleUpload || hasDesignAreaUploads;
      });

      if (!hasAnyDesignFile) {
        alert("Lütfen en az bir tasarım yükleyin. Her mockup için ya tek bir tasarım ya da tüm design area'lar için ayrı tasarımlar yüklemelisiniz.");
        return;
      }

      setIsGenerating(true);

      const formData = new FormData();
      const skippedMockups: number[] = [];
      
      // Add mockupIds and track which ones are actually being sent
      mocksToShow.forEach(mockup => {
        const singleUpload = singleImageUploads.find(u => u.mockupId === mockup.id);
        const hasAllDesignAreas = mockup.designAreas.every(area =>
          designFiles.some(df => df.designAreaId === area.id && df.mockupId === mockup.id && df.designFile)
        );

        if (singleUpload?.file || hasAllDesignAreas) {
          formData.append('mockupIds', mockup.id.toString());
          mockupsWithDesigns++;
        } else {
          skippedMockups.push(mockup.id);
        }
      });

      // Add design files and their corresponding area IDs and colors
      mocksToShow.forEach(mockup => {
        const singleUpload = singleImageUploads.find(u => u.mockupId === mockup.id);
        
        if (singleUpload?.file) {
          // Tek resim yüklemesi varsa, tüm design area'lar için onu kullan
          mockup.designAreas.forEach(area => {
            formData.append('designAreaIds', area.id.toString());
            formData.append('designColors', singleUpload.designColor);
            if (singleUpload.file) {
              formData.append('designFiles', singleUpload.file);
            }
          });
        } else {
          // Design area bazlı yüklemeleri kontrol et
          mockup.designAreas.forEach(area => {
            const designFile = designFiles.find(df => 
              df.designAreaId === area.id && 
              df.mockupId === mockup.id && 
              df.designFile
            );
            if (designFile?.designFile) {
              formData.append('designAreaIds', area.id.toString());
              formData.append('designColors', designFile.designColor);
              formData.append('designFiles', designFile.designFile);
            }
          });
        }
      });

      // Log final formData contents for debugging
      console.log('FormData contents:');
      console.log('mockupIds:', Array.from(formData.getAll('mockupIds')));
      console.log('designAreaIds:', Array.from(formData.getAll('designAreaIds')));
      console.log('designColors:', Array.from(formData.getAll('designColors')));
      console.log('designFiles count:', formData.getAll('designFiles').length);

      // Token'ı her request öncesi yeniden al ve header'a ekle
      const currentToken = authService.getToken();
      if (!currentToken) {
        throw new Error("Token not found");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      const response = await axios.post(
        `${API_URL}/api/Mockup/generate`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${currentToken}`
          }
        }
      );

      // Create a download link for the ZIP file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'generated-mockups.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating mockups:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert("Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.");
          router.push('/login');
          return;
        }
        const responseData = await error.response?.data?.text?.();
        console.error("Server error details:", responseData);
        alert("Mockup oluşturulurken bir hata oluştu. Lütfen tüm design area'lar için tasarım yüklediğinizden emin olun.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      fetchMockups();
      fetchLists(); // İlk yüklemede her ikisini de çağır
    } else {
      router.push('/login');
    }
  }, []);

  // Mockups değiştiğinde listeleri güncelle
  useEffect(() => {
    if (mockups.length > 0 && lists.length > 0) {
      fetchLists();
    }
  }, [mockups]);

  // Favori liste ve mockup seçimi kontrolü
  const selectedList = lists.find(list => list.id === selectedListId);
  const mocksToShow = selectedListId && selectedList?.mockups ? selectedList.mockups : selectedMockups;

  // Add new handler for bulk uploads
  const handleBulkUpload = (file: File | null, designColor: string) => {
    if (!file) return;

    // Apply to mockups based on design color
    mocksToShow.forEach(mockup => {
      // Apply designs to mockups with matching colors
      const shouldApply = 
        designColor === DesignColor.Color || // Color designs can go to any mockup
        (designColor === DesignColor.White && mockup.designColor === DesignColor.White) ||
        (designColor === DesignColor.Black && mockup.designColor === DesignColor.Black);

      if (shouldApply) {
        handleSingleImageUpload(mockup.id, file, designColor);
      }
    });
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb pageName="Generate Mockups" />
        
        <div className="flex flex-col gap-6">
          {/* Mockup Selection */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Select Mockups
              </h3>
            </div>
            <div className="p-6.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-black dark:text-white font-medium">
                    Quick Select Mockups
                  </label>
                  <button
                    onClick={() => {
                      setSelectedListId(null);
                      setIsQuickSelectOpen(true);
                    }}
                    className="w-full h-[120px] rounded-lg border-2 border-dashed border-stroke bg-transparent p-4 font-medium outline-none transition hover:border-primary focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary flex flex-col items-center justify-center gap-2"
                  >
                    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {selectedMockups.length > 0 
                      ? `${selectedMockups.length} mockups selected`
                      : 'Click to select mockups'}
                  </button>
                </div>

                <div>
                  <label className="mb-2.5 block text-black dark:text-white font-medium">
                    Select from Favorites
                  </label>
                  <select
                    value={selectedListId || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setSelectedListId(value);
                      if (value) {
                        setSelectedMockups([]);
                      }
                    }}
                    className="w-full h-[120px] rounded-lg border-2 border-stroke bg-transparent px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  >
                    <option value="">Select a favorite list</option>
                    {lists.map(list => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.mockups?.length || 0} mockups)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {mocksToShow.length > 0 && (
            <>
              {/* Bulk Upload Section */}
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Bulk Upload Designs
                  </h3>
                </div>
                <div className="p-6.5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Black Design Bulk Upload */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Black Design
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleBulkUpload(e.target.files?.[0] || null, DesignColor.Black)}
                          className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* White Design Bulk Upload */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        White Design
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleBulkUpload(e.target.files?.[0] || null, DesignColor.White)}
                          className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Color Design Bulk Upload */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                        Color Design
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleBulkUpload(e.target.files?.[0] || null, DesignColor.Color)}
                          className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mockup Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mocksToShow.map((mockup) => (
                  <MockupCard
                    key={mockup.id}
                    mockup={mockup}
                    singleImageUpload={singleImageUploads.find(u => u.mockupId === mockup.id)}
                    onSingleImageUpload={handleSingleImageUpload}
                    designFiles={designFiles}
                    onDesignFileChange={handleFileChange}
                  />
                ))}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !singleImageUploads.some(u => u.file)}
                className="mt-6 flex w-full justify-center rounded-lg bg-primary p-4 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Generate Mockups'}
              </button>
            </>
          )}
        </div>
      </div>

      <QuickSelectModal
        isOpen={isQuickSelectOpen}
        onClose={() => setIsQuickSelectOpen(false)}
        onSelect={setSelectedMockups}
        mockups={mockups}
      />
    </DefaultLayout>
  );
};

export default GeneratePage; 