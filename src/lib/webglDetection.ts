/**
 * WebGL Detection Utility for Growth OS & 3D Visualizers
 * Checks if WebGL/WebGL2 is available and supported in the current environment
 * (handles disabled GPU hardware acceleration, iframe sandboxes, and headless containers).
 */

let cachedSupport: boolean | null = null;

export function isWebGLAvailable(): boolean {
  if (cachedSupport !== null) {
    return cachedSupport;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cachedSupport = false;
    return false;
  }

  try {
    if (!window.WebGLRenderingContext) {
      cachedSupport = false;
      return false;
    }

    const canvas = document.createElement('canvas');
    // Test context creation with silent error handling
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl) {
      cachedSupport = false;
      return false;
    }

    // Ensure context has valid methods
    const isValid = typeof (gl as WebGLRenderingContext).getParameter === 'function';
    
    // Clean up context to release GPU resources
    if (gl && 'getExtension' in gl) {
      const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
      if (ext) {
        ext.loseContext();
      }
    }

    cachedSupport = isValid;
    return isValid;
  } catch {
    cachedSupport = false;
    return false;
  }
}

/**
 * Resets the cached support status (useful if user re-enables hardware acceleration)
 */
export function resetWebGLCache(): void {
  cachedSupport = null;
}
