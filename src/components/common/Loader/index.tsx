const Loader = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-solid border-gray-200"></div>
        <div className="absolute top-0 left-0 h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    </div>
  );
};

export default Loader;
