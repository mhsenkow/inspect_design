"use client";

import React, { useMemo, useState } from "react";
import moment from "moment";

import { FactComment, FactReaction, Link, User } from "../../types";

import FeedbackInputElement from "../../components/FeedbackInputElement";
import { submitComment, submitReaction } from "../../functions";
import FeedbackLink from "../../components/FeedbackLink";
import useUser from "../../hooks/useUser";
import SourceLogo from "../../components/SourceLogo";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import Comment from "../../components/Comment";

const ClientSidePage = ({
  linkInput,
  currentUser,
}: {
  linkInput: Link;
  currentUser?: User;
}): React.JSX.Element => {
  const [link, setLink] = useState(linkInput);
  const [isEditingReaction, setIsEditingReaction] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);

  const { token } = useUser();

  const createdOrUpdated = useMemo(() => {
    if (link.created_at == link.updated_at) {
      return `Created ${moment(link.created_at).fromNow()}`;
    }
    return `Updated ${moment(link.updated_at).fromNow()}`;
  }, [link.created_at, link.updated_at]);

  return (
    <div id="body">
      <CurrentUserContext.Provider value={currentUser || null}>
        <div id="source">
          <div style={{ display: "flex" }}>
            {(link.reactions &&
              link.reactions.map((r) => r.reaction).join("")) || (
              <span>😲 (no reactions)</span>
            )}
          </div>
          <div id="created_at">
            <p>{createdOrUpdated}</p>
          </div>
          <div style={{ height: "60px" }}>
            <SourceLogo fact={link} />
          </div>
        </div>
        <div
          style={{
            marginBlockStart: "0.83em",
            marginBlockEnd: "0.83em",
          }}
        >
          <p
            style={{
              width: "100%",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- because of domain filtering */}
            <img
              src={link.imageUrl || undefined}
              alt="link image"
              style={{ maxWidth: "800px", width: "100%" }}
              // fill={true}
            />
          </p>
          <h2 id="title" style={{ margin: "0px" }}>
            <a href={link.url} target="_blank" rel="noreferrer" id="titleLink">
              {link.title}
            </a>
          </h2>
        </div>
        {currentUser && isEditingReaction && (
          <FeedbackInputElement
            actionType="reaction"
            submitFunc={(reaction) => {
              if (token) {
                return submitReaction({ reaction, summary_id: link.id }, token);
              }
              return Promise.resolve();
            }}
            directions="Select an emoji character"
            afterSubmit={(newObject) => {
              if (newObject) {
                if (!link.reactions) {
                  link.reactions = [];
                }
                setLink({
                  ...link,
                  reactions: [...link.reactions, newObject as FactReaction],
                });
              }
            }}
            closeFunc={() => setIsEditingReaction(false)}
          />
        )}
        {currentUser && isEditingComment && (
          <FeedbackInputElement
            actionType="comment"
            submitFunc={(comment) => {
              if (token) {
                return submitComment({ comment, summary_id: link.id }, token);
              }
              return Promise.resolve();
            }}
            directions="Enter a text comment"
            afterSubmit={(newObject) => {
              if (newObject) {
                if (!link.comments) {
                  link.comments = [];
                }
                setLink({
                  ...link,
                  comments: [
                    ...link.comments,
                    {
                      ...newObject,
                      // avatar_uri: currentUser.avatar_uri,
                    } as FactComment,
                  ],
                });
              }
            }}
            closeFunc={() => setIsEditingComment(false)}
          />
        )}
        {currentUser && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
              width: "100%",
              margin: "10px",
            }}
          >
            <FeedbackLink
              actionVerb="React"
              icon="😲"
              setOnClickFunction={() => {
                setIsEditingReaction(true);
                setIsEditingComment(false);
              }}
            />
            <FeedbackLink
              actionVerb="Comment"
              icon="💬"
              setOnClickFunction={() => {
                setIsEditingReaction(false);
                setIsEditingComment(true);
              }}
            />
          </div>
        )}
        <div className="comments">
          {link.comments &&
            link.comments.map((comment) => (
              // <div
              //   className="comment"
              //   key={`Comment #${comment.id}`}
              //   data-id={comment.id}
              // >
              //   {comment.user?.username}
              //   <div
              //     style={{
              //       float: "right",
              //       display: "flex",
              //       flexDirection: "column",
              //     }}
              //   >
              //     {currentUser && (
              //       <>
              //         {currentUser.id == Number(comment.user_id) && (
              //           <button
              //             style={{ width: "32px", height: "30px" }}
              //             aria-label="Delete Comment"
              //             onClick={async () => {
              //               if (token && confirm("Are you sure?")) {
              //                 const worked = await deleteComment(
              //                   { id: comment.id },
              //                   token,
              //                 );
              //                 if (worked) {
              //                   if (!link.comments) {
              //                     link.comments = [];
              //                   }
              //                   setLink({
              //                     ...link,
              //                     comments: link.comments.filter(
              //                       (c) => c.id !== comment.id,
              //                     ),
              //                   });
              //                 }
              //               }
              //             }}
              //           >
              //             {TRASH_ICON}
              //           </button>
              //         )}
              //       </>
              //     )}
              //   </div>
              //   <div className="commenttext">
              //     {comment.comment && parse(comment.comment)}
              //   </div>
              // </div>
              <Comment
                key={`Link Comment #${comment.id}`}
                comment={comment}
                removeCommentFunc={(id) => {
                  setLink({
                    ...link,
                    comments: link.comments?.filter((c) => c.id !== id) ?? [],
                  });
                }}
              />
            ))}
        </div>
      </CurrentUserContext.Provider>
    </div>
  );
};

export default ClientSidePage;
