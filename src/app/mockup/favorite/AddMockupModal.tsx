import { useState, useEffect } from "react";
import Image from "next/image";

interface AddMockupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mockupIds: number[]) => void;
  mockups: {
    id: number;
    name: string;
    backgroundImagePreviewPath: string;
    category?: string;
    genderCategory?: string;
    sizeCategory?: string;
  }[];
  currentListMockups: number[]; // Array of mockup IDs that are already in the list
}

const AddMockupModal = ({
  isOpen,
  onClose,
  onAdd,
  mockups,
  currentListMockups,
}: AddMockupModalProps) => {
  const [selectedMockupIds, setSelectedMockupIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize selected mockups when modal opens
  useEffect(() => {
    if (isOpen && currentListMockups) {
      setSelectedMockupIds(currentListMockups);
    }
  }, [isOpen, currentListMockups]);

  if (!isOpen) return null;

  const filteredMockups = mockups.filter(mockup => 
    mockup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mockup.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mockup.genderCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mockup.sizeCategory?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMockupSelection = (mockupId: number) => {
    setSelectedMockupIds(prev => {
      if (prev.includes(mockupId)) {
        return prev.filter(id => id !== mockupId);
      } else {
        return [...prev, mockupId];
      }
    });
  };

  const handleClose = () => {
    setSelectedMockupIds([]);
    setSearchTerm("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-4xl h-[90vh] rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="sticky top-0 z-10 border-b border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Add Mockups to List
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Selected: {selectedMockupIds.length} mockups
              </p>
            </div>
            <button
              onClick={handleClose}
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

          <input
            type="text"
            placeholder="Search mockups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
          />
        </div>

        <div className="p-6 overflow-y-auto" style={{ height: 'calc(90vh - 180px)' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMockups.map((mockup) => (
              <div
                key={mockup.id}
                onClick={() => toggleMockupSelection(mockup.id)}
                className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-lg
                  ${selectedMockupIds.includes(mockup.id)
                    ? 'border-primary bg-primary bg-opacity-10' 
                    : 'border-stroke dark:border-strokedark'
                  }`}
              >
                {selectedMockupIds.includes(mockup.id) && (
                  <div className="absolute top-4 right-4 z-10 bg-primary text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                )}
                <div className="relative aspect-square w-full mb-2 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={mockup.backgroundImagePreviewPath}
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
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-2.5 text-center font-medium hover:bg-opacity-90"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedMockupIds.length > 0) {
                  onAdd(selectedMockupIds);
                  handleClose();
                }
              }}
              disabled={selectedMockupIds.length === 0}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
            >
              Add Selected ({selectedMockupIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMockupModal; 