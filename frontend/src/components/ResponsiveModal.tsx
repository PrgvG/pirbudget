import { Drawer, Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

type ResponsiveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 48em)');

  if (isDesktop) {
    return (
      <Modal
        opened={isOpen}
        onClose={onClose}
        title={title}
        size="md"
        centered
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
      >
        {children}
      </Modal>
    );
  }

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title={title}
      position="bottom"
      size="auto"
      overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
      styles={{
        content: {
          maxHeight: '90vh',
          borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0',
        },
      }}
    >
      {children}
    </Drawer>
  );
}
