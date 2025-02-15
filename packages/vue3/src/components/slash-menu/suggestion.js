import IsleEditorSlash from "./slash-menu";
import { VueRenderer } from "@/utils/render";
import { createTippy } from "@/utils/tippy";

export function createSlashSuggestion(options) {
  return {
    suggestion: {
      char: "/",
      command: ({ editor, range, props }) => {
        props.command({ editor, range });
      },
      ...createSlashSuggestionItems(),
      ...createSlashSuggestionRender(),
      ...options,
    },
  };
}

export function createSlashSuggestionItems() {
  return {
    items: ({ editor, query }) => {
      // ({ editor, query }) => {
      // const nodes = editor.extensionManager.extensions
      //   .filter((item) => item?.options?.slash)
      return [];
    },
  };
}

export function createSlashSuggestionRender(options = {}) {
  const {
    component = IsleEditorSlash,
    tippyOptions = {},
    handleKeyDown,
  } = options;

  return {
    render: () => {
      let renderer;
      let popup;

      return {
        onStart: (props) => {
          const { selection } = props.editor.state;
          const parentNode = selection.$from.node(selection.$from.depth);

          if (parentNode.type.name === "codeBlock") {
            return false;
          }

          renderer = new VueRenderer(component, {
            props,
            editor: props.editor,
          });

          popup = createTippy("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: renderer.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
            hideOnClick: true,
            ...tippyOptions,
          });
        },

        onUpdate: (props) => {
          renderer?.updateProps(props);
          popup &&
            popup?.[0].setProps({
              getReferenceClientRect: props.clientRect,
            });
        },

        onKeyDown: (props) => {
          if (handleKeyDown) {
            return handleKeyDown(props, { popup, renderer });
          }

          // 默认键盘处理逻辑
          if (props.event.key === "Escape") {
            popup?.[0].hide();
            return true;
          }

          if (props.event.key === "Enter") {
            popup?.[0].hide();
          }

          return renderer.ref?.onKeyDown && renderer.ref?.onKeyDown(props);
        },

        onExit: () => {
          popup?.[0].destroy();
          renderer?.destroy();
        },
      };
    },
  };
}
