import { useEffect, useRef } from 'react';
import { init } from '../widget/widget.js';
import type { WidgetOptions, WidgetInstance } from '../widget/types.js';

export type FluxChatWidgetProps = WidgetOptions;

/**
 * Drop-in React wrapper around the FluxChat embeddable widget. Mounts on
 * first render, destroys on unmount, and re-mounts whenever the options
 * change (cheap: the widget itself is a small floating bubble + panel).
 *
 * @example
 * <FluxChatWidget apiKey="fc_live_xxx" assistantName="Léa" />
 */
export function FluxChatWidget(props: FluxChatWidgetProps) {
  const instanceRef = useRef<WidgetInstance | null>(null);
  // `target` may hold a DOM node, which isn't serializable — excluded from
  // the dependency key since consumers who pass it rarely change it at runtime.
  const depsKey = JSON.stringify(props, (key, value) => (key === 'target' ? undefined : value));

  useEffect(() => {
    instanceRef.current = init(props);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  return null;
}

export default FluxChatWidget;
