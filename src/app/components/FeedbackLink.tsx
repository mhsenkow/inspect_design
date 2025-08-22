"use client";

import React from "react";

const FeedbackLink = ({
  actionVerb,
  icon,
  setOnClickFunction,
}: {
  actionVerb: string;
  icon: string;
  setOnClickFunction: () => void;
}): React.JSX.Element => {
  return (
    <div>
      <a className="pointer" onClick={() => setOnClickFunction()}>
        {icon} {actionVerb}
      </a>
    </div>
  );
};

export default FeedbackLink;
