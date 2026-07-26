import { Search, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

type ListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  filterLabel: string;
  hasActiveFilters?: boolean;
  children?: ReactNode;
};

export function ListToolbar({
  search,
  onSearchChange,
  placeholder,
  filterLabel,
  hasActiveFilters = false,
  children,
}: ListToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <InputGroup mobileLarge className="flex-1">
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            mobileLarge
          />
        </InputGroup>

        <Button type="submit" size="icon" title="Cari">
          <Search className="size-4" />
        </Button>

        {children && (
          <Button
            type="button"
            variant={showFilters || hasActiveFilters ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            title={filterLabel}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        )}
      </div>

      {showFilters && children && (
        <div className="flex flex-col gap-4 pt-4 mt-4 border-t border-border/60">
          {children}
        </div>
      )}
    </>
  );
}
