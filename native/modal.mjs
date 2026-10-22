/**
 * Android Dialog windows themselves cause AppState blur. Present our game
 * overlays in the same activity, otherwise opening Pause can lock out Resume
 * and opening a result can silence its fanfare. iOS retains the native Modal.
 * React.createElement and native primitives are injected for boundary tests.
 */
export function createGameModal({ createElement, View, Modal, platform }) {
  return function GameModal({ visible, children, ...nativeProps }) {
    if (platform !== 'android') return createElement(Modal, { ...nativeProps, visible }, children);
    if (!visible) return null;
    return createElement(View, {
      style: { position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:1000 },
      pointerEvents: 'auto',
      accessibilityViewIsModal: true,
      importantForAccessibility: 'yes',
      onAccessibilityEscape: nativeProps.onRequestClose,
      testID: 'game-modal-overlay',
    }, children);
  };
}
