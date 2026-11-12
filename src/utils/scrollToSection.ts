// Smooth-scroll to a section, then correct the position once the scroll settles.
// Lazy images above the target can load mid-scroll and push it down, which would
// otherwise leave the page stopped short of the section.
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth' });

  let attempts = 0;
  const settle = () => {
    const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const offset = el.getBoundingClientRect().top - marginTop;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (Math.abs(offset) > 4 && !atBottom && attempts++ < 3) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.setTimeout(settle, 700);
    }
  };
  window.setTimeout(settle, 700);
}
