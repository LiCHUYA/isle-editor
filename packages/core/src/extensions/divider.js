import { mergeAttributes, Node, nodeInputRule } from "@tiptap/core";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { prefixClass } from "../utils/prefix.js";

const source = {
  slash: true,
  name: "divider",
  desc: "---",
  command: ({ editor, range }) => {
    range
      ? editor.chain().focus().deleteRange(range).setDivider().run()
      : editor.commands.setDivider();
  },
  isActive: ({ editor }) => editor.isActive("divider"),
  HTMLAttributes: {
    class: `${prefixClass}__divider`,
  },
};

export default Node.create({
  name: "divider",

  addOptions() {
    return {
      HTMLAttributes: {},
      ...source,
    };
  },

  group: "block",

  parseHTML() {
    return [{ tag: "hr" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["hr", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setDivider:
        () =>
        ({ chain, state }) => {
          const { $to: $originTo } = state.selection;

          const currentChain = chain();

          if ($originTo.parentOffset === 0) {
            currentChain.insertContentAt(Math.max($originTo.pos - 2, 0), {
              type: this.name,
            });
          } else {
            currentChain.insertContent({ type: this.name });
          }

          return (
            currentChain
              // set cursor after horizontal rule
              .command(({ tr, dispatch }) => {
                if (dispatch) {
                  const { $to } = tr.selection;
                  const posAfter = $to.end();

                  if ($to.nodeAfter) {
                    if ($to.nodeAfter.isTextblock) {
                      tr.setSelection(
                        TextSelection.create(tr.doc, $to.pos + 1),
                      );
                    } else if ($to.nodeAfter.isBlock) {
                      tr.setSelection(NodeSelection.create(tr.doc, $to.pos));
                    } else {
                      tr.setSelection(TextSelection.create(tr.doc, $to.pos));
                    }
                  } else {
                    // add node after horizontal rule if it’s the end of the document
                    const node =
                      $to.parent.type.contentMatch.defaultType?.create();

                    if (node) {
                      tr.insert(posAfter, node);
                      tr.setSelection(
                        TextSelection.create(tr.doc, posAfter + 1),
                      );
                    }
                  }

                  tr.scrollIntoView();
                }

                return true;
              })
              .run()
          );
        },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /^(?:---|—-|___\s|\*\*\*\s)$/,
        type: this.type,
      }),
    ];
  },
});
