"use client";

import { useState } from "react";
import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { authService } from "@/services/authService";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';

export default function DesignCreate() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tempPath, setTempPath] = useState<string>("");
  const [remixedImageUrl, setRemixedImageUrl] = useState<string>("");
  const [backgroundRemovedImageUrl, setBackgroundRemovedImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDescription = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      formData.append("imageFile", selectedImage);

      const response = await fetch(`${API_URL}/Ideogram/get-description`, {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API Error Response:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      setDescription(data.description);
      setTempPath(data.tempPath);
    } catch (error) {
      console.error("Error getting description:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundRemoval = async (imageUrl: string) => {
    setIsRemovingBackground(true);
    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.post(
        `${API_URL}/Ideogram/remove-background`,
        { imageUrl: imageUrl },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Background Removal Response:", response.data);
      if (response.data.url) {
        setBackgroundRemovedImageUrl(response.data.url);
      } else if (response.data.backgroundRemovedImageUrl) {
        setBackgroundRemovedImageUrl(response.data.backgroundRemovedImageUrl);
      } else {
        console.error("Unexpected API response format:", response.data);
      }
    } catch (error: any) {
      console.error("Error removing background:", error);
      if (error.response) {
        console.error("Server Error Data:", error.response.data);
        console.error("Server Error Status:", error.response.status);
      }
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleRemix = async () => {
    if (!description || !tempPath) return;

    setIsLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      formData.append('description', description);
      formData.append('tempImagePath', tempPath);

      // Log the request data
      console.log("Sending request with data:", {
        description: description,
        tempImagePath: tempPath
      });

      const response = await axios.post(
        `${API_URL}/Ideogram/remix`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log("Full API Response:", response);
      if (response.data && response.data.remixImageUrl) {
        setRemixedImageUrl(response.data.remixImageUrl);
      } else {
        console.error("Unexpected API response format:", response.data);
      }
    } catch (error: any) {
      console.error("Error remixing image:", error);
      if (error.response) {
        console.error("Full Error Response:", error.response);
        console.error("Error Response Data:", error.response.data);
        console.error("Error Response Headers:", error.response.headers);
        console.error("Error Response Status:", error.response.status);
        // Add user-friendly error message
        alert(error.response.data || "Failed to remix image. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (withBackground: boolean = true) => {
    const imageUrl = withBackground ? remixedImageUrl : backgroundRemovedImageUrl;
    if (!imageUrl) return;

    try {
      setIsLoading(true);
      
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      let endpoint = withBackground 
          ? `${API_URL}/Ideogram/download-image?imageUrl=${encodeURIComponent(imageUrl)}`
          : `${API_URL}/Ideogram/get-processed-image?filePath=${encodeURIComponent(imageUrl)}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${errorText}`);
      }

      const blob = await response.blob();
      const fileName = `remixed-image-${withBackground ? 'with-bg' : 'no-bg'}-${new Date().getTime()}.png`;
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Design Create" />
      
      <div className="flex flex-col gap-10">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              Create and Remix Design
            </h3>
          </div>
          
          <div className="p-6.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol Sütun - Kontroller */}
              <div className="flex flex-col gap-4.5">
                <div className="mb-4.5">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-2 file:hover:bg-primary file:hover:bg-opacity-10 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white"
                  />
                </div>

                <button
                  onClick={getDescription}
                  disabled={!selectedImage || isLoading}
                  className="flex w-full justify-center rounded bg-primary p-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-opacity-50"
                >
                  {isLoading ? "Processing..." : "Get Description"}
                </button>

                {description && (
                  <>
                    <div className="mb-4.5">
                      <label className="mb-2.5 block text-black dark:text-white">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      />
                    </div>

                    <button
                      onClick={handleRemix}
                      disabled={isLoading}
                      className="flex w-full justify-center rounded bg-success p-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-opacity-50"
                    >
                      {isLoading ? "Processing..." : "Remix Image"}
                    </button>
                  </>
                )}
              </div>

              {/* Sağ Sütun - Önizlemeler */}
              <div className="flex flex-col gap-4.5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {imagePreview && (
                    <div>
                      <h4 className="mb-2.5 text-black dark:text-white">
                        Original Image
                      </h4>
                      <div className="relative h-[400px] w-full rounded-sm border border-stroke dark:border-strokedark">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    </div>
                  )}

                  {remixedImageUrl && (
                    <div>
                      <div className="flex flex-col gap-4 mb-4">
                        <h4 className="text-black dark:text-white font-medium">
                          Remixed Image
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleBackgroundRemoval(remixedImageUrl)}
                            disabled={isLoading || isRemovingBackground || !remixedImageUrl}
                            className="inline-flex items-center gap-2 rounded bg-warning px-4 py-2 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                              />
                            </svg>
                            {isRemovingBackground ? "Processing..." : "Remove Background"}
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(true)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              {isLoading ? "Downloading..." : "Download Original"}
                            </button>
                            
                            {backgroundRemovedImageUrl && (
                              <button
                                onClick={() => handleDownload(false)}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 rounded bg-success px-4 py-2 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                {isLoading ? "Downloading..." : "Download No Background"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative h-[400px] w-full rounded-sm border border-stroke dark:border-strokedark">
                        <Image
                          src={remixedImageUrl}
                          alt="Remixed"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-contain p-2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Boş alan göstergesi */}
                {!imagePreview && !remixedImageUrl && (
                  <div className="flex items-center justify-center h-[400px] w-full rounded-sm border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
                    <p className="text-gray-500 dark:text-gray-400">
                      Upload an image to see preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
} 