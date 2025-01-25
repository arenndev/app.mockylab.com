"use client";

import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import axios from 'axios';
import { authService } from '@/services/authService';
import { useParams } from 'next/navigation';
import { API_URL } from '@/utils/apiConfig';

interface Blueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
  printProviderId: number;
}

interface VariantResponse {
  printProviderId: number;
  title: string;
  variants: BlueprintVariant[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BlueprintVariant {
  id: number;
  blueprintId: number;
  printProviderId: number;
  variantId: number;
  title: string;
  options: any; // JSON formatted options
  isActive: boolean;
  placeholders: VariantPlaceholder[];
}

interface VariantPlaceholder {
  id: number;
  variantId: number;
  position: string;
  width: number;
  height: number;
  isActive: boolean;
}

const BlueprintDetail = () => {
  const params = useParams();
  const blueprintId = params.id as string;

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [variants, setVariants] = useState<VariantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlueprint = async () => {
    try {
      console.log('Fetching blueprint details for ID:', blueprintId);
      const token = authService.getToken();
      if (!token) {
        console.error('No auth token found');
        return null;
      }
      const response = await axios.get(`${API_URL}/Printify/blueprints/${blueprintId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Blueprint API Response:', response.data);
      setBlueprint(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching blueprint:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
      }
      return null;
    }
  };

  const fetchVariants = async () => {
    try {
      console.log('Fetching variants from database for blueprint:', blueprintId);
      const token = authService.getToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      const response = await axios.get<VariantResponse>(
        `${API_URL}/Printify/blueprints/${blueprintId}/variants`,
        {
          params: {
            printProviderId: 99,
            page,
            pageSize
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Database Variants Response:', response.data);
      console.log('First variant details:', response.data.variants?.[0]);
      
      if (!response.data.variants || response.data.variants.length === 0) {
        setNeedsSync(true);
        setVariants(null);
      } else {
        setNeedsSync(false);
        setVariants(response.data);
      }
    } catch (error) {
      console.error('Error fetching variants from database:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        if (error.response?.status === 404 || error.response?.status === 500) {
          setNeedsSync(true);
        }
        setVariants(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const syncVariants = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      console.log('Starting variant sync with Printify');
      const token = authService.getToken();
      if (!token) {
        console.error('No auth token found');
        setError('Authentication error. Please try logging in again.');
        return;
      }

      const syncResponse = await axios.post(
        `${API_URL}/Printify/blueprints/${blueprintId}/variants/sync`,
        {},
        {
          params: {
            printProviderId: 99
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Printify Sync Response:', syncResponse.data);

      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsLoading(true);
      await fetchVariants();
    } catch (error) {
      console.error('Error during variant sync:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        
        // API key hatası
        if (error.response?.status === 400 && error.response?.data.includes('API key not found')) {
          alert('Printify API key not found. Please set it in the settings page.');
          window.location.href = '/printify/settings';
          return;
        }
        
        // 404 hatası - Blueprint Printify'da bulunamadı
        if (error.response?.status === 500 && error.response?.data.includes('404')) {
          setError('This blueprint could not be found on Printify. It might have been deleted or is temporarily unavailable.');
          return;
        }

        // Diğer hatalar
        setError(error.response?.data || 'An error occurred while syncing variants.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchBlueprint();
      await fetchVariants();
    };
    
    initializeData();
  }, [blueprintId, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName={blueprint?.title || 'Blueprint Details'} />

        <div className="grid grid-cols-1 gap-9">
          {/* Blueprint Info */}
          {blueprint && (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6.5">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  {blueprint.images.length > 0 && (
                    <img
                      src={blueprint.images[0]}
                      alt={blueprint.title}
                      className="w-full rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="w-full md:w-2/3">
                  <h2 className="text-2xl font-bold mb-4">{blueprint.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">Brand: {blueprint.brand}</p>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Model: {blueprint.model}</p>
                  <p className="text-gray-600 dark:text-gray-300">{blueprint.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Variants Section */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-black dark:text-white">Variants</h3>
                {needsSync && !error && (
                  <button
                    onClick={syncVariants}
                    disabled={isSyncing}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Variants'}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6.5">
              {error && (
                <div className="bg-danger/10 text-danger px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : variants && variants.variants && variants.variants.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variants.variants.map((variant) => (
                      <div key={variant.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{variant.title}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Provider ID: {variants.printProviderId}</p>
                          <p>ID: {variant.id}</p>
                          <p>Variant ID: {variant.variantId}</p>
                          <div className="mt-2">
                            <p className="font-medium mb-1">Options:</p>
                            {Object.entries(variant.options).map(([key, value]) => (
                              <p key={key} className="ml-2">
                                {key}: {value as string}
                              </p>
                            ))}
                          </div>
                          <div className="mt-2">
                            <p className="font-medium mb-1">Placeholders:</p>
                            <ul className="list-disc list-inside">
                              {variant.placeholders.map((placeholder) => (
                                <li key={placeholder.id}>
                                  {placeholder.position} ({placeholder.width}x{placeholder.height})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {variants.totalCount > 0 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={!variants.hasPreviousPage}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm">
                          Page {variants.currentPage} of {variants.totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={!variants.hasNextPage}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: {variants.totalCount} items
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No variants found for this blueprint. {needsSync ? 'Click "Sync Variants" to fetch them from Printify.' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default BlueprintDetail; 