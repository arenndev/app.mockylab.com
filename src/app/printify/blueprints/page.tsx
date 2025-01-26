"use client";

import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { printifyService } from '@/services/printifyService';
import { authService } from '@/services/authService';
import type { Blueprint, BlueprintListResponse } from '@/types/printify';

const PrintifyBlueprints = () => {
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [blueprints, setBlueprints] = useState<BlueprintListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedBlueprints, setSelectedBlueprints] = useState<Set<number>>(new Set());
  const [isAccepting, setIsAccepting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBlueprints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await printifyService.getBlueprints({
        search,
        brand,
        page,
        pageSize
      });
      setBlueprints(response);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlueprints();
  }, [page]); // Re-fetch when page changes

  useEffect(() => {
    const fetchUserBlueprints = async () => {
      try {
        const userId = authService.getUserId() || '1';
        const userBlueprints = await printifyService.getUserBlueprints(userId);
        const userBlueprintIds = new Set(
          userBlueprints.map((ub: { blueprintId: number }) => ub.blueprintId)
        ) as Set<number>;
        setSelectedBlueprints(userBlueprintIds);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      }
    };

    fetchUserBlueprints();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchBlueprints();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const resetSearch = () => {
    setSearch('');
    setBrand('');
    setPage(1);
    fetchBlueprints();
  };

  const handleAcceptBlueprint = async (blueprintId: number) => {
    setIsAccepting(blueprintId);
    setError(null);
    try {
      // Önce variant'ları senkronize et
      await printifyService.syncBlueprintVariants(blueprintId.toString(), 99);

      // Blueprint'i kullanıcıya ekle
      const userId = authService.getUserId() || '1';
      await printifyService.addBlueprintToUser(userId, blueprintId);

      // UI'ı güncelle
      setSelectedBlueprints(prev => new Set([...prev, blueprintId]));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsAccepting(null);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Printify Blueprints" />

        <div className="grid grid-cols-1 gap-9">
          <div className="flex flex-col gap-9">
            {/* Search Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Search in title, description or model..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Filter by brand..."
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      Search
                    </button>
                    <button
                      onClick={resetSearch}
                      className="bg-danger text-white px-4 py-3 rounded-md hover:bg-danger/90 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Blueprints Grid */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="p-6.5">
                {error && (
                  <div className="mb-4 p-4 rounded bg-danger/10 text-danger">
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {blueprints?.items.length || 0} of {blueprints?.totalCount || 0} blueprints
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {blueprints?.items.map((blueprint) => (
                        <div key={blueprint.id} className="border rounded-lg overflow-hidden">
                          {blueprint.images.length > 0 ? (
                            <img
                              src={blueprint.images[0]}
                              alt={blueprint.title}
                              className="w-full h-48 object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{blueprint.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">Brand: {blueprint.brand}</p>
                            <p className="text-sm text-gray-600 mb-4">Model: {blueprint.model}</p>
                            
                            {/* Accept Button */}
                            <button
                              onClick={() => handleAcceptBlueprint(blueprint.id)}
                              disabled={selectedBlueprints.has(blueprint.id) || isAccepting === blueprint.id}
                              className={`w-full px-4 py-2 rounded transition-colors ${
                                selectedBlueprints.has(blueprint.id)
                                  ? 'bg-success text-white cursor-not-allowed'
                                  : 'bg-primary text-white hover:bg-primary/90'
                              }`}
                            >
                              {isAccepting === blueprint.id ? (
                                <span className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Adding...
                                </span>
                              ) : selectedBlueprints.has(blueprint.id) ? (
                                'Added'
                              ) : (
                                'Add to My Blueprints'
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {blueprints && blueprints.totalCount > 0 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={!blueprints?.hasPreviousPage}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm">
                            Page {blueprints.currentPage} of {blueprints.totalPages}
                          </span>
                          <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={!blueprints?.hasNextPage}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {blueprints.totalCount} items
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default PrintifyBlueprints; 