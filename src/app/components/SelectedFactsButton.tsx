import React from "react";

const SelectedFactsButton = ({
  classNames,
  text,
  handleOnClick,
}: {
  classNames: string;
  text: string;
  handleOnClick: () => void;
}): React.JSX.Element => {
  return (
    <button
      className={classNames}
      onClick={() => handleOnClick()}
      aria-label={text}
    >
      {text}
    </button>
  );
};

export default SelectedFactsButton;
