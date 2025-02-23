import React, { useState, useEffect } from 'react';
import { printifyService } from '@/services/printifyService';
import { authService } from '@/services/authService';
import type { BlueprintVariant, UserOfVariant, UpdateVariantRequest } from '@/types/printify';
import { DesignColorEnum } from '@/types/printify';

interface VariantManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprintId: string;
  variants: BlueprintVariant[];
  onSave?: () => void;
}

const VariantManagementModal = ({ isOpen, onClose, blueprintId, variants, onSave }: VariantManagementModalProps) => {
  const [userVariants, setUserVariants] = useState<UserOfVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [hasChanges, setHasChanges] = useState(false);
  const [localUserVariants, setLocalUserVariants] = useState<UserOfVariant[]>([]);

  const fetchUserVariants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = authService.getUserId();
      if (!userId) {
        setError('User authentication error');
        return;
      }

      const variants = await printifyService.getUserVariantsByBlueprint(userId, parseInt(blueprintId));
      setUserVariants(variants);
      setLocalUserVariants(variants);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch user variants');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariantToggle = async (variant: BlueprintVariant) => {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        setError('User authentication error');
        return;
      }

      const existingVariant = localUserVariants.find(v => v.variantId === variant.variantId);
      
      if (existingVariant) {
        setLocalUserVariants(prev => 
          prev.map(v => 
            v.id === existingVariant.id 
              ? { ...v, isEnabled: !v.isEnabled } 
              : v
          )
        );
      } else {
        const newVariant = {
          id: -Date.now(),
          userId: parseInt(userId),
          blueprintId: parseInt(blueprintId),
          variantId: variant.variantId,
          defaultPrice: 30.00,
          isEnabled: true,
          designColor: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: null
        };
        setLocalUserVariants(prev => [...prev, newVariant]);
      }
      setHasChanges(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update variant');
    }
  };

  const handlePriceChange = (variant: UserOfVariant, price: number) => {
    setLocalUserVariants(prev => 
      prev.map(v => 
        v.id === variant.id 
          ? { ...v, defaultPrice: price } 
          : v
      )
    );
    setHasChanges(true);
  };

  const designColorToEnum = (color: string): DesignColorEnum => {
    switch (color) {
      case 'Black': return 0;
      case 'White': return 1;
      case 'Color': return 2;
      default: return 0;
    }
  };

  const enumToDesignColor = (colorEnum: number): string => {
    switch (colorEnum) {
      case 0: return 'Black';
      case 1: return 'White';
      case 2: return 'Color';
      default: return 'Black';
    }
  };

  const handleDesignColorChange = (variant: UserOfVariant, designColor: string) => {
    setLocalUserVariants(prev => 
      prev.map(v => 
        v.id === variant.id 
          ? { ...v, designColor: designColorToEnum(designColor) } 
          : v
      )
    );
    setHasChanges(true);
  };

  // Gerçek ID'leri kontrol etmek için yardımcı fonksiyon
  const isRealId = (id: number): boolean => {
    return Number.isInteger(id) && id > 0; // Gerçek ID'ler pozitif tam sayılar
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('User authentication error');
        return;
      }

      // Mevcut varyantları güncelle (sadece gerçek ID'si olanlar)
      const updateRequests = localUserVariants
        .filter(v => isRealId(v.id)) // Geçici ID'leri filtrele
        .map(variant => ({
          id: variant.id,
          defaultPrice: variant.defaultPrice,
          isEnabled: variant.isEnabled,
          isActive: true,
          isSelected: false,
          designColor: variant.designColor
        }));

      // Yeni varyantları oluştur (sadece geçici ID'si olanlar)
      const createRequests = localUserVariants
        .filter(v => !isRealId(v.id)) // Sadece geçici ID'si olanlar
        .map(variant => ({
          userId: parseInt(userId),
          blueprintId: parseInt(blueprintId),
          variantId: variant.variantId,
          defaultPrice: variant.defaultPrice,
          isEnabled: variant.isEnabled,
          isSelected: false,
          designColor: variant.designColor
        }));

      // Request'i console'a yazdıralım
      console.log('Bulk Operations Request:', {
        updateRequests: updateRequests.length > 0 ? updateRequests : undefined,
        createRequests: createRequests.length > 0 ? createRequests : undefined
      });

      // Bulk operations
      const response = await printifyService.bulkOperations({
        updateRequests: updateRequests.length > 0 ? updateRequests : undefined,
        createRequests: createRequests.length > 0 ? createRequests : undefined
      });

      console.log('Bulk Operations Response:', response);

      // Başarılı olduktan sonra güncel listeyi tekrar çek
      await fetchUserVariants();
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Save Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update variants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserVariants();
      setHasChanges(false);
      setSearchTerm('');
      setCurrentPage(1);
    }
  }, [isOpen, blueprintId]);

  const filteredVariants = variants.filter(variant => 
    variant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.entries(variant.options).some(([key, value]) => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredVariants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVariants = filteredVariants.slice(startIndex, startIndex + itemsPerPage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
      <div className="bg-white dark:bg-boxdark w-full max-w-4xl my-8 rounded-lg shadow-lg">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark sticky top-0 bg-white dark:bg-boxdark z-[9999]">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-black dark:text-white">Variant Management</h3>
            <div className="flex items-center gap-4">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
              )}
              <button
                onClick={onClose}
                className="text-black dark:text-white hover:text-opacity-70 bg-gray-200 dark:bg-gray-700 p-2 rounded-md"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6.5">
          {/* Search */}
          <div className="mb-4 sticky top-[73px] bg-white dark:bg-boxdark z-10 pb-4">
            <input
              type="text"
              placeholder="Search variants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          {error && (
            <div className="bg-danger/10 text-danger px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 max-h-[60vh] overflow-y-auto">
                {currentVariants.map((variant) => {
                  const userVariant = localUserVariants.find(v => v.variantId === variant.variantId);
                  return (
                    <div
                      key={variant.id}
                      className="border border-stroke dark:border-strokedark rounded-sm p-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={userVariant?.isEnabled ?? false}
                              onChange={() => handleVariantToggle(variant)}
                              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <h5 className="text-black dark:text-white font-medium">
                              {variant.title}
                            </h5>
                          </div>
                          {userVariant && (
                            <div className="flex items-center gap-4">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={userVariant.defaultPrice}
                                onChange={(e) => handlePriceChange(userVariant, parseFloat(e.target.value))}
                                className="w-24 rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                              />
                              <select
                                value={enumToDesignColor(userVariant.designColor)}
                                onChange={(e) => handleDesignColorChange(userVariant, e.target.value)}
                                className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-3"
                              >
                                <option value="Black">Black Design</option>
                                <option value="White">White Design</option>
                                <option value="Color">Color Design</option>
                              </select>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {Object.entries(variant.options).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 sticky bottom-0 bg-white dark:bg-boxdark pb-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariantManagementModal; 