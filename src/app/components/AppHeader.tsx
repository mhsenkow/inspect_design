"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const AppHeader = (): React.JSX.Element => {
  const [origin, setOrigin] = useState<string>();
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <div id="header">
      <div
        style={{ textAlign: "center" }}
        className="pointer"
        onClick={() => open(origin, "_self")}
      >
        <span style={{ fontSize: "48px" }}>🔍</span> <br />
        <strong>INSPECT</strong>
      </div>
      <div>
        <div style={{ textAlign: "center" }}>
          {/* <a
              href="https://apps.apple.com/us/app/datagotchi-inspect/id1644978686?itsct=apps_box_badge&amp;itscg=30200"
              style={{
                display: "inline-block",
                overflow: "hidden",
                borderRadius: "13px",
                width: "250px",
                height: "83px",
              }}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1674518400"
                alt="Download on the App Store"
                style={{ borderRadius: "13px", width: "250px", height: "83px" }}
              />
            </a> */}
          <p style={{ textAlign: "center" }}>
            <a
              rel="noreferrer"
              target="_blank"
              href="https://www.patreon.com/datagotchi?utm_content=site_sidebar_widget&amp;utm_medium=patron_button_and_widgets_plugin&amp;utm_campaign=8811697&amp;utm_term=&amp;utm_source=https://datagotchi.net/"
              aria-label="Click to become a patron at Patreon!"
            >
              <Image
                style={{
                  marginTop: "10px",
                  marginBottom: "10px",
                  maxWidth: "200px",
                  position: "static",
                }}
                width={200}
                height={66}
                src="/images/PatronButton.png"
                alt="Become a patron at Patreon!"
              />
            </a>
          </p>
          <p style={{ color: "var(--color-text-muted)" }}>
            {/* Download the app to receive mobile notifications and share
              articles with your connections! */}
            Help me incubate Inspect and other DG projects to empower people
            with information!
          </p>
          {/* <p style={{ color: "green" }}>
              {registered
                ? `Thank you for registering! Now you will be able to interact with facts like the one below.`
                : ""}
            </p> */}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <strong>by</strong> <br />
        <a href="https://datagotchi.net" target="_blank" rel="noreferrer">
          <Image
            src="/images/Color1.png"
            width="100"
            height="100"
            alt="Datagotchi Labs logo"
          />
        </a>
      </div>
    </div>
  );
};

export default AppHeader;
