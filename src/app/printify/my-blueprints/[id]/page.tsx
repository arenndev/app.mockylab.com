"use client";

import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { printifyService } from '@/services/printifyService';
import { useParams } from 'next/navigation';
import type { Blueprint, VariantResponse, BlueprintVariant, VariantPlaceholder } from '@/types/printify';

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
      const data = await printifyService.getBlueprintDetails(blueprintId);
      setBlueprint(data);
      return data;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch blueprint details');
      }
      return null;
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await printifyService.getBlueprintVariants(blueprintId, {
        printProviderId: 99,
        page,
        pageSize
      });
      
      if (!response.variants || response.variants.length === 0) {
        setNeedsSync(true);
        setVariants(null);
      } else {
        setNeedsSync(false);
        setVariants(response);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        if (err.message.includes('404') || err.message.includes('500')) {
          setNeedsSync(true);
        }
      } else {
        setError('Failed to fetch variants');
      }
      setVariants(null);
    } finally {
      setIsLoading(false);
    }
  };

  const syncVariants = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await printifyService.syncBlueprintVariants(blueprintId, 99);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(true);
      await fetchVariants();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sync variants');
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
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.jpg';
                      }}
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
              ) : variants ? (
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