
import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
