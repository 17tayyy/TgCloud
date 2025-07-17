import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface InlineEditProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  initialValue,
  onSave,
  onCancel,
  autoFocus = true
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Usar setTimeout para asegurar que el input esté montado
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Evitar que otros handlers interfieran
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        onSave(value.trim());
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // Solo guardar si el valor cambió y no está vacío
    if (value.trim() && value.trim() !== initialValue) {
      onSave(value.trim());
    } else if (!value.trim()) {
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="bg-slate-800 border-cyber-blue text-white h-6 px-2 py-1 text-sm"
      style={{ minWidth: '120px' }}
      autoComplete="off"
      spellCheck={false}
    />
  );
};
