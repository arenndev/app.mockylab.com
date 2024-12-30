"use client";

import { useState } from "react";
import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { authService } from "@/services/authService";
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function DesignCreate() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tempPath, setTempPath] = useState<string>("");
  const [remixedImageUrl, setRemixedImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
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

      const response = await fetch("http://localhost:5002/api/Ideogram/get-description", {
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

  const handleRemix = async () => {
    if (!description || !tempPath) return;

    setIsLoading(true);
    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams();
      params.append("description", description);
      params.append("tempImagePath", tempPath);

      console.log("Sending params:", {
        description: description,
        tempImagePath: tempPath
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await axios.post(`${API_URL}/api/Ideogram/remix`, params, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log("Remix API Response:", response.data);
      setRemixedImageUrl(response.data.remixImageUrl);
    } catch (error: any) {
      console.error("Error remixing image:", error);
      if (error.response) {
        console.error("Server Error Data:", error.response.data);
        console.error("Server Error Status:", error.response.status);
        console.error("Server Error Headers:", error.response.headers);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!remixedImageUrl) return;

    try {
      setIsLoading(true);
      
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Backend üzerinden indirme işlemi
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/Ideogram/download-image?imageUrl=${encodeURIComponent(remixedImageUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const fileName = `remixed-image-${new Date().getTime()}.png`;
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
                      <div className="flex justify-between items-center mb-2.5">
                        <h4 className="text-black dark:text-white">
                          Remixed Image
                        </h4>
                        <button
                          onClick={handleDownload}
                          disabled={isLoading}
                          className="flex items-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
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
                          {isLoading ? "Downloading..." : "Download"}
                        </button>
                      </div>
                      <div className="relative h-[400px] w-full rounded-sm border border-stroke dark:border-strokedark">
                        <Image
                          src={remixedImageUrl}
                          alt="Remixed"
                          fill
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