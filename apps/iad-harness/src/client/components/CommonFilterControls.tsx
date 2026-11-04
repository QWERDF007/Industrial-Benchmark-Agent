import React from "react";

/**
 * Standard V51 Clear Filter SVG Icon (funnel with cross)
 */
export function ClearFilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 5h16l-6.5 7.5v4.3l-3.5 2v-6.3L4 5Z" />
      <path d="m17 17 4 4m0-4-4 4" />
    </svg>
  );
}

/**
 * Standard V51 Refresh SVG Icon (circular reload arrows)
 */
export function RefreshActionIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 11a8 8 0 0 0-14.9-3.7L3 10" />
      <path d="M3 4v6h6" />
      <path d="M4 13a8 8 0 0 0 14.9 3.7L21 14" />
      <path d="M21 20v-6h-6" />
    </svg>
  );
}

export interface ClearFilterButtonProps {
  id?: string;
  dataAttr?: string;
  dataVal?: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  ariaLabel?: string;
  className?: string;
  [key: `data-${string}`]: string | undefined;
}

/**
 * Reusable Clear Filter Icon Button (38x38px)
 * Aligns with V51 specifications across Images, Exploration, Knowledge, Consistency, and DatasetManager.
 */
export function ClearFilterButton({
  id,
  disabled = false,
  onClick,
  title = "清除筛选条件",
  ariaLabel = "清除筛选条件",
  className = "",
  ...restDataAttrs
}: ClearFilterButtonProps) {
  return (
    <button
      type="button"
      id={id}
      className={`iba-filter-clear ${className}`.trim()}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      {...restDataAttrs}
    >
      <ClearFilterIcon />
    </button>
  );
}

export interface RefreshIconButtonProps {
  id?: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  ariaLabel?: string;
  className?: string;
  [key: `data-${string}`]: string | undefined;
}

/**
 * Reusable Refresh Icon Button (38x38px)
 * Replaces ad-hoc unicode arrow symbols with standard SVG geometry.
 */
export function RefreshIconButton({
  id,
  disabled = false,
  onClick,
  title = "刷新当前页面",
  ariaLabel = "刷新当前页面",
  className = "",
  ...restDataAttrs
}: RefreshIconButtonProps) {
  return (
    <button
      type="button"
      id={id}
      className={`iba-refresh-icon ${className}`.trim()}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      {...restDataAttrs}
    >
      <RefreshActionIcon />
    </button>
  );
}
