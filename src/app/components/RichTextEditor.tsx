import Image from "next/image";
import React, { useEffect, useRef } from "react";
import parse from "html-react-parser";

import InsertLinkDialog from "./InsertLinkDialog";
import { INSERT_LINK_DIALOG_ID } from "../constants";
import styles from "../../styles/components/rich-text-editor.module.css";

interface Props {
  html: string;
  setHtml: React.Dispatch<React.SetStateAction<string>>;
}

const RichTextEditor = ({ html, setHtml }: Props) => {
  const editableDiv = useRef<HTMLDivElement>(null);
  const cursor = useRef<{ node?: Node; offset: number }>({
    offset: 0,
  });

  const insertLink = () => {
    const dialog = document.getElementById(
      INSERT_LINK_DIALOG_ID,
    ) as HTMLDialogElement;
    if (dialog) {
      dialog.showModal();
    }
  };

  const getCaretPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return { node: range.startContainer, offset: range.startOffset };
    }
    return { node: document.createTextNode(""), offset: 0 };
  };

  const restoreCaretPosition = (node: Node, start: number) => {
    const range = document.createRange();
    range.setStart(node, Math.min(start, node.textContent?.length || 0));
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      if (document.body.contains(node)) {
        selection.addRange(range);
      } else {
        cursor.current = { offset: 0 };
      }
    }
  };

  useEffect(() => {
    if (cursor.current.node) {
      restoreCaretPosition(cursor.current.node, cursor.current.offset);
    }
  }, [html]);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => insertLink()}
          className={styles.toolbarButton}
          aria-label="Insert link"
          title="Insert link"
        >
          <Image
            src="/images/link-icon.png"
            alt=""
            width={14}
            height={14}
            className={styles.toolbarButtonImage}
          />
        </button>
      </div>

      <div
        ref={editableDiv}
        contentEditable={true}
        role="textbox"
        aria-label="Comment Text Div"
        suppressContentEditableWarning={true}
        className={styles.editor}
        onInput={(event) => {
          cursor.current = getCaretPosition();
          const newHtml = (event.target as HTMLDivElement).innerHTML.replace(
            "<br>",
            "",
          );
          setHtml(newHtml);
        }}
      >
        {parse(html)}
      </div>

      <InsertLinkDialog html={html} setHtml={setHtml} />
    </div>
  );
};

export default RichTextEditor;
