import type React from 'react';
import { Box } from '@mantine/core';
import styles from './ModalLayout.module.css';

type ModalLayoutProps = {
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function ModalLayout({ children, footer }: ModalLayoutProps) {
  return (
    <div className={styles.root}>
      <Box className={styles.content}>{children}</Box>
      <div className={styles.footer}>
        <div className={styles.footerInner}>{footer}</div>
      </div>
    </div>
  );
}

