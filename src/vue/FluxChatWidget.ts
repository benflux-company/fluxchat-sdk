import { defineComponent, onMounted, onBeforeUnmount, watch, type PropType } from 'vue';
import { init } from '../widget/widget.js';
import type { WidgetOptions, WidgetInstance } from '../widget/types.js';

/**
 * Drop-in Vue 3 wrapper around the FluxChat embeddable widget. Mounts on
 * first render, destroys on unmount, and re-mounts whenever `options`
 * changes. Plain `.ts` (not a `.vue` SFC) so the package needs no extra
 * build step for consumers who don't use the widget this way.
 *
 * @example
 * <FluxChatWidget :options="{ apiKey: 'fc_live_xxx', assistantName: 'Léa' }" />
 */
export const FluxChatWidget = defineComponent({
  name: 'FluxChatWidget',
  props: {
    options: {
      type: Object as PropType<WidgetOptions>,
      required: true,
    },
  },
  setup(props) {
    let instance: WidgetInstance | null = null;

    const mount = () => {
      instance?.destroy();
      instance = init(props.options);
    };

    onMounted(mount);
    onBeforeUnmount(() => {
      instance?.destroy();
      instance = null;
    });

    // `target` may hold a DOM node, which doesn't stringify meaningfully —
    // excluded from the watched key since consumers who pass it rarely
    // change it at runtime.
    watch(
      () => JSON.stringify(props.options, (key, value) => (key === 'target' ? undefined : value)),
      mount,
    );

    return () => null;
  },
});

export default FluxChatWidget;
