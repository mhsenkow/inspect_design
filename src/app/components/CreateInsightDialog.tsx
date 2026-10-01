"use client";

import React, { useCallback, useEffect, useState } from "react";

import {
  Modal,
  ModalBody,
  ModalFooter,
  FormGroup,
  FormLabel,
  FormInput,
  ModalButton,
} from "../components/Modal";

const CreateInsightDialog = ({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}): React.JSX.Element => {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setTitle("");
    setError("");
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give your insight a title");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onCreate(trimmed);
      setTitle("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create insight.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [title, onCreate, onClose]);

  return (
    <Modal
      id="create-insight-dialog"
      title="Create new insight"
      isOpen={isOpen}
      onClose={handleClose}
      size="small"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <ModalBody>
        <FormGroup>
          <FormLabel htmlFor="create-insight-title">Title</FormLabel>
          <FormInput
            id="create-insight-title"
            type="text"
            placeholder="What are you inspecting?"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            error={error}
            autoComplete="off"
            disabled={isSubmitting}
          />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <ModalButton
          variant="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </ModalButton>
        <ModalButton
          variant="primary"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? "Creating…" : "Create"}
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default CreateInsightDialog;
