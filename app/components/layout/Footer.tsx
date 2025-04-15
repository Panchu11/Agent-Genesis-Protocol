'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Agent Genesis Protocol
            </p>
          </div>
          <div className="flex space-x-4">
            <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900">
              About
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
              Terms
            </Link>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>Built by Panchu</p>
          <p>Powered by Sentient</p>
        </div>
      </div>
    </footer>
  );
}
