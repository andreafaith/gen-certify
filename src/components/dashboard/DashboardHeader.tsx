import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  DocumentPlusIcon,
  CogIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Templates', href: '/dashboard/templates', icon: DocumentDuplicateIcon },
  { name: 'Certificates', href: '/dashboard/certificates', icon: DocumentPlusIcon },
  { name: 'Data', href: '/dashboard/data', icon: TableCellsIcon },
];

const userNavigation = [
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

export function DashboardHeader() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white shadow">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link to="/dashboard" className="-m-1.5 p-1.5">
              <span className="text-2xl font-semibold text-indigo-600">Certify</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={clsx(
                  'inline-flex items-center text-sm font-medium px-3 py-2 rounded-md',
                  {
                    'text-indigo-600 bg-indigo-50': isActive(item.href),
                    'text-gray-700 hover:text-indigo-600 hover:bg-gray-50': !isActive(item.href),
                  }
                )}
              >
                <item.icon className="h-5 w-5 mr-2" aria-hidden="true" />
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Desktop user navigation */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            {userNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={clsx(
                  'inline-flex items-center text-sm font-medium px-3 py-2 rounded-md',
                  {
                    'text-indigo-600 bg-indigo-50': isActive(item.href),
                    'text-gray-700 hover:text-indigo-600 hover:bg-gray-50': !isActive(item.href),
                  }
                )}
              >
                <item.icon className="h-5 w-5 mr-2" aria-hidden="true" />
                {item.name}
              </NavLink>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => supabase.auth.signOut()}
              className="ml-4"
            >
              Sign out
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'block rounded-md px-3 py-2 text-base font-medium',
                    {
                      'text-indigo-600 bg-indigo-50': isActive(item.href),
                      'text-gray-700 hover:text-indigo-600 hover:bg-gray-50': !isActive(item.href),
                    }
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-2" aria-hidden="true" />
                    {item.name}
                  </div>
                </NavLink>
              ))}
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="px-4 flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {userNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'block rounded-md px-3 py-2 text-base font-medium',
                      {
                        'text-indigo-600 bg-indigo-50': isActive(item.href),
                        'text-gray-700 hover:text-indigo-600 hover:bg-gray-50': !isActive(item.href),
                      }
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-2" aria-hidden="true" />
                      {item.name}
                    </div>
                  </NavLink>
                ))}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    supabase.auth.signOut();
                  }}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}