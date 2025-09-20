import React from "react";

import { Fact, Insight, Link } from "../types";
import Image from "next/image";

const SourceLogo = ({ fact }: { fact: Fact }): React.JSX.Element => {
  // For insights, just show the cloud icon without background
  if ((fact as Insight).uid) {
    return <span style={{ fontSize: "24px" }}>💭</span>;
  }

  // For links, show the full logo with background
  return (
    <div
      style={{
        padding: "5px",
        textAlign: "center",
        border: "1px black solid",
        borderRadius: "5px",
      }}
    >
      {/* TODO: Get more logo images for sources */}
      {fact["logo_uri"] ? (
        <Image
          src={(fact as Link).logo_uri || ""}
          height="50"
          width="100"
          alt="Source logo"
        />
      ) : (
        (fact as Link).source_baseurl
      )}
    </div>
  );
};

export default SourceLogo;
