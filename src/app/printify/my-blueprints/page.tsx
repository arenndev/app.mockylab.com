"use client";

import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { printifyService } from '@/services/printifyService';
import { authService } from '@/services/authService';
import { getCurrentUserId } from '@/utils/apiConfig';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Blueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

interface UserBlueprint {
  id: number;
  userId: number;
  blueprintId: number;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
  blueprint?: Blueprint;
}

const MyBlueprints = () => {
  const router = useRouter();
  const [userBlueprints, setUserBlueprints] = useState<UserBlueprint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserBlueprints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = getCurrentUserId();
      console.log('Fetching blueprints for user ID:', userId);

      const blueprints = await printifyService.getUserBlueprints(userId);
      console.log('User blueprints response:', blueprints);
      
      blueprints.forEach((blueprint, index) => {
        console.log(`Blueprint ${index}:`, blueprint);
        console.log(`Blueprint ${index} details:`, blueprint.blueprint);
      });
      
      setUserBlueprints(blueprints);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch blueprints');
      }
      console.error('Error fetching user blueprints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBlueprint = async (id: number) => {
    try {
      await printifyService.removeUserBlueprint(id);
      await fetchUserBlueprints(); // Refresh list after deletion
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to remove blueprint');
      }
      console.error('Error removing blueprint:', err);
    }
  };

  useEffect(() => {
    fetchUserBlueprints();
  }, []);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="My Blueprints" />

        <div className="grid grid-cols-1 gap-9">
          <div className="flex flex-col gap-9">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                My Selected Blueprints
              </h2>
              <Link
                href="/printify/blueprints"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
              >
                Add New Blueprint
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/10 text-danger px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Blueprints Grid */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="p-6.5">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {userBlueprints.map((userBlueprint) => {
                      console.log('Rendering blueprint:', userBlueprint);
                      return (
                        <div key={userBlueprint.id} className="border rounded-lg overflow-hidden">
                          {userBlueprint.blueprint && userBlueprint.blueprint.images && userBlueprint.blueprint.images.length > 0 ? (
                            <img
                              src={userBlueprint.blueprint.images[0]}
                              alt={userBlueprint.blueprint.title}
                              className="w-full h-48 object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder.jpg';
                                console.log('Image load error, using placeholder');
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2">
                              {userBlueprint.blueprint?.title || 'Unknown Blueprint'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Brand: {userBlueprint.blueprint?.brand || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                              Model: {userBlueprint.blueprint?.model || 'N/A'}
                            </p>
                            <div className="flex flex-col gap-2">
                              <Link
                                href={`/printify/my-blueprints/${userBlueprint.blueprintId}`}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                              >
                                View Details
                              </Link>
                              <button
                                onClick={() => handleRemoveBlueprint(userBlueprint.id)}
                                className="inline-flex items-center justify-center rounded-md bg-danger px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isLoading && userBlueprints.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No blueprints selected yet. Click "Add New Blueprint" to get started.
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

export default MyBlueprints; 