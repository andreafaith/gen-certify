import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  DocumentPlusIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon,
  ArrowsPointingInIcon,
  CogIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Templates', href: '/dashboard/templates', icon: DocumentDuplicateIcon },
  {
    name: 'Certificates',
    href: '/dashboard/certificates',
    icon: DocumentPlusIcon,
  },
  { 
    name: 'Data Management',
    href: '/dashboard/data',
    icon: TableCellsIcon,
    children: [
      {
        name: 'Upload Data',
        href: '/dashboard/data/upload',
        icon: TableCellsIcon,
      },
      {
        name: 'Preview Data',
        href: '/dashboard/data/preview',
        icon: ClipboardDocumentListIcon,
      },
      {
        name: 'Field Mapping',
        href: '/dashboard/data/mapping',
        icon: ArrowsPointingInIcon,
      },
    ],
  },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

export function DashboardSidebar() {
  return (
    <div className="w-64 bg-white shadow-sm">
      <nav className="mt-5 px-2 space-y-1">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <>
                <div className="px-2 py-2 text-sm font-medium text-gray-600">
                  <span className="flex items-center">
                    <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                    {item.name}
                  </span>
                </div>
                <div className="ml-4 space-y-1">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.name}
                      to={child.href}
                      className={({ isActive }) =>
                        clsx(
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                          {
                            'bg-gray-100 text-gray-900': isActive,
                            'text-gray-600 hover:bg-gray-50 hover:text-gray-900':
                              !isActive,
                          }
                        )
                      }
                    >
                      <child.icon
                        className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                        aria-hidden="true"
                      />
                      {child.name}
                    </NavLink>
                  ))}
                </div>
              </>
            ) : (
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    {
                      'bg-gray-100 text-gray-900': isActive,
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900':
                        !isActive,
                    }
                  )
                }
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}