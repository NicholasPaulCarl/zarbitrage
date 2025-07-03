import { APP_VERSION, BUILD_DATE } from '@/lib/version';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <p>© 2025 ZArbitrage. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-md">
              v{APP_VERSION}
            </span>
            <span className="text-xs text-gray-500">
              Built {BUILD_DATE}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}