import React, { useState, useEffect } from 'react';
import { printifyService } from '@/services/printifyService';
import { authService } from '@/services/authService';

interface VariantManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprintId: string;
  variants: any[];
  onSave?: () => void;
}

const VariantManagementModal = ({ isOpen, onClose, blueprintId, variants, onSave }: VariantManagementModalProps) => {
  const [userVariants, setUserVariants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleVariantToggle = async (variant: any) => {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        setError('User authentication error');
        return;
      }

      const existingVariant = userVariants.find(v => v.variantId === variant.variantId);
      
      if (existingVariant) {
        await printifyService.updateUserVariant(existingVariant.id, {
          defaultPrice: existingVariant.defaultPrice,
          isEnabled: !existingVariant.isEnabled,
          isActive: true
        });
      } else {
        await printifyService.createUserVariant({
          userId: parseInt(userId),
          blueprintId: parseInt(blueprintId),
          variantId: variant.variantId,
          defaultPrice: 30.00,
          isEnabled: true
        });
      }

      await fetchUserVariants();
      setHasChanges(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update variant');
      }
    }
  };

  const handlePriceChange = async (variant: any, price: number) => {
    try {
      await printifyService.updateUserVariant(variant.id, {
        defaultPrice: price,
        isEnabled: variant.isEnabled,
        isActive: true
      });
      await fetchUserVariants();
      setHasChanges(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update price');
      }
    }
  };

  const handleSave = () => {
    onSave?.();
    onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
      <div className="bg-white dark:bg-boxdark w-full max-w-4xl my-8 rounded-lg shadow-lg">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark sticky top-0 bg-white dark:bg-boxdark z-10">
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
                  const userVariant = userVariants.find(v => v.variantId === variant.variantId);
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
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={userVariant.defaultPrice}
                              onChange={(e) => handlePriceChange(userVariant, parseFloat(e.target.value))}
                              className="w-24 rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
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