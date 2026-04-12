import { useState, useCallback } from 'react';
import { UseModalReturn } from '../types/modal';

export function useModal(initialState: boolean = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

// Hook for managing multiple modals
export function useModals() {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const openModal = useCallback((modalId: string) => {
    setOpenModals(prev => new Set(prev).add(modalId));
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.delete(modalId);
      return newSet;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModals(new Set());
  }, []);

  const isModalOpen = useCallback((modalId: string) => {
    return openModals.has(modalId);
  }, [openModals]);

  const toggleModal = useCallback((modalId: string) => {
    if (openModals.has(modalId)) {
      closeModal(modalId);
    } else {
      openModal(modalId);
    }
  }, [openModals, closeModal, openModal]);

  return {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    toggleModal,
    openModals: Array.from(openModals),
  };
}