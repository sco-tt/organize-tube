// Mock Tauri API for web development
export const invoke = async (command: string, args?: any): Promise<any> => {
  console.log('Mock Tauri invoke:', command, args);

  switch (command) {
    default:
      throw new Error(`Mock: Unknown Tauri command: ${command}`);
  }
};