"use client";
import { useEffect, useState, useCallback } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter } from 'next/navigation';
import { authService } from "@/services/authService";
import axios from 'axios';
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Image from "next/image";

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
  mockupId: number; // Added to track which mockup this design belongs to
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
      
      const response = await axios.get(`${API_URL}/api/Favorite/${user.userId}/lists`);
      let newLists: FavoriteList[] = [];
      
      if (Array.isArray(response.data)) {
        newLists = response.data;
      } else if (response.data.success && Array.isArray(response.data.data)) {
        newLists = response.data.data;
      }

      // If mockups in favorite lists don't have preview paths, fetch them from all mockups
      if (mockups.length > 0) {
        newLists = newLists.map(list => ({
          ...list,
          mockups: list.mockups.map(mockup => {
            if (!mockup.backgroundImagePreviewPath) {
              const fullMockup = mockups.find(m => m.id === mockup.id);
              return {
                ...mockup,
                backgroundImagePreviewPath: fullMockup?.backgroundImagePreviewPath || ''
              };
            }
            return mockup;
          })
        }));
      }

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

  const handleFileChange = (designAreaId: number, mockupId: number, file: File | null) => {
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
            ? { ...df, designFile: file, previewUrl }
            : df
        );
      }
      return [...prev, { designAreaId, mockupId, designFile: file, previewUrl }];
    });
  };

  // Add function to handle single image upload
  const handleSingleImageUpload = (mockupId: number, file: File | null) => {
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
            ? { ...u, file, previewUrl }
            : u
        );
      }
      return [...prev, { mockupId, file, previewUrl }];
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
      setIsGenerating(true);
      const token = authService.getToken();
      if (!token) return;

      const formData = new FormData();
      
      const mocksToGenerate = selectedListId 
        ? lists.find(list => list.id === selectedListId)?.mockups || []
        : selectedMockups;

      // Add mockupIds
      mocksToGenerate.forEach(mockup => {
        formData.append('mockupIds', mockup.id.toString());
      });

      // Add design files and their corresponding area IDs
      mocksToGenerate.forEach(mockup => {
        const singleUpload = singleImageUploads.find(u => u.mockupId === mockup.id);
        
        if (singleUpload?.file) {
          // If there's a single image upload, use it for all design areas
          mockup.designAreas.forEach(area => {
            formData.append('designAreaIds', area.id.toString());
            if (singleUpload.file) {
              formData.append('designFiles', singleUpload.file);
            }
          });
        } else {
          // Otherwise, use individual design area uploads
          designFiles.forEach(design => {
            if (design.designFile && design.mockupId === mockup.id) {
              formData.append('designAreaIds', design.designAreaId.toString());
              formData.append('designFiles', design.designFile);
            }
          });
        }
      });

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      const response = await axios.post(
        `${API_URL}/api/Mockup/generate`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data'
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
      if (axios.isAxiosError(error) && error.response) {
        const responseData = await error.response.data.text();
        console.error("Server error details:", responseData);
        alert("Error generating mockups. Please make sure you have selected mockups and uploaded design files.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      fetchMockups();
    } else {
      router.push('/login');
    }
  }, []);

  // Add new useEffect to fetch lists when mockups change
  useEffect(() => {
    if (mockups.length > 0) {
      fetchLists();
    }
  }, [mockups]);

  const selectedList = lists.find(list => list.id === selectedListId);
  const mocksToShow = selectedListId ? selectedList?.mockups || [] : selectedMockups;

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
                    Or Choose from Favorite Lists
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

          {/* Upload Designs */}
          {mocksToShow.length > 0 && (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Upload Design Files
                </h3>
              </div>
              <div className="p-6.5">
                {mocksToShow.map(mockup => (
                  <div key={mockup.id} className="mb-8 last:mb-0">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-1 dark:bg-meta-4 rounded-lg">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                        <Image
                          src={formatImagePath(mockup.backgroundImagePreviewPath)}
                          alt={mockup.name}
                          fill
                          className="object-cover"
                        />
                        {mockup.designAreas?.map((area, index) => (
                          <div
                            key={area.id}
                            className="absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center bg-primary text-white rounded-full text-sm font-bold shadow-lg"
                            style={{
                              left: `${area.centerX}%`,
                              top: `${area.centerY}%`,
                              transform: `rotate(${area.angle}deg)`,
                            }}
                          >
                            {index + 1}
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-black dark:text-white">
                          {mockup.name}
                        </h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {mockup.category && <span className="mr-2">{mockup.category}</span>}
                          {mockup.genderCategory && <span className="mr-2">{mockup.genderCategory}</span>}
                          {mockup.sizeCategory && <span>{mockup.sizeCategory}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Single Image Upload Option */}
                    <div className="mb-6 pl-4">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-medium text-black dark:text-white">
                          Single Image for All Design Areas
                        </h3>
                        <div className="text-xs text-gray-500">
                          (Optional)
                        </div>
                      </div>
                      
                      {!singleImageUploads.find(u => u.mockupId === mockup.id)?.file ? (
                        <div className="relative w-full max-w-md">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSingleImageUpload(mockup.id, e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="h-[120px] rounded-lg border-2 border-dashed border-stroke bg-transparent p-4 font-medium outline-none transition hover:border-primary focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary flex flex-col items-center justify-center gap-2">
                            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-500">Upload one image for all design areas</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full max-w-md">
                          <div className="relative h-[120px] rounded-lg overflow-hidden bg-black/5">
                            <Image
                              src={singleImageUploads.find(u => u.mockupId === mockup.id)?.previewUrl!}
                              alt="Preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <button
                            onClick={() => handleSingleImageUpload(mockup.id, null)}
                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-meta-1 text-white rounded-full hover:bg-opacity-90"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Individual Design Area Uploads */}
                    {!singleImageUploads.find(u => u.mockupId === mockup.id)?.file && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-4">
                        {mockup.designAreas?.map((area, index) => (
                          <div key={area.id} className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary text-white rounded-full text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-medium text-black dark:text-white">
                                  {area.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {area.width}x{area.height}px
                                </p>
                              </div>
                            </div>

                            {!designFiles.find(df => df.designAreaId === area.id && df.mockupId === mockup.id)?.designFile ? (
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(area.id, mockup.id, e.target.files?.[0] || null)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="h-[120px] rounded-lg border-2 border-dashed border-stroke bg-transparent p-4 font-medium outline-none transition hover:border-primary focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary flex flex-col items-center justify-center gap-2">
                                  <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm text-gray-500">Click or drop image here</span>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="relative h-[120px] rounded-lg overflow-hidden bg-black/5">
                                  <Image
                                    src={designFiles.find(df => df.designAreaId === area.id && df.mockupId === mockup.id)?.previewUrl!}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <button
                                  onClick={() => handleFileChange(area.id, mockup.id, null)}
                                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-meta-1 text-white rounded-full hover:bg-opacity-90"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!designFiles.some(df => df.designFile) && !singleImageUploads.some(u => u.file))}
                  className="mt-6 flex w-full justify-center rounded-lg bg-primary p-4 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Generate Mockups'}
                </button>
              </div>
            </div>
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