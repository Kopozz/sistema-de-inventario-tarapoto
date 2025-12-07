import React from 'react'
import '../animatedIcons.css'

export const AnimatedIcons = {
  Dashboard: () => (
    <svg className="icon-dashboard" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect className="icon-rect-1" x="3" y="3" width="7" height="7" rx="1"/>
      <rect className="icon-rect-2" x="14" y="3" width="7" height="7" rx="1"/>
      <rect className="icon-rect-3" x="14" y="14" width="7" height="7" rx="1"/>
      <rect className="icon-rect-4" x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  
  Products: () => (
    <svg className="icon-products" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path className="icon-box-back" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline className="icon-box-top" points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line className="icon-box-line" x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  
  Categories: () => (
    <svg className="icon-categories" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect className="icon-cat-1" x="3" y="3" width="7" height="7" rx="1"/>
      <rect className="icon-cat-2" x="14" y="3" width="7" height="7" rx="1"/>
      <rect className="icon-cat-3" x="14" y="14" width="7" height="7" rx="1"/>
      <rect className="icon-cat-4" x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  
  Suppliers: () => (
    <svg className="icon-suppliers" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path className="icon-user-1" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle className="icon-user-circle-1" cx="9" cy="7" r="4"/>
      <path className="icon-user-2" d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path className="icon-user-3" d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  
  Sales: () => (
    <svg className="icon-sales" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle className="icon-cart-wheel-1" cx="9" cy="21" r="1"/>
      <circle className="icon-cart-wheel-2" cx="20" cy="21" r="1"/>
      <path className="icon-cart-path" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  
  Inventory: () => (
    <svg className="icon-inventory" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line className="icon-inv-line" x1="12" y1="1" x2="12" y2="23"/>
      <path className="icon-inv-curve-1" d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  
  Reports: () => (
    <svg className="icon-reports" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line className="icon-bar-1" x1="18" y1="20" x2="18" y2="10"/>
      <line className="icon-bar-2" x1="12" y1="20" x2="12" y2="4"/>
      <line className="icon-bar-3" x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  
  Settings: () => (
    <svg className="icon-settings" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle className="icon-settings-circle" cx="12" cy="12" r="3"/>
      <path className="icon-settings-gear" d="M12 1v6m0 6v6m5.656-17.656l-4.242 4.242m0 8.485l4.242 4.242M23 12h-6m-6 0H1m17.656 5.656l-4.242-4.242m0-8.485l4.242-4.242"/>
    </svg>
  ),
  
  Logout: () => (
    <svg className="icon-logout" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path className="icon-logout-door" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline className="icon-logout-arrow" points="16 17 21 12 16 7"/>
      <line className="icon-logout-line" x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  
  Menu: () => (
    <svg className="icon-menu" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line className="icon-menu-1" x1="3" y1="12" x2="21" y2="12"/>
      <line className="icon-menu-2" x1="3" y1="6" x2="21" y2="6"/>
      <line className="icon-menu-3" x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  
  Close: () => (
    <svg className="icon-close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line className="icon-close-1" x1="18" y1="6" x2="6" y2="18"/>
      <line className="icon-close-2" x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  
  Search: () => (
    <svg className="icon-search" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle className="icon-search-circle" cx="11" cy="11" r="8"/>
      <line className="icon-search-line" x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  
  Filter: () => (
    <svg className="icon-filter" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon className="icon-filter-shape" points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  
  Edit: () => (
    <svg className="icon-edit" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path className="icon-edit-pen" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path className="icon-edit-tip" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  
  Delete: () => (
    <svg className="icon-delete" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline className="icon-delete-lid" points="3 6 5 6 21 6"/>
      <path className="icon-delete-body" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line className="icon-delete-line-1" x1="10" y1="11" x2="10" y2="17"/>
      <line className="icon-delete-line-2" x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  
  Add: () => (
    <svg className="icon-add" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle className="icon-add-circle" cx="12" cy="12" r="10"/>
      <line className="icon-add-line-1" x1="12" y1="8" x2="12" y2="16"/>
      <line className="icon-add-line-2" x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  
  Users: () => (
    <svg className="icon-users" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path className="icon-users-1" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle className="icon-users-circle-1" cx="9" cy="7" r="4"/>
      <path className="icon-users-2" d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path className="icon-users-3" d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
