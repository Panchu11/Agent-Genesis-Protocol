'use client';

import React from 'react';

export default function TestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Deployment Test Page</h1>
        <p className="text-gray-700 mb-4">
          This is a simple test page to verify that the deployment is working correctly.
        </p>
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <p className="text-blue-700 font-medium">
            If you can see this page, the deployment is working!
          </p>
        </div>
      </div>
    </div>
  );
}
