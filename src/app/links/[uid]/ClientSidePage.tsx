"use client";

import React, { useMemo, useState } from "react";
import moment from "moment";
import Image from "next/image";
import cardStyles from "../../../styles/components/card.module.css";

import { FactComment, FactReaction, Link, User } from "../../types";

import FeedbackInputElement from "../../components/FeedbackInputElement";
import { submitComment, submitReaction } from "../../functions";
import ReactionIcon from "../../components/ReactionIcon";
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
  const [isEditingComment, setIsEditingComment] = useState(false);

  const { token } = useUser();

  const createdOrUpdated = useMemo(() => {
    if (link.created_at == link.updated_at) {
      return `Created ${moment(link.created_at).fromNow()}`;
    }
    return `Updated ${moment(link.updated_at).fromNow()}`;
  }, [link.created_at, link.updated_at]);

  return (
    <div className={cardStyles.linkPagePaper}>
      <CurrentUserContext.Provider value={currentUser || null}>
        <div className={cardStyles.linkPageCard}>
          {/* Link Header Section */}
          <div className={cardStyles.linkHeaderSection}>
            <div className={cardStyles.linkHeaderContainer}>
              <div className={cardStyles.linkSourceLogoContainer}>
                <SourceLogo fact={link} />
                <ReactionIcon
                  reactions={link.reactions || []}
                  currentUserId={currentUser?.id}
                  onReactionSubmit={async (reaction) => {
                    if (token) {
                      const result = await submitReaction(
                        { reaction, summary_id: link.id },
                        token,
                      );
                      if (result) {
                        const existingReactions =
                          link.reactions?.filter(
                            (r) => r.user_id !== result.user_id,
                          ) || [];
                        setLink({
                          ...link,
                          reactions: [
                            ...existingReactions,
                            result as FactReaction,
                          ],
                        });
                      }
                    }
                  }}
                  className="header-item-reaction-icon reaction-icon-solid"
                />
              </div>
              <div className={cardStyles.linkTitleContainer}>
                <h1 className={cardStyles.linkMainTitle}>
                  <span className={cardStyles.linkIcon}>🔗</span>
                  {link.title}
                </h1>
                <div className={cardStyles.linkMetadata}>
                  <span className={cardStyles.linkTimestamp}>
                    {createdOrUpdated}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Link Visit Section */}
          <div className={cardStyles.linkVisitSection}>
            <div className={cardStyles.linkActions}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className={cardStyles.linkVisitButton}
              >
                Visit Link →
              </a>
            </div>
          </div>

          {/* Link Content Section */}
          <div className={cardStyles.linkContentSection}>
            {link.imageUrl && (
              <div className={cardStyles.linkImageContainer}>
                <Image
                  src={link.imageUrl}
                  alt="Link preview"
                  className={cardStyles.linkImage}
                  width={300}
                  height={200}
                />
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div className={cardStyles.linkFeedbackSection}>
            <div className={cardStyles.linkFeedbackHeader}>
              <div className={cardStyles.hierarchyIndicator}>
                <span className={cardStyles.hierarchyIcon}>💬</span>
                Feedback
              </div>
            </div>

            <div className={cardStyles.linkFeedbackContent}>
              {/* Comment Input */}
              {currentUser && isEditingComment && (
                <div className={cardStyles.linkCommentInput}>
                  <FeedbackInputElement
                    actionType="comment"
                    submitFunc={(comment) => {
                      if (token) {
                        return submitComment(
                          { comment, summary_id: link.id },
                          token,
                        );
                      }
                      return Promise.resolve();
                    }}
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
                            } as FactComment,
                          ],
                        });
                      }
                    }}
                    closeFunc={() => setIsEditingComment(false)}
                  />
                </div>
              )}

              {/* Comments List */}
              <div className={cardStyles.linkCommentsList}>
                {link.comments && link.comments.length > 0 ? (
                  link.comments.map((comment) => (
                    <Comment
                      key={`Link Comment #${comment.id}`}
                      comment={comment}
                      removeCommentFunc={(id) => {
                        setLink({
                          ...link,
                          comments:
                            link.comments?.filter((c) => c.id !== id) ?? [],
                        });
                      }}
                    />
                  ))
                ) : (
                  <div className={cardStyles.linkNoComments}>
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>

              {/* Add Comment Button */}
              {currentUser && !isEditingComment && (
                <div className={cardStyles.linkAddCommentSection}>
                  <button
                    onClick={() => setIsEditingComment(true)}
                    className={cardStyles.linkAddCommentButton}
                  >
                    <span className={cardStyles.addButtonIcon}>💬</span>
                    <span className={cardStyles.addButtonText}>
                      Add Comment
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CurrentUserContext.Provider>
    </div>
  );
};

export default ClientSidePage;
