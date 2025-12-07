import React from 'react'
import '../searchInput.css'
import { AnimatedIcons } from './AnimatedIcons'

export default function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Buscar...",
  onFilterClick,
  showFilterActive = false
}) {
  const hasFilter = typeof onFilterClick === 'function'
  return (
    <div className="search-wrapper">
      <div className="search-grid" />
      <div className="search-poda">
        <div className="search-glow" />
        <div className="search-darkBorderBg" />
        <div className="search-darkBorderBg" />
        <div className="search-darkBorderBg" />
        <div className="search-white" />
        <div className="search-border" />
        <div className="search-main">
          <input 
            className={`search-input ${!hasFilter ? 'no-filter' : ''}`}
            type="text" 
            placeholder={placeholder}
            value={value}
            onChange={onChange}
          />
          {hasFilter && (
            <>
              <div className="search-pink-mask" />
              <div className="search-filterBorder" />
              <div 
                className={`search-filter-icon ${showFilterActive ? 'active' : ''}`}
                onClick={onFilterClick}
                style={{ cursor: 'pointer' }}
                title={'Búsqueda avanzada'}
              >
                <AnimatedIcons.Filter />
              </div>
            </>
          )}
          <div className="search-icon">
            <AnimatedIcons.Search />
          </div>
        </div>
      </div>
    </div>
  )
}

