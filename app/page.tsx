'use client';

import { ReactFlowProvider } from '@xyflow/react';
import React from 'react';
import LayoutFlow from './LayoutFlow';

export default function Page() {
  
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}
