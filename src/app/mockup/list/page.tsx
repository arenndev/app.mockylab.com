'use client';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Modal,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';

interface MockupData {
  id: number;
  name: string;
  category: string;
  genderCategory: string;
  designColor: string;
  backgroundImagePreviewPath: string;
  sizeCategory: string;
  tshirtCategory: string;
}

const MockupList = () => {
  const [mockups, setMockups] = useState<MockupData[]>([]);
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMockupId, setSelectedMockupId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchMockups();
  }, []);

  const fetchMockups = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await axios.get(`${API_URL}/api/Mockup`);
      
      if (response.data.success) {
        setMockups(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching mockups:', error);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/mockup/edit?mockupId=${id}`);
  };

  const handleView = (id: number) => {
    router.push(`/mockup/detail/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedMockupId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedMockupId) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await axios.delete(`${API_URL}/api/Mockup/${selectedMockupId}`);
      
      if (response.data.success) {
        fetchMockups();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting mockup:', error);
    }
  };

  const handlePreviewOpen = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const handlePreviewClose = () => {
    setPreviewImage(null);
  };

  const preloadImage = (imageUrl: string) => {
    if (!preloadedImages[imageUrl]) {
      const img = new window.Image();
      img.src = imageUrl;
      setPreloadedImages(prev => ({ ...prev, [imageUrl]: true }));
    }
  };

  const handleMouseEnter = (imageUrl: string) => {
    preloadImage(imageUrl);
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Mockup List" />

      <div className="flex flex-col gap-10">
        <Card className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="max-w-full overflow-x-auto">
            <Table className="dark:text-white">
              <TableHead>
                <TableRow className="dark:border-strokedark">
                  <TableCell className="dark:text-white">Preview</TableCell>
                  <TableCell className="dark:text-white">Name</TableCell>
                  <TableCell className="dark:text-white">Category</TableCell>
                  <TableCell className="dark:text-white">Gender</TableCell>
                  <TableCell className="dark:text-white">Color</TableCell>
                  <TableCell className="dark:text-white">Size</TableCell>
                  <TableCell className="dark:text-white">Type</TableCell>
                  <TableCell align="right" className="dark:text-white">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockups.map((mockup) => (
                  <TableRow 
                    key={mockup.id}
                    className="hover:bg-gray-2 dark:hover:bg-meta-4 dark:border-strokedark"
                  >
                    <TableCell className="dark:text-white">
                      <div className="relative w-12.5 h-12.5">
                        <Image 
                          src={mockup.backgroundImagePreviewPath} 
                          alt={mockup.name}
                          fill
                          sizes="(max-width: 50px) 100vw"
                          className="rounded-md object-cover"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEwSkNOPTYwPTYyRkNUSFZIMS8wTEY3RkVQWUZGUktLe4JzXHJFR0X/2wBDABUXFx4aHh0eHUEgICBFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        />
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-white">{mockup.name}</TableCell>
                    <TableCell className="dark:text-white">{mockup.category}</TableCell>
                    <TableCell className="dark:text-white">{mockup.genderCategory}</TableCell>
                    <TableCell className="dark:text-white">{mockup.designColor}</TableCell>
                    <TableCell className="dark:text-white">{mockup.sizeCategory}</TableCell>
                    <TableCell className="dark:text-white">{mockup.tshirtCategory}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end space-x-2">
                        <Tooltip title="Details">
                          <IconButton 
                            onClick={() => handlePreviewOpen(mockup.backgroundImagePreviewPath)}
                            onMouseEnter={() => handleMouseEnter(mockup.backgroundImagePreviewPath)}
                            className="hover:text-primary dark:text-white dark:hover:text-primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={() => handleEdit(mockup.id)}
                            className="hover:text-success dark:text-white dark:hover:text-success"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            onClick={() => handleDeleteClick(mockup.id)}
                            className="hover:text-danger dark:text-white dark:hover:text-danger"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5">
          <div className="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 text-center dark:bg-boxdark md:px-17.5 md:py-15">
            <span className="mx-auto inline-block">
              <svg
                width="60"
                height="60"
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  opacity="0.1"
                  width="60"
                  height="60"
                  rx="30"
                  fill="#DC2626"
                />
                <path
                  d="M30 27.2498V29.9998V27.2498ZM30 33.7498V34.4998V33.7498ZM30 42.4998C36.9037 42.4998 42.5 36.9035 42.5 29.9998C42.5 23.0962 36.9037 17.4998 30 17.4998C23.0963 17.4998 17.5 23.0962 17.5 29.9998C17.5 36.9035 23.0963 42.4998 30 42.4998Z"
                  stroke="#DC2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h3 className="mt-5.5 pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
              Delete Mockup
            </h3>
            <p className="mb-10 font-medium">
              Are you sure you want to delete this mockup?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded border border-stroke py-2 px-6 text-black hover:border-meta-1 hover:bg-meta-1 hover:text-white dark:border-strokedark dark:text-white dark:hover:border-meta-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded border border-meta-1 bg-meta-1 py-2 px-6 text-white hover:bg-opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed top-0 left-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5">
          <div className="relative w-full max-w-180 rounded-lg bg-white p-4 dark:bg-boxdark">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 text-black hover:text-meta-1 dark:text-white z-10"
            >
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.8913 9.99599L19.5043 2.38635C20.032 1.85888 20.032 1.02306 19.5043 0.495589C18.9768 -0.0317329 18.141 -0.0317329 17.6135 0.495589L10.0001 8.10559L2.38673 0.495589C1.85926 -0.0317329 1.02344 -0.0317329 0.495971 0.495589C-0.0317515 1.02306 -0.0317515 1.85888 0.495971 2.38635L8.10897 9.99599L0.495971 17.6056C-0.0317515 18.1331 -0.0317515 18.9689 0.495971 19.4964C0.717066 19.7175 1.05898 19.9001 1.4413 19.9001C1.75372 19.9001 2.13282 19.7175 2.38673 19.4964L10.0001 11.8864L17.6135 19.4964C17.8346 19.7175 18.1765 19.9001 18.5588 19.9001C18.8712 19.9001 19.2503 19.7175 19.5043 19.4964C20.032 18.9689 20.032 18.1331 19.5043 17.6056L11.8913 9.99599Z"
                  fill=""
                />
              </svg>
            </button>
            <div className="relative w-full h-[80vh]">
              <Image
                src={previewImage}
                alt="Mockup Preview"
                fill
                sizes="(max-width: 1200px) 100vw"
                className="rounded-lg object-contain"
                quality={85}
                priority={true}
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default MockupList; 