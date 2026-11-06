import { useEffect, useRef, useState } from 'react';

export default function RevealCard({ as: Element = 'article', className = '', children, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(node);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <Element ref={ref} className={`${className} reveal-card${visible ? ' is-visible' : ''}`} {...props}>{children}</Element>;
}
