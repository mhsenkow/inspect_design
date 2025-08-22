import Image from "next/image";
import React, { useCallback, useEffect, useRef } from "react";
import parse from "html-react-parser";

import InsertLinkDialog from "./InsertLinkDialog";

interface Props {
  html: string;
  setHtml: React.Dispatch<React.SetStateAction<string>>;
}

const RichTextEditor = ({ html, setHtml }: Props) => {
  const editableDiv = useRef<HTMLDivElement>(null);
  const cursor = useRef<{ node?: Node; offset: number }>({
    offset: 0,
  });

  const nodeIsIncluded = useCallback((nodes: Node[], node: Node) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] == node) {
        return true;
      }
      if (nodes[i].nodeType == Node.ELEMENT_NODE) {
        const childNodes = (nodes[i] as Element).childNodes;
        if (nodeIsIncluded(Array.from(childNodes), node)) {
          return true;
        }
      }
    }
    return false;
  }, []);

  const insertLink = () => {
    const dialog = document.getElementById(
      "insertLinkDialog",
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
    <div>
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          justifyContent: "center",
        }}
        className="rich-text-editor-toolbar"
      >
        <button
          onClick={() => insertLink()}
          style={{ width: "30px", height: "30px", position: "relative" }}
        >
          <Image
            src="/images/link-icon.png"
            alt="Insert Link"
            width={20}
            height={20}
            // TODO: get a better image that doesn't need to be resized
            style={{
              margin: "-3px 0 0 -3px",
            }}
          />
        </button>
      </div>

      <div
        ref={editableDiv}
        contentEditable={true}
        role="textbox"
        aria-label="Comment Text Div"
        suppressContentEditableWarning={true}
        style={{
          border: "1px solid black",
          height: "200px",
          width: "80%",
          margin: "0 auto 10px",
          padding: "5px",
          textAlign: "left",
        }}
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
