const interactive = 'input, textarea, select, button, a, [role="button"], [role="switch"], [role="checkbox"], [contenteditable]:not([contenteditable="false"])';

export function handleEnterToAdvance(event, document) {
  if (event.key !== 'Enter' || event.repeat || event.isComposing || event.defaultPrevented ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target?.closest?.(interactive) || document.activeElement?.closest?.(interactive)) return;
  const visible = (element) => {
    if (element.closest('[aria-hidden="true"], [inert]')) return false;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.bottom <= 0 || rect.right <= 0 ||
        rect.top >= document.defaultView.innerHeight || rect.left >= document.defaultView.innerWidth) return false;
    for (let node = element; node; node = node.parentElement) {
      const style = document.defaultView.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  // An open dropdown has its own interactions; do not advance behind it.
  if ([...document.querySelectorAll('[aria-expanded="true"]')].some(visible)) return;
  const candidates = [...document.querySelectorAll('[data-enter-advance="true"]')]
    .filter(element => !element.disabled && element.getAttribute('aria-disabled') !== 'true' && visible(element));
  if (candidates.length !== 1) return;
  event.preventDefault();
  candidates[0].click();
}
